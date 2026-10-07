/*
 * The hero's sky, and what the drawn card does to it.
 *
 * Two things change on a draw, and they are kept apart:
 *  - the sky's state: what hangs over Backlund (the crimson moon, a sun, the dusk sun
 *    stuck on the horizon, or nothing to see behind storm cloud) and the daylight that
 *    goes with it. It stays from card to card and only changes when a card claims it;
 *  - the card's effect: its own tint over the sky and its moment (effects/<id>.vue).
 *    It leaves with the card.
 *
 * Nine Pathways have an effect. Every other card (and every Boon) keeps the sky as it is
 * and adds nothing: after the Sun, Death leaves the sun up.
 */

/** What hangs in the sky. 'hidden': behind the Tyrant's storm, whatever was there is lost to sight. */
export type Body = 'moon' | 'sun' | 'dusk' | 'hidden';
/** A card's claim on the sky; 'keep' acts on whatever is up. */
export type Claim = Body | 'keep';

export type SkyScene = {
  claim: Claim;
  /** The card's tint over the sky, night and day (dark theme) ... */
  grade: string;
  /** ... and on paper (light theme): always a tint over the morning haze, never a dark sky. */
  gradeLight: string;
  /** The far scene darkened by this much (0..1); on paper a third of it. */
  shade?: number;
  /** The moon disc while this card holds it: a filter (darker, colder...) and a size. */
  moonFilter?: string;
  moonScale?: number;
};

/** Pathways with an effect; the rest keep the sky. */
export const SKY_EFFECTS = ['sun', 'darkness', 'moon', 'fool', 'tyrant', 'paragon', 'error', 'giant', 'chained'] as const;
export type SkyEffectId = (typeof SKY_EFFECTS)[number];

const g = (top: string, mid: string, bottom = 'transparent') => `linear-gradient(180deg, ${top} 0%, ${mid} 48%, ${bottom} 100%)`;

export const SKY_SCENES: Record<SkyEffectId, SkyScene> = {
  // the moon sets and a low sun comes up over the castle: a warm, late-day light, not noon
  sun: {
    claim: 'sun',
    grade: g('rgba(70, 64, 92, .5)', 'rgba(196, 140, 70, .34)', 'rgba(230, 160, 80, .3)'),
    gradeLight: g('rgba(255, 226, 160, .28)', 'rgba(255, 210, 130, .2)'),
  },
  // the stars go out; only the crimson moon is left, faint, in a true black
  darkness: {
    claim: 'moon',
    grade: g('rgba(0, 0, 0, .9)', 'rgba(0, 0, 0, .62)', 'rgba(0, 0, 0, .3)'),
    gradeLight: g('rgba(40, 40, 60, .22)', 'rgba(40, 40, 60, .12)'),
    shade: 0.6,
    moonFilter: 'brightness(.55) saturate(.8)',
  },
  // the full crimson moon swells and floods the castle with its light
  moon: {
    claim: 'moon',
    grade: g('rgba(40, 6, 14, .66)', 'rgba(110, 14, 36, .32)'),
    gradeLight: g('rgba(220, 80, 100, .16)', 'rgba(220, 80, 100, .08)'),
    moonFilter: 'saturate(1.25) brightness(1.08)',
    moonScale: 1.3,
  },
  // grey fog rises out of the streets until only the spires stand over it
  fool: {
    claim: 'keep',
    grade: g('rgba(96, 96, 108, .5)', 'rgba(70, 70, 82, .32)'),
    gradeLight: g('rgba(150, 148, 160, .14)', 'rgba(150, 148, 160, .08)'),
    moonFilter: 'blur(1.5px) brightness(.6) saturate(.6)',
  },
  // cloud buries the sky, rain drives in, lightning forks behind the castle
  tyrant: {
    claim: 'hidden',
    grade: g('rgba(13, 23, 38, .86)', 'rgba(26, 40, 62, .48)'),
    gradeLight: g('rgba(70, 90, 120, .26)', 'rgba(70, 90, 120, .14)'),
    shade: 0.15,
  },
  // Backlund's industry by night: a sooty amber glow off the chimneys and the forges
  paragon: {
    claim: 'keep',
    grade: g('rgba(28, 23, 18, .7)', 'rgba(60, 46, 30, .36)', 'rgba(120, 80, 40, .3)'),
    gradeLight: g('rgba(200, 150, 90, .14)', 'rgba(200, 150, 90, .08)', 'rgba(220, 150, 80, .12)'),
    moonFilter: 'brightness(.8) sepia(.3)',
  },
  // it looks normal, but isn't: whatever is up is taken, and comes back not quite in place
  error: {
    claim: 'keep',
    grade: 'transparent',
    gradeLight: 'transparent',
  },
  // a dusk that never ends: the sun stuck on the horizon, the sky bruised violet over it
  giant: {
    claim: 'dusk',
    grade: g('rgba(58, 35, 71, .62)', 'rgba(170, 84, 64, .34)', 'rgba(230, 120, 70, .34)'),
    gradeLight: g('rgba(160, 110, 170, .16)', 'rgba(240, 150, 100, .14)'),
  },
  // an iron-grey stillness under a cold full moon
  chained: {
    claim: 'moon',
    grade: g('rgba(16, 18, 22, .8)', 'rgba(40, 44, 52, .38)'),
    gradeLight: g('rgba(120, 125, 135, .16)', 'rgba(120, 125, 135, .08)'),
    shade: 0.12,
    moonFilter: 'saturate(.55) brightness(.92)',
  },
};

export const isSkyEffect = (id: string | null | undefined): id is SkyEffectId =>
  !!id && (SKY_EFFECTS as readonly string[]).includes(id);

/** The card's scene, or null: no claim on the sky and nothing of its own. */
export const skySceneFor = (id: string | null | undefined): SkyScene | null => (isSkyEffect(id) ? SKY_SCENES[id] : null);

/**
 * What hangs in the sky after a card. A card with no claim keeps what is up; leaving the
 * Tyrant's storm gives back whatever the cloud was covering (`underCloud`).
 */
export function nextBody(claim: Claim | null, current: Body, underCloud: Body): Body {
  if (claim && claim !== 'keep') return claim;
  return current === 'hidden' ? underCloud : current;
}
