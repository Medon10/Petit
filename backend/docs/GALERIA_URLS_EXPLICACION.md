# 📸 GALERÍA EN ADMIN: Explicación de las DOS URLs + Scripts de Auditoría

## ¿Por qué el admin ve DOS formas distintas de URL?

El admin termina viendo dos "universos" de URLs porque el sistema maneja imágenes en **dos contextos diferentes**:

---

## 1️⃣ **URL RELATIVA** (lo que el admin INGRESA manualmente)
```
/uploads/medallas/circulares/12mm.png
/uploads/pulseras/corazon/corazon.png
```

**Dónde vive:**  
- En la **base de datos**: tabla `products.image_url` y `products.gallery_images`
- En el **formulario del admin**: input manual donde pega URLs

**Por qué es relativa:**  
- Es relativa al servidor backend (no incluye el dominio)
- El frontend usa `toAbsoluteUrl()` para convertirla a absoluta cuando la renderiza

**Ejemplo en BD:**
```sql
INSERT INTO products (image_url) VALUES ('/uploads/medallas/circulares/12mm.png');
INSERT INTO products (gallery_images) VALUES (JSON_ARRAY('/uploads/llaveros/circular/circular.jpeg', '/uploads/compartir/corazon.png'));
```

---

## 2️⃣ **URL ABSOLUTA** (lo que el FRONTEND ve)
```
http://localhost:3000/uploads/medallas/circulares/12mm.png
https://petit.com/uploads/medallas/circulares/12mm.png
```

**Dónde vive:**  
- **En el navegador cliente** (frontend)
- **En respuestas API** (si se envía via `toAbsoluteUrl()`)

**Por qué es absoluta:**  
- Incluye protocolo (`http://` o `https://`) + dominio
- Es necesaria para que el `<img src="">` funcione desde cualquier página

**Función clave en frontend (`shared/api.ts`):**
```typescript
export function toAbsoluteUrl(pathOrUrl?: string | null) {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl; // Already absolute
  
  const base = apiBase().replace(/\/$/, '');           // http://localhost:3000
  const path = String(pathOrUrl).startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;  // http://localhost:3000 + /uploads/...
}
```

---

