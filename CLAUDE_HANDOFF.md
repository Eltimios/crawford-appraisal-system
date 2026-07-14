# Crawford University Staff Appraisal Management System
## Complete Technical Handoff Document for Continued Documentation

> **Purpose:** This document captures everything built in the system so far — architecture, database schema, all API endpoints, all frontend pages, business logic, and status flows — to allow documentation to continue in a new session without loss of context.

---

## 1. Project Identity

| Field | Value |
|---|---|
| Project Name | Crawford University Web-Based Staff Appraisal Management System |
| Developer | Adebowale Precious |
| Email | adebowaleprecious3@gmail.com |
| Institution | Crawford University, Igbesa, Ogun State |
| Level | Final Year Project — B.Sc. Computer Science |
| Academic Session | 2025/2026 |
| Project Type | Full-stack web application |

---

## 2. Technology Stack

### Backend
| Component | Technology | Version |
|---|---|---|
| Runtime | Node.js | ≥ 18.0.0 |
| Framework | Express.js | ^4.18.2 |
| Database | Supabase (PostgreSQL) | ^2.38.0 |
| Authentication | Supabase Auth (JWT) | built-in |
| File Storage | Supabase Storage (private bucket) | built-in |
| PDF Parsing | pdf-parse | ^2.4.5 |
| Word Doc Generation | docx | ^9.7.1 |
| File Uploads | multer (memory storage) | ^1.4.5-lts.1 |
| Excel Export | exceljs | ^4.4.0 |
| Security | helmet, express-rate-limit | ^7.x |
| Logging | morgan | ^1.10.0 |
| Email (configured) | nodemailer | ^6.9.7 |

### Frontend
| Component | Technology |
|---|---|
| Framework | React.js (Create React App) |
| Routing | React Router v6 |
| HTTP Client | Axios (via custom `api.js` service) |
| Icons | react-icons (Lucide `lu` set) |
| Toast Notifications | react-hot-toast |
| Theme | Custom CSS variables (light/dark mode via ThemeContext) |

### Infrastructure
| Component | Value |
|---|---|
| Backend port | 5000 |
| Frontend port | 3000 |
| API base URL | `http://localhost:5000/api` |
| Database | Supabase cloud (PostgreSQL) |
| File storage | Supabase private bucket: `meeting-minutes` |

---

## 3. Project Folder Structure

```
crawford-appraisal-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js              # Supabase service-role client init
│   │   ├── controllers/
│   │   │   ├── adminController.js
│   │   │   ├── appraisalController.js
│   │   │   ├── assessmentController.js
│   │   │   ├── assessorController.js    # External assessors (NEW)
│   │   │   ├── authController.js
│   │   │   ├── councilController.js
│   │   │   ├── hrController.js
│   │   │   ├── minutesController.js     # Meeting minutes (NEW)
│   │   │   ├── promotionController.js
│   │   │   ├── publicationController.js
│   │   │   └── registryController.js
│   │   ├── middleware/
│   │   │   └── authMiddleware.js        # authenticate + authorize + requireCategory
│   │   ├── routes/
│   │   │   ├── adminRoutes.js
│   │   │   ├── appraisalRoutes.js
│   │   │   ├── assessmentRoutes.js
│   │   │   ├── assessorRoutes.js        # NEW
│   │   │   ├── authRoutes.js
│   │   │   ├── councilRoutes.js
│   │   │   ├── hrRoutes.js
│   │   │   ├── minutesRoutes.js         # NEW
│   │   │   ├── notificationRoutes.js
│   │   │   ├── promotionRoutes.js
│   │   │   ├── publicationRoutes.js
│   │   │   ├── registryRoutes.js
│   │   │   └── settingsRoutes.js
│   │   └── server.js                   # Express app entry point
│   └── package.json
│
├── frontend/
│   └── src/
│       ├── App.js                       # Root routing (role → dashboard)
│       ├── index.js
│       ├── components/
│       │   ├── common/
│       │   │   ├── LoadingSpinner.js
│       │   │   └── ProtectedRoute.js
│       │   ├── layout/
│       │   │   ├── DashboardLayout.js   # Sidebar + Navbar wrapper
│       │   │   ├── Navbar.js
│       │   │   └── Sidebar.js           # Role-based nav config
│       │   ├── minutes/
│       │   │   └── MinutesView.js       # Shared minutes component (NEW)
│       │   └── ui/
│       │       └── WelcomeBanner.js
│       ├── context/
│       │   ├── AuthContext.js           # Auth state, userProfile, userRole, logout
│       │   └── ThemeContext.js
│       ├── data/
│       │   └── nonTeachingCadres.js
│       ├── pages/
│       │   ├── admin/                   # Admin portal
│       │   ├── apc/                     # A&PC portals (4 sub-roles)
│       │   ├── auth/                    # Login page
│       │   ├── collegeBoard/            # College Board pages (used inside Dean)
│       │   ├── council/                 # Council portal
│       │   ├── dean/                    # Dean portal
│       │   ├── hod/                     # HOD / HOU / Reporting Officer portal
│       │   ├── hr/                      # HR Personnel portal
│       │   ├── registry/                # Registry portal
│       │   ├── shared/                  # Notifications, Profile (shared)
│       │   ├── staff/                   # Staff portal
│       │   └── vc/                      # Vice Chancellor portal
│       └── services/
│           ├── api.js                   # Axios instance with auth header
│           ├── appraisalService.js
│           └── supabaseClient.js
│
├── SYSTEM_DOCUMENTATION.md             # Supervisor-facing system doc
├── SYSTEM_DOCUMENTATION.pdf            # Generated PDF of the above
├── generate-pdf.js                     # Script: node generate-pdf.js → PDF
└── CLAUDE_HANDOFF.md                   # This file
```

---

## 4. User Roles (13 Total)

| Role Key | Description | Portal Path |
|---|---|---|
| `staff` | Academic or non-teaching staff member | `/staff` |
| `hod` | Head of Department (assesses academic staff) | `/hod` |
| `hou` | Head of Unit (same as HOD, same portal) | `/hod` |
| `reporting_officer` | Assesses non-teaching staff | `/hod` |
| `dean` | Dean of College | `/dean` |
| `vc` | Vice Chancellor | `/vc` |
| `registry` | Registry / Administrative office | `/registry` |
| `hr_personnel` | HR staff (read-only minutes) | `/hr` |
| `a&pc` | Full A&PC committee (teaching + non-teaching) | `/apc` |
| `apc_academic` | A&PC sub-role: teaching staff only | `/apc-academic` |
| `apc_junior` | A&PC sub-role: junior non-teaching only | `/apc-junior` |
| `apc_senior` | A&PC sub-role: senior non-teaching only | `/apc-senior` |
| `council` | University Council | `/council` |
| `admin` | System administrator | `/admin` |

### Staff Categories (stored in `users.staff_category`)
| Value | Meaning |
|---|---|
| `academic` | Teaching staff |
| `junior_nonteaching` | Junior non-teaching staff |
| `senior_nonteaching` | Senior non-teaching staff |

---

## 5. Appraisal Status Flow

This is the full ordered status lifecycle stored in `appraisals.status`:

```
draft
  → submitted                         (staff submits)
    → hod_assessed                    (HOD/HOU submits assessment — academic)
    → reporting_officer_assessed      (Reporting Officer submits — non-teaching)
      → staff_viewed                  (staff views their assessment)
        → dispute_raised              (staff disputes — optional)
          → dean_resolved             (Dean resolves dispute — academic)
        → college_board_reviewing     (intermediate CB state — academic only)
          → college_board_approved    (CB committee approves — academic only)
        → college_board_reviewed      (Dean submits CB review — academic only)
          → registry_validated        (Registry validates — optional path)
            → apc_recommended         (A&PC submits recommendation)
              → pending_council       (awaiting Council)
                → council_decided     (Council records decision)
                  → completed         (final)
```

**Important notes:**
- Non-teaching staff skip `college_board_*` stages entirely
- `registry_validated` is an optional intermediate status
- `ELIGIBLE_STATUSES` for A&PC view = all statuses from `hod_assessed` through `pending_council` (excluding `draft` and `submitted`)
- `college_board_reviewed` is the main trigger for Dean → A&PC handoff

---

## 6. Database Schema

### Table: `users`
```sql
id                    UUID PRIMARY KEY (= Supabase Auth user id)
email                 TEXT UNIQUE NOT NULL
full_name             TEXT
staff_id              TEXT UNIQUE         -- e.g. "CRU/2021/001"
role                  TEXT                -- one of the 13 role keys above
staff_category        TEXT                -- 'academic' | 'junior_nonteaching' | 'senior_nonteaching'
department            TEXT
college               TEXT                -- Dean/College scoping
current_rank          TEXT                -- e.g. 'Lecturer I', 'Senior Lecturer'
date_of_first_appointment  DATE
date_of_last_promotion     DATE
is_active             BOOLEAN DEFAULT TRUE
phone                 TEXT
address               TEXT
created_at            TIMESTAMPTZ DEFAULT NOW()
```

### Table: `appraisals`
```sql
id                        UUID PRIMARY KEY DEFAULT gen_random_uuid()
staff_id                  UUID REFERENCES users(id)
appraisal_year            INT              -- e.g. 2025 (for 2025/2026 session)
status                    TEXT             -- see status flow above
staff_category            TEXT

-- Part 1: staff fills these
part1_data                JSONB            -- biodata and declarations
self_assessment           JSONB            -- staff self-scores

-- HOD/RO Assessment
hod_grades                JSONB            -- scoring rubric object
hod_recommendation        TEXT
hod_assessed_by           UUID REFERENCES users(id)
hod_assessed_at           TIMESTAMPTZ

-- Dispute
dispute_comment           TEXT
dispute_raised_at         TIMESTAMPTZ
dispute_resolved_by       UUID REFERENCES users(id)
dispute_resolution        TEXT
dispute_resolved_at       TIMESTAMPTZ

-- College Board (Dean)
college_board_recommendation   TEXT        -- 'promote'|'increment'|'both'|'commend'|'no_action'
college_board_notes            TEXT
college_board_reviewed_by      UUID REFERENCES users(id)
college_board_reviewed_at      TIMESTAMPTZ
college_board_status           TEXT        -- 'reviewed'
-- (Also: college_board_reviewing → college_board_approved path via committee)

-- A&PC
apc_decision              JSONB            -- {decision, notes, apc_id, recommended_by, decided_at}

-- Council
council_decision          JSONB            -- {decision, notes, council_id, decided_by, decided_at}

-- External Assessors (NEW)
pfq_established           BOOLEAN DEFAULT FALSE
pfq_established_at        TIMESTAMPTZ
pfq_established_by        UUID REFERENCES users(id)
interview_completed       BOOLEAN DEFAULT FALSE
interview_completed_at    TIMESTAMPTZ
interview_notes           TEXT

created_at                TIMESTAMPTZ DEFAULT NOW()
```

