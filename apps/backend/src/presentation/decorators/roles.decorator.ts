import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../domain/user/entities/user.entity';

/**
 * ============================================================================
 * LEARNING NOTE: ROLES DECORATOR (RBAC)
 * ============================================================================
 * Attaches metadata to controllers or route handlers specifying which roles
 * are allowed to execute the endpoint.
 * Example: @Roles('ADMIN')
 */

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
