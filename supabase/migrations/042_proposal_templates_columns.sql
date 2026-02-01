-- Add missing columns to proposal_templates table
-- This ensures all required columns exist for the template seeding functionality

-- Add status column
ALTER TABLE public.proposal_templates 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Add updated_date column
ALTER TABLE public.proposal_templates 
ADD COLUMN IF NOT EXISTS updated_date TIMESTAMPTZ DEFAULT NOW();

-- Add project_type column (to link templates to project types)
ALTER TABLE public.proposal_templates 
ADD COLUMN IF NOT EXISTS project_type TEXT;

-- Add is_system column (for system-generated templates)
ALTER TABLE public.proposal_templates 
ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT FALSE;

-- Add is_default column (default template for project type)
ALTER TABLE public.proposal_templates 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- Add usage_count column
ALTER TABLE public.proposal_templates 
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- Add created_date column if missing
ALTER TABLE public.proposal_templates 
ADD COLUMN IF NOT EXISTS created_date TIMESTAMPTZ DEFAULT NOW();

-- Add sections column (JSONB for template sections)
ALTER TABLE public.proposal_templates 
ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]'::jsonb;

-- Add variables column (JSONB for template variables)
ALTER TABLE public.proposal_templates 
ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '{}'::jsonb;

-- Add styling column (JSONB for template styling)
ALTER TABLE public.proposal_templates 
ADD COLUMN IF NOT EXISTS styling JSONB DEFAULT '{}'::jsonb;

-- Add description column
ALTER TABLE public.proposal_templates 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add name column if missing
ALTER TABLE public.proposal_templates 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Create index on project_type for faster lookups
CREATE INDEX IF NOT EXISTS idx_proposal_templates_project_type 
ON public.proposal_templates(project_type);

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_proposal_templates_status 
ON public.proposal_templates(status);

-- Update trigger for updated_date
CREATE OR REPLACE FUNCTION update_proposal_template_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_proposal_template_updated ON public.proposal_templates;
CREATE TRIGGER trigger_proposal_template_updated
  BEFORE UPDATE ON public.proposal_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_proposal_template_updated_date();
