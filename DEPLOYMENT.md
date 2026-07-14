# Deploying to cPanel

This covers taking the app from "runs locally" (see `SETUP.md`) to live on a cPanel host.
Written for the standard cPanel setup: **PostgreSQL Databases** tool + **Setup Node.js App**
(EA-4 Node.js Selector / Passenger). Exact menu names/wording can vary slightly by host —
adapt as needed.

## What you'll end up with

- A **PostgreSQL database** on the cPanel server, loaded with the schema (no real data yet —
  see `SETUP.md` for the demo seed, or onboard real staff fresh once it's live).
- The **backend** (Node/Express) running as a cPanel "Node.js App," proxied through Passenger.
- The **frontend** (React) built into static files and served from a domain or subdomain.
- The two talking to each other over HTTPS, with CORS configured for the real domain.

Decide your domain layout before starting — e.g.:
- Frontend: `appraisal.crawford.edu.ng` (or the main domain)
- Backend API: `api.crawford.edu.ng` (a subdomain)

Two subdomains is the simplest setup and what this guide assumes.

---

## 1. Create the database

cPanel → **PostgreSQL Databases**:

1. Create a database (e.g. `cpaneluser_appraisal` — cPanel usually prefixes the name with your account username automatically).
2. Create a database user with a strong password.
3. Add that user to the database with **ALL PRIVILEGES**.
4. Note the exact database name, username, and password — cPanel typically shows the connection host as `localhost` when the app runs on the same server.

## 2. Load the schema

You need to run `database/standalone-schema.sql` against the new database. Two ways, depending on what's available:

**If you have SSH/terminal access:**
```
psql -U <db_user> -d <db_name> -h localhost -f database/standalone-schema.sql
```
(You'll need the repo uploaded to the server first — see step 4 — or you can `scp`/upload just this one file temporarily.)

**If you only have the cPanel web UI:**
- Look for **phpPgAdmin** in cPanel (often listed near PostgreSQL Databases). Open it, select the database, use its "SQL" / query tab, paste in the full contents of `database/standalone-schema.sql`, and run it.

Either way, verify it worked: you should see 11 tables (`users`, `appraisals`, `publications`, `notifications`, `promotions`, `external_assessors`, `meeting_minutes`, `audit_logs`, `appraisal_deadlines`, `system_settings`, `departments`).

## 3. Set up the backend as a Node.js App

cPanel → **Setup Node.js App** → **Create Application**:

- **Node.js version**: 18 or higher (check what's offered — the app requires ≥18)
- **Application mode**: Production
- **Application root**: the folder where you'll upload the backend code (e.g. `crawford-backend`)
- **Application URL**: your chosen API subdomain (e.g. `api.crawford.edu.ng`)
- **Application startup file**: `src/server.js`

After creating it, cPanel gives you a command to "enter" the app's virtual environment (something like `source /home/<user>/nodevenv/crawford-backend/18/bin/activate && cd /home/<user>/crawford-backend`).

### Upload the code
Upload the contents of this repo's `backend/` folder into the application root you set above (via cPanel File Manager, SSH `git clone` + copy, or FTP). You do **not** need to upload `node_modules/` — you'll install it on the server.

### Install dependencies
In the cPanel Node.js App page, there's usually a **"Run NPM Install"** button — use it. (Or, via SSH, activate the virtual environment as shown above and run `npm install`.)

### Set environment variables
In the same cPanel Node.js App page, there's an environment variables section. Set:

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgres://<db_user>:<db_password>@localhost:5432/<db_name>` |
| `JWT_SECRET` | a long random string (generate one — don't reuse the local dev one) |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://` + your frontend domain (e.g. `https://appraisal.crawford.edu.ng`) — this matters, CORS will reject requests from any other origin |

Leave `PORT` unset — cPanel/Passenger assigns this automatically and the app already reads `process.env.PORT`.

The `EMAIL_*` variables are optional (only needed if you want outgoing notification emails to actually send).

### Start it
Use the **Restart** button on the Node.js App page. Check the app's logs (also on that page) if it doesn't come up — the most common issues are a wrong `DATABASE_URL` or a Node version below 18.

### Verify
Visit `https://api.crawford.edu.ng/api/health` (your actual API domain) — it should return `{"status":"ok",...}`.

## 4. Build and deploy the frontend

The frontend is a static site once built — it does **not** need its own Node.js App, just regular file hosting.

**On your own machine** (or via SSH on the server), in the `frontend/` folder:

1. Edit `.env` (or create it from `.env.example`) and set:
   ```
   REACT_APP_BACKEND_URL=https://api.crawford.edu.ng
   ```
   (your real backend domain from step 3 — must be set **before** building, it gets baked into the static files)

2. Build:
   ```
   npm install
   npm run build
   ```
   This produces a `build/` folder.

3. Upload the **contents** of `build/` (not the folder itself) into the document root for your frontend domain — usually `public_html/` for the main domain, or `public_html/appraisal/` (or wherever cPanel points that subdomain) if using a subdomain. Use cPanel File Manager or FTP.

### Verify
Visit your frontend domain — you should see the login page, and logging in should work end-to-end.

## 5. File uploads

The backend stores uploaded files (publications, assessor reports) on disk under `backend/uploads/`. Make sure this folder exists in the application root and is writable by the app. It's created automatically on first upload, but if uploads fail with a permissions error, create it manually and check folder permissions (usually `755`).

Note: these files live only on the server's disk — they're not backed up by git and won't survive a server migration unless copied separately.

## 6. SSL

Use cPanel's **AutoSSL** (usually under Security) to get free HTTPS certificates for both the frontend and API domains. Both `DATABASE_URL`... no — both `FRONTEND_URL` and `REACT_APP_BACKEND_URL` above should use `https://` once SSL is active, and CORS will only work correctly if both sides agree on `https`.

## Post-deploy checklist

- [ ] `https://<api-domain>/api/health` returns `{"status":"ok"}`
- [ ] Frontend loads and the login page renders
- [ ] Can log in with a real or demo account
- [ ] File upload (e.g. a publication) works and the uploaded file can be viewed back
- [ ] Browser console has no CORS errors (if you see any, double check `FRONTEND_URL` on the backend matches the frontend's actual URL exactly, including `https://` and no trailing slash)

## If something's wrong

- **500 errors on login/any DB action** → check the Node.js App logs in cPanel; almost always a `DATABASE_URL` typo or the schema not having been loaded (step 2).
- **CORS errors in the browser console** → `FRONTEND_URL` on the backend doesn't exactly match the frontend's real URL.
- **Blank page / app won't load** → confirm you uploaded the *contents* of `build/`, not the `build/` folder itself, into the domain's document root.
- **Node.js App won't start** → check the Node version is ≥18, and that `npm install` actually completed (check for an `node_modules/` folder in the application root).
