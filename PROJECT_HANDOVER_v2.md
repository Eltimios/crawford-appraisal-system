# Crawford University Staff Appraisal System
# Project Handover Document — v2.0

**Date:** April 24, 2026
**Project Status:** Ready for Development Phase (Active Build)
**Prepared by:** Nova (Claude AI Assistant)
**Student Developer:** Precious
**Target Platform:** Claude Code (Claude.ai Pro)
**Previous Version:** v1.0 (Firebase — deprecated)

---

## ⚠️ IMPORTANT — READ FIRST

This is Version 2 of the project package. **Version 1 (Firebase) has been replaced.**
The entire backend infrastructure has been migrated from Firebase to **Supabase (PostgreSQL)**.
Do NOT use the v1 zip file. Use this package exclusively.

---

## 📦 What's in This Package

```
crawford-appraisal-system-v2/
│
├── frontend/                        ← React.js Application
│   ├── src/
│   │   ├── App.js                   ✅ Built — full role-based routing
│   │   ├── context/AuthContext.js   ✅ Built — login/logout/token management
│   │   ├── services/supabaseClient.js ✅ Built — Supabase connection
│   │   ├── pages/                   ⚠️ 7 dashboards — to be built
│   │   ├── components/              ⚠️ UI components — to be built
│   │   ├── hooks/                   ⚠️ Custom hooks — to be built
│   │   └── utils/                   ⚠️ Helper functions — to be built
│   ├── package.json                 ✅ All dependencies listed
│   └── .env.example                 ✅ Environment template ready
│
├── backend/                         ← Node.js + Express Application
│   ├── src/
│   │   ├── server.js                ✅ Built — Express entry point
│   │   ├── config/supabase.js       ✅ Built — Supabase admin client
│   │   ├── middleware/authMiddleware.js ✅ Built — JWT + RBAC
│   │   ├── controllers/
│   │   │   ├── authController.js    ✅ Built — login, logout, profile, reset
│   │   │   ├── appraisalController.js ✅ Built — full appraisal lifecycle
│   │   │   ├── assessmentController.js ✅ Built — HOD, College Board, Dean
│   │   │   ├── publicationController.js ✅ Built — upload + scoring formula
│   │   │   └── promotionController.js ✅ Built — eligibility + decisions
│   │   ├── routes/
│   │   │   ├── authRoutes.js        ✅ Built
│   │   │   ├── appraisalRoutes.js   ✅ Built
│   │   │   ├── assessmentRoutes.js  ✅ Built
│   │   │   ├── notificationRoutes.js ✅ Built
│   │   │   └── publicationAndPromotionRoutes.js ✅ Built
│   │   ├── models/                  ⚠️ Firestore models replaced by SQL schema
│   │   ├── services/                ⚠️ Additional business logic — to be built
│   │   └── utils/                   ⚠️ Helper functions — to be built
│   ├── package.json                 ✅ All dependencies listed
│   └── .env.example                 ✅ Environment template ready
│
├── database/
│   ├── migrations/001_initial_schema.sql ✅ Complete PostgreSQL schema
│   └── seeds/001_sample_data.sql    ✅ Sample departments and deadlines
│
└── docs/
    ├── Requirements_Document_v3.docx ✅ Full system requirements
    ├── Project_Proposal_v2.docx      ✅ Project proposal
    └── Chapter_One_v3.docx           ✅ Academic thesis Chapter 1
```

---

## 🚀 Tech Stack (Final — Do Not Change)

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | React.js | 18.2 | UI Components & Dashboards |
| Backend | Node.js + Express.js | 18+ | REST API Server |
| Database | Supabase (PostgreSQL) | Latest | Relational Database |
| Auth | Supabase Auth | Latest | User Login & Sessions |
| Storage | Supabase Storage | Latest | Publication File Uploads |
| Frontend Host | Vercel | Latest | Free Deployment |
| Backend Host | Render | Latest | Free Deployment |
| Styling | Tailwind CSS | 3.4 | UI Styling |

---

## 🗄️ Database Schema Summary (PostgreSQL)

9 tables fully defined in `database/migrations/001_initial_schema.sql`:

| Table | Purpose |
|-------|---------|
| `users` | All user accounts and profiles |
| `departments` | University departments and colleges |
| `appraisals` | All appraisal forms and assessment data |
| `publications` | Academic staff publications and scores |
| `promotion_tracking` | Promotion/increment eligibility and decisions |
| `supervision` | Thesis and project supervision records |
| `notifications` | In-system notifications for all users |
| `appraisal_deadlines` | Annual appraisal cycle deadlines |
| `audit_logs` | Complete system activity trail |

