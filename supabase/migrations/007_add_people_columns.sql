-- Migration: Add missing columns for contractors, suppliers, consultants
-- Date: 2026-01-30
-- Fixes PGRST204 errors when creating contractor/supplier/consultant:
--   - suppliers: missing 'category'
--   - consultants: missing 'status'
--   - contractors: missing 'status' (if not present)

-- =============================================================================
-- 1. suppliers: add category (used by AddSupplierDialog)
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'suppliers'
        AND column_name = 'category'
    ) THEN
        ALTER TABLE public.suppliers ADD COLUMN category TEXT DEFAULT 'other';
        COMMENT ON COLUMN public.suppliers.category IS 'Supplier category: materials, labor, other, etc.';
    END IF;
END $$;

-- =============================================================================
-- 2. consultants: add status (used by AddConsultantDialog)
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'consultants'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.consultants ADD COLUMN status TEXT DEFAULT 'active';
        COMMENT ON COLUMN public.consultants.status IS 'Consultant status: active, inactive';
    END IF;
END $$;

-- =============================================================================
-- 3. contractors: add status (used by AddContractorDialog)
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'contractors'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.contractors ADD COLUMN status TEXT DEFAULT 'active';
        COMMENT ON COLUMN public.contractors.status IS 'Contractor status: active, inactive, on_hold';
    END IF;
END $$;

-- Optional indexes for filtering
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON public.suppliers(category);
CREATE INDEX IF NOT EXISTS idx_consultants_status ON public.consultants(status);
CREATE INDEX IF NOT EXISTS idx_contractors_status ON public.contractors(status);
