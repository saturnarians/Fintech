import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserEntity } from '../../domain/user/entities/user.entity';

/**
 * ============================================================================
 * LEARNING NOTE: CURRENT USER DECORATOR
 * ============================================================================
 * Extracts the authenticated UserEntity attached to the request by JwtStrategy.
 * Usage: @CurrentUser() user: UserEntity
 */

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext): UserEntity => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
