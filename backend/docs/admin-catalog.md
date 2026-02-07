# Admin Catalog

## Objetivo
Endpoints admin para gestionar catálogo incluyendo items inactivos.

## Endpoints
### Products
- `GET /admin/catalog/products`
  - Query: `category_id`, `featured`, `limit`, `include_inactive`, `is_active`
- `GET /admin/catalog/products/:id`
- `PATCH /admin/catalog/products/:id/active` (body: `is_active`)

#### Example: activar/desactivar
Request:
```json
{ "is_active": false }
```
Response 200:
```json
{ "message": "Producto actualizado", "data": { "id": 1, "isActive": false } }
```

### Categories
- `GET /admin/catalog/categories`
  - Query: `include_representative`, `include_inactive`, `is_active`
- `GET /admin/catalog/categories/:id`
- `PATCH /admin/catalog/categories/:id/active` (body: `is_active`)

#### Example: activar/desactivar
Request:
```json
{ "is_active": true }
```
Response 200:
```json
{ "message": "Categoría actualizada", "data": { "id": 2, "isActive": true } }
```

### Variants
- `GET /admin/catalog/variants`
  - Query: `product_id`, `include_inactive`, `is_active`
- `GET /admin/catalog/variants/:id`
- `PATCH /admin/catalog/variants/:id/active` (body: `is_active`)

#### Example: activar/desactivar
Request:
```json
{ "is_active": false }
```
Response 200:
```json
{ "message": "Variante actualizada", "data": { "id": 10, "isActive": false } }
```

### Extras
- `GET /admin/catalog/extras`
  - Query: `category_type`, `include_inactive`, `is_active`
- `GET /admin/catalog/extras/:id`
- `PATCH /admin/catalog/extras/:id/active` (body: `is_active`)

#### Example: activar/desactivar
Request:
```json
{ "is_active": true }
```
Response 200:
```json
{ "message": "Extra actualizado", "data": { "id": 5, "isActive": true } }
```

### Uploads
- `POST /admin/catalog/uploads`
  - Form-data: `image` (archivo)

#### Example: subir imagen
Response 201:
```json
{
  "message": "Archivo subido",
  "data": {
    "url": "/uploads/1707320000000-123456789.jpg",
    "filename": "1707320000000-123456789.jpg",
    "originalName": "foto.jpg",
    "mimeType": "image/jpeg",
    "size": 123456
  }
}
```

## Archivos
- src/admin/admin-catalog.routes.ts
- src/admin/admin-catalog.controller.ts
- src/admin/admin-catalog.service.ts
