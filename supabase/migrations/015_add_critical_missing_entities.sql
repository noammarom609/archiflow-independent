-- Migration: Add Critical Missing Entities
-- Date: 2026-01-30
-- Adds 4 critical tables that are referenced by other entities:
--   1. recording_folders - for organizing recordings
--   2. document_signatures - for digital signatures (referenced by proposals.signature_id)
--   3. share_links - for sharing documents/projects with external users
--   4. client_access - for managing client access to projects

-- Enable pgcrypto extension for secure token generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- 1. RECORDING_FOLDERS TABLE
-- Organizes recordings into folders by project or topic
-- Referenced by: recordings.folder_id
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.recording_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    project_name TEXT,
    color TEXT,
    icon TEXT,
    recordings_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,
    architect_id UUID,
    architect_email TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recording_folders_project_id ON public.recording_folders(project_id);
CREATE INDEX IF NOT EXISTS idx_recording_folders_architect_email ON public.recording_folders(architect_email);
CREATE INDEX IF NOT EXISTS idx_recording_folders_created_by ON public.recording_folders(created_by);

-- Enable RLS
ALTER TABLE public.recording_folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "recording_folders_select" ON public.recording_folders;
DROP POLICY IF EXISTS "recording_folders_insert" ON public.recording_folders;
DROP POLICY IF EXISTS "recording_folders_update" ON public.recording_folders;
DROP POLICY IF EXISTS "recording_folders_delete" ON public.recording_folders;

CREATE POLICY "recording_folders_select" ON public.recording_folders FOR SELECT TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email() 
    OR created_by = public.jwt_email()
  );

CREATE POLICY "recording_folders_insert" ON public.recording_folders FOR INSERT TO authenticated
  WITH CHECK (public.is_architect_or_higher());

CREATE POLICY "recording_folders_update" ON public.recording_folders FOR UPDATE TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email() 
    OR created_by = public.jwt_email()
  );

CREATE POLICY "recording_folders_delete" ON public.recording_folders FOR DELETE TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_recording_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recording_folders_updated_at_trigger ON public.recording_folders;
CREATE TRIGGER recording_folders_updated_at_trigger
    BEFORE UPDATE ON public.recording_folders
    FOR EACH ROW
    EXECUTE FUNCTION update_recording_folders_updated_at();

-- =============================================================================
-- 2. DOCUMENT_SIGNATURES TABLE
-- Digital signatures for proposals, contracts, documents
-- Referenced by: proposals.signature_id
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.document_signatures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type TEXT NOT NULL, -- 'proposal', 'contract', 'document'
    entity_id UUID NOT NULL,
    signer_name TEXT NOT NULL,
    signer_email TEXT NOT NULL,
    signer_phone TEXT,
    signature_data TEXT, -- base64 encoded signature image or URL
    signature_type TEXT DEFAULT 'drawn', -- 'drawn', 'typed', 'uploaded', 'digital'
    ip_address TEXT,
    user_agent TEXT,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified BOOLEAN DEFAULT false,
    verification_token TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    architect_id UUID,
    architect_email TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_document_signatures_entity ON public.document_signatures(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_document_signatures_signer_email ON public.document_signatures(signer_email);
CREATE INDEX IF NOT EXISTS idx_document_signatures_architect_email ON public.document_signatures(architect_email);

-- Enable RLS
ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "document_signatures_select" ON public.document_signatures;
DROP POLICY IF EXISTS "document_signatures_insert" ON public.document_signatures;
DROP POLICY IF EXISTS "document_signatures_update" ON public.document_signatures;
DROP POLICY IF EXISTS "document_signatures_delete" ON public.document_signatures;

CREATE POLICY "document_signatures_select" ON public.document_signatures FOR SELECT TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
    OR signer_email = public.jwt_email()
  );

-- Allow anyone authenticated to insert (clients sign proposals)
CREATE POLICY "document_signatures_insert" ON public.document_signatures FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow anonymous users to insert signatures (for public proposal signing)
DROP POLICY IF EXISTS "document_signatures_insert_anon" ON public.document_signatures;
CREATE POLICY "document_signatures_insert_anon" ON public.document_signatures FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "document_signatures_update" ON public.document_signatures FOR UPDATE TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
  );

CREATE POLICY "document_signatures_delete" ON public.document_signatures FOR DELETE TO authenticated
  USING (public.is_admin_user());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_document_signatures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS document_signatures_updated_at_trigger ON public.document_signatures;
CREATE TRIGGER document_signatures_updated_at_trigger
    BEFORE UPDATE ON public.document_signatures
    FOR EACH ROW
    EXECUTE FUNCTION update_document_signatures_updated_at();

