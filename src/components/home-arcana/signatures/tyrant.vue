<template>
  <!--
    Tyrant: the storm takes the sky. A dark mass of cloud closes over whatever hung there
    (moon, sun or twilight sun), torn cloud races past, a lightning bolt forks down behind the
    castle and the sky behind the skyline flashes blue-white so every tower stands black
    against it; the near scene jolts with the thunder. Rain veils drive across on the wind
    and the sea breaks white at the city's foot. (The base scene brings the cloud banks,
    the rain and the later strikes.)
  -->
  <div class="ty" aria-hidden="true" :style="{'--fog': `url(${fog})`}">
    <template v-if="layer === 'back'">
      <!-- the cloud that swallows the moon or the sun -->
      <div class="ty-swallow"><i class="ty-cloud"></i></div>
      <!-- scud: torn cloud tearing past, both banks on one drifting layer -->
      <div class="ty-scud">
        <div class="ty-scud__band"><i class="ty-cloud"></i></div>
        <div class="ty-scud__band ty-scud__band--low"><i class="ty-cloud"></i></div>
      </div>
      <!-- the strike: the sky behind the city lit, and the bolt itself -->
      <i class="ty-backlight"></i>
      <div class="ty-bolt">
        <svg class="ty-svg" viewBox="0 0 100 100">
          <path class="ty-bolt__glow" :d="BOLT"/>
          <path class="ty-bolt__core" :d="BOLT"/>
        </svg>
      </div>
    </template>
    <!-- in front: everything here jolts once with the thunder of the strike -->
    <div v-else class="ty-front">
      <!-- rain veils and the churning spray, carried on one drifting layer -->
      <div class="ty-wind">
        <i class="ty-veil"></i>
        <i class="ty-veil ty-veil--far"></i>
        <div class="ty-churn"><i class="ty-cloud"></i></div>
      </div>
      <!-- the sea breaking at the city's foot as the thunder rolls -->
      <div class="ty-spray">
        <i v-for="p in PLUMES" :key="p.x" class="ty-spray__plume" :style="{left: `${p.x}%`, '--s': p.s, '--d': `${p.d}s`}"></i>
        <i v-for="(d, i) in DROPS" :key="`d${i}`" class="ty-spray__drop" :style="{left: `${d.x}%`, '--h': d.h, '--d': `${d.d}s`, '--t': `${d.t}s`, '--dx': `${d.dx}px`}"></i>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import fog from '../assets/moon/fog-bank.webp';
import {seeded} from './sigKit';

defineProps<{layer: 'back' | 'front'; from?: string}>();

/* the bolt, in moon units (100 = r) from its box at the top of the sky right of the fan */
const rnd = seeded(77);
const f1 = (n: number) => n.toFixed(1);
function channel(x: number, y: number, toY: number, lean: number, step: number): [number, number][] {
  const pts: [number, number][] = [[x, y]];
  while (y < toY) {
    y += step * (.6 + rnd() * .8);
    x += lean + (rnd() - .5) * step * 1.1;
    pts.push([x, Math.min(y, toY)]);
  }
  return pts;
}
const trunk = channel(0, 0, 300, -1.2, 16);
const forkAt = (i: number) => trunk[Math.min(i, trunk.length - 1)]!;
const forks = [
  channel(forkAt(5)[0], forkAt(5)[1], forkAt(5)[1] + 90, 7, 12),
  channel(forkAt(9)[0], forkAt(9)[1], forkAt(9)[1] + 120, -8, 12),
  channel(forkAt(13)[0], forkAt(13)[1], forkAt(13)[1] + 60, 6, 10),
];
const BOLT = [trunk, ...forks].map(c => c.map(([x, y], i) => `${i ? 'L' : 'M'}${f1(x)} ${f1(y)}`).join(' ')).join(' ');

/* where the sea breaks along the street after the strike (percent of the width), how big, when */
const PLUMES = [
  {x: 8, s: .8, d: 1.25}, {x: 22, s: 1.1, d: 1.6}, {x: 37, s: .9, d: 1.35}, {x: 51, s: 1.2, d: 1.9},
  {x: 64, s: 1, d: 1.2}, {x: 77, s: 1.25, d: 1.5}, {x: 90, s: .95, d: 1.75},
];
/* droplets flung up out of it, square texels, once */
const DROPS = Array.from({length: 22}, () => ({
  x: Math.round(rnd() * 96) + 2,
  h: (.5 + rnd() * .9).toFixed(2),
  d: (1.2 + rnd() * .9).toFixed(2),
  t: (1.4 + rnd() * 1.2).toFixed(2),
  dx: Math.round((rnd() - .3) * 60),
}));
</script>

<style scoped>
.ty {
  --H: var(--city-h, 600px);
  /* the strike, after the clouds have closed in */
  --strike: .9s;
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.ty-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

/*
 * Cloud, the scene's own technique (.night__clouds): the fog texture multiplied by the
 * cloud's colour and cut by its own luminance, so the gaps are empty sky, not black.
 */
.ty-cloud {
  --tile: var(--fog) repeat-x var(--x, 0) 50% / var(--tw, 50%) 100%;
  position: absolute;
  inset: 0;
  background: linear-gradient(var(--tone, #1c2638), var(--tone, #1c2638)), var(--tile);
  background-blend-mode: multiply;
  -webkit-mask: var(--tile);
  mask: var(--tile);
  -webkit-mask-mode: luminance;
  mask-mode: luminance;
}

/* ---- the swallow: a dark mass rolling in over the body's place from the right ---- */
.ty-swallow {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px) * 3.4);
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * 1.6);
  width: calc(var(--moon-r, 200px) * 6.8);
  height: calc(var(--moon-r, 200px) * 3.4);
  -webkit-mask-image: radial-gradient(closest-side, #000 45%, rgba(0, 0, 0, .6) 70%, transparent);
  mask-image: radial-gradient(closest-side, #000 45%, rgba(0, 0, 0, .6) 70%, transparent);
  opacity: .94;
  animation: ty-swallow 1.6s cubic-bezier(.3, .4, .25, 1) .05s both;
}

.ty-swallow .ty-cloud {
  --tone: #141c2a;
  --tw: 80%;
  --x: 20%;
}

/* a second, offset layer of the same cloud filling its gaps */
.ty-swallow::after {
  content: '';
  position: absolute;
  inset: 8% 0;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(16, 22, 34, .85), rgba(16, 22, 34, .4) 60%, transparent);
}

@keyframes ty-swallow {
  from { opacity: 0; transform: translate3d(38%, -6%, 0) scale(1.1); }
}

/* ---- scud: two banks on one layer, tearing past far faster than the fog (the back's one loop) ---- */
.ty-scud {
  position: absolute;
  left: 0;
  top: 0;
  width: 200%;
  height: calc(var(--moon-y, 48%) + var(--moon-r, 200px) * .6);
  opacity: .3;
  will-change: transform;
  animation: ty-tear 24s linear infinite;
}

.ty-scud__band {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * 1.6);
  height: calc(var(--moon-r, 200px) * 1.1);
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 35%, #000 65%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 35%, #000 65%, transparent);
}

.ty-scud__band .ty-cloud {
  --tone: #9fb0c8;
  --tw: 25%;
}

.ty-scud__band--low {
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * .3);
  height: calc(var(--moon-r, 200px) * .8);
  opacity: .8;
}

.ty-scud__band--low .ty-cloud {
  --x: 9%;
}

@keyframes ty-tear {
  to { transform: translate3d(-50%, 0, 0); }
}

/* ---- the signature strike ---- */
/* lit sky behind the skyline: the towers stand out black against it */
.ty-backlight {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px) * 1.2);
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * 2.6);
  width: calc(var(--moon-r, 200px) * 6.4);
  height: calc(var(--moon-r, 200px) * 3.8);
  border-radius: 50%;
  background: radial-gradient(closest-side at 50% 72%, rgba(196, 216, 255, .62), rgba(140, 175, 240, .28) 45%, transparent);
  opacity: 0;
  animation: ty-strike .75s linear var(--strike) both;
}

.ty-bolt {
  position: absolute;
  left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * 1.98);
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * 2.5);
  width: var(--moon-r, 200px);
  height: var(--moon-r, 200px);
  opacity: 0;
  animation: ty-strike .75s linear var(--strike) both;
}

/* one strike: the stroke, a flicker as it re-strikes, gone (one flash, never full white) */
@keyframes ty-strike {
  0% { opacity: 0; }
  6% { opacity: 1; }
  22% { opacity: .25; }
  32% { opacity: .9; }
  100% { opacity: 0; }
}

