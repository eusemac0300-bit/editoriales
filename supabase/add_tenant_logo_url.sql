-- =============================================
-- MIGRACIÓN: Agregar logo_url a la tabla tenants
-- Fecha: 2026-06-22
-- Versión app: v3.2.3.19
-- =============================================
-- Ejecutar en el SQL Editor de Supabase

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT NULL;

-- Verificación
SELECT id, name, logo_url FROM tenants LIMIT 10;
