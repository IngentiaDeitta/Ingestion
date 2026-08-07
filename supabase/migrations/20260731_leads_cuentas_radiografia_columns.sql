alter table public.leads_cuentas
  add column if not exists pre_call_brief jsonb,
  add column if not exists transcript_text text,
  add column if not exists annual_waste_usd numeric,
  add column if not exists pain_points jsonb,
  add column if not exists converted_client_id uuid references public.clients(id) on delete set null;

alter table public.clients
  add column if not exists lead_id bigint references public.leads_cuentas(id) on delete set null,
  add column if not exists mrr_value numeric default 0;
