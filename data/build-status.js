// ─────────────────────────────────────────────────────────────────────────────
// SMT BUILD STATUS — living record of every S-Move Technologies product build.
//
// THIS IS A LIVING DOCUMENT. It is maintained by Claude as part of the normal
// workflow: whenever we make a plan, a change, or add/remove a feature, this file
// is updated in the same commit so /build always reflects reality on deploy.
//
// Shape per project:
//   key, name, short, tagline
//   status:    live | beta | building | designed | parked
//   stagePct:  0-100 position along the pathway (rough)
//   stageLabel:short "where we are" line
//   summary:   1-2 sentence what-it-is
//   stack:     [ 'tech', ... ]
//   architecture: [ { h: 'Area', body: 'What it does / how it works' }, ... ]
//   milestones:   [ { date: 'YYYY-MM-DD', text: '...' }, ... ]  (newest first)
//   next:         [ 'planned next step', ... ]
//   refs:         [ { label, url }, ... ]
// ─────────────────────────────────────────────────────────────────────────────

// Larger SMD research datasets live in their own modules and are attached to the
// SMD project below (rendered by renderCompetitor / renderGoToMarket).
const smdCompetitorAnalysis = require('./smd-competitor-analysis').competitorAnalysis;
const smdGoToMarket = require('./smd-go-to-market').goToMarket;

// Canonical documentation set every app is measured against. Each project carries a
// `docCoverage` map: key -> { status:'have'|'partial'|'missing'|'na', docId?, note? }.
const docTemplate = [
  { key: 'overview',     name: 'Product Overview',                 group: 'Product' },
  { key: 'roadmap',      name: 'Roadmap & Status',                 group: 'Product' },
  { key: 'architecture', name: 'Technical Architecture',           group: 'Technical' },
  { key: 'datamodel',    name: 'Data Model / Schema Dictionary',   group: 'Technical' },
  { key: 'api',          name: 'API Reference',                    group: 'Technical' },
  { key: 'integrations', name: 'Integrations Reference',           group: 'Technical' },
  { key: 'env',          name: 'Environment & Config Reference',   group: 'Operations' },
  { key: 'deploy',       name: 'Deployment & Release Runbook',     group: 'Operations' },
  { key: 'ops',          name: 'Operations & Incident Runbook',    group: 'Operations' },
  { key: 'backup',       name: 'Backup & Disaster Recovery',       group: 'Operations' },
  { key: 'security',     name: 'Security Overview + Access Matrix', group: 'Security & Compliance' },
  { key: 'gdpr',         name: 'Data Protection / Privacy (GDPR)', group: 'Security & Compliance' },
  { key: 'testing',      name: 'Test Plan & QA Strategy',          group: 'Quality' },
  { key: 'userguides',   name: 'User Guides',                      group: 'Users & Team' },
  { key: 'devsetup',     name: 'Developer Onboarding / Local Setup', group: 'Users & Team' },
  { key: 'support',      name: 'Support / Troubleshooting / FAQ',  group: 'Users & Team' },
];

