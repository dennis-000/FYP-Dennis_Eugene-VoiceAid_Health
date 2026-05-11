-- Fix RLS policies for admin_users table to allow authenticated users to check their own admin status

-- First, let's make sure the admin_users table has RLS enabled
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can view own profile" ON admin_users;
DROP POLICY IF EXISTS "Users can check their own admin status" ON admin_users;
DROP POLICY IF EXISTS "Org admins can view org therapists" ON admin_users;
DROP POLICY IF EXISTS "Super admins can view all therapists" ON admin_users;

-- Simple policy: Allow authenticated users to read their own admin record
-- This is needed for login to work
CREATE POLICY "Users can read own admin record"
    ON admin_users FOR SELECT
    USING (auth.uid() = user_id);

-- Allow authenticated users to insert/update/delete their own record
-- (Super admins will be managed via direct SQL or service role)
CREATE POLICY "Users can manage own admin record"
    ON admin_users FOR ALL
    USING (auth.uid() = user_id);

-- Verify the policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'admin_users';

