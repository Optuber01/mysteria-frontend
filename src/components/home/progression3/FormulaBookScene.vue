<template>
  <div class="book-scene" :class="{ 'is-readable': readable }" :style="sceneVars" role="group" :aria-label="tp('book.sceneLabel')">
    <p class="fog-label book-scene__caption" aria-hidden="true">{{ tp('book.caption') }}</p>

    <div class="book-viewport">
      <div class="book-scene__glow" aria-hidden="true" />
      <VanillaBookRig :progress="rigProgress" :reduced-motion="reducedMotion" :warm="warm" :labels="bookLabels" />

      <div class="formula-hotspots" :aria-hidden="!readable">
        <section class="hotspot-page hotspot-page--left" :aria-label="tp('book.mainPage')">
          <button
            v-for="(entry, index) in mainEntries"
            :key="entry.id"
            type="button"
            class="formula-hotspot"
            :class="`formula-hotspot--main-${index + 1}`"
            :tabindex="readable ? 0 : -1"
            @mouseenter="inspect(entry.id, $event)"
            @mouseleave="emit('clear-inspect')"
            @focus="inspect(entry.id, $event)"
            @blur="emit('clear-inspect')"
            @click="inspect(entry.id, $event)"
          >
            <span class="visually-hidden">{{ entry.name }}, {{ entry.role }}</span>
          </button>
        </section>

        <section class="hotspot-page hotspot-page--right" :aria-label="tp('book.supplementaryPage')">
          <button
            v-for="entry in suppEntries"
            :key="entry.id"
            type="button"
            class="formula-hotspot formula-hotspot--supplementary"
            :tabindex="readable ? 0 : -1"
            @mouseenter="inspect(entry.id, $event)"
            @mouseleave="emit('clear-inspect')"
            @focus="inspect(entry.id, $event)"
            @blur="emit('clear-inspect')"
            @click="inspect(entry.id, $event)"
          >
            <span class="visually-hidden">{{ entry.name }}, {{ entry.role }}</span>
          </button>

          <button
            type="button"
            class="formula-hotspot formula-hotspot--seal"
            :tabindex="readable ? 0 : -1"
            @mouseenter="inspect('formula-fool', $event)"
            @mouseleave="emit('clear-inspect')"
            @focus="inspect('formula-fool', $event)"
            @blur="emit('clear-inspect')"
            @click="inspect('formula-fool', $event)"
          >
            <span class="visually-hidden">{{ tp('book.sealLabel') }}</span>
          </button>
        </section>
      </div>
    </div>

    <div class="book-scene__motes" aria-hidden="true"><i /><i /><i /></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useReducedMotion } from '@/composables/useReducedMotion';
import VanillaBookRig from './VanillaBookRig.vue';
import type { BookLabels } from './VanillaBookRig.vue';
import { useProgressionCopy } from './useProgressionCopy';

const props = withDefaults(defineProps<{
  progress: number;
  active: boolean;
  closingProgress?: number;
  /** The chapter is near the viewport: start downloading the 3D book. */
  warm?: boolean;
}>(), {
  closingProgress: 0,
  warm: false,
});
const emit = defineEmits<{
  (e: 'inspect', id: string, anchor: HTMLElement): void;
  (e: 'clear-inspect'): void;
}>();

const reducedMotion = useReducedMotion();
const { tp, names } = useProgressionCopy();
const mainEntries = computed(() => [
  { id: 'lavos-squid-blood', name: tp('ingredients.lavosSquidBlood'), role: tp('ingredients.mainRole') },
  { id: 'stellar-aqua-crystal', name: tp('ingredients.stellarAquaCrystal'), role: tp('ingredients.mainRole') },
]);
const suppEntries = computed(() => [
  { id: 'gold-mint-leaves', name: tp('ingredients.goldMintLeaves'), role: tp('ingredients.supplementaryRole') },
]);
// Text painted into the book's page and cover textures.
const bookLabels = computed<BookLabels>(() => ({
  mainHeading: tp('book.mainHeading'),
  supplementaryHeading: tp('book.supplementaryHeading'),
  main: mainEntries.value.map(({ name, role }) => ({ name, role })),
  supplementary: suppEntries.value.map(({ name, role }) => ({ name, role })),
  noteHeading: tp('book.noteHeading'),
  note: tp('book.note'),
  coverPathway: tp('book.coverPathway'),
  coverSequence: tp('book.coverSequence'),
  coverName: names.value.sequence,
  coverRecipe: tp('book.coverRecipe'),
}));

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function smoothstep(value: number): number {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
}

