/*
 * Small pixel-art helpers shared by the chapter's scenes: the Sequence potion
 * (drawn in the drawn Pathway's colour, at any fill level), image loading and
 * each ingredient's dominant colour (it tints the brew as it drops in).
 */

export type Rgb = readonly [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? [...value].map((c) => c + c).join('') : value.padEnd(6, '0');
  const n = Number.parseInt(full.slice(0, 6), 16);
  return Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [167, 139, 250];
}
export function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
export function rgbCss(c: Rgb, alpha = 1): string {
  return `rgba(${c.map((v) => Math.round(v)).join(', ')}, ${alpha.toFixed(3)})`;
}

/* ---------------- the Sequence potion: a 16 px vial ---------------- */
// k/K cork, W lip, g glass. Interior pixels (between a row's walls) hold the
// liquid from LIQUID_TOP down; the neck stays empty even when it is full.
const VIAL = [
  '................',
  '......kKKk......',
  '......kkkk......',
  '.....gWWWWg.....',
  '......g..g......',
  '......g..g......',
  '.....g....g.....',
  '....g......g....',
  '...g........g...',
  '...g........g...',
  '...g........g...',
  '...g........g...',
  '....g......g....',
  '.....gggggg.....',
  '................',
  '................',
] as const;
const LIQUID_TOP = 6;
const LIQUID_BOTTOM = 12;
export const VIAL_LIQUID_ROWS = LIQUID_BOTTOM - LIQUID_TOP + 1;

/** Liquid rows still filled at `level` (0..1), in whole texels. */
export function vialRows(level: number): number {
  const l = Math.min(1, Math.max(0, level));
  return l <= 0.001 ? 0 : Math.max(1, Math.round(l * VIAL_LIQUID_ROWS));
}

/* Every texel inside the glass (the neck too), and how many the body holds. */
type Cell = { x: number; y: number };
const INTERIOR: Cell[] = [];
VIAL.forEach((row, y) => {
  const first = row.indexOf('g');
  const last = row.lastIndexOf('g');
  if (first < 0) return;
  for (let x = first + 1; x < last; x++) if (row[x] === '.') INTERIOR.push({ x, y });
});
const BODY_CELLS = INTERIOR.filter((cell) => cell.y >= LIQUID_TOP && cell.y <= LIQUID_BOTTOM).length;
/** The tilt is drawn in steps this size (rad): the liquid moves a texel at a time anyway. */
const TILT_STEP = 0.12;

/**
 * The liquid's texels at `level`, with the bottle tipped `tilt` rad clockwise on
 * screen: it settles toward whatever is down, so a raised bottle runs into its neck.
 * Returns the filled cells and, for each, how close it is to the surface.
 */
function liquidCells(level: number, tilt: number): Map<string, number> {
  const filled = new Map<string, number>();
  const l = Math.min(1, Math.max(0, level));
  if (l <= 0.001) return filled;
  const count = Math.max(1, Math.round(l * BODY_CELLS));
  const a = Math.round(tilt / TILT_STEP) * TILT_STEP;
  // "down" in the vial's own pixels
  const dx = Math.sin(a);
  const dy = Math.cos(a);
  const depth = INTERIOR.map((cell) => ({ cell, d: (cell.x + 0.5 - 8) * dx + (cell.y + 0.5 - 8) * dy }));
  depth.sort((p, q) => q.d - p.d);
  const level0 = depth[Math.min(depth.length, count) - 1].d - 1e-6;
  for (const { cell, d } of depth) if (d >= level0) filled.set(`${cell.x},${cell.y}`, d - level0);
  return filled;
}

/** Changes only when the picture of the vial would (a texel of liquid, a tilt step). */
export function vialKey(level: number, tilt = 0, open = false): string {
  const l = Math.min(1, Math.max(0, level));
  return `${l <= 0.001 ? 0 : Math.max(1, Math.round(l * BODY_CELLS))}:${Math.round(tilt / TILT_STEP)}:${open ? 1 : 0}`;
}

/**
 * Paints the vial into a 16 x 16 context (call with smoothing off and scale yourself).
 * `tilt` (rad, clockwise) is how far the bottle is tipped where it is shown;
 * `open`: the cork is out (it is drawn from).
 */
export function drawVial(context: CanvasRenderingContext2D, accent: Rgb, level: number, tilt = 0, open = false): void {
  context.clearRect(0, 0, 16, 16);
  const liquid = liquidCells(level, tilt);
  const px = (x: number, y: number, color: string) => {
    context.fillStyle = color;
    context.fillRect(x, y, 1, 1);
  };
  const light = rgbCss(mixRgb(accent, [255, 255, 255], 0.38));
  const mid = rgbCss(accent);
  const dark = rgbCss(mixRgb(accent, [8, 6, 12], 0.42));
  const deep = rgbCss(mixRgb(accent, [8, 6, 12], 0.6));
  VIAL.forEach((row, y) => {
    const first = row.indexOf('g');
    const last = row.lastIndexOf('g');
    for (let x = 0; x < 16; x++) {
      const cell = row[x];
      if (cell === 'k' || cell === 'K') {
        if (!open) px(x, y, cell === 'k' ? '#6e4322' : '#a8723f');
      }
      else if (cell === 'W') px(x, y, '#f2f7ff');
      else if (cell === 'g') px(x, y, x < 8 ? 'rgba(228, 238, 250, 0.96)' : 'rgba(150, 168, 194, 0.96)');
      else if (first >= 0 && x > first && x < last) {
        const below = liquid.get(`${x},${y}`);
        if (below === undefined) {
          px(x, y, 'rgba(225, 235, 250, 0.13)');
          continue;
        }
        // the surface catches the light; the glass's shadowed side and foot stay dark
        const color = below < 1 ? light : x >= last - 2 || y === LIQUID_BOTTOM ? (x === last - 1 ? deep : dark) : x === first + 1 ? light : mid;
        px(x, y, color);
      }
    }
  });
  // the glint on the glass, over liquid or air alike
  px(4, 8, 'rgba(255, 255, 255, 0.92)');
  px(4, 9, 'rgba(255, 255, 255, 0.7)');
}

/* ---------------- images ---------------- */
const images = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(url: string): Promise<HTMLImageElement> {
  let pending = images.get(url);
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Unable to load ${url}`));
      image.src = url;
    });
    pending.catch(() => images.delete(url));
    images.set(url, pending);
  }
  return pending;
}

/** The icon's dominant colour (saturated, opaque texels weigh most). */
const tints = new Map<string, Promise<Rgb>>();
export function iconTint(url: string): Promise<Rgb> {
  let pending = tints.get(url);
  if (!pending) {
    pending = loadImage(url).then((image) => {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return [150, 150, 160] as Rgb;
      context.imageSmoothingEnabled = false;
      context.drawImage(image, 0, 0, 16, 16);
      const data = context.getImageData(0, 0, 16, 16).data;
      let r = 0;
      let g = 0;
      let b = 0;
      let weight = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        const max = Math.max(data[i], data[i + 1], data[i + 2]);
        const min = Math.min(data[i], data[i + 1], data[i + 2]);
        const w = 0.15 + (max === 0 ? 0 : (max - min) / max) * (max / 255);
        r += data[i] * w;
        g += data[i + 1] * w;
        b += data[i + 2] * w;
        weight += w;
      }
      return (weight ? [r / weight, g / weight, b / weight] : [150, 150, 160]) as Rgb;
    });
    tints.set(url, pending);
  }
  return pending;
}
