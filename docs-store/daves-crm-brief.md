# Task Brief — Council & Stakeholder Contact Tracker

**For:** Dave Sisson
**From:** Alex
**Purpose:** Your first real Claude Code build. A genuinely useful internal tool for S-Move Dealer (SMD) — not a throwaway exercise. Take your time and use it to learn how to work *with* Claude.

---

## Why this exists

For SMD we need to approach a lot of key people — economic development officers, BID/town-centre managers, portfolio councillors, business-gateway contacts — across several councils. Right now there's no shared, single place that tells us both:

- **Who** we're trying to reach and why they matter
- **How to reach them** (their contact details)
- **What's happened so far** — when we contacted them, how, and what came back
- **What's next** — whose turn it is and when to follow up

Without that, you and I duplicate effort, miss follow-ups, and can't catch each other up quickly. This app fixes that. It's the "single source of truth" for outreach so either of us can open it and instantly see where everything stands.

---

## The two halves of this task

There are deliberately **two** things to do here. The second is as important as the first.

### Half 1 — Build the app

A small web app that lets us:

1. **Keep a list of people to contact** — name, organisation, role, which council/area, why they matter, and a priority.
2. **Store their contact details** — email, phone, address, website/LinkedIn, and which is the best route in.
3. **Log every contact attempt** — one entry per interaction: date, method (email / phone / in-person / letter), who did it (you or me), a short summary, and the **outcome**.
4. **Log emails properly** — where contact was by email, keep a record of what was sent and what came back (subject, date, direction sent/received, and the message). Enough that either of us can read the thread without digging through our inboxes.
5. **Track status & next steps** — each person moves through a simple pipeline (e.g. *Not contacted → Contacted → Responded → Meeting → Won / Dead*), with a "next action" and a due date so nothing goes cold.
6. **Stay coordinated** — because we both point at the same shared database, whatever you log I see, and vice-versa.

Keep it an **MVP first**. Get the above working end-to-end before adding anything clever. Resist the urge to gold-plate.

### Half 2 — Get the people into it (this is the real learning bit)

**I'm deliberately not pasting the contacts into this brief.** Pulling them together is part of the exercise.

