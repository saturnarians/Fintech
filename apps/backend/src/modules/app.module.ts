import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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
    /**
     * LEARNING NOTE: GLOBAL RATE LIMITER (SERVER-SIDE)
     * ThrottlerModule enforces a 60-request / 60-second default on all routes.
     * Individual controllers/handlers can override with @Throttle() decorator.
     */
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,   // window: 60 seconds
        limit: 60,     // max 60 requests per window per IP
      },
    ]),
    DrizzleModule,
    NibssModule,
    AuthModule,
    IdentityModule,
    AccountModule,
    TransactionModule,
  ],
  providers: [
    // Apply ThrottlerGuard globally so every controller is protected by default
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
