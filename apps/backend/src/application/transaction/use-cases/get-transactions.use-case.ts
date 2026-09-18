import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ITransactionRepository, TRANSACTION_REPOSITORY_TOKEN } from '../../../domain/transaction/ports/transaction.repository.port';
import { IAccountRepository, ACCOUNT_REPOSITORY_TOKEN } from '../../../domain/account/ports/account.repository.port';
import { UserEntity } from '../../../domain/user/entities/user.entity';

/**
 * ============================================================================
 * LEARNING NOTE: TRANSACTION HISTORY WITH STRICT DATA ISOLATION (RBAC)
 * ============================================================================
 * Enforces requirement:
 * - Customers can ONLY see transactions associated with their own bank account.
 * - Administrators can view full cross-bank transaction audit logs.
 */

@Injectable()
export class GetTransactionsUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY_TOKEN) private readonly transactionRepository: ITransactionRepository,
    @Inject(ACCOUNT_REPOSITORY_TOKEN) private readonly accountRepository: IAccountRepository,
  ) {}

  async execute(currentUser: UserEntity) {
    if (currentUser.role === 'ADMIN') {
      const allTx = await this.transactionRepository.findAll();
      return allTx.map((t) => t.toJSON());
    }

    // For customers, get their single account
    const account = await this.accountRepository.findByUserId(currentUser.id);
    if (!account) {
      return [];
    }

    const customerTxs = await this.transactionRepository.findByAccountNumber(account.accountNumber);
    return customerTxs.map((t) => t.toJSON());
  }
}
