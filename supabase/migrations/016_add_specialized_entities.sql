-- Migration: Add Specialized Entities
-- Date: 2026-01-30
-- Adds 5 specialized tables for specific feature areas:
--   1. contractor_documents - documents related to contractors
--   2. consultant_messages - messages for consultant communication
--   3. consultant_documents - documents uploaded by/for consultants
--   4. cad_files - CAD file management with metadata
--   5. project_selections - material/product selections for projects

-- =============================================================================
-- 1. CONTRACTOR_DOCUMENTS TABLE
-- Documents related to contractors (contracts, certificates, insurance)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.contractor_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contractor_id UUID REFERENCES public.contractors(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT, -- 'pdf', 'image', 'word', 'other'
    file_size TEXT,
    category TEXT DEFAULT 'other', -- 'contract', 'certificate', 'insurance', 'license', 'invoice', 'other'
    expiry_date DATE,
    is_expired BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active', -- 'active', 'expired', 'archived', 'pending_review'
    verified BOOLEAN DEFAULT false,
    verified_by TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,
    architect_id UUID,
    architect_email TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contractor_documents_contractor_id ON public.contractor_documents(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_documents_project_id ON public.contractor_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_contractor_documents_category ON public.contractor_documents(category);
CREATE INDEX IF NOT EXISTS idx_contractor_documents_architect_email ON public.contractor_documents(architect_email);
CREATE INDEX IF NOT EXISTS idx_contractor_documents_expiry_date ON public.contractor_documents(expiry_date);

-- Enable RLS
ALTER TABLE public.contractor_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "contractor_documents_select" ON public.contractor_documents;
DROP POLICY IF EXISTS "contractor_documents_insert" ON public.contractor_documents;
DROP POLICY IF EXISTS "contractor_documents_update" ON public.contractor_documents;
DROP POLICY IF EXISTS "contractor_documents_delete" ON public.contractor_documents;

CREATE POLICY "contractor_documents_select" ON public.contractor_documents FOR SELECT TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
    OR created_by = public.jwt_email()
    OR EXISTS (
      SELECT 1 FROM public.contractors c 
      WHERE c.id = contractor_documents.contractor_id 
      AND c.email = public.jwt_email()
    )
  );

CREATE POLICY "contractor_documents_insert" ON public.contractor_documents FOR INSERT TO authenticated
  WITH CHECK (
    public.is_architect_or_higher()
    OR EXISTS (
      SELECT 1 FROM public.contractors c 
      WHERE c.id = contractor_id 
      AND c.email = public.jwt_email()
    )
  );

CREATE POLICY "contractor_documents_update" ON public.contractor_documents FOR UPDATE TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
    OR created_by = public.jwt_email()
  );

CREATE POLICY "contractor_documents_delete" ON public.contractor_documents FOR DELETE TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_contractor_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    -- Auto-set is_expired based on expiry_date
    IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date < CURRENT_DATE THEN
        NEW.is_expired = true;
    ELSE
        NEW.is_expired = false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contractor_documents_updated_at_trigger ON public.contractor_documents;
CREATE TRIGGER contractor_documents_updated_at_trigger
    BEFORE UPDATE ON public.contractor_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_contractor_documents_updated_at();

