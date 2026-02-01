-- Migration: Complete fix for Storage RLS policies
-- Date: 2026-02-01
-- Purpose: Ensure documents bucket exists, is public, and has proper RLS policies
-- Fixes: "StorageApiError: new row violates row-level security policy" when uploading files

-- ================================
-- STEP 1: Ensure bucket exists and is public
-- ================================

-- Create documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  true,  -- Public so Edge Functions can access audio URLs
  524288000,  -- 500MB limit
  ARRAY['audio/*', 'video/*', 'application/pdf', 'image/*', 'application/octet-stream']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = COALESCE(EXCLUDED.file_size_limit, storage.buckets.file_size_limit);

-- ================================
-- STEP 2: Drop ALL existing policies to start fresh
-- ================================

DROP POLICY IF EXISTS "Allow authenticated uploads to documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete documents" ON storage.objects;
DROP POLICY IF EXISTS "documents_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "documents_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "documents_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "documents_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can read from documents bucket" ON storage.objects;

-- ================================
-- STEP 3: Create comprehensive RLS policies
-- ================================

-- INSERT policy - allow authenticated users to upload to documents bucket
CREATE POLICY "documents_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- SELECT policy - allow public read (since bucket is public)
CREATE POLICY "documents_select_policy"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

-- UPDATE policy - allow authenticated users to update their files
CREATE POLICY "documents_update_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- DELETE policy - allow authenticated users to delete from documents bucket
CREATE POLICY "documents_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');

-- ================================
-- STEP 4: Also handle 'objects' bucket (some apps default to this)
-- ================================

-- Create objects bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'objects', 
  'objects', 
  true,
  524288000,  -- 500MB limit
  ARRAY['audio/*', 'video/*', 'application/pdf', 'image/*', 'application/octet-stream']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = COALESCE(EXCLUDED.file_size_limit, storage.buckets.file_size_limit);

-- Drop any existing objects bucket policies
DROP POLICY IF EXISTS "objects_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "objects_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "objects_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "objects_delete_policy" ON storage.objects;

-- Create policies for objects bucket
CREATE POLICY "objects_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'objects');

CREATE POLICY "objects_select_policy"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'objects');

CREATE POLICY "objects_update_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'objects')
WITH CHECK (bucket_id = 'objects');

CREATE POLICY "objects_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'objects');

-- Note: storage.objects already has RLS enabled by Supabase
-- We don't have permission to alter it, and it's not needed
