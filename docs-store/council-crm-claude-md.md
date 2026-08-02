# Council & Stakeholder CRM — Build Conventions

This is an internal S-Move tool to log calls, emails and plans with key contacts
(councils, partners), each with an outcome and a planned next step, so the team
stays on the same page. It will be reviewed and taken live by another developer
(Alex), so **follow these conventions exactly** to keep it easy to integrate.

## Golden rules
- **Ask before installing new dependencies or changing the stack.** Keep it boring and standard.
- **Never commit secrets.** All keys go in a `.env` file that is listed in `.gitignore`.
- **Do NOT set up git or Railway deployment.** Build and run locally only. Go-live is handled separately.
- **Use your own free Supabase project.** Sign up (it's free) and create a throwaway project — walk the developer through it step by step; you can't click the site for them. It is isolated with no production/customer data, so experiment freely; do not connect to any other database. When it's ready, Alex ports the tables into the live project.

## Stack (match the house style — do not substitute)
- **Backend:** Node.js + Express. A single `server.js` is fine to start.
- **Frontend:** plain HTML + CSS + vanilla JS served by the Node server. No React/Next/build tooling unless asked.
- **Database:** Supabase (Postgres), on the developer's own free account (see Golden rules).

## Supabase & security model (important)
- The **browser never talks to Supabase directly** and never sees any Supabase key.
- The browser calls **your Node server**; the Node server talks to Supabase using the **service-role key** (kept in `.env`, server-side only).
- **Every table has Row Level Security (RLS) turned ON.** Even though the server uses the service role, RLS-on is required as defence-in-depth. Write the `enable row level security` statement for every table in the schema.
- Put the full database schema in a single **`schema.sql`** file in the repo root, so the whole data model can be reviewed at a glance. Include RLS statements in it.
- **All Supabase details come from env vars** (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) — never hard-coded — so the app can be re-pointed at the live project on handover with zero code changes.

## Data conventions (every table)
- `id` (uuid, primary key, default gen_random_uuid())
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())
- **Soft delete only:** a `deleted_at` (timestamptz, nullable) column. **Never hard-delete rows.** "Deleting" sets `deleted_at`; queries filter out non-null `deleted_at`.

## Suggested data model (adjust with Alex) — prefix every table `outreach_`
The prefix keeps them tidy and collision-free when Alex ports them into the shared live project.
- `outreach_contacts` — the key people/organisations (name, organisation, role, email, phone, council/area, priority, why_they_matter, source_url, confirm_before_contacting bool, notes)
- `outreach_interactions` — one row per call/email/meeting (contact_id FK, type [call|email|meeting|note], summary, occurred_at, outcome, logged_by)
- `outreach_emails` — sent/received emails (contact_id FK, direction [sent|received], subject, body, occurred_at)
- `outreach_next_steps` — planned follow-ups (contact_id FK, description, due_date, status [open|done], owner)

## Auth
- A simple shared login is fine for a small trusted team (a single password check against an env var, or a basic staff login). Keep it simple; do not build a full account system unless asked.

## Deliverables to hand back
1. The project folder (source).
2. `schema.sql` — the full, RLS-enabled schema.
3. A short `README.md` — how to run locally, and a list of the API endpoints.
4. A `.env.example` listing every environment variable needed (with placeholder values, no real secrets).

## Deployment note (for reference — you do NOT do this)
When Alex takes it live on Railway, outbound network calls must be forced to IPv4.
You don't need to add this; just don't build anything that would conflict with it.
