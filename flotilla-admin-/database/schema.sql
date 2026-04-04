CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE licencia_tipo AS ENUM ('B', 'C', 'D', 'E');
CREATE TYPE estatus_chofer AS ENUM ('activo', 'inactivo', 'suspendido');
CREATE TYPE estatus_vehiculo AS ENUM ('disponible', 'en_servicio', 'mantenimiento', 'baja');
CREATE TYPE estatus_pago AS ENUM ('pendiente', 'pagado');
CREATE TYPE metodo_pago AS ENUM ('efectivo', 'deposito');

CREATE TABLE choferes (
    id_chofer        SERIAL PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100) NOT NULL,
    telefono         VARCHAR(15),
    licencia         licencia_tipo DEFAULT 'B',
    fecha_de_ingreso DATE NOT NULL DEFAULT CURRENT_DATE,
    estatus          estatus_chofer DEFAULT 'activo',
    created_at       TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE vehiculos (
    id_vehiculo  SERIAL PRIMARY KEY,
    placa        VARCHAR(10) UNIQUE NOT NULL,
    marca        VARCHAR(50) NOT NULL,
    modelo       VARCHAR(50) NOT NULL,
    anio         SMALLINT NOT NULL,
    color        VARCHAR(30),
    numero_serie VARCHAR(50) UNIQUE,
    estatus      estatus_vehiculo DEFAULT 'disponible',
    created_at   TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE asignaciones (
    id_asignacion SERIAL PRIMARY KEY,
    id_chofer     INT NOT NULL,
    id_vehiculo   INT NOT NULL,
    fecha_inicio  DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin     DATE,
    activa        BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_asignaciones_chofer FOREIGN KEY (id_chofer) REFERENCES choferes(id_chofer),
    CONSTRAINT fk_asignaciones_vehiculo FOREIGN KEY (id_vehiculo) REFERENCES vehiculos(id_vehiculo)
);


CREATE TABLE pagos (
    id_pago      SERIAL PRIMARY KEY,
    id_chofer    INT NOT NULL,
    monto        NUMERIC(10, 2) NOT NULL,
    fecha_pago   DATE,
    estatus      estatus_pago DEFAULT 'pendiente',
    metodo_pago  metodo_pago DEFAULT 'efectivo',
    notas        TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_pagos_chofer FOREIGN KEY (id_chofer) REFERENCES choferes(id_chofer)
);


CREATE OR REPLACE VIEW vista_pagos_pendientes AS
SELECT 
    c.nombre, 
    c.apellido_paterno,
    v.placa,
    v.marca,
    v.modelo,
    p.monto,
    p.fecha_pago,
    p.estatus,
    p.notas
FROM pagos p
JOIN choferes c ON p.id_chofer = c.id_chofer
LEFT JOIN asignaciones a ON a.id_chofer = c.id_chofer AND a.activa = TRUE
LEFT JOIN vehiculos v ON v.id_vehiculo = a.id_vehiculo
WHERE p.estatus = 'pendiente'
ORDER BY p.fecha_pago ASC;