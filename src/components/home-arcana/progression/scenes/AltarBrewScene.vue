<template>
  <div class="altar-scene" :class="{ 'is-idle': !active }" :style="sceneVars" role="group" :aria-label="tp('altar.sceneLabel')">
    <!-- soul-fire light pooled on the floor, the Pathway's colour once the brew takes -->
    <div class="altar-scene__bloom" aria-hidden="true" />

    <!-- the brewing circle on the floor under the cauldron -->
    <div class="altar-scene__circle" :style="circleStyle" aria-hidden="true" />

    <!-- steam behind the cauldron, bubbles on its brew -->
    <div class="altar-scene__fx altar-scene__fx--steam" :style="steamBoxStyle" aria-hidden="true">
      <SceneParticles mode="steam" :active="steamActive" :intensity="steamIntensity" :accent="accent" />
    </div>

    <!-- A Magic Cauldron: pixel layers, its brew recoloured by every ingredient. -->
    <button
      type="button"
      class="cauldron"
      :style="cauldronStyle"
      :aria-label="tp('altar.cauldronLabel')"
      :tabindex="interactive ? 0 : -1"
      @mouseenter="inspect('cauldron', $event)"
      @mouseleave="emit('clear-inspect')"
      @focus="inspect('cauldron', $event)"
      @blur="emit('clear-inspect')"
      @click="inspect('cauldron', $event)"
    >
      <span class="cauldron__fire" aria-hidden="true" />
      <img class="cauldron__layer" :src="cauldronWell" alt="" width="320" height="336" decoding="async" draggable="false" />
      <span class="cauldron__liquid" aria-hidden="true">
        <span v-for="ripple in ripples" :key="ripple.id" class="cauldron__ripple" :style="ripple.style" />
        <img class="cauldron__layer cauldron__surface" :src="cauldronSurface" alt="" width="320" height="336" decoding="async" draggable="false" />
      </span>
      <img class="cauldron__layer" :src="cauldronBody" alt="" width="320" height="336" decoding="async" draggable="false" />
      <span class="cauldron__rimlight" aria-hidden="true" />
    </button>

    <div class="altar-scene__fx altar-scene__fx--bubbles" :style="bubbleBoxStyle" aria-hidden="true">
      <SceneParticles mode="brew" :active="bubblesActive" :intensity="bubbleIntensity" :tint="bubbleTint" :accent="accent" />
    </div>

    <!-- The ingredients: lifted off the pages, dropped into the brew. -->
    <TransitionGroup name="drop" tag="div" class="altar-scene__drops" aria-hidden="true">
      <span v-for="item in flights" :key="item.id" class="drop" :style="item.style">
        <img v-if="item.icon" :src="item.icon" alt="" width="128" height="128" decoding="async" draggable="false" />
        <i v-else class="drop__rune" />
      </span>
    </TransitionGroup>

    <!-- splashes where each one hits the brew -->
    <div class="altar-scene__splashes" aria-hidden="true">
      <i v-for="texel in splashTexels" :key="texel.id" class="splash" :style="texel.style" />
    </div>

    <!-- the brew takes: a column of light -->
    <div class="altar-scene__beam" :style="beamStyle" aria-hidden="true" />
    <div class="altar-scene__fx altar-scene__fx--burst" :style="burstBoxStyle" aria-hidden="true">
      <SceneParticles mode="burst" :active="burstActive" :intensity="1" :accent="accent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { CSSProperties } from 'vue';
import { useReducedMotion } from '@/composables/useReducedMotion';
import SceneParticles from './SceneParticles.vue';
import { useProgressionCopy } from './useProgressionCopy';
import type { StageLayout } from '../layout';
import { CAULDRON_ART } from '../layout';
import { T, clamp01, dropStarts, ease, lerp, smooth, span } from '../timeline';
import { iconTint, mixRgb, rgbCss } from '../art';
import type { Rgb } from '../art';

import cauldronBody from '@/assets/images/home/progression/cauldron/cauldron-body.png';
import cauldronWell from '@/assets/images/home/progression/cauldron/cauldron-well.png';
import cauldronSurface from '@/assets/images/home/progression/cauldron/cauldron-surface.png';
import soulFire from '@/assets/images/home/progression/cauldron/soul-fire.png';
import magicCircle from '@/assets/images/home/progression/real/magic-circle.png';

