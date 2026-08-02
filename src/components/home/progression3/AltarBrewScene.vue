<template>
  <div class="altar-scene" role="group" aria-label="Ritual altar brewing scene">
    <!-- soft gold vignette pulse during the reveal -->
    <div class="altar-scene__vignette" :style="vignetteStyle" aria-hidden="true" />

    <!-- ALTAR: stylized ritual altar, right-of-center -->
    <div class="altar" :style="altarStyle">
      <!-- magic circle (brew-circle hotspot) -->
      <button
        type="button"
        class="hotspot altar-scene__circle-hotspot"
        :style="circleStyle"
        aria-label="Brewing magic circle"
        @mouseenter="inspect('brew-circle', $event)"
        @mouseleave="emit('clear-inspect')"
        @focus="inspect('brew-circle', $event)"
        @blur="emit('clear-inspect')"
        @click="inspect('brew-circle', $event)"
      >
        <img class="altar-scene__circle-img" :src="magicCircle" alt="" width="256" height="256" decoding="async" draggable="false" />
      </button>

      <!-- green-gold glow behind the core -->
      <div class="altar__halo" :style="haloStyle" aria-hidden="true" />

      <!-- stone-brick 3x3 base card, slight isometric tilt -->
      <div class="altar__base" aria-hidden="true">
        <div class="altar__base-grid">
          <i v-for="n in 9" :key="n" class="altar__cell" :class="{ 'is-chiseled': n % 2 === 0 }" />
        </div>
        <div class="altar__base-edge" />
      </div>

      <!-- enchanting-table core (altar-core hotspot) -->
      <div class="altar__core">
        <span class="altar__rune" :style="runeStyle" aria-hidden="true" />
        <img class="altar__core-top" :src="enchantingTableTop" alt="" width="16" height="16" decoding="async" draggable="false" />
        <span class="altar__glyph" aria-hidden="true">✦</span>
        <img class="altar__core-front" :src="enchantingTableSide" alt="" width="16" height="16" decoding="async" draggable="false" />
        <button
          type="button"
          class="hotspot altar-scene__core-hotspot"
          aria-label="Enchanting-table ritual core"
          @mouseenter="inspect('altar-core', $event)"
          @mouseleave="emit('clear-inspect')"
          @focus="inspect('altar-core', $event)"
          @blur="emit('clear-inspect')"
          @click="inspect('altar-core', $event)"
        />
      </div>
    </div>

    <!-- flying / resting ingredient chips -->
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      class="hotspot item"
      :class="{ 'is-rested': item.rested, 'is-brewing': brewing }"
      :style="item.style"
      :aria-label="item.label"
      @mouseenter="inspect(item.id, $event)"
      @mouseleave="emit('clear-inspect')"
      @focus="inspect(item.id, $event)"
      @blur="emit('clear-inspect')"
      @click="inspect(item.id, $event)"
    >
      <span class="item__chip">
        <img class="item__icon" :src="item.asset" :alt="item.label" width="16" height="16" decoding="async" draggable="false" />
        <span class="item__label">{{ item.label }}</span>
      </span>
    </button>

    <!-- Sequence 9 potion reveal -->
    <div class="altar-scene__reveal" :style="revealWrapStyle">
      <button
        type="button"
        class="hotspot altar-scene__potion"
        :style="potionStyle"
        aria-label="Sequence 9 Seer potion"
        @mouseenter="inspect('sequence-potion', $event)"
        @mouseleave="emit('clear-inspect')"
        @focus="inspect('sequence-potion', $event)"
        @blur="emit('clear-inspect')"
        @click="inspect('sequence-potion', $event)"
      >
        <span class="altar-scene__halo" :style="potionHaloStyle" aria-hidden="true" />
        <img class="altar-scene__potion-img" :src="sequencePotion" alt="Sequence 9 · Seer potion" width="16" height="16" decoding="async" draggable="false" />
        <span class="altar-scene__caption" :style="captionStyle">Sequence 9 · Seer</span>
      </button>
    </div>

    <!-- shared FX layer: bubbles while brewing, sparkles on reveal -->
    <div class="altar-scene__fx" aria-hidden="true">
      <SceneParticles :mode="particleMode" :active="particleActive" :intensity="particleIntensity" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { CSSProperties } from 'vue';
