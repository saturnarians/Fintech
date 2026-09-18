import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole, UserEntity } from '../../domain/user/entities/user.entity';

/**
 * ============================================================================
 * LEARNING NOTE: ROLE-BASED ACCESS CONTROL (RBAC) GUARD
 * ============================================================================
 * Reads allowed roles from route metadata using Reflector.
 * Compares against the user's role extracted from the verified JWT.
 */

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No role restriction applied
    }

    const { user }: { user: UserEntity } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('User is not authenticated.');
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: Required role [${requiredRoles.join(', ')}], current role is "${user.role}".`,
      );
    }

    return true;
  }
}