const props = defineProps<{
  progress: number;
  layout: StageLayout | null;
  active: boolean;
  /** Ingredient icons on the book, in the book window's own px. */
  anchors: Record<string, { x: number; y: number; size: number }>;
  /** The book window's current transform (scale about the stage origin, then offset). */
  bookTransform: { s: number; tx: number; ty: number };
}>();
const emit = defineEmits<{
  (e: 'inspect', id: string, anchor: HTMLElement): void;
  (e: 'clear-inspect'): void;
}>();

const reduced = useReducedMotion();
const { tp, ingredients, card } = useProgressionCopy();
const accent = computed(() => card.value.accent);

const g = computed(() => props.progress);
const final = computed(() => reduced.value);
const at = (range: readonly [number, number]) => (final.value ? 1 : ease(g.value, range));

// the cauldron rises once the book has made room above it
const rise = computed(() => at([T.brewIn[0] + 0.03, T.brewIn[1] + 0.012]));
const boil = computed(() => (final.value ? 0 : ease(g.value, T.boil)));
const exit = computed(() => (final.value ? 0 : ease(g.value, T.cauldronOut)));
const flash = computed(() => {
  if (final.value) return 0;
  const up = clamp01((g.value - (T.brewFlash - 0.008)) / 0.008);
  const down = 1 - clamp01((g.value - (T.brewFlash + 0.004)) / 0.03);
  return up * down;
});
const settle = computed(() => (final.value ? 1 : ease(g.value, [T.brewFlash, T.potionUp[1]])));
const interactive = computed(() => props.active && rise.value > 0.9 && exit.value < 0.3);

function inspect(id: string, event: Event): void {
  if (event.currentTarget instanceof HTMLElement) emit('inspect', id, event.currentTarget);
}

/* ---------------- the ingredients' drops ---------------- */
/** When each ingredient leaves its page: spread evenly over the drop window. */
const drops = computed(() => {
  const starts = dropStarts(ingredients.value.length);
  return ingredients.value.map((item, index) => ({ ...item, start: starts[index], index }));
});

// The brew's colour: dark water, each ingredient's own colour as it lands,
// then the Pathway's colour as it boils (mixed in CSS, so it glides with --acc).
const WATER: Rgb = [28, 34, 44];
const LIGHT: Rgb = [239, 238, 243];
const tints = ref<Record<string, Rgb>>({});
watch(ingredients, (list) => {
  for (const item of list) {
    if (!item.icon || tints.value[item.key]) continue;
    const key = item.key;
    iconTint(item.icon).then((tint) => { tints.value = { ...tints.value, [key]: tint }; }).catch(() => undefined);
  }
}, { immediate: true });
const impactAt = (start: number) => start + T.dropSpan;
const liquidBase = computed<Rgb>(() => {
  let color = WATER;
  if (final.value) return mixRgb(WATER, LIGHT, 0.1);
  for (const d of drops.value) {
    const tint = tints.value[d.key] ?? [120, 110, 130];
    color = mixRgb(color, mixRgb(tint, [10, 10, 14], 0.25), smooth((g.value - impactAt(d.start)) / 0.02) * 0.7);
  }
  return color;
});

type Point = { x: number; y: number };
const liquid = computed<Point | null>(() => {
  const l = props.layout;
  return l ? { x: l.cauldron.x, y: l.cauldron.mouthY } : null;
});
/** Where each one lands on the surface (spread a little across it). */
function landing(index: number, n: number): Point | null {
  const l = props.layout;
  const c = liquid.value;
  if (!l || !c) return null;
  const spread = n > 1 ? (index / (n - 1) - 0.5) * 0.16 : 0;
  return { x: c.x + spread * l.cauldron.w, y: c.y + (index % 2 ? -0.015 : 0.015) * l.cauldron.w };
}

