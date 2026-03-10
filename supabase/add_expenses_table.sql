-- Tabla para Gastos Operativos (Fijos y Variables)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    category TEXT NOT NULL, -- Ej: 'SUELDOS', 'ARRIENDO', 'SERVICIOS', 'PUBLICIDAD', 'LOGÍSTICA', 'SOFTWARE', 'OTROS'
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL, -- Opcional: Vincular a un proveedor
    payment_method TEXT, -- Ej: 'TRANSFERENCIA', 'TARJETA', 'EFECTIVO'
    status TEXT NOT NULL DEFAULT 'PAGADO', -- 'PAGADO', 'PENDIENTE', 'PROGRAMADO'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Políticas de seguridad para gastos
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tenant expenses"
    ON public.expenses FOR SELECT
    USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their own tenant expenses"
    ON public.expenses FOR INSERT
    WITH CHECK (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own tenant expenses"
    ON public.expenses FOR UPDATE
    USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their own tenant expenses"
    ON public.expenses FOR DELETE
    USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
