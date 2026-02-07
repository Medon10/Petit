# Extras

## Endpoints públicos
- `GET /extras`
  - Query: `category_type`
- `GET /extras/:id`

### Example: listar extras
Response 200:
```json
{ "data": [{ "id": 5, "name": "Grabado", "price": "250.00", "isActive": true }] }
```

## Endpoints admin (CRUD)
- `POST /extras`
- `PUT /extras/:id`
- `PATCH /extras/:id`
- `DELETE /extras/:id`

### Example: crear extra
Request:
```json
{ "name": "Caja regalo", "price": "300.00", "category_type": "general", "is_active": true }
```
Response 201:
```json
{ "message": "Extra creado", "data": { "id": 6 } }
```

## Campos clave
- `is_active`

## Archivos
- src/extra/extra.routes.ts
- src/extra/extra.controller.ts
- src/extra/extra.service.ts
- src/extra/extra.repository.ts
- src/extra/extra.entity.ts

## Notas
- Públicos filtran `is_active = true`.
