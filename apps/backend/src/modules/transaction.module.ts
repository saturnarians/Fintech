import { Module } from '@nestjs/common';
import { TransactionController } from '../presentation/http/transaction.controller';
import { TransferUseCase } from '../application/transaction/use-cases/transfer.use-case';
import { GetTransactionsUseCase } from '../application/transaction/use-cases/get-transactions.use-case';
import { QueryTransactionStatusUseCase } from '../application/transaction/use-cases/query-status.use-case';
import { DrizzleTransactionRepository } from '../infrastructure/repositories/drizzle-transaction.repository';
import { DrizzleAccountRepository } from '../infrastructure/repositories/drizzle-account.repository';
import { DrizzleUserRepository } from '../infrastructure/repositories/drizzle-user.repository';
import { TRANSACTION_REPOSITORY_TOKEN } from '../domain/transaction/ports/transaction.repository.port';
import { ACCOUNT_REPOSITORY_TOKEN } from '../domain/account/ports/account.repository.port';
import { USER_REPOSITORY_TOKEN } from '../domain/user/ports/user.repository.port';
import { NIBSS_TRANSFER_GATEWAY_TOKEN } from '../domain/transaction/ports/nibss-transfer.port';
import { NibssHttpClient } from '../infrastructure/http/nibss.client';
import { NibssMockAdapter } from '../infrastructure/http/nibss.mock-adapter';
import { NibssLiveAdapter } from '../infrastructure/http/nibss.adapter';
import { AuthModule } from './auth.module';
import { AccountModule } from './account.module';
import { ConfigModule } from '@nestjs/config';

/**
 * ============================================================================
 * LEARNING NOTE: TRANSACTION MODULE
 * ============================================================================
 * Handles Intra-bank transfers, Inter-bank routing via NIBSS, TSQ querying,
 * and strict customer data privacy.
 */

@Module({
  imports: [AuthModule, AccountModule, ConfigModule],
  controllers: [TransactionController],
  providers: [
    TransferUseCase,
    GetTransactionsUseCase,
    QueryTransactionStatusUseCase,
    NibssHttpClient,
    NibssMockAdapter,
    NibssLiveAdapter,
    {
      provide: TRANSACTION_REPOSITORY_TOKEN,
      useClass: DrizzleTransactionRepository,
    },
    {
      provide: ACCOUNT_REPOSITORY_TOKEN,
      useClass: DrizzleAccountRepository,
    },
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: DrizzleUserRepository,
    },
    {
      provide: NIBSS_TRANSFER_GATEWAY_TOKEN,
      useExisting: NibssLiveAdapter,
    },
  ],
  exports: [TRANSACTION_REPOSITORY_TOKEN],
})
export class TransactionModule {}
