-- Fix RLS policies for organizations table to allow public read access for signup validation
-- This allows unauthenticated users to validate organization codes during signup

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Super admins can manage all organizations" ON organizations;
DROP POLICY IF EXISTS "Org admins can view own organization" ON organizations;
DROP POLICY IF EXISTS "Therapists can view their organization" ON organizations;

-- Allow anyone (including unauthenticated users) to read active organizations
-- This is needed for signup validation
CREATE POLICY "Anyone can view active organizations"
    ON organizations FOR SELECT
    USING (is_active = true);

-- Only authenticated super admins can manage organizations
CREATE POLICY "Super admins can manage organizations"
    ON organizations FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM admin_users WHERE role = 'super_admin'
        )
    );

-- Verify the policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'organizations';
