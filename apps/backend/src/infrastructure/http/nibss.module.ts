import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NibssHttpClient } from './nibss.client';
import { NibssMockAdapter } from './nibss.mock-adapter';
import { NibssLiveAdapter } from './nibss.adapter';
import { NIBSS_IDENTITY_GATEWAY_TOKEN } from '../../domain/identity/ports/nibss-identity.port';
import { NIBSS_TRANSFER_GATEWAY_TOKEN } from '../../domain/transaction/ports/nibss-transfer.port';

/**
 * ============================================================================
 * LEARNING NOTE: SHARED GLOBAL NIBSS GATEWAY MODULE
 * ============================================================================
 * Ensures a single shared singleton instance of NibssLiveAdapter and NibssMockAdapter
 * across all bounded contexts (Auth, Identity, Account, Transaction).
 */

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    NibssHttpClient,
    NibssMockAdapter,
    NibssLiveAdapter,
    {
      provide: NIBSS_IDENTITY_GATEWAY_TOKEN,
      useExisting: NibssLiveAdapter,
    },
    {
      provide: NIBSS_TRANSFER_GATEWAY_TOKEN,
      useExisting: NibssLiveAdapter,
    },
  ],
  exports: [
    NibssHttpClient,
    NibssMockAdapter,
    NibssLiveAdapter,
    NIBSS_IDENTITY_GATEWAY_TOKEN,
    NIBSS_TRANSFER_GATEWAY_TOKEN,
  ],
})
export class NibssModule {}
