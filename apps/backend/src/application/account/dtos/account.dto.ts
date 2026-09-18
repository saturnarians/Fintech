import { z } from 'zod';

/**
 * ============================================================================
 * LEARNING NOTE: ACCOUNT BOUNDED CONTEXT ZOD SCHEMAS & DTOS
 * ============================================================================
 * Required by NIBSS by Phoenix:
 * - kycType: 'BVN' or 'NIN'
 * - kycID: 11-digit BVN or NIN
 * - dob: Date of birth (YYYY-MM-DD)
 */

export const CreateAccountSchema = z.object({
  kycType: z.enum(['BVN', 'NIN', 'bvn', 'nin']).transform((val) => val.toUpperCase() as 'BVN' | 'NIN'),
  kycID: z.string().regex(/^\d{11}$/, 'KYC ID (BVN/NIN) must be exactly 11 digits'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format'),
});

export type CreateAccountDto = z.infer<typeof CreateAccountSchema>;

export const NameEnquiryParamSchema = z.object({
  accountNumber: z.string().regex(/^\d{10}$/, 'Account number must be a 10-digit NUBAN string'),
});

export type NameEnquiryParamDto = z.infer<typeof NameEnquiryParamSchema>;

export interface AccountResponseDto {
  id: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  balance: number;
  currency: string;
  status: string;
  createdAt: string;
}
