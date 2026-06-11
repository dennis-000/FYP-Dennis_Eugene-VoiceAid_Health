-- Migration 019: Fix RLS policies for patient_goals table
-- To allow patients (both authenticated and anonymous roles) to view, update, and seed their own goals.

-- 1. Enable Row Level Security on patient_goals
ALTER TABLE patient_goals ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any exist (to avoid duplicates or conflicts)
DROP POLICY IF EXISTS "Anyone can view patient goals" ON patient_goals;
DROP POLICY IF EXISTS "Anyone can insert patient goals" ON patient_goals;
DROP POLICY IF EXISTS "Anyone can update patient goals" ON patient_goals;
DROP POLICY IF EXISTS "Anyone can delete patient goals" ON patient_goals;
DROP POLICY IF EXISTS "Therapists can insert patient goals" ON patient_goals;
DROP POLICY IF EXISTS "Therapists can view patient goals" ON patient_goals;
DROP POLICY IF EXISTS "Therapists can update patient goals" ON patient_goals;
DROP POLICY IF EXISTS "Therapists can delete patient goals" ON patient_goals;
DROP POLICY IF EXISTS "Patients can view own goals" ON patient_goals;
DROP POLICY IF EXISTS "Patients can update own goals" ON patient_goals;

-- 3. Create SELECT policy:
-- Allows authenticated patients to view their goals, therapists to view their patients' goals, and anonymous users to view all goals (needed for guest/hospital mode).
CREATE POLICY "Anyone can view patient goals"
  ON patient_goals FOR SELECT
  USING (
    auth.uid() = (SELECT user_id FROM patient_profiles WHERE id = patient_id)
    OR
    patient_id IN (
        SELECT id FROM patient_profiles 
        WHERE therapist_id IN (SELECT id FROM therapist_profiles WHERE user_id = auth.uid())
    )
    OR
    (auth.role() = 'anon')
  );

-- 4. Create INSERT policy:
-- Allows both authenticated therapists and anonymous/authenticated patients to assign/seed goals.
CREATE POLICY "Anyone can insert patient goals"
  ON patient_goals FOR INSERT
  WITH CHECK (true);

-- 5. Create UPDATE policy:
-- Allows patients (authenticated or anonymous) and therapists to toggle completed status or update transcripts.
CREATE POLICY "Anyone can update patient goals"
  ON patient_goals FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 6. Create DELETE policy:
-- Allows therapists or anonymous users to delete goals.
CREATE POLICY "Anyone can delete patient goals"
  ON patient_goals FOR DELETE
  USING (
    patient_id IN (
        SELECT id FROM patient_profiles 
        WHERE therapist_id IN (SELECT id FROM therapist_profiles WHERE user_id = auth.uid())
    )
    OR
    (auth.role() = 'anon')
  );

-- 7. Ensure patient_goals replica identity is set to FULL for real-time syncing
ALTER TABLE patient_goals REPLICA IDENTITY FULL;

-- 8. Add table to real-time publication if not already present
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'patient_goals') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE patient_goals;
    END IF;
END $$;
