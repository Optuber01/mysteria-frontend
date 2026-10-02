# Mysterria Homepage — Design System v2 "Above the Gray Fog"

The homepage is the reader's first séance: a dark room above the gray fog, a
crimson moon, and twenty-two seats at a long table. It borrows the novel's most
recognisable images — the Tarot Club's gathering above the fog, the Crimson
Moon over Tingen, Nighthawk case files — rather than generic "dark fantasy gold".

Tokens live in `src/assets/styles/home-theme.css` and only apply on the
homepage. The rest of the site keeps upstream's theme.

## 1. Principles

- **Fog first.** Depth comes from layered translucent fog over near-black, not
  from glows or gradients of colour. Sections dissolve into each other through
  fog; there are no hard bands.
- **One accent: crimson.** Crimson marks every interactive and live element
  (CTAs, active states, focus, the moon). Nothing else is coloured. No gold.
- **Paper is an object.** Cream paper appears only as things that are paper in
  the world — the potion formula, case files, the live ledger — never as the
  page background.
- **The game is real.** Minecraft UI (the pixel book, the cauldron screen) and
  real captures stay unfiltered; they are evidence, framed like photographs.
- **Short.** About eight screens. Each chapter earns its height.

## 2. Colour

| Token | Value | Use |
|---|---|---|
| `--fog-0` | `#07080b` | Page base |
| `--fog-1` | `#0d0f14` | Section base |
| `--fog-2` | `#151820` | Cards, panels |
| `--fog-3` | `#1e222b` | Raised / hover surfaces |
| `--fog-veil` | `rgba(196, 204, 214, .06)` | Fog layers, washes |
| `--line` | `rgba(214, 220, 228, .12)` | Hairlines and borders |
| `--bone` | `#ece6da` | Primary text (14–16:1) |
| `--ash` | `#a7acb5` | Secondary text (≥7:1) |
| `--ash-dim` | `#7f858f` | Captions on fog-0/1 only; large text elsewhere |
| `--crimson` | `#b3202b` | CTA fills, active bars, the moon (bone text 5.4:1) |
| `--crimson-deep` | `#8e1720` | CTA hover/pressed |
| `--crimson-text` | `#e5545d` | Crimson text and icons on dark (≥4.9:1 on fog-0–2) |
| `--crimson-tint` | `rgba(179, 32, 43, .16)` | Selected backgrounds, chips |
| `--spirit` | `#a9c6d6` | Spirit vision: data highlights only (stats, sigil rims) |
| `--paper` | `#e8e0cf` | In-world paper objects |
| `--paper-ink` | `#1d1b17` | Text on paper (13:1) |
| `--paper-ink-muted` | `#5a5246` | Secondary text on paper (5.9:1) |
| `--live` | `#4cc38a` | Online dot only |

Legacy token names used by the chapters (`--ink`, `--ink-muted`, `--surface`,
`--hairline`, `--primary`…) are mapped onto these in home-theme.css so older
rules keep working while they are migrated.

## 3. Type

- **Display — Cormorant Garamond** 500/600, italic for emphasis. Large sizes
  only (≥ 28px); never for body copy. Cyrillic included.
- **Body — Manrope** 400/600, 16–17px, line-height 1.6.
- **Labels — IBM Plex Mono** 500, 11–12px, `.14em` tracking, uppercase.
  Use sparingly: one label per block, not a terminal voice everywhere.
- Hero wordmark: Cormorant 600, `clamp(56px, 11vw, 168px)`, tracking `.04em`.
- Section titles: `clamp(36px, 5vw, 72px)`, line-height 1.02.

## 4. Shape & depth

- Radii: cards `14px`, photos `6px` (prints, not app tiles), buttons `999px`.
- Borders over shadows: `1px var(--line)`. Shadows are deep and soft:
  `0 30px 80px rgba(0,0,0,.55)`.
- Photos may sit slightly rotated (±1.5°) when pinned as case evidence.

## 5. Motion

- Fog drifts slowly (40–90s loops); nothing else moves by itself.
- Reveals: opacity + 16px rise, `.7s cubic-bezier(.22,1,.36,1)`.
- `prefers-reduced-motion`: fog freezes, reveals are instant, scroll scenes
  become static layouts.

## 6. Accessibility

- Text contrast ≥ 4.5:1 (see table); interactive targets ≥ 44px.
- Focus: `2px solid var(--crimson-text)`, offset 3px.
- Crimson is never the only signal: active/selected states also change shape,
  weight or an icon.
