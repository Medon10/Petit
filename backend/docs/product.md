# Products

## Endpoints públicos
- `GET /products`
  - Query: `category_id`, `featured`, `limit`
- `GET /products/:id`
- `GET /products/best-sellers`

### Example: listar productos
Response 200:
```json
{ "data": [{ "id": 1, "name": "Medalla", "isActive": true }] }
```

## Endpoints admin (CRUD)
- `POST /products`
- `PUT /products/:id`
- `PATCH /products/:id`
- `DELETE /products/:id`

### Example: crear producto
Request:
```json
{
  "category_id": 1,
  "name": "Medalla",
  "description": "...",
  "image_url": "/uploads/medalla.jpg",
  "is_featured": true,
  "featured_rank": 1,
  "is_active": true
}
```
Response 201:
```json
{ "message": "Producto creado", "data": { "id": 1 } }
```

## Campos clave
- `is_featured`, `featured_rank`
- `is_active`

## Archivos
- src/product/product.routes.ts
- src/product/product.controller.ts
- src/product/product.service.ts
- src/product/product.repository.ts
- src/product/product.entity.ts

## Notas
- Públicos filtran `is_active = true`.
- Admin puede activar/desactivar con `/admin/catalog/products/:id/active`.
