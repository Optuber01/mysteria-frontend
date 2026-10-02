/*
 * The page is the Sequence ladder. Each section owns a stretch of altitude:
 * altitude 0 is rung 9 (the first potion), altitude 9 is rung 0 (godhood).
 * Negative altitude is the ground before the first potion.
 */
export type AscentStage = Readonly<{
  /** Section element id, also the spine's anchor target. */
  id: string;
  /** Altitude at the section's start and end (centre line travel). */
  from: number;
  to: number;
  /** Sections drawn on the luminous summit palette flip the spine to ink. */
  light?: boolean;
}>;

export const ASCENT_STAGES: readonly AscentStage[] = [
  {id: 'ascent-top', from: -1, to: -0.7},
  {id: 'pathways', from: -0.7, to: -0.25},
  {id: 'sequence-9', from: -0.25, to: 0},
  {id: 'sequence-8', from: 0, to: 2},
  {id: 'sequence-6', from: 2, to: 4},
  {id: 'sequence-4', from: 4, to: 5},
  {id: 'sequence-3', from: 5, to: 8},
  {id: 'sequence-0', from: 8, to: 9, light: true},
  {id: 'join', from: 9, to: 9, light: true},
  {id: 'companion', from: 9, to: 9, light: true},
];

/** Rung (Sequence number) → the section that tells its part of the climb. */
export const RUNG_TARGET: Record<number, string> = {
  9: 'sequence-9',
  8: 'sequence-8',
  7: 'sequence-8',
  6: 'sequence-6',
  5: 'sequence-6',
  4: 'sequence-4',
  3: 'sequence-3',
  2: 'sequence-3',
  1: 'sequence-3',
  0: 'sequence-0',
};
