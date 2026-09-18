import { KycRecordEntity } from '../entities/kyc-record.entity';
import { KycType } from '../../user/entities/user.entity';

export interface IKycRepository {
  findById(id: string): Promise<KycRecordEntity | null>;
  findByIdNumber(idType: KycType, idNumber: string): Promise<KycRecordEntity | null>;
  findByUserId(userId: string): Promise<KycRecordEntity[]>;
  save(record: KycRecordEntity): Promise<KycRecordEntity>;
}

export const KYC_REPOSITORY_TOKEN = Symbol('IKycRepository');