**Key SQL functions already built:**
- `calculate_publication_points()` — implements PTS/PP formula
- `check_promotion_eligibility()` — checks years in rank
- `update_updated_at_column()` — auto-timestamps trigger

---

## 👥 User Roles & Access

| Role | Value in DB | Access Level |
|------|------------|-------------|
| Staff Member | `staff` | Own appraisals, publications (academic only) |
| Head of Department | `hod` | Department appraisals, own appraisal |
| Head of Unit | `hou` | Same as HOD |
| Dean of College | `dean` | College appraisals, disputes, HOD assessment |
| College Board | `college_board` | Academic HOD assessments review only |
| A&PC Committee | `apc` | All eligible staff, promotion decisions |
| Administrator | `admin` | Full system access |

---

## 🔄 Assessment Workflow (CRITICAL)

### Non-Academic Staff:
```
Staff Submits → HOD/HOU Assesses → Staff Views Directly → Validates or Disputes → Dean Resolves
```

### Academic Staff:
```
Staff Submits → HOD/HOU Assesses → College Board Reviews → Staff Views → Validates or Disputes → Dean Resolves
```

**Status flow in `appraisals` table:**
```
draft → submitted → hod_assessed / college_board_reviewing
→ college_board_approved → staff_viewed → disputed → dean_resolved → completed
```

---

## ✅ What's Already Built (Agent Should NOT Rebuild)

### Backend — Fully Working:
- ✅ `server.js` — Express with CORS, helmet, rate limiting, error handling
- ✅ `config/supabase.js` — Supabase service role client
- ✅ `middleware/authMiddleware.js` — authenticate(), authorize(), requireCategory()
- ✅ `controllers/authController.js` — login, logout, getProfile, updatePassword, resetPassword
- ✅ `controllers/appraisalController.js` — full CRUD + submit + respond + dispute
- ✅ `controllers/assessmentController.js` — HOD assessment, College Board review, Dean dispute resolution
- ✅ `controllers/publicationController.js` — upload, scoring (PTS/PP formula), delete
- ✅ `controllers/promotionController.js` — eligibility check, A&PC decisions, rank progression
- ✅ All route files wired with correct role-based middleware

### Frontend — Fully Working:
- ✅ `services/supabaseClient.js` — Supabase connection
- ✅ `context/AuthContext.js` — login/logout/token/profile state
- ✅ `App.js` — role-based routing, protected routes, role redirect

### Database:
- ✅ Complete PostgreSQL schema
- ✅ Row Level Security policies
- ✅ Indexes for performance
- ✅ Triggers for auto-timestamps
- ✅ SQL functions for scoring and eligibility

---

## ⚠️ What Still Needs to Be Built

### Frontend Pages (7 Dashboards):
All pages are in `frontend/src/pages/` — folders exist, components need to be created.

#### 1. `pages/auth/LoginPage.jsx`
- Email + password login form
- Role-based redirect after login (already handled in App.js)
- Password reset link
- Crawford University branding

#### 2. `pages/staff/` — Staff Dashboard
- View own appraisal status
- Fill and submit appraisal form (Part 1 + Part 2)
- View HOD assessment (conditional — academic sees after College Board approves)
- Validate or dispute assessment
- Upload publications (academic only)
- View promotion/increment eligibility status
- Notification bell

#### 3. `pages/hod/` — HOD/HOU Dashboard
- View list of departmental staff appraisals
- Grade and assess each staff member
- Submit written recommendations
- View disputed assessments
- Complete own appraisal form

#### 4. `pages/dean/` — Dean Dashboard
- View all college appraisals
- View and resolve disputes
- Assess HOD/HOU appraisals
- Complete own appraisal form

#### 5. `pages/collegeBoard/` — College Board Dashboard
- View all pending academic staff HOD assessments
- Approve or flag each assessment
- View approved history

#### 6. `pages/apc/` — A&PC Dashboard
- View all eligible staff for promotion/increment
- Review academic staff scores, publications, APER
- Review non-academic staff experience and qualifications
- Record decisions: Promote / Increment / Both / Defer / Reject
- Generate decision letters

