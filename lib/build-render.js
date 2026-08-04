// ─────────────────────────────────────────────────────────────────────────────
// Server-side HTML for the internal /build dashboard and its login page.
// Rendered from data/build-status.js. Styled to match the SMT site (dark "ink"
// canvas, electric-blue/cyan accents). All content is server-rendered so it only
// ever leaves the server after auth — nothing lives in the public/ folder.
// ─────────────────────────────────────────────────────────────────────────────

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

const STATUS_META = {
  live:     { label: 'Live',     color: '#34d399' },
  beta:     { label: 'Beta',     color: '#22d3ee' },
  building: { label: 'Building',  color: '#5b8def' },
  designed: { label: 'Designed', color: '#fbbf24' },
  parked:   { label: 'Parked',   color: '#94a1bb' },
};

const HEAD = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<link rel="icon" href="/favicon.svg">`;

const STYLE = `
:root{--ink:#0a0e17;--ink-2:#0f1522;--ink-3:#161d2e;--line:#232c40;--text:#e7ecf5;
--muted:#94a1bb;--muted-2:#6b7791;--brand:#5b8def;--brand-2:#22d3ee;
--grad:linear-gradient(120deg,#5b8def,#22d3ee);--font:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}
*{box-sizing:border-box;}
body{margin:0;font-family:var(--font);background:var(--ink);color:var(--text);line-height:1.55;-webkit-font-smoothing:antialiased;}
a{color:var(--brand);text-decoration:none;}a:hover{color:var(--brand-2);}
.top{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 22px;border-bottom:1px solid var(--line);background:rgba(10,14,23,.72);position:sticky;top:0;z-index:20;backdrop-filter:saturate(140%) blur(12px);}
.top .t{font-weight:700;letter-spacing:-.01em;}
.top .t small{display:block;font-weight:500;font-size:.7rem;color:var(--muted-2);text-transform:uppercase;letter-spacing:.08em;}
.top .r{display:flex;align-items:center;gap:14px;font-size:.86rem;color:var(--muted);}
.logout{padding:7px 14px;border:1px solid var(--line);border-radius:9px;color:var(--text);}
.logout:hover{border-color:var(--brand);background:rgba(91,141,239,.08);}
.navcta{padding:7px 14px;border-radius:9px;font-weight:600;color:#06111f;background:var(--grad);border:0;}
.navcta:hover{filter:brightness(1.08);color:#06111f;}
.layout{display:grid;grid-template-columns:250px 1fr;max-width:1180px;margin:0 auto;}
.side{border-right:1px solid var(--line);padding:22px 14px;min-height:calc(100vh - 61px);}
.side h4{font-size:.7rem;text-transform:uppercase;letter-spacing:.1em;color:var(--muted-2);margin:0 0 12px 10px;}
.pnav{display:flex;flex-direction:column;gap:4px;}
.pnav button{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:transparent;border:1px solid transparent;color:var(--muted);
padding:10px 12px;border-radius:10px;cursor:pointer;font:inherit;font-size:.95rem;transition:.15s;}
.pnav button:hover{color:var(--text);background:var(--ink-2);}
.pnav button.active{color:var(--text);background:var(--ink-3);border-color:var(--line);}
.pnav .dot{width:8px;height:8px;border-radius:50%;flex:none;}
.pnav .pct{margin-left:auto;font-size:.72rem;color:var(--muted-2);}
.main{padding:30px 34px 80px;min-width:0;}
.panel{display:none;}.panel.active{display:block;}
.phead{margin-bottom:22px;}
.phead .row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.phead h1{font-size:1.9rem;margin:0;letter-spacing:-.02em;}
.phead .code{font-size:.8rem;color:var(--muted-2);border:1px solid var(--line);border-radius:6px;padding:2px 8px;}
.badge{display:inline-flex;align-items:center;gap:7px;font-size:.78rem;font-weight:600;padding:4px 11px;border-radius:999px;border:1px solid var(--line);background:var(--ink-2);}
.badge .dot{width:8px;height:8px;border-radius:50%;}
.phead .tag{color:var(--muted);margin:6px 0 0;}
.summary{color:var(--muted);font-size:1.04rem;margin:14px 0 0;max-width:70ch;}
.bar{height:8px;background:var(--ink-3);border:1px solid var(--line);border-radius:999px;overflow:hidden;margin:20px 0 6px;max-width:520px;}
.bar>span{display:block;height:100%;background:var(--grad);}
.stagelabel{font-size:.9rem;color:var(--muted);max-width:70ch;}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:26px;}
@media(max-width:820px){.grid{grid-template-columns:1fr;}}
.box{background:var(--ink-3);border:1px solid var(--line);border-radius:14px;padding:20px 22px;}
.box h3{font-size:.76rem;text-transform:uppercase;letter-spacing:.1em;color:var(--brand-2);margin:0 0 14px;}
.box.full{grid-column:1/-1;}
.chips{display:flex;flex-wrap:wrap;gap:8px;}
.chip{font-size:.82rem;color:var(--muted);background:var(--ink-2);border:1px solid var(--line);border-radius:8px;padding:5px 10px;}
.arch{margin:0;padding:0;list-style:none;}
.arch li{padding:10px 0;border-bottom:1px dashed var(--line);}
.arch li:last-child{border-bottom:0;}
.arch b{display:block;font-size:.94rem;margin-bottom:2px;}
.arch span{color:var(--muted);font-size:.92rem;}
.log{margin:0;padding:0;list-style:none;}
.log li{display:flex;gap:14px;padding:9px 0;border-bottom:1px dashed var(--line);}
.log li:last-child{border-bottom:0;}
.log .d{font-variant-numeric:tabular-nums;color:var(--brand-2);font-size:.82rem;white-space:nowrap;padding-top:1px;}
.log .x{color:var(--text);font-size:.93rem;}
.next{margin:0;padding-left:20px;}
.next li{color:var(--muted);margin-bottom:9px;font-size:.95rem;}
.next li::marker{color:var(--brand);}
.refs{display:flex;flex-wrap:wrap;gap:10px;}
.refs a{font-size:.86rem;border:1px solid var(--line);border-radius:9px;padding:7px 12px;background:var(--ink-2);}
.refs a:hover{border-color:var(--brand);}
.empty{color:var(--muted-2);font-size:.9rem;}
.box .lead{color:var(--muted);font-size:.98rem;margin:0 0 4px;max-width:80ch;}
.subh{font-size:.72rem;text-transform:uppercase;letter-spacing:.09em;color:var(--muted-2);margin:22px 0 10px;padding-top:14px;border-top:1px solid var(--line);}
.subh:first-of-type{border-top:0;padding-top:0;margin-top:16px;}
.subh6{font-size:.82rem;color:var(--brand-2);margin:14px 0 6px;}
.subblock{background:var(--ink-2);border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin-bottom:12px;}
.sb-head{display:flex;justify-content:space-between;gap:12px;align-items:baseline;flex-wrap:wrap;margin-bottom:8px;}
.sb-head b{font-size:1rem;}
.verdict{font-size:.74rem;color:var(--brand-2);border:1px solid var(--line);border-radius:6px;padding:2px 8px;white-space:nowrap;}
.sb-text{color:var(--muted);font-size:.92rem;margin:.35rem 0;}
.sb-text b{color:var(--text);}
.kv{display:flex;gap:12px;padding:6px 0;border-bottom:1px dashed var(--line);font-size:.9rem;}
.kv:last-child{border-bottom:0;}
.kv .k{color:var(--muted-2);min-width:118px;flex:none;font-size:.8rem;padding-top:1px;}
.kv .v{color:var(--muted);}
.doclist{display:flex;flex-direction:column;gap:8px;}
.docitem{display:flex;gap:8px;align-items:stretch;padding:0;border:1px solid var(--line);border-radius:10px;background:var(--ink-2);}
.docitem:hover{border-color:var(--brand);background:rgba(91,141,239,.06);}
.docitem-link{display:flex;gap:12px;align-items:flex-start;flex:1;min-width:0;padding:12px 14px;color:inherit;text-decoration:none;}
.doc-badge{font-size:.64rem;font-weight:700;letter-spacing:.05em;padding:3px 7px;border-radius:5px;flex:none;margin-top:2px;}
.doc-badge.pdf{background:rgba(220,38,38,.16);color:#fca5a5;}
.doc-badge.html{background:rgba(34,211,238,.14);color:var(--brand-2);}
.doc-info{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0;}
.doc-title{color:var(--text);font-weight:500;font-size:.96rem;}
.doc-note{color:var(--muted);font-size:.85rem;}
.doc-dl{flex:none;align-self:center;margin-right:10px;padding:6px 11px;border:1px solid var(--line);border-radius:8px;color:var(--brand-2);text-decoration:none;font-size:1rem;line-height:1;}
.doc-dl:hover{border-color:var(--brand);background:rgba(91,141,239,.14);}
.btn-bundle{display:inline-flex;align-items:center;gap:6px;margin-top:14px;padding:10px 16px;border-radius:10px;background:var(--grad);color:#06111f;font-weight:700;font-size:.9rem;text-decoration:none;}
.btn-bundle:hover{filter:brightness(1.08);color:#06111f;}
.rv-flag{font-size:.8rem;font-style:italic;}
.rv-chip{font-size:.68rem;font-weight:600;padding:3px 9px;border-radius:999px;flex:none;margin-top:2px;white-space:nowrap;}
.rv-current{background:rgba(52,211,153,.15);color:#34d399;}
.rv-review{background:rgba(251,191,36,.15);color:#fbbf24;}
.rv-old{background:rgba(220,38,38,.16);color:#fca5a5;}
.rv-draft{background:rgba(34,211,238,.14);color:#22d3ee;}
.rv-flag.rv-current{background:none;color:#34d399;}
.rv-flag.rv-review{background:none;color:#fbbf24;}
.rv-flag.rv-old{background:none;color:#fca5a5;}
.rv-flag.rv-draft{background:none;color:#22d3ee;}
.cov-group{margin-bottom:4px;}
.cov-row{display:flex;gap:10px;align-items:baseline;padding:6px 0;border-bottom:1px dashed var(--line);}
.cov-row:last-child{border-bottom:0;}
.cov-ic{width:18px;flex:none;font-weight:700;text-align:center;}
.cov-have{color:#34d399;}.cov-part{color:#fbbf24;}.cov-miss{color:#fca5a5;}.cov-na{color:var(--muted-2);}
.cov-name{color:var(--muted);font-size:.92rem;}
.cov-name a{color:var(--text);}
.cov-note{color:var(--muted-2);font-size:.82rem;margin-left:8px;}
@media(max-width:720px){.layout{grid-template-columns:1fr;}.side{min-height:0;border-right:0;border-bottom:1px solid var(--line);}
.pnav{flex-direction:row;overflow-x:auto;}.pnav button{white-space:nowrap;}.main{padding:22px 18px 60px;}}
/* Build co-pilot */
.cop-fab{position:fixed;right:22px;bottom:22px;z-index:40;display:inline-flex;align-items:center;gap:8px;padding:12px 18px;border:0;border-radius:999px;
background:var(--grad);color:#06111f;font:inherit;font-weight:700;font-size:.92rem;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.35);}
.cop-fab:hover{filter:brightness(1.08);}
.cop-panel{position:fixed;right:22px;bottom:22px;z-index:41;width:min(420px,calc(100vw - 44px));height:min(600px,calc(100vh - 90px));
display:none;flex-direction:column;background:var(--ink-2);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.5);}
.cop-panel.open{display:flex;}
.cop-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--line);background:var(--ink-3);}
.cop-head b{font-size:.98rem;}.cop-head small{display:block;color:var(--muted-2);font-size:.72rem;font-weight:400;}
.cop-x{background:transparent;border:0;color:var(--muted);font-size:1.3rem;line-height:1;cursor:pointer;padding:2px 6px;}
.cop-x:hover{color:var(--text);}
.cop-log{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;}
.cop-msg{max-width:88%;padding:10px 13px;border-radius:12px;font-size:.92rem;line-height:1.5;white-space:pre-wrap;word-wrap:break-word;}
.cop-msg.user{align-self:flex-end;background:var(--brand);color:#06111f;border-bottom-right-radius:4px;}
.cop-msg.bot{align-self:flex-start;background:var(--ink-3);border:1px solid var(--line);color:var(--text);border-bottom-left-radius:4px;}
.cop-msg.err{align-self:flex-start;background:rgba(220,38,38,.12);border:1px solid rgba(220,38,38,.4);color:#fca5a5;font-size:.86rem;}
.cop-hint{color:var(--muted-2);font-size:.85rem;text-align:center;margin:auto 10px;line-height:1.6;}
.cop-form{display:flex;gap:8px;padding:12px;border-top:1px solid var(--line);background:var(--ink-3);}
.cop-form textarea{flex:1;resize:none;padding:10px 12px;background:var(--ink);border:1px solid var(--line);border-radius:10px;color:var(--text);font:inherit;font-size:.92rem;max-height:120px;}
.cop-form textarea:focus{outline:none;border-color:var(--brand);}
.cop-form button{padding:0 16px;border:0;border-radius:10px;background:var(--grad);color:#06111f;font-weight:700;cursor:pointer;}
.cop-form button:disabled{opacity:.5;cursor:default;}
`;

function statusBadge(status) {
  const m = STATUS_META[status] || STATUS_META.parked;
  return `<span class="badge"><span class="dot" style="background:${m.color}"></span>${m.label}</span>`;
}

function bullets(arr) {
  return (arr || []).map(x => `<li>${esc(x)}</li>`).join('');
}
function refLinks(refs) {
  return (refs || []).length
    ? refs.map(r => `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.label)} ↗</a>`).join('')
    : '<span class="empty">—</span>';
}

function renderCompetitor(ca) {
  const attempts = (ca.priorAttempts || []).map(a => {
    const bits = [];
    if (a.what) bits.push(`<p class="sb-text">${esc(a.what)}</p>`);
    if (a.model) bits.push(`<p class="sb-text"><b>Model:</b> ${esc(a.model)}</p>`);
    if (a.scale) bits.push(`<p class="sb-text"><b>Scale:</b> ${esc(a.scale)}</p>`);
    if (a.whyItFailed) bits.push(`<p class="sb-text"><b>Why it failed:</b></p><ul class="next">${bullets(a.whyItFailed)}</ul>`);
    if (a.whyItMatters) bits.push(`<p class="sb-text"><b>Why it matters:</b> ${esc(a.whyItMatters)}</p>`);
    return `<div class="subblock"><div class="sb-head"><b>${esc(a.name)}</b><span class="verdict">${esc(a.verdict)}</span></div>${bits.join('')}</div>`;
  }).join('');
  return `<div class="box full"><h3>Competitor analysis</h3>
    <p class="lead">${esc(ca.summary)}</p>
    <div class="subh">Prior attempts</div>${attempts}
    <div class="subh">What it means for SMD</div><ol class="next">${bullets(ca.implicationsForSMD)}</ol>
    <div class="subh">Sources</div><div class="refs">${refLinks(ca.refs)}</div>
  </div>`;
}

function renderGoToMarket(g) {
  const kv = (k, v) => v ? `<div class="kv"><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></div>` : '';
  const councils = (g.councils || []).map(c =>
    `<div class="subblock"><div class="sb-head"><b>${esc(c.name)}</b><span class="verdict">${esc(c.priority)}</span></div>
      ${kv('Insight', c.insight)}${kv('First contact', c.firstContact)}${kv('Route to shops', c.routeToShops)}
      ${kv('Councillor', c.councillor)}${kv('Funding', c.funding)}${kv('Strategy hook', c.strategyHook)}</div>`
  ).join('');
  const champBlock = (title, arr) => (arr && arr.length) ? `<div class="subh6">${esc(title)}</div><ul class="next">${bullets(arr)}</ul>` : '';
  const ch = g.champions || {};
  const champs = champBlock('Top six', ch.topSix) + champBlock('Other local', ch.otherLocal)
    + champBlock('Openings', ch.openings) + champBlock('Handling rules', ch.handlingRules);
  const docs = (g.documents && g.documents.length) ? `<div class="subh">Meeting &amp; pitch documents</div><div class="refs">${refLinks(g.documents)}</div>` : '';
  return `<div class="box full"><h3>Go-to-market — councils &amp; champions</h3>
    ${docs}
    <p class="lead">${esc(g.summary)}</p>
    <div class="subh">Playbook</div><ol class="next">${bullets(g.playbook)}</ol>
    <div class="subh">Councils</div>${councils}
    <div class="subh">Local champions &amp; allies</div>${champs}
    <div class="subh">First moves</div><ol class="next">${bullets(g.firstMoves)}</ol>
    <div class="subh">Full source-cited docs</div><div class="refs">${refLinks(g.refs)}</div>
  </div>`;
}

const COV_ICON = { have: ['&#10003;', 'cov-have'], partial: ['~', 'cov-part'], missing: ['&#10007;', 'cov-miss'], na: ['&mdash;', 'cov-na'] };

function renderCoverageBox(p, template) {
  if (!template || !p.docCoverage) return '';
  const groups = {};
  template.forEach(t => { (groups[t.group] = groups[t.group] || []).push(t); });
  let have = 0, applicable = 0;
  const sections = Object.keys(groups).map(g => {
    const rows = groups[g].map(t => {
      const c = p.docCoverage[t.key] || { status: 'missing' };
      const [ic, cls] = COV_ICON[c.status] || COV_ICON.missing;
      if (c.status !== 'na') { applicable++; if (c.status === 'have') have++; }
      const label = c.docId ? `<a href="/build/doc/${esc(c.docId)}" target="_blank" rel="noopener">${esc(t.name)} ↗</a>` : esc(t.name);
      const note = c.note ? `<span class="cov-note">${esc(c.note)}</span>` : '';
      return `<div class="cov-row"><span class="cov-ic ${cls}">${ic}</span><span class="cov-name">${label}${note}</span></div>`;
    }).join('');
    return `<div class="cov-group"><div class="subh6">${esc(g)}</div>${rows}</div>`;
  }).join('');
  const pct = applicable ? Math.round(have / applicable * 100) : 0;
  return `<div class="box full"><h3>Documentation coverage <span style="color:var(--muted-2);font-weight:400">&middot; ${have}/${applicable} in place (${pct}%)</span></h3>${sections}</div>`;
}

const REVIEW_META = {
  current:  { label: 'Current',     cls: 'rv-current' },
  review:   { label: 'For review',  cls: 'rv-review' },
  outdated: { label: 'Out of date', cls: 'rv-old' },
  draft:    { label: 'Draft',       cls: 'rv-draft' },
};

function renderDocsBox(p) {
  if (!p.docs || !p.docs.length) return '';
  let current = 0;
  const items = p.docs.map(d => {
    const badge = d.type === 'pdf' ? 'PDF' : 'DOC';
    const r = d.review || { status: 'review' };
    const rm = REVIEW_META[r.status] || REVIEW_META.review;
    if (r.status === 'current') current++;
    const chip = `<span class="rv-chip ${rm.cls}">${rm.label}${r.reviewedOn ? ' &middot; ' + esc(r.reviewedOn) : ''}</span>`;
    const rnote = r.note ? `<span class="rv-flag ${rm.cls}">${esc(r.note)}</span>` : '';
    const dl = d.raw ? `<a class="doc-dl" href="/build/doc/${esc(d.id)}/download" title="Download the raw file (${esc(d.downloadName || d.raw)})">⬇</a>` : '';
    return `<span class="docitem">
      <a class="docitem-link" href="/build/doc/${esc(d.id)}" target="_blank" rel="noopener">
      <span class="doc-badge ${esc(d.type)}">${badge}</span>
      <span class="doc-info"><span class="doc-title">${esc(d.title)} ↗</span>${d.note ? `<span class="doc-note">${esc(d.note)}</span>` : ''}${rnote}</span>
      </a>${dl}</span>`;
  }).join('');
  const dlCount = p.docs.filter(d => d.raw).length;
  const bundle = dlCount
    ? `<a class="btn-bundle" href="/build/project-bundle/${esc(p.key)}">⬇ Download project files (.zip) <span style="font-weight:400">— ${dlCount} file${dlCount === 1 ? '' : 's'}</span></a>`
    : '';
  return `<div class="box full"><h3>Technical documentation <span style="color:var(--muted-2);font-weight:400">&middot; ${current}/${p.docs.length} current</span></h3>
    <p class="lead">Opens in a new tab to read, or use the ⬇ to save the raw file. Each doc carries a review status — checked off to <em>Current</em> as we verify/update it.</p><div class="doclist">${items}</div>${bundle}</div>`;
}

function renderPanel(p, active, template) {
  const m = STATUS_META[p.status] || STATUS_META.parked;
  const stack = (p.stack || []).map(s => `<span class="chip">${esc(s)}</span>`).join('');
  const arch = (p.architecture || []).map(a =>
    `<li><b>${esc(a.h)}</b><span>${esc(a.body)}</span></li>`).join('');
  const log = (p.milestones || []).map(ms =>
    `<li><span class="d">${esc(ms.date)}</span><span class="x">${esc(ms.text)}</span></li>`).join('');
  const next = (p.next || []).map(n => `<li>${esc(n)}</li>`).join('');
  const refs = (p.refs || []).length
    ? (p.refs.map(r => `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.label)} ↗</a>`).join(''))
    : '<span class="empty">No links yet.</span>';

  return `<section class="panel${active ? ' active' : ''}" id="panel-${esc(p.key)}">
    <div class="phead">
      <div class="row">
        <h1>${esc(p.name)}</h1>
        <span class="code">${esc(p.short)}</span>
        ${statusBadge(p.status)}
      </div>
      <p class="tag">${esc(p.tagline)}</p>
      <p class="summary">${esc(p.summary)}</p>
      <div class="bar"><span style="width:${Number(p.stagePct) || 0}%"></span></div>
      <p class="stagelabel"><b>${Number(p.stagePct) || 0}%</b> &middot; ${esc(p.stageLabel)}</p>
    </div>
    <div class="grid">
      <div class="box"><h3>Tech stack</h3><div class="chips">${stack || '<span class="empty">—</span>'}</div></div>
      <div class="box"><h3>Next steps</h3><ol class="next">${next || '<li class="empty">—</li>'}</ol></div>
      <div class="box full"><h3>Architecture &amp; technical</h3><ul class="arch">${arch || '<li class="empty">—</li>'}</ul></div>
      <div class="box full"><h3>Milestone log</h3><ul class="log">${log || '<li class="empty">No milestones yet.</li>'}</ul></div>
      <div class="box full"><h3>Links</h3><div class="refs">${refs}</div></div>
      ${renderDocsBox(p)}
      ${renderCoverageBox(p, template)}
      ${p.competitorAnalysis ? renderCompetitor(p.competitorAnalysis) : ''}
      ${p.goToMarket ? renderGoToMarket(p.goToMarket) : ''}
    </div>
  </section>`;
}

// Co-pilot chat widget — shared across every logged-in /build page. Markup +
// a self-contained script (its own IIFE, no dependency on page-specific elements).
function copilotWidget() {
  return `
  <button class="cop-fab" id="copFab">&#128172; Ask co-pilot</button>
  <div class="cop-panel" id="copPanel" role="dialog" aria-label="Build co-pilot">
    <div class="cop-head">
      <div><b>Build co-pilot</b><small>Knows all four projects &amp; how we build</small></div>
      <button class="cop-x" id="copClose" aria-label="Close">&times;</button>
    </div>
    <div class="cop-log" id="copLog">
      <div class="cop-hint">Ask me anything about SMO, S-Move Dealer, the SMT site, or how we build.<br>
        e.g. &ldquo;What&rsquo;s the status of the Dealer app?&rdquo; or &ldquo;What are our Supabase rules?&rdquo;</div>
    </div>
    <form class="cop-form" id="copForm">
      <textarea id="copInput" rows="1" placeholder="Ask a question&hellip;" autocomplete="off"></textarea>
      <button type="submit" id="copSend">Send</button>
    </form>
  </div>`;
}

function copilotScript() {
  return `<script>
    (function(){
      var fab=document.getElementById('copFab'); if(!fab) return;
      var panel=document.getElementById('copPanel'),
          log=document.getElementById('copLog'), form=document.getElementById('copForm'),
          input=document.getElementById('copInput'), send=document.getElementById('copSend');
      var history=[], busy=false;
      function open(){panel.classList.add('open');fab.style.display='none';input.focus();}
      function close(){panel.classList.remove('open');fab.style.display='';}
      fab.addEventListener('click',open);
      document.getElementById('copClose').addEventListener('click',close);
      function bubble(cls,text){
        var d=document.createElement('div');d.className='cop-msg '+cls;d.textContent=text;
        log.appendChild(d);log.scrollTop=log.scrollHeight;return d;
      }
      input.addEventListener('input',function(){input.style.height='auto';input.style.height=Math.min(input.scrollHeight,120)+'px';});
      input.addEventListener('keydown',function(e){
        if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.dispatchEvent(new Event('submit',{cancelable:true}));}
      });
      form.addEventListener('submit',function(e){
        e.preventDefault();
        var q=input.value.trim(); if(!q||busy) return;
        var hint=log.querySelector('.cop-hint'); if(hint) hint.remove();
        bubble('user',q); input.value=''; input.style.height='auto';
        busy=true; send.disabled=true;
        var thinking=bubble('bot','…');
        fetch('/build/copilot',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({question:q,history:history})})
        .then(function(r){return r.json().then(function(d){return {ok:r.ok,d:d};});})
        .then(function(res){
          thinking.remove();
          if(res.ok&&res.d.answer){
            bubble('bot',res.d.answer);
            history.push({role:'user',content:q});
            history.push({role:'assistant',content:res.d.answer});
            if(history.length>20) history=history.slice(-20);
          } else {
            bubble('err',(res.d&&res.d.error)||'Something went wrong.');
          }
        })
        .catch(function(){thinking.remove();bubble('err','Network error — try again.');})
        .then(function(){busy=false;send.disabled=false;input.focus();});
      });
    })();
  </script>`;
}

function renderDashboard(data, user) {
  const projects = (data && data.projects) || [];
  const nav = projects.map((p, i) => {
    const m = STATUS_META[p.status] || STATUS_META.parked;
    return `<button class="${i === 0 ? 'active' : ''}" data-key="${esc(p.key)}">
      <span class="dot" style="background:${m.color}"></span>${esc(p.short)}
      <span class="pct">${Number(p.stagePct) || 0}%</span></button>`;
  }).join('');
  const panels = projects.map((p, i) => renderPanel(p, i === 0, data.docTemplate)).join('');

  return `<!doctype html><html lang="en"><head>${HEAD}<title>SMT Build Status</title><style>${STYLE}</style></head>
<body>
  <div class="top">
    <div class="t">S-Move Technologies<small>Internal build status</small></div>
    <div class="r"><span>Updated ${esc(data.updated || '')}</span><span>&middot;</span><span>${esc(user)}</span>
      <a class="navcta" href="/build/claude-setup">&#128218; Claude Code guide</a>
      <a class="logout" href="/build/health">&#128147; Health</a>
      <a class="logout" href="/build/activity">&#128203; Activity</a>
      <a class="logout" href="/build/brand">&#127912; Brand assets</a>
      <a class="logout" href="/build/devices">Devices &amp; users</a>
      <a class="logout" href="/build/password">Password</a>
      <a class="logout" href="#" id="logout">Log out</a></div>
  </div>
  <div class="layout">
    <aside class="side"><h4>Projects</h4><nav class="pnav" id="pnav">${nav}</nav></aside>
    <main class="main" id="main">${panels}</main>
  </div>

  ${copilotWidget()}
  <script>
    (function(){
      var nav=document.getElementById('pnav');
      nav.addEventListener('click',function(e){
        var b=e.target.closest('button'); if(!b)return;
        var key=b.getAttribute('data-key');
        [].forEach.call(nav.querySelectorAll('button'),function(x){x.classList.toggle('active',x===b);});
        [].forEach.call(document.querySelectorAll('.panel'),function(pn){
          pn.classList.toggle('active',pn.id==='panel-'+key);});
        window.scrollTo(0,0);
      });
      document.getElementById('logout').addEventListener('click',function(e){
        e.preventDefault();
        fetch('/build/logout',{method:'POST'}).then(function(){location.href='/build/login';});
      });
    })();
  </script>
  ${copilotScript()}
</body></html>`;
}

function renderLogin(opts) {
  const err = opts && opts.error;
  const notConfigured = opts && opts.notConfigured;
  return `<!doctype html><html lang="en"><head>${HEAD}<title>SMT Build — Sign in</title><style>${STYLE}
  .loginwrap{min-height:100vh;display:grid;place-items:center;padding:24px;}
  .lcard{width:100%;max-width:380px;background:var(--ink-3);border:1px solid var(--line);border-radius:16px;padding:34px 30px;
  background-image:radial-gradient(400px 160px at 50% -20%,rgba(91,141,239,.16),transparent);}
  .lcard h1{font-size:1.4rem;margin:0 0 4px;}
  .lcard p{color:var(--muted);font-size:.9rem;margin:0 0 22px;}
  .lcard label{display:block;font-size:.82rem;color:var(--muted);margin:14px 0 6px;}
  .lcard input{width:100%;padding:12px 14px;background:var(--ink);border:1px solid var(--line);border-radius:10px;color:var(--text);font:inherit;}
  .lcard input:focus{outline:none;border-color:var(--brand);box-shadow:0 0 0 3px rgba(91,141,239,.25);}
  .lcard button{width:100%;margin-top:22px;padding:13px;border:0;border-radius:11px;background:var(--grad);color:#06111f;font-weight:600;font-size:1rem;cursor:pointer;}
  .lcard button:hover{filter:brightness(1.08);}
  .err{color:#fca5a5;font-size:.86rem;margin-top:14px;min-height:1.1em;}
  </style></head>
<body><div class="loginwrap"><form class="lcard" id="f">
  <h1>Build status</h1>
  <p>S-Move Technologies — internal access only.</p>
  ${notConfigured ? '<div class="err">Login is not configured on the server yet (set SMT_BUILD_SECRET and SMT_BUILD_USERS).</div>' : `
  <label for="u">Username</label><input id="u" name="u" autocomplete="username" autocapitalize="none" autofocus>
  <label for="p">Password</label><input id="p" name="p" type="password" autocomplete="current-password">
  <button type="submit">Sign in</button>
  <div class="err" id="e">${err ? esc(err) : ''}</div>`}
  <script>
    var f=document.getElementById('f');
    if(f) f.addEventListener('submit',function(ev){
      ev.preventDefault();
      var e=document.getElementById('e'); e.textContent='';
      fetch('/build/login',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({u:document.getElementById('u').value,p:document.getElementById('p').value})})
      .then(function(r){return r.json();})
      .then(function(d){ if(d&&d.ok){location.href='/build';} else {e.textContent=(d&&d.error)||'Sign in failed.';}})
      .catch(function(){e.textContent='Network error.';});
    });
  </script>
</form></div></body></html>`;
}

function renderNotApproved() {
  return `<!doctype html><html lang="en"><head>${HEAD}<title>SMT Build — Access</title><style>${STYLE}
  .loginwrap{min-height:100vh;display:grid;place-items:center;padding:24px;}
  .lcard{width:100%;max-width:440px;background:var(--ink-3);border:1px solid var(--line);border-radius:16px;padding:34px 30px;
  background-image:radial-gradient(400px 160px at 50% -20%,rgba(251,191,36,.14),transparent);}
  .lcard h1{font-size:1.4rem;margin:0 0 10px;}
  .lcard p{color:var(--muted);font-size:.95rem;margin:0 0 12px;}
  .lock{font-size:1.6rem;margin-bottom:8px;}
  </style></head>
<body><div class="loginwrap"><div class="lcard">
  <div class="lock">&#128274;</div>
  <h1>This machine isn't approved</h1>
  <p>Access to the S-Move Technologies build record is restricted to enrolled devices holding confidential information.</p>
  <p>To use this device, ask an administrator for a <b>one-time enrolment link</b> and open it on this machine. Correct login details alone are not enough.</p>
</div></div></body></html>`;
}

function renderEnrolled() {
  return `<!doctype html><html lang="en"><head>${HEAD}<title>SMT Build — Device approved</title>
  <meta http-equiv="refresh" content="2;url=/build/login"><style>${STYLE}
  .loginwrap{min-height:100vh;display:grid;place-items:center;padding:24px;}
  .lcard{width:100%;max-width:420px;background:var(--ink-3);border:1px solid var(--line);border-radius:16px;padding:34px 30px;text-align:center;
  background-image:radial-gradient(400px 160px at 50% -20%,rgba(52,211,153,.16),transparent);}
  .lcard h1{font-size:1.4rem;margin:8px 0 10px;}
  .lcard p{color:var(--muted);font-size:.95rem;margin:0;}
  .ok{font-size:1.8rem;}
  </style></head>
<body><div class="loginwrap"><div class="lcard">
  <div class="ok">&#9989;</div>
  <h1>Device approved</h1>
  <p>This machine is now enrolled. Redirecting you to sign in&hellip; <a href="/build/login">continue</a></p>
</div></div></body></html>`;
}

function renderDevices(devices, usersList, user) {
  const userRows = (usersList || []).map(u => {
    const mc = !!u.must_change;
    const upd = u.updated_at ? new Date(u.updated_at).toLocaleString('en-GB') : '—';
    return `<tr>
      <td><b>${esc(u.username)}</b></td>
      <td>${mc ? '<span class="tagx warn">Must change password</span>' : '<span class="sub">Set</span>'}</td>
      <td>${esc(upd)}${u.updated_by ? ` <span class="sub">by ${esc(u.updated_by)}</span>` : ''}</td>
      <td><button class="revoke reset" data-user="${esc(u.username)}">Reset password</button></td></tr>`;
  }).join('');
  const rows = (devices || []).map(d => {
    const revoked = !!d.revoked_at;
    const seen = d.last_seen ? new Date(d.last_seen).toLocaleString('en-GB') : '—';
    const enr = d.enrolled_at ? new Date(d.enrolled_at).toLocaleString('en-GB') : '—';
    return `<tr class="${revoked ? 'rev' : ''}">
      <td><b>${esc(d.label || '—')}</b><div class="sub">${esc(d.device_id)}</div></td>
      <td>${esc(d.enrolled_by || '—')}</td><td>${esc(enr)}</td><td>${esc(seen)}</td>
      <td>${revoked
        ? '<span class="tagx rev">Revoked</span>'
        : `<button class="revoke" data-id="${esc(d.device_id)}">Revoke</button>`}</td></tr>`;
  }).join('');

  return `<!doctype html><html lang="en"><head>${HEAD}<title>SMT Build — Devices</title><style>${STYLE}
  .dwrap{max-width:940px;margin:0 auto;padding:30px 24px 80px;}
  .dwrap h1{font-size:1.6rem;margin:0 0 6px;}
  .dwrap .lede{color:var(--muted);margin:0 0 24px;}
  .gen{background:var(--ink-3);border:1px solid var(--line);border-radius:14px;padding:22px;margin-bottom:26px;}
  .gen h3{font-size:.76rem;text-transform:uppercase;letter-spacing:.1em;color:var(--brand-2);margin:0 0 12px;}
  .gen .row{display:flex;gap:10px;flex-wrap:wrap;}
  .gen input{flex:1;min-width:200px;padding:11px 13px;background:var(--ink);border:1px solid var(--line);border-radius:10px;color:var(--text);font:inherit;}
  .gen button{padding:11px 18px;border:0;border-radius:10px;background:var(--grad);color:#06111f;font-weight:600;cursor:pointer;}
  .linkout{margin-top:14px;display:none;}
  .linkout.show{display:block;}
  .linkbox{display:flex;gap:8px;margin-top:6px;}
  .linkbox input{flex:1;padding:10px 12px;background:var(--ink);border:1px solid var(--brand);border-radius:9px;color:var(--text);font:inherit;font-size:.85rem;}
  .linkbox button{padding:10px 14px;border:1px solid var(--line);border-radius:9px;background:var(--ink-2);color:var(--text);cursor:pointer;}
  .hint{color:var(--muted-2);font-size:.82rem;margin-top:8px;}
  table{border-collapse:collapse;width:100%;font-size:.9rem;}
  th{text-align:left;color:var(--muted-2);font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;padding:8px 10px;border-bottom:1px solid var(--line);}
  td{padding:12px 10px;border-bottom:1px solid var(--line);vertical-align:top;}
  td .sub{color:var(--muted-2);font-size:.75rem;margin-top:2px;font-family:ui-monospace,monospace;}
  tr.rev td{opacity:.5;}
  .revoke{padding:6px 12px;border:1px solid #7f1d1d;background:rgba(220,38,38,.12);color:#fca5a5;border-radius:8px;cursor:pointer;font:inherit;font-size:.82rem;}
  .revoke:hover{background:rgba(220,38,38,.22);}
  .tagx.rev{color:#fca5a5;font-size:.82rem;}
  .tagx.warn{color:#fbbf24;font-size:.82rem;}
  td .sub{color:var(--muted-2);font-size:.78rem;}
  .reset{border-color:var(--line);background:var(--ink-2);color:var(--text);}
  .reset:hover{border-color:var(--brand);background:rgba(91,141,239,.08);}
  .top a{color:var(--muted);} .back{display:inline-block;margin-bottom:18px;color:var(--muted);font-size:.9rem;}
  </style></head>
<body>
  <div class="top"><div class="t">S-Move Technologies<small>Approved devices</small></div>
    <div class="r"><span>${esc(user)}</span><a class="logout" href="/build">&larr; Dashboard</a></div></div>
  <div class="dwrap">
    <h1>Approved devices</h1>
    <p class="lede">Only enrolled machines can reach the build record. Generate a one-time link and open it on the new machine to enrol it.</p>
    <div class="gen">
      <h3>Enrol a new machine</h3>
      <div class="row">
        <input id="label" placeholder="Label (e.g. Dave&rsquo;s laptop)" maxlength="60">
        <button id="genbtn">Generate one-time link</button>
      </div>
      <div class="linkout" id="linkout">
        <div class="hint">Single-use, expires in 24 hours. Open it on the machine you&rsquo;re enrolling:</div>
        <div class="linkbox"><input id="linkurl" readonly><button id="copy">Copy</button></div>
      </div>
    </div>
    <table><thead><tr><th>Device</th><th>Enrolled by</th><th>Enrolled</th><th>Last seen</th><th></th></tr></thead>
    <tbody id="tbody">${rows || '<tr><td colspan="5" style="color:var(--muted-2)">No devices yet.</td></tr>'}</tbody></table>

    <h1 style="margin-top:44px">Users</h1>
    <p class="lede">Reset another user&rsquo;s password if they&rsquo;re locked out. They&rsquo;ll get a temporary password and be forced to set their own on next login. Change your own via the Password page.</p>
    <table><thead><tr><th>User</th><th>Password</th><th>Last changed</th><th></th></tr></thead>
    <tbody id="utbody">${userRows || '<tr><td colspan="4" style="color:var(--muted-2)">No users.</td></tr>'}</tbody></table>
  </div>
  <script>
    var genbtn=document.getElementById('genbtn'), linkout=document.getElementById('linkout'), linkurl=document.getElementById('linkurl');
    genbtn.addEventListener('click',function(){
      genbtn.disabled=true;
      fetch('/build/devices/new',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({label:document.getElementById('label').value})})
      .then(function(r){return r.json();}).then(function(d){
        genbtn.disabled=false;
        if(d&&d.url){linkurl.value=d.url;linkout.classList.add('show');}
        else alert((d&&d.error)||'Could not generate link.');
      }).catch(function(){genbtn.disabled=false;alert('Network error.');});
    });
    document.getElementById('copy').addEventListener('click',function(){
      linkurl.select();navigator.clipboard&&navigator.clipboard.writeText(linkurl.value);
    });
    document.getElementById('tbody').addEventListener('click',function(e){
      var b=e.target.closest('.revoke'); if(!b)return;
      if(!confirm('Revoke this device? It will lose access immediately.'))return;
      fetch('/build/devices/revoke',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({device_id:b.dataset.id})}).then(function(){location.reload();});
    });
    document.getElementById('utbody').addEventListener('click',function(e){
      var b=e.target.closest('.reset'); if(!b)return;
      if(!confirm('Reset '+b.dataset.user+"'s password? They'll get a temporary one and must change it on next login."))return;
      b.disabled=true;
      fetch('/build/users/reset',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({username:b.dataset.user})})
      .then(function(r){return r.json();}).then(function(d){
        b.disabled=false;
        if(d&&d.ok){prompt('Temporary password for '+b.dataset.user+' (copy it and hand it over — shown once):',d.tempPassword);}
        else alert((d&&d.error)||'Reset failed.');
      }).catch(function(){b.disabled=false;alert('Network error.');});
    });
  </script>
  ${copilotWidget()}
  ${copilotScript()}
</body></html>`;
}

function renderChangePassword(opts) {
  const forced = opts && opts.forced;
  const user = (opts && opts.user) || '';
  return `<!doctype html><html lang="en"><head>${HEAD}<title>SMT Build — Password</title><style>${STYLE}
  .loginwrap{min-height:100vh;display:grid;place-items:center;padding:24px;}
  .lcard{width:100%;max-width:400px;background:var(--ink-3);border:1px solid var(--line);border-radius:16px;padding:34px 30px;
  background-image:radial-gradient(400px 160px at 50% -20%,rgba(91,141,239,.16),transparent);}
  .lcard h1{font-size:1.4rem;margin:0 0 4px;}
  .lcard p{color:var(--muted);font-size:.9rem;margin:0 0 18px;}
  .lcard label{display:block;font-size:.82rem;color:var(--muted);margin:14px 0 6px;}
  .lcard input{width:100%;padding:12px 14px;background:var(--ink);border:1px solid var(--line);border-radius:10px;color:var(--text);font:inherit;}
  .lcard input:focus{outline:none;border-color:var(--brand);box-shadow:0 0 0 3px rgba(91,141,239,.25);}
  .lcard button{width:100%;margin-top:22px;padding:13px;border:0;border-radius:11px;background:var(--grad);color:#06111f;font-weight:600;font-size:1rem;cursor:pointer;}
  .lcard .link{display:block;text-align:center;margin-top:16px;font-size:.88rem;}
  .err{font-size:.86rem;margin-top:14px;min-height:1.1em;}
  .err.bad{color:#fca5a5;} .err.ok{color:#6ee7b7;}
  .notice{background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.4);color:#fbbf24;font-size:.86rem;padding:10px 12px;border-radius:9px;margin-bottom:6px;}
  </style></head>
<body><div class="loginwrap"><form class="lcard" id="f">
  <h1>Change password</h1>
  <p>Signed in as <b>${esc(user)}</b>.</p>
  ${forced ? '<div class="notice">You&rsquo;re using a temporary password &mdash; set your own to continue.</div>' : ''}
  <label for="o">Current password</label><input id="o" type="password" autocomplete="current-password" autofocus>
  <label for="n">New password</label><input id="n" type="password" autocomplete="new-password">
  <label for="c">Confirm new password</label><input id="c" type="password" autocomplete="new-password">
  <button type="submit">Update password</button>
  ${forced ? '' : '<a class="link" href="/build">&larr; Back to dashboard</a>'}
  <div class="err" id="e"></div>
  <script>
    var f=document.getElementById('f');
    f.addEventListener('submit',function(ev){
      ev.preventDefault();
      var e=document.getElementById('e'); e.className='err'; e.textContent='';
      var n=document.getElementById('n').value, c=document.getElementById('c').value;
      if(n!==c){e.className='err bad';e.textContent='New passwords do not match.';return;}
      if(n.length<8){e.className='err bad';e.textContent='New password must be at least 8 characters.';return;}
      fetch('/build/password',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({oldPass:document.getElementById('o').value,newPass:n})})
      .then(function(r){return r.json();}).then(function(d){
        if(d&&d.ok){e.className='err ok';e.textContent='Updated. Redirecting…';setTimeout(function(){location.href='/build';},700);}
        else {e.className='err bad';e.textContent=(d&&d.error)||'Could not update.';}
      }).catch(function(){e.className='err bad';e.textContent='Network error.';});
    });
  </script>
</form></div>
  ${copilotWidget()}
  ${copilotScript()}
</body></html>`;
}

const DOC_STYLE = `
.doc-wrap{max-width:880px;margin:0 auto;padding:34px 26px 96px;}
.doc-body{color:var(--text);line-height:1.6;}
.doc-body h1{font-size:1.5rem;color:var(--brand-2);margin:36px 0 12px;padding-top:22px;border-top:1px solid var(--line);letter-spacing:-.01em;}
.doc-body h1:first-child{border-top:0;padding-top:0;margin-top:4px;}
.doc-body h2{font-size:1.16rem;margin:26px 0 8px;color:var(--text);}
.doc-body h3{font-size:1rem;margin:18px 0 6px;color:var(--muted);text-transform:none;letter-spacing:0;}
.doc-body p{color:var(--muted);margin:.55rem 0;}
.doc-body strong{color:var(--text);}
.doc-body ul,.doc-body ol{color:var(--muted);margin:.5rem 0 .5rem 1.3rem;}
.doc-body li{margin:.28rem 0;}
.doc-body .tablewrap{overflow-x:auto;margin:14px 0;}
.doc-body table{border-collapse:collapse;width:100%;font-size:.9rem;}
.doc-body th,.doc-body td{border:1px solid var(--line);padding:7px 10px;text-align:left;vertical-align:top;}
.doc-body th{background:var(--ink-3);color:var(--text);}
.doc-body td p,.doc-body th p{margin:0;color:inherit;}
.doc-body code,.doc-body pre{font-family:ui-monospace,SFMono-Regular,monospace;font-size:.85rem;background:var(--ink-3);}
.doc-body pre{padding:12px;border:1px solid var(--line);border-radius:8px;overflow-x:auto;white-space:pre;color:var(--text);}
.doc-body a{color:var(--brand);}
`;

function renderDocPage(doc, bodyHtml) {
  // Wrap tables so wide ones scroll instead of breaking the page.
  const body = String(bodyHtml || '').replace(/<table>/g, '<div class="tablewrap"><table>').replace(/<\/table>/g, '</table></div>');
  return `<!doctype html><html lang="en"><head>${HEAD}<title>${esc(doc.title)} — SMT</title><style>${STYLE}${DOC_STYLE}</style></head>
<body>
  <div class="top">
    <div class="t">${esc(doc.project || 'S-Move Technologies')}<small>Technical documentation &middot; ${esc(doc.title)}</small></div>
    <div class="r"><a class="logout" href="#" onclick="window.close();return false;">Close tab</a></div>
  </div>
  <article class="doc-wrap"><div class="doc-body">${body}</div></article>
  ${copilotWidget()}
  ${copilotScript()}
</body></html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Team-facing "Set up Claude Code" page. Lightly key-gated (?key=SMT_TEAM_KEY),
// NOT behind the confidential device+login gate — it carries only sanitised
// methods, so staff can self-serve the org CLAUDE.md without device enrolment.
// ─────────────────────────────────────────────────────────────────────────────
function renderTeamSetup(opts) {
  const dl = (opts && opts.downloadUrl) || '#';
  return `<!doctype html><html lang="en"><head>${HEAD}<title>Set up Claude Code — S-Move</title><style>${STYLE}${DOC_STYLE}
  .ts-wrap{max-width:820px;margin:0 auto;padding:34px 26px 96px;}
  .ts-wrap h1{font-size:1.7rem;margin:0 0 6px;letter-spacing:-.01em;}
  .ts-lede{color:var(--muted);font-size:1.02rem;margin:0 0 26px;max-width:70ch;}
  .why{background:rgba(91,141,239,.08);border:1px solid rgba(91,141,239,.35);border-radius:12px;padding:18px 20px;margin:0 0 28px;}
  .why h3{margin:0 0 8px;color:var(--brand-2);font-size:.76rem;text-transform:uppercase;letter-spacing:.1em;}
  .why p{color:var(--muted);margin:0;font-size:.96rem;}
  .dlbtn{display:inline-flex;align-items:center;gap:10px;padding:14px 22px;border:0;border-radius:12px;background:var(--grad);color:#06111f;font-weight:700;font-size:1rem;text-decoration:none;}
  .dlbtn:hover{filter:brightness(1.08);color:#06111f;}
  .steps{counter-reset:s;margin:26px 0 0;padding:0;list-style:none;}
  .steps li{position:relative;padding:2px 0 18px 42px;color:var(--muted);}
  .steps li::before{counter-increment:s;content:counter(s);position:absolute;left:0;top:0;width:28px;height:28px;border-radius:50%;
  background:var(--ink-3);border:1px solid var(--line);color:var(--brand-2);font-weight:700;font-size:.9rem;display:grid;place-items:center;}
  .steps li b{color:var(--text);}
  .steps code{font-family:ui-monospace,monospace;font-size:.85rem;background:var(--ink-3);border:1px solid var(--line);border-radius:6px;padding:2px 6px;color:var(--text);}
  .rules{margin:30px 0 0;padding:20px 22px;background:var(--ink-3);border:1px solid var(--line);border-radius:12px;}
  .rules h3{margin:0 0 10px;color:var(--brand-2);font-size:.76rem;text-transform:uppercase;letter-spacing:.1em;}
  .rules ul{margin:0;padding-left:20px;color:var(--muted);}.rules li{margin:.4rem 0;}.rules b{color:var(--text);}
  </style></head>
<body>
  <div class="top"><div class="t">S-Move Technologies<small>Set up Claude Code</small></div>
    <div class="r"><a class="logout" href="/build">&larr; Dashboard</a></div></div>
  <article class="ts-wrap">
    <h1>Get Claude Code working the S-Move way</h1>
    <p class="ts-lede">This bundle sets your Claude up to build in our style — the SMT team guide plus our
      brand logos — so what you make matches our systems and has the right assets to hand.</p>

    <div class="why">
      <h3>Why this matters (read me)</h3>
      <p>Our live apps hold real customer, staff and financial data, and one push to a connected repo goes
        straight to production. The rules in this file aren't about distrust — they're the exact guardrails
        Alex works within too. They exist so you can learn, experiment and build with total freedom, knowing
        nothing you do can reach a live system before it's been checked. Stay inside them and you genuinely
        can't break anything that matters.</p>
    </div>

    <a class="dlbtn" href="/build/claude-bundle">&#11015;&nbsp; Download setup bundle (guide + logos)</a>
    <div style="margin:10px 0 0;font-size:.86rem;"><a href="${esc(dl)}" style="color:var(--muted);">or just the guide (CLAUDE.md) on its own</a></div>

    <ol class="steps">
      <li><b>Download &amp; unzip the bundle above.</b> Inside you'll find <code>CLAUDE.md</code>, a
        <code>smt-brand-assets</code> folder (the logos), and a <code>README.txt</code>.</li>
      <li><b>Find your Claude folder.</b> On Windows it's <code>C:\\Users\\&lt;your-name&gt;\\.claude\\</code>
        (turn on "show hidden items" if you can't see it). On Mac it's <code>~/.claude/</code>.</li>
      <li><b>Put <code>CLAUDE.md</code> there</b> (if one already exists, paste this underneath it), and
        <b>drop the <code>smt-brand-assets</code> folder alongside it</b> in the same <code>.claude</code> folder.</li>
      <li><b>Open Claude Code and start working.</b> It reads <code>CLAUDE.md</code> automatically in every
        project, and can copy the right brand logo from <code>smt-brand-assets</code> into your work when needed.</li>
      <li><b>Re-download whenever it's updated.</b> Alex keeps this current; grab a fresh bundle from this page
        when things change.</li>
    </ol>

    <div class="rules">
      <h3>The one rule that never bends</h3>
      <ul>
        <li>Build freely inside <b>the project assigned to you</b> and its own sandbox.</li>
        <li><b>Never</b> push, deploy, or make live anything touching S-Move's real apps or databases
          <b>without Alex's say-so</b> for that specific change.</li>
        <li>If a task looks like it needs a live or shared system — <b>stop and ask Alex first.</b></li>
        <li><b>Ownership:</b> anything built using an SMT Claude account or seat is the
          property of <b>S-Move Technologies Ltd</b>.</li>
      </ul>
    </div>
  </article>
  ${copilotWidget()}
  ${copilotScript()}
</body></html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Brand-asset library — logged-in gallery of logos/graphics streamed from the
// private SMD Storage bucket. Previews and downloads both go through the gated
// /build/brand/file route (carries the session cookie), so nothing is public.
// ─────────────────────────────────────────────────────────────────────────────
const BRAND_ORDER = ['SMT', 'SMD', 'SMR', 'SMO'];
const BRAND_LABEL = { SMT: 'S-Move Technologies', SMD: 'S-Move Dealer', SMR: 'S-Move Removals', SMO: 'S-Move Operations' };

function renderBrandLibrary(manifest, user) {
  const assets = (manifest && manifest.assets) || [];
  const groups = {};
  assets.forEach(a => { (groups[a.brand] = groups[a.brand] || []).push(a); });
  const brands = Object.keys(groups).sort((a, b) => {
    const ia = BRAND_ORDER.indexOf(a), ib = BRAND_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  const card = (a) => {
    const url = '/build/brand/file?path=' + encodeURIComponent(a.path);
    return `<div class="ba-card">
      <div class="ba-prev"><img src="${esc(url)}" alt="${esc(a.name)}" loading="lazy"></div>
      <div class="ba-meta">
        <div class="ba-name">${esc(a.name)}${a.recommended ? ' <span class="ba-star">&#9733;</span>' : ''}</div>
        ${a.usage ? `<div class="ba-use">${esc(a.usage)}</div>` : ''}
        <div class="ba-row"><span class="ba-file">${esc(a.path.split('/').pop())}</span>
          <a class="ba-dl" href="${esc(url)}&amp;dl=1">Download</a></div>
      </div>
    </div>`;
  };

  const sections = brands.map(b =>
    `<section class="ba-sec"><h2>${esc(b)} <span>&middot; ${esc(BRAND_LABEL[b] || '')}</span></h2>
      <div class="ba-grid">${groups[b].map(card).join('')}</div></section>`
  ).join('') || '<p class="ba-empty">No assets yet.</p>';

  return `<!doctype html><html lang="en"><head>${HEAD}<title>Brand assets — SMT</title><style>${STYLE}
  .ba-wrap{max-width:1080px;margin:0 auto;padding:30px 24px 90px;}
  .ba-wrap h1{font-size:1.6rem;margin:0 0 6px;}
  .ba-lede{color:var(--muted);margin:0 0 22px;max-width:75ch;}
  .ba-sec{margin:28px 0 8px;}
  .ba-sec h2{font-size:.8rem;text-transform:uppercase;letter-spacing:.1em;color:var(--brand-2);border-bottom:1px solid var(--line);padding-bottom:8px;margin:0 0 16px;}
  .ba-sec h2 span{color:var(--muted-2);font-weight:400;text-transform:none;letter-spacing:0;}
  .ba-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;}
  .ba-card{background:var(--ink-3);border:1px solid var(--line);border-radius:12px;overflow:hidden;display:flex;flex-direction:column;}
  .ba-prev{height:140px;display:grid;place-items:center;padding:14px;
    background:#8b93a6;background-image:linear-gradient(45deg,#7c8498 25%,transparent 25%),linear-gradient(-45deg,#7c8498 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#7c8498 75%),linear-gradient(-45deg,transparent 75%,#7c8498 75%);background-size:18px 18px;background-position:0 0,0 9px,9px -9px,-9px 0;}
  .ba-prev img{max-width:100%;max-height:112px;object-fit:contain;}
  .ba-meta{padding:12px 14px;display:flex;flex-direction:column;gap:4px;flex:1;}
  .ba-name{color:var(--text);font-size:.92rem;font-weight:600;}
  .ba-star{color:#fbbf24;}
  .ba-use{color:var(--muted);font-size:.82rem;line-height:1.45;flex:1;}
  .ba-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:8px;}
  .ba-file{color:var(--muted-2);font-size:.72rem;font-family:ui-monospace,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .ba-dl{flex:none;font-size:.8rem;font-weight:600;padding:6px 12px;border-radius:8px;background:var(--grad);color:#06111f;text-decoration:none;}
  .ba-dl:hover{filter:brightness(1.08);}
  .ba-empty{color:var(--muted-2);}
  </style></head>
<body>
  <div class="top"><div class="t">S-Move Technologies<small>Brand assets</small></div>
    <div class="r"><span>${esc(user || '')}</span><a class="logout" href="/build">&larr; Dashboard</a></div></div>
  <article class="ba-wrap">
    <h1>Brand assets</h1>
    <p class="ba-lede">Logos and graphics for each brand. Downloads are private &mdash; they only work while you're logged in here.
      To use one on another machine: download it, then drop it into your project for Claude to use. &#9733; marks the recommended default per brand.</p>
    ${sections}
  </article>
  ${copilotWidget()}
  ${copilotScript()}
</body></html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Health / uptime dashboard — current status of each deploy + a downtime log.
// ─────────────────────────────────────────────────────────────────────────────
function fmtWhen(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('en-GB'); } catch { return esc(iso); }
}
function fmtDur(fromIso, toIso) {
  try {
    const ms = (toIso ? new Date(toIso) : new Date()) - new Date(fromIso);
    const m = Math.max(0, Math.round(ms / 60000));
    if (m < 60) return m + 'm';
    const h = Math.floor(m / 60), r = m % 60;
    if (h < 24) return h + 'h ' + r + 'm';
    return Math.floor(h / 24) + 'd ' + (h % 24) + 'h';
  } catch { return '—'; }
}

function renderHealth(services, incidents, user, opts) {
  const publicView = !!(opts && opts.publicView);
  const down = services.filter(s => s.status === 'down').length;
  const banner = down === 0
    ? `<div class="hb ok">&#9679; All systems operational</div>`
    : `<div class="hb bad">&#9679; ${down} service${down > 1 ? 's' : ''} down</div>`;

  const cards = services.map(s => {
    const cls = s.status === 'up' ? 'up' : s.status === 'down' ? 'down' : 'unk';
    const label = s.status === 'up' ? 'Operational' : s.status === 'down' ? 'Down' : 'Unknown';
    return `<div class="hcard ${cls}">
      <div class="hc-top"><span class="dot"></span><b>${esc(s.name)}</b></div>
      <div class="hc-stat">${label}</div>
      <div class="hc-kv"><span>Checked</span><span>${fmtWhen(s.checkedAt)}</span></div>
      <div class="hc-kv"><span>Latency</span><span>${s.ms != null ? esc(s.ms) + ' ms' : '—'}</span></div>
      <div class="hc-kv"><span>HTTP</span><span>${s.httpStatus != null ? esc(s.httpStatus || '—') : '—'}</span></div>
      <a class="hc-url" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url.replace('https://', ''))} &#8599;</a>
    </div>`;
  }).join('');

  const rows = (incidents || []).map(i => {
    const ongoing = !i.up_at;
    return `<tr class="${ongoing ? 'ong' : ''}">
      <td><b>${esc(nameOf(services, i.service))}</b></td>
      <td>${fmtWhen(i.down_at)}</td>
      <td>${ongoing ? '<span class="ong-tag">ongoing</span>' : fmtWhen(i.up_at)}</td>
      <td>${fmtDur(i.down_at, i.up_at)}</td>
      <td class="hmono">${esc(i.detail || '')}</td></tr>`;
  }).join('');

  return `<!doctype html><html lang="en"><head>${HEAD}<title>Health — SMT</title>
  <meta http-equiv="refresh" content="60"><style>${STYLE}
  .h-wrap{max-width:1000px;margin:0 auto;padding:30px 24px 90px;}
  .h-wrap h1{font-size:1.6rem;margin:0 0 4px;}
  .h-lede{color:var(--muted);margin:0 0 18px;}
  .hb{display:inline-block;font-weight:700;font-size:.9rem;padding:8px 16px;border-radius:999px;margin:0 0 22px;}
  .hb.ok{background:rgba(52,211,153,.14);color:#34d399;border:1px solid rgba(52,211,153,.4);}
  .hb.bad{background:rgba(248,113,113,.14);color:#f87171;border:1px solid rgba(248,113,113,.45);}
  .hgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-bottom:34px;}
  .hcard{background:var(--ink-3);border:1px solid var(--line);border-radius:12px;padding:16px 18px;}
  .hcard .dot{width:10px;height:10px;border-radius:50%;flex:none;display:inline-block;}
  .hcard.up .dot{background:#34d399;box-shadow:0 0 0 3px rgba(52,211,153,.2);}
  .hcard.down .dot{background:#f87171;box-shadow:0 0 0 3px rgba(248,113,113,.2);}
  .hcard.unk .dot{background:var(--muted-2);}
  .hcard.up{border-color:rgba(52,211,153,.35);} .hcard.down{border-color:rgba(248,113,113,.45);}
  .hc-top{display:flex;align-items:center;gap:9px;font-size:.98rem;}
  .hc-stat{margin:6px 0 12px 19px;font-size:.82rem;color:var(--muted);}
  .hcard.up .hc-stat{color:#34d399;} .hcard.down .hc-stat{color:#f87171;}
  .hc-kv{display:flex;justify-content:space-between;font-size:.82rem;color:var(--muted);padding:3px 0;}
  .hc-kv span:last-child{color:var(--text);font-variant-numeric:tabular-nums;}
  .hc-url{display:block;margin-top:10px;font-size:.76rem;color:var(--brand);word-break:break-all;}
  .h-sec{font-size:.76rem;text-transform:uppercase;letter-spacing:.1em;color:var(--brand-2);border-bottom:1px solid var(--line);padding-bottom:8px;margin:0 0 14px;}
  table.hlog{border-collapse:collapse;width:100%;font-size:.88rem;}
  table.hlog th{text-align:left;color:var(--muted-2);font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;padding:8px 10px;border-bottom:1px solid var(--line);}
  table.hlog td{padding:10px;border-bottom:1px solid var(--line);vertical-align:top;color:var(--muted);}
  table.hlog tr.ong td{background:rgba(248,113,113,.06);}
  .ong-tag{color:#f87171;font-weight:600;}
  .hmono{font-family:ui-monospace,monospace;font-size:.78rem;color:var(--muted-2);}
  .h-note{color:var(--muted-2);font-size:.82rem;margin-top:10px;}
  </style></head>
<body>
  <div class="top"><div class="t">S-Move Technologies<small>${publicView ? 'System status' : 'Deploy health'}</small></div>
    <div class="r">${publicView
      ? '<a class="logout" href="/build/health">Team &middot; full history &rarr;</a>'
      : `<span>${esc(user || '')}</span><a class="logout" href="/build">&larr; Dashboard</a>`}</div></div>
  <article class="h-wrap">
    <h1>${publicView ? 'System status' : 'Deploy health'}</h1>
    <p class="h-lede">Live status of each S-Move deploy, checked every 3 minutes. This page auto-refreshes each minute.</p>
    ${banner}
    <div class="hgrid">${cards}</div>
    ${publicView ? '' : `<div class="h-sec">Downtime log</div>
    ${rows
      ? `<table class="hlog"><thead><tr><th>Service</th><th>Went down</th><th>Recovered</th><th>Duration</th><th>Detail</th></tr></thead><tbody>${rows}</tbody></table>`
      : `<p class="h-note">No downtime recorded${incidents ? '' : ' (logging table not set up yet — see setup note)'}. &#127881;</p>`}`}
  </article>
  ${publicView ? '' : copilotWidget() + copilotScript()}
</body></html>`;
}
function nameOf(services, key) { const s = services.find(x => x.key === key); return s ? s.name : key; }

// ─────────────────────────────────────────────────────────────────────────────
// Claude Code seat-activity log — who's been working on which project (gated).
// ─────────────────────────────────────────────────────────────────────────────
function renderActivity(rows, user, opts) {
  rows = rows || [];
  const configured = !(opts && opts.configured === false);
  // Latest row per user → "recently active" summary.
  const latest = {};
  rows.forEach(r => { const u = r.user_label || '—'; if (!latest[u]) latest[u] = r; });
  const cards = Object.keys(latest).map(u => {
    const r = latest[u];
    return `<div class="ac-card"><div class="ac-who">${esc(u)}</div>
      <div class="ac-proj">${esc(r.project || '—')}</div>
      <div class="ac-when">${fmtWhen(r.created_at)}</div></div>`;
  }).join('') || '<p class="h-note">No sessions logged yet.</p>';

  const logRows = rows.map(r => `<tr>
    <td>${fmtWhen(r.created_at)}</td>
    <td><b>${esc(r.user_label || '—')}</b></td>
    <td>${esc(r.project || '—')}</td>
    <td>${esc(r.model || '')}</td>
    <td>${esc(r.source || '')}</td>
    <td class="hmono">${esc(r.cwd || '')}</td></tr>`).join('');

  const setupNote = configured ? '' :
    `<p class="h-note">Activity logging isn't switched on yet (set <code>SMT_ACTIVITY_KEY</code> on the server and create the <code>claude_activity</code> table).</p>`;

  return `<!doctype html><html lang="en"><head>${HEAD}<title>Activity — SMT</title><style>${STYLE}
  .a-wrap{max-width:1000px;margin:0 auto;padding:30px 24px 90px;}
  .a-wrap h1{font-size:1.6rem;margin:0 0 4px;}
  .a-lede{color:var(--muted);margin:0 0 20px;max-width:75ch;}
  .acgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-bottom:30px;}
  .ac-card{background:var(--ink-3);border:1px solid var(--line);border-radius:12px;padding:14px 16px;}
  .ac-who{font-weight:700;color:var(--text);}
  .ac-proj{color:var(--brand-2);font-size:.92rem;margin:4px 0 2px;}
  .ac-when{color:var(--muted-2);font-size:.78rem;}
  .h-sec{font-size:.76rem;text-transform:uppercase;letter-spacing:.1em;color:var(--brand-2);border-bottom:1px solid var(--line);padding-bottom:8px;margin:0 0 14px;}
  table.hlog{border-collapse:collapse;width:100%;font-size:.86rem;}
  table.hlog th{text-align:left;color:var(--muted-2);font-size:.72rem;text-transform:uppercase;letter-spacing:.06em;padding:8px 10px;border-bottom:1px solid var(--line);}
  table.hlog td{padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:top;color:var(--muted);}
  .hmono{font-family:ui-monospace,monospace;font-size:.76rem;color:var(--muted-2);word-break:break-all;}
  .h-note{color:var(--muted-2);font-size:.85rem;}
  </style></head>
<body>
  <div class="top"><div class="t">S-Move Technologies<small>Seat activity</small></div>
    <div class="r"><span>${esc(user || '')}</span><a class="logout" href="/build">&larr; Dashboard</a></div></div>
  <article class="a-wrap">
    <h1>Seat activity</h1>
    <p class="a-lede">Which project each S-Move Claude seat is working on, reported at the start of each session
      (project folder, person, model, time &mdash; not the content of the work).</p>
    ${setupNote}
    <div class="h-sec">Recently active</div>
    <div class="acgrid">${cards}</div>
    <div class="h-sec">Session log</div>
    ${logRows
      ? `<table class="hlog"><thead><tr><th>When</th><th>Who</th><th>Project</th><th>Model</th><th>Start</th><th>Folder</th></tr></thead><tbody>${logRows}</tbody></table>`
      : '<p class="h-note">Nothing logged yet.</p>'}
  </article>
  ${copilotWidget()}
  ${copilotScript()}
</body></html>`;
}

module.exports = { renderDashboard, renderLogin, renderNotApproved, renderEnrolled, renderDevices, renderChangePassword, renderDocPage, renderTeamSetup, renderBrandLibrary, renderHealth, renderActivity };
