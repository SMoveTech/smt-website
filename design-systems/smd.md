# S-Move Dealer (SMD) — Design System (Claude reference)

Follow this when building **any SMD customer-facing UI** so it matches the product.
Source of truth: the live visual page at `shop.s-move.co.uk/design-system` and the
implementation in `/css/smd.css`. This is the Claude-facing text version.

Fonts: **Playfair Display** (serif) + **Nunito** (sans), loaded from Google Fonts.

## Locked rules (non-negotiable)
- **Red `#ed1c24`** = primary actions + danger ONLY — at most **one per view**.
- **Gold `#c8924a`** = brand, links, icons, secondary buttons, eyebrows.
- **Cream `#f5f1e8`** = all type and prices (data, never action).
- **No emoji anywhere** — use the line-icon set only (below).
- **Serif (Playfair) headings = cream only.** Emphasis via cream *italic*, never colour.
- **One gold serif accent word** in the entire product (currently the home hero "connected").
- **Three button variants** (primary red / secondary gold / ghost), one height, 12px radius.

## Colour roles (each colour has exactly one job)
| Token | Hex | Job |
|---|---|---|
| Page | `#0b0a09` | Page background (flat near-black) |
| Surface 1 | `#16130f` | Cards |
| Surface 2 | `#1e1a15` | Inputs |
| Red | `#ed1c24` | ACTION only (primary button / danger) |
| Gold | `#c8924a` | Brand / links / icons / secondary buttons / eyebrows |
| Cream | `#f5f1e8` | Type / prices |

## Type scale
Playfair (serif, **cream only**) for headings; Nunito (sans) for everything else.
- Eyebrow · 12 / tracked caps / gold
- Display · 56 (hero moments)
- Heading 1 · ~48 · Heading 2 · 40 · Heading 3 · 32 · Heading 4 · 24
- Lead · 19 (hero sublines, section intros) · Body · 17 (workhorse) · Muted · 17 (fine print)
- Emphasis reads as **cream italic**, never a coloured word. Exactly one gold serif accent word product-wide.

## Buttons (3 variants · one height · 12px radius · no emoji)
- **Primary** = red fill — the one primary action per view.
- **Secondary** = gold (e.g. Donate).
- **Ghost** = tertiary / back.
- Large variant: `btn-lg`.

## Chips, badges & fields
Location badge (e.g. "Edinburgh & the Lothians"), category chips with counts and an
active state, and a search field with a leading icon — all gold icons + cream text on surfaces.

## Icons — line-icon set (NO emoji)
Use the SMD SVG sprite (`#i-<name>`). Available names:
`search, heart, message, camera, pin, truck, lock, megaphone, monitor, sparkle, check,
check-circle, arrow-right, arrow-left, user, bookmark, mail, pencil, chevron-down, download,
shield, store, globe, grid, tag, star, sofa, bed, leaf, laptop, utensils, table, wardrobe,
vase, clock, box, gift, server, handshake`.

## Artwork
Gold linework, chroma-keyed to float on any surface. Pieces + intended use:
- **Edinburgh skyline** — footer band on every page
- **Shopfront colonnade** — seller-apply, between hero and steps
- **Thistle-in-close-arch divider** — donate, one section break under the headline
- **Banker's lamp** — donate founder-note corner
- **Castle keyhole** — seller-login photo-panel watermark
- **Padlock + castle** — 403 access-denied hero

Product cards carry a **soft double gold hairline outline** (CSS, not an image) — "a little
more than a line", corners quiet. For an ambient page glow add `class="smd-ambient"` to
`<body>` (soft viewport-fixed gold glow, tuned via the `--smd-glow` variable) — warms the
flat-black background without a band.

## Implementation
- Stylesheet `/css/smd.css` — design tokens as CSS vars: `--page`, `--surface-1/2`, `--red`,
  `--gold`, `--cream`, spacing `--s3/4/5`, `--fs-sm`, `--smd-glow`.
- Brand assets (logos): see the SMT brand-asset library / your `smt-brand-assets/smd/` folder.
