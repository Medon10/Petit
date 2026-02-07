# Variants

## Endpoints públicos
- `GET /variants`
  - Query: `product_id`
- `GET /variants/:id`

### Example: listar variantes
Response 200:
```json
{ "data": [{ "id": 10, "name": "Oro", "price": "1000.00", "isActive": true }] }
```

## Endpoints admin (CRUD)
- `POST /variants`
- `PUT /variants/:id`
- `PATCH /variants/:id`
- `DELETE /variants/:id`

### Example: crear variante
Request:
```json
{ "product_id": 1, "name": "Plata", "price": "500.00", "is_active": true }
```
Response 201:
```json
{ "message": "Variante creada", "data": { "id": 11 } }
```

## Campos clave
- `is_active`

## Archivos
- src/variant/variant.routes.ts
- src/variant/variant.controller.ts
- src/variant/variant.service.ts
- src/variant/variant.repository.ts
- src/variant/variant.entity.ts

## Notas
- Públicos filtran `is_active = true`.
