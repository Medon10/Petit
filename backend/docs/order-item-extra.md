# Order Item Extras

## Endpoints (admin)
- `GET /order-item-extras`
- `GET /order-item-extras/:id`

### Example: listar extras de items
Response 200:
```json
{ "data": [{ "id": 300, "extraName": "Grabado", "quantity": 1 }] }
```

## Archivos
- src/order-item-extra/order-item-extra.routes.ts
- src/order-item-extra/order-item-extra.controller.ts
- src/order-item-extra/order-item-extra.service.ts
- src/order-item-extra/order-item-extra.repository.ts
- src/order-item-extra/order-item-extra.entity.ts
