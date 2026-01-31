-- Migration: Ensure calendar_events table exists with correct schema
-- Fixes: 400 Bad Request when adding event from Calendar (AddEventDialog)
-- The table may have been created elsewhere with missing/different columns.

-- =============================================================================
-- CREATE calendar_events IF NOT EXISTS (full schema for app + RLS)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'meeting',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  location TEXT,
  attendees TEXT,
  status TEXT DEFAULT 'approved',
  created_by TEXT,
  owner_email TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  google_calendar_event_id TEXT,
  google_calendar_id TEXT,
  source TEXT,
  source_recording_id UUID,
  reminder BOOLEAN DEFAULT true,
  reminder_minutes INTEGER DEFAULT 30,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ADD MISSING COLUMNS if table already existed with different schema
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'calendar_events' AND column_name = 'owner_email') THEN
    ALTER TABLE public.calendar_events ADD COLUMN owner_email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'calendar_events' AND column_name = 'attendees') THEN
    ALTER TABLE public.calendar_events ADD COLUMN attendees TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'calendar_events' AND column_name = 'created_by') THEN
    ALTER TABLE public.calendar_events ADD COLUMN created_by TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'calendar_events' AND column_name = 'start_date') THEN
    ALTER TABLE public.calendar_events ADD COLUMN start_date TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'calendar_events' AND column_name = 'end_date') THEN
    ALTER TABLE public.calendar_events ADD COLUMN end_date TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'calendar_events' AND column_name = 'event_type') THEN
    ALTER TABLE public.calendar_events ADD COLUMN event_type TEXT DEFAULT 'meeting';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'calendar_events' AND column_name = 'all_day') THEN
    ALTER TABLE public.calendar_events ADD COLUMN all_day BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'calendar_events' AND column_name = 'location') THEN
    ALTER TABLE public.calendar_events ADD COLUMN location TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'calendar_events' AND column_name = 'status') THEN
    ALTER TABLE public.calendar_events ADD COLUMN status TEXT DEFAULT 'approved';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'calendar_events' AND column_name = 'project_id') THEN
    ALTER TABLE public.calendar_events ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON public.calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON public.calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_events_project_id ON public.calendar_events(project_id);
