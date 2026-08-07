-- 1. Modify projects to track the referral source
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'source_ally') THEN
        ALTER TABLE public.projects ADD COLUMN source_ally TEXT;
    END IF;
END $$;

-- 2. Create commissions table
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    finance_id UUID REFERENCES public.finances(id) ON DELETE CASCADE,
    ally_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'Pendiente', -- Pendiente, Apta para pago, Pagada
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS and Policies for commissions
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.commissions;
CREATE POLICY "Enable read access for authenticated users" ON public.commissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.commissions;
CREATE POLICY "Enable insert access for authenticated users" ON public.commissions FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.commissions;
CREATE POLICY "Enable update access for authenticated users" ON public.commissions FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.commissions;
CREATE POLICY "Enable delete access for authenticated users" ON public.commissions FOR DELETE TO authenticated USING (true);
