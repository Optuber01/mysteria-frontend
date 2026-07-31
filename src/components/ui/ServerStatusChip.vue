<template>
  <span class="server-status">
    <button :aria-label="accessibleLabel" class="server-chip" type="button" @click="copyIp">
      <span aria-hidden="true" class="status-dot" :class="status"></span>
      <span class="chip-ip">mc.mysterria.net</span>
      <span v-if="status === 'online' && playerCount !== null" class="chip-players">
        {{ playerCount }}
      </span>
      <span v-else-if="status !== 'loading'" class="chip-state">{{ currentLanguageCopy[status] }}</span>
      <span aria-hidden="true" class="copy-glyph">⧉</span>
      <Transition name="fade">
         <span v-if="copied || copyFailed" aria-hidden="true" :class="{ failed: copyFailed }" class="copied-badge">{{ copied ? '✓' : '×' }}</span>
      </Transition>
    </button>
    <span class="sr-only" aria-live="polite">{{ announcement }}</span>
    <span v-if="copyFailed" class="chip-error" role="status">{{ currentLanguageCopy.failed }}</span>
  </span>
</template>

<script lang="ts" setup>
import {computed, ref, onMounted, onUnmounted, watch} from 'vue';
import { useI18n } from '@/composables/useI18n';

const {currentLanguage} = useI18n();

type ServerState = 'loading' | 'online' | 'offline' | 'unavailable';
const status = ref<ServerState>('loading');
const playerCount = ref<number | null>(null);
const copied = ref(false);
const copyFailed = ref(false);
const announcement = ref('');
let pollInterval: ReturnType<typeof setInterval> | null = null;
let copiedTimeout: ReturnType<typeof setTimeout> | null = null;
let statusController: AbortController | null = null;

async function fetchStatus() {
  statusController?.abort();
  const controller = new AbortController();
  statusController = controller;
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch('https://mcapi.us/server/status?ip=mc.mysterria.net', {signal: controller.signal});
    if (!res.ok) throw new Error('Status unavailable');
    const data = await res.json();
    status.value = data.online === true ? 'online' : 'offline';
    playerCount.value = status.value === 'online' ? (data.players?.now ?? 0) : null;
  } catch {
    status.value = 'unavailable';
    playerCount.value = null;
  } finally {
    clearTimeout(timeout);
  }
}

async function copyIp() {
  try {
    await navigator.clipboard.writeText('mc.mysterria.net');
    copied.value = true;
    copyFailed.value = false;
    announcement.value = currentLanguageCopy.value.copied;
    if (copiedTimeout) clearTimeout(copiedTimeout);
    copiedTimeout = setTimeout(() => { copied.value = false; }, 1800);
  } catch {
    copyFailed.value = true;
    announcement.value = currentLanguageCopy.value.failed;
    if (copiedTimeout) clearTimeout(copiedTimeout);
    copiedTimeout = setTimeout(() => { copyFailed.value = false; }, 2400);
  }
}

const currentLanguageCopy = computed(() => currentLanguage.value === 'uk' ? {
  copy: 'Копіювати адресу сервера', online: 'онлайн', offline: 'офлайн', unavailable: 'статус недоступний', loading: 'перевірка статусу', players: 'гравців', copied: 'Адресу сервера скопійовано', failed: 'Не вдалося скопіювати адресу'
} : {
  copy: 'Copy server address', online: 'online', offline: 'offline', unavailable: 'status unavailable', loading: 'checking status', players: 'players', copied: 'Server address copied', failed: 'Could not copy server address'
});
const accessibleLabel = computed(() => `${currentLanguageCopy.value.copy}: mc.mysterria.net, ${currentLanguageCopy.value[status.value]}${playerCount.value !== null ? `, ${playerCount.value} ${currentLanguageCopy.value.players}` : ''}`);
watch(status, (next, previous) => {
  if (previous !== 'loading') announcement.value = currentLanguageCopy.value[next];
});

onMounted(() => {
  fetchStatus();
  pollInterval = setInterval(fetchStatus, 60_000);
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
  if (copiedTimeout) clearTimeout(copiedTimeout);
  statusController?.abort();
});
</script>

<style scoped>
.server-status {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.server-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 14px;
  background: rgba(255, 255, 255, .025);
  border: 1px solid rgba(200, 178, 115, .22);
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--myst-ink-muted);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: .02em;
  transition: background-color var(--motion-base) var(--ease-standard), border-color var(--motion-base) var(--ease-standard), color var(--motion-base) var(--ease-standard);
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.server-chip:hover {
  border-color: color-mix(in srgb, var(--myst-gold) 40%, transparent);
  color: var(--myst-ink);
  background: color-mix(in srgb, var(--myst-gold) 5%, var(--myst-bg));
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background-color var(--motion-base) var(--ease-standard);
}

.status-dot.online {
  background: #4ade80;
  box-shadow: 0 0 5px rgba(74, 222, 128, 0.6);
}

.status-dot.offline {
  background: #52525b;
}
.status-dot.loading, .status-dot.unavailable { background: #7c7b82; }

.chip-ip {
  color: inherit;
}

.chip-players {
  color: #4ade80;
  font-size: 10px;
  opacity: 0.85;
}

.chip-players::before {
  content: '·';
  margin-right: 3px;
  opacity: 0.5;
}
.chip-state { color: #b0adb0; font-size: 10px; }
.copy-glyph { color: #a9a6a0; margin-left: 2px; font-size: 12px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.chip-error { margin-left: 7px; color: #ffaaaa; font: 11px var(--font-ui); white-space: nowrap; }

.copied-badge {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--myst-gold) 15%, var(--myst-bg));
  color: var(--myst-gold);
  font-size: 12px;
}
.copied-badge.failed { color: #ff9a9a; background: color-mix(in srgb, #ef4444 13%, var(--myst-bg)); }

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--motion-base) var(--ease-standard);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

</style>
