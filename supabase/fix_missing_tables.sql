-- 1. LIMPIEZA TOTAL DE TABLAS CONFLICTIVAS
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS consignments CASCADE;

-- 2. RECREACIÓN CON NOMBRES DE COLUMNA EXACTOS AL FRONTEND (SNAKE_CASE Y COINCIDENTES)

-- Tabla de Proveedores (Para Suppliers.jsx)
CREATE TABLE suppliers (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT, -- Tipo de servicio (IMPRENTA, DISEÑO, etc)
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    tax_id TEXT, -- RUT / ID Fiscal
    address TEXT,
    comuna TEXT,
    ciudad TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Órdenes de Compra (Para PurchaseOrders.jsx)
CREATE TABLE purchase_orders (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
    supplier_id TEXT REFERENCES suppliers(id) ON DELETE CASCADE,
    expected_quantity INTEGER DEFAULT 0, -- Cantidad solicitada
    received_quantity INTEGER DEFAULT 0, -- Cantidad recibida
    total_cost NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'BORRADOR',
    date_ordered DATE DEFAULT CURRENT_DATE,
    expected_date DATE, -- Fecha estimada recepción
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Gastos (Para Expenses.jsx)
CREATE TABLE expenses (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    description TEXT, -- Descripción del gasto (antes era concept)
    category TEXT,
    amount NUMERIC DEFAULT 0,
    date DATE DEFAULT CURRENT_DATE,
    supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
    payment_method TEXT, -- Método de pago
    status TEXT DEFAULT 'PAGADO',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de Ventas (Para Sales.jsx)
CREATE TABLE sales (
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

-- Tabla de Consignaciones (Para Consignments.jsx)
CREATE TABLE consignments (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    book_id TEXT REFERENCES books(id) ON DELETE CASCADE,
    client_name TEXT,
    contact_info TEXT,
    sent_date DATE DEFAULT CURRENT_DATE,
    sent_quantity INTEGER DEFAULT 0,
    sold_quantity INTEGER DEFAULT 0,
    returned_quantity INTEGER DEFAULT 0,
    status TEXT DEFAULT 'activa',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SEGURIDAD RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access Suppliers" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access PO" ON purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access Consignments" ON consignments FOR ALL USING (true) WITH CHECK (true);

-- 4. TIEMPO REAL
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
