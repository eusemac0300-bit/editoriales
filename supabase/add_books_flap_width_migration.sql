-- Migration to add flap width for book properties
ALTER TABLE books ADD COLUMN IF NOT EXISTS flap_width TEXT;
