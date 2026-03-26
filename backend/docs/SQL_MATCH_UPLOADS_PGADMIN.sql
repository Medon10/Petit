-- SQL manual para pgAdmin (PostgreSQL)
-- Match explícito por producto y variante, usando rutas reales en backend/public/uploads.
-- Recomendado: ejecutar en una transacción.

BEGIN;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS gallery_images JSONB;

ALTER TABLE variants
  ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);

-- =====================================================
-- MEDALLAS
-- =====================================================

-- Circulares
UPDATE products p
SET
  image_url = '/uploads/medallas/circulares/20mm.png',
  gallery_images = jsonb_build_array(
    '/uploads/medallas/circulares/12mm.png',
    '/uploads/medallas/circulares/15mm.png',
    '/uploads/medallas/circulares/20mm.png',
    '/uploads/medallas/circulares/25mm.png',
    '/uploads/medallas/circulares/30mm.jpeg'
  )
FROM categories c
WHERE p.category_id = c.id
  AND c.name = 'Medallas'
  AND p.name = 'Circulares';

UPDATE variants v
SET image_url = CASE v.name
  WHEN '12mm' THEN '/uploads/medallas/circulares/12mm.png'
  WHEN '15mm' THEN '/uploads/medallas/circulares/15mm.png'
  WHEN '20mm' THEN '/uploads/medallas/circulares/20mm.png'
  WHEN '25mm' THEN '/uploads/medallas/circulares/25mm.png'
  WHEN '30mm' THEN '/uploads/medallas/circulares/30mm.jpeg'
  ELSE v.image_url
END
WHERE v.product_id = (
  SELECT p.id
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE c.name = 'Medallas' AND p.name = 'Circulares'
  LIMIT 1
);

-- Corazones
UPDATE products p
SET
  image_url = '/uploads/medallas/corazones/20mm.png',
  gallery_images = jsonb_build_array(
    '/uploads/medallas/corazones/14mm.png',
    '/uploads/medallas/corazones/20mm.png',
    '/uploads/medallas/corazones/30mm.png'
  )
FROM categories c
WHERE p.category_id = c.id
  AND c.name = 'Medallas'
  AND p.name = 'Corazones';

UPDATE variants v
SET image_url = CASE v.name
  WHEN '14mm' THEN '/uploads/medallas/corazones/14mm.png'
  WHEN '20mm' THEN '/uploads/medallas/corazones/20mm.png'
  WHEN '30mm' THEN '/uploads/medallas/corazones/30mm.png'
  ELSE v.image_url
END
WHERE v.product_id = (
  SELECT p.id
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE c.name = 'Medallas' AND p.name = 'Corazones'
  LIMIT 1
);

-- Rectangular
UPDATE products p
SET
  image_url = '/uploads/medallas/rectangulares/simple.png',
  gallery_images = jsonb_build_array(
    '/uploads/medallas/rectangulares/simple.png',
    '/uploads/medallas/rectangulares/doble.png',
    '/uploads/medallas/rectangulares/triple.png',
    '/uploads/rectangulo horizontal.jpeg'
  )
FROM categories c
WHERE p.category_id = c.id
  AND c.name = 'Medallas'
  AND p.name = 'Rectangular';

UPDATE variants v
SET image_url = CASE v.name
  WHEN 'Simple' THEN '/uploads/medallas/rectangulares/simple.png'
  WHEN 'Doble' THEN '/uploads/medallas/rectangulares/doble.png'
  WHEN 'Triple' THEN '/uploads/medallas/rectangulares/triple.png'
  WHEN 'Horizontal' THEN '/uploads/rectangulo horizontal.jpeg'
  ELSE v.image_url
END
WHERE v.product_id = (
  SELECT p.id
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE c.name = 'Medallas' AND p.name = 'Rectangular'
  LIMIT 1
);

