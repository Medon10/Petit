-- Petit - Catálogo de joyería
-- Esquema + datos iniciales
-- Nota: usamos `variants` como nombre de tabla.

CREATE DATABASE IF NOT EXISTS petit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE petit;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS order_item_extras;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS extras;
DROP TABLE IF EXISTS variants;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS admin_users;
SET FOREIGN_KEY_CHECKS = 1;

-- Categorías
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Productos
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    is_featured TINYINT(1) NOT NULL DEFAULT 0,
    featured_rank INT NOT NULL DEFAULT 0,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Variantes
CREATE TABLE variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Extras / Adicionales
CREATE TABLE extras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category_type ENUM('general', 'dije', 'cadena', 'servicio') DEFAULT 'general'
);

-- -----------------------------------------------------
-- Pedidos (compras como invitado)
-- -----------------------------------------------------

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(150),
    customer_phone VARCHAR(50),
    notes TEXT,
    status ENUM('pending', 'paid', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    variant_name VARCHAR(100),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE SET NULL
);

CREATE TABLE order_item_extras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_item_id INT NOT NULL,
    extra_id INT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    extra_name VARCHAR(100) NOT NULL,
    category_type ENUM('general', 'dije', 'cadena', 'servicio') DEFAULT 'general',
    FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
    FOREIGN KEY (extra_id) REFERENCES extras(id) ON DELETE SET NULL
);

-- Admin (solo para gestión del catálogo)
-- Nota: guardá `password_hash` con bcrypt.
CREATE TABLE admin_users (
    id TINYINT UNSIGNED NOT NULL,
    username VARCHAR(80) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT admin_singleton CHECK (id = 1)
);

-- Ejemplo de inserción (reemplazar el hash por uno real generado con bcrypt)
-- IMPORTANTE: el admin es único, siempre con id=1
-- INSERT INTO admin_users (id, username, password_hash) VALUES (1, 'admin', '$2a$10$REEMPLAZAR_CON_HASH_REAL');

-- -----------------------------------------------------
-- Datos iniciales
-- -----------------------------------------------------

INSERT INTO categories (id, name) VALUES 
(1, 'Medallas'),
(2, 'Pulseras'),
(3, 'Llaveros'),
(4, 'Para Compartir'),
(5, 'Dijes'),
(6, 'Dijes para llaveros'),
(7, 'Separadores de libros'),
(8, 'Mascotas'),
(9, 'Fotograbados');

-- --- CATEGORÍA: MEDALLAS (ID 1) ---

INSERT INTO products (category_id, name, description, image_url) VALUES 
(1, 'Medalla Clásica Circular', 'Ideal para grabados completos, frases cortas o diseños detallados.', 'img_medalla_circular.jpg');
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, '30mm (Grande/Extravagante)', 19500),
(@p_id, '25mm (Grande/Detallada)', 19000),
(@p_id, '20mm (Estándar)', 18200),
(@p_id, '15mm (Mediana)', 17200),
(@p_id, '12mm (Pequeña/Sutil)', 16000);

INSERT INTO products (category_id, name, description, image_url) VALUES 
(1, 'Medalla Corazón', 'Forma de corazón, ideal para iniciales, fechas o nombres.', 'img_medalla_corazon.jpg');
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, '30mm', 19500),
(@p_id, '20mm', 18500),
(@p_id, '14mm', 17200),
(@p_id, '10mm', 15200),
(@p_id, 'Corazón Doble', 21000);

INSERT INTO products (category_id, name, description, image_url) VALUES 
(1, 'Medallas Geométricas', 'Diseños modernos como rectángulos y placas.', 'img_geometricas.jpg');
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Barra (Grabado 4 lados)', 26000),
(@p_id, 'Rectángulo Doble', 22000),
(@p_id, 'Rectángulo Triple', 25000),
(@p_id, 'Rectángulo Horizontal', 24500),
(@p_id, 'Placa Rectangular Simple', 18000),
(@p_id, 'Placa Militar', 18200),
(@p_id, 'Placa Cuadrada', 18200);

INSERT INTO products (category_id, name, description, image_url) VALUES 
(1, 'Medalla Gotas', 'Cada gotita puede llevar una letra. Incluye dije strass.', 'img_gotas.jpg');
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Estándar', 22000);

-- --- CATEGORÍA: LLAVEROS (ID 3) ---