-- =============================================================================
-- 3. SHARE_LINKS TABLE
-- Secure links for sharing documents/projects with limited access
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.share_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token TEXT UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
    entity_type TEXT NOT NULL, -- 'project', 'document', 'proposal', 'recording', 'moodboard'
    entity_id UUID NOT NULL,
    title TEXT,
    description TEXT,
    password_hash TEXT, -- optional password protection
    permissions TEXT[] DEFAULT ARRAY['view'], -- 'view', 'download', 'comment', 'approve'
    expires_at TIMESTAMP WITH TIME ZONE,
    max_access_count INTEGER, -- null = unlimited
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    architect_id UUID,
    architect_email TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_share_links_token ON public.share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_links_entity ON public.share_links(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_share_links_architect_email ON public.share_links(architect_email);
CREATE INDEX IF NOT EXISTS idx_share_links_is_active ON public.share_links(is_active);

-- Enable RLS
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "share_links_select" ON public.share_links;
DROP POLICY IF EXISTS "share_links_insert" ON public.share_links;
DROP POLICY IF EXISTS "share_links_update" ON public.share_links;
DROP POLICY IF EXISTS "share_links_delete" ON public.share_links;

-- Authenticated users can read their own share links
CREATE POLICY "share_links_select" ON public.share_links FOR SELECT TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
    OR created_by = public.jwt_email()
  );

-- Allow anonymous users to select share links by token (for public access)
DROP POLICY IF EXISTS "share_links_select_anon" ON public.share_links;
CREATE POLICY "share_links_select_anon" ON public.share_links FOR SELECT TO anon
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "share_links_insert" ON public.share_links FOR INSERT TO authenticated
  WITH CHECK (public.is_architect_or_higher());

CREATE POLICY "share_links_update" ON public.share_links FOR UPDATE TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
    OR created_by = public.jwt_email()
  );

-- Allow anonymous update for access_count increment
DROP POLICY IF EXISTS "share_links_update_anon" ON public.share_links;
CREATE POLICY "share_links_update_anon" ON public.share_links FOR UPDATE TO anon
  USING (is_active = true);

CREATE POLICY "share_links_delete" ON public.share_links FOR DELETE TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
    OR created_by = public.jwt_email()
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_share_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS share_links_updated_at_trigger ON public.share_links;
CREATE TRIGGER share_links_updated_at_trigger
    BEFORE UPDATE ON public.share_links
    FOR EACH ROW
    EXECUTE FUNCTION update_share_links_updated_at();

-- =============================================================================
-- 4. CLIENT_ACCESS TABLE
-- Manages client access to projects and documents
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.client_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    client_email TEXT,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    access_level TEXT DEFAULT 'view', -- 'view', 'comment', 'approve', 'full'
    allowed_sections TEXT[] DEFAULT ARRAY['overview', 'documents', 'timeline'],
    can_view_financials BOOLEAN DEFAULT false,
    can_approve_documents BOOLEAN DEFAULT false,
    can_download BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_access TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    granted_by TEXT,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    architect_id UUID,
    architect_email TEXT,
    UNIQUE(client_id, project_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_access_client_id ON public.client_access(client_id);
CREATE INDEX IF NOT EXISTS idx_client_access_project_id ON public.client_access(project_id);
CREATE INDEX IF NOT EXISTS idx_client_access_client_email ON public.client_access(client_email);
CREATE INDEX IF NOT EXISTS idx_client_access_architect_email ON public.client_access(architect_email);
CREATE INDEX IF NOT EXISTS idx_client_access_is_active ON public.client_access(is_active);

-- Enable RLS
ALTER TABLE public.client_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "client_access_select" ON public.client_access;
DROP POLICY IF EXISTS "client_access_insert" ON public.client_access;
DROP POLICY IF EXISTS "client_access_update" ON public.client_access;
DROP POLICY IF EXISTS "client_access_delete" ON public.client_access;

CREATE POLICY "client_access_select" ON public.client_access FOR SELECT TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
    OR client_email = public.jwt_email()
    OR granted_by = public.jwt_email()
  );

CREATE POLICY "client_access_insert" ON public.client_access FOR INSERT TO authenticated
  WITH CHECK (public.is_architect_or_higher());

CREATE POLICY "client_access_update" ON public.client_access FOR UPDATE TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
    OR granted_by = public.jwt_email()
  );

CREATE POLICY "client_access_delete" ON public.client_access FOR DELETE TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_client_access_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS client_access_updated_at_trigger ON public.client_access;
CREATE TRIGGER client_access_updated_at_trigger
    BEFORE UPDATE ON public.client_access
    FOR EACH ROW
    EXECUTE FUNCTION update_client_access_updated_at();

-- =============================================================================
-- COMMIT
-- =============================================================================
COMMIT;
