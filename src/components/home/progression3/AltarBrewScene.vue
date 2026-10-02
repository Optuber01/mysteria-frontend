<template>
  <div ref="sceneRef" class="altar-scene" role="group" :aria-label="tp('altar.sceneLabel')">
    <!-- a crimson bloom behind the print as the potion is revealed -->
    <div class="altar-scene__vignette" :style="vignetteStyle" aria-hidden="true" />

    <!-- magic circle behind the print (brew-circle hotspot) -->
    <button
      type="button"
      class="hotspot altar-scene__circle-hotspot"
      :style="circleStyle"
      :aria-label="tp('altar.circleLabel')"
      @mouseenter="inspect('brew-circle', $event)"
      @mouseleave="emit('clear-inspect')"
      @focus="inspect('brew-circle', $event)"
      @blur="emit('clear-inspect')"
      @click="inspect('brew-circle', $event)"
    >
    </button>

    <!-- The real in-game cauldron screen, printed and pinned like evidence. -->
    <div class="print" :style="printStyle">
      <div ref="guiRef" class="gui" role="group" :aria-label="tp('altar.interfaceLabel')">
        <img class="gui__img" :src="cauldronInterface" alt="" width="636" height="284" decoding="async" draggable="false" />

        <!-- the confirm slot lights as the brew completes -->
        <span class="gui__confirm" :style="confirmStyle" aria-hidden="true" />

        <!-- zone hotspots: recipe / main / supplementary slots -->
        <button
          type="button"
          class="hotspot gui__zone"
          :style="recipeZoneStyle"
          :aria-label="tp('details.recipeSlot.label')"
          @mouseenter="inspect('brew-recipe-slot', $event)"
          @mouseleave="emit('clear-inspect')"
          @focus="inspect('brew-recipe-slot', $event)"
          @blur="emit('clear-inspect')"
          @click="inspect('brew-recipe-slot', $event)"
        />
        <button
          type="button"
          class="hotspot gui__zone"
          :style="mainZoneStyle"
          :aria-label="tp('details.mainSlots.label')"
          @mouseenter="inspect('brew-main-slots', $event)"
          @mouseleave="emit('clear-inspect')"
          @focus="inspect('brew-main-slots', $event)"
          @blur="emit('clear-inspect')"
          @click="inspect('brew-main-slots', $event)"
        />
        <button
          type="button"
          class="hotspot gui__zone"
          :style="suppZoneStyle"
          :aria-label="tp('details.supplementarySlots.label')"
          @mouseenter="inspect('brew-supp-slots', $event)"
          @mouseleave="emit('clear-inspect')"
          @focus="inspect('brew-supp-slots', $event)"
          @blur="emit('clear-inspect')"
          @click="inspect('brew-supp-slots', $event)"
        />
      </div>
      <p class="print__caption" aria-hidden="true">{{ tp('altar.printCaption') }}</p>
    </div>

    <!-- flying / resting ingredients -->
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      class="hotspot item"
      :class="{ 'is-rested': item.rested }"
      :style="item.style"
      :aria-label="item.label"
      @mouseenter="inspect(item.id, $event)"
      @mouseleave="emit('clear-inspect')"
      @focus="inspect(item.id, $event)"
      @blur="emit('clear-inspect')"
      @click="inspect(item.id, $event)"
    >
      <img class="item__icon" :src="item.asset" alt="" width="16" height="16" decoding="async" draggable="false" />
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
        :aria-label="tp('altar.potionLabel')"
        @mouseenter="inspect('sequence-potion', $event)"
        @mouseleave="emit('clear-inspect')"
        @focus="inspect('sequence-potion', $event)"
        @blur="emit('clear-inspect')"
        @click="inspect('sequence-potion', $event)"
      >
        <span class="altar-scene__halo" :style="potionHaloStyle" aria-hidden="true" />
        <img class="altar-scene__potion-img" :src="sequencePotion" alt="" width="16" height="16" decoding="async" draggable="false" />
        <span class="altar-scene__caption" aria-hidden="true">{{ tp('altar.potionCaption') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { CSSProperties } from 'vue';
import { useReducedMotion } from '@/composables/useReducedMotion';
import SceneParticles from './SceneParticles.vue';
import { useProgressionCopy } from './useProgressionCopy';

import cauldronInterface from '@/assets/images/home/progression/cauldron-interface.png';
import foolRecipe from '@/assets/images/home/progression/recipes/fool.png';
import lavosSquidBlood from '@/assets/images/home/progression/real/lavos-squid-blood.png';
import stellarAquaCrystal from '@/assets/images/home/progression/real/stellar-aqua-crystal.png';
import goldMintLeaves from '@/assets/images/home/progression/real/gold-mint-leaves.png';
import magicCircle from '@/assets/images/home/progression/real/magic-circle.png';
import sequencePotion from '@/assets/images/home/progression/real/sequence-potion.png';

const props = withDefaults(defineProps<{
  progress: number;
  active: boolean;
  /** How far (fraction of the stage width) the closing book has slid left. */
  bookShift?: number;
}>(), { bookShift: 0 });
const emit = defineEmits<{
  (e: 'inspect', id: string, anchor: HTMLElement): void;
  (e: 'clear-inspect'): void;
}>();

const reduced = useReducedMotion();
const { tp } = useProgressionCopy();

/* The print sits at the right of the stage, pinned slightly askew. */
const PRINT = { x: 70, y: 52, tiltDeg: -1.4 };
const TILT = (PRINT.tiltDeg * Math.PI) / 180;

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
// The print arrives as the book starts to close (ProgressionStoryV3 closes it
// over 0.10-0.42 of this scene and slides it left, out of the print's way).
const altarIn = computed(() => (final.value ? 1 : smoothstep(clamp01((p.value - 0.15) / 0.14))));
const brew = computed(() => (final.value ? 1 : clamp01((p.value - 0.55) / 0.3)));
const reveal = computed(() => (final.value ? 1 : clamp01((p.value - 0.78) / 0.14)));

/* ---------------- scene geometry (px, measured) ---------------- */
const sceneRef = ref<HTMLElement | null>(null);
const guiRef = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | null = null;
// The screen's centre and its untransformed size: slot positions are rotated
// with the print's tilt, so the bounding box (which grows with rotation) is
// only used for the centre.
const geom = ref({ w: 0, h: 0, cx: 0, cy: 0, guiW: 0, guiH: 0 });

function syncGeom(): void {
  const scene = sceneRef.value;
  const gui = guiRef.value;
  if (!scene || !gui) return;
  const s = scene.getBoundingClientRect();
  const g = gui.getBoundingClientRect();
  geom.value = {
    w: scene.clientWidth,
    h: scene.clientHeight,
    cx: g.left + g.width / 2 - s.left,
    cy: g.top + g.height / 2 - s.top,
    guiW: gui.offsetWidth,
    guiH: gui.offsetHeight,
  };
}

onMounted(() => {
  syncGeom();
  if (sceneRef.value) {
    resizeObserver = new ResizeObserver(syncGeom);
    resizeObserver.observe(sceneRef.value);
  }
});
onUnmounted(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});

/* re-measure whenever the entrance transform settles (rects include the transform) */
watch(altarIn, () => requestAnimationFrame(syncGeom));

type Point = { x: number; y: number };

/** A point given in % of the screen capture, in scene px (tilt applied). */
function onPrint(point: Point): Point {
  const g = geom.value;
  const dx = (point.x / 100 - 0.5) * g.guiW;
  const dy = (point.y / 100 - 0.5) * g.guiH;
  return {
    x: g.cx + dx * Math.cos(TILT) - dy * Math.sin(TILT),
    y: g.cy + dx * Math.sin(TILT) + dy * Math.cos(TILT),
  };
}

/*
 * Stage composition, sized from the scene box so the circle (and its glow),
 * the print and the potion all stay inside the stage at every viewport: the
 * circle is bounded by the stage height and width, the print by the circle,
 * and the circle's right edge keeps clear of the stage edge.
 */
const EDGE = 24; // room for the circle's glow inside the clipped stage
const layout = computed(() => {
  const { w, h } = geom.value;
  if (w <= 0 || h <= 0) return null;
  const circle = Math.max(240, Math.min(620, h - 2 * EDGE - 16, w * 0.62));
  const print = Math.min(440, circle * 0.76, w * 0.54);
  const x = Math.min(w * (PRINT.x / 100), w - circle / 2 - EDGE);
  const y = h * (PRINT.y / 100);
  // The revealed potion floats where the player will hold it next chapter,
  // clear of the circle's left edge.
  const potionX = Math.max(56, Math.min(w * 0.3, x - circle / 2 - 64));
  return { circle, print, x, y, potionX, potionY: h * 0.44 };
});

// The print moves when the stage is resized: re-measure the screen after it.
watch(
  () => (layout.value ? `${layout.value.x.toFixed(1)},${layout.value.y.toFixed(1)},${layout.value.print.toFixed(1)}` : ''),
  () => requestAnimationFrame(syncGeom),
);

/* ---------------- print ---------------- */
const printStyle = computed<CSSProperties>(() => {
  const inValue = altarIn.value;
  const l = layout.value;
  return {
    left: l ? `${l.x.toFixed(1)}px` : `${PRINT.x}%`,
    top: l ? `${l.y.toFixed(1)}px` : `${PRINT.y}%`,
    width: l ? `${l.print.toFixed(1)}px` : undefined,
    // opaque early: it is laid over the closing book, not seen through it
    opacity: clamp01(inValue * 2.5).toFixed(4),
    // slides in a short way inside the stage, never from beyond its edge
    transform: `translate(-50%, -50%) translateX(${((1 - inValue) * 36).toFixed(1)}px) rotate(${PRINT.tiltDeg}deg) scale(${(0.94 + 0.06 * inValue).toFixed(4)})`,
    pointerEvents: inValue > 0.5 ? 'auto' : 'none',
  };
});

/*
 * Pixel-verified slot centres on the actual in-game capture. The print crops
 * the 636 px image to x=143..493, so X values are relative to that 350 px
 * region while Y values remain relative to all 284 px.
 */
const SLOT_R = { x: 50.3, y: 36.6 };
const SLOT_M1 = { x: 19.5, y: 49.3 };
const SLOT_M2 = { x: 29.6, y: 62 };
const SLOT_S1 = { x: 70.9, y: 49.3 };
const SLOT_C = { x: 50.3, y: 74.6 };

function zoneStyle(slot: Point, w: number, h: number): CSSProperties {
  return {
    left: `${slot.x.toFixed(2)}%`,
    top: `${slot.y.toFixed(2)}%`,
    width: `${w.toFixed(2)}%`,
    height: `${h.toFixed(2)}%`,
  };
}
const recipeZoneStyle = zoneStyle(SLOT_R, 11, 9);
const mainZoneStyle = zoneStyle({ x: 24.55, y: 55.65 }, 28, 28);
const suppZoneStyle = zoneStyle({ x: 76, y: 55.65 }, 28, 28);

const confirmStyle = computed<CSSProperties>(() => {
  const b = brew.value;
  return {
    left: `${SLOT_C.x.toFixed(2)}%`,
    top: `${SLOT_C.y.toFixed(2)}%`,
    opacity: (b * 0.9).toFixed(4),
    transform: `translate(-50%, -50%) scale(${(0.7 + 0.45 * b).toFixed(4)})`,
    boxShadow: `0 0 ${(6 + 16 * b).toFixed(1)}px ${(3 + 4 * b).toFixed(1)}px rgba(229, 84, 93, ${(0.45 * b).toFixed(3)})`,
  };
});

/* ---------------- ingredient flight: book -> screen slots ---------------- */
const FLIGHT_SPAN = 0.22;
const ARC_PX = 42;

type ItemSpec = {
  id: string;
  labelKey: string;
  asset: string;
  stagger: number;
  bookX: number; // normalised position inside the 680 x 548 book viewport
  bookY: number;
  slot: Point; // % of the screen capture
};

const ITEMS: ItemSpec[] = [
  // Positions match the icons painted onto the physical book leaves. All four
  // leave the pages before the print (which is laid over the book) covers
  // them, and head for slots it carries in with it.
  // Loading order follows the in-game guide: main ingredients (left slots),
  // supplementary ingredients (right slots), then the recipe in the centre.
  { id: 'lavos-squid-blood', labelKey: 'ingredients.lavosSquidBlood', asset: lavosSquidBlood, stagger: 0.12, bookX: 0.2226, bookY: 0.3071, slot: SLOT_M1 },
  { id: 'stellar-aqua-crystal', labelKey: 'ingredients.stellarAquaCrystal', asset: stellarAquaCrystal, stagger: 0.15, bookX: 0.2226, bookY: 0.4374, slot: SLOT_M2 },
  { id: 'gold-mint-leaves', labelKey: 'ingredients.goldMintLeaves', asset: goldMintLeaves, stagger: 0.18, bookX: 0.5537, bookY: 0.3071, slot: SLOT_S1 },
  { id: 'formula-fool', labelKey: 'ingredients.formula', asset: foolRecipe, stagger: 0.21, bookX: 0.5547, bookY: 0.7299, slot: SLOT_R },
];

/** Mirrors FormulaBookScene's .book-viewport box (and the book's slide left). */
function bookSource(spec: ItemSpec, geometry: typeof geom.value): Point {
  const marginTop = Math.min(46, Math.max(22, innerHeight * 0.05));
  const viewportW = Math.max(0, Math.min(680, geometry.w, (geometry.h - marginTop - 8) * 1.24));
  const viewportH = viewportW / 1.24;
  const viewportLeft = (geometry.w - viewportW) / 2 - geometry.w * props.bookShift;
  const viewportTop = (geometry.h - viewportH - marginTop) / 2 + marginTop;
  return {
    x: viewportLeft + viewportW * spec.bookX,
    y: viewportTop + viewportH * spec.bookY,
  };
}

type FlightItem = ItemSpec & {
  label: string;
  rested: boolean;
  style: CSSProperties;
};

const items = computed<FlightItem[]>(() => {
  const g = geom.value;
  const dim = p.value >= 0.85 && !final.value ? 0.82 : 1;
  const unmeasured = g.w <= 0 || g.guiW <= 0;
  return ITEMS.map((spec) => {
    const label = tp(spec.labelKey);
    if (unmeasured) {
      return { ...spec, label, rested: false, style: { opacity: 0, pointerEvents: 'none' } };
    }
    const f = final.value ? 1 : clamp01((p.value - spec.stagger) / FLIGHT_SPAN);
    const e = smoothstep(f);
    const source = bookSource(spec, g);
    const target = onPrint(spec.slot);
    const x = lerp(source.x, target.x, e);
    const y = lerp(source.y, target.y, e) - ARC_PX * Math.sin(f * Math.PI);
    const slotBlend = smoothstep(clamp01((f - 0.42) / 0.58));
    const scale = (1.15 - 0.15 * f) * (1 - 0.38 * slotBlend);
    const rotate = (1 - f) * 7 + f * PRINT.tiltDeg;
    const trail = 1 - f;
    const style: CSSProperties = {
      left: `${x.toFixed(2)}px`,
      top: `${y.toFixed(2)}px`,
      transform: `translate(-50%, -50%) scale(${scale.toFixed(4)}) rotate(${rotate.toFixed(2)}deg)`,
      opacity: (clamp01(f * 14) * dim).toFixed(4),
      pointerEvents: f > 0 ? 'auto' : 'none',
      zIndex: String(f >= 1 ? 8 : 9),
      // A pale spirit trail while in flight; none once seated in the slot.
      filter: trail > 0.02
        ? `drop-shadow(0 0 ${(6 + 10 * trail).toFixed(1)}px rgba(236, 230, 218, ${(0.55 * trail).toFixed(3)}))`
        : undefined,
    };
    return { ...spec, label, rested: f >= 1, style };
  });
});

/* ---------------- magic circle (brew phase) ---------------- */
const circleIn = computed(() => (final.value ? 1 : clamp01((p.value - 0.5) / 0.12)));
// The hotspot stays an upright disc; only its painted sigil (a pseudo-element)
// spins, so the hit area and its box never grow with the rotation.
const circleStyle = computed<CSSProperties>(() => {
  const inValue = circleIn.value;
  const bright = brew.value;
  const rotation = final.value ? 100 : p.value * 120;
  const g = geom.value;
  const l = layout.value;
  const centre = g.guiW > 0 ? { left: `${g.cx.toFixed(1)}px`, top: `${g.cy.toFixed(1)}px` } : { left: `${PRINT.x}%`, top: `${PRINT.y}%` };
  return {
    ...centre,
    width: l ? `${l.circle.toFixed(1)}px` : undefined,
    '--circle-mask': `url(${magicCircle})`,
    '--circle-spin': `${rotation.toFixed(2)}deg`,
    opacity: (inValue * 0.95).toFixed(4),
    transform: `translate(-50%, -50%) scale(${(0.84 + 0.16 * inValue).toFixed(4)})`,
    filter: `brightness(${(0.55 + 0.6 * bright).toFixed(3)}) drop-shadow(0 0 ${(6 + 14 * bright).toFixed(1)}px rgba(179, 32, 43, ${(0.3 + 0.4 * bright).toFixed(3)}))`,
    pointerEvents: inValue > 0.4 ? 'auto' : 'none',
  } as CSSProperties;
});

/* ---------------- FX layer over the cauldron (centre of the screen) ---------------- */
const fxStyle = computed<CSSProperties>(() => {
  const g = geom.value;
  if (g.guiW <= 0) return { opacity: 0 };
  const centre = onPrint({ x: 50, y: 43 });
  const size = 180;
  return {
    left: `${(centre.x - size / 2).toFixed(1)}px`,
    top: `${(centre.y - size / 2).toFixed(1)}px`,
    width: `${size}px`,
    height: `${size}px`,
  };
});

/* ---------------- reveal ---------------- */
const revealWrapStyle = computed<CSSProperties>(() => ({
  opacity: reveal.value.toFixed(4),
}));

// The potion rises out of the cauldron and drifts left to where the player
// takes it in the next chapter.
const potionStyle = computed<CSSProperties>(() => {
  const r = reveal.value;
  const l = layout.value;
  const g = geom.value;
  let pos: CSSProperties = { left: '30%', top: '44%' };
  if (l) {
    const from = g.guiW > 0 ? onPrint({ x: 50, y: 43 }) : { x: l.x, y: l.y };
    const t = smoothstep(r);
    pos = {
      left: `${lerp(from.x, l.potionX, t).toFixed(1)}px`,
      top: `${(lerp(from.y, l.potionY, t) - 30 * Math.sin(t * Math.PI)).toFixed(1)}px`,
    };
  }
  return {
    ...pos,
    transform: `translate(-50%, -50%) scale(${easeOutBack(r).toFixed(4)})`,
    filter: `brightness(${(0.35 + 0.65 * r).toFixed(3)})`,
    pointerEvents: r > 0.5 ? 'auto' : 'none',
  };
});

const potionHaloStyle = computed<CSSProperties>(() => ({
  opacity: (0.5 + 0.5 * reveal.value).toFixed(4),
  transform: `scale(${(0.9 + 0.2 * reveal.value).toFixed(4)})`,
}));

const vignetteStyle = computed<CSSProperties>(() => {
  const l = layout.value;
  return {
    opacity: reveal.value.toFixed(4),
    '--bloom-x': l ? `${l.x.toFixed(1)}px` : `${PRINT.x}%`,
    '--bloom-y': l ? `${(l.y - 20).toFixed(1)}px` : '45%',
  } as CSSProperties;
});

/* ---------------- particles ---------------- */
const particleMode = computed<'bubbles' | 'sparkles'>(() => (p.value >= 0.85 && !final.value ? 'sparkles' : 'bubbles'));
const particleActive = computed(() => props.active && p.value >= 0.55 && !final.value);
const particleIntensity = computed(() => (particleMode.value === 'sparkles' ? 0.35 : 0.9 * brew.value));
</script>

<style scoped>
.altar-scene {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  color: var(--bone);
  font-family: var(--font-body);
}

/* shared hotspot base: 44px min touch target, crimson focus ring */
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
  outline: 2px solid var(--crimson-text);
  outline-offset: 3px;
}

