import fs from 'fs';
import path from 'path';
import prisma from '../src/prisma/client';
import { processImportFile } from '../src/queue/worker';
import getRedisClient from '../src/services/redisClient';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

describe('Residents import worker', () => {
  const tmpDir = path.join(process.cwd(), 'tmp-test');
  beforeAll(() => { fs.mkdirSync(tmpDir, { recursive: true }); });
  afterAll(async () => {
    // cleanup created residents with test NIK prefix and tmp files
    try { await prisma.resident.deleteMany({ where: { nik: { contains: '000000000000000' } } }); } catch (e) { /* ignore */ }
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  });

  test('processImportFile creates residents and writes job metadata', async () => {
    const csv = `nik,full_name,rt, rw, address, residence_status\n0000000000000001,Test One,01,01,Somewhere,owner\n0000000000000002,Test Two,01,01,Somewhere,tenant\n`;
    const filePath = path.join(tmpDir, `test-import-${Date.now()}.csv`);
    fs.writeFileSync(filePath, csv);

    const result = await processImportFile(filePath, { jobId: 'test-1' });
    expect(result).toHaveProperty('success');
    // check DB for created residents
    const r1 = await prisma.resident.findUnique({ where: { nik: '0000000000000001' } });
    const r2 = await prisma.resident.findUnique({ where: { nik: '0000000000000002' } });
    expect(r1).not.toBeNull();
    expect(r2).not.toBeNull();

    // check redis meta if available (optional)
    const redis = getRedisClient();
    if (redis && typeof (redis as any).get === 'function') {
      const raw = await (redis as any).get('import:job:test-1');
      expect(raw).toBeTruthy();
    }
  }, 20000);
});
