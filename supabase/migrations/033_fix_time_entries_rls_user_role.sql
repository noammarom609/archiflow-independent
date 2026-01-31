-- Migration 033: Fix time_entries RLS to include 'user' role
-- =============================================================================
-- Problem: When users are created automatically via Clerk, they get app_role: 'user'
-- but the RLS policy for time_entries INSERT only allows:
-- ('super_admin', 'admin', 'architect', 'project_manager', 'team_member', 'employee')
-- This causes 400 Bad Request when trying to create time entries.
-- 
-- Solution: Add 'user' to the allowed roles list for time_entries operations.
-- Note: time_entries table uses user_email and architect_email, NOT created_by
-- =============================================================================

-- Drop and recreate the time_entries RLS policies with 'user' role included

DROP POLICY IF EXISTS "Create time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Read time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Update time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Delete time entries" ON public.time_entries;

-- Recreate with 'user' role added to all operations
-- Using user_email and architect_email (the actual columns in time_entries)

CREATE POLICY "Read time entries"
  ON public.time_entries FOR SELECT
  TO authenticated
  USING (
    public.is_architect_or_higher()
    OR user_email = public.jwt_email()
    OR architect_email = public.jwt_email()
  );

-- INSERT: Allow 'user' role as well
CREATE POLICY "Create time entries"
  ON public.time_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('super_admin', 'admin', 'architect', 'project_manager', 'team_member', 'employee', 'user')
  );

CREATE POLICY "Update time entries"
  ON public.time_entries FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_user()
    OR user_email = public.jwt_email()
    OR architect_email = public.jwt_email()
  );

CREATE POLICY "Delete time entries"
  ON public.time_entries FOR DELETE
  TO authenticated
  USING (
    public.is_admin_user()
    OR user_email = public.jwt_email()
  );

-- =============================================================================
-- COMMIT
-- =============================================================================
