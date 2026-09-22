SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- Tabla `carritos`
-- --------------------------------------------------------
CREATE TABLE `carritos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `ubicacion_lat` decimal(10,8) NOT NULL,
  `ubicacion_lng` decimal(10,8) NOT NULL,
  `estado` enum('online','warning','offline') DEFAULT 'online',
  `stock_cajas` int(11) NOT NULL DEFAULT 0,
  `ultima_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `carritos` (`id`, `nombre`, `ubicacion_lat`, `ubicacion_lng`, `estado`, `stock_cajas`) VALUES
(1, 'Carrito #1: Plaza Central', -36.53000000, -56.69000000, 'online', 12),
(2, 'Carrito #2: Peatonal / Playa', -36.54000000, -56.70000000, 'warning', 5);

-- --------------------------------------------------------
-- Tabla `usuarios` (Corregida)
-- --------------------------------------------------------
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL, -- Soporta hashes de password_hash()
  `telefono` varchar(30) DEFAULT NULL,
  `rol` enum('admin','empleado','cliente') NOT NULL DEFAULT 'cliente',
  `carrito_id` int(11) DEFAULT NULL, -- Si es empleado, se asigna a un carrito
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `carrito_id` (`carrito_id`),
  CONSTRAINT `fk_usuario_carrito` FOREIGN KEY (`carrito_id`) REFERENCES `carritos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabla `productos`
-- --------------------------------------------------------
CREATE TABLE `productos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo` enum('bolsa','caja','maletin') NOT NULL,
  `subtipo` varchar(50) DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `productos` (`id`, `tipo`, `subtipo`, `precio`) VALUES
(1, 'bolsa', NULL, 1500.00),
(2, 'caja', NULL, 2500.00),
(3, 'maletin', 'Spiderman', 4000.00),
(4, 'maletin', 'Cars', 4000.00),
(5, 'maletin', 'Dragon Ball', 4000.00),
(6, 'maletin', 'Barbie', 4000.00);

-- --------------------------------------------------------
-- Tabla `ventas`
-- --------------------------------------------------------
CREATE TABLE `ventas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `carrito_id` int(11) NOT NULL,
  `producto_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `fecha_venta` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `carrito_id` (`carrito_id`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `ventas_ibfk_1` FOREIGN KEY (`carrito_id`) REFERENCES `carritos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ventas_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabla `configuracion_promo`
-- --------------------------------------------------------
CREATE TABLE `configuracion_promo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `total_ventas_historicas` int(11) NOT NULL DEFAULT 0,
  `ventas_hoy` int(11) NOT NULL DEFAULT 0,
  `meta_actual` int(11) NOT NULL DEFAULT 100,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `configuracion_promo` (`id`, `total_ventas_historicas`, `ventas_hoy`, `meta_actual`) VALUES
(1, 4500, 128, 200);

-- --------------------------------------------------------
-- Tabla `resenas` (Optimizada)
-- --------------------------------------------------------
CREATE TABLE `resenas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_cliente` varchar(100) NOT NULL,
  `comentario` text NOT NULL,
  `puntuacion` tinyint(1) NOT NULL DEFAULT 5, -- Número del 1 al 5
  `carrito_id` int(11) DEFAULT NULL, -- Saber a qué carrito opinaron
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `estado` enum('pendiente','aprobada','rechazada') DEFAULT 'aprobada',
  PRIMARY KEY (`id`),
  KEY `carrito_id` (`carrito_id`),
  CONSTRAINT `fk_resena_carrito` FOREIGN KEY (`carrito_id`) REFERENCES `carritos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `resenas` (`id`, `nombre_cliente`, `comentario`, `puntuacion`, `estado`) VALUES
(1, 'Carlos M.', '¡Los pochoclos del carrito de la plaza estaban súper frescos!', 5, 'aprobada'),
(2, 'María L.', 'Muy buen combo el maletín de Cars para los chicos.', 4, 'aprobada');

COMMIT;