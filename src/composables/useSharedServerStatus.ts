import { onMounted, onUnmounted, readonly, ref } from 'vue';
import { getServerStatus, type ServerStatus } from '@/services/serverStatus';

const status = ref<ServerStatus>({
  state: 'loading',
  playersOnline: null,
  checkedAt: null,
});

let subscribers = 0;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let controller: AbortController | null = null;

async function refresh() {
  controller?.abort();
  controller = new AbortController();
  try {
    status.value = await getServerStatus(controller.signal);
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      status.value = { state: 'unavailable', playersOnline: null, checkedAt: new Date() };
    }
  }
}

function start() {
  if (pollTimer) return;
  void refresh();
  pollTimer = setInterval(() => {
    if (document.visibilityState === 'visible') void refresh();
  }, 60_000);
}

function stop() {
  if (subscribers > 0) return;
  controller?.abort();
  controller = null;
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

export function useSharedServerStatus() {
  onMounted(() => {
    subscribers += 1;
    start();
  });

  onUnmounted(() => {
    subscribers = Math.max(0, subscribers - 1);
    stop();
  });

  return { status: readonly(status), refresh };
}
