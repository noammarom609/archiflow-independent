-- Migration: Add recording_id to documents, category to ai_learning
-- Date: 2026-01-30
-- Fixes:
--   1. PGRST204: "Could not find the 'recording_id' column of 'documents'" (PhoneCallSubStage Document.create)
--   2. 400 on ai_learning: filter uses category='client_info' but column didn't exist

-- 1. documents: add recording_id (link to recording when doc is generated from recording)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'recording_id'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN recording_id UUID REFERENCES public.recordings(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_documents_recording_id ON public.documents(recording_id);
    END IF;
END $$;

-- 2. ai_learning: add category (used by PhoneCallSubStage filter: category = 'client_info')
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ai_learning' AND column_name = 'category'
    ) THEN
        ALTER TABLE public.ai_learning ADD COLUMN category TEXT;
        CREATE INDEX IF NOT EXISTS idx_ai_learning_category ON public.ai_learning(category);
    END IF;
END $$;
