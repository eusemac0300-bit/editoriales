-- Migration to add quote_id to purchase_orders
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS quote_id uuid REFERENCES quotes(id);
