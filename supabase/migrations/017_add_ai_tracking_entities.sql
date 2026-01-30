-- Migration: Add AI Tracking Entities
-- Date: 2026-01-30
-- Adds 2 tables for AI learning and tracking:
--   1. ai_learning - tracks AI learning and improvements per architect
--   2. project_ai_history - tracks all AI operations per project

-- =============================================================================
-- 1. AI_LEARNING TABLE
-- Tracks AI learning, corrections, and improvements
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ai_learning (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    architect_id UUID,
    architect_email TEXT,
    learning_type TEXT NOT NULL, -- 'transcription_correction', 'preference_pattern', 'style_recognition', 'terminology', 'client_insight', 'process_optimization'
    context_type TEXT, -- 'project', 'client', 'contractor', 'consultant', 'general'
    context_id UUID, -- optional reference to the context entity
    context_name TEXT,
    input_data JSONB NOT NULL, -- original AI output or data
    correction_data JSONB, -- user correction or feedback
    correction_type TEXT, -- 'text_edit', 'rejection', 'approval', 'preference', 'terminology_add'
    feedback_score INTEGER, -- 1-5 rating if applicable
    feedback_notes TEXT,
    model_used TEXT, -- 'gpt-4', 'whisper', 'claude', etc.
    prompt_template TEXT, -- which prompt template was used
    applied BOOLEAN DEFAULT false, -- whether this learning has been applied
    applied_at TIMESTAMP WITH TIME ZONE,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    usage_count INTEGER DEFAULT 0, -- how many times this learning was used
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    tags TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_learning_architect_email ON public.ai_learning(architect_email);
CREATE INDEX IF NOT EXISTS idx_ai_learning_learning_type ON public.ai_learning(learning_type);
CREATE INDEX IF NOT EXISTS idx_ai_learning_context ON public.ai_learning(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_ai_learning_is_active ON public.ai_learning(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_learning_created_at ON public.ai_learning(created_at);

-- Enable RLS
ALTER TABLE public.ai_learning ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "ai_learning_select" ON public.ai_learning;
DROP POLICY IF EXISTS "ai_learning_insert" ON public.ai_learning;
DROP POLICY IF EXISTS "ai_learning_update" ON public.ai_learning;
DROP POLICY IF EXISTS "ai_learning_delete" ON public.ai_learning;

-- Only architects can see their own learning data
CREATE POLICY "ai_learning_select" ON public.ai_learning FOR SELECT TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
  );

CREATE POLICY "ai_learning_insert" ON public.ai_learning FOR INSERT TO authenticated
  WITH CHECK (
    public.is_architect_or_higher()
  );

CREATE POLICY "ai_learning_update" ON public.ai_learning FOR UPDATE TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
  );

CREATE POLICY "ai_learning_delete" ON public.ai_learning FOR DELETE TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_ai_learning_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ai_learning_updated_at_trigger ON public.ai_learning;
CREATE TRIGGER ai_learning_updated_at_trigger
    BEFORE UPDATE ON public.ai_learning
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_learning_updated_at();

-- =============================================================================
-- 2. PROJECT_AI_HISTORY TABLE
-- Tracks all AI operations performed on a project
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.project_ai_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    project_name TEXT,
    action_type TEXT NOT NULL, -- 'transcription', 'analysis', 'summary', 'suggestion', 'generation', 'extraction', 'classification', 'translation'
    action_subtype TEXT, -- more specific action, e.g., 'first_call_analysis', 'client_needs_extraction'
    source_type TEXT, -- 'recording', 'document', 'user_input', 'scheduled'
    source_id UUID, -- reference to source entity
    source_name TEXT,
    input_data JSONB, -- input sent to AI (may be truncated for large inputs)
    input_tokens INTEGER,
    output_data JSONB, -- output from AI
    output_tokens INTEGER,
    total_tokens INTEGER,
    model_used TEXT NOT NULL, -- 'gpt-4', 'gpt-4-turbo', 'whisper-1', 'claude-3', etc.
    model_version TEXT,
    prompt_template_id TEXT, -- reference to prompt template used
    processing_time_ms INTEGER, -- how long the AI call took
    estimated_cost DECIMAL(10,6), -- estimated cost in USD
    status TEXT DEFAULT 'success', -- 'pending', 'processing', 'success', 'failed', 'partial', 'cancelled'
    error_message TEXT,
    error_code TEXT,
    retry_count INTEGER DEFAULT 0,
    user_rating INTEGER, -- 1-5 user rating of output quality
    user_feedback TEXT,
    was_edited BOOLEAN DEFAULT false, -- whether user edited the output
    edited_output JSONB, -- user's edited version
    triggered_by TEXT, -- 'user', 'system', 'webhook', 'scheduled'
    triggered_by_user_email TEXT,
    metadata JSONB DEFAULT '{}'::jsonb, -- additional metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    architect_id UUID,
    architect_email TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_ai_history_project_id ON public.project_ai_history(project_id);
CREATE INDEX IF NOT EXISTS idx_project_ai_history_action_type ON public.project_ai_history(action_type);
CREATE INDEX IF NOT EXISTS idx_project_ai_history_model_used ON public.project_ai_history(model_used);
CREATE INDEX IF NOT EXISTS idx_project_ai_history_status ON public.project_ai_history(status);
CREATE INDEX IF NOT EXISTS idx_project_ai_history_architect_email ON public.project_ai_history(architect_email);
CREATE INDEX IF NOT EXISTS idx_project_ai_history_created_at ON public.project_ai_history(created_at);
CREATE INDEX IF NOT EXISTS idx_project_ai_history_source ON public.project_ai_history(source_type, source_id);

-- Enable RLS
ALTER TABLE public.project_ai_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "project_ai_history_select" ON public.project_ai_history;
DROP POLICY IF EXISTS "project_ai_history_insert" ON public.project_ai_history;
DROP POLICY IF EXISTS "project_ai_history_update" ON public.project_ai_history;
DROP POLICY IF EXISTS "project_ai_history_delete" ON public.project_ai_history;

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

-- Allow service role and authenticated users to insert (for edge functions)
CREATE POLICY "project_ai_history_insert" ON public.project_ai_history FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "project_ai_history_update" ON public.project_ai_history FOR UPDATE TO authenticated
  USING (
    public.is_admin_user() 
    OR architect_email = public.jwt_email()
  );

CREATE POLICY "project_ai_history_delete" ON public.project_ai_history FOR DELETE TO authenticated
  USING (public.is_admin_user());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_project_ai_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS project_ai_history_updated_at_trigger ON public.project_ai_history;
CREATE TRIGGER project_ai_history_updated_at_trigger
    BEFORE UPDATE ON public.project_ai_history
    FOR EACH ROW
    EXECUTE FUNCTION update_project_ai_history_updated_at();

-- =============================================================================
-- HELPER VIEW: AI Usage Statistics per Architect
-- =============================================================================

CREATE OR REPLACE VIEW public.ai_usage_stats AS
SELECT 
    architect_email,
    DATE_TRUNC('month', created_at) as month,
    action_type,
    model_used,
    COUNT(*) as total_calls,
    SUM(total_tokens) as total_tokens,
    SUM(estimated_cost) as total_cost,
    AVG(processing_time_ms) as avg_processing_time,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_calls,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_calls,
    AVG(user_rating) as avg_user_rating
FROM public.project_ai_history
GROUP BY architect_email, DATE_TRUNC('month', created_at), action_type, model_used;

-- =============================================================================
-- COMMIT
-- =============================================================================
COMMIT;
