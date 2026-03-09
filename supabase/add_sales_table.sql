ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approved_amount NUMERIC;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS quoted_amount_2 NUMERIC DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS quoted_amount_3 NUMERIC DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS quoted_amount_4 NUMERIC DEFAULT 0;

-- 11. VENTAS
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    book_id TEXT REFERENCES books(id) ON DELETE SET NULL,
    channel TEXT NOT NULL, -- 'Directa', 'Librería', 'Web', 'Evento', 'Consignación'
    type TEXT, -- 'B2B', 'B2C'
    quantity NUMERIC NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL DEFAULT 0,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    sale_date DATE DEFAULT CURRENT_DATE,
    client_name TEXT,
    document_ref TEXT, -- Boleta, Factura
    status TEXT DEFAULT 'Completada', -- 'Completada', 'Anulada'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Sales Access" ON sales FOR ALL USING (true) WITH CHECK (true);

-- Agregar la tabla de sales a la publicación realtime
ALTER TABLE sales REPLICA IDENTITY FULL;
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
    users, books, inventory_physical, invoices, royalties, comments, audit_log, alerts, quotes, sales;
