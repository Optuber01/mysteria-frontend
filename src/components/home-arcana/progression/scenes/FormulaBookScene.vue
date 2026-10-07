<template>
  <div
    class="book-scene"
    :class="{ 'is-readable': readable, 'is-grabbable': grabbable, 'is-held': dragging }"
    role="group"
    :aria-label="tp('book.sceneLabel')"
    @pointerdown="grab"
    @pointermove="drag"
    @pointerup="letGo"
    @pointercancel="letGo"
    @click.capture="swallowClick"
  >
    <div class="book-scene__box" :style="boxStyle">
      <div class="book-scene__glow" :style="{ opacity: glow.toFixed(4) }" aria-hidden="true" data-recolour />
      <div class="book-scene__rig" :style="{ opacity: entrance.toFixed(4) }">
        <VanillaBookRig
          :progress="rigProgress"
          :reduced-motion="reducedMotion"
          :warm="warm"
          :labels="labels"
          :hidden="hidden"
          :fold="heldFold"
          @anchors="onAnchors"
        />
      </div>
    </div>

    <!-- Hit areas over each entry on the pages, placed from the 3D book itself. -->
    <div class="book-scene__hotspots" :aria-hidden="!readable">
      <button
        v-for="spot in hotspots"
        :key="spot.key"
        type="button"
        class="book-hotspot"
        :style="spot.style"
        :tabindex="readable ? 0 : -1"
        @mouseenter="inspect(spot.key, $event)"
        @mouseleave="emit('clear-inspect')"
        @focus="inspect(spot.key, $event)"
        @blur="emit('clear-inspect')"
        @click="inspect(spot.key, $event)"
      >
        <span class="arc-sr">{{ spot.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { CSSProperties } from 'vue';
import { useReducedMotion } from '@/composables/useReducedMotion';
import VanillaBookRig from './VanillaBookRig.vue';
import type { BookAnchors, BookLabels } from './VanillaBookRig.vue';
import { useProgressionCopy } from './useProgressionCopy';
import type { StageLayout } from '../layout';
import { T, ease, smooth } from '../timeline';

const props = withDefaults(defineProps<{
  progress: number;
  layout: StageLayout | null;
  active: boolean;
  /** The chapter is near the viewport: start downloading the 3D book. */
  warm?: boolean;
  /** Ingredient keys that have flown off the pages. */
  hidden?: string[];
}>(), { warm: false, hidden: () => [] });
const emit = defineEmits<{
  (e: 'inspect', id: string, anchor: HTMLElement): void;
  (e: 'clear-inspect'): void;
  /** Book anchors in this scene's own (untransformed) px. */
  (e: 'anchors', value: Record<string, { x: number; y: number; size: number }>): void;
}>();

const reducedMotion = useReducedMotion();
const { tp, names, ingredients, recipe, card } = useProgressionCopy();

const labels = computed<BookLabels>(() => {
  const entry = (role: 'main' | 'supplementary') => ingredients.value
    .filter((item) => item.role === role)
    // the page's heading already says which kind each entry is
    .map((item) => ({ key: item.key, name: item.name, icon: item.icon, role: '' }));
  return {
    mainHeading: tp('book.mainHeading'),
    supplementaryHeading: tp('book.supplementaryHeading'),
    main: entry('main'),
    supplementary: entry('supplementary'),
    note: tp('book.note'),
    coverPathway: tp('book.coverPathway'),
    coverSequence: tp('book.coverSequence'),
    coverName: names.value.sequence,
    recipeBook: recipe.value.book,
    accent: card.value.accent,
  };
});

const g = computed(() => props.progress);
const bookLocal = computed(() => (reducedMotion.value ? 1 : Math.min(1, Math.max(0, (g.value - T.book[0]) / (T.book[1] - T.book[0])))));
// closes (back to the cover-facing pose) once its ingredients are in the brew
const closeT = computed(() => (reducedMotion.value ? 0 : ease(g.value, [T.bookOut[0], T.bookOut[0] + (T.bookOut[1] - T.bookOut[0]) * 0.75])));
const rigProgress = computed(() => (reducedMotion.value ? 1 : bookLocal.value * (1 - closeT.value * 0.56)));
const entrance = computed(() => (reducedMotion.value ? 1 : smooth(bookLocal.value / 0.16)));
const readT = computed(() => (reducedMotion.value ? 1 : smooth((bookLocal.value - 0.95) / 0.05)));
const readable = computed(() => props.active && readT.value > 0.92 && g.value < T.readable[1] && Math.abs(heldFold.value ?? 0) < 0.03);
const glow = computed(() => entrance.value * (0.55 + readT.value * 0.45));

/*
 * The reader's hand. Once the cover faces them, until the cauldron comes up under the book,
 * they can fold it shut either way, as on paper: drag right and the left half closes over
 * (the front cover shows), drag left and the right half closes over (the back shows); one
 * drag runs front, open, back. A tap on either shut cover opens it, and on release it falls
 * to the nearest rest. When the brew needs the open pages, or the scroll catches up with
 * the hand, the scroll takes the book back.
 */
/** How far the scroll has the book shut on its front cover (1) or open (0). */
const scrollFold = computed(() => (reducedMotion.value ? 0 : 1 - smooth((rigProgress.value - 0.5) / 0.38)));
const grabbable = computed(() => props.active && rigProgress.value >= 0.45 && g.value < T.brewIn[0]);
/** Where the hand holds the book (1 shut on the front, 0 open, -1 shut on the back), and how much it outweighs the scroll. */
const hand = ref(0);
const weight = ref(0);
const dragging = ref(false);
const heldFold = computed(() => (weight.value > 0 ? scrollFold.value + (hand.value - scrollFold.value) * weight.value : null));

let tween = 0;
function animate(target: typeof hand, to: number, duration: number, then?: () => void) {
  cancelAnimationFrame(tween);
  const from = target.value;
  if (reducedMotion.value || duration <= 0 || Math.abs(to - from) < 0.001) {
    target.value = to;
    then?.();
    return;
  }
  const start = performance.now();
  const step = (now: number) => {
    const k = Math.min(1, (now - start) / duration);
    target.value = from + (to - from) * (1 - (1 - k) ** 3);
    if (k < 1) tween = requestAnimationFrame(step);
    else then?.();
  };
  tween = requestAnimationFrame(step);
}
/** Gives the book back to the scroll. */
function release(duration = 520) {
  if (weight.value === 0) return;
  animate(weight, 0, duration);
}

let press: { id: number; x: number; y: number; from: number; at: number; vx: number; t: number } | null = null;
let dragged = false;
/** The drag that shuts the book: one page width (layout.ts BOOK_FILL). */
const swing = () => (props.layout?.book.w ?? 600) * 0.5;

function grab(event: PointerEvent) {
  if (!grabbable.value || (event.pointerType === 'mouse' && event.button !== 0)) return;
  if (!(event.target instanceof Element) || !event.target.closest('.book-scene__box, .book-hotspot')) return;
  press = { id: event.pointerId, x: event.clientX, y: event.clientY, from: heldFold.value ?? scrollFold.value, at: event.clientX, vx: 0, t: event.timeStamp };
  dragged = false;
}
function drag(event: PointerEvent) {
  if (!press || event.pointerId !== press.id) return;
  const dx = event.clientX - press.x;
  if (!dragging.value) {
    // a sideways pull takes the cover; anything else is a scroll or a tap
    if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(event.clientY - press.y)) return;
    dragging.value = true;
    dragged = true;
    cancelAnimationFrame(tween);
    hand.value = press.from;
    weight.value = 1;
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    emit('clear-inspect');
  }
  const dt = Math.max(1, event.timeStamp - press.t);
  press.vx = press.vx * 0.6 + ((event.clientX - press.at) / dt) * 0.4;
  press.at = event.clientX;
  press.t = event.timeStamp;
  // right folds the left half over (the front cover), left folds the right half over (the back)
  hand.value = Math.min(1, Math.max(-1, press.from + dx / swing()));
}
function letGo(event: PointerEvent) {
  if (!press || event.pointerId !== press.id) return;
  const flick = press.vx;
  press = null;
  if (!dragging.value) {
    // a tap on either shut cover opens it
    if (event.type === 'pointerup' && Math.abs(heldFold.value ?? 0) > 0.5) {
      dragged = true;
      animate(hand, 0, 620);
    }
    return;
  }
  dragging.value = false;
  // a flick carries it on to the next rest (front shut, open, back shut); otherwise it falls the way it leans
  const h = hand.value;
  const to = Math.abs(flick) > 0.35 ? (flick > 0 ? Math.min(1, Math.floor(h) + 1) : Math.max(-1, Math.ceil(h) - 1)) : Math.round(h);
  animate(hand, to, 260 + Math.abs(to - hand.value) * 420);
}
/** The click that ends a drag (or the tap that opened the cover) is not a tap on an entry. */
function swallowClick(event: MouseEvent) {
  if (!dragged) return;
  dragged = false;
  event.stopPropagation();
  event.preventDefault();
}

// the scroll caught up with the hand: it has the book again
watch([hand, scrollFold, dragging], () => {
  if (!dragging.value && weight.value === 1 && Math.abs(hand.value - scrollFold.value) < 0.004) weight.value = 0;
});
// the brew needs the open pages (and scrolling back past the cover gives the book back too)
watch(grabbable, (can) => {
  if (can) return;
  press = null;
  dragging.value = false;
  release();
});
onBeforeUnmount(() => cancelAnimationFrame(tween));

const boxStyle = computed<CSSProperties>(() => {
  const b = props.layout?.book;
  if (!b) return { opacity: 0 };
  return { left: `${b.x.toFixed(1)}px`, top: `${b.y.toFixed(1)}px`, width: `${b.w.toFixed(1)}px`, height: `${b.h.toFixed(1)}px` };
});

const anchors = ref<BookAnchors>({});
function onAnchors(value: BookAnchors) {
  anchors.value = value;
  const b = props.layout?.book;
  if (!b) return;
  const out: Record<string, { x: number; y: number; size: number }> = {};
  for (const [key, a] of Object.entries(value)) out[key] = { x: b.x + a.x * b.w, y: b.y + a.y * b.h, size: a.size * b.h };
  emit('anchors', out);
}

const hotspots = computed(() => {
  const b = props.layout?.book;
  if (!b) return [];
  const label = (key: string) => {
    if (key === 'seal') return tp('book.sealLabel');
    const item = ingredients.value.find((entry) => entry.key === key);
    return item ? `${item.name}, ${tp(`ingredients.${item.role}Role`)}` : key;
  };
  // reading order: main ingredients, supplementary ones, then the seal
  const order = [...ingredients.value.map((item) => item.key), 'seal'];
  return Object.entries(anchors.value)
    .filter(([key]) => order.includes(key))
    .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
    .map(([key, a]) => ({
    key,
    label: label(key),
    style: {
      left: `${(b.x + a.rect.l * b.w).toFixed(1)}px`,
      top: `${(b.y + a.rect.t * b.h).toFixed(1)}px`,
      width: `${((a.rect.r - a.rect.l) * b.w).toFixed(1)}px`,
      height: `${((a.rect.b - a.rect.t) * b.h).toFixed(1)}px`,
    } as CSSProperties,
  }));
});

function inspect(id: string, event: Event) {
  if (event.currentTarget instanceof HTMLElement) emit('inspect', id === 'seal' ? 'formula' : `ingredient:${id}`, event.currentTarget);
}
</script>

<style scoped>
.book-scene {
  position: absolute;
  inset: 0;
}

/* sideways drags reach the cover; up and down still scroll the story */
.book-scene.is-grabbable .book-scene__box {
  cursor: grab;
  touch-action: pan-y;
}

.book-scene.is-grabbable .book-hotspot {
  touch-action: pan-y;
}

.book-scene.is-held,
.book-scene.is-held * {
  cursor: grabbing;
  user-select: none;
}

.book-scene__box {
  position: absolute;
}

.book-scene__rig {
  position: absolute;
  inset: 0;
}

/* A single lamp over the desk, in the Pathway's colour. */
.book-scene__glow {
  position: absolute;
  inset: 4% 0 -2%;
  border-radius: 50%;
  background: radial-gradient(ellipse 50% 46% at 50% 52%, color-mix(in oklab, var(--acc) 22%, transparent), color-mix(in oklab, var(--acc) 6%, transparent) 55%, transparent 74%);
  pointer-events: none;
}

.book-scene__hotspots {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
}

.book-scene.is-readable .book-hotspot {
  pointer-events: auto;
}

.book-hotspot {
  position: absolute;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  pointer-events: none;
  transition: background-color .18s ease, box-shadow .18s ease;
}

/*
 * A pencil mark on the page, not a box: a faint wash of the Pathway's ink and a
 * hairline under the entry. Nothing moves or glows. The accent is darkened into
 * ink so it reads on the cream paper for every card (see inkOf in VanillaBookRig).
 */
.book-hotspot:hover,
.book-hotspot:focus-visible {
  outline: none;
  background: color-mix(in oklab, var(--acc) 9%, transparent);
  box-shadow: inset 0 -1.5px 0 color-mix(in oklab, var(--acc) 34%, #1d1a16);
}

/* the keyboard's place stays plain to see, still in pencil */
.book-hotspot:focus-visible {
  box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--acc) 34%, #1d1a16);
}

@media (prefers-reduced-motion: reduce) {
  .book-hotspot {
    transition: none;
  }
}
</style>