**`apc_decision` JSONB structure:**
```json
{
  "decision": "promoted",
  "notes": "Based on publications and performance",
  "apc_id": "uuid-of-apc-user",
  "recommended_by": "Full Name",
  "decided_at": "2026-03-15T10:00:00Z"
}
```
Valid `decision` values: `promoted` | `increment` | `both` | `deferred` | `not_eligible`

**`council_decision` JSONB structure:**
```json
{
  "decision": "approved_promotion",
  "notes": "Approved by Council",
  "council_id": "uuid-of-council-user",
  "decided_by": "Full Name",
  "decided_at": "2026-04-01T09:00:00Z"
}
```
Valid `decision` values: `approved_promotion` | `approved_increment` | `approved_both` | `not_approved` | `deferred`

---

### Table: `hod_grades`
```sql
id              UUID PRIMARY KEY
appraisal_id    UUID REFERENCES appraisals(id)
assessor_id     UUID REFERENCES users(id)
grades          JSONB   -- full scoring object
totalScore      INT     -- computed total
overallGrade    TEXT    -- letter grade (A/B/C/D)
recommendation  TEXT
created_at      TIMESTAMPTZ
```

---

### Table: `publications`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
staff_id        UUID REFERENCES users(id)
title           TEXT NOT NULL
journal         TEXT
year            INT
type            TEXT   -- 'journal'|'conference'|'book_chapter'|'book'
doi             TEXT
created_at      TIMESTAMPTZ DEFAULT NOW()
```

---

### Table: `notifications`
```sql
id                    UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id               UUID REFERENCES users(id)
type                  TEXT          -- e.g. 'college_board_reviewed', 'pfq_established'
title                 TEXT
message               TEXT
is_read               BOOLEAN DEFAULT FALSE
related_appraisal_id  UUID          -- optional link to appraisal
created_at            TIMESTAMPTZ DEFAULT NOW()
```

---

### Table: `audit_logs`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id)
action          TEXT    -- e.g. 'COLLEGE_BOARD_REVIEW_SUBMITTED', 'APC_RECOMMEND_PROMOTED'
entity_type     TEXT    -- e.g. 'appraisals'
entity_id       UUID
created_at      TIMESTAMPTZ DEFAULT NOW()
```

---

### Table: `settings`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
key             TEXT UNIQUE NOT NULL    -- e.g. 'appraisal_deadline'
value           TEXT
updated_at      TIMESTAMPTZ DEFAULT NOW()
```

---

### Table: `meeting_minutes` (NEW)
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
meeting_type    TEXT NOT NULL CHECK (meeting_type IN ('college_board', 'apc', 'council'))
appraisal_year  INT NOT NULL
meeting_date    DATE NOT NULL
meeting_number  INT NOT NULL
uploaded_by     UUID NOT NULL REFERENCES users(id)
pdf_url         TEXT NOT NULL           -- Supabase Storage path
pdf_filename    TEXT NOT NULL
pdf_size        BIGINT
extracted_entries  JSONB NOT NULL DEFAULT '[]'
discrepancies      JSONB NOT NULL DEFAULT '[]'
status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'superseded'))
notes           TEXT
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()

INDEX: idx_meeting_minutes_type_year ON meeting_minutes(meeting_type, appraisal_year)
INDEX: idx_meeting_minutes_uploaded_by ON meeting_minutes(uploaded_by)
```

**`extracted_entries` JSONB array item structure:**
```json
{
  "staffId": "CRU/2021/001",
  "fullName": "Dr. John Doe",
  "scorePercent": 72,
  "decision": "promoted"
}
```

**`discrepancies` JSONB array item structure:**
```json
{
  "staffId": "CRU/2021/001",
  "fullName": "Dr. John Doe",
  "type": "score_mismatch",
  "detail": "Minutes: 72% — System: 68%"
}
```

---

### Table: `external_assessors` (NEW)
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
appraisal_id    UUID NOT NULL REFERENCES appraisals(id) ON DELETE CASCADE
stage           TEXT NOT NULL DEFAULT 'initial' CHECK (stage IN ('initial', 'final'))
name            TEXT NOT NULL
email           TEXT
institution     TEXT NOT NULL
assessor_type   TEXT NOT NULL CHECK (assessor_type IN ('internal', 'external'))
scope           TEXT CHECK (scope IN ('national', 'international'))
outcome         TEXT NOT NULL DEFAULT 'pending' CHECK (outcome IN ('pending', 'positive', 'negative'))
report_date     DATE
report_notes    TEXT
assigned_by     UUID REFERENCES users(id)
selected_by_vc  BOOLEAN NOT NULL DEFAULT FALSE
vc_selected_by  UUID REFERENCES users(id)
vc_selected_at  TIMESTAMPTZ
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()

INDEX: idx_external_assessors_appraisal ON external_assessors(appraisal_id)
```

---

## 7. Complete API Endpoints

Base URL: `http://localhost:5000/api`

All routes (except `/auth/login`) require: `Authorization: Bearer <JWT_TOKEN>`

---

