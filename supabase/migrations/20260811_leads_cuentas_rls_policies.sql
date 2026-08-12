-- Migration: Grant full RLS permissions on leads_cuentas for anon and authenticated roles

ALTER TABLE public.leads_cuentas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all" ON public.leads_cuentas;
CREATE POLICY "Enable read access for all" ON public.leads_cuentas FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Enable insert access for all" ON public.leads_cuentas;
CREATE POLICY "Enable insert access for all" ON public.leads_cuentas FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all" ON public.leads_cuentas;
CREATE POLICY "Enable update access for all" ON public.leads_cuentas FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "Enable delete access for all" ON public.leads_cuentas;
CREATE POLICY "Enable delete access for all" ON public.leads_cuentas FOR DELETE TO public USING (true);
