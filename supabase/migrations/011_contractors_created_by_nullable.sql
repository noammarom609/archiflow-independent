-- Migration: Allow created_by to be NULL on contractors
-- Date: 2026-01-30
-- Fixes 23502: null value in column "created_by" violates not-null constraint
-- (Frontend now sends created_by; this allows NULL as fallback)

ALTER TABLE public.contractors
  ALTER COLUMN created_by DROP NOT NULL;
