// ─────────────────────────────────────────────────────────────────────────────
// SMD GO-TO-MARKET: COUNCIL OUTREACH + LOCAL CHAMPIONS
// Wired into /build via data/build-status.js (required there and attached to the
// SMD project as `goToMarket`; rendered by renderGoToMarket() in lib/build-render.js).
//
// Research date: 2026-07-27. Full source-cited detail lives in two docs served from
// docs-store/ (registered in build-status.js under this project's `docs`):
//   smd-council-outreach-plan.md (councils, contacts, funding)
//   smd-local-champions.md       (named advocates, handling notes)
// Councils covered: Edinburgh, East Lothian, Midlothian, West Lothian.
//
// NOTE: contains named people and public contact routes. /build is login-gated
// (Alex + Dave) so this is fine there, but do NOT surface it on any public page.
// Confirm roles before addressing anyone by name — council/BID roles change.
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  // Drop this into the SMD project object as:  goToMarket: { ... }
  goToMarket: {
    updated: '2026-08-04',
    documents: [
      { label: 'East Lothian Council Briefing (Cllr McMillan) — PDF', url: '/build/doc/smd-council-briefing-mcmillan' },
      { label: 'Funding Expenditure Analysis (East Lothian ask) — Excel', url: '/build/doc/smd-funding-expenditure-analysis' },
    ],
    summary:
      'Directory-first community bootstrap needs local backing. Two routes per council: the Economic Development team (strategy + funding + BID relationships) and the BID/traders body (fast, warm route to actual shops). Every council speaks "Community Wealth Building" — SMD maps to it almost word-for-word. Start on home turf (East Lothian), use it as the reference site, approach Edinburgh last via its BIDs.',

    playbook: [
      'Hit two front doors per council in parallel: Economic Development (official) + the BID/traders body (fast route to shops).',
      'Frame to their language: Community Wealth Building / town-centre vitality / keeping spend local.',
      'Kill the "who profits / is this a cost?" objection up front: free to list, never pay-to-rank, mission-driven — councils can promote it with no budget.',
      'Complement, don\'t compete: East Lothian and Midlothian already run free directories — SMD is the discover-and-buy layer on top.',
      'Officer first, portfolio councillor second (political backing once a conversation is live). Keep all political contact strictly cross-party.',
      'Sequence: East Lothian (home, warmest) → Midlothian & West Lothian (obvious pilot towns/BIDs) → Edinburgh (biggest, via BIDs).',
    ],

    councils: [
      {
        name: 'East Lothian', priority: 'START HERE (home council)',
        insight: 'The council\'s own Economic Development team ("Invest East Lothian") RUNS the eastlothian.com directory AND the "Love East Lothian / Shop Local" campaigns — ally and overlap in one. Pitch SMD as the transactional layer on top of their listings.',
        firstContact: 'economicdevelopment@eastlothian.gov.uk (contact form: investeastlothian.com/contact-us)',
        routeToShops: 'Their own Shop Local campaign + directory business comms (no formal BIDs in ELdom).',
        councillor: 'Provost Cllr John McMillan — Env/Econ Dev/Tourism — jmcmillan@eastlothian.gov.uk / 07718 669398',
        funding: 'East Lothian Investments Ltd (0% loans ≤£25k); UK Shared Prosperity Fund; One Council Partnership Fund; Business Growth & Innovation Capital Grant (£15k–£35k). Best fit: partnership/promotion + community-wealth angle.',
        strategyHook: 'Local Economy Strategy 2024–2034 ("Grow our Economy" / "Prosperous").',
      },
      {
        name: 'Midlothian', priority: 'Strong CWB + Dalkeith pilot',
        insight: 'Maps onto the flagship Community Wealth Building agenda; Dalkeith regeneration consultation explicitly wants "more independent businesses". Also runs a free directory (complement it).',
        firstContact: 'econ-dev@midlothian.gov.uk — ask for Alasdair MacQuarrie (Econ Dev Officer, Community Wealth Building)',
        routeToShops: 'Dalkeith Means Business (emerging BID) — dmb@opus.uk.com / 07736 820282 — actively canvassing the same shops; ideal pilot town.',
        councillor: 'Cllr Colin Cassidy — Depute Leader, Econ Dev/Planning/Transport — colin.cassidy@midlothian.gov.uk / 0131 271 3007 (Leader Cllr Kelly Parry fronted Dalkeith consultation).',
        funding: 'UK Shared Prosperity Fund (~£3.56m; CWB strand; ≤£9,592 revenue / ≤£15,080 capital; must be Midlothian-based — SMD qualifies via Ormiston/EH35). Confirm current window.',
        strategyHook: 'Inclusive Growth Strategy 2023–28; Economic Strategy Delivery Plan 2025–27.',
      },
      {
        name: 'West Lothian', priority: 'Named manager + One Linlithgow BID',
        insight: 'Clearest named officer of the four; active well-run BID as an obvious pilot; Depute Leader\'s portfolio is literally "Community Empowerment and Wealth Building".',
        firstContact: 'bgateway@westlothian.gov.uk — Alice Mitchell (Economic Development Manager) — 01506 777 400',
        routeToShops: 'One Linlithgow Ltd (BID, 300+ businesses) — office@onelinlithgow.com — natural pilot; also Scott McKillop (Community Regeneration Officer, Whitburn) scott.mckillop@westlothian.gov.uk / 01506 281092.',
        councillor: 'Cllr Susan Manion — Depute Leader, Economy/Community Empowerment & Wealth Building (via Councillors & Democracy pages).',
        funding: 'Economic Investment Plan 2025–2035 ("Enterprise Growth"); Town Centre Fund (via 9 Local Area Committees); Shopfront Improvement Scheme; Common Good / Third Sector funding.',
        strategyHook: 'Five supported town centres: Armadale, Bathgate, Broxburn & Uphall, Linlithgow, Whitburn.',
      },
      {
        name: 'Edinburgh', priority: 'Reach it through its BIDs',
        insight: 'Biggest/most complex; no single "shop local" programme. The BIDs are the real route to indie shops.',
        firstContact: 'BGI@edinburgh.gov.uk (Business Growth & Inclusion) — switchboard 0131 529 3030',
        routeToShops: 'Essential Edinburgh (info@essentialedinburgh.co.uk, CEO Roddy Smith) + Greater Grassmarket (0131 510 7555). Umbrella list: Scotland\'s Improvement Districts info@improvementdistricts.scot.',
        councillor: 'Economy sits under Housing, Homelessness & Fair Work Committee (Convener Cllr Tim Pogson per Oct 2025 — confirm).',
        funding: 'Regeneration Capital Grant Fund; Community Grants Fund (≤£5k, constituted community groups); Edinburgh Visitor Levy spend (ask BGI).',
        strategyHook: '"Stronger, Greener, Fairer" economic strategy — collaboration + inclusion of small/independent businesses.',
      },
    ],

    // People already campaigning for local high streets who could lend a voice,
    // shop introductions, or coverage. Warmest first. Handling flags matter.
    champions: {
      topSix: [
        'Kimberley Guthrie — Chief Officer, Scotland\'s Towns Partnership (runs Scotland Loves Local). National, highest leverage — position SMD as delivering Love Local locally; the gift card is physical-only so SMD complements it. lovelocal.scot/contact-us. (Address Guthrie, NOT former chief Phil Prentice.)',
        'Philip Mellor — Chair, Dunbar Trades\' Association (East Lothian). Already runs offline "Shop Local – Win Local" — SMD is the digital version. dunbar.org.uk/dta.',
        'Emma Bouglet — Business Manager, East Lothian Food & Drink BID. Public language is textbook SMD; reaches many members. scotlandsfooddrinkcounty.com.',
        'Mark Darragh — Deputy Chair, One Linlithgow BID (West Lothian). "Every time someone chooses local, they\'re making an investment in our community." Closest verbatim match. onelinlithgow.com. (Ops: Tony I\'Anson, BID Manager.)',
        'Tom Donaldson — Chair, Dalkeith Means Business (Midlothian). Actively building a town directory — natural pilot partner. dalkeithmeansbusiness.co.uk.',
        'Daniel Johnson MSP (Lab, Edinburgh Southern). A Lothian MSP who WAS an independent retailer (ex-Paper Tiger/Studio One); chaired the town-centres inquiry. Best political voice — pair with Fiona Hyslop MSP (SNP, Linlithgow) to stay cross-party.',
      ],
      otherLocal: [
        'East Lothian: Susan Oliver (North Berwick Business Assoc — POSITIVE angle only, mid parking dispute); Mike Falconer/Neil Ellis (Tranent CC); DJ Johnston-Smith (Prestonpans CC); Musselburgh Business Partnership; sympathetic shop owners Chris Lockett, Meg Maitland, Blueberry (founding listers/testimonials).',
        'Edinburgh: Fawns Reid (Greater Grassmarket/Fabhatrix); Morningside Traders Association; Kevin Buckle (Evening News columnist — win with substance, he\'s a critic of hollow schemes); Roddy Smith (Essential Edinburgh — frame as complementary, never a rival).',
        'National credibility: Colin Borland (FSB Scotland — warm, easy, campaigns on Lothian issues); Dr Pete Cheema OBE (Scottish Grocers\' Federation — "embraced local"); Neil McInroy (Community Wealth Building — aspirational thought-leadership); David Lonsdale (Scottish Retail Consortium — authority, big-retail-leaning).',
      ],
      openings: [
        'Haddington has NO active business association (a councillor publicly called for one) — SMD can be the ready-made focal point.',
        'Media (coverage, not endorsement): East Lothian Courier (editor Robbie Scott); Midlothian View; West Lothian Courier; trade: Scottish Grocer. No single national indie-retail columnist owns the beat — pitch the story to outlets.',
      ],
      handlingRules: [
        'Politicians = strictly cross-party: identical neutral framing to Labour (Johnson) and SNP (Hyslop); comment on the mission, not the party. Same for East Lothian councillors (e.g. Craig Hoy MSP ran a "Support Our High Streets" campaign).',
        'North Berwick / Susan Oliver — positive "help shops trade" angle only; stay out of the live parking dispute.',
        'BIDs (Roddy Smith etc.) — always "complements your BID", never "replaces"; lead with free / never-charges-to-rank.',
        'Kevin Buckle — substance over spin.',
        'Scotland\'s Towns Partnership — address Guthrie, not Prentice.',
      ],
    },

    firstMoves: [
      'Scotland\'s Towns Partnership (national umbrella + distribution) — highest leverage.',
      'Two warm local pilots in parallel: Philip Mellor (Dunbar) + Mark Darragh / One Linlithgow — both already run shop-local activity.',
      'Daniel Johnson MSP for a credible, non-partisan political voice (pair with Hyslop).',
      'Pitch SMD as the missing business-association focal point in Haddington.',
      'Keep a tracker: name / org / date sent / warmth / handling flag / next action.',
    ],

    refs: [
      { label: 'SMD Council Outreach Plan (full, source-cited)', url: '/build/doc/smd-council-outreach-plan' },
      { label: 'SMD Local Champions & Allies (full, source-cited)', url: '/build/doc/smd-local-champions' },
    ],
  },
};
