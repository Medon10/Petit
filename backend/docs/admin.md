# Admin - arquitectura y flujo

## Objetivo
Preparar el backend para administración flexible de catálogo (productos, categorías, variantes, extras) con una capa de servicios que soporte cambios frecuentes sin romper el frontend.

## Capas
- **Routes**: define endpoints HTTP.
- **Controller**: traduce HTTP a servicio y maneja errores HTTP.
- **Service**: reglas de negocio y validaciones.
- **Repository**: acceso a datos (MikroORM / SQL).

## Login de admin (actual)
**Endpoint**: `POST /admin/login`

### Flujo
1. `admin-auth.routes.ts` llama a `login` en controller.
2. `admin.controller.ts` valida input sanitizado y delega en `admin.service.ts`.
3. `admin.service.ts` usa `admin.repository.ts` para obtener el admin activo (id=1) y valida:
   - usuario
   - password (bcrypt)
4. Se firma JWT con `JWT_SECRET` y `JWT_EXPIRES_IN`.

### Archivos
- [backend/src/admin/admin-auth.routes.ts](../src/admin/admin-auth.routes.ts)
- [backend/src/admin/admin.controller.ts](../src/admin/admin.controller.ts)
- [backend/src/admin/admin.service.ts](../src/admin/admin.service.ts)
- [backend/src/admin/admin.repository.ts](../src/admin/admin.repository.ts)

## Próximos pasos recomendados
1. **CRUD Admin Catalog**: endpoints admin para productos, categorías, variantes, extras.
2. **Roles**: admin vs editor.
3. **Auditoría**: registrar quién cambió qué y cuándo.
4. **Batch ops**: reordenar destacados y cambios masivos.

## Documentación relacionada
- admin-catalog.md
