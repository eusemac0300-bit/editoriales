-- =============================================
-- TABLAS PARA LA APP EDITORIAL
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. USUARIOS
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'FREELANCE', 'AUTOR')),
    avatar TEXT,
    title TEXT,
    bio TEXT,
    social_links JSONB DEFAULT '{}',
    first_login BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. LIBROS
CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
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
    synopsis TEXT
);

-- 3. INVENTARIO FÍSICO
CREATE TABLE IF NOT EXISTS inventory_physical (
    id SERIAL PRIMARY KEY,
    book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    entries JSONB DEFAULT '[]',
    exits JSONB DEFAULT '[]'
);

-- 4. INVENTARIO DIGITAL
CREATE TABLE IF NOT EXISTS inventory_digital (
    id SERIAL PRIMARY KEY,
    book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
    versions JSONB DEFAULT '[]',
    sales JSONB DEFAULT '[]'
);

-- 5. FACTURAS
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('ingreso', 'egreso')),
    concept TEXT,
    amount NUMERIC DEFAULT 0,
    provider TEXT,
    date DATE,
    status TEXT
);

-- 6. ROYALTIES / LIQUIDACIONES
CREATE TABLE IF NOT EXISTS royalties (
    id TEXT PRIMARY KEY,
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
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    date TIMESTAMPTZ DEFAULT NOW(),
    user_id TEXT,
    user_name TEXT,
    action TEXT,
    type TEXT DEFAULT 'general'
);

-- 8. COMENTARIOS
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
    user_id TEXT,
    user_name TEXT,
    role TEXT,
    text TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    category TEXT
);

-- 9. ALERTAS
CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    type TEXT,
    book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
    message TEXT,
    date DATE DEFAULT CURRENT_DATE,
    read BOOLEAN DEFAULT false
);

-- =============================================
-- HABILITAR RLS (Row Level Security)
-- Deshabilitado para simplicidad inicial
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_physical ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_digital ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE royalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso público (para anon key)
CREATE POLICY "Allow all for users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for books" ON books FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for inventory_physical" ON inventory_physical FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for inventory_digital" ON inventory_digital FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for royalties" ON royalties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for audit_log" ON audit_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for comments" ON comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for alerts" ON alerts FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- DATOS INICIALES (SEED)
-- =============================================

-- Usuarios
INSERT INTO users (id, email, password, name, role, avatar, title, bio, social_links, first_login) VALUES
('u1', 'admin@editorial.cl', 'admin123', 'Carolina Méndez', 'ADMIN', 'CM', 'Editora Jefe', NULL, '{}', false),
('u2', 'freelance@editorial.cl', 'free123', 'Diego Valenzuela', 'FREELANCE', 'DV', 'Corrector de Estilo', NULL, '{}', true),
('u3', 'autor@editorial.cl', 'autor123', 'Isabel Allende Torres', 'AUTOR', 'IA', 'Autora', 'Escritora chilena con más de 15 años de carrera literaria. Especialista en novela histórica y ficción contemporánea.', '{"instagram": "@isabelallendet", "twitter": "@iallendet"}', false),
('u4', 'freelance2@editorial.cl', 'free123', 'Martina Rojas', 'FREELANCE', 'MR', 'Diseñadora Editorial', NULL, '{}', false),
('u5', 'autor2@editorial.cl', 'autor123', 'Roberto Fuentes', 'AUTOR', 'RF', 'Autor', 'Poeta y ensayista. Ganador del Premio Nacional de Literatura 2023.', '{}', false)
ON CONFLICT (id) DO NOTHING;

