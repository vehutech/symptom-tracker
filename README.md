# FUL Health Services — Hospital Management System

Federal University Lokoja, University Health Services. Next.js + Drizzle +
Postgres, deployed on Netlify. The functional core is the **Patient Health &
Symptom Tracker**.

## What it does

| # | Requirement | Where it lives |
|---|---|---|
| 1 | Record new symptoms and body changes before the next appointment | `/tracker/new` → `components/tracker-form.tsx` |
| 2 | Symptom, severity (1–5), date, short description | `lib/validation.ts` → `trackerEntrySchema` |
| 3 | Basic measurements — temperature and weight | same form, `measurement` entry kind |
| 4 | Patients view previous entries | `/tracker`, `/dashboard` |
| 5 | History of symptoms and body changes | `tracker_entries` table, grouped by month in the UI |
| 6 | Authorised doctors/nurses view the tracker during consultation | `/staff/patients/[id]`, guarded by `requireClinician()`, every read written to `record_access_log` |
| 7 | Summary of what changed since the last appointment | `lib/summary.ts` → `SummaryPanel` |
| 8 | Tracker stored as part of the medical record | consultation notes save the reviewed tracker window (`reviewed_from/to/entry_count`) |

Around the tracker: patient registration and sign-in, appointment requests and
cancellation, a clinic schedule, patient search, and clinician consultation
notes.

## Stack

- **Next.js 16** (App Router, server actions) + TypeScript + Tailwind v4
- **Drizzle ORM** on Postgres (Neon or any pooled Postgres URL)
- **motion** for the interface animation, **lucide-react** for icons
- Sessions: scrypt password hashes + an HMAC-signed httpOnly cookie (no auth
  dependency)
- **Netlify** via `@netlify/plugin-nextjs`

## Setup

```bash
npm install
cp .env.example .env     # fill in the database URL and SESSION_SECRET
```

The connection string is read from `DATABASE_URL`, `NETLIFY_DATABASE_URL`
(injected automatically by Netlify DB) or `POSTGRESQL_URL` — first one found
wins, so a Netlify DB needs no extra configuration on the platform.

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 1. Apply the schema to the cloud database first

Deploying before the DDL exists takes the app down, so run it first:

```bash
psql "$DATABASE_URL" -f drizzle/schema.sql     # idempotent, safe to re-run
```

or paste `drizzle/schema.sql` into the Neon SQL editor. Verify:

```sql
SELECT table_name FROM information_schema.tables
 WHERE table_schema = 'public' ORDER BY table_name;
-- appointments, consultation_notes, patients, record_access_log,
-- staff_profiles, tracker_entries, users
```

### 2. Seed demo accounts (optional)

```bash
npm run seed
```

Creates `doctor@fulokoja.edu.ng`, `nurse@fulokoja.edu.ng` and
`student@fulokoja.edu.ng` (password from `SEED_PASSWORD`), with three weeks of
tracker history for the student.

### 3. Run

```bash
npm run dev      # http://localhost:3000
npm run check    # runs the tracker-summary assertions
npm run build
```

## Deploying to Netlify

1. Push the branch — the Netlify git integration builds it. Do not use the CLI.
2. Set `SESSION_SECRET` in **Site settings → Environment variables**. A Netlify
   DB already provides `NETLIFY_DATABASE_URL`; for any other Postgres set
   `DATABASE_URL` to its **pooled** connection string. Environment variables are
   read at build time — add them before the build and re-deploy after a change.
3. Run `drizzle/schema.sql` against that database before the first deploy.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Local development server |
| `npm run build` | Production build |
| `npm run check` | Assertions for the summary logic in `lib/summary.ts` |
| `npm run db:generate` | Regenerate SQL from `lib/schema.ts` after a schema change |
| `npm run db:push` | Push the schema straight to `DATABASE_URL` |
| `npm run seed` | Seed clinic staff and the demo patient |

## Structure

```
app/
  page.tsx                     landing
  login/  register/            authentication
  (portal)/                    signed-in shell (sidebar, role-aware nav)
    dashboard/                 patient home + summary since last visit
    tracker/  tracker/new/     history and entry form
    appointments/              request, list, cancel
    staff/                     patient search + clinic stats
    staff/schedule/            appointments from today onward
    staff/patients/[id]/       consultation view + note + access log
lib/
  schema.ts  db.ts             Drizzle schema and lazy pooled client
  auth.ts  password.ts         sessions, guards, scrypt hashing
  validation.ts                Zod schemas — every write validates here first
  queries.ts  actions.ts       reads and server actions
  summary.ts                   the "since last appointment" summary
components/                    brand, shell, forms, charts, motion primitives
drizzle/schema.sql             idempotent DDL to run before deploying
```

## Design

Colours and the crest come from the university portal at
[ug.fulokoja.edu.ng](http://ug.fulokoja.edu.ng/): navy `#49668f`, deep navy
`#26374f`, teal `#45aebd`, gold `#e8a33d`, on a `#fbfdff` surface, set in
Nunito. Severity uses a single-hue ordinal ramp with monotonic lightness and
always shows its number and label, so it stays readable for colourblind users
and in print. Motion respects `prefers-reduced-motion`.
