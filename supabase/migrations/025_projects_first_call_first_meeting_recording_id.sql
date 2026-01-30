-- Migration: Add first_call_recording_id and first_meeting_recording_id to projects
-- Date: 2026-01-30
-- Fixes: PGRST204 "Could not find the 'first_call_recording_id' column of 'projects'" (PhoneCallSubStage onUpdate after transcription)

-- Add first_call_recording_id if missing (link to recording from first call stage)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'first_call_recording_id'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN first_call_recording_id UUID REFERENCES public.recordings(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_projects_first_call_recording_id ON public.projects(first_call_recording_id);
  END IF;
END $$;

-- Add first_meeting_recording_id if missing (link to recording from first meeting stage)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'first_meeting_recording_id'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN first_meeting_recording_id UUID REFERENCES public.recordings(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_projects_first_meeting_recording_id ON public.projects(first_meeting_recording_id);
  END IF;
END $$;
