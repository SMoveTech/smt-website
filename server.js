// S-Move Technologies Ltd — corporate site + SMT hub
// Express server on Railway at smt.s-move.co.uk. Serves the marketing site AND is
// the SMT hub: it owns the cross-product lead-event spine (lead_events) that the
// product apps (SMO removals, SMD dealer, SMC canvass) post events to.
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const auth = require('./lib/build-auth');
const { renderDashboard, renderLogin, renderNotApproved, renderEnrolled, renderDevices, renderChangePassword, renderDocPage, renderTeamSetup, renderBrandLibrary, renderHealth, renderActivity } = require('./lib/build-render');
const buildStatus = require('./data/build-status');
const copilot = require('./lib/copilot');
const brandAssets = require('./lib/brand-assets');
const { zipStore } = require('./lib/zip');
const health = require('./lib/health');
const activity = require('./lib/activity');

// Flatten every project's docs into a lookup for the gated /build/doc/:id route.
const DOC_DIR = path.join(__dirname, 'docs-store');
const docIndex = {};
for (const pr of buildStatus.projects) {
  for (const d of (pr.docs || [])) docIndex[d.id] = { ...d, project: pr.name };
}

const app = express();
const PORT = process.env.PORT || 3000;

// Behind Railway's proxy — needed for Secure cookies + correct client IP (login throttle).
app.set('trust proxy', 1);

// SMT hub datastore (Supabase). Optional at boot so the marketing site still serves
// even before the hub DB is provisioned — hub endpoints return 503 until it is.
let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { createClient } = require('@supabase/supabase-js');
    // Provide a WebSocket transport for the realtime client — newer supabase-js needs one on
    // Node < 22 (else createClient throws "native WebSocket not found"). We never use realtime
    // (inserts/selects only), so this just satisfies the constructor; no socket is opened.
    const ws = require('ws');
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
      realtime: { transport: ws },
    });
    console.log('[smt-hub] Supabase connected');
  } else {
    console.warn('[smt-hub] Supabase env not set — hub endpoints inactive (marketing site still serves)');
  }
} catch (e) {
  console.warn('[smt-hub] Supabase init skipped:', e.message);
}

// Sensible security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Health check for Railway
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// Public system-status page (current health of each deploy; NO downtime log —
// the history stays gated at /build/health). /healthz above remains the bare probe.
app.get('/status', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.send(renderHealth(health.getCurrent(), null, null, { publicView: true }));
});

app.use(express.json({ limit: '256kb' }));

// ── SMT HUB: lead-event ingest ────────────────────────────────────────────────
// Key-protected. The product apps POST events here (append-only reporting spine).
function ingestKeyOk(req) {
  const provided = Buffer.from(String(req.headers['x-smt-key'] || ''));
  const expected = Buffer.from(String(process.env.SMT_INGEST_KEY || ''));
  return expected.length > 0 && provided.length === expected.length &&
    crypto.timingSafeEqual(provided, expected);
}

app.post('/api/events', async (req, res) => {
  if (!ingestKeyOk(req)) return res.status(403).json({ error: 'forbidden' });
  if (!supabase) return res.status(503).json({ error: 'hub_db_not_configured' });
  try {
    const b = req.body || {};
    const str = (v, n) => { const s = String(v == null ? '' : v).trim().slice(0, n); return s || null; };
    const row = {
      source:     str(b.source, 20),
      product:    str(b.product, 30),
      event_type: str(b.event_type, 60),
      channel:    str(b.channel, 20),
      ref:        str(b.ref, 120),
      contact:    str(b.contact, 160),
      meta:       (b.meta && typeof b.meta === 'object' && !Array.isArray(b.meta)) ? b.meta : {},
    };
    if (!row.event_type) return res.status(400).json({ error: 'event_type required' });
    const { data, error } = await supabase.from('lead_events').insert(row).select('id').single();
    if (error) throw error;
    res.json({ ok: true, id: data.id });
  } catch (e) {
    console.error('[smt-hub] event insert failed:', e.message);
    res.status(500).json({ error: 'insert_failed' });
  }
});

