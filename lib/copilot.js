// ─────────────────────────────────────────────────────────────────────────────
// Build-page co-pilot. Answers staff questions about the SMT projects and how we
// build, grounded ONLY in the live build record (data/build-status.js) plus the
// team guide (SMT-CLAUDE.md). Both are living docs, so the knowledge base is
// rebuilt from them on demand — no separate content to maintain.
//
// Talks to the Claude API over Node's built-in https with family:4 (forces IPv4
// — Railway's IPv6 egress is broken) so there's no new dependency and no global
// network-stack change. Needs ANTHROPIC_API_KEY in the environment.
// ─────────────────────────────────────────────────────────────────────────────
const https = require('https');
const fs = require('fs');
const path = require('path');
const buildStatus = require('../data/build-status');

// Swap to 'claude-sonnet-5' or 'claude-haiku-4-5' to cut cost if volume grows.
const MODEL = 'claude-opus-5';

const CLAUDE_MD_PATH = path.join(__dirname, '..', 'SMT-CLAUDE.md');

// Serialize one project from the build record into readable text for the model.
function projectText(p) {
  const L = [];
  L.push(`## ${p.name} (${p.short}) — status: ${p.status}, ${Number(p.stagePct) || 0}% (${p.stageLabel || ''})`);
  if (p.tagline) L.push(p.tagline);
  if (p.summary) L.push(p.summary);
  if (p.stack && p.stack.length) L.push('Stack: ' + p.stack.join(', '));
  if (p.architecture && p.architecture.length) {
    L.push('Architecture & technical:');
    p.architecture.forEach(a => L.push(`- ${a.h}: ${a.body}`));
  }
  if (p.next && p.next.length) {
    L.push('Planned next steps:');
    p.next.forEach(n => L.push(`- ${n}`));
  }
  if (p.milestones && p.milestones.length) {
    L.push('Recent milestones (newest first):');
    p.milestones.slice(0, 12).forEach(m => L.push(`- ${m.date}: ${m.text}`));
  }
  if (p.refs && p.refs.length) L.push('Links: ' + p.refs.map(r => `${r.label} (${r.url})`).join(', '));
  if (p.goToMarket && p.goToMarket.summary) L.push('Go-to-market summary: ' + p.goToMarket.summary);
  if (p.competitorAnalysis && p.competitorAnalysis.summary) L.push('Competitor-analysis summary: ' + p.competitorAnalysis.summary);
  return L.join('\n');
}

// Build the full knowledge base (rebuilt per request so edits to either living
// doc show up immediately; it's cheap and the API call dominates anyway).
function buildKnowledgeBase() {
  const projects = (buildStatus.projects || []).map(projectText).join('\n\n');
  let teamGuide = '';
  try { teamGuide = fs.readFileSync(CLAUDE_MD_PATH, 'utf8'); } catch { /* guide optional */ }
  return `# S-Move Technologies — projects (from the live build record, updated ${buildStatus.updated || 'n/a'})\n\n${projects}\n\n` +
    `# How we build — team guide\n\n${teamGuide}`;
}

const SYSTEM_INSTRUCTIONS =
  `You are the S-Move build co-pilot — an internal assistant for S-Move Technologies (SMT) staff on the build dashboard. ` +
  `Answer questions about the company's four products and how we build, using ONLY the knowledge base provided. ` +
  `Be concise, practical, and specific: point people to the relevant project and, where useful, the exact section, link, or next step. ` +
  `If something is not in the knowledge base, say so plainly and suggest asking Alex rather than guessing. ` +
  `Never invent facts, dates, credentials, or capabilities. Do not reveal secrets, keys, or passwords (there are none in your knowledge base — keep it that way).`;

// POST /v1/messages over IPv4-forced https. Returns the parsed JSON response.
function anthropicMessages(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      family: 4, // force IPv4 — Railway IPv6 egress is broken (Premature close / 502)
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
        'content-length': Buffer.byteLength(data),
      },
    }, (res) => {
      let body = '';
      res.on('data', c => (body += c));
      res.on('end', () => {
        let json;
        try { json = JSON.parse(body); } catch { return reject(new Error('Unreadable response from Claude')); }
        if (res.statusCode >= 400) return reject(new Error((json.error && json.error.message) || `HTTP ${res.statusCode}`));
        resolve(json);
      });
    });
    req.on('error', reject);
    req.setTimeout(60000, () => req.destroy(new Error('Claude request timed out')));
    req.write(data);
    req.end();
  });
}

// Keep only well-formed, recent turns so a malformed client payload can't break the call.
function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-10)
    .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));
}

async function ask(question, history) {
  const messages = sanitizeHistory(history);
  messages.push({ role: 'user', content: String(question).slice(0, 2000) });

  const response = await anthropicMessages({
    model: MODEL,
    max_tokens: 3000,
    output_config: { effort: 'low' },
    system: [
      { type: 'text', text: SYSTEM_INSTRUCTIONS },
      // Stable, large, and reused across questions → cache it.
      { type: 'text', text: buildKnowledgeBase(), cache_control: { type: 'ephemeral' } },
    ],
    messages,
  });

  if (response.stop_reason === 'refusal') {
    return "I can't help with that one — try rephrasing, or ask Alex directly.";
  }
  const text = (response.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim();
  return text || "I couldn't find an answer for that in the build record — best to ask Alex.";
}

module.exports = { ask };