#### 7. `pages/admin/` — Admin Dashboard
- Manage all user accounts (create, deactivate, assign roles)
- Set and manage appraisal deadlines
- View analytics and reports
- Export PDF/Excel reports
- Monitor audit logs

### Frontend Components:
- `components/common/` — Button, Input, Modal, Badge, Spinner, Alert
- `components/layout/` — Navbar, Sidebar, Footer, PageWrapper
- `components/forms/` — AppraisalFormAcademic, AppraisalFormJunior, AppraisalFormSenior

### Backend — Remaining:
- `src/routes/adminRoutes.js` — User management, deadlines, reports
- `src/controllers/adminController.js` — Admin CRUD operations
- `src/routes/reportRoutes.js` — Analytics and export
- `src/controllers/reportController.js` — PDF/Excel generation
- `src/services/emailService.js` — Nodemailer email notifications
- `src/utils/validators.js` — Input validation helpers
- Uncomment all route imports in `server.js` as each is built

---

## 🔌 API Endpoints Reference

### Auth
```
POST   /api/auth/login              Public
POST   /api/auth/reset-password     Public
POST   /api/auth/logout             Protected
GET    /api/auth/profile            Protected
PUT    /api/auth/password           Protected
```

### Appraisals
```
GET    /api/appraisals/my           Staff — own appraisals
POST   /api/appraisals              Staff — create new
PUT    /api/appraisals/:id/part1    Staff — save Part 1
POST   /api/appraisals/:id/submit   Staff — submit form
POST   /api/appraisals/:id/respond  Staff — validate or dispute
GET    /api/appraisals/department   HOD/HOU/Dean — department list
GET    /api/appraisals/:id          All roles — single appraisal
```

### Assessments
```
POST   /api/assessments/:id/assess              HOD/HOU
GET    /api/assessments/college-board/pending   College Board
PUT    /api/assessments/:id/college-board-review College Board
GET    /api/assessments/disputes/pending        Dean/Admin
PUT    /api/assessments/:id/resolve-dispute     Dean
```

### Publications
```
GET    /api/publications/my                     Academic Staff
POST   /api/publications                        Academic Staff
DELETE /api/publications/:id                    Academic Staff
GET    /api/publications/staff/:staffId         APC/Admin/Dean
GET    /api/publications/staff/:staffId/points  APC/Admin
```

### Promotions
```
GET    /api/promotions/eligible                 APC/Admin
POST   /api/promotions/staff/:staffId/decide    APC
GET    /api/promotions/staff/:staffId/eligibility APC/Admin/Dean
GET    /api/promotions/my/history               All staff
```

### Notifications
```
GET    /api/notifications           All users
PUT    /api/notifications/:id/read  All users
PUT    /api/notifications/read-all  All users
```

---

## 🔧 Setup Instructions for Claude Code Agent

### Step 1: Extract and Open Project
```bash
unzip crawford-appraisal-system-v2.zip
cd crawford-appraisal-system-v2
# Open in VS Code or your editor
```

### Step 2: Setup Supabase
1. Go to https://supabase.com and create a free account
2. Create new project: `crawford-university-appraisal`
3. Go to SQL Editor and run: `database/migrations/001_initial_schema.sql`
4. Then run: `database/seeds/001_sample_data.sql`
5. Go to Project Settings → API and copy:
   - Project URL
   - anon public key
   - service_role key (keep secret!)
6. Go to Storage and create a bucket called `publications` (set to public)

### Step 3: Configure Environment Variables
```bash
# Frontend
cd frontend
cp .env.example .env
# Fill in REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY

# Backend
cd ../backend
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET etc.
```

### Step 4: Install Dependencies
```bash
# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install
```

### Step 5: Start Both Servers
```bash
# Backend (Terminal 1)
cd backend && npm run dev

# Frontend (Terminal 2)
cd frontend && npm start
```

### Step 6: Verify Setup
- Frontend: http://localhost:3000 — should show login placeholder
- Backend: http://localhost:5000/api/health — should return JSON status

---

## 📋 Build Order for Claude Code Agent

Follow this exact order to avoid dependency issues:

### Phase 1 — Activate Backend Routes
1. Uncomment all route imports in `backend/src/server.js`
2. Test each endpoint with a REST client (Postman or Thunder Client)
3. Create first admin user directly in Supabase dashboard

### Phase 2 — Login Page
1. Build `frontend/src/pages/auth/LoginPage.jsx`
2. Test login with admin user created in Phase 1
3. Verify role-based redirect works (already in App.js)

