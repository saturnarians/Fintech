import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * ============================================================================
 * LEARNING NOTE: JWT AUTH GUARD (PASSPORT INTEGRATION)
 * ============================================================================
 * Guards endpoints requiring valid Bearer JWT.
 */

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
