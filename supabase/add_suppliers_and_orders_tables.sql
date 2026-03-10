-- Creación de tabla para Proveedores e Imprentas
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    type TEXT NOT NULL, -- Ej: 'IMPRENTA', 'DISEÑO', 'MAQUETACIÓN', 'CORRECCIÓN', 'AGENCIA'
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    tax_id TEXT, -- RUT o identificador fiscal
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Políticas de seguridad para proveedores
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tenant suppliers"
    ON public.suppliers FOR SELECT
    USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own tenant suppliers"
    ON public.suppliers FOR INSERT
    WITH CHECK (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own tenant suppliers"
    ON public.suppliers FOR UPDATE
    USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their own tenant suppliers"
    ON public.suppliers FOR DELETE
    USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

-- Creación de tabla para Órdenes de Compra / Producción
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    order_number TEXT NOT NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
    date_ordered DATE NOT NULL,
    expected_date DATE,
    status TEXT NOT NULL DEFAULT 'BORRADOR', -- 'BORRADOR', 'ENVIADA', 'EN_PROCESO', 'RECIBIDA', 'CANCELADA'
    total_cost NUMERIC DEFAULT 0,
    expected_quantity INTEGER DEFAULT 0,
    received_quantity INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Políticas de seguridad para órdenes de compra
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tenant purchase_orders"
    ON public.purchase_orders FOR SELECT
    USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own tenant purchase_orders"
    ON public.purchase_orders FOR INSERT
    WITH CHECK (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own tenant purchase_orders"
    ON public.purchase_orders FOR UPDATE
    USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their own tenant purchase_orders"
    ON public.purchase_orders FOR DELETE
    USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
