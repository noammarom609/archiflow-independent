-- RLS Policies for ArchiFlow with Clerk Authentication
-- This script sets up Row Level Security policies that work with Clerk JWT tokens

-- =============================================================================
-- HELPER FUNCTIONS (using public schema - auth schema is restricted in Supabase)
-- =============================================================================

-- Function to get the Clerk user ID from JWT (sub claim)
CREATE OR REPLACE FUNCTION public.clerk_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    NULL
  );
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get the current user's email from JWT or by looking up clerk_id
CREATE OR REPLACE FUNCTION public.jwt_email()
RETURNS TEXT AS $$
DECLARE
  clerk_id TEXT;
  email_value TEXT;
  claims json;
BEGIN
  -- Try to get JWT claims
  BEGIN
    claims := current_setting('request.jwt.claims', true)::json;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;
  
  -- First try to get email directly from JWT (if included in template)
  email_value := claims->>'email';
  IF email_value IS NOT NULL THEN
    RETURN LOWER(email_value);
  END IF;
  
  -- Try primary_email_address shortcode
  email_value := claims->>'primary_email_address';
  IF email_value IS NOT NULL THEN
    RETURN LOWER(email_value);
  END IF;
  
  -- If no email in JWT, look up by clerk_id (sub claim)
  clerk_id := claims->>'sub';
  IF clerk_id IS NOT NULL THEN
    SELECT LOWER(u.email) INTO email_value
    FROM public.users u
    WHERE u.clerk_id = clerk_id
    LIMIT 1;
    
    IF email_value IS NOT NULL THEN
      RETURN email_value;
    END IF;
  END IF;
  
  -- Try user_metadata path (fallback)
  email_value := claims->'user_metadata'->>'email';
  IF email_value IS NOT NULL THEN
    RETURN LOWER(email_value);
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if user is super_admin or admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT app_role INTO user_role 
  FROM public.users 
  WHERE LOWER(email) = LOWER(public.jwt_email());
  
  RETURN user_role IN ('super_admin', 'admin');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if user is architect or higher
CREATE OR REPLACE FUNCTION public.is_architect_or_higher()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT app_role INTO user_role 
  FROM public.users 
  WHERE LOWER(email) = LOWER(public.jwt_email());
  
  RETURN user_role IN ('super_admin', 'admin', 'architect', 'project_manager');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get current user's app_role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT app_role INTO user_role 
  FROM public.users 
  WHERE LOWER(email) = LOWER(public.jwt_email());
  
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get current user's id
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id 
  FROM public.users 
  WHERE LOWER(email) = LOWER(public.jwt_email());
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================================================
-- USERS TABLE RLS
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert themselves" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Anyone can insert user" ON public.users;

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read users (for lookup purposes)
CREATE POLICY "Anyone authenticated can read users"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

-- Allow inserting new users (for registration)
CREATE POLICY "Anyone can insert user during registration"
  ON public.users FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Allow users to update their own data, admins can update anyone
CREATE POLICY "Users can update their own data or admins can update any"
  ON public.users FOR UPDATE
  TO authenticated
  USING (
    LOWER(email) = LOWER(public.jwt_email()) 
    OR public.is_admin_user()
  );

-- Only super_admin can delete users
CREATE POLICY "Super admin can delete users"
  ON public.users FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'super_admin');

-- =============================================================================
-- PROJECTS TABLE RLS
-- =============================================================================

DROP POLICY IF EXISTS "Users can read projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete projects" ON public.projects;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Architects and higher can read all projects
-- Team members can read projects they're assigned to
CREATE POLICY "Read projects based on role"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    public.is_architect_or_higher()
    OR created_by = public.jwt_email()
    OR architect_email = public.jwt_email()
    OR architect_id = public.get_current_user_id()
    OR EXISTS (
      SELECT 1 FROM public.project_permissions 
      WHERE project_id = projects.id 
      AND user_email = public.jwt_email()
    )
  );

-- Architects and higher can create projects
CREATE POLICY "Create projects for architects and higher"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (public.is_architect_or_higher());

-- Architects and higher can update projects they own or all if admin
CREATE POLICY "Update projects based on role"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_user()
    OR (public.is_architect_or_higher() AND (
      created_by = public.jwt_email()
      OR architect_email = public.jwt_email()
      OR architect_id = public.get_current_user_id()
    ))
  );

