-- Migration: Allow architect_email to be NULL on contractors
-- Date: 2026-01-30
-- Fixes 23502: null value in column "architect_email" violates not-null constraint
-- (currentUser may not be loaded when form is submitted)

ALTER TABLE public.contractors
  ALTER COLUMN architect_email DROP NOT NULL;
