import request from 'supertest';
import app from '../src/app';

describe('Auth endpoints', () => {
  const random = Math.random().toString(36).slice(2, 8);
  const email = `test+${random}@example.test`;
  const password = 'Test1234!';

  test('register -> login -> refresh', async () => {
    // register
    const reg = await request(app).post('/api/v1/auth/register').send({ email, password, fullName: 'Test User' });
    expect(reg.status).toBe(201);

    // login
    const login = await request(app).post('/api/v1/auth/login').send({ email, password });
    expect(login.status).toBe(200);
    expect(login.body.data).toHaveProperty('access_token');
    const access = login.body.data.access_token;
    const refresh = login.body.data.refresh_token;

    // refresh
    const ref = await request(app).post('/api/v1/auth/refresh').send({ refresh_token: refresh });
    expect(ref.status).toBe(200);
    expect(ref.body.data).toHaveProperty('access_token');
  }, 20000);
});
