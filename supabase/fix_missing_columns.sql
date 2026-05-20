-- Fix Royalties
ALTER TABLE public.royalties ADD COLUMN IF NOT EXISTS author_name TEXT;
ALTER TABLE public.royalties ADD COLUMN IF NOT EXISTS period_start DATE;
ALTER TABLE public.royalties ADD COLUMN IF NOT EXISTS period_end DATE;
ALTER TABLE public.royalties ADD COLUMN IF NOT EXISTS total_units_sold INTEGER DEFAULT 0;
ALTER TABLE public.royalties ADD COLUMN IF NOT EXISTS total_sales_amount NUMERIC DEFAULT 0;
ALTER TABLE public.royalties ADD COLUMN IF NOT EXISTS advance_deducted NUMERIC DEFAULT 0;
ALTER TABLE public.royalties ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.royalties ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE public.royalties ADD COLUMN IF NOT EXISTS notes TEXT;

-- Fix Inventory Physical
ALTER TABLE public.inventory_physical ADD COLUMN IF NOT EXISTS entries JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.inventory_physical ADD COLUMN IF NOT EXISTS exits JSONB DEFAULT '[]'::jsonb;

-- Fix Sales
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS book_title TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS neto NUMERIC DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS iva NUMERIC DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Fix Consignments
ALTER TABLE public.consignments ADD COLUMN IF NOT EXISTS book_title TEXT;
ALTER TABLE public.consignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Fix Quotes
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS requested_amount_2 NUMERIC DEFAULT 0;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS requested_amount_3 NUMERIC DEFAULT 0;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS requested_amount_4 NUMERIC DEFAULT 0;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS binding_type TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS extra_finishes TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS book_title TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS book_width TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS book_height TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS book_pages_bw TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS book_pages_color TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS book_cover_type TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS book_flaps TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS book_flap_width TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS book_interior_paper TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS book_cover_paper TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS book_cover_finish TEXT;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS approved_amount NUMERIC;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS quoted_amount_2 NUMERIC;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS quoted_amount_3 NUMERIC;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS quoted_amount_4 NUMERIC;

-- Fix Alerts
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;
