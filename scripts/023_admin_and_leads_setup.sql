-- Super Admin System & Lead Capture
-- 1. Table for leads/prospects
CREATE TABLE IF NOT EXISTS public.owner_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    business_name TEXT,
    status TEXT DEFAULT 'pending', -- pending, contacted, closed
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table for approved owners (who have paid)
CREATE TABLE IF NOT EXISTS public.approved_owners (
    email TEXT PRIMARY KEY,
    approved_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT
);

-- 3. Add a super_admin flag to profiles (or just use email check)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- 4. Enable RLS
ALTER TABLE public.owner_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approved_owners ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Leads are insertable by public" ON public.owner_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Super Admins can view leads" ON public.owner_leads FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
);

CREATE POLICY "Super Admins can manage approved owners" ON public.approved_owners FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
);
