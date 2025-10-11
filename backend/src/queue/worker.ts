import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import prisma from '../prisma/client';
import { residentsImportQueue } from './index';
// Use generated Prisma types for strict typing of create inputs and enums when available
import { log } from '../lib/logger';
import getRedisClient from '../services/redisClient';
import { uploadFile } from '../services/gcs';

type ImportJobData = { filePath: string; originalName?: string; initiatedBy?: string };

export async function processImportFile(filePath: string, opts?: { jobId?: string | number; progress?: (n: number) => Promise<void> | void; persistToRedis?: boolean }) {
  const failedRows: Array<{ record: Record<string, string>; error: string }> = [];
  let processed = 0;

  // create the read stream and attach error handlers so any ENOENT or stream errors
  // don't bubble as unhandled exceptions which can crash the process
  const fileStream = fs.createReadStream(filePath);
  fileStream.on('error', (e) => {
    log.error('File read stream error in processImportFile', e instanceof Error ? e.message : String(e));
  });
  const parser = fileStream.pipe(parse({ columns: true, skip_empty_lines: true, trim: true }));
  // parser can emit errors as well; ensure we log them to avoid uncaught exceptions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (parser as any).on('error', (e: unknown) => {
    log.error('CSV parser emitted error in processImportFile', e instanceof Error ? e.message : String(e));
  });

  for await (const record of parser as AsyncIterable<Record<string, string>>) {
    processed++;
    const mapped = {
      nik: record['nik'] ?? record['NIK'] ?? record['nik_number'] ?? undefined,
      kkNumber: record['kk_number'] ?? record['kk'] ?? undefined,
      fullName: record['full_name'] ?? record['fullName'] ?? record['name'] ?? undefined,
      birthDate: record['birth_date'] ?? record['birthDate'] ?? undefined,
      birthPlace: record['birth_place'] ?? record['birthPlace'] ?? undefined,
      gender: record['gender'] ?? undefined,
      rtNumber: record['rt_number'] ?? record['rt'] ?? undefined,
      rwNumber: record['rw_number'] ?? record['rw'] ?? undefined,
      address: record['address'] ?? undefined,
      residenceStatus: record['residence_status'] ?? record['residenceStatus'] ?? 'owner',
      email: record['email'] ?? undefined,
      phone: record['phone'] ?? undefined,
    };

    try {
      // build a typed create input for Prisma
      // keep the minimal required fields for ResidentCreateInput
      // import type dynamically from @prisma/client via type import
      // sanitize and coerce values
      const candidateResidence = String(mapped.residenceStatus ?? 'owner');
      const residenceStatus = (['owner', 'tenant', 'boarding'].includes(candidateResidence) ? (candidateResidence as any) : ('owner' as any));

      // local minimal typing for create input to avoid fragile imports of generated types
      interface LocalResidentCreateInput {
        nik: string;
        kkNumber?: string | null;
        fullName: string;
        birthDate?: string | null;
        birthPlace?: string | null;
        gender?: string | null;
        rtNumber: string;
        rwNumber: string;
        address: string;
        residenceStatus: 'owner' | 'tenant' | 'boarding';
        email?: string | null;
        phone?: string | null;
      }

      const createInput: LocalResidentCreateInput = {
        nik: String(mapped.nik ?? ''),
        kkNumber: mapped.kkNumber ? String(mapped.kkNumber) : undefined,
        fullName: String(mapped.fullName ?? ''),
        birthDate: mapped.birthDate ? String(mapped.birthDate) : undefined,
        birthPlace: mapped.birthPlace ? String(mapped.birthPlace) : undefined,
        gender: mapped.gender ? String(mapped.gender) : undefined,
        rtNumber: String(mapped.rtNumber ?? ''),
        rwNumber: String(mapped.rwNumber ?? ''),
        address: String(mapped.address ?? ''),
        residenceStatus,
        email: mapped.email ? String(mapped.email) : undefined,
        phone: mapped.phone ? String(mapped.phone) : undefined,
      };

  // Prisma generated types are finicky to import in this module; use a narrow, scoped any here
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.resident.create({ data: createInput as any });
    } catch (err) {
      failedRows.push({ record, error: err instanceof Error ? err.message : String(err) });
    }

    // update progress periodically
    if (processed % 50 === 0 && opts?.progress) await opts.progress(Math.round((processed / 1) * 100));
  }

  // write failed rows to tmp and optionally upload to GCS
  const redis = getRedisClient();
  if (failedRows.length > 0) {
    const outDir = path.join(process.cwd(), 'tmp');
    const outPath = path.join(outDir, `import-failed-${opts?.jobId ?? 'unknown'}.json`);
    try {
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify(failedRows, null, 2));
    } catch (e) {
      log.error('Failed to write failed rows', e instanceof Error ? e.message : String(e));
    }

    let failedUrl: string | null = null;
    try {
      const destName = `imports/failed-${opts?.jobId ?? 'unknown'}.json`;
      const url = await uploadFile(outPath, destName);
      if (url) failedUrl = url;
    } catch (e) {
      log.error('GCS upload failed', e instanceof Error ? e.message : String(e));
    }

    // store job metadata in redis if available. allow forcing persistence via opts.persistToRedis
    try {
      const meta = { status: 'failed', processed, failed: failedRows.length, failedFile: failedUrl ?? outPath };
      const shouldPersist = typeof opts?.persistToRedis === 'boolean' ? opts?.persistToRedis : (process.env.NODE_ENV !== 'test');
      if (shouldPersist) {
        type RedisSettable = { set?: (key: string, value: string) => Promise<unknown> | unknown } | null;
        const redisClient = redis as unknown as RedisSettable;
        if (redisClient && typeof redisClient.set === 'function') await redisClient.set(`import:job:${opts?.jobId ?? 'unknown'}`, JSON.stringify(meta));
      }
    } catch (e) {
      log.error('Failed to write job metadata to redis', e instanceof Error ? e.message : String(e));
    }

    return { success: false, processed, failed: failedRows.length, failedFile: failedUrl ?? outPath };
  }

  // success: store success metadata
  try {
    const shouldPersist = typeof opts?.persistToRedis === 'boolean' ? opts?.persistToRedis : (process.env.NODE_ENV !== 'test');
    if (shouldPersist) {
      type RedisSettable = { set?: (key: string, value: string) => Promise<unknown> | unknown } | null;
      const redisClient = redis as unknown as RedisSettable;
      if (redisClient && typeof redisClient.set === 'function') await redisClient.set(`import:job:${opts?.jobId ?? 'unknown'}`, JSON.stringify({ status: 'success', processed, failed: 0 }));
    }
  } catch (e) {
    log.error('Failed to write job metadata to redis', e instanceof Error ? e.message : String(e));
  }

  return { success: true, processed, failed: 0 };
}

// wire the queue to use the above helper so the queue behavior is unchanged
residentsImportQueue.process(async (job: { id: string | number; data: ImportJobData; progress?: (n: number) => void | Promise<void> }) => {
  const data = job.data as ImportJobData;
  return processImportFile(data.filePath, { jobId: job.id as string | number, progress: job.progress?.bind(job) });
});

// handle queue errors
residentsImportQueue.on('error', (err: Error) => {
  log.error('Residents import queue error', err instanceof Error ? err.message : String(err));
});

// graceful shutdown helper
export async function shutdownWorker() {
  try { await residentsImportQueue.close(); } catch (e) { /* ignore */ }
}