import { useReducedMotion } from '@/composables/useReducedMotion';
import SceneParticles from './SceneParticles.vue';

import enchantingTableTop from '@/assets/images/home/progression/blocks/enchanting_table_top.png';
import enchantingTableSide from '@/assets/images/home/progression/blocks/enchanting_table_side.png';
import foolRecipe from '@/assets/images/home/progression/recipes/fool.png';
import lavosSquidBlood from '@/assets/images/home/progression/real/lavos-squid-blood.png';
import stellarAquaCrystal from '@/assets/images/home/progression/real/stellar-aqua-crystal.png';
import goldMintLeaves from '@/assets/images/home/progression/real/gold-mint-leaves.png';
import magicCircle from '@/assets/images/home/progression/real/magic-circle.png';
import sequencePotion from '@/assets/images/home/progression/real/sequence-potion.png';

const props = defineProps<{ progress: number; active: boolean }>();
const emit = defineEmits<{
  (e: 'inspect', id: string, anchor: HTMLElement): void;
  (e: 'clear-inspect'): void;
}>();

const reduced = useReducedMotion();
const compact = ref(false);
let mediaQuery: MediaQueryList | null = null;

function syncCompact(): void {
  compact.value = mediaQuery?.matches ?? false;
}

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 820px)');
  syncCompact();
  mediaQuery.addEventListener('change', syncCompact);
});

onUnmounted(() => mediaQuery?.removeEventListener('change', syncCompact));

/* ---------------- helpers ---------------- */
function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}
function inspect(id: string, event: Event): void {
  const anchor = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  if (anchor) emit('inspect', id, anchor);
}

/* ---------------- local progress (guarded) ---------------- */
const p = computed(() => clamp01(props.progress));
const final = computed(() => reduced.value); // reduced motion => static final composed state

/* ---------------- phase drivers ---------------- */
const altarIn = computed(() => (final.value ? 1 : clamp01(p.value / 0.2)));
const brew = computed(() => (final.value ? 1 : clamp01((p.value - 0.55) / 0.3)));
const reveal = computed(() => (final.value ? 1 : clamp01((p.value - 0.78) / 0.14)));
const brewing = computed(() => p.value >= 0.55);

/* ---------------- ingredient flight ---------------- */
const FLIGHT_SPAN = 0.12;
const FLIGHT_ARC = 6; // % of scene height, lift above the straight path

type Point = { x: number; y: number };
type ItemSpec = {
  id: string;
  label: string;
  asset: string;
  stagger: number;
  start: Point;
  rest: Point;
};

const DESKTOP_ITEMS: ItemSpec[] = [
  { id: 'formula-fool', label: 'Fool formula', asset: foolRecipe, stagger: 0.15, start: { x: -6, y: 24 }, rest: { x: 61, y: 40 } },
  { id: 'lavos-squid-blood', label: 'Lavos Squid Blood', asset: lavosSquidBlood, stagger: 0.25, start: { x: -6, y: 38 }, rest: { x: 36, y: 38 } },
  { id: 'stellar-aqua-crystal', label: 'Stellar Aqua Crystal', asset: stellarAquaCrystal, stagger: 0.35, start: { x: -6, y: 52 }, rest: { x: 36, y: 68 } },
  { id: 'gold-mint-leaves', label: 'Gold Mint Leaves', asset: goldMintLeaves, stagger: 0.45, start: { x: -6, y: 62 }, rest: { x: 80, y: 46 } },
];

