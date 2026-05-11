-- Remove dummy/seed data from organizations table
-- Run this in Supabase SQL Editor to clean up test data

-- Delete the sample organizations
DELETE FROM organizations 
WHERE organization_code IN ('GH-KATH-2024', 'GH-RIDGE-2024', 'GH-TEMA-2024');

-- Verify deletion
SELECT * FROM organizations;

-- You should see an empty table now, ready for real data!
