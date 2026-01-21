import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { orm } from '../shared/bdd/orm.js';
import { AdminUser } from './admin-user.entity.js';
import { sanitizeAdminLogin } from '../shared/middleware/sanitizeAdminLogin.js';

const router = Router();

router.post('/login', sanitizeAdminLogin, async (req, res) => {
  try {
    const { username, password } = (req as any).body.sanitizedInput || {};
    if (!username || !password) return res.status(400).json({ error: 'Faltan credenciales' });

    const em = orm.em.fork();
    const admin = await em.findOne(AdminUser as any, { id: 1, isActive: true } as any);

    if (!admin) {
      return res.status(401).json({
        error: 'Usuario o contraseña inválidos',
        ...(process.env.NODE_ENV !== 'production' ? { reason: 'not_found' } : {}),
      });
    }

    if (String((admin as any).username) !== username) {
      return res.status(401).json({
        error: 'Usuario o contraseña inválidos',
        ...(process.env.NODE_ENV !== 'production' ? { reason: 'bad_username' } : {}),
      });
    }

    const ok = await bcrypt.compare(password, String((admin as any).passwordHash || ''));
    if (!ok) {
      return res.status(401).json({
        error: 'Usuario o contraseña inválidos',
        ...(process.env.NODE_ENV !== 'production' ? { reason: 'bad_password' } : {}),
      });
    }

    const payload = { id: Number((admin as any).id), role: 'admin', username: String((admin as any).username) };
    const secret = process.env.JWT_SECRET || process.env.TOKEN_SECRET || 'supersecret';
    const signOptions: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN || '12h') as any,
    };

    const token = jwt.sign(payload, secret, signOptions);
    return res.json({ token });
  } catch (err: any) {
    console.error('[admin login] error:', err);
    return res.status(500).json({ error: 'Error interno', details: err?.message });
  }
});

export default router;
