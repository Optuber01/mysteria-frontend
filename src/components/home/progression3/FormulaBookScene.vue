<template>
  <div class="book-scene" :style="sceneVars" aria-label="Written formula opening scene">
    <p class="book-scene__caption" aria-hidden="true">
      <span>Sequence 9 · Written formula</span>
    </p>

    <div class="book-viewport">
      <div class="book-scene__fog" aria-hidden="true"><i /><i /><i /></div>
      <div class="book" :class="{ 'is-open': openT > 0.5 }">
        <div class="book__glow" aria-hidden="true" />
        <div class="book__closed-cover" :style="coverTextureStyle" aria-hidden="true" />
        <div class="book__back-cover" :style="coverTextureStyle" aria-hidden="true" />

        <div class="book__spread">
          <!-- LEFT PAGE · main ingredients -->
          <section class="page page--left" :style="{ opacity: leftPageOpacity }" aria-label="Main ingredients page">
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

          <!-- RIGHT PAGE · supplementary -->
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

          <div class="book__spine" aria-hidden="true" />
          <div class="book__pageblock" aria-hidden="true" />
        </div>

        <!-- COVER LEAF · swings open around the spine -->
        <div class="cover-leaf" aria-hidden="true">
          <div class="cover-leaf__face cover-leaf__front" :style="coverTextureStyle" />
          <div class="cover-leaf__face cover-leaf__back" :style="coverTextureStyle" />
        </div>
      </div>
    </div>

    <div class="book-scene__motes" aria-hidden="true"><i /><i /><i /></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useReducedMotion } from '@/composables/useReducedMotion';
import lavosSquidBlood from '@/assets/images/home/progression/real/lavos-squid-blood.png';
import stellarAquaCrystal from '@/assets/images/home/progression/real/stellar-aqua-crystal.png';
import goldMintLeaves from '@/assets/images/home/progression/real/gold-mint-leaves.png';
import foolRecipe from '@/assets/images/home/progression/recipes/fool.png';
import enchantingTableBookAtlas from '@/assets/images/home/progression/vanilla-book/vanilla_minecraft_book_reference_1.21.8/enchanting_table_book_2k_nearest.png';

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
const coverTextureStyle = {
  backgroundImage: `url(${enchantingTableBookAtlas})`,
};

