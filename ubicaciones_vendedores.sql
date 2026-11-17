CREATE TABLE IF NOT EXISTS ubicaciones_vendedores (
  usuario_id int(11) NOT NULL,
  latitud decimal(10,8) NOT NULL,
  longitud decimal(11,8) NOT NULL,
  actualizada_en datetime NOT NULL,
  PRIMARY KEY (usuario_id),
  KEY idx_ubicaciones_actualizada_en (actualizada_en),
  CONSTRAINT fk_ubicaciones_vendedores_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
