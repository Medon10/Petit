# Categories

## Endpoints públicos
- `GET /categories`
  - Query: `include_representative`
- `GET /categories/:id`

### Example: listar categorías
Response 200:
```json
{ "data": [{ "id": 1, "name": "Dijes", "isActive": true }] }
```

## Endpoints admin (CRUD)
- `POST /categories`
- `PUT /categories/:id`
- `PATCH /categories/:id`
- `DELETE /categories/:id`

### Example: crear categoría
Request:
```json
{ "name": "Cadenas", "is_active": true }
```
Response 201:
```json
{ "message": "Categoría creada", "data": { "id": 3 } }
```

## Campos clave
- `is_active`

## Archivos
- src/category/category.routes.ts
- src/category/category.controller.ts
- src/category/category.service.ts
- src/category/category.repository.ts
- src/category/category.entity.ts

## Notas
- Públicos filtran `is_active = true`.
- `include_representative` usa query SQL y filtra activos.