function clamp01(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
function smoothstep(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

const p = computed(() => clamp01(props.progress));
// Let the closed book travel up through the fog before the cover begins to hinge.
// This deliberately keeps the first beat slower than the page reveal.
const appearT = computed(() => (reducedMotion.value ? 1 : smoothstep(p.value / 0.28)));
const openT = computed(() => (reducedMotion.value ? 1 : smoothstep((p.value - 0.4) / 0.45)));
const dimT = computed(() => (reducedMotion.value ? 0 : smoothstep((p.value - 0.93) / 0.07)));
// left page reveals as the cover swings past perpendicular
const leftPageOpacity = computed(() =>
  reducedMotion.value ? 1 : smoothstep((openT.value - 0.14) / 0.32).toFixed(4),
);

const sceneVars = computed(() => {
  const appear = appearT.value;
  const open = openT.value;
  const dim = dimT.value;
  return {
    '--appear': appear.toFixed(4),
    '--open': open.toFixed(4),
    '--book-opacity': (appear * (1 - dim * 0.55)).toFixed(4),
    '--book-scale': (0.64 + appear * 0.16 + open * 0.14 - dim * 0.08).toFixed(4),
    '--book-lift': `${((1 - appear) * 118 - open * 8).toFixed(2)}px`,
    '--book-tilt': `${(24 - open * 12).toFixed(2)}deg`,
    '--book-roll': `${(-5 + open * 5).toFixed(2)}deg`,
    '--cover-angle': `${(-82 * open).toFixed(2)}deg`,
    '--cover-z': open > 0.5 ? '0' : '4',
    '--cover-zshift': open > 0.5 ? '-2px' : '2px',
    '--closed-cover-opacity': (1 - smoothstep((open - 0.08) / 0.22)).toFixed(4),
    '--cover-opacity': (smoothstep((open - 0.08) / 0.22) * (1 - smoothstep((open - 0.42) / 0.22))).toFixed(4),
    '--spread-opacity': smoothstep((open - 0.04) / 0.34).toFixed(4),
    '--spine-shadow': (open * 0.85).toFixed(4),
    '--glow-opacity': (appear * (0.35 + open * 0.4)).toFixed(4),
    '--pageblock-opacity': (1 - smoothstep(open / 0.35)).toFixed(4),
    '--fog-opacity': (appear * (0.9 - open * 0.32)).toFixed(4),
  };
});

function inspect(id: string, event: Event) {
  if (event.currentTarget instanceof HTMLElement) emit('inspect', id, event.currentTarget);
}
</script>

<style scoped>
.book-scene {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(12px, 2.4vh, 22px);
  padding-bottom: clamp(12px, 2.4vh, 26px);
}

.book-scene__caption {
  position: relative;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  color: #dfb968;
  font: 650 clamp(0.72rem, 1vw, 0.8rem)/1 "IBM Plex Mono", monospace;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  white-space: nowrap;
  opacity: var(--book-opacity, 0);
}
.book-scene__caption::before,
.book-scene__caption::after {
  width: clamp(28px, 6vw, 72px);
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(223, 185, 104, 0.55));
  content: '';
}
.book-scene__caption::after {
  transform: scaleX(-1);
}

.book-viewport {
  position: relative;
  width: min(620px, 74%);
  aspect-ratio: 8 / 5;
  overflow: visible;
}

.book-scene__fog {
  position: absolute;
  right: -16%;
  bottom: -12%;
  left: -16%;
  z-index: 0;
  height: 58%;
  overflow: hidden;
  border-radius: 50% 50% 0 0 / 42% 42% 0 0;
  background:
    radial-gradient(ellipse at 13% 100%, rgba(147, 166, 149, 0.24), transparent 49%),
    radial-gradient(ellipse at 52% 103%, rgba(95, 129, 115, 0.24), transparent 56%),
    radial-gradient(ellipse at 90% 100%, rgba(129, 148, 133, 0.2), transparent 50%),
    linear-gradient(0deg, rgba(30, 58, 53, 0.34), transparent 70%);
  filter: blur(7px);
  opacity: var(--fog-opacity, 0);
  pointer-events: none;
}
.book {
  position: absolute;
  inset: 0;
  z-index: 2;
  perspective: 2400px;
  perspective-origin: 50% 42%;
  opacity: var(--book-opacity, 0);
  transform:
    translate3d(0, var(--book-lift, 26px), 0)
    rotateX(var(--book-tilt, 14deg))
    rotateZ(var(--book-roll, -3deg))
    scale(var(--book-scale, 0.72));
  transform-style: preserve-3d;
}

.book__glow {
  position: absolute;
  inset: -22%;
  z-index: 0;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(223, 185, 104, 0.32), rgba(58, 141, 107, 0.1) 55%, transparent 72%);
  filter: blur(18px);
  opacity: var(--glow-opacity, 0);
  pointer-events: none;
}

.book__closed-cover {
  position: absolute;
  top: -3%;
  right: -1.5%;
  bottom: -3%;
  left: -1.5%;
  z-index: 4;
  border: 2px solid rgba(43, 24, 10, 0.72);
  border-radius: 10px;
  background-color: #6b411e;
  background-repeat: no-repeat;
  background-position: 0 0;
  background-size: 1066.667% 320%;
  box-shadow: inset 0 0 0 4px rgba(129, 76, 29, 0.25), inset 0 0 34px rgba(32, 16, 5, 0.46), 0 30px 30px rgba(0, 0, 0, 0.56);
  image-rendering: pixelated;
  opacity: var(--closed-cover-opacity, 1);
  pointer-events: none;
  transform: translateZ(5px);
}
.book__closed-cover::before {
  position: absolute;
  inset: 11% 30% 11% 30%;
  border: 2px solid rgba(241, 196, 70, 0.75);
  border-radius: 3px;
  box-shadow: inset 0 0 0 2px rgba(44, 23, 7, 0.44), 0 0 18px rgba(240, 190, 74, 0.14);
  content: '';
}
.book__closed-cover::after {
  position: absolute;
  top: 50%;
  right: 11%;
  left: 11%;
  color: rgba(255, 231, 170, 0.91);
  content: 'SEQUENCE 9  ·  SEER';
  font: 700 clamp(0.62rem, 1vw, 0.82rem)/1 "IBM Plex Mono", monospace;
  letter-spacing: 0.11em;
  text-align: center;
  text-shadow: 1px 1px 0 rgba(40, 22, 7, 0.7);
  transform: translateY(-50%);
}