-- =============================================================================
-- 2. CONSULTANT_MESSAGES TABLE
-- Messages between architects and consultants
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.consultant_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    consultant_id UUID REFERENCES public.consultants(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    project_name TEXT,
    from_user_id UUID,
    from_user_email TEXT,
    from_user_name TEXT,
    to_consultant BOOLEAN DEFAULT true, -- true = to consultant, false = from consultant
    subject TEXT,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb, -- [{url, name, type, size}]
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    is_important BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    reply_to_id UUID REFERENCES public.consultant_messages(id) ON DELETE SET NULL,
    thread_id UUID, -- for grouping message threads
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    architect_id UUID,
    architect_email TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consultant_messages_consultant_id ON public.consultant_messages(consultant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_messages_project_id ON public.consultant_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_consultant_messages_thread_id ON public.consultant_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_consultant_messages_architect_email ON public.consultant_messages(architect_email);
CREATE INDEX IF NOT EXISTS idx_consultant_messages_is_read ON public.consultant_messages(is_read);

-- Enable RLS
ALTER TABLE public.consultant_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "consultant_messages_select" ON public.consultant_messages;
DROP POLICY IF EXISTS "consultant_messages_insert" ON public.consultant_messages;
DROP POLICY IF EXISTS "consultant_messages_update" ON public.consultant_messages;
DROP POLICY IF EXISTS "consultant_messages_delete" ON public.consultant_messages;

CREATE POLICY "consultant_messages_select" ON public.consultant_messages FOR SELECT TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
    OR from_user_email = public.jwt_email()
    OR EXISTS (
      SELECT 1 FROM public.consultants c 
      WHERE c.id = consultant_messages.consultant_id 
      AND c.email = public.jwt_email()
    )
  );

CREATE POLICY "consultant_messages_insert" ON public.consultant_messages FOR INSERT TO authenticated
  WITH CHECK (
    public.is_architect_or_higher()
    OR EXISTS (
      SELECT 1 FROM public.consultants c 
      WHERE c.id = consultant_id 
      AND c.email = public.jwt_email()
    )
  );

CREATE POLICY "consultant_messages_update" ON public.consultant_messages FOR UPDATE TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
    OR from_user_email = public.jwt_email()
    OR EXISTS (
      SELECT 1 FROM public.consultants c 
      WHERE c.id = consultant_messages.consultant_id 
      AND c.email = public.jwt_email()
    )
  );

CREATE POLICY "consultant_messages_delete" ON public.consultant_messages FOR DELETE TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_consultant_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS consultant_messages_updated_at_trigger ON public.consultant_messages;
CREATE TRIGGER consultant_messages_updated_at_trigger
    BEFORE UPDATE ON public.consultant_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_consultant_messages_updated_at();

-- =============================================================================
-- 3. CONSULTANT_DOCUMENTS TABLE
-- Documents uploaded by or for consultants
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.consultant_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    consultant_id UUID REFERENCES public.consultants(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    project_name TEXT,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT, -- 'pdf', 'dwg', 'image', 'word', 'excel', 'other'
    file_size TEXT,
    category TEXT DEFAULT 'other', -- 'report', 'plan', 'calculation', 'opinion', 'specification', 'other'
    document_date DATE,
    status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'under_review', 'approved', 'rejected', 'revision_needed'
    version INTEGER DEFAULT 1,
    previous_version_id UUID REFERENCES public.consultant_documents(id) ON DELETE SET NULL,
    reviewed_by TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    is_final BOOLEAN DEFAULT false,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,
    uploaded_by TEXT,
    architect_id UUID,
    architect_email TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consultant_documents_consultant_id ON public.consultant_documents(consultant_id);
CREATE INDEX IF NOT EXISTS idx_consultant_documents_project_id ON public.consultant_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_consultant_documents_category ON public.consultant_documents(category);
CREATE INDEX IF NOT EXISTS idx_consultant_documents_status ON public.consultant_documents(status);
CREATE INDEX IF NOT EXISTS idx_consultant_documents_architect_email ON public.consultant_documents(architect_email);

-- Enable RLS
ALTER TABLE public.consultant_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "consultant_documents_select" ON public.consultant_documents;
DROP POLICY IF EXISTS "consultant_documents_insert" ON public.consultant_documents;
DROP POLICY IF EXISTS "consultant_documents_update" ON public.consultant_documents;
DROP POLICY IF EXISTS "consultant_documents_delete" ON public.consultant_documents;

CREATE POLICY "consultant_documents_select" ON public.consultant_documents FOR SELECT TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
    OR created_by = public.jwt_email()
    OR uploaded_by = public.jwt_email()
    OR EXISTS (
      SELECT 1 FROM public.consultants c 
      WHERE c.id = consultant_documents.consultant_id 
      AND c.email = public.jwt_email()
    )
  );

CREATE POLICY "consultant_documents_insert" ON public.consultant_documents FOR INSERT TO authenticated
  WITH CHECK (
    public.is_architect_or_higher()
    OR EXISTS (
      SELECT 1 FROM public.consultants c 
      WHERE c.id = consultant_id 
      AND c.email = public.jwt_email()
    )
  );

