/*
 * The chapter's single timeline, in fractions (0..1) of its pinned scroll.
 * Every scene, the chapter rail and the full-bleed dressing read these same
 * beats, so nothing can drift out of step with anything else.
 *
 *   Discover  the formula book falls out of the fog, turns and opens
 *   Brew      the cauldron rises under it; one by one the ingredients leave
 *             the pages and drop into the brew, which takes the Pathway's
 *             colour; the book closes; the brew boils and the potion rises
 *   Drink     the player steps out of the fog, catches the potion, raises it,
 *             tips it and drains it in three gulps, then lowers the empty
 *             bottle while the dark closes in
 *   Awaken    a flash, the moon rises behind him and the card he drew turns up
 */
export const T = {
  // Discover
  book: [0.012, 0.15],
  readable: [0.15, 0.245],
  // Brew
  brewIn: [0.235, 0.3],
  drops: [0.29, 0.43],
  dropSpan: 0.05,
  bookOut: [0.425, 0.475],
  boil: [0.45, 0.525],
  brewFlash: 0.53,
  potionUp: [0.53, 0.57],
  // Drink
  cauldronOut: [0.56, 0.592],
  playerIn: [0.578, 0.615],
  catch: [0.6, 0.632],
  raise: [0.632, 0.66],
  gulps: [0.675, 0.705, 0.735],
  gulpWidth: 0.026,
  lower: [0.752, 0.775],
  closing: [0.66, 0.1],
  blackout: [0.775, 0.032],
  // Awaken
  flash: 0.812,
  awaken: [0.818, 0.09],
  panel: [0.83, 0.93],
} as const;

export type ChapterId = 'discover' | 'brew' | 'drink' | 'awaken';
export type Chapter = { id: ChapterId; end: number; landing: number };

/** A chapter runs until `end`; `landing` is a settled frame of it (chapter nav). */
export const CHAPTERS: Chapter[] = [
  { id: 'discover', end: T.brewIn[0] + 0.012, landing: 0.2 },
  { id: 'brew', end: T.potionUp[1], landing: 0.5 },
  { id: 'drink', end: T.flash, landing: 0.715 },
  { id: 'awaken', end: 1, landing: 1 },
];

/** When each of `n` ingredients leaves its page: spread evenly over the drop window. */
export function dropStarts(n: number): number[] {
  const room = T.drops[1] - T.drops[0] - T.dropSpan;
  const step = n > 1 ? Math.min(0.045, room / (n - 1)) : 0;
  const first = T.drops[0] + (room - step * (n - 1)) / 2;
  return Array.from({ length: n }, (_, index) => first + step * index);
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
export function smooth(t: number): number {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
/** 0..1 across [start, end] of the timeline, linear. */
export function span(g: number, range: readonly [number, number]): number {
  return clamp01((g - range[0]) / (range[1] - range[0]));
}
/** 0..1 across [start, end], eased. */
export function ease(g: number, range: readonly [number, number]): number {
  return smooth(span(g, range));
}

/** 0..3: gulps taken (fractional mid-gulp). */
export function gulpsTaken(g: number): number {
  return T.gulps.reduce((sum, at) => sum + smooth((g - at + T.gulpWidth / 2) / T.gulpWidth), 0);
}
/** 0..1 pulse at each gulp (the swallow, and the heart's thump). */
export function gulpPulse(g: number): number {
  let pulse = 0;
  for (const at of T.gulps) {
    const d = Math.abs(g - at) / T.gulpWidth;
    if (d < 1) pulse = Math.max(pulse, (1 + Math.cos(d * Math.PI)) / 2);
  }
  return pulse;
}
/** 0..1: the dark closing in while the potion is drunk, gone at the flash. */
export function riskAt(g: number): number {
  const rise = smooth((g - T.closing[0]) / T.closing[1]);
  const burst = smooth((g - T.flash) / 0.02);
  return rise * (1 - burst);
}
/** 0..1: the last moment before the awakening, when almost nothing is lit. */
export function blackoutAt(g: number): number {
  const close = smooth((g - T.blackout[0]) / T.blackout[1]);
  const open = smooth((g - T.flash) / 0.012);
  return close * (1 - open);
}
/** 0..1 flash of spirit vision at the awakening. */
export function flashAt(g: number): number {
  const spike = clamp01((g - (T.flash - 0.004)) / 0.005);
  const decay = 1 - clamp01((g - (T.flash + 0.002)) / 0.03);
  return spike * decay;
}
/** 0..1 awakening, eased out. */
export function awakenAt(g: number): number {
  const t = clamp01((g - T.awaken[0]) / T.awaken[1]);
  return 1 - (1 - t) ** 3;
}
