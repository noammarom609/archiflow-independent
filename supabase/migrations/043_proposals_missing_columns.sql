-- Add missing columns to proposals table
-- These columns are needed for the proposal creation flow

-- Add project_name column
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS project_name TEXT;

-- Add client_id column
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS client_id UUID;

-- Add client_name column
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS client_name TEXT;

-- Add client_email column
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS client_email TEXT;

-- Add type column (formal, initial, etc.)
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'formal';

-- Add status column if missing
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Add scope_of_work column
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS scope_of_work TEXT;

-- Add items column (JSONB array of proposal items)
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;

-- Add payment_terms column
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS payment_terms TEXT;

-- Add notes column
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add subtotal column
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) DEFAULT 0;

-- Add discount_percent column
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0;

-- Add discount_amount column
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) DEFAULT 0;

-- Add vat_percent column
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS vat_percent NUMERIC(5,2) DEFAULT 17;

-- Add vat_amount column
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS vat_amount NUMERIC(12,2) DEFAULT 0;

-- Add total column
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS total NUMERIC(12,2) DEFAULT 0;

-- Add validity_days column
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS validity_days INTEGER DEFAULT 30;

-- Add template_id column (reference to proposal template used)
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS template_id UUID;

-- Add styling column
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS styling JSONB DEFAULT '{}'::jsonb;

-- Create index on project_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_proposals_project_id 
ON public.proposals(project_id);

-- Create index on client_id
CREATE INDEX IF NOT EXISTS idx_proposals_client_id 
ON public.proposals(client_id);

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_proposals_status 
ON public.proposals(status);
