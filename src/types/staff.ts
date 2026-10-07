/**
 * One row of GET /api/members. Today's API sends the first three fields; the extended
 * backend (see the members patch) adds the rest, so every one of them is optional and
 * the page shows what it gets.
 */
export interface StaffMember {
    /** Minecraft name; null for staff who never linked an account. */
    nickname: string | null;
    /** The rank's display name, e.g. "Moderator". */
    position: string;
    avatarUrl: string | null;
    /** The rank's stable key, e.g. "MODERATOR". */
    role?: string | null;
    /** Higher ranks first. */
    priority?: number | null;
    /** The rank's own description from the backend (English). */
    roleDescription?: string | null;
    /** ISO date-time they last became staff. */
    staffSince?: string | null;
    /** ISO date-time they joined the Discord server. */
    joinedAt?: string | null;
}
