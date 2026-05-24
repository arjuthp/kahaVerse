-- Migration: Fix addon price column to support decimal values
-- Issue: Price column was integer, but needs to support decimal values like 1.50, 2.99, etc.
-- Date: 2026-05-18

-- Change the price column from integer to decimal(10,2)
ALTER TABLE "add_on_entity" 
ALTER COLUMN "price" TYPE DECIMAL(10,2);

-- Verify the change
SELECT column_name, data_type, numeric_precision, numeric_scale 
FROM information_schema.columns 
WHERE table_name = 'add_on_entity' AND column_name = 'price';
