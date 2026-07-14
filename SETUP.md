# Setup Guide — Crawford University Staff Appraisal System

This guide gets the system running locally from a clean machine. The stack is:
**React (frontend)** + **Node/Express (backend)** + **self-hosted PostgreSQL**.

## Prerequisites

- **Node.js ≥ 18** and npm ≥ 9 — [nodejs.org](https://nodejs.org)
- **PostgreSQL** (any recent version; developed against PostgreSQL 18) — [postgresql.org/download](https://www.postgresql.org/download/)
  - During install, set and remember a password for the `postgres` superuser.
  - **On Windows**: the installer bundles **pgAdmin 4**, a GUI for browsing the database — no separate install needed.
  - **On Windows**: if the "postgresql-x64-XX" service fails to start after install ("Error 3: the system cannot find the path specified"), the service registration is broken — the simplest fix is to start Postgres directly instead of via the Windows service:
    ```
    "C:\Program Files\PostgreSQL\<version>\bin\pg_ctl.exe" start -D "C:\Program Files\PostgreSQL\<version>\data" -l "C:\Program Files\PostgreSQL\<version>\data\log\manual_start.log"
    ```
    Run this (in a normal, non-administrator terminal) any time Postgres isn't already running.

## 1. Clone the repo

```
git clone https://github.com/Eltimios/crawford-appraisal-system.git
cd crawford-appraisal-system
```

## 2. Create the database

Using `psql` (adjust the path on Windows if it's not on your PATH):

```
psql -U postgres -c "CREATE DATABASE crawford_appraisal;"
psql -U postgres -d crawford_appraisal -f database/standalone-schema.sql
```

This creates all 11 tables with the correct schema, constraints, and the `system_settings` defaults. It does **not** insert any staff/appraisal data — that's the next step.

## 3. Configure the backend

```
cd backend
npm install
```

Copy `.env.example` to `.env` and fill in your own values:

```
cp .env.example .env
```

At minimum, set:
- `DATABASE_URL=postgres://postgres:<your_postgres_password>@localhost:5432/crawford_appraisal`
- `JWT_SECRET=` — any long random string (this signs login tokens; don't reuse the example value)

The email (`EMAIL_*`) variables are only needed if you want outgoing notification emails to actually send — the app runs fine without them.

## 4. Seed demo data

```
node seed.js
```

This wipes and repopulates the `users` and `appraisal_deadlines` tables with realistic demo accounts across every role (see the credentials table below). **Do not run this against real staff data** — it deletes existing rows first.

## 5. Configure the frontend

```
cd ../frontend
npm install
cp .env.example .env
```

The defaults (`REACT_APP_BACKEND_URL=http://localhost:5000`) work as-is for local development — no changes needed unless the backend is running somewhere other than `localhost:5000`.

## 6. Run it

Two terminals:

```
cd backend
npm start
```

```
cd frontend
npm start
```

The frontend opens at **http://localhost:3000** and talks to the backend at `http://localhost:5000`. Postgres must be running before you start the backend (see the troubleshooting note above if the Windows service won't start).

## Demo login credentials

Every seeded account uses the password **`Demo@123`**. Log in with either the email or the Staff ID shown.

| Email | Role |
|---|---|
| `admin@crawford.edu.ng` | Admin |
| `hr@crawford.edu.ng` | HR |
| `vc@crawford.edu.ng` | Vice Chancellor |
| `registry@crawford.edu.ng` | Registry |
| `dean.conas@crawford.edu.ng` | Dean (College of Natural and Applied Sciences) |
| `hod.cs@crawford.edu.ng` | HOD (Computer Science) |
| `hod.micro@crawford.edu.ng` | HOD (Microbiology) |
| `b.eze@crawford.edu.ng` | Staff — Academic |
| `c.nwachukwu@crawford.edu.ng` | Staff — Academic |
| `assocprof.demo@crawford.edu.ng` | Staff — Academic (Associate Professor, pre-filled with a full appraisal + 10 publications, ready for HOD/Dean/A&PC review) |
| `reportingofficer@crawford.edu.ng` | Reporting Officer |
| `a.obiora@crawford.edu.ng` | Non-Teaching — Junior |
| `b.fashola@crawford.edu.ng` | Non-Teaching — Senior (pre-filled with a full appraisal) |
| `apc@crawford.edu.ng` | A&PC |
| `apc.academic@crawford.edu.ng` | A&PC — Academic |
| `apc.junior@crawford.edu.ng` | A&PC — Non-Teaching Junior |
| `apc.senior@crawford.edu.ng` | A&PC — Non-Teaching Senior |
| `collegeboard@crawford.edu.ng` | College Board |

## Suggested walkthrough for a first look

1. Log in as `dean.conas@crawford.edu.ng` → **External Assessors** → find Dr. Funmilayo Okonkwo's card → expand it to see the Initial Assessment stage and add/record an assessor outcome.
2. Copy an assessor's portal link (chain-link icon) and open it in a new incognito tab to see the public, unauthenticated **External Assessor Portal** — grading + required PDF report upload.
3. Log in as `hr@crawford.edu.ng` → **Onboard New Staff** → **Bulk Upload** tab to see the Excel template-based bulk onboarding flow.
4. Log in as `b.fashola@crawford.edu.ng` → **My Assessment** to see a completed, submitted appraisal from the staff side.

## Notes for whoever picks this up next

- The **second (confidential) stage of professorial promotion assessment** — PFQ establishment and VC-selected final external assessors — is deliberately **not implemented in the system**; per university policy that stage is handled entirely on paper. Only the initial assessment stage is digital.
- The **University Council portal** is built but currently hidden (commented out in `backend/src/server.js` and `frontend/src/App.js`) — the appraisal workflow terminates at A&PC. Straightforward to re-enable if that decision changes.
- File uploads (publications, assessor reports) are stored on local disk under `backend/uploads/` — not committed to git, and not portable between machines. A fresh clone starts with no uploaded files until someone uploads new ones.
