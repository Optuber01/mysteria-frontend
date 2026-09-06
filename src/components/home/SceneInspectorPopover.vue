<template>
  <Teleport to="body">
  <Transition name="inspector" :duration="reducedMotion ? 0 : { enter: 250, leave: 130 }">
    <aside v-if="open" :id="id" ref="popoverRef" class="inspector" :class="{ 'inspector--instant': reducedMotion }" role="tooltip">
      <span>Inspecting</span>
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
let cleanup: (() => void) | null = null;

const notchBorders: Record<string, string[]> = {
  top: ['borderBottomWidth', 'borderRightWidth'],
  bottom: ['borderTopWidth', 'borderLeftWidth'],
  right: ['borderLeftWidth', 'borderBottomWidth'],
  left: ['borderRightWidth', 'borderTopWidth'],
};

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
  if (!arrowRef.value || !result.middlewareData.arrow) return;
  const side = result.placement.split('-')[0];
  const staticSide = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' }[side];
  const [firstBorder, secondBorder] = notchBorders[side] ?? notchBorders.right;
  Object.assign(arrowRef.value.style, {
    left: result.middlewareData.arrow.x == null ? '' : `${result.middlewareData.arrow.x}px`,
    top: result.middlewareData.arrow.y == null ? '' : `${result.middlewareData.arrow.y}px`,
    right: '', bottom: '',
    borderTopWidth: '',
    borderRightWidth: '',
    borderBottomWidth: '',
    borderLeftWidth: '',
    [firstBorder]: '1px',
    [secondBorder]: '1px',
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

watch(() => [props.open, props.anchor, props.boundary], start, { immediate: true });
onUnmounted(() => cleanup?.());
</script>

<style scoped>
.inspector {
  position: fixed;
  z-index: 80;
  width: min(286px, calc(100vw - 24px));
  padding: 15px 17px 16px;
  overflow: visible;
  border: 1px solid rgba(140, 105, 45, .35);
  border-radius: 10px;
  color: #2c2418;
  background:
    radial-gradient(120% 90% at 14% 0%, rgba(255, 252, 240, .85), transparent 58%),
    radial-gradient(130% 100% at 86% 108%, rgba(176, 138, 76, .18), transparent 60%),
    repeating-linear-gradient(112deg, rgba(140, 105, 45, .05) 0 1px, transparent 1px 7px),
    repeating-linear-gradient(24deg, rgba(140, 105, 45, .032) 0 1px, transparent 1px 11px),
    linear-gradient(168deg, #f8f1e0, #f3ead6 46%, #e9dcbe);
  box-shadow: 0 12px 32px rgba(60, 40, 10, .35), inset 0 1px 0 rgba(255, 252, 240, .55);
  pointer-events: none;
}
.inspector > span {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #96742a;
  font: 700 .57rem/1 "IBM Plex Mono", monospace;
  letter-spacing: .16em;
  text-transform: uppercase;
}
.inspector > span::before { width: 5px; height: 5px; border-radius: 50%; background: #dfb968; box-shadow: 0 0 8px rgba(223, 185, 104, .55); content: ''; }
.inspector strong { display: block; margin-top: 9px; color: #2c2418; font: 650 .95rem/1.15 "IBM Plex Sans Condensed", sans-serif; letter-spacing: .01em; }
.inspector p { margin: 8px 0 0; color: rgba(44, 36, 24, .78); font-size: .73rem; line-height: 1.52; }
.inspector__arrow {
  position: absolute;
  width: 10px;
  height: 10px;
  border: 0 solid rgba(140, 105, 45, .35);
  background: #f3ead6;
  transform: rotate(45deg);
}
.inspector-enter-active { transition: opacity .18s cubic-bezier(.22, .61, .36, 1), transform .18s cubic-bezier(.22, .61, .36, 1); }
.inspector-leave-active { transition: opacity .12s cubic-bezier(.22, .61, .36, 1), transform .12s cubic-bezier(.22, .61, .36, 1); }
.inspector-enter-from { opacity: 0; transform: translateY(6px) scale(.97); }
.inspector-leave-to { opacity: 0; transform: translateY(4px); }
.inspector-enter-active > span,
.inspector-enter-active strong,
.inspector-enter-active p { transition: opacity .18s cubic-bezier(.22, .61, .36, 1), transform .18s cubic-bezier(.22, .61, .36, 1); }
.inspector-enter-active strong { transition-delay: 30ms; }
.inspector-enter-active p { transition-delay: 60ms; }
.inspector-enter-from > span,
.inspector-enter-from strong,
.inspector-enter-from p { opacity: 0; transform: translateY(5px); }
.inspector--instant.inspector-enter-active,
.inspector--instant.inspector-leave-active,
.inspector--instant.inspector-enter-active > span,
.inspector--instant.inspector-enter-active strong,
.inspector--instant.inspector-enter-active p { transition: none; }
@media (max-width:600px){.inspector{width:min(236px,calc(100vw - 24px));overflow-wrap:anywhere}}
</style>
