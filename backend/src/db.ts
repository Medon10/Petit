import pg from 'pg';
import './env.js';

const dbUrl = process.env.DB_URL && process.env.DB_URL.trim() ? process.env.DB_URL.trim() : null;
const sslEnabled = String(process.env.DB_SSL || '').toLowerCase() === 'true';
const rejectUnauthorized = String(process.env.DB_SSL_REJECT_UNAUTHORIZED || 'true').toLowerCase() !== 'false';

export const pool = new pg.Pool({
  connectionString: dbUrl || undefined,
  host: dbUrl ? undefined : process.env.DB_HOST || 'localhost',
  port: dbUrl ? undefined : Number(process.env.DB_PORT || 5432),
  user: dbUrl ? undefined : process.env.DB_USER || 'postgres',
  password: dbUrl ? undefined : process.env.DB_PASSWORD || '',
  database: dbUrl ? undefined : process.env.DB_NAME || 'petit',
  ssl: sslEnabled ? { rejectUnauthorized } : undefined,
  max: 10,
});

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const { rows } = await pool.query(sql, params);
  return rows as T[];
}
