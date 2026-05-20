-- Fix RLS for transcriptions to allow caregivers to manage their patients' data

-- 1. Drop old restrictive policies
DROP POLICY IF EXISTS "Users can insert their own transcriptions" ON transcriptions;
DROP POLICY IF EXISTS "Users can view their own transcriptions" ON transcriptions;

-- 2. Create flexible Insert policy
-- Allows user to insert for themselves OR therapists to insert for assigned patients
CREATE POLICY "Users and therapists can insert transcriptions"
  ON transcriptions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM patient_profiles p
      JOIN therapist_profiles t ON p.therapist_id = t.id
      WHERE p.user_id = transcriptions.user_id 
      AND t.user_id = auth.uid()
    )
  );

-- 3. Create flexible View policy
-- Allows user to view own OR therapists to view assigned patients
CREATE POLICY "Users and therapists can view transcriptions"
  ON transcriptions FOR SELECT
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM patient_profiles p
      JOIN therapist_profiles t ON p.therapist_id = t.id
      WHERE p.user_id = transcriptions.user_id 
      AND t.user_id = auth.uid()
    )
  );

-- 4. Create flexible Delete policy
CREATE POLICY "Users and therapists can delete transcriptions"
  ON transcriptions FOR DELETE
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM patient_profiles p
      JOIN therapist_profiles t ON p.therapist_id = t.id
      WHERE p.user_id = transcriptions.user_id 
      AND t.user_id = auth.uid()
    )
  );