const MOBILE_ITEMS: ItemSpec[] = [
  { id: 'formula-fool', label: 'Fool formula', asset: foolRecipe, stagger: 0.15, start: { x: -8, y: 22 }, rest: { x: 50, y: 40 } },
  { id: 'lavos-squid-blood', label: 'Lavos Squid Blood', asset: lavosSquidBlood, stagger: 0.25, start: { x: -8, y: 36 }, rest: { x: 22, y: 38 } },
  { id: 'stellar-aqua-crystal', label: 'Stellar Aqua Crystal', asset: stellarAquaCrystal, stagger: 0.35, start: { x: -8, y: 50 }, rest: { x: 22, y: 64 } },
  { id: 'gold-mint-leaves', label: 'Gold Mint Leaves', asset: goldMintLeaves, stagger: 0.45, start: { x: -8, y: 60 }, rest: { x: 76, y: 42 } },
];

type FlightItem = ItemSpec & {
  flight: number;
  rested: boolean;
  style: CSSProperties;
};

const items = computed<FlightItem[]>(() => {
  const specs = compact.value ? MOBILE_ITEMS : DESKTOP_ITEMS;
  const arc = compact.value ? 4 : FLIGHT_ARC;
  const dim = p.value >= 0.85 && !final.value ? 0.82 : 1;
  return specs.map((spec) => {
    const t = clamp01((p.value - spec.stagger) / FLIGHT_SPAN);
    const f = final.value ? 1 : t;
    const e = smoothstep(f);
    const x = lerp(spec.start.x, spec.rest.x, e);
    const y = lerp(spec.start.y, spec.rest.y, e) - arc * Math.sin(f * Math.PI);
    const scale = 1.15 - 0.15 * f;
    const rotate = (1 - f) * 7;
    const trailStrength = 1 - f;
    const style: CSSProperties = {
      left: `${x.toFixed(3)}%`,
      top: `${y.toFixed(3)}%`,
      transform: `translate(-50%, -50%) scale(${scale.toFixed(4)}) rotate(${rotate.toFixed(2)}deg)`,
      opacity: (clamp01(f * 14) * dim).toFixed(4),
      pointerEvents: f > 0 ? 'auto' : 'none',
      zIndex: String(f >= 1 ? 8 : 9),
      boxShadow: trailStrength > 0.02
        ? `0 0 ${(10 + 18 * trailStrength).toFixed(0)}px ${(3 + 2 * trailStrength).toFixed(1)}px rgba(240, 211, 140, ${(0.5 * trailStrength).toFixed(3)})`
        : undefined,
    };
    return { ...spec, flight: f, rested: f >= 1, style };
  });
});

/* ---------------- altar ---------------- */
const altarStyle = computed<CSSProperties>(() => {
  const inValue = altarIn.value;
  const x = compact.value ? 50 : 61;
  const y = compact.value ? 50 : 55;
  return {
    left: `${x}%`,
    top: `${y}%`,
    opacity: inValue.toFixed(4),
    transform: `translate(-50%, -50%) scale(${(0.9 + 0.1 * inValue).toFixed(4)}) translateY(${((1 - inValue) * 26).toFixed(1)}px)`,
    pointerEvents: inValue > 0.5 ? 'auto' : 'none',
  };
});

const circleIn = computed(() => (final.value ? 1 : clamp01((p.value - 0.5) / 0.12)));
const circleStyle = computed<CSSProperties>(() => {
  const inValue = circleIn.value;
  const bright = brew.value;
  const rotation = final.value ? 100 : p.value * 120;
  return {
    opacity: (inValue * 0.92).toFixed(4),
    transform: `translate(-50%, -50%) rotate(${rotation.toFixed(2)}deg) scale(${(0.84 + 0.16 * inValue).toFixed(4)})`,
    filter: `brightness(${(0.5 + 0.5 * bright).toFixed(3)}) saturate(${(0.8 + 0.3 * bright).toFixed(3)}) drop-shadow(0 0 ${(10 + 20 * bright).toFixed(1)}px rgba(198, 172, 106, ${(0.16 + 0.3 * bright).toFixed(3)}))`,
    pointerEvents: inValue > 0.4 ? 'auto' : 'none',
  };
});