- The source is the **SMT Build system** (`smt.s-move.co.uk/build`, log in with your account). Open the **S-Move Dealer** project and read the **Go-to-market** panel — that's where our council/outreach thinking lives: which councils we're targeting, what we're asking them for, how we frame it, the named officers / BIDs / councillors, and the local champions. Use the **co-pilot** (the "Ask co-pilot" chat on `/build`) to help you find your way around and understand *who* matters and *why*.
- Then **verify before you load anyone in.** Council and BID roles change, so use **Claude's web search** in your coding session to confirm each person is still in post and their contact detail is current — the panel itself tells you to confirm roles before addressing anyone by name. This is good practice at directing Claude to research and cross-check.
- **Rules (don't skip):**
  - Only use **publicly available** sources (council / BID / business-gateway pages).
  - **Never invent a name or an email.** If no individual is listed, use the official **team inbox** and note that no individual was found.
  - Where a role can't be confirmed, **flag it in the app** as "confirm before contacting" rather than guessing.
  - Record where each detail came from (source URL) so we can trust it later.
- Load the verified people in as the starting dataset.

By the end you should have both a working tool *and* it populated with real, checked contacts.

---

## Ground rules for the build (house style — please match exactly)

These keep it easy for me to review and take live later:

- **Stack:** Node.js + Express backend, a single `server.js` to start. Plain HTML + CSS + vanilla JS on the front end, served by the Node server. **No React / Next / build tooling** unless you check with me first. Keep it boring and standard.
- **Database:** Supabase (Postgres) — on **your own free Supabase account**. Claude will walk you through signing up (it's free) and creating a project; it can't click the website for you, but it'll talk you through each step. This is *your* throwaway project — do NOT connect to any existing S-Move / customer database. There's no real data to protect in yours, so experiment freely. When it's ready I'll port the tables into our live project.
- **Name every table with an `outreach_` prefix** (`outreach_contacts`, `outreach_interactions`, `outreach_emails`, `outreach_next_steps`) — they'll eventually sit alongside our other tables, so the prefix keeps them tidy and collision-free.
- **Read all Supabase details from env vars** (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) — never hard-code them — so I can re-point the app at our live project on handover without touching the code.
- **Security model:** the browser **never** talks to Supabase directly and never sees a Supabase key. The browser calls your Node server; the server talks to Supabase using the **service-role key**, kept in a `.env` file that is git-ignored. Turn **Row Level Security ON for every table** (defence in depth) and include those statements in the schema.
- **Every table gets:** `id` (uuid, default `gen_random_uuid()`), `created_at`, `updated_at` (timestamptz, default `now()`), and a nullable `deleted_at`. **Soft-delete only — never hard-delete a row.** "Deleting" sets `deleted_at`; queries filter out rows where it's set.
- **Never commit secrets.** All keys live in `.env` (in `.gitignore`). Provide a `.env.example` with placeholders.
- **Don't set up git remotes or Railway deployment.** Build and run locally only — I'll handle go-live separately.
- There's a ready-made conventions file, `council-crm-CLAUDE.md`, that captures all of the above. Copy it into your project as `CLAUDE.md` and Claude will follow it automatically.

---

## How the database works (read this — it answers the obvious question)

Claude can write all the SQL, but **it can't click around the Supabase website for you** — creating the project and running the table SQL are things a person does in the browser. Claude will talk you through it. The flow:

1. **Claude walks you through creating your own free Supabase project** and copying its URL + service-role key into your `.env`.
2. **Claude writes the schema; you run it.** It puts the whole data model in one well-commented **`schema.sql`** (tables + RLS), and you paste that into **Supabase → SQL Editor → Run**. Doing this yourself once is worth it — it's the bit most people are unsure about.
3. **Build and test against your own project** until it all works.
4. **Hand it over and I port it across.** I run the same `schema.sql` in our live project and re-point the app at it. Because your code reads its Supabase details from env vars (never hard-coded), nothing in the code changes. That's the whole trick: agree the table names + variable names up front, and it slots straight in.

Put a short **"Database setup" section in the README** with the click-by-click (create project → copy URL + service-role key into `.env` → SQL Editor → paste `schema.sql` → Run), so anyone can repeat it in two minutes. If you change the schema later, update `schema.sql` and tell me what changed.

---

## How to actually work with Claude (tips for getting the most out of it)

> **★ Biggest tip — show Claude your screen.** Press **Win + Shift + S** to grab a screenshot of whatever you're asking about, then paste it into Claude's chat bar with **Ctrl + V**. Claude can *see* the image, which saves a huge amount of explaining. It works both ways too: Claude can look at what's on your screen and guide you through it, step by step. Setting up Supabase is the perfect example — keep snapping your screen and showing Claude, and it'll walk you through every stage. Alex uses this constantly — he even used it to show Claude exactly where to slot this tip into the document.

- **Open a terminal in your empty project folder and run `claude`.** Point it at this brief and the `CLAUDE.md` conventions file as your starting context.
- **Ask for a plan before any code.** Something like *"Read the brief and CLAUDE.md, then propose a plan and the data model — don't write code yet."* Review the plan, push back, then let it build.
- **Build in small steps and test each one** before moving on. Get the contact list working, then the interaction log, then the email log, then the status/next-step bits.
- **When something breaks, paste the actual error back to Claude** — it's very good at fixing from the real message. Don't try to hand-fix.
- **Use it for the research too:** *"Search the web for the current economic development officer at [council] and their public contact email, with the source URL."* Then have it help you load what you find into the app.
- **Don't paste real secrets into the chat** (service-role keys, passwords). Keep them in `.env`.
- **Ask Claude to explain anything you don't understand.** That's the whole point of this exercise — you learning the workflow, not just getting an app.

---

## What to hand back

1. The project folder (source code).
2. `schema.sql` — the full, RLS-enabled database schema.
3. `README.md` — how to run it locally, the "Database setup" steps above, and a list of the API endpoints.
4. `.env.example` — every environment variable it needs, with placeholder values (no real secrets).
5. The app **populated** with the real contacts you checked, sources noted.

**How to send it to me:** zip up the whole project folder, but **delete `node_modules/` and `.env` first** — `node_modules` is huge and I can rebuild it with `npm install`, and `.env` holds your keys and must never leave your machine. Send me the zip and I'll take it from there.

---

## Keep it in scope

**In:** the features in Half 1, a simple shared login (a single shared password checked against an env var is fine — don't build a full user-account system), and the researched contacts loaded in.

**Out (for now):** automatic email syncing from Gmail, notifications/reminders, fancy dashboards, deployment. We can add those once the core works. If you're tempted to add something, note it and ask me first.

There's no deadline — the goal is that you come out the other side comfortable driving Claude on a real build. Ask me anything as you go.

---

## Keeping your project on the dashboard

Your project now has its own **"Dave S"** tab in the `/build` dashboard, alongside SMO/SMD/etc. It follows the same format as the others (stage %, summary, architecture, a dated milestone log, and next steps). Keep a **`PROJECT-STATUS.md`** in your repo in that same shape — get Claude to update it whenever you finish a meaningful step (add a dated line to the top of the milestone log, adjust the stage % and "where we are" line). When you send me an update or the final zip, I'll sync it into `/build` so it always reflects where you're really at. That's the same living-doc habit every S-Move project follows.

---

## Ready to start? Paste this into Claude first

Open a terminal **in your (empty) project folder**, run `claude`, and paste the block below as your very first message. It primes Claude with how I'd like it to work with you.

> I'm Dave. This is one of my first Claude Code projects, so please act as a patient pair-programmer and teacher — explain what you're doing and why as we go, in plain language, and don't assume I know the jargon. Stop and check with me at each step rather than racing ahead.
>
> In this folder are two files: `CLAUDE.md` (the build conventions — follow them exactly) and `Dave S - Task Brief - Council Contact Tracker.md` (the task brief). Read both fully before doing anything else.
>
> Then, before writing any code, propose a short plan and the data model and wait for me to okay it. Work in small steps and let me test each one before moving on.
>
> Key things to hold onto as we build: it's a small Node + Express + vanilla-JS contact tracker backed by Supabase; I'll use my own free Supabase account, so walk me through creating it when we get there. Name every table with an `outreach_` prefix, read all Supabase keys from environment variables (never hard-code them), turn RLS on for every table, and use soft-deletes only (a `deleted_at` column, never a real delete). Don't set up git remotes or deploy anything — Alex handles go-live. Never print my secret keys into the chat.
>
> The people to load come from our internal `/build` system (I'll bring the details in) — when we add a contact, help me confirm their current role with a web search before we trust it. Also keep a `PROJECT-STATUS.md` updated as we go.
>
> Start by reading the two files, then tell me your plan.
