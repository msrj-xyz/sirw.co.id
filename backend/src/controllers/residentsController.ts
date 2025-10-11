import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { log } from '../lib/logger';
import fs from 'fs';
import { parse } from 'csv-parse';
import { residentCreateSchema } from '../validators/resident';
import { ZodError, ZodIssue } from 'zod';

type UserPayload = { sub: string; role: string };

function pick(obj: Record<string, unknown>, keys: string[]) {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined) out[k] = obj[k];
  return out;
}

export async function createResident(req: Request, res: Response) {
  const { nik, fullName, rtNumber, rwNumber, address, userId } = req.body;
  // only admin roles allowed (admin_rt, admin_rw, super_admin)
  const actor = (req as unknown as { user?: UserPayload }).user;
  if (!actor) return res.status(401).json({ status: 'error', error: { message: 'Unauthorized' } });
  if (!['admin_rt', 'admin_rw', 'super_admin'].includes(actor.role)) {
    return res.status(403).json({ status: 'error', error: { message: 'Forbidden' } });
  }
  if (!nik || !fullName) return res.status(400).json({ status: 'error', error: { message: 'nik and fullName required' } });
  try {
    const r = await prisma.resident.create({ data: { nik, fullName, rtNumber: rtNumber ?? '', rwNumber: rwNumber ?? '', address: address ?? '', userId: userId ?? null, residenceStatus: 'owner' } });
    return res.status(201).json({ status: 'success', data: r });
  } catch (err) {
  log.error(err instanceof Error ? err.message : String(err));
    const e = err as { code?: string };
    if (e?.code === 'P2002') return res.status(409).json({ status: 'error', error: { message: 'Resident with same NIK exists' } });
    return res.status(500).json({ status: 'error', error: { message: 'Internal error' } });
  }
}

export async function listResidents(req: Request, res: Response) {
  // Permissions: only admin_rt, admin_rw, super_admin can list
  const actor = (req as unknown as { user?: UserPayload }).user;
  if (!actor) return res.status(401).json({ status: 'error', error: { message: 'Unauthorized' } });
  if (!['admin_rt', 'admin_rw', 'super_admin'].includes(actor.role)) {
    return res.status(403).json({ status: 'error', error: { message: 'Forbidden' } });
  }

  const page = Math.max(1, parseInt(String(req.query.page || '1')));
  const limitVal = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'))));
  const limit = limitVal;
  const skip = (page - 1) * limit;

  // build where
  const where: Record<string, unknown> = { deletedAt: null };
  // filters are sent as filter[rt_number], filter[rw_number], filter[residence_status], filter[is_active]
  if (req.query['filter[rt_number]']) where.rtNumber = String(req.query['filter[rt_number]']);
  if (req.query['filter[rw_number]']) where.rwNumber = String(req.query['filter[rw_number]']);
  if (req.query['filter[residence_status]']) where.residenceStatus = String(req.query['filter[residence_status]']);
  if (req.query['filter[is_active]'] !== undefined) where.isActive = String(req.query['filter[is_active]']) === 'true';

  // search by name, nik, address
  const search = req.query.search ? String(req.query.search).trim() : '';

  // sorting e.g. sort=full_name or sort=-created_at
  let orderBy: Record<string, 'asc' | 'desc'> | Record<string, unknown> = { createdAt: 'desc' };
  if (req.query.sort) {
    const s = String(req.query.sort);
    const desc = s.startsWith('-');
    const field = (desc ? s.slice(1) : s).replace(/-/g, '').replace(/\./g, '');
    const map: Record<string, string> = { full_name: 'fullName', created_at: 'createdAt' };
    const mapped = map[field] ?? field;
    orderBy = { [mapped]: desc ? 'desc' : 'asc' };
  }

  // Compose prisma query
  type PrismaWhere = { AND: Array<Record<string, unknown>> };
  const prismaWhere: PrismaWhere = { AND: [where] };
  if (search) {
    prismaWhere.AND.push({ OR: [{ fullName: { contains: search, mode: 'insensitive' } }, { nik: { contains: search } }, { address: { contains: search, mode: 'insensitive' } }] });
  }

  const [items, total] = await Promise.all([
    prisma.resident.findMany({ where: prismaWhere, skip, take: limit, orderBy }),
    prisma.resident.count({ where: prismaWhere }),
  ]);

  return res.json({ status: 'success', data: { items, pagination: { page, limit, total, total_pages: Math.ceil(total / limit), has_next: skip + items.length < total, has_prev: page > 1 } } });
}

export async function getResident(req: Request, res: Response) {
  const id = req.params.id;
  const actor = (req as unknown as { user?: UserPayload }).user;
  if (!actor) return res.status(401).json({ status: 'error', error: { message: 'Unauthorized' } });

  const r = await prisma.resident.findUnique({ where: { id } });
  if (!r) return res.status(404).json({ status: 'error', error: { message: 'Resident not found' } });

  // Permission: warga can view own data; admin roles can view all
  if (actor.role === 'warga') {
    if (!r.userId || actor.sub !== r.userId) return res.status(403).json({ status: 'error', error: { message: 'Forbidden' } });
  }

  return res.json({ status: 'success', data: r });
}

export async function updateResident(req: Request, res: Response) {
  const id = req.params.id;
  const allowed = ['fullName', 'rtNumber', 'rwNumber', 'address', 'email', 'phone', 'occupation', 'education', 'residenceStatus', 'isActive'];
  const data = pick(req.body, allowed);
  // authorization: only super_admin or owner (userId) can update
  const actor = (req as unknown as { user?: UserPayload }).user;
  const target = await prisma.resident.findUnique({ where: { id }, select: { userId: true } });
  if (!actor) return res.status(401).json({ status: 'error', error: { message: 'Unauthorized' } });
  // If resident has an owner, only that owner or super_admin can modify.
  // If resident has no owner, only super_admin can modify.
  const isOwner = !!target?.userId && actor.sub === target?.userId;
  if (actor.role !== 'super_admin' && !isOwner) {
    return res.status(403).json({ status: 'error', error: { message: 'Forbidden' } });
  }
  try {
    const updated = await prisma.resident.update({ where: { id }, data });
    return res.json({ status: 'success', data: updated });
  } catch (err) {
    const e = err as { code?: string };
    if (e?.code === 'P2025') return res.status(404).json({ status: 'error', error: { message: 'Resident not found' } });
    return res.status(500).json({ status: 'error', error: { message: 'Internal error' } });
  }
}

export async function deleteResident(req: Request, res: Response) {
  const id = req.params.id;
  const actor = (req as unknown as { user?: UserPayload }).user;
  const target = await prisma.resident.findUnique({ where: { id }, select: { userId: true } });
  if (!actor) return res.status(401).json({ status: 'error', error: { message: 'Unauthorized' } });
  const isOwnerDel = !!target?.userId && actor.sub === target?.userId;
  if (actor.role !== 'super_admin' && !isOwnerDel) {
    return res.status(403).json({ status: 'error', error: { message: 'Forbidden' } });
  }
  try {
    await prisma.resident.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    return res.status(204).send();
  } catch (err) {
    const e = err as { code?: string };
    if (e?.code === 'P2025') return res.status(404).json({ status: 'error', error: { message: 'Resident not found' } });
    return res.status(500).json({ status: 'error', error: { message: 'Internal error' } });
  }
}

// CSV preview: validate rows and return per-row errors without inserting
export async function importPreview(req: Request, res: Response) {
  // only accept multipart with multer -> file is at req.file.path
  const file = (req as unknown as { file?: Express.Multer.File }).file;
  if (!file) return res.status(400).json({ status: 'error', error: { message: 'file required' } });

  const maxRows = parseInt(String(process.env.IMPORT_MAX_ROWS || '5000'));
  const results: Array<{ row: number; errors: Array<{ field?: string; message: string }>; raw: Record<string, string> }> = [];
  let total = 0;
  let valid = 0;
  let invalid = 0;

  const parser = fs.createReadStream(file.path).pipe(parse({ columns: true, skip_empty_lines: true, trim: true }));

  // stream rows
  let rowNum = 1; // header counted as not a data row
  try {
    for await (const rawRecord of parser as AsyncIterable<Record<string, string>>) {
      const record: Record<string, string> = rawRecord;
      total++;
      rowNum++;
      if (total > maxRows) {
        results.push({ row: rowNum, raw: record, errors: [{ message: `row limit exceeded, max ${maxRows}` }] });
        invalid++;
        break;
      }

      // normalize keys: allow various header names
      const mapped: Record<string, unknown> = {
        nik: record['nik'] ?? record['NIK'] ?? record['nik_number'] ?? record['no_nik'] ?? record['No NIK'] ?? undefined,
        kkNumber: record['kk_number'] ?? record['kk'] ?? record['KK'] ?? undefined,
        fullName: record['full_name'] ?? record['fullName'] ?? record['name'] ?? record['Name'] ?? undefined,
        birthDate: record['birth_date'] ?? record['birthDate'] ?? undefined,
        birthPlace: record['birth_place'] ?? record['birthPlace'] ?? undefined,
        gender: record['gender'] ?? undefined,
        rtNumber: record['rt_number'] ?? record['rt'] ?? record['RT'] ?? undefined,
        rwNumber: record['rw_number'] ?? record['rw'] ?? record['RW'] ?? undefined,
        address: record['address'] ?? undefined,
        residenceStatus: record['residence_status'] ?? record['residenceStatus'] ?? undefined,
        email: record['email'] ?? undefined,
        phone: record['phone'] ?? undefined,
      };

      try {
        // validate with zod schema (throws on invalid)
        residentCreateSchema.parse(mapped);
        valid++;
      } catch (err) {
        invalid++;
        const zErr = err as ZodError | unknown;
        if ((zErr as ZodError)?.issues) {
          const issues = (zErr as ZodError).issues as ZodIssue[];
          const errs = issues.map((issue: ZodIssue) => ({ field: String(issue.path?.join?.('.') ?? ''), message: issue.message }));
          results.push({ row: rowNum, raw: record, errors: errs });
        } else {
          results.push({ row: rowNum, raw: record, errors: [{ message: String(err) }] });
        }
      }
    }

    return res.json({ status: 'success', data: { total_rows: total, valid_count: valid, invalid_count: invalid, errors: results } });
  } catch (err) {
    log.error('Import preview failed', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ status: 'error', error: { message: 'Failed to parse CSV' } });
  } finally {
    // cleanup uploaded file
    try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
  }
}
