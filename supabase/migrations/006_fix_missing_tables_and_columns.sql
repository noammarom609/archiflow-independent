-- Migration: Fix missing tables and columns
-- Date: 2026-01-30
-- Issues addressed:
--   1. Missing project_consultants table (404 Not Found)
--   2. Missing approval_status column on contractors table (400 Bad Request)

-- =============================================================================
-- 1. CREATE project_consultants TABLE
-- This table links consultants to projects (many-to-many relationship)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.project_consultants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    consultant_id UUID REFERENCES public.consultants(id) ON DELETE CASCADE,
    role TEXT, -- e.g., 'lead', 'support', 'specialist'
    status TEXT DEFAULT 'active', -- 'active', 'inactive', 'completed'
    hourly_rate DECIMAL(10,2),
    notes TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,
    architect_email TEXT,
    architect_id UUID,
    UNIQUE(project_id, consultant_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_consultants_project_id ON public.project_consultants(project_id);
CREATE INDEX IF NOT EXISTS idx_project_consultants_consultant_id ON public.project_consultants(consultant_id);
CREATE INDEX IF NOT EXISTS idx_project_consultants_architect_email ON public.project_consultants(architect_email);

-- Enable RLS
ALTER TABLE public.project_consultants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_consultants
DROP POLICY IF EXISTS "project_consultants_select" ON public.project_consultants;
DROP POLICY IF EXISTS "project_consultants_insert" ON public.project_consultants;
DROP POLICY IF EXISTS "project_consultants_update" ON public.project_consultants;
DROP POLICY IF EXISTS "project_consultants_delete" ON public.project_consultants;

CREATE POLICY "project_consultants_select" ON public.project_consultants FOR SELECT TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email() 
    OR created_by = public.jwt_email()
    OR EXISTS (
      SELECT 1 FROM public.consultants c 
      WHERE c.id = project_consultants.consultant_id 
      AND c.email = public.jwt_email()
    )
  );

CREATE POLICY "project_consultants_insert" ON public.project_consultants FOR INSERT TO authenticated
  WITH CHECK (public.is_architect_or_higher());

CREATE POLICY "project_consultants_update" ON public.project_consultants FOR UPDATE TO authenticated
  USING (public.is_admin_user() OR architect_email = public.jwt_email() OR created_by = public.jwt_email());

CREATE POLICY "project_consultants_delete" ON public.project_consultants FOR DELETE TO authenticated
  USING (public.is_admin_user() OR architect_email = public.jwt_email());

-- =============================================================================
-- 2. ADD approval_status COLUMN TO contractors TABLE (if not exists)
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'contractors' 
        AND column_name = 'approval_status'
    ) THEN
        ALTER TABLE public.contractors ADD COLUMN approval_status TEXT DEFAULT 'pending';
        COMMENT ON COLUMN public.contractors.approval_status IS 'Approval status: pending, approved, rejected';
    END IF;
END $$;

-- Create index for approval_status if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_contractors_approval_status ON public.contractors(approval_status);

-- =============================================================================
-- 3. ADD approval_status to consultants and suppliers if not exists
-- (for consistency across all external partner types)
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'consultants' 
        AND column_name = 'approval_status'
    ) THEN
        ALTER TABLE public.consultants ADD COLUMN approval_status TEXT DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'suppliers' 
        AND column_name = 'approval_status'
    ) THEN
        ALTER TABLE public.suppliers ADD COLUMN approval_status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- Update trigger for updated_at on project_consultants
CREATE OR REPLACE FUNCTION update_project_consultants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS project_consultants_updated_at_trigger ON public.project_consultants;
CREATE TRIGGER project_consultants_updated_at_trigger
    BEFORE UPDATE ON public.project_consultants
    FOR EACH ROW
    EXECUTE FUNCTION update_project_consultants_updated_at();

COMMIT;
