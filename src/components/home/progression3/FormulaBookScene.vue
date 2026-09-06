<template>
  <div class="book-scene" :class="{ 'is-readable': readable }" :style="sceneVars" aria-label="Written formula opening scene">
    <p class="book-scene__caption" aria-hidden="true">
      <span>Sequence 9 · Written formula</span>
    </p>

    <div class="book-viewport">
      <div class="book-scene__glow" aria-hidden="true" />
      <VanillaBookRig :progress="rigProgress" :reduced-motion="reducedMotion" />

      <div class="formula-hotspots" :aria-hidden="!readable">
        <section class="hotspot-page hotspot-page--left" aria-label="Main ingredients page">
          <button
            v-for="(entry, index) in mainEntries"
            :key="entry.id"
            type="button"
            class="formula-hotspot"
            :class="`formula-hotspot--main-${index + 1}`"
            :tabindex="readable ? 0 : -1"
            :aria-label="`${entry.name}, ${entry.role}`"
            @mouseenter="inspect(entry.id, $event)"
            @mouseleave="emit('clear-inspect')"
            @focus="inspect(entry.id, $event)"
            @blur="emit('clear-inspect')"
            @click="inspect(entry.id, $event)"
          >
            <span class="sr-only">{{ entry.name }}, {{ entry.role }}</span>
          </button>
        </section>

        <section class="hotspot-page hotspot-page--right" aria-label="Supplementary ingredients page">
          <button
            v-for="entry in suppEntries"
            :key="entry.id"
            type="button"
            class="formula-hotspot formula-hotspot--supplementary"
            :tabindex="readable ? 0 : -1"
            :aria-label="`${entry.name}, ${entry.role}`"
            @mouseenter="inspect(entry.id, $event)"
            @mouseleave="emit('clear-inspect')"
            @focus="inspect(entry.id, $event)"
            @blur="emit('clear-inspect')"
            @click="inspect(entry.id, $event)"
          >
            <span class="sr-only">{{ entry.name }}, {{ entry.role }}</span>
          </button>

          <button
            type="button"
            class="formula-hotspot formula-hotspot--seal"
            :tabindex="readable ? 0 : -1"
            aria-label="Formula seal, Sequence 9 of the Fool Pathway. Ritual note: Build the altar before brewing."
            @mouseenter="inspect('formula-fool', $event)"
            @mouseleave="emit('clear-inspect')"
            @focus="inspect('formula-fool', $event)"
            @blur="emit('clear-inspect')"
            @click="inspect('formula-fool', $event)"
          >
            <span class="sr-only">Formula seal and ritual note</span>
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

const props = withDefaults(defineProps<{
  progress: number;
  active: boolean;
  closingProgress?: number;
}>(), {
  closingProgress: 0,
});
const emit = defineEmits<{
  (e: 'inspect', id: string, anchor: HTMLElement): void;
  (e: 'clear-inspect'): void;
}>();

const reducedMotion = useReducedMotion();
const mainEntries = [
  { id: 'lavos-squid-blood', name: 'Blood of the Lavos Squid', role: 'Main ingredient' },
  { id: 'stellar-aqua-crystal', name: 'Stellar Aqua Crystal', role: 'Main ingredient' },
];
const suppEntries = [
  { id: 'gold-mint-leaves', name: 'Gold Mint Leaves', role: 'Supplementary ingredient' },
];

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
  '--glow-opacity': (reducedMotion.value ? 0.45 : smoothstep(p.value / 0.22) * (0.28 + readT.value * 0.22)).toFixed(4),
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

.book-scene__caption {
  position: absolute;
  z-index: 8;
  top: clamp(4px, 2vh, 18px);
  left: 50%;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  color: #87691d;
  font: 800 clamp(0.68rem, 1vw, 0.78rem)/1 "Manrope", sans-serif;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  white-space: nowrap;
  opacity: var(--caption-opacity, 0);
  pointer-events: none;
  transform: translateX(-50%);
}

.book-scene__caption::before,
.book-scene__caption::after {
  width: clamp(24px, 6vw, 70px);
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(217, 180, 90, 0.55));
  content: '';
}

.book-scene__caption::after { transform: scaleX(-1); }

.book-viewport {
  position: relative;
  z-index: 2;
  width: min(680px, 100%);
  aspect-ratio: 1.24;
  margin-top: clamp(22px, 5vh, 46px);
}

.book-scene__glow {
  position: absolute;
  z-index: -1;
  inset: 10% 4% 0;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(217, 180, 90, 0.2), rgba(116, 88, 232, 0.1) 48%, transparent 72%);
  filter: blur(20px);
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
  border: 2px solid transparent;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
}

.formula-hotspot--main-1,
.formula-hotspot--supplementary { top: 14%; height: 17%; }
.formula-hotspot--main-2 { top: 33%; height: 17%; }
.formula-hotspot--seal { top: 74%; height: 20%; }

.formula-hotspot:hover,
.formula-hotspot:focus-visible {
  border-color: rgba(116, 88, 232, 0.45);
  outline: none;
  box-shadow: 0 0 0 3px rgba(116, 88, 232, 0.16);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.book-scene__motes { position: absolute; inset: 0; z-index: 1; overflow: hidden; pointer-events: none; }
.book-scene__motes i {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(217, 180, 90, 0.65), transparent 70%);
  opacity: calc(var(--mote-opacity, 0) * 0.55);
  animation: mote-drift 7s ease-in-out infinite;
}
.book-scene__motes i:nth-child(1) { top: 29%; left: 29%; }
.book-scene__motes i:nth-child(2) { top: 58%; left: 70%; animation-delay: -2.4s; }
.book-scene__motes i:nth-child(3) { top: 42%; left: 55%; animation-delay: -4.8s; }

@keyframes mote-drift {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(10px, -16px, 0); }
}

@media (max-width: 820px) {
  .book-viewport { width: min(610px, 100%); }
}

@media (max-width: 520px) {
  .book-scene__caption { top: 0; letter-spacing: 0.1em; }
  .book-scene__caption::before,
  .book-scene__caption::after { width: 14px; }
  .formula-hotspots { width: 68%; }
}

@media (prefers-reduced-motion: reduce) {
  .book-scene__motes i { animation: none; }
}
</style>
