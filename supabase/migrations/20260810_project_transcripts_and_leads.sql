-- 1. Create project_transcripts table
CREATE TABLE IF NOT EXISTS public.project_transcripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    transcript_text TEXT NOT NULL,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Modify leads_cuentas table
ALTER TABLE public.leads_cuentas
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS qualification_status TEXT;

-- 3. Enable RLS
ALTER TABLE public.project_transcripts ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for Authenticated Users
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.project_transcripts;
CREATE POLICY "Enable read access for authenticated users" ON public.project_transcripts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.project_transcripts;
CREATE POLICY "Enable insert access for authenticated users" ON public.project_transcripts FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.project_transcripts;
CREATE POLICY "Enable update access for authenticated users" ON public.project_transcripts FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.project_transcripts;
CREATE POLICY "Enable delete access for authenticated users" ON public.project_transcripts FOR DELETE TO authenticated USING (true);
