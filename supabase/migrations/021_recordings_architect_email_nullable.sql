-- Migration: Allow architect_email to be NULL on recordings
-- Date: 2026-01-30
-- Fixes 23502: null value in column "architect_email" violates not-null constraint
-- Frontend now sends architect_email; allow NULL as fallback.

ALTER TABLE public.recordings
  ALTER COLUMN architect_email DROP NOT NULL;
