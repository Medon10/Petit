# Admin Auth

## Endpoint
- `POST /admin/auth/login`

### Request (JSON)
```json
{
	"username": "admin",
	"password": "tu_password"
}
```

### Response 200
```json
{
	"token": "<jwt>"
}
```

### Response 401
```json
{
	"error": "Usuario o contraseña inválidos"
}
```

## Flujo
1. Route → controller → service → repository.
2. Valida usuario y contraseña (bcrypt).
3. Emite JWT con `JWT_SECRET` y `JWT_EXPIRES_IN`.

## Archivos
- src/admin/admin-auth.routes.ts
- src/admin/admin.controller.ts
- src/admin/admin.service.ts
- src/admin/admin.repository.ts

## Notas
- Admin es singleton (id=1).
- Editor y admin son lo mismo (mismo rol).
