-- Migration: Add recordings, timeline, meetings to clients
-- Date: 2026-01-30
-- Fixes: PGRST204 "Could not find the 'recordings' column of 'clients'" (clientHistoryHelper Client.update when adding recording to client history)

-- Add recordings (JSONB array of recording refs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'recordings'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN recordings JSONB DEFAULT '[]';
  END IF;
END $$;

-- Add timeline (JSONB array of timeline events)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'timeline'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN timeline JSONB DEFAULT '[]';
  END IF;
END $$;

-- Add meetings (JSONB array of meeting refs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'meetings'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN meetings JSONB DEFAULT '[]';
  END IF;
END $$;