const flights = computed(() => {
  const l = props.layout;
  if (!l || final.value) return [];
  const { s, tx, ty } = props.bookTransform;
  const n = drops.value.length;
  const out: { id: string; icon: string | null; style: CSSProperties }[] = [];
  for (const d of drops.value) {
    const anchor = props.anchors[d.key];
    const end = landing(d.index, n);
    const t = (g.value - d.start) / T.dropSpan;
    if (!anchor || !end || t <= 0 || t >= 1) continue;
    const from = { x: anchor.x * s + tx, y: anchor.y * s + ty };
    const size = Math.max(24, anchor.size * s);
    // lifts off the page and swells, glowing...
    const lift = smooth(t / 0.24);
    const hover = { x: from.x, y: from.y - lift * Math.min(34, size * 1.2) };
    // ...then falls into the brew under its own weight, drifting to the middle
    const f = clamp01((t - 0.2) / 0.8);
    const x = lerp(hover.x, end.x, smooth(f));
    const y = hover.y + (end.y - hover.y) * f * f;
    // it keeps its size until it is over the cauldron, then sinks in
    const scale = (1 + 0.8 * lift) * lerp(1, 0.35, smooth((f - 0.62) / 0.38));
    const glow = Math.sin(Math.min(1, t * 1.25) * Math.PI);
    const spin = f * f * 140 * (d.index % 2 ? -1 : 1);
    out.push({
      id: `${card.value.id}:${d.key}`,
      icon: d.icon,
      style: {
        width: `${size.toFixed(1)}px`,
        height: `${size.toFixed(1)}px`,
        transform: `translate3d(${(x - size / 2).toFixed(1)}px, ${(y - size / 2).toFixed(1)}px, 0) scale(${scale.toFixed(4)}) rotate(${spin.toFixed(1)}deg)`,
        opacity: (1 - smooth((f - 0.9) / 0.1)).toFixed(4),
        filter: `drop-shadow(0 0 ${(4 + 12 * glow).toFixed(1)}px color-mix(in oklab, var(--acc) ${(70 * glow).toFixed(0)}%, transparent))`,
      },
    });
  }
  return out;
});

/* splash texels and surface ripples, scrubbed by scroll */
const SPLASH_TEXELS = [
  { vx: -46, vy: 64, s: 7 }, { vx: -20, vy: 92, s: 6 }, { vx: 8, vy: 104, s: 8 },
  { vx: 30, vy: 80, s: 6 }, { vx: 52, vy: 58, s: 7 }, { vx: -2, vy: 70, s: 5 },
];
const splashTexels = computed(() => {
  const out: { id: string; style: CSSProperties }[] = [];
  if (final.value) return out;
  const n = drops.value.length;
  for (const d of drops.value) {
    const s = clamp01((g.value - impactAt(d.start)) / 0.035);
    if (s <= 0 || s >= 1) continue;
    const origin = landing(d.index, n);
    if (!origin) continue;
    const tint = tints.value[d.key] ?? [200, 200, 210];
    SPLASH_TEXELS.forEach((texel, index) => {
      const x = origin.x + texel.vx * s * 0.8;
      const y = origin.y - texel.vy * s * 0.8 + 120 * s * s;
      out.push({
        id: `${d.key}-${index}`,
        style: {
          width: `${texel.s}px`,
          height: `${texel.s}px`,
          background: rgbCss(index % 2 ? tint : mixRgb(tint, LIGHT, 0.45)),
          transform: `translate3d(${(x - texel.s / 2).toFixed(1)}px, ${(y - texel.s / 2).toFixed(1)}px, 0)`,
          opacity: (1 - s * s).toFixed(3),
        },
      });
    });
  }
  return out;
});

const ripples = computed(() => {
  const l = props.layout;
  if (!l || final.value) return [];
  const n = drops.value.length;
  return drops.value.map((d) => {
    const s = clamp01((g.value - impactAt(d.start)) / 0.05);
    const spread = n > 1 ? (d.index / (n - 1) - 0.5) * 0.16 : 0;
    return {
      id: d.key,
      style: {
        left: `${(50 + spread * 100).toFixed(2)}%`,
        top: `${(CAULDRON_ART.mouthY * 100).toFixed(2)}%`,
        opacity: (s > 0 && s < 1 ? (1 - s) * 0.9 : 0).toFixed(3),
        transform: `translate(-50%, -50%) scale(${(0.15 + s * 1.1).toFixed(3)}, ${((0.15 + s * 1.1) * 0.5).toFixed(3)})`,
      } as CSSProperties,
    };
  });
});

