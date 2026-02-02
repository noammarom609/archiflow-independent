-- Migration: Create lead_followups table for tracking follow-up interactions with leads
-- This table stores scheduled and completed follow-up calls, meetings, and video calls

-- Create lead_followups table
CREATE TABLE IF NOT EXISTS lead_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'phone_call', -- 'phone_call', 'meeting', 'zoom'
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  outcome TEXT, -- 'answered', 'no_answer', 'rescheduled', 'moved_to_proposal'
  created_by TEXT,
  architect_email TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_lead_followups_project_id ON lead_followups(project_id);
CREATE INDEX IF NOT EXISTS idx_lead_followups_scheduled_at ON lead_followups(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_lead_followups_completed_at ON lead_followups(completed_at);
CREATE INDEX IF NOT EXISTS idx_lead_followups_architect_email ON lead_followups(architect_email);
CREATE INDEX IF NOT EXISTS idx_lead_followups_type ON lead_followups(type);

-- Enable RLS
ALTER TABLE lead_followups ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow authenticated users to read their own follow-ups
CREATE POLICY "Users can read own lead_followups"
ON lead_followups FOR SELECT
TO authenticated
USING (
  architect_email = auth.jwt()->>'email' 
  OR created_by = auth.jwt()->>'email'
  OR EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = lead_followups.project_id 
    AND (p.architect_email = auth.jwt()->>'email' OR p.created_by = auth.jwt()->>'email')
  )
);

-- Allow authenticated users to insert follow-ups
CREATE POLICY "Users can insert lead_followups"
ON lead_followups FOR INSERT
TO authenticated
WITH CHECK (
  architect_email = auth.jwt()->>'email' 
  OR created_by = auth.jwt()->>'email'
);

-- Allow authenticated users to update their own follow-ups
CREATE POLICY "Users can update own lead_followups"
ON lead_followups FOR UPDATE
TO authenticated
USING (
  architect_email = auth.jwt()->>'email' 
  OR created_by = auth.jwt()->>'email'
);

-- Allow authenticated users to delete their own follow-ups
CREATE POLICY "Users can delete own lead_followups"
ON lead_followups FOR DELETE
TO authenticated
USING (
  architect_email = auth.jwt()->>'email' 
  OR created_by = auth.jwt()->>'email'
);

-- Add trigger for updated_date
CREATE OR REPLACE FUNCTION update_lead_followups_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lead_followups_updated_date_trigger
  BEFORE UPDATE ON lead_followups
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_followups_updated_date();

-- Add proposal_approved_at column to projects for tracking when lead became active project
ALTER TABLE projects ADD COLUMN IF NOT EXISTS proposal_approved_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS lead_converted_at TIMESTAMPTZ;

-- Create index for the new columns
CREATE INDEX IF NOT EXISTS idx_projects_proposal_approved_at ON projects(proposal_approved_at);
CREATE INDEX IF NOT EXISTS idx_projects_lead_converted_at ON projects(lead_converted_at);

-- Comment for documentation
COMMENT ON TABLE lead_followups IS 'Stores follow-up interactions (calls, meetings) with leads/prospects before they become active projects';
COMMENT ON COLUMN lead_followups.type IS 'Type of follow-up: phone_call, meeting, zoom';
COMMENT ON COLUMN lead_followups.outcome IS 'Result of the follow-up: answered, no_answer, rescheduled, moved_to_proposal';
COMMENT ON COLUMN projects.proposal_approved_at IS 'Timestamp when the proposal was approved and lead became an active project';
COMMENT ON COLUMN projects.lead_converted_at IS 'Timestamp when lead was converted to active project status';
