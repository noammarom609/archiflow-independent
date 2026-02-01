-- Add description and title columns to proposal_clauses table
ALTER TABLE public.proposal_clauses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.proposal_clauses ADD COLUMN IF NOT EXISTS title TEXT;
