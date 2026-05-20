-- Fix RLS for transcriptions to allow Guest and Hospital patients without Auth
-- This ensures the Phraseboard and History work for all patient types

-- 1. Add patient_profile_id column if it doesn't exist
ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS patient_profile_id UUID REFERENCES patient_profiles(id) ON DELETE CASCADE;

-- 2. Drop old restrictive policies
DROP POLICY IF EXISTS "Users and therapists can insert transcriptions" ON transcriptions;
DROP POLICY IF EXISTS "Users and therapists can view transcriptions" ON transcriptions;
DROP POLICY IF EXISTS "Users and therapists can delete transcriptions" ON transcriptions;

-- 3. Create Public/Flexible Insert policy
DROP POLICY IF EXISTS "Anyone can insert transcriptions" ON transcriptions;
CREATE POLICY "Anyone can insert transcriptions"
  ON transcriptions FOR INSERT
  WITH CHECK (true);

-- 4. Create View policy
-- Allows viewing own OR assigned therapist
DROP POLICY IF EXISTS "Anyone can view transcriptions" ON transcriptions;
CREATE POLICY "Anyone can view transcriptions"
  ON transcriptions FOR SELECT
  USING (
    auth.uid() = user_id 
    OR 
    patient_profile_id IN (
        SELECT id FROM patient_profiles 
        WHERE therapist_id IN (SELECT id FROM therapist_profiles WHERE user_id = auth.uid())
    )
  );

-- 5. Enable Real-time for transcriptions (helpful for live history updates)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'transcriptions') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE transcriptions;
    END IF;
END $$;

COMMENT ON COLUMN transcriptions.patient_profile_id IS 'Link to patient_profiles for tracking history of hospital/guest patients without auth accounts';
