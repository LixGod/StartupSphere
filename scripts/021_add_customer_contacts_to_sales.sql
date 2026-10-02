-- Add customer contact info to sales orders
ALTER TABLE public.sales_orders
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT;
