# Crawford University Staff Appraisal Management System
## Full System Documentation
### Prepared by: Adebowale Precious | Final Year Project | Crawford University | 2025/2026

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [User Roles & Access Levels](#3-user-roles--access-levels)
4. [System Workflows](#4-system-workflows)
   - Academic Staff Promotion Workflow
   - Non-Teaching Staff Workflow
   - External Assessors Workflow (Professorial Promotions)
5. [Module-by-Module Breakdown](#5-module-by-module-breakdown)
6. [Role-by-Role Walkthrough](#6-role-by-role-walkthrough)
7. [Meeting Minutes System](#7-meeting-minutes-system)
8. [External Assessors System](#8-external-assessors-system)
9. [Security & Access Control](#9-security--access-control)
10. [Database Design Summary](#10-database-design-summary)

---

## 1. System Overview

The **Crawford University Staff Appraisal Management System** is a full-stack web application that digitises and automates the entire academic and non-teaching staff performance appraisal and promotion process at Crawford University.

### What Problem It Solves

Previously, appraisals at Crawford University were conducted through paper forms, manual file routing, and in-person committee reviews. This created:
- Lost or delayed forms
- No audit trail for decisions
- Difficulty tracking where an appraisal was in the process
- No centralised data for reports or analysis
- Time-consuming coordination between committees

### What the System Does

The system provides every stakeholder — from individual staff members to the University Council — with a dedicated, role-based portal. Each portal shows only what that role needs to see and enables the specific actions that role is authorised to take. The full appraisal cycle, from initial submission through Council decision, is tracked, notified, and documented digitally.

### Key Capabilities

| Capability | Description |
|---|---|
| Role-based portals | 13 distinct user roles, each with a tailored dashboard |
| Appraisal submission | Staff fill and submit their annual appraisal online |
| HOD / RO assessment | Assessors grade staff using structured scoring rubrics |
| Dispute resolution | Staff can formally dispute assessments; Deans resolve |
| College Board Review | Dean reviews and makes recommendations to A&PC |
| External Assessors | Two-stage assessor system for Senior Lecturer–Professor promotions |
| A&PC review | Committee reviews eligible staff and submits recommendations to Council |
| Council decision | University Council records final promotion/increment decisions |
| Meeting Minutes | Upload, parse, and cross-check committee meeting minutes |
| Publications tracking | Academic staff log publications; HODs review for promotion eligibility |
| Notifications | Real-time in-app notifications at every stage transition |
| Audit log | Every action in the system is logged with user, timestamp, and entity |
| Reports & Analytics | University-wide and college-level appraisal statistics |

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js (Create React App), React Router v6 |
| **Backend** | Node.js with Express.js |
| **Database** | PostgreSQL via Supabase (cloud-hosted) |
| **Authentication** | Supabase Auth (JWT-based, session tokens) |
| **File Storage** | Supabase Storage (private buckets, signed URLs) |
| **API** | RESTful JSON API, all routes authenticated |
| **Document Generation** | `docx` npm package (Word .docx templates) |
| **PDF Parsing** | `pdf-parse` npm package |
| **Security** | Helmet.js, CORS, rate limiting, role-based middleware |
| **Deployment** | Local / Node server (port 5000 backend, port 3000 frontend) |

---

## 3. User Roles & Access Levels

The system has **13 user roles**. Each role gets a completely separate dashboard and can only access data and actions relevant to their function.

### Role Hierarchy

```
Admin
  └── System-level management, user creation, audit logs

Vice Chancellor (VC)
  └── Assesses Deans; selects final external assessors for professorial promotions

Dean of College
  └── Conducts College Board Review; assigns external assessors; submits names to VC

Registry
  └── Validates staff appraisals before they reach A&PC

A&PC (Academic & Promotions Committee)
  ├── a&pc          → Full access (teaching + non-teaching)
  ├── apc_academic  → Teaching (academic) staff only
  ├── apc_junior    → Junior Non-Teaching staff only
  └── apc_senior    → Senior Non-Teaching staff only
  
University Council
  └── Records final promotion and increment decisions

HR Personnel
  └── Read-only access to all meeting minutes for HR record-keeping

Head of Department (HOD) / Head of Unit (HOU)
  └── Assesses academic staff in their department

Reporting Officer
  └── Assesses non-teaching staff assigned to them

Staff (Academic)
  └── Submits appraisal; views assessment; can raise disputes

Staff (Non-Teaching - Junior / Senior)
  └── Submits appraisal; views assessment
```

### Role Access Summary Table

| Role | Submit | Assess | Dispute | CB Review | Ext. Assessors | A&PC | Council | Minutes | Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Staff | ✓ | — | ✓ | — | — | — | — | — | — |
| HOD/HOU | ✓ (own) | ✓ | — | — | — | — | — | — | — |
| Reporting Officer | ✓ (own) | ✓ | — | — | — | — | — | — | — |
| Dean | ✓ (own) | ✓ (Deans) | Resolve | ✓ | ✓ | — | — | Upload | — |
| VC | ✓ (own) | ✓ (Deans) | — | — | Select Final | — | — | — | — |
| Registry | — | — | — | — | — | — | — | — | Validate |
| A&PC | — | — | — | — | PFQ/Interview | ✓ | — | Upload | — |
| Council | — | — | — | — | — | — | ✓ | Upload | — |
| HR | — | — | — | — | — | — | — | View | — |
| Admin | — | — | — | — | — | — | — | — | ✓ |

---

## 4. System Workflows

### 4.1 Academic Staff Promotion Workflow

This is the primary workflow for academic (teaching) staff. All six stages must complete in order.

```
STAGE 1: SUBMISSION
─────────────────────────────────────────────────────────────────────
Staff member logs in → fills Annual Performance Evaluation Report
(APER) form → submits before the deadline (Mar 31, 2026).

Status: draft → submitted


STAGE 2: HOD / HOU ASSESSMENT
─────────────────────────────────────────────────────────────────────
HOD receives notification → opens the staff member's appraisal
→ fills grading rubric (academic performance scores) → writes
recommendation (promote / increment / both / commend / no action)
→ submits assessment.

Status: submitted → hod_assessed


STAGE 3: STAFF REVIEW & DISPUTE (optional)
─────────────────────────────────────────────────────────────────────
Staff receives notification → views their assessment and scores
→ can add a comment (acknowledgement or dispute reason).

If staff disputes:
  Status: hod_assessed → dispute_raised
  Dean is notified → Dean reviews dispute → writes resolution
  Status: dispute_raised → dean_resolved

If no dispute:
  Status: hod_assessed → staff_viewed


STAGE 4: COLLEGE BOARD REVIEW (Dean)
─────────────────────────────────────────────────────────────────────
Dean sees all assessed appraisals in their review queue
→ reviews each staff member's appraisal, HOD grades, publications
→ writes College Board recommendation
  (promote / increment / both / commend / no action)
→ submits.

A&PC is automatically notified.

Status: staff_viewed / dean_resolved → college_board_reviewed


NOTE: For Lecturer I, Senior Lecturer, and Associate Professor
promotion candidates, the External Assessors process (Stage 4B)
runs in parallel or after this stage. See Section 4.3.


STAGE 5: A&PC REVIEW & RECOMMENDATION
─────────────────────────────────────────────────────────────────────
A&PC sees all eligible staff (those with status college_board_reviewed
and above, with no apc_decision yet).

A&PC reviews:
  - Appraisal details and scores
  - College Board recommendation
  - External assessor reports (if applicable)
  - Publications record

A&PC submits one of five recommendations:
  → Promoted
  → Increment
  → Both (Promotion + Increment)
  → Deferred
  → Not Eligible

Staff member is notified of the outcome.

Status: college_board_reviewed → apc_recommended


STAGE 6: COUNCIL DECISION
─────────────────────────────────────────────────────────────────────
University Council sees all A&PC-recommended appraisals
→ reviews each recommendation
→ records final decision:
  → Approved for Promotion
  → Approved for Increment
  → Approved (Both)
  → Not Approved
  → Deferred

Staff member is notified of Council's final decision.

Status: apc_recommended → council_decided / completed
```

---

### 4.2 Non-Teaching Staff Workflow

Non-teaching staff follow a shorter path (no College Board Review stage).

```
STAGE 1: SUBMISSION
─────────────────────────────────────────────────────────────────────
Staff submits appraisal form.
Status: draft → submitted


STAGE 2: REPORTING OFFICER ASSESSMENT
─────────────────────────────────────────────────────────────────────
Reporting Officer (not HOD) assesses the staff member.
Uses a different scoring rubric than academic staff.
Status: submitted → reporting_officer_assessed


STAGE 3: STAFF REVIEW
─────────────────────────────────────────────────────────────────────
Staff views their assessment.
Status: → staff_viewed


STAGE 4: A&PC REVIEW
─────────────────────────────────────────────────────────────────────
Split by sub-role:
  - apc_junior   → reviews Junior Non-Teaching staff
  - apc_senior   → reviews Senior Non-Teaching staff
Status: → apc_recommended


STAGE 5: COUNCIL DECISION
─────────────────────────────────────────────────────────────────────
Council records the final decision.
Status: → council_decided
```

---

### 4.3 External Assessors Workflow (Professorial Promotions)

This workflow applies only to academic staff at the following ranks seeking promotion:

| Current Rank | Promotion To | Assessment Type |
|---|---|---|
| Lecturer I | Senior Lecturer | Initial only (3 assessors) |
| Senior Lecturer | Associate Professor | 2-stage (initial + final) |
| Associate Professor | Professor | 2-stage (initial + final) |

#### Single-Stage (Lecturer I → Senior Lecturer)

```
1. Dean assigns 3 assessors to the candidate:
     → 1 External Assessor (from outside the university)
     → 2 Internal Assessors (from within the university)

2. Dean records each assessor's report outcome:
     → Positive / Negative / Pending
     (Report date and qualitative notes can be recorded)

3. If 2 or more of 3 reports are POSITIVE:
     → Candidate is eligible for A&PC recommendation
     → A&PC proceeds to review and recommend

4. A&PC submits recommendation → Council decides.
```

#### Two-Stage (Senior Lecturer → Associate Professor / Professor)

```
STAGE 1 — INITIAL ASSESSMENT (same as above)
─────────────────────────────────────────────────────────────────────
Dean assigns 3 assessors (1 external + 2 internal).
Dean records outcomes.

If 2+ positive → A&PC establishes PRIMA FACIE QUALIFICATION (PFQ).
  - System flags candidate as PFQ Established.
  - Dean receives a notification: "Submit 6 external assessor names."


STAGE 2 — FINAL EXTERNAL ASSESSMENT
─────────────────────────────────────────────────────────────────────
Dean submits 6 external assessor names to the VC:
  → 2 International assessors
  → 4 National assessors

VC logs in → sees the 6 names → selects 3:
  → 1 International
  → 2 National

System enforces these quotas automatically.

Dean records outcomes for the 3 VC-selected assessors.

If 2+ of the 3 final assessors return POSITIVE:
  → A&PC marks the Promotion Interview as completed.
  → A&PC submits recommendation to Council.
  → Council records final decision.
```

---

## 5. Module-by-Module Breakdown

### 5.1 Authentication Module

- All users log in with email + password via the login page (`/login`)
- Passwords are managed by Supabase Auth (bcrypt-hashed)
- On login, a JWT session token is issued and stored in the browser
- Every API request carries the token in the `Authorization: Bearer` header
- The backend middleware validates the token and attaches the user's role to every request
- If a token expires, the user is automatically redirected to login
- Admin creates all user accounts (staff cannot self-register)

### 5.2 Appraisal Submission Module

- Staff navigate to **My Appraisal** in the sidebar
- The form captures:
  - Personal and appointment details (pre-filled from profile)
  - Academic activities for the year
  - Self-assessment scores across five areas
  - Signature and declaration
- Staff can save as draft and return later
- After submission, the status locks to `submitted` and the form becomes read-only
- Staff see a live **Appraisal Timeline** on their home page showing exactly which stage their appraisal is at

### 5.3 Assessment Module (HOD / Reporting Officer)

**For HODs (Academic Staff):**
- HOD sees all staff in their department in the **Assess Staff** queue
- Scoring rubric covers: Teaching, Research, Community Service, Administration
- HOD selects a recommendation from a dropdown
- HOD can also view each staff member's publications before assessing

**For Reporting Officers (Non-Teaching):**
- Same flow but with a different rubric suited to non-teaching roles
- Reporting Officers only see staff assigned to them

### 5.4 Dispute Resolution Module

- If a staff member disagrees with their HOD assessment, they click **Raise Dispute** in their assessment view
- They write a dispute comment explaining the disagreement
- The Dean is notified
- Dean navigates to **Disputes** in their sidebar
- Dean reviews the original assessment AND the staff member's comment
- Dean writes a resolution note and resolves the dispute
- Staff is notified that their dispute has been resolved

### 5.5 College Board Review Module (Dean)

- Dean sees all assessed appraisals in their college in the **Review Queue**
- Dean can:
  - View each staff member's full appraisal
  - View HOD grades and comments
  - View the staff member's publications record
  - View any dispute history
- Dean selects a College Board recommendation and submits
- All A&PC members receive a notification
- Dean can also view **Approved** records (already reviewed submissions)

### 5.6 A&PC Review Module

- Three separate A&PC sub-portals prevent committee members from accidentally accessing out-of-scope staff:
  - `apc_academic` → Teaching staff only
  - `apc_junior` → Junior Non-Teaching only
  - `apc_senior` → Senior Non-Teaching only
  - `a&pc` (main role) → Full access to all categories

- Each portal shows a list of eligible staff with their:
  - Current rank and years in grade
  - HOD score and recommendation
  - College Board recommendation
  - External assessor summary (if applicable)

- A&PC member clicks a candidate → opens their detail page
- Reviews all evidence → selects a recommendation
  - Promoted / Increment / Both / Deferred / Not Eligible
- Submits — staff member is notified immediately

### 5.7 Council Decision Module

- Council portal shows all A&PC-recommended appraisals under **Pending Decisions**
- Council reviews each case and records one of:
  - Approved for Promotion
  - Approved for Increment
  - Approved (Both)
  - Not Approved
  - Deferred
- Approved records move to **Decision Records**
- Staff member is notified of the Council's final decision
- Council can also upload and manage their Meeting Minutes

### 5.8 Publications Module (Academic Staff)

- Academic staff can add, edit, and delete their publication records under **Publications**
- Each entry records: title, journal/conference, year, type (journal/conference/book chapter/book), and DOI
- HODs can view their department's staff publications in the **Staff Publications** section
- Dean can see publications for all academic staff in their college
- Publications are visible to A&PC when reviewing candidates for promotion

### 5.9 Notifications Module

- Every stage transition triggers an automated in-app notification
- The notification bell in the sidebar shows an unread count
- Users navigate to **Notifications** to view all notifications
- Notifications are role-scoped: A&PC members only receive notifications relevant to their committee category

Key notification triggers:
| Event | Notified |
|---|---|
| Staff submits appraisal | HOD / Reporting Officer |
| HOD submits assessment | Staff member |
| Staff views assessment | No notification (logged) |
| Dispute raised | Dean |
| Dispute resolved | Staff member |
| College Board review submitted | All A&PC members |
| PFQ established | Dean of relevant college |
| A&PC recommendation submitted | Staff member |
| Council decision recorded | Staff member |

### 5.10 Admin Module

- Admin creates and manages all user accounts
- Can set appraisal deadlines
- Can view full audit logs (every action, user, and timestamp)
- Can generate university-wide reports
- Admin does not participate in the appraisal workflow itself

---

## 6. Role-by-Role Walkthrough

### Staff Member

1. Log in at `/login` → redirected to `/staff`
2. See home page with appraisal status card, timeline, and last score
3. Navigate to **My Appraisal** → fill and submit the appraisal form
4. Navigate to **My Assessment** → view HOD scores once assessed
5. If unhappy, click **Raise Dispute** and write the reason
6. Track progress in the timeline (Submit → Assessment → View → CB Review → A&PC → Council)
7. Receive notifications at each stage
8. Academic staff also have **Publications** in the sidebar to manage their publication list

---

### HOD / HOU

1. Log in → redirected to `/hod`
2. Home page shows stats: pending assessments, disputes
3. Navigate to **Assess Staff** → see all staff in department
4. Click a staff member → view their appraisal → fill scoring rubric
5. Select recommendation → submit
6. Navigate to **Staff Publications** → view publications before scoring
7. Also has own appraisal functionality (`My Appraisal`, `My Assessment`)

---

### Reporting Officer

Same as HOD but for non-teaching staff. Portal at `/hod` (shared layout), visible staff are only those assigned to this reporting officer.

---

### Dean of College

1. Log in → redirected to `/dean`
2. Home page shows: total college staff, pending CB reviews, disputes
3. Navigate to **Review Queue** → see all assessed appraisals awaiting College Board review
4. Click a staff member → review appraisal details, HOD grades, publications, dispute history
5. Write College Board recommendation → submit
6. Navigate to **Disputes** → resolve any active disputes
7. Navigate to **External Assessors** → manage assessors for eligible promotion candidates
   - Add initial assessors (1 external + 2 internal)
   - Record their report outcomes
   - For professorial: submit 6 final external names after PFQ is established
8. Navigate to **Meeting Minutes** → upload College Board meeting minutes (Word template available to download)
9. Navigate to **College Overview** → see college-wide statistics
10. Also has own appraisal and assessment functionality

---

### Vice Chancellor

1. Log in → redirected to `/vc`
2. Navigate to **Assess Deans** → review and assess Deans who submitted appraisals
3. Navigate to **Final Assessor Selection** → see professorial candidates with PFQ established
   - View 6 external assessor names submitted by the Dean
   - Select 3 (enforced: exactly 1 international + 2 national)
4. Navigate to **University Overview** → see university-wide appraisal statistics across all colleges

---

### Registry

1. Log in → redirected to `/registry`
2. Navigate to **Pending Validation** → validate appraisals before they reach A&PC
3. Navigate to **Recommendations** → see all A&PC recommendations
4. Navigate to **Staff Overview** → full view of staff records
5. Navigate to **Assess Reporting Officers** → assess non-teaching Reporting Officers

---

### A&PC Member (Academic Sub-Role)

1. Log in → redirected to `/apc-academic`
2. Home page shows count of eligible academic staff pending review
3. Navigate to **Academic Staff** → see all eligible teaching staff
4. Click a candidate → open detail page showing:
   - Staff info, current rank, department
   - Assessment summary and HOD recommendation
   - External assessors section (if Lecturer I / Senior Lecturer / Associate Professor):
     - Initial assessor report outcomes
     - PFQ status with "Establish PFQ" button (if 2+ positive)
     - Final assessor outcomes and "Mark Interview Completed" button (if applicable)
   - A&PC Recommendation section → submit recommendation
5. Navigate to **Meeting Minutes** → upload and manage A&PC meeting minutes
6. Navigate to **Reports** → view promotion statistics

---

### University Council

1. Log in → redirected to `/council`
2. Navigate to **Pending Decisions** → see all A&PC-recommended appraisals
3. Click a staff member → review their full record and A&PC recommendation
4. Record Council decision (Approved / Not Approved / Deferred)
5. Navigate to **Decision Records** → see all past decisions
6. Navigate to **Meeting Minutes** → upload Council meeting minutes (full view: College Board + A&PC + Council minutes)

---

### HR Personnel

1. Log in → redirected to `/hr`
2. Navigate to **Meeting Minutes** → read-only access to all three types of minutes (College Board, A&PC, Council)
3. Used for HR record-keeping; HR cannot modify any appraisal data

---

### Admin

1. Log in → redirected to `/admin`
2. Navigate to **Manage Users** → create, view, edit user accounts and roles
3. Navigate to **Deadlines** → set appraisal submission deadline
4. Navigate to **Reports** → university-wide statistics
5. Navigate to **Audit Logs** → every action in the system with user, timestamp, entity
6. Navigate to **Settings** → system-wide configuration

---

## 7. Meeting Minutes System

### Purpose

The system digitises the management of official committee meeting minutes for three committee types:
- **College Board** (managed by Dean)
- **A&PC** (managed by A&PC committee)
- **Council** (managed by Council)

### How It Works

1. **Download Template**: Any authorised user can download a pre-formatted Word (.docx) template for their meeting type. The template includes the required header, signature fields, and a table formatted to hold staff records.

2. **Fill the Template**: The secretary fills in the Word document with staff appraisal decisions after the meeting. Each row in the table must follow the format:
   ```
   Staff ID | Full Name | Score% | Decision
   ```

3. **Upload the PDF**: The filled document is converted to PDF and uploaded through the system. Users provide the meeting date, meeting number, and appraisal year.

4. **Automatic Parsing**: The system uses `pdf-parse` to extract text from the uploaded PDF and identifies each staff record using a pipe-separated (`|`) pattern.

5. **Database Cross-Check**: Each extracted entry is checked against the live appraisal records in the database:
   - Does the Staff ID exist in the system?
   - Does the score in the minutes match the system score?
   - Does the decision in the minutes align with what the committee recorded in the system?

6. **Discrepancy Flagging**: Any mismatches are flagged as warnings (not errors). The Council has final say, so discrepancies are informational only.

7. **Viewing**: Uploaded minutes are listed in a table filtered by year. Each record shows upload date, meeting number, and status. Users can:
   - View extracted entries and discrepancy warnings in a details modal
   - Download the original PDF via a signed URL (1-hour expiry)

### Access by Role

| Role | Can Upload | Can View |
|---|:---:|:---:|
| Dean | College Board minutes | College Board minutes |
| A&PC (all sub-roles) | A&PC minutes | A&PC minutes |
| Council | Council minutes | All three types |
| HR Personnel | — | All three types |
| Admin | — | All three types |

---

## 8. External Assessors System

### Purpose

Implements the Crawford University promotion policy requiring external peer review for three promotion categories, as specified in the *CRU Steps and Processes for Academic Staff Promotion (March 2025)* guidelines.

### Which Candidates Are Affected

| Current Rank | Target Rank | Process |
|---|---|---|
| Lecturer I | Senior Lecturer | Single-stage (3 assessors) |
| Senior Lecturer | Associate Professor | Two-stage |
| Associate Professor | Professor | Two-stage |

### Assessment Composition

**Initial Stage:**
- 1 External Assessor (from outside the university)
- 2 Internal Assessors (from within the university)
- Minimum 2 of 3 positive reports required

**Final Stage (professorial only):**
- Dean submits 6 External Assessor names:
  - 2 International
  - 4 National
- VC selects 3 (1 international + 2 national)
- Minimum 2 of 3 selected assessors must return positive

### System Enforcement

The system enforces all composition rules automatically:
- Prevents adding a 2nd external assessor in the initial stage
- Prevents adding more than 2 internal assessors in the initial stage
- Prevents adding final stage assessors until PFQ is established
- Prevents VC from selecting more than 1 international or 2 national
- Prevents VC from selecting more than 3 total
- Prevents marking interview completed unless 2+ final positive reports exist

### Qualitative Rating Scale (per guidelines)

| Rating | Score Weight |
|---|---|
| Excellent | 100% |
| Very Good | 90% |
| Good | 70% |
| Fair | 50% |
| Poor | 30% |

### Minimum Requirements (per guidelines)

| Promotion To | Min. Publication Points | Min. Overall APER |
|---|---|---|
| Senior Lecturer | PP ≥ 22 | 55% |
| Associate Professor | PP ≥ 26 | 65% |
| Professor | PP ≥ 30 | 75% |

---

## 9. Security & Access Control

### Authentication

- All routes (except `/login`) require a valid JWT token
- Tokens are verified on every API request by the `authMiddleware`
- Expired or invalid tokens result in a 401 response and redirect to login

### Authorisation

- Every API endpoint uses an `authorize(...roles)` middleware function
- The middleware checks `req.user.role` against the list of permitted roles
- A user with the `dean` role cannot call an endpoint restricted to `a&pc`
- Role locks are also applied in the data layer:
  - `apc_academic` can only query academic staff appraisals
  - `apc_junior` can only query junior non-teaching staff
  - `apc_senior` can only query senior non-teaching staff
  - Dean can only see appraisals from their own college

### Audit Logging

Every significant action is recorded in the `audit_logs` table with:
- `user_id` — who performed the action
- `action` — what they did (e.g., `COLLEGE_BOARD_REVIEW_SUBMITTED`)
- `entity_type` — what table was affected (e.g., `appraisals`)
- `entity_id` — the specific record affected
- `created_at` — exact timestamp

### Rate Limiting

- All API routes: max 200 requests per 15 minutes
- Login route: max 20 attempts per 15 minutes (brute force protection)

### File Security

- Meeting minutes PDFs are stored in a **private** Supabase Storage bucket
- Files are never publicly accessible
- Downloads use **signed URLs** with a 1-hour expiry generated on demand

---

## 10. Database Design Summary

### Core Tables

| Table | Purpose |
|---|---|
| `users` | All system users; stores role, college, department, current_rank, staff_category |
| `appraisals` | One per staff per year; tracks the full status and all committee fields |
| `hod_grades` | HOD / Reporting Officer scoring data for each appraisal |
| `publications` | Academic staff publication records |
| `notifications` | In-app notification queue; read/unread state |
| `audit_logs` | Full action audit trail |
| `meeting_minutes` | Uploaded minute records with extracted entries and discrepancies |
| `external_assessors` | Individual assessor records linked to an appraisal |
| `settings` | System-wide configuration (e.g., appraisal deadline) |

### Key Appraisal Status Values (in order)

```
draft
  → submitted
    → hod_assessed / reporting_officer_assessed
      → staff_viewed
        → (dispute_raised → dean_resolved)
          → college_board_reviewed          [academic only]
            → apc_recommended
              → pending_council
                → council_decided
                  → completed
```

### Key Appraisal Fields

| Field | Description |
|---|---|
| `status` | Current stage in the workflow |
| `hod_grades` | JSONB: HOD scoring object |
| `hod_recommendation` | HOD's text recommendation |
| `college_board_recommendation` | Dean's recommendation (promote/increment/both/commend/no_action) |
| `college_board_reviewed_by` | UUID of Dean who reviewed |
| `apc_decision` | JSONB: { decision, notes, apc_id, decided_at } |
| `council_decision` | JSONB: { decision, notes, council_id, decided_at } |
| `pfq_established` | Boolean — Prima Facie Qualification established (professorial) |
| `pfq_established_at` | Timestamp of PFQ establishment |
| `interview_completed` | Boolean — Promotion interview completed |
| `interview_completed_at` | Timestamp of interview completion |

### External Assessors Table

| Field | Description |
|---|---|
| `appraisal_id` | Links to the appraisals table |
| `stage` | `initial` or `final` |
| `name` | Assessor's full name |
| `institution` | Assessor's university/institution |
| `assessor_type` | `internal` or `external` |
| `scope` | `national` or `international` (final stage only) |
| `outcome` | `pending`, `positive`, or `negative` |
| `selected_by_vc` | Boolean — VC selected this assessor (final stage only) |

---

## Appendix: Appraisal Form Scoring Rubric (Academic Staff)

### HOD Assessment Areas

| Area | Max Points |
|---|---|
| Teaching & Learning | 40 |
| Research & Publications | 30 |
| Community Service | 10 |
| Administration | 10 |
| Professional Development | 10 |
| **Total** | **100** |

### Non-Teaching Staff Scoring (Junior)

| Area | Max Points |
|---|---|
| Job Knowledge | 20 |
| Quality of Work | 20 |
| Attendance & Punctuality | 15 |
| Initiative | 15 |
| Teamwork | 15 |
| Communication | 15 |
| **Total** | **75** (scaled to 100%) |

---

*Document prepared for supervisor walkthrough presentation.*
*System developed as a Final Year Project — Crawford University Department of Computer Science, 2025/2026.*
*Developer: Adebowale Precious | adebowaleprecious3@gmail.com*
