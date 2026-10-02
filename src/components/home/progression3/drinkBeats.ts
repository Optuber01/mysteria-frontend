/*
 * The drink-and-awaken beats (0..1 of DrinkAwakenScene's local progress),
 * shared with ProgressionStoryV3 so the chapter's full-bleed fog and
 * vignette react to the same gulps the player takes on stage.
 *
 *   0.00-0.08  the potion handed over from the cauldron: the player emerges
 *              from the dark, lit by it, and takes it
 *   0.08-0.15  the potion is lifted to the mouth
 *   0.15-0.34  three gulps: the potion empties, the heart thumps, whispers
 *   0.33-0.40  the fog closes in completely
 *   0.40       the flash: the fog bursts open
 *   0.42-0.62  awakening: the Crimson Moon rises, spirit vision, divination
 *   0.55-0.78  the Sequence title and the way on
 */
export const DRINK_BEATS = {
  catch: [0, 0.08],
  lift: [0.07, 0.08],
  gulps: [0.18, 0.245, 0.31],
  gulpWidth: 0.03,
  closing: [0.12, 0.26],
  blackout: [0.33, 0.07],
  flash: 0.4,
  awaken: [0.42, 0.2],
} as const;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
function smooth(t: number): number {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}

/** 0..3: how many gulps have been taken (fractional mid-gulp). */
export function gulpsTaken(p: number): number {
  return DRINK_BEATS.gulps.reduce((sum, at) => sum + smooth((p - at + DRINK_BEATS.gulpWidth / 2) / DRINK_BEATS.gulpWidth), 0);
}

/** 0..1 pulse at each gulp (the swallow and the heart's thump). */
export function gulpPulse(p: number): number {
  let pulse = 0;
  for (const at of DRINK_BEATS.gulps) {
    const d = Math.abs(p - at) / DRINK_BEATS.gulpWidth;
    if (d < 1) pulse = Math.max(pulse, (1 + Math.cos(d * Math.PI)) / 2);
  }
  return pulse;
}

/** 0..1: the fog and dark closing in while the potion is drunk, gone at the flash. */
export function riskAt(p: number): number {
  const rise = smooth((p - DRINK_BEATS.closing[0]) / DRINK_BEATS.closing[1]);
  const burst = smooth((p - DRINK_BEATS.flash) / 0.05);
  return rise * (1 - burst);
}

/** 0..1: the last moment before the awakening, when almost nothing is left lit. */
export function blackoutAt(p: number): number {
  const close = smooth((p - DRINK_BEATS.blackout[0]) / DRINK_BEATS.blackout[1]);
  const open = smooth((p - DRINK_BEATS.flash) / 0.03);
  return close * (1 - open);
}

/** 0..1 flash of spirit vision at the awakening. */
export function flashAt(p: number): number {
  const spike = clamp01((p - (DRINK_BEATS.flash - 0.008)) / 0.012);
  const decay = 1 - clamp01((p - (DRINK_BEATS.flash + 0.004)) / 0.07);
  return spike * decay;
}

/** 0..1 awakening, eased out. */
export function awakenAt(p: number): number {
  const t = clamp01((p - DRINK_BEATS.awaken[0]) / DRINK_BEATS.awaken[1]);
  return 1 - (1 - t) ** 3;
}