module.exports = {
  updated: '2026-07-29',
  docTemplate,

  projects: [
    // ── SMO ──────────────────────────────────────────────────────────────────
    {
      key: 'smo',
      name: 'S-Move Operations',
      short: 'SMO',
      tagline: 'Removals operations + admin platform',
      status: 'live',
      stagePct: 90,
      stageLabel: 'Live in production — pre-market (awaiting Scottish Enterprise grant to take to market)',
      summary: 'The removals back-office: quotes, jobs, customers, inventory, payroll and full financials, with AI and banking automation layered throughout. Used by S-Move Removals Ltd (SMR).',
      stack: ['Node / Express', 'Supabase (service-role, RLS)', 'Railway', 'Twilio SMS', 'Gmail API (HTTPS)', 'Stripe', 'Monzo API', 'Claude API'],
      architecture: [
        { h: 'Core admin', body: 'Quotes, jobs, customers, inventory, payroll and I&E financials in one console. Payroll hours come from staff_start_time (job_start_time is arrival-at-job, not shift start).' },
        { h: 'Monzo auto-sync', body: 'Friendly categories, notes preserved, pot transfers filtered, idempotent. Requires SCA re-auth roughly every 90 days. Operations imports SMR accounts only (allowlist) — one Monzo login exposes both SMR and SMT.' },
        { h: 'VAT', body: 'I&E carries gross/net/VAT columns, job-ref linking and Stripe batch reconciliation. VAT live from 1 Jul 2026 at standard 20%. A VAT Pot tab shows net VAT due vs the live Monzo pot plus buffer.' },
        { h: 'Receipt → VAT extraction', body: 'Monzo receipts land in Supabase Storage; Claude reads the VAT and auto-applies it to the ledger.' },
        { h: 'Bank reconcile', body: 'Matches Monzo income to jobs by job-ref + name and sets payment_status (dry-run by default).' },
        { h: 'AI layer', body: 'Quote price suggestion that explains itself and learns from past quotes; "Ask S-Move" in-console co-pilot (explain + point) with per-user text size, built for Dave.' },
        { h: 'Alerts', body: 'adminAlert() texts Alex + Dave on key events (new customer, quote accepted, call-me, messages, requests, inventory) within an 8am–9pm window.' },
        { h: 'Data-safety layer', body: 'Backup coverage + sync delete guard + soft-delete/purge + SMS watchdog. Never hard-delete financial data. Entity boundary 5 Jun, VAT boundary 1 Jul.' },
        { h: 'Access control', body: 'Hardened accountant login behind a device-invite gate (intended 2FA). Claude has a dev owner login (claude@s-move.co.uk).' },
        { h: 'Customer comms', body: 'Quotes, invoices and emails are sent by explicit admin button (no auto-send on status change), each with a PDF preview before sending, the paired customer SMS, a Gmail-API "landed in Sent" confirmation, and per-document sent-date tracking (sent_documents table). Company-account jobs defer email opt-out to the account, so a stale per-job opt-out no longer blocks a send.' },
        { h: 'Staff expenses / petty cash', body: 'Admin logs a staff out-of-pocket expense + receipt (Financials → Petty Cash). It posts to Income & Expenditure as expenditure immediately (category "Staff Reimbursement", receipt in the private receipts bucket) so the accountant sees it, and is reimbursed on the staff member\'s next payslip as a separate non-taxable line (wages + expenses = total paid). staff_expenses table.' },
        { h: 'Infra note', body: 'Railway IPv6 egress is broken — all outbound forced to IPv4: net.setDefaultAutoSelectFamily(false) disables Happy-Eyeballs at the TCP layer (covers googleapis/Gmail via node-fetch), plus a dedicated undici IPv4 agent for Anthropic and family:4 on the SMTP path. Separately, Cloudflare replaces any origin 5xx with its own Bad-Gateway page, so endpoints return HTTP 200 {success:false,message} for expected blocks/errors so the real reason reaches the UI.' },
      ],
      milestones: [
        { date: '2026-07-28', text: 'Staff petty-cash / expenses shipped: admin logs an expense + receipt → posts to Income & Expenditure as expenditure (for the accountant) and is reimbursed on the next payslip as a separate non-taxable line' },
        { date: '2026-07-28', text: 'Customer email reworked to button-only (no auto-send) with PDF preview, Gmail-API "Sent" verification + per-document sent-tracking; fixed IPv6/Happy-Eyeballs stall on Gmail/Twilio + Cloudflare 5xx masking' },
        { date: '2026-07-28', text: 'Admin fixes: job-card close bug, company-account standard job types + clickable job entries, inc-VAT quote entry, manual invoice description, company invoice logo + billing address, admin text-contrast boost' },
        { date: '2026-07-04', text: 'Ask S-Move co-pilot + per-user display settings live' },
        { date: '2026-07-02', text: 'Bank-transfer auto-reconcile built' },
        { date: '2026-07-01', text: 'VAT went live (standard 20%)' },
        { date: '2026-06-28', text: 'Admin SMS alerts + financial data-safety layer shipped' },
        { date: '2026-06-27', text: 'Monzo receipt→VAT extraction deployed; local services decommissioned (Railway-only)' },
        { date: '2026-06-14', text: 'server.js split refactor (pre-refactor-backup tag on GitHub)' },
        { date: '2026-06-10', text: 'Live DB wiped; migration to Supabase + RLS begun' },
      ],
      next: [
        'Security tab: admin login log, accountant access log, approved devices, IP colour coding',
        'Replace inventory hard-delete with a Withdraw action before launch (current delete is testing-only)',
        'Take to market once the Scottish Enterprise grant lands (never taken to market yet — £0 revenue is not a demand verdict)',
        'Retail / white-label SMO as a product for other removals firms — resume by stripping personal data ("RemovalDesk" name is dead)',
      ],
      refs: [
        { label: 'Live app', url: 'https://app.s-move.co.uk' },
        { label: 'Customer booking', url: 'https://app.s-move.co.uk/customer' },
        { label: 'AI booking line', url: 'tel:+447414140899' },
      ],
      docs: [
        { id: 'smo-tech-arch', title: 'Technical Architecture v2', type: 'html', file: 'smo-technical-architecture.html', note: 'Full system architecture — stack, 35-table DB, 258 APIs, 10 core workflows, AI, security', review: { status: 'current', reviewedOn: '2026-07-29', note: 'Verified: email→Gmail API, button-only sending, RLS confirmed on all tables' } },
        { id: 'smo-overview', title: 'Plain-Language Overview', type: 'html', file: 'smo-plain-overview.html', note: 'Non-technical explainer of how the platform works', review: { status: 'current', reviewedOn: '2026-07-29', note: 'Verified: button-only sending model, RLS confirmed on all tables' } },
        { id: 'smo-admin-guide', title: 'Admin Console — User Guide', type: 'html', file: 'smo-admin-guide.html', note: 'Rebuilt S-Move branded; current 16-tab console incl. Financials/VAT/Petty Cash + button-only email', review: { status: 'current', reviewedOn: '2026-07-29' } },
        { id: 'smo-customer-guide', title: 'Customer Portal — User Guide', type: 'html', file: 'smo-customer-guide.html', note: 'Rebuilt S-Move branded; quote assistant, accept/pay, requests, FAQ', review: { status: 'current', reviewedOn: '2026-07-29' } },
        { id: 'smo-staff-guide', title: 'Staff Portal — User Guide', type: 'html', file: 'smo-staff-guide.html', note: 'Rebuilt S-Move branded; shifts, finish-time, flex tasks, biometric sign-in', review: { status: 'current', reviewedOn: '2026-07-29' } },
        { id: 'smo-ops-runbook', title: 'Operations & Incident Runbook', type: 'html', file: 'smo-ops-runbook.html', note: 'Deploy/rollback, known failure modes + fixes, backups, alerts', review: { status: 'current', reviewedOn: '2026-07-28' } },
        { id: 'smo-env-config', title: 'Environment & Config Reference', type: 'html', file: 'smo-env-config.html', note: 'Every env var/secret and external endpoint', review: { status: 'current', reviewedOn: '2026-07-28' } },
        { id: 'smo-data-dictionary', title: 'Data Dictionary', type: 'html', file: 'smo-data-dictionary.html', note: 'All 35 tables — fields, relationships, purpose', review: { status: 'current', reviewedOn: '2026-07-28' } },
        { id: 'smo-data-protection', title: 'Data Protection / GDPR', type: 'html', file: 'smo-data-protection.html', note: 'Data inventory, rights, retention, processors — interim safe basis (longest retention assumed)', review: { status: 'review', reviewedOn: '2026-07-29', note: 'Safe interim basis adopted; 3 items in §9 need official sign-off post-funding (ICO reg, Supabase region, per-processor DPAs)' } },
        { id: 'smo-dpia-screening', title: 'DPIA Screening Assessment', type: 'html', file: 'smo-dpia-screening.html', note: 'Screening vs ICO high-risk criteria — outcome: full DPIA not mandatory at current scale', review: { status: 'current', reviewedOn: '2026-07-29' } },
        { id: 'smo-privacy-notice', title: 'Customer Privacy Notice (draft)', type: 'html', file: 'smo-privacy-notice.html', note: 'Customer-facing notice — DRAFT, needs review before publishing to the portal', review: { status: 'draft', note: 'Drafted 2026-07-29; publish to booking flow (Alex action) then link + flip to current' } },
        { id: 'smo-dev-setup', title: 'Developer Onboarding / Local Setup', type: 'html', file: 'smo-dev-setup.html', note: 'Clone, env, run, build, deploy', review: { status: 'current', reviewedOn: '2026-07-28' } },
      ],
      docCoverage: {
        overview:     { status: 'have', docId: 'smo-overview' },
        roadmap:      { status: 'have', note: 'this dashboard' },
        architecture: { status: 'have', docId: 'smo-tech-arch' },
        datamodel:    { status: 'have', docId: 'smo-data-dictionary', note: 'table-level; field-level TBD' },
        api:          { status: 'partial', note: 'key endpoints in architecture §5; full 258 not documented' },
        integrations: { status: 'partial', note: 'covered across architecture + env reference; no standalone doc' },
        env:          { status: 'have', docId: 'smo-env-config' },
        deploy:       { status: 'have', docId: 'smo-ops-runbook', note: 'Ops runbook §2–3' },
        ops:          { status: 'have', docId: 'smo-ops-runbook' },
        backup:       { status: 'have', docId: 'smo-ops-runbook', note: 'Ops runbook §6' },
        security:     { status: 'partial', note: 'architecture §8 + data-protection §6; no standalone access matrix' },
        gdpr:         { status: 'have', docId: 'smo-data-protection', note: 'interim safe basis; 5 items pending official sign-off post-funding' },
        testing:      { status: 'have', note: 'TEST_PLAN.md in repo' },
        userguides:   { status: 'have', docId: 'smo-admin-guide', note: 'Admin / Customer / Staff guides' },
        devsetup:     { status: 'have', docId: 'smo-dev-setup' },
        support:      { status: 'missing', note: 'could fold into user guides' },
      },
    },

    // ── SMD ──────────────────────────────────────────────────────────────────
    {
      key: 'smd',
      name: 'S-Move Dealer',
      short: 'SMD',
      tagline: 'Community high-street marketplace + directory',
      status: 'beta',
      stagePct: 60,
      stageLabel: 'Beta — community directory-first pivot; marketplace not yet open, no hard launch date (gate on readiness)',
      summary: 'A community-first directory and marketplace to revive the local high street by banding independent shops together. "Your Highstreet Online" / "Shop local, discover more."',
      stack: ['Node / Express', 'obfuscate.js build (SRC_FILES)', 'Supabase (wayqlbhdflyioacqbwtb)', 'Railway', 'Twilio SMS (via SMO number)', 'Gmail API (HTTPS)', 'Stripe (SMT account)', 'sharp (thumbnails)'],
      architecture: [
        { h: 'Directory-first', body: 'Community-wide directory lists ALL shops in one mixed catalogue; businesses "claim your listing". Sponsorship = sidebar discovery, never product ranking.' },
        { h: 'Discovery / ranking', body: 'Region/town soft filter + hard category filter + similar-items padding + filter-aware pill counts. Ranking is earned and un-buyable (views + votes), never paid boosts.' },
        { h: 'Sellers', body: 'All sellers register an account (no unauthenticated selling). Tabbed "My Shop" personalisation: own-delivery, listing order, colours, holiday mode (Phase 1 deployed).' },
        { h: 'SMD own stock', body: 'A special seller identified by SMOVE_SELLER_ID; internal stock is seller_id NULL or = SMOVE_SELLER_ID.' },
        { h: 'Sponsored sidebar', body: 'Earned ranking + Stripe subscriptions (~£49/mo), comp toggle, Pioneer badge, beta gate. Money routes to the SMT Stripe account.' },
        { h: 'Media', body: 'sharp generates 480px WebP thumbnails on upload with graceful fallback.' },
        { h: 'Email', body: 'All email moved to Gmail API over HTTPS (sends as alex@) because Railway blocks outbound SMTP — this fixed the zero-sign-ups issue (verify email was a hard gate).' },
        { h: 'PWAs', body: 'Five separate PWAs (shop / seller / canvass / staff / admin), each with a stable manifest id so names do not drift.' },
        { h: 'Analytics', body: 'page_visits table + /api/track/visit beacons feed the admin Data Monitor.' },
        { h: 'Build gotcha', body: 'Every new .js must be added to SRC_FILES in obfuscate.js in the same commit or Railway crashes (MODULE_NOT_FOUND).' },
      ],
      milestones: [
        { date: '2026-07-27', text: 'Go-to-market groundwork: competitor analysis (ShopAppy/Trouva) + council outreach plan + local champions map across the 4 Lothian councils (now live in the panels below)' },
        { date: '2026-07-23', text: 'First full AI cinematic advert complete (Veo + VO + captions + music)' },
        { date: '2026-07-19', text: 'Seller sign-up email fixed (Gmail API over HTTPS); SMD admin SMS alerts live' },
        { date: '2026-07-17', text: 'Community pivot: directory-first, list all shops, "claim your listing"' },
        { date: '2026-07-11', text: 'Coming-soon/403 gate rebuilt into single-source explainer + area carousels' },
        { date: '2026-07-05', text: 'Canvassing field app built (see Canvass project)' },
        { date: '2026-06-30', text: 'Location filtering + image thumbnails shipped' },
        { date: '2026-06-27', text: 'Dealer admin trust-proxy fix; local services decommissioned' },
      ],
      next: [
        'Community social forums (per area) — pre-seed each area with editorial directory posts before the marketplace opens; doubles as the "claim your listing" funnel. Full plan drafted 24 Jul (see refs).',
        'DECIDE the peer-selling guardrail before forum member-posting (Phase 2): community & discovery only vs classifieds — affects FCA/scam-dispute exposure',
        'Sponsored sidebar TODO: votes/hearts UI, business-view tracking, donations dunning, sponsor page',
        'Seller "My Shop" phase-2 backlog',
        'First fair conversion test now the sign-up funnel is fixed',
        'Go-to-market: approach the 4 Lothian councils (start East Lothian) + warm local champions (Scotland\'s Towns Partnership, Dunbar Trades\' Assoc, One Linlithgow BID, Dalkeith Means Business, Daniel Johnson MSP). Full plan + contacts in the Go-to-market panel below.',
      ],
      refs: [
        { label: 'Shop (beta)', url: 'https://shop.s-move.co.uk' },
        { label: 'Forums plan', url: 'file:///E:/Claude/SMD%20Community%20Forums%20Implementation%20Plan.pdf' },
        { label: 'Council outreach plan', url: 'file:///E:/Claude/SMD%20Council%20Outreach%20Plan.md' },
        { label: 'Local champions & allies', url: 'file:///E:/Claude/SMD%20Local%20Champions%20%26%20Allies.md' },
        { label: 'GitHub', url: 'https://github.com/SMovetech/smove-dealer' },
      ],
      docs: [
        { id: 'smd-plain-overview', title: 'Plain-Language Platform Overview', type: 'html', file: 'smd-plain-overview.html', note: 'Non-technical explainer: what SMD is, who uses it, directory-first + earned-ranking model, seller/shopper/canvassing journeys, security in plain terms', review: { status: 'current', reviewedOn: '2026-07-30' } },
        { id: 'smd-tech-arch', title: 'Technical Architecture', type: 'html', file: 'smd-technical-architecture.html', note: 'Stack, obfuscated-build gotcha, 5 PWAs + routes, core workflows, AI usage, security, backups', review: { status: 'current', reviewedOn: '2026-07-30' } },
        { id: 'smd-data-dictionary', title: 'Data Model / Schema Dictionary', type: 'html', file: 'smd-data-dictionary.html', note: 'Every live table grouped by area, RLS status per table, schema-drift flags (hand-created tables + dead migrations)', review: { status: 'current', reviewedOn: '2026-07-30' } },
        { id: 'smd-env-config', title: 'Environment & Config Reference', type: 'html', file: 'smd-env-config.html', note: 'Every env var by group, incl. legacy/unused vars flagged for cleanup', review: { status: 'current', reviewedOn: '2026-07-30' } },
        { id: 'smd-deploy-runbook', title: 'Deployment & Release Runbook', type: 'html', file: 'smd-deploy-runbook.html', note: 'Pipeline, the SRC_FILES rule, manual migration process, verifying a deploy, rollback', review: { status: 'current', reviewedOn: '2026-07-30' } },
        { id: 'smd-ops-runbook', title: 'Operations & Incident Runbook', type: 'html', file: 'smd-ops-runbook.html', note: 'Known failure modes + fixes, what monitoring exists (and what doesn\'t), self-healing behaviours', review: { status: 'current', reviewedOn: '2026-07-30' } },
        { id: 'smd-backup-dr', title: 'Backup & Disaster Recovery', type: 'html', file: 'smd-backup-dr.html', note: 'Backup schedule/retention; flags canvass-photos bucket not backed up and no restore script exists yet', review: { status: 'current', reviewedOn: '2026-07-30' } },
        { id: 'smd-dev-setup', title: 'Developer Onboarding / Local Setup', type: 'html', file: 'smd-dev-setup.html', note: 'Clone, env, run (node server.js, not npm start), build, deploy, local-dev gotchas', review: { status: 'current', reviewedOn: '2026-07-30' } },
        { id: 'smd-qr-stocksync', title: 'QR Stock-Sync — Plan & Canvassing Pack', type: 'pdf', file: 'smd-qr-stocksync.pdf', review: { status: 'review' } },
        { id: 'smd-sponsored-sidebar', title: 'Sponsored Sidebar & Hearts — Spec', type: 'pdf', file: 'smd-sponsored-sidebar.pdf', review: { status: 'review' } },
        { id: 'smd-scale-performance', title: 'Scale & Performance — Planning Doc', type: 'pdf', file: 'smd-scale-performance.pdf', review: { status: 'review' } },
        { id: 'smd-scaling-cost', title: 'Scaling & Cost Plan', type: 'pdf', file: 'smd-scaling-cost.pdf', review: { status: 'review' } },
        { id: 'smd-direct-checkout', title: 'Direct Checkout — Pre-Planning Brief', type: 'pdf', file: 'smd-direct-checkout.pdf', review: { status: 'review' } },
      ],
      competitorAnalysis: smdCompetitorAnalysis,
      goToMarket: smdGoToMarket,
      docCoverage: {
        overview:     { status: 'have', docId: 'smd-plain-overview' },
        roadmap:      { status: 'have', note: 'this dashboard' },
        architecture: { status: 'have', docId: 'smd-tech-arch' },
        datamodel:    { status: 'have', docId: 'smd-data-dictionary', note: 'live tables + RLS status (77/77 confirmed on via dashboard); schema-drift flags noted, several tables never migrated into source control' },
        api:          { status: 'partial', note: 'routes mapped in architecture §2.1; no full endpoint-by-endpoint reference' },
        integrations: { status: 'partial', note: 'Stripe/Twilio/Gmail/Monzo/Claude covered across architecture + env reference; no standalone doc' },
        env:          { status: 'have', docId: 'smd-env-config' },
        deploy:       { status: 'have', docId: 'smd-deploy-runbook' },
        ops:          { status: 'have', docId: 'smd-ops-runbook', note: 'no uptime/error monitoring service in place yet — flagged as a gap in the doc, not just documented around' },
        backup:       { status: 'have', docId: 'smd-backup-dr', note: 'flags 2 real gaps: canvass-photos bucket not in the daily storage backup, and no restore script exists yet (unlike SMO)' },
        security:     { status: 'partial', note: 'covered in architecture §6 (RLS confirmed on all 77 tables, service-role only access); no standalone access matrix' },
        gdpr:         { status: 'missing' },
        testing:      { status: 'missing' },
        userguides:   { status: 'missing', note: 'seller + shopper guides needed' },
        devsetup:     { status: 'have', docId: 'smd-dev-setup' },
        support:      { status: 'missing' },
      },
    },

    // ── CANVASS ────────────────────────────────────────────────────────────────
    {
      key: 'canvass',
      name: 'Canvass',
      short: 'SMC',
      tagline: 'Field canvassing app + shop recon',
      status: 'building',
      stagePct: 45,
      stageLabel: 'Built, not yet pushed — needs schema migration + seed before go-live',
      summary: 'A field PWA to visit and onboard independent shops for SMD: track visits and run AI shopfront-photo recon. Feeds the directory and the claim-your-listing funnel.',
      stack: ['PWA (/canvass)', 'Node / Express', 'Supabase', 'Claude vision (shopfront recon)'],
      architecture: [
        { h: 'Visit tracking', body: 'Field workers log shop visits; no-website shops are the top onboarding targets.' },
        { h: 'AI recon', body: 'Shopfront-photo recon produces a quick read on each shop to prime the visit.' },
        { h: 'Research base', body: 'Per-council Excel of independent shops across all 4 regions is complete — roughly 627 shops, of which ~336 have no website.' },
      ],
      milestones: [
        { date: '2026-07-05', text: 'Canvassing field app built (needs canvass_schema.sql + seed-canvass.js; not pushed)' },
        { date: '2026-07-05', text: 'Canvass research complete: 4 regions, ~627 shops (~336 no-website)' },
      ],
      next: [
        'Run canvass_schema.sql + node seed-canvass.js, then push to deploy',
        'Field-test the visit + recon flow',
        'Canvass Intelligence Engine (AI pre-call briefs) is parked as a potential 3rd SMT product until SMD self-funds',
      ],
      refs: [
        { label: 'Canvass research', url: 'file:///E:/Claude/Canvas%20Research/' },
      ],
      docCoverage: {
        overview:     { status: 'partial', note: 'summarised here; no standalone doc' },
        roadmap:      { status: 'have', note: 'this dashboard' },
        architecture: { status: 'partial', note: 'architecture bullets here; small app, keep light' },
        datamodel:    { status: 'partial', note: 'canvass_schema.sql defines it' },
        api:          { status: 'missing' },
        integrations: { status: 'na', note: 'shares SMD/Supabase + Claude vision' },
        env:          { status: 'missing' },
        deploy:       { status: 'missing', note: 'not yet pushed' },
        ops:          { status: 'na' },
        backup:       { status: 'partial', note: 'shared Dealer Supabase backup' },
        security:     { status: 'partial' },
        gdpr:         { status: 'missing', note: 'captures shop/visit data + photos' },
        testing:      { status: 'missing' },
        userguides:   { status: 'missing', note: 'field-worker guide needed' },
        devsetup:     { status: 'missing' },
        support:      { status: 'na' },
      },
    },

    // ── POS / STOCK ─────────────────────────────────────────────────────────────
    {
      key: 'pos',
      name: 'POS / Stock',
      short: 'POS',
      tagline: 'Phone-as-POS + unified stock-truth for small shops',
      status: 'designed',
      stagePct: 20,
      stageLabel: 'Researched & designed — not built; validate shop demand before build',
      summary: 'Turn a shop owner’s phone into a point of sale with a single source of stock-truth across online and physical selling, so nothing gets double-sold.',
      stack: ['(TBD)', 'Tap-to-Pay', 'Signed QR codes', 'Stripe'],
      architecture: [
        { h: 'Phone-as-POS', body: 'Own-the-sale checkout on the shop owner’s phone, Tap-to-Pay for card payments.' },
        { h: 'Stock-truth', body: 'One unified stock count across the online listing and the physical shop. A signed QR per item syncs both; scanning reserves stock (scan ≠ auto-sell, reserve-on-scan) to prevent double-selling.' },
        { h: 'Regulatory framing', body: 'Direct-from-business checkout was researched: Stripe Connect would keep SMD out of FCA scope. Decision: subscription-only, and validate demand before building.' },
      ],
      milestones: [
        { date: '2026-07-24', text: 'Design + phased plan documented (plan PDF in E:\\Claude)' },
      ],
      next: [
        'Validate real shop demand before any build',
        'Phase the build once demand is proven',
      ],
      refs: [],
      docs: [
        { id: 'pos-stock-research', title: 'Small Business Stock Management — Research Report', type: 'pdf', file: 'pos-stock-research.pdf', review: { status: 'review' } },
      ],
      docCoverage: {
        overview:     { status: 'have', docId: 'pos-stock-research', note: 'research report + design' },
        roadmap:      { status: 'have', note: 'this dashboard' },
        architecture: { status: 'partial', note: 'design bullets here; formal doc when it graduates to build' },
        datamodel:    { status: 'na', note: 'not built' },
        api:          { status: 'na' },
        integrations: { status: 'na' },
        env:          { status: 'na' },
        deploy:       { status: 'na' },
        ops:          { status: 'na' },
        backup:       { status: 'na' },
        security:     { status: 'na' },
        gdpr:         { status: 'na' },
        testing:      { status: 'na' },
        userguides:   { status: 'na' },
        devsetup:     { status: 'na' },
        support:      { status: 'na' },
      },
    },

    // ── DAVE S — CONTACT TRACKER ─────────────────────────────────────────────────
    {
      key: 'daves-crm',
      name: 'Council Contact Tracker',
      short: 'Dave S',
      tagline: 'Outreach contact tracker — Dave S\'s first Claude Code build',
      status: 'building',
      stagePct: 5,
      stageLabel: 'Briefed — Dave S\'s first Claude Code build; not started yet',
      summary: 'A shared tracker for SMD council & stakeholder outreach: who to contact, their details, every interaction and email logged, and the next step — so Alex and Dave stay coordinated and can catch up at a glance. Doubles as Dave\'s hands-on way to learn Claude Code.',
      stack: ['Node / Express', 'Vanilla HTML / CSS / JS', 'Supabase (Postgres, RLS)', 'Dave\'s own free Supabase project → ported to live on handover'],
      architecture: [
        { h: 'Contacts', body: 'outreach_contacts — the key people/orgs: name, organisation, role, council/area, priority, why they matter, source URL, and a confirm-before-contacting flag for unverified roles.' },
        { h: 'Interactions', body: 'outreach_interactions — one row per call/email/meeting: type, summary, date, outcome, and who logged it (Alex or Dave).' },
        { h: 'Emails', body: 'outreach_emails — sent/received emails per contact (direction, subject, body, date) so either of us can read the thread without digging through inboxes.' },
        { h: 'Next steps & status', body: 'outreach_next_steps — planned follow-ups with owner + due date; each contact runs a simple pipeline (Not contacted → Contacted → Responded → Meeting → Won / Dead).' },
        { h: 'Coordination', body: 'Both point at one shared database; a simple shared login. Soft-delete only, RLS on every table.' },
        { h: 'Data source', body: 'Seeded from the SMD Go-to-market panel contacts, each verified for current role via web search before loading.' },
      ],
      milestones: [
        { date: '2026-07-29', text: 'Project briefed. Task brief + build conventions (council-crm-CLAUDE.md) written. Model agreed: outreach_ tables, Dave builds against his own free Supabase, Alex ports the schema into the live project on handover.' },
      ],
      next: [
        'Dave: read the brief + CLAUDE.md, have Claude propose a plan + data model before any code',
        'Create own free Supabase project (Claude walks through it), run schema.sql, test locally',
        'Build the MVP in steps: contacts → interaction log → email log → status/next-steps',
        'Pull + verify the contacts from the SMD Go-to-market panel, load as seed data',
        'Hand over as a zip; Alex runs schema.sql in the live project + deploys',
      ],
      refs: [
        { label: 'Task brief', url: 'file:///E:/Claude/Dave%20S%20-%20Task%20Brief%20-%20Council%20Contact%20Tracker.md' },
        { label: 'Build conventions (CLAUDE.md)', url: 'file:///E:/Claude/council-crm-CLAUDE.md' },
      ],
      docs: [
        { id: 'daves-crm-brief', title: 'Task Brief — Contact Tracker', type: 'html', file: 'daves-crm-brief.html', note: 'The full build brief Dave works from — features, house rules, database flow, how to work with Claude', review: { status: 'current', reviewedOn: '2026-07-29' } },
      ],
      docCoverage: {
        overview:     { status: 'have', docId: 'daves-crm-brief', note: 'task brief' },
        roadmap:      { status: 'have', note: 'this dashboard' },
        architecture: { status: 'partial', note: 'planned bullets here + CLAUDE.md conventions' },
        datamodel:    { status: 'partial', note: 'outreach_ tables agreed; schema.sql to be written' },
        api:          { status: 'missing' },
        integrations: { status: 'na', note: 'none in the MVP (Gmail sync is out of scope)' },
        env:          { status: 'partial', note: '.env.example to list SUPABASE_URL / SERVICE_ROLE_KEY + login' },
        deploy:       { status: 'partial', note: 'Dave builds locally; Alex ports schema + deploys' },
        ops:          { status: 'na' },
        backup:       { status: 'na', note: 'inherits live Supabase backup once ported' },
        security:     { status: 'partial', note: 'RLS on all tables + shared login + soft-delete' },
        gdpr:         { status: 'missing', note: 'stores contact personal data — review before any wider use' },
        testing:      { status: 'missing' },
        userguides:   { status: 'na', note: '2-person internal tool' },
        devsetup:     { status: 'partial', note: 'README setup steps to be written' },
        support:      { status: 'na' },
      },
    },
  ],
};
