import { Request, Response, NextFunction } from 'express';

type UserPayload = { sub: string; role?: string };

export default function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const actor = (req as unknown as { user?: UserPayload }).user;
    if (!actor) return res.status(401).json({ status: 'error', error: { message: 'Unauthorized' } });
    if (!actor.role) return res.status(403).json({ status: 'error', error: { message: 'Forbidden' } });
    if (roles.includes(actor.role)) return next();
    return res.status(403).json({ status: 'error', error: { message: 'Forbidden' } });
  };
}
