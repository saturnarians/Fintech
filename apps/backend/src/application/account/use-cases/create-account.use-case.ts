import { Injectable, Inject, BadRequestException, ConflictException } from '@nestjs/common';
import { CreateAccountDto } from '../dtos/account.dto';
import { IAccountRepository, ACCOUNT_REPOSITORY_TOKEN } from '../../../domain/account/ports/account.repository.port';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../../domain/user/ports/user.repository.port';
import { IKycRepository, KYC_REPOSITORY_TOKEN } from '../../../domain/identity/ports/kyc.repository.port';
import { INibssIdentityGateway, NIBSS_IDENTITY_GATEWAY_TOKEN } from '../../../domain/identity/ports/nibss-identity.port';
import { ITransactionRepository, TRANSACTION_REPOSITORY_TOKEN } from '../../../domain/transaction/ports/transaction.repository.port';
import { AccountEntity } from '../../../domain/account/entities/account.entity';
import { TransactionEntity } from '../../../domain/transaction/entities/transaction.entity';
import { KycRequiredException, SingleAccountViolationException } from '../../../domain/common/exceptions';
import * as crypto from 'crypto';

/**
 * ============================================================================
 * LEARNING NOTE: CREATE ACCOUNT USE CASE (CORE BUSINESS RULES)
 * ============================================================================
 * Implements strict digital banking rules:
 * 1. Pre-requisite KYC Check: Customer MUST have a validated BVN or NIN.
 * 2. Single Account Rule: Maximum of 1 account per customer.
 * 3. ₦15,000 Pre-funding: Account is pre-funded with 15000 NGN.
 * 4. Audit Trail: An initial deposit transaction is logged immutably.
 */

@Injectable()
export class CreateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_TOKEN) private readonly accountRepository: IAccountRepository,
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepository: IUserRepository,
    @Inject(KYC_REPOSITORY_TOKEN) private readonly kycRepository: IKycRepository,
    @Inject(NIBSS_IDENTITY_GATEWAY_TOKEN) private readonly nibssIdentity: INibssIdentityGateway,
    @Inject(TRANSACTION_REPOSITORY_TOKEN) private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(dto: CreateAccountDto, userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new BadRequestException('Authenticated user not found.');
    }

    // Rule 1: Check single account limit
    const existingAccount = await this.accountRepository.findByUserId(userId);
    if (existingAccount) {
      throw new ConflictException(new SingleAccountViolationException().message);
    }

    // Rule 2: Validate BVN/NIN with NIBSS
    const kycResult =
      dto.kycType === 'BVN'
        ? await this.nibssIdentity.validateBvn(dto.kycID)
        : await this.nibssIdentity.validateNin(dto.kycID);

    if (!kycResult.valid) {
      throw new BadRequestException(
        new KycRequiredException(`Supplied ${dto.kycType} "${dto.kycID}" is not valid in NIBSS identity store.`).message,
      );
    }

    // Mark user KYC verified if not yet
    if (!user.isKycVerified) {
      user.markKycVerified(dto.kycType, dto.kycID);
      await this.userRepository.save(user);
    }

    // Rule 3: Generate 10-digit NUBAN account number
    // Bank code is 260. Format: 260 + 7 random digits
    let accountNumber = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const randomDigits = Math.floor(1000000 + Math.random() * 9000000).toString();
      accountNumber = `260${randomDigits}`.substring(0, 10);
      const conflict = await this.accountRepository.findByAccountNumber(accountNumber);
      if (!conflict) {
        isUnique = true;
      }
      attempts++;
    }

    const INITIAL_PREFUND_AMOUNT = 15000;
    const accountId = `acc-${crypto.randomUUID()}`;

    // Rule 4: Create pre-funded account
    const account = new AccountEntity({
      id: accountId,
      userId: user.id,
      accountNumber,
      bankCode: '260',
      bankName: 'PHC Bank',
      balance: INITIAL_PREFUND_AMOUNT,
      currency: 'NGN',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const savedAccount = await this.accountRepository.save(account);

    // Rule 5: Log initial pre-funding transaction
    const prefundTx = new TransactionEntity({
      id: `tx-${crypto.randomUUID()}`,
      reference: `INIT-${Date.now()}-${accountNumber.slice(-4)}`,
      transactionType: 'INITIAL_PREFUND',
      senderAccountNumber: null,
      recipientAccountNumber: accountNumber,
      recipientBankCode: '260',
      recipientAccountName: user.fullName,
      amount: INITIAL_PREFUND_AMOUNT,
      fee: 0,
      status: 'SUCCESS',
      narration: 'Welcome bonus - Initial pre-funding for testing',
      createdAt: new Date().toISOString(),
    });

    await this.transactionRepository.save(prefundTx);

    return {
      message: 'Account created successfully',
      accountNumber: savedAccount.accountNumber,
      bankCode: savedAccount.bankCode,
      bankName: savedAccount.bankName,
      balance: savedAccount.balance,
      createdAt: savedAccount.createdAt,
    };
  }
}