CREATE POLICY "consultant_documents_update" ON public.consultant_documents FOR UPDATE TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
    OR created_by = public.jwt_email()
    OR uploaded_by = public.jwt_email()
  );

CREATE POLICY "consultant_documents_delete" ON public.consultant_documents FOR DELETE TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_consultant_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS consultant_documents_updated_at_trigger ON public.consultant_documents;
CREATE TRIGGER consultant_documents_updated_at_trigger
    BEFORE UPDATE ON public.consultant_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_consultant_documents_updated_at();

-- =============================================================================
-- 4. CAD_FILES TABLE
-- CAD file management with specialized metadata
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.cad_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    project_name TEXT,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'dwg', 'dxf', 'skp', 'rvt', '3ds', 'obj', 'fbx', 'ifc', 'other'
    file_size TEXT,
    thumbnail_url TEXT,
    preview_url TEXT, -- for web-viewable preview
    stage TEXT, -- 'survey', 'concept', 'schematic', 'design_development', 'construction', 'as_built'
    drawing_type TEXT, -- 'floor_plan', 'section', 'elevation', 'detail', 'site_plan', '3d_model', 'other'
    scale TEXT, -- '1:50', '1:100', etc.
    version INTEGER DEFAULT 1,
    version_notes TEXT,
    previous_version_id UUID REFERENCES public.cad_files(id) ON DELETE SET NULL,
    is_current BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'draft', -- 'draft', 'for_review', 'approved', 'superseded', 'archived'
    approved_by TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    software_version TEXT, -- e.g., 'AutoCAD 2025', 'SketchUp 2024'
    coordinate_system TEXT,
    units TEXT DEFAULT 'meters', -- 'meters', 'centimeters', 'millimeters', 'feet', 'inches'
    layers_info JSONB, -- layer names and visibility
    xrefs JSONB, -- external references
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,
    uploaded_by TEXT,
    architect_id UUID,
    architect_email TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cad_files_project_id ON public.cad_files(project_id);
CREATE INDEX IF NOT EXISTS idx_cad_files_file_type ON public.cad_files(file_type);
CREATE INDEX IF NOT EXISTS idx_cad_files_stage ON public.cad_files(stage);
CREATE INDEX IF NOT EXISTS idx_cad_files_drawing_type ON public.cad_files(drawing_type);
CREATE INDEX IF NOT EXISTS idx_cad_files_architect_email ON public.cad_files(architect_email);
CREATE INDEX IF NOT EXISTS idx_cad_files_is_current ON public.cad_files(is_current);

-- Enable RLS
ALTER TABLE public.cad_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "cad_files_select" ON public.cad_files;
DROP POLICY IF EXISTS "cad_files_insert" ON public.cad_files;
DROP POLICY IF EXISTS "cad_files_update" ON public.cad_files;
DROP POLICY IF EXISTS "cad_files_delete" ON public.cad_files;

CREATE POLICY "cad_files_select" ON public.cad_files FOR SELECT TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
    OR created_by = public.jwt_email()
    OR uploaded_by = public.jwt_email()
    OR EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = cad_files.project_id 
      AND (p.architect_email = public.jwt_email() OR p.created_by = public.jwt_email())
    )
  );

CREATE POLICY "cad_files_insert" ON public.cad_files FOR INSERT TO authenticated
  WITH CHECK (public.is_architect_or_higher());

CREATE POLICY "cad_files_update" ON public.cad_files FOR UPDATE TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
    OR created_by = public.jwt_email()
  );

CREATE POLICY "cad_files_delete" ON public.cad_files FOR DELETE TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_cad_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cad_files_updated_at_trigger ON public.cad_files;
CREATE TRIGGER cad_files_updated_at_trigger
    BEFORE UPDATE ON public.cad_files
    FOR EACH ROW
    EXECUTE FUNCTION update_cad_files_updated_at();

