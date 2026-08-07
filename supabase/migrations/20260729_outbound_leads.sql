-- 1. Create new tables
CREATE TABLE IF NOT EXISTS public.outbound_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name TEXT NOT NULL,
    domain TEXT,
    vertical_niche TEXT,
    contact_name TEXT,
    status TEXT DEFAULT 'New',
    enriched_data JSONB,
    pre_call_brief TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.radiografia_operativa (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.outbound_leads(id) ON DELETE CASCADE,
    transcript_text TEXT,
    annual_loss_usd NUMERIC,
    pain_points JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID, -- We will add FK after ensuring projects table exists below
    milestone TEXT,
    amount NUMERIC,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Modify existing tables (idempotent ADD COLUMN)
-- We use DO block to add columns if they do not exist to avoid errors

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'lead_id') THEN
        ALTER TABLE public.clients ADD COLUMN lead_id UUID REFERENCES public.outbound_leads(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'mrr_value') THEN
        ALTER TABLE public.clients ADD COLUMN mrr_value NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'roi_estimated_usd') THEN
        ALTER TABLE public.quotes ADD COLUMN roi_estimated_usd NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'setup_fee_usd') THEN
        ALTER TABLE public.quotes ADD COLUMN setup_fee_usd NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'module_3_mrr') THEN
        ALTER TABLE public.quotes ADD COLUMN module_3_mrr NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'ariely_packages') THEN
        ALTER TABLE public.quotes ADD COLUMN ariely_packages JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'quote_id') THEN
        ALTER TABLE public.projects ADD COLUMN quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'archetype') THEN
        ALTER TABLE public.projects ADD COLUMN archetype TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'delegated_to') THEN
        ALTER TABLE public.projects ADD COLUMN delegated_to TEXT;
    END IF;
END $$;

-- Fix the invoices foreign key now that projects table is guaranteed to exist
ALTER TABLE public.invoices ADD CONSTRAINT fk_invoices_projects FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- 3. Enable RLS
ALTER TABLE public.outbound_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radiografia_operativa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
-- Assuming clients, projects, quotes already have RLS, but running it again is harmless
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for Authenticated Users
-- outbound_leads
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.outbound_leads;
CREATE POLICY "Enable read access for authenticated users" ON public.outbound_leads FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.outbound_leads;
CREATE POLICY "Enable insert access for authenticated users" ON public.outbound_leads FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.outbound_leads;
CREATE POLICY "Enable update access for authenticated users" ON public.outbound_leads FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.outbound_leads;
CREATE POLICY "Enable delete access for authenticated users" ON public.outbound_leads FOR DELETE TO authenticated USING (true);

-- radiografia_operativa
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.radiografia_operativa;
CREATE POLICY "Enable read access for authenticated users" ON public.radiografia_operativa FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.radiografia_operativa;
CREATE POLICY "Enable insert access for authenticated users" ON public.radiografia_operativa FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.radiografia_operativa;
CREATE POLICY "Enable update access for authenticated users" ON public.radiografia_operativa FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.radiografia_operativa;
CREATE POLICY "Enable delete access for authenticated users" ON public.radiografia_operativa FOR DELETE TO authenticated USING (true);

-- invoices
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.invoices;
CREATE POLICY "Enable read access for authenticated users" ON public.invoices FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.invoices;
CREATE POLICY "Enable insert access for authenticated users" ON public.invoices FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.invoices;
CREATE POLICY "Enable update access for authenticated users" ON public.invoices FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.invoices;
CREATE POLICY "Enable delete access for authenticated users" ON public.invoices FOR DELETE TO authenticated USING (true);
