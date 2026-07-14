# Crawford University — Staff Appraisal Management System

A web-based staff appraisal and performance management system built for Crawford University, Igbesa, Nigeria.  
Final year Computer Science project — 2025/2026 academic session.

---

## Tech Stack

| Layer       | Technology                              |
|-------------|-----------------------------------------|
| Frontend    | React.js 18.2 (Create React App)        |
| Backend     | Node.js + Express.js                    |
| Database    | Supabase (PostgreSQL)                   |
| Auth        | Supabase Auth (Email/Password + JWT)    |
| File Storage| Supabase Storage                        |
| Styling     | Pure CSS custom properties — no Tailwind|
| Icons       | Lucide React (`react-icons/lu`)         |

**Frontend** → `frontend/` — runs on port `3000`  
**Backend** → `backend/` — runs on port `5000`

---

## How to Run

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run dev       # nodemon, or: npm start

# Terminal 2 — Frontend
cd frontend
npm install
npm start
```

---

## Project Structure

```
frontend/src/
├── context/
│   ├── AuthContext.js        # login, logout, userProfile, userRole, refreshProfile
│   └── ThemeContext.js       # light/dark toggle via data-theme on <html>
├── components/layout/
│   ├── Sidebar.js            # always-dark sidebar, role-based nav links
│   └── Navbar.js             # portal title, theme toggle, notifications, user dropdown
└── pages/
    ├── auth/                 # LoginPage
    ├── staff/                # StaffHome, AppraisalPage, MyAssessmentPage, PublicationsPage
    ├── hod/                  # HODHome, AssessStaffPage, HODMyAssessmentPage, HODPublicationsPage
    ├── dean/                 # DeanHome, AssessHODsPage, DisputesPage, CollegeOverviewPage, DeanPublicationsPage
    ├── collegeBoard/         # CollegeBoardHome, ReviewQueuePage, ApprovedPage
    ├── apc/                  # APCHome, EligibleStaffPage, PromotionsPage, IncrementsPage, APCReportsPage
    ├── admin/                # AdminHome, ManageUsersPage, DeadlinesPage, AdminReportsPage, AuditLogsPage, AdminSettingsPage
    └── shared/               # ProfilePage, NotificationsPage