.ty-bolt__core,
.ty-bolt__glow {
  fill: none;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.ty-bolt__core {
  stroke: #eef4ff;
  stroke-width: 1.4;
}

.ty-bolt__glow {
  stroke: rgba(150, 190, 255, .5);
  stroke-width: 5;
  filter: blur(2px);
}

/* ---- in front ---- */
/* the thunder: one 2px jolt of the near scene, a beat after the strike (no watching, no timers) */
.ty-front {
  position: absolute;
  inset: 0;
  overflow: hidden;
  animation: ty-shake .42s linear calc(var(--strike) + .1s) both;
}

@keyframes ty-shake {
  0%, 100% { transform: none; }
  20% { transform: translate3d(2px, -1px, 0); }
  40% { transform: translate3d(-2px, 1px, 0); }
  60% { transform: translate3d(1px, 2px, 0); }
  80% { transform: translate3d(-1px, -1px, 0); }
}

/* the wind: rain veils and the street's spray carried across together (the front's one loop) */
.ty-wind {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 200%;
  will-change: transform;
  animation: ty-tear 9s linear infinite;
}

/* rain veils: sheets of rain driven across by the wind, thicker in gusts */
.ty-veil {
  position: absolute;
  inset: -10% 0 0;
  background: repeating-linear-gradient(104deg, transparent 0 22px, rgba(190, 214, 255, .05) 22px 24px, transparent 24px 61px);
  /* gusts: repeating every half of the layer, so the loop has no seam */
  -webkit-mask: linear-gradient(90deg, transparent, #000 20%, #000 44%, transparent 60%, #000 76%, transparent) 0 0 / 50% 100% repeat-x;
  mask: linear-gradient(90deg, transparent, #000 20%, #000 44%, transparent 60%, #000 76%, transparent) 0 0 / 50% 100% repeat-x;
}

.ty-veil--far {
  opacity: .6;
  background-position: 31px 0;
  -webkit-mask: linear-gradient(90deg, #000, transparent 28%, #000 52%, transparent 84%, #000) 0 0 / 50% 100% repeat-x;
  mask: linear-gradient(90deg, #000, transparent 28%, #000 52%, transparent 84%, #000) 0 0 / 50% 100% repeat-x;
}

/* the sea churning white at the city's foot */
.ty-churn {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(var(--city-bottom, 100%) - var(--H) * .27);
  height: calc(var(--H) * .2);
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 40%, #000 80%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 40%, #000 80%, transparent);
  opacity: .5;
}

.ty-churn .ty-cloud {
  --tone: #d8e4f4;
  --tw: 25%;
  --x: 0;
}

/* ---- sea spray at street level, thrown up by the storm as the thunder rolls ---- */
.ty-spray {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(var(--city-bottom, 100%) - var(--H) * .34);
  height: calc(var(--H) * .26);
}

/* a wave breaking: a burst of white spray thrown up and falling back, once */
.ty-spray__plume {
  position: absolute;
  bottom: 12%;
  width: calc(var(--H) * .3 * var(--s));
  height: calc(var(--H) * .2 * var(--s));
  translate: -50% 0;
  border-radius: 50% 50% 40% 40%;
  background: radial-gradient(closest-side at 50% 70%, rgba(224, 236, 255, .42), rgba(190, 210, 240, .16) 55%, transparent);
  transform-origin: 50% 100%;
  opacity: 0;
  animation: ty-burst 2.4s cubic-bezier(.2, .7, .4, 1) var(--d) both;
}

@keyframes ty-burst {
  0% { opacity: 0; transform: scale(.4, .2); }
  14% { opacity: 1; transform: scale(.9, 1); }
  45% { opacity: .5; transform: scale(1.15, 1.1) translate3d(0, -6%, 0); }
  100% { opacity: 0; transform: scale(1.3, .9) translate3d(-8%, 0, 0); }
}

.ty-spray__drop {
  position: absolute;
  bottom: 30%;
  width: 4px;
  height: 4px;
  background: rgba(225, 238, 255, .7);
  opacity: 0;
  animation: ty-fling var(--t) cubic-bezier(.25, .6, .5, 1) var(--d) both;
}

@keyframes ty-fling {
  0% { opacity: 0; transform: translate3d(0, 0, 0); }
  10% { opacity: .9; }
  50% { transform: translate3d(calc(var(--dx) * .6), calc(var(--H) * -.14 * var(--h)), 0); }
  100% { opacity: 0; transform: translate3d(var(--dx), calc(var(--H) * -.02), 0); }
}

/* ---- light theme: grey-blue storm wash on paper ---- */
:root[data-theme="parchment"] .ty-swallow {
  opacity: .35;
}

:root[data-theme="parchment"] .ty-swallow .ty-cloud {
  --tone: #5a6478;
}

:root[data-theme="parchment"] .ty-backlight {
  background: radial-gradient(closest-side at 50% 72%, rgba(255, 255, 255, .6), rgba(220, 230, 250, .25) 45%, transparent);
}

:root[data-theme="parchment"] .ty-bolt__core {
  stroke: #5f7bb0;
}

:root[data-theme="parchment"] .ty-scud,
:root[data-theme="parchment"] .ty-churn {
  mix-blend-mode: multiply;
  opacity: .14;
}

:root[data-theme="parchment"] .ty-scud__band .ty-cloud,
:root[data-theme="parchment"] .ty-churn .ty-cloud {
  --tone: #4a5a74;
}

:root[data-theme="parchment"] .ty-spray__plume {
  background: radial-gradient(closest-side at 50% 70%, rgba(120, 140, 175, .18), transparent);
}

:root[data-theme="parchment"] .ty-spray__drop {
  background: rgba(100, 120, 160, .5);
}

:root[data-theme="parchment"] .ty-veil {
  background: repeating-linear-gradient(104deg, transparent 0 22px, rgba(90, 110, 150, .06) 22px 24px, transparent 24px 61px);
}

/* stacked: the strike comes down just right of the fan, not off the edge */
@media (max-width: 900px) {
  .ty-bolt {
    left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * 1.25);
    top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * 2.9);
  }
}

/* still: the storm stands; no strike, no drift, no jolt */
@media (prefers-reduced-motion: reduce) {
  .ty-swallow,
  .ty-scud,
  .ty-wind,
  .ty-front {
    animation: none;
  }

  .ty-backlight,
  .ty-bolt,
  .ty-spray {
    display: none;
  }
}
</style>
