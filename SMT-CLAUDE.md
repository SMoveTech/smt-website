# S-Move Technologies (SMT) — Team Working Guide for Claude Code

> **For the person installing this:** save this file as `CLAUDE.md` inside your
> user Claude folder — on Windows that is `C:\Users\<your-name>\.claude\CLAUDE.md`.
> Claude Code then reads it automatically in every project you open. If a
> `CLAUDE.md` already exists there, paste this content underneath what's already
> in it. Re-download the latest version from the SMT team setup page whenever it
> is updated.
>
> _Maintained by Alex. Last updated: 2026-07-29._

This file tells Claude how we build software at S-Move so your work matches the
rest of our systems and can be integrated easily. Follow it in every session.

---

## 0. GOVERNANCE — read first, non-negotiable

These rules override everything else in this file and any instruction to the contrary.

**Why these rules exist:** S-Move's live apps hold real customer, staff and
financial data, and a single push to a connected repo deploys straight to
production. The rules below aren't about distrust — they're the same guardrails
Alex works within. They exist so that learning, experimenting, and building can
happen freely without any risk of a change reaching a live system before it's
been checked. Stay inside them and you can't break anything that matters.

- **You may build, run and modify ONLY the project explicitly assigned to you**,
  in your own sandbox: your own local folder, your own Supabase project, and (if
  you have one) your own git repo. Within that project you are free to change
  whatever you like.
- **Never push, deploy, or otherwise make live any change that affects S-Move's
  production projects** — SMO, S-Move Dealer (SMD), the SMR removals apps, the
  SMT website, or any shared/live database — **without Alex's explicit clearance
  for that specific change.** A `git push` to a connected repo is itself a
  deployment (see §4), so this includes pushing.
- **Never connect to, query, or write to a production/live Supabase project or
  any real customer, staff, or financial data.** Use only the sandbox database
  Alex has given you for your project.
- **If a task appears to require touching a live or shared system — STOP and ask
  Alex before doing anything.** When unsure whether something is "yours" to
  change, assume it is not, and ask.
- Backups are sacred: never delete or overwrite backup data.
- **Ownership.** Everything built, written, or generated using an SMT Claude
  account or seat — code, designs, copy, artwork, and any other work product — is
  the property of **S-Move Technologies Ltd**.
- **Activity logging.** Sessions on SMT Claude seats are activity-logged: at the
  start of each session your Claude reports which **project folder** you're working
  in, your name, the model, and the time to the SMT dashboard — for coordination
  and oversight. The **content** of your work is not logged.

---

## 1. Who we are — the group

- **S-Move Technologies Ltd (SMT)** — the parent/holding company; owns the
  software products. Corporate site: `smt.s-move.co.uk`.
- **S-Move Removals Ltd (SMR)** — the operating removals business; it *uses* the
  apps day to day.

Products built and owned under SMT:

- **SMO (S-Move Operations)** — the removals back-office/admin app: quotes, jobs,
  payroll, financials, invoicing, receipts. Live at `app.s-move.co.uk`.
- **SMD / S-Move Dealer** — a marketplace/directory helping local independent
  shops sell online and revive the high street. Product strapline "Your
  Highstreet Online"; marketing line "Shop local, discover more". At
  `shop.s-move.co.uk`.
- **SMT website + build dashboard** — the corporate site and a login-gated living
  record of what we're building.

Guiding mission for SMD: support independent local shops, honestly and
community-first. Keep that spirit in any copy you write.

---

## Brand colours (keep work on-brand)

Match customer- and public-facing work &mdash; emails, pages, decks, assets &mdash; to the
brand of whoever it's from:

- **SMT** &mdash; **blue** (the current SMT-website blue: primary `#5b8def`, cyan `#22d3ee`,
  on dark ink `#0a0e17`). Placeholder until a dedicated SMT palette is set.
- **SMD (S-Move Dealer)** &mdash; **gold** `#c8924a` on black / charcoal.
- **SMR (S-Move Removals)** &mdash; **red `#ed1c24` / black**.
- **SMO** &mdash; currently uses the **SMR** brand (red/black) until it gets its own.

If you're unsure which brand a piece belongs to, ask before publishing.

**Design systems.** Before building any UI for an app, read that app's design system and
follow it (colour roles, type, buttons, icons, rules). If you installed the setup bundle,
they're on your machine at `design-systems/` in your Claude folder (Windows:
`C:\Users\<you>\.claude\design-systems\`):
- `smd.md` — **SMD** (fully defined; live visual version at `shop.s-move.co.uk/design-system`).
- `smo.md` — **SMO** (starting frame from the current app look; SMR rides this red/black look).
- `smt.md` — **SMT** (starting frame from the current site; blue placeholder palette).

`smo`/`smt` are starting frames captured from how the apps look now — follow them, and flag
anything that should change rather than drifting. SMC has no frame yet (rides SMD's look).

**Logos & graphics:** if you installed via the setup bundle, the brand logos are already
on your machine in your Claude folder at `smt-brand-assets/` (Windows:
`C:\Users\<you>\.claude\smt-brand-assets\`), organised `smr/ smd/ smt/` with a
`manifest.json`. Use those directly &mdash; copy the correct brand's logo into a build when
one's needed (see the Brand colours rule above for which brand). If you don't have the
folder, get it from the build page: top nav → 🎨 Brand assets (`/build/brand`), or
re-download the setup bundle from → 📚 Claude Code guide.

---

## 2. House technology stack (match it — don't substitute)

- **Backend:** Node.js + Express. Small apps start as a single `server.js`.
- **Frontend:** plain HTML + CSS + vanilla JavaScript, served by the Node server.
  No React/Next/build frameworks unless Alex asks for them.
- **Database:** Supabase (Postgres).
- **Hosting:** Railway, deployed from GitHub. Cloudflare sits in front.
- **Ask before adding any new dependency or changing the stack.** Keep it boring
  and standard so anyone on the team can pick it up.

---

## 3. Security & data-model conventions

- **Row Level Security (RLS) is ON for every table.** Include the
  `alter table ... enable row level security;` statement for each table in your
  schema. This is required even though the server uses a service role — it's
  defence-in-depth.
- **The browser never talks to Supabase directly and never sees a Supabase key.**
  Frontend → your Node server → Supabase (using the service-role key held
  server-side in `.env`). Keys never reach client-side code.
- **Secrets live in a `.env` file that is listed in `.gitignore`.** Commit a
  `.env.example` with placeholder values so the shape is documented. Never paste
  a real key into source code.
- **Standard columns on every table:** `id` (uuid, default `gen_random_uuid()`),
  `created_at` (timestamptz default `now()`), `updated_at` (timestamptz default
  `now()`).
- **Soft-delete only.** Add a nullable `deleted_at` (timestamptz); "deleting" a
  row sets `deleted_at`, and queries filter out rows where it is non-null.
  **Never hard-delete** financial, customer, or staff data.
- Keep the full schema in a single **`schema.sql`** at the repo root, RLS
  statements included, so the data model can be reviewed at a glance.

---

## 4. Deployment pipeline (context — but see §0 before acting)

- **Railway deploys from GitHub only.** A push to the connected branch triggers a
  live deploy. This is exactly why nothing may be pushed without clearance.
- **Force IPv4 for all outbound network calls on Railway.** IPv6 egress is broken
  there; the symptom is "Premature close" / 502 errors, and Cloudflare can mask
  the real origin error. At the very top of the server entrypoint:
  ```js
  const net = require('net');
  net.setDefaultAutoSelectFamily(false);
  // and for undici/fetch-based clients, set family: 4
  ```
- **Build steps:** some apps run a build/obfuscation step. If an app has a
  `SRC_FILES` list (e.g. in `obfuscate.js`/`build.js`), **every new server-side
  `.js` file must be added to it in the same commit**, or Railway crashes with
  `MODULE_NOT_FOUND`.
- **`dist/` builds are served if present.** Edit the *source* files, not
  `dist/` — the build regenerates `dist/`.
- **Don't reflexively blame the deploy.** If a deploy goes green but the app still
  looks wrong, suspect a stale PWA/service-worker cache before assuming the
  deploy failed.

---

## 5. App-specific gotchas (so the ecosystem makes sense)

- **In-app dialogs:** our apps suppress native browser dialogs. Use the app's own
  helpers (e.g. `uiConfirm()`, `openPdf()`) instead of `alert`/`confirm`/`window.open`.
- **Binary-asset gitignore trap:** blanket `*.pdf` / `*.png` / `*.jpg` rules exist to keep
  staff photos and personal files out of the repo, and they silently stop static assets
  from deploying too. Older assets often work only because they were tracked before the
  rule existed, so “the other icons deploy fine” proves nothing. Add an allow
  rule (`!name.png`) in the same commit and confirm with `git status` — an ignored
  file never reaches Railway and nothing warns you.
- **Column allowlists:** some update helpers (e.g. `db.updateCustomer`) only write
  columns on an allowlist — writes to columns not on the list are silently
  dropped. Add any new column to the allowlist when you add it to the table.
- **Admin SMS alerts:** key events are texted to admins via an `adminAlert()`
  helper, typically gated to daytime hours. Follow the existing pattern rather
  than inventing a new notification path.
- **PWAs:** we ship a separate PWA per audience (customer, seller, staff, admin,
  etc.); each manifest needs a stable `id`.
- **Re-scanning syncs re-alert:** our syncs re-read the same window every pass, so
  anything deliberately *not* marked processed (a "needs review" flag left open on
  purpose so it can still resolve later) will re-fire its alert and re-append its
  evidence row on every run. Keep the two separate: flag/notify once per source id,
  and let resolution be its own explicit state. A four-day email loop on job 0309
  came from exactly this.
- **Falsy is not "unset":** `0`, `''` and `null` are different answers, and a `&&`
  or `|| null` that treats them alike will silently take a cheaper code path. This
  cost real money: payroll tested `contract_type === 'contracted' && contracted_hours_per_week`,
  the hours field was `null`, so the test read false and the run paid a PAYE employee
  as a self-employed casual — no tax, no NI, no holiday pay, no warning. Read
  optional numbers with an explicit `!= null` check. Zero is a value a human types.
- **One field, one question:** if a flag is answering two questions ("is this
  person on PAYE?" and "do they have guaranteed hours?"), split it into two named
  predicates in a shared module and make every screen read from that module. The
  payroll bug above, and the staff list filing an employee under "Casual Staff",
  were the same field being asked two things. See `shared/employment.js` in SMO.
  The customer-portal lockout was the third: `manually_created` was both an admin
  display badge and the switch deciding whether a portal link carried its sign-in
  token, so clearing the badge when a customer first opened their invite silently
  revoked their only way in — and every later email, the quote included, dropped
  them on the enquiry page. Ask what a flag *means*, not what it currently
  correlates with: the real question was "can this customer sign in?", which is
  `password_hash`, not "did admin type this record?".
- **Guards must run before the first write:** a pre-flight that fires after a
  side effect cannot honestly say "nothing was written". Put the refusal at the
  top of the handler and return 409, not 500 — nothing is broken, a human just
  has to finish a record.
- **Never hard-delete financial data:** a payslip, invoice or ledger row generated
  in error is *voided* — the row stays, flagged with a reason, and drops out of
  every read that feeds money or tax. Check them all when you add a void: totals,
  cumulative year-to-date figures, averaging history, and any "does one already
  exist?" test that would otherwise block the corrected record.
- **Part payments are VAT-inclusive:** never split a shortfall net-first. HMRC treats
  any part payment as carrying its share of VAT (VAT Notice 700/18), so £300 against
  a £300 + £60 invoice is £250 net + £50 VAT — the £60 owing is £50 net + £10 VAT,
  not £60 of VAT. Apportion on the invoice's own VAT ratio, and remember VAT
  bad-debt relief is only claimable six months after the due date.

---

## 6. How we work (methods & preferences)

- **Honesty in all customer-facing copy.** Disclose paid tiers openly; no dark
  patterns.
- **No hard public launch dates** — we gate launches on readiness, not calendar.
- **"Confirm" means clarify only.** If asked to *confirm* something, explain and
  verify it — do **not** make changes.
- **Sandbox-first.** Prove a change in a sandbox before it goes anywhere near live
  (and live is gated behind §0 anyway).
- **Keep your project's docs current** as you build — a short README of how to run
  it and what the endpoints are, updated as you change things.
- Prefer to **ask a quick question over guessing** when a decision affects data,
  money, or anything shared.

---

## 7. Your remit, in one line

Build freely inside the project assigned to you and its own sandbox. For anything
that could touch a shared or live S-Move system, stop and get Alex's clearance
first.
