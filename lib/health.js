'use strict';
// ── Deploy health monitor ─────────────────────────────────────────────────────
// Pings each product deploy on an interval, keeps current status in memory, and
// logs status TRANSITIONS (up↔down) to a table so we get a downtime history.
// Storage: the SMD Supabase project (SMD_SUPABASE_URL / SMD_SUPABASE_KEY — already
// set on SMT for brand assets). Table `service_health_events` (see SQL in comments).
// Live status works even before the table exists; the downtime log fills in once
// it does. All outbound forced to IPv4 (Railway IPv6 egress is broken).
//
// SQL to create the table (run once in the SMD Supabase project):
//   create table if not exists service_health_events (
//     id bigint generated always as identity primary key,
//     service text not null,
//     status text not null check (status in ('up','down')),
//     http_status int, response_ms int, detail text,
//     created_at timestamptz not null default now()
//   );
//   alter table service_health_events enable row level security;
//   create index if not exists idx_she_service_created on service_health_events(service, created_at desc);
const https = require('https');

const TABLE = 'service_health_events';
const CHECK_MS = 3 * 60 * 1000; // every 3 minutes

const SERVICES = [
  { key: 'smt', name: 'SMT — Corporate site & Hub', brand: 'SMT', url: 'https://smt.s-move.co.uk/healthz' },
  { key: 'smo', name: 'SMO — Removals app',          brand: 'SMR', url: 'https://app.s-move.co.uk/health' },
  { key: 'smd', name: 'SMD — Dealer',                brand: 'SMD', url: 'https://shop.s-move.co.uk/ping' },
];

const state = {};   // key -> { status, httpStatus, ms, detail, checkedAt }
let sb = null, tried = false, started = false;

function client() {
  if (tried) return sb;
  tried = true;
  const url = process.env.SMD_SUPABASE_URL, key = process.env.SMD_SUPABASE_KEY;
  if (url && key) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const ws = require('ws');
      sb = createClient(url, key, { auth: { persistSession: false }, realtime: { transport: ws } });
    } catch (e) { console.warn('[health] supabase init failed:', e.message); }
  }
  return sb;
}

function ping(url) {
  return new Promise(resolve => {
    const start = Date.now();
    const req = https.get(url, { family: 4, timeout: 8000 }, r => {
      r.resume(); // drain
      resolve({ ok: r.statusCode < 500, httpStatus: r.statusCode, ms: Date.now() - start });
    });
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, httpStatus: 0, ms: Date.now() - start, detail: 'timeout' }); });
    req.on('error', e => resolve({ ok: false, httpStatus: 0, ms: Date.now() - start, detail: e.message }));
  });
}

async function runChecks() {
  const c = client();
  for (const s of SERVICES) {
    const r = await ping(s.url);
    const status = r.ok ? 'up' : 'down';
    const prev = state[s.key] && state[s.key].status;
    state[s.key] = { status, httpStatus: r.httpStatus, ms: r.ms, detail: r.detail || null, checkedAt: new Date().toISOString() };
    if (c && prev !== status) { // transition (includes first known status)
      try { await c.from(TABLE).insert({ service: s.key, status, http_status: r.httpStatus, response_ms: r.ms, detail: r.detail || null }); }
      catch (e) { console.error('[health] log insert failed:', e.message); }
    }
  }
}

// Seed in-memory status from the last known DB event per service (survives restarts).
async function seed() {
  const c = client(); if (!c) return;
  try {
    const { data } = await c.from(TABLE).select('service,status,created_at').order('created_at', { ascending: false }).limit(300);
    const seen = {};
    (data || []).forEach(e => { if (!seen[e.service]) { seen[e.service] = true; state[e.service] = { status: e.status, httpStatus: null, ms: null, detail: null, checkedAt: e.created_at }; } });
  } catch (e) { /* table may not exist yet — fine */ }
}

async function init() {
  if (started) return; started = true;
  await seed();
  await runChecks();
  setInterval(() => runChecks().catch(() => {}), CHECK_MS);
}

function getCurrent() {
  return SERVICES.map(s => ({ ...s, ...(state[s.key] || { status: 'unknown', checkedAt: null }) }));
}

// Pair down→up events into incidents (most recent first). Ongoing = up_at null.
async function getIncidents(limit = 40) {
  const c = client(); if (!c) return [];
  try {
    const { data, error } = await c.from(TABLE).select('*').order('created_at', { ascending: true }).limit(1000);
    if (error || !data) return [];
    const open = {}, incidents = [];
    for (const e of data) {
      if (e.status === 'down') { if (!open[e.service]) open[e.service] = e; }
      else if (e.status === 'up' && open[e.service]) { incidents.push({ service: e.service, down_at: open[e.service].created_at, up_at: e.created_at, detail: open[e.service].detail }); open[e.service] = null; }
    }
    Object.keys(open).forEach(k => { if (open[k]) incidents.push({ service: k, down_at: open[k].created_at, up_at: null, detail: open[k].detail }); });
    incidents.sort((a, b) => new Date(b.down_at) - new Date(a.down_at));
    return incidents.slice(0, limit);
  } catch (e) { return []; }
}

function serviceName(key) { const s = SERVICES.find(x => x.key === key); return s ? s.name : key; }
function loggingEnabled() { return !!client(); }

module.exports = { init, getCurrent, getIncidents, serviceName, loggingEnabled, SERVICES };