-- Placa
UPDATE products p
SET
  image_url = '/uploads/medallas/placa/militar.png',
  gallery_images = jsonb_build_array(
    '/uploads/medallas/placa/militar.png',
    '/uploads/medallas/placa/cuadrada.png'
  )
FROM categories c
WHERE p.category_id = c.id
  AND c.name = 'Medallas'
  AND p.name = 'Placa';

UPDATE variants v
SET image_url = CASE v.name
  WHEN 'Militar' THEN '/uploads/medallas/placa/militar.png'
  WHEN 'Cuadrada' THEN '/uploads/medallas/placa/cuadrada.png'
  ELSE v.image_url
END
WHERE v.product_id = (
  SELECT p.id
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE c.name = 'Medallas' AND p.name = 'Placa'
  LIMIT 1
);

-- Línea Dorada
UPDATE products p
SET
  image_url = '/uploads/medallas/dorada/20mm.png',
  gallery_images = jsonb_build_array(
    '/uploads/medallas/dorada/20mm.png'
  )
FROM categories c
WHERE p.category_id = c.id
  AND c.name = 'Medallas'
  AND p.name = 'Línea Dorada';

UPDATE variants v
SET image_url = CASE v.name
  WHEN 'Circular 20mm' THEN '/uploads/medallas/dorada/20mm.png'
  ELSE v.image_url
END
WHERE v.product_id = (
  SELECT p.id
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE c.name = 'Medallas' AND p.name = 'Línea Dorada'
  LIMIT 1
);

-- Dije para Medallas
UPDATE products p
SET
  image_url = '/uploads/medallas/dije/dijes.png',
  gallery_images = jsonb_build_array(
    '/uploads/medallas/dije/dijes.png'
  )
FROM categories c
WHERE p.category_id = c.id
  AND c.name = 'Medallas'
  AND p.name = 'Dije para Medallas';

UPDATE variants v
SET image_url = CASE v.name
  WHEN 'Susanito' THEN '/uploads/medallas/dije/dijes.png'
  WHEN 'Corazón' THEN '/uploads/medallas/dije/dijes.png'
  WHEN 'Flor' THEN '/uploads/medallas/dije/dijes.png'
  WHEN 'Estrella' THEN '/uploads/medallas/dije/dijes.png'
  ELSE v.image_url
END
WHERE v.product_id = (
  SELECT p.id
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE c.name = 'Medallas' AND p.name = 'Dije para Medallas'
  LIMIT 1
);

-- =====================================================
-- LLAVEROS
-- =====================================================

-- Corazón
UPDATE products p
SET
  image_url = '/uploads/llaveros/corazon/corazon.png',
  gallery_images = jsonb_build_array(
    '/uploads/llaveros/corazon/corazon.png'
  )
FROM categories c
WHERE p.category_id = c.id
  AND c.name = 'Llaveros'
  AND p.name = 'Corazón';

UPDATE variants v
SET image_url = CASE v.name
  WHEN 'Estándar' THEN '/uploads/llaveros/corazon/corazon.png'
  ELSE v.image_url
END
WHERE v.product_id = (
  SELECT p.id
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE c.name = 'Llaveros' AND p.name = 'Corazón'
  LIMIT 1
);

-- Militar
UPDATE products p
SET
  image_url = '/uploads/llaveros/militar/mediano/mediano.jpeg',
  gallery_images = jsonb_build_array(
    '/uploads/llaveros/militar/mediano/mediano.jpeg',
    '/uploads/llaveros/militar/grande/grande.png'
  )
FROM categories c
WHERE p.category_id = c.id
  AND c.name = 'Llaveros'
  AND p.name = 'Militar';

UPDATE variants v
SET image_url = CASE v.name
  WHEN 'Mediano' THEN '/uploads/llaveros/militar/mediano/mediano.jpeg'
  WHEN 'Grande' THEN '/uploads/llaveros/militar/grande/grande.png'
  ELSE v.image_url
