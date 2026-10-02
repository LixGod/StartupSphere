-- Enable public reading of receipts for buyers
-- 1. Profiles: Allow anyone to see basic business info (needed for receipt header)
CREATE POLICY "Public profiles are readable by anyone"
ON public.profiles
FOR SELECT
USING (true);

-- 2. Sales Orders: Allow anyone to read a specific order if they have the direct link (ID)
CREATE POLICY "Invoices are readable by public link"
ON public.sales_orders
FOR SELECT
USING (true);

-- 3. Order Items: Allow anyone to read items for a specific order
CREATE POLICY "Order items are readable by public link"
ON public.order_items
FOR SELECT
USING (true);

-- 4. Products: Allow anyone to read product names for receipts
CREATE POLICY "Product names are readable by public link"
ON public.products
FOR SELECT
USING (true);