### AUTH  `/api/auth`
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/login` | public | Login with email+password. Returns `{ session: { access_token }, user }` |
| POST | `/logout` | any | Logout |
| GET | `/me` | any | Get own profile |
| POST | `/change-password` | any | Change password |

---

### APPRAISALS  `/api/appraisals`
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/my` | any | Get own appraisal(s) |
| GET | `/department` | hod, hou, reporting_officer | Get department appraisals |
| GET | `/hod-submissions` | dean | Get HOD appraisal submissions for Dean |
| GET | `/dean-submissions` | vc | Get Dean submissions for VC |
| GET | `/:id` | any | Get single appraisal by ID |
| POST | `/` | any | Create new appraisal (draft) |
| PUT | `/my/biodata` | any | Update biodata on own appraisal |
| PUT | `/:id/part1` | any | Update Part 1 of appraisal |
| POST | `/:id/submit` | any | Submit appraisal (draft → submitted) |
| POST | `/:id/respond` | staff, hod, etc. | Staff responds to/acknowledges assessment |

---

### ASSESSMENTS  `/api/assessments`
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/my` | any | View own assessment |
| POST | `/:id/assess` | hod, hou, reporting_officer, dean, vc | Submit HOD/RO/Dean/VC assessment |
| POST | `/:id/dispute` | staff, hod, etc. | Raise a dispute |
| GET | `/dean/stats` | dean | Dean dashboard stats |
| GET | `/dean/overview` | dean | College overview data |
| GET | `/dean/college-board-queue` | dean | Appraisals ready for CB review |
| PUT | `/:id/dean-college-board-review` | dean | Dean submits College Board recommendation |
| GET | `/disputes/pending` | dean | List active disputes |
| PUT | `/:id/resolve-dispute` | dean | Dean resolves a dispute |
| GET | `/college-board/pending` | college_board | CB committee: pending reviews |
| GET | `/college-board/approved` | college_board | CB committee: approved reviews |
| PUT | `/:id/college-board-review` | college_board | CB committee: submit review |

---

### PROMOTIONS  `/api/promotions`
All routes require: `a&pc`, `apc_academic`, `apc_junior`, `apc_senior`, `registry`, `admin`

| Method | Path | Description |
|---|---|---|
| GET | `/eligible` | Get all appraisals eligible for A&PC review (no apc_decision yet) |
| GET | `/decisions` | Get all appraisals with an apc_decision |
| POST | `/appraisals/:id/recommend` | A&PC submits recommendation |
| POST | `/appraisals/:id/decide` | Backwards-compat alias for /recommend |

**Query params for `/eligible` and `/decisions`:**
- `appraisal_year` — filter by year
- `category` — `'teaching'` or `'non-teaching'`
- `type` — `'junior'` or `'senior'` (only with non-teaching)
- `q` — search by name or staff_id

**Role-category locking (enforced in controller):**
- `apc_academic` → forces `category = 'teaching'`
- `apc_junior` → forces `category = 'non-teaching'`, `type = 'junior'`
- `apc_senior` → forces `category = 'non-teaching'`, `type = 'senior'`

---

### COUNCIL  `/api/council`
All routes require: `council`

| Method | Path | Description |
|---|---|---|
| GET | `/pending` | Appraisals with apc_decision but no council_decision |
| GET | `/decisions` | All appraisals with council_decision |
| GET | `/stats` | Council dashboard statistics |
| POST | `/appraisals/:id/decide` | Record Council decision |

---

### PUBLICATIONS  `/api/publications`
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/my` | staff, hod, etc. | Own publications |
| POST | `/` | staff, hod, etc. | Add publication |
| PUT | `/:id` | staff, hod, etc. | Edit publication |
| DELETE | `/:id` | staff, hod, etc. | Delete publication |
| GET | `/staff/:staffId` | hod, dean, a&pc, etc. | View a staff member's publications |
| GET | `/department` | hod, dean | All publications in dept/college |

---

### NOTIFICATIONS  `/api/notifications`
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/` | any | Get own notifications |
| PUT | `/:id/read` | any | Mark notification as read |
| PUT | `/read-all` | any | Mark all as read |
| DELETE | `/:id` | any | Delete notification |

---

### MEETING MINUTES  `/api/minutes`
| Method | Path | Upload Roles | View Roles | Description |
|---|---|---|---|---|
| POST | `/` | dean, a&pc, apc_*, council | — | Upload PDF minutes |
| GET | `/template/:type` | — | all | Download .docx Word template |
| GET | `/` | — | all + hr_personnel + admin | List minutes (filter by year, type) |
| GET | `/:id` | — | all | Get single minutes record |
| GET | `/:id/download-url` | — | all | Get 1-hour signed URL for PDF download |

**`type` values for template:** `college_board` | `apc` | `council`

**Upload body (multipart/form-data):**
```
pdf         File (required, max 20MB)
meeting_type      TEXT
appraisal_year    INT
meeting_date      DATE
meeting_number    INT
notes             TEXT (optional)
```

---

### EXTERNAL ASSESSORS  `/api/assessors`
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/candidates` | dean | List appraisals in Dean's college needing assessors |
| GET | `/vc/pending` | vc | List professorial candidates with PFQ, awaiting VC selection |
| PATCH | `/record/:assessorId` | dean | Record report outcome for an assessor |
| PATCH | `/vc/select/:assessorId` | vc | VC selects/deselects a final-stage assessor |
| GET | `/:appraisalId` | dean, a&pc, apc_academic, council, vc | Get all assessors for an appraisal |
| POST | `/:appraisalId` | dean | Add an assessor to an appraisal |
| DELETE | `/:assessorId` | dean | Remove assessor (only if outcome=pending, not VC-selected) |
| PATCH | `/:appraisalId/pfq` | a&pc, apc_academic | Establish Prima Facie Qualification |
| PATCH | `/:appraisalId/interview` | a&pc, apc_academic | Mark promotion interview completed |