-- Only admins can delete projects
CREATE POLICY "Delete projects for admins"
  ON public.projects FOR DELETE
  TO authenticated
  USING (public.is_admin_user());

-- =============================================================================
-- CLIENTS TABLE RLS
-- =============================================================================

DROP POLICY IF EXISTS "Read clients" ON public.clients;
DROP POLICY IF EXISTS "Create clients" ON public.clients;
DROP POLICY IF EXISTS "Update clients" ON public.clients;
DROP POLICY IF EXISTS "Delete clients" ON public.clients;

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read clients based on role"
  ON public.clients FOR SELECT
  TO authenticated
  USING (
    public.is_admin_user()
    OR (public.is_architect_or_higher() AND (
      architect_email IS NULL 
      OR architect_email = public.jwt_email()
      OR created_by = public.jwt_email()
    ))
    OR email = public.jwt_email()
  );

CREATE POLICY "Create clients for architects and higher"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (public.is_architect_or_higher());

CREATE POLICY "Update clients based on role"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_user()
    OR (public.is_architect_or_higher() AND (
      architect_email = public.jwt_email()
      OR created_by = public.jwt_email()
    ))
  );

CREATE POLICY "Delete clients for admins"
  ON public.clients FOR DELETE
  TO authenticated
  USING (public.is_admin_user());

-- =============================================================================
-- TASKS TABLE RLS
-- =============================================================================

DROP POLICY IF EXISTS "Read tasks" ON public.tasks;
DROP POLICY IF EXISTS "Create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Delete tasks" ON public.tasks;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read tasks based on project access"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (
    public.is_admin_user()
    OR EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id::text = tasks.project_id 
      AND (
        p.architect_email = public.jwt_email()
        OR p.created_by = public.jwt_email()
        OR public.is_architect_or_higher()
      )
    )
    OR assigned_to = public.jwt_email()
    OR created_by = public.jwt_email()
  );

CREATE POLICY "Create tasks for team members and higher"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('super_admin', 'admin', 'architect', 'project_manager', 'team_member', 'employee')
  );

CREATE POLICY "Update tasks based on access"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_user()
    OR assigned_to = public.jwt_email()
    OR created_by = public.jwt_email()
  );

CREATE POLICY "Delete tasks for architects and higher"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (
    public.is_architect_or_higher()
    OR created_by = public.jwt_email()
  );

-- =============================================================================
-- NOTIFICATIONS TABLE RLS
-- =============================================================================

DROP POLICY IF EXISTS "Read notifications" ON public.notifications;
DROP POLICY IF EXISTS "Create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Delete notifications" ON public.notifications;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_email = public.jwt_email() OR user_id = public.get_current_user_id());

CREATE POLICY "Anyone authenticated can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_email = public.jwt_email() OR user_id = public.get_current_user_id());

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_email = public.jwt_email() OR user_id = public.get_current_user_id());

-- =============================================================================
-- DOCUMENTS TABLE RLS
-- =============================================================================

DROP POLICY IF EXISTS "Read documents" ON public.documents;
DROP POLICY IF EXISTS "Create documents" ON public.documents;
DROP POLICY IF EXISTS "Update documents" ON public.documents;
DROP POLICY IF EXISTS "Delete documents" ON public.documents;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read documents based on project access"
  ON public.documents FOR SELECT
  TO authenticated
  USING (
    public.is_admin_user()
    OR uploaded_by = public.jwt_email()
    OR EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id::text = documents.project_id 
      AND (
        p.architect_email = public.jwt_email()
        OR p.created_by = public.jwt_email()
        OR public.is_architect_or_higher()
      )
    )
  );

CREATE POLICY "Create documents for team and higher"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('super_admin', 'admin', 'architect', 'project_manager', 'team_member', 'employee')
  );

CREATE POLICY "Update documents based on access"
  ON public.documents FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_user()
    OR uploaded_by = public.jwt_email()
  );

CREATE POLICY "Delete documents for uploaders and admins"
  ON public.documents FOR DELETE
  TO authenticated
  USING (
    public.is_admin_user()
    OR uploaded_by = public.jwt_email()
  );

-- =============================================================================
-- CALENDAR_EVENTS TABLE RLS
-- =============================================================================

