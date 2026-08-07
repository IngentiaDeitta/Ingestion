-- Fix missing columns referenced by NewProject.tsx and ProjectDetail.tsx
alter table public.projects
  add column if not exists archetype text,
  add column if not exists delegated_to text default 'In-house',
  add column if not exists source_ally text;

-- Support real Engineering Path phases + delegation flag on tasks
alter table public.tasks
  add column if not exists phase text
    check (phase is null or phase in ('Auditoría', 'Arquitectura & Prototipo', 'Construcción & IA', 'Lanzamiento')),
  add column if not exists delegable boolean default false;
