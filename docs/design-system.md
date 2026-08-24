# Mysterria Homepage — Design System (v1, locked)

Decision record: **Font of B (Manrope) + colors of A (violet primary / sunset echo)** on a warm-ivory seamless base. This document is the single source of truth for the homepage redesign theme. Every surface, component and state derives from these tokens.

## 1. Philosophy

- **One voice, one echo.** Violet owns every interactive element (actions, links, active states). The sunset gradient never performs actions — it only highlights and warms.
- **Bright, premium, smooth.** Light surfaces, generous whitespace, butter motion. No murky darkness, no techy clichés, no serif anywhere.
- **Seamless journey.** Sections are transparent over one continuous vertical gradient; seams between sections are ≥160px gradients, never hard edges.

## 2. Color tokens

### Base
| Token | Value | Usage |
|---|---|---|
| `--journey-top` | `#FBF7EF` | Page gradient start |
| `--journey-mid` | `#F5EEE1` | Page gradient middle |
| `--journey-end` | `#FAF5EC` | Page gradient end / footer approach |
| `--surface` | `#FFFFFF` | Cards, panels |
| `--surface-glass` | `rgba(255,255,255,.86)` + `blur(14px)` | Header pill, floating UI |

### Ink
| Token | Value | Usage |
|---|---|---|
| `--ink` | `#221C14` | Primary text |
| `--ink-muted` | `#756B5C` | Secondary text, captions |
| `--hairline` | `#EAE1D0` | Borders, dividers, rules |

### Accents
| Token | Value | Role — STRICT |
|---|---|---|
| `--primary` | `#7458E8` iris violet | ALL interactive: CTA fills, link hovers, active nav underline, selected states, focus rings, key-word color |
| `--primary-deep` | `#5F46D6` | Primary hover/pressed |
| `--primary-tint` | `rgba(116,88,232,.12)` | Chips, tinted backgrounds |
| `--sunset` | `linear-gradient(90deg,#FF7A59,#FFC15E)` | Echo ONLY: H1 keyword underline flourish, live-numeral text, footer top rule, hotspot/warm highlights |
| `--coral` | `#FF7A59` | Sunset start; solo use in sunset-context text on ivory must use deepened `#E85B33` for AA |
| `--champagne` | `#D9B45A` | Micro accents ONLY: eyebrow chip border/text, tiny marks |

### Semantic (fixed forever)
| Token | Value | Meaning |
|---|---|---|
| `--live` | `#34C77B` | Online / positive status dot |
| `--danger` | `#D6453D` | Reserved: rare/dangerous content (Rifts, Guardians). Never decorative |

## 3. Typography

- **Single family: Manrope** (Google Fonts). No serif anywhere, including book covers and logos.
- Display: 800 weight, `-0.025em` tracking. Hero clamp ≈ `clamp(44px, 6vw, 88px)`; section titles `clamp(28px, 3.4vw, 44px)`.
- Body/UI: 400 regular, 600 semi-bold emphasis; base 16–17px, line-height 1.55–1.6.
- Micro-labels/eyebrows: 12px, 700, `.16em` letter-spacing, uppercase, muted or champagne.

## 4. Geometry & elevation

- Radii: cards `20px`, photos `22px`, pills/buttons `999px`, small chips `12px`.
- Shadows: warm-neutral soft blooms — rest `0 10px 30px rgba(34,28,20,.08)`; hover `0 24px 60px rgba(34,28,20,.14)`. Never cool-gray, never harsh.
- Photos: always inside rounded frames with `1px var(--hairline)` border; warm soft shadows; caption strips allowed ("Cliffside Sanctuary · SEQ IX").

## 5. Motion

- Butter only: IO reveals `opacity + translateY(20→0)`, `.6–.7s ease-out`, staggered ~70ms.
- Hovers: `translateY(-2…-4px)` + shadow bloom; transitions transform/color/shadow **only** — zero layout-affecting animated properties.
- Focus-visible: `3px solid var(--primary)`, offset 3px, visible on all surfaces.
- Reduced-motion: reveals collapse to instant opacity; drifts/floats disabled.
- (Reserved for the fog→book sequence later: spring `cubic-bezier(.34,1.56,.64,1)` pops and the scroll-driven emerge — the only places springs are allowed.)

## 6. Imagery treatment

- Photography stays natural-bright; no dark scrims except thin bottom fades where text sits over image (max .55 alpha).
- Scene art that was designed dark (brewery, orbit voids) converts to ivory stages with cream/parchment props kept as-is — parchment already belongs to this palette.
- Fog sequence (future): fog sheets = warm ivory `rgba(250,246,238,…)` gradients, violet micro-tint allowed at ≤14%.

## 7. Component contract quick-reference

- Buttons: primary = violet fill/white text (`--primary-deep` hover); secondary = ghost with violet border/text; tertiary = quiet ink link w/ arrow.
- Links/nav hover: color → ink + 2px violet underline scaling from left (transform-only, reserved space).
- Live chip: green `--live` dot + "N online", glass pill.
- Eyebrow chips: white glass, champagne border/text.
- Cards: white, hairline border, radius 20px, lift-on-hover.
