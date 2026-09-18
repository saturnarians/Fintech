import { InsufficientBalanceException } from '../../common/exceptions';

/**
 * ============================================================================
 * LEARNING NOTE: ACCOUNT DOMAIN ENTITY (RICH DOMAIN MODEL)
 * ============================================================================
 * An Aggregate Root in DDD. Contains business logic methods like debit & credit
 * so that state mutations are always guarded by invariants (e.g., cannot overdraft).
 */

export type AccountStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED';

export interface AccountProps {
  id: string;
  userId: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  balance: number;
  currency: string;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export class AccountEntity {
  private props: AccountProps;

  constructor(props: AccountProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get accountNumber(): string {
    return this.props.accountNumber;
  }

  get bankCode(): string {
    return this.props.bankCode;
  }

  get bankName(): string {
    return this.props.bankName;
  }

  get balance(): number {
    return this.props.balance;
  }

  get currency(): string {
    return this.props.currency;
  }

  get status(): AccountStatus {
    return this.props.status;
  }

  get createdAt(): string {
    return this.props.createdAt;
  }

  get updatedAt(): string {
    return this.props.updatedAt;
  }

  public debit(amount: number): void {
    if (amount <= 0) {
      throw new Error('Debit amount must be strictly greater than zero.');
    }
    if (this.props.balance < amount) {
      throw new InsufficientBalanceException(this.props.balance, amount);
    }
    this.props.balance -= amount;
    this.props.updatedAt = new Date().toISOString();
  }

  public credit(amount: number): void {
    if (amount <= 0) {
      throw new Error('Credit amount must be strictly greater than zero.');
    }
    this.props.balance += amount;
    this.props.updatedAt = new Date().toISOString();
  }

  public toJSON(): Record<string, any> {
    return { ...this.props };
  }
}