const haloStyle = computed<CSSProperties>(() => ({
  opacity: (0.4 + 0.6 * brew.value).toFixed(4),
  transform: `translate(-50%, -50%) scale(${(0.8 + 0.4 * brew.value).toFixed(4)})`,
}));

const runeStyle = computed<CSSProperties>(() => ({
  opacity: (altarIn.value * (0.55 + 0.45 * brew.value)).toFixed(4),
  transform: `scale(${(0.9 + 0.25 * brew.value).toFixed(4)})`,
}));

/* ---------------- reveal ---------------- */
const revealWrapStyle = computed<CSSProperties>(() => ({
  opacity: reveal.value.toFixed(4),
}));

const potionStyle = computed<CSSProperties>(() => {
  const r = reveal.value;
  return {
    left: `${compact.value ? 50 : 61}%`,
    top: `${compact.value ? 9 : 13}%`,
    transform: `translate(-50%, -50%) scale(${easeOutBack(r).toFixed(4)})`,
    filter: `brightness(${(0.35 + 0.65 * r).toFixed(3)})`,
    pointerEvents: r > 0.5 ? 'auto' : 'none',
  };
});

const potionHaloStyle = computed<CSSProperties>(() => ({
  opacity: (0.5 + 0.5 * reveal.value).toFixed(4),
  transform: `scale(${(0.9 + 0.2 * reveal.value).toFixed(4)})`,
}));

const captionStyle = computed<CSSProperties>(() => ({
  opacity: reveal.value.toFixed(4),
}));

const vignetteStyle = computed<CSSProperties>(() => ({
  opacity: reveal.value.toFixed(4),
}));

/* ---------------- particles ---------------- */
const particleMode = computed<'bubbles' | 'sparkles'>(() => (p.value >= 0.85 && !final.value ? 'sparkles' : 'bubbles'));
const particleActive = computed(() => props.active && p.value >= 0.55 && !final.value);
const particleIntensity = computed(() => (particleMode.value === 'sparkles' ? 0.35 : 0.9 * brew.value));
</script>

<style scoped>
.altar-scene {
  --gold: #dfb968;
  --pale-gold: #f0d38c;
  --green: #83bca2;
  --green-deep: #3a8d6b;
  --ease: cubic-bezier(.22, 1, .36, 1);
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  color: #fcf9f2;
  font-family: "IBM Plex Mono", monospace;
}

/* shared hotspot base: 44px min touch target, gold focus ring */
.hotspot {
  min-width: 44px;
  min-height: 44px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-family: inherit;
}
.hotspot:focus-visible {
  outline: 3px solid var(--pale-gold);
  outline-offset: 3px;
}

/* ---------- vignette ---------- */
.altar-scene__vignette {
  position: absolute;
  inset: 0;
  z-index: 20;
  pointer-events: none;
  background: radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(223, 185, 104, .09) 78%, rgba(5, 13, 14, .55) 100%);
  animation: vignette-pulse 3s ease-in-out infinite;
}
@keyframes vignette-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}

/* ---------- particles FX wrapper (bubbles rise under/around the altar) ---------- */
.altar-scene__fx {
  position: absolute;
  top: 0;
  right: 10%;
  bottom: 0;
  left: 40%;
  z-index: 1;
  pointer-events: none;
}

/* ---------- altar group ---------- */
.altar {
  position: absolute;
  z-index: 4;
  width: 250px;
  height: 250px;
  perspective: 900px;
  transform-origin: 50% 50%;
  will-change: transform, opacity;
}

/* magic circle */
.altar-scene__circle-hotspot {
  position: absolute;
  left: 50%;
  top: 55%;
  z-index: 1;
  width: min(320px, 44vw);
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
}
.altar-scene__circle-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  -webkit-user-drag: none;
}

