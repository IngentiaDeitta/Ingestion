-- Redes sociales del lead (web y linkedin_empresa ya existen)
alter table public.leads_cuentas
  add column if not exists instagram text,
  add column if not exists facebook text;

-- Reutilizamos la tabla de contactos para leads: así, al convertir el lead en
-- cliente, los contactos ya cargados viajan con él sin duplicar nada.
alter table public.client_contacts
  add column if not exists lead_id bigint references public.leads_cuentas(id) on delete cascade;

alter table public.client_contacts
  alter column client_id drop not null;

create index if not exists client_contacts_lead_id_idx on public.client_contacts(lead_id);
