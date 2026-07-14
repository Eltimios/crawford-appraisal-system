-- =============================================================================
-- Migration 003 — System Settings table for cycle control
-- Crawford University Staff Appraisal System
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- =============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed defaults — cycle is CLOSED until admin explicitly opens it
INSERT INTO system_settings (key, value) VALUES
  ('cycle_open',              'false'),
  ('current_appraisal_year',  '2025/2026')
ON CONFLICT (key) DO NOTHING;

-- Verify
SELECT key, value FROM system_settings;