DROP POLICY IF EXISTS "Read calendar_events" ON public.calendar_events;
DROP POLICY IF EXISTS "Create calendar_events" ON public.calendar_events;
DROP POLICY IF EXISTS "Update calendar_events" ON public.calendar_events;
DROP POLICY IF EXISTS "Delete calendar_events" ON public.calendar_events;

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read calendar events"
  ON public.calendar_events FOR SELECT
  TO authenticated
  USING (
    public.is_architect_or_higher()
    OR created_by = public.jwt_email()
    OR owner_email = public.jwt_email()
    OR public.jwt_email() = ANY(string_to_array(attendees, ','))
  );

CREATE POLICY "Create calendar events"
  ON public.calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('super_admin', 'admin', 'architect', 'project_manager', 'team_member', 'employee')
  );

CREATE POLICY "Update calendar events"
  ON public.calendar_events FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_user()
    OR created_by = public.jwt_email()
    OR owner_email = public.jwt_email()
  );

CREATE POLICY "Delete calendar events"
  ON public.calendar_events FOR DELETE
  TO authenticated
  USING (
    public.is_admin_user()
    OR created_by = public.jwt_email()
    OR owner_email = public.jwt_email()
  );

-- =============================================================================
-- TIME_ENTRIES TABLE RLS
-- =============================================================================

DROP POLICY IF EXISTS "Read time_entries" ON public.time_entries;
DROP POLICY IF EXISTS "Create time_entries" ON public.time_entries;
DROP POLICY IF EXISTS "Update time_entries" ON public.time_entries;
DROP POLICY IF EXISTS "Delete time_entries" ON public.time_entries;

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read time entries"
  ON public.time_entries FOR SELECT
  TO authenticated
  USING (
    public.is_architect_or_higher()
    OR user_email = public.jwt_email()
    OR created_by = public.jwt_email()
  );

CREATE POLICY "Create time entries"
  ON public.time_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('super_admin', 'admin', 'architect', 'project_manager', 'team_member', 'employee')
  );

CREATE POLICY "Update time entries"
  ON public.time_entries FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_user()
    OR user_email = public.jwt_email()
    OR created_by = public.jwt_email()
  );

CREATE POLICY "Delete time entries"
  ON public.time_entries FOR DELETE
  TO authenticated
  USING (
    public.is_admin_user()
    OR created_by = public.jwt_email()
  );

-- =============================================================================
-- GENERIC RLS FOR OTHER TABLES
-- =============================================================================

-- Contractors
ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contractors_select" ON public.contractors;
DROP POLICY IF EXISTS "contractors_insert" ON public.contractors;
DROP POLICY IF EXISTS "contractors_update" ON public.contractors;
DROP POLICY IF EXISTS "contractors_delete" ON public.contractors;

CREATE POLICY "contractors_select" ON public.contractors FOR SELECT TO authenticated
  USING (public.is_admin_user() OR architect_email = public.jwt_email() OR created_by = public.jwt_email() OR email = public.jwt_email());
CREATE POLICY "contractors_insert" ON public.contractors FOR INSERT TO authenticated
  WITH CHECK (public.is_architect_or_higher());
CREATE POLICY "contractors_update" ON public.contractors FOR UPDATE TO authenticated
  USING (public.is_admin_user() OR architect_email = public.jwt_email() OR created_by = public.jwt_email());
CREATE POLICY "contractors_delete" ON public.contractors FOR DELETE TO authenticated
  USING (public.is_admin_user());

-- Consultants
ALTER TABLE public.consultants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "consultants_select" ON public.consultants;
DROP POLICY IF EXISTS "consultants_insert" ON public.consultants;
DROP POLICY IF EXISTS "consultants_update" ON public.consultants;
DROP POLICY IF EXISTS "consultants_delete" ON public.consultants;

CREATE POLICY "consultants_select" ON public.consultants FOR SELECT TO authenticated
  USING (public.is_admin_user() OR architect_email = public.jwt_email() OR created_by = public.jwt_email() OR email = public.jwt_email());
CREATE POLICY "consultants_insert" ON public.consultants FOR INSERT TO authenticated
  WITH CHECK (public.is_architect_or_higher());
