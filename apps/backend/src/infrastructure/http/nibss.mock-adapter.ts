import { Injectable } from '@nestjs/common';
import {
  INibssIdentityGateway,
  InsertBvnParams,
  InsertNinParams,
  ValidateKycResult,
} from '../../domain/identity/ports/nibss-identity.port';
import {
  INibssTransferGateway,
  InterbankTransferParams,
  InterbankTransferResult,
  NameEnquiryResult,
  TransactionStatusResult,
} from '../../domain/transaction/ports/nibss-transfer.port';
import * as fs from 'fs';
import * as path from 'path';

/**
 * ============================================================================
 * LEARNING NOTE: MOCK ADAPTER FOR ISOLATED TESTING & DEV
 * ============================================================================
 * Clean Architecture permits swapping the real Axios adapter with an in-memory
 * simulator conforming to the same domain Port.
 * This guarantees our automated test suite passes 100% deterministically
 * even when offline or when external endpoints are sleeping/down.
 */

@Injectable()
export class NibssMockAdapter implements INibssIdentityGateway, INibssTransferGateway {
  private bvns = new Map<string, { firstName: string; lastName: string; dob: string; phone: string }>();
  private nins = new Map<string, { firstName: string; lastName: string; dob: string }>();
  private externalAccounts = new Map<string, { accountName: string; bankName: string; balance: number }>();
  private transactions = new Map<string, TransactionStatusResult>();

  constructor() {
    this.seedFromFiles();
  }

  private seedFromFiles() {
    try {
      const bvnNinPath = path.resolve(process.cwd(), '../../MockSeed.data/bvn-nin.seed.json');
      const fallbackPath = path.resolve(process.cwd(), 'MockSeed.data/bvn-nin.seed.json');
      const targetPath = fs.existsSync(bvnNinPath) ? bvnNinPath : fallbackPath;

      if (fs.existsSync(targetPath)) {
        const data = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
        if (data.bvns) {
          for (const item of data.bvns) {
            this.bvns.set(item.bvn, item);
          }
        }
        if (data.nins) {
          for (const item of data.nins) {
            this.nins.set(item.nin, item);
          }
        }
      }
    } catch {
      // Fallback defaults
    }

    // Default mock data if file not found
    if (this.bvns.size === 0) {
      this.bvns.set('10840712847', {
        firstName: 'Onyekachi',
        lastName: 'Obute',
        dob: '2005-04-04',
        phone: '07869584455',
      });
      this.bvns.set('10872076701', {
        firstName: 'John',
        lastName: 'Oloruntobi',
        dob: '2002-11-15',
        phone: '08012345678',
      });
    }

    if (this.nins.size === 0) {
      this.nins.set('10840712847', {
        firstName: 'Onyekachi',
        lastName: 'Obute',
        dob: '2005-04-04',
      });
      this.nins.set('55443322110', {
        firstName: 'Jude',
        lastName: 'Ani',
        dob: '2003-08-20',
      });
    }

    // External colleague accounts for inter-bank transfer testing
    this.externalAccounts.set('1087207670', {
      accountName: 'John Oloruntobi',
      bankName: 'KAC Bank 9263',
      balance: 50000,
    });
    this.externalAccounts.set('9998887770', {
      accountName: 'Colleague Account',
      bankName: 'Apex Bank',
      balance: 100000,
    });
  }

  // --- Identity Port Methods ---
  async insertBvn(data: InsertBvnParams): Promise<{ message: string; bvn: string }> {
    this.bvns.set(data.bvn, {
      firstName: data.firstName,
      lastName: data.lastName,
      dob: data.dob,
      phone: data.phone,
    });
    return {
      message: 'BVN record created successfully',
      bvn: data.bvn,
    };
  }

  async insertNin(data: InsertNinParams): Promise<{ message: string; nin: string }> {
    this.nins.set(data.nin, {
      firstName: data.firstName,
      lastName: data.lastName,
      dob: data.dob,
    });
    return {
      message: 'NIN record created successfully',
      nin: data.nin,
    };
  }

  async validateBvn(bvn: string): Promise<ValidateKycResult> {
    const record = this.bvns.get(bvn.trim());
    if (!record) {
      return { valid: false, identifier: bvn };
    }
    return {
      valid: true,
      identifier: bvn,
      firstName: record.firstName,
      lastName: record.lastName,
      dob: record.dob,
    };
  }

  async validateNin(nin: string): Promise<ValidateKycResult> {
    const record = this.nins.get(nin.trim());
    if (!record) {
      return { valid: false, identifier: nin };
    }
    return {
      valid: true,
      identifier: nin,
      firstName: record.firstName,
      lastName: record.lastName,
      dob: record.dob,
    };
  }

  // --- Transfer Port Methods ---
  async nameEnquiry(accountNumber: string): Promise<NameEnquiryResult> {
    const record = this.externalAccounts.get(accountNumber.trim());
    if (record) {
      return {
        accountNumber,
        accountName: record.accountName,
        bankName: record.bankName,
      };
    }
    return {
      accountNumber,
      accountName: 'External Account Holder',
      bankName: 'NIBSS Partner Bank',
    };
  }

  async transfer(params: InterbankTransferParams): Promise<InterbankTransferResult> {
    const txId = `TX${Date.now()}`;
    const result: InterbankTransferResult = {
      message: 'Transfer successful',
      transactionId: txId,
      amount: params.amount,
      from: params.from,
      to: params.to,
      status: 'SUCCESS',
    };

    this.transactions.set(txId, {
      transactionId: txId,
      status: 'SUCCESS',
      amount: params.amount,
      from: params.from,
      to: params.to,
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  async queryStatus(transactionId: string): Promise<TransactionStatusResult> {
    const tx = this.transactions.get(transactionId);
    if (tx) return tx;

    return {
      transactionId,
      status: 'SUCCESS',
      amount: 0,
      from: '',
      to: '',
      timestamp: new Date().toISOString(),
    };
  }
}
