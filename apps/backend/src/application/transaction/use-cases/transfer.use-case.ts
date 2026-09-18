import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { TransferDto } from '../dtos/transaction.dto';
import { IAccountRepository, ACCOUNT_REPOSITORY_TOKEN } from '../../../domain/account/ports/account.repository.port';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../../domain/user/ports/user.repository.port';
import { ITransactionRepository, TRANSACTION_REPOSITORY_TOKEN } from '../../../domain/transaction/ports/transaction.repository.port';
import { INibssTransferGateway, NIBSS_TRANSFER_GATEWAY_TOKEN } from '../../../domain/transaction/ports/nibss-transfer.port';
import { TransactionEntity } from '../../../domain/transaction/entities/transaction.entity';
import { UserEntity } from '../../../domain/user/entities/user.entity';
import * as crypto from 'crypto';

/**
 * ============================================================================
 * LEARNING NOTE: TRANSFER USE CASE (INTRA-BANK & INTER-BANK)
 * ============================================================================
 * Coordinates the full funds transfer lifecycle:
 * 1. Checks sender account and ensures sufficient balance.
 * 2. Determines routing:
 *    - If recipient account is internal (within our bank): INTRA-BANK transfer.
 *      Performs atomic ledger debit & credit locally.
 *    - If recipient account is external: INTER-BANK transfer.
 *      Debits sender, routes via NIBSS interbank settlement, attaches TSQ ID.
 * 3. Handles failure and rollback if external routing fails.
 */

@Injectable()
export class TransferUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_TOKEN) private readonly accountRepository: IAccountRepository,
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepository: IUserRepository,
    @Inject(TRANSACTION_REPOSITORY_TOKEN) private readonly transactionRepository: ITransactionRepository,
    @Inject(NIBSS_TRANSFER_GATEWAY_TOKEN) private readonly nibssGateway: INibssTransferGateway,
  ) {}

  async execute(dto: TransferDto, currentUser: UserEntity) {
    // 1. Fetch sender account
    const senderAccount = await this.accountRepository.findByUserId(currentUser.id);
    if (!senderAccount) {
      throw new BadRequestException('You do not have an active bank account to send funds from.');
    }

    if (senderAccount.accountNumber === dto.to) {
      throw new BadRequestException('Cannot transfer funds to the same account.');
    }

    // 2. Validate sender balance
    if (senderAccount.balance < dto.amount) {
      throw new BadRequestException(
        `Insufficient balance. Current balance is ₦${senderAccount.balance}, transfer requires ₦${dto.amount}.`,
      );
    }

    // 3. Check if recipient is internal (intra-bank) or external (inter-bank)
    const internalRecipientAccount = await this.accountRepository.findByAccountNumber(dto.to);
    const reference = `TRF-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    if (internalRecipientAccount) {
      // --------------------------------------------------------
      // INTRA-BANK TRANSFER
      // --------------------------------------------------------
      const recipientUser = await this.userRepository.findById(internalRecipientAccount.userId);
      const recipientName = recipientUser ? recipientUser.fullName : 'Bank Customer';

      // Atomic debit and credit
      senderAccount.debit(dto.amount);
      internalRecipientAccount.credit(dto.amount);

      await this.accountRepository.updateBalance(senderAccount.accountNumber, senderAccount.balance);
      await this.accountRepository.updateBalance(internalRecipientAccount.accountNumber, internalRecipientAccount.balance);

      const transaction = new TransactionEntity({
        id: `tx-${crypto.randomUUID()}`,
        reference,
        transactionType: 'INTRA_BANK_TRANSFER',
        senderAccountNumber: senderAccount.accountNumber,
        recipientAccountNumber: internalRecipientAccount.accountNumber,
        recipientBankCode: internalRecipientAccount.bankCode,
        recipientAccountName: recipientName,
        amount: dto.amount,
        fee: 0,
        status: 'SUCCESS',
        narration: dto.narration || 'Intra-bank transfer',
        createdAt: new Date().toISOString(),
      });

      const savedTx = await this.transactionRepository.save(transaction);

      return {
        message: 'Transfer successful',
        transactionId: savedTx.reference,
        amount: savedTx.amount,
        from: savedTx.senderAccountNumber,
        to: savedTx.recipientAccountNumber,
        recipientName,
        status: 'SUCCESS',
        type: 'INTRA_BANK',
        newBalance: senderAccount.balance,
      };
    } else {
      // --------------------------------------------------------
      // INTER-BANK TRANSFER (ROUTED VIA NIBSS BY PHOENIX)
      // --------------------------------------------------------
      // Pre-transfer Name Enquiry
      let recipientName = dto.recipientAccountName;
      let recipientBankName = 'External Bank';

      try {
        const enquiry = await this.nibssGateway.nameEnquiry(dto.to);
        recipientName = enquiry.accountName || recipientName || 'External Customer';
        recipientBankName = enquiry.bankName || recipientBankName;
      } catch {
        recipientName = recipientName || 'External Customer';
      }

      // Debit sender locally
      senderAccount.debit(dto.amount);
      await this.accountRepository.updateBalance(senderAccount.accountNumber, senderAccount.balance);

      try {
        // Dispatch to NIBSS gateway
        const nibssResult = await this.nibssGateway.transfer({
          from: senderAccount.accountNumber,
          to: dto.to,
          amount: dto.amount,
        });

        const transaction = new TransactionEntity({
          id: `tx-${crypto.randomUUID()}`,
          reference,
          transactionType: 'INTER_BANK_TRANSFER',
          senderAccountNumber: senderAccount.accountNumber,
          recipientAccountNumber: dto.to,
          recipientBankCode: dto.recipientBankCode || '260',
          recipientAccountName: recipientName,
          amount: dto.amount,
          fee: 0,
          status: 'SUCCESS',
          narration: dto.narration || 'Inter-bank transfer via NIBSS',
          externalTransactionId: nibssResult.transactionId,
          createdAt: new Date().toISOString(),
        });

        const savedTx = await this.transactionRepository.save(transaction);

        return {
          message: 'Inter-bank transfer successful',
          transactionId: savedTx.reference,
          externalTransactionId: nibssResult.transactionId,
          amount: savedTx.amount,
          from: savedTx.senderAccountNumber,
          to: savedTx.recipientAccountNumber,
          recipientName,
          status: 'SUCCESS',
          type: 'INTER_BANK',
          newBalance: senderAccount.balance,
        };
      } catch (error: any) {
        // Rollback debit on failure
        senderAccount.credit(dto.amount);
        await this.accountRepository.updateBalance(senderAccount.accountNumber, senderAccount.balance);

        const failedTx = new TransactionEntity({
          id: `tx-${crypto.randomUUID()}`,
          reference,
          transactionType: 'INTER_BANK_TRANSFER',
          senderAccountNumber: senderAccount.accountNumber,
          recipientAccountNumber: dto.to,
          recipientBankCode: dto.recipientBankCode || '260',
          recipientAccountName: recipientName,
          amount: dto.amount,
          fee: 0,
          status: 'FAILED',
          narration: dto.narration,
          failureReason: error.message || 'Inter-bank routing error',
          createdAt: new Date().toISOString(),
        });

        await this.transactionRepository.save(failedTx);
        throw new BadRequestException(`Inter-bank transfer failed: ${error.message}`);
      }
    }
  }
}
