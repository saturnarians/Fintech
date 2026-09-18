import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * ============================================================================
 * LEARNING NOTE: TRANSACTION BOUNDED CONTEXT SCHEMA (AUDIT & DOUBLE ENTRY)
 * ============================================================================
 * Every financial movement must be immutably recorded for auditability.
 * Types:
 * - INITIAL_PREFUND: The ₦15,000 onboarding gift
 * - INTRA_BANK_TRANSFER: Direct ledger transfer between two accounts within our bank
 * - INTER_BANK_TRANSFER: Transfer routed via NIBSS by Phoenix to an external bank
 */

export const transactionsTable = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  reference: text('reference').notNull().unique(), // Internal UUID or TX-timestamp
  transactionType: text('transaction_type', {
    enum: ['INITIAL_PREFUND', 'INTRA_BANK_TRANSFER', 'INTER_BANK_TRANSFER'],
  }).notNull(),
  senderAccountNumber: text('sender_account_number'),
  recipientAccountNumber: text('recipient_account_number').notNull(),
  recipientBankCode: text('recipient_bank_code').notNull().default('260'),
  recipientAccountName: text('recipient_account_name').notNull(),
  amount: integer('amount').notNull(),
  fee: integer('fee').notNull().default(0),
  status: text('status', {
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
  }).notNull().default('SUCCESS'),
  narration: text('narration'),
  // NIBSS by Phoenix transaction ID (TSQ identifier, e.g. TX1776340463722)
  externalTransactionId: text('external_transaction_id'),
  failureReason: text('failure_reason'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export type TransactionDbRow = typeof transactionsTable.$inferSelect;
export type NewTransactionDbRow = typeof transactionsTable.$inferInsert;
