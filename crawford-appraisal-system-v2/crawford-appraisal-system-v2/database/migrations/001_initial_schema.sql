-- ============================================================
-- CRAWFORD UNIVERSITY STAFF APPRAISAL MANAGEMENT SYSTEM
-- PostgreSQL Database Schema (Supabase)
-- Version 1.0
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  staff_id VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN (
    'staff', 'hod', 'hou', 'dean', 'college_board', 'apc', 'admin'
  )),
  staff_category VARCHAR(50) CHECK (staff_category IN (
    'academic', 'junior_nonteaching', 'senior_nonteaching'
  )),
  department VARCHAR(255),
  college VARCHAR(255),
  current_rank VARCHAR(100),
  salary_grade VARCHAR(50),
  date_of_first_appointment DATE,
  date_of_last_promotion DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. DEPARTMENTS TABLE
-- ============================================================
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  college VARCHAR(255) NOT NULL,
  hod_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. APPRAISAL FORMS TABLE
-- ============================================================
CREATE TABLE appraisals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appraisal_year VARCHAR(10) NOT NULL,
  staff_category VARCHAR(50) NOT NULL CHECK (staff_category IN (
    'academic', 'junior_nonteaching', 'senior_nonteaching'
  )),
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'submitted',
    'hod_assessed',
    'college_board_reviewing',
    'college_board_approved',
    'staff_viewed',
    'disputed',
    'dean_resolved',
    'completed'
  )),

  -- Part 1: Personal & Professional Details (filled by staff)
  part1_data JSONB,
  part1_locked BOOLEAN DEFAULT FALSE,
  part1_submitted_at TIMESTAMP WITH TIME ZONE,

  -- Part 2: HOD/HOU Assessment
  hod_id UUID REFERENCES users(id),
  hod_grades JSONB,
  hod_recommendation TEXT,
  hod_assessed_at TIMESTAMP WITH TIME ZONE,

  -- College Board Review (Academic Staff Only)
  college_board_reviewed_by UUID REFERENCES users(id),
  college_board_status VARCHAR(50) CHECK (college_board_status IN (
    'pending', 'approved', 'flagged'
  )),
  college_board_notes TEXT,
  college_board_reviewed_at TIMESTAMP WITH TIME ZONE,

  -- Staff Validation / Dispute
  staff_action VARCHAR(20) CHECK (staff_action IN ('validated', 'disputed')),
  staff_counter_comment TEXT,
  staff_action_at TIMESTAMP WITH TIME ZONE,

  -- Dean Resolution (for disputes)
  dean_id UUID REFERENCES users(id),
  dean_resolution TEXT,
  dean_resolved_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one appraisal per staff per year
  UNIQUE(staff_id, appraisal_year)
);

-- ============================================================
-- 4. PUBLICATIONS TABLE (Academic Staff Only)
-- ============================================================
CREATE TABLE publications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  publication_type VARCHAR(100) NOT NULL CHECK (publication_type IN (
    'journal_article',
    'refereed_book',
    'edited_book',
    'chapter_in_book',
    'conference_proceedings',
    'conference_paper',
    'review_editorship',
    'technical_report',
    'monograph'
  )),
  journal_name VARCHAR(255),
  publisher VARCHAR(255),
  year_of_publication INTEGER,
  authorship_position VARCHAR(20) CHECK (authorship_position IN (
    'sole', 'lead', 'co_author'
  )),
  is_international BOOLEAN DEFAULT FALSE,
  is_predatory BOOLEAN DEFAULT FALSE,
  isbn_issn VARCHAR(100),
  doi VARCHAR(255),

  -- File upload (stored in Supabase Storage)
  file_url TEXT,
  file_name VARCHAR(255),
  file_size INTEGER,

  -- Acceptance letter details
  is_acceptance_letter BOOLEAN DEFAULT FALSE,
  acceptance_letter_date DATE,

  -- Calculated points
  available_score DECIMAL(5,2),
  points_scored DECIMAL(5,2),

  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'rejected', 'under_review')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 5. PROMOTION TRACKING TABLE
-- ============================================================
CREATE TABLE promotion_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  appraisal_year VARCHAR(10) NOT NULL,

  -- Academic Staff Scores
  publication_points DECIMAL(5,2) DEFAULT 0,
  teaching_quality_score DECIMAL(5,2) DEFAULT 0,
  teaching_load_score DECIMAL(5,2) DEFAULT 0,
  teaching_length_score DECIMAL(5,2) DEFAULT 0,
  research_score DECIMAL(5,2) DEFAULT 0,
  supervision_score DECIMAL(5,2) DEFAULT 0,
  qualification_score DECIMAL(5,2) DEFAULT 0,
  community_service_score DECIMAL(5,2) DEFAULT 0,
  professional_body_score DECIMAL(5,2) DEFAULT 0,
  admin_responsibilities_score DECIMAL(5,2) DEFAULT 0,
  total_score DECIMAL(5,2) DEFAULT 0,
  aper_percentage DECIMAL(5,2) DEFAULT 0,

  -- Eligibility Flags
  is_eligible_for_promotion BOOLEAN DEFAULT FALSE,
  is_eligible_for_increment BOOLEAN DEFAULT FALSE,
  years_in_current_rank INTEGER DEFAULT 0,
  meets_minimum_score BOOLEAN DEFAULT FALSE,
  meets_publication_requirement BOOLEAN DEFAULT FALSE,
  meets_waiting_period BOOLEAN DEFAULT FALSE,

  -- A&PC Decision
  apc_decision VARCHAR(50) CHECK (apc_decision IN (
    'promote', 'increment', 'both', 'defer', 'reject', 'pending'
  )) DEFAULT 'pending',
  apc_decided_by UUID REFERENCES users(id),
  apc_decision_notes TEXT,
  apc_decided_at TIMESTAMP WITH TIME ZONE,

  -- Promotion Details
  promoted_to_rank VARCHAR(100),
  promotion_effective_date DATE,
  promotion_letter_url TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(staff_id, appraisal_year)
);