CREATE POLICY "consultants_update" ON public.consultants FOR UPDATE TO authenticated
  USING (public.is_admin_user() OR architect_email = public.jwt_email() OR created_by = public.jwt_email());
CREATE POLICY "consultants_delete" ON public.consultants FOR DELETE TO authenticated
  USING (public.is_admin_user());

-- Suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "suppliers_select" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_insert" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_update" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_delete" ON public.suppliers;

CREATE POLICY "suppliers_select" ON public.suppliers FOR SELECT TO authenticated
  USING (public.is_admin_user() OR architect_email = public.jwt_email() OR created_by = public.jwt_email() OR email = public.jwt_email());
CREATE POLICY "suppliers_insert" ON public.suppliers FOR INSERT TO authenticated
  WITH CHECK (public.is_architect_or_higher());
CREATE POLICY "suppliers_update" ON public.suppliers FOR UPDATE TO authenticated
  USING (public.is_admin_user() OR architect_email = public.jwt_email() OR created_by = public.jwt_email());
CREATE POLICY "suppliers_delete" ON public.suppliers FOR DELETE TO authenticated
  USING (public.is_admin_user());

-- Team Members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "team_members_select" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert" ON public.team_members;
DROP POLICY IF EXISTS "team_members_update" ON public.team_members;
DROP POLICY IF EXISTS "team_members_delete" ON public.team_members;

CREATE POLICY "team_members_select" ON public.team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "team_members_insert" ON public.team_members FOR INSERT TO authenticated WITH CHECK (public.is_architect_or_higher());
CREATE POLICY "team_members_update" ON public.team_members FOR UPDATE TO authenticated USING (public.is_architect_or_higher());
CREATE POLICY "team_members_delete" ON public.team_members FOR DELETE TO authenticated USING (public.is_admin_user());

-- Proposals
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "proposals_select" ON public.proposals;
DROP POLICY IF EXISTS "proposals_insert" ON public.proposals;
DROP POLICY IF EXISTS "proposals_update" ON public.proposals;
DROP POLICY IF EXISTS "proposals_delete" ON public.proposals;

CREATE POLICY "proposals_select" ON public.proposals FOR SELECT TO authenticated
  USING (public.is_architect_or_higher() OR created_by = public.jwt_email());
CREATE POLICY "proposals_insert" ON public.proposals FOR INSERT TO authenticated
  WITH CHECK (public.is_architect_or_higher());
CREATE POLICY "proposals_update" ON public.proposals FOR UPDATE TO authenticated
  USING (public.is_architect_or_higher());
CREATE POLICY "proposals_delete" ON public.proposals FOR DELETE TO authenticated
  USING (public.is_admin_user());

-- Invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
DROP POLICY IF EXISTS "invoices_insert" ON public.invoices;
DROP POLICY IF EXISTS "invoices_update" ON public.invoices;
DROP POLICY IF EXISTS "invoices_delete" ON public.invoices;

CREATE POLICY "invoices_select" ON public.invoices FOR SELECT TO authenticated
  USING (public.is_architect_or_higher() OR created_by = public.jwt_email());
CREATE POLICY "invoices_insert" ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (public.is_architect_or_higher());
CREATE POLICY "invoices_update" ON public.invoices FOR UPDATE TO authenticated
  USING (public.is_architect_or_higher());
CREATE POLICY "invoices_delete" ON public.invoices FOR DELETE TO authenticated
  USING (public.is_admin_user());

-- Expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expenses_select" ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert" ON public.expenses;
DROP POLICY IF EXISTS "expenses_update" ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete" ON public.expenses;

CREATE POLICY "expenses_select" ON public.expenses FOR SELECT TO authenticated
  USING (public.is_architect_or_higher() OR created_by = public.jwt_email());
CREATE POLICY "expenses_insert" ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('super_admin', 'admin', 'architect', 'project_manager', 'team_member', 'employee'));
CREATE POLICY "expenses_update" ON public.expenses FOR UPDATE TO authenticated
  USING (public.is_architect_or_higher() OR created_by = public.jwt_email());
CREATE POLICY "expenses_delete" ON public.expenses FOR DELETE TO authenticated
  USING (public.is_admin_user());

