import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';
import { createSqliteDb } from './connection';
import { usersTable } from './schema/users';
import { kycRecordsTable } from './schema/kyc';
import { accountsTable } from './schema/accounts';
import { transactionsTable } from './schema/transactions';
import { fintechConfigTable } from './schema/fintech';

/**
 * ============================================================================
 * LEARNING NOTE: DATABASE SEED SCRIPT (MOCKSEED.DATA LOADER)
 * ============================================================================
 * Reads JSON seed files from the "MockSeed.data" directory and populates
 * SQLite with initial:
 * 1. Fintech NIBSS configurations
 * 2. Simulated BVN & NIN records
 * 3. Default Admin & Customer users (with bcrypt hashed passwords)
 * 4. Pre-funded customer accounts (₦15,000 each)
 * 5. Initial welcome bonus audit transactions
 */

async function runSeed() {
  console.log('🌱 Starting Digital Banking Database Seeding...');

  const db = createSqliteDb();

  // Resolve MockSeed.data directory
  const possiblePaths = [
    path.resolve(__dirname, '../../../../MockSeed.data'),
    path.resolve(process.cwd(), '../../MockSeed.data'),
    path.resolve(process.cwd(), 'MockSeed.data'),
  ];

  let seedDir = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      seedDir = p;
      break;
    }
  }

  if (!seedDir) {
    console.error('❌ Could not locate "MockSeed.data" directory. Checked:', possiblePaths);
    process.exit(1);
  }

  console.log(`📁 Loading seed data from: ${seedDir}`);

  // 1. Seed Fintech Config
  const fintechFile = path.join(seedDir, 'fintech.seed.json');
  if (fs.existsSync(fintechFile)) {
    const { fintech } = JSON.parse(fs.readFileSync(fintechFile, 'utf8'));
    db.delete(fintechConfigTable).run();
    db.insert(fintechConfigTable)
      .values({
        id: 'fintech-001',
        name: fintech.name,
        email: fintech.email,
        apiKey: fintech.apiKey,
        apiSecret: fintech.apiSecret,
        bankCode: fintech.bankCode,
        bankName: fintech.bankName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .run();
    console.log(`✅ Seeded Fintech Configuration: ${fintech.name} (Bank Code: ${fintech.bankCode})`);
  }

  // 2. Clear existing records for clean seed
  db.delete(transactionsTable).run();
  db.delete(accountsTable).run();
  db.delete(kycRecordsTable).run();
  db.delete(usersTable).run();

  // 3. Seed Users
  const usersFile = path.join(seedDir, 'users.seed.json');
  if (fs.existsSync(usersFile)) {
    const usersData = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    for (const u of usersData) {
      const passwordHash = await bcrypt.hash(u.plainPassword, 10);
      db.insert(usersTable)
        .values({
          id: u.id,
          email: u.email,
          passwordHash,
          role: u.role,
          firstName: u.firstName,
          lastName: u.lastName,
          phone: u.phone,
          bvnOrNin: u.bvnOrNin,
          kycType: u.kycType,
          kycVerified: u.kycVerified ? true : false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .run();
    }
    console.log(`✅ Seeded ${usersData.length} Users (Admin & Customers)`);
  }

  // 4. Seed BVN & NIN KYC Records
  const bvnNinFile = path.join(seedDir, 'bvn-nin.seed.json');
  if (fs.existsSync(bvnNinFile)) {
    const { bvns, nins } = JSON.parse(fs.readFileSync(bvnNinFile, 'utf8'));
    let kycCount = 0;

    for (const b of bvns) {
      db.insert(kycRecordsTable)
        .values({
          id: `kyc-bvn-${b.bvn}`,
          idType: 'BVN',
          idNumber: b.bvn,
          firstName: b.firstName,
          lastName: b.lastName,
          dob: b.dob,
          phone: b.phone,
          isVerified: true,
          verifiedAt: new Date().toISOString(),
        })
        .run();
      kycCount++;
    }

    for (const n of nins) {
      db.insert(kycRecordsTable)
        .values({
          id: `kyc-nin-${n.nin}`,
          idType: 'NIN',
          idNumber: n.nin,
          firstName: n.firstName,
          lastName: n.lastName,
          dob: n.dob,
          isVerified: true,
          verifiedAt: new Date().toISOString(),
        })
        .run();
      kycCount++;
    }

    console.log(`✅ Seeded ${kycCount} BVN & NIN KYC verification records`);
  }

  // 5. Seed Accounts & Welcome Pre-funding Transactions
  const accountsFile = path.join(seedDir, 'accounts.seed.json');
  if (fs.existsSync(accountsFile)) {
    const accountsData = JSON.parse(fs.readFileSync(accountsFile, 'utf8'));
    for (const acc of accountsData) {
      db.insert(accountsTable)
        .values({
          id: acc.id,
          userId: acc.userId,
          accountNumber: acc.accountNumber,
          bankCode: acc.bankCode,
          bankName: acc.bankName,
          balance: acc.balance,
          currency: acc.currency,
          status: acc.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .run();

      // Log initial pre-funding deposit transaction
      db.insert(transactionsTable)
        .values({
          id: `tx-init-${acc.id}`,
          reference: `INIT-SEED-${acc.accountNumber}`,
          transactionType: 'INITIAL_PREFUND',
          senderAccountNumber: null,
          recipientAccountNumber: acc.accountNumber,
          recipientBankCode: acc.bankCode,
          recipientAccountName: 'Seed Customer',
          amount: acc.balance,
          fee: 0,
          status: 'SUCCESS',
          narration: 'Welcome Bonus - Initial ₦15,000 pre-funding',
          createdAt: new Date().toISOString(),
        })
        .run();
    }
    console.log(`✅ Seeded ${accountsData.length} Pre-funded Accounts (₦15,000 each)`);
  }

  console.log('🎉 Seeding completed successfully!');
}

runSeed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
