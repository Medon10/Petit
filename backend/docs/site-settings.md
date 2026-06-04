# Site Settings

## Objetivo
Guardar configuraciones globales del sitio, como la imagen grande de Home.

## Endpoints
- `GET /site-settings/home`
- `PATCH /site-settings/home` (admin)

### Example: leer portada
Response 200:
```json
{ "message": "Configuración de portada", "data": { "heroImageUrl": "/uploads/home/home-banner.jpg" } }
```

### Example: actualizar portada
Request:
```json
{ "hero_image_url": "/uploads/home/home-banner.jpg" }
```

## Base de datos
La tabla `site_settings` guarda pares `key/value`.

Para la portada se usa la key:
- `home.hero_image_url`

La base solo almacena la ruta o URL pública. El archivo real vive en storage local o en R2/S3.

## SQL para una base existente
```sql
CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NULL
);
```

## Archivos
- src/site-settings/site-setting.entity.ts
- src/site-settings/site-settings.service.ts
- src/site-settings/site-settings.controller.ts
- src/site-settings/site-settings.routes.ts