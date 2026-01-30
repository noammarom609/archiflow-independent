-- Migration: Add projects_completed and rating to contractors
-- Date: 2026-01-30
-- Fixes PGRST204: "Could not find the 'projects_completed' column of 'contractors'"

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'contractors'
        AND column_name = 'projects_completed'
    ) THEN
        ALTER TABLE public.contractors ADD COLUMN projects_completed INTEGER DEFAULT 0;
        COMMENT ON COLUMN public.contractors.projects_completed IS 'Number of projects completed by this contractor';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'contractors'
        AND column_name = 'rating'
    ) THEN
        ALTER TABLE public.contractors ADD COLUMN rating INTEGER DEFAULT 0;
        COMMENT ON COLUMN public.contractors.rating IS 'Contractor rating (e.g. 0-5)';
    END IF;
END $$;
