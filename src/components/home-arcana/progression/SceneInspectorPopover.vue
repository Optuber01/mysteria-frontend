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
/* A note pinned to the exhibit: the page's dark surface, the Pathway's kicker. */
.inspector {
  position: fixed;
  z-index: 80;
  top: 0;
  left: 0;
  visibility: hidden;
  width: min(290px, calc(100vw - 24px));
  padding: 14px 16px 16px;
  overflow: visible;
  border-radius: 12px;
  color: var(--arc-ink, #efeef3);
  background: color-mix(in oklab, #15151b 94%, var(--acc, #a78bfa));
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--acc, #a78bfa) 40%, transparent), 0 18px 40px rgba(0, 0, 0, 0.55);
  font-family: var(--arc-body, system-ui, sans-serif);
  pointer-events: none;
}
.inspector.is-positioned { visibility: visible; }
.inspector > span {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--acc, #a78bfa);
  font: 400 10.5px/1 var(--arc-caps, system-ui, sans-serif);
  letter-spacing: .16em;
  text-transform: uppercase;
}
.inspector > span::before { width: 14px; height: 1px; background: currentColor; content: ''; }
.inspector strong { display: block; margin-top: 10px; color: var(--arc-ink, #efeef3); font-size: 15px; font-weight: 600; line-height: 1.3; }
.inspector p { margin: 6px 0 0; color: var(--arc-muted, #a7a6b2); font-size: 13.5px; line-height: 1.5; }
.inspector__arrow {
  position: absolute;
  width: 10px;
  height: 10px;
  background: color-mix(in oklab, #15151b 94%, var(--acc, #a78bfa));
  transform: rotate(45deg);
}
.inspector-enter-active { transition: opacity .18s cubic-bezier(.22, 1, .36, 1), transform .18s cubic-bezier(.22, 1, .36, 1); }
.inspector-leave-active { transition: opacity .12s cubic-bezier(.22, 1, .36, 1), transform .12s cubic-bezier(.22, 1, .36, 1); }
.inspector-enter-from { opacity: 0; transform: translateY(6px) scale(.97); }
.inspector-leave-to { opacity: 0; transform: translateY(4px); }
.inspector--instant.inspector-enter-active,
.inspector--instant.inspector-leave-active { transition: none; }
@media (max-width: 600px) { .inspector { width: min(236px, calc(100vw - 24px)); overflow-wrap: anywhere; } }
</style>
