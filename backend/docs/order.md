# Orders

## Endpoints
- `POST /orders` (público)
- `GET /orders` (admin)
- `GET /orders/:id` (admin)
- `POST /shipping/quotes` (público)

## Flujo
- Crea order + order items + extras dentro de transacción.
- Calcula subtotal con variantes + extras.
- Si es envío a domicilio: valida quote vigente, código postal y dirección.
- Total final = subtotal + shipping_cost.

## Example: cotizar envio
Request:
```json
{
	"postal_code": "5000",
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
Response 200:
```json
{
	"message": "Cotizacion generada",
	"data": {
		"quoteId": "1ce8...",
		"provider": "Agregador Nacional",
		"service": "Estandar Centro",
		"postalCode": "5000",
		"cost": 2450,
		"etaMinDays": 2,
		"etaMaxDays": 4,
		"expiresAt": "2026-04-17T15:00:00.000Z",
		"expiresInSeconds": 900,
		"currency": "ARS"
	}
}
```

## Example: crear pedido
Request:
```json
{
	"customer_name": "Ana",
	"customer_email": "ana@mail.com",
	"shipping": {
		"method": "delivery",
		"postal_code": "5000",
		"quote_id": "1ce8...",
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
		"shippingCost": "2450.00",
		"total": "4700.00",
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
