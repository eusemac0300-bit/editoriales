-- MIGRATION: ADD QUOTES TABLE

CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    book_id TEXT REFERENCES books(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    requested_amount NUMERIC NOT NULL DEFAULT 0,
    binding_type TEXT,
    extra_finishes TEXT,
    status TEXT DEFAULT 'Solicitada',
    quoted_amount NUMERIC DEFAULT 0,
    delivery_date DATE,
    notes TEXT,
    -- Snapshots of the book at the moment of quoting
    book_title TEXT,
    book_width TEXT,
    book_height TEXT,
    book_pages_bw TEXT,
    book_pages_color TEXT,
    book_cover_type TEXT,
    book_flaps TEXT,
    book_flap_width TEXT,
    book_interior_paper TEXT,
    book_cover_paper TEXT,
    book_cover_finish TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para Quotes
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Quotes Access" ON quotes FOR ALL USING (true) WITH CHECK (true);