.book__spread {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  border-radius: 10px;
  filter: drop-shadow(0 34px 30px rgba(0, 0, 0, 0.5));
  opacity: var(--spread-opacity, 0);
  pointer-events: none;
}
.book.is-open .book__spread { pointer-events: auto; }

.book__back-cover {
  position: absolute;
  top: -2.5%;
  bottom: -2.5%;
  left: -1.5%;
  z-index: 0;
  width: 51.5%;
  border-radius: 12px 3px 3px 12px;
  background-color: #5e3a1d;
  background-repeat: no-repeat;
  background-position: 0 50%;
  background-size: 1066.667% 320%;
  box-shadow: inset -8px 0 0 rgba(28, 15, 7, 0.24), 0 22px 28px rgba(0, 0, 0, 0.36);
  image-rendering: pixelated;
  opacity: var(--spread-opacity, 0);
  transform: translateZ(-8px);
}

.page {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 1.6vh, 14px);
  padding: clamp(14px, 3.2vh, 26px) clamp(12px, 2vw, 22px);
  color: #392b25;
  background:
    linear-gradient(90deg, rgba(87, 59, 40, 0.16), transparent 12%),
    repeating-linear-gradient(180deg, transparent 0 26px, rgba(123, 65, 30, 0.06) 26px 27px),
    linear-gradient(145deg, #f7efdc 0%, #efe3c8 58%, #e6d6b4 100%);
  border: 1px solid rgba(87, 59, 40, 0.35);
}
.page--left {
  border-radius: 10px 2px 2px 10px;
  border-right: 0;
  box-shadow: inset -14px 0 22px -14px rgba(57, 43, 37, 0.45);
}
.page--right {
  border-radius: 2px 10px 10px 2px;
  border-left: 0;
  box-shadow: inset 14px 0 22px -14px rgba(57, 43, 37, 0.45);
}

