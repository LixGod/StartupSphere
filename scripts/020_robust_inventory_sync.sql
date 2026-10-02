-- Update trigger to handle deletions and status changes more robustly
CREATE OR REPLACE FUNCTION public.sync_inventory_on_order_update()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. If order is Cancelled or Refunded, RESTORE inventory
  IF (TG_OP = 'UPDATE') THEN
    IF (NEW.status IN ('cancelled', 'refunded') AND OLD.status NOT IN ('cancelled', 'refunded')) THEN
      UPDATE public.products p
      SET stock_quantity = p.stock_quantity + oi.quantity
      FROM public.order_items oi
      WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
    END IF;
    
    -- 2. If order was Cancelled/Refunded and moved back to Completed/Pending, DEDUCT inventory again
    IF (OLD.status IN ('cancelled', 'refunded') AND NEW.status NOT IN ('cancelled', 'refunded')) THEN
      UPDATE public.products p
      SET stock_quantity = p.stock_quantity - oi.quantity
      FROM public.order_items oi
      WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
    END IF;
  END IF;

  -- 3. If order is DELETED, restore inventory (important cleanup)
  IF (TG_OP = 'DELETE') THEN
    IF (OLD.status NOT IN ('cancelled', 'refunded')) THEN
      UPDATE public.products p
      SET stock_quantity = p.stock_quantity + oi.quantity
      FROM public.order_items oi
      WHERE oi.order_id = OLD.id AND oi.product_id = p.id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Re-link trigger
DROP TRIGGER IF EXISTS trg_sync_inventory ON public.sales_orders;
CREATE TRIGGER trg_sync_inventory
AFTER UPDATE OR DELETE ON public.sales_orders
FOR EACH ROW EXECUTE FUNCTION public.sync_inventory_on_order_update();
