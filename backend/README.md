# Petit (backend)

Backend para el catálogo de joyería Petit.

## Quick start
- Configurar `backend/.env` (PostgreSQL local `petit`)
- Ejecutar el SQL de `docs/petit-catalog.sql`
- Correr:

```bash
npm install
npm run dev
```

## Migración de esquema local

Si ya tenés una base local creada con una versión anterior, podés sincronizarla con el código actual con MikroORM:

```bash
npm run db:schema:dump
npm run db:schema:sync
```

El primer comando te muestra el SQL que MikroORM ve como diferencia; el segundo lo aplica a tu PostgreSQL local.

Si ya habías quedado con columnas viejas de shipping, también podés ejecutar primero la migración manual:

```sql
\i backend/docs/migrations/20260702_drop_shipping_quote_fields_postgres.sql
```

Después podés hacer el dump para producción.

## Uploads de Imágenes (Local vs Object Storage)

Por defecto el backend usa almacenamiento local para desarrollo:

```env
IMAGE_STORAGE_DRIVER=local
```

En este modo:
- Se guardan archivos en `backend/public/uploads`
- Se sirven por `GET /uploads/...`
- Ideal para desarrollo local

Para usar object storage (S3/R2/Spaces):

```env
IMAGE_STORAGE_DRIVER=s3
IMAGE_STORAGE_PUBLIC_BASE_URL=https://cdn.tu-dominio.com
IMAGE_STORAGE_PREFIX=uploads
S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=petit-images
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_FORCE_PATH_STYLE=false
```

Notas:
- Mientras no estén en producción, podés dejar `IMAGE_STORAGE_DRIVER=local`.
- El código ya está preparado para cambiar a `s3` sin tocar frontend.
- El script de migración `npm run images:migrate` también respeta el driver configurado.
