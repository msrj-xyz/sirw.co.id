import { Request, Response } from 'express';
import prisma from '../prisma/client';
import bcrypt from 'bcrypt';

type UserPayload = { sub: string; role?: string };

export async function getMe(req: Request, res: Response) {
  const actor = (req as unknown as { user?: UserPayload }).user;
  if (!actor) return res.status(401).json({ status: 'error', error: { message: 'Unauthorized' } });
  const user = await prisma.user.findUnique({ where: { id: actor.sub } });
  return res.json({ status: 'success', data: user });
}

export async function updateMe(req: Request, res: Response) {
  const actor = (req as unknown as { user?: UserPayload }).user;
  if (!actor) return res.status(401).json({ status: 'error', error: { message: 'Unauthorized' } });
  const allowed = ['fullName', 'phone', 'email'];
  const data: Record<string, unknown> = {};
  for (const k of allowed) if (req.body[k] !== undefined) data[k] = req.body[k];
  const updated = await prisma.user.update({ where: { id: actor.sub }, data });
  return res.json({ status: 'success', data: updated });
}

export async function uploadAvatar(req: Request, res: Response) {
  // placeholder: return uploaded filename
  if (!req.file) return res.status(400).json({ status: 'error', error: { message: 'file required' } });
  return res.json({ status: 'success', data: { file: req.file.filename } });
}

export async function changePassword(req: Request, res: Response) {
  const actor = (req as unknown as { user?: UserPayload }).user;
  if (!actor) return res.status(401).json({ status: 'error', error: { message: 'Unauthorized' } });
  const { currentPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: actor.sub } });
  if (!user || !user.passwordHash) return res.status(400).json({ status: 'error', error: { message: 'Bad request' } });
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return res.status(400).json({ status: 'error', error: { message: 'Invalid current password' } });
  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: actor.sub }, data: { passwordHash: hash } });
  return res.json({ status: 'success', message: 'Password changed' });
}

export async function enable2fa(req: Request, res: Response) {
  const actor = (req as unknown as { user?: UserPayload }).user;
  if (!actor) return res.status(401).json({ status: 'error', error: { message: 'Unauthorized' } });
  // dev: set twoFactorEnabled true
  await prisma.user.update({ where: { id: actor.sub }, data: { twoFactorEnabled: true } });
  return res.json({ status: 'success', message: '2FA enabled (dev)' });
}

export async function verify2fa(req: Request, res: Response) {
  // dev stub
  return res.json({ status: 'success', message: '2FA verified (dev)' });
}
