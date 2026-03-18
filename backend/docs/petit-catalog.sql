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

-- Pedidos (compras como invitado)
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
CREATE TABLE admin_users (
    id TINYINT UNSIGNED NOT NULL,
    username VARCHAR(80) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT admin_singleton CHECK (id = 1)
);

-- IMPORTANTE: el admin es único, siempre con id=1
INSERT INTO admin_users (id, username, password_hash) VALUES (1, 'admin', 'julimatu12');

-- -----------------------------------------------------
-- Datos iniciales
-- -----------------------------------------------------

INSERT INTO categories (id, name) VALUES 
(1, 'Medallas'),
(2, 'Llaveros'),
(3, 'Pulseras'),
(4, 'Para Compartir'),
(5, 'Mascotas'),
(6, 'Fotograbado');

-- =====================================================
-- CATEGORÍA: MEDALLAS (ID 1)
-- =====================================================

INSERT INTO products (category_id, name, description, image_url) VALUES 
(1, 'Circulares', 'Medallas circulares de acero inoxidable para grabado personalizado.', NULL);
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, '12mm', 15000),
(@p_id, '15mm', 17500),
(@p_id, '20mm', 18500),
(@p_id, '25mm', 19000),
(@p_id, '30mm', 20000);

INSERT INTO products (category_id, name, description, image_url) VALUES 
(1, 'Corazones', 'Medallas en forma de corazón, ideales para nombres, iniciales o fechas.', NULL);
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, '14mm', 16000),
(@p_id, '20mm', 18000),
(@p_id, '30mm', 20000);

INSERT INTO products (category_id, name, description, image_url) VALUES 
(1, 'Rectangular', 'Medallas rectangulares con distintos formatos de grabado.', NULL);
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Simple', 18000),
(@p_id, 'Doble', 24000),
(@p_id, 'Triple', 26000),
(@p_id, 'Horizontal', 24000);

INSERT INTO products (category_id, name, description, image_url) VALUES 
(1, 'Placa', 'Placas de acero para grabado con estilo militar o cuadrado.', NULL);
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Militar', 18200),
(@p_id, 'Cuadrada', 18200);

INSERT INTO products (category_id, name, description, image_url) VALUES 
(1, 'Línea Dorada', 'Medalla circular con acabado dorado, edición especial.', NULL);
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Circular 20mm', 22000);

INSERT INTO products (category_id, name, description, image_url) VALUES 
(1, 'Dije para Medallas', 'Dijes decorativos para complementar tus medallas.', NULL);
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Susanito', 4000),
(@p_id, 'Corazón', 2500),
(@p_id, 'Flor', 2500),
(@p_id, 'Estrella', 2500);

-- =====================================================
-- CATEGORÍA: LLAVEROS (ID 2)
-- =====================================================

INSERT INTO products (category_id, name, description, image_url) VALUES 
(2, 'Corazón', 'Llavero en forma de corazón para grabar nombres o iniciales.', NULL);
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Estándar', 19000);

INSERT INTO products (category_id, name, description, image_url) VALUES 
(2, 'Militar', 'Llavero estilo militar, resistente y con espacio para grabado.', NULL);
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Mediano', 19000),
(@p_id, 'Grande', 20000);

INSERT INTO products (category_id, name, description, image_url) VALUES 
(2, 'Circular', 'Llavero circular clásico para grabado personalizado.', NULL);
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Estándar', 19000);

INSERT INTO products (category_id, name, description, image_url) VALUES 
(2, 'Cuadrado', 'Llavero cuadrado con amplio espacio para grabado.', NULL);
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Estándar', 19000);

-- =====================================================
-- CATEGORÍA: PULSERAS (ID 3)
-- =====================================================

INSERT INTO products (category_id, name, description, image_url) VALUES 
(3, 'Circular', 'Pulsera circular de 12mm personalizable.', NULL);
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Simple', 20000),
(@p_id, 'Hilo', 17000),
(@p_id, 'Cadena Ovalada', 23000);

INSERT INTO products (category_id, name, description, image_url) VALUES 
(3, 'Rectangular', 'Pulsera rectangular con espacio para grabado.', NULL);
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Simple', 23000),
(@p_id, 'Cadena Plana', 23000);

INSERT INTO products (category_id, name, description, image_url) VALUES 
(3, 'Corazón', 'Pulsera en forma de corazón.', NULL);
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Estándar', 20000);

INSERT INTO products (category_id, name, description, image_url) VALUES 
(3, 'Esclava', 'Pulsera tipo esclava de acero inoxidable con grabado.', NULL);
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Estándar', 25000);

INSERT INTO products (category_id, name, description, image_url) VALUES 
(3, 'Con Dije', 'Pulsera con dije decorativo incluido.', NULL);
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Estándar', 12000);

-- =====================================================
-- CATEGORÍA: PARA COMPARTIR (ID 4)
-- =====================================================

INSERT INTO products (category_id, name, description, image_url) VALUES 
(4, 'Pulseras de Hilo 12mm', 'Set de pulseras de hilo con medalla para compartir entre dos personas.', NULL);
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Estándar', 28000);

INSERT INTO products (category_id, name, description, image_url) VALUES 
(4, 'Rompecabezas', 'Dos piezas que encajan perfectamente, ideal para parejas o amigos.', NULL);
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Estándar', 20000);

INSERT INTO products (category_id, name, description, image_url) VALUES 
(4, 'Corazón', 'Medalla corazón partida en dos para compartir.', NULL);
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Estándar', 20000);

-- =====================================================
-- CATEGORÍA: MASCOTAS (ID 5)
-- =====================================================

INSERT INTO products (category_id, name, description, image_url) VALUES 
(5, 'Circular', 'Chapa identificadora circular para mascotas.', NULL);
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Estándar', 16000);

INSERT INTO products (category_id, name, description, image_url) VALUES 
(5, 'Hueso', 'Chapa identificadora en forma de hueso para mascotas.', NULL);
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Chico', 14500),
(@p_id, 'Grande', 17000);

-- =====================================================
-- CATEGORÍA: FOTOGRABADO (ID 6)
-- =====================================================

INSERT INTO products (category_id, name, description, image_url) VALUES 
(6, 'Simple', 'Fotograbado en una cara de la medalla.', NULL);
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Estándar', 6500);

INSERT INTO products (category_id, name, description, image_url) VALUES 
(6, 'Doble', 'Fotograbado en ambas caras de la medalla.', NULL);
SET @p_id = LAST_INSERT_ID();
INSERT INTO variants (product_id, name, price) VALUES 
(@p_id, 'Estándar', 10000);

-- =====================================================
-- EXTRAS
-- =====================================================

INSERT INTO extras (name, price, category_type) VALUES 
('Grabado Doble', 3500, 'servicio'),
('Cadena Cola de Rata', 4000, 'cadena'),
('Cadena Ajustable', 4000, 'cadena'),
('Borla', 1000, 'dije'),
('Dije Extra con Grabado', 4500, 'dije');