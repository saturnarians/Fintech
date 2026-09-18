import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/modules/app.module';

describe('RBAC & Strict Data Privacy (E2E)', () => {
  let app: INestApplication;
  let adminToken: string;
  let customerAToken: string;
  let customerBToken: string;
  let customerBSecretTxId: string;

  beforeAll(async () => {
    process.env.USE_MOCK_NIBSS = 'true';
    process.env.DATABASE_PATH = ':memory:';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    // 1. Register Admin User
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'superadmin@phcbank.com',
        password: 'AdminPassword123!',
        firstName: 'Super',
        lastName: 'Admin',
        phone: '08000000000',
      });

    // Manually elevate to ADMIN in database for testing RBAC
    const { DRIZZLE_DB } = require('../../src/infrastructure/database/connection');
    const db = app.get(DRIZZLE_DB);
    const { usersTable } = require('../../src/infrastructure/database/schema/users');
    const { eq } = require('drizzle-orm');
    db.update(usersTable)
      .set({ role: 'ADMIN' })
      .where(eq(usersTable.email, 'superadmin@phcbank.com'))
      .run();

    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'superadmin@phcbank.com', password: 'AdminPassword123!' });
    adminToken = adminLogin.body.accessToken;

    // 2. Register Customer A
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'customera@example.com',
        password: 'CustomerPass123!',
        firstName: 'Customer',
        lastName: 'Alpha',
        phone: '08011111111',
      })
      .expect(201);

    const loginA = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'customera@example.com', password: 'CustomerPass123!' })
      .expect(201);
    customerAToken = loginA.body.accessToken;

    // 3. Register Customer B
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'customerb@example.com',
        password: 'CustomerPass123!',
        firstName: 'Customer',
        lastName: 'Beta',
        phone: '08022222222',
      })
      .expect(201);

    const loginB = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'customerb@example.com', password: 'CustomerPass123!' })
      .expect(201);
    customerBToken = loginB.body.accessToken;

    // 4. Seed BVNs for both
    await request(app.getHttpServer())
      .post('/api/identity/insert-bvn')
      .send({
        bvn: '77788899911',
        firstName: 'Customer',
        lastName: 'Alpha',
        dob: '1990-01-01',
        phone: '08011111111',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/identity/insert-bvn')
      .send({
        bvn: '77788899922',
        firstName: 'Customer',
        lastName: 'Beta',
        dob: '1992-02-02',
        phone: '08022222222',
      })
      .expect(201);

    // 5. Create accounts for both
    await request(app.getHttpServer())
      .post('/api/accounts')
      .set('Authorization', `Bearer ${customerAToken}`)
      .send({ kycType: 'BVN', kycID: '77788899911', dob: '1990-01-01' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/accounts')
      .set('Authorization', `Bearer ${customerBToken}`)
      .send({ kycType: 'BVN', kycID: '77788899922', dob: '1992-02-02' })
      .expect(201);

    // Customer B makes a private interbank transfer
    const bTransfer = await request(app.getHttpServer())
      .post('/api/transactions/transfer')
      .set('Authorization', `Bearer ${customerBToken}`)
      .send({
        to: '1087207670',
        amount: 1500,
        narration: 'Confidential Payment by B',
      });

    customerBSecretTxId = bTransfer.body.transactionId;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('1. RBAC: Customer is forbidden (403) from accessing admin account listing', async () => {
    await request(app.getHttpServer())
      .get('/api/accounts')
      .set('Authorization', `Bearer ${customerAToken}`)
      .expect(403);
  });

  it('2. RBAC: Admin is authorized (200) to view all bank accounts', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/accounts')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('3. Data Privacy: Customer A transaction history contains ONLY Customer A transactions', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/transactions')
      .set('Authorization', `Bearer ${customerAToken}`)
      .expect(200);

    // Customer A should only have their own initial deposit, not Customer B's confidential transfer
    const hasCustomerBTx = res.body.some(
      (tx: any) => tx.reference === customerBSecretTxId || tx.narration === 'Confidential Payment by B',
    );
    expect(hasCustomerBTx).toBe(false);
  });

  it('4. Data Privacy: Customer A attempting to inspect Customer B\'s transaction receives 403 Forbidden', async () => {
    await request(app.getHttpServer())
      .get(`/api/transactions/${customerBSecretTxId}`)
      .set('Authorization', `Bearer ${customerAToken}`)
      .expect(403);
  });

  it('5. Data Privacy: Admin is permitted to inspect any transaction', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/transactions/${customerBSecretTxId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.reference).toBe(customerBSecretTxId);
  });
});
