CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'libreria',
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_id TEXT,
    credit_limit NUMERIC DEFAULT 0,
    notes TEXT,
    default_discount NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access Clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.clients REPLICA IDENTITY FULL;
