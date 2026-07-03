-- =============================================================================
-- Migration 005 — Split A&PC into 3 specialised roles
-- Crawford University Staff Appraisal System
-- Run in Supabase SQL Editor
-- =============================================================================

-- Expand the role CHECK constraint to include the 3 new APC roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN (
  'staff',
  'hod',
  'hou',
  'reporting_officer',
  'dean',
  'vc',
  'registry',
  'hr_personnel',
  'college_board',
  'a&pc',          -- legacy / super-APC (keep for backward compat)
  'apc_academic',  -- NEW: APC for Academic / Teaching staff
  'apc_junior',    -- NEW: APC for Junior Non-Teaching staff
  'apc_senior',    -- NEW: APC for Senior Non-Teaching staff
  'admin'
));

-- Verify
SELECT constraint_name FROM information_schema.table_constraints
WHERE table_name = 'users' AND constraint_name = 'users_role_check';
