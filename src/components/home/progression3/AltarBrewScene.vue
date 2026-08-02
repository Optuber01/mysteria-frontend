<template>
  <div ref="sceneRef" class="altar-scene" role="group" aria-label="Cauldron brewing GUI scene">
    <!-- soft gold vignette pulse during the reveal -->
    <div class="altar-scene__vignette" :style="vignetteStyle" aria-hidden="true" />

    <!-- magic circle behind the GUI (brew-circle hotspot) -->
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
      <span class="altar-scene__circle-art" :style="circleMaskStyle" aria-hidden="true" />
    </button>

    <!-- Actual server GUI texture — no composited world screenshot. -->
    <div ref="guiRef" class="gui" :style="guiStyle" role="img" aria-label="Cauldron brewing interface">
      <img class="gui__img" :src="generic54" alt="" width="256" height="256" decoding="async" draggable="false" />

      <!-- green confirm button glows as the brew completes -->
      <span class="gui__confirm" :style="confirmStyle" aria-hidden="true" />

      <!-- zone hotspots: recipe / main / supplementary slots -->
      <button
        type="button"
        class="hotspot gui__zone gui__zone--recipe"
        :style="recipeZoneStyle"
        aria-label="Formula slot"
        @mouseenter="inspect('brew-recipe-slot', $event)"
        @mouseleave="emit('clear-inspect')"
        @focus="inspect('brew-recipe-slot', $event)"
        @blur="emit('clear-inspect')"
        @click="inspect('brew-recipe-slot', $event)"
      />
      <button
        type="button"
        class="hotspot gui__zone gui__zone--main"
        :style="mainZoneStyle"
        aria-label="Main ingredient slots"
        @mouseenter="inspect('brew-main-slots', $event)"
        @mouseleave="emit('clear-inspect')"
        @focus="inspect('brew-main-slots', $event)"
        @blur="emit('clear-inspect')"
        @click="inspect('brew-main-slots', $event)"
      />
      <button
        type="button"
        class="hotspot gui__zone gui__zone--supp"
        :style="suppZoneStyle"
        aria-label="Supplementary ingredient slots"
        @mouseenter="inspect('brew-supp-slots', $event)"
        @mouseleave="emit('clear-inspect')"
        @focus="inspect('brew-supp-slots', $event)"
        @blur="emit('clear-inspect')"
        @click="inspect('brew-supp-slots', $event)"
      />
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
        <span class="item__label" :style="item.labelStyle">{{ item.label }}</span>
      </span>
    </button>

    <!-- bubbles rising from the cauldron while brewing -->
    <div class="altar-scene__fx" :style="fxStyle" aria-hidden="true">
      <SceneParticles :mode="particleMode" :active="particleActive" :intensity="particleIntensity" />
    </div>

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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { CSSProperties } from 'vue';
import { useReducedMotion } from '@/composables/useReducedMotion';
import SceneParticles from './SceneParticles.vue';

import generic54 from '@/assets/images/home/progression/source/generic-54.png';
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
  syncGeom();
  if (sceneRef.value) resizeObserver = new ResizeObserver(syncGeom);
  if (sceneRef.value) resizeObserver?.observe(sceneRef.value);
});

onUnmounted(() => {
  mediaQuery?.removeEventListener('change', syncCompact);
  resizeObserver?.disconnect();
  resizeObserver = null;
});

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

/* ---------------- scene geometry (px, measured) ---------------- */
const sceneRef = ref<HTMLElement | null>(null);
const guiRef = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | null = null;
const geom = ref({ w: 0, h: 0, guiLeft: 0, guiTop: 0, guiW: 0, guiH: 0 });

function syncGeom(): void {
  const scene = sceneRef.value;
  const gui = guiRef.value;
  if (!scene || !gui) return;
  const s = scene.getBoundingClientRect();
  const g = gui.getBoundingClientRect();
  geom.value = {
    w: scene.clientWidth,
    h: scene.clientHeight,
    guiLeft: g.left - s.left,
    guiTop: g.top - s.top,
    guiW: g.width,
    guiH: g.height,
  };
}

