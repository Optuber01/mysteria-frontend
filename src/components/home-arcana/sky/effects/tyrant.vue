<template>
  <!--
    Tyrant: the storm. Heavy cloud rolls over the top of the sky behind the castle, lightning
    flashes the cloud and forks down behind the towers now and then, and slanted rain drives
    through the city in front. Nothing is animated but transform and opacity, on long cycles.
  -->
  <div v-if="layer === 'back'" class="fx fx--tyrant fx--back">
    <div class="ty-clouds">
      <i class="ty-cloud ty-cloud--far"></i>
      <i class="ty-cloud ty-cloud--near"></i>
    </div>
    <i class="ty-sheet"></i>
    <div class="ty-strike">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path class="ty-glow" :d="BOLT"/>
        <path class="ty-core" :d="BOLT"/>
      </svg>
    </div>
  </div>
  <div v-else class="fx fx--tyrant fx--front">
    <div class="ty-rain">
      <i v-for="drop in RAIN" :key="drop.name" class="ty-drops" :class="`ty-drops--${drop.name}`" :style="drop.style"></i>
    </div>
    <i class="ty-haze"></i>
  </div>
</template>

<script setup lang="ts">
import type {Body} from '../skyScenes';

defineOptions({name: 'SkyTyrantEffect'});
defineProps<{layer: 'back' | 'front'; body: Body; from: Body}>();

/* A seeded stream, so the bolts and the rain are the same on every load. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/*
 * A bolt in moon units (100 = the moon's radius) from the top of its box: a jagged trunk
 * that leans a little and a few forks off it, ending behind the skyline.
 */