/* glow behind the core */
.altar__halo {
  position: absolute;
  left: 50%;
  top: 42%;
  z-index: 2;
  width: 150px;
  height: 96px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(131, 190, 164, .42), rgba(223, 185, 104, .2) 46%, transparent 72%);
  filter: blur(12px);
  pointer-events: none;
  will-change: transform, opacity;
}

/* stone-brick base card (3x3, slight isometric tilt) */
.altar__base {
  position: absolute;
  left: 50%;
  top: 60%;
  z-index: 3;
  width: 204px;
  height: 156px;
  padding: 7px;
  border: 1px solid rgba(223, 185, 104, .24);
  border-radius: 12px;
  background: linear-gradient(160deg, #0e2223, #071617 62%, #0a1b1c);
  box-shadow: 0 22px 0 -6px rgba(4, 14, 15, .9), 0 30px 26px rgba(0, 0, 0, .5);
  transform: translate(-50%, -50%) rotateX(16deg) rotateZ(-2deg);
  transform-style: preserve-3d;
}
.altar__base-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px;
  width: 100%;
  height: 100%;
}
.altar__cell {
  display: block;
  border-radius: 4px;
  background-image: url('@/assets/images/home/progression/blocks/stone_bricks.png');
  background-size: cover;
  image-rendering: pixelated;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .35);
}
.altar__cell.is-chiseled {
  background-image: url('@/assets/images/home/progression/blocks/chiseled_stone_bricks.png');
}
.altar__base-edge {
  position: absolute;
  right: -1px;
  bottom: -20px;
  left: -1px;
  height: 20px;
  border-bottom-right-radius: 10px;
  border-bottom-left-radius: 10px;
  background-image: url('@/assets/images/home/progression/blocks/chiseled_stone_bricks.png');
  background-size: 52px 52px;
  image-rendering: pixelated;
  filter: brightness(.42) saturate(.8);
  transform: scaleY(.6);
  transform-origin: top;
  pointer-events: none;
}

/* enchanting-table core */
.altar__core {
  position: absolute;
  left: 50%;
  top: 41%;
  z-index: 4;
  width: 76px;
  height: 76px;
  pointer-events: none;
  transform: translate(-50%, -50%) rotateX(14deg);
  transform-style: preserve-3d;
}
.altar__core-top {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  border-radius: 6px;
  filter: brightness(1.12);
  box-shadow: 0 12px 0 -3px rgba(7, 21, 22, .92), 0 18px 18px rgba(0, 0, 0, .45);
}
.altar__core-front {
  position: absolute;
  right: 2px;
  bottom: -12px;
  left: 2px;
  height: 12px;
  object-fit: cover;
  image-rendering: pixelated;
  border-bottom-right-radius: 4px;
  border-bottom-left-radius: 4px;
  filter: brightness(.55) saturate(.8);
  pointer-events: none;
}
.altar__rune {
  position: absolute;
  inset: -18px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(131, 190, 164, .55), rgba(223, 185, 104, .22) 46%, transparent 72%);
  filter: blur(7px);
  pointer-events: none;
  will-change: transform, opacity;
}
.altar__glyph {
  position: absolute;
  left: 50%;
  top: -8px;
  z-index: 1;
  color: var(--pale-gold);
  font-size: 1.1rem;
  line-height: 1;
  transform: translateX(-50%);
  text-shadow: 0 0 12px rgba(223, 185, 104, .95);
  pointer-events: none;
}
.altar-scene__core-hotspot {
  position: absolute;
  inset: -8px;
  z-index: 2;
  pointer-events: auto;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
}
.altar-scene__core-hotspot:hover,
.altar-scene__core-hotspot:focus-visible {
  border-color: rgba(223, 185, 104, .6);
  background: rgba(131, 190, 164, .1);
  box-shadow: 0 0 0 4px rgba(223, 185, 104, .12), inset 0 0 14px rgba(131, 190, 164, .16);
}

