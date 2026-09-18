import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE_DB, DrizzleDb } from '../database/connection';
import { kycRecordsTable, KycDbRow } from '../database/schema/kyc';
import { KycRecordEntity } from '../../domain/identity/entities/kyc-record.entity';
import { IKycRepository } from '../../domain/identity/ports/kyc.repository.port';
import { KycType } from '../../domain/user/entities/user.entity';

/**
 * ============================================================================
 * LEARNING NOTE: KYC REPOSITORY ADAPTER
 * ============================================================================
 * Implements the IKycRepository port using SQLite through Drizzle ORM.
 */

@Injectable()
export class DrizzleKycRepository implements IKycRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  private toDomain(row: KycDbRow): KycRecordEntity {
    return new KycRecordEntity({
      id: row.id,
      userId: row.userId,
      idType: row.idType as KycType,
      idNumber: row.idNumber,
      firstName: row.firstName,
      lastName: row.lastName,
      dob: row.dob,
      phone: row.phone,
      isVerified: Boolean(row.isVerified),
      verifiedAt: row.verifiedAt,
    });
  }

  async findById(id: string): Promise<KycRecordEntity | null> {
    const rows = this.db.select().from(kycRecordsTable).where(eq(kycRecordsTable.id, id)).all();
    if (!rows.length) return null;
    return this.toDomain(rows[0]);
  }

  async findByIdNumber(idType: KycType, idNumber: string): Promise<KycRecordEntity | null> {
    const rows = this.db
      .select()
      .from(kycRecordsTable)
      .where(and(eq(kycRecordsTable.idType, idType), eq(kycRecordsTable.idNumber, idNumber.trim())))
      .all();
    if (!rows.length) return null;
    return this.toDomain(rows[0]);
  }

  async findByUserId(userId: string): Promise<KycRecordEntity[]> {
    const rows = this.db.select().from(kycRecordsTable).where(eq(kycRecordsTable.userId, userId)).all();
    return rows.map((r) => this.toDomain(r));
  }

  async save(record: KycRecordEntity): Promise<KycRecordEntity> {
    const json = record.toJSON();
    const existing = await this.findById(record.id);

    if (existing) {
      this.db
        .update(kycRecordsTable)
        .set({
          userId: json.userId,
          idType: json.idType,
          idNumber: json.idNumber,
          firstName: json.firstName,
          lastName: json.lastName,
          dob: json.dob,
          phone: json.phone,
          isVerified: json.isVerified,
        })
        .where(eq(kycRecordsTable.id, record.id))
        .run();
    } else {
      this.db
        .insert(kycRecordsTable)
        .values({
          id: json.id,
          userId: json.userId,
          idType: json.idType,
          idNumber: json.idNumber,
          firstName: json.firstName,
          lastName: json.lastName,
          dob: json.dob,
          phone: json.phone,
          isVerified: json.isVerified,
          verifiedAt: json.verifiedAt,
        })
        .run();
    }

    const saved = await this.findById(record.id);
    return saved!;
  }
}
