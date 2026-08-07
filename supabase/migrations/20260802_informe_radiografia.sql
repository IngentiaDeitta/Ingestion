alter table public.leads_cuentas
  add column if not exists informe_radiografia jsonb;
