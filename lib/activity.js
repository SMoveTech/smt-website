'use strict';
// ── Claude Code seat-activity log ─────────────────────────────────────────────
// Each staff Claude Code session fires a SessionStart HTTP hook to POST /api/activity.
// We record who / which project folder / model / when — NOT the content of the work.
// Storage: SMD Supabase project (SMD_SUPABASE_URL / SMD_SUPABASE_KEY, already on SMT).
// Auth: Bearer SMT_ACTIVITY_KEY. Table `claude_activity` (see SQL in comments).
//
// SQL (run once in the SMD Supabase project):
//   create table if not exists claude_activity (
//     id bigint generated always as identity primary key,
//     user_label text, project text, cwd text,
//     session_id text, model text, source text,
//     created_at timestamptz not null default now()
//   );
//   alter table claude_activity enable row level security;
//   create index if not exists idx_ca_created on claude_activity (created_at desc);
const crypto = require('crypto');

let sb = null, tried = false;
function client() {
  if (tried) return sb;
  tried = true;
  const url = process.env.SMD_SUPABASE_URL, key = process.env.SMD_SUPABASE_KEY;
  if (url && key) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const ws = require('ws');
      sb = createClient(url, key, { auth: { persistSession: false }, realtime: { transport: ws } });
    } catch (e) { console.warn('[activity] supabase init failed:', e.message); }
  }
  return sb;
}
function enabled() { return !!client(); }

// Validate the Authorization: Bearer <SMT_ACTIVITY_KEY> header (constant-time).
function keyOk(req) {
  const expected = String(process.env.SMT_ACTIVITY_KEY || '');
  if (!expected) return false;
  const hdr = String(req.headers['authorization'] || '');
  const provided = hdr.startsWith('Bearer ') ? hdr.slice(7) : '';
  const a = Buffer.from(provided), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function configured() { return !!process.env.SMT_ACTIVITY_KEY; }

async function log(row) {
  const c = client(); if (!c) return;
  try { await c.from('claude_activity').insert(row); }
  catch (e) { console.error('[activity] insert failed:', e.message); }
}

async function recent(limit = 150) {
  const c = client(); if (!c) return [];
  try {
    const { data } = await c.from('claude_activity').select('*').order('created_at', { ascending: false }).limit(limit);
    return data || [];
  } catch (e) { return []; }
}

module.exports = { enabled, configured, keyOk, log, recent };
