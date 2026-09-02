# 💎 Petit Accesorios — Frontend

Single Page Application (SPA) para la tienda de comercio electrónico y panel de control de **Petit Accesorios**.

Construido con **React 19**, **TypeScript** y **Vite**.

Para ver la documentación completa de todo el proyecto, arquitectura y despliegue, consulta el [README principal del repositorio](../README.md).

---

## 🚀 Tecnologías

- **Core**: React 19.2 + TypeScript
- **Bundler & Build Tool**: Vite 7
- **Enrutamiento**: React Router DOM v7
- **SEO & Metadatos**: React Helmet Async
- **Procesamiento de Imágenes**: React Easy Crop (recorte interactivo en panel admin)
- **Estilos**: CSS3 moderno con variables, diseño responsive y layout mobile-first
- **Integraciones**: WhatsApp Click-to-Chat y flujo de checkout por transferencia

---

## 📁 Estructura del Frontend

```text
frontend/
├── public/                    # Íconos de marca, manifiesto y favicon
├── src/
│   ├── componentes/           # Componentes modulares reutilizables
│   │   ├── admin/             # Layout de administración y modal de recorte
│   │   ├── cart/              # CartDrawer (carrito lateral desplegable)
│   │   ├── layout/            # Navbar, Footer y contenedores
│   │   ├── shared/            # Botones, loaders y componentes compartidos
│   │   └── WhatsAppButton/    # Botón flotante permanente de WhatsApp
│   ├── pages/                 # Vistas principales y páginas de la aplicación
│   │   ├── Home/              # Página de inicio con hero, categorías y destacados
│   │   ├── Categories/        # Grilla de todas las categorías
│   │   ├── Category/          # Catálogo filtrado por categoría específica
│   │   ├── Product/           # Ficha de producto con selector de variantes y extras
│   │   ├── Cart/              # Página de revisión de carrito
│   │   ├── Checkout/          # Formulario de compra, datos de envío y pago
│   │   ├── Order/             # Tracking público de orden (`/pedido/:id`)
│   │   ├── AdminLogin/        # Login seguro del administrador
│   │   ├── AdminCatalog/      # ABM de categorías, productos, variantes y extras
│   │   ├── AdminOrders/       # Tablero de control y gestión de pedidos
│   │   ├── QuienesSomos/      # Información institucional de la marca
│   │   ├── ComoComprar/       # Guía paso a paso para el cliente
│   │   └── Legal/             # Términos, condiciones y privacidad
│   ├── shared/                # Contextos, servicios de API y rutas protegidas
│   ├── App.tsx                # Declaración de rutas de la aplicación
│   ├── index.css              # Variables globales de estilo y resets
│   └── main.tsx               # Montaje principal de React
├── vercel.json                # Configuración de reescritura de rutas para Vercel
├── vite.config.ts             # Configuración de Vite y plugins
└── package.json
```

---

## 🛠️ Puesta en Marcha Local

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Crea tu archivo `.env` basándote en `.env.example`:
```bash
cp .env.example .env
```

Contenido necesario:
```env
# URL del backend en ejecución
VITE_API_URL=http://localhost:3000

# Datos bancarios para transferencias
VITE_BANK_ALIAS=PETIT.ACCESORIOS
VITE_BANK_HOLDER=Petit Accesorios

# Número de WhatsApp para soporte y finalización de compras
VITE_WHATSAPP_NUMBER=5492473417518
```

### 3. Iniciar en desarrollo
```bash
npm run dev
```
La aplicación correrá en `http://localhost:5173`.

---

## 📦 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo con recarga rápida (HMR).
- `npm run build`: Verifica tipos con TypeScript y genera el bundle optimizado en `dist/`.
- `npm run preview`: Previsualiza localmente la build de producción.
- `npm run lint`: Analiza el código con ESLint.

---

## ☁️ Despliegue en Vercel

El proyecto incluye el archivo `vercel.json` con la regla de reescritura necesaria:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
Esto asegura que las rutas del cliente (`/categorias`, `/productos/:id`, `/admin/...`) funcionen correctamente sin arrojar error 404 al refrescar la página.
