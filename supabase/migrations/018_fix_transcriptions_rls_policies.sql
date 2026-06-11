-- Fix user_id constraint and SELECT/DELETE policies for transcriptions table
-- To allow hospital/guest patients (anonymous role) to read and delete their own records.

-- 1. Make user_id nullable since guest/hospital patients do not have auth accounts
ALTER TABLE transcriptions ALTER COLUMN user_id DROP NOT NULL;

-- 2. Re-create the SELECT policy to allow anonymous reads
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
    OR
    -- Allow anonymous users to view transcriptions associated with a patient_profile
    (auth.role() = 'anon')
  );

-- 2. Create a DELETE policy to allow anonymous deletes
DROP POLICY IF EXISTS "Anyone can delete transcriptions" ON transcriptions;
CREATE POLICY "Anyone can delete transcriptions"
  ON transcriptions FOR DELETE
  USING (
    auth.uid() = user_id
    OR
    patient_profile_id IN (
        SELECT id FROM patient_profiles 
        WHERE therapist_id IN (SELECT id FROM therapist_profiles WHERE user_id = auth.uid())
    )
    OR
    -- Allow anonymous users to delete transcriptions associated with a patient_profile
    (auth.role() = 'anon')
  );
