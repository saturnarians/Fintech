import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DRIZZLE_DB, createSqliteDb } from './connection';

/**
 * ============================================================================
 * LEARNING NOTE: NESTJS DRIZZLE MODULE PROVIDER
 * ============================================================================
 * Exports the DRIZZLE_DB database client as a globally accessible injectable token.
 */

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DRIZZLE_DB,
      useFactory: (configService: ConfigService) => {
        const dbPath = configService.get<string>('DATABASE_PATH');
        return createSqliteDb(dbPath);
      },
      inject: [ConfigService],
    },
  ],
  exports: [DRIZZLE_DB],
})
export class DrizzleModule {}
