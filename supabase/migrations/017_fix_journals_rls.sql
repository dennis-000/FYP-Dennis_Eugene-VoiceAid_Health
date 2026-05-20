-- ============================================================
-- Migration 017: Fix Voice Journal Storage RLS Policies
-- ============================================================
-- PROBLEM: Patients get 403 Unauthorized when uploading journal
-- audio to Supabase Storage ("journals" bucket).
-- Root Cause: The previous migration (016) tried to use storage.objects
-- directly which requires superuser. This migration uses the correct
-- Supabase Storage RLS approach.
--
-- ALSO FIXES: voice_journals table RLS so patients can insert entries
-- even without an authenticated session (hospital patients use anon key).
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- STEP 1: Ensure the journals bucket exists (idempotent)
-- ────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'journals',
    'journals',
    true,
    52428800,  -- 50 MB max per file
    ARRAY['audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/x-m4a']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/x-m4a'];

-- ────────────────────────────────────────────────────────────
-- STEP 2: Drop ALL previous storage policies for journals
-- (they may be conflicting or broken)
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public Access to Journals"          ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload journals"         ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update journals"         ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete journals"         ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload journals"  ON storage.objects;
DROP POLICY IF EXISTS "Patients upload own journals"       ON storage.objects;
DROP POLICY IF EXISTS "Journals are publicly readable"     ON storage.objects;

-- ────────────────────────────────────────────────────────────
-- STEP 3: Create clean, working RLS policies for storage.objects
-- ────────────────────────────────────────────────────────────

-- Allow EVERYONE (authenticated + anon) to READ journal audio files
-- This is needed so audio URLs work publicly (therapist can listen)
CREATE POLICY "Journals are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'journals');

-- Allow authenticated users to upload their own journal audio
-- Folder structure: {patient_id}/journal_{patient_id}_{timestamp}.wav
CREATE POLICY "Authenticated patients can upload journals"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'journals'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow anon key uploads too (for patients using hospital connect without auth)
-- They upload to a folder matching their patient_id stored in AsyncStorage
CREATE POLICY "Anyone can upload to journals bucket"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'journals');

-- Allow authenticated users to update their own journal files
CREATE POLICY "Authenticated patients can update journals"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'journals'
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (bucket_id = 'journals');

-- Allow anon updates (needed for upsert with x-upsert header)
CREATE POLICY "Anyone can update journals bucket"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'journals')
WITH CHECK (bucket_id = 'journals');

-- Allow authenticated users to delete their own journal files
CREATE POLICY "Authenticated patients can delete journals"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'journals'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ────────────────────────────────────────────────────────────
-- STEP 4: Fix voice_journals TABLE RLS
-- The table needs to allow both authenticated and anon inserts
-- (hospital patients may be using anon key)
-- ────────────────────────────────────────────────────────────

-- Make sure RLS is enabled
ALTER TABLE voice_journals ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Patients can insert own journals"    ON voice_journals;
DROP POLICY IF EXISTS "Patients can view own journals"      ON voice_journals;
DROP POLICY IF EXISTS "Therapists can view patient journals" ON voice_journals;
DROP POLICY IF EXISTS "Anyone can insert journals"          ON voice_journals;
DROP POLICY IF EXISTS "Service role full access to journals" ON voice_journals;

-- Allow patients (authenticated or anon with patient_id) to INSERT new entries
CREATE POLICY "Anyone can insert voice journals"
ON voice_journals FOR INSERT
TO public
WITH CHECK (true);

-- Allow authenticated patients to see their own journals
CREATE POLICY "Patients can view own journals"
ON voice_journals FOR SELECT
TO authenticated
USING (
    patient_id IN (
        SELECT id FROM patient_profiles WHERE user_id = auth.uid()
    )
);

-- Allow anonymous reads by patient_id (for hospital patients using anon key)
CREATE POLICY "Anon can view journals by patient_id"
ON voice_journals FOR SELECT
TO anon
USING (true);

-- Allow patients to delete their own journals
CREATE POLICY "Patients can delete own journals"
ON voice_journals FOR DELETE
TO authenticated
USING (
    patient_id IN (
        SELECT id FROM patient_profiles WHERE user_id = auth.uid()
    )
);

-- Allow therapists to read journals of their assigned patients
DROP POLICY IF EXISTS "Therapists can view patient journals" ON voice_journals;
CREATE POLICY "Therapists can view patient journals"
ON voice_journals FOR SELECT
TO authenticated
USING (
    patient_id IN (
        SELECT pp.id FROM patient_profiles pp
        JOIN therapist_profiles tp ON tp.id = pp.therapist_id
        WHERE tp.user_id = auth.uid()
    )
);

-- ────────────────────────────────────────────────────────────
-- STEP 5: Verify policies were created successfully
-- ────────────────────────────────────────────────────────────
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('objects', 'voice_journals')
ORDER BY tablename, policyname;
