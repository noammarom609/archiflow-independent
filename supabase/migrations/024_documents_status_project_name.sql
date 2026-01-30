-- Migration: Add status and project_name to documents
-- Date: 2026-01-30
-- Fixes: PGRST204 "Could not find the 'status' column of 'documents'" (PhoneCallSubStage Document.create after transcription)

-- Add status if missing (e.g. 'active', 'draft', 'archived')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN status TEXT DEFAULT 'active';
    CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
  END IF;
END $$;

-- Add project_name if missing (denormalized for display)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'project_name'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN project_name TEXT;
  END IF;
END $$;
