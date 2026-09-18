import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ValidateNinDto } from '../dtos/identity.dto';
import { INibssIdentityGateway, NIBSS_IDENTITY_GATEWAY_TOKEN } from '../../../domain/identity/ports/nibss-identity.port';
import { IKycRepository, KYC_REPOSITORY_TOKEN } from '../../../domain/identity/ports/kyc.repository.port';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../../domain/user/ports/user.repository.port';
import { KycRecordEntity } from '../../../domain/identity/entities/kyc-record.entity';
import * as crypto from 'crypto';

/**
 * ============================================================================
 * LEARNING NOTE: VALIDATE NIN USE CASE
 * ============================================================================
 * Validates National Identification Number with NIBSS and marks KYC verified.
 */

@Injectable()
export class ValidateNinUseCase {
  constructor(
    @Inject(NIBSS_IDENTITY_GATEWAY_TOKEN) private readonly nibssIdentity: INibssIdentityGateway,
    @Inject(KYC_REPOSITORY_TOKEN) private readonly kycRepository: IKycRepository,
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: ValidateNinDto, currentUserId?: string) {
    const result = await this.nibssIdentity.validateNin(dto.nin);
    if (!result.valid) {
      throw new BadRequestException(`NIN "${dto.nin}" is invalid or does not exist in NIBSS identity store.`);
    }

    if (currentUserId) {
      const user = await this.userRepository.findById(currentUserId);
      if (user) {
        user.markKycVerified('NIN', dto.nin);
        await this.userRepository.save(user);

        const kycRecord = new KycRecordEntity({
          id: `kyc-${crypto.randomUUID()}`,
          userId: user.id,
          idType: 'NIN',
          idNumber: dto.nin,
          firstName: result.firstName || user.firstName,
          lastName: result.lastName || user.lastName,
          dob: result.dob || '2000-01-01',
          phone: user.phone,
          isVerified: true,
          verifiedAt: new Date().toISOString(),
        });
        await this.kycRepository.save(kycRecord);
      }
    }

    return result;
  }
}
