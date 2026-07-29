# S-Move Operations (SMO) — Design Frame (Claude reference)

**Captured from the current app appearance** (admin console + customer portal) on
2026-07-29. This is a *starting frame to refine*, not a locked system yet — build new UI
to match it, and flag drift. SMO wears the **S-Move Removals red/black** brand.

## Theme
Dark, near-black canvas with a single red accent and white type. System sans (Segoe UI).

## Colour roles (as currently used)
| Role | Hex | Notes |
|---|---|---|
| Page background | `#0d0d0d` | near-black |
| Card / panel | `#111` | |
| Input background | `#0d0d0d` / `#111` | |
| Border (default) | `#2a2a2a` | inputs sometimes `#333` |
| **Primary accent / job refs / danger** | `#e83a1a` | ⚠️ brand red is `#ed1c24` — app currently uses `#e83a1a`; align later |
| Deep red (secondary danger) | `#c0392b` | |
| Text | `#fff` | muted: `#e2e2e2` / `#eee` / `#888` |
| Success | `#4ade80` | on dark-green `#0a1a0a` / `#1a2a1a` |
| Ad-hoc blue | `#1e40af`, `#93c5fd` | inconsistent — see notes |

## Type
- Font: `'Segoe UI', sans-serif` (system).
- **Monospace** for job references, invoice numbers, bank details, codes (refs coloured `#e83a1a`).
- Sizes: body ~13px, small 11–12px; emphasis via weight 600–700 (no heading font system yet).

## Components
- **Buttons:** radius 7–10px, weight 600–700, padding ~8–14px; red fill for primary actions.
- **Inputs / textareas:** `#111` bg, 1px `#2a2a2a`/`#333` border, radius 8px, white text.
- Tabs, cards, small status badges (e.g. green time badge on `#0a1a0a`).
- Refs / money / bank details rendered in monospace.

## Drift to fix in a later pass
- Accent red `#e83a1a` ≠ brand red `#ed1c24` — standardise on the brand value.
- Stray blues (`#1e40af`, `#93c5fd`) appear in a few places — decide if SMO gets a defined
  secondary accent or drops them.
- Styling is mostly **inline** (no CSS variables/tokens yet) — a future pass could tokenise
  it the way SMD is done.
