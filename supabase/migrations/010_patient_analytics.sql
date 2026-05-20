-- Create patient_analytics table
CREATE TABLE IF NOT EXISTS patient_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    duration FLOAT NOT NULL,
    word_count INT NOT NULL,
    message_count INT NOT NULL,
    language TEXT NOT NULL,
    mode TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE patient_analytics ENABLE ROW LEVEL SECURITY;

-- 1. Patients can insert their own analytics
DROP POLICY IF EXISTS "Patients can insert own analytics" ON patient_analytics;
CREATE POLICY "Patients can insert own analytics"
    ON patient_analytics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 2. Patients can view their own analytics
DROP POLICY IF EXISTS "Patients can view own analytics" ON patient_analytics;
CREATE POLICY "Patients can view own analytics"
    ON patient_analytics FOR SELECT
    USING (auth.uid() = user_id);

-- 3. Therapists can view analytics of their assigned patients
DROP POLICY IF EXISTS "Therapists can view assigned patient analytics" ON patient_analytics;
CREATE POLICY "Therapists can view assigned patient analytics"
    ON patient_analytics FOR SELECT
    USING (
        user_id IN (
            SELECT user_id FROM patient_profiles 
            WHERE therapist_id IN (
                SELECT id FROM therapist_profiles WHERE user_id = auth.uid()
            )
        )
    );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_patient_analytics_user_date ON patient_analytics(user_id, created_at DESC);
