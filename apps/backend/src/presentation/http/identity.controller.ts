import { Controller, Post, Body, Req, UseGuards, Optional } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InsertBvnUseCase } from '../../application/identity/use-cases/insert-bvn.use-case';
import { InsertNinUseCase } from '../../application/identity/use-cases/insert-nin.use-case';
import { ValidateBvnUseCase } from '../../application/identity/use-cases/validate-bvn.use-case';
import { ValidateNinUseCase } from '../../application/identity/use-cases/validate-nin.use-case';
import {
  InsertBvnDto,
  InsertBvnSchema,
  InsertNinDto,
  InsertNinSchema,
  ValidateBvnDto,
  ValidateBvnSchema,
  ValidateNinDto,
  ValidateNinSchema,
} from '../../application/identity/dtos/identity.dto';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

/**
 * ============================================================================
 * LEARNING NOTE: IDENTITY CONTROLLER (SIMULATED NIBSS IDENTITY ONBOARDING)
 * ============================================================================
 * Meets assignment requirement 1:
 * "A customer must successfully creates either BVN or NIN before calling account creation.
 * Account creation is only allowed after successful onboarding and verification."
 */

@Controller('identity')
export class IdentityController {
  constructor(
    private readonly insertBvnUseCase: InsertBvnUseCase,
    private readonly insertNinUseCase: InsertNinUseCase,
    private readonly validateBvnUseCase: ValidateBvnUseCase,
    private readonly validateNinUseCase: ValidateNinUseCase,
  ) {}

  /**
   * LEARNING NOTE: STRICT THROTTLE ON IDENTITY SEEDING
   * insert-bvn/insert-nin hit the NIBSS gateway; cap at 5 per 60 s per IP.
   */
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('insert-bvn')
  async insertBvn(@Body(new ZodValidationPipe(InsertBvnSchema)) dto: InsertBvnDto) {
    return this.insertBvnUseCase.execute(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('insert-nin')
  async insertNin(@Body(new ZodValidationPipe(InsertNinSchema)) dto: InsertNinDto) {
    return this.insertNinUseCase.execute(dto);
  }

  @Post('validate-bvn')
  async validateBvn(@Body(new ZodValidationPipe(ValidateBvnSchema)) dto: ValidateBvnDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.validateBvnUseCase.execute(dto, userId);
  }

  @Post('validate-nin')
  async validateNin(@Body(new ZodValidationPipe(ValidateNinSchema)) dto: ValidateNinDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.validateNinUseCase.execute(dto, userId);
  }
}
