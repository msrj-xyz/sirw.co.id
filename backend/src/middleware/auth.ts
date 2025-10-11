import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/jwt';

type UserPayload = { sub: string; role?: string };

export default function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : header || '';
  if (!token) return res.status(401).json({ status: 'error', error: { message: 'Unauthorized' } });

  const payload = verifyToken<UserPayload>(token);
  if (!payload) return res.status(401).json({ status: 'error', error: { message: 'Invalid token' } });

  // attach to request
  (req as unknown as { user?: UserPayload }).user = payload;
  return next();
}
