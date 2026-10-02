-- Add manufacturer details to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS manufacturer_name TEXT,
ADD COLUMN IF NOT EXISTS manufacturer_address TEXT,
ADD COLUMN IF NOT EXISTS manufacturer_gstin TEXT;

-- Index for searching
CREATE INDEX IF NOT EXISTS idx_products_manufacturer ON public.products(manufacturer_name);
