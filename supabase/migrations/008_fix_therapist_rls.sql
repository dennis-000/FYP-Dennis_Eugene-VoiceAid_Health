-- Fix RLS policies for therapist_profiles to allow profile creation during signup

-- Drop existing policies
DROP POLICY IF EXISTS "Therapists can view own profile" ON therapist_profiles;
DROP POLICY IF EXISTS "Therapists can update own profile" ON therapist_profiles;
DROP POLICY IF EXISTS "Super admins can view all therapists" ON therapist_profiles;
DROP POLICY IF EXISTS "Org admins can view org therapists" ON therapist_profiles;

-- Allow authenticated users to create their own therapist profile (for signup)
CREATE POLICY "Users can create own therapist profile"
    ON therapist_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow therapists to view their own profile
CREATE POLICY "Therapists can view own profile"
    ON therapist_profiles FOR SELECT
    USING (auth.uid() = user_id);

-- Allow therapists to update their own profile
CREATE POLICY "Therapists can update own profile"
    ON therapist_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Super admins can view all therapist profiles
CREATE POLICY "Super admins can view all therapists"
    ON therapist_profiles FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM admin_users WHERE role = 'super_admin'
        )
    );

-- Verify the policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'therapist_profiles';
