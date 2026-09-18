import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IAccountRepository, ACCOUNT_REPOSITORY_TOKEN } from '../../../domain/account/ports/account.repository.port';
import { UserEntity } from '../../../domain/user/entities/user.entity';

/**
 * ============================================================================
 * LEARNING NOTE: GET ACCOUNT & DATA PRIVACY ENFORCEMENT
 * ============================================================================
 * Per assignment requirement:
 * "Each customer must be able to view only their own transaction history.
 * Proper data isolation: No customer should have access to another customer’s data."
 */

@Injectable()
export class GetAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_TOKEN) private readonly accountRepository: IAccountRepository,
  ) {}

  async getMyAccount(currentUser: UserEntity) {
    const account = await this.accountRepository.findByUserId(currentUser.id);
    if (!account) {
      throw new NotFoundException('No active bank account found for this customer.');
    }
    return account.toJSON();
  }

  async getAllAccounts() {
    const accounts = await this.accountRepository.findAll();
    return accounts.map((a) => a.toJSON());
  }

  async getBalance(currentUser: UserEntity) {
    const account = await this.accountRepository.findByUserId(currentUser.id);
    if (!account) {
      throw new NotFoundException('No active bank account found for this customer.');
    }
    return {
      accountNumber: account.accountNumber,
      balance: account.balance,
      currency: account.currency,
    };
  }
}
