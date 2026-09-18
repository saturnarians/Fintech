import { z } from 'zod';

/**
 * ============================================================================
 * LEARNING NOTE: CLIENT-SIDE ZOD VALIDATION SCHEMAS
 * ============================================================================
 * Validating inputs on the client using Zod prevents unnecessary network calls
 * and provides instant UI feedback before hitting NestJS ZodValidationPipes.
 */

export const RegisterFormSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  bvnOrNin: z.string().regex(/^\d{11}$/, 'BVN or NIN must be exactly 11 digits').optional().or(z.literal('')),
  kycType: z.enum(['BVN', 'NIN']).optional(),
});

export type RegisterFormValues = z.infer<typeof RegisterFormSchema>;

export const LoginFormSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof LoginFormSchema>;

export const BvnNinFormSchema = z.object({
  kycType: z.enum(['BVN', 'NIN']),
  kycID: z.string().regex(/^\d{11}$/, 'KYC ID (BVN/NIN) must be exactly 11 digits'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
});

export type BvnNinFormValues = z.infer<typeof BvnNinFormSchema>;

export const CreateAccountFormSchema = z.object({
  kycType: z.enum(['BVN', 'NIN']),
  kycID: z.string().regex(/^\d{11}$/, 'KYC ID must be 11 digits'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD'),
});

export type CreateAccountFormValues = z.infer<typeof CreateAccountFormSchema>;

export const TransferFormSchema = z.object({
  to: z.string().regex(/^\d{10}$/, 'Recipient account number must be 10 digits'),
  amount: z.number().min(100, 'Minimum transfer amount is ₦100'),
  recipientBankCode: z.string().default('260'),
  recipientAccountName: z.string().optional(),
  narration: z.string().optional(),
});

export type TransferFormValues = z.infer<typeof TransferFormSchema>;