/* ---------- reveal bloom (fades out well inside the stage edges) ---------- */
.altar-scene__vignette {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: radial-gradient(ellipse 36% 46% at var(--bloom-x, 70%) var(--bloom-y, 45%), rgba(179, 32, 43, 0.22), transparent 100%);
}

/* ---------- magic circle (behind the print) ---------- */
.altar-scene__circle-hotspot {
  position: absolute;
  z-index: 1;
  width: min(480px, 62%);
  aspect-ratio: 1;
  padding: 0;
  border-radius: 50%;
}
.altar-scene__circle-hotspot::before {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--crimson-text), var(--crimson-deep) 70%);
  content: '';
  transform: rotate(var(--circle-spin, 0deg));
  mask-image: var(--circle-mask);
  -webkit-mask-image: var(--circle-mask);
  mask-position: center;
  mask-repeat: no-repeat;
  mask-size: contain;
  mask-mode: luminance;
  -webkit-mask-position: center;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: contain;
}

/* ---------- the print: a paper photograph of the in-game screen ---------- */
.print {
  position: absolute;
  z-index: 3;
  width: min(440px, 54%);
  padding: 11px 11px 0;
  border-radius: 3px;
  background: var(--paper);
  box-shadow: var(--shadow-deep), 0 2px 6px rgba(0, 0, 0, 0.5);
  will-change: transform, opacity;
}

