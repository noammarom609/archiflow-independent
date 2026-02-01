-- Migration: Simple storage policies for documents bucket
-- Date: 2026-02-01
-- Purpose: Minimal policies to fix upload RLS error

-- First, check if bucket exists and create if not
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('documents', 'documents', true)
  ON CONFLICT (id) DO UPDATE SET public = true;
EXCEPTION WHEN OTHERS THEN
  -- Bucket might already exist, that's ok
  RAISE NOTICE 'Bucket already exists or could not be created: %', SQLERRM;
END $$;

-- Create INSERT policy with a unique name
DO $$
BEGIN
  -- Try to create the policy
  EXECUTE 'CREATE POLICY "storage_docs_insert_v2" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''documents'')';
EXCEPTION 
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy storage_docs_insert_v2 already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create insert policy: %', SQLERRM;
END $$;

-- Create SELECT policy for public access
DO $$
BEGIN
  EXECUTE 'CREATE POLICY "storage_docs_select_v2" ON storage.objects FOR SELECT TO public USING (bucket_id = ''documents'')';
EXCEPTION 
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy storage_docs_select_v2 already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create select policy: %', SQLERRM;
END $$;

-- Create UPDATE policy
DO $$
BEGIN
  EXECUTE 'CREATE POLICY "storage_docs_update_v2" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''documents'') WITH CHECK (bucket_id = ''documents'')';
EXCEPTION 
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy storage_docs_update_v2 already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create update policy: %', SQLERRM;
END $$;

-- Create DELETE policy
DO $$
BEGIN
  EXECUTE 'CREATE POLICY "storage_docs_delete_v2" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''documents'')';
EXCEPTION 
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy storage_docs_delete_v2 already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create delete policy: %', SQLERRM;
END $$;
