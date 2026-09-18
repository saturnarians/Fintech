import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IAccountRepository, ACCOUNT_REPOSITORY_TOKEN } from '../../../domain/account/ports/account.repository.port';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../../domain/user/ports/user.repository.port';
import { INibssTransferGateway, NIBSS_TRANSFER_GATEWAY_TOKEN } from '../../../domain/transaction/ports/nibss-transfer.port';

/**
 * ============================================================================
 * LEARNING NOTE: NAME ENQUIRY USE CASE (PRE-TRANSFER VERIFICATION)
 * ============================================================================
 * Resolves an account number to the registered account holder's name.
 * 1. Checks our internal bank ledger first.
 * 2. If not an internal account, routes inquiry through NIBSS by Phoenix
 *    interbank settlement gateway.
 */

@Injectable()
export class NameEnquiryUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_TOKEN) private readonly accountRepository: IAccountRepository,
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepository: IUserRepository,
    @Inject(NIBSS_TRANSFER_GATEWAY_TOKEN) private readonly nibssGateway: INibssTransferGateway,
  ) {}

  async execute(accountNumber: string) {
    // 1. Check local bank accounts
    const localAccount = await this.accountRepository.findByAccountNumber(accountNumber);
    if (localAccount) {
      const user = await this.userRepository.findById(localAccount.userId);
      return {
        accountNumber: localAccount.accountNumber,
        accountName: user ? user.fullName : 'Valued Customer',
        bankCode: localAccount.bankCode,
        bankName: localAccount.bankName,
        isInternal: true,
      };
    }

    // 2. Query external NIBSS network
    try {
      const externalResult = await this.nibssGateway.nameEnquiry(accountNumber);
      return {
        accountNumber: externalResult.accountNumber,
        accountName: externalResult.accountName,
        bankCode: 'EXTERNAL',
        bankName: externalResult.bankName,
        isInternal: false,
      };
    } catch {
      throw new NotFoundException(`Account number "${accountNumber}" could not be resolved.`);
    }
  }
}
