import { Request, Response, NextFunction } from 'express';

export function sanitizeProductInput(req: Request, res: Response, next: NextFunction) {
  const b = req.body || {};
  const input = {
    category_id: b.category_id != null ? Number(b.category_id) : (b.categoryId != null ? Number(b.categoryId) : undefined),
    name: typeof b.name === 'string' ? b.name.trim() : undefined,
    description: typeof b.description === 'string' ? b.description : undefined,
    image_url: typeof b.image_url === 'string' ? b.image_url.trim() : (typeof b.imageUrl === 'string' ? b.imageUrl.trim() : undefined),
    is_featured: b.is_featured != null
      ? (b.is_featured === true || b.is_featured === 1 || String(b.is_featured).toLowerCase() === 'true' ? 1 : 0)
      : (b.isFeatured != null ? (b.isFeatured === true || b.isFeatured === 1 || String(b.isFeatured).toLowerCase() === 'true' ? 1 : 0) : undefined),
    featured_rank: b.featured_rank != null ? Number(b.featured_rank) : (b.featuredRank != null ? Number(b.featuredRank) : undefined),
  } as any;
  (req as any).body.sanitizedInput = input;
  next();
}
