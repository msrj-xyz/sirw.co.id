import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../prisma/client';
import { signAccessToken, signRefreshToken, verifyToken } from '../services/jwt';
import { hashToken } from '../services/hash';
import { sendEmail } from '../services/mailer';
import { generateOtp, verifyOtp as verifyOtpCode } from '../services/otp';
import { log } from '../lib/logger';
import { createPasswordReset, verifyPasswordReset, deletePasswordResetsForUser } from '../services/passwordReset';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function register(req: Request, res: Response) {
  const { email, phone, password, fullName, nik, rtNumber, rwNumber, address } = req.body;
  if (!password || (!email && !phone)) {
    return res.status(400).json({ status: 'error', error: { message: 'email or phone and password required' } });
  }

  // check duplicates
  if (email) {
    const exists = await prisma.user.findFirst({ where: { email } });
    if (exists) return res.status(409).json({ status: 'error', error: { message: 'Email already exists' } });
  }
  if (phone) {
    const exists = await prisma.user.findFirst({ where: { phone } });
    if (exists) return res.status(409).json({ status: 'error', error: { message: 'Phone already exists' } });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: email ?? null,
      phone: phone ?? null,
      passwordHash,
      role: 'warga',
      isActive: false,
    },
  });

  // Optionally create resident profile
  if (nik && fullName) {
    await prisma.resident.create({
      data: {
        userId: user.id,
        nik,
        fullName,
        rtNumber: rtNumber ?? '',
        rwNumber: rwNumber ?? '',
        address: address ?? '',
        residenceStatus: 'owner',
      },
    });
  }

  return res.status(201).json({ status: 'success', message: 'Registration successful. Await admin approval.' });
}

export async function login(req: Request, res: Response) {
  const { email, phone, password } = req.body;
  if (!password || (!email && !phone)) {
    return res.status(400).json({ status: 'error', error: { message: 'email or phone and password required' } });
  }

  const user = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
  if (!user || !user.passwordHash) return res.status(401).json({ status: 'error', error: { message: 'Invalid credentials' } });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ status: 'error', error: { message: 'Invalid credentials' } });

  let accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  // include rt/rw in access token if user has a resident profile
  try {
    const profile = await prisma.resident.findFirst({ where: { userId: user.id }, select: { rtNumber: true, rwNumber: true } });
    if (profile) {
      // re-sign including rt/rw
  const payload: { sub: string; email?: string | null; role: string; rtNumber?: string; rwNumber?: string } = { sub: user.id, email: user.email, role: user.role };
      if (profile.rtNumber) payload.rtNumber = profile.rtNumber;
      if (profile.rwNumber) payload.rwNumber = profile.rwNumber;
      // short-lived access token
      const accessWithScope = signAccessToken(payload);
      // override accessToken variable to include claims
      accessToken = accessWithScope;
    }
  } catch (e) {
    // ignore profile lookup failures — token without scope is still valid
  }
  const refreshToken = signRefreshToken({ sub: user.id, jti: uuidv4() });

  // store hashed refresh token
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
  await prisma.refreshToken.create({ data: { userId: user.id, tokenHash, expiresAt } });

  // set httpOnly cookie (dev) and return tokens
  res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: REFRESH_TTL_MS });

  return res.json({ status: 'success', data: { access_token: accessToken, refresh_token: refreshToken, user: { id: user.id, email: user.email, role: user.role } } });
}

export async function refresh(req: Request, res: Response) {
  const provided = req.body.refresh_token || req.cookies?.refresh_token;
  if (!provided) return res.status(400).json({ status: 'error', error: { message: 'refresh_token required' } });

  const payload = verifyToken<{ sub: string }>(provided);
  if (!payload) return res.status(401).json({ status: 'error', error: { message: 'Invalid refresh token' } });

  const tokenHash = hashToken(provided);
  const stored = await prisma.refreshToken.findFirst({ where: { tokenHash } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) return res.status(401).json({ status: 'error', error: { message: 'Refresh token revoked or expired' } });

  // rotate refresh token
  const newRefresh = signRefreshToken({ sub: payload.sub, jti: uuidv4() });
  const newHash = hashToken(newRefresh);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

  await prisma.refreshToken.create({ data: { userId: payload.sub, tokenHash: newHash, expiresAt } });
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  const accessToken = signAccessToken({ sub: user?.id, email: user?.email, role: user?.role });

  res.cookie('refresh_token', newRefresh, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: REFRESH_TTL_MS });

  return res.json({ status: 'success', data: { access_token: accessToken } });
}

