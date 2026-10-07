<template>
  <button :class="['ip-chip', {'is-copied': copied}]" :title="t('homePage.copyHint')" type="button" @click="copyIp">
    <!-- the check takes the dot's place, so the chip keeps its width while it confirms -->
    <span class="chip-status">
      <span :class="['status-dot', isOnline ? 'online' : 'offline']" aria-hidden="true"></span>
      <Transition name="arc-fade">
        <i v-if="copied" aria-hidden="true" class="fa-solid fa-check chip-copied"></i>
      </Transition>
    </span>
    <span class="chip-ip">{{ SERVER_IP }}</span>
    <span v-if="isOnline && playerCount !== null" class="chip-players">· {{ playerCount }}</span>
    <span class="arc-sr" role="status">{{ copied ? t('copySuccess') : '' }}</span>
  </button>
</template>

<script lang="ts" setup>
import {useI18n} from '@/composables/useI18n';
import {SERVER_IP, useCopyIp, useServerStatus} from '@/composables/useServer';

const {t} = useI18n();
const {isOnline, playerCount} = useServerStatus();
const {copied, copyIp} = useCopyIp();
</script>

<style scoped>
.ip-chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 8px 14px;
  background: color-mix(in oklab, var(--acc) 8%, transparent);
  border: var(--arc-bw) solid var(--arc-line-acc);
  border-radius: 10px;
  cursor: pointer;
  font-family: var(--arc-body);
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--arc-ink);
  white-space: nowrap;
  transition:
    border-color var(--arc-dur-2) var(--arc-ease),
    background-color var(--arc-dur-2) var(--arc-ease);
}

.ip-chip:hover {
  border-color: var(--arc-line-hot);
  background: color-mix(in oklab, var(--acc) 14%, transparent);
}

.chip-status {
  --arc-popover-y: 3px;
  display: grid;
  flex: none;
  place-items: center;
  width: 14px;
  height: 14px;
}

.chip-status > * {
  grid-area: 1 / 1;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  transition: background-color var(--arc-dur-2) var(--arc-ease), opacity var(--arc-dur-1) var(--arc-ease);
}

.status-dot.online {
  background: var(--arc-ok);
  box-shadow: 0 0 6px color-mix(in oklab, var(--arc-ok) 70%, transparent);
}

.status-dot.offline {
  background: var(--arc-muted);
}

.is-copied .status-dot {
  opacity: 0;
}

.chip-players {
  color: var(--arc-ok);
}

.chip-copied {
  color: var(--arc-ok);
  font-size: 11px;
}
</style>
