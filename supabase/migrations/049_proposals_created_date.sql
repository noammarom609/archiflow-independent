-- Add created_date column to proposals table if missing

ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS created_date TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS updated_date TIMESTAMPTZ DEFAULT NOW();
