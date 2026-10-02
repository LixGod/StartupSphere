-- StartupSphere Consolidated Setup Script (FIXED)
-- This script sets up all tables, triggers, and policies for a fresh Supabase project.

-- ============================================
-- 1. EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. TABLES
-- ============================================

-- PROFILES: Core user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('owner', 'employee')),
  email TEXT,
  gstin TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  description TEXT, -- Company Slogan/Description
  owner_id UUID REFERENCES auth.users(id), -- NULL for owners, refers to owner for employees
  can_manage_inventory BOOLEAN DEFAULT FALSE,
  can_manage_sales BOOLEAN DEFAULT FALSE,
  can_manage_accounting BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PRODUCTS: Inventory management
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL,
  cost_price DECIMAL(12, 2),
  stock_quantity INT DEFAULT 0,
  min_stock_level INT DEFAULT 10,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(owner_id, sku)
);

-- SALES_ORDERS: POS system
CREATE TABLE IF NOT EXISTS public.sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_amount DECIMAL(12, 2) NOT NULL,
  gst_amount DECIMAL(12, 2) DEFAULT 0,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
  customer_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ORDER_ITEMS: Line items for sales orders
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INT NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  line_total DECIMAL(12, 2) NOT NULL
);

-- EXPENSES: Accounting
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  expense_date DATE NOT NULL,
  receipt_url TEXT,
  gst_applicable BOOLEAN DEFAULT FALSE,
  gst_amount DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INVOICES: Official billing
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  order_id UUID REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_company TEXT,
  customer_gst_no TEXT,
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal DECIMAL(12, 2) NOT NULL,
  gst_rate DECIMAL(5, 2) DEFAULT 18.00,
  gst_amount DECIMAL(12, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'paid', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(owner_id, invoice_number)
);

-- EMPLOYEE_REQUESTS: Team management (Matched to code)
CREATE TABLE IF NOT EXISTS public.employee_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_email TEXT NOT NULL,
  employee_email TEXT NOT NULL,
  employee_password_hash TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NOTIFICATIONS: System activity
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MEMBERSHIPS & SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL,
  price_inr DECIMAL(12, 2) NOT NULL,
  duration_days INT DEFAULT 30,
  features JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES public.memberships(id),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI_MARKETING_REQUESTS: Audit trail for AI usage
CREATE TABLE IF NOT EXISTS public.ai_marketing_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  campaign_brief TEXT,
  captions TEXT[],
  reel_concepts TEXT[],
  hashtags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. TRIGGERS
-- ============================================

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, company_name, role, email, can_manage_inventory, can_manage_sales, can_manage_accounting)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'company_name', split_part(new.email, '@', 1) || '''s Startup'),
    COALESCE(new.raw_user_meta_data ->> 'role', 'owner'),
    new.email,
    (COALESCE(new.raw_user_meta_data ->> 'role', 'owner') = 'owner'),
    (COALESCE(new.raw_user_meta_data ->> 'role', 'owner') = 'owner'),
    (COALESCE(new.raw_user_meta_data ->> 'role', 'owner') = 'owner')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_marketing_requests ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_employees" ON public.profiles FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_update_employees" ON public.profiles FOR UPDATE USING (auth.uid() = owner_id);

-- Product Policies
CREATE POLICY "products_access" ON public.products FOR SELECT USING (
  owner_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profiles.owner_id = products.owner_id)
);
CREATE POLICY "products_modify" ON public.products FOR ALL USING (
  owner_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profiles.owner_id = products.owner_id)
);

-- Invoice/Accounting Policies
CREATE POLICY "invoices_access" ON public.invoices FOR SELECT USING (
  owner_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profiles.owner_id = invoices.owner_id)
);
CREATE POLICY "invoices_modify" ON public.invoices FOR ALL USING (
  owner_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profiles.owner_id = invoices.owner_id)
);

-- Expense Policies
CREATE POLICY "expenses_access" ON public.expenses FOR SELECT USING (
  owner_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profiles.owner_id = expenses.owner_id)
);
CREATE POLICY "expenses_modify" ON public.expenses FOR ALL USING (
  owner_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profiles.owner_id = expenses.owner_id)
);

-- Sales Policies
CREATE POLICY "sales_access" ON public.sales_orders FOR SELECT USING (
  owner_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profiles.owner_id = sales_orders.owner_id)
);
CREATE POLICY "sales_modify" ON public.sales_orders FOR ALL USING (
  owner_id = auth.uid() 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profiles.owner_id = sales_orders.owner_id)
);

-- Order Items Policies
CREATE POLICY "order_items_access" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.sales_orders s 
    WHERE s.id = order_id AND (
      s.owner_id = auth.uid() 
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.owner_id = s.owner_id)
    )
  )
);
CREATE POLICY "order_items_modify" ON public.order_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.sales_orders s 
    WHERE s.id = order_id AND (
      s.owner_id = auth.uid() 
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.owner_id = s.owner_id)
    )
  )
);

-- Employee Requests Policies
CREATE POLICY "employee_requests_insert" ON public.employee_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "employee_requests_select" ON public.employee_requests FOR SELECT USING (owner_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
CREATE POLICY "employee_requests_delete" ON public.employee_requests FOR DELETE USING (owner_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Notification Policies
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (user_id = auth.uid() OR owner_id = auth.uid());

-- Default public access for memberships
CREATE POLICY "memberships_public_select" ON public.memberships FOR SELECT USING (true);

-- ============================================
-- 5. SEED DATA
-- ============================================

INSERT INTO public.memberships (plan_name, price_inr, duration_days, features)
VALUES 
('Starter', 499.00, 30, '["Inventory", "Sales", "Basic Reports"]'),
('Growth', 1499.00, 30, '["Inventory", "Sales", "Accounting", "AI Marketing", "Team of 5"]'),
('Enterprise', 4999.00, 30, '["All Features", "Unlimited Team", "Priority Support"]')
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. REALTIME ENABLEMENT
-- ============================================
BEGIN;
  -- Remove existing publication if any
  DROP PUBLICATION IF EXISTS supabase_realtime;
  -- Create publication for all relevant tables
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.profiles,
    public.products,
    public.sales_orders,
    public.expenses,
    public.invoices,
    public.employee_requests,
    public.notifications;
COMMIT;

-- ============================================
-- 7. CLEANUP / RESET (ONLY USE TO WIPE DATA)
-- ============================================
/*
-- To delete everything and start fresh, highlight and run the commands below:

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.ai_marketing_requests;
DROP TABLE IF EXISTS public.user_subscriptions;
DROP TABLE IF EXISTS public.memberships;
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.employee_requests;
DROP TABLE IF EXISTS public.invoices;
DROP TABLE IF EXISTS public.expenses;
DROP TABLE IF EXISTS public.order_items;
DROP TABLE IF EXISTS public.sales_orders;
DROP TABLE IF EXISTS public.products;
DROP TABLE IF EXISTS public.profiles;

DROP PUBLICATION IF EXISTS supabase_realtime;
*/
