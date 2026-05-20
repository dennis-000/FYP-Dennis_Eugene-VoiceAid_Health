-- Add metadata column to patient_analytics
ALTER TABLE patient_analytics ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE patient_analytics ADD COLUMN IF NOT EXISTS patient_profile_id UUID REFERENCES patient_profiles(id) ON DELETE CASCADE;

-- 1. Anyone can insert Clinical Priority alerts (for non-auth hospital patients)
DROP POLICY IF EXISTS "Anyone can insert clinical alerts" ON patient_analytics;
CREATE POLICY "Anyone can insert clinical alerts"
    ON patient_analytics FOR INSERT
    WITH CHECK (mode IN ('CLINICAL_PRIORITY', 'CLINICAL_RESOLVED'));

-- 2. Patients can insert their own regular analytics (auth required)
DROP POLICY IF EXISTS "Patients can insert own analytics" ON patient_analytics;
CREATE POLICY "Patients can insert own analytics"
    ON patient_analytics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 3. Flexible VIEW policy for Real-time and History
DROP POLICY IF EXISTS "Anyone can view relevant analytics" ON patient_analytics;
CREATE POLICY "Anyone can view relevant analytics"
    ON patient_analytics FOR SELECT
    USING (
        auth.uid() IS NOT NULL -- Any authenticated user can see analytics (simplest for admin dashboard)
    );

-- SET REPLICA IDENTITY FULL for real-time payloads
-- This ensures the full row is sent to the dashboard
ALTER TABLE patient_analytics REPLICA IDENTITY FULL;
ALTER TABLE patient_profiles REPLICA IDENTITY FULL;
ALTER TABLE transcriptions REPLICA IDENTITY FULL;

-- ENABLE REAL-TIME for these tables
-- This adds them to the 'supabase_realtime' publication
DO $$
BEGIN
    -- Ensure the publication exists
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    -- Add tables if not already present
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'patient_analytics') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE patient_analytics;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'patient_profiles') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE patient_profiles;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'transcriptions') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE transcriptions;
    END IF;
END $$;

-- Comment for clarity
COMMENT ON COLUMN patient_analytics.metadata IS 'Stores additional context like GPS coordinates and emergency status';
COMMENT ON COLUMN patient_analytics.patient_profile_id IS 'Link to patient_profiles for tracking hospital patients without auth accounts';