function bolt(seed: number, lean: number, forkLean: number): string {
  const rnd = seeded(seed);
  const channel = (x: number, y: number, toY: number, l: number, step: number) => {
    const pts: [number, number][] = [[x, y]];
    while (y < toY) {
      y += step * (0.6 + rnd() * 0.8);
      x += l + (rnd() - 0.5) * step * 1.1;
      pts.push([x, Math.min(y, toY)]);
    }
    return pts;
  };
  const trunk = channel(0, 0, 300, lean, 16);
  const at = (i: number) => trunk[Math.min(i, trunk.length - 1)]!;
  const forks = [
    channel(at(5)[0], at(5)[1], at(5)[1] + 90, forkLean, 12),
    channel(at(9)[0], at(9)[1], at(9)[1] + 120, -forkLean, 12),
    channel(at(13)[0], at(13)[1], at(13)[1] + 60, forkLean * 0.8, 10),
  ];
  return [trunk, ...forks].map(c => c.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')).join(' ');
}

const BOLT = bolt(77, 0.2, 7);

/*
 * Rain is a tile of short white streaks, used as a mask over a flat colour and moved by
 * exactly one tile height per loop, so it never shows a seam. Streaks that cross the tile's
 * edge are drawn on both sides of it.
 */
function drops(seed: number, size: number, count: number, len: [number, number], width: number, alpha: [number, number]): string {
  const rnd = seeded(seed);
  let lines = '';
  for (let i = 0; i < count; i++) {
    const x = 2 + rnd() * (size - 4);
    const y = rnd() * size;
    const l = len[0] + rnd() * (len[1] - len[0]);
    const a = (alpha[0] + rnd() * (alpha[1] - alpha[0])).toFixed(2);
    for (const dy of y + l > size ? [0, -size] : [0]) {
      lines += `<line x1='${x.toFixed(1)}' y1='${(y + dy).toFixed(1)}' x2='${x.toFixed(1)}' y2='${(y + dy + l).toFixed(1)}' opacity='${a}'/>`;
    }
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><g stroke='white' stroke-width='${width}' stroke-linecap='round'>${lines}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const RAIN = [
  {name: 'far', size: 320, count: 34, len: [26, 56] as [number, number], width: 1, alpha: [0.3, 0.6] as [number, number], t: 0.64},
  {name: 'near', size: 520, count: 26, len: [70, 140] as [number, number], width: 1.7, alpha: [0.45, 0.85] as [number, number], t: 0.46},
].map((r, i) => ({
  name: r.name,
  style: {'--m': drops(11 + i * 17, r.size, r.count, r.len, r.width, r.alpha), '--th': `${r.size}px`, '--t': `${r.t}s`},
}));
</script>

<style scoped>
.fx {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* ---- behind the castle: the cloud ---- */
/* the banks hang from the top of the sky and thin out toward the roofs; they roll in once */
.ty-clouds {
  position: absolute;
  inset: 0 0 auto;
  height: 74%;
  -webkit-mask-image: linear-gradient(180deg, #000 42%, transparent);
  mask-image: linear-gradient(180deg, #000 42%, transparent);
  animation: ty-roll-in 2.4s cubic-bezier(.3, .5, .25, 1) backwards;
}

/* the overcast the cloud banks stand in: the sky itself is dark under them */
.ty-clouds::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(7, 12, 21, .94), rgba(13, 21, 35, .72) 55%, transparent);
}

@keyframes ty-roll-in {
  from { opacity: 0; transform: translate3d(0, -26%, 0); }
}

/* the scene's own cloud technique: the fog texture tinted, and cut by its own light so the gaps are sky */
.ty-cloud {
  --tone: #4a5e80;
  position: absolute;
  inset: -6% auto 16% 0;
  width: 200%;
  background:
    linear-gradient(var(--tone), var(--tone)),
    url('../../assets/moon/fog-bank.webp') repeat-x 0 0 / 50% 100%;
  background-blend-mode: multiply;
  -webkit-mask: url('../../assets/moon/fog-bank.webp') repeat-x 0 0 / 50% 100%;
  mask: url('../../assets/moon/fog-bank.webp') repeat-x 0 0 / 50% 100%;
  -webkit-mask-mode: luminance;
  mask-mode: luminance;
  opacity: .9;
}

/* the near bank is the one that moves (a single loop; the far one stands) */
.ty-cloud--near {
  --tone: #62799e;
  inset: 8% auto 0 0;
  opacity: .78;
  will-change: transform;
  animation: ty-drift 55s linear infinite reverse;
}

@keyframes ty-drift {
  to { transform: translate3d(-50%, 0, 0); }
}

/* ---- the lightning ---- */
/* a flash of the whole sky: cloud lit from within, never full white */
.ty-sheet {
  position: absolute;
  inset: 0 0 auto;
  height: 72%;
  background:
    radial-gradient(ellipse 55% 75% at 40% 16%, rgba(222, 234, 255, .85), rgba(150, 176, 240, .36) 55%, transparent 85%),
    linear-gradient(180deg, rgba(186, 208, 255, .62), rgba(130, 160, 232, .24) 45%, transparent 90%);
  opacity: 0;
  will-change: opacity;
  animation: ty-sheet 11s linear 1.2s infinite;
}

/* irregular on purpose: a double flicker, a long quiet, a faint distant one */
@keyframes ty-sheet {
  0%, 24% { opacity: 0; }
  25% { opacity: .9; }
  27% { opacity: .15; }
  29% { opacity: .7; }
  34% { opacity: 0; }
  60% { opacity: 0; }
  61% { opacity: .4; }
  65%, 100% { opacity: 0; }
}

/*
 * A bolt: a box of one moon radius at the top of its place, the path running far below it.
 * The same bolt strikes twice a cycle in two places, left and right of the fan: it moves
 * (mirrored) while it is dark.
 */
.ty-strike {
  position: absolute;
  /* right of the fan first, then (mirrored) inside its arch: never over the copy */
  left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * 1.25);
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * 2.5);
  width: var(--moon-r, 200px);
  height: var(--moon-r, 200px);
  opacity: 0;
  will-change: opacity, translate, scale;
  animation: ty-bolt 31s linear -1.3s infinite;
}

/* the glow the bolt throws on the cloud and the roofs around it */
.ty-strike::before {
  content: '';
  position: absolute;
  left: -200%;
  top: -20%;
  width: 500%;
  height: 400%;
  background: radial-gradient(closest-side, rgba(176, 202, 255, .5), rgba(130, 160, 230, .18) 55%, transparent);
}

/* a flicker of re-strikes, then a long quiet */
@keyframes ty-bolt {
  0%, 9.8% { opacity: 0; translate: 0 0; scale: 1 1; }
  10% { opacity: 1; }
  11.5% { opacity: .22; }
  13% { opacity: .95; }
  14.5% { opacity: .3; }
  15.5% { opacity: .75; }
  18%, 40% { opacity: 0; translate: 0 0; scale: 1 1; }
  41%, 78% { opacity: 0; translate: -230% -8%; scale: -1 1; }
  54.8% { opacity: 0; }
  55% { opacity: 1; }
  56.2% { opacity: .2; }
  57.5% { opacity: .9; }
  60.5% { opacity: 0; }
  79%, 100% { opacity: 0; translate: 0 0; scale: 1 1; }
}

.ty-strike svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.ty-core,
.ty-glow {
  fill: none;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.ty-core {
  stroke: rgba(236, 244, 255, .95);
  stroke-width: 1.5;
}

.ty-glow {
  stroke: rgba(150, 190, 255, .6);
  stroke-width: 9;
  filter: blur(3.5px);
}

/* ---- in front of the city: the rain ---- */
/* side by side, the rain stays off the copy column (the deck and the city are where it falls) */
@media (min-width: 901px) {
  .fx--front {
    -webkit-mask-image: linear-gradient(90deg, transparent 26%, rgba(0, 0, 0, .35) 40%, #000 56%);
    mask-image: linear-gradient(90deg, transparent 26%, rgba(0, 0, 0, .35) 40%, #000 56%);
  }
}

/* one tilted frame for all three veils, so the rain slants and falls along its slant */
.ty-rain {
  position: absolute;
  inset: -30% -25%;
  rotate: 11deg;
  animation: ty-rain-in 2.2s ease .5s backwards;
}

@keyframes ty-rain-in {
  from { opacity: 0; }
}

.ty-drops {
  position: absolute;
  inset: calc(var(--th) * -1) 0 0;
  background: #b9cdef;
  -webkit-mask: var(--m) 0 0 / var(--th) var(--th) repeat;
  mask: var(--m) 0 0 / var(--th) var(--th) repeat;
  opacity: .55;
  will-change: transform;
  animation: ty-fall var(--t) linear infinite;
}

.ty-drops--near { opacity: .8; }

@keyframes ty-fall {
  to { transform: translate3d(0, var(--th), 0); }
}

/* rain haze: the street lost in the downpour */
.ty-haze {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(0deg, rgba(64, 86, 120, .3) 0%, rgba(42, 60, 90, .13) 42%, transparent 78%),
    linear-gradient(180deg, rgba(10, 16, 28, .2), transparent 45%);
}

/* ---- light theme: a grey-blue storm in the morning haze, never a dark band ---- */
:root[data-theme="parchment"] .ty-clouds::before {
  background: linear-gradient(180deg, rgba(118, 132, 156, .5), rgba(130, 144, 166, .3) 55%, transparent);
}

:root[data-theme="parchment"] .ty-cloud {
  --tone: #7d8aa3;
  opacity: .5;
}

:root[data-theme="parchment"] .ty-cloud--near {
  --tone: #66758f;
  opacity: .38;
}

:root[data-theme="parchment"] .ty-sheet {
  background:
    radial-gradient(ellipse 55% 75% at 40% 16%, rgba(255, 255, 255, .85), rgba(232, 238, 252, .4) 55%, transparent 85%),
    linear-gradient(180deg, rgba(255, 255, 255, .5), rgba(230, 236, 250, .2) 45%, transparent 90%);
}

:root[data-theme="parchment"] .ty-strike::before {
  background: radial-gradient(closest-side, rgba(255, 255, 255, .6), rgba(220, 230, 250, .2) 55%, transparent);
}

:root[data-theme="parchment"] .ty-core {
  stroke: #fff;
}

/* on paper the bolt is light in the grey cloud, haloed in the storm's own blue-grey */
:root[data-theme="parchment"] .ty-glow {
  stroke: rgba(118, 138, 178, .38);
}

:root[data-theme="parchment"] .ty-drops {
  background: #4b586e;
  opacity: .4;
}

:root[data-theme="parchment"] .ty-drops--near { opacity: .6; }

:root[data-theme="parchment"] .ty-haze {
  background: linear-gradient(0deg, rgba(128, 142, 164, .38) 0%, rgba(140, 153, 174, .16) 45%, transparent 80%);
}

/* still: the storm stands, with no lightning and no drift */
@media (prefers-reduced-motion: reduce) {
  .ty-clouds,
  .ty-cloud,
  .ty-rain,
  .ty-drops {
    animation: none;
  }

  .ty-sheet,
  .ty-strike {
    display: none;
  }
}
</style>
