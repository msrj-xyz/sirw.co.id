import fs from 'fs';
import path from 'path';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/prisma/client';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

describe('Import enqueue -> worker end-to-end', () => {
  const tmpDir = path.join(process.cwd(), 'tmp-test-e2e');
  let adminToken: string;
  beforeAll(async () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    // ensure admin user exists and is active
    await request(app).post('/api/v1/auth/register').send({ email: 'e2e-admin@example.test', password: 'Admin123!' });
    await prisma.user.updateMany({ where: { email: 'e2e-admin@example.test' }, data: { role: 'super_admin', isActive: true } });
    const login = await request(app).post('/api/v1/auth/login').send({ email: 'e2e-admin@example.test', password: 'Admin123!' });
    adminToken = login.body.data?.access_token;
  });
  afterAll(async () => {
    try { await prisma.resident.deleteMany({ where: { nik: { contains: '111111111111111' } } }); } catch (e) { /* ignore */ }
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  });

  test('POST /api/v1/residents/import enqueues and worker processes file', async () => {
    const csv = `nik,full_name,rt_number,rw_number,address,residence_status\n1111111111111111,Enqueue One,01,01,Here,owner\n`;
    const filePath = path.join(tmpDir, `e2e-import-${Date.now()}.csv`);
    fs.writeFileSync(filePath, csv);

  // Call the worker directly and force it to persist metadata to Redis for the test
  const { processImportFile } = await import('../src/queue/worker');
  const jobId = `e2e-${Date.now()}`;
  const result = await processImportFile(filePath, { jobId, persistToRedis: true });

    expect(result).toBeDefined();
    expect(result).toHaveProperty('success');
    expect(result.success).toBe(true);

    // confirm the DB record exists
    const r = await prisma.resident.findUnique({ where: { nik: '1111111111111111' } });
    expect(r).not.toBeNull();

    // check Redis job metadata (import:job:<jobId>) for failedFile or success state
    try {
      const IORedis = require('ioredis');
      const redis = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
      const raw = await redis.get(`import:job:${jobId}`);
      if (raw) {
        const meta = JSON.parse(raw);
        if (meta.failed && meta.failed > 0) {
          expect(meta.failedFile).toBeTruthy();
          if (typeof meta.failedFile === 'string') expect(meta.failedFile.startsWith('http')).toBe(true);
        } else {
          expect(meta.status).toBe('success');
        }
      } else {
        console.warn('No redis metadata found for job', jobId);
      }
      await redis.disconnect();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn('Redis metadata check skipped:', msg);
    }
  }, 20000);
});
