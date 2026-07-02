import '../env.js';
import { orm } from '../shared/bdd/orm.js';

async function dropEnumDefaultsIfNeeded() {
  const connection = orm.em.getConnection();
  await connection.execute(`
    alter table "extras" alter column "category_type" drop default;
    alter table "order_item_extras" alter column "category_type" drop default;
    alter table "orders" alter column "status" drop default;
  `);
}

async function main() {
  const mode = String(process.argv[2] || '--dump').toLowerCase();
  const generator = orm.getSchemaGenerator();

  if (mode === '--run') {
    await dropEnumDefaultsIfNeeded();
    const sql = await generator.getUpdateSchemaSQL({ safe: false });
    if (sql.trim()) {
      await orm.em.getConnection().execute(sql);
    }
    console.log('Esquema sincronizado con las entidades.');
    return;
  }

  const sql = await generator.getUpdateSchemaSQL({ safe: false });
  if (sql.trim()) {
    console.log(sql);
  } else {
    console.log('El esquema ya está alineado con las entidades.');
  }
}

main()
  .catch((error) => {
    console.error('No se pudo generar o aplicar el diff del esquema:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await orm.close(true);
  });