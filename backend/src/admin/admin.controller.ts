import { Request, Response } from 'express';
import { loginAdmin } from './admin.service.js';

export async function login(req: Request, res: Response) {
  try {
    const input = (req as any).body?.sanitizedInput || {};
    const result = await loginAdmin(input);

    if (!result.ok) {
      return res.status(result.status).json(result.payload);
    }

    return res.status(result.status).json(result.payload);
  } catch (err: any) {
    console.error('[admin login] error:', err);
    return res.status(500).json({ error: 'Error interno', details: err?.message });
  }
}
