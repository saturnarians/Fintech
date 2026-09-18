import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { usersTable } from './users';

/**
 * ============================================================================
 * LEARNING NOTE: ACCOUNT BOUNDED CONTEXT SCHEMA
 * ============================================================================
 * Business Rules enforced at the database and application levels:
 * 1. Single Account Rule: `userId` has a UNIQUE constraint, preventing any
 *    customer from having more than 1 account.
 * 2. Pre-funding: Default balance is 15000 (₦15,000 NGN).
 * 3. 10-digit NUBAN: `accountNumber` is unique across the entire banking system.
 */

export const accountsTable = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => usersTable.id, { onDelete: 'cascade' }),
  accountNumber: text('account_number', { length: 10 }).notNull().unique(),
  bankCode: text('bank_code').notNull().default('260'),
  bankName: text('bank_name').notNull().default('PHC Bank'),
  // Stored in Naira (e.g. 15000). For financial systems, integer minor units or high precision are best.
  balance: integer('balance').notNull().default(15000),
  currency: text('currency').notNull().default('NGN'),
  status: text('status', { enum: ['ACTIVE', 'FROZEN', 'CLOSED'] }).notNull().default('ACTIVE'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export type AccountDbRow = typeof accountsTable.$inferSelect;
export type NewAccountDbRow = typeof accountsTable.$inferInsert;
