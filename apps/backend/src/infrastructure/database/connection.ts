import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import * as path from 'path';
import * as fs from 'fs';

/**
 * ============================================================================
 * LEARNING NOTE: DRIZZLE ORM + SQLITE CONNECTION PROVIDER
 * ============================================================================
 * Drizzle is a type-safe TypeScript ORM that generates no bloat.
 * Here we connect using better-sqlite3, creating tables automatically if needed,
 * enabling immediate zero-configuration local development.
 */

export const DRIZZLE_DB = Symbol('DRIZZLE_DB');

export function createSqliteDb(dbPath?: string) {
  const finalPath = dbPath || process.env.DATABASE_PATH || path.resolve(process.cwd(), 'banking.db');
  
  // Ensure directory exists
  const dir = path.dirname(finalPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const DatabaseConstructor: any = typeof Database === 'function' ? Database : (Database as any).default;
  const sqlite = new DatabaseConstructor(finalPath);
  // Enable WAL mode for better concurrency and performance
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  // Auto-create tables if they don't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'CUSTOMER',
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      bvn_or_nin TEXT,
      kyc_type TEXT,
      kyc_verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS kyc_records (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      id_type TEXT NOT NULL,
      id_number TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      dob TEXT NOT NULL,
      phone TEXT,
      is_verified INTEGER NOT NULL DEFAULT 1,
      verified_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      account_number TEXT NOT NULL UNIQUE,
      bank_code TEXT NOT NULL DEFAULT '260',
      bank_name TEXT NOT NULL DEFAULT 'PHC Bank',
      balance INTEGER NOT NULL DEFAULT 15000,
      currency TEXT NOT NULL DEFAULT 'NGN',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      reference TEXT NOT NULL UNIQUE,
      transaction_type TEXT NOT NULL,
      sender_account_number TEXT,
      recipient_account_number TEXT NOT NULL,
      recipient_bank_code TEXT NOT NULL DEFAULT '260',
      recipient_account_name TEXT NOT NULL,
      amount INTEGER NOT NULL,
      fee INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'SUCCESS',
      narration TEXT,
      external_transaction_id TEXT,
      failure_reason TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fintech_configs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      api_key TEXT NOT NULL,
      api_secret TEXT NOT NULL,
      bank_code TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      cached_token TEXT,
      token_expires_at INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  return drizzle(sqlite, { schema });
}

export type DrizzleDb = ReturnType<typeof createSqliteDb>;
