export const MYSTERRIA_ADDRESS = 'mc.mysterria.net';
export const MYSTERRIA_STATUS_ENDPOINT =
  `https://mcapi.us/server/status?ip=${MYSTERRIA_ADDRESS}`;

export type ServerStatus = {
  state: 'loading' | 'online' | 'offline' | 'unavailable';
  playersOnline: number | null;
  checkedAt: Date | null;
};

type McApiResponse = {
  online?: boolean;
  players?: { now?: number };
};

export async function getServerStatus(
  signal?: AbortSignal,
): Promise<ServerStatus> {
  try {
    const response = await fetch(MYSTERRIA_STATUS_ENDPOINT, { signal });
    if (!response.ok) {
      return { state: 'unavailable', playersOnline: null, checkedAt: new Date() };
    }

    const data = (await response.json()) as McApiResponse;
    if (data.online !== true) {
      return { state: 'offline', playersOnline: null, checkedAt: new Date() };
    }

    const playersOnline =
      typeof data.players?.now === 'number' ? data.players.now : null;
    return { state: 'online', playersOnline, checkedAt: new Date() };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    return { state: 'unavailable', playersOnline: null, checkedAt: new Date() };
  }
}

export type LivingWorldSnapshot = {
  towns: number | null;
  organizations: number | null;
  currentEvent: string | null;
  recentDiscovery: string | null;
};

export interface ServerDataAdapter {
  getStatus(signal?: AbortSignal): Promise<ServerStatus>;
  getLivingWorld(): Promise<LivingWorldSnapshot>;
}

/**
 * Adapter boundary for a future first-party living-world API.
 * Null values intentionally render as unavailable; mock values are never
 * presented as live server facts.
 */
export async function getLivingWorldSnapshot(): Promise<LivingWorldSnapshot> {
  return {
    towns: null,
    organizations: null,
    currentEvent: null,
    recentDiscovery: null,
  };
}

export const liveServerDataAdapter: ServerDataAdapter = {
  getStatus: getServerStatus,
  getLivingWorld: getLivingWorldSnapshot,
};

/**
 * Test/preview adapter. The homepage does not use this adapter in production;
 * callers must opt in and clearly label any supplied values as mock data.
 */
export function createMockServerDataAdapter(
  status: ServerStatus,
  livingWorld: LivingWorldSnapshot,
): ServerDataAdapter {
  return {
    async getStatus() {
      return status;
    },
    async getLivingWorld() {
      return livingWorld;
    },
  };
}
