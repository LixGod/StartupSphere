-- Add customer_company to invoices table
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS customer_company TEXT;