/* ---------------- cauldron ---------------- */
const sceneVars = computed(() => {
  const l = props.layout;
  const heat = final.value ? 0.4 : clamp01(0.2 + 0.25 * span(g.value, T.drops) + 0.55 * boil.value);
  const fire = rise.value * (final.value ? 0.5 : 0.45 + 0.55 * heat) * (1 - exit.value);
  const glow = final.value ? 0.3 : clamp01(0.12 + 0.3 * heat + 0.5 * boil.value + 0.8 * flash.value - 0.35 * settle.value);
  return {
    '--liquid-base': rgbCss(liquidBase.value),
    '--accmix': `${((final.value ? 1 : boil.value) * 88).toFixed(1)}%`,
    '--glow': glow.toFixed(4),
    '--fire': fire.toFixed(4),
    '--bloom': (rise.value * (0.35 + 0.65 * heat) * (1 - exit.value)).toFixed(4),
    '--fire-sprite': `url(${soulFire})`,
    '--floor-x': l ? `${l.cauldron.x.toFixed(1)}px` : '50%',
    '--floor-y': l ? `${l.cauldron.floorY.toFixed(1)}px` : '80%',
  } as CSSProperties;
});

const cauldronStyle = computed<CSSProperties>(() => {
  const l = props.layout;
  if (!l) return { opacity: 0 };
  const c = l.cauldron;
  // a shudder through the boil, still once the potion is up
  const shake = final.value ? 0 : boil.value * (1 - settle.value) * Math.sin(g.value * 9000) * 2;
  return {
    left: `${(c.x - c.w / 2).toFixed(1)}px`,
    top: `${c.top.toFixed(1)}px`,
    width: `${c.w.toFixed(1)}px`,
    height: `${c.h.toFixed(1)}px`,
    opacity: (smooth(rise.value * 1.6) * (1 - exit.value)).toFixed(4),
    transform: `translate3d(${shake.toFixed(2)}px, ${((1 - rise.value) * 40 + exit.value * 46).toFixed(1)}px, 0)`,
    pointerEvents: interactive.value ? 'auto' : 'none',
  };
});

const circleStyle = computed<CSSProperties>(() => {
  const l = props.layout;
  if (!l) return { opacity: 0 };
  const blaze = clamp01(0.3 + 0.3 * span(g.value, T.drops) + 0.5 * boil.value + flash.value - 0.4 * settle.value);
  const rotation = final.value ? 100 : g.value * 900;
  return {
    left: `${l.cauldron.x.toFixed(1)}px`,
    top: `${l.cauldron.floorY.toFixed(1)}px`,
    width: `${l.cauldron.circleW.toFixed(1)}px`,
    '--circle-mask': `url(${magicCircle})`,
    '--circle-spin': `${rotation.toFixed(2)}deg`,
    opacity: (rise.value * (0.35 + 0.65 * blaze) * (1 - exit.value)).toFixed(4),
    transform: `translate(-50%, -50%) scale(${(0.86 + 0.14 * rise.value).toFixed(4)}, ${((0.86 + 0.14 * rise.value) * 0.5).toFixed(4)})`,
  } as CSSProperties;
});

