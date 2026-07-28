// ─────────────────────────────────────────────────────────────────────────────
// Auth for the internal /build dashboard. TWO factors, both required:
//   1. Device binding  — machine must be ENROLLED (signed device cookie), installed
//                         only via a one-time enrollment link or the bootstrap key.
//   2. Login           — named user + scrypt-hashed password → signed session cookie.
// An unenrolled machine never sees the login form.
//
// No external deps (Node crypto only). Device registry + one-time enroll tokens are
// persisted in Supabase when available (for listing + revocation + cross-instance
// single-use); an in-memory fallback keeps it working if the DB is briefly down.
//
// ENV:
//   SMT_BUILD_SECRET     — random ≥16-char secret; signs BOTH cookies (required)
//   SMT_BUILD_USERS      — "user:saltHex:hashHex,user2:..." (node scripts/hash-password.js)
//   SMT_BUILD_ENROLL_KEY — static bootstrap/break-glass key to enroll the first machine
// ─────────────────────────────────────────────────────────────────────────────
const crypto = require('crypto');

const SESSION_COOKIE = 'smt_build';
const DEVICE_COOKIE  = 'smt_build_dev';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;        // 12h
const DEVICE_TTL_MS  = 180 * 24 * 60 * 60 * 1000;  // 180d
const ENROLL_TTL_MS  = 24 * 60 * 60 * 1000;        // 24h
const SCRYPT_KEYLEN  = 64;

let _supabase = null;
function setSupabase(client) { _supabase = client; }

function secret() { return String(process.env.SMT_BUILD_SECRET || ''); }
function enrollKey() { return String(process.env.SMT_BUILD_ENROLL_KEY || ''); }

// ── User store: Supabase build_users (writable) with env SMT_BUILD_USERS fallback ──
function envUsers() {
  const out = {};
  for (const entry of String(process.env.SMT_BUILD_USERS || '').split(',')) {
    const [u, salt, hash] = entry.split(':').map(s => (s || '').trim());
    if (u && salt && hash) out[u.toLowerCase()] = { salt, hash, must_change: false };
  }
  return out;
}

// In-memory user store, seeded from env — used when Supabase is absent (local/test)
// or briefly down. Writable so change/reset work in that mode too.
let _memUsers = null;
function memUsers() {
  if (!_memUsers) {
    _memUsers = new Map();
    for (const [u, rec] of Object.entries(envUsers())) _memUsers.set(u, { ...rec });
  }
  return _memUsers;
}

async function loadUserRec(user) {
  const u = String(user || '').toLowerCase();
  if (!u) return null;
  if (_supabase) {
    try {
      const { data, error } = await _supabase.from('build_users')
        .select('username,salt,hash,must_change').eq('username', u).maybeSingle();
      if (error) throw error;
      return data ? { salt: data.salt, hash: data.hash, must_change: !!data.must_change } : null;
    } catch (e) { console.warn('[build-auth] loadUserRec fallback:', e.message); }
  }
  const m = memUsers().get(u);
  return m ? { salt: m.salt, hash: m.hash, must_change: !!m.must_change } : null;
}

function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(pw), salt, SCRYPT_KEYLEN);
  return { salt: salt.toString('hex'), hash: hash.toString('hex') };
}

// Persist a password to the writable store. Returns true on success (false if env-only).
async function writePassword(user, pw, mustChange, updatedBy) {
  const u = String(user || '').toLowerCase();
  const { salt, hash } = hashPassword(pw);
  if (_supabase) {
    try {
      const { error } = await _supabase.from('build_users').update({
        salt, hash, must_change: !!mustChange, updated_at: new Date().toISOString(), updated_by: updatedBy || u,
      }).eq('username', u);
      if (error) throw error;
      return true;
    } catch (e) { console.warn('[build-auth] writePassword failed:', e.message); return false; }
  }
  const m = memUsers();
  if (!m.has(u)) return false;
  m.set(u, { salt, hash, must_change: !!mustChange });
  return true;
}

