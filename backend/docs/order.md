# Orders

## Endpoints
- `POST /orders` (público)
- `GET /orders` (admin)
- `GET /orders/:id` (admin)

## Flujo
- Crea order + order items + extras dentro de transacción.
- Calcula total con variantes + extras.

## Example: crear pedido
Request:
```json
{
	"customer_name": "Ana",
	"customer_email": "ana@mail.com",
	"items": [
		{
			"product_id": 1,
			"variant_id": 10,
			"quantity": 2,
			"extras": [{ "extra_id": 5, "quantity": 1 }]
		}
	]
}
```
Response 201:
```json
{ "message": "Pedido creado", "data": { "id": 100, "total": "2250.00" } }
```

## Archivos
- src/order/order.routes.ts
- src/order/order.controller.ts
- src/order/order.service.ts
- src/order/order.repository.ts
- src/order/order.entity.ts