-- Libros
INSERT INTO books (id, title, author_id, author_name, isbn, genre, status, assigned_to, royalty_percent, advance, pvp, contract_expiry, created_at, cover, synopsis) VALUES
('b1', 'Los Ecos del Sur', 'u3', 'Isabel Allende Torres', '978-956-123-456-7', 'Novela Histórica', 'Edición', '["u2"]', 10, 1500000, 18990, '2027-06-15', '2025-08-10', NULL, 'Una saga familiar ambientada en el Chile de los años 70 que recorre tres generaciones de mujeres.'),
('b2', 'Crónicas de Valparaíso', 'u5', 'Roberto Fuentes', '978-956-654-321-0', 'Poesía', 'Corrección', '["u2"]', 12, 800000, 14990, '2027-03-20', '2025-10-01', NULL, 'Colección de poemas que retrata la vida cotidiana en los cerros del puerto.'),
('b3', 'El Algoritmo Perdido', 'u3', 'Isabel Allende Torres', '978-956-789-012-3', 'Ciencia Ficción', 'Maquetación', '["u4"]', 10, 2000000, 22990, '2028-01-10', '2025-05-15', NULL, 'En un futuro distópico, una programadora descubre un código que puede cambiar la realidad.'),
('b4', 'Recetas de la Abuela', 'u5', 'Roberto Fuentes', '978-956-321-654-0', 'No Ficción', 'Publicado', '[]', 8, 500000, 12990, '2026-12-01', '2024-11-20', NULL, 'Una recopilación de recetas tradicionales chilenas con historias familiares.'),
('b5', 'Mareas Internas', 'u3', 'Isabel Allende Torres', '978-956-111-222-3', 'Novela Contemporánea', 'Original', '[]', 10, 0, 0, NULL, '2026-02-01', NULL, 'Manuscrito recién recibido sobre relaciones humanas en el Santiago moderno.')
ON CONFLICT (id) DO NOTHING;

-- Inventario Físico
INSERT INTO inventory_physical (book_id, stock, min_stock, entries, exits) VALUES
('b4', 342, 100,
 '[{"date": "2025-06-15", "qty": 500, "type": "imprenta", "note": "Primera edición"}, {"date": "2025-11-20", "qty": 200, "type": "imprenta", "note": "Reimpresión"}]',
 '[{"date": "2025-07-01", "qty": 150, "type": "venta", "note": "Distribución librerías", "revenue": 1948500}, {"date": "2025-08-15", "qty": 8, "type": "cortesia", "note": "Prensa y reseñas"}, {"date": "2025-12-10", "qty": 200, "type": "venta", "note": "Venta navideña", "revenue": 2598000}]'),
('b3', 0, 200, '[]', '[]');

-- Inventario Digital
INSERT INTO inventory_digital (book_id, versions, sales) VALUES
('b4',
 '[{"format": "ePub", "version": "1.0", "uploadDate": "2025-06-10"}, {"format": "PDF", "version": "1.0", "uploadDate": "2025-06-10"}]',
 '[{"platform": "Amazon Kindle", "qty": 89, "revenue": 534210, "period": "2025-Q3"}, {"platform": "Google Books", "qty": 34, "revenue": 203830, "period": "2025-Q3"}, {"platform": "Amazon Kindle", "qty": 120, "revenue": 719880, "period": "2025-Q4"}, {"platform": "Apple Books", "qty": 45, "revenue": 269730, "period": "2025-Q4"}]');

-- Facturas
INSERT INTO invoices (id, book_id, type, concept, amount, provider, date, status) VALUES
('inv1', 'b4', 'egreso', 'Impresión 1ra edición', 2750000, 'Imprenta del Sur', '2025-05-28', 'pagada'),
('inv2', 'b4', 'egreso', 'Edición y corrección', 850000, 'Diego Valenzuela', '2025-04-15', 'pagada'),
('inv3', 'b4', 'egreso', 'Diseño de portada', 350000, 'Martina Rojas', '2025-05-01', 'pagada'),
('inv4', 'b4', 'egreso', 'Reimpresión', 1200000, 'Imprenta del Sur', '2025-11-10', 'pagada'),
('inv5', 'b4', 'ingreso', 'Ventas librerías Jul', 1948500, NULL, '2025-07-31', NULL),
('inv6', 'b4', 'ingreso', 'Ventas navideñas', 2598000, NULL, '2025-12-31', NULL),
('inv7', 'b4', 'ingreso', 'Ventas digitales Q3', 738040, NULL, '2025-09-30', NULL),
('inv8', 'b4', 'ingreso', 'Ventas digitales Q4', 989610, NULL, '2025-12-31', NULL),
('inv9', 'b1', 'egreso', 'Anticipo autora', 1500000, 'Isabel Allende Torres', '2025-08-10', 'pagada'),
('inv10', 'b2', 'egreso', 'Anticipo autor', 800000, 'Roberto Fuentes', '2025-10-01', 'pagada')
ON CONFLICT (id) DO NOTHING;

