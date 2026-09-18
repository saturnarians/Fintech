import { z } from 'zod';

/**
 * ============================================================================
 * LEARNING NOTE: ZOD VALIDATION SCHEMAS & DTOS (AUTH BOUNDED CONTEXT)
 * ============================================================================
 * Zod provides runtime schema validation + compile-time TypeScript type inference.
 * This guarantees strict type safety at the boundary of our application.
 */

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  // Simulated BVN or NIN (must be 11 digits)
  bvnOrNin: z.string().regex(/^\d{11}$/, 'BVN or NIN must be exactly 11 digits').optional(),
  kycType: z.enum(['BVN', 'NIN']).optional(),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginDto = z.infer<typeof LoginSchema>;

export interface AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    fullName: string;
    kycVerified: boolean;
    bvnOrNin?: string | null;
  };
}