/* re-measure whenever the entrance transform settles (rects include the transform) */
watch(altarIn, () => requestAnimationFrame(syncGeom));

/* ---------------- GUI panel ---------------- */
const guiStyle = computed<CSSProperties>(() => {
  const inValue = altarIn.value;
  const x = 50;
  const y = compact.value ? 50 : 53;
  return {
    left: `${x}%`,
    top: `${y}%`,
    width: compact.value ? 'min(310px, 82vw)' : 'min(420px, 43vw)',
    opacity: inValue.toFixed(4),
    transform: `translate(-50%, -50%) scale(${(0.9 + 0.1 * inValue).toFixed(4)}) translateY(${((1 - inValue) * 26).toFixed(1)}px)`,
    pointerEvents: inValue > 0.5 ? 'auto' : 'none',
  };
});

/* Slot centres on the original Generic 54 resource texture. */
const SLOT_R = { x: 50, y: 31 };
const SLOT_M1 = { x: 35, y: 45 };
const SLOT_M2 = { x: 35, y: 57 };
const SLOT_S1 = { x: 65, y: 45 };
const SLOT_S2 = { x: 65, y: 57 };
const SLOT_C = { x: 50, y: 72 };

function zoneStyle(slot: { x: number; y: number }, w: number, h: number): CSSProperties {
  return {
    left: `${slot.x.toFixed(2)}%`,
    top: `${slot.y.toFixed(2)}%`,
    width: `${w.toFixed(2)}%`,
    height: `${h.toFixed(2)}%`,
    pointerEvents: altarIn.value > 0.5 ? 'auto' : 'none',
  };
}
const recipeZoneStyle = computed<CSSProperties>(() => zoneStyle(SLOT_R, 10, 16));
const mainZoneStyle = computed<CSSProperties>(() => zoneStyle({ x: 35, y: 51 }, 20, 30));
const suppZoneStyle = computed<CSSProperties>(() => zoneStyle({ x: 65, y: 51 }, 20, 30));

const confirmStyle = computed<CSSProperties>(() => {
  const b = brew.value;
  return {
    left: `${SLOT_C.x.toFixed(2)}%`,
    top: `${SLOT_C.y.toFixed(2)}%`,
    opacity: (b * 0.85).toFixed(4),
    transform: `translate(-50%, -50%) scale(${(0.7 + 0.45 * b).toFixed(4)})`,
    boxShadow: `0 0 ${(6 + 14 * b).toFixed(1)}px ${(3 + 4 * b).toFixed(1)}px rgba(131, 216, 105, ${(0.35 * b).toFixed(3)})`,
  };
});

/* ---------------- ingredient flight: book -> GUI slots ---------------- */
const FLIGHT_SPAN = 0.16;
const ARC_PX = { desktop: 30, mobile: 18 };

type Point = { x: number; y: number };
type ItemSpec = {
  id: string;
  label: string;
  asset: string;
  stagger: number;
  start: Point; // % of the scene (the book area)
  slot: Point; // % of the GUI texture
};

const ITEMS: ItemSpec[] = [
  // These are the corresponding positions on the open formula. While the two
  // scenes cross-fade, the item sprites continue from the book into the real
  // Cauldron GUI instead of appearing at arbitrary points in the stage.
  { id: 'formula-fool', label: 'Fool formula', asset: foolRecipe, stagger: 0.02, start: { x: 48, y: 62 }, slot: SLOT_R },
  { id: 'lavos-squid-blood', label: 'Lavos Squid Blood', asset: lavosSquidBlood, stagger: 0.08, start: { x: 31, y: 34 }, slot: SLOT_M1 },
  { id: 'stellar-aqua-crystal', label: 'Stellar Aqua Crystal', asset: stellarAquaCrystal, stagger: 0.14, start: { x: 31, y: 55 }, slot: SLOT_M2 },
  { id: 'gold-mint-leaves', label: 'Gold Mint Leaves', asset: goldMintLeaves, stagger: 0.2, start: { x: 68, y: 36 }, slot: SLOT_S1 },
];

type FlightItem = ItemSpec & {
  rested: boolean;
  style: CSSProperties;
  labelStyle: CSSProperties;
};

