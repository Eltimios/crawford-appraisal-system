# Crawford University Appraisal System — Defense Presentation Guide

> **All demo passwords: `Demo@123`**  
> Frontend: `http://localhost:3000` | Backend: `http://localhost:5000`

---

## PART 1 — OPENING STATEMENT (2 minutes)

Say this (or your version of it):

> *"The Crawford University Academic Staff Appraisal System is a full-stack web application that digitises and automates the entire staff promotion workflow — from when a staff member fills their appraisal form, all the way to Council's final promotion decision. It supports 13 distinct user roles, enforces strict role-based access control, and implements the actual promotion criteria used by the NUC — including external assessors, PFQ establishment, and publication scoring."*

**Three problems the system solves:**
1. Manual paper-based appraisals lose forms and cause delays
2. No transparency — staff don't know where their appraisal is in the process
3. No digital scoring of publications for promotion decisions

---

## PART 2 — BEFORE THE PRESENTATION (Setup Checklist)

Do this before your supervisor enters the room:

- [ ] Open **two browser windows** — one for each role you're about to switch
- [ ] Start backend: `node src/server.js` (in `backend/` folder)
- [ ] Start frontend: `npm start` (in `frontend/` folder)
- [ ] Log in as **Staff (Dr. Funmilayo)** in Window 1 — confirm dashboard loads
- [ ] Log in as **Dean** in Window 2 — confirm dashboard loads
- [ ] Have Notepad open with the credentials table below for quick copy-paste

### All Demo Accounts

| Role | Email | Password |
|---|---|---|
| Staff (Assoc. Prof.) | assocprof.demo@crawford.edu.ng | Demo@123 |
| HOD (CS) | hod.cs@crawford.edu.ng | Demo@123 |
| Dean | dean@crawford.edu.ng | Demo@123 |
| Registry | registry@crawford.edu.ng | Demo@123 |
| A&PC | apc@crawford.edu.ng | Demo@123 |
| VC | vc@crawford.edu.ng | Demo@123 |
| Council | council@crawforduniversity.edu.ng | Demo@123 |
| Admin | admin@crawford.edu.ng | Demo@123 |
| HR | hr@crawford.edu.ng | Demo@123 |

---

## PART 3 — THE LIVE DEMO (15–20 minutes)

Follow this order. It tells the story of one appraisal from start to finish.

---

### SCENE 1 — Staff Portal (3 min)

**Login as:** `assocprof.demo@crawford.edu.ng`

**What to show → What to say**

1. **Dashboard / Home page**
   - Point to the **Appraisal Timeline** widget
   - Say: *"Every staff member sees exactly which stage their appraisal is at. Dr. Funmilayo's is currently at College Board Reviewed — it has gone through HOD assessment, Registry validation, and College Board, and is now awaiting A&PC."*

2. **Publications tab**
   - Show the 8 publications with their points
   - Click **View** on any paper — the PDF opens
   - Say: *"Academic staff upload their papers here. The system automatically scores them using the NUC publication scoring table — 3 points for a journal article, 4 for a refereed book. These scores feed directly into the promotion calculation."*

3. **Biodata & Profile tab**
   - Scroll through — show the filled ORCID, Google Scholar, office details, research interests
   - Say: *"The system generates a digital academic CV from this data. It pulls from the appraisal form so everything stays in sync."*

4. **My Assessment tab**
   - Show the HOD grades — all A's
   - Show the HOD recommendation text
   - Say: *"Once HOD submits their assessment, the staff member is notified and can either validate it or submit a comment — the system calls this invalidation. The Dean then adjudicates."*

---

### SCENE 2 — HOD Portal (2 min)

**Login as:** `hod.cs@crawford.edu.ng`

1. **HOD Dashboard** — show pending appraisals list
2. **Click on any submitted appraisal** — show the grading form
   - Say: *"The HOD sees all department staff appraisals. They grade across seven criteria — research, teaching quality, service to profession, contribution to the country, contribution to the university, departmental responsibilities, and others. The system enforces that all seven are graded before submission."*
3. If time allows, show **Department Publications** — the HOD can see all staff research in their department.

---

### SCENE 3 — Registry Portal (1 min)

**Login as:** `registry@crawford.edu.ng`

1. Show the Registry dashboard — pending validations list
   - Say: *"Registry validates the appraisal before it moves to the College Board. They confirm the staff member's academic credentials, date of first appointment, and rank. This is a gatekeeping step."*

---

### SCENE 4 — Dean / College Board Portal (2 min)

**Login as:** `dean@crawford.edu.ng`

1. **College Board tab** — show appraisals assigned to the Dean's college
2. Click on Dr. Funmilayo's completed review
   - Show `college_board_recommendation: promote` and the College Board notes
   - Say: *"The Dean chairs the College Board. After reviewing the staff's full appraisal, HOD grades, and publications, the Dean either recommends promotion or not. Once submitted, it goes to A&PC."*

---

### SCENE 5 — A&PC Portal (2 min)

**Login as:** `apc@crawford.edu.ng`

1. Show the **A&PC Dashboard** — shows candidates forwarded from College Boards
2. Click on Dr. Funmilayo
   - Say: *"The Appointments and Promotions Committee receives candidates from all colleges. They review everything and make the final academic recommendation to Council."*
3. Show the **External Assessors tab** for Dr. Funmilayo
   - This is where PFQ is established (explained in detail in Part 4 below)
   - Say: *"Because Dr. Funmilayo is an Associate Professor seeking promotion to Full Professor, she goes through a special process called PFQ — Prima Facie Qualification — involving external assessors. I will explain this in detail now."*

---

### SCENE 6 — Council Portal (1 min)

**Login as:** `council@crawforduniversity.edu.ng`

1. Show Council dashboard — candidates recommended by A&PC
   - Say: *"The University Council has the final word. They record the decision — Approved, Rejected, or Deferred. This is the last step in the system."*

---

### SCENE 7 — Admin Panel (1 min)

**Login as:** `admin@crawford.edu.ng`

1. Show **User Management** — list of all users, their roles, staff categories
   - Say: *"The Admin manages the system — creating accounts, assigning roles, and configuring the appraisal year."*
2. Show the **role selector** when creating a user
   - Say: *"The system supports 13 distinct roles. Each role sees a completely different interface and can only access data relevant to their function."*

---

## PART 4 — EXTERNAL ASSESSORS / PFQ WORKFLOW (5 min)

This is the most technically complex feature. Walk through it carefully.

### Background (say this first)

> *"When an academic staff member at Senior Lecturer or Associate Professor rank is being considered for promotion to a higher professorial rank, the NUC requires a two-stage external assessor process. The system implements this fully. It is called the Professor/Faculty Qualification process — PFQ."*

### The 4-Stage Workflow

**Stage 1 — Dean adds Initial Assessors**
- Login as Dean → External Assessors → Find Dr. Funmilayo
- The Dean nominates **3 initial assessors**: 2 internal (from Crawford) + 1 external
- These people review her publications and academic work
- The Dean records their report outcome: **Positive / Negative / Pending**
- *(For demo: you can add them live or show the form, then explain what happens next)*

**Stage 2 — A&PC Establishes PFQ**
- Login as A&PC → External Assessors tab for Dr. Funmilayo
- The button **"Establish PFQ"** becomes active only when **2 or more** initial reports are **Positive**
- The system enforces this — it will reject the action if the condition is not met
- Click "Establish PFQ" → a notification is sent to the Dean to nominate 6 final assessors
- Say: *"Prima Facie Qualification means the committee has confirmed the candidate has a credible case for promotion. This unlocks the final stage."*

**Stage 3 — Dean Nominates 6 Final Assessors**
- Back to Dean → External Assessors → Dr. Funmilayo
- Now the final stage form is unlocked
- The Dean adds **6 all-external assessors**: exactly 2 international + 4 national
- The system enforces the exact breakdown — it will reject if you try to add a 3rd international
- These 6 names are submitted to the VC for selection
- Say: *"The Dean submits 6 names to the Vice Chancellor. The VC independently selects 3 — without knowing which ones the Dean preferred."*

**Stage 4 — VC Selects 3, A&PC Marks Interview Complete**
- Login as VC → VC Dashboard → Pending Selections
- The VC sees the 6 names and selects **exactly 3**: 1 international + 2 national
- The system enforces the composition
- The Dean records outcomes for the 3 VC-selected assessors
- Login as A&PC → when 2+ VC-selected reports are Positive → click **"Mark Interview Completed"**
- The appraisal then moves to Council for final decision

### What to emphasise to your supervisor:

- *"Every rule in this workflow is enforced by the backend — not just validation in the UI."*
- *"The VC's selection is blind to the Dean's preference — the system does not show which ones the Dean added first."*
- *"A&PC cannot establish PFQ unless there are 2 positive reports in the system — the button is not just hidden, the API will reject the request."*

---

## PART 5 — TECHNICAL TALKING POINTS

If your supervisor asks technical questions, use these answers:

**"What database did you use?"**
> *"PostgreSQL hosted on Supabase. I used Supabase's Row Level Security for data isolation and the service-role client on the backend to enforce access control at the application layer, not just the database layer."*

**"How did you handle authentication?"**
> *"JWT tokens issued by Supabase Auth. The backend manually decodes each token on every request and checks the user's role before processing anything. The role is stored in a custom users table, not just the JWT claim."*

**"How is the role-based access enforced?"**
> *"Each route has an `authorize()` middleware function that checks the decoded role from the JWT. For example, only the Dean can add assessors. If any other role tries to call that API, they get a 403 immediately — the controller never runs."*

**"What is the publication scoring formula?"**
> *"It follows the NUC guidelines. Each publication type has a base score — 3 for journal articles, 4 for refereed books. If you are the sole or lead author you get 100% of the score; co-authors get 80%. The system sums all scores and calculates the Publication Points using the C-value formula (C = 60 for Associate Professor targeting Full Professor)."*

**"How does file storage work?"**
> *"Files are stored in Supabase Storage. Publication files go into a public bucket — the URL is stored in the database and served directly by Supabase's CDN. Meeting minutes use a private bucket with signed URLs that expire after 60 minutes for security."*

**"How many API endpoints does the system have?"**
> *"The system has 13 route files covering: authentication, appraisals, publications, external assessors, meeting minutes, promotions, notifications, council, registry, HOD, A&PC, dean, and admin. There are over 50 individual API endpoints."*

---

## PART 6 — IF SOMETHING BREAKS

Stay calm. Use these recovery lines:

| Problem | Recovery |
|---|---|
| Page won't load | Say "Let me refresh" — press F5. If still broken, open localhost:3000 in a new tab |
| Login fails | Double-check password is `Demo@123`. If Caps Lock is on, turn it off |
| Backend API error | Say "The backend has logged the error — let me show you the data is in the database" then show the Supabase table directly |
| 403 error appears | *Use it as a demo point* — "This is the role-based access control working exactly as designed" |
| Data not showing | Hard refresh: Ctrl + Shift + R |

---

## QUICK REFERENCE CARD

```
WORKFLOW ORDER
Staff submits → HOD assesses → Staff validates/disputes →
Registry validates → College Board reviews → A&PC reviews →
[PFQ + External Assessors if Senior Lecturer / Associate Prof] →
Council decides → Completed
```

```
EXTERNAL ASSESSOR RULES (system enforced)
Initial stage:  max 3 total (2 internal + 1 external)
PFQ trigger:    need ≥ 2 positive initial reports
Final stage:    max 6 (all external: 2 international + 4 national)
VC selects:     exactly 3 (1 international + 2 national)
Interview done: need ≥ 2 positive from VC-selected assessors
```

```
DEMO LOGIN SEQUENCE (recommended order)
1. Staff      assocprof.demo@crawford.edu.ng
2. HOD        hod.cs@crawford.edu.ng
3. Dean       dean@crawford.edu.ng
4. Registry   registry@crawford.edu.ng
5. A&PC       apc@crawford.edu.ng
6. VC         vc@crawford.edu.ng
7. Council    council@crawforduniversity.edu.ng
8. Admin      admin@crawford.edu.ng

All passwords: Demo@123
```