export async function logout(req: Request, res: Response) {
  const provided = req.body.refresh_token || req.cookies?.refresh_token;
  if (!provided) return res.status(204).send();
  const tokenHash = hashToken(provided);
  await prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revokedAt: new Date() } });
  res.clearCookie('refresh_token');
  return res.status(200).json({ status: 'success', message: 'Logged out' });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ status: 'error', error: { message: 'email required' } });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(200).json({ status: 'success', message: 'If account exists you will receive instructions' });
  const token = createPasswordReset(user.id);
  await sendEmail(email, 'Password reset', `Use this token to reset your password: ${token}`);
  return res.status(200).json({ status: 'success', message: 'If account exists you will receive instructions' });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ status: 'error', error: { message: 'token and password required' } });
  const userId = await verifyPasswordReset(token);
  if (!userId) return res.status(400).json({ status: 'error', error: { message: 'Invalid or expired token' } });
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  deletePasswordResetsForUser(userId);
  return res.json({ status: 'success', message: 'Password reset' });
}

export async function verifyEmail(req: Request, res: Response) {
  const { email, token } = req.body;
  if (!email || !token) return res.status(400).json({ status: 'error', error: { message: 'email and token required' } });
  // For simplicity, token == user.id in this dev adapter
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.id !== token) return res.status(400).json({ status: 'error', error: { message: 'Invalid token' } });
  await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
  return res.json({ status: 'success', message: 'Email verified' });
}

export async function sendOtp(req: Request, res: Response) {
  const { key, method, to } = req.body; // key can be email or phone
  if (!key || !method || !to) return res.status(400).json({ status: 'error', error: { message: 'key, method and to required' } });
  const code = generateOtp(key);
  if (method === 'email') await sendEmail(to, 'Your OTP', `Your code: ${code}`);
  // for phone/SMS we just log for dev
  log.info('OTP for', key, code);
  return res.json({ status: 'success', message: 'OTP sent' });
}

export async function verifyOtp(req: Request, res: Response) {
  const { key, code } = req.body;
  if (!key || !code) return res.status(400).json({ status: 'error', error: { message: 'key and code required' } });
  const ok = await verifyOtpCode(key, code);
  if (!ok) return res.status(400).json({ status: 'error', error: { message: 'Invalid or expired code' } });
  return res.json({ status: 'success', message: 'OTP verified' });
}

export async function socialGoogle(req: Request, res: Response) {
  const { token } = req.body;
  if (!token) return res.status(400).json({ status: 'error', error: { message: 'token required' } });
  // Dev adapter: accept any token and return a guest user token
  const dummyUser = await prisma.user.upsert({ where: { email: `google-${token}@example.test` }, update: {}, create: { email: `google-${token}@example.test`, role: 'warga', isActive: true } });
  let accessToken = signAccessToken({ sub: dummyUser.id, email: dummyUser.email, role: dummyUser.role });
  try {
    const profile = await prisma.resident.findFirst({ where: { userId: dummyUser.id }, select: { rtNumber: true, rwNumber: true } });
    if (profile) {
      const payload: any = { sub: dummyUser.id, email: dummyUser.email, role: dummyUser.role };
      if (profile.rtNumber) payload.rtNumber = profile.rtNumber;
      if (profile.rwNumber) payload.rwNumber = profile.rwNumber;
      accessToken = signAccessToken(payload);
    }
  } catch (e) {
    // ignore
  }
  return res.json({ status: 'success', data: { access_token: accessToken, user: { id: dummyUser.id } } });
}
