<template>
  <div class="book-scene" :class="{ 'is-readable': readable }" role="group" :aria-label="tp('book.sceneLabel')">
    <div class="book-scene__box" :style="boxStyle">
      <div class="book-scene__glow" :style="{ opacity: glow.toFixed(4) }" aria-hidden="true" />
      <div class="book-scene__rig" :style="{ opacity: entrance.toFixed(4) }">
        <VanillaBookRig
          :progress="rigProgress"
          :reduced-motion="reducedMotion"
          :warm="warm"
          :labels="labels"
          :hidden="hidden"
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
import { computed, ref } from 'vue';
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
const readable = computed(() => props.active && readT.value > 0.92 && g.value < T.readable[1]);
const glow = computed(() => entrance.value * (0.55 + readT.value * 0.45));

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
