-- Migration 006: Add missing staff profile columns
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS sex                 VARCHAR(10),
  ADD COLUMN IF NOT EXISTS date_of_birth       DATE,
  ADD COLUMN IF NOT EXISTS state_of_origin     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS qualification       VARCHAR(255),
  ADD COLUMN IF NOT EXISTS employment_status   VARCHAR(50),
  ADD COLUMN IF NOT EXISTS confirmation_date   DATE;
