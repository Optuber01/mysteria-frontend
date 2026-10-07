/*
 * The Ascension page's view of the census (/api/beyonder-stats). The holders' names,
 * Sequence 4 and the count for every Pathway are newer than the rest: a response
 * cached before them still renders, with counts only and the top eight Pathways.
 */
import type {BeyonderStatsAggregate, PathwaySeatOccupancy} from '@/composables/useBeyonderStats';

/** One Pathway's high seats, with the holders' names once the server sends them. */
export type SeatOccupancy = PathwaySeatOccupancy & {
  /** Player names holding Sequence 0..4, indexed by sequence. */
  holders?: string[][];
};

export type AscensionStats = Omit<BeyonderStatsAggregate, 'highSeats'> & {
  highSeats?: SeatOccupancy[];
  /** Beyonders on every Pathway (topPathways stops at eight). */
  pathwayCounts?: {name: string; count: number}[];
};

/** The seats, climbing: Demigod (uncapped), Saint, Angel, Archangel, Deity. */
export const SEAT_SEQUENCES = [4, 3, 2, 1, 0] as const;

export interface SeatCell {
  sequence: number;
  /** Rank title: Saint, Angel, Archangel, Deity. */
  rank: string;
  /** This Pathway's name for the rung (Justice Mentor, White Angel, Sun). */
  rung: string;
  /** null when the census doesn't say (Sequence 4 in an older response). */
  count: number | null;
  /** Seats per Pathway; null for Sequence 4, which has no cap. */
  limit: number | null;
  /** Names, when the server sends them; null when it doesn't. */
  holders: string[] | null;
}

export interface PathwayRow {
  id: string;
  name: string;
  /** Beyonders walking it; null when the census doesn't say. */
  walkers: number | null;
  seats: SeatCell[];
  /** Capped seats held, and how many there are. */
  held: number;
  total: number;
}

export interface RungSummary {
  sequence: number;
  rank: string;
  /** Seats per Pathway; null for the uncapped rung (Sequence 4). */
  limit: number | null;
  /** Beyonders on this rung across the server; null when unknown. */
  count: number | null;
  /** Seats on this rung across every Pathway. */
  total: number;
}
