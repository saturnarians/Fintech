import { Injectable, Inject } from '@nestjs/common';
import { eq, or } from 'drizzle-orm';
import { DRIZZLE_DB, DrizzleDb } from '../database/connection';
import { usersTable, UserDbRow } from '../database/schema/users';
import { UserEntity, UserProps, UserRole, KycType } from '../../domain/user/entities/user.entity';
import { IUserRepository } from '../../domain/user/ports/user.repository.port';

/**
 * ============================================================================
 * LEARNING NOTE: REPOSITORY ADAPTER (HEXAGONAL ARCHITECTURE)
 * ============================================================================
 * Implements IUserRepository port defined in the domain layer.
 * Converts database records (UserDbRow) into Domain Entities (UserEntity).
 */

@Injectable()
export class DrizzleUserRepository implements IUserRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  private toDomain(row: UserDbRow): UserEntity {
    return new UserEntity({
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role as UserRole,
      firstName: row.firstName,
      lastName: row.lastName,
      phone: row.phone,
      bvnOrNin: row.bvnOrNin,
      kycType: row.kycType as KycType,
      kycVerified: Boolean(row.kycVerified),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<UserEntity | null> {
    const results = this.db.select().from(usersTable).where(eq(usersTable.id, id)).all();
    if (!results.length) return null;
    return this.toDomain(results[0]);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const results = this.db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim())).all();
    if (!results.length) return null;
    return this.toDomain(results[0]);
  }

  async findByBvnOrNin(identifier: string): Promise<UserEntity | null> {
    const results = this.db.select().from(usersTable).where(eq(usersTable.bvnOrNin, identifier.trim())).all();
    if (!results.length) return null;
    return this.toDomain(results[0]);
  }

  async save(user: UserEntity): Promise<UserEntity> {
    const json = user.toJSON();
    const existing = await this.findById(user.id);

    if (existing) {
      this.db
        .update(usersTable)
        .set({
          email: json.email,
          passwordHash: user.passwordHash,
          role: json.role,
          firstName: json.firstName,
          lastName: json.lastName,
          phone: json.phone,
          bvnOrNin: json.bvnOrNin,
          kycType: json.kycType,
          kycVerified: json.kycVerified,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(usersTable.id, user.id))
        .run();
    } else {
      this.db
        .insert(usersTable)
        .values({
          id: json.id,
          email: json.email,
          passwordHash: user.passwordHash,
          role: json.role,
          firstName: json.firstName,
          lastName: json.lastName,
          phone: json.phone,
          bvnOrNin: json.bvnOrNin,
          kycType: json.kycType,
          kycVerified: json.kycVerified,
          createdAt: json.createdAt,
          updatedAt: json.updatedAt,
        })
        .run();
    }

    const saved = await this.findById(user.id);
    return saved!;
  }

  async findAll(): Promise<UserEntity[]> {
    const rows = this.db.select().from(usersTable).all();
    return rows.map((r) => this.toDomain(r));
  }
}
