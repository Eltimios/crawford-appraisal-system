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

  -- APC Decision (stored as JSONB: { decision, notes, apc_id, decided_at })
  apc_decision JSONB,
  apc_decided_at TIMESTAMP WITH TIME ZONE,

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
-- 5. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  related_appraisal_id UUID REFERENCES appraisals(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 6. APPRAISAL DEADLINES TABLE
-- ============================================================
CREATE TABLE appraisal_deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appraisal_year VARCHAR(10) NOT NULL UNIQUE,
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
-- 7. AUDIT LOGS TABLE
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
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraisals ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Backend uses service role key — bypasses RLS entirely.
-- Frontend anon key only: users can see their own profile and notifications.
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Staff can view own appraisals"
  ON appraisals FOR SELECT
  USING (auth.uid() = staff_id);

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS — auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appraisals_updated_at
  BEFORE UPDATE ON appraisals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_publications_updated_at
  BEFORE UPDATE ON publications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SUPABASE AUTH HOOK — create users row on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, staff_id, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'staff_id', NEW.id::text),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