/* ---------------- FX boxes (kept inside the stage) ---------------- */
function box(left: number, top: number, width: number, height: number): CSSProperties {
  const l = props.layout;
  const w = l?.w ?? 0;
  const h = l?.h ?? 0;
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
  const l = props.layout;
  if (!l) return { opacity: 0 };
  const c = l.cauldron;
  const height = Math.min(c.mouthY, c.w * 1.6);
  return { ...box(c.x - c.w * 0.75, c.mouthY - height, c.w * 1.5, height), opacity: (rise.value * (1 - 0.5 * settle.value) * (1 - exit.value)).toFixed(4) };
});
const bubbleBoxStyle = computed<CSSProperties>(() => {
  const l = props.layout;
  if (!l) return { opacity: 0 };
  const c = l.cauldron;
  const height = c.w * 0.5;
  // pops only on the liquid you can see through the rim, never on the walls
  return { ...box(c.x - c.w * 0.21, c.mouthY + c.h * 0.03 - height, c.w * 0.42, height), opacity: (1 - exit.value).toFixed(4) };
});
const burstBoxStyle = computed<CSSProperties>(() => {
  const l = props.layout;
  if (!l) return { opacity: 0 };
  const c = l.cauldron;
  const size = Math.min(c.w * 1.5, c.mouthY * 1.6);
  return box(c.x - size / 2, c.mouthY - size * 0.62, size, size);
});

const bubbleTint = computed<Rgb>(() => mixRgb(liquidBase.value, LIGHT, 0.45));
const bubblesActive = computed(() => props.active && !final.value && g.value >= T.drops[0] && g.value < T.cauldronOut[1]);
const bubbleIntensity = computed(() => clamp01(0.25 + 0.4 * span(g.value, T.drops) + 0.5 * boil.value - 0.5 * settle.value));
const steamActive = computed(() => props.active && !final.value && g.value >= T.drops[0] + 0.03);
const steamIntensity = computed(() => clamp01(0.2 + 0.3 * span(g.value, T.drops) + 0.6 * boil.value - 0.4 * settle.value));
const burstActive = computed(() => props.active && !final.value && g.value >= T.brewFlash - 0.004 && g.value < T.cauldronOut[1]);

const beamStyle = computed<CSSProperties>(() => {
  const l = props.layout;
  if (!l) return { opacity: 0 };
  const c = l.cauldron;
  const on = final.value ? 0 : clamp01(flash.value * 1.2 + 0.45 * span(g.value, T.potionUp) * (1 - settle.value)) * (1 - exit.value);
  const top = Math.max(0, c.mouthY - c.w * 2.2);
  return {
    left: `${c.x.toFixed(1)}px`,
    top: `${top.toFixed(1)}px`,
    width: `${(c.w * 0.62).toFixed(1)}px`,
    height: `${Math.max(0, c.mouthY - top).toFixed(1)}px`,
    opacity: on.toFixed(4),
    transform: `translateX(-50%) scaleY(${(0.25 + 0.75 * clamp01(on * 1.4)).toFixed(4)})`,
  };
});
</script>

<style scoped>
.altar-scene {
  --liquid-base: rgb(28, 34, 44);
  --accmix: 0%;
  --liquid: color-mix(in oklab, var(--acc) var(--accmix), var(--liquid-base));
  --glow: 0;
  --fire: 0;
  --bloom: 0;
  position: absolute;
  inset: 0;
  color: var(--arc-ink);
  font-family: var(--arc-body);
}

/* ---------- floor light ---------- */
.altar-scene__bloom {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: var(--bloom);
  background:
    radial-gradient(ellipse 20% 12% at var(--floor-x) var(--floor-y), rgba(169, 198, 214, calc(0.18 * var(--fire))), transparent 100%),
    radial-gradient(ellipse 30% 34% at var(--floor-x) calc(var(--floor-y) - 22%), color-mix(in oklab, var(--liquid) calc(var(--glow) * 40%), transparent), transparent 100%);
}

/* ---------- brewing circle on the floor ---------- */
.altar-scene__circle {
  position: absolute;
  aspect-ratio: 1;
  border-radius: 50%;
  pointer-events: none;
  will-change: transform, opacity;
}

.altar-scene__circle::before {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, color-mix(in oklab, var(--acc) 70%, white), var(--acc) 45%, color-mix(in oklab, var(--acc) 60%, black));
  content: '';
  transform: rotate(var(--circle-spin, 0deg));
  mask: var(--circle-mask) center / contain no-repeat;
  -webkit-mask: var(--circle-mask) center / contain no-repeat;
  /* scroll turns it every frame: rotate the composited ring rather than repaint it */
  will-change: transform;
}

/* a dark contact shadow where the cauldron stands */
.altar-scene__circle::after {
  position: absolute;
  inset: 26%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 0, 0, 0.85), transparent 70%);
  content: '';
}

