CREATE TABLE IF NOT EXISTS public.admin_settings (
  id text PRIMARY KEY,
  contact_email text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.admin_settings FOR SELECT USING (true);
CREATE POLICY "Enable all access for master admins" ON public.admin_settings FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.admin_settings (id, contact_email) VALUES ('global', 'admin@admind.cl') ON CONFLICT (id) DO NOTHING;
