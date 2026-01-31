-- Migration: Add architect_email and architect_id to calendar_events
-- Fixes: Error when creating events in bypass auth mode

-- Add architect_email column if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'calendar_events' AND column_name = 'architect_email') THEN
    ALTER TABLE public.calendar_events ADD COLUMN architect_email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'calendar_events' AND column_name = 'architect_id') THEN
    ALTER TABLE public.calendar_events ADD COLUMN architect_id UUID;
  END IF;
END $$;

-- Create index for architect_email
CREATE INDEX IF NOT EXISTS idx_calendar_events_architect_email ON public.calendar_events(architect_email);
CREATE INDEX IF NOT EXISTS idx_calendar_events_architect_id ON public.calendar_events(architect_id);

-- Make architect_email nullable if it was NOT NULL (for bypass auth compatibility)
DO $$
BEGIN
  ALTER TABLE public.calendar_events ALTER COLUMN architect_email DROP NOT NULL;
EXCEPTION
  WHEN others THEN NULL; -- Column might not have NOT NULL constraint
END $$;
