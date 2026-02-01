-- Make created_by nullable in proposals table

ALTER TABLE public.proposals 
ALTER COLUMN created_by DROP NOT NULL;
