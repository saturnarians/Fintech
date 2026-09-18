import { Injectable, Inject, BadRequestException, ConflictException } from '@nestjs/common';
import { RegisterDto } from '../dtos/auth.dto';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../../domain/user/ports/user.repository.port';
import { IKycRepository, KYC_REPOSITORY_TOKEN } from '../../../domain/identity/ports/kyc.repository.port';
import { INibssIdentityGateway, NIBSS_IDENTITY_GATEWAY_TOKEN } from '../../../domain/identity/ports/nibss-identity.port';
import { UserEntity, UserRole, KycType } from '../../../domain/user/entities/user.entity';
import { KycRecordEntity } from '../../../domain/identity/entities/kyc-record.entity';
import { PasswordHasher } from '../../../infrastructure/security/password-hasher';
import * as crypto from 'crypto';

/**
 * ============================================================================
 * LEARNING NOTE: REGISTER CUSTOMER USE CASE (APPLICATION LAYER)
 * ============================================================================
 * Orchestrates customer onboarding:
 * 1. Verifies uniqueness of email.
 * 2. If BVN or NIN is supplied at registration, performs KYC verification
 *    against the NIBSS central identity layer.
 * 3. Hashes password securely.
 * 4. Persists the user and links the KYC record.
 */

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepository: IUserRepository,
    @Inject(KYC_REPOSITORY_TOKEN) private readonly kycRepository: IKycRepository,
    @Inject(NIBSS_IDENTITY_GATEWAY_TOKEN) private readonly nibssIdentity: INibssIdentityGateway,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(dto: RegisterDto) {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(`User with email "${dto.email}" already exists.`);
    }

    let isKycVerified = false;
    let kycType: KycType | null = null;
    let kycIdentifier: string | null = null;

    // Optional early KYC link during signup if provided
    if (dto.bvnOrNin && dto.kycType) {
      kycType = dto.kycType;
      kycIdentifier = dto.bvnOrNin;

      const kycResult =
        dto.kycType === 'BVN'
          ? await this.nibssIdentity.validateBvn(dto.bvnOrNin)
          : await this.nibssIdentity.validateNin(dto.bvnOrNin);

      if (!kycResult.valid) {
        throw new BadRequestException(
          `Invalid ${dto.kycType} "${dto.bvnOrNin}". Please register your identity with NIBSS first.`,
        );
      }
      isKycVerified = true;
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const userId = `usr-${crypto.randomUUID()}`;

    const user = new UserEntity({
      id: userId,
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      role: 'CUSTOMER',
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      phone: dto.phone.trim(),
      bvnOrNin: kycIdentifier,
      kycType,
      kycVerified: isKycVerified,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const savedUser = await this.userRepository.save(user);

    if (isKycVerified && kycType && kycIdentifier) {
      const kycRecord = new KycRecordEntity({
        id: `kyc-${crypto.randomUUID()}`,
        userId: savedUser.id,
        idType: kycType,
        idNumber: kycIdentifier,
        firstName: dto.firstName,
        lastName: dto.lastName,
        dob: '2000-01-01', // default or extracted from NIBSS result
        phone: dto.phone,
        isVerified: true,
        verifiedAt: new Date().toISOString(),
      });
      await this.kycRepository.save(kycRecord);
    }

    return savedUser.toJSON();
  }
}
