<template>
  <button
    class="server-chip"
    :title="copied ? 'Server address copied' : `Copy ${MYSTERRIA_ADDRESS}`"
    @click="copyIp"
  >
    <span class="status-dot" :class="{ online: isOnline, offline: !isOnline }" aria-hidden="true"></span>
    <span class="chip-ip">{{ MYSTERRIA_ADDRESS }}</span>
    <span v-if="isOnline && playerCount !== null" class="chip-players">
      {{ playerCount }}
    </span>
    <span class="chip-copy-live" aria-live="polite">
      <Transition name="fade">
        <span v-if="copied" class="copied-badge" aria-hidden="true">✓</span>
      </Transition>
      <span v-if="copied" class="visually-hidden">Server address copied</span>
    </span>
  </button>
</template>

<script lang="ts" setup>
import { computed, ref, onUnmounted } from 'vue';
import { useSharedServerStatus } from '@/composables/useSharedServerStatus';
import { MYSTERRIA_ADDRESS } from '@/services/serverStatus';

const { status } = useSharedServerStatus();
const isOnline = computed(() => status.value.state === 'online');
const playerCount = computed(() => status.value.playersOnline);
const copied = ref(false);
let copiedTimeout: ReturnType<typeof setTimeout> | null = null;

async function copyIp() {
  try {
    await navigator.clipboard.writeText(MYSTERRIA_ADDRESS);
    copied.value = true;
    if (copiedTimeout) clearTimeout(copiedTimeout);
    copiedTimeout = setTimeout(() => { copied.value = false; }, 1800);
  } catch {
    // clipboard not available
  }
}

onUnmounted(() => {
  if (copiedTimeout) clearTimeout(copiedTimeout);
});
</script>

<style scoped>
.server-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  background: rgba(255, 255, 255, .78);
  backdrop-filter: blur(14px);
  border: 1px solid var(--hairline, #eae1d0);
  border-radius: 999px;
  cursor: pointer;
  color: var(--ink, #221c14);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.5px;
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.server-chip:hover {
  border-color: color-mix(in srgb, var(--primary, #7458e8) 40%, transparent);
  color: var(--ink, #221c14);
  background: var(--primary-tint, rgba(116, 88, 232, .12));
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background 0.4s ease;
}

.status-dot.online {
  background: var(--live, #34c77b);
  box-shadow: 0 0 5px rgba(52, 199, 123, 0.55);
}

.status-dot.offline {
  background: var(--ink-muted, #756b5c);
}

.chip-ip {
  color: inherit;
}

.chip-players {
  color: var(--live, #34c77b);
  font-size: 10px;
  opacity: 0.85;
}

.chip-players::before {
  content: '·';
  margin-right: 6px;
  opacity: 0.5;
}

.chip-copy-live {
  position: absolute;
  inset: 0;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.copied-badge {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-tint, rgba(116, 88, 232, .12));
  color: var(--primary, #7458e8);
  font-size: 12px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .server-chip {
    display: none;
  }
}
</style>
