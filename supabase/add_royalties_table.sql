-- Tabla de liquidaciones de regalías
CREATE TABLE IF NOT EXISTS royalties (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    book_id TEXT REFERENCES books(id) ON DELETE SET NULL,
    author_id TEXT,
    author_name TEXT,
    period TEXT NOT NULL,          -- ej: '2026-Q1', '2026-03'
    period_start DATE,
    period_end DATE,
    total_sales_amount NUMERIC DEFAULT 0,   -- suma de ventas del período
    total_units_sold INTEGER DEFAULT 0,
    royalty_percent NUMERIC DEFAULT 0,
    gross_royalty NUMERIC DEFAULT 0,        -- total_sales * royalty_percent/100
    advance_deducted NUMERIC DEFAULT 0,     -- anticipo descontado
    net_royalty NUMERIC DEFAULT 0,          -- lo que se paga
    status TEXT DEFAULT 'pendiente',        -- 'pendiente', 'aprobada', 'pagada'
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE royalties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Royalties Access" ON royalties FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE royalties REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE royalties;
