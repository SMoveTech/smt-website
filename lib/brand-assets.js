'use strict';
// ── Brand-asset library (reads the private SMD Storage bucket) ────────────────
// Assets live in a PRIVATE bucket ("brand-assets") in the SMD Supabase project.
// The SMT site streams them ONLY behind the /build login — never public URLs.
// Needs env: SMD_SUPABASE_URL + SMD_SUPABASE_KEY (SMD's secret key). Inactive
// (endpoints 503) until both are set.
const BUCKET = 'brand-assets';

let client = null, tried = false;
function sb() {
  if (tried) return client;
  tried = true;
  const url = process.env.SMD_SUPABASE_URL, key = process.env.SMD_SUPABASE_KEY;
  if (url && key) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const ws = require('ws');
      client = createClient(url, key, { auth: { persistSession: false }, realtime: { transport: ws } });
    } catch (e) { console.warn('[brand-assets] init failed:', e.message); }
  }
  return client;
}

function enabled() { return !!sb(); }

// Read + parse manifest.json from the bucket. Returns { updated, assets: [...] }.
async function listAssets() {
  const c = sb(); if (!c) throw new Error('brand-assets not configured');
  const { data, error } = await c.storage.from(BUCKET).download('manifest.json');
  if (error) throw error;
  const text = Buffer.from(await data.arrayBuffer()).toString('utf8');
  return JSON.parse(text);
}

// Download one asset by its manifest path. Validates the path is in the manifest
// (no arbitrary reads). Returns { buffer, contentType, filename }.
async function downloadAsset(assetPath) {
  const c = sb(); if (!c) throw new Error('brand-assets not configured');
  const { assets } = await listAssets();
  const meta = (assets || []).find(a => a.path === assetPath);
  if (!meta) throw new Error('unknown asset');
  const { data, error } = await c.storage.from(BUCKET).download(assetPath);
  if (error) throw error;
  return {
    buffer: Buffer.from(await data.arrayBuffer()),
    contentType: meta.type || 'application/octet-stream',
    filename: assetPath.split('/').pop(),
  };
}

module.exports = { enabled, listAssets, downloadAsset };
