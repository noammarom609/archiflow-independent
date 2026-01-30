-- Migration: Add missing columns to suppliers table
-- Date: 2026-01-30
-- Fixes PGRST204: "Could not find the 'delivery_time' column of 'suppliers'"
-- Adds all columns sent by AddSupplierDialog payload

DO $$
BEGIN
    -- delivery_time (e.g. "2-3 שבועות")
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'suppliers' AND column_name = 'delivery_time') THEN
        ALTER TABLE public.suppliers ADD COLUMN delivery_time TEXT;
    END IF;
    -- payment_terms (e.g. "שוטף + 30")
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'suppliers' AND column_name = 'payment_terms') THEN
        ALTER TABLE public.suppliers ADD COLUMN payment_terms TEXT;
    END IF;
    -- status (active, on_hold, etc.)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'suppliers' AND column_name = 'status') THEN
        ALTER TABLE public.suppliers ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
    -- rating, orders_completed (numeric fields from payload)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'suppliers' AND column_name = 'rating') THEN
        ALTER TABLE public.suppliers ADD COLUMN rating INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'suppliers' AND column_name = 'orders_completed') THEN
        ALTER TABLE public.suppliers ADD COLUMN orders_completed INTEGER DEFAULT 0;
    END IF;
END $$;

-- Allow architect_email and created_by to be NULL if columns exist (same as contractors)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'suppliers' AND column_name = 'architect_email') THEN
        ALTER TABLE public.suppliers ALTER COLUMN architect_email DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'suppliers' AND column_name = 'created_by') THEN
        ALTER TABLE public.suppliers ALTER COLUMN created_by DROP NOT NULL;
    END IF;
END $$;