END
WHERE v.product_id = (
  SELECT p.id
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE c.name = 'Llaveros' AND p.name = 'Militar'
  LIMIT 1
);

-- Circular
UPDATE products p
SET
  image_url = '/uploads/llaveros/circular/circular.jpeg',
  gallery_images = jsonb_build_array(
    '/uploads/llaveros/circular/circular.jpeg'
  )
FROM categories c
WHERE p.category_id = c.id
  AND c.name = 'Llaveros'
  AND p.name = 'Circular';

UPDATE variants v
SET image_url = CASE v.name
  WHEN 'Estándar' THEN '/uploads/llaveros/circular/circular.jpeg'
  ELSE v.image_url
END
WHERE v.product_id = (
  SELECT p.id
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE c.name = 'Llaveros' AND p.name = 'Circular'
  LIMIT 1
);

-- Cuadrado
UPDATE products p
SET
  image_url = '/uploads/llaveros/cuadrado/cuadrado.jpeg',
  gallery_images = jsonb_build_array(
    '/uploads/llaveros/cuadrado/cuadrado.jpeg'
  )
FROM categories c
WHERE p.category_id = c.id
  AND c.name = 'Llaveros'
  AND p.name = 'Cuadrado';

UPDATE variants v
SET image_url = CASE v.name
  WHEN 'Estándar' THEN '/uploads/llaveros/cuadrado/cuadrado.jpeg'
  ELSE v.image_url
END
WHERE v.product_id = (
  SELECT p.id
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE c.name = 'Llaveros' AND p.name = 'Cuadrado'
  LIMIT 1
);

-- =====================================================
-- PULSERAS
-- =====================================================

-- Circular
UPDATE products p
SET
  image_url = '/uploads/pulseras/circular/simple12mm.jpeg',
  gallery_images = jsonb_build_array(
    '/uploads/pulseras/circular/simple12mm.jpeg',
    '/uploads/pulseras/circular/simple20mm.png',
    '/uploads/pulseras/circular/hilo.jpeg',
    '/uploads/pulseras/circular/cadena-ovalada.png'
  )
FROM categories c
WHERE p.category_id = c.id
  AND c.name = 'Pulseras'
  AND p.name = 'Circular';

UPDATE variants v
SET image_url = CASE v.name
  WHEN 'Simple' THEN '/uploads/pulseras/circular/simple12mm.jpeg'
  WHEN 'Hilo' THEN '/uploads/pulseras/circular/hilo.jpeg'
  WHEN 'Cadena Ovalada' THEN '/uploads/pulseras/circular/cadena-ovalada.png'
  ELSE v.image_url
END
WHERE v.product_id = (
  SELECT p.id
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE c.name = 'Pulseras' AND p.name = 'Circular'
  LIMIT 1
);

-- Rectangular
UPDATE products p
SET
  image_url = '/uploads/pulseras/rectangular/simple.png',
  gallery_images = jsonb_build_array(
    '/uploads/pulseras/rectangular/simple.png',
    '/uploads/pulseras/rectangular/cadena_plana.jpeg'
  )
FROM categories c
WHERE p.category_id = c.id
  AND c.name = 'Pulseras'
  AND p.name = 'Rectangular';

UPDATE variants v
SET image_url = CASE v.name
  WHEN 'Simple' THEN '/uploads/pulseras/rectangular/simple.png'
  WHEN 'Cadena Plana' THEN '/uploads/pulseras/rectangular/cadena_plana.jpeg'
  ELSE v.image_url
END
WHERE v.product_id = (
  SELECT p.id
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE c.name = 'Pulseras' AND p.name = 'Rectangular'
  LIMIT 1
);

-- Corazón
UPDATE products p
SET
  image_url = '/uploads/pulseras/corazon/corazon.png',
  gallery_images = jsonb_build_array(
    '/uploads/pulseras/corazon/corazon.png'
  )
