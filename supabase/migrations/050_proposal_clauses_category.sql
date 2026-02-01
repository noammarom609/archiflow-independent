-- Add missing columns to proposal_clauses table
ALTER TABLE public.proposal_clauses ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'כללי';
ALTER TABLE public.proposal_clauses ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE public.proposal_clauses ADD COLUMN IF NOT EXISTS default_quantity NUMERIC DEFAULT 1;
ALTER TABLE public.proposal_clauses ADD COLUMN IF NOT EXISTS default_unit TEXT DEFAULT 'יח''';
ALTER TABLE public.proposal_clauses ADD COLUMN IF NOT EXISTS default_price NUMERIC DEFAULT 0;
ALTER TABLE public.proposal_clauses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.proposal_clauses ADD COLUMN IF NOT EXISTS title TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_proposal_clauses_category ON public.proposal_clauses(category);
