-- Migration: Add project_name to recordings table
-- Date: 2026-01-30
-- Fixes PGRST204: "Could not find the 'project_name' column of 'recordings'"
-- Used when saving analyzed recordings from PhoneCallSubStage

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'recordings'
        AND column_name = 'project_name'
    ) THEN
        ALTER TABLE public.recordings ADD COLUMN project_name TEXT;
        COMMENT ON COLUMN public.recordings.project_name IS 'Denormalized project name for display';
    END IF;
END $$;
