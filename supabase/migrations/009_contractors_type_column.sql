-- Migration: Add type column to contractors
-- Date: 2026-01-30
-- Fixes PGRST204: "Could not find the 'type' column of 'contractors'"

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'contractors'
        AND column_name = 'type'
    ) THEN
        ALTER TABLE public.contractors ADD COLUMN type TEXT DEFAULT 'contractor';
        COMMENT ON COLUMN public.contractors.type IS 'Contractor type: contractor, partner';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contractors_type ON public.contractors(type);