**Business rules enforced server-side:**
- Initial stage: max 1 external + max 2 internal = 3 total
- Final stage: only external assessors; max 2 international + max 4 national = 6 total
- Final stage only available after `pfq_established = true`
- VC selection: max 1 international + max 2 national = 3 total
- PFQ requires ≥ 2 positive initial reports
- Interview requires ≥ 2 positive VC-selected final reports

---

### REGISTRY  `/api/registry`
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/overview` | registry | All staff overview |
| GET | `/recommendations` | registry | A&PC recommendations list |
| GET | `/pending` | registry | Pending validation queue |
| POST | `/validate/:id` | registry | Validate an appraisal |
| GET | `/disputes` | registry | Invalidated records |
| POST | `/assess-ro/:id` | registry | Assess a Reporting Officer |

---

### ADMIN  `/api/admin`
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/users` | admin | List all users |
| POST | `/users` | admin | Create user (also creates Supabase Auth account) |
| PUT | `/users/:id` | admin | Edit user |
| PATCH | `/users/:id/deactivate` | admin | Deactivate account |
| GET | `/audit-logs` | admin | Full audit log |
| GET | `/reports` | admin | University-wide report data |

---

### HR  `/api/hr`
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/staff` | hr_personnel | List all staff |
| GET | `/staff/:id` | hr_personnel | Single staff record |
| PUT | `/staff/:id` | hr_personnel | Edit staff HR record |
| GET | `/recommendations` | hr_personnel | View A&PC recommendations |

---

### SETTINGS  `/api/settings`
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/` | admin | Get all settings |
| PUT | `/:key` | admin | Update a setting value |

---

## 8. Frontend Routing

### App.js — Root Role Router
```
/login                    → LoginPage
/staff/*                  → StaffDashboard       (role: staff)
/hod/*                    → HODDashboard         (role: hod, hou, reporting_officer)
/dean/*                   → DeanDashboard        (role: dean)
/vc/*                     → VCDashboard          (role: vc)
/apc/*                    → APCDashboard         (role: a&pc)
/apc-academic/*           → APCAcademicDashboard (role: apc_academic)
/apc-junior/*             → APCJuniorDashboard   (role: apc_junior)
/apc-senior/*             → APCSeniorDashboard   (role: apc_senior)
/council/*                → CouncilDashboard     (role: council)
/registry/*               → RegistryDashboard    (role: registry)
/hr/*                     → HRDashboard          (role: hr_personnel)
/admin/*                  → AdminDashboard       (role: admin)
```

### Staff Routes  `/staff/*`
```
/staff                    → StaffHome
/staff/appraisal          → AppraisalPage
/staff/assessment         → MyAssessmentPage
/staff/publications       → PublicationsPage      (academic only, filtered in sidebar)
/staff/biodata            → StaffBiodataPage
/staff/cv                 → StaffCVPage
/staff/notifications      → NotificationsPage
/staff/profile            → ProfilePage
```

### HOD Routes  `/hod/*`
```
/hod                      → HODHome
/hod/appraisal            → AppraisalPage
/hod/assess               → AssessStaffPage
/hod/publications         → HODPublicationsPage
/hod/assessment           → HODMyAssessmentPage
/hod/biodata              → StaffBiodataPage
/hod/cv                   → StaffCVPage
/hod/notifications        → NotificationsPage
/hod/profile              → ProfilePage
```

### Dean Routes  `/dean/*`
```
/dean                     → DeanHome
/dean/appraisal           → AppraisalPage
/dean/assessment          → MyAssessmentPage
/dean/assess              → AssessHODsPage
/dean/assess-deans        → VCAssessDeansPage
/dean/disputes            → DisputesPage
/dean/overview            → CollegeOverviewPage
/dean/publications        → DeanPublicationsPage
/dean/college-review      → CollegeReviewPage
/dean/review              → ReviewQueuePage
/dean/approved            → ApprovedPage
/dean/minutes             → DeanMinutesPage
/dean/assessors           → DeanAssessorsPage     (NEW: External Assessors)
/dean/biodata             → StaffBiodataPage
/dean/cv                  → StaffCVPage
/dean/notifications       → NotificationsPage
/dean/profile             → ProfilePage
```

### VC Routes  `/vc/*`
```
/vc                       → VCHome
/vc/assess-deans          → VCAssessDeansPage
/vc/assessors             → VCAssessorsPage       (NEW: Final assessor selection)
/vc/overview              → VCUniversityOverviewPage
/vc/notifications         → NotificationsPage
/vc/profile               → ProfilePage
```

### A&PC Routes  `/apc/*`  (role: a&pc — full access)
```
/apc                      → APCHome
/apc/teaching             → APCTeachingStaffPage
/apc/non-teaching         → APCNonTeachingHubPage
/apc/staff/:staffId       → APCStaffDetailPage
/apc/minutes              → APCMinutesPage
/apc/reports              → APCReportsPage
/apc/notifications        → NotificationsPage
/apc/profile              → ProfilePage
```

### A&PC Academic Routes  `/apc-academic/*`
```
/apc-academic             → APCHome (role-aware)
/apc-academic/teaching    → APCTeachingStaffPage
/apc-academic/staff/:id   → APCStaffDetailPage
/apc-academic/minutes     → APCMinutesPage
/apc-academic/reports     → APCReportsPage
/apc-academic/notifications → NotificationsPage
/apc-academic/profile     → ProfilePage
```

