-- Add Purchase GST rate to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS purchase_gst_rate NUMERIC DEFAULT 18;
