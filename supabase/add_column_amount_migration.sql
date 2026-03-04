-- Copia y pega este comando en el editor SQL de Supabase para añadir la columna de monto
ALTER TABLE documents ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT NULL;
