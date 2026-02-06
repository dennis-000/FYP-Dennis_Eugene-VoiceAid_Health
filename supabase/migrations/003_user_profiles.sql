-- ==========================================
-- THERAPIST PROFILES TABLE
-- ==========================================
-- Stores therapist/caregiver profile information

CREATE TABLE IF NOT EXISTS therapist_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    organization TEXT,
    specialization TEXT,
    assigned_patients TEXT[] DEFAULT '{}', -- Array of patient IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE therapist_profiles ENABLE ROW LEVEL SECURITY;

-- Therapists can read and update their own profile
CREATE POLICY "Therapists can view own profile"
    ON therapist_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Therapists can update own profile"
    ON therapist_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Allow therapists to insert their profile on signup
CREATE POLICY "Therapists can insert own profile"
    ON therapist_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- PATIENT PROFILES TABLE
-- ==========================================
-- Stores patient profile information

CREATE TABLE IF NOT EXISTS patient_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Nullable for guest patients
    patient_type TEXT NOT NULL CHECK (patient_type IN ('guest', 'hospital')),
    therapist_id UUID REFERENCES therapist_profiles(id) ON DELETE SET NULL, -- null for guests
    full_name TEXT,
    hospital_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;

-- Patients can read and update their own profile
CREATE POLICY "Patients can view own profile"
    ON patient_profiles FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Patients can update own profile"
    ON patient_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Therapists can view their assigned patients
CREATE POLICY "Therapists can view assigned patients"
    ON patient_profiles FOR SELECT
    USING (
        therapist_id IN (
            SELECT id FROM therapist_profiles WHERE user_id = auth.uid()
        )
    );

-- Therapists can update their assigned patients
CREATE POLICY "Therapists can update assigned patients"
    ON patient_profiles FOR UPDATE
    USING (
        therapist_id IN (
            SELECT id FROM therapist_profiles WHERE user_id = auth.uid()
        )
    );

-- Allow patient profile creation
CREATE POLICY "Allow patient profile creation"
    ON patient_profiles FOR INSERT
    WITH CHECK (true); -- Anyone can create a patient profile (for guest mode)

-- ==========================================
-- UPDATED_AT TRIGGER
-- ==========================================
-- Automatically update updated_at timestamp

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_therapist_profiles_updated_at
    BEFORE UPDATE ON therapist_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_profiles_updated_at
    BEFORE UPDATE ON patient_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_therapist_profiles_user_id ON therapist_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_user_id ON patient_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_therapist_id ON patient_profiles(therapist_id);