-- Recordings
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recordings_select" ON public.recordings;
DROP POLICY IF EXISTS "recordings_insert" ON public.recordings;
DROP POLICY IF EXISTS "recordings_update" ON public.recordings;
DROP POLICY IF EXISTS "recordings_delete" ON public.recordings;

CREATE POLICY "recordings_select" ON public.recordings FOR SELECT TO authenticated
  USING (public.is_architect_or_higher() OR created_by = public.jwt_email());
CREATE POLICY "recordings_insert" ON public.recordings FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('super_admin', 'admin', 'architect', 'project_manager', 'team_member', 'employee'));
CREATE POLICY "recordings_update" ON public.recordings FOR UPDATE TO authenticated
  USING (public.is_architect_or_higher() OR created_by = public.jwt_email());
CREATE POLICY "recordings_delete" ON public.recordings FOR DELETE TO authenticated
  USING (public.is_admin_user() OR created_by = public.jwt_email());

-- Journal Entries
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "journal_entries_select" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_entries_insert" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_entries_update" ON public.journal_entries;
DROP POLICY IF EXISTS "journal_entries_delete" ON public.journal_entries;

CREATE POLICY "journal_entries_select" ON public.journal_entries FOR SELECT TO authenticated
  USING (public.is_architect_or_higher() OR created_by = public.jwt_email());
CREATE POLICY "journal_entries_insert" ON public.journal_entries FOR INSERT TO authenticated
  WITH CHECK (public.is_architect_or_higher());
CREATE POLICY "journal_entries_update" ON public.journal_entries FOR UPDATE TO authenticated
  USING (public.is_architect_or_higher() OR created_by = public.jwt_email());
CREATE POLICY "journal_entries_delete" ON public.journal_entries FOR DELETE TO authenticated
  USING (public.is_admin_user());

-- Moodboards
ALTER TABLE public.moodboards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "moodboards_select" ON public.moodboards;
DROP POLICY IF EXISTS "moodboards_insert" ON public.moodboards;
DROP POLICY IF EXISTS "moodboards_update" ON public.moodboards;
DROP POLICY IF EXISTS "moodboards_delete" ON public.moodboards;

CREATE POLICY "moodboards_select" ON public.moodboards FOR SELECT TO authenticated
  USING (public.is_architect_or_higher() OR created_by = public.jwt_email());
CREATE POLICY "moodboards_insert" ON public.moodboards FOR INSERT TO authenticated
  WITH CHECK (public.is_architect_or_higher());
CREATE POLICY "moodboards_update" ON public.moodboards FOR UPDATE TO authenticated
  USING (public.is_architect_or_higher() OR created_by = public.jwt_email());
CREATE POLICY "moodboards_delete" ON public.moodboards FOR DELETE TO authenticated
  USING (public.is_admin_user() OR created_by = public.jwt_email());

-- Design Assets
ALTER TABLE public.design_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "design_assets_select" ON public.design_assets;
DROP POLICY IF EXISTS "design_assets_insert" ON public.design_assets;
DROP POLICY IF EXISTS "design_assets_update" ON public.design_assets;
DROP POLICY IF EXISTS "design_assets_delete" ON public.design_assets;

CREATE POLICY "design_assets_select" ON public.design_assets FOR SELECT TO authenticated
  USING (public.is_architect_or_higher() OR created_by = public.jwt_email());
CREATE POLICY "design_assets_insert" ON public.design_assets FOR INSERT TO authenticated
  WITH CHECK (public.is_architect_or_higher());
CREATE POLICY "design_assets_update" ON public.design_assets FOR UPDATE TO authenticated
  USING (public.is_architect_or_higher() OR created_by = public.jwt_email());
CREATE POLICY "design_assets_delete" ON public.design_assets FOR DELETE TO authenticated
  USING (public.is_admin_user() OR created_by = public.jwt_email());

-- Content Items
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "content_items_select" ON public.content_items;
DROP POLICY IF EXISTS "content_items_insert" ON public.content_items;
DROP POLICY IF EXISTS "content_items_update" ON public.content_items;
DROP POLICY IF EXISTS "content_items_delete" ON public.content_items;

CREATE POLICY "content_items_select" ON public.content_items FOR SELECT TO authenticated
  USING (public.is_architect_or_higher() OR created_by = public.jwt_email());
CREATE POLICY "content_items_insert" ON public.content_items FOR INSERT TO authenticated
  WITH CHECK (public.is_architect_or_higher());
