-- Migration: Fix project_ai_history RLS policies
-- Date: 2026-02-01
-- Purpose: Ensure INSERT policy allows authenticated users

-- =============================================================================
-- 1. DROP ALL EXISTING POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "project_ai_history_select" ON public.project_ai_history;
DROP POLICY IF EXISTS "project_ai_history_insert" ON public.project_ai_history;
DROP POLICY IF EXISTS "project_ai_history_update" ON public.project_ai_history;
DROP POLICY IF EXISTS "project_ai_history_delete" ON public.project_ai_history;

-- =============================================================================
-- 2. RECREATE POLICIES WITH CORRECT PERMISSIONS
-- =============================================================================

-- SELECT: Allow architects to see their own history or project history
CREATE POLICY "project_ai_history_select" ON public.project_ai_history FOR SELECT TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
    OR EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_ai_history.project_id 
      AND (p.architect_email = public.jwt_email() OR p.created_by = public.jwt_email())
    )
  );

-- INSERT: Allow any authenticated user to insert (for AI operations)
CREATE POLICY "project_ai_history_insert" ON public.project_ai_history FOR INSERT TO authenticated
  WITH CHECK (true);

-- UPDATE: Allow owner or admin to update
CREATE POLICY "project_ai_history_update" ON public.project_ai_history FOR UPDATE TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
  );

-- DELETE: Only admin can delete
CREATE POLICY "project_ai_history_delete" ON public.project_ai_history FOR DELETE TO authenticated
  USING (public.is_admin_user());

-- =============================================================================
-- 3. ALSO FIX ai_learning table policies (same pattern)
-- =============================================================================

DROP POLICY IF EXISTS "ai_learning_select" ON public.ai_learning;
DROP POLICY IF EXISTS "ai_learning_insert" ON public.ai_learning;
DROP POLICY IF EXISTS "ai_learning_update" ON public.ai_learning;
DROP POLICY IF EXISTS "ai_learning_delete" ON public.ai_learning;

-- SELECT: Allow architects to see their own learning data or admin
CREATE POLICY "ai_learning_select" ON public.ai_learning FOR SELECT TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
  );

-- INSERT: Allow any authenticated user to insert
CREATE POLICY "ai_learning_insert" ON public.ai_learning FOR INSERT TO authenticated
  WITH CHECK (true);

-- UPDATE: Allow owner or admin
CREATE POLICY "ai_learning_update" ON public.ai_learning FOR UPDATE TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
  );

-- DELETE: Allow owner or admin
CREATE POLICY "ai_learning_delete" ON public.ai_learning FOR DELETE TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
  );

-- =============================================================================
-- VERIFY RLS IS ENABLED
-- =============================================================================

ALTER TABLE public.project_ai_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_learning ENABLE ROW LEVEL SECURITY;