-- Royalties
INSERT INTO royalties (id, author_id, book_id, period, total_sales, sales_amount, royalty_percent, gross_royalty, advance, net_royalty, status) VALUES
('r1', 'u5', 'b4', '2025-S2', 638, 8274150, 8, 661932, 500000, 161932, 'pendiente')
ON CONFLICT (id) DO NOTHING;

-- Audit Log
INSERT INTO audit_log (id, date, user_id, user_name, action, type) VALUES
('a1', '2026-02-25T10:30:00', 'u1', 'Carolina Méndez', 'Movió ''Los Ecos del Sur'' de Contratación a Edición', 'kanban'),
('a2', '2026-02-24T14:15:00', 'u2', 'Diego Valenzuela', 'Completó corrección de ''Crónicas de Valparaíso''', 'kanban'),
('a3', '2026-02-23T09:00:00', 'u1', 'Carolina Méndez', 'Registró factura #inv4 - Reimpresión $1.200.000', 'finanzas'),
('a4', '2026-02-22T16:45:00', 'u1', 'Carolina Méndez', 'Creó liquidación para Roberto Fuentes - 2025-S2', 'finanzas'),
('a5', '2026-02-20T11:20:00', 'u4', 'Martina Rojas', 'Movió ''El Algoritmo Perdido'' a Maquetación', 'kanban')
ON CONFLICT (id) DO NOTHING;

-- Comentarios
INSERT INTO comments (id, book_id, user_id, user_name, role, text, date, category) VALUES
('c1', 'b1', 'u1', 'Carolina Méndez', 'ADMIN', 'Isabel, el manuscrito tiene una estructura excelente. Necesitamos revisar el capítulo 7, la transición temporal no queda clara.', '2026-02-25T09:00:00', 'Edición'),
('c2', 'b1', 'u2', 'Diego Valenzuela', 'FREELANCE', 'Estoy de acuerdo con Carolina. También encontré algunas inconsistencias en los nombres de personajes secundarios entre caps 5 y 8.', '2026-02-25T10:30:00', 'Corrección'),
('c3', 'b1', 'u1', 'Carolina Méndez', 'ADMIN', 'Diego, perfecto. ¿Puedes preparar un informe de inconsistencias para la autora? Lo necesitamos antes del viernes.', '2026-02-25T11:00:00', 'General'),
('c4', 'b2', 'u2', 'Diego Valenzuela', 'FREELANCE', 'Los poemas de la sección ''Cerro Alegre'' están listos. Me falta la sección ''Ascensores''.', '2026-02-24T14:00:00', 'Corrección')
ON CONFLICT (id) DO NOTHING;

-- Alertas
INSERT INTO alerts (id, type, book_id, message, date, read) VALUES
('al1', 'stock_critico', 'b3', 'El Algoritmo Perdido - Stock en 0 unidades', '2026-02-27', false),
('al2', 'contrato_vencimiento', 'b4', 'Contrato de ''Recetas de la Abuela'' vence el 01/12/2026', '2026-02-27', false),
('al3', 'liquidacion_pendiente', 'b4', 'Liquidación pendiente para Roberto Fuentes - $161.932', '2026-02-27', true)
ON CONFLICT (id) DO NOTHING;
