import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, AuthResponseDto } from '../dtos/auth.dto';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../../domain/user/ports/user.repository.port';
import { PasswordHasher } from '../../../infrastructure/security/password-hasher';

/**
 * ============================================================================
 * LEARNING NOTE: LOGIN USE CASE (AUTHENTICATION & JWT ISSUANCE)
 * ============================================================================
 * Verifies credentials, computes bcrypt hash comparison, and signs a JWT
 * containing sub (userId), email, and RBAC role.
 */

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepository: IUserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isValid = await this.passwordHasher.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        kycVerified: user.isKycVerified,
        bvnOrNin: user.bvnOrNin,
      },
    };
  }
}