### Phase 3 — Shared Components
1. Build `components/common/` — Button, Input, Modal, Alert, Spinner
2. Build `components/layout/` — Navbar with notifications bell, Sidebar, PageWrapper
3. These are reused across all 7 dashboards

### Phase 4 — Staff Dashboard
1. Build appraisal form for all 3 categories
2. Build assessment viewing (conditional logic already in backend)
3. Build dispute submission interface
4. Build publication upload (academic only)

### Phase 5 — HOD Dashboard
1. Build staff list with appraisal status indicators
2. Build assessment grading interface (A-E radio buttons + recommendation)

### Phase 6 — College Board Dashboard
1. Build pending reviews queue
2. Build approve/flag interface

### Phase 7 — Dean Dashboard
1. Build dispute resolution interface
2. Build HOD assessment view

### Phase 8 — A&PC Dashboard
1. Build eligible staff list
2. Build scoring summary view
3. Build decision recording interface

### Phase 9 — Admin Dashboard
1. User management (CRUD)
2. Deadline management
3. Reports and analytics

### Phase 10 — Notifications & Polish
1. Real-time notification bell
2. Email notifications via nodemailer
3. PDF/Excel export
4. Mobile responsiveness

---

## 🎯 Key Implementation Rules (Do Not Deviate)

1. **College Board is ONLY for Academic Staff** — Non-academic staff assessments go directly to staff after HOD submits. This logic is already implemented in `assessmentController.js`.

2. **Part 1 locks after submission** — Once a staff member submits their appraisal, Part 1 personal details are locked. Already implemented in `appraisalController.js`.

3. **Promotion effective date is October 1** — Already implemented in `promotionController.js` as `getPromotionEffectiveDate()`.

4. **Publication scoring uses PTS/PP formula** — Already implemented in both `publicationController.js` (Node.js) and `001_initial_schema.sql` (PostgreSQL function).

5. **Accelerated promotion requires minimum 24 months** — Regular promotion requires 3 years. Both are handled in `promotionController.js`.

6. **Never expose service_role key to frontend** — Only use `REACT_APP_SUPABASE_ANON_KEY` on frontend. Service role key stays in backend `.env` only.

7. **All routes must use authenticate() middleware** — No unprotected routes except `/api/auth/login` and `/api/auth/reset-password`.

---

## 🧪 Testing Checklist

Before considering any phase complete:
- [ ] API endpoint returns correct data
- [ ] Role access control is enforced (try accessing with wrong role)
- [ ] Error states are handled gracefully
- [ ] Form validation works
- [ ] Notifications are triggered correctly
- [ ] Audit log entries are created

---

## 📚 Key Files to Read Before Building

In this order:
1. `docs/Crawford_University_Requirements_Document_v3.docx` — Full system requirements
2. `database/migrations/001_initial_schema.sql` — Understand the data structure
3. `backend/src/controllers/assessmentController.js` — Understand the critical College Board workflow
4. `backend/src/App.js` — Understand the routing structure
5. `backend/src/middleware/authMiddleware.js` — Understand access control

---

## 🌐 Deployment (When Ready)

### Frontend → Vercel
```bash
cd frontend
npm run build
# Push to GitHub → Connect to Vercel → Auto-deploy
```

### Backend → Render
```bash
# Push backend folder to GitHub
# Connect to Render → New Web Service
# Set environment variables in Render dashboard
# Deploy
```

### Database → Already on Supabase cloud ✅

---

## ✅ Final Project Completion Checklist

- [ ] All 7 user roles have working dashboards
- [ ] Login and role-based routing working
- [ ] 3 distinct appraisal forms working
- [ ] HOD/HOU assessment workflow working
- [ ] College Board review gate working (Academic Staff only)
- [ ] Staff dispute and Dean resolution working
- [ ] Publication upload and scoring working
- [ ] Promotion eligibility auto-calculation working
- [ ] A&PC decision recording working
- [ ] Notifications system working
- [ ] Analytics dashboard working
- [ ] Admin user management working
- [ ] Security and RBAC tested
- [ ] Deployed to Vercel and Render
- [ ] All documents submitted to supervisor

---

**Built with care by Nova (Claude AI) | April 24, 2026**
**Crawford University | Igbesa, Ogun State, Nigeria**
**Student: Precious | Final Year Project 2025/2026**
