import { AccountEntity } from '../../src/domain/account/entities/account.entity';
import { InsufficientBalanceException } from '../../src/domain/common/exceptions';

describe('AccountEntity (Domain Core)', () => {
  const createTestAccount = (balance = 15000) =>
    new AccountEntity({
      id: 'acc-test-1',
      userId: 'usr-1',
      accountNumber: '2601234567',
      bankCode: '260',
      bankName: 'PHC Bank',
      balance,
      currency: 'NGN',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

  it('should initialize with initial pre-funded balance of ₦15,000', () => {
    const account = createTestAccount(15000);
    expect(account.balance).toBe(15000);
    expect(account.accountNumber).toBe('2601234567');
    expect(account.status).toBe('ACTIVE');
  });

  it('should successfully credit funds to account', () => {
    const account = createTestAccount(15000);
    account.credit(5000);
    expect(account.balance).toBe(20000);
  });

  it('should successfully debit funds when balance is sufficient', () => {
    const account = createTestAccount(15000);
    account.debit(5000);
    expect(account.balance).toBe(10000);
  });

  it('should throw InsufficientBalanceException when debiting more than available balance', () => {
    const account = createTestAccount(15000);
    expect(() => account.debit(25000)).toThrow(InsufficientBalanceException);
  });

  it('should throw error when debiting negative or zero amount', () => {
    const account = createTestAccount(15000);
    expect(() => account.debit(0)).toThrow('Debit amount must be strictly greater than zero.');
    expect(() => account.debit(-100)).toThrow('Debit amount must be strictly greater than zero.');
  });
});
