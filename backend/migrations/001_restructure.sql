-- =============================================================================
-- Migration 001 — System Restructure
-- Crawford University Staff Appraisal System
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. USERS TABLE — Extend role enum to include new roles
-- -----------------------------------------------------------------------------

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN (
    'staff',
    'hod',
    'hou',
    'reporting_officer',   -- NEW: reviews non-teaching staff (reuses HOD portal)
    'dean',
    'college_board',
    'registry',            -- NEW: validates Reporting Officer work + resolves non-teaching disputes
    'hr_personnel',        -- NEW: printing, onboarding, nominal roll export
    'a&pc',
    'admin',
    'council_chairman'     -- FUTURE: final approval authority (placeholder)
  ));


-- -----------------------------------------------------------------------------
-- 2. USERS TABLE — Add reporting_officer_id for non-teaching staff assignment
-- -----------------------------------------------------------------------------

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reporting_officer_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_reporting_officer
  ON users(reporting_officer_id);


-- -----------------------------------------------------------------------------
-- 3. APPRAISALS TABLE — Extend status constraint
--    Legacy statuses are kept so existing data is not invalidated.
-- -----------------------------------------------------------------------------

ALTER TABLE appraisals
  DROP CONSTRAINT IF EXISTS appraisals_status_check;

ALTER TABLE appraisals
  ADD CONSTRAINT appraisals_status_check
  CHECK (status IN (
    -- Legacy statuses (kept for backwards compatibility)
    'draft',
    'submitted',
    'college_board_reviewing',
    'staff_viewed',
    'disputed',
    'dean_resolved',
    'completed',

    -- Active statuses (new workflow)
    'hod_assessed',
    'reporting_officer_assessed',
    'dispute_raised',
    'college_board_approved',
    'registry_validated',
    'hr_received',
    'apc_recommended',
    'pending_council',
    'council_approved',
    'council_rejected'
  ));


-- -----------------------------------------------------------------------------
-- 4. APPRAISALS TABLE — Registry validation columns
--    (Assessment data lives on appraisals, no separate assessments table)
-- -----------------------------------------------------------------------------

ALTER TABLE appraisals
  ADD COLUMN IF NOT EXISTS registry_validated       BOOLEAN   DEFAULT FALSE;

ALTER TABLE appraisals
  ADD COLUMN IF NOT EXISTS registry_validated_by    UUID      REFERENCES users(id);

ALTER TABLE appraisals
  ADD COLUMN IF NOT EXISTS registry_validated_at    TIMESTAMP WITH TIME ZONE;

ALTER TABLE appraisals
  ADD COLUMN IF NOT EXISTS registry_remarks         TEXT;


-- -----------------------------------------------------------------------------
-- 5. PROMOTIONS TABLE — Council approval fields
--    Safe: uses IF NOT EXISTS so re-running is harmless.
-- -----------------------------------------------------------------------------

ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS council_status       VARCHAR(50) DEFAULT 'pending'
    CHECK (council_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS council_decision_date  TIMESTAMP WITH TIME ZONE;

ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS council_decision_by    UUID REFERENCES users(id);

ALTER TABLE promotions
  ADD COLUMN IF NOT EXISTS council_remarks        TEXT;


-- -----------------------------------------------------------------------------
-- 6. PROMOTIONS TABLE — Rename 'decision' column to 'recommendation'
--    Only runs if the column is still named 'decision'.
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promotions' AND column_name = 'decision'
  ) THEN
    ALTER TABLE promotions RENAME COLUMN decision TO recommendation;
    RAISE NOTICE 'Renamed promotions.decision → promotions.recommendation';
  ELSE
    RAISE NOTICE 'promotions.decision not found — skipping rename (may already be renamed)';
  END IF;
END
$$;


-- -----------------------------------------------------------------------------
-- 7. Verify the changes
-- -----------------------------------------------------------------------------

SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('users', 'appraisals', 'promotions')
  AND column_name IN (
    'role', 'reporting_officer_id',
    'status', 'registry_validated', 'registry_validated_by', 'registry_validated_at', 'registry_remarks',
    'council_status', 'council_decision_date', 'council_decision_by', 'council_remarks', 'recommendation'
  )
ORDER BY table_name, column_name;
