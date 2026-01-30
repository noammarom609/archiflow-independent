-- Migration: Add setting_key, setting_value, description to system_settings
-- Date: 2026-01-30
-- Fixes: 400 Bad Request - 'column system_settings.setting_key does not exist' (checklistLoader, SystemSettingsTab)

-- Ensure system_settings table exists (create if missing, e.g. from dashboard)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add setting_key if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'system_settings' AND column_name = 'setting_key'
  ) THEN
    ALTER TABLE public.system_settings ADD COLUMN setting_key TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_system_settings_setting_key ON public.system_settings(setting_key);
  END IF;
END $$;

-- Add setting_value if missing (JSONB for checklist arrays)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'system_settings' AND column_name = 'setting_value'
  ) THEN
    ALTER TABLE public.system_settings ADD COLUMN setting_value JSONB DEFAULT '[]';
  END IF;
END $$;

-- Add description if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'system_settings' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.system_settings ADD COLUMN description TEXT;
  END IF;
END $$;
