-- Migration: Add website and address to suppliers
-- Date: 2026-01-30
-- Fixes PGRST204: "Could not find the 'website' column of 'suppliers'"

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'suppliers' AND column_name = 'website') THEN
        ALTER TABLE public.suppliers ADD COLUMN website TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'suppliers' AND column_name = 'address') THEN
        ALTER TABLE public.suppliers ADD COLUMN address TEXT;
    END IF;
END $$;