const p = computed(() => clamp01(props.progress));
const closeT = computed(() => smoothstep(props.closingProgress));
// 0.44 is the settled, cover-facing pose: the leaves and cover are closed,
// but the book remains fully risen out of the threshold fog while it exits.
const rigProgress = computed(() => reducedMotion.value ? 1 : p.value * (1 - closeT.value * 0.56));
// The formula itself is part of the physical page textures. Only the invisible
// semantic hit regions wait until the book settles and aligns with the viewport.
const readT = computed(() => reducedMotion.value ? 1 : smoothstep((p.value - 0.945) / 0.04));
const readable = computed(() => props.active && readT.value > 0.92 && closeT.value < 0.04);
const sceneVars = computed(() => ({
  '--read': readT.value.toFixed(4),
  '--caption-opacity': (reducedMotion.value ? 1 : smoothstep((p.value - 0.26) / 0.15)).toFixed(4),
  '--glow-opacity': (reducedMotion.value ? 1 : smoothstep(p.value / 0.22) * (0.55 + readT.value * 0.45)).toFixed(4),
  '--mote-opacity': (reducedMotion.value ? 0.35 : smoothstep((p.value - 0.32) / 0.45)).toFixed(4),
}));

function inspect(id: string, event: Event) {
  if (event.currentTarget instanceof HTMLElement) emit('inspect', id, event.currentTarget);
}
</script>

<style scoped>
.book-scene {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

/* Evidence tag over the exhibit. */
.book-scene__caption {
  position: absolute;
  z-index: 8;
  top: clamp(4px, 2vh, 18px);
  left: 50%;
  margin: 0;
  white-space: nowrap;
  opacity: var(--caption-opacity, 0);
  pointer-events: none;
  transform: translateX(-50%);
}

.book-scene__caption::after {
  content: "";
  width: 18px;
  height: 1px;
  background: var(--crimson-text);
}

.book-viewport {
  position: relative;
  z-index: 2;
  width: min(680px, 100%);
  aspect-ratio: 1.24;
  margin-top: clamp(22px, 5vh, 46px);
}

/* A single lamp over the desk: cold light, no colour. */
.book-scene__glow {
  position: absolute;
  z-index: -1;
  inset: 4% 0 -2%;
  border-radius: 50%;
  background: radial-gradient(ellipse 50% 46% at 50% 52%, rgba(236, 230, 218, 0.16), rgba(169, 198, 214, 0.05) 55%, transparent 74%);
  opacity: var(--glow-opacity, 0);
  pointer-events: none;
}

.formula-hotspots {
  position: absolute;
  z-index: 4;
  top: 50%;
  left: 50%;
  width: 66.2%;
  aspect-ratio: 10.5 / 8.65;
  display: flex;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.book-scene.is-readable .formula-hotspots { pointer-events: auto; }

.hotspot-page {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
}

.formula-hotspot {
  position: absolute;
  left: 6%;
  width: 88%;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.formula-hotspot--main-1,
.formula-hotspot--supplementary { top: 14%; height: 17%; }
.formula-hotspot--main-2 { top: 33%; height: 17%; }
.formula-hotspot--seal { top: 74%; height: 20%; }

/* Ink-red pencil marks on the page (the hotspot sits on paper). */
.formula-hotspot:hover,
.formula-hotspot:focus-visible {
  border-color: rgba(142, 23, 32, 0.7);
  outline: none;
  background: rgba(142, 23, 32, 0.07);
  box-shadow: 0 0 0 3px rgba(229, 84, 93, 0.35);
}

.book-scene__motes { position: absolute; inset: 0; z-index: 1; overflow: hidden; pointer-events: none; }
.book-scene__motes i {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(236, 230, 218, 0.7);
  box-shadow: 0 0 8px rgba(236, 230, 218, 0.45);
  opacity: calc(var(--mote-opacity, 0) * 0.5);
  animation: mote-drift 9s ease-in-out infinite;
}
.book-scene__motes i:nth-child(1) { top: 29%; left: 29%; }
.book-scene__motes i:nth-child(2) { top: 58%; left: 70%; animation-delay: -3s; }
.book-scene__motes i:nth-child(3) { top: 42%; left: 55%; animation-delay: -6s; }

@keyframes mote-drift {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(10px, -16px, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .book-scene__motes i { animation: none; }
}
</style>