backend/src/
├── config/
│   ├── supabase.js           # Supabase client (service role key)
│   └── firebase.js           # legacy — superseded by Supabase
├── middleware/
│   └── authMiddleware.js     # JWT verification via Supabase
├── routes/                   # Express routers (one file per domain)
├── controllers/              # Business logic (one file per domain)
└── server.js
```

---

## User Roles & Portals

Seven roles, each with its own portal and navigation:

| Role            | URL Prefix       | Access Level                                          |
|-----------------|------------------|-------------------------------------------------------|
| `staff`         | `/staff`         | Submit appraisal, view assessment, publications       |
| `hod`           | `/hod`           | Assess departmental staff, own appraisal              |
| `hou`           | `/hod` (shared)  | Same portal as HOD                                    |
| `dean`          | `/dean`          | Assess HODs, resolve disputes, college overview       |
| `college_board` | `/college-board` | Review & approve Academic Staff assessments           |
| `a&pc`          | `/apc`           | Promotion & increment decisions                       |
| `admin`         | `/admin`         | User management, deadlines, reports, audit logs       |

---

## Appraisal Workflow

### Non-Academic Staff
```
Staff submits → HOD assesses → Staff views result → [optional] Dispute → Dean resolves
```

### Academic Staff (College Board gate)
```
Staff submits → HOD assesses → College Board reviews → Staff views result → [optional] Dispute → Dean resolves
```

### A&PC Decision (after appraisal cycle)
Eligible staff forwarded to A&PC who record one of:
**promoted** | **increment** | **both** | **deferred** | **not_eligible**

---

## Appraisal Form Types

Staff submit one of three forms depending on their category:

1. **Academic Staff** — teaching duties, research output, publications, community service
2. **Non-Teaching Staff (Junior)** — administrative performance, punctuality, task completion
3. **Senior Non-Teaching Staff** — management responsibilities, strategic contribution

---

## Frontend Pages

### Auth
- **LoginPage** — single-card, Crawford logo, email/password with show/hide, forgot password link

### Staff Portal (`/staff/*`)
- **StaffHome** — stats cards (submissions, last score, deadline), appraisal status timeline
- **AppraisalPage** — 3-type dynamic form, section-by-section, draft save + submit
- **MyAssessmentPage** — view HOD assessment result (Academic: gated until College Board approves), raise dispute
- **PublicationsPage** — add, view, delete personal research publications

### HOD / HOU Portal (`/hod/*`)
- **HODHome** — dashboard, pending assessment count, dept staff stats
- **AssessStaffPage** — list dept submissions, open grading form, submit assessment
- **HODMyAssessmentPage** — HOD's own assessment result (assessed by Dean)
- **HODPublicationsPage** — view all dept staff publications

### Dean Portal (`/dean/*`)
- **DeanHome** — dashboard with college-wide counts
- **AssessHODsPage** — grade Heads of Department
- **DisputesPage** — view and resolve staff disputes
- **CollegeOverviewPage** — live college-wide appraisal statistics
- **DeanPublicationsPage** — browse publications across the college

### College Board Portal (`/college-board/*`)
- **CollegeBoardHome** — dashboard, pending review count
- **ReviewQueuePage** — review Academic Staff assessments, approve or flag
- **ApprovedPage** — history of approved assessments

### A&PC Portal (`/apc/*`)
- **APCHome** — dashboard
- **EligibleStaffPage** — staff eligible for promotion or increment this cycle
- **PromotionsPage** — all recorded promotion decisions
- **IncrementsPage** — all recorded increment decisions
- **APCReportsPage** — summary statistics

### Admin Portal (`/admin/*`)
- **AdminHome** — system-wide stats dashboard (total users, submissions, etc.)
- **ManageUsersPage** — view all users, create user (modal form), edit user details/role
- **DeadlinesPage** — set/update submission deadlines per appraisal type
- **AdminReportsPage** — appraisal completion report
- **AuditLogsPage** — system action log
- **AdminSettingsPage** — system settings (local state only, demo purposes)

### Shared
- **ProfilePage** — view/edit name, department, phone; change password (all roles)
- **NotificationsPage** — all notification types with icons and colours, mark read/mark all read

---

## Backend API

### Auth — `/api/auth`
| Method | Endpoint    | Description                    |
|--------|-------------|--------------------------------|
| POST   | `/login`    | Supabase email/password sign-in|
| GET    | `/profile`  | Fetch current user's profile   |
| PUT    | `/profile`  | Update name, phone, etc.       |
| PUT    | `/password` | Change password                |

### Appraisals — `/api/appraisals`
| Method | Endpoint           | Description                            |
|--------|--------------------|----------------------------------------|
| GET    | `/my`              | Staff's own submissions                |
| POST   | `/submit`          | Submit or save draft                   |
| GET    | `/department`      | HOD — list dept staff submissions      |
| GET    | `/hod-submissions` | HOD's own submitted appraisals         |

### Assessments — `/api/assessments`
| Method | Endpoint                | Description                            |
|--------|-------------------------|----------------------------------------|
| POST   | `/hod-assess`           | HOD submits grade for a staff member   |
| GET    | `/my-assessment`        | Staff views their own assessment result|
| POST   | `/college-board-review` | College Board approves or flags        |
| GET    | `/college-board-queue`  | College Board pending review queue     |
| POST   | `/dispute`              | Staff raises a dispute                 |
| POST   | `/dean-resolve`         | Dean resolves a dispute                |
| POST   | `/dean-assess-hod`      | Dean grades a HOD                      |
| GET    | `/dean-stats`           | Dean's dashboard statistics            |
| GET    | `/college-overview`     | College-wide live stats (Dean)         |

### Promotions — `/api/promotions`
| Method | Endpoint    | Description                           |
|--------|-------------|---------------------------------------|
| GET    | `/eligible` | List eligible staff                   |
| GET    | `/decisions`| All recorded decisions                |
| POST   | `/record`   | Record a promotion/increment decision |

### Publications — `/api/publications`
| Method | Endpoint | Description       |
|--------|----------|-------------------|
| GET    | `/`      | My publications   |
| POST   | `/`      | Add publication   |
| DELETE | `/:id`   | Delete publication|

### Notifications — `/api/notifications`
| Method | Endpoint      | Description          |
|--------|---------------|----------------------|
| GET    | `/`           | Fetch all            |
| PUT    | `/:id/read`   | Mark one as read     |
| PUT    | `/read-all`   | Mark all as read     |

### Admin — `/api/admin`
| Method | Endpoint          | Description                             |
|--------|-------------------|-----------------------------------------|
| GET    | `/stats`          | System-wide counts                      |
| GET    | `/users`          | All users                               |
| POST   | `/users`          | Create user (Supabase Auth + DB row)    |
| PUT    | `/users/:id`      | Edit user details or role               |
| GET    | `/deadlines`      | All deadlines                           |
| PUT    | `/deadlines/:key` | Update a deadline                       |
| GET    | `/appraisals`     | All appraisal records (reports view)    |
| GET    | `/audit-logs`     | Audit log entries                       |

---

## Database — Supabase (PostgreSQL)

Key tables:

| Table             | Key Columns                                                                 |
|-------------------|-----------------------------------------------------------------------------|
| `users`           | id, email, full_name, role, department, staff_type, phone                   |
| `appraisals`      | id, staff_id, form_data (JSON), status, academic_year, staff_type           |
| `assessments`     | id, appraisal_id, hod_grades (JSON), cb_status, dean_resolution             |
| `promotions`      | id, staff_id, academic_year, decision, recorded_by                          |
| `publications`    | id, staff_id, title, type, authors, year, file_url                          |
| `notifications`   | id, user_id, type, message, is_read, created_at                             |
| `audit_logs`      | id, actor_id, action, target_id, created_at                                 |
| `deadlines`       | key (appraisal type), date                                                  |

---

## UI Design System

- **Theme**: Light/dark toggle, stored in `localStorage`, applied via `data-theme` on `<html>`
- **Sidebar**: Permanently dark (`#0f1623`) regardless of theme — `--sidebar-*` CSS variables never change
- **Role accent colours**: Each role has a distinct `--role-accent` CSS variable used for highlights and active nav
- **Stat cards**: CSS Grid `auto-fit` + `minmax(200px, 1fr)` — fills full container width with no dead space
- **Icons**: Lucide React throughout — no emoji in the UI
- **Logo**: Crawford University crest (`public/crawford-logo.png`) — appears in sidebar, login page, and browser tab favicon

---

## Known Limitations

| Issue                         | Detail                                                         |
|-------------------------------|----------------------------------------------------------------|
| AdminSettingsPage             | Settings save to local state only — no DB persistence          |
| Delete user                   | No endpoint implemented — admin can edit but not remove users  |
| Forgot password               | Button present on login page, handler not implemented          |
| Email notifications           | Notifications are in-app only — no email delivery              |
| Publication file uploads      | UI scaffolded; Supabase Storage integration not yet wired      |

---

## Critical Workflow Notes

1. **College Board gate** — Academic Staff assessments are invisible to the staff member until College Board explicitly approves them. This is the most important business rule in the system.
2. **Score calculation** — Non-teaching staff score is out of 75 (`totalScore/75`). Academic staff use letter grades from HOD (`overallGrade` field).
3. **HOU role** — Maps to the HOD portal (`/hod/*`) and uses identical nav and logic. No separate HOU portal exists.
4. **Role URL mappings**: `college_board → /college-board`, `a&pc → /apc`, `hou → /hod`

---

*Crawford University, Igbesa, Nigeria — 2025/2026 Academic Session*
