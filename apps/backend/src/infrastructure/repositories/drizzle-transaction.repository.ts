import { Injectable, Inject } from '@nestjs/common';
import { eq, or, desc } from 'drizzle-orm';
import { DRIZZLE_DB, DrizzleDb } from '../database/connection';
import { transactionsTable, TransactionDbRow } from '../database/schema/transactions';
import {
  TransactionEntity,
  TransactionProps,
  TransactionType,
  TransactionStatus,
} from '../../domain/transaction/entities/transaction.entity';
import { ITransactionRepository } from '../../domain/transaction/ports/transaction.repository.port';

/**
 * ============================================================================
 * LEARNING NOTE: TRANSACTION REPOSITORY ADAPTER
 * ============================================================================
 * Implements ITransactionRepository port with SQLite Drizzle queries.
 * Ensures data isolation queries for customer transaction history.
 */

@Injectable()
export class DrizzleTransactionRepository implements ITransactionRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  private toDomain(row: TransactionDbRow): TransactionEntity {
    return new TransactionEntity({
      id: row.id,
      reference: row.reference,
      transactionType: row.transactionType as TransactionType,
      senderAccountNumber: row.senderAccountNumber,
      recipientAccountNumber: row.recipientAccountNumber,
      recipientBankCode: row.recipientBankCode,
      recipientAccountName: row.recipientAccountName,
      amount: row.amount,
      fee: row.fee,
      status: row.status as TransactionStatus,
      narration: row.narration,
      externalTransactionId: row.externalTransactionId,
      failureReason: row.failureReason,
      createdAt: row.createdAt,
    });
  }

  async findById(id: string): Promise<TransactionEntity | null> {
    const rows = this.db.select().from(transactionsTable).where(eq(transactionsTable.id, id)).all();
    if (!rows.length) return null;
    return this.toDomain(rows[0]);
  }

  async findByReference(reference: string): Promise<TransactionEntity | null> {
    const rows = this.db.select().from(transactionsTable).where(eq(transactionsTable.reference, reference)).all();
    if (!rows.length) return null;
    return this.toDomain(rows[0]);
  }

  async findByExternalId(externalId: string): Promise<TransactionEntity | null> {
    const rows = this.db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.externalTransactionId, externalId))
      .all();
    if (!rows.length) return null;
    return this.toDomain(rows[0]);
  }

  async findByAccountNumber(accountNumber: string): Promise<TransactionEntity[]> {
    const rows = this.db
      .select()
      .from(transactionsTable)
      .where(
        or(
          eq(transactionsTable.senderAccountNumber, accountNumber),
          eq(transactionsTable.recipientAccountNumber, accountNumber),
        ),
      )
      .orderBy(desc(transactionsTable.createdAt))
      .all();

    return rows.map((r) => this.toDomain(r));
  }

  async save(transaction: TransactionEntity): Promise<TransactionEntity> {
    const json = transaction.toJSON();
    const existing = await this.findById(transaction.id);

    if (existing) {
      await this.update(transaction);
    } else {
      this.db
        .insert(transactionsTable)
        .values({
          id: json.id,
          reference: json.reference,
          transactionType: json.transactionType,
          senderAccountNumber: json.senderAccountNumber,
          recipientAccountNumber: json.recipientAccountNumber,
          recipientBankCode: json.recipientBankCode,
          recipientAccountName: json.recipientAccountName,
          amount: json.amount,
          fee: json.fee,
          status: json.status,
          narration: json.narration,
          externalTransactionId: json.externalTransactionId,
          failureReason: json.failureReason,
          createdAt: json.createdAt,
        })
        .run();
    }

    const saved = await this.findById(transaction.id);
    return saved!;
  }

  async update(transaction: TransactionEntity): Promise<void> {
    const json = transaction.toJSON();
    this.db
      .update(transactionsTable)
      .set({
        status: json.status,
        externalTransactionId: json.externalTransactionId,
        failureReason: json.failureReason,
      })
      .where(eq(transactionsTable.id, transaction.id))
      .run();
  }

  async findAll(): Promise<TransactionEntity[]> {
    const rows = this.db.select().from(transactionsTable).orderBy(desc(transactionsTable.createdAt)).all();
    return rows.map((r) => this.toDomain(r));
  }
}
