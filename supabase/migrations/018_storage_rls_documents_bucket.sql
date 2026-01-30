-- Migration: Storage RLS policies for documents bucket
-- Date: 2026-01-30
-- Fixes: "new row violates row-level security policy" when uploading files (recordings, documents)
-- The app uses bucket 'documents' by default in integrations.UploadFile

-- Allow authenticated users to INSERT (upload) into the documents bucket
DROP POLICY IF EXISTS "Allow authenticated uploads to documents" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to SELECT (read) from the documents bucket
DROP POLICY IF EXISTS "Allow authenticated read documents" ON storage.objects;
CREATE POLICY "Allow authenticated read documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Allow authenticated users to UPDATE their uploads (e.g. metadata)
DROP POLICY IF EXISTS "Allow authenticated update documents" ON storage.objects;
CREATE POLICY "Allow authenticated update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to DELETE from the documents bucket
DROP POLICY IF EXISTS "Allow authenticated delete documents" ON storage.objects;
CREATE POLICY "Allow authenticated delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
