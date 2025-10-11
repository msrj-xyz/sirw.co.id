import fs from 'fs';
import path from 'path';
import prisma from '../src/prisma/client';
import { processImportFile } from '../src/queue/worker';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

describe('Import worker -> GCS failed rows upload', () => {
  const tmpDir = path.join(process.cwd(), 'tmp-gcs-test');
  const preNik = '9999000000000000';
  beforeAll(async () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    // create a resident that will cause a unique constraint failure during import
    try {
      await prisma.resident.create({ data: { nik: preNik, fullName: 'Preexisting', rtNumber: '01', rwNumber: '01', address: 'Here', residenceStatus: 'owner' } });
    } catch (e) {
      // ignore if already exists
    }
  });

  afterAll(async () => {
    try { await prisma.resident.deleteMany({ where: { nik: { contains: preNik } } }); } catch (e) { /* ignore */ }
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  });

  test('processImportFile uploads failed rows to GCS and returns signed URL', async () => {
    const csv = `nik,full_name,rt_number,rw_number,address,residence_status\n${preNik},Duplicate,01,01,Here,owner\n`;
    const filePath = path.join(tmpDir, `gcs-import-${Date.now()}.csv`);
    fs.writeFileSync(filePath, csv);

    const result = await processImportFile(filePath, { jobId: 'gcs-test-1' });

    expect(result).toHaveProperty('success');
    expect(result.success).toBe(false);
    expect(result).toHaveProperty('failed');
    expect(result.failed).toBeGreaterThan(0);
    expect(result).toHaveProperty('failedFile');
    expect(result.failedFile).toBeTruthy();
    expect(typeof result.failedFile).toBe('string');
    // failedFile should be a GCS signed URL (starts with http) when upload succeeded
    if (typeof result.failedFile === 'string') {
      expect(result.failedFile.startsWith('http')).toBe(true);
    } else {
      // defensive: fail the test if not a string
      throw new Error('failedFile is not a string');
    }
  }, 20000);
});
