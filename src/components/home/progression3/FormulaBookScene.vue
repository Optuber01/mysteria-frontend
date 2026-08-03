<template>
  <div class="book-scene" :class="{ 'is-readable': readable }" :style="sceneVars" aria-label="Written formula opening scene">
    <p class="book-scene__caption" aria-hidden="true">
      <span>Sequence 9 · Written formula</span>
    </p>

    <div class="book-viewport">
      <div class="book-scene__glow" aria-hidden="true" />
      <VanillaBookRig :progress="p" :reduced-motion="reducedMotion" />

      <div class="formula-overlay">
        <section class="page page--left" aria-label="Main ingredients page">
          <h4 class="page__heading">Main ingredients</h4>
          <button
            v-for="entry in mainEntries"
            :key="entry.id"
            type="button"
            class="entry hotspot"
            @mouseenter="inspect(entry.id, $event)"
            @mouseleave="emit('clear-inspect')"
            @focus="inspect(entry.id, $event)"
            @blur="emit('clear-inspect')"
            @click="inspect(entry.id, $event)"
          >
            <img class="entry__icon" :src="entry.icon" alt="" width="32" height="32" decoding="async">
            <span class="entry__text">
              <span class="entry__name">{{ entry.name }}</span>
              <small class="entry__role">{{ entry.role }}</small>
            </span>
          </button>
        </section>

        <section class="page page--right" aria-label="Supplementary ingredients page">
          <h4 class="page__heading">Supplementary</h4>
          <button
            v-for="entry in suppEntries"
            :key="entry.id"
            type="button"
            class="entry hotspot"
            @mouseenter="inspect(entry.id, $event)"
            @mouseleave="emit('clear-inspect')"
            @focus="inspect(entry.id, $event)"
            @blur="emit('clear-inspect')"
            @click="inspect(entry.id, $event)"
          >
            <img class="entry__icon" :src="entry.icon" alt="" width="32" height="32" decoding="async">
            <span class="entry__text">
              <span class="entry__name">{{ entry.name }}</span>
              <small class="entry__role">{{ entry.role }}</small>
            </span>
          </button>

          <div class="page__ritual">
            <button
              type="button"
              class="seal hotspot"
              aria-label="Formula seal, Sequence 9 of the Fool Pathway"
              @mouseenter="inspect('formula-fool', $event)"
              @mouseleave="emit('clear-inspect')"
              @focus="inspect('formula-fool', $event)"
              @blur="emit('clear-inspect')"
              @click="inspect('formula-fool', $event)"
            >
              <img :src="foolRecipe" alt="" width="34" height="34" decoding="async">
            </button>
            <p><strong>Ritual note</strong><span>Build the altar before brewing.</span></p>
          </div>
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
import lavosSquidBlood from '@/assets/images/home/progression/real/lavos-squid-blood.png';
import stellarAquaCrystal from '@/assets/images/home/progression/real/stellar-aqua-crystal.png';
import goldMintLeaves from '@/assets/images/home/progression/real/gold-mint-leaves.png';
import foolRecipe from '@/assets/images/home/progression/recipes/fool.png';

const props = defineProps<{ progress: number; active: boolean }>();
const emit = defineEmits<{
  (e: 'inspect', id: string, anchor: HTMLElement): void;
  (e: 'clear-inspect'): void;
}>();

const reducedMotion = useReducedMotion();
const mainEntries = [
  { id: 'lavos-squid-blood', name: 'Blood of the Lavos Squid', role: 'Main ingredient', icon: lavosSquidBlood },
  { id: 'stellar-aqua-crystal', name: 'Stellar Aqua Crystal', role: 'Main ingredient', icon: stellarAquaCrystal },
];
const suppEntries = [
  { id: 'gold-mint-leaves', name: 'Gold Mint Leaves', role: 'Supplementary ingredient', icon: goldMintLeaves },
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
// Keep the formula completely absent while the physical leaves are moving.
// The final page UI only resolves after the rig has finished its settle beat.
const readT = computed(() => reducedMotion.value ? 1 : smoothstep((p.value - 0.945) / 0.04));
const readable = computed(() => props.active && readT.value > 0.92);
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
  color: #dfb968;
  font: 650 clamp(0.68rem, 1vw, 0.78rem)/1 "IBM Plex Mono", monospace;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  white-space: nowrap;
  opacity: var(--caption-opacity, 0);
  transform: translateX(-50%);
}

.book-scene__caption::before,
.book-scene__caption::after {
  width: clamp(24px, 6vw, 70px);
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(223, 185, 104, 0.55));
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
  background: radial-gradient(ellipse, rgba(223, 185, 104, 0.24), rgba(72, 133, 110, 0.12) 48%, transparent 72%);
  filter: blur(20px);
  opacity: var(--glow-opacity, 0);
}

