import { z } from 'zod';

/**
 * ============================================================================
 * LEARNING NOTE: NIBSS IDENTITY ONBOARDING ZOD SCHEMAS & DTOS
 * ============================================================================
 * Mirrors NIBSS by Phoenix endpoint specifications:
 * - Insert BVN (11 digits, firstName, lastName, dob, phone)
 * - Insert NIN (11 digits, firstName, lastName, dob)
 * - Validate BVN (11 digits)
 * - Validate NIN (11 digits)
 */

export const InsertBvnSchema = z.object({
  bvn: z.string().regex(/^\d{11}$/, 'BVN must be exactly 11 digits'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must follow YYYY-MM-DD format'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
});

export type InsertBvnDto = z.infer<typeof InsertBvnSchema>;

export const InsertNinSchema = z.object({
  nin: z.string().regex(/^\d{11}$/, 'NIN must be exactly 11 digits'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must follow YYYY-MM-DD format'),
});

export type InsertNinDto = z.infer<typeof InsertNinSchema>;

export const ValidateBvnSchema = z.object({
  bvn: z.string().regex(/^\d{11}$/, 'BVN must be exactly 11 digits'),
});

export type ValidateBvnDto = z.infer<typeof ValidateBvnSchema>;

export const ValidateNinSchema = z.object({
  nin: z.string().regex(/^\d{11}$/, 'NIN must be exactly 11 digits'),
});

export type ValidateNinDto = z.infer<typeof ValidateNinSchema>;
