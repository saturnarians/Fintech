import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/modules/app.module';

/**
 * E2E: Account creation + core banking operations
 * Verifies: KYC gate, single-account rule, ₦15k pre-fund,
 * intra-bank transfer, inter-bank NIBSS routing, TSQ.
 */
describe('Account & Core Banking Operations (E2E)', () => {
  let app: INestApplication;
  let customer1Token: string;
  let customer2Token: string;
  let customer1AccountNo: string;
  let customer2AccountNo: string;

  beforeAll(async () => {
    process.env.USE_MOCK_NIBSS = 'true';
    process.env.DATABASE_PATH = ':memory:';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    // Seed two BVNs in mock NIBSS
    await request(app.getHttpServer())
      .post('/api/identity/insert-bvn')
      .send({ bvn: '11112222333', firstName: 'Alice', lastName: 'Banker', dob: '1995-05-10', phone: '08011112222' });

    await request(app.getHttpServer())
      .post('/api/identity/insert-bvn')
      .send({ bvn: '44445555666', firstName: 'Bob', lastName: 'Trader', dob: '1997-08-15', phone: '08044445555' });

    // Register and login Customer 1
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'alice@example.com', password: 'Password123!', firstName: 'Alice', lastName: 'Banker', phone: '08011112222' });

    const loginRes1 = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'Password123!' });
    customer1Token = loginRes1.body.accessToken;

    // Register and login Customer 2
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'bob@example.com', password: 'Password123!', firstName: 'Bob', lastName: 'Trader', phone: '08044445555' });

    const loginRes2 = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: 'Password123!' });
    customer2Token = loginRes2.body.accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('1. POST /api/accounts — rejects account creation if BVN is invalid', async () => {
    await request(app.getHttpServer())
      .post('/api/accounts')
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ kycType: 'BVN', kycID: '99999999999', dob: '1995-05-10' })
      .expect(400);
  });

  it('2. POST /api/accounts — creates account and pre-funds with ₦15,000 on valid KYC', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/accounts')
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ kycType: 'BVN', kycID: '11112222333', dob: '1995-05-10' })
      .expect(201);

    expect(res.body.message).toBe('Account created successfully');
    expect(res.body.balance).toBe(15000);
    expect(res.body.accountNumber).toMatch(/^260\d{7}$/);
    customer1AccountNo = res.body.accountNumber;

    // Create Bob's account
    const resBob = await request(app.getHttpServer())
      .post('/api/accounts')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({ kycType: 'BVN', kycID: '44445555666', dob: '1997-08-15' })
      .expect(201);

    customer2AccountNo = resBob.body.accountNumber;
    expect(resBob.body.balance).toBe(15000);
  });

  it('3. POST /api/accounts — enforces single account rule', async () => {
    await request(app.getHttpServer())
      .post('/api/accounts')
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ kycType: 'BVN', kycID: '11112222333', dob: '1995-05-10' })
      .expect(409);
  });

  it('4. GET /api/accounts/balance — returns current balance', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/accounts/balance')
      .set('Authorization', `Bearer ${customer1Token}`)
      .expect(200);

    expect(res.body.balance).toBe(15000);
    expect(res.body.accountNumber).toBe(customer1AccountNo);
  });

  it('5. GET /api/accounts/name-enquiry/:no — resolves account holder before transfer', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/accounts/name-enquiry/${customer2AccountNo}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .expect(200);

    expect(res.body.accountNumber).toBe(customer2AccountNo);
    expect(res.body.accountName).toBe('Bob Trader');
    expect(res.body.isInternal).toBe(true);
  });

  it('6. POST /api/transactions/transfer — intra-bank transfer updates both balances', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/transactions/transfer')
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ to: customer2AccountNo, amount: 5000, narration: 'E2E Intra Transfer' })
      .expect(201);

    expect(res.body.type).toBe('INTRA_BANK');
    expect(res.body.newBalance).toBe(10000);

    const bobBalance = await request(app.getHttpServer())
      .get('/api/accounts/balance')
      .set('Authorization', `Bearer ${customer2Token}`)
      .expect(200);
    expect(bobBalance.body.balance).toBe(20000);
  });

  it('7. POST /api/transactions/transfer — rejects when amount exceeds balance', async () => {
    await request(app.getHttpServer())
      .post('/api/transactions/transfer')
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ to: customer2AccountNo, amount: 25000 })
      .expect(400);
  });

  it('8. POST /api/transactions/transfer — inter-bank routes via NIBSS gateway', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/transactions/transfer')
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ to: '1087207670', amount: 3000, recipientBankCode: '108', narration: 'Interbank E2E' })
      .expect(201);

    expect(res.body.type).toBe('INTER_BANK');
    expect(res.body.externalTransactionId).toBeDefined();
    expect(res.body.newBalance).toBe(7000);
  });

  it('9. GET /api/transactions — returns transaction history', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/transactions')
      .set('Authorization', `Bearer ${customer1Token}`)
      .expect(200);

    expect(res.body.length).toBeGreaterThan(0);
    const txId = res.body[0].reference;

    const detail = await request(app.getHttpServer())
      .get(`/api/transactions/${txId}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .expect(200);

    expect(detail.body.reference).toBe(txId);
    expect(detail.body.status).toBe('SUCCESS');
  });
});
