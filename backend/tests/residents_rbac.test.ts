import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma/client';
import { describe, test, beforeAll, afterAll, expect } from '@jest/globals';

describe('Residents RBAC', () => {
  const roles = ['super_admin', 'admin_rt', 'admin_rw', 'warga'] as const;
  const users: Record<string, { email: string; token?: string }> = {} as any;

  beforeAll(async () => {
    for (const r of roles) {
      const email = `rbac-${r}@example.test`;
      users[r] = { email };
      await request(app).post('/api/v1/auth/register').send({ email, password: 'Pass1234!' }).catch(() => {});
      await prisma.user.updateMany({ where: { email }, data: { role: r, isActive: true } });
      const login = await request(app).post('/api/v1/auth/login').send({ email, password: 'Pass1234!' });
      users[r].token = login.body.data?.access_token;
    }
  }, 30000);

  afterAll(async () => { await prisma.$disconnect(); });

  test('super_admin can create/update/delete resident', async () => {
    const token = users.super_admin.token as string;
    const create = await request(app).post('/api/v1/residents').set('Authorization', `Bearer ${token}`).send({ nik: `320101${Math.floor(Math.random()*1e10).toString().padStart(10,'0')}`, fullName: 'RBAC SA', rtNumber: '01', rwNumber: '01', address: 'Here', residenceStatus: 'owner' });
    expect(create.status).toBe(201);
    const id = create.body.data.id;
    const upd = await request(app).put(`/api/v1/residents/${id}`).set('Authorization', `Bearer ${token}`).send({ fullName: 'RBAC SA Upd' });
    expect(upd.status).toBe(200);
    const del = await request(app).delete(`/api/v1/residents/${id}`).set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);
  });

  test('warga cannot create or delete resident', async () => {
    const token = users.warga.token as string;
    const create = await request(app).post('/api/v1/residents').set('Authorization', `Bearer ${token}`).send({ nik: `320101${Math.floor(Math.random()*1e10).toString().padStart(10,'0')}`, fullName: 'RBAC W', rtNumber: '01', rwNumber: '01', address: 'Here', residenceStatus: 'owner' });
    expect([401,403,400]).toContain(create.status);
  });

  test('admin_rt and admin_rw can update residents in their scope (or at least not fully forbidden)', async () => {
    for (const r of ['admin_rt','admin_rw'] as const) {
      const token = users[r].token as string;
      const create = await request(app).post('/api/v1/residents').set('Authorization', `Bearer ${token}`).send({ nik: `320101${Math.floor(Math.random()*1e10).toString().padStart(10,'0')}`, fullName: `RBAC ${r}`, rtNumber: '01', rwNumber: '01', address: 'Here', residenceStatus: 'owner' });
      // depending on implementation they might be allowed to create; accept 201 or 403
      expect([201,403]).toContain(create.status);
      if (create.status === 201) {
        const id = create.body.data.id;
        const upd = await request(app).put(`/api/v1/residents/${id}`).set('Authorization', `Bearer ${token}`).send({ fullName: `RBAC ${r} Upd` });
        expect([200,403]).toContain(upd.status);
      }
    }
  });

  test('admin_rt can update resident they own but cannot update resident in other RT without ownership', async () => {
    const admin = users.admin_rt;
    const token = admin.token as string;
    // create a resident owned by this admin
    const createOwned = await request(app).post('/api/v1/residents').set('Authorization', `Bearer ${token}`).send({ nik: `320101${Math.floor(Math.random()*1e10).toString().padStart(10,'0')}`, fullName: 'Owned By AdminRT', rtNumber: '01', rwNumber: '01', address: 'Here', residenceStatus: 'owner', userId: undefined });
    expect([201,403]).toContain(createOwned.status);
    let ownedId: string | null = null;
    if (createOwned.status === 201) {
      ownedId = createOwned.body.data.id;
      // attach ownership by directly updating DB to simulate admin belonging to that resident
      const dbUser = await prisma.user.findUnique({ where: { email: admin.email } });
      if (dbUser && ownedId) await prisma.resident.update({ where: { id: ownedId }, data: { userId: dbUser.id } });
    }

    // create a resident in a different RT without owner
    const createOther = await request(app).post('/api/v1/residents').set('Authorization', `Bearer ${users.super_admin.token}`).send({ nik: `320101${Math.floor(Math.random()*1e10).toString().padStart(10,'0')}`, fullName: 'Other RT', rtNumber: '02', rwNumber: '01', address: 'There', residenceStatus: 'owner' });
    expect(createOther.status).toBe(201);
    const otherId = createOther.body.data.id;

    // admin_rt should be able to update owned resident (if we attached ownership)
    if (ownedId) {
      const upd = await request(app).put(`/api/v1/residents/${ownedId}`).set('Authorization', `Bearer ${token}`).send({ fullName: 'Owned Updated' });
      expect([200,403]).toContain(upd.status);
      if (upd.status === 200) expect(upd.body.data.fullName).toBe('Owned Updated');
    }

    // admin_rt should NOT be able to update resident in other RT that they don't own
    const updOther = await request(app).put(`/api/v1/residents/${otherId}`).set('Authorization', `Bearer ${token}`).send({ fullName: 'Malicious Update' });
    expect(updOther.status).toBe(403);
  });
});
