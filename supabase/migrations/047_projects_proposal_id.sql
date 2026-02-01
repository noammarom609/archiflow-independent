-- Add proposal_id column to projects table
-- This links a project to its current/active proposal

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS proposal_id UUID;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_projects_proposal_id 
ON public.projects(proposal_id);