// ── Claude Code seat-activity ingest ──────────────────────────────────────────
// Staff Claude Code posts here on session start (SessionStart HTTP hook).
// Key-gated (Bearer SMT_ACTIVITY_KEY); logs who/project/model/when (not content).
app.post('/api/activity', async (req, res) => {
  if (!activity.keyOk(req)) return res.status(403).json({ error: 'forbidden' });
  const b = req.body || {};
  const cwd = String(b.cwd || '');
  const project = cwd ? cwd.replace(/[\\/]+$/, '').split(/[\\/]/).pop() : null;
  const user = String(req.headers['x-smt-user'] || '').slice(0, 60) || null;
  await activity.log({
    user_label: user,
    project: project ? project.slice(0, 120) : null,
    cwd: cwd.slice(0, 400) || null,
    session_id: String(b.session_id || '').slice(0, 120) || null,
    model: String(b.model || '').slice(0, 60) || null,
    source: String(b.source || '').slice(0, 20) || null,
  });
  res.json({ ok: true });
});

// ── SMT HUB: minimal protected event viewer ───────────────────────────────────
// Internal, low-sensitivity dashboard. ?key= matches the ecosystem pattern
// (SMD /preview, device-setup). Uses SMT_VIEW_KEY, falling back to the ingest key.
app.get('/hub', async (req, res) => {
  const expected = String(process.env.SMT_VIEW_KEY || process.env.SMT_INGEST_KEY || '');
  if (!expected || String(req.query.key || '') !== expected) return res.status(403).send('Forbidden');
  if (!supabase) return res.status(503).send('SMT hub database not configured yet.');
  try {
    const { data, error } = await supabase.from('lead_events')
      .select('*').order('created_at', { ascending: false }).limit(300);
    if (error) throw error;
    const esc = s => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const rows = (data || []).map(e => `<tr>
      <td>${esc(new Date(e.created_at).toLocaleString('en-GB'))}</td>
      <td>${esc(e.source)}</td><td>${esc(e.product)}</td>
      <td><b>${esc(e.event_type)}</b></td><td>${esc(e.channel)}</td>
      <td>${esc(e.ref)}</td><td>${esc(e.contact)}</td>
      <td><code>${esc(JSON.stringify(e.meta || {}))}</code></td></tr>`).join('');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>SMT Hub — Lead Events</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;background:#0b0e14;color:#e6e6e6;margin:0;padding:20px}
h1{font-size:18px;margin:0 0 14px}.wrap{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:12px}
th,td{border:1px solid #222;padding:6px 8px;text-align:left;vertical-align:top}
th{background:#131722;position:sticky;top:0}code{color:#8fbcff;word-break:break-all}
tr:nth-child(even){background:#0f131b}</style></head><body>
<h1>SMT Hub — Lead Events <span style="color:#888;font-weight:400">(latest ${(data || []).length})</span></h1>
<div class="wrap"><table><thead><tr><th>When</th><th>Source</th><th>Product</th><th>Event</th><th>Channel</th><th>Ref</th><th>Contact</th><th>Meta</th></tr></thead>
<tbody>${rows || '<tr><td colspan="8">No events yet.</td></tr>'}</tbody></table></div></body></html>`);
  } catch (e) {
    console.error('[smt-hub] /hub error:', e.message);
    res.status(500).send('Error loading events.');
  }
});

// ── Internal build-status dashboard ───────────────────────────────────────────
// Highly confidential (trade-secret) — TWO factors required: an ENROLLED device
// (device cookie, installed only via a one-time link or bootstrap key) AND a named
// login. Content is the living record in data/build-status.js, kept current in-repo.
auth.setSupabase(supabase);

const html = (res) => res.setHeader('Content-Type', 'text/html; charset=utf-8');

// Enrolment: consume a one-time link (?t=) or bootstrap key (?key=) on THIS machine.
app.get('/build/enroll', async (req, res) => {
  html(res); res.setHeader('Cache-Control', 'no-store');
  let deviceToken = null;
  if (req.query.t) deviceToken = await auth.enrollViaLink(String(req.query.t));
  else if (req.query.key) deviceToken = await auth.enrollViaBootstrap(String(req.query.key));
  if (!deviceToken) return res.status(403).send(renderNotApproved());
  auth.setDeviceCookie(res, deviceToken, req.secure);
  res.send(renderEnrolled());
});

// Login page — only shown on an approved device.
app.get('/build/login', async (req, res) => {
  html(res); res.setHeader('Cache-Control', 'no-store');
  if (!(await auth.deviceApproved(req))) return res.status(403).send(renderNotApproved());
  if (auth.currentUser(req)) return res.redirect('/build');
  res.send(renderLogin({ notConfigured: !auth.isConfigured() }));
});

app.post('/build/login', async (req, res) => {
  if (!(await auth.deviceApproved(req))) return res.status(403).json({ error: 'This machine is not approved.' });
  if (!auth.isConfigured()) return res.status(503).json({ error: 'Login not configured on the server.' });
  const ip = req.ip || 'unknown';
  if (auth.throttled(ip)) return res.status(429).json({ error: 'Too many attempts — wait a few minutes.' });
  const { u, p } = req.body || {};
  if (await auth.verifyPassword(u, p)) {
    auth.noteSuccess(ip);
    const user = String(u).toLowerCase();
    const mustChange = await auth.userMustChange(user);
    auth.setSessionCookie(res, auth.makeSession(user, mustChange), req.secure);
    return res.json({ ok: true, mustChange });
  }
  auth.noteFailure(ip);
  res.status(401).json({ error: 'Incorrect username or password.' });
});

app.post('/build/logout', (req, res) => {
  auth.clearSessionCookie(res, req.secure);
  res.json({ ok: true });
});

// Guard: require approved device AND valid session. If the user still owes a
// password change, funnel every route to /build/password until it's done.
async function requireDeviceAndSession(req, res, next) {
  if (!(await auth.deviceApproved(req))) { html(res); return res.status(403).send(renderNotApproved()); }
  const s = auth.sessionInfo(req);
  if (!s) return res.redirect('/build/login');
  if (s.mustChange && !req.path.startsWith('/build/password')) return res.redirect('/build/password');
  req.buildUser = s.user;
  next();
}

app.get('/build', requireDeviceAndSession, (req, res) => {
  html(res); res.setHeader('Cache-Control', 'no-store');
  res.send(renderDashboard(buildStatus, req.buildUser));
});

// Change own password (also the forced-change screen on first login / after a reset).
app.get('/build/password', requireDeviceAndSession, (req, res) => {
  html(res); res.setHeader('Cache-Control', 'no-store');
  const s = auth.sessionInfo(req);
  res.send(renderChangePassword({ user: req.buildUser, forced: !!(s && s.mustChange) }));
});

app.post('/build/password', requireDeviceAndSession, async (req, res) => {
  const { oldPass, newPass } = req.body || {};
  const result = await auth.changePassword(req.buildUser, oldPass, newPass);
  if (!result.ok) return res.status(400).json(result);
  // Re-issue the session without the must-change flag.
  auth.setSessionCookie(res, auth.makeSession(req.buildUser, false), req.secure);
  res.json({ ok: true });
});

// Device + user management (mint one-time link / revoke device / reset a user).
app.get('/build/devices', requireDeviceAndSession, async (req, res) => {
  html(res); res.setHeader('Cache-Control', 'no-store');
  const [devices, usersList] = await Promise.all([auth.listDevices(), auth.listUsers()]);
  res.send(renderDevices(devices, usersList, req.buildUser));
});

app.post('/build/devices/new', requireDeviceAndSession, async (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const label = String((req.body && req.body.label) || '').slice(0, 60) || null;
  const link = await auth.createEnrollLink(baseUrl, label, req.buildUser);
  res.json({ ok: true, url: link.url });
});

app.post('/build/devices/revoke', requireDeviceAndSession, async (req, res) => {
  const id = String((req.body && req.body.device_id) || '');
  if (!id) return res.status(400).json({ error: 'device_id required' });
  await auth.revokeDevice(id);
  res.json({ ok: true });
});

// Serve a technical document (HTML reading page or inline PDF) behind the gate.
app.get('/build/doc/:id', requireDeviceAndSession, (req, res) => {
  const d = docIndex[req.params.id];
  if (!d) return res.status(404).send('Document not found.');
  const file = path.join(DOC_DIR, d.file);
  if (!file.startsWith(DOC_DIR + path.sep) || !fs.existsSync(file)) return res.status(404).send('Document not found.');
  res.setHeader('Cache-Control', 'no-store');
  if (d.type === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${d.id}.pdf"`);
    return res.sendFile(file);
  }
  let body;
  try { body = fs.readFileSync(file, 'utf8'); } catch { return res.status(404).send('Document not found.'); }
  html(res);
  res.send(renderDocPage(d, body));
});

// Raw source download for a doc — the actual file a project's brief/CLAUDE.md
// needs to become on disk (e.g. "CLAUDE.md"), not the rendered HTML reading page.
app.get('/build/doc/:id/download', requireDeviceAndSession, (req, res) => {
  const d = docIndex[req.params.id];
  if (!d || !d.raw) return res.status(404).send('No raw file for this document.');
  const file = path.join(DOC_DIR, d.raw);
  if (!file.startsWith(DOC_DIR + path.sep) || !fs.existsSync(file)) return res.status(404).send('Document not found.');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${d.downloadName || d.raw}"`);
  res.sendFile(file);
});

// Admin recovery: reset another user's password → returns a temp password to hand over.
app.post('/build/users/reset', requireDeviceAndSession, async (req, res) => {
  const target = String((req.body && req.body.username) || '').toLowerCase();
  if (!target) return res.status(400).json({ error: 'username required' });
  const result = await auth.adminResetPassword(target, req.buildUser);
  if (!result.ok) return res.status(400).json(result);
  res.json({ ok: true, tempPassword: result.tempPassword });
});

// ── Build co-pilot: staff ask questions about the projects / how we build ──────
// Gated by the same device+login as /build. Grounded in the live build record +
// team guide. Needs ANTHROPIC_API_KEY in the environment.
app.post('/build/copilot', requireDeviceAndSession, async (req, res) => {
  const question = String((req.body && req.body.question) || '').trim();
  if (!question) return res.status(400).json({ error: 'Ask a question first.' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'Co-pilot is not configured yet (set ANTHROPIC_API_KEY).' });
  try {
    const answer = await copilot.ask(question, (req.body && req.body.history) || []);
    res.json({ answer });
  } catch (e) {
    console.error('[copilot] error:', e.message);
    res.status(500).json({ error: 'Co-pilot hit an error — try again in a moment.' });
  }
});

// ── Brand assets: logged-in gallery streamed from the private SMD bucket ───────
app.get('/build/brand', requireDeviceAndSession, async (req, res) => {
  html(res); res.setHeader('Cache-Control', 'no-store');
  if (!brandAssets.enabled()) return res.status(503).send('Brand library not configured yet (set SMD_SUPABASE_URL + SMD_SUPABASE_KEY).');
  try {
    const manifest = await brandAssets.listAssets();
    res.send(renderBrandLibrary(manifest, req.buildUser));
  } catch (e) {
    console.error('[brand] list failed:', e.message);
    res.status(500).send('Could not load brand assets.');
  }
});

app.get('/build/brand/file', requireDeviceAndSession, async (req, res) => {
  if (!brandAssets.enabled()) return res.status(503).send('Brand library not configured.');
  const p = String(req.query.path || '');
  try {
    const asset = await brandAssets.downloadAsset(p);
    res.setHeader('Content-Type', asset.contentType);
    res.setHeader('Cache-Control', 'private, max-age=300');
    if (req.query.dl) res.setHeader('Content-Disposition', `attachment; filename="${asset.filename}"`);
    res.send(asset.buffer);
  } catch (e) {
    res.status(e.message === 'unknown asset' ? 404 : 500).send(e.message === 'unknown asset' ? 'Not found.' : 'Error.');
  }
});

// ── Claude Code seat-activity log (gated) ─────────────────────────────────────
app.get('/build/activity', requireDeviceAndSession, async (req, res) => {
  html(res); res.setHeader('Cache-Control', 'no-store');
  const rows = activity.enabled() ? await activity.recent(200) : [];
  res.send(renderActivity(rows, req.buildUser, { configured: activity.configured() }));
});

// ── Deploy health dashboard (gated) ────────────────────────────────────────────
app.get('/build/health', requireDeviceAndSession, async (req, res) => {
  html(res); res.setHeader('Cache-Control', 'no-store');
  const services = health.getCurrent();
  const incidents = health.loggingEnabled() ? await health.getIncidents(60) : null;
  res.send(renderHealth(services, incidents, req.buildUser));
});

// ── Team: "Set up Claude Code" page + org CLAUDE.md download ───────────────────
// Behind the same device+login gate as the rest of /build — anyone who needs this
// file already has build access, so there's no reason to expose it separately.
app.get('/build/claude-setup', requireDeviceAndSession, (req, res) => {
  html(res); res.setHeader('Cache-Control', 'no-store');
  res.send(renderTeamSetup({ downloadUrl: '/build/claude-md', user: req.buildUser }));
});

app.get('/build/claude-md', requireDeviceAndSession, (req, res) => {
  const file = path.join(__dirname, 'SMT-CLAUDE.md');
  if (!fs.existsSync(file)) return res.status(404).send('Guide not found.');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="SMT-CLAUDE.md"');
  res.sendFile(file);
});

// Full setup bundle: CLAUDE.md + brand assets + README, as one ZIP. Lets a staff
// member install the guide AND get the logos locally in one download.
app.get('/build/claude-bundle', requireDeviceAndSession, async (req, res) => {
  try {
    const files = [];
    const guide = path.join(__dirname, 'SMT-CLAUDE.md');
    if (fs.existsSync(guide)) files.push({ name: 'CLAUDE.md', buffer: fs.readFileSync(guide) });

    let assetNote;
    if (brandAssets.enabled()) {
      try {
        const manifest = await brandAssets.listAssets();
        files.push({ name: 'smt-brand-assets/manifest.json', buffer: Buffer.from(JSON.stringify(manifest, null, 2)) });
        for (const a of (manifest.assets || [])) {
          const d = await brandAssets.downloadAsset(a.path);
          files.push({ name: 'smt-brand-assets/' + a.path, buffer: d.buffer });
        }
        assetNote = `${(manifest.assets || []).length} brand assets are included under smt-brand-assets/.`;
      } catch (e) { assetNote = `(brand assets could not be bundled this time: ${e.message})`; }
    } else {
      assetNote = '(brand assets not bundled — SMD storage is not configured on the server yet)';
    }

    // Design-system references (one .md per app that has one).
    try {
      const dsDir = path.join(__dirname, 'design-systems');
      for (const f of fs.readdirSync(dsDir)) {
        if (f.endsWith('.md')) files.push({ name: 'design-systems/' + f, buffer: fs.readFileSync(path.join(dsDir, f)) });
      }
    } catch (e) { /* none yet */ }

    // Ready-made settings hook — reports session activity (project/user/when).
    const settingsSnippet = {
      hooks: {
        SessionStart: [
          {
            matcher: 'startup',
            hooks: [
              {
                type: 'http',
                url: 'https://smt.s-move.co.uk/api/activity',
                headers: {
                  'Authorization': 'Bearer ' + (process.env.SMT_ACTIVITY_KEY || 'ASK-ALEX-FOR-THE-KEY'),
                  'X-SMT-User': 'REPLACE-WITH-YOUR-NAME',
                },
              },
            ],
          },
        ],
      },
    };
    files.push({ name: 'claude-settings.json', buffer: Buffer.from(JSON.stringify(settingsSnippet, null, 2)) });

    const readme = [
      'S-MOVE TECHNOLOGIES — Claude Code setup bundle',
      '===============================================',
      '',
      'This bundle contains:',
      '  - CLAUDE.md              The SMT team guide (how we build).',
      '  - smt-brand-assets/      Brand logos & graphics, by brand (smr/ smd/ smt/).',
      '  - design-systems/        Per-app design-system references for Claude (e.g. smd.md).',
      '  - claude-settings.json   A Claude Code hook that logs which project you work on.',
      '  - README.txt             This file.',
      '',
      'INSTALL (Windows):',
      '  1. Put CLAUDE.md in your Claude folder:  C:\\Users\\<your-name>\\.claude\\CLAUDE.md',
      '     (If one already exists, paste this content underneath what is there.)',
      '  2. Put the smt-brand-assets and design-systems folders alongside it:',
      '     C:\\Users\\<your-name>\\.claude\\smt-brand-assets\\',
      '     C:\\Users\\<your-name>\\.claude\\design-systems\\',
      '  3. Set up activity logging (see below) with claude-settings.json.',
      '  (Mac/Linux: ~/.claude/CLAUDE.md and ~/.claude/smt-brand-assets/)',
      '',
      'Then Claude Code reads CLAUDE.md automatically in every project, and can copy the',
      'right brand logo from smt-brand-assets/ into your work when needed.',
      '',
      'ACTIVITY LOGGING (claude-settings.json):',
      '  1. Open claude-settings.json and change "X-SMT-User" to your name (e.g. dave-s).',
      '  2. If you have NO ~/.claude/settings.json, save this file there as settings.json.',
      '     If you already have one, merge the "hooks" block into it (your Claude can do',
      '     this for you — just ask it to merge claude-settings.json into your settings).',
      '  This reports, at the start of each session, which PROJECT FOLDER you are working',
      '  in, your name, the model and the time — NOT the content of your work. It keeps the',
      '  team coordinated on who is working on what.',
      '',
      'OWNERSHIP: anything built using an SMT Claude account or seat is the property of',
      'S-Move Technologies Ltd. Sessions on SMT seats are activity-logged as described above.',
      '',
      assetNote,
      '',
      'Grab a fresh bundle from the build page whenever things are updated.',
    ].join('\n');
    files.push({ name: 'README.txt', buffer: Buffer.from(readme, 'utf8') });

    const zip = zipStore(files);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="smt-claude-setup.zip"');
    res.setHeader('Cache-Control', 'no-store');
    res.send(zip);
  } catch (e) {
    console.error('[bundle] failed:', e.message);
    res.status(500).send('Could not build the setup bundle.');
  }
});

// Per-project setup bundle: every doc that has a raw source file (task brief,
// project CLAUDE.md, etc.), zipped under the exact filenames the brief tells
// the developer to drop into their empty project folder.
app.get('/build/project-bundle/:key', requireDeviceAndSession, (req, res) => {
  const project = buildStatus.projects.find(p => p.key === req.params.key);
  if (!project) return res.status(404).send('Project not found.');
  const docs = (project.docs || []).filter(d => d.raw);
  if (!docs.length) return res.status(404).send('No downloadable files for this project yet.');
  try {
    const files = [];
    for (const d of docs) {
      const file = path.join(DOC_DIR, d.raw);
      if (!fs.existsSync(file)) continue;
      files.push({ name: d.downloadName || d.raw, buffer: fs.readFileSync(file) });
    }
    const fileList = docs.map(d => `  - ${d.downloadName || d.raw}  (${d.title})`).join('\n');
    const readme = [
      `${project.name} — project setup files`,
      '',
      'Drop these files straight into your empty project folder, then open a terminal',
      'there and run "claude". Point Claude at these files as your starting context —',
      'the task brief tells you exactly how to kick off the first session.',
      '',
      fileList,
    ].join('\n');
    files.push({ name: 'README.txt', buffer: Buffer.from(readme, 'utf8') });
    const zip = zipStore(files);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${project.key}-setup.zip"`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(zip);
  } catch (e) {
    console.error('[project-bundle] failed:', e.message);
    res.status(500).send('Could not build the project bundle.');
  }
});

// Static assets (1 hour cache; HTML revalidates)
app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html'],
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  },
}));

// 404 -> friendly page (falls back to home)
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`S-Move Technologies site + hub listening on port ${PORT}`);
  // Start the deploy-health monitor (pings each product every few minutes).
  health.init().catch(e => console.error('[health] init failed:', e.message));
});
