import { z } from 'zod';

/**
 * ============================================================================
 * LEARNING NOTE: TRANSACTION BOUNDED CONTEXT ZOD SCHEMAS & DTOS
 * ============================================================================
 * Handles both intra-bank (within our bank) and inter-bank (via NIBSS) transfers.
 * Name enquiry should be performed before initiating transfer.
 */

export const TransferSchema = z.object({
  to: z.string().regex(/^\d{10}$/, 'Recipient account number must be 10 digits'),
  amount: z.number().positive('Transfer amount must be greater than zero').min(10, 'Minimum transfer amount is ₦10'),
  recipientBankCode: z.string().optional().default('260'),
  recipientAccountName: z.string().optional(),
  narration: z.string().max(100, 'Narration must not exceed 100 characters').optional(),
});

export type TransferDto = z.infer<typeof TransferSchema>;

export const TransactionQueryParamSchema = z.object({
  id: z.string().min(1, 'Transaction ID or Reference is required'),
});

export type TransactionQueryParamDto = z.infer<typeof TransactionQueryParamSchema>;

export interface TransactionResponseDto {
  id: string;
  reference: string;
  transactionType: string;
  senderAccountNumber?: string | null;
  recipientAccountNumber: string;
  recipientBankCode: string;
  recipientAccountName: string;
  amount: number;
  fee: number;
  status: string;
  narration?: string | null;
  externalTransactionId?: string | null;
  createdAt: string;
}
