# Personal Expense Tracker

A private, mobile-first Progressive Web App (PWA) that provides real-time personal spending analytics, interactive charts, and automated expense capture from Indian bank debit SMS messages.

> **CRITICAL ARCHITECTURAL ASSUMPTION**:  
> **The PWA never reads SMS itself (browsers cannot do this due to operating system sandbox restrictions).**  
> Instead, an Android automation app ([MacroDroid](https://macrodroid.com)) runs on your phone, captures incoming bank debit SMS notifications, and securely POSTs them to the application's `/api/ingest` webhook with an authentication token header.

---

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19, TypeScript strict mode)
- **Database & Auth**: Supabase (PostgreSQL 15+, Auth with Email + Password, Row-Level Security, Atomic Stored Functions)
- **Styling**: Tailwind CSS (Optimized for 390px mobile viewport, dark mode default, min 44px touch targets)
- **Charts**: Recharts (Daily spend bar chart, category donut, MoM comparison)
- **Service Worker / PWA**: Serwist (App Shell & hashed static caching ONLY; zero caching of financial API endpoints)
- **In-App Offline Store**: IndexedDB / React Query Persister (Purged completely on sign-out)
- **Testing**: Vitest (Unit & integration test suite)
- **Validation**: Zod (Runtime payload and environment schemas)
- **Hosting**: Vercel (Edge network & serverless API routes)

## CLI Tools Included

The project includes **Supabase CLI** and **Vercel CLI** locally in `devDependencies`:
- **Supabase CLI**: `npx supabase <command>` (e.g. `npx supabase login`, `npx supabase link`)
- **Vercel CLI**: `npx vercel <command>` (e.g. `npx vercel login`, `npx vercel deploy`)

---

## External Services Setup Guide

### 1. Prerequisites (Local Environment)
Install Git and Node.js LTS using `winget` in Windows PowerShell:
```powershell
winget install --id Git.Git -e --source winget
winget install --id OpenJS.NodeJS.LTS -e --source winget
```
*Note: Restart your terminal after installation so that `git`, `node`, and `npm` are added to your PATH.*

---

### 2. Supabase Setup Checklist
1. Visit [supabase.com](https://supabase.com) and create a **New project**.
2. Select your closest region (e.g. `ap-south-1` Mumbai) and enter a strong database password.
3. Open **Project Settings** -> **API**:
   - Copy **Project URL** (`https://<project-ref>.supabase.co`).
   - Copy **anon public key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`).
   - Copy **service_role secret key** (`SUPABASE_SERVICE_ROLE_KEY`).
4. Open **SQL Editor** in your Supabase dashboard:
   - Run [`supabase/migrations/20261004000001_create_schema.sql`](file:///d:/ET_V1/supabase/migrations/20261004000001_create_schema.sql).
   - This provisions all tables, seeds canonical categories, creates the atomic `process_ingested_message` function, and enables Row-Level Security (RLS) on all tables.
5. Open **Authentication** -> **Providers** -> **Email**:
   - Verify Email provider is **Enabled**.
   - **IMPORTANT**: Disable the toggle **"Allow new users to sign up"** (permanently blocks public signups).
6. Open **Authentication** -> **Users**:
   - Click **Add user** -> **Create user**.
   - Enter your email address and a strong password. This is your single owner account.
7. Open **SQL Editor** and run [`supabase/migrations/20261004000002_lockdown_owner_rls.sql`](file:///d:/ET_V1/supabase/migrations/20261004000002_lockdown_owner_rls.sql) to bind RLS policies to authenticated sessions.

#### RLS Verification Test (Definition of Done)
Execute this command in your terminal to verify that unauthenticated public requests cannot access any rows:
```bash
curl -i "https://<your-project-ref>.supabase.co/rest/v1/expenses" \
  -H "apikey: <NEXT_PUBLIC_SUPABASE_ANON_KEY>"
```
- **Expected Result**: HTTP `200 OK` with an empty array `[]` (or `401 Unauthorized`). Zero rows are accessible without authentication.

---

### 3. Local Configuration
1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
2. Populate `.env.local` with your credentials:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase Anon Key
   - `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase Service Role Key
   - `INGEST_SECRET_TOKEN` = A random 32+ character secret token (256-bit hex)
   - `ALLOWED_SENDER_PATTERN` = (Optional regex e.g. `FEDBNK` or leave empty to accept any sender)

> **SECURITY RULE**: Never paste keys or passwords into chat or commit `.env.local` to git.

---

### 4. GitHub Setup Checklist
1. Go to [github.com/new](https://github.com/new).
2. Name the repository: e.g. `expense-tracker` (or `et-v1`).
3. Set visibility to **Private**.
4. Leave "Add a README" and ".gitignore" **unchecked** (already present locally).
5. Push this codebase:
   ```bash
   git init
   git add .
   git commit -m "chore: scaffold repo, database migrations, and auth skeleton"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```

---

### 5. Vercel Deployment Checklist
1. Visit [vercel.com/new](https://vercel.com/new) and import your private GitHub repository.
2. In the **Environment Variables** section, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `INGEST_SECRET_TOKEN`
   - `ALLOWED_SENDER_PATTERN` (optional)
3. Click **Deploy**.
4. Once deployed, verify that visiting `https://<your-vercel-app>.vercel.app` redirects to `/login` and permits you to sign in with your owner credentials.

---

## Canonical Categories

1. **Food & Dining** (`#F97316`, `utensils`)
2. **Groceries** (`#10B981`, `shopping-cart`)
3. **Shopping** (`#EC4899`, `shopping-bag`)
4. **Bills & Utilities** (`#3B82F6`, `zap`)
5. **Travel & Fuel** (`#8B5CF6`, `car`)
6. **Health & Medical** (`#EF4444`, `heart-pulse`)
7. **Entertainment** (`#F59E0B`, `film`)
8. **Personal/Other** (`#6B7280`, `user`)
9. **Transfers (People)** (`#06B6D4`, `arrow-right-left`)

*Default*: Unmatched expenses default to **Uncategorised** (`null`), never to *Personal/Other*.

---

## Running Locally

Once dependencies are installed:
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run unit tests
npm test

# Type-check TypeScript
npm run typecheck
```
