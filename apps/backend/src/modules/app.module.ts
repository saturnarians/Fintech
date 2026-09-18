import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from '../infrastructure/database/drizzle.module';
import { NibssModule } from '../infrastructure/http/nibss.module';
import { AuthModule } from './auth.module';
import { IdentityModule } from './identity.module';
import { AccountModule } from './account.module';
import { TransactionModule } from './transaction.module';

/**
 * ============================================================================
 * LEARNING NOTE: APP ROOT MODULE (MODULAR MONOLITH COMPOSITION)
 * ============================================================================
 * Aggregates all domain bounded contexts into a coherent modular monolith.
 * Each module encapsulates its domain rules, while Drizzle, Nibss, and Config are global.
 */

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DrizzleModule,
    NibssModule,
    AuthModule,
    IdentityModule,
    AccountModule,
    TransactionModule,
  ],
})
export class AppModule {}
