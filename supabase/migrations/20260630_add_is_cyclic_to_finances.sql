-- Add is_cyclic column to finances table to track automatic debit/cyclic expenses
ALTER TABLE public.finances ADD COLUMN IF NOT EXISTS is_cyclic BOOLEAN DEFAULT FALSE;