FROM categories c
WHERE p.category_id = c.id
  AND c.name = 'Pulseras'
  AND p.name = 'Corazón';

UPDATE variants v
SET image_url = CASE v.name
  WHEN 'Estándar' THEN '/uploads/pulseras/corazon/corazon.png'
  ELSE v.image_url
END
WHERE v.product_id = (
  SELECT p.id
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE c.name = 'Pulseras' AND p.name = 'Corazón'
  LIMIT 1
);

-- Esclava
UPDATE products p
SET
  image_url = '/uploads/pulseras/esclava/esclava.jpeg',
  gallery_images = jsonb_build_array(
    '/uploads/pulseras/esclava/esclava.jpeg'
  )
FROM categories c
WHERE p.category_id = c.id
  AND c.name = 'Pulseras'
  AND p.name = 'Esclava';

UPDATE variants v
SET image_url = CASE v.name
  WHEN 'Estándar' THEN '/uploads/pulseras/esclava/esclava.jpeg'
  ELSE v.image_url
END
WHERE v.product_id = (
  SELECT p.id
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE c.name = 'Pulseras' AND p.name = 'Esclava'
  LIMIT 1
);

-- Con Dije
UPDATE products p
SET
  image_url = '/uploads/pulseras/dije/con_dije.jpeg',
  gallery_images = jsonb_build_array(
    '/uploads/pulseras/dije/con_dije.jpeg'
  )
FROM categories c
WHERE p.category_id = c.id
  AND c.name = 'Pulseras'
  AND p.name = 'Con Dije';

UPDATE variants v
SET image_url = CASE v.name
  WHEN 'Estándar' THEN '/uploads/pulseras/dije/con_dije.jpeg'
  ELSE v.image_url
END
WHERE v.product_id = (
  SELECT p.id
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE c.name = 'Pulseras' AND p.name = 'Con Dije'
  LIMIT 1
);

-- =====================================================
-- PARA COMPARTIR
-- =====================================================

-- Pulseras de Hilo 12mm
UPDATE products p
SET
  image_url = '/uploads/compartir/hilo12mm.png',
  gallery_images = jsonb_build_array(
    '/uploads/compartir/hilo12mm.png',
    '/uploads/compartir/pulseras para compartir.jpeg'
  )
FROM categories c
WHERE p.category_id = c.id
  AND c.name = 'Para Compartir'
  AND p.name = 'Pulseras de Hilo 12mm';

UPDATE variants v
SET image_url = CASE v.name
  WHEN 'Estándar' THEN '/uploads/compartir/hilo12mm.png'
  ELSE v.image_url
END
WHERE v.product_id = (
  SELECT p.id
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE c.name = 'Para Compartir' AND p.name = 'Pulseras de Hilo 12mm'
  LIMIT 1
);

-- Rompecabezas
UPDATE products p
SET
  image_url = '/uploads/compartir/rompecabezas.png',
  gallery_images = jsonb_build_array(
    '/uploads/compartir/rompecabezas.png'
  )
FROM categories c
WHERE p.category_id = c.id
  AND c.name = 'Para Compartir'
  AND p.name = 'Rompecabezas';

UPDATE variants v
SET image_url = CASE v.name
  WHEN 'Estándar' THEN '/uploads/compartir/rompecabezas.png'
  ELSE v.image_url
END
WHERE v.product_id = (
  SELECT p.id
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE c.name = 'Para Compartir' AND p.name = 'Rompecabezas'
  LIMIT 1
);

-- Corazón
UPDATE products p
SET
  image_url = '/uploads/compartir/corazon.png',
  gallery_images = jsonb_build_array(
    '/uploads/compartir/corazon.png'
  )
FROM categories c
WHERE p.category_id = c.id
  AND c.name = 'Para Compartir'
  AND p.name = 'Corazón';

UPDATE variants v
SET image_url = CASE v.name
  WHEN 'Estándar' THEN '/uploads/compartir/corazon.png'
  ELSE v.image_url
