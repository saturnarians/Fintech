import { Injectable, Inject } from '@nestjs/common';
import { InsertBvnDto } from '../dtos/identity.dto';
import { INibssIdentityGateway, NIBSS_IDENTITY_GATEWAY_TOKEN } from '../../../domain/identity/ports/nibss-identity.port';

/**
 * ============================================================================
 * LEARNING NOTE: INSERT BVN USE CASE
 * ============================================================================
 * Registers a new simulated BVN in the NIBSS identity store.
 * (No real BVN is allowed per assignment rules).
 */

@Injectable()
export class InsertBvnUseCase {
  constructor(
    @Inject(NIBSS_IDENTITY_GATEWAY_TOKEN)
    private readonly nibssIdentity: INibssIdentityGateway,
  ) {}

  async execute(dto: InsertBvnDto) {
    return this.nibssIdentity.insertBvn(dto);
  }
}
