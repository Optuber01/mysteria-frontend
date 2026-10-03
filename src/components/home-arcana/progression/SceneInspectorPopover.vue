<template>
  <Teleport to="body">
  <Transition name="inspector" :duration="reducedMotion ? 0 : { enter: 250, leave: 130 }">
    <aside
      v-if="open && anchor"
      :id="id"
      ref="popoverRef"
      class="inspector"
      :class="{ 'inspector--instant': reducedMotion, 'is-positioned': positioned }"
      role="tooltip"
    >
      <span>{{ t('home.progression.inspector.kicker') }}</span>
      <strong>{{ title }}</strong>
      <p>{{ description }}</p>
      <i ref="arrowRef" class="inspector__arrow" />
    </aside>
  </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { autoUpdate, computePosition, flip, offset, shift, size, arrow } from '@floating-ui/dom';
import { nextTick, onUnmounted, ref, watch } from 'vue';
import { useReducedMotion } from '@/composables/useReducedMotion';
import { useI18n } from '@/composables/useI18n';

const props = defineProps<{
  id?: string;
  open: boolean;
  anchor: HTMLElement | null;
  boundary: HTMLElement | null;
  title?: string;
  description?: string;
}>();

const popoverRef = ref<HTMLElement | null>(null);
const arrowRef = ref<HTMLElement | null>(null);
const reducedMotion = useReducedMotion();
const { t } = useI18n();
// Stays hidden until floating-ui has placed it, so it never flashes at the
// viewport origin.
const positioned = ref(false);
let cleanup: (() => void) | null = null;

async function position() {
  if (!props.anchor || !popoverRef.value || !props.boundary) return;
  const popover = popoverRef.value;
  const anchorRect = props.anchor.getBoundingClientRect();
  const boundaryRect = props.boundary.getBoundingClientRect();
  if (boundaryRect.width < 500) popover.style.maxWidth = '';
  const placement = boundaryRect.width < 500
    ? (anchorRect.top - boundaryRect.top > boundaryRect.height / 2 ? 'top' : 'bottom')
    : (anchorRect.left + anchorRect.width / 2 < boundaryRect.left + boundaryRect.width / 2 ? 'left' : 'right');
  const result = await computePosition(props.anchor, popover, {
    strategy: 'fixed',
    placement,
    middleware: [
      offset(12),
      flip({ boundary: props.boundary, rootBoundary: 'viewport', padding: 12 }),
      boundaryRect.width < 500 ? undefined : size({
        boundary: props.boundary,
        rootBoundary: 'viewport',
        padding: 12,
        apply({ availableWidth }) {
          popover.style.maxWidth = `${Math.max(0, Math.min(300, availableWidth))}px`;
        },
      }),
      shift({ boundary: props.boundary, rootBoundary: 'viewport', padding: 12 }),
      arrowRef.value ? arrow({ element: arrowRef.value, padding: 12 }) : undefined,
    ].filter(Boolean),
  });
  Object.assign(popover.style, { left: `${result.x}px`, top: `${result.y}px` });
  positioned.value = true;
  if (!arrowRef.value || !result.middlewareData.arrow) return;
  const side = result.placement.split('-')[0];
  const staticSide = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' }[side];
  Object.assign(arrowRef.value.style, {
    left: result.middlewareData.arrow.x == null ? '' : `${result.middlewareData.arrow.x}px`,
    top: result.middlewareData.arrow.y == null ? '' : `${result.middlewareData.arrow.y}px`,
    right: '', bottom: '',
    [staticSide ?? 'left']: '-5px',
  });
}

function start() {
  cleanup?.();
  cleanup = null;
  if (!props.open || !props.anchor || !props.boundary) return;
  nextTick(() => {
    if (!props.anchor || !popoverRef.value) return;
    cleanup = autoUpdate(props.anchor, popoverRef.value, position);
  });
}

// A freshly opened card waits for its first placement; a closing card keeps
// its position so the leave transition plays where it was.
watch(() => props.open && Boolean(props.anchor), (isOpen) => {
  if (isOpen) positioned.value = false;
}, { immediate: true });
watch(() => [props.open, props.anchor, props.boundary], start, { immediate: true });
onUnmounted(() => cleanup?.());
</script>

<style scoped>
/* A paper tag tied to the exhibit: cream card, ink text, crimson kicker. */
.inspector {
  position: fixed;
  z-index: 80;
  top: 0;
  left: 0;
  visibility: hidden;
  width: min(290px, calc(100vw - 24px));
  padding: 14px 16px 16px;
  overflow: visible;
  border-radius: 4px;
  color: var(--paper-ink);
  background: var(--paper);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55), 0 2px 6px rgba(0, 0, 0, 0.4);
  pointer-events: none;
}
.inspector.is-positioned { visibility: visible; }
.inspector > span {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--crimson-deep);
  font: 500 .66rem/1 var(--font-mono);
  letter-spacing: .14em;
  text-transform: uppercase;
}
.inspector > span::before { width: 14px; height: 1px; background: currentColor; content: ''; }
.inspector strong { display: block; margin-top: 10px; color: var(--paper-ink); font: 700 .95rem/1.25 var(--font-body); }
.inspector p { margin: 6px 0 0; color: var(--paper-ink-muted); font-size: .82rem; line-height: 1.5; }
.inspector__arrow {
  position: absolute;
  width: 10px;
  height: 10px;
  background: var(--paper);
  transform: rotate(45deg);
}
.inspector-enter-active { transition: opacity .18s var(--ease-out), transform .18s var(--ease-out); }
.inspector-leave-active { transition: opacity .12s var(--ease-out), transform .12s var(--ease-out); }
.inspector-enter-from { opacity: 0; transform: translateY(6px) scale(.97); }
.inspector-leave-to { opacity: 0; transform: translateY(4px); }
.inspector--instant.inspector-enter-active,
.inspector--instant.inspector-leave-active { transition: none; }
@media (max-width: 600px) { .inspector { width: min(236px, calc(100vw - 24px)); overflow-wrap: anywhere; } }
</style>