## 🔄 FLUJO COMPLETO: Desde admin até usuario

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ADMIN SUBE FOTO VÍA FORM (AdminCatalog.tsx)              │
│    - Click en "Subir imagen"                                │
│    - File upload → backend/src/admin/admin-catalog.routes  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. BACKEND GUARDA Y RESPONDE CON URL RELATIVA               │
│                                                               │
│   admin-upload.controller.ts:                                │
│   const url = `/uploads/${file.filename}`;                   │
│   res.json({ data: { url: '/uploads/1710086400000-123.jpg' } })
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. ADMIN VE LA URL EN EL CAMPO (todavía relativa)            │
│                                                               │
│   imgUrl state = "/uploads/1710086400000-123.jpg"            │
│   (Se muestra en preview con toAbsoluteUrl(), pero           │
│    se guarda en BD como relativa)                            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. ADMIN GUARDA EN BD (relativa)                             │
│                                                               │
│   adminUpdateProduct(id, {                                   │
│     image_url: '/uploads/1710086400000-123.jpg',             │
│     gallery_images: ['/uploads/../../.jpg', '...']           │
│   })                                                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. USUARIO ABRE PÁGINA DE PRODUCTO                           │
│                                                               │
│   Frontend llama: GET /products/123                          │
│   Backend responde con: { image_url: '/uploads/...' }        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. FRONTEND CONVIERTE A ABSOLUTA PARA RENDERIZAR             │
│                                                               │
│   <img src={toAbsoluteUrl(product.imageUrl)} />              │
│   ↓                                                           │
│   <img src="http://localhost:3000/uploads/..." />            │
│   (o https://petit.com/uploads/... en producción)           │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚠️ POR QUÉ EXISTEN DOS URLs

| Aspecto | Relativa (`/uploads/...`) | Absoluta (`http://...`) |
|---------|---------------------------|------------------------|
| **Dónde se guarda** | Base de datos ✓ | Nunca (se calcula on-demand) |
| **Quién la ve** | Admin en formulario ✓ | Frontend en `<img>` tags ✓ |
| **Ventaja** | Portable (cambiar dominio sin actualizar 1000 URLs) | Funciona en cualquier contexto |
| **Desventaja** | Requiere conocer base URL | Acoplada al servidor actual |

---

## 📝 LISTADO COMPLETO DE FOTOS EN DISK vs BD

### En `/public/uploads` (46 archivos):
```
✓ collar doble.jpeg
✓ compartir/corazon.png
✓ compartir/hilo12mm.png
✓ compartir/pulseras para compartir.jpeg
✓ compartir/rompecabezas.png
✓ corazon 10mm.jpeg
✓ corazon 14mm.jpeg
✓ extra collar bolitas.jpeg
✓ extra oulseras.jpeg
✓ fotograbado/fotograbado.jpeg
✓ llavero circular con borla.jpeg
✓ llavero circular doble.jpeg
✓ llavero rectangular doble.jpeg
✓ llavero rectangular.jpeg
✓ llaveros/circular/circular.jpeg
✓ llaveros/corazon/corazon.png
✓ llaveros/cuadrado/cuadrado.jpeg
✓ llaveros/militar/grande/grande.png
✓ llaveros/militar/mediano/mediano.jpeg
✓ mascotas/circular/circular.jpeg
✓ mascotas/hueso/hueso.png
✓ medallas/circulares/12mm.png
✓ medallas/circulares/15mm.png
✓ medallas/circulares/20mm.png
✓ medallas/circulares/25mm.png
✓ medallas/circulares/30mm.jpeg
✓ medallas/corazones/14mm.png
✓ medallas/corazones/20mm.png
✓ medallas/corazones/30mm.png
✓ medallas/dije/dijes.png
✓ medallas/dorada/20mm.png
✓ medallas/placa/cuadrada.png
✓ medallas/placa/militar.png
✓ medallas/rectangulares/doble.png
✓ medallas/rectangulares/simple.png
✓ medallas/rectangulares/triple.png
✓ pulsera de hilo y vidrio facetado.jpeg
✓ pulsera strass con dije 8mm.jpeg
✓ pulseras/circular/cadena-ovalada.png
✓ pulseras/circular/hilo.jpeg
✓ pulseras/circular/simple12mm.jpeg
✓ pulseras/circular/simple20mm.png
✓ pulseras/corazon/corazon.png
✓ pulseras/dije/con_dije.jpeg
✓ pulseras/esclava/esclava.jpeg
✓ pulseras/rectangular/cadena_plana.jpeg
✓ pulseras/rectangular/simple.png
✓ rectangulo horizontal.jpeg
```

---

## ✅ CÓMO EL ADMIN DEBERÍA INGRESAR URLs

### Opción 1: Upload automático (RECOMENDADO)
```
1. Click en "Subir imagen"
2. Selecciona archivo
3. Backend guarda en /public/uploads con timestamp: 1710086400000-123456789.jpg
4. Backend responde: { url: '/uploads/1710086400000-123456789.jpg' }
5. Admin VE en preview y guarda automáticamente
```

**Ventaja:** No hay errores de tipeo, URL garantizada correcta

### Opción 2: Ingreso manual (CUIDADOSO)
```
Admin ingresa en campo "URL manual":
/uploads/medallas/circulares/12mm.png

Backend valida:
✓ Que exista en disco
✓ Que no haya caracteres inválidos
✓ Que sea relativa (no comience con http://)
```

**Riesgo:** Errores de tipeo, rutas CASE-SENSITIVE en Linux/Mac

---

## 🛠️ SCRIPT PARA AUDITAR MATCH

Ver **`scripts/audit-uploads.ts`** para:
- Listar todas las fotos en disco
- Listar todas las URLs en BD
- Detectar huérfanos (fotos sin usar)
- Detectar URLs rotas (en BD sin archivo)

**Uso:**
```bash
cd backend
npx ts-node scripts/audit-uploads.ts
```

---

## 🎯 RESUMEN

| Pregunta | Respuesta |
|----------|-----------|
| **¿Por qué dos URLs?** | Relativa en BD (portable), absoluta en frontend (funciona en HTML) |
| **¿Qué debería saber el admin?** | Solo la relativa (`/uploads/...`), el frontend convierte automáticamente |
| **¿Cómo ingresa URLs?** | Recomendado: upload automático; manual: pegar ruta exacta relativa |
| **¿Dónde se guardan?** | Disco en `/public/uploads`; URL en `products.image_url` o `products.gallery_images` |
| **¿Cómo auditar?** | Script `audit-uploads.ts` compara disco vs BD |

