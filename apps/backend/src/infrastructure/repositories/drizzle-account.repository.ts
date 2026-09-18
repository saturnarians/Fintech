import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_DB, DrizzleDb } from '../database/connection';
import { accountsTable, AccountDbRow } from '../database/schema/accounts';
import { AccountEntity, AccountProps, AccountStatus } from '../../domain/account/entities/account.entity';
import { IAccountRepository } from '../../domain/account/ports/account.repository.port';

/**
 * ============================================================================
 * LEARNING NOTE: ACCOUNT REPOSITORY ADAPTER
 * ============================================================================
 * Implements IAccountRepository port with SQLite Drizzle queries.
 * Enforces atomic balance updates and persistence.
 */

@Injectable()
export class DrizzleAccountRepository implements IAccountRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  private toDomain(row: AccountDbRow): AccountEntity {
    return new AccountEntity({
      id: row.id,
      userId: row.userId,
      accountNumber: row.accountNumber,
      bankCode: row.bankCode,
      bankName: row.bankName,
      balance: row.balance,
      currency: row.currency,
      status: row.status as AccountStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<AccountEntity | null> {
    const rows = this.db.select().from(accountsTable).where(eq(accountsTable.id, id)).all();
    if (!rows.length) return null;
    return this.toDomain(rows[0]);
  }

  async findByUserId(userId: string): Promise<AccountEntity | null> {
    const rows = this.db.select().from(accountsTable).where(eq(accountsTable.userId, userId)).all();
    if (!rows.length) return null;
    return this.toDomain(rows[0]);
  }

  async findByAccountNumber(accountNumber: string): Promise<AccountEntity | null> {
    const rows = this.db.select().from(accountsTable).where(eq(accountsTable.accountNumber, accountNumber.trim())).all();
    if (!rows.length) return null;
    return this.toDomain(rows[0]);
  }

  async save(account: AccountEntity): Promise<AccountEntity> {
    const json = account.toJSON();
    const existing = await this.findById(account.id);

    if (existing) {
      this.db
        .update(accountsTable)
        .set({
          balance: json.balance,
          status: json.status,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(accountsTable.id, account.id))
        .run();
    } else {
      this.db
        .insert(accountsTable)
        .values({
          id: json.id,
          userId: json.userId,
          accountNumber: json.accountNumber,
          bankCode: json.bankCode,
          bankName: json.bankName,
          balance: json.balance,
          currency: json.currency,
          status: json.status,
          createdAt: json.createdAt,
          updatedAt: json.updatedAt,
        })
        .run();
    }

    const saved = await this.findById(account.id);
    return saved!;
  }

  async updateBalance(accountNumber: string, newBalance: number): Promise<void> {
    this.db
      .update(accountsTable)
      .set({
        balance: newBalance,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(accountsTable.accountNumber, accountNumber.trim()))
      .run();
  }

  async findAll(): Promise<AccountEntity[]> {
    const rows = this.db.select().from(accountsTable).all();
    return rows.map((r) => this.toDomain(r));
  }
}
