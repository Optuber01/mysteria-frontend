<template>
  <div class="kind-tabs" role="tablist" :aria-label="label" @keydown="$emit('keydown', $event)">
    <button
      v-for="option in options"
      :id="tabId(option.id)"
      :key="option.id"
      type="button"
      role="tab"
      :aria-selected="active === option.id"
      :aria-controls="panelId"
      :tabindex="active === option.id ? 0 : -1"
      @click="$emit('choose', option.id)"
    >
      {{ option.label }}<b>{{ option.count }}</b>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ProgressionKind } from '@/data/homePathways';

defineProps<{
  label: string;
  active: ProgressionKind;
  panelId: string;
  options: { id: ProgressionKind; label: string; count: number }[];
  tabId: (kind: ProgressionKind) => string;
}>();

defineEmits<{ choose: [kind: ProgressionKind]; keydown: [event: KeyboardEvent] }>();
</script>

<style scoped>
.kind-tabs {
  width: fit-content;
  display: flex;
  padding: 4px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(13, 15, 20, .7);
}

.kind-tabs button {
  min-width: 124px;
  min-height: 44px;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  color: var(--ash);
  background: transparent;
  cursor: pointer;
  font: 600 .9rem/1 var(--font-body);
  transition: background-color .2s ease, color .2s ease;
}

.kind-tabs button:hover { color: var(--bone); background: var(--fog-veil); }
.kind-tabs button:focus-visible { outline: 2px solid var(--crimson-text); outline-offset: 3px; }

.kind-tabs b {
  min-width: 26px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: 99px;
  color: var(--ash);
  background: rgba(214, 220, 228, .08);
  font: 500 .72rem/1 var(--font-mono);
}

.kind-tabs button[aria-selected="true"] { color: var(--bone); background: var(--crimson); }
.kind-tabs button[aria-selected="true"] b { color: var(--bone); background: rgba(7, 8, 11, .28); }

@media (max-width: 640px) {
  .kind-tabs { width: 100%; }
  .kind-tabs button { min-width: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .kind-tabs button { transition: none; }
}
</style>