.page__heading {
  margin: 0 0 2px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(143, 93, 54, 0.35);
  color: #8a1e18;
  font: 700 clamp(0.78rem, 1.3vw, 0.95rem)/1.1 "IBM Plex Sans Condensed", sans-serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.entry {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 6px 8px;
  border: 1px solid transparent;
  border-radius: 7px;
  color: inherit;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-family: "IBM Plex Mono", monospace;
  transition: background-color 0.18s ease, border-color 0.18s ease;
}
.entry:hover,
.entry:focus-visible {
  border-color: rgba(143, 93, 54, 0.45);
  background: rgba(255, 252, 240, 0.55);
}
.entry:hover .entry__name,
.entry:focus-visible .entry__name {
  text-decoration-color: #dfb968;
}
.entry__icon {
  flex: 0 0 auto;
  width: clamp(26px, 3vw, 34px);
  height: auto;
  object-fit: contain;
  image-rendering: pixelated;
}
.entry__text {
  min-width: 0;
  display: grid;
  gap: 2px;
}
.entry__name {
  color: #8f5d36;
  font-size: clamp(0.72rem, 1vw, 0.8rem);
  font-weight: 700;
  line-height: 1.25;
  text-decoration: underline;
  text-decoration-color: transparent;
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
  transition: text-decoration-color 0.18s ease;
}
.entry__role {
  color: #7b6254;
  font-size: 0.72rem;
  line-height: 1.2;
}

.page__ritual {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px dashed rgba(143, 93, 54, 0.4);
}
.page__ritual p {
  display: grid;
  gap: 2px;
  margin: 0;
  font-family: "IBM Plex Mono", monospace;
}
.page__ritual strong {
  color: #17803c;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.page__ritual span {
  color: #4f362c;
  font-size: 0.72rem;
  line-height: 1.3;
}
.seal {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(138, 30, 24, 0.4);
  border-radius: 50%;
  background: radial-gradient(circle at 38% 32%, #f3e8cd, #e2d0ab);
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.seal img {
  width: 28px;
  height: 28px;
  object-fit: contain;
  image-rendering: pixelated;
}
.seal:hover,
.seal:focus-visible {
  box-shadow: 0 0 0 4px rgba(223, 185, 104, 0.35);
  transform: scale(1.06);
}

.book__spine {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  z-index: 3;
  width: 26px;
  transform: translateX(-50%);
  background: linear-gradient(90deg, transparent, rgba(57, 43, 37, 0.5) 50%, transparent);
  opacity: var(--spine-shadow, 0);
  pointer-events: none;
}
.book__pageblock {
  position: absolute;
  top: 3%;
  right: -5px;
  bottom: 3%;
  z-index: 0;
  width: 7px;
  border-radius: 0 4px 4px 0;
  background: repeating-linear-gradient(180deg, #efe3c8 0 2px, #d9c9a4 2px 3px);
  opacity: var(--pageblock-opacity, 1);
  pointer-events: none;
}

.cover-leaf {
  position: absolute;
  top: 2%;
  bottom: 2%;
  left: 50%;
  z-index: var(--cover-z, 4);
  width: 51%;
  transform-style: preserve-3d;
  transform-origin: left center;
  transform: rotateY(var(--cover-angle, 0deg)) translateZ(var(--cover-zshift, 2px));
  opacity: var(--cover-opacity, 1);
  pointer-events: none;
}
.cover-leaf__face {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background-color: #6b411e;
  background-repeat: no-repeat;
  background-size: 1066.667% 320%;
  box-shadow: inset 0 0 0 2px rgba(40, 22, 10, 0.35), inset 0 0 24px rgba(27, 14, 5, 0.28), 0 8px 18px rgba(0, 0, 0, 0.42);
  image-rendering: pixelated;
  backface-visibility: hidden;
}
.cover-leaf__front {
  border-radius: 3px 12px 12px 3px;
  background-position: 0 0;
}
.cover-leaf__back {
  border-radius: 12px 3px 3px 12px;
  background-position: 0 50%;
  transform: rotateY(180deg);
}

.book-scene__motes {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}
.book-scene__motes i {
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(240, 211, 140, 0.9), transparent 70%);
  opacity: calc(var(--appear, 0) * 0.7);
  animation: mote-drift 7s ease-in-out infinite;
}
.book-scene__motes i:nth-child(1) { top: 30%; left: 34%; animation-delay: 0s; }
.book-scene__motes i:nth-child(2) { top: 58%; left: 66%; animation-delay: -2.4s; }
.book-scene__motes i:nth-child(3) { top: 42%; left: 55%; animation-delay: -4.8s; }
@keyframes mote-drift {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(10px, -16px, 0); }
}

.hotspot:focus-visible {
  outline: 3px solid #f0d38c;
  outline-offset: 3px;
}

@media (max-width: 820px) {
  .book-viewport {
    width: min(96vw, 560px);
  }
  .page {
    padding: 10px 8px;
    gap: 7px;
  }
  .entry__icon {
    width: 26px;
  }
  .page__ritual span {
    display: none;
  }
}
@media (max-width: 520px) {
  .book-scene__caption {
    letter-spacing: 0.12em;
  }
  .book-scene__caption::before,
  .book-scene__caption::after {
    width: 18px;
  }
  .entry {
    gap: 8px;
    padding: 5px 6px;
  }
  .entry__name {
    font-size: 0.72rem;
  }
  .seal {
    width: 40px;
    height: 40px;
  }
  /* A vertical cover leaf would obscure the very small mobile spread; retain
     the textured closed cover, then reveal the readable two-page state. */
  .cover-leaf {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .book,
  .cover-leaf,
  .entry,
  .seal {
    transition: none;
  }
  .book-scene__motes i {
    animation: none;
  }
}
</style>
