import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * ============================================================================
 * LEARNING NOTE: DOMAIN-DRIVEN DESIGN & HEXAGONAL ARCHITECTURE (SCHEMA LAYER)
 * ============================================================================
 * In Hexagonal Architecture (Ports and Adapters), the database schema belongs
 * to the INFRASTRUCTURE layer. The core domain does not depend on Drizzle;
 * instead, Drizzle maps relational SQLite tables to Domain Entities.
 *
 * This table stores authentication credentials, KYC status, and RBAC roles.
 */

export const usersTable = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['ADMIN', 'CUSTOMER'] }).notNull().default('CUSTOMER'),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone').notNull(),
  // KYC identifier: BVN or NIN (11-digit string)
  bvnOrNin: text('bvn_or_nin'),
  kycType: text('kyc_type', { enum: ['BVN', 'NIN'] }),
  kycVerified: integer('kyc_verified', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export type UserDbRow = typeof usersTable.$inferSelect;
export type NewUserDbRow = typeof usersTable.$inferInsert;
