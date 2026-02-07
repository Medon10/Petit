import { Request, Response, NextFunction } from 'express';

export function sanitizeCategoryInput(req: Request, res: Response, next: NextFunction) {
  const b = req.body || {};
  const input = {
    name: typeof b.name === 'string' ? b.name.trim() : undefined,
    is_active: b.is_active != null
      ? (b.is_active === true || b.is_active === 1 || String(b.is_active).toLowerCase() === 'true' ? 1 : 0)
      : (b.isActive != null ? (b.isActive === true || b.isActive === 1 || String(b.isActive).toLowerCase() === 'true' ? 1 : 0) : undefined),
  } as any;
  (req as any).body.sanitizedInput = input;
  next();
}
