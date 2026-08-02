<template>
  <Teleport to="body">
  <Transition name="inspector">
    <aside v-if="open" :id="id" ref="popoverRef" class="inspector" role="tooltip">
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
      flip({ boundary: props.boundary, padding: 12 }),
      boundaryRect.width < 500 ? undefined : size({
        boundary: props.boundary,
        padding: 12,
        apply({ availableWidth }) {
          popover.style.maxWidth = `${Math.max(0, Math.min(300, availableWidth))}px`;
        },
      }),
      shift({ boundary: props.boundary, padding: 12 }),
      arrowRef.value ? arrow({ element: arrowRef.value }) : undefined,
    ].filter(Boolean),
  });
  Object.assign(popover.style, { left: `${result.x}px`, top: `${result.y}px` });
  if (!arrowRef.value || !result.middlewareData.arrow) return;
  const side = result.placement.split('-')[0];
  const staticSide = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' }[side];
  Object.assign(arrowRef.value.style, {
    left: result.middlewareData.arrow.x == null ? '' : `${result.middlewareData.arrow.x}px`,
    top: result.middlewareData.arrow.y == null ? '' : `${result.middlewareData.arrow.y}px`,
    right: '', bottom: '', [staticSide ?? 'left']: '-5px',
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
  border: 1px solid rgba(223, 185, 104, .56);
  border-radius: 5px;
  color: #fcf9f2;
  background:
    linear-gradient(90deg, rgba(223, 185, 104, .7), rgba(223, 185, 104, .7)) 0 0 / 28px 1px no-repeat,
    linear-gradient(135deg, rgba(12, 43, 39, .99), rgba(3, 15, 17, .99));
  box-shadow: 0 18px 48px rgba(0, 0, 0, .52), inset 0 1px rgba(255, 245, 210, .1);
  backdrop-filter: blur(12px);
  pointer-events: none;
}
.inspector > span {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #dfb968;
  font: 700 .57rem/1 "IBM Plex Mono", monospace;
  letter-spacing: .16em;
  text-transform: uppercase;
}
.inspector > span::before { width: 5px; height: 5px; border-radius: 50%; background: currentColor; box-shadow: 0 0 8px currentColor; content: ''; }
.inspector strong { display: block; margin-top: 9px; color: #fffaf0; font: 650 .95rem/1.15 "IBM Plex Sans Condensed", sans-serif; letter-spacing: .01em; }
.inspector p { margin: 8px 0 0; color: rgba(252, 249, 242, .74); font-size: .73rem; line-height: 1.52; }
.inspector__arrow { position: absolute; width: 9px; height: 9px; border-left: 1px solid rgba(223, 185, 104, .56); border-bottom: 1px solid rgba(223, 185, 104, .56); background: #092522; transform: rotate(45deg); }
.inspector-enter-active,.inspector-leave-active { transition: opacity .14s ease, transform .2s cubic-bezier(.22,1,.36,1); }
.inspector-enter-from,.inspector-leave-to { opacity: 0; transform: translateY(4px) scale(.98); }
@media (prefers-reduced-motion:reduce){.inspector-enter-active,.inspector-leave-active{transition:none}}
@media (max-width:600px){.inspector{width:min(236px,calc(100vw - 24px));overflow-wrap:anywhere}}
</style>
