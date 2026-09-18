import { Module } from '@nestjs/common';
import { IdentityController } from '../presentation/http/identity.controller';
import { InsertBvnUseCase } from '../application/identity/use-cases/insert-bvn.use-case';
import { InsertNinUseCase } from '../application/identity/use-cases/insert-nin.use-case';
import { ValidateBvnUseCase } from '../application/identity/use-cases/validate-bvn.use-case';
import { ValidateNinUseCase } from '../application/identity/use-cases/validate-nin.use-case';
import { AuthModule } from './auth.module';
import { ConfigModule } from '@nestjs/config';

/**
 * ============================================================================
 * LEARNING NOTE: IDENTITY MODULE
 * ============================================================================
 * Exposes BVN and NIN onboarding and validation workflows.
 */

@Module({
  imports: [AuthModule, ConfigModule],
  controllers: [IdentityController],
  providers: [
    InsertBvnUseCase,
    InsertNinUseCase,
    ValidateBvnUseCase,
    ValidateNinUseCase,
  ],
})
export class IdentityModule {}
