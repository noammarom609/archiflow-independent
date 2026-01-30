-- Migration: Add changes_summary and related columns to project_ai_history
-- Date: 2026-01-30
-- Fixes: PGRST204 "Could not find the 'changes_summary' column of 'project_ai_history'" (aiInsightsManager saveProjectAIInsights)

-- Allow action_type and model_used to be optional for insights-history inserts
ALTER TABLE public.project_ai_history
  ALTER COLUMN action_type SET DEFAULT 'insights_update',
  ALTER COLUMN model_used SET DEFAULT 'n/a';

-- Add columns used by aiInsightsManager when saving history
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'project_ai_history' AND column_name = 'changes_summary') THEN
    ALTER TABLE public.project_ai_history ADD COLUMN changes_summary TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'project_ai_history' AND column_name = 'timestamp') THEN
    ALTER TABLE public.project_ai_history ADD COLUMN timestamp TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'project_ai_history' AND column_name = 'source_recording_id') THEN
    ALTER TABLE public.project_ai_history ADD COLUMN source_recording_id UUID REFERENCES public.recordings(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'project_ai_history' AND column_name = 'fields_changed') THEN
    ALTER TABLE public.project_ai_history ADD COLUMN fields_changed JSONB DEFAULT '[]';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'project_ai_history' AND column_name = 'previous_snapshot') THEN
    ALTER TABLE public.project_ai_history ADD COLUMN previous_snapshot JSONB DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'project_ai_history' AND column_name = 'new_values') THEN
    ALTER TABLE public.project_ai_history ADD COLUMN new_values JSONB DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'project_ai_history' AND column_name = 'merge_stats') THEN
    ALTER TABLE public.project_ai_history ADD COLUMN merge_stats JSONB DEFAULT '{}';
  END IF;
END $$;
