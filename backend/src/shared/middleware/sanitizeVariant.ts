import { Request, Response, NextFunction } from 'express';

export function sanitizeVariantInput(req: Request, res: Response, next: NextFunction) {
  const b = req.body || {};
  const input = {
    product_id: b.product_id != null ? Number(b.product_id) : (b.productId != null ? Number(b.productId) : undefined),
    name: typeof b.name === 'string' ? b.name.trim() : undefined,
    price: b.price != null && b.price !== '' ? String(b.price) : undefined,
  } as any;
  (req as any).body.sanitizedInput = input;
  next();
}
