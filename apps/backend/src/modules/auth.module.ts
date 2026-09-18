import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from '../presentation/http/auth.controller';
import { RegisterUseCase } from '../application/auth/use-cases/register.use-case';
import { LoginUseCase } from '../application/auth/use-cases/login.use-case';
import { JwtStrategy } from '../infrastructure/security/jwt.strategy';
import { PasswordHasher } from '../infrastructure/security/password-hasher';
import { DrizzleUserRepository } from '../infrastructure/repositories/drizzle-user.repository';
import { DrizzleKycRepository } from '../infrastructure/repositories/drizzle-kyc.repository';
import { USER_REPOSITORY_TOKEN } from '../domain/user/ports/user.repository.port';
import { KYC_REPOSITORY_TOKEN } from '../domain/identity/ports/kyc.repository.port';

/**
 * ============================================================================
 * LEARNING NOTE: AUTHENTICATION MODULE (MODULAR MONOLITH)
 * ============================================================================
 * Binds the Auth bounded context:
 * - Configures Passport with JWT strategy
 * - Injects Hexagonal Ports & Adapters for user persistence & KYC verification
 */

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'super-secret-jwt-key-for-phoenix-bank-2026'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    RegisterUseCase,
    LoginUseCase,
    JwtStrategy,
    PasswordHasher,
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: DrizzleUserRepository,
    },
    {
      provide: KYC_REPOSITORY_TOKEN,
      useClass: DrizzleKycRepository,
    },
  ],
  exports: [
    USER_REPOSITORY_TOKEN,
    KYC_REPOSITORY_TOKEN,
    PasswordHasher,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
