import { Controller, Post, Get, Body, UseGuards, UsePipes } from '@nestjs/common';
import { RegisterUseCase } from '../../application/auth/use-cases/register.use-case';
import { LoginUseCase } from '../../application/auth/use-cases/login.use-case';
import { RegisterDto, RegisterSchema, LoginDto, LoginSchema } from '../../application/auth/dtos/auth.dto';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserEntity } from '../../domain/user/entities/user.entity';

/**
 * ============================================================================
 * LEARNING NOTE: AUTHENTICATION CONTROLLER (DRIVING ADAPTER)
 * ============================================================================
 * Exposes customer onboarding, authentication, and session inspection.
 * Applies ZodValidationPipe directly on request payloads.
 */

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  @Post('register')
  async register(@Body(new ZodValidationPipe(RegisterSchema)) dto: RegisterDto) {
    return this.registerUseCase.execute(dto);
  }

  @Post('login')
  async login(@Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto) {
    return this.loginUseCase.execute(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: UserEntity) {
    return user.toJSON();
  }
}
