/**
 * ============================================================================
 * LEARNING NOTE: NIBSS TRANSFER & INQUIRY OUTBOUND PORT
 * ============================================================================
 * Ports decouple business logic from axios or third-party API implementation:
 * - GET /api/account/nameenquiry/{accountNumber}
 * - POST /api/transfer
 * - GET /api/transaction/{transactionId}
 */

export interface NameEnquiryResult {
  accountNumber: string;
  accountName: string;
  bankName: string;
}

export interface InterbankTransferParams {
  from: string;
  to: string;
  amount: number;
}

export interface InterbankTransferResult {
  message: string;
  transactionId: string;
  amount: number;
  from: string;
  to: string;
  status: string;
}

export interface TransactionStatusResult {
  transactionId: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  amount: number;
  from: string;
  to: string;
  timestamp: string;
}

export interface INibssTransferGateway {
  nameEnquiry(accountNumber: string): Promise<NameEnquiryResult>;
  transfer(params: InterbankTransferParams): Promise<InterbankTransferResult>;
  queryStatus(transactionId: string): Promise<TransactionStatusResult>;
}

export const NIBSS_TRANSFER_GATEWAY_TOKEN = Symbol('INibssTransferGateway');
