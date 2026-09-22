-- ==========================================
-- SCRIPT COMPLETO DE BASE DE DATOS - POCHOCLOS APP
-- Compatible con MySQL / MariaDB / PostgreSQL
-- ==========================================

DROP DATABASE IF EXISTS pochoclos_db;
CREATE DATABASE pochoclos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pochoclos_db;

-- 1. TABLA: Carritos de Venta
CREATE TABLE carritos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ubicacion_lat DECIMAL(10, 8) NOT NULL,
    ubicacion_lng DECIMAL(10, 8) NOT NULL,
    estado ENUM('online', 'warning', 'offline') DEFAULT 'online',
    stock_cajas INT NOT NULL DEFAULT 0,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. TABLA: Catálogo de Productos
CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('bolsa', 'caja', 'maletin') NOT NULL,
    subtipo VARCHAR(50) DEFAULT NULL, -- Usado para la temática si es 'maletin'
    precio DECIMAL(10, 2) NOT NULL
) ENGINE=InnoDB;

-- 3. TABLA: Registro de Ventas
CREATE TABLE ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    carrito_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (carrito_id) REFERENCES carritos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 4. TABLA: Reseñas de Clientes
CREATE TABLE resenas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_cliente VARCHAR(100) NOT NULL,
    comentario TEXT NOT NULL,
    puntuacion VARCHAR(10) NOT NULL, -- Almacena los emojis de pochoclo
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'aprobada'
) ENGINE=InnoDB;

-- 5. TABLA: Estado de Promociones
CREATE TABLE configuracion_promo (
    id INT PRIMARY KEY,
    total_ventas_historicas INT NOT NULL DEFAULT 0,
    ventas_hoy INT NOT NULL DEFAULT 0,
    meta_actual INT NOT NULL DEFAULT 100
) ENGINE=InnoDB;

-- ==========================================
-- INSERCIÓN DE DATOS INICIALES (SEEDERS)
-- ==========================================

-- Carritos activos
INSERT INTO carritos (id, nombre, ubicacion_lat, ubicacion_lng, estado, stock_cajas) VALUES 
(1, 'Carrito #1: Plaza Central', -36.53000000, -56.69000000, 'online', 12),
(2, 'Carrito #2: Peatonal / Playa', -36.54000000, -56.70000000, 'warning', 5);

-- Catálogo
INSERT INTO productos (id, tipo, subtipo, precio) VALUES 
(1, 'bolsa', NULL, 1500.00),
(2, 'caja', NULL, 2500.00),
(3, 'maletin', 'Spiderman', 4000.00),
(4, 'maletin', 'Cars', 4000.00),
(5, 'maletin', 'Dragon Ball', 4000.00),
(6, 'maletin', 'Barbie', 4000.00);

-- Contador inicial para la app
INSERT INTO configuracion_promo (id, total_ventas_historicas, ventas_hoy, meta_actual) VALUES 
(1, 4500, 128, 200);

-- Reseñas cargadas
INSERT INTO resenas (nombre_cliente, comentario, puntuacion) VALUES 
('Carlos M.', '¡Los pochoclos del carrito de la plaza estaban súper frescos!', '🍿🍿🍿🍿🍿'),
('María L.', 'Muy buen combo el maletín de Cars para los chicos.', '🍿🍿🍿🍿');