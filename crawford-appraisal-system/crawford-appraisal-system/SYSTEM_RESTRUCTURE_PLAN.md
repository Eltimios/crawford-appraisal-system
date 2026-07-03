# Crawford University Appraisal System — Major Restructure Plan
## Implementation Document for Claude Code

**Date:** 2026  
**Student:** Adebowale Precious | 220502006  
**Stakeholders:** Crawford University Admin, A&PC, Supervisor (Dr. Victoria Akano)  
**Status:** Approved by stakeholders — Implementation required

---

## 🎯 OVERVIEW

This document covers a **major restructure** based on direct feedback from Crawford University's Admin staff and A&PC committee. The current system needs the following changes:

1. **New roles** added: Reporting Officer, Registry, HR Personnel
2. **Workflows restructured** for Academic and Non-Teaching staff
3. **HR & A&PC portals** completely redesigned with new UI pattern
4. **Excel export** added for bulk staff printing (Nominal Roll)
5. **Council Chairman** role placeholder for future (final approval authority)

---

## 🔄 NEW WORKFLOWS

### 🟦 Non-Teaching Staff (Junior + Senior)
```
Staff fills appraisal form
   ↓
Reporting Officer reviews and comments
   ↓
Staff receives feedback / raises dispute (optional)
   ↓
Registry reviews all comments + validates Reporting Officer's work
   ↓
HR Personnel prints documents + manages onboarding
   ↓
A&PC body reviews (Registry = core member with edit rights, others view only)
   ↓
Pending Council Chairman → Final approval (FUTURE)
```

### 🟩 Academic Staff (Teaching)
```
Staff fills appraisal form
   ↓
HOD reviews and comments
   ↓
Staff receives feedback / raises dispute (optional)
   ↓
Dean reviews and approves (merged with former College Board powers — Dean has final say)
   ↓
HR Personnel prints documents + manages onboarding
   ↓
A&PC body reviews
   ↓
Pending Council Chairman → Final approval (FUTURE)
```

### 👑 Assessment Hierarchy (Who Assesses Whom)
```
   Staff
     ↑ assessed by
   HOD (academic) / Reporting Officer (non-teaching)
     ↑ assessed by
   Dean
     ↑ assessed by
   VC (Vice Chancellor)
```

**KEY PRINCIPLE:** HR, Registry, and A&PC only **RECOMMEND**. Council has final say on promotion/increment decisions.

---

## 👥 UPDATED USER ROLES

| Role | Database Value | Portal Path | Notes |
|------|---------------|-------------|-------|
| Staff | `staff` | `/staff` | Same as before |
| HOD | `hod` | `/hod` | Academic Staff only |
| HOU | `hou` | `/hod` | Same portal as HOD |
| **Reporting Officer** | `reporting_officer` | `/hod` | 🆕 Reuses HOD portal with label changes |
| Dean | `dean` | `/dean` | ✅ MERGED ROLE — Dean now has College Board powers (assess HODs + review/approve academic assessments + resolve disputes) |
| ~~College Board~~ | ~~`college_board`~~ | ~~`/college-board`~~ | ❌ DEPRECATED — merged into Dean role. Remove this portal. |
| **Vice Chancellor (VC)** | `vc` | `/vc` (or `/dean` for now) | 🆕 NEW — Assesses Deans (just like Dean assesses HODs). Has Dean-level read access for now. |
| **Registry** | `registry` | `/registry` | 🆕 NEW PORTAL — disputes + A&PC edit rights |
| **HR Personnel** | `hr_personnel` | `/hr` | 🆕 NEW PORTAL — onboarding + printing |
| A&PC | `a&pc` | `/apc` | 🔄 RESTRUCTURED UI |
| Admin | `admin` | `/admin` | Same as before |
| Council Chairman | `council_chairman` | `/council` | ⏸️ FUTURE — placeholder only |

---

## 🗄️ DATABASE CHANGES

### 1. Update `users` table — Add new role enum values
```sql
-- Update role check constraint to include new roles
ALTER TABLE users 
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users 
  ADD CONSTRAINT users_role_check 
  CHECK (role IN (
    'staff', 'hod', 'hou', 'reporting_officer',
    'dean', 'vc', 'college_board', 'registry', 
    'hr_personnel', 'a&pc', 'admin', 'council_chairman'
  ));
```

### 2. Add `reporting_officer_id` column to `users`
```sql
-- Each non-teaching staff has a designated reporting officer
ALTER TABLE users
  ADD COLUMN reporting_officer_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_users_reporting_officer ON users(reporting_officer_id);
```

### 3. Add new statuses to `appraisals.status`
```sql
ALTER TABLE appraisals 
  DROP CONSTRAINT IF EXISTS appraisals_status_check;

ALTER TABLE appraisals 
  ADD CONSTRAINT appraisals_status_check 
  CHECK (status IN (
    'draft',
    'submitted',
    'hod_assessed',
    'reporting_officer_assessed',
    'dispute_raised',
    'college_board_approved',
    'registry_validated',
    'hr_received',
    'apc_recommended',
    'pending_council',
    'council_approved',
    'council_rejected'
  ));
```

### 4. Add `council_status` to `promotions` table
```sql
ALTER TABLE promotions
  ADD COLUMN council_status VARCHAR(50) DEFAULT 'pending'
    CHECK (council_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE promotions
  ADD COLUMN council_decision_date TIMESTAMP;

ALTER TABLE promotions
  ADD COLUMN council_decision_by UUID REFERENCES users(id);

ALTER TABLE promotions
  ADD COLUMN council_remarks TEXT;
```

### 5. Add `recommendation_type` to `promotions` table
```sql
-- Distinguish between recommendation and final decision
ALTER TABLE promotions
  RENAME COLUMN decision TO recommendation;

-- Update values clarity (UI will display as "Recommended for X")
-- DB values stay clean: promoted | increment | both | deferred | not_eligible
```

### 6. Create `assessments` updates for Registry validation
```sql
ALTER TABLE assessments
  ADD COLUMN registry_validated BOOLEAN DEFAULT FALSE;

ALTER TABLE assessments
  ADD COLUMN registry_validated_by UUID REFERENCES users(id);

ALTER TABLE assessments
  ADD COLUMN registry_validated_at TIMESTAMP;

ALTER TABLE assessments
  ADD COLUMN registry_remarks TEXT;
```

---

## 🔧 BACKEND CHANGES

### NEW Route: `/api/reporting-officer/*`
**File:** `backend/src/routes/reportingOfficerRoutes.js`

Since Reporting Officer reuses HOD logic, **reuse `hodController.js`** methods but add role checks for both `hod` AND `reporting_officer`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/staff` | List non-teaching staff assigned to this RO |
| POST | `/assess` | Assess a staff member's appraisal |
| GET | `/my-staff` | Get all staff with this RO as `reporting_officer_id` |

**Auth:** `requireRole(['reporting_officer', 'admin'])`

---

### NEW Route: `/api/registry/*`
**File:** `backend/src/routes/registryRoutes.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/pending-validation` | Non-teaching assessments awaiting registry review |
| POST | `/validate/:appraisalId` | Validate Reporting Officer's work |
| GET | `/disputes` | List disputes for non-teaching staff |
| POST | `/resolve-dispute/:disputeId` | Resolve a non-teaching dispute |

**Auth:** `requireRole(['registry', 'admin'])`

---

### NEW Route: `/api/hr/*`
**File:** `backend/src/routes/hrRoutes.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/teaching-staff` | List all teaching staff (search supported) |
| GET | `/non-teaching-staff` | List all non-teaching staff (with junior/senior filter) |
| GET | `/staff/:id/appraisal` | Get full appraisal for printing |
| GET | `/export/excel` | Generate Nominal Roll Excel download |
| POST | `/onboard-staff` | Create new staff member (modal form) |
| GET | `/notifications` | HR-specific notifications |

**Auth:** `requireRole(['hr_personnel', 'admin'])`

**Excel export library:** Use `exceljs` or `xlsx` (recommend `exceljs` for better filter support)

```bash
npm install exceljs
```

---

### UPDATE: `/api/promotions/*` — A&PC Logic
**File:** `backend/src/controllers/promotionController.js`

Add:
- `recommended_by` field tracking
- Filter by category (teaching/non-teaching/junior/senior)
- Search by staff name or ID

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/eligible?category=teaching` | Filter by staff type |
| GET | `/eligible?category=non-teaching&type=junior` | Further filter |
| GET | `/search?q=name_or_id` | Search staff |
| POST | `/recommend` | Submit A&PC recommendation (was `/record`) |

---

### UPDATE: `/api/assessments/*`
Add Registry validation step BEFORE staff can view their assessment (for non-teaching):

```javascript
// In getMyAssessment for non-teaching staff:
if (staff.staff_type !== 'academic' && !assessment.registry_validated) {
  return res.status(403).json({ 
    message: 'Assessment pending Registry validation' 
  });
}
```

---

## 🎨 FRONTEND CHANGES

### 1. NEW Portal: HR Personnel (`/hr/*`)
**Folder:** `frontend/src/pages/hr/`

#### Pages:
- **HRHome.js** — Landing page with 2 large container cards:
  ```
  ┌─────────────────────────────────────┐
  │  HR Personnel Portal                │
  │  + [Onboard New Staff] (floating)   │
  ├─────────────────────────────────────┤
  │  ┌────────────┐  ┌────────────┐    │
  │  │ 📚 Teaching│  │🏢 Non-Teach│    │
  │  │   Staff    │  │   Staff    │    │
  │  │  [Enter →] │  │  [Enter →] │    │
  │  └────────────┘  └────────────┘    │
  └─────────────────────────────────────┘
  ```

- **HRTeachingStaffPage.js** — Search + list of teaching staff
  - Search bar: full name OR staff ID
  - Cards show: Name, Staff ID, Department, Status
  - Click card → Staff detail view with **Print Individual Appraisal (PDF)** button
  - **[Download Nominal Roll Excel]** button at top

- **HRNonTeachingHubPage.js** — Sub-container for Junior/Senior
  ```
  ┌─────────────────────────────────────┐
  │  Non-Teaching Staff                 │
  ├─────────────────────────────────────┤
  │  ┌────────────┐  ┌────────────┐    │
  │  │ 🎓 Junior  │  │ 👔 Senior  │    │
  │  │  [Enter →] │  │  [Enter →] │    │
  │  └────────────┘  └────────────┘    │
  └─────────────────────────────────────┘
  ```

- **HRJuniorStaffPage.js** — Same as Teaching layout but for Junior Non-Teaching
- **HRSeniorStaffPage.js** — Same for Senior Non-Teaching

- **HROnboardModal.js** — Reusable modal for adding new staff
  - Form fields: name, email, role, department, staff_type, reporting_officer (if non-teaching)
  - Submits to `POST /api/hr/onboard-staff`

#### Floating Onboard Button:
- Always visible bottom-right corner
- Opens `HROnboardModal`

#### Print Logic:
- **Individual:** Open new browser tab with print-friendly view → call `window.print()`
- **Bulk Excel:** GET `/api/hr/export/excel` → triggers file download

---

### 2. NEW Portal: Registry (`/registry/*`)
**Folder:** `frontend/src/pages/registry/`

#### Pages:
- **RegistryHome.js** — Dashboard with counts
- **PendingValidationPage.js** — Reporting Officer assessments awaiting validation
- **RegistryDisputesPage.js** — Non-teaching disputes to resolve

---

### 3. RESTRUCTURE: A&PC Portal (`/apc/*`)
**Replace existing pages with new structure matching HR:**

- **APCHome.js** — Update to show 2 containers (Teaching | Non-Teaching) with Onboard button hidden (only HR has it)
- **APCTeachingStaffPage.js** — Search + list + "Recommended this cycle" filter toggle
- **APCNonTeachingHubPage.js** — Junior/Senior split
- **APCJuniorStaffPage.js**
- **APCSeniorStaffPage.js**
- **APCStaffDetailPage.js** — Click staff → review appraisal → submit recommendation

#### Recommendation Modal:
Buttons:
- Recommend for Promotion
- Recommend for Increment
- Recommend for Both
- Defer
- Not Eligible

Status badge shows: **"Pending Council Approval"** after recommendation

---

### 4. UPDATE: HOD Portal Labels (`/hod/*`)
**No new files needed.** Just conditional label rendering:

```javascript
// In Sidebar.js / Navbar.js / HODHome.js
const userRole = userProfile?.role;
const portalTitle = userRole === 'reporting_officer' 
  ? 'Reporting Officer Portal' 
  : 'HOD Portal';

const actionLabel = userRole === 'reporting_officer'
  ? 'Reporting Officer Assessment'
  : 'HOD Assessment';
```

Sidebar nav links: `Assess Staff` stays the same for both roles.

---

### 5. UPDATE: Sidebar.js
Add new role-based nav entries:

```javascript
const navConfig = {
  // ... existing roles
  reporting_officer: hodNavConfig, // reuse HOD nav
  registry: [
    { path: '/registry', label: 'Dashboard', icon: 'LuHome' },
    { path: '/registry/pending', label: 'Pending Validation', icon: 'LuClipboard' },
    { path: '/registry/disputes', label: 'Disputes', icon: 'LuAlertCircle' },
  ],
  hr_personnel: [
    { path: '/hr', label: 'Dashboard', icon: 'LuHome' },
    // Teaching/Non-Teaching are accessed via dashboard containers, not sidebar
  ],
  // updated a&pc nav same as HR
};
```

---

### 6. UPDATE: App.js Routes
Add new route prefixes:

```jsx
<Route path="/reporting-officer/*" element={<RoleGuard role="reporting_officer"><HODRoutes /></RoleGuard>} />
<Route path="/registry/*" element={<RoleGuard role="registry"><RegistryRoutes /></RoleGuard>} />
<Route path="/hr/*" element={<RoleGuard role="hr_personnel"><HRRoutes /></RoleGuard>} />

{/* VC placeholder — routes to Dean portal */}
<Route path="/vc/*" element={<RoleGuard role="vc"><DeanRoutes /></RoleGuard>} />
```

**VC Role Handling in RoleGuard:**
```javascript
// Allow VC to access Dean routes
const allowedRoles = {
  dean: ['dean', 'vc'],
  // ... other mappings
};
```

---

## 📊 EXCEL EXPORT — "Staff Nominal Roll"

### Library: `exceljs`
```bash
cd backend
npm install exceljs
```

### Endpoint Logic (`/api/hr/export/excel`):

```javascript
const ExcelJS = require('exceljs');

async function exportNominalRoll(req, res) {
  const { category, type } = req.query; // teaching | non-teaching, junior | senior
  
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Staff Nominal Roll');
  
  // Headers
  sheet.columns = [
    { header: 'Staff ID', key: 'staff_id', width: 15 },
    { header: 'Full Name', key: 'full_name', width: 25 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Staff Type', key: 'staff_type', width: 15 },
    { header: 'Current Grade', key: 'grade', width: 15 },
    { header: 'Last Promotion', key: 'last_promotion', width: 15 },
    { header: 'Appraisal Status', key: 'status', width: 20 },
    { header: 'Recommendation', key: 'recommendation', width: 25 },
    { header: 'Council Status', key: 'council_status', width: 20 },
  ];
  
  // Auto-filter on header row
  sheet.autoFilter = {
    from: 'A1',
    to: 'I1',
  };
  
  // Style header row
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F3864' },
  };
  
  // Fetch data based on filters
  const staff = await fetchStaffData(category, type);
  
  // Add rows
  staff.forEach(s => sheet.addRow(s));
  
  // Send file
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=Crawford_Staff_Nominal_Roll.xlsx');
  await workbook.xlsx.write(res);
  res.end();
}
```

---

## 🔐 PERMISSIONS MATRIX

| Action | Staff | HOD | RO | Dean | VC | Reg | HR | A&PC | Admin |
|--------|:-----:|:---:|:--:|:----:|:--:|:---:|:--:|:----:|:-----:|
| Submit appraisal | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Assess academic staff | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assess non-teaching | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assess HODs | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assess Deans | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Validate RO work | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Resolve disputes (non-teach) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Resolve disputes (academic) | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Onboard new staff | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Print appraisal | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Recommend promotion | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| Edit A&PC recommendations | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| View A&PC recommendations | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Final approval (Council) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## ⏸️ PLACEHOLDER ROLES (For Future Build-Out)

### Vice Chancellor (VC) — `vc`
- **Primary Responsibility:** Assesses Deans (mirrors how Dean assesses HODs, and HOD assesses Staff)
- **Current Implementation:** Use Dean portal access for now (`/dean/*`) — supervisor will later confirm full VC portal scope
- **Future Portal (`/vc/*`) should include:**
  - VC Dashboard
  - Assess Deans page (similar to Dean's "Assess HODs" page)
  - View Dean assessment results
  - VC's own appraisal (assessed by whom? — TBD)
- **Database notes:** Dean's appraisal records will need a `vc_assessment` JSON column added to `assessments` table when VC portal is built

### Council Chairman — `council_chairman`
- Receives all `pending_council` recommendations
- Can approve or reject final decisions
- Updates `promotions.council_status` to `approved` or `rejected`
- Triggers automatic notifications to staff

**Do not build the VC or Council portals yet** — placeholder schema only. The VC role just maps to Dean access for now.

---

## ✅ IMPLEMENTATION CHECKLIST

### Database
- [ ] Run all SQL migration scripts above
- [ ] Update `users` role enum
- [ ] Add `reporting_officer_id` column
- [ ] Update `appraisals.status` constraint
- [ ] Add Registry validation columns to `assessments`
- [ ] Rename `promotions.decision` to `recommendation`
- [ ] Add Council fields to `promotions`

### Backend
- [ ] Install `exceljs` package
- [ ] Create `reportingOfficerRoutes.js` (reuses HOD controller with role check update)
- [ ] Create `registryRoutes.js` + `registryController.js`
- [ ] Create `hrRoutes.js` + `hrController.js` (incl. Excel export)
- [ ] Update `promotionController.js` for category filters + search
- [ ] Update `assessmentController.js` to gate non-teaching view on Registry validation
- [ ] Update `authMiddleware.js` to handle new roles

### Frontend
- [ ] Create `frontend/src/pages/hr/` folder + all HR pages
- [ ] Create `frontend/src/pages/registry/` folder + all Registry pages
- [ ] Restructure `frontend/src/pages/apc/` with new container UI
- [ ] **DELETE `frontend/src/pages/collegeBoard/` folder** (deprecated)
- [ ] Update `Sidebar.js` with new role nav configs (remove College Board entries)
- [ ] Update `HODHome.js` and HOD pages to show different labels for Reporting Officer
- [ ] Update `App.js` with new routes (remove `/college-board/*` routes)
- [ ] Update Dean portal to include former College Board pages (Review Queue, Approved)
- [ ] Create `HROnboardModal.js` reusable component
- [ ] Create floating Onboard button component

### Testing
- [ ] Create test users for each new role
- [ ] Test end-to-end workflows for both Academic and Non-Teaching
- [ ] Test Registry validation gate
- [ ] Test Excel download with filters
- [ ] Test Reporting Officer assignment

---

## 📝 NOTES FOR DEVELOPER

1. **HOU was previously mapped to HOD** — keep that mapping intact, just add `reporting_officer` to the same group.

2. **HR's floating Onboard button** should NOT appear on the staff detail print preview pages — only on main listing pages.

3. **A&PC search filter** — make "Recommended this cycle" a toggle that filters the staff list to only those eligible.

4. **Excel export** should include ALL staff details from the appraisal form, not just summary fields. Stakeholders specifically requested "all info and details".

5. **Print preview pages** for individual appraisals should use proper print CSS (`@media print`) so the browser's print dialog produces a clean PDF.

6. **Dean role now has merged College Board powers** — the existing `dean` account handles BOTH original Dean tasks (assess HODs, resolve disputes) AND the former College Board tasks (review/approve Academic Staff assessments before staff can view them). No separate accounts needed.

7. **College Board portal is DEPRECATED** — remove `/college-board/*` routes, sidebar entries, and all related pages. Migrate any existing data/logic into the Dean portal. The `college_board_approved` status name can stay in the database for backwards compatibility but will now be set by the Dean.

8. **Updated Academic Workflow:**
```
Staff fills appraisal form
   ↓
HOD reviews and comments
   ↓
Staff receives feedback / raises dispute (optional)
   ↓
Dean reviews and approves (with merged College Board powers)
   ↓
HR Personnel prints documents + manages onboarding
   ↓
A&PC body reviews and recommends
   ↓
Pending Council Chairman → Final approval (FUTURE)
```

---

**Document prepared for Claude Code implementation.**  
**Crawford University, Igbesa, Nigeria — 2025/2026 Academic Session**