// Readable temp password for admin resets.
function generateTempPassword() {
  const words = ['harbour', 'copper', 'meadow', 'lantern', 'granite', 'willow', 'ember', 'cobalt', 'thistle', 'ridge'];
  const w = () => words[crypto.randomInt(words.length)];
  const cap = s => s[0].toUpperCase() + s.slice(1);
  return `${cap(w())}-${w()}-${crypto.randomInt(1000, 9999)}`;
}

// Self-service change: verify current password, set a new one (clears must_change).
async function changePassword(user, oldPass, newPass) {
  if (!newPass || String(newPass).length < 8) return { ok: false, error: 'New password must be at least 8 characters.' };
  if (!(await verifyPassword(user, oldPass))) return { ok: false, error: 'Current password is incorrect.' };
  const ok = await writePassword(user, newPass, false, user);
  return ok ? { ok: true } : { ok: false, error: 'Could not save — user store not writable.' };
}

// Admin recovery: set a fresh temp password for another user, force change on next login.
async function adminResetPassword(targetUser, byUser) {
  const rec = await loadUserRec(targetUser);
  if (!rec) return { ok: false, error: 'No such user.' };
  const temp = generateTempPassword();
  const ok = await writePassword(targetUser, temp, true, byUser);
  return ok ? { ok: true, tempPassword: temp } : { ok: false, error: 'Could not save — user store not writable.' };
}

async function listUsers() {
  if (_supabase) {
    try {
      const { data, error } = await _supabase.from('build_users')
        .select('username,must_change,updated_at,updated_by').order('username');
      if (error) throw error;
      if (data && data.length) return data;
    } catch (e) { console.warn('[build-auth] listUsers fallback:', e.message); }
  }
  return [...memUsers().entries()].map(([username, r]) => ({
    username, must_change: !!r.must_change, updated_at: null, updated_by: 'mem',
  }));
}

