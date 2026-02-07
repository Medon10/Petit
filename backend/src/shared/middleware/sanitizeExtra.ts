import { Request, Response, NextFunction } from 'express';

export function sanitizeExtraInput(req: Request, res: Response, next: NextFunction) {
  const b = req.body || {};
  const input = {
    name: typeof b.name === 'string' ? b.name.trim() : undefined,
    price: b.price != null && b.price !== '' ? String(b.price) : undefined,
    category_type: typeof b.category_type === 'string' ? b.category_type : (typeof b.categoryType === 'string' ? b.categoryType : undefined),
    is_active: b.is_active != null
      ? (b.is_active === true || b.is_active === 1 || String(b.is_active).toLowerCase() === 'true' ? 1 : 0)
      : (b.isActive != null ? (b.isActive === true || b.isActive === 1 || String(b.isActive).toLowerCase() === 'true' ? 1 : 0) : undefined),
  } as any;
  (req as any).body.sanitizedInput = input;
  next();
}
