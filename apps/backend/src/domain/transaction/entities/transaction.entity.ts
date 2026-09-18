/**
 * ============================================================================
 * LEARNING NOTE: TRANSACTION DOMAIN ENTITY
 * ============================================================================
 * Immutably tracks every financial interaction.
 * Statuses:
 * - PENDING: Interbank transfer dispatched to NIBSS, awaiting TSQ confirmation
 * - SUCCESS: Transfer settled and balances adjusted
 * - FAILED: Transfer rejected (insufficient funds, invalid recipient, network error)
 */

export type TransactionType = 'INITIAL_PREFUND' | 'INTRA_BANK_TRANSFER' | 'INTER_BANK_TRANSFER';
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface TransactionProps {
  id: string;
  reference: string;
  transactionType: TransactionType;
  senderAccountNumber?: string | null;
  recipientAccountNumber: string;
  recipientBankCode: string;
  recipientAccountName: string;
  amount: number;
  fee: number;
  status: TransactionStatus;
  narration?: string | null;
  externalTransactionId?: string | null;
  failureReason?: string | null;
  createdAt: string;
}

export class TransactionEntity {
  private props: TransactionProps;

  constructor(props: TransactionProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get reference(): string {
    return this.props.reference;
  }

  get transactionType(): TransactionType {
    return this.props.transactionType;
  }

  get senderAccountNumber(): string | null | undefined {
    return this.props.senderAccountNumber;
  }

  get recipientAccountNumber(): string {
    return this.props.recipientAccountNumber;
  }

  get recipientBankCode(): string {
    return this.props.recipientBankCode;
  }

  get recipientAccountName(): string {
    return this.props.recipientAccountName;
  }

  get amount(): number {
    return this.props.amount;
  }

  get fee(): number {
    return this.props.fee;
  }

  get status(): TransactionStatus {
    return this.props.status;
  }

  get narration(): string | null | undefined {
    return this.props.narration;
  }

  get externalTransactionId(): string | null | undefined {
    return this.props.externalTransactionId;
  }

  get failureReason(): string | null | undefined {
    return this.props.failureReason;
  }

  get createdAt(): string {
    return this.props.createdAt;
  }

  public markSuccess(externalTxId?: string): void {
    this.props.status = 'SUCCESS';
    if (externalTxId) {
      this.props.externalTransactionId = externalTxId;
    }
  }

  public markFailed(reason: string): void {
    this.props.status = 'FAILED';
    this.props.failureReason = reason;
  }

  public toJSON(): Record<string, any> {
    return { ...this.props };
  }
}