INSERT INTO products (category_id, name, description, image_url) VALUES 
(3, 'Llaveros Clásicos', 'Variedad de formas para grabar nombres, fechas o mascotas.', 'img_llaveros_clasicos.jpg');
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Circular 30mm', 17000),
(@p_id, 'Militar', 17000),
(@p_id, 'Cuadrado', 17000),
(@p_id, 'Corazón', 18000),
(@p_id, 'Militar Grande (28x48mm)', 20000);

INSERT INTO products (category_id, name, description, image_url) VALUES 
(3, 'Llaveros Rectangulares', 'Diseños atemporales para Spotify, fechas o nombres.', 'img_llaveros_rect.jpg');
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Rectangular Simple (Pequeño)', 16000),
(@p_id, 'Rectangular Estándar', 18000),
(@p_id, 'Rectangular Doble', 21500);

INSERT INTO products (category_id, name, description, image_url) VALUES 
(3, 'Llavero Circular Doble', 'Dos medallas que se complementan.', 'img_llavero_doble.jpg');
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Estándar', 20000);

-- --- CATEGORÍA: PULSERAS (ID 2) ---

INSERT INTO products (category_id, name, description, image_url) VALUES 
(2, 'Pulseras de Acero', 'Diseños delicados y duraderos.', 'img_pulseras_acero.jpg');
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Corazón', 19000),
(@p_id, 'Clásica', 21000),
(@p_id, 'Con Cadena Plana', 22000),
(@p_id, 'Circular 12mm', 18000),
(@p_id, 'Esclava', 23000),
(@p_id, 'Con Dije Simple', 10000);

INSERT INTO products (category_id, name, description, image_url) VALUES 
(2, 'Pulseras de Hilo y Strass', 'Accesorios simples, livianos y brillantes.', 'img_pulseras_hilo.jpg');
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Hilo con medalla 8mm/12mm', 15000),
(@p_id, 'Strass con Dije 8mm', 17000),
(@p_id, 'Hilo y Vidrio Facetado', 6500);

-- --- CATEGORÍA: PARA COMPARTIR (ID 4) ---

INSERT INTO products (category_id, name, description, image_url) VALUES 
(4, 'Conjuntos para Compartir', 'Para representar vínculos, amistad o amor.', 'img_compartir.jpg');
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Pulseras Hilo 8mm/12mm (Set)', 25000),
(@p_id, 'Pulseras 12mm (Set)', 31000),
(@p_id, 'Rompecabezas (Llaveros/Cadenas)', 25000),
(@p_id, 'Fotograbado Corazón', 25000);

-- --- CATEGORÍA: MASCOTAS (ID 8) ---

INSERT INTO products (category_id, name, description, image_url) VALUES 
(8, 'Identificación Mascota', 'Seguridad y estilo para tu mascota.', 'img_mascotas.jpg');
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Medalla Circular 30mm', 15600),
(@p_id, 'Medalla Hueso', 15600);

-- --- CATEGORÍA: SEPARADORES DE LIBROS (ID 7) ---

INSERT INTO products (category_id, name, description, image_url) VALUES 
(7, 'Separador de Libros', 'Resistentes y delicados, ideales para lectores.', 'img_separador.jpg');
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Estándar', 15000);

-- --- CATEGORÍA: FOTOGRABADOS (ID 9) ---

INSERT INTO products (category_id, name, description, image_url) VALUES 
(9, 'Fotograbados', 'Un recuerdo único convertido en accesorio.', 'img_fotograbado.jpg');
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Clásica', 6000);

-- --- EXTRAS ---

INSERT INTO extras (name, price, category_type) VALUES 
('Grabado Reverso', 3000, 'servicio'),
('Dije Adicional con Grabado', 3600, 'dije'),
('Dije Susanito (Color a elección)', 4000, 'dije'),
('Dije Corazón (Color a elección)', 3000, 'dije'),
('Dije Flor con Strass', 3000, 'dije'),
('Dije Estrella Transparente', 3000, 'dije'),
('Dije Llavero (Pinky Promise, Avión, etc)', 1500, 'dije'),
('Borlas', 1000, 'dije'),
('Cambio a Cadena Cola de Rata (Pulsera)', 2500, 'cadena'),
('Cambio a Cadena Cola de Rata (Collar)', 3500, 'cadena'),
('Cambio a Cadena Bolitas (Collar)', 3500, 'cadena'),
('Cadena Ajustable (Solo Collares)', 4000, 'cadena');