function timingEqualHex(aHex, bHex) {
  const a = Buffer.from(String(aHex), 'hex');
  const b = Buffer.from(String(bHex), 'hex');
  if (a.length === 0 || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
function timingEqualStr(aStr, bStr) {
  const a = Buffer.from(String(aStr), 'utf8');
  const b = Buffer.from(String(bStr), 'utf8');
  if (a.length === 0 || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function verifyPassword(user, pass) {
  const rec = await loadUserRec(user);
  if (!rec) return false;
  let derived;
  try {
    derived = crypto.scryptSync(String(pass || ''), Buffer.from(rec.salt, 'hex'), SCRYPT_KEYLEN).toString('hex');
  } catch { return false; }
  return timingEqualHex(derived, rec.hash);
}

async function userMustChange(user) {
  const rec = await loadUserRec(user);
  return !!(rec && rec.must_change);
}

// ── Signed token: base64url(payload) + "." + hmac. payload has kind `k`. ──────
function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64url(s) {
  return Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}
function sign(s) { return crypto.createHmac('sha256', secret()).update(s).digest('hex'); }

function signPayload(obj) {
  const p = b64url(JSON.stringify(obj));
  return `${p}.${sign(p)}`;
}
function verifySigned(token, kind) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [p, sig] = token.split('.');
  const expected = sign(p);
  const a = Buffer.from(String(sig || ''), 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try { payload = JSON.parse(fromB64url(p).toString('utf8')); } catch { return null; }
  if (!payload || payload.k !== kind || !payload.exp || payload.exp < Date.now()) return null;
  return payload;
}

const makeSession = (user, mustChange) => signPayload({ k: 's', u: user, mc: !!mustChange, exp: Date.now() + SESSION_TTL_MS });
const makeDevice  = (did)  => signPayload({ k: 'd', did, exp: Date.now() + DEVICE_TTL_MS });

// ── Cookies ───────────────────────────────────────────────────────────────────
function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
function cookieStr(name, val, maxAgeMs, secure) {
  const attrs = [`${name}=${val}`, 'Path=/build', 'HttpOnly', 'SameSite=Lax', `Max-Age=${Math.floor(maxAgeMs / 1000)}`];
  if (secure) attrs.push('Secure'); // omitted over plain http (local dev); set on Railway https
  return attrs.join('; ');
}
function setSessionCookie(res, token, secure) { appendCookie(res, cookieStr(SESSION_COOKIE, token, SESSION_TTL_MS, secure)); }
function setDeviceCookie(res, token, secure)  { appendCookie(res, cookieStr(DEVICE_COOKIE, token, DEVICE_TTL_MS, secure)); }
function clearSessionCookie(res, secure)      { appendCookie(res, cookieStr(SESSION_COOKIE, '', 0, secure)); }
function appendCookie(res, str) {
  const prev = res.getHeader('Set-Cookie');
  if (!prev) res.setHeader('Set-Cookie', str);
  else res.setHeader('Set-Cookie', Array.isArray(prev) ? prev.concat(str) : [prev, str]);
}

function currentUser(req) {
  const p = verifySigned(parseCookies(req)[SESSION_COOKIE], 's');
  return p ? p.u : null;
}
function sessionInfo(req) {
  const p = verifySigned(parseCookies(req)[SESSION_COOKIE], 's');
  return p ? { user: p.u, mustChange: !!p.mc } : null;
}
function deviceDid(req) {
  const p = verifySigned(parseCookies(req)[DEVICE_COOKIE], 'd');
  return p ? p.did : null;
}

// ── Persistence: Supabase primary, in-memory fallback ─────────────────────────
const memEnroll = new Map();  // token_hash -> { label, createdBy, expiresAt, consumedAt, deviceId }
const memDevices = new Map(); // device_id  -> { label, enrolledBy, enrolledAt, revokedAt }
const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

async function storeEnrollToken(hash, label, createdBy) {
  const expiresAt = new Date(Date.now() + ENROLL_TTL_MS).toISOString();
  if (_supabase) {
    try {
      const { error } = await _supabase.from('build_enroll_tokens')
        .insert({ token_hash: hash, label, created_by: createdBy, expires_at: expiresAt });
      if (!error) return true;
    } catch (e) { console.warn('[build-auth] enroll insert fallback:', e.message); }
  }
  memEnroll.set(hash, { label, createdBy, expiresAt, consumedAt: null, deviceId: null });
  return true;
}

// Atomically consume a one-time token. Returns the token record ({label}) if it
// was valid & unconsumed, else null.
async function consumeEnrollToken(hash, deviceId) {
  if (_supabase) {
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await _supabase.from('build_enroll_tokens')
        .update({ consumed_at: nowIso, device_id: deviceId })
        .eq('token_hash', hash).is('consumed_at', null).gt('expires_at', nowIso)
        .select('id,label');
      if (error) throw error;
      return (Array.isArray(data) && data.length > 0) ? { label: data[0].label } : null;
    } catch (e) { console.warn('[build-auth] enroll consume fallback:', e.message); }
  }
  const rec = memEnroll.get(hash);
  if (!rec || rec.consumedAt || new Date(rec.expiresAt).getTime() < Date.now()) return null;
  rec.consumedAt = new Date().toISOString();
  rec.deviceId = deviceId;
  return { label: rec.label };
}

async function registerDevice(deviceId, label, enrolledBy) {
  if (_supabase) {
    try {
      await _supabase.from('build_devices')
        .insert({ device_id: deviceId, label, enrolled_by: enrolledBy });
      return;
    } catch (e) { console.warn('[build-auth] device register fallback:', e.message); }
  }
  memDevices.set(deviceId, { label, enrolledBy, enrolledAt: new Date().toISOString(), revokedAt: null });
}

// Device approved if the cookie signature is valid AND the device is not revoked.
// If the DB is unavailable we accept the signature alone (fail-open for 2 trusted
// users — a revoked device would work only during a DB outage; flip if desired).
async function deviceApproved(req) {
  const did = deviceDid(req);
  if (!did) return false;
  if (_supabase) {
    try {
      const { data, error } = await _supabase.from('build_devices')
        .select('revoked_at').eq('device_id', did).maybeSingle();
      if (error) throw error;
      if (data && data.revoked_at) return false;      // explicitly revoked
      // best-effort last_seen touch
      _supabase.from('build_devices').update({ last_seen: new Date().toISOString() })
        .eq('device_id', did).then(() => {}, () => {});
      return true; // row present & not revoked, OR no row (signature still trusted)
    } catch (e) { console.warn('[build-auth] deviceApproved fallback:', e.message); }
  }
  const rec = memDevices.get(did);
  if (rec && rec.revokedAt) return false;
  return true; // signature valid
}

async function listDevices() {
  if (_supabase) {
    try {
      const { data, error } = await _supabase.from('build_devices')
        .select('device_id,label,enrolled_by,enrolled_at,last_seen,revoked_at')
        .order('enrolled_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) { console.warn('[build-auth] listDevices fallback:', e.message); }
  }
  return [...memDevices.entries()].map(([device_id, r]) => ({
    device_id, label: r.label, enrolled_by: r.enrolledBy, enrolled_at: r.enrolledAt,
    last_seen: null, revoked_at: r.revokedAt,
  }));
}

async function revokeDevice(deviceId) {
  if (_supabase) {
    try {
      await _supabase.from('build_devices').update({ revoked_at: new Date().toISOString() })
        .eq('device_id', deviceId);
      return true;
    } catch (e) { console.warn('[build-auth] revokeDevice fallback:', e.message); }
  }
  const rec = memDevices.get(deviceId);
  if (rec) rec.revokedAt = new Date().toISOString();
  return true;
}

// ── Enrollment entry points ───────────────────────────────────────────────────
// Mint a one-time enrollment link (called by an already-authorised user).
async function createEnrollLink(baseUrl, label, createdBy) {
  const raw = b64url(crypto.randomBytes(32));
  await storeEnrollToken(sha256(raw), label || null, createdBy || null);
  return { url: `${baseUrl}/build/enroll?t=${raw}`, expiresInHours: ENROLL_TTL_MS / 3600000 };
}

// Consume a one-time link on this machine → returns a device cookie token, or null.
async function enrollViaLink(rawToken) {
  if (!rawToken) return null;
  const did = crypto.randomBytes(12).toString('hex');
  const rec = await consumeEnrollToken(sha256(rawToken), did);
  if (!rec) return null;
  await registerDevice(did, rec.label || 'enrolled device', 'link');
  return makeDevice(did);
}

// Bootstrap / break-glass: static key enrolls the current machine directly.
async function enrollViaBootstrap(providedKey) {
  const expected = enrollKey();
  if (!expected || !timingEqualStr(String(providedKey || ''), expected)) return null;
  const did = crypto.randomBytes(12).toString('hex');
  await registerDevice(did, 'bootstrap', 'bootstrap');
  return makeDevice(did);
}

// ── Login brute-force throttle (in-memory, per IP) ────────────────────────────
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
function throttled(ip) {
  const rec = attempts.get(ip);
  if (!rec) return false;
  if (Date.now() - rec.first > WINDOW_MS) { attempts.delete(ip); return false; }
  return rec.n >= MAX_ATTEMPTS;
}
function noteFailure(ip) {
  const rec = attempts.get(ip);
  if (!rec || Date.now() - rec.first > WINDOW_MS) attempts.set(ip, { n: 1, first: Date.now() });
  else rec.n += 1;
}
function noteSuccess(ip) { attempts.delete(ip); }

function isConfigured() { return secret().length >= 16; }
function bootstrapAvailable() { return enrollKey().length >= 8; }

module.exports = {
  setSupabase, verifyPassword, userMustChange, makeSession, currentUser, sessionInfo, deviceDid,
  setSessionCookie, setDeviceCookie, clearSessionCookie,
  changePassword, adminResetPassword, listUsers,
  deviceApproved, createEnrollLink, enrollViaLink, enrollViaBootstrap,
  listDevices, revokeDevice,
  throttled, noteFailure, noteSuccess, isConfigured, bootstrapAvailable,
};
