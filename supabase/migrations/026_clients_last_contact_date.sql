-- Migration: Add last_contact_date to clients
-- Date: 2026-01-30
-- Fixes: PGRST204 "Could not find the 'last_contact_date' column of 'clients'" (clientHistoryHelper Client.update when adding recording to client history)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'last_contact_date'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN last_contact_date DATE;
    CREATE INDEX IF NOT EXISTS idx_clients_last_contact_date ON public.clients(last_contact_date);
  END IF;
END $$;