-- =============================================================================
-- 5. PROJECT_SELECTIONS TABLE
-- Material and product selections for projects
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.project_selections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    project_name TEXT,
    category TEXT NOT NULL, -- 'flooring', 'tiles', 'lighting', 'furniture', 'paint', 'sanitary', 'kitchen', 'doors_windows', 'fabrics', 'accessories', 'outdoor', 'other'
    subcategory TEXT,
    room TEXT, -- 'living_room', 'bedroom', 'bathroom', 'kitchen', 'hallway', 'office', 'outdoor', 'general'
    item_name TEXT NOT NULL,
    brand TEXT,
    model_number TEXT,
    description TEXT,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT,
    supplier_contact TEXT,
    unit_price DECIMAL(12,2),
    quantity DECIMAL(10,2) DEFAULT 1,
    unit TEXT DEFAULT 'unit', -- 'unit', 'sqm', 'lm', 'kg', 'set'
    total_price DECIMAL(12,2),
    currency TEXT DEFAULT 'ILS',
    lead_time TEXT, -- e.g., '2-3 weeks'
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'ordered', 'in_transit', 'delivered', 'installed', 'rejected'
    priority INTEGER DEFAULT 0, -- for sorting
    image_url TEXT,
    specification_url TEXT,
    catalog_page TEXT,
    color TEXT,
    finish TEXT,
    dimensions TEXT,
    material TEXT,
    notes TEXT,
    client_approved BOOLEAN DEFAULT false,
    client_approved_at TIMESTAMP WITH TIME ZONE,
    approved_by TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    ordered_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    installed_at TIMESTAMP WITH TIME ZONE,
    alternatives JSONB DEFAULT '[]'::jsonb, -- [{name, supplier, price, notes}]
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,
    architect_id UUID,
    architect_email TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_selections_project_id ON public.project_selections(project_id);
CREATE INDEX IF NOT EXISTS idx_project_selections_category ON public.project_selections(category);
CREATE INDEX IF NOT EXISTS idx_project_selections_room ON public.project_selections(room);
CREATE INDEX IF NOT EXISTS idx_project_selections_supplier_id ON public.project_selections(supplier_id);
CREATE INDEX IF NOT EXISTS idx_project_selections_status ON public.project_selections(status);
CREATE INDEX IF NOT EXISTS idx_project_selections_architect_email ON public.project_selections(architect_email);

-- Enable RLS
ALTER TABLE public.project_selections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "project_selections_select" ON public.project_selections;
DROP POLICY IF EXISTS "project_selections_insert" ON public.project_selections;
DROP POLICY IF EXISTS "project_selections_update" ON public.project_selections;
DROP POLICY IF EXISTS "project_selections_delete" ON public.project_selections;

CREATE POLICY "project_selections_select" ON public.project_selections FOR SELECT TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
    OR created_by = public.jwt_email()
    OR EXISTS (
      SELECT 1 FROM public.projects p 
      WHERE p.id = project_selections.project_id 
      AND (p.architect_email = public.jwt_email() OR p.created_by = public.jwt_email())
    )
    -- Allow clients to view their project selections
    OR EXISTS (
      SELECT 1 FROM public.client_access ca 
      WHERE ca.project_id = project_selections.project_id 
      AND ca.client_email = public.jwt_email()
      AND ca.is_active = true
    )
  );

CREATE POLICY "project_selections_insert" ON public.project_selections FOR INSERT TO authenticated
  WITH CHECK (public.is_architect_or_higher());

CREATE POLICY "project_selections_update" ON public.project_selections FOR UPDATE TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
    OR created_by = public.jwt_email()
  );

CREATE POLICY "project_selections_delete" ON public.project_selections FOR DELETE TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_project_selections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    -- Auto-calculate total_price
    IF NEW.unit_price IS NOT NULL AND NEW.quantity IS NOT NULL THEN
        NEW.total_price = NEW.unit_price * NEW.quantity;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS project_selections_updated_at_trigger ON public.project_selections;
CREATE TRIGGER project_selections_updated_at_trigger
    BEFORE UPDATE ON public.project_selections
    FOR EACH ROW
    EXECUTE FUNCTION update_project_selections_updated_at();

-- Also trigger on insert for total_price calculation
DROP TRIGGER IF EXISTS project_selections_insert_trigger ON public.project_selections;
CREATE TRIGGER project_selections_insert_trigger
    BEFORE INSERT ON public.project_selections
    FOR EACH ROW
    EXECUTE FUNCTION update_project_selections_updated_at();

-- =============================================================================
-- COMMIT
-- =============================================================================
COMMIT;
