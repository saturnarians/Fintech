import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * ============================================================================
 * LEARNING NOTE: FINTECH NIBSS INTEGRATION CONFIG SCHEMA
 * ============================================================================
 * Holds the credentials assigned by NIBSS by Phoenix:
 * - apiKey & apiSecret: returned from /api/fintech/onboard
 * - bankCode: assigned code (e.g. 260)
 * - bankName: assigned name (e.g. PHC Bank)
 * - cachedToken & tokenExpiresAt: stores the active NIBSS Bearer JWT
 */

export const fintechConfigTable = sqliteTable('fintech_configs', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  apiKey: text('api_key').notNull(),
  apiSecret: text('api_secret').notNull(),
  bankCode: text('bank_code').notNull(),
  bankName: text('bank_name').notNull(),
  cachedToken: text('cached_token'),
  tokenExpiresAt: integer('token_expires_at'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export type FintechConfigDbRow = typeof fintechConfigTable.$inferSelect;
export type NewFintechConfigDbRow = typeof fintechConfigTable.$inferInsert;
