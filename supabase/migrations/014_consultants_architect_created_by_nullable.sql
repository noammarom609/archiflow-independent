-- Migration: Allow architect_email and created_by to be NULL on consultants
-- Date: 2026-01-30
-- Fixes 23502: null value in column "architect_email" violates not-null constraint
-- (Frontend now sends architect_email and created_by; allow NULL as fallback)

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'consultants' AND column_name = 'architect_email') THEN
        ALTER TABLE public.consultants ALTER COLUMN architect_email DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'consultants' AND column_name = 'created_by') THEN
        ALTER TABLE public.consultants ALTER COLUMN created_by DROP NOT NULL;
    END IF;
END $$;
