-- Migration: Add project_type column with proper constraint
-- Date: 2026-02-01
-- Purpose: Add project_type column to projects table with all valid values

-- =============================================================================
-- 1. ADD project_type COLUMN IF NOT EXISTS
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects' 
        AND column_name = 'project_type'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN project_type TEXT DEFAULT 'renovation_apartment';
        COMMENT ON COLUMN public.projects.project_type IS 'Project type: residential, commercial, custom';
    END IF;
END $$;

-- =============================================================================
-- 2. DROP EXISTING CONSTRAINT IF EXISTS
-- =============================================================================

DO $$
BEGIN
    -- Drop the constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'projects_project_type_check' 
        AND table_name = 'projects'
    ) THEN
        ALTER TABLE public.projects DROP CONSTRAINT projects_project_type_check;
    END IF;
END $$;

-- =============================================================================
-- 3. ADD NEW CONSTRAINT WITH ALL VALID PROJECT TYPES
-- =============================================================================

-- Valid project types matching checklistLoader.jsx PROJECT_TYPES:
-- Apartments: renovation_apartment, new_build_apartment
-- Private Houses: renovation_private_house, new_build_private_house
-- Villas: renovation_villa, new_build_villa
-- Offices: renovation_office, new_build_office
-- Restaurants: renovation_restaurant, new_build_restaurant
-- Retail: renovation_retail, new_build_retail
-- Custom: custom_project

ALTER TABLE public.projects
ADD CONSTRAINT projects_project_type_check CHECK (
    project_type IS NULL OR project_type IN (
        -- Apartments
        'renovation_apartment',
        'new_build_apartment',
        -- Private Houses
        'renovation_private_house',
        'new_build_private_house',
        -- Villas
        'renovation_villa',
        'new_build_villa',
        -- Offices
        'renovation_office',
        'new_build_office',
        -- Restaurants
        'renovation_restaurant',
        'new_build_restaurant',
        -- Retail
        'renovation_retail',
        'new_build_retail',
        -- Custom
        'custom_project'
    )
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_project_type ON public.projects(project_type);

COMMIT;
