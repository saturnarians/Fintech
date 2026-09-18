/**
 * ============================================================================
 * LEARNING NOTE: USER DOMAIN ENTITY & ROLE DEFINITION
 * ============================================================================
 * An Entity has a unique identity and lifecycle.
 * Roles:
 * - 'CUSTOMER': Standard bank customer (can view own account, transfers, history)
 * - 'ADMIN': Bank admin / auditor (can view all accounts, perform seed, query system)
 */

export type UserRole = 'ADMIN' | 'CUSTOMER';
export type KycType = 'BVN' | 'NIN';

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone: string;
  bvnOrNin?: string | null;
  kycType?: KycType | null;
  kycVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export class UserEntity {
  private props: UserProps;

  constructor(props: UserProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`.trim();
  }

  get phone(): string {
    return this.props.phone;
  }

  get bvnOrNin(): string | null | undefined {
    return this.props.bvnOrNin;
  }

  get kycType(): KycType | null | undefined {
    return this.props.kycType;
  }

  get isKycVerified(): boolean {
    return this.props.kycVerified;
  }

  get createdAt(): string {
    return this.props.createdAt;
  }

  get updatedAt(): string {
    return this.props.updatedAt;
  }

  // Domain behavior: verify KYC
  public markKycVerified(idType: KycType, idNumber: string): void {
    this.props.kycType = idType;
    this.props.bvnOrNin = idNumber;
    this.props.kycVerified = true;
    this.props.updatedAt = new Date().toISOString();
  }

  public toJSON(): Record<string, any> {
    return {
      id: this.props.id,
      email: this.props.email,
      role: this.props.role,
      firstName: this.props.firstName,
      lastName: this.props.lastName,
      fullName: this.fullName,
      phone: this.props.phone,
      bvnOrNin: this.props.bvnOrNin,
      kycType: this.props.kycType,
      kycVerified: this.props.kycVerified,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
