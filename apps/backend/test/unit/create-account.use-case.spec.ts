import { CreateAccountUseCase } from '../../src/application/account/use-cases/create-account.use-case';
import { IAccountRepository } from '../../src/domain/account/ports/account.repository.port';
import { IUserRepository } from '../../src/domain/user/ports/user.repository.port';
import { IKycRepository } from '../../src/domain/identity/ports/kyc.repository.port';
import { INibssIdentityGateway } from '../../src/domain/identity/ports/nibss-identity.port';
import { ITransactionRepository } from '../../src/domain/transaction/ports/transaction.repository.port';
import { UserEntity } from '../../src/domain/user/entities/user.entity';
import { AccountEntity } from '../../src/domain/account/entities/account.entity';
import { ConflictException, BadRequestException } from '@nestjs/common';

describe('CreateAccountUseCase (Application)', () => {
  let useCase: CreateAccountUseCase;
  let mockAccountRepo: jest.Mocked<IAccountRepository>;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockKycRepo: jest.Mocked<IKycRepository>;
  let mockNibssGateway: jest.Mocked<INibssIdentityGateway>;
  let mockTxRepo: jest.Mocked<ITransactionRepository>;

  beforeEach(() => {
    mockAccountRepo = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByAccountNumber: jest.fn(),
      save: jest.fn().mockImplementation((acc) => Promise.resolve(acc)),
      updateBalance: jest.fn(),
      findAll: jest.fn(),
    };

    mockUserRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByBvnOrNin: jest.fn(),
      save: jest.fn().mockImplementation((u) => Promise.resolve(u)),
      findAll: jest.fn(),
    };

    mockKycRepo = {
      findById: jest.fn(),
      findByIdNumber: jest.fn(),
      findByUserId: jest.fn(),
      save: jest.fn().mockImplementation((k) => Promise.resolve(k)),
    };

    mockNibssGateway = {
      insertBvn: jest.fn(),
      insertNin: jest.fn(),
      validateBvn: jest.fn(),
      validateNin: jest.fn(),
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

    useCase = new CreateAccountUseCase(
      mockAccountRepo,
      mockUserRepo,
      mockKycRepo,
      mockNibssGateway,
      mockTxRepo,
    );
  });

  it('should enforce max 1 account per customer rule', async () => {
    const existingUser = new UserEntity({
      id: 'usr-1',
      email: 'customer@example.com',
      passwordHash: 'hash',
      role: 'CUSTOMER',
      firstName: 'Test',
      lastName: 'User',
      phone: '08012345678',
      kycVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    mockUserRepo.findById.mockResolvedValue(existingUser);
    mockAccountRepo.findByUserId.mockResolvedValue(
      new AccountEntity({
        id: 'acc-existing',
        userId: 'usr-1',
        accountNumber: '2601112233',
        bankCode: '260',
        bankName: 'PHC Bank',
        balance: 15000,
        currency: 'NGN',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );

    await expect(
      useCase.execute(
        {
          kycType: 'BVN',
          kycID: '10840712847',
          dob: '2005-04-04',
        },
        'usr-1',
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('should reject account creation if BVN validation fails with NIBSS', async () => {
    const user = new UserEntity({
      id: 'usr-2',
      email: 'customer2@example.com',
      passwordHash: 'hash',
      role: 'CUSTOMER',
      firstName: 'Invalid',
      lastName: 'KYC',
      phone: '08012345678',
      kycVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    mockUserRepo.findById.mockResolvedValue(user);
    mockAccountRepo.findByUserId.mockResolvedValue(null);
    mockNibssGateway.validateBvn.mockResolvedValue({
      valid: false,
      identifier: '00000000000',
    });

    await expect(
      useCase.execute(
        {
          kycType: 'BVN',
          kycID: '00000000000',
          dob: '2005-04-04',
        },
        'usr-2',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should successfully create account and pre-fund with ₦15,000 upon successful KYC', async () => {
    const user = new UserEntity({
      id: 'usr-3',
      email: 'valid@example.com',
      passwordHash: 'hash',
      role: 'CUSTOMER',
      firstName: 'Valid',
      lastName: 'Customer',
      phone: '08012345678',
      kycVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    mockUserRepo.findById.mockResolvedValue(user);
    mockAccountRepo.findByUserId.mockResolvedValue(null);
    mockAccountRepo.findByAccountNumber.mockResolvedValue(null);
    mockNibssGateway.validateBvn.mockResolvedValue({
      valid: true,
      identifier: '10840712847',
      firstName: 'Valid',
      lastName: 'Customer',
      dob: '2005-04-04',
    });

    const result = await useCase.execute(
      {
        kycType: 'BVN',
        kycID: '10840712847',
        dob: '2005-04-04',
      },
      'usr-3',
    );

    expect(result.message).toBe('Account created successfully');
    expect(result.balance).toBe(15000);
    expect(result.accountNumber).toMatch(/^260\d{7}$/);
    expect(mockTxRepo.save).toHaveBeenCalledTimes(1);
  });
});
