-- Migration: Allow anon uploads to documents bucket (for testing)
-- Date: 2026-02-01
-- Purpose: Try a more permissive policy

-- Policy that allows ANYONE (including anon) to upload
-- This is for testing only - can be restricted later
DO $$
BEGIN
  -- Drop any conflicting policies first
  DROP POLICY IF EXISTS "storage_docs_insert_v2" ON storage.objects;
  DROP POLICY IF EXISTS "documents_insert_policy" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated uploads to documents" ON storage.objects;
  
  -- Create a very permissive insert policy
  CREATE POLICY "documents_allow_all_insert" 
  ON storage.objects FOR INSERT 
  TO public  -- Allow everyone including anon
  WITH CHECK (bucket_id = 'documents');
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;

-- Also create for 'objects' bucket in case that's being used
DO $$
BEGIN
  DROP POLICY IF EXISTS "objects_insert_policy" ON storage.objects;
  
  CREATE POLICY "objects_allow_all_insert" 
  ON storage.objects FOR INSERT 
  TO public
  WITH CHECK (bucket_id = 'objects');
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating objects policy: %', SQLERRM;
END $$;
