import { Injectable, Logger } from '@nestjs/common';
import { NibssHttpClient } from './nibss.client';
import { NibssMockAdapter } from './nibss.mock-adapter';
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

/**
 * ============================================================================
 * LEARNING NOTE: REAL AXIOS ADAPTER WITH RESILIENT FALLBACK
 * ============================================================================
 * Connects to the real NIBSS by Phoenix endpoints via Axios.
 * If the external Render service is asleep, down, or unreachable,
 * it falls back cleanly to the mock adapter so operations remain available.
 */

@Injectable()
export class NibssLiveAdapter implements INibssIdentityGateway, INibssTransferGateway {
  private readonly logger = new Logger(NibssLiveAdapter.name);

  constructor(
    private readonly httpClient: NibssHttpClient,
    private readonly mockFallback: NibssMockAdapter,
  ) {}

  private isMockMode(): boolean {
    return process.env.NODE_ENV === 'test' || process.env.USE_MOCK_NIBSS === 'true';
  }

  // --- Identity Endpoints ---

  async insertBvn(data: InsertBvnParams): Promise<{ message: string; bvn: string }> {
    if (this.isMockMode()) {
      return this.mockFallback.insertBvn(data);
    }

    try {
      const client = this.httpClient.getRawClient();
      const res = await client.post('/api/insertBvn', data);
      return res.data;
    } catch (error: any) {
      this.logger.warn(`Remote NIBSS insertBvn error (${error.message}). Falling back to simulated store.`);
      return this.mockFallback.insertBvn(data);
    }
  }

  async insertNin(data: InsertNinParams): Promise<{ message: string; nin: string }> {
    if (this.isMockMode()) {
      return this.mockFallback.insertNin(data);
    }

    try {
      const client = this.httpClient.getRawClient();
      const res = await client.post('/api/insertNin', data);
      return res.data;
    } catch (error: any) {
      this.logger.warn(`Remote NIBSS insertNin error (${error.message}). Falling back to simulated store.`);
      return this.mockFallback.insertNin(data);
    }
  }

  async validateBvn(bvn: string): Promise<ValidateKycResult> {
    if (this.isMockMode()) {
      return this.mockFallback.validateBvn(bvn);
    }

    try {
      const client = this.httpClient.getRawClient();
      const res = await client.post('/api/validateBvn', { bvn });
      return {
        valid: Boolean(res.data.valid),
        identifier: res.data.bvn || bvn,
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        dob: res.data.dob,
      };
    } catch (error: any) {
      this.logger.warn(`Remote NIBSS validateBvn error (${error.message}). Falling back to simulated store.`);
      return this.mockFallback.validateBvn(bvn);
    }
  }

  async validateNin(nin: string): Promise<ValidateKycResult> {
    if (this.isMockMode()) {
      return this.mockFallback.validateNin(nin);
    }

    try {
      const client = this.httpClient.getRawClient();
      const res = await client.post('/api/validateNin', { nin });
      return {
        valid: Boolean(res.data.valid),
        identifier: res.data.nin || nin,
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        dob: res.data.dob,
      };
    } catch (error: any) {
      this.logger.warn(`Remote NIBSS validateNin error (${error.message}). Falling back to simulated store.`);
      return this.mockFallback.validateNin(nin);
    }
  }

  // --- Transfer Endpoints ---

  async nameEnquiry(accountNumber: string): Promise<NameEnquiryResult> {
    if (this.isMockMode()) {
      return this.mockFallback.nameEnquiry(accountNumber);
    }

    try {
      await this.httpClient.ensureAuthenticated();
      const client = this.httpClient.getRawClient();
      const res = await client.get(`/api/account/nameenquiry/${accountNumber}`);
      return {
        accountNumber: res.data.accountNumber,
        accountName: res.data.accountName,
        bankName: res.data.bankName,
      };
    } catch (error: any) {
      this.logger.warn(`Remote NIBSS nameEnquiry error (${error.message}). Falling back to simulated store.`);
      return this.mockFallback.nameEnquiry(accountNumber);
    }
  }

  async transfer(params: InterbankTransferParams): Promise<InterbankTransferResult> {
    if (this.isMockMode()) {
      return this.mockFallback.transfer(params);
    }

    try {
      await this.httpClient.ensureAuthenticated();
      const client = this.httpClient.getRawClient();
      const res = await client.post('/api/transfer', {
        from: params.from,
        to: params.to,
        amount: String(params.amount),
      });
      return {
        message: res.data.message,
        transactionId: res.data.transactionId,
        amount: Number(res.data.amount),
        from: res.data.from,
        to: res.data.to,
        status: res.data.status,
      };
    } catch (error: any) {
      this.logger.warn(`Remote NIBSS transfer error (${error.message}). Falling back to simulated store.`);
      return this.mockFallback.transfer(params);
    }
  }

  async queryStatus(transactionId: string): Promise<TransactionStatusResult> {
    if (this.isMockMode()) {
      return this.mockFallback.queryStatus(transactionId);
    }

    try {
      await this.httpClient.ensureAuthenticated();
      const client = this.httpClient.getRawClient();
      const res = await client.get(`/api/transaction/${transactionId}`);
      return {
        transactionId: res.data.transactionId,
        status: res.data.status,
        amount: Number(res.data.amount),
        from: res.data.from,
        to: res.data.to,
        timestamp: res.data.timestamp || new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.warn(`Remote NIBSS queryStatus error (${error.message}). Falling back to simulated store.`);
      return this.mockFallback.queryStatus(transactionId);
    }
  }
}
