-- Add ITR tax filing details to expenses
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS tax_category TEXT,
ADD COLUMN IF NOT EXISTS itc_eligible BOOLEAN DEFAULT true;

-- Update categories to be more ITR-friendly
COMMENT ON COLUMN public.expenses.category IS 'ITR Categories like Rent, Salaries, Inventory Purchase, etc.';
