/**
 * ============================================================================
 * LEARNING NOTE: OUTBOUND GATEWAY PORT (NIBSS IDENTITY)
 * ============================================================================
 * Hexagonal contract for calling NIBSS by Phoenix simulated endpoints:
 * - POST /api/insertBvn
 * - POST /api/insertNin
 * - POST /api/validateBvn
 * - POST /api/validateNin
 */

export interface InsertBvnParams {
  bvn: string;
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
}

export interface InsertNinParams {
  nin: string;
  firstName: string;
  lastName: string;
  dob: string;
}

export interface ValidateKycResult {
  valid: boolean;
  identifier: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
}

export interface INibssIdentityGateway {
  insertBvn(data: InsertBvnParams): Promise<{ message: string; bvn: string }>;
  insertNin(data: InsertNinParams): Promise<{ message: string; nin: string }>;
  validateBvn(bvn: string): Promise<ValidateKycResult>;
  validateNin(nin: string): Promise<ValidateKycResult>;
}

export const NIBSS_IDENTITY_GATEWAY_TOKEN = Symbol('INibssIdentityGateway');
