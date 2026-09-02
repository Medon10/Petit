<div align="center">

# Petit Accesorios

**Plataforma de E-Commerce en producción especializada en grabados personalizados y accesorios de diseño.**

**Sitio Web en Vivo:** [**www.petitaccesorios.com.ar**](https://www.petitaccesorios.com.ar)

[![Sitio en Vivo](https://img.shields.io/badge/Producción-www.petitaccesorios.com.ar-C76DA2?style=for-the-badge&logo=googlechrome&logoColor=white)](https://www.petitaccesorios.com.ar)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MikroORM](https://img.shields.io/badge/MikroORM-6.5-185870?style=for-the-badge)](https://mikro-orm.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Railway](https://img.shields.io/badge/Backend-Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://railway.app/)

[El Proyecto](#-sobre-el-proyecto) •
[Infraestructura en Producción](#-infraestructura-y-servicios-en-producción) •
[Características](#-características-del-sistema) •
[Panel de Administración](#-panel-de-administración-backoffice) •
[Arquitectura Técnica](#-arquitectura-técnica) •
[Estructura](#-estructura-del-código) •
[Variables de Entorno](#-variables-de-entorno-en-producción)

---

</div>

## Sobre el Proyecto

**Petit Accesorios** es una plataforma de comercio electrónico real que opera en producción atendiendo clientes en toda la República Argentina a través de su dominio oficial [www.petitaccesorios.com.ar](https://www.petitaccesorios.com.ar).

Diseñada bajo un paradigma **Headless & Composable**, la plataforma desacopla la experiencia de usuario y presentación (SPA) del motor de negocio y datos (API REST), permitiendo alta velocidad de carga, óptima indexación para motores de búsqueda (SEO) y flexibilidad operativa:

- **Frontend SPA (Vercel)**: Experiencia de compra fluida desarrollada en React 19, con diseño editorial minimalista, animaciones suaves, carrito dinámico deslizable, soporte mobile-first y checkout directo asistido por WhatsApp.
- **Backend API (Railway)**: Servicio RESTful de alto rendimiento en Express 5 y TypeScript con arquitectura en capas (*Routes ➔ Controllers ➔ Services ➔ Repositories ➔ MikroORM*).
- **Base de Datos Relacional (PostgreSQL en Railway)**: Modelo de datos transaccional con integridad referencial para variantes de stock, extras dinámicos, órdenes y auditoría de pedidos.
- **Procesamiento y Almacenamiento Multimedia**: Pipeline automatizado de recorte y optimización de imágenes a formato **WebP** servido desde Object Storage compatible con S3 (Cloudflare R2).

---

## Infraestructura y Servicios en Producción

| Componente | Servicio / Proveedor | Rol en Producción |
| :--- | :--- | :--- |
| **Dominio & DNS** | `petitaccesorios.com.ar` | Entrada pública protegida con SSL/TLS |
| **Frontend** | **Vercel** | Hosting de la Single Page Application con reescrituras de rutas dinámicas |
| **Backend API** | **Railway** | API Node.js/Express, gestión de sesiones, lógica de pedidos y catálogos |
| **Base de Datos** | **PostgreSQL (Railway)** | Persistencia de datos transaccionales con MikroORM |
| **Imágenes y CDN** | **Cloudflare R2 / S3** | Almacenamiento optimizado de imágenes de productos y variantes |
| **Ventas y Soporte**| **WhatsApp Business API** | Cierre de ventas, confirmación de comprobantes y atención directa |

---

## Características del Sistema

### Experiencia del Cliente (Storefront)
- **Catálogo Dinámico e Interactivo**: Navegación por categorías (medallas, pulseras, collares, llaveros, etc.), ordenamiento y búsqueda en tiempo real.
- **Ficha de Producto de Alta Conversión**:
  - Selector de variantes según stock (talles, acabados en plata o dorado, metales).
  - **Extras y Complementos Personalizables**: Opciones para agregar grabados en el reverso, cadenas adicionales y dijes con cálculo automático del valor total.
  - Galería fotográfica de alta resolución con vista ampliada y optimización responsiva.
- **Carrito Deslizable (*Cart Drawer*)**: Permite visualizar y modificar la compra en cualquier momento sin recargas ni pérdida de contexto.
- **Checkout Asistido y Flexible**:
  - **Métodos de Envío**: Opción de entrega a domicilio (validación de código postal y zonificación) o retiro en punto de entrega local.
  - **Flujo Directo a WhatsApp**: Al confirmar el pedido, el sistema genera la orden en la base de datos y arma un mensaje pre-estructurado para enviar vía WhatsApp con el número de pedido, detalle exacto y datos bancarios para transferencia (Alias/CBU).
- **Seguimiento de Pedidos**: Módulo público en `/pedido/:id` para que el cliente consulte el estado de su orden en tiempo real (*Pendiente, En Proceso, Completado, Cancelado*).
- **Reseñas y Valoraciones**: Sistema integrado de opiniones de clientes con puntuación de estrellas y comentarios verificados.
- **SEO y Metadatos Sociales**: Indexación dinámica con `react-helmet-async`, incluyendo Open Graph y Twitter Cards personalizadas para cada producto.

---

## Panel de Administración (Backoffice)

Ubicado bajo rutas protegidas (`/admin/login`, `/admin/catalogo`, `/admin/pedidos`), el backoffice permite administrar integralmente la operación diaria del negocio:

### 1. Gestión de Catálogo y Stock (`/admin/catalogo`)
- **CRUD de Categorías**: Creación, edición y ordenamiento de colecciones.
- **CRUD de Productos**: Carga de nombres, descripciones, categorías asociadas y galería multimedia.
- **Gestión de Variantes**: Definición precisa de combinaciones (ej. medidas, materiales), stock individual y precios diferenciales.
- **Módulo de Extras Avanzado**: Creación de complementos con alcance configurable (*scoping*: extras globales o restringidos a productos/categorías específicas).
- **Control de Visibilidad (*Soft Toggle*)**: Activación o pausa inmediata (`is_active`) de cualquier categoría, producto o extra sin alterar el historial de pedidos pasados.
- **Carga y Recorte de Imágenes Integrado**:
  - Herramienta visual en el navegador con `react-easy-crop` para encuadrar fotografías en relación de aspecto uniforme.
  - Procesamiento en el backend con `sharp` para redimensionar y comprimir directamente a **WebP**, reduciendo tiempos de carga para los usuarios móviles.

### 2. Control y Monitoreo de Pedidos (`/admin/pedidos`)
- Vista centralizada de todas las órdenes recibidas.
- **Buscador multifiltro**: Búsqueda instantánea por nombre del cliente, número de pedido, email, teléfono o código postal.
- **Filtro por Estado**: *Pendiente*, *En Proceso*, *Completado* y *Cancelado*.
- Visualización detallada: desglose de productos, variantes seleccionadas, extras añadidos, dirección de entrega y observaciones del comprador.

---

## Arquitectura Técnica

### Backend (Clean Layered Pattern)
El backend está estructurado en capas desacopladas que favorecen el mantenimiento y la escalabilidad:

- **Rutas (`*.routes.ts`)**: Definición de endpoints HTTP, aplicación de middlewares de seguridad (sanitización, rate limit, verificación de sesión admin).
- **Controladores (`*.controller.ts`)**: Manejo del ciclo de vida HTTP (Request / Response), validación de parámetros y serialización.
- **Servicios (`*.service.ts`)**: Lógica pura de negocio, reglas de cálculo de órdenes, transacciones atómicas y orquestación de storage.
- **Repositorios (`*.repository.ts`)**: Consultas optimizadas con MikroORM Entity Manager.
- **Entidades (`*.entity.ts`)**: Mapeo relacional objeto-base de datos (ORM) sobre PostgreSQL.

### Frontend (Component-Driven SPA)
- **Rutas protegidas**: Middleware cliente `ProtectedAdminRoute` para resguardar las vistas administrativas.
- **Estado de Carrito Reactivo**: Contexto de React con persistencia local y recálculo instantáneo.
- **Diseño sin dependencias pesadas**: CSS3 puro modularizado y optimizado para máximo rendimiento, sin sobrecarga de frameworks externos de CSS.


## Comandos de Mantenimiento

### Compilación y Verificación
```bash
# Compilar backend (TypeScript)
cd backend && npm run build

# Compilar frontend para producción (TypeScript + Vite)
cd frontend && npm run build
```

### Gestión del Esquema de Base de Datos
```bash
# Ver diferencias de esquema detectadas por MikroORM
cd backend && npm run db:schema:dump

# Sincronizar cambios de esquema de forma segura
cd backend && npm run db:schema:sync
```

### Optimización de Galería Histórica
```bash
# Migrar y optimizar imágenes existentes a WebP
cd backend && npm run images:migrate
```

---

## Licencia

Este proyecto está bajo la licencia **ISC**.

---

<div align="center">
  <sub>Plataforma desarrollada para <strong>Petit Accesorios</strong> — <a href="https://www.petitaccesorios.com.ar">www.petitaccesorios.com.ar</a></sub>
</div>
