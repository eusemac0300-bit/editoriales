-- Agregar columnas para los archivos PDF finales (Interior y Tapa) en la tabla de libros
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS final_pdf_interior TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS final_pdf_cover TEXT;