CREATE POLICY "content_items_update" ON public.content_items FOR UPDATE TO authenticated
  USING (public.is_architect_or_higher() OR created_by = public.jwt_email());
CREATE POLICY "content_items_delete" ON public.content_items FOR DELETE TO authenticated
  USING (public.is_admin_user() OR created_by = public.jwt_email());

-- Project Permissions
ALTER TABLE public.project_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "project_permissions_select" ON public.project_permissions;
DROP POLICY IF EXISTS "project_permissions_insert" ON public.project_permissions;
DROP POLICY IF EXISTS "project_permissions_update" ON public.project_permissions;
DROP POLICY IF EXISTS "project_permissions_delete" ON public.project_permissions;

CREATE POLICY "project_permissions_select" ON public.project_permissions FOR SELECT TO authenticated
  USING (public.is_architect_or_higher() OR user_email = public.jwt_email());
CREATE POLICY "project_permissions_insert" ON public.project_permissions FOR INSERT TO authenticated
  WITH CHECK (public.is_architect_or_higher());
CREATE POLICY "project_permissions_update" ON public.project_permissions FOR UPDATE TO authenticated
  USING (public.is_architect_or_higher());
CREATE POLICY "project_permissions_delete" ON public.project_permissions FOR DELETE TO authenticated
  USING (public.is_architect_or_higher());

-- Meeting Slots
ALTER TABLE public.meeting_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "meeting_slots_select" ON public.meeting_slots;
DROP POLICY IF EXISTS "meeting_slots_insert" ON public.meeting_slots;
DROP POLICY IF EXISTS "meeting_slots_update" ON public.meeting_slots;
DROP POLICY IF EXISTS "meeting_slots_delete" ON public.meeting_slots;

CREATE POLICY "meeting_slots_select" ON public.meeting_slots FOR SELECT TO authenticated USING (true);
CREATE POLICY "meeting_slots_insert" ON public.meeting_slots FOR INSERT TO authenticated
  WITH CHECK (public.is_architect_or_higher());
CREATE POLICY "meeting_slots_update" ON public.meeting_slots FOR UPDATE TO authenticated
  USING (public.is_architect_or_higher() OR created_by = public.jwt_email());
CREATE POLICY "meeting_slots_delete" ON public.meeting_slots FOR DELETE TO authenticated
  USING (public.is_architect_or_higher());

-- Comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_select" ON public.comments;
DROP POLICY IF EXISTS "comments_insert" ON public.comments;
DROP POLICY IF EXISTS "comments_update" ON public.comments;
DROP POLICY IF EXISTS "comments_delete" ON public.comments;

CREATE POLICY "comments_select" ON public.comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert" ON public.comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "comments_update" ON public.comments FOR UPDATE TO authenticated
  USING (user_email = public.jwt_email() OR public.is_admin_user());
CREATE POLICY "comments_delete" ON public.comments FOR DELETE TO authenticated
  USING (user_email = public.jwt_email() OR public.is_admin_user());

-- Push Subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "push_subscriptions_select" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_insert" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_update" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subscriptions_delete" ON public.push_subscriptions;

CREATE POLICY "push_subscriptions_select" ON public.push_subscriptions FOR SELECT TO authenticated
  USING (user_email = public.jwt_email() OR public.is_admin_user());
CREATE POLICY "push_subscriptions_insert" ON public.push_subscriptions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "push_subscriptions_update" ON public.push_subscriptions FOR UPDATE TO authenticated
  USING (user_email = public.jwt_email());
CREATE POLICY "push_subscriptions_delete" ON public.push_subscriptions FOR DELETE TO authenticated
  USING (user_email = public.jwt_email());

-- User Google Tokens
ALTER TABLE public.user_google_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_google_tokens_select" ON public.user_google_tokens;
DROP POLICY IF EXISTS "user_google_tokens_insert" ON public.user_google_tokens;
DROP POLICY IF EXISTS "user_google_tokens_update" ON public.user_google_tokens;
DROP POLICY IF EXISTS "user_google_tokens_delete" ON public.user_google_tokens;

CREATE POLICY "user_google_tokens_select" ON public.user_google_tokens FOR SELECT TO authenticated
  USING (user_email = public.jwt_email());
