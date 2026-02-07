import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';

import { orm } from '../shared/bdd/orm.js';
import { AdminRepository } from './admin.repository.js';

export type AdminLoginInput = {
  username?: string;
  password?: string;
};

export async function loginAdmin(input: AdminLoginInput) {
  const { username, password } = input || {};
  if (!username || !password) throw new Error('Faltan credenciales');

  const em = orm.em.fork();
  const admin = await AdminRepository.findActiveAdminById(em, 1);

  if (!admin) {
    return {
      ok: false,
      status: 401,
      payload: {
        error: 'Usuario o contraseña inválidos',
        ...(process.env.NODE_ENV !== 'production' ? { reason: 'not_found' } : {}),
      },
    } as const;
  }

  if (String((admin as any).username) !== username) {
    return {
      ok: false,
      status: 401,
      payload: {
        error: 'Usuario o contraseña inválidos',
        ...(process.env.NODE_ENV !== 'production' ? { reason: 'bad_username' } : {}),
      },
    } as const;
  }

  const ok = await bcrypt.compare(password, String((admin as any).passwordHash || ''));
  if (!ok) {
    return {
      ok: false,
      status: 401,
      payload: {
        error: 'Usuario o contraseña inválidos',
        ...(process.env.NODE_ENV !== 'production' ? { reason: 'bad_password' } : {}),
      },
    } as const;
  }

  const payload = { id: Number((admin as any).id), role: 'admin', username: String((admin as any).username) };
  const secret = process.env.JWT_SECRET || process.env.TOKEN_SECRET || 'supersecret';
  const signOptions: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '12h') as any,
  };

  const token = jwt.sign(payload, secret, signOptions);
  return { ok: true, status: 200, payload: { token } } as const;
}
