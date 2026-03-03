-- =============================================
-- ARQUITECTURAMULTI-TENANT (SAAS)
-- Ejecutar TODO esto en el SQL Editor de Supabase
-- IMPORTANTE: Esto borrará los datos actuales para resetear la estructura.
-- =============================================

-- Limpiar tablas existentes para re-crear con tenant_id
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS royalties CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS inventory_digital CASCADE;
DROP TABLE IF EXISTS inventory_physical CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- 0. TABLA DE WORKSPACES / EDITORIALES (TENANTS)
CREATE TABLE tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    plan TEXT DEFAULT 'PRO',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    active BOOLEAN DEFAULT true
);

-- 1. USUARIOS
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'FREELANCE', 'AUTOR')),
    avatar TEXT,
    title TEXT,
    bio TEXT,
    social_links JSONB DEFAULT '{}',
    first_login BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(email) -- El email debe ser único en toda la plataforma
);

-- 2. LIBROS
CREATE TABLE books (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    author_id TEXT REFERENCES users(id),
    author_name TEXT,
    isbn TEXT,
    genre TEXT,
    status TEXT DEFAULT 'Original',
    assigned_to JSONB DEFAULT '[]',
    royalty_percent NUMERIC DEFAULT 0,
    advance NUMERIC DEFAULT 0,
    pvp NUMERIC DEFAULT 0,
    contract_expiry DATE,
    created_at DATE DEFAULT CURRENT_DATE,
    cover TEXT,
    synopsis TEXT,
    tiraje NUMERIC DEFAULT 0,
    escandallo_costs JSONB DEFAULT '{"edicion": 0, "correccion": 0, "maquetacion": 0, "diseno": 0, "impresion": 0, "marketing": 0, "distribucion": 0, "otros": 0}'::jsonb
);

-- 3. INVENTARIO FÍSICO
CREATE TABLE inventory_physical (
    id SERIAL PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    entries JSONB DEFAULT '[]',
    exits JSONB DEFAULT '[]'
);

-- 4. INVENTARIO DIGITAL
CREATE TABLE inventory_digital (
    id SERIAL PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
    versions JSONB DEFAULT '[]',
    sales JSONB DEFAULT '[]'
);

-- 5. FACTURAS
CREATE TABLE invoices (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('ingreso', 'egreso')),
    concept TEXT,
    amount NUMERIC DEFAULT 0,
    provider TEXT,
    date DATE,
    status TEXT
);

-- 6. ROYALTIES / LIQUIDACIONES
CREATE TABLE royalties (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    author_id TEXT REFERENCES users(id),
    book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
    period TEXT,
    total_sales INTEGER DEFAULT 0,
    sales_amount NUMERIC DEFAULT 0,
    royalty_percent NUMERIC DEFAULT 0,
    gross_royalty NUMERIC DEFAULT 0,
    advance NUMERIC DEFAULT 0,
    net_royalty NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pendiente'
);

-- 7. AUDIT LOG
CREATE TABLE audit_log (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    date TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT,
    user_name TEXT,
    action TEXT,
    type TEXT DEFAULT 'general'
);

-- 8. COMENTARIOS
CREATE TABLE comments (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
    user_id TEXT,
    user_name TEXT,
    role TEXT,
    text TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    category TEXT
);

-- 9. ALERTAS
CREATE TABLE alerts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    type TEXT,
    book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
    message TEXT,
    date DATE DEFAULT CURRENT_DATE,
    read BOOLEAN DEFAULT false
);

-- =============================================
-- CONFIGURACIÓN REALTIME
-- =============================================
-- Aseguramos que todas las tablas envíen la data completa al cliente
ALTER TABLE tenants REPLICA IDENTITY FULL;
ALTER TABLE users REPLICA IDENTITY FULL;
ALTER TABLE books REPLICA IDENTITY FULL;
ALTER TABLE inventory_physical REPLICA IDENTITY FULL;
ALTER TABLE invoices REPLICA IDENTITY FULL;
ALTER TABLE royalties REPLICA IDENTITY FULL;
ALTER TABLE comments REPLICA IDENTITY FULL;
ALTER TABLE audit_log REPLICA IDENTITY FULL;
ALTER TABLE alerts REPLICA IDENTITY FULL;

