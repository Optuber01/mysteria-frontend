import type {VercelRequest, VercelResponse} from '@vercel/node';

/*
 * Self-contained on purpose: Vercel compiles this file natively as a per-file
 * ESM module, so a relative runtime import (e.g. from a shared ../server/
 * module) dies with ERR_MODULE_NOT_FOUND in production. The dev middleware in
 * vite.config.ts imports loadBeyonderStats from here instead - the @vercel/node
 * import above is type-only and gets erased when the config is bundled.
 *
 * Only aggregates leave this module, plus the names of the players on the
 * seats (Sequence 4 and above), which the Ascension page lists by Pathway. The
 * rest of the roster from catwalk stays server-side.
 */

const CATWALK_BASE_URL = 'https://catwalk.mysterria.net';

export interface UpstreamBeyonderData {
    playerName: string;
    beyonder: boolean;
    pathway: string;
    sequence: string;
    acting: number;
}

interface UpstreamBeyonderResponse {
    success: boolean;
    message: string;
    data: {
        amount: number;
        beyonder: UpstreamBeyonderData[];
    };
}

/** The seats: Sequence 4 (uncapped) and the capped Sequences 3 to 0. */
const SEAT_TOP = 4;

export interface PathwaySeatOccupancy {
    /** Lowercased pathway id, matching src/data/pathways.ts. */
    pathway: string;
    /** Players currently holding Sequence 0..4, indexed by sequence. */
    counts: [number, number, number, number, number];
    /** Their names, indexed the same way, sorted. */
    holders: [string[], string[], string[], string[], string[]];
}

export interface BeyonderStatsData {
    totalBeyonders: number;
    uniquePathways: number;
    advancedBeyonders: number;
    averageSequence: string;
    topPathways: { name: string; count: number }[];
    sequenceDistribution: { sequence: string; count: number }[];
    highSeats: PathwaySeatOccupancy[];
    /** Beyonders on every pathway (topPathways keeps only the eight largest). */
    pathwayCounts: { name: string; count: number }[];
}

export function aggregateBeyonderStats(beyonders: UpstreamBeyonderData[]): BeyonderStatsData {
    const pathwayCounts = new Map<string, number>();
    const sequenceCounts = new Map<string, number>();
    const seats = new Map<string, PathwaySeatOccupancy>();
    let sequenceSum = 0;
    let advancedBeyonders = 0;

    for (const b of beyonders) {
        pathwayCounts.set(b.pathway, (pathwayCounts.get(b.pathway) || 0) + 1);

        const seq = parseInt(b.sequence, 10);
        if (Number.isNaN(seq)) continue;

        sequenceSum += seq;
        if (seq >= 0 && seq <= 3) advancedBeyonders++;
        if (seq >= 0 && seq <= SEAT_TOP) {
            const key = b.pathway.toLowerCase();
            const entry: PathwaySeatOccupancy = seats.get(key)
                ?? {pathway: key, counts: [0, 0, 0, 0, 0], holders: [[], [], [], [], []]};
            entry.counts[seq]++;
            if (b.playerName) entry.holders[seq].push(b.playerName);
            seats.set(key, entry);
        }
        if (seq >= 1 && seq <= 9) {
            const key = seq.toString();
            sequenceCounts.set(key, (sequenceCounts.get(key) || 0) + 1);
        }
    }

    const allPathways = Array.from(pathwayCounts.entries())
        .map(([name, count]) => ({name, count}))
        .sort((a, b) => b.count - a.count);
    const topPathways = allPathways.slice(0, 8);

    const sequenceDistribution = Array.from(sequenceCounts.entries())
        .map(([sequence, count]) => ({sequence, count}))
        .sort((a, b) => parseInt(a.sequence, 10) - parseInt(b.sequence, 10));

    const byName = (a: string, b: string) => a.localeCompare(b, 'en', {sensitivity: 'base'});
    const highSeats = Array.from(seats.values())
        .map(entry => ({...entry, holders: entry.holders.map(names => names.sort(byName)) as PathwaySeatOccupancy['holders']}))
        .sort((a, b) => a.pathway.localeCompare(b.pathway));

    const averageSequence = beyonders.length > 0 ? (sequenceSum / beyonders.length).toFixed(1) : '0';

    return {
        totalBeyonders: beyonders.length,
        uniquePathways: pathwayCounts.size,
        advancedBeyonders,
        averageSequence,
        topPathways,
        sequenceDistribution,
        highSeats,
        pathwayCounts: allPathways,
    };
}

export interface BeyonderStatsResult {
    status: number;
    body: { success: boolean; message?: string; data?: BeyonderStatsData };
}

/** Fetches the full roster from catwalk and returns the aggregate and the seat holders. */
export async function loadBeyonderStats(token: string | undefined): Promise<BeyonderStatsResult> {
    const headers: Record<string, string> = {Accept: 'application/json'};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const upstreamResponse = await fetch(`${CATWALK_BASE_URL}/pathway/everyone`, {headers});
    if (!upstreamResponse.ok) {
        return {status: upstreamResponse.status, body: {success: false, message: 'Failed to fetch beyonder data'}};
    }

    const result = (await upstreamResponse.json()) as UpstreamBeyonderResponse;
    const beyonders = result.data?.beyonder ?? [];
    return {status: 200, body: {success: true, data: aggregateBeyonderStats(beyonders)}};
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const result = await loadBeyonderStats(process.env.CATWALK_API_TOKEN);
        if (result.body.success) {
            res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
        }
        return res.status(result.status).json(result.body);
    } catch (error) {
        console.error('Error in beyonder-stats:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(502).json({
            success: false,
            message: 'Failed to reach catwalk service',
            details: errorMessage
        });
    }
}
