-- Migration: Add ai_insights, ai_insights_history, ai_summary to projects
-- Date: 2026-01-30
-- Fixes: PGRST204 "Could not find the 'ai_insights_history' column of 'projects'" (aiInsightsManager Project.update)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'ai_insights') THEN
    ALTER TABLE public.projects ADD COLUMN ai_insights JSONB DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'ai_insights_history') THEN
    ALTER TABLE public.projects ADD COLUMN ai_insights_history JSONB DEFAULT '[]';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'ai_summary') THEN
    ALTER TABLE public.projects ADD COLUMN ai_summary TEXT;
  END IF;
END $$;
