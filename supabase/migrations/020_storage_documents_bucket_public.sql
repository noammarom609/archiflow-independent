-- Migration: Make documents bucket public so Edge Function can download audio
-- Date: 2026-01-30
-- Fixes: "Failed to download audio: 400" - transcribe-large-audio fetches audio_url;
--        private bucket returns 400/403 when Edge Function fetches the URL.

-- Make documents bucket public so Edge Function can fetch audio_url (transcribe-large-audio)
-- If bucket doesn't exist yet, create it in Dashboard (Storage) then re-run or set public there.
UPDATE storage.buckets SET public = true WHERE id = 'documents';
