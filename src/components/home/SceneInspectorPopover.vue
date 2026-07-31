<template>
  <Transition name="inspector">
    <aside v-if="open" ref="popoverRef" class="inspector" aria-hidden="true">
      <span>Inspecting</span>
      <strong>{{ title }}</strong>
      <p>{{ description }}</p>
      <i ref="arrowRef" class="inspector__arrow" />
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { autoUpdate, computePosition, flip, offset, shift, size, arrow } from '@floating-ui/dom';
import { nextTick, onUnmounted, ref, watch } from 'vue';

const props = defineProps<{
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
    strategy: 'absolute',
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
    cleanup = autoUpdate(props.anchor, popoverRef.value, position, { animationFrame: true });
  });
}

watch(() => [props.open, props.anchor, props.boundary], start, { immediate: true });
onUnmounted(() => cleanup?.());
</script>

<style scoped>
.inspector { position:absolute; z-index:80; width:min(300px,calc(100vw - 24px)); padding:14px 16px; border:1px solid rgba(223,185,104,.4); border-radius:12px; background:rgba(6,22,23,.96); box-shadow:0 16px 44px rgba(0,0,0,.42); backdrop-filter:blur(14px); pointer-events:none; }
.inspector>span { color:#dfb968; font:650 .52rem/1 "IBM Plex Mono",monospace; letter-spacing:.13em; text-transform:uppercase; }
.inspector strong { display:block; margin-top:7px; color:#fcf9f2; font-size:.83rem; }
.inspector p { margin:7px 0 0; color:rgba(252,249,242,.7); font-size:.69rem; line-height:1.5; }
.inspector__arrow { position:absolute; width:10px; height:10px; border-left:1px solid rgba(223,185,104,.4); border-bottom:1px solid rgba(223,185,104,.4); background:#061617; transform:rotate(45deg); }
.inspector-enter-active,.inspector-leave-active { transition:opacity .16s ease,transform .16s cubic-bezier(.22,1,.36,1); }
.inspector-enter-from,.inspector-leave-to { opacity:0; transform:scale(.97); }
@media (prefers-reduced-motion:reduce){.inspector-enter-active,.inspector-leave-active{transition:none}}
@media (max-width:600px){.inspector{width:180px;max-width:calc(100% - 24px);overflow-wrap:anywhere}}
</style>
