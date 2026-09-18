import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { usersTable } from './users';

/**
 * ============================================================================
 * LEARNING NOTE: KYC VERIFICATION ENTITY SCHEMA
 * ============================================================================
 * NIBSS by Phoenix enforces that:
 * 1. BVN/NIN must be registered or validated before account creation.
 * 2. Real BVN/NIN is strictly forbidden in training.
 * 3. KYC records link customer identities to verified biometric data.
 */

export const kycRecordsTable = sqliteTable('kyc_records', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => usersTable.id, { onDelete: 'cascade' }),
  idType: text('id_type', { enum: ['BVN', 'NIN'] }).notNull(),
  idNumber: text('id_number').notNull(), // 11-digit BVN or NIN
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  dob: text('dob').notNull(), // Format: YYYY-MM-DD
  phone: text('phone'),
  isVerified: integer('is_verified', { mode: 'boolean' }).notNull().default(true),
  verifiedAt: text('verified_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export type KycDbRow = typeof kycRecordsTable.$inferSelect;
export type NewKycDbRow = typeof kycRecordsTable.$inferInsert;
