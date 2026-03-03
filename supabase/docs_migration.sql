-- SQL Editor de Supabase: Copia y ejecuta este script para la sección "Documentos"
-- 1. Crear tabla para registro de documentos generales
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    book_id TEXT REFERENCES books(id) ON DELETE CASCADE, -- Opcional, si está ligado a un libro
    name TEXT NOT NULL,
    type TEXT, -- 'Contrato', 'Manuscrito', 'Portada', etc.
    file_url TEXT,
    size INTEGER,
    uploaded_by TEXT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Configurar RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Documents Access" ON documents FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE documents REPLICA IDENTITY FULL;

-- 3. Crear Storage Bucket para los archivos subidos (PDF, JPG, PNG)
INSERT INTO storage.buckets (id, name, public) VALUES ('editorial_documents', 'editorial_documents', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Storage Access" ON storage.objects FOR ALL USING (bucket_id = 'editorial_documents') WITH CHECK (bucket_id = 'editorial_documents');