END
WHERE v.product_id = (
  SELECT p.id
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE c.name = 'Para Compartir' AND p.name = 'Corazón'
  LIMIT 1
);

-- =====================================================
-- MASCOTAS
-- =====================================================

-- Circular
UPDATE products p
SET
  image_url = '/uploads/mascotas/circular/circular.jpeg',
  gallery_images = jsonb_build_array(
    '/uploads/mascotas/circular/circular.jpeg'
  )
FROM categories c
WHERE p.category_id = c.id
  AND c.name = 'Mascotas'
  AND p.name = 'Circular';

UPDATE variants v
SET image_url = CASE v.name
  WHEN 'Estándar' THEN '/uploads/mascotas/circular/circular.jpeg'
  ELSE v.image_url
END
WHERE v.product_id = (
  SELECT p.id
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE c.name = 'Mascotas' AND p.name = 'Circular'
  LIMIT 1
);

-- Hueso
UPDATE products p
SET
  image_url = '/uploads/mascotas/hueso/hueso.png',
  gallery_images = jsonb_build_array(
    '/uploads/mascotas/hueso/hueso.png'
  )
FROM categories c
WHERE p.category_id = c.id
  AND c.name = 'Mascotas'
  AND p.name = 'Hueso';

UPDATE variants v
SET image_url = CASE v.name
  WHEN 'Chico' THEN '/uploads/mascotas/hueso/hueso.png'
  WHEN 'Grande' THEN '/uploads/mascotas/hueso/hueso.png'
  ELSE v.image_url
END
WHERE v.product_id = (
  SELECT p.id
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE c.name = 'Mascotas' AND p.name = 'Hueso'
  LIMIT 1
);

-- =====================================================
-- FOTOGRABADO
-- =====================================================

-- Simple
UPDATE products p
SET
  image_url = '/uploads/fotograbado/fotograbado.jpeg',
  gallery_images = jsonb_build_array(
    '/uploads/fotograbado/fotograbado.jpeg'
  )
FROM categories c
WHERE p.category_id = c.id
  AND c.name = 'Fotograbado'
  AND p.name = 'Simple';

UPDATE variants v
SET image_url = CASE v.name
  WHEN 'Estándar' THEN '/uploads/fotograbado/fotograbado.jpeg'
  ELSE v.image_url
END
WHERE v.product_id = (
  SELECT p.id
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE c.name = 'Fotograbado' AND p.name = 'Simple'
  LIMIT 1
);

-- Doble
UPDATE products p
SET
  image_url = '/uploads/fotograbado/fotograbado.jpeg',
  gallery_images = jsonb_build_array(
    '/uploads/fotograbado/fotograbado.jpeg'
  )
FROM categories c
WHERE p.category_id = c.id
  AND c.name = 'Fotograbado'
  AND p.name = 'Doble';

UPDATE variants v
SET image_url = CASE v.name
  WHEN 'Estándar' THEN '/uploads/fotograbado/fotograbado.jpeg'
  ELSE v.image_url
END
WHERE v.product_id = (
  SELECT p.id
  FROM products p
  JOIN categories c ON c.id = p.category_id
  WHERE c.name = 'Fotograbado' AND p.name = 'Doble'
  LIMIT 1
);

-- =====================================================
-- Verificación rápida
-- =====================================================

SELECT c.name AS category, p.id, p.name, p.image_url, p.gallery_images
FROM products p
JOIN categories c ON c.id = p.category_id
ORDER BY c.id, p.id;

SELECT c.name AS category, p.name AS product_name, v.id, v.name, v.image_url
FROM variants v
JOIN products p ON p.id = v.product_id
JOIN categories c ON c.id = p.category_id
ORDER BY c.id, p.id, v.id;

COMMIT;

-- Si prefieres revisar antes de confirmar, cambia COMMIT por ROLLBACK.
