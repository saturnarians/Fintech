import { TransferUseCase } from '../../src/application/transaction/use-cases/transfer.use-case';
import { IAccountRepository } from '../../src/domain/account/ports/account.repository.port';
import { IUserRepository } from '../../src/domain/user/ports/user.repository.port';
import { ITransactionRepository } from '../../src/domain/transaction/ports/transaction.repository.port';
import { INibssTransferGateway } from '../../src/domain/transaction/ports/nibss-transfer.port';
import { AccountEntity } from '../../src/domain/account/entities/account.entity';
import { UserEntity } from '../../src/domain/user/entities/user.entity';
import { BadRequestException } from '@nestjs/common';

describe('TransferUseCase (Application)', () => {
  let useCase: TransferUseCase;
  let mockAccountRepo: jest.Mocked<IAccountRepository>;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockTxRepo: jest.Mocked<ITransactionRepository>;
  let mockNibssGateway: jest.Mocked<INibssTransferGateway>;

  const senderUser = new UserEntity({
    id: 'usr-sender',
    email: 'sender@example.com',
    passwordHash: 'hash',
    role: 'CUSTOMER',
    firstName: 'Sender',
    lastName: 'Customer',
    phone: '08011111111',
    kycVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const recipientUser = new UserEntity({
    id: 'usr-recipient',
    email: 'recipient@example.com',
    passwordHash: 'hash',
    role: 'CUSTOMER',
    firstName: 'Recipient',
    lastName: 'Customer',
    phone: '08022222222',
    kycVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  beforeEach(() => {
    mockAccountRepo = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByAccountNumber: jest.fn(),
      save: jest.fn().mockImplementation((acc) => Promise.resolve(acc)),
      updateBalance: jest.fn().mockResolvedValue(undefined),
      findAll: jest.fn(),
    };

    mockUserRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByBvnOrNin: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
    };

    mockTxRepo = {
      findById: jest.fn(),
      findByReference: jest.fn(),
      findByExternalId: jest.fn(),
      findByAccountNumber: jest.fn(),
      save: jest.fn().mockImplementation((tx) => Promise.resolve(tx)),
      update: jest.fn(),
      findAll: jest.fn(),
    };

    mockNibssGateway = {
      nameEnquiry: jest.fn(),
      transfer: jest.fn(),
      queryStatus: jest.fn(),
    };

    useCase = new TransferUseCase(
      mockAccountRepo,
      mockUserRepo,
      mockTxRepo,
      mockNibssGateway,
    );
  });

  it('should reject transfer when sender has insufficient balance', async () => {
    const senderAccount = new AccountEntity({
      id: 'acc-sender',
      userId: 'usr-sender',
      accountNumber: '2601111111',
      bankCode: '260',
      bankName: 'PHC Bank',
      balance: 5000,
      currency: 'NGN',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    mockAccountRepo.findByUserId.mockResolvedValue(senderAccount);

    await expect(
      useCase.execute(
        {
          to: '2602222222',
          amount: 10000, // exceeds 5000
          recipientBankCode: '260',
        },
        senderUser,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject transfer to sender\'s own account', async () => {
    const senderAccount = new AccountEntity({
      id: 'acc-sender',
      userId: 'usr-sender',
      accountNumber: '2601111111',
      bankCode: '260',
      bankName: 'PHC Bank',
      balance: 15000,
      currency: 'NGN',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    mockAccountRepo.findByUserId.mockResolvedValue(senderAccount);

    await expect(
      useCase.execute(
        {
          to: '2601111111', // same account
          amount: 5000,
          recipientBankCode: '260',
        },
        senderUser,
      ),
    ).rejects.toThrow('Cannot transfer funds to the same account.');
  });

  it('should execute intra-bank transfer and update ledger balances atomically', async () => {
    const senderAccount = new AccountEntity({
      id: 'acc-sender',
      userId: 'usr-sender',
      accountNumber: '2601111111',
      bankCode: '260',
      bankName: 'PHC Bank',
      balance: 15000,
      currency: 'NGN',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const recipientAccount = new AccountEntity({
      id: 'acc-recipient',
      userId: 'usr-recipient',
      accountNumber: '2602222222',
      bankCode: '260',
      bankName: 'PHC Bank',
      balance: 15000,
      currency: 'NGN',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    mockAccountRepo.findByUserId.mockResolvedValue(senderAccount);
    mockAccountRepo.findByAccountNumber.mockResolvedValue(recipientAccount);
    mockUserRepo.findById.mockResolvedValue(recipientUser);

    const result = await useCase.execute(
      {
        to: '2602222222',
        amount: 5000,
        recipientBankCode: '260',
        narration: 'Lunch money',
      },
      senderUser,
    );

    expect(result.message).toBe('Transfer successful');
    expect(result.type).toBe('INTRA_BANK');
    expect(result.newBalance).toBe(10000); // 15000 - 5000
    expect(senderAccount.balance).toBe(10000);
    expect(recipientAccount.balance).toBe(20000); // 15000 + 5000
    expect(mockAccountRepo.updateBalance).toHaveBeenCalledWith('2601111111', 10000);
    expect(mockAccountRepo.updateBalance).toHaveBeenCalledWith('2602222222', 20000);
    expect(mockTxRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should route inter-bank transfer through NIBSS gateway when recipient is external', async () => {
    const senderAccount = new AccountEntity({
      id: 'acc-sender',
      userId: 'usr-sender',
      accountNumber: '2601111111',
      bankCode: '260',
      bankName: 'PHC Bank',
      balance: 15000,
      currency: 'NGN',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    mockAccountRepo.findByUserId.mockResolvedValue(senderAccount);
    mockAccountRepo.findByAccountNumber.mockResolvedValue(null); // External account

    mockNibssGateway.nameEnquiry.mockResolvedValue({
      accountNumber: '1087207670',
      accountName: 'John Oloruntobi',
      bankName: 'KAC Bank',
    });

    mockNibssGateway.transfer.mockResolvedValue({
      message: 'Transfer successful',
      transactionId: 'TX1776340463722',
      amount: 4000,
      from: '2601111111',
      to: '1087207670',
      status: 'SUCCESS',
    });

    const result = await useCase.execute(
      {
        to: '1087207670',
        amount: 4000,
        recipientBankCode: '108',
      },
      senderUser,
    );

    expect(result.type).toBe('INTER_BANK');
    expect(result.externalTransactionId).toBe('TX1776340463722');
    expect(result.newBalance).toBe(11000);
    expect(mockNibssGateway.transfer).toHaveBeenCalledWith({
      from: '2601111111',
      to: '1087207670',
      amount: 4000,
    });
  });
});
