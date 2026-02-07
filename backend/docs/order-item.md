# Order Items

## Endpoints (admin)
- `GET /order-items`
- `GET /order-items/:id`

### Example: listar items
Response 200:
```json
{ "data": [{ "id": 200, "productName": "Medalla", "quantity": 2 }] }
```

## Archivos
- src/order-item/order-item.routes.ts
- src/order-item/order-item.controller.ts
- src/order-item/order-item.service.ts
- src/order-item/order-item.repository.ts
- src/order-item/order-item.entity.ts
