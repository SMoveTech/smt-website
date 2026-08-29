// ─────────────────────────────────────────────────────────────────────────────
// SMD COMPETITOR ANALYSIS — wired into /build via data/build-status.js
// (required there and attached to the SMD project as `competitorAnalysis`;
// rendered by renderCompetitor() in lib/build-render.js).
//
// Research date: 2026-07-27. Source: web research into prior local-marketplace
// attempts, focused on ShopAppy (the closest UK precedent to SMD, and one that
// reached Scotland before shutting down in Oct 2023).
//
// Human-readable write-up is at the bottom of this file for reference.
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  // Drop this into the SMD project object as:  competitorAnalysis: { ... }
  competitorAnalysis: {
    updated: '2026-07-27',
    summary:
      'SMD is not a novel idea — it is a well-attempted one where the nearest UK incumbent (ShopAppy) failed for a specific, fixable reason we are already aiming at. Proven demand, no live competitor in Scotland, clear diagnosis of what to do differently.',

    priorAttempts: [
      {
        name: 'ShopAppy',
        verdict: 'Closest precedent — ceased trading Oct 2023, founder pivoted to media',
        what: 'Per-town "virtual high street": a directory of local indies you could browse, then click-and-collect / delivery / pay-on-pickup. Founded by Dr Jackie Mulligan (ex-Leeds Beckett), launched 2017 from Lincoln. Mission almost identical to SMD: "level the playing field" for indies vs chains and online giants.',
        model: 'Free/cheap listing then £3–£5/week subscription, no sales commission. Heavily reliant on council / BID subsidy (often 12 months free — e.g. Basildon/Go Trade, Cannock Chase, Colne BID, Doncaster). Visa partnership; award-winning; big 2020 pandemic surge.',
        scale: '120+ UK towns at peak (Penarth to Kilmarnock), thousands of shops, ~45,000 organic search visits/month. Reached Scotland: Kirkcaldy was the first Scottish town, plus Kilmarnock.',
        whyItFailed: [
          'Discovery worked; conversion + fulfilment did not — single-staff shops could not keep real-time inventory, take online payments AND ship parcels while running the shop.',
          'Every feature added (click-and-collect, courier, pay-on-pickup) increased merchant complexity rather than reducing it.',
          'Unit economics broke — running a multi-tenant platform for thousands of micro-merchants cost more than it sustainably earned.',
          'Subsidy cliff — many shops only joined because a council paid year one; retention fell when the free period ended.',
          'Founder relaunched ShopAppy in 2026 as a retail MEDIA/editorial site, abandoning the platform model entirely.',
        ],
      },
      {
        name: 'Trouva',
        verdict: 'VC-backed aggregator — collapsed, burned the indies',
        what: 'Aggregated independent boutiques into one national marketplace — the same core idea, scaled with venture money.',
        whyItMatters:
          'Acquired five times in three years, went into administration, left independent retailers owed ~£954,000 with no payout. Cautionary tale: growth-at-all-costs plus squeezing the shops = collapse. Direct argument for SMD\'s free-forever, honest, no-pay-to-rank principles.',
      },
      {
        name: 'Shop Where I Live (US)',
        verdict: 'Live — proves the partnership route works',
        what: 'Builds one shared local marketplace per community in partnership with Chambers of Commerce and economic-development orgs. Active across several US states. Validates treating a council/economic-development body as an ally/data source rather than a rival.',
      },
      {
        name: 'Totally Locally / LoyalFree / WeAreFarnham / Streetify',
        verdict: 'Various — campaigns & town-level platforms',
        what: 'A crowded field of grass-roots campaigns and per-town platforms. Confirms sustained demand for the concept; none has nailed durable economics.',
      },
    ],

    // What each finding means for how we build SMD.
    implicationsForSMD: [
      'Stock-truth targets the EXACT thing that killed ShopAppy (indies cannot keep real-time inventory in sync). Make keeping stock accurate effortless — scan-to-list, signed QR, till-on-a-phone — and we fix the market leader\'s fatal flaw. Lead the pitch with this. NOTE (2026-08-29): that capability is no longer an SMD feature; it became a separate product, S-Move Ledger (SML), which treats SMD as one sales channel among several. The strategic point stands and arguably gets stronger — a shop running SML keeps its SMD listing accurate as a byproduct of using its own till — but SMD no longer owns the solution and must not be pitched as though it does. SMD\'s own answer to inventory drift is the SML connector.',
      'Directory-first is validated by their data: discovery was the strong, low-friction layer (45k visits/mo); forcing full e-commerce is what broke shops. Directory-first, e-commerce-optional is correct.',
      'Avoid their revenue model: charging shops a subscription propped up by council subsidy created a cliff — it only worked while someone else paid. SMD\'s free-forever-for-shops + sponsorship/sidebar + local adverts sidesteps the cliff, but shifts the funding burden onto us — those revenue lines must be real. Keep pressure-testing them.',
      'Keep per-shop operating cost near-zero. ShopAppy did bespoke shop-by-shop coverage — expensive at scale. Self-serve "claim your listing" must stay genuinely self-serve, no per-shop hand-holding.',
      'Scotland is wide open again — but shops may be twice-burned (ShopAppy vanished; Trouva burned indies). No incumbent + real unmet need, but trust/honesty matter more than ever. Expect "tried one before, it disappeared" scepticism when canvassing East Lothian shops and address it head-on.',
      'Respect the media pivot as a warning: the most experienced founder in this space concluded the platform could not fund itself. Treat "how does the platform sustainably fund itself" as THE central question and answer it better than she could.',
    ],

    refs: [
      { label: 'ShopAppy story / closure & pivot', url: 'https://shopappy.com/the-shopappy-story' },
      { label: 'ShopAppy pricing & council/BID subsidy terms', url: 'https://shopappy.com/vendor-terms-and-conditions' },
      { label: 'Kirkcaldy first in Scotland on ShopAppy', url: 'https://www.fife.gov.uk/news/2020/lang-toun-leads-the-way-in-lockdown-with-shopappy' },
      { label: 'Basildon 12-months-free (Go Trade / council)', url: 'https://basildon.gov.uk/shopappy' },
      { label: 'Jackie Mulligan background', url: 'https://bmmagazine.co.uk/entrepreneur-interviews/entrepreneurs/getting-to-know-you-jackie-mulligan-founder-ceo-shopappy-com/' },
      { label: 'Trouva administration / indies owed £954k', url: 'https://boutique-magazine.co.uk/trouva-retailers-told-to-submit-claims-for-unpaid-invoices-to-administrators/' },
      { label: 'Shop Where I Live', url: 'https://www.shopwhereilive.com/' },
    ],
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
HUMAN-READABLE WRITE-UP (for the email / build-doc prose block)

HEADLINE: ShopAppy did almost exactly what SMD does, reached Scotland, and shut
down in October 2023 — and the reason it died is the exact problem stock-truth is
designed to solve. (Since 2026-08-29 that solution is S-Move Ledger, a separate
product, rather than a feature of SMD itself.)

WHAT IT WAS
Founded by Dr Jackie Mulligan (ex-director of enterprise, Leeds Beckett), launched
2017 from Lincoln. Mission almost word-for-word ours: "level the playing field" for
independent high-street shops vs chains and online giants. Each town got its own
"virtual high street" — a directory of local indies you could browse, then
click-and-collect, get delivered, or pay-on-pickup.

HOW THE MODEL WORKED
- Free/cheap listing, then subscription of £3–£5/week, no commission on sales.
- Heavily reliant on council / BID subsidy — many towns paid so shops got 12 months
  free (Basildon via Go Trade, Cannock Chase, Colne BID, Doncaster).
- Partnered with Visa; won awards; big pandemic surge in 2020.

HOW BIG IT GOT
- 120+ UK towns at peak (2020–21), Penarth to Kilmarnock.
- Thousands of independent businesses; ~45,000 organic search visits/month.
- Reached Scotland: Kirkcaldy was the first Scottish town, plus Kilmarnock.

WHY IT SHUT DOWN (Oct 2023) — founder's own post-mortem
- Discovery worked; conversion + fulfilment didn't. Single-staff shops couldn't keep
  real-time inventory, take online payments AND ship parcels at once.
- Every feature added made it MORE complex for the merchant, not less.
- Unit economics broke: multi-tenant platform for thousands of micro-merchants cost
  more than it could sustainably earn.
- Subsidy cliff: shops that only joined because year one was free churned when it ended.
- Mulligan relaunched ShopAppy in 2026 as a retail MEDIA/editorial site — abandoned
  the platform model entirely.

WHAT IT MEANS FOR SMD  → see implicationsForSMD[] above.
───────────────────────────────────────────────────────────────────────────── */
