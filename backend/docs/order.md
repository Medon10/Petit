# Orders

## Endpoints
- `POST /orders` (público)
- `GET /orders` (admin)
- `GET /orders/:id` (admin)

## Flujo
- Crea order + order items + extras dentro de transacción.
- Calcula subtotal con variantes + extras.
- Si es envío a domicilio: valida código postal y dirección.
- El envío se coordina manualmente por WhatsApp.
- Total final = subtotal + shipping_cost.

## Example: crear pedido
Request:
```json
{
	"customer_name": "Ana",
	"customer_email": "ana@mail.com",
	"shipping": {
		"method": "delivery",
		"postal_code": "5000",
		"address_line1": "Av. Siempre Viva 742",
		"city": "Cordoba",
		"province": "Cordoba"
	},
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
{
	"message": "Pedido creado",
	"data": {
		"id": 100,
		"subtotal": "2250.00",
		"shippingCost": "0.00",
		"total": "2250.00",
		"shippingMethod": "delivery"
	}
}
```

## Archivos
- src/order/order.routes.ts
- src/order/order.controller.ts
- src/order/order.service.ts
- src/order/order.repository.ts
- src/order/order.entity.ts
