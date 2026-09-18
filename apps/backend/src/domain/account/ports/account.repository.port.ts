import { AccountEntity } from '../entities/account.entity';

export interface IAccountRepository {
  findById(id: string): Promise<AccountEntity | null>;
  findByUserId(userId: string): Promise<AccountEntity | null>;
  findByAccountNumber(accountNumber: string): Promise<AccountEntity | null>;
  save(account: AccountEntity): Promise<AccountEntity>;
  updateBalance(accountNumber: string, newBalance: number): Promise<void>;
  findAll(): Promise<AccountEntity[]>;
}

export const ACCOUNT_REPOSITORY_TOKEN = Symbol('IAccountRepository');
