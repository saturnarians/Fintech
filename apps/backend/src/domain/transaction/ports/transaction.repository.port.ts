import { TransactionEntity } from '../entities/transaction.entity';

export interface ITransactionRepository {
  findById(id: string): Promise<TransactionEntity | null>;
  findByReference(reference: string): Promise<TransactionEntity | null>;
  findByExternalId(externalId: string): Promise<TransactionEntity | null>;
  findByAccountNumber(accountNumber: string): Promise<TransactionEntity[]>;
  save(transaction: TransactionEntity): Promise<TransactionEntity>;
  update(transaction: TransactionEntity): Promise<void>;
  findAll(): Promise<TransactionEntity[]>;
}

export const TRANSACTION_REPOSITORY_TOKEN = Symbol('ITransactionRepository');
