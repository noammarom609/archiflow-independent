-- Make architect_email nullable in proposals table
-- It's not always available when creating a proposal

ALTER TABLE public.proposals 
ALTER COLUMN architect_email DROP NOT NULL;
