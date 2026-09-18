import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ITransactionRepository, TRANSACTION_REPOSITORY_TOKEN } from '../../../domain/transaction/ports/transaction.repository.port';
import { IAccountRepository, ACCOUNT_REPOSITORY_TOKEN } from '../../../domain/account/ports/account.repository.port';
import { INibssTransferGateway, NIBSS_TRANSFER_GATEWAY_TOKEN } from '../../../domain/transaction/ports/nibss-transfer.port';
import { UserEntity } from '../../../domain/user/entities/user.entity';

/**
 * ============================================================================
 * LEARNING NOTE: TRANSACTION STATUS QUERY (TSQ) USE CASE
 * ============================================================================
 * Queries status of a transaction locally and reconciles with NIBSS TSQ gateway.
 * Enforces data isolation between users.
 */

@Injectable()
export class QueryTransactionStatusUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY_TOKEN) private readonly transactionRepository: ITransactionRepository,
    @Inject(ACCOUNT_REPOSITORY_TOKEN) private readonly accountRepository: IAccountRepository,
    @Inject(NIBSS_TRANSFER_GATEWAY_TOKEN) private readonly nibssGateway: INibssTransferGateway,
  ) {}

  async execute(identifier: string, currentUser: UserEntity) {
    // Check by reference, external ID, or primary key
    let tx = await this.transactionRepository.findByReference(identifier);
    if (!tx) {
      tx = await this.transactionRepository.findByExternalId(identifier);
    }
    if (!tx) {
      tx = await this.transactionRepository.findById(identifier);
    }

    if (!tx) {
      throw new NotFoundException(`Transaction with identifier "${identifier}" was not found.`);
    }

    // Data isolation check: Customer can only view their own transactions
    if (currentUser.role !== 'ADMIN') {
      const account = await this.accountRepository.findByUserId(currentUser.id);
      if (
        !account ||
        (tx.senderAccountNumber !== account.accountNumber && tx.recipientAccountNumber !== account.accountNumber)
      ) {
        throw new ForbiddenException('You are not authorized to view this transaction.');
      }
    }

    // If external interbank transfer has TSQ ID, query NIBSS for status verification
    if (tx.externalTransactionId) {
      try {
        const nibssStatus = await this.nibssGateway.queryStatus(tx.externalTransactionId);
        if (nibssStatus && nibssStatus.status !== tx.status) {
          if (nibssStatus.status === 'SUCCESS') {
            tx.markSuccess(nibssStatus.transactionId);
            await this.transactionRepository.update(tx);
          } else if (nibssStatus.status === 'FAILED') {
            tx.markFailed('Settlement rejected by NIBSS');
            await this.transactionRepository.update(tx);
          }
        }
      } catch {
        // Keep existing local status if remote TSQ is temporarily unavailable
      }
    }

    return tx.toJSON();
  }
}
