-- MIGRACIÓN COMPLETA PARA TABLAS FALTANTES
-- Copia y pega esto en el SQL Editor de Supabase

-- 1. TABLA DE PROVEEDORES
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    category TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE ÓRDENES DE COMPRA
CREATE TABLE IF NOT EXISTS purchase_orders (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
    supplier_id TEXT REFERENCES suppliers(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 0,
    unit_cost NUMERIC DEFAULT 0,
    total_cost NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'BORRADOR',
    date_ordered TIMESTAMPTZ DEFAULT NOW(),
    expected_delivery DATE,
    received_quantity INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE GASTOS
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    category TEXT,
    concept TEXT,
    amount NUMERIC DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'Pagado',
    supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE VENTAS
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    book_id TEXT REFERENCES books(id) ON DELETE SET NULL,
    book_title TEXT,
    channel TEXT,
    type TEXT,
    quantity INTEGER DEFAULT 0,
    unit_price NUMERIC DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    neto NUMERIC DEFAULT 0,
    iva NUMERIC DEFAULT 0,
    sale_date DATE DEFAULT CURRENT_DATE,
    client_name TEXT,
    document_ref TEXT,
    status TEXT DEFAULT 'Completada',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA DE CONSIGNACIONES
CREATE TABLE IF NOT EXISTS consignments (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
    client_name TEXT,
    contact_info TEXT,
    sent_date DATE DEFAULT CURRENT_DATE,
    sent_quantity INTEGER DEFAULT 0,
    sold_quantity INTEGER DEFAULT 0,
    returned_quantity INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Activa',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CONFIGURACIÓN DE SEGURIDAD Y REALTIME
-- =============================================

-- HABILITAR RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignments ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PÚBLICAS (Filtro por tenant_id se maneja en la App)
CREATE POLICY "Public Suppliers Access" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public PO Access" ON purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Expenses Access" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Sales Access" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Consignments Access" ON consignments FOR ALL USING (true) WITH CHECK (true);

-- ACTUALIZAR REALTIME
ALTER TABLE suppliers REPLICA IDENTITY FULL;
ALTER TABLE purchase_orders REPLICA IDENTITY FULL;
ALTER TABLE expenses REPLICA IDENTITY FULL;
ALTER TABLE sales REPLICA IDENTITY FULL;
ALTER TABLE consignments REPLICA IDENTITY FULL;

-- RE-CREAR PUBLICACIÓN PARA INCLUIR NUEVAS TABLAS
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
    users, books, inventory_physical, invoices, royalties, comments, audit_log, alerts, quotes, suppliers, purchase_orders, expenses, sales, consignments;
