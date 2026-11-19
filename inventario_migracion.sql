ALTER TABLE `productos`
  ADD COLUMN IF NOT EXISTS `stock` int(11) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS `insumos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `unidad` varchar(30) NOT NULL,
  `imagen` varchar(255) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `insumos`
  MODIFY COLUMN `stock` int(11) NOT NULL DEFAULT 0;

INSERT INTO `insumos` (`id`, `nombre`, `unidad`, `imagen`, `stock`) VALUES
(1, 'Azúcar', 'kg', 'imagenes/azucar_ledesma.png', 25),
(2, 'Maíz', 'kg', 'imagenes/bolsa_maiz.png', 50),
(3, 'Aceite', 'litros', 'imagenes/aceite_natura.png', 20),
(4, 'Coco', 'unidades', 'imagenes/Coco.png.png', 10)
ON DUPLICATE KEY UPDATE
  `nombre` = VALUES(`nombre`),
  `unidad` = VALUES(`unidad`),
  `imagen` = VALUES(`imagen`);
