import { Request, Response, NextFunction } from 'express';

export function sanitizeCategoryInput(req: Request, res: Response, next: NextFunction) {
  const b = req.body || {};
  const input = {
    name: typeof b.name === 'string' ? b.name.trim() : undefined,
  } as any;
  (req as any).body.sanitizedInput = input;
  next();
}