### A&PC Junior/Senior Routes  `/apc-junior/*` and `/apc-senior/*`
```
/apc-junior               → APCHome (role-aware)
/apc-junior/junior        → APCJuniorStaffPage
/apc-junior/staff/:id     → APCStaffDetailPage
/apc-junior/minutes       → APCMinutesPage
/apc-junior/reports       → APCReportsPage
...

/apc-senior               → APCHome (role-aware)
/apc-senior/senior        → APCSeniorStaffPage
/apc-senior/staff/:id     → APCStaffDetailPage
/apc-senior/minutes       → APCMinutesPage
/apc-senior/reports       → APCReportsPage
...
```

### Council Routes  `/council/*`
```
/council                  → CouncilHome
/council/pending          → CouncilPendingPage
/council/decided          → CouncilDecidedPage
/council/minutes          → CouncilMinutesPage
/council/notifications    → NotificationsPage
/council/profile          → ProfilePage
```

### HR Routes  `/hr/*`
```
/hr                       → HRHome
/hr/minutes               → HRMinutesPage
/hr/notifications         → NotificationsPage
/hr/profile               → ProfilePage
```

### Admin Routes  `/admin/*`
```
/admin                    → AdminHome
/admin/users              → ManageUsersPage
/admin/deadlines          → DeadlinesPage
/admin/reports            → AdminReportsPage
/admin/audit              → AuditLogsPage
/admin/settings           → AdminSettingsPage
```

---

## 9. Authentication Architecture

### How it works
1. User POST `/api/auth/login` with `{ email, password }`
2. Backend calls `supabase.auth.signInWithPassword()` via Supabase Auth
3. Supabase returns a session with `access_token` (JWT)
4. Frontend stores token in memory (via AuthContext) and in localStorage
5. All subsequent API calls include `Authorization: Bearer <token>` header
6. `authMiddleware.js` (`authenticate` function):
   - Decodes JWT payload manually (base64 decode — avoids mutating Supabase client auth state which would break RLS)
   - Checks `payload.sub` and `payload.exp`
   - Fetches full user profile from `users` table using service-role client
   - Checks `is_active = true`
   - Attaches `req.user = profile` for use in controllers

### Important Technical Note
The middleware **manually decodes** the JWT rather than calling `supabase.auth.getUser(token)`. This is because calling `getUser()` mutates the Supabase client's internal auth state, causing subsequent database writes to run as the `authenticated` role (which triggers Row Level Security) instead of the `service_role` (which bypasses RLS). This was a production bug that was fixed.

### `authorize(...roles)` middleware
```js
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied.' });
  }
  next();
};
```

---

## 10. Key Frontend Patterns

### AuthContext (`/context/AuthContext.js`)
Exports:
- `user` — Supabase Auth user object
- `userProfile` — full profile from `users` table (has `role`, `full_name`, `college`, etc.)
- `userRole` — shorthand for `userProfile?.role`
- `loading` — auth loading state
- `login(email, password)` — sets token, fetches profile
- `logout()` — clears state, redirects to login

### api.js service
Axios instance with:
- `baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'`
- Request interceptor: attaches `Authorization: Bearer <token>` from localStorage
- Response interceptor: redirects to `/login` on 401

### Sidebar (`/components/layout/Sidebar.js`)
- `navConfig` object maps each role to an array of nav items
- Each nav item: `{ label, icon, to }` or `{ label, icon, children: [...] }` for dropdowns
- Icons are from `react-icons/lu` (Lucide set)
- Roles with their nav items:
  - `staff`: Dashboard, My Appraisal, Publications (academic only), My Assessment, My Biodata, Notifications
  - `hod/hou/reporting_officer`: Dashboard, My Appraisal, Assess Staff, Staff Publications, My Assessment, My Biodata, Notifications
  - `dean`: Dashboard, My Appraisal, My Assessment, My Biodata, Assess HODs, Review Queue, Approved, Disputes, Staff Publications, College Overview, Meeting Minutes, External Assessors, Notifications
  - `vc`: Dashboard, Assess Deans, External Assessors, University Overview, Notifications, Profile
  - `council`: Dashboard, Pending Decisions, Decision Records, Meeting Minutes, Notifications, Profile
  - `hr_personnel`: Dashboard, Meeting Minutes, Notifications, Profile
  - `apc_academic`: Dashboard, Academic Staff, Meeting Minutes, Reports, Notifications, Profile
  - `apc_junior`: Dashboard, Junior Non-Teaching, Meeting Minutes, Reports, Notifications, Profile
  - `apc_senior`: Dashboard, Senior Non-Teaching, Meeting Minutes, Reports, Notifications, Profile
  - `admin`: Dashboard, Manage Users, Deadlines, Reports, Audit Logs, Settings

### MinutesView (`/components/minutes/MinutesView.js`)
Shared component used by DeanMinutesPage, APCMinutesPage, CouncilMinutesPage, HRMinutesPage.

Props:
```js
canUpload       Boolean  — show upload form
uploadType      String   — 'college_board' | 'apc' | 'council'
viewTypes       Array    — which types to fetch and display
pageTitle       String
pageSubtitle    String
```

Features:
- Download Word template button (calls `GET /api/minutes/template/:type`)
- Upload form (PDF, meeting date, meeting number, year, notes)
- List table with year filter
- Details modal showing extracted entries + discrepancy warnings
- Download PDF button (calls `GET /api/minutes/:id/download-url` → opens signed URL)

