-- Update finances type constraint to allow 'withdrawal'
ALTER TABLE public.finances 
DROP CONSTRAINT IF EXISTS finances_type_check;

ALTER TABLE public.finances 
ADD CONSTRAINT finances_type_check 
CHECK (type IN ('income', 'expense', 'withdrawal'));
