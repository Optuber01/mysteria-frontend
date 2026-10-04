/*
 * The chapter's single timeline, in fractions (0..1) of its pinned scroll.
 * Every scene, the chapter rail and the full-bleed dressing read these same
 * beats, so nothing can drift out of step with anything else.
 *
 *   Discover  the formula book falls out of the fog, turns and opens
 *   Brew      the cauldron rises under it; one by one the ingredients leave
 *             the pages and drop into the brew, which takes the Pathway's
 *             colour; the book closes; the brew boils and the potion rises
 *   Drink     the cauldron sinks and the player steps out of the fog; he holds
 *             out his hand and the potion settles into it; he looks at it, raises
 *             it to his mouth and drains it in three swallows, tipping it further
 *             each time. Nothing else happens while he drinks. Then, one thing at
 *             a time: he lowers the empty bottle; the room darkens and the first
 *             voice speaks; his head bows and a hand goes to his temple while the
 *             circle under him wakes and the voices come faster; at last the
 *             voices stop and almost nothing is lit
 *   Awaken    a flash, then he rises: the moon comes up behind him, his arms open
 *             and the card he drew turns up
 */
export const T = {
  // Discover
  book: [0.012, 0.15],
  readable: [0.15, 0.245],
  // Brew
  brewIn: [0.235, 0.3],
  drops: [0.29, 0.43],
  dropSpan: 0.05,
  bookOut: [0.42, 0.465],
  boil: [0.44, 0.505],
  brewFlash: 0.51,
  potionUp: [0.51, 0.545],
  // Drink
  cauldronOut: [0.538, 0.566],
  playerIn: [0.546, 0.59],
  /** his hand held out, and the potion settling into it */
  reach: [0.578, 0.602],
  catch: [0.584, 0.608],
  /** a beat with the potion in his hand, looking at it */
  regard: [0.604, 0.626],
  raise: [0.626, 0.65],
  gulps: [0.664, 0.686, 0.708],
  gulpWidth: 0.016,
  lower: [0.72, 0.742],
  /** the potion takes hold: head bowed, hand to the temple, the circle waking */
  hit: [0.744, 0.8],
  /**
   * the voices: one after another, from the lowered bottle until the dark. This
   * stretch is slowed down on the page (see storyAt), so each line can be read.
   */
  voices: [0.736, 0.812],
  /** the dark closing in: from the lowered bottle to the flash */
  closing: [0.726, 0.114],
  blackout: [0.81, 0.026],
  // Awaken
  flash: 0.84,
  awaken: [0.842, 0.1],
  panel: [0.855, 0.95],
} as const;

export type ChapterId = 'discover' | 'brew' | 'drink' | 'awaken';
export type Chapter = { id: ChapterId; end: number; landing: number };

/** A chapter runs until `end`; `landing` is a settled frame of it (chapter nav). */
export const CHAPTERS: Chapter[] = [
  { id: 'discover', end: T.brewIn[0] + 0.012, landing: 0.2 },
  { id: 'brew', end: T.potionUp[1], landing: 0.5 },
  // landing: the second swallow, the bottle tipped at his mouth
  { id: 'drink', end: T.flash, landing: T.gulps[1] },
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
  // slow at first, then faster as the potion takes hold
  const rise = clamp01((g - T.closing[0]) / T.closing[1]) ** 1.4;
  const burst = smooth((g - T.flash) / 0.02);
  return rise * (1 - burst);
}
/** 0..1: the last moment before the awakening, when almost nothing is lit. */
export function blackoutAt(g: number): number {
  const close = smooth((g - T.blackout[0]) / T.blackout[1]);
  const open = smooth((g - T.flash) / 0.012);
  return close * (1 - open);
}
/** 0..1 flash of spirit vision at the awakening: a quick rise, a slower fade. */
export function flashAt(g: number): number {
  const spike = smooth((g - (T.flash - 0.005)) / 0.006);
  const decay = 1 - smooth((g - (T.flash + 0.002)) / 0.034);
  return spike * decay;
}
/** 0..1 awakening: eased in and out, so nothing arrives all at once. */
export function awakenAt(g: number): number {
  const t = clamp01((g - T.awaken[0]) / T.awaken[1]);
  // a touch faster out of the flash than smoothstep, still settling gently
  return smooth(t) * 0.8 + (1 - (1 - t) ** 2) * 0.2;
}

/*
 * Scroll → story time. Two stretches of the page are paced on their own:
 *  - the way in (`lead` px, while the room rises out of the hero) plays the story up to
 *    `leadTo`: the book falls in and opens as the room comes up, so it is never empty;
 *  - the voices get `dwell` extra px inside T.voices, so each raving stays on screen for
 *    a few wheel steps.
 * Every other beat keeps one pace. Pure functions of the scroll position, so the story
 * still plays backwards.
 */
export type Pace = { range: number; dwell: number; lead?: number; leadTo?: number };
function paced({ range, dwell, lead = 0, leadTo = 0 }: Pace) {
  const from = lead > 0 ? clamp01(leadTo) : 0;
  const run = Math.max(1, range - lead - dwell);
  /** px of the paced run per unit of story time */
  const per = run / Math.max(1e-6, 1 - from);
  const [v0, v1] = T.voices;
  const vStart = lead + Math.max(0, v0 - from) * per;
  const vLength = (v1 - v0) * per + dwell;
  return { from, per, lead, vStart, vLength, v0, v1 };
}
/** Story time (0..1) at `px` of the chapter's scroll. */
export function storyAt(px: number, pace: Pace): number {
  const { from, per, lead, vStart, vLength, v0, v1 } = paced(pace);
  if (lead > 0 && px < lead) return clamp01((Math.max(0, px) / lead) * from);
  if (px <= vStart) return clamp01(from + (px - lead) / per);
  if (px < vStart + vLength) return v0 + ((px - vStart) / vLength) * (v1 - v0);
  return clamp01(v1 + (px - vStart - vLength) / per);
}
/** The inverse of storyAt: the scroll px where story time `g` is reached. */
export function scrollAt(g: number, pace: Pace): number {
  const { from, per, lead, vStart, vLength, v0, v1 } = paced(pace);
  const t = clamp01(g);
  if (lead > 0 && t < from) return (t / from) * lead;
  if (t <= v0) return lead + (t - from) * per;
  if (t < v1) return vStart + ((t - v0) / (v1 - v0)) * vLength;
  return vStart + vLength + (t - v1) * per;
}
