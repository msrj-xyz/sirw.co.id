import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma/client';
import { generateOtp } from '../src/services/otp';
import { createPasswordReset } from '../src/services/passwordReset';

describe('Auth extras and User profile', () => {
  let token: string;
  let userId: string;
  const email = 'profile-test@example.test';
  const password = 'Password123!';

  beforeAll(async () => {
    // ensure user exists and is active
    await request(app).post('/api/v1/auth/register').send({ email, password }).catch(() => {});
    await prisma.user.updateMany({ where: { email }, data: { isActive: true } });
    const login = await request(app).post('/api/v1/auth/login').send({ email, password });
  token = login.body.data?.access_token;
  const dbUser = await prisma.user.findUnique({ where: { email } });
  expect(dbUser).not.toBeNull();
  userId = login.body.data?.user?.id || dbUser!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('forgot-password accepts and returns success', async () => {
    const res = await request(app).post('/api/v1/auth/forgot-password').send({ email });
    expect(res.status).toBe(200);
  });

  test('reset-password with token works', async () => {
    const token = createPasswordReset(userId);
    const newPass = 'NewPass123!';
    const res = await request(app).post('/api/v1/auth/reset-password').send({ token, password: newPass });
    expect(res.status).toBe(200);

    // Login with new password
    const login = await request(app).post('/api/v1/auth/login').send({ email, password: newPass });
    expect(login.status).toBe(200);
  });

  test('send-otp and verify-otp flow', async () => {
    const key = 'otp-profile-key';
    const send = await request(app).post('/api/v1/auth/send-otp').send({ key, method: 'email', to: email });
    expect(send.status).toBe(200);
    const code = generateOtp(key); // use service to create/obtain code
    const verify = await request(app).post('/api/v1/auth/verify-otp').send({ key, code });
    expect(verify.status).toBe(200);
  });

  test('verify-email marks user as verified', async () => {
    const verify = await request(app).post('/api/v1/auth/verify-email').send({ email, token: userId });
    expect(verify.status).toBe(200);
  const u = await prisma.user.findUnique({ where: { email } });
  expect(u).not.toBeNull();
  expect(u!.emailVerified).toBe(true);
  });

  test('social/google returns access token', async () => {
    const res = await request(app).post('/api/v1/auth/social/google').send({ token: 'social-token-123' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('access_token');
  });

  test('GET /users/me returns profile', async () => {
    const res = await request(app).get('/api/v1/users/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('id');
  });

  test('PATCH /users/me updates profile', async () => {
    const res = await request(app).patch('/api/v1/users/me').set('Authorization', `Bearer ${token}`).send({ phone: '081234567890' });
    expect(res.status).toBe(200);
    expect(res.body.data.phone).toBe('081234567890');
  });

  test('change password works and allows new login', async () => {
    // change back to known password
    const res = await request(app).post('/api/v1/users/me/password').set('Authorization', `Bearer ${token}`).send({ currentPassword: 'NewPass123!', newPassword: password });
    expect(res.status).toBe(200);

    const login = await request(app).post('/api/v1/auth/login').send({ email, password });
    expect(login.status).toBe(200);
  });
});
