# S-Move Technologies (SMT) — Design Frame (Claude reference)

**Captured from the current SMT site + build dashboard** on 2026-07-29. A starting frame to
refine. The **blue palette is a placeholder** (matches the current site) until a dedicated
SMT brand palette is defined — update this when that lands.

## Theme
Dark "ink" canvas, electric **blue → cyan** accents, cool greys. Already tokenised as CSS vars.

## Colour roles (CSS variables on the site)
| Var | Hex | Role |
|---|---|---|
| `--ink` | `#0a0e17` | page background |
| `--ink-2` | `#0f1522` | raised / bars |
| `--ink-3` | `#161d2e` | cards |
| `--line` | `#232c40` | borders |
| `--text` | `#e7ecf5` | body text |
| `--muted` | `#94a1bb` | secondary text |
| `--muted-2` | `#6b7791` | eyebrows / fine print |
| `--brand` | `#5b8def` | primary blue (links, accents) |
| `--brand-2` | `#22d3ee` | cyan (secondary accent) |
| `--grad` | `linear-gradient(120deg,#5b8def,#22d3ee)` | primary buttons / CTAs |
| button text on gradient | `#06111f` | dark text on the bright gradient |

Status colours: live `#34d399`, beta `#22d3ee`, building `#5b8def`, designed `#fbbf24`, parked `#94a1bb`.

## Type
- Font: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`.
- Headings: tight letter-spacing (`-.01em`/`-.02em`). Eyebrows: uppercase, tracked (`.08–.1em`),
  `--muted-2`, ~`.7rem`. Body ~`.95–1rem`, line-height `1.55`.

## Components
- **Cards:** `--ink-3` bg, 1px `--line` border, radius 12–14px.
- **Primary button / CTA:** the blue→cyan gradient, dark text `#06111f`, radius 8–11px, weight 600–700.
- **Secondary button:** bordered "ghost" (1px `--line`, hover `--brand`).
- Nav pills, status-dot badges, tables (muted uppercase headers, dashed row dividers).
- **Layout:** centred, max-width ~1000–1180px; sticky top bar with `backdrop-filter` blur.

## Notes
- This is the same look as the `/build` dashboard and the marketing site (`public/styles.css`).
- Placeholder palette — when a real SMT brand palette is chosen, update this frame and the
  `smt` email/brand theme together.
