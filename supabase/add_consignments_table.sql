CREATE TABLE IF NOT EXISTS consignments (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    book_id TEXT REFERENCES books(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    contact_info TEXT,
    sent_date DATE NOT NULL,
    sent_quantity INTEGER DEFAULT 0,
    sold_quantity INTEGER DEFAULT 0,
    returned_quantity INTEGER DEFAULT 0,
    status TEXT DEFAULT 'activa',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE consignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Consignments Access" ON consignments FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE consignments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE consignments;
