import { Injectable, Inject } from '@nestjs/common';
import { InsertNinDto } from '../dtos/identity.dto';
import { INibssIdentityGateway, NIBSS_IDENTITY_GATEWAY_TOKEN } from '../../../domain/identity/ports/nibss-identity.port';

/**
 * ============================================================================
 * LEARNING NOTE: INSERT NIN USE CASE
 * ============================================================================
 * Registers a new simulated NIN record in the NIBSS identity store.
 */

@Injectable()
export class InsertNinUseCase {
  constructor(
    @Inject(NIBSS_IDENTITY_GATEWAY_TOKEN)
    private readonly nibssIdentity: INibssIdentityGateway,
  ) {}

  async execute(dto: InsertNinDto) {
    return this.nibssIdentity.insertNin(dto);
  }
}