### APCStaffDetailPage (`/pages/apc/APCStaffDetailPage.js`)
Contains `AssessorStatusSection` component that renders inside the detail page for candidates with `current_rank` in `['Lecturer I', 'Senior Lecturer', 'Associate Professor']`.

The section:
- Loads assessors from `GET /api/assessors/:appraisalId`
- Shows initial assessors with outcome dots
- Shows PFQ status and "Establish PFQ" button (if A&PC role + 2+ positive initial)
- Shows final assessors (professorial only) with VC-selection status
- Shows "Mark Interview Completed" button (if A&PC role + 2+ positive final)

### StaffHome Timeline
6-step timeline for academic staff, 5-step for non-teaching:
1. Submit Appraisal Form
2. HOD/HOU Assessment (or Reporting Officer)
3. View & Comment on Assessment
4. College Board Review (academic only)
5. Promotion Review (A&PC)
6. Council Decision ← **added last**

---

## 11. External Assessors — Full Business Logic

### Ranks requiring external assessment
```js
const ASSESSOR_RANKS     = ['Lecturer I', 'Senior Lecturer', 'Associate Professor'];
const PROFESSORIAL_RANKS = ['Senior Lecturer', 'Associate Professor'];
```

### Workflow
| Rank | Stage | Composition | Threshold |
|---|---|---|---|
| Lecturer I | Initial only | 1 external + 2 internal | 2/3 positive |
| Senior Lecturer | Initial → (PFQ) → Final | Initial: 1ext+2int; Final: 6 external (2intl+4natl) | 2/3 each stage |
| Associate Professor | Same as Senior Lecturer | Same | Same |

### VC Selection Rules
- Selects from 6 final-stage external assessors
- Must select exactly: 1 international + 2 national = 3 total
- System prevents exceeding quotas

### Status triggers
- **After College Board Review** (`college_board_reviewed`) → Dean can assign initial assessors
- **After 2+ positive initial** → A&PC can click "Establish PFQ" (professorial only)
- **After PFQ established** → Dean notified → Dean adds 6 final names → VC selects 3
- **After 2+ positive final (VC-selected)** → A&PC can click "Mark Interview Completed"
- **After interview completed** → A&PC submits promotion recommendation → Council decides

---

## 12. Meeting Minutes — Full Technical Logic

### Upload flow
1. User uploads PDF (multipart) with multer memory storage
2. `pdf-parse` extracts text from buffer
3. `parseMinutesText()` splits by newlines, finds lines matching `|` pipe-separated pattern: `Staff ID | Full Name | Score% | Decision`
4. Each entry is cross-checked against `appraisals` table via `correlateWithDB()`
5. Discrepancies are flagged (warning only — Council has final say)
6. PDF is uploaded to Supabase Storage bucket `meeting-minutes` with path `{type}/{year}/{uuid}-{filename}`
7. Record saved to `meeting_minutes` table

### Decision term mapping
```js
const APC_DECISION_MAP = {
  'promoted': ['promoted', 'promotion', 'promote'],
  'increment': ['increment', 'incremented'],
  'both': ['both', 'promotion and increment'],
  'deferred': ['deferred', 'defer'],
  'not_eligible': ['not eligible', 'ineligible', 'rejected'],
};

const COUNCIL_DECISION_MAP = {
  'approved_promotion': ['approved for promotion', 'promotion approved'],
  'approved_increment': ['approved for increment', 'increment approved'],
  'approved_both': ['approved for both', 'both approved'],
  'not_approved': ['not approved', 'rejected', 'declined'],
  'deferred': ['deferred'],
};
```

### Word template generation
- `GET /api/minutes/template/:type` → streams a `.docx` file
- Uses `docx` npm package to build a structured Word document with:
  - University header
  - Meeting info fields (date, type, year, number)
  - A table with columns: Staff ID | Full Name | Score % | Decision
  - Signature blocks

---

## 13. Security Implementation

### Rate Limiting
```js
const limiter     = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }); // all /api/
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20  }); // /api/auth/login
```

### Helmet
`app.use(helmet())` — sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.)

### CORS
Only allows origin: `process.env.FRONTEND_URL || 'http://localhost:3000'`

### Cache-Control
```js
app.use('/api/', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
```

### File security
- Supabase Storage bucket `meeting-minutes` is **private** (no public access)
- Files served via signed URLs: `supabase.storage.from('meeting-minutes').createSignedUrl(path, 3600)`
- URLs expire after 1 hour

---

## 14. Environment Variables

