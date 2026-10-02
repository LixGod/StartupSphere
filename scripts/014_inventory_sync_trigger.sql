-- Function to sync inventory when order is cancelled or refunded
CREATE OR REPLACE FUNCTION public.sync_inventory_on_order_status_change()
RETURNS trigger AS $$
BEGIN
  -- 1. If status changes to 'cancelled' or 'refunded' from 'completed'
  IF (OLD.status = 'completed' AND NEW.status IN ('cancelled', 'refunded')) THEN
    -- Add quantity back to inventory
    UPDATE public.products p
    SET stock_quantity = p.stock_quantity + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND p.id = oi.product_id;
  END IF;
  
  -- 2. If status changes from 'cancelled' or 'refunded' back to 'completed'
  IF (OLD.status IN ('cancelled', 'refunded') AND NEW.status = 'completed') THEN
    -- Deduct quantity from inventory
    UPDATE public.products p
    SET stock_quantity = p.stock_quantity - oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND p.id = oi.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_sales_order_status_change ON public.sales_orders;
CREATE TRIGGER on_sales_order_status_change
AFTER UPDATE ON public.sales_orders
FOR EACH ROW
EXECUTE FUNCTION public.sync_inventory_on_order_status_change();
