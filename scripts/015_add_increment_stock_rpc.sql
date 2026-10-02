-- RPC to safely increment/decrement stock
CREATE OR REPLACE FUNCTION public.increment_stock(product_id UUID, amount INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity + amount
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
