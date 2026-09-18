import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ValidateBvnDto } from '../dtos/identity.dto';
import { INibssIdentityGateway, NIBSS_IDENTITY_GATEWAY_TOKEN } from '../../../domain/identity/ports/nibss-identity.port';
import { IKycRepository, KYC_REPOSITORY_TOKEN } from '../../../domain/identity/ports/kyc.repository.port';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../../domain/user/ports/user.repository.port';
import { KycRecordEntity } from '../../../domain/identity/entities/kyc-record.entity';
import * as crypto from 'crypto';

/**
 * ============================================================================
 * LEARNING NOTE: VALIDATE BVN USE CASE
 * ============================================================================
 * Queries NIBSS to confirm BVN validity. If a logged-in user is provided,
 * updates the user's KYC verification flag and links the biographic record.
 */

@Injectable()
export class ValidateBvnUseCase {
  constructor(
    @Inject(NIBSS_IDENTITY_GATEWAY_TOKEN) private readonly nibssIdentity: INibssIdentityGateway,
    @Inject(KYC_REPOSITORY_TOKEN) private readonly kycRepository: IKycRepository,
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: ValidateBvnDto, currentUserId?: string) {
    const result = await this.nibssIdentity.validateBvn(dto.bvn);
    if (!result.valid) {
      throw new BadRequestException(`BVN "${dto.bvn}" is invalid or does not exist in NIBSS identity store.`);
    }

    if (currentUserId) {
      const user = await this.userRepository.findById(currentUserId);
      if (user) {
        user.markKycVerified('BVN', dto.bvn);
        await this.userRepository.save(user);

        const kycRecord = new KycRecordEntity({
          id: `kyc-${crypto.randomUUID()}`,
          userId: user.id,
          idType: 'BVN',
          idNumber: dto.bvn,
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