/* ---------- the cauldron ---------- */
.cauldron {
  position: absolute;
  z-index: 2;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: none;
  cursor: help;
  will-change: transform, opacity;
}

/* keyboard only: a quiet accent ring, no glow (the story stays a dark room in either theme) */
.cauldron:focus-visible {
  outline: 1.5px solid color-mix(in oklab, var(--acc) 80%, #efeef3);
  outline-offset: 6px;
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

/* the liquid plane: a rhombus at the brew's level */
.cauldron__liquid {
  position: absolute;
  inset: 0;
  overflow: hidden;
  clip-path: polygon(50% 19.05%, 87.5% 36.9%, 50% 54.76%, 12.5% 36.9%);
  background:
    radial-gradient(ellipse 30% 14% at 50% 36.9%, rgba(255, 255, 255, calc(0.06 + 0.45 * var(--glow))), transparent 100%),
    var(--liquid);
}

.cauldron__surface {
  opacity: calc(0.85 - 0.5 * var(--glow));
  mix-blend-mode: soft-light;
}

.cauldron__ripple {
  position: absolute;
  width: 46%;
  aspect-ratio: 1;
  border: 3px solid rgba(239, 238, 243, 0.7);
  border-radius: 50%;
}

/* the brew's light on the rim and the inner walls */
.cauldron__rimlight {
  position: absolute;
  inset: 0 -10% 30%;
  background: radial-gradient(ellipse 46% 40% at 50% 46%, color-mix(in oklab, var(--liquid) 70%, white), transparent 72%);
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
  overflow: hidden;
  mask-image: linear-gradient(0deg, transparent, #000 35%);
  opacity: var(--fire);
  transform: scaleY(calc(0.6 + 0.5 * var(--fire)));
  transform-origin: 50% 100%;
}

/* The two-frame sprite as a strip twice the box's height, flipped by moving it
   (composited) rather than by repainting its background-position. */
.cauldron__fire::before {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 200%;
  background-image: var(--fire-sprite);
  background-size: 100% 100%;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  content: '';
  animation: soul-fire 0.5s steps(1) infinite;
}

/* hidden (any other chapter), the flame holds still: a running loop costs a frame every tick */
.altar-scene.is-idle .cauldron__fire::before {
  animation-play-state: paused;
}

@keyframes soul-fire {
  0% { transform: none; }
  50% { transform: translateY(-50%); }
}

/* ---------- the drops ---------- */
.altar-scene__drops {
  position: absolute;
  inset: 0;
  z-index: 6;
  pointer-events: none;
}

.drop {
  position: absolute;
  top: 0;
  left: 0;
  display: block;
  will-change: transform, opacity;
}

.drop img {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  -webkit-user-drag: none;
}

.drop__rune {
  position: absolute;
  inset: 18%;
  border: 3px solid var(--acc);
  background: color-mix(in oklab, var(--acc) 30%, #0b0b0e);
  transform: rotate(45deg);
}

.drop-enter-active,
.drop-leave-active {
  transition: opacity .25s ease;
}

.drop-enter-from,
.drop-leave-to {
  opacity: 0 !important;
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
.altar-scene__fx--burst { z-index: 9; }

/* ---------- the column of light as the brew takes ---------- */
.altar-scene__beam {
  position: absolute;
  z-index: 5;
  background:
    linear-gradient(90deg, transparent 30%, color-mix(in oklab, var(--acc) 50%, white) 46%, #fff 50%, color-mix(in oklab, var(--acc) 50%, white) 54%, transparent 70%),
    radial-gradient(ellipse 50% 100% at 50% 100%, color-mix(in oklab, var(--acc) 60%, transparent), color-mix(in oklab, var(--acc) 18%, transparent) 55%, transparent 80%);
  mask-image: linear-gradient(0deg, #000 30%, transparent);
  mix-blend-mode: screen;
  transform-origin: 50% 100%;
  pointer-events: none;
  will-change: transform, opacity;
}

@media (prefers-reduced-motion: reduce) {
  .cauldron__fire::before {
    animation: none;
  }
}
</style>
