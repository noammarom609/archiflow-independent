-- Add share_token and approval-related columns to proposals table

-- Share token for public links
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS share_token TEXT;

-- Approval tracking columns
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS approver_name TEXT;

ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS approver_email TEXT;

ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS signature TEXT;

ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS approval_comments TEXT;

ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS change_request_comments TEXT;

-- Create index on share_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_proposals_share_token 
ON public.proposals(share_token);
