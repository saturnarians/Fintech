/**
 * ============================================================================
 * LEARNING NOTE: FRONTEND TYPE DEFINITIONS & DTOS
 * ============================================================================
 * Clean Hexagonal Monolith Architecture ensures type parity between NestJS backend
 * and Next.js frontend. These interfaces match NestJS DTO responses verbatim.
 */

export interface User {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  kycVerified: boolean;
  bvnOrNin?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Account {
  id?: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  balance: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  reference: string;
  transactionType: 'INITIAL_PREFUND' | 'INTRA_BANK_TRANSFER' | 'INTER_BANK_TRANSFER';
  senderAccountNumber?: string | null;
  recipientAccountNumber: string;
  recipientBankCode: string;
  recipientAccountName: string;
  amount: number;
  fee: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  narration?: string;
  externalTransactionId?: string;
  failureReason?: string;
  createdAt: string;
}

export interface NameEnquiryResponse {
  accountNumber: string;
  accountName: string;
  bankName: string;
  bankCode?: string;
  isInternal?: boolean;
}

export interface TransferResponse {
  message: string;
  transactionId: string;
  externalTransactionId?: string;
  amount: number;
  from: string;
  to: string;
  recipientName: string;
  status: string;
  type: string;
  newBalance: number;
}
