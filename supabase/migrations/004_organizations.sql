-- ==========================================
-- ORGANIZATION MANAGEMENT SYSTEM - FIXED
-- ==========================================
-- This migration is idempotent and can be run multiple times safely

-- ==========================================
-- ORGANIZATIONS TABLE
-- ==========================================
-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns one by one (safe if table already exists)
DO $$ 
BEGIN
    -- Add name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='organizations' AND column_name='name') THEN
        ALTER TABLE organizations ADD COLUMN name TEXT NOT NULL DEFAULT 'Unnamed Organization';
        ALTER TABLE organizations ALTER COLUMN name DROP DEFAULT;
    END IF;
    
    -- Add organization_code column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='organizations' AND column_name='organization_code') THEN
        ALTER TABLE organizations ADD COLUMN organization_code TEXT UNIQUE NOT NULL DEFAULT 'TEMP-' || gen_random_uuid()::text;
        ALTER TABLE organizations ALTER COLUMN organization_code DROP DEFAULT;
    END IF;
    
    -- Add type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='organizations' AND column_name='type') THEN
        ALTER TABLE organizations ADD COLUMN type TEXT CHECK (type IN ('hospital', 'clinic', 'private_practice'));
    END IF;
    
    -- Add location column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='organizations' AND column_name='location') THEN
        ALTER TABLE organizations ADD COLUMN location TEXT;
    END IF;
    
    -- Add contact_email column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='organizations' AND column_name='contact_email') THEN
        ALTER TABLE organizations ADD COLUMN contact_email TEXT;
    END IF;
    
    -- Add contact_phone column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='organizations' AND column_name='contact_phone') THEN
        ALTER TABLE organizations ADD COLUMN contact_phone TEXT;
    END IF;
    
    -- Add is_active column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='organizations' AND column_name='is_active') THEN
        ALTER TABLE organizations ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- ==========================================
-- ADMIN USERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns one by one
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='admin_users' AND column_name='user_id') THEN
        ALTER TABLE admin_users ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='admin_users' AND column_name='email') THEN
        ALTER TABLE admin_users ADD COLUMN email TEXT NOT NULL DEFAULT '';
        ALTER TABLE admin_users ALTER COLUMN email DROP DEFAULT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='admin_users' AND column_name='full_name') THEN
        ALTER TABLE admin_users ADD COLUMN full_name TEXT NOT NULL DEFAULT '';
        ALTER TABLE admin_users ALTER COLUMN full_name DROP DEFAULT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='admin_users' AND column_name='role') THEN
        ALTER TABLE admin_users ADD COLUMN role TEXT CHECK (role IN ('super_admin', 'org_admin')) NOT NULL DEFAULT 'org_admin';
        ALTER TABLE admin_users ALTER COLUMN role DROP DEFAULT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='admin_users' AND column_name='organization_id') THEN
        ALTER TABLE admin_users ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ==========================================
-- UPDATE THERAPIST PROFILES
-- ==========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='therapist_profiles' AND column_name='organization_id') THEN
        ALTER TABLE therapist_profiles ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='therapist_profiles' AND column_name='organization_code') THEN
        ALTER TABLE therapist_profiles ADD COLUMN organization_code TEXT;
    END IF;
END $$;

-- ==========================================
-- UPDATE PATIENT PROFILES
-- ==========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='patient_profiles' AND column_name='organization_id') THEN
        ALTER TABLE patient_profiles ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Organizations Table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage all organizations" ON organizations;
CREATE POLICY "Super admins can manage all organizations"
    ON organizations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

DROP POLICY IF EXISTS "Org admins can view own organization" ON organizations;
CREATE POLICY "Org admins can view own organization"
    ON organizations FOR SELECT
    USING (
        id IN (
            SELECT organization_id FROM admin_users 
            WHERE user_id = auth.uid() AND role = 'org_admin'
        )
    );

DROP POLICY IF EXISTS "Therapists can view their organization" ON organizations;
CREATE POLICY "Therapists can view their organization"
    ON organizations FOR SELECT
    USING (
        id IN (
            SELECT organization_id FROM therapist_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Admin Users Table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;
CREATE POLICY "Super admins can manage admin users"
    ON admin_users FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

DROP POLICY IF EXISTS "Admins can view own profile" ON admin_users;
CREATE POLICY "Admins can view own profile"
    ON admin_users FOR SELECT
    USING (user_id = auth.uid());

-- Therapist Profiles - Additional Policies
DROP POLICY IF EXISTS "Org admins can view org therapists" ON therapist_profiles;
CREATE POLICY "Org admins can view org therapists"
    ON therapist_profiles FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM admin_users 
            WHERE user_id = auth.uid() AND role = 'org_admin'
        )
    );

DROP POLICY IF EXISTS "Super admins can view all therapists" ON therapist_profiles;
CREATE POLICY "Super admins can view all therapists"
    ON therapist_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

-- Patient Profiles - Additional Policies
DROP POLICY IF EXISTS "Org admins can view org patients" ON patient_profiles;
CREATE POLICY "Org admins can view org patients"
    ON patient_profiles FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM admin_users 
            WHERE user_id = auth.uid() AND role = 'org_admin'
        )
    );

DROP POLICY IF EXISTS "Super admins can view all patients" ON patient_profiles;
CREATE POLICY "Super admins can view all patients"
    ON patient_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

-- ==========================================
-- TRIGGERS
-- ==========================================

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_organizations_code ON organizations(organization_code);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_org_id ON admin_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_therapist_profiles_org_id ON therapist_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_org_id ON patient_profiles(organization_id);

-- ==========================================
-- SEED DATA
-- ==========================================

INSERT INTO organizations (name, organization_code, type, location, contact_email, is_active)
VALUES 
    ('Korle Bu Teaching Hospital', 'GH-KATH-2024', 'hospital', 'Accra, Ghana', 'admin@kbth.gov.gh', true),
    ('Ridge Hospital', 'GH-RIDGE-2024', 'hospital', 'Accra, Ghana', 'info@ridgehospital.gov.gh', true),
    ('Tema General Hospital', 'GH-TEMA-2024', 'hospital', 'Tema, Ghana', 'contact@tgh.gov.gh', true)
ON CONFLICT (organization_code) DO NOTHING;