-- Re-crear publicación (si existe, la borramos y la creamos)
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
    users, books, inventory_physical, invoices, royalties, comments, audit_log, alerts;

-- =============================================
-- HABILITAR RLS (Row Level Security) Básico
-- =============================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_physical ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_digital ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE royalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (Se asume filtro a nivel de aplicación (app-level isolation) para simplificar la migración frontend actual)
CREATE POLICY "Public Tenant Access" ON tenants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public User Access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Book Access" ON books FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Inv Phys Access" ON inventory_physical FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Inv Dig Access" ON inventory_digital FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Inv Access" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Royalties Access" ON royalties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Audit Access" ON audit_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Comments Access" ON comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Alerts Access" ON alerts FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- DATOS INICIALES (SEED) - TENANT TEST
-- =============================================

-- Crear la primera editorial (Tenant Prueba)
INSERT INTO tenants (id, name, plan) VALUES 
('t1', 'Ediciones El Faro (Demo)', 'PRO');

-- Usuarios (Asignados al tenant t1)
INSERT INTO users (id, tenant_id, email, password, name, role, avatar, title, bio, social_links, first_login) VALUES
('u1', 't1', 'admin@editorial.cl', 'admin123', 'Carolina Méndez', 'ADMIN', 'CM', 'Editora Jefe', NULL, '{}', false),
('u2', 't1', 'freelance@editorial.cl', 'free123', 'Diego Valenzuela', 'FREELANCE', 'DV', 'Corrector de Estilo', NULL, '{}', true),
('u3', 't1', 'autor@editorial.cl', 'autor123', 'Isabel Allende Torres', 'AUTOR', 'IA', 'Autora', 'Escritora chilena con más de 15 años de carrera literaria.', '{"instagram": "@isabelallendet"}', false),
('u4', 't1', 'freelance2@editorial.cl', 'free123', 'Martina Rojas', 'FREELANCE', 'MR', 'Diseñadora Editorial', NULL, '{}', false),
('u5', 't1', 'autor2@editorial.cl', 'autor123', 'Roberto Fuentes', 'AUTOR', 'RF', 'Autor', 'Poeta y ensayista. Ganador del Premio Nacional 2023.', '{}', false);

-- Libros (Asignados al tenant t1)
INSERT INTO books (id, tenant_id, title, author_id, author_name, isbn, genre, status, assigned_to, royalty_percent, advance, pvp, contract_expiry, created_at, cover, synopsis) VALUES
('b1', 't1', 'Los Ecos del Sur', 'u3', 'Isabel Allende Torres', '978-956-123-456-7', 'Novela Histórica', 'Edición', '["u2"]', 10, 1500000, 18990, '2027-06-15', '2025-08-10', NULL, 'Una saga familiar ambientada en el Chile de los años 70.'),
('b2', 't1', 'Crónicas de Valparaíso', 'u5', 'Roberto Fuentes', '978-956-654-321-0', 'Poesía', 'Corrección', '["u2"]', 12, 800000, 14990, '2027-03-20', '2025-10-01', NULL, 'Colección de poemas sobre la vida en el puerto.');

-- Inventario, alertas, comentarios (Para b1 y b2)
INSERT INTO inventory_physical (tenant_id, book_id, stock, min_stock, entries, exits) VALUES
('t1', 'b1', 342, 100, '[{"date": "2025-06-15", "qty": 500}]', '[{"date": "2025-07-01", "qty": 150}]');

INSERT INTO audit_log (id, tenant_id, date, user_id, user_name, action, type) VALUES
('a1', 't1', '2026-02-25T10:30:00', 'u1', 'Carolina Méndez', 'Movió ''Los Ecos del Sur'' a Edición', 'kanban');

INSERT INTO comments (id, tenant_id, book_id, user_id, user_name, role, text, date, category) VALUES
('c1', 't1', 'b1', 'u1', 'Carolina Méndez', 'ADMIN', 'Excelente capítulo.', '2026-02-25T09:00:00', 'Edición');