.formula-overlay {
  position: absolute;
  z-index: 4;
  top: 50%;
  left: 50%;
  /* Match the vanilla page blocks (2 × 5.25 by 8.65) rather than the
     outer covers (2 × 6 by 10). The leather remains visibly outside. */
  width: 66.2%;
  aspect-ratio: 10.5 / 8.65;
  display: flex;
  filter: drop-shadow(0 24px 22px rgba(0, 0, 0, 0.38));
  opacity: var(--read, 0);
  pointer-events: none;
  transform: translate(-50%, -50%) scale(calc(0.985 + var(--read, 0) * 0.015));
}

.book-scene.is-readable .formula-overlay { pointer-events: auto; }

.page {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: clamp(7px, 1.4vh, 12px);
  padding: clamp(13px, 2.5vh, 22px) clamp(11px, 1.7vw, 19px);
  overflow: hidden;
  border: 1px solid rgba(87, 59, 40, 0.32);
  color: #392b25;
  background:
    repeating-linear-gradient(180deg, transparent 0 25px, rgba(123, 65, 30, 0.055) 25px 26px),
    linear-gradient(145deg, #f8f0dc 0%, #efe3c8 62%, #e5d4af 100%);
}

.page::after {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: '';
}

.page--left {
  border-right: 0;
  border-radius: 8px 1px 1px 8px;
  box-shadow: inset -20px 0 24px -20px rgba(57, 43, 37, 0.72);
}

.page--left::after { background: linear-gradient(90deg, rgba(91, 59, 34, 0.12), transparent 14%); }

.page--right {
  border-left: 0;
  border-radius: 1px 8px 8px 1px;
  box-shadow: inset 20px 0 24px -20px rgba(57, 43, 37, 0.72);
}

.page--right::after { background: linear-gradient(-90deg, rgba(91, 59, 34, 0.1), transparent 14%); }

.page__heading {
  position: relative;
  z-index: 1;
  margin: 0 0 2px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(143, 93, 54, 0.35);
  color: #8a1e18;
  font: 700 clamp(0.72rem, 1.2vw, 0.92rem)/1.1 "IBM Plex Sans Condensed", sans-serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.entry {
  position: relative;
  z-index: 2;
  min-height: 42px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 5px 7px;
  border: 1px solid transparent;
  border-radius: 6px;
  color: inherit;
  background: transparent;
  cursor: pointer;
  font-family: "IBM Plex Mono", monospace;
  text-align: left;
  transition: border-color 0.18s ease, background-color 0.18s ease, transform 0.18s ease;
}

.entry:hover,
.entry:focus-visible {
  border-color: rgba(143, 93, 54, 0.42);
  background: rgba(255, 252, 240, 0.65);
  transform: translateX(2px);
}

.entry__icon {
  flex: 0 0 auto;
  width: clamp(25px, 3vw, 33px);
  height: auto;
  object-fit: contain;
  image-rendering: pixelated;
}

.entry__text { min-width: 0; display: grid; gap: 2px; }
.entry__name {
  color: #8f5d36;
  font-size: clamp(0.68rem, 1vw, 0.79rem);
  font-weight: 700;
  line-height: 1.22;
}
.entry__role { color: #7b6254; font-size: 0.68rem; line-height: 1.2; }

.page__ritual {
  position: relative;
  z-index: 2;
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 9px;
  padding-top: 8px;
  border-top: 1px dashed rgba(143, 93, 54, 0.38);
}

.page__ritual p { display: grid; gap: 2px; margin: 0; font-family: "IBM Plex Mono", monospace; }
.page__ritual strong { color: #17803c; font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; }
.page__ritual span { color: #4f362c; font-size: 0.68rem; line-height: 1.25; }

.seal {
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(138, 30, 24, 0.38);
  border-radius: 50%;
  background: radial-gradient(circle at 38% 32%, #f3e8cd, #e2d0ab);
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.seal img { width: 28px; height: 28px; object-fit: contain; image-rendering: pixelated; }
.seal:hover,
.seal:focus-visible { box-shadow: 0 0 0 4px rgba(223, 185, 104, 0.35); transform: scale(1.06); }

.hotspot:focus-visible { outline: 3px solid #f0d38c; outline-offset: 2px; }

.book-scene__motes { position: absolute; inset: 0; z-index: 1; overflow: hidden; pointer-events: none; }
.book-scene__motes i {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(240, 211, 140, 0.9), transparent 70%);
  opacity: calc(var(--mote-opacity, 0) * 0.65);
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
  .page { gap: 6px; padding: 10px 8px; }
  .page__ritual span { display: none; }
}

@media (max-width: 520px) {
  .book-scene__caption { top: 0; letter-spacing: 0.1em; }
  .book-scene__caption::before,
  .book-scene__caption::after { width: 14px; }
  .formula-overlay { width: 68%; }
  .page { padding: 8px 6px; }
  .entry { min-height: 36px; gap: 5px; padding: 3px; }
  .entry__icon { width: 22px; }
  .entry__name { font-size: 0.6rem; }
  .entry__role { display: none; }
  .page__heading { font-size: 0.64rem; }
  .seal { width: 34px; height: 34px; }
  .seal img { width: 23px; height: 23px; }
}

@media (prefers-reduced-motion: reduce) {
  .book-scene__motes i { animation: none; }
  .entry,
  .seal { transition: none; }
}
</style>
