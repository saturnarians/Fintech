import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { USER_REPOSITORY_TOKEN, IUserRepository } from '../../domain/user/ports/user.repository.port';

/**
 * ============================================================================
 * LEARNING NOTE: PASSPORT JWT STRATEGY (AUTHENTICATION)
 * ============================================================================
 * Intercepts incoming Bearer tokens in Authorization header:
 * - Validates signature and expiration using JWT_SECRET
 * - Looks up user from database to verify active status
 * - Attaches user object to Express request (req.user)
 */

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepository: IUserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'super-secret-jwt-key-for-phoenix-bank-2026'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User session is invalid or user no longer exists.');
    }
    return user;
  }
}
