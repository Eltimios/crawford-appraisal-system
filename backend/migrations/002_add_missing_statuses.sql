-- =============================================================================
-- Migration 002 — Add missing appraisal status values
-- Crawford University Staff Appraisal System
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- =============================================================================

-- Drop the current status constraint and re-add with all required values
ALTER TABLE appraisals
  DROP CONSTRAINT IF EXISTS appraisals_status_check;

ALTER TABLE appraisals
  ADD CONSTRAINT appraisals_status_check
  CHECK (status IN (
    -- Core workflow
    'draft',
    'submitted',

    -- Assessment statuses
    'hod_assessed',
    'reporting_officer_assessed',
    'registry_validated',

    -- Legacy college board (backward compat)
    'college_board_reviewing',
    'college_board_approved',

    -- Dean college board review (new)
    'college_board_reviewed',

    -- Staff response
    'staff_viewed',
    'dispute_raised',
    'disputed',               -- legacy backward compat

    -- Resolution
    'dean_resolved',

    -- End states
    'hr_received',
    'apc_recommended',
    'pending_council',
    'council_approved',
    'council_rejected',
    'completed'
  ));

-- Verify
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'appraisals_status_check';