-- ============================================================
-- 6. SUPERVISION TABLE (Academic Staff)
-- ============================================================
CREATE TABLE supervision (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_name VARCHAR(255),
  student_level VARCHAR(50) CHECK (student_level IN (
    'undergraduate', 'pgd', 'masters', 'phd'
  )),
  thesis_title VARCHAR(500),
  year INTEGER,
  points_awarded DECIMAL(4,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 7. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL CHECK (type IN (
    'deadline_reminder',
    'appraisal_submitted',
    'hod_assessment_complete',
    'college_board_approved',
    'college_board_flagged',
    'dispute_submitted',
    'dispute_resolved',
    'promotion_eligible',
    'promotion_decision',
    'increment_decision',
    'system_announcement'
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_appraisal_id UUID REFERENCES appraisals(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 8. APPRAISAL DEADLINES TABLE
-- ============================================================
CREATE TABLE appraisal_deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appraisal_year VARCHAR(10) NOT NULL,
  staff_submission_deadline DATE NOT NULL,
  hod_assessment_deadline DATE NOT NULL,
  college_board_review_deadline DATE NOT NULL,
  apc_review_deadline DATE NOT NULL,
  promotion_effective_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 9. AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX idx_appraisals_staff_id ON appraisals(staff_id);
CREATE INDEX idx_appraisals_status ON appraisals(status);
CREATE INDEX idx_appraisals_year ON appraisals(appraisal_year);
CREATE INDEX idx_publications_staff_id ON publications(staff_id);
CREATE INDEX idx_promotion_tracking_staff_id ON promotion_tracking(staff_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraisals ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text);

-- Staff can only see their own appraisals
CREATE POLICY "Staff can view own appraisals"
  ON appraisals FOR SELECT
  USING (auth.uid()::text = staff_id::text);

-- Staff can insert their own appraisals
CREATE POLICY "Staff can create own appraisals"
  ON appraisals FOR INSERT
  WITH CHECK (auth.uid()::text = staff_id::text);

-- Staff can update their own draft appraisals
CREATE POLICY "Staff can update own draft appraisals"
  ON appraisals FOR UPDATE
  USING (auth.uid()::text = staff_id::text AND status = 'draft');

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- ============================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appraisals_updated_at
  BEFORE UPDATE ON appraisals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_publications_updated_at
  BEFORE UPDATE ON publications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotion_tracking_updated_at
  BEFORE UPDATE ON promotion_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PUBLICATION SCORING FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_publication_points(
  p_staff_id UUID,
  p_target_rank VARCHAR
)
RETURNS DECIMAL AS $$
DECLARE
  v_total_available DECIMAL := 0;
  v_total_scored DECIMAL := 0;
  v_pts DECIMAL := 0;
  v_pp DECIMAL := 0;
  v_c DECIMAL := 0;
BEGIN
  -- Get C value based on target rank
  CASE p_target_rank
    WHEN 'Senior Lecturer' THEN v_c := 45;
    WHEN 'Associate Professor' THEN v_c := 60;
    WHEN 'Professor' THEN v_c := 75;
    ELSE v_c := 40;
  END CASE;

  -- Sum all available scores (A) and points scored (B)
  SELECT
    COALESCE(SUM(available_score), 0),
    COALESCE(SUM(points_scored), 0)
  INTO v_total_available, v_total_scored
  FROM publications
  WHERE staff_id = p_staff_id
    AND status = 'active'
    AND is_predatory = FALSE;

  -- Calculate PTS = (B/A) * C
  IF v_total_available > 0 THEN
    v_pts := (v_total_scored / v_total_available) * v_c;
  END IF;

  -- Calculate PP = (PTS/C) * 40
  IF v_c > 0 THEN
    v_pp := (v_pts / v_c) * 40;
  END IF;

  RETURN ROUND(v_pp, 2);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PROMOTION ELIGIBILITY CHECK FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION check_promotion_eligibility(p_staff_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user users%ROWTYPE;
  v_years_in_rank INTEGER;
  v_result JSONB;
BEGIN
  SELECT * INTO v_user FROM users WHERE id = p_staff_id;

  -- Calculate years in current rank
  v_years_in_rank := EXTRACT(YEAR FROM AGE(NOW(), COALESCE(
    v_user.date_of_last_promotion,
    v_user.date_of_first_appointment
  )));

  v_result := jsonb_build_object(
    'staff_id', p_staff_id,
    'current_rank', v_user.current_rank,
    'years_in_rank', v_years_in_rank,
    'meets_waiting_period', v_years_in_rank >= 3,
    'eligible_for_accelerated', v_years_in_rank >= 2
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
