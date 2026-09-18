import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/modules/app.module';

/**
 * E2E: Auth & KYC onboarding flow
 * Uses mock NIBSS + in-memory SQLite for isolation
 */
describe('Auth & KYC Flow (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.USE_MOCK_NIBSS = 'true';
    process.env.DATABASE_PATH = ':memory:';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('1. POST /api/identity/insert-bvn — registers simulated BVN', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/identity/insert-bvn')
      .send({
        bvn: '22233445577',
        firstName: 'Ada',
        lastName: 'Lovelace',
        dob: '2000-01-01',
        phone: '08099887766',
      })
      .expect(201);

    expect(res.body.message).toBe('BVN record created successfully');
    expect(res.body.bvn).toBe('22233445577');
  });

  it('2. POST /api/identity/validate-bvn — validates BVN against NIBSS', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/identity/validate-bvn')
      .send({ bvn: '22233445577' })
      .expect(201);

    expect(res.body.valid).toBe(true);
    expect(res.body.firstName).toBe('Ada');
  });

  it('3. POST /api/auth/register — registers a new bank customer', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'ada.lovelace@example.com',
        password: 'Password123!',
        firstName: 'Ada',
        lastName: 'Lovelace',
        phone: '08099887766',
      })
      .expect(201);

    expect(res.body.email).toBe('ada.lovelace@example.com');
    expect(res.body.role).toBe('CUSTOMER');
  });

  it('4. POST /api/auth/login — authenticates customer and returns JWT', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'ada.lovelace@example.com',
        password: 'Password123!',
      })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('ada.lovelace@example.com');
  });
});
