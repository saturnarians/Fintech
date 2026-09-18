import { Module } from '@nestjs/common';
import { AccountController } from '../presentation/http/account.controller';
import { CreateAccountUseCase } from '../application/account/use-cases/create-account.use-case';
import { GetAccountUseCase } from '../application/account/use-cases/get-account.use-case';
import { NameEnquiryUseCase } from '../application/account/use-cases/name-enquiry.use-case';
import { DrizzleAccountRepository } from '../infrastructure/repositories/drizzle-account.repository';
import { DrizzleTransactionRepository } from '../infrastructure/repositories/drizzle-transaction.repository';
import { ACCOUNT_REPOSITORY_TOKEN } from '../domain/account/ports/account.repository.port';
import { TRANSACTION_REPOSITORY_TOKEN } from '../domain/transaction/ports/transaction.repository.port';
import { AuthModule } from './auth.module';
import { ConfigModule } from '@nestjs/config';

/**
 * ============================================================================
 * LEARNING NOTE: ACCOUNT MODULE
 * ============================================================================
 * Manages bank account creation, balance inquiry, name inquiry, and pre-funding.
 */

@Module({
  imports: [AuthModule, ConfigModule],
  controllers: [AccountController],
  providers: [
    CreateAccountUseCase,
    GetAccountUseCase,
    NameEnquiryUseCase,
    {
      provide: ACCOUNT_REPOSITORY_TOKEN,
      useClass: DrizzleAccountRepository,
    },
    {
      provide: TRANSACTION_REPOSITORY_TOKEN,
      useClass: DrizzleTransactionRepository,
    },
  ],
  exports: [ACCOUNT_REPOSITORY_TOKEN, TRANSACTION_REPOSITORY_TOKEN],
})
export class AccountModule {}
