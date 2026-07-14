-- ============================================================
-- Crawford University Appraisal System — Standalone Postgres Schema
-- ============================================================
-- Consolidated schema for a self-hosted Postgres instance (cPanel).
-- Reconciles database/migrations/001_initial_schema.sql with the
-- 6 incremental backend/migrations/*.sql files AND the 3 tables that
-- existed live in Supabase but had no committed migration
-- (promotions, meeting_minutes, external_assessors) — verified
-- directly against the live Supabase schema via the Table Editor's
-- "Definition" view.
--
-- Differences from the Supabase-era schema (intentional):
--   1. No DB-side UUID defaults (no gen_random_uuid() / uuid_generate_v4()).
--      IDs are generated app-side (Node `uuid` package) on every insert —
--      avoids any dependency on Postgres extension permissions on shared
--      hosting. Every INSERT in the backend MUST set `id` explicitly.
--   2. No Row Level Security policies — the backend exclusively queries
--      via a privileged connection (no per-user DB roles), so RLS was
--      already dead weight under Supabase too.
--   3. No `auth.users` trigger — that depended on Supabase Auth's internal
--      schema. Replaced by `users.password_hash`, populated directly by
--      the backend's own auth logic.
--   4. No TABLESPACE clauses — Supabase-specific, not portable.
-- ============================================================

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
  id uuid NOT NULL,
  email character varying(255) NOT NULL,
  full_name character varying(255) NOT NULL,
  password_hash text NOT NULL,
  staff_id character varying(100) NULL,
  role character varying(50) NOT NULL,
  staff_category character varying(50) NULL,
  department character varying(255) NULL,
  college character varying(255) NULL,
  current_rank character varying(100) NULL,
  salary_grade character varying(50) NULL,
  date_of_first_appointment date NULL,
  date_of_last_promotion date NULL,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  reporting_officer_id uuid NULL,
  sex character varying(10) NULL,
  date_of_birth date NULL,
  state_of_origin character varying(100) NULL,
  qualification character varying(255) NULL,
  employment_status character varying(50) NULL,
  confirmation_date date NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email),
  CONSTRAINT users_staff_id_key UNIQUE (staff_id),
  CONSTRAINT users_reporting_officer_id_fkey FOREIGN KEY (reporting_officer_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT users_role_check CHECK (
    (role)::text = ANY (ARRAY[
      'staff', 'hod', 'hou', 'reporting_officer', 'dean', 'vc',
      'registry', 'hr_personnel', 'a&pc', 'apc_academic', 'apc_junior',
      'apc_senior', 'college_board', 'council', 'admin'
    ]::text[])
  ),
  CONSTRAINT users_staff_category_check CHECK (
    (staff_category)::text = ANY (ARRAY[
      'academic', 'junior_nonteaching', 'senior_nonteaching'
    ]::text[])
  )
);

CREATE INDEX idx_users_role ON public.users USING btree (role);
CREATE INDEX idx_users_department ON public.users USING btree (department);
CREATE INDEX idx_users_reporting_officer ON public.users USING btree (reporting_officer_id);

-- ============================================================
-- 2. DEPARTMENTS
-- ============================================================
CREATE TABLE departments (
  id uuid NOT NULL,
  name character varying(255) NOT NULL,
  college character varying(255) NOT NULL,
  hod_id uuid NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT departments_pkey PRIMARY KEY (id),
  CONSTRAINT departments_hod_id_fkey FOREIGN KEY (hod_id) REFERENCES users (id)
);

-- ============================================================
-- 3. APPRAISALS
-- ============================================================
CREATE TABLE appraisals (
  id uuid NOT NULL,
  staff_id uuid NOT NULL,
  appraisal_year character varying(10) NOT NULL,
  staff_category character varying(50) NOT NULL,
  status character varying(50) NOT NULL DEFAULT 'draft',
  part1_data jsonb NULL,
  part1_locked boolean NULL DEFAULT false,
  part1_submitted_at timestamp with time zone NULL,
  hod_id uuid NULL,
  hod_grades jsonb NULL,
  hod_recommendation text NULL,
  hod_assessed_at timestamp with time zone NULL,
  college_board_reviewed_by uuid NULL,
  college_board_status character varying(50) NULL,
  college_board_notes text NULL,
  college_board_reviewed_at timestamp with time zone NULL,
  staff_action character varying(20) NULL,
  staff_counter_comment text NULL,
  staff_action_at timestamp with time zone NULL,
  dean_id uuid NULL,
  dean_resolution text NULL,
  dean_resolved_at timestamp with time zone NULL,
  apc_decision jsonb NULL,
  apc_decided_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  registry_validated boolean NULL DEFAULT false,
  registry_validated_by uuid NULL,
  registry_validated_at timestamp with time zone NULL,
  registry_remarks text NULL,
  registry_summary text NULL,
  registry_recommended_action text NULL,
  council_decision jsonb NULL,
  pfq_established boolean NULL DEFAULT false,
  pfq_established_at timestamp with time zone NULL,
  pfq_established_by uuid NULL,
  interview_completed boolean NULL DEFAULT false,
  interview_completed_at timestamp with time zone NULL,
  interview_notes text NULL,
  college_board_recommendation text NULL,
  CONSTRAINT appraisals_pkey PRIMARY KEY (id),
  CONSTRAINT appraisals_staff_id_appraisal_year_key UNIQUE (staff_id, appraisal_year),
  CONSTRAINT appraisals_hod_id_fkey FOREIGN KEY (hod_id) REFERENCES users (id),
  CONSTRAINT appraisals_pfq_established_by_fkey FOREIGN KEY (pfq_established_by) REFERENCES users (id),
  CONSTRAINT appraisals_registry_validated_by_fkey FOREIGN KEY (registry_validated_by) REFERENCES users (id),
  CONSTRAINT appraisals_college_board_reviewed_by_fkey FOREIGN KEY (college_board_reviewed_by) REFERENCES users (id),
  CONSTRAINT appraisals_dean_id_fkey FOREIGN KEY (dean_id) REFERENCES users (id),
  CONSTRAINT appraisals_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT appraisals_staff_category_check CHECK (
    (staff_category)::text = ANY (ARRAY['academic', 'junior_nonteaching', 'senior_nonteaching']::text[])
  ),
  CONSTRAINT appraisals_college_board_status_check CHECK (
    (college_board_status)::text = ANY (ARRAY['pending', 'approved', 'reviewed']::text[])
  ),
  CONSTRAINT appraisals_status_check CHECK (
    (status)::text = ANY (ARRAY[
      'draft', 'submitted', 'hod_assessed', 'reporting_officer_assessed',
      'registry_validated', 'college_board_reviewing', 'college_board_approved',
      'college_board_reviewed', 'staff_viewed', 'dispute_raised', 'disputed',
      'dean_resolved', 'hr_received', 'apc_recommended', 'pending_council',
      'council_approved', 'council_rejected', 'completed'
    ]::text[])
  ),
  CONSTRAINT appraisals_staff_action_check CHECK (
    (staff_action)::text = ANY (ARRAY['validated', 'disputed']::text[])
  )
);

CREATE INDEX idx_appraisals_staff_id ON public.appraisals USING btree (staff_id);
CREATE INDEX idx_appraisals_status ON public.appraisals USING btree (status);
CREATE INDEX idx_appraisals_year ON public.appraisals USING btree (appraisal_year);

-- ============================================================
-- 4. PUBLICATIONS
-- ============================================================
CREATE TABLE publications (
  id uuid NOT NULL,
  staff_id uuid NOT NULL,
  title character varying(500) NOT NULL,
  publication_type character varying(100) NOT NULL,
  journal_name character varying(255) NULL,
  publisher character varying(255) NULL,
  year_of_publication integer NULL,
  authorship_position character varying(20) NULL,
  is_international boolean NULL DEFAULT false,
  is_predatory boolean NULL DEFAULT false,
  isbn_issn character varying(100) NULL,
  doi character varying(255) NULL,
  file_url text NULL,
  file_name character varying(255) NULL,
  file_size integer NULL,
  is_acceptance_letter boolean NULL DEFAULT false,
  acceptance_letter_date date NULL,
  available_score numeric(5, 2) NULL,
  points_scored numeric(5, 2) NULL,
  status character varying(50) NULL DEFAULT 'active',
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT publications_pkey PRIMARY KEY (id),
  CONSTRAINT publications_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT publications_authorship_position_check CHECK (
    (authorship_position)::text = ANY (ARRAY['sole', 'lead', 'co_author']::text[])
  ),
  CONSTRAINT publications_publication_type_check CHECK (
    (publication_type)::text = ANY (ARRAY[
      'journal_article', 'refereed_book', 'edited_book', 'chapter_in_book',
      'conference_proceedings', 'conference_paper', 'review_editorship',
      'technical_report', 'monograph'
    ]::text[])
  ),
  CONSTRAINT publications_status_check CHECK (
    (status)::text = ANY (ARRAY['active', 'rejected', 'under_review']::text[])
  )
);

CREATE INDEX idx_publications_staff_id ON public.publications USING btree (staff_id);

-- ============================================================
-- 5. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  type character varying(100) NOT NULL,
  title character varying(255) NOT NULL,
  message text NOT NULL,
  is_read boolean NULL DEFAULT false,
  read_at timestamp with time zone NULL,
  related_appraisal_id uuid NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_related_appraisal_id_fkey FOREIGN KEY (related_appraisal_id) REFERENCES appraisals (id) ON DELETE CASCADE,
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);

-- ============================================================
-- 6. PROMOTIONS
-- ============================================================
CREATE TABLE promotions (
  id uuid NOT NULL,
  appraisal_id uuid NULL,
  recommendation text NULL,
  notes text NULL,
  recommended_by uuid NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  council_status character varying(50) NULL DEFAULT 'pending',
  council_decision_date timestamp with time zone NULL,
  council_decision_by uuid NULL,
  council_remarks text NULL,
  CONSTRAINT promotions_pkey PRIMARY KEY (id),
  CONSTRAINT promotions_appraisal_id_fkey FOREIGN KEY (appraisal_id) REFERENCES appraisals (id) ON DELETE CASCADE,
  CONSTRAINT promotions_council_decision_by_fkey FOREIGN KEY (council_decision_by) REFERENCES users (id),
  CONSTRAINT promotions_recommended_by_fkey FOREIGN KEY (recommended_by) REFERENCES users (id),
  CONSTRAINT promotions_council_status_check CHECK (
    (council_status)::text = ANY (ARRAY['pending', 'approved', 'rejected']::text[])
  )
);

-- ============================================================
-- 7. EXTERNAL ASSESSORS
-- ============================================================
CREATE TABLE external_assessors (
  id uuid NOT NULL,
  appraisal_id uuid NOT NULL,
  stage text NOT NULL DEFAULT 'initial',
  name text NOT NULL,
  email text NULL,
  institution text NOT NULL,
  assessor_type text NOT NULL,
  scope text NULL,
  outcome text NOT NULL DEFAULT 'pending',
  report_date date NULL,
  report_notes text NULL,
  assigned_by uuid NULL,
  selected_by_vc boolean NOT NULL DEFAULT false,
  vc_selected_by uuid NULL,
  vc_selected_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  report_grades jsonb NULL,
  report_file_url text NULL,
  report_file_name text NULL,
  CONSTRAINT external_assessors_pkey PRIMARY KEY (id),
  CONSTRAINT external_assessors_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES users (id),
  CONSTRAINT external_assessors_vc_selected_by_fkey FOREIGN KEY (vc_selected_by) REFERENCES users (id),
  CONSTRAINT external_assessors_appraisal_id_fkey FOREIGN KEY (appraisal_id) REFERENCES appraisals (id) ON DELETE CASCADE,
  CONSTRAINT external_assessors_assessor_type_check CHECK (
    assessor_type = ANY (ARRAY['internal', 'external']::text[])
  ),
  CONSTRAINT external_assessors_scope_check CHECK (
    scope = ANY (ARRAY['national', 'international']::text[])
  ),
  CONSTRAINT external_assessors_stage_check CHECK (
    stage = ANY (ARRAY['initial', 'final']::text[])
  ),
  CONSTRAINT external_assessors_outcome_check CHECK (
    outcome = ANY (ARRAY['pending', 'positive', 'negative']::text[])
  )
);

CREATE INDEX idx_external_assessors_appraisal ON public.external_assessors USING btree (appraisal_id);

-- ============================================================
-- 8. MEETING MINUTES
-- ============================================================
CREATE TABLE meeting_minutes (
  id uuid NOT NULL,
  meeting_type text NOT NULL,
  appraisal_year integer NOT NULL,
  meeting_date date NOT NULL,
  meeting_number integer NOT NULL,
  uploaded_by uuid NOT NULL,
  pdf_url text NOT NULL,
  pdf_filename text NOT NULL,
  pdf_size bigint NULL,
  extracted_entries jsonb NOT NULL DEFAULT '[]'::jsonb,
  discrepancies jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active',
  notes text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT meeting_minutes_pkey PRIMARY KEY (id),
  CONSTRAINT meeting_minutes_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES users (id),
  CONSTRAINT meeting_minutes_meeting_type_check CHECK (
    meeting_type = ANY (ARRAY['college_board', 'apc', 'council']::text[])
  ),
  CONSTRAINT meeting_minutes_status_check CHECK (
    status = ANY (ARRAY['active', 'superseded']::text[])
  )
);

CREATE INDEX idx_meeting_minutes_type_year ON public.meeting_minutes USING btree (meeting_type, appraisal_year);
CREATE INDEX idx_meeting_minutes_uploaded_by ON public.meeting_minutes USING btree (uploaded_by);

-- ============================================================
-- 9. AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id uuid NOT NULL,
  user_id uuid NULL,
  action character varying(255) NOT NULL,
  entity_type character varying(100) NULL,
  entity_id uuid NULL,
  old_data jsonb NULL,
  new_data jsonb NULL,
  ip_address character varying(50) NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);

-- ============================================================
-- 10. APPRAISAL DEADLINES
-- ============================================================
CREATE TABLE appraisal_deadlines (
  id uuid NOT NULL,
  appraisal_year character varying(10) NOT NULL,
  staff_submission_deadline date NOT NULL,
  hod_assessment_deadline date NOT NULL,
  college_board_review_deadline date NOT NULL,
  apc_review_deadline date NOT NULL,
  promotion_effective_date date NULL,
  is_active boolean NULL DEFAULT true,
  created_by uuid NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT appraisal_deadlines_pkey PRIMARY KEY (id),
  CONSTRAINT appraisal_deadlines_appraisal_year_key UNIQUE (appraisal_year),
  CONSTRAINT appraisal_deadlines_created_by_fkey FOREIGN KEY (created_by) REFERENCES users (id)
);

-- ============================================================
-- 11. SYSTEM SETTINGS
-- ============================================================
CREATE TABLE system_settings (
  key text NOT NULL,
  value text NOT NULL,
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT system_settings_pkey PRIMARY KEY (key)
);

INSERT INTO system_settings (key, value) VALUES
  ('current_appraisal_year', '2025/2026'),
  ('cycle_open', 'false')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- updated_at auto-touch trigger (portable, not Supabase-specific)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
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
