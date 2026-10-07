<template>
  <!--
    One row of choices (store categories, sorting, a pathway's sequences): an accent
    underline marks the current one, never a pill. Arrow keys move between tabs.
  -->
  <div class="arc-tabs" role="tablist" :aria-label="label" @keydown="onKey">
    <button
        v-for="tab in tabs"
        :key="tab.id"
        :ref="el => setRef(tab.id, el)"
        type="button"
        role="tab"
        class="arc-tabs__tab"
        :class="{'is-current': tab.id === modelValue}"
        :aria-selected="tab.id === modelValue"
        :aria-controls="controls"
        :tabindex="tab.id === modelValue ? 0 : -1"
        @click="$emit('update:modelValue', tab.id)"
    >
      <span>{{ tab.label }}</span>
      <span v-if="tab.count !== undefined" class="arc-tabs__count">{{ tab.count }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
export type Tab = {id: string; label: string; count?: number | string};

const props = defineProps<{
  tabs: Tab[];
  modelValue: string;
  label: string;
  /** The id of the panel the tabs control. */
  controls?: string;
}>();
const emit = defineEmits<{(e: 'update:modelValue', id: string): void}>();

const refs = new Map<string, HTMLElement>();
const setRef = (id: string, el: unknown) => {
  if (el instanceof HTMLElement) refs.set(id, el);
  else refs.delete(id);
};

function onKey(event: KeyboardEvent) {
  const step = {ArrowRight: 1, ArrowLeft: -1, Home: -Infinity, End: Infinity}[event.key];
  if (step === undefined) return;
  event.preventDefault();
  const i = props.tabs.findIndex(t => t.id === props.modelValue);
  const next = Math.max(0, Math.min(props.tabs.length - 1, Number.isFinite(step) ? (i + step + props.tabs.length) % props.tabs.length : step < 0 ? 0 : props.tabs.length - 1));
  const id = props.tabs[next].id;
  emit('update:modelValue', id);
  refs.get(id)?.focus();
}
</script>

<style scoped>
.arc-tabs {
  display: flex;
  gap: 4px clamp(14px, 2vw, 28px);
  overflow-x: auto;
  border-bottom: var(--arc-bw) solid var(--arc-line);
  scrollbar-width: none;
}

.arc-tabs::-webkit-scrollbar {
  display: none;
}

.arc-tabs__tab {
  position: relative;
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 2px;
  border: 0;
  background: none;
  color: var(--arc-muted);
  font: inherit;
  font-size: var(--arc-fs-body);
  font-weight: 600;
  cursor: pointer;
  transition: color .2s ease;
}

.arc-tabs__tab::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: var(--arc-bw-accent);
  border-radius: 1px;
  background: var(--acc-ink);
  content: '';
  opacity: 0;
  transform: scaleX(.4);
  transition: opacity .2s ease, transform .25s cubic-bezier(.2, .8, .2, 1);
}

.arc-tabs__tab:hover,
.arc-tabs__tab.is-current {
  color: var(--arc-ink);
}

.arc-tabs__tab.is-current::after {
  opacity: 1;
  transform: none;
}

.arc-tabs__count {
  color: var(--arc-muted);
  font-size: var(--arc-fs-caption);
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .arc-tabs__tab::after {
    transition: none;
  }
}
</style>
