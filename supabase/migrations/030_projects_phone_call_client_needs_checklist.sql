-- Migration: Add phone_call_checklist and client_needs_checklist to projects
-- Date: 2026-01-30
-- Fixes: PGRST204 "Could not find the 'phone_call_checklist' column of 'projects'" (PhoneCallSubStage onUpdate)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'phone_call_checklist') THEN
    ALTER TABLE public.projects ADD COLUMN phone_call_checklist JSONB DEFAULT '[]';
    COMMENT ON COLUMN public.projects.phone_call_checklist IS 'First phone call checklist items: [{ id, item, checked, notes, order? }]';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'client_needs_checklist') THEN
    ALTER TABLE public.projects ADD COLUMN client_needs_checklist JSONB DEFAULT '[]';
    COMMENT ON COLUMN public.projects.client_needs_checklist IS 'First meeting / client needs checklist items: [{ id, item, checked, notes, order? }]';
  END IF;
END $$;
