-- Fix foreign key constraint to allow deleting orders
ALTER TABLE public.invoices
DROP CONSTRAINT IF EXISTS invoices_order_id_fkey,
ADD CONSTRAINT invoices_order_id_fkey 
  FOREIGN KEY (order_id) 
  REFERENCES public.sales_orders(id) 
  ON DELETE CASCADE;
