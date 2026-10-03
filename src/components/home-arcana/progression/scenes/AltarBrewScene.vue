<template>
  <div ref="sceneRef" class="altar-scene" :style="sceneVars" role="group" :aria-label="tp('altar.sceneLabel')">
    <!-- soul-fire light pooled on the floor, crimson once the brew takes -->
    <div class="altar-scene__bloom" :style="bloomStyle" aria-hidden="true" />

    <!-- The brewing circle lies on the floor under the cauldron (hotspot). -->
    <button
      type="button"
      class="hotspot altar-scene__circle"
      :style="circleStyle"
      :aria-label="tp('altar.circleLabel')"
      @mouseenter="inspect('brew-circle', $event)"
      @mouseleave="emit('clear-inspect')"
      @focus="inspect('brew-circle', $event)"
      @blur="emit('clear-inspect')"
      @click="inspect('brew-circle', $event)"
    />

    <!-- A Magic Cauldron in the world: pixel layers, recoloured as it brews. -->
    <div class="cauldron" :style="cauldronStyle" aria-hidden="true">
      <span class="cauldron__fire" />
      <img class="cauldron__layer" :src="cauldronWell" alt="" width="320" height="336" decoding="async" draggable="false" />
      <span class="cauldron__liquid">
        <span v-for="ripple in ripples" :key="ripple.id" class="cauldron__ripple" :style="ripple.style" />
        <img class="cauldron__layer cauldron__surface" :src="cauldronSurface" alt="" width="320" height="336" decoding="async" draggable="false" />
      </span>
      <img class="cauldron__layer" :src="cauldronBody" alt="" width="320" height="336" decoding="async" draggable="false" />
      <span class="cauldron__rimlight" />
    </div>

    <!-- bubbles popping on the brew, and its steam -->
    <div class="altar-scene__fx altar-scene__fx--steam" :style="steamBoxStyle" aria-hidden="true">
      <SceneParticles mode="steam" :active="steamActive" :intensity="steamIntensity" />
    </div>
    <div class="altar-scene__fx altar-scene__fx--bubbles" :style="bubbleBoxStyle" aria-hidden="true">
      <SceneParticles mode="brew" :active="bubblesActive" :intensity="bubbleIntensity" :tint="bubbleTint" />
    </div>

    <!-- The real in-game cauldron screen, printed and pinned like evidence. -->
    <div class="print" :style="printStyle">
      <div ref="guiRef" class="gui" role="group" :aria-label="tp('altar.interfaceLabel')">
        <img class="gui__img" :src="cauldronInterface" alt="" width="636" height="284" decoding="async" draggable="false" />

        <!-- the confirm slot lights as the brew is started -->
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

    <!-- ingredients: book -> slots (infuse), then slots -> cauldron (brew) -->
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

    <!-- splashes where each ingredient hits the brew -->
    <div class="altar-scene__splashes" aria-hidden="true">
      <i v-for="texel in splashTexels" :key="texel.id" class="splash" :style="texel.style" />
    </div>

    <!-- the brew takes: a column of light, then the potion rises out of it -->
    <div class="altar-scene__beam" :style="beamStyle" aria-hidden="true" />
    <div class="altar-scene__fx altar-scene__fx--burst" :style="burstBoxStyle" aria-hidden="true">
      <SceneParticles mode="burst" :active="burstActive" :intensity="1" />
    </div>

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
        <span class="altar-scene__caption" :style="captionStyle" aria-hidden="true">{{ tp('altar.potionCaption') }}</span>
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
import cauldronBody from '@/assets/images/home/progression/cauldron/cauldron-body.png';
import cauldronWell from '@/assets/images/home/progression/cauldron/cauldron-well.png';
import cauldronSurface from '@/assets/images/home/progression/cauldron/cauldron-surface.png';
import soulFire from '@/assets/images/home/progression/cauldron/soul-fire.png';
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
export type BrewHandoff = {
  /** Where the finished potion floats (stage px): the player takes it here. */
  potion: { x: number; y: number };
  /** The cauldron's footing: the player stands on the same spot. */
  floor: { x: number; y: number };
  circleW: number;
  w: number;
  h: number;
};
const emit = defineEmits<{
  (e: 'inspect', id: string, anchor: HTMLElement): void;
  (e: 'clear-inspect'): void;
  (e: 'handoff', value: BrewHandoff): void;
}>();

const reduced = useReducedMotion();
const { tp } = useProgressionCopy();

