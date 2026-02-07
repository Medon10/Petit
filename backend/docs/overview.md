# Petit Backend - Overview

## Arquitectura (Headless + Composable, por capas)
- **Routes**: definen endpoints HTTP.
- **Controllers**: reciben request/response y delegan.
- **Services**: reglas de negocio (validaciones, cálculo, orquestación).
- **Repositories**: acceso a datos con MikroORM o SQL.

## Módulos documentados
- [Admin Auth](admin-auth.md)
- [Admin Catalog](admin-catalog.md)
- [Products](product.md)
- [Categories](category.md)
- [Variants](variant.md)
- [Extras](extra.md)
- [Orders](order.md)
- [Order Items](order-item.md)
- [Order Item Extras](order-item-extra.md)

## Estado de activación (is_active)
Para permitir que el admin oculte elementos sin borrar, se agregó `is_active` a:
- categories
- products
- variants
- extras

Los endpoints públicos filtran `is_active = true` por defecto.
Los endpoints admin permiten listar y reactivar con `include_inactive` o `is_active`.
