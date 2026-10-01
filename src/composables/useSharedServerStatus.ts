import {computed} from 'vue';
import {useServerStatus} from '@/composables/useServer';

export type ServerStatus = {
  state: 'loading' | 'online' | 'offline';
  playersOnline: number | null;
  checkedAt: Date | null;
};

/**
 * The homepage's view of the shared server poller in useServer.ts, so the
 * header chip and the homepage chapters read one request instead of two.
 */
export function useSharedServerStatus() {
  const {isOnline, playerCount, checkedAt, refresh} = useServerStatus();

  const status = computed<ServerStatus>(() => ({
    state: checkedAt.value === null ? 'loading' : isOnline.value ? 'online' : 'offline',
    playersOnline: playerCount.value,
    checkedAt: checkedAt.value,
  }));

  return {status, refresh};
}
