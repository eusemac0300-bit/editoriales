-- Migration to add SKU, colored pages and legal deposit
ALTER TABLE books ADD COLUMN IF NOT EXISTS pages_color TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS has_legal_deposit TEXT DEFAULT 'No';
ALTER TABLE books ADD COLUMN IF NOT EXISTS legal_deposit_number TEXT;
