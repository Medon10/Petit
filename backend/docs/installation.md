# Instalación (Backend Petit)

## Requisitos
- Node.js 18+
- MySQL 8+ (o MariaDB equivalente)

## 1) Base de datos
1. Crear la base `petit` y cargar el esquema + datos:
	- Archivo: `docs/petit-catalog.sql`
2. En MySQL Workbench o consola:
	- Ejecutar el script completo (incluye `CREATE DATABASE IF NOT EXISTS petit; USE petit;`).

## 2) Variables de entorno
En `backend/.env` (ya está preparado para local):
- `DB_HOST=localhost`
- `DB_PORT=3306`
- `DB_USER=root`
- `DB_PASSWORD=`
- `DB_NAME=petit`
- `JWT_SECRET=...` (para login admin)

## 3) Levantar el backend
```bash
npm install
npm run dev
```

Servidor: `http://localhost:3000`

## Endpoints
Lectura pública:
- `GET /categories`
- `GET /products` (opcional `?categoryId=1`)
- `GET /variants` (opcional `?productId=1`)
- `GET /extras` (opcional `?categoryType=cadena`)

Admin:
- `POST /admin/auth/login` → devuelve `{ token }`
- Escritura del catálogo (POST/PUT/PATCH/DELETE) requiere header `Authorization: Bearer <token>`