import { Request, Response, NextFunction } from 'express';

export function sanitizeAdminLogin(req: Request, res: Response, next: NextFunction) {
  const b = req.body || {};
  const input = {
    username: typeof b.username === 'string' ? b.username.trim() : undefined,
    password: typeof b.password === 'string' ? b.password : undefined,
  } as any;
  (req as any).body.sanitizedInput = input;
  next();
}
