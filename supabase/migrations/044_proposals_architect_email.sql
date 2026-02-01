-- Add architect_email column to proposals table

ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS architect_email TEXT;

-- Also add architect_name if needed
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS architect_name TEXT;

-- Add created_by column
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS created_by TEXT;
