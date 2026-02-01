-- Migration: Add current_sub_stage column to projects table
-- Date: 2026-02-01
-- Purpose: Save the current sub-stage of the project workflow

DO $$
BEGIN
  -- Add current_sub_stage column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'current_sub_stage'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN current_sub_stage TEXT;
    COMMENT ON COLUMN public.projects.current_sub_stage IS 'Current sub-stage within the workflow stage (e.g., phone_call, first_meeting, client_card)';
  END IF;
  
  -- Also ensure current_stage column exists (for completeness)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'current_stage'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN current_stage TEXT DEFAULT 'first_call';
    COMMENT ON COLUMN public.projects.current_stage IS 'Current workflow stage (e.g., first_call, proposal, gantt, survey, etc.)';
  END IF;
END $$;
