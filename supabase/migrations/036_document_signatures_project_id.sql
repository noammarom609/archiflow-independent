-- Migration: Add project_id column to document_signatures table
-- Date: 2026-02-01
-- Purpose: Allow linking signatures to projects for easier querying

DO $$
BEGIN
  -- Add project_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'document_signatures' 
    AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.document_signatures ADD COLUMN project_id UUID;
    COMMENT ON COLUMN public.document_signatures.project_id IS 'Reference to the project this signature belongs to';
    
    -- Create index for faster queries
    CREATE INDEX IF NOT EXISTS idx_document_signatures_project_id ON public.document_signatures(project_id);
  END IF;
END $$;