/* ---------- flying / resting ingredient chips ---------- */
.item {
  position: absolute;
  display: block;
  min-width: 44px;
  min-height: 44px;
  padding: 7px 9px;
  border: 1px solid rgba(131, 190, 164, .32);
  border-radius: 11px;
  background: rgba(6, 24, 24, .9);
  text-align: center;
  will-change: transform, opacity;
  transition: border-color .2s ease, box-shadow .25s ease, background-color .2s ease;
}
.item__chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}
.item__icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
  image-rendering: pixelated;
  -webkit-user-drag: none;
  filter: drop-shadow(0 0 6px rgba(223, 185, 104, .4));
}
.item__label {
  max-width: 132px;
  font-size: .72rem;
  line-height: 1.25;
  color: rgba(252, 249, 242, .84);
}
.item:hover,
.item:focus-visible {
  border-color: var(--gold);
  background: rgba(8, 31, 31, .97);
}
.item.is-rested {
  border-color: rgba(131, 190, 164, .42);
}
.item.is-brewing {
  border-color: rgba(223, 185, 104, .55);
  box-shadow: 0 0 14px rgba(131, 190, 164, .22), 0 10px 20px rgba(0, 0, 0, .4);
}

/* ---------- Sequence 9 potion reveal ---------- */
.altar-scene__reveal {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
}
.altar-scene__potion {
  position: absolute;
  width: 76px;
  height: 76px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  will-change: transform, opacity, filter;
}
.altar-scene__halo {
  position: absolute;
  inset: -20px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(223, 185, 104, .5), rgba(131, 190, 164, .22) 46%, transparent 72%);
  filter: blur(7px);
  pointer-events: none;
  will-change: transform, opacity;
}
.altar-scene__potion-img {
  position: relative;
  display: block;
  width: 64px;
  height: 64px;
  margin: 6px auto 0;
  object-fit: contain;
  image-rendering: pixelated;
  -webkit-user-drag: none;
  filter: drop-shadow(0 0 12px rgba(223, 185, 104, .8));
  animation: potion-float 3.4s ease-in-out infinite;
}
@keyframes potion-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
.altar-scene__caption {
  position: absolute;
  top: calc(100% - 2px);
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  max-width: 180px;
  margin: 0;
  color: rgba(240, 211, 140, .86);
  font-size: .72rem;
  line-height: 1.3;
  letter-spacing: .02em;
  text-align: center;
  text-shadow: 0 0 10px rgba(223, 185, 104, .4);
}

/* ---------- mobile: altar centers, shorter flight paths ---------- */
@media (max-width: 820px) {
  .altar-scene__fx {
    right: 16%;
    left: 16%;
  }
  .altar {
    width: 215px;
    height: 215px;
  }
  .altar-scene__circle-hotspot {
    width: min(230px, 46vw);
  }
  .altar__halo {
    width: 118px;
    height: 76px;
  }
  .altar__base {
    width: 176px;
    height: 134px;
  }
  .altar__core {
    width: 64px;
    height: 64px;
  }
  .altar-scene__potion {
    width: 60px;
    height: 60px;
  }
  .altar-scene__potion-img {
    width: 50px;
    height: 50px;
    margin-top: 5px;
  }
  .item {
    padding: 6px 7px;
  }
  .item__icon {
    width: 34px;
    height: 34px;
  }
  .item__label {
    max-width: 112px;
    font-size: .72rem;
  }
  .altar-scene__caption {
    font-size: .72rem;
  }
}

/* ---------- reduced motion: final composed state, no loops ---------- */
@media (prefers-reduced-motion: reduce) {
  .altar-scene__vignette,
  .altar-scene__potion-img {
    animation: none;
  }
  .item,
  .altar,
  .altar-scene__potion,
  .altar__halo,
  .altar-scene__circle-hotspot {
    transition: none;
  }
}
</style>