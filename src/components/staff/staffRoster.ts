import type {StaffMember} from "@/types/staff";

/** A roster row; `also` is a second rank (the snapshot knows these, the API doesn't). */
export type StaffEntry = StaffMember & {nickname: string; also?: string};

export interface StaffRank {
    /** Stable key for translations and ids, e.g. "MODERATOR". */
    key: string;
    label: string;
    /** The backend's own description, used when there's no translated one. */
    description: string | null;
    members: StaffEntry[];
}

/** The rank's key: the backend's role name, or the display name for older API answers. */
export const rankKey = (member: StaffMember): string => {
    const key = (member.role || member.position).trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
    return key === 'ADMINISTRATOR' ? 'ADMIN' : key;
};

const time = (iso?: string | null) => {
    const ms = iso ? Date.parse(iso) : NaN;
    return Number.isNaN(ms) ? Infinity : ms;
};

/**
 * Groups by rank. With priorities (the extended API) ranks run highest first; without them
 * the API's own order is kept, which is already highest first. Inside a rank the
 * longest-serving come first when the dates are known.
 */
export function groupByRank(members: StaffMember[]): StaffRank[] {
    const ranks = new Map<string, StaffRank & {priority: number; order: number}>();
    members.forEach((member, index) => {
        if (!member.nickname) return;
        const key = rankKey(member);
        let rank = ranks.get(key);
        if (!rank) {
            rank = {
                key,
                label: member.position,
                description: member.roleDescription ?? null,
                members: [],
                priority: member.priority ?? -Infinity,
                order: index,
            };
            ranks.set(key, rank);
        }
        rank.members.push(member as StaffEntry);
    });
    return [...ranks.values()]
        .sort((a, b) => (b.priority - a.priority) || (a.order - b.order))
        .map(rank => ({
            key: rank.key,
            label: rank.label,
            description: rank.description,
            members: [...rank.members].sort((a, b) => time(a.staffSince) - time(b.staffSince)),
        }));
}

/** Discord avatars come full size; ask for one that fits the card at 2x. */
export function avatarSrc(url: string | null | undefined): string | null {
    if (!url) return null;
    if (/^https:\/\/cdn\.discordapp\.com\//.test(url) && !url.includes('?')) return `${url}?size=128`;
    return url;
}

/** The first letter or digit of a name, for members without an avatar. */
export const initialOf = (name: string) => (name.match(/[\p{L}\p{N}]/u)?.[0] ?? '?').toUpperCase();