/* a strip of tape holding it to the board */
.print::before {
  position: absolute;
  z-index: 2;
  top: -11px;
  left: 50%;
  width: 92px;
  height: 22px;
  background: rgba(232, 224, 207, 0.55);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  content: '';
  transform: translateX(-50%) rotate(2.5deg);
}

.gui {
  position: relative;
  aspect-ratio: 350 / 284;
  overflow: hidden;
  border-radius: 2px;
  background: var(--fog-0);
}
/* The capture is cropped to its centre 350 px (x = 143..493 of 636): exactly
   what a centred cover fit of the full-height image shows. */
.gui__img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 50%;
  image-rendering: pixelated;
  -webkit-user-drag: none;
}

.print__caption {
  margin: 0;
  padding: 11px 2px 12px;
  color: var(--paper-ink-muted);
  font: 500 0.7rem/1.2 var(--font-mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.gui__confirm {
  position: absolute;
  z-index: 2;
  width: 34px;
  height: 34px;
  border: 1px solid rgba(229, 84, 93, 0.7);
  border-radius: 6px;
  background: rgba(179, 32, 43, 0.28);
  pointer-events: none;
  will-change: transform, opacity;
}

.gui__zone {
  position: absolute;
  z-index: 2;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 4px;
  /* zone styles give the centre of each slot group */
  transform: translate(-50%, -50%);
  transition: border-color 0.2s ease, background-color 0.2s ease;
}
.gui__zone:hover,
.gui__zone:focus-visible {
  border-color: var(--crimson-text);
  background: var(--crimson-tint);
  box-shadow: 0 0 0 3px rgba(179, 32, 43, 0.25);
}

/* ---------- flying / resting ingredients ---------- */
.item {
  position: absolute;
  display: grid;
  place-items: center;
  padding: 2px;
  border: 1px solid transparent;
  border-radius: 4px;
  will-change: transform, opacity;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}
.item__icon {
  width: 46px;
  height: 46px;
  object-fit: contain;
  image-rendering: pixelated;
  -webkit-user-drag: none;
  filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.55));
}
.item:hover,
.item:focus-visible {
  border-color: var(--crimson-text);
  background: rgba(13, 15, 20, 0.85);
}
.item.is-rested .item__icon {
  width: 26px;
  height: 26px;
}
.item.is-rested:hover,
.item.is-rested:focus-visible {
  background: transparent;
}

/* ---------- bubbles FX (positioned over the cauldron) ---------- */
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
  border-radius: 50%;
  will-change: transform, opacity, filter;
}
.altar-scene__halo {
  position: absolute;
  inset: -24px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(229, 84, 93, 0.45), rgba(179, 32, 43, 0.16) 46%, transparent 72%);
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
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6));
  animation: potion-float 3.4s ease-in-out infinite;
}
@keyframes potion-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
.altar-scene__caption {
  position: absolute;
  top: calc(100% + 2px);
  left: 50%;
  width: max-content;
  max-width: 220px;
  color: var(--bone);
  font: 500 0.7rem/1.3 var(--font-mono);
  letter-spacing: 0.12em;
  text-align: center;
  text-transform: uppercase;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.9);
  transform: translateX(-50%);
}

/* ---------- reduced motion: final composed state, no loops ---------- */
@media (prefers-reduced-motion: reduce) {
  .altar-scene__potion-img {
    animation: none;
  }
  .item,
  .gui__zone {
    transition: none;
  }
}
</style>
