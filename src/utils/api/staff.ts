import type {StaffMember} from "@/types/staff";

/** Staff are roles above this priority (MODERATOR and up on the backend). */
export const STAFF_MIN_PRIORITY = 4;

/**
 * Fetches the staff roster. It goes around the shared API client on purpose: that client
 * raises an error toast on failure, and the Staff page has its own quiet fallback.
 * The roster is public once the backend allows it; until then a signed-in token gets it.
 */
export async function fetchStaff(token?: string | null, signal?: AbortSignal): Promise<StaffMember[]> {
    const response = await fetch(`/api/members?minPriority=${STAFF_MIN_PRIORITY}`, {
        headers: {Accept: "application/json", ...(token ? {Authorization: `Bearer ${token}`} : {})},
        signal,
    });
    if (!response.ok) throw new Error(`members ${response.status}`);
    const data: unknown = await response.json();
    if (!Array.isArray(data)) throw new Error("members: not a list");
    return data.filter((row): row is StaffMember =>
        !!row && typeof row === "object" && typeof (row as StaffMember).position === "string");
}