/*
 * Local beats (0..1 of this scene; ProgressionStoryV3 starts "Brew" at 0.43):
 *   0.00-0.41  infuse: the ingredients lift off the pages and hover while the
 *              book closes and slides clear; the print arrives in its place
 *              and they fly into the cauldron screen's slots
 *   0.26-0.47  the cauldron rises out of the fog as the book sinks into it, the soul
 *              fire catches and the screen's confirm slot lights
 *   0.45-0.70  one by one the ingredients leave their slots and drop into the
 *              brew: each one splashes and changes its colour
 *   0.72-0.86  the boil: steam, a blazing circle, the brew turns to light
 *   0.85-0.96  a column of light, and the Sequence 9 potion rises out of it
 *   0.92-0.99  the cauldron, its circle and the print sink back into the fog,
 *              leaving the potion alone where the player takes it next chapter
 */
const BEAT = {
  printIn: [0.17, 0.1],
  cauldronIn: [0.255, 0.13],
  press: [0.42, 0.05],
  heat: [0.44, 0.4],
  boil: [0.72, 0.12],
  flash: 0.85,
  reveal: [0.86, 0.1],
  settle: [0.9, 0.08],
  // the cauldron sinks back into the fog; the potion is left floating alone
  exit: [0.925, 0.06],
} as const;

/* The print sits at the right of the stage, pinned slightly askew. */
const PRINT = { x: 71, y: 52, tiltDeg: -1.4 };
const TILT = (PRINT.tiltDeg * Math.PI) / 180;

/* Liquid plane of the cauldron art (cauldron/*.png, 320 x 336): % of the image. */
const ART = { ratio: 336 / 320, liquidY: 0.369, liquidHalfW: 0.375, liquidHalfH: 0.1785, footY: 0.7619 };

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
const beat = (window: readonly [number, number]) => (final.value ? 1 : smoothstep(clamp01((p.value - window[0]) / window[1])));

/* ---------------- phase drivers ---------------- */
const altarIn = computed(() => beat(BEAT.printIn));
const cauldronIn = computed(() => beat(BEAT.cauldronIn));
const heat = computed(() => beat(BEAT.heat));
const boil = computed(() => (final.value ? 0 : beat(BEAT.boil)));
const reveal = computed(() => (final.value ? 1 : clamp01((p.value - BEAT.reveal[0]) / BEAT.reveal[1])));
const settle = computed(() => beat(BEAT.settle));
const exit = computed(() => (final.value ? 0 : beat(BEAT.exit)));
// a sharp spike as the brew takes, gone by the time the potion is up
const flash = computed(() => {
  if (final.value) return 0;
  const rise = clamp01((p.value - (BEAT.flash - 0.02)) / 0.025);
  const fall = 1 - clamp01((p.value - (BEAT.flash + 0.01)) / 0.06);
  return rise * fall;
});

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
 * Stage composition, sized from the scene box so the print, the cauldron, the
 * floor circle (and its glow) and the potion all stay inside the stage at
 * every viewport. The cauldron stands where the book was and where the player
 * will stand next chapter, so the potion is handed straight across.
 */
const EDGE = 24;
const layout = computed(() => {
  const { w, h } = geom.value;
  if (w <= 0 || h <= 0) return null;
  const cw = Math.max(170, Math.min(300, w * 0.3, h * 0.44));
  const ch = cw * ART.ratio;
  const circleW = Math.min(cw * 1.7, w * 0.5);
  const circleH = circleW * 0.5;
  const fx = Math.max(circleW / 2 + EDGE, w * 0.31);
  // the print keeps clear of the cauldron standing to its left
  const room = w - (fx + cw / 2) - EDGE - 20;
  const print = Math.min(440, w * 0.46, room);
  const x = Math.max(fx + cw / 2 + 12 + print / 2, Math.min(w * (PRINT.x / 100), w - print / 2 - EDGE - 8));
  const y = h * (PRINT.y / 100);
  const fy = h - Math.max(circleH / 2 + EDGE, h * 0.13);
  const top = fy - ART.footY * ch;
  const liquid = { x: fx, y: top + ART.liquidY * ch };
  return {
    print, x, y,
    cw, ch, circleW, circleH, fx, fy, top, liquid,
    potion: { x: fx, y: Math.max(h * 0.2, Math.min(h * 0.42, top - 34)) },
  };
});

watch(layout, (l) => {
  if (!l) return;
  emit('handoff', {
    potion: { ...l.potion },
    floor: { x: l.fx, y: l.fy },
    circleW: l.circleW,
    w: geom.value.w,
    h: geom.value.h,
  });
}, { immediate: true });

