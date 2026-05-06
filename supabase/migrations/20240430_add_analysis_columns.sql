-- Añadir columnas JSONB para guardar los resultados de AI Analysis
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS client_analysis jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_analysis jsonb;