const items = computed<FlightItem[]>(() => {
  const g = geom.value;
  const arc = compact.value ? ARC_PX.mobile : ARC_PX.desktop;
    const dim = p.value >= 0.85 && !final.value ? 0.82 : 1;
  const unmeasured = g.w <= 0 || g.guiW <= 0;
  return ITEMS.map((spec) => {
    if (unmeasured) {
      return { ...spec, rested: false, style: { opacity: 0, pointerEvents: 'none' }, labelStyle: {} };
    }
    const t = clamp01((p.value - spec.stagger) / FLIGHT_SPAN);
    const f = final.value ? 1 : t;
    const e = smoothstep(f);
    const sx = (spec.start.x / 100) * g.w;
    const sy = (spec.start.y / 100) * g.h;
    const ex = g.guiLeft + (spec.slot.x / 100) * g.guiW;
    const ey = g.guiTop + (spec.slot.y / 100) * g.guiH;
    const x = lerp(sx, ex, e);
    const y = lerp(sy, ey, e) - arc * Math.sin(f * Math.PI);
    const slotBlend = smoothstep(clamp01((f - 0.42) / 0.58));
    const scale = (1.15 - 0.15 * f) * (1 - 0.38 * slotBlend);
    const rotate = (1 - f) * 7;
    const trailStrength = 1 - f;
    const style: CSSProperties = {
      left: `${x.toFixed(2)}px`,
      top: `${y.toFixed(2)}px`,
      transform: `translate(-50%, -50%) scale(${scale.toFixed(4)}) rotate(${rotate.toFixed(2)}deg)`,
      opacity: (clamp01(f * 14) * dim).toFixed(4),
      pointerEvents: f > 0 ? 'auto' : 'none',
      zIndex: String(f >= 1 ? 8 : 9),
      boxShadow:
        trailStrength > 0.02
          ? `0 0 ${(10 + 18 * trailStrength).toFixed(0)}px ${(3 + 2 * trailStrength).toFixed(1)}px rgba(240, 211, 140, ${(0.5 * trailStrength).toFixed(3)})`
          : undefined,
    };
    const labelStyle: CSSProperties = { opacity: (1 - slotBlend).toFixed(4) };
    return { ...spec, rested: f >= 1, style, labelStyle };
  });
});

/* ---------------- magic circle (brew phase) ---------------- */
const circleIn = computed(() => (final.value ? 1 : clamp01((p.value - 0.5) / 0.12)));
const circleMaskStyle = computed<CSSProperties>(() => ({
  maskImage: `url(${magicCircle})`,
  WebkitMaskImage: `url(${magicCircle})`,
}));
const circleStyle = computed<CSSProperties>(() => {
  const inValue = circleIn.value;
  const bright = brew.value;
  const rotation = final.value ? 100 : p.value * 120;
  return {
    left: '50%',
    top: `${compact.value ? 50 : 53}%`,
    opacity: (inValue * 0.92).toFixed(4),
    transform: `translate(-50%, -50%) rotate(${rotation.toFixed(2)}deg) scale(${(0.84 + 0.16 * inValue).toFixed(4)})`,
    filter: `brightness(${(0.5 + 0.5 * bright).toFixed(3)}) saturate(${(0.8 + 0.3 * bright).toFixed(3)}) drop-shadow(0 0 ${(10 + 20 * bright).toFixed(1)}px rgba(198, 172, 106, ${(0.16 + 0.3 * bright).toFixed(3)}))`,
    pointerEvents: inValue > 0.4 ? 'auto' : 'none',
  };
});

/* ---------------- FX layer over the cauldron pot (top-left of the GUI) ---------------- */
const fxStyle = computed<CSSProperties>(() => {
  const g = geom.value;
  if (g.guiW <= 0) return { opacity: 0 };
  const cx = g.guiLeft + 0.5 * g.guiW;
  const cy = g.guiTop + 0.43 * g.guiH;
  const size = compact.value ? 130 : 180;
  return {
    left: `${(cx - size / 2).toFixed(1)}px`,
    top: `${(cy - size / 2).toFixed(1)}px`,
    width: `${size}px`,
    height: `${size}px`,
  };
});

