import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

export default function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // parse and coerce will throw if invalid
      req.body = schema.parse(req.body) as unknown as Request['body'];
      return next();
    } catch (err) {
      const e = err as { issues?: unknown };
      const details = e?.issues ?? e;
      return res.status(400).json({ status: 'error', error: { message: 'Validation failed', details } });
    }
  };
}
