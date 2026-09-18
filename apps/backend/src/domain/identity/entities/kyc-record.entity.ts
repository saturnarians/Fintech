import { KycType } from '../../user/entities/user.entity';

/**
 * ============================================================================
 * LEARNING NOTE: KYC RECORD DOMAIN ENTITY
 * ============================================================================
 * Represents verified identity data conforming to NIBSS specs.
 */

export interface KycRecordProps {
  id: string;
  userId?: string | null;
  idType: KycType;
  idNumber: string;
  firstName: string;
  lastName: string;
  dob: string;
  phone?: string | null;
  isVerified: boolean;
  verifiedAt: string;
}

export class KycRecordEntity {
  private props: KycRecordProps;

  constructor(props: KycRecordProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string | null | undefined {
    return this.props.userId;
  }

  get idType(): KycType {
    return this.props.idType;
  }

  get idNumber(): string {
    return this.props.idNumber;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get dob(): string {
    return this.props.dob;
  }

  get phone(): string | null | undefined {
    return this.props.phone;
  }

  get isVerified(): boolean {
    return this.props.isVerified;
  }

  get verifiedAt(): string {
    return this.props.verifiedAt;
  }

  public linkToUser(userId: string): void {
    this.props.userId = userId;
  }

  public toJSON(): Record<string, any> {
    return { ...this.props };
  }
}