// The print moves when the stage is resized: re-measure the screen after it.
watch(
  () => (layout.value ? `${layout.value.x.toFixed(1)},${layout.value.y.toFixed(1)},${layout.value.print.toFixed(1)}` : ''),
  () => requestAnimationFrame(syncGeom),
);

/* ---------------- the brew's colour ---------------- */
type Rgb = readonly [number, number, number];
const WATER: Rgb = [34, 52, 66];
const LIGHT: Rgb = [226, 236, 230];
const SPENT: Rgb = [58, 66, 70];

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}
function css(c: Rgb, alpha = 1): string {
  return `rgba(${c.map((v) => Math.round(v)).join(', ')}, ${alpha.toFixed(3)})`;
}

/* ---------------- print ---------------- */
const printStyle = computed<CSSProperties>(() => {
  const inValue = altarIn.value;
  const l = layout.value;
  // dimmed once its ingredients have gone into the cauldron; it is evidence now
  const dim = final.value ? 1 : (1 - 0.42 * beat([0.52, 0.2]) - 0.25 * beat([0.86, 0.06])) * (1 - exit.value);
  return {
    left: l ? `${l.x.toFixed(1)}px` : `${PRINT.x}%`,
    top: l ? `${l.y.toFixed(1)}px` : `${PRINT.y}%`,
    width: l ? `${l.print.toFixed(1)}px` : undefined,
    // opaque early: it is laid over the closing book, not seen through it
    opacity: (clamp01(inValue * 2.5) * dim).toFixed(4),
    // slides in a short way inside the stage, never from beyond its edge
    transform: `translate(-50%, -50%) translate(${((1 - inValue) * 36 + exit.value * 28).toFixed(1)}px, ${(exit.value * 24).toFixed(1)}px) rotate(${(PRINT.tiltDeg - exit.value * 2).toFixed(2)}deg) scale(${(0.94 + 0.06 * inValue - 0.05 * exit.value).toFixed(4)})`,
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

// "Brew" pressed on the screen: the confirm slot lights, then goes out.
const confirmStyle = computed<CSSProperties>(() => {
  const on = beat(BEAT.press) * (final.value ? 1 : 1 - beat([0.74, 0.1]));
  return {
    left: `${SLOT_C.x.toFixed(2)}%`,
    top: `${SLOT_C.y.toFixed(2)}%`,
    opacity: (on * 0.95).toFixed(4),
    transform: `translate(-50%, -50%) scale(${(0.7 + 0.45 * on).toFixed(4)})`,
    boxShadow: `0 0 ${(6 + 16 * on).toFixed(1)}px ${(3 + 4 * on).toFixed(1)}px rgba(229, 84, 93, ${(0.5 * on).toFixed(3)})`,
  };
});

/* ---------------- ingredients ---------------- */
const LIFT_SPAN = 0.06;
const HOVER_PX = 58;
const FLIGHT_SPAN = 0.11;
const ARC_PX = 42;
const DROP_SPAN = 0.085;

type ItemSpec = {
  id: string;
  labelKey: string;
  asset: string;
  stagger: number; // lifts off the page
  fly: number; // leaves its hover for the slot
  bookX: number; // normalised position inside the 680 x 548 book viewport
  bookY: number;
  slot: Point; // % of the screen capture
  drop: number; // when it leaves its slot for the cauldron
  splash: Point; // where it lands, in cauldron widths from the liquid centre
  tint: Rgb; // the brew's colour once it is in
  fleck: Rgb; // its splash
};

const ITEMS: ItemSpec[] = [
  // Positions match the icons painted onto the physical book leaves. All four
  // leave the pages before the print (which is laid over the book) covers
  // them, and head for slots it carries in with it.
  // Loading order follows the in-game guide: main ingredients (left slots),
  // supplementary ingredients (right slots), then the recipe in the centre.
  { id: 'lavos-squid-blood', labelKey: 'ingredients.lavosSquidBlood', asset: lavosSquidBlood, stagger: 0.08, fly: 0.22, bookX: 0.2226, bookY: 0.3071, slot: SLOT_M1, drop: 0.455, splash: { x: -0.1, y: 0.02 }, tint: [104, 18, 28], fleck: [205, 52, 44] },
  { id: 'stellar-aqua-crystal', labelKey: 'ingredients.stellarAquaCrystal', asset: stellarAquaCrystal, stagger: 0.09, fly: 0.245, bookX: 0.2226, bookY: 0.4374, slot: SLOT_M2, drop: 0.505, splash: { x: 0.09, y: -0.02 }, tint: [68, 34, 88], fleck: [186, 160, 198] },
  { id: 'gold-mint-leaves', labelKey: 'ingredients.goldMintLeaves', asset: goldMintLeaves, stagger: 0.1, fly: 0.27, bookX: 0.5537, bookY: 0.3071, slot: SLOT_S1, drop: 0.555, splash: { x: -0.03, y: -0.04 }, tint: [40, 74, 56], fleck: [92, 190, 70] },
  { id: 'formula-fool', labelKey: 'ingredients.formula', asset: foolRecipe, stagger: 0.11, fly: 0.295, bookX: 0.5547, bookY: 0.7299, slot: SLOT_R, drop: 0.605, splash: { x: 0.04, y: 0.03 }, tint: [150, 22, 34], fleck: [236, 230, 218] },
];
const impactAt = (spec: ItemSpec) => spec.drop + DROP_SPAN;

/** Mirrors FormulaBookScene's .book-viewport box (and the book's slide left). */
function bookSource(spec: ItemSpec, geometry: typeof geom.value, shift = props.bookShift): Point {
  const marginTop = Math.min(46, Math.max(22, innerHeight * 0.05));
  const viewportW = Math.max(0, Math.min(680, geometry.w, (geometry.h - marginTop - 8) * 1.24));
  const viewportH = viewportW / 1.24;
  const viewportLeft = (geometry.w - viewportW) / 2 - geometry.w * shift;
  const viewportTop = (geometry.h - viewportH - marginTop) / 2 + marginTop;
  return {
    x: viewportLeft + viewportW * spec.bookX,
    y: viewportTop + viewportH * spec.bookY,
  };
}

function impactPoint(spec: ItemSpec): Point | null {
  const l = layout.value;
  if (!l) return null;
  return { x: l.liquid.x + spec.splash.x * l.cw, y: l.liquid.y + spec.splash.y * l.cw };
}

type FlightItem = ItemSpec & {
  label: string;
  rested: boolean;
  style: CSSProperties;
};

const items = computed<FlightItem[]>(() => {
  const g = geom.value;
  const unmeasured = g.w <= 0 || g.guiW <= 0;
  return ITEMS.map((spec) => {
    const label = tp(spec.labelKey);
    if (unmeasured) {
      return { ...spec, label, rested: false, style: { opacity: 0, pointerEvents: 'none' } };
    }
    const target = onPrint(spec.slot);
    const landing = impactPoint(spec);
    // second flight: lifted out of the slot, over, and into the brew
    const d = final.value || !landing ? 0 : clamp01((p.value - spec.drop) / DROP_SPAN);
    if (d > 0 && landing) {
      const e = d * d * (3 - 2 * d) * 0.35 + d * d * 0.65; // eases out of the slot, falls in
      const peak = Math.min(target.y, landing.y) - 70 - Math.abs(target.x - landing.x) * 0.12;
      const x = lerp(target.x, landing.x, e);
      const y = (1 - e) * (1 - e) * target.y + 2 * (1 - e) * e * peak + e * e * landing.y;
      const scale = d < 0.3 ? lerp(0.62, 1.05, d / 0.3) : lerp(1.05, 0.38, (d - 0.3) / 0.7);
      const glow = Math.sin(d * Math.PI);
      return {
        ...spec,
        label,
        rested: false,
        style: {
          left: `${x.toFixed(2)}px`,
          top: `${y.toFixed(2)}px`,
          transform: `translate(-50%, -50%) scale(${scale.toFixed(4)}) rotate(${(d * 200).toFixed(1)}deg)`,
          opacity: (1 - clamp01((d - 0.9) / 0.1)).toFixed(4),
          pointerEvents: 'none',
          zIndex: '9',
          filter: `drop-shadow(0 0 ${(4 + 10 * glow).toFixed(1)}px rgba(236, 230, 218, ${(0.5 * glow).toFixed(3)}))`,
        },
      };
    }
    // first it lifts off the page (following it as the book starts to move),
    // then hangs in the air, free of the book, until the screen is in place
    const a = final.value ? 1 : smoothstep(clamp01((p.value - spec.stagger) / LIFT_SPAN));
    const onPage = bookSource(spec, g);
    const still = bookSource(spec, g, 0);
    const hover = {
      x: lerp(onPage.x, still.x, a),
      y: lerp(onPage.y, still.y - HOVER_PX, a) + Math.sin((p.value + spec.stagger) * 90) * 3 * a,
    };
    // then flies into its slot
    const f = final.value ? 1 : clamp01((p.value - spec.fly) / FLIGHT_SPAN);
    const e = smoothstep(f);
    const x = lerp(hover.x, target.x, e);
    const y = lerp(hover.y, target.y, e) - ARC_PX * Math.sin(f * Math.PI);
    const slotBlend = smoothstep(clamp01((f - 0.42) / 0.58));
    const scale = (1.15 - 0.15 * f) * (1 - 0.38 * slotBlend);
    const rotate = (1 - f) * 7 + f * PRINT.tiltDeg;
    const trail = a * (1 - f);
    // the seated icon lifts as the brew is started, a beat before it leaves
    const ready = final.value ? 0 : clamp01((p.value - (spec.drop - 0.03)) / 0.03);
    const style: CSSProperties = {
      left: `${x.toFixed(2)}px`,
      top: `${(y - ready * 4).toFixed(2)}px`,
      transform: `translate(-50%, -50%) scale(${(scale * (1 + 0.12 * ready)).toFixed(4)}) rotate(${rotate.toFixed(2)}deg)`,
      opacity: clamp01(a * 14).toFixed(4),
      pointerEvents: a > 0 ? 'auto' : 'none',
      zIndex: String(f >= 1 ? 8 : 9),
      // A pale spirit trail while in flight; a crimson cue as it is called.
      filter: trail > 0.02
        ? `drop-shadow(0 0 ${(6 + 10 * trail).toFixed(1)}px rgba(236, 230, 218, ${(0.55 * trail).toFixed(3)}))`
        : ready > 0
          ? `drop-shadow(0 0 ${(8 * ready).toFixed(1)}px rgba(229, 84, 93, ${(0.8 * ready).toFixed(3)}))`
          : undefined,
    };
    return { ...spec, label, rested: f >= 1, style };
  });
});

/* The brew's colour: water, then each ingredient's tint as it lands, then light. */
const liquidColor = computed<Rgb>(() => {
  if (final.value) return SPENT;
  let color = WATER;
  for (const spec of ITEMS) {
    color = mix(color, spec.tint, smoothstep(clamp01((p.value - impactAt(spec)) / 0.03)));
  }
  color = mix(color, LIGHT, boil.value);
  return mix(color, SPENT, settle.value);
});

/* splash texels and surface ripples, scrubbed by scroll */
const SPLASH_TEXELS = [
  { vx: -46, vy: 64, s: 7 }, { vx: -20, vy: 92, s: 6 }, { vx: 8, vy: 104, s: 8 },
  { vx: 30, vy: 80, s: 6 }, { vx: 52, vy: 58, s: 7 }, { vx: -2, vy: 70, s: 5 },
];
const SPLASH_SPAN = 0.05;
const splashTexels = computed(() => {
  const out: { id: string; style: CSSProperties }[] = [];
  if (final.value) return out;
  for (const spec of ITEMS) {
    const s = clamp01((p.value - impactAt(spec)) / SPLASH_SPAN);
    if (s <= 0 || s >= 1) continue;
    const origin = impactPoint(spec);
    if (!origin) continue;
    SPLASH_TEXELS.forEach((texel, index) => {
      const x = origin.x + texel.vx * s;
      const y = origin.y - texel.vy * s + 150 * s * s;
      out.push({
        id: `${spec.id}-${index}`,
        style: {
          width: `${texel.s}px`,
          height: `${texel.s}px`,
          background: css(index % 2 ? spec.fleck : mix(spec.fleck, LIGHT, 0.4)),
          transform: `translate3d(${(x - texel.s / 2).toFixed(1)}px, ${(y - texel.s / 2).toFixed(1)}px, 0)`,
          opacity: (1 - s * s).toFixed(3),
        },
      });
    });
  }
  return out;
});

const ripples = computed(() => {
  const l = layout.value;
  if (!l || final.value) return [];
  return ITEMS.map((spec) => {
    const s = clamp01((p.value - impactAt(spec)) / 0.07);
    // ripple centre in % of the cauldron box
    const cx = 50 + spec.splash.x * 100;
    const cy = ART.liquidY * 100 + (spec.splash.y * l.cw / l.ch) * 100;
    return {
      id: spec.id,
      style: {
        left: `${cx.toFixed(2)}%`,
        top: `${cy.toFixed(2)}%`,
        opacity: (s > 0 && s < 1 ? (1 - s) * 0.9 : 0).toFixed(3),
        transform: `translate(-50%, -50%) scale(${(0.15 + s * 1.1).toFixed(3)}, ${((0.15 + s * 1.1) * 0.5).toFixed(3)})`,
      } as CSSProperties,
    };
  });
});

/* ---------------- cauldron ---------------- */
// Light thrown by the brew and the fire; read by the stylesheet.
const sceneVars = computed(() => {
  const c = liquidColor.value;
  const fire = cauldronIn.value * (final.value ? 0.4 : 0.45 + 0.55 * heat.value - 0.35 * settle.value);
  const glow = final.value ? 0.25 : clamp01(0.15 + 0.35 * heat.value + 0.6 * boil.value + 0.8 * flash.value - 0.6 * settle.value);
  return {
    '--liquid': css(c),
    '--liquid-glow': css(mix(c, LIGHT, 0.35), 1),
    '--glow': glow.toFixed(4),
    '--fire': fire.toFixed(4),
    '--fire-sprite': `url(${soulFire})`,
  } as CSSProperties;
});

const cauldronStyle = computed<CSSProperties>(() => {
  const l = layout.value;
  const rise = cauldronIn.value;
  if (!l) return { opacity: 0 };
  // a shudder through the boil, still once it has settled
  const shake = final.value ? 0 : boil.value * (1 - settle.value) * Math.sin(p.value * 2400) * 2.2;
  return {
    left: `${(l.fx - l.cw / 2).toFixed(1)}px`,
    top: `${l.top.toFixed(1)}px`,
    width: `${l.cw.toFixed(1)}px`,
    height: `${l.ch.toFixed(1)}px`,
    opacity: (rise * (1 - exit.value)).toFixed(4),
    transform: `translate3d(${shake.toFixed(2)}px, ${((1 - rise) * 46 + exit.value * 54).toFixed(1)}px, 0)`,
  };
});

const circleStyle = computed<CSSProperties>(() => {
  const l = layout.value;
  const inValue = cauldronIn.value;
  const blaze = clamp01(0.25 + 0.4 * heat.value + 0.5 * boil.value + flash.value - 0.45 * settle.value);
  const rotation = final.value ? 100 : p.value * 160 + boil.value * 120;
  return {
    left: l ? `${l.fx.toFixed(1)}px` : '31%',
    top: l ? `${l.fy.toFixed(1)}px` : '80%',
    width: l ? `${l.circleW.toFixed(1)}px` : undefined,
    '--circle-mask': `url(${magicCircle})`,
    '--circle-spin': `${rotation.toFixed(2)}deg`,
    opacity: (inValue * (0.35 + 0.65 * blaze) * (1 - exit.value)).toFixed(4),
    transform: `translate(-50%, -50%) scale(${(0.84 + 0.16 * inValue).toFixed(4)}, ${((0.84 + 0.16 * inValue) * 0.5).toFixed(4)})`,
    pointerEvents: inValue > 0.4 && exit.value < 0.5 ? 'auto' : 'none',
  } as CSSProperties;
});

const bloomStyle = computed<CSSProperties>(() => {
  const l = layout.value;
  return {
    opacity: (cauldronIn.value * (0.4 + 0.6 * heat.value) * (1 - exit.value)).toFixed(4),
    '--bloom-x': l ? `${l.fx.toFixed(1)}px` : '31%',
    '--bloom-y': l ? `${l.fy.toFixed(1)}px` : '80%',
  } as CSSProperties;
});

/* ---------------- FX boxes ---------------- */
function box(left: number, top: number, width: number, height: number): CSSProperties {
  const { w, h } = geom.value;
  const x = Math.max(0, left);
  const y = Math.max(0, top);
  return {
    left: `${x.toFixed(1)}px`,
    top: `${y.toFixed(1)}px`,
    width: `${Math.max(0, Math.min(w - x, width - (x - left))).toFixed(1)}px`,
    height: `${Math.max(0, Math.min(h - y, height - (y - top))).toFixed(1)}px`,
  };
}
const steamBoxStyle = computed<CSSProperties>(() => {
  const l = layout.value;
  if (!l) return { opacity: 0 };
  const height = l.liquid.y - 8;
  return { ...box(l.fx - l.cw * 0.75, 8, l.cw * 1.5, height), opacity: (cauldronIn.value * (1 - 0.6 * settle.value) * (1 - exit.value)).toFixed(4) };
});
const bubbleBoxStyle = computed<CSSProperties>(() => {
  const l = layout.value;
  if (!l) return { opacity: 0 };
  const height = l.cw * 0.5;
  return box(l.fx - l.cw * 0.4, l.liquid.y + l.ch * 0.12 - height, l.cw * 0.8, height);
});
const burstBoxStyle = computed<CSSProperties>(() => {
  const l = layout.value;
  if (!l) return { opacity: 0 };
  const size = Math.min(l.cw * 1.4, l.liquid.y * 1.6);
  return box(l.fx - size / 2, l.liquid.y - size * 0.62, size, size);
});

const bubbleTint = computed<Rgb>(() => mix(liquidColor.value, LIGHT, 0.45));
const bubblesActive = computed(() => props.active && !final.value && p.value >= 0.44 && p.value < 0.97);
const bubbleIntensity = computed(() => clamp01(0.25 + 0.5 * heat.value + 0.5 * boil.value - 0.6 * settle.value));
const steamActive = computed(() => props.active && !final.value && p.value >= 0.5);
const steamIntensity = computed(() => clamp01(0.2 + 0.3 * heat.value + 0.6 * boil.value - 0.5 * settle.value));
const burstActive = computed(() => props.active && !final.value && p.value >= BEAT.flash - 0.005 && p.value < 0.97);

/* ---------------- the brew takes ---------------- */
const beamStyle = computed<CSSProperties>(() => {
  const l = layout.value;
  if (!l) return { opacity: 0 };
  const on = final.value ? 0 : clamp01(flash.value * 1.2 + 0.5 * reveal.value * (1 - settle.value));
  return {
    left: `${l.fx.toFixed(1)}px`,
    top: '6px',
    width: `${(l.cw * 0.62).toFixed(1)}px`,
    height: `${Math.max(0, l.liquid.y - 6).toFixed(1)}px`,
    opacity: on.toFixed(4),
    transform: `translateX(-50%) scaleY(${(0.25 + 0.75 * clamp01(on * 1.4)).toFixed(4)})`,
  };
});

const revealWrapStyle = computed<CSSProperties>(() => ({
  opacity: clamp01(reveal.value * 3).toFixed(4),
}));

// The potion rises out of the brew to where the player takes it next chapter.
const potionStyle = computed<CSSProperties>(() => {
  const r = reveal.value;
  const l = layout.value;
  let pos: CSSProperties = { left: '31%', top: '42%' };
  if (l) {
    const t = 1 - (1 - r) ** 3;
    pos = {
      left: `${l.potion.x.toFixed(1)}px`,
      top: `${lerp(l.liquid.y, l.potion.y, t).toFixed(1)}px`,
    };
  }
  return {
    ...pos,
    transform: `translate(-50%, -50%) scale(${(0.3 + 0.7 * easeOutBack(clamp01(r * 1.15))).toFixed(4)})`,
    filter: `brightness(${(0.6 + 0.4 * r + 0.8 * flash.value).toFixed(3)})`,
    pointerEvents: r > 0.5 ? 'auto' : 'none',
  };
});

const potionHaloStyle = computed<CSSProperties>(() => ({
  opacity: (0.5 + 0.5 * reveal.value).toFixed(4),
  transform: `scale(${(0.9 + 0.3 * reveal.value).toFixed(4)})`,
}));
// named as it surfaces, gone before the player takes it
const captionStyle = computed<CSSProperties>(() => ({
  opacity: (clamp01((reveal.value - 0.5) / 0.3) * (1 - clamp01((p.value - 0.975) / 0.02))).toFixed(4),
}));
</script>

<style scoped>
.altar-scene {
  --liquid: rgb(34, 52, 66);
  --liquid-glow: rgb(110, 130, 140);
  --glow: 0;
  --fire: 0;
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

/* ---------- floor light (fades out well inside the stage edges) ---------- */
.altar-scene__bloom {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 22% 16% at var(--bloom-x, 31%) var(--bloom-y, 80%), rgba(169, 198, 214, calc(0.16 * var(--fire))), transparent 100%),
    radial-gradient(ellipse 30% 40% at var(--bloom-x, 31%) calc(var(--bloom-y, 80%) - 18%), rgba(179, 32, 43, calc(0.3 * var(--glow))), transparent 100%);
}

/* ---------- brewing circle on the floor ---------- */
.altar-scene__circle {
  position: absolute;
  z-index: 1;
  aspect-ratio: 1;
  padding: 0;
  border-radius: 50%;
  will-change: transform, opacity;
}
.altar-scene__circle::before {
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
/* a dark contact shadow where the cauldron stands */
.altar-scene__circle::after {
  position: absolute;
  inset: 26%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 0, 0, 0.85), transparent 70%);
  content: '';
}

/* ---------- the cauldron: pixel layers ---------- */
.cauldron {
  position: absolute;
  z-index: 2;
  pointer-events: none;
  will-change: transform, opacity;
}
.cauldron__layer {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  -webkit-user-drag: none;
}
/* the liquid plane: a rhombus at the brew's level, recoloured by scroll */
.cauldron__liquid {
  position: absolute;
  inset: 0;
  overflow: hidden;
  clip-path: polygon(50% 19.05%, 87.5% 36.9%, 50% 54.76%, 12.5% 36.9%);
  background:
    radial-gradient(ellipse 30% 14% at 50% 36.9%, rgba(255, 255, 255, calc(0.08 + 0.5 * var(--glow))), transparent 100%),
    var(--liquid);
}
.cauldron__surface {
  opacity: calc(0.9 - 0.5 * var(--glow));
}
.cauldron__ripple {
  position: absolute;
  width: 46%;
  aspect-ratio: 1;
  border: 3px solid rgba(236, 230, 218, 0.7);
  border-radius: 50%;
}
/* the brew's light on the rim and the inner walls */
.cauldron__rimlight {
  position: absolute;
  inset: 0 -10% 30%;
  background: radial-gradient(ellipse 46% 40% at 50% 46%, var(--liquid-glow), transparent 72%);
  mix-blend-mode: screen;
  opacity: calc(var(--glow) * 0.75);
  pointer-events: none;
}
/* soul fire under the cauldron, seen through its legs */
.cauldron__fire {
  position: absolute;
  bottom: 0;
  left: 24%;
  width: 52%;
  height: 20%;
  -webkit-mask-image: linear-gradient(0deg, transparent, #000 35%);
  mask-image: linear-gradient(0deg, transparent, #000 35%);
  background-image: var(--fire-sprite);
  background-size: 100% 200%;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  opacity: var(--fire);
  transform: scaleY(calc(0.6 + 0.5 * var(--fire)));
  transform-origin: 50% 100%;
  animation: soul-fire 0.5s steps(1) infinite;
}
@keyframes soul-fire {
  0% { background-position: 0 0; }
  50% { background-position: 0 100%; }
}

/* ---------- the print: a paper photograph of the in-game screen ---------- */
.print {
  position: absolute;
  z-index: 3;
  width: min(440px, 46%);
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
.item.is-rested:hover,
.item.is-rested:focus-visible {
  background: transparent;
}

/* ---------- splashes, bubbles, steam ---------- */
.altar-scene__splashes {
  position: absolute;
  inset: 0;
  z-index: 7;
  pointer-events: none;
}
.splash {
  position: absolute;
  top: 0;
  left: 0;
  will-change: transform, opacity;
}
.altar-scene__fx {
  position: absolute;
  pointer-events: none;
}
.altar-scene__fx--steam { z-index: 1; }
.altar-scene__fx--bubbles { z-index: 4; }
.altar-scene__fx--burst { z-index: 11; }

/* ---------- the column of light as the brew takes ---------- */
.altar-scene__beam {
  position: absolute;
  z-index: 5;
  background:
    linear-gradient(90deg, transparent 30%, rgba(236, 230, 218, 0.5) 46%, rgba(255, 255, 255, 0.85) 50%, rgba(236, 230, 218, 0.5) 54%, transparent 70%),
    radial-gradient(ellipse 50% 100% at 50% 100%, rgba(229, 84, 93, 0.55), rgba(179, 32, 43, 0.18) 55%, transparent 80%);
  -webkit-mask-image: linear-gradient(0deg, #000 30%, transparent);
  mask-image: linear-gradient(0deg, #000 30%, transparent);
  mix-blend-mode: screen;
  transform-origin: 50% 100%;
  pointer-events: none;
  will-change: transform, opacity;
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
  inset: -30px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(236, 230, 218, 0.4), rgba(229, 84, 93, 0.3) 34%, rgba(179, 32, 43, 0.12) 54%, transparent 72%);
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
}
.altar-scene__caption {
  position: absolute;
  top: calc(100% + 4px);
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
  .cauldron__fire {
    animation: none;
  }
  .item,
  .gui__zone {
    transition: none;
  }
}
</style>
