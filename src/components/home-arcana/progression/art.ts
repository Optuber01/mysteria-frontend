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

/** Paints the vial into a 16 x 16 context (call with smoothing off and scale yourself). */
export function drawVial(context: CanvasRenderingContext2D, accent: Rgb, level: number): void {
  context.clearRect(0, 0, 16, 16);
  const rows = vialRows(level);
  const surface = LIQUID_BOTTOM - rows + 1;
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
      if (cell === 'k') px(x, y, '#6e4322');
      else if (cell === 'K') px(x, y, '#a8723f');
      else if (cell === 'W') px(x, y, '#f2f7ff');
      else if (cell === 'g') px(x, y, x < 8 ? 'rgba(228, 238, 250, 0.96)' : 'rgba(150, 168, 194, 0.96)');
      else if (first >= 0 && x > first && x < last) {
        const filled = y >= LIQUID_TOP && y >= surface && y <= LIQUID_BOTTOM;
        if (!filled) {
          px(x, y, 'rgba(225, 235, 250, 0.13)');
          continue;
        }
        const color = y === surface ? light : x >= last - 2 || y === LIQUID_BOTTOM ? (x === last - 1 ? deep : dark) : x === first + 1 ? light : mid;
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