### Backend `.env`
```
PORT=5000
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend `.env`
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 15. How to Run the Project

### Start backend
```bash
cd crawford-appraisal-system/backend
npm run dev          # uses nodemon (hot reload)
# or
npm start            # production mode
```

### Start frontend
```bash
cd crawford-appraisal-system/frontend
npm start            # opens at http://localhost:3000
```

### Generate PDF documentation
```bash
cd crawford-appraisal-system   # project root
node generate-pdf.js           # outputs SYSTEM_DOCUMENTATION.pdf
```

---

## 16. All Features Completed (What Has Been Built)

| # | Feature | Status |
|---|---|---|
| 1 | User authentication (login/logout, JWT, session) | ✅ Complete |
| 2 | Role-based access control (13 roles, middleware) | ✅ Complete |
| 3 | Staff appraisal form submission | ✅ Complete |
| 4 | HOD academic staff assessment | ✅ Complete |
| 5 | Reporting Officer non-teaching assessment | ✅ Complete |
| 6 | Staff assessment review and comment | ✅ Complete |
| 7 | Dispute raising (staff) | ✅ Complete |
| 8 | Dispute resolution (Dean) | ✅ Complete |
| 9 | College Board Review (Dean recommends to A&PC) | ✅ Complete |
| 10 | A&PC recommendation to Council | ✅ Complete |
| 11 | A&PC role-category locking (academic/junior/senior) | ✅ Complete |
| 12 | Council final decision | ✅ Complete |
| 13 | VC Dean assessment | ✅ Complete |
| 14 | Registry validation | ✅ Complete |
| 15 | Publications management (add/edit/delete/view) | ✅ Complete |
| 16 | Staff Biodata page | ✅ Complete |
| 17 | Staff CV download page | ✅ Complete |
| 18 | In-app notifications (all trigger points) | ✅ Complete |
| 19 | Audit logging | ✅ Complete |
| 20 | Admin user management | ✅ Complete |
| 21 | Admin audit logs view | ✅ Complete |
| 22 | Admin reports | ✅ Complete |
| 23 | Appraisal deadline management | ✅ Complete |
| 24 | Light/dark theme toggle | ✅ Complete |
| 25 | College Overview (Dean) | ✅ Complete |
| 26 | University Overview (VC) | ✅ Complete |
| 27 | HR staff management | ✅ Complete |
| 28 | Meeting Minutes — upload PDF | ✅ Complete |
| 29 | Meeting Minutes — PDF text parsing | ✅ Complete |
| 30 | Meeting Minutes — DB cross-check + discrepancy flagging | ✅ Complete |
| 31 | Meeting Minutes — Word template download | ✅ Complete |
| 32 | Meeting Minutes — signed URL PDF download | ✅ Complete |
| 33 | Meeting Minutes — 4 portals (Dean, A&PC, Council, HR) | ✅ Complete |
| 34 | External Assessors — Dean assigns initial assessors | ✅ Complete |
| 35 | External Assessors — outcome recording | ✅ Complete |
| 36 | External Assessors — PFQ establishment (A&PC) | ✅ Complete |
| 37 | External Assessors — Dean submits 6 final names | ✅ Complete |
| 38 | External Assessors — VC selects 3 (1intl+2natl) | ✅ Complete |
| 39 | External Assessors — interview completion (A&PC) | ✅ Complete |
| 40 | External Assessors — status panel in A&PC detail page | ✅ Complete |
| 41 | Staff home appraisal timeline (6-step incl. Council) | ✅ Complete |
| 42 | APC sub-role routing (separate dashboards) | ✅ Complete |
| 43 | Sidebar navigation for all roles | ✅ Complete |
| 44 | System documentation PDF | ✅ Complete |

---

## 17. Supabase Storage

### Bucket: `meeting-minutes`
- Type: **Private** (no public URL access)
- File path format: `{meeting_type}/{appraisal_year}/{uuid}-{original_filename}`
- Example: `college_board/2025/a3f2c1d0-minutes-march-2026.pdf`
- Access: via signed URLs only (1-hour expiry)

---

## 18. Notes for Future Documentation Work

### Academic staff scoring rubric (HOD Assessment)
Stored in `hod_grades` JSONB. Typical structure:
```json
{
  "teaching": 35,
  "research": 28,
  "communityService": 8,
  "administration": 7,
  "professionalDevelopment": 9,
  "totalScore": 87,
  "overallGrade": "A"
}
```

### Non-teaching scoring (varies by junior/senior)
**Junior (max 75):** Job Knowledge, Quality of Work, Attendance, Initiative, Teamwork, Communication
**Senior (max 100):** Expanded rubric with supervisory and management components

### College Board recommendation values
`promote` | `increment` | `both` | `commend` | `no_action`

### A&PC decision values
`promoted` | `increment` | `both` | `deferred` | `not_eligible`

### Council decision values
`approved_promotion` | `approved_increment` | `approved_both` | `not_approved` | `deferred`

### Notification types used
`college_board_reviewed`, `hod_assessed`, `dispute_raised`, `dispute_resolved`, `promotion_decision`, `council_decision`, `pfq_established`

### Key known technical decisions / workarounds
1. **JWT manual decode**: Middleware manually base64-decodes JWT payload instead of calling `supabase.auth.getUser()` to avoid mutating Supabase client auth state (which breaks service-role DB access).
2. **APC sub-role routing**: `apc_academic`, `apc_junior`, `apc_senior` have separate dashboard components at `/apc-academic/`, `/apc-junior/`, `/apc-senior/` because they share `APCHome.js` but need different base paths for routing.
3. **Meeting minutes parsing**: Uses pipe `|` separator. Lines not matching the pattern are silently skipped. Discrepancies are warnings only.
4. **External assessors route ordering**: Specific named routes (`/candidates`, `/vc/pending`, `/record/:id`, `/vc/select/:id`) are registered BEFORE wildcard routes (`/:appraisalId`) to prevent Express route collision.
5. **Supabase table filter limitation**: Cannot filter on joined table columns in Supabase JS client (e.g., `users.current_rank`). Rank filtering for external assessors is done in JavaScript after fetching.

---

*This document was generated for the purpose of continuing system documentation in Claude web.*
*All features listed as ✅ Complete are fully implemented, tested, and integrated.*
*Developer: Adebowale Precious — adebowaleprecious3@gmail.com*
