/**
 * Text-safe accents for the light theme.
 *
 * The pathway accents are tuned for a near-black page; on paper many of them (the
 * Sun's yellow, the Door's cyan) are far too pale to read. `inkAccent()` keeps an
 * accent's hue and as much of its chroma as sRGB allows, and lowers its OKLCH
 * lightness just until it reaches INK_CONTRAST against the light page. The pages set
 * the result as `--acc-deep`; the light theme points `--acc-ink` at it (the dark
 * theme keeps `--acc-ink` equal to `--acc`).
 */

/** The light page background (`--arc-bg` under the light theme in ArcanaHome.vue). */
export const LIGHT_PAGE = '#efede8';
/** 4.5:1 is the floor; the margin keeps text readable on the faint accent-tinted chips too. */
const INK_CONTRAST = 5.3;

type Rgb = [number, number, number];

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

const parseHex = (hex: string): Rgb => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map(c => c + c).join('') : h.slice(0, 6);
  return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) / 255) as Rgb;
};

const toHex = (rgb: Rgb) => `#${rgb.map(c => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, '0')).join('')}`;

/** WCAG relative luminance of a gamma-encoded sRGB colour. */
export const luminance = ([r, g, b]: Rgb) => 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

export const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(parseHex(a)), luminance(parseHex(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/* sRGB <-> OKLCH (Björn Ottosson's OKLab) */
const rgbToOklch = (rgb: Rgb): Rgb => {
  const [r, g, b] = rgb.map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), Math.atan2(B, A)];
};

/** Linear-light sRGB, unclamped (so out-of-gamut colours can be detected). */
const oklchToLinear = ([L, C, H]: Rgb): Rgb => {
  const A = C * Math.cos(H);
  const B = C * Math.sin(H);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
};

const inGamut = (lin: Rgb) => lin.every(c => c >= -1e-4 && c <= 1 + 1e-4);

/** The colour at lightness L and the accent's hue, with the most chroma sRGB can show. */
const atLightness = (L: number, C: number, H: number): Rgb => {
  let lo = 0;
  let hi = C;
  if (!inGamut(oklchToLinear([L, hi, H]))) {
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear([L, mid, H]))) lo = mid;
      else hi = mid;
    }
    hi = lo;
  }
  return oklchToLinear([L, hi, H]).map(c => toGamma(Math.min(1, Math.max(0, c)))) as Rgb;
};

const cache = new Map<string, string>();

/** The accent, deepened just enough to read as text on the light page. */
export function inkAccent(hex: string, page = LIGHT_PAGE): string {
  const key = `${hex}|${page}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const [L0, C, H] = rgbToOklch(parseHex(hex));
  let result = hex;
  if (contrast(hex, page) < INK_CONTRAST) {
    let lo = 0;
    let hi = L0;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (contrast(toHex(atLightness(mid, C, H)), page) >= INK_CONTRAST) lo = mid;
      else hi = mid;
    }
    result = toHex(atLightness(lo, C, H));
  }
  cache.set(key, result);
  return result;
}

/** Near-black ink (the light theme's `--arc-ink`): the solid fill for accents that turn murky on paper. */
export const FILL_INK = '#17161c';
/** OKLCH hues (degrees) where a deepened accent reads as olive, khaki or gold rather than as its colour. */
const MURKY_HUES: readonly [number, number] = [75, 140];

const fillCache = new Map<string, string>();

/**
 * The fill for solid controls on the light page (`--acc-fill`): the text-safe accent,
 * except where deepening lands in the olive/khaki/gold band (the Sun, Death, Second Law),
 * which would read as mud on a button. Those cards fill with near-black ink and keep
 * their own colour for thin details (rings, rules, washes).
 */
export function fillAccent(hex: string, page = LIGHT_PAGE): string {
  const key = `${hex}|${page}`;
  const hit = fillCache.get(key);
  if (hit) return hit;
  const deep = inkAccent(hex, page);
  const [, chroma, hue] = rgbToOklch(parseHex(deep));
  const degrees = ((hue * 180) / Math.PI + 360) % 360;
  const murky = chroma > .03 && degrees >= MURKY_HUES[0] && degrees <= MURKY_HUES[1];
  const result = murky ? FILL_INK : deep;
  fillCache.set(key, result);
  return result;
}
