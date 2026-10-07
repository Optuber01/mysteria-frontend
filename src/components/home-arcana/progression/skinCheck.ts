/*
 * Will this skin look right in the potion story? The room is dark and lit in the
 * Pathway's colour, and the potion's veins and eyes are drawn over the skin's own
 * texels, so a skin is only worn when it reads well there; otherwise Optuber's stays on.
 *
 * Read from the 64 x 64 (or legacy 64 x 32) texture, as the camera sees it:
 *  - holes: transparent texels in the base layer, which a renderer fills with flat
 *    white or black, so a body comes out as a pale cut-out;
 *  - the front faces (overlay over base): how bright they are, how much is near-white
 *    or neon (it glares against the dark room and drowns the veins), how much is near
 *    black (he vanishes into the room), and how much detail they carry (a flat fill
 *    leaves the lighting and the veins nothing to work on).
 */

type Rect = readonly [x: number, y: number, w: number, h: number];

export type SkinMetrics = {
  /** Share of base-layer texels that are transparent. */
  holes: number;
  /** Mean luma of the front faces, 0..1. */
  luma: number;
  /** Share of front texels near white. */
  white: number;
  /** Share of front texels that are neon (bright and saturated). */
  neon: number;
  /** Share of front texels near black. */
  black: number;
  /** Spread of luma over the front faces. */
  detail: number;
};

export type SkinVerdict = {ok: boolean; reason: string; metrics: SkinMetrics};

/** Every face of each base-layer box (the unused corners of the layout left out). */
function baseRects(legacy: boolean, slim: boolean): Rect[] {
  const arm = slim ? 14 : 16;
  const armTop = slim ? 6 : 8;
  const rects: Rect[] = [
    [0, 8, 32, 8], [8, 0, 16, 8], // head
    [16, 20, 24, 12], [20, 16, 16, 4], // body
    [40, 20, arm, 12], [44, 16, armTop, 4], // right arm
    [0, 20, 16, 12], [4, 16, 8, 4], // right leg
  ];
  if (!legacy) {
    rects.push(
      [16, 52, 16, 12], [20, 48, 8, 4], // left leg
      [32, 52, arm, 12], [36, 48, armTop, 4], // left arm
    );
  }
  return rects;
}

/** The faces the camera looks at: [base, overlay or null]. */
function frontRects(legacy: boolean, slim: boolean): [Rect, Rect | null][] {
  const w = slim ? 3 : 4;
  const faces: [Rect, Rect | null][] = [
    [[8, 8, 8, 8], [40, 8, 8, 8]], // face
    [[20, 20, 8, 12], legacy ? null : [20, 36, 8, 12]], // chest
    [[44, 20, w, 12], legacy ? null : [44, 36, w, 12]], // right arm
    [[4, 20, 4, 12], legacy ? null : [4, 36, 4, 12]], // right leg
  ];
  if (!legacy) {
    faces.push(
      [[36, 52, w, 12], [52, 52, w, 12]], // left arm
      [[20, 52, 4, 12], [4, 52, 4, 12]], // left leg
    );
  }
  return faces;
}

export function measureSkin(data: Uint8ClampedArray, width: number, height: number, slim: boolean): SkinMetrics {
  const legacy = height === 32;
  const at = (x: number, y: number) => (y * width + x) * 4;

  let holes = 0;
  let base = 0;
  for (const [x0, y0, w, h] of baseRects(legacy, slim)) {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        base++;
        if (data[at(x, y) + 3] < 128) holes++;
      }
    }
  }

  const lumas: number[] = [];
  let white = 0;
  let neon = 0;
  let black = 0;
  for (const [[bx, by, w, h], over] of frontRects(legacy, slim)) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const b = at(bx + dx, by + dy);
        let r = data[b];
        let g = data[b + 1];
        let bl = data[b + 2];
        if (over) {
          const o = at(over[0] + dx, over[1] + dy);
          const a = data[o + 3] / 255;
          r = r * (1 - a) + data[o] * a;
          g = g * (1 - a) + data[o + 1] * a;
          bl = bl * (1 - a) + data[o + 2] * a;
        }
        const max = Math.max(r, g, bl) / 255;
        const min = Math.min(r, g, bl) / 255;
        const sat = max === 0 ? 0 : (max - min) / max;
        const luma = (0.2126 * r + 0.7152 * g + 0.0722 * bl) / 255;
        lumas.push(luma);
        if (luma > 0.82 && sat < 0.18) white++;
        if (max > 0.82 && sat > 0.72) neon++;
        if (luma < 0.035) black++;
      }
    }
  }
  const n = lumas.length;
  const mean = lumas.reduce((sum, value) => sum + value, 0) / n;
  const detail = Math.sqrt(lumas.reduce((sum, value) => sum + (value - mean) ** 2, 0) / n);
  return {holes: holes / base, luma: mean, white: white / n, neon: neon / n, black: black / n, detail};
}

/*
 * The limits, set by rendering 24 well-known premium skins in the scene (Optuber's luma is
 * 0.19). Those it turns away all read badly there: a lab coat and two near-white skins
 * glared, two neon ones drowned the veins, and one with holes came out a pale cut-out.
 * Where it was close, it errs towards Optuber's.
 */
export const SKIN_LIMITS = {
  holes: 0.02,
  lumaMax: 0.62,
  lumaMin: 0.06,
  white: 0.25,
  neon: 0.25,
  black: 0.55,
  detail: 0.035,
} as const;

export function judgeSkin(data: Uint8ClampedArray, width: number, height: number, slim: boolean): SkinVerdict {
  const metrics = measureSkin(data, width, height, slim);
  const L = SKIN_LIMITS;
  const reason =
    metrics.holes > L.holes ? 'holes in the base layer'
      : metrics.luma > L.lumaMax ? 'too bright for the room'
        : metrics.luma < L.lumaMin ? 'too dark to make out'
          : metrics.white > L.white ? 'too much white'
            : metrics.neon > L.neon ? 'too much neon'
              : metrics.black > L.black ? 'too much black'
                : metrics.detail < L.detail ? 'too flat'
                  : '';
  return {ok: !reason, reason, metrics};
}
