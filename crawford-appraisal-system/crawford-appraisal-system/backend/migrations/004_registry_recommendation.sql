-- =============================================================================
-- Migration 004 — Registry recommendation fields
-- Crawford University Staff Appraisal System
-- Run in Supabase SQL Editor
-- =============================================================================

ALTER TABLE appraisals
  ADD COLUMN IF NOT EXISTS registry_summary           TEXT,
  ADD COLUMN IF NOT EXISTS registry_recommended_action TEXT;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'appraisals'
  AND column_name IN ('registry_summary', 'registry_recommended_action', 'registry_remarks');
