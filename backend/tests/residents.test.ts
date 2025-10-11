import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma/client';

describe('Residents CRUD', () => {
  let createdId: string;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    // ensure seed data is present
    // ensure an admin account exists and is active
    await request(app).post('/api/v1/auth/register').send({ email: 'admin-test@example.test', password: 'Admin123!' });
    // make sure it's a super_admin and active (use prisma to update)
    await prisma.user.updateMany({ where: { email: 'admin-test@example.test' }, data: { role: 'super_admin', isActive: true } });
    const loginAdmin = await request(app).post('/api/v1/auth/login').send({ email: 'admin-test@example.test', password: 'Admin123!' });
    adminToken = loginAdmin.body.data?.access_token;

    // create a normal user for negative auth tests
    await request(app).post('/api/v1/auth/register').send({ email: 'user2@example.test', password: 'User123!' });
    await prisma.user.updateMany({ where: { email: 'user2@example.test' }, data: { isActive: true } });
    const loginUser = await request(app).post('/api/v1/auth/login').send({ email: 'user2@example.test', password: 'User123!' });
    userToken = loginUser.body.data?.access_token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('create resident - success', async () => {
  const res = await request(app).post('/api/v1/residents').set('Authorization', `Bearer ${adminToken}`).send({
      // NIK must be 16 digits: 6-digit area code + 10-digit unique
      nik: `320101${Math.floor(Math.random() * 1e10).toString().padStart(10, '0')}`,
      fullName: 'Test Resident',
      rtNumber: '03',
      rwNumber: '04',
      address: 'Jl. Test No.1',
      residenceStatus: 'owner',
    });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    createdId = res.body.data.id;
  });

  test('create resident - invalid nik fails', async () => {
  const res = await request(app).post('/api/v1/residents').set('Authorization', `Bearer ${adminToken}`).send({ nik: '123', fullName: 'Bad NIK', rtNumber: '01', rwNumber: '01', address: 'nowhere', residenceStatus: 'owner' });
    expect(res.status).toBe(400);
  });

  test('update resident - forbidden for non-owner', async () => {
    // create resident owned by nobody
  const create = await request(app).post('/api/v1/residents').set('Authorization', `Bearer ${adminToken}`).send({ nik: `320101${Math.floor(Math.random() * 1e10).toString().padStart(10, '0')}`, fullName: 'Other', rtNumber: '01', rwNumber: '01', address: 'nowhere', residenceStatus: 'owner' });
    const id = create.body.data.id;
    const res = await request(app).put(`/api/v1/residents/${id}`).set('Authorization', `Bearer ${userToken}`).send({ fullName: 'Hacked' });
    expect(res.status).toBe(403);
  });

  test('update resident - allowed for admin', async () => {
  const create = await request(app).post('/api/v1/residents').set('Authorization', `Bearer ${adminToken}`).send({ nik: `320101${Math.floor(Math.random() * 1e10).toString().padStart(10, '0')}`, fullName: 'Other2', rtNumber: '01', rwNumber: '01', address: 'nowhere', residenceStatus: 'owner' });
  const id = create.body.data.id;
  const res = await request(app).put(`/api/v1/residents/${id}`).set('Authorization', `Bearer ${adminToken}`).send({ fullName: 'AdminUpdated' });
  expect(res.status).toBe(200);
  });

  test('get resident - success', async () => {
  const res = await request(app).get(`/api/v1/residents/${createdId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdId);
  });

  test('update resident - success', async () => {
  const res = await request(app).put(`/api/v1/residents/${createdId}`).set('Authorization', `Bearer ${adminToken}`).send({ fullName: 'Updated Name' });
    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe('Updated Name');
  });

  test('delete resident - success', async () => {
  const res = await request(app).delete(`/api/v1/residents/${createdId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(204);
  });
});