CREATE POLICY "user_google_tokens_insert" ON public.user_google_tokens FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "user_google_tokens_update" ON public.user_google_tokens FOR UPDATE TO authenticated
  USING (user_email = public.jwt_email());
CREATE POLICY "user_google_tokens_delete" ON public.user_google_tokens FOR DELETE TO authenticated
  USING (user_email = public.jwt_email());

-- System Settings (only super_admin)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "system_settings_select" ON public.system_settings;
DROP POLICY IF EXISTS "system_settings_insert" ON public.system_settings;
DROP POLICY IF EXISTS "system_settings_update" ON public.system_settings;
DROP POLICY IF EXISTS "system_settings_delete" ON public.system_settings;

CREATE POLICY "system_settings_select" ON public.system_settings FOR SELECT TO authenticated
  USING (public.get_user_role() = 'super_admin');
CREATE POLICY "system_settings_insert" ON public.system_settings FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() = 'super_admin');
CREATE POLICY "system_settings_update" ON public.system_settings FOR UPDATE TO authenticated
  USING (public.get_user_role() = 'super_admin');
CREATE POLICY "system_settings_delete" ON public.system_settings FOR DELETE TO authenticated
  USING (public.get_user_role() = 'super_admin');

-- Proposal Templates
ALTER TABLE public.proposal_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "proposal_templates_all" ON public.proposal_templates;
CREATE POLICY "proposal_templates_all" ON public.proposal_templates FOR ALL TO authenticated
  USING (public.is_architect_or_higher());

-- Proposal Clauses
ALTER TABLE public.proposal_clauses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "proposal_clauses_all" ON public.proposal_clauses;
CREATE POLICY "proposal_clauses_all" ON public.proposal_clauses FOR ALL TO authenticated
  USING (public.is_architect_or_higher());

-- Contractor Quotes
ALTER TABLE public.contractor_quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contractor_quotes_select" ON public.contractor_quotes;
DROP POLICY IF EXISTS "contractor_quotes_insert" ON public.contractor_quotes;
DROP POLICY IF EXISTS "contractor_quotes_update" ON public.contractor_quotes;
DROP POLICY IF EXISTS "contractor_quotes_delete" ON public.contractor_quotes;

CREATE POLICY "contractor_quotes_select" ON public.contractor_quotes FOR SELECT TO authenticated
  USING (public.is_architect_or_higher() OR contractor_email = public.jwt_email());
CREATE POLICY "contractor_quotes_insert" ON public.contractor_quotes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "contractor_quotes_update" ON public.contractor_quotes FOR UPDATE TO authenticated
  USING (public.is_architect_or_higher() OR contractor_email = public.jwt_email());
CREATE POLICY "contractor_quotes_delete" ON public.contractor_quotes FOR DELETE TO authenticated
  USING (public.is_admin_user());

-- Consultant Tasks
ALTER TABLE public.consultant_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "consultant_tasks_select" ON public.consultant_tasks;
DROP POLICY IF EXISTS "consultant_tasks_insert" ON public.consultant_tasks;
DROP POLICY IF EXISTS "consultant_tasks_update" ON public.consultant_tasks;
DROP POLICY IF EXISTS "consultant_tasks_delete" ON public.consultant_tasks;

CREATE POLICY "consultant_tasks_select" ON public.consultant_tasks FOR SELECT TO authenticated
  USING (public.is_architect_or_higher() OR consultant_email = public.jwt_email());
CREATE POLICY "consultant_tasks_insert" ON public.consultant_tasks FOR INSERT TO authenticated
  WITH CHECK (public.is_architect_or_higher());
CREATE POLICY "consultant_tasks_update" ON public.consultant_tasks FOR UPDATE TO authenticated
  USING (public.is_architect_or_higher() OR consultant_email = public.jwt_email());
CREATE POLICY "consultant_tasks_delete" ON public.consultant_tasks FOR DELETE TO authenticated
  USING (public.is_admin_user());

-- Transcription Corrections
ALTER TABLE public.transcription_corrections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "transcription_corrections_all" ON public.transcription_corrections;
CREATE POLICY "transcription_corrections_all" ON public.transcription_corrections FOR ALL TO authenticated
  USING (public.is_architect_or_higher() OR created_by = public.jwt_email());

COMMIT;
