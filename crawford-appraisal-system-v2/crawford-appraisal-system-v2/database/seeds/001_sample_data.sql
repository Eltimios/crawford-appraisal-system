-- ============================================================
-- SEED DATA FOR DEVELOPMENT AND TESTING
-- Crawford University Staff Appraisal System
-- ============================================================

-- Sample Departments
INSERT INTO departments (name, college) VALUES
  ('Computer Science', 'College of Natural and Applied Sciences'),
  ('Accounting', 'College of Management Sciences'),
  ('English', 'College of Humanities'),
  ('Biology', 'College of Natural and Applied Sciences'),
  ('Law', 'College of Law');

-- Sample Appraisal Deadline
INSERT INTO appraisal_deadlines (
  appraisal_year,
  staff_submission_deadline,
  hod_assessment_deadline,
  college_board_review_deadline,
  apc_review_deadline,
  promotion_effective_date,
  is_active
) VALUES (
  '2025/2026',
  '2026-03-31',
  '2026-04-30',
  '2026-05-31',
  '2026-07-31',
  '2026-10-01',
  TRUE
);

-- NOTE: Sample users are created via Supabase Auth
-- User records are inserted after auth signup via trigger
-- See backend/src/services/authService.js for user creation flow