/* ---------------- reveal ---------------- */
const revealWrapStyle = computed<CSSProperties>(() => ({
  opacity: reveal.value.toFixed(4),
}));

const potionStyle = computed<CSSProperties>(() => {
  const r = reveal.value;
  return {
    left: '50%',
    top: `${compact.value ? 10 : 13}%`,
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

/* ---------- magic circle (behind the GUI panel) ---------- */
.altar-scene__circle-hotspot {
  position: absolute;
  z-index: 1;
  width: min(500px, 58vw);
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
}
.altar-scene__circle-art {
  display: block;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ffe49b, #d6a818 70%);
  mask-position: center;
  mask-repeat: no-repeat;
  mask-size: contain;
  mask-mode: luminance;
  -webkit-mask-position: center;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: contain;
  -webkit-mask-mode: luminance;
  filter: drop-shadow(0 0 12px rgba(223, 185, 104, .7));
}

/* ---------- CauldronGUI panel ---------- */
.gui {
  position: absolute;
  z-index: 3;
  aspect-ratio: 1;
  filter: drop-shadow(0 26px 30px rgba(0, 0, 0, .55));
  will-change: transform, opacity;
}
.gui__img {
  display: block;
  width: 100%;
  max-width: none;
  height: 100%;
  object-fit: fill;
  image-rendering: pixelated;
  -webkit-user-drag: none;
}

.gui__confirm {
  position: absolute;
  z-index: 2;
  width: 34px;
  height: 34px;
  border: 1px solid rgba(170, 226, 58, .65);
  border-radius: 8px;
  background: rgba(170, 226, 58, .3);
  pointer-events: none;
  will-change: transform, opacity;
}

.gui__zone {
  position: absolute;
  z-index: 2;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
}
.gui__zone:hover,
.gui__zone:focus-visible {
  border-color: rgba(223, 185, 104, .65);
  background: rgba(240, 211, 140, .12);
  box-shadow: 0 0 0 3px rgba(223, 185, 104, .14), inset 0 0 12px rgba(131, 190, 164, .18);
}

/* ---------- flying / resting ingredient chips ---------- */
.item {
  position: absolute;
  display: block;
  min-width: 44px;
  min-height: 44px;
  padding: 2px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  text-align: center;
  will-change: transform, opacity;
  transition: border-color .2s ease, box-shadow .25s ease, background-color .2s ease;
}
.item__chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.item__icon {
  width: 46px;
  height: 46px;
  object-fit: contain;
  image-rendering: pixelated;
  -webkit-user-drag: none;
  filter: drop-shadow(0 0 5px rgba(223, 185, 104, .34));
}
.item__label {
  display: none;
  will-change: opacity;
}
.item:hover,
.item:focus-visible {
  border-color: rgba(240, 211, 140, .72);
  background: rgba(6, 24, 24, .52);
}
.item.is-rested {
  padding: 0;
  border-color: transparent;
  background: transparent;
  box-shadow: none;
}
.item.is-rested .item__chip {
  gap: 0;
}
.item.is-rested .item__icon {
  width: 26px;
  height: 26px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, .45));
}
.item.is-rested .item__label {
  display: none;
}
.item.is-rested:hover,
.item.is-rested:focus-visible {
  background: transparent;
}
.item.is-rested:hover .item__icon,
.item.is-rested:focus-visible .item__icon {
  filter: drop-shadow(0 0 8px rgba(240, 211, 140, .75));
}
.item.is-brewing {
  box-shadow: none;
}

/* ---------- bubbles FX (positioned over the cauldron pot) ---------- */
.altar-scene__fx {
  position: absolute;
  z-index: 4;
  pointer-events: none;
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

/* ---------- mobile: panel centers, shorter flights ---------- */
@media (max-width: 820px) {
  .altar-scene__circle-hotspot {
    width: min(290px, 70vw);
  }
  .gui__confirm {
    width: 26px;
    height: 26px;
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
  .item.is-rested {
    padding: 0;
  }
  .item.is-rested .item__icon {
    width: 22px;
    height: 22px;
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
  .gui,
  .altar-scene__potion,
  .altar-scene__circle-hotspot {
    transition: none;
  }
}
</style>
