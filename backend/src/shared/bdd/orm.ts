import { MikroORM } from '@mikro-orm/core';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { MySqlDriver } from '@mikro-orm/mysql';

import '../../env.js';

import { Category } from '../../category/category.entity.js';
import { Product } from '../../product/product.entity.js';
import { Variant } from '../../variant/variant.entity.js';
import { Extra } from '../../extra/extra.entity.js';
import { AdminUser } from '../../admin/admin-user.entity.js';
import { Order } from '../../order/order.entity.js';
import { OrderItem } from '../../order-item/order-item.entity.js';
import { OrderItemExtra } from '../../order-item-extra/order-item-extra.entity.js';

function buildClientUrlFromEnv() {
    if (process.env.DB_URL && process.env.DB_URL.trim()) return process.env.DB_URL;

    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '3306';
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const database = process.env.DB_NAME || 'petit';

    const encodedPassword = encodeURIComponent(password);
    const authPart = password ? `${encodeURIComponent(user)}:${encodedPassword}` : encodeURIComponent(user);
    return `mysql://${authPart}@${host}:${port}/${database}`;
}

const dbSslEnabled = String(process.env.DB_SSL || '').toLowerCase() === 'true';
const dbSslRejectUnauthorized = String(process.env.DB_SSL_REJECT_UNAUTHORIZED || 'true').toLowerCase() !== 'false';

export const orm = await MikroORM.init({
    entities: [Category, Product, Variant, Extra, AdminUser, Order, OrderItem, OrderItemExtra],
    entitiesTs: [Category, Product, Variant, Extra, AdminUser, Order, OrderItem, OrderItemExtra],
    driver: MySqlDriver,
    clientUrl: buildClientUrlFromEnv(),
        driverOptions: dbSslEnabled
            ? ({
                    connection: {
                        ssl: { rejectUnauthorized: dbSslRejectUnauthorized },
                    },
                } as any)
            : undefined,
    debug: false,
    schemaGenerator: { //nunca en producción, solo desarrollo
        disableForeignKeys: true,
        createForeignKeyConstraints: true,
        ignoreSchema: [],
    }
});

export const syncSchema = async () => {
    const generator = orm.getSchemaGenerator();
    // In development, keep the DB schema aligned with entities.
    // This avoids runtime 500s due to missing tables/columns.
    if (process.env.NODE_ENV !== 'production') {
        try {
            await generator.updateSchema({ safe: true });
        } catch (e: any) {
            console.error('[syncSchema] No se pudo actualizar el esquema automáticamente:', e?.message || e);
            // Continue booting the server; schema might be managed manually.
        }
    }
    console.log('Esquema actualizado');

    // Auto-seed: create default admin user if none exists
    await seedDefaultAdmin();
}

async function seedDefaultAdmin() {
    const { default: bcrypt } = await import('bcryptjs');
    const em = orm.em.fork();
    try {
        const username = process.env.ADMIN_USER || 'admin';
        const rawPassword = process.env.ADMIN_PASS || 'admin123';
        const hash = await bcrypt.hash(rawPassword, 10);

        const existing = await em.findOne(AdminUser as any, { id: 1 } as any);
        if (existing) {
            // In development, keep credentials in sync with env vars
            if (process.env.NODE_ENV !== 'production') {
                (existing as any).username = username;
                (existing as any).passwordHash = hash;
                (existing as any).isActive = true;
                await em.persistAndFlush(existing);
                console.log(`[seed] Admin actualizado → usuario: ${username} / contraseña: ${rawPassword}`);
            }
            return;
        }

        const admin = em.create(AdminUser, {
            id: 1,
            username,
            passwordHash: hash,
            isActive: true,
        } as any);
        await em.persistAndFlush(admin);
        console.log(`[seed] Admin creado → usuario: ${username} / contraseña: ${rawPassword}`);
    } catch (e: any) {
        console.error('[seed] No se pudo crear admin por defecto:', e?.message || e);
    }
}