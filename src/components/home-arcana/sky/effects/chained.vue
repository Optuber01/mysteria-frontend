<template>
  <!--
    Chained: a cold stillness under a bound moon. Rings of iron-grey light circle the moon
    slowly like shackles, fine ash falls dead straight, and a cold mist lies in the streets.
    Light only: no chains, no figures.
  -->
  <div v-if="layer === 'back'" class="fx fx--chained fx--back" :class="{'is-late': late}">
    <div class="sky-anchor ch-anchor">
      <i class="ch-ring ch-ring--a"></i>
      <i class="ch-ring ch-ring--b"></i>
      <i class="ch-ring ch-ring--c"></i>
    </div>
  </div>
  <div v-else class="fx fx--chained fx--front">
    <i class="ch-ash ch-ash--far" :style="ash[0]"></i>
    <i class="ch-ash ch-ash--near" :style="ash[1]"></i>
    <div class="ch-mist"><i class="ch-mist__drift"></i></div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import type {Body} from '../skyScenes';

defineOptions({name: 'SkyChainedEffect'});
const props = defineProps<{layer: 'back' | 'front'; body: Body; from: Body}>();

/* The moon has to be up to be bound: the rings wait for it if it had to rise (or come out of a storm) first. */
const late = computed(() => props.from !== 'moon');

/* A seeded stream, so the ash is the same on every load. */
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
 * Ash is a tile of small round flecks, used as a mask over a flat colour and moved by
 * exactly one tile height per loop, so it never shows a seam. Flecks near the tile's edge
 * are drawn on both sides of it.
 */
function flecks(seed: number, size: number, count: number, radius: [number, number], alpha: [number, number]): string {
  const rnd = seeded(seed);
  let dots = '';
  for (let i = 0; i < count; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = radius[0] + rnd() * (radius[1] - radius[0]);
    const a = (alpha[0] + rnd() * (alpha[1] - alpha[0])).toFixed(2);
    for (const dx of x < r ? [0, size] : x > size - r ? [0, -size] : [0]) {
      for (const dy of y < r ? [0, size] : y > size - r ? [0, -size] : [0]) {
        dots += `<circle cx='${(x + dx).toFixed(1)}' cy='${(y + dy).toFixed(1)}' r='${r.toFixed(2)}' opacity='${a}'/>`;
      }
    }
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><g fill='white'>${dots}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const ash = [
  {'--m': flecks(5, 360, 44, [0.6, 1], [0.3, 0.6]), '--th': '360px', '--t': '28s'},
  {'--m': flecks(9, 540, 26, [1, 1.8], [0.45, 0.8]), '--th': '540px', '--t': '21s'},
];
</script>

<style scoped>
.fx {
  --lo: rgba(150, 158, 172, .3);
  --mid: rgba(186, 194, 208, .55);
  --hi: rgba(226, 232, 244, .85);
  --ash: #c9ced8;
  --mist: #8e99ab;
  /* the rings come at the earliest after this: later if the moon had to rise first */
  --lead: 0s;
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.fx.is-late {
  --lead: 1.4s;
}

/* ---- behind the castle: the bindings ---- */
/* a box on the moon, which the scene moves with it as the page scrolls */
.ch-anchor {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  aspect-ratio: 1;
}

/*
 * One ring: a circle round the moon, tilted and flattened into an orbit, cut to a thin line.
 * The light on it (the pseudo-element) is what turns, so the ring itself never repaints.
 */
.ch-ring {
  --tilt: -16deg;
  --flat: .34;
  position: absolute;
  inset: -30%;
  border-radius: 50%;
  transform: rotate(var(--tilt)) scaleY(var(--flat));
  -webkit-mask-image: radial-gradient(closest-side, transparent 93.5%, rgba(0, 0, 0, .3) 96%, #000 97.8%, rgba(0, 0, 0, .35) 99%, transparent 100%);
  mask-image: radial-gradient(closest-side, transparent 93.5%, rgba(0, 0, 0, .3) 96%, #000 97.8%, rgba(0, 0, 0, .35) 99%, transparent 100%);
  /* they close in on the moon and take hold */
  animation: ch-close 2.4s cubic-bezier(.2, .6, .25, 1) calc(.6s + var(--lead)) backwards;
}

.ch-ring::before {
  content: '';
  position: absolute;
  inset: 0;
  background: conic-gradient(var(--lo), var(--hi) 7%, var(--mid) 14%, var(--lo) 26%, var(--lo) 52%, var(--mid) 62%, var(--lo) 76%);
  will-change: transform;
  animation: ch-turn 80s linear infinite;
}

.ch-ring--b {
  --tilt: 14deg;
  --flat: .26;
  inset: -58%;
  animation-delay: calc(.9s + var(--lead));
}

.ch-ring--b::before {
  animation-duration: 120s;
  animation-direction: reverse;
}

/* the third hangs upright and still */
.ch-ring--c {
  --tilt: 72deg;
  --flat: .4;
  inset: -16%;
  opacity: .8;
  animation-delay: calc(1.2s + var(--lead));
}

.ch-ring--c::before {
  animation: none;
  transform: rotate(130deg);
}

@keyframes ch-close {
  from { opacity: 0; scale: 1.45; }
}

@keyframes ch-turn {
  to { rotate: 360deg; }
}

/* ---- in front: ash and mist ---- */
/* ash falls dead straight, in two depths */
.ch-ash {
  position: absolute;
  inset: calc(var(--th) * -1) 0 0;
  background: var(--ash);
  -webkit-mask: var(--m) 0 0 / var(--th) var(--th) repeat;
  mask: var(--m) 0 0 / var(--th) var(--th) repeat;
  opacity: .8;
  will-change: transform;
  animation: ch-fall var(--t) linear infinite, ch-ash-in 2.2s ease .4s backwards;
}

.ch-ash--far {
  opacity: .6;
}

@keyframes ch-fall {
  to { transform: translate3d(0, var(--th), 0); }
}

@keyframes ch-ash-in {
  from { opacity: 0; }
}

/* a cold mist low in the streets, from the scene's own fog texture */
.ch-mist {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .36);
  height: calc(var(--city-h, 600px) * .4);
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 38%, #000 66%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 38%, #000 66%, transparent);
  animation: ch-mist-in 2.6s ease .6s backwards;
}

.ch-mist__drift {
  position: absolute;
  inset: 0 auto 0 0;
  width: 200%;
  background:
    linear-gradient(var(--mist), var(--mist)),
    url('../../assets/moon/fog-bank.webp') repeat-x 0 50% / 50% 100%;
  background-blend-mode: multiply;
  -webkit-mask: url('../../assets/moon/fog-bank.webp') repeat-x 0 50% / 50% 100%;
  mask: url('../../assets/moon/fog-bank.webp') repeat-x 0 50% / 50% 100%;
  -webkit-mask-mode: luminance;
  mask-mode: luminance;
  opacity: .9;
  will-change: transform;
  animation: ch-drift 140s linear infinite;
}

@keyframes ch-drift {
  to { transform: translate3d(-50%, 0, 0); }
}

@keyframes ch-mist-in {
  from { opacity: 0; }
}

/* ---- light theme: cool grey rings and ash in the haze ---- */
:root[data-theme="parchment"] .fx {
  --lo: rgba(96, 106, 122, .3);
  --mid: rgba(80, 90, 108, .6);
  --hi: rgba(58, 68, 88, .92);
  --ash: #5d6676;
  --mist: #a3acba;
}

:root[data-theme="parchment"] .ch-ash {
  opacity: .55;
}

:root[data-theme="parchment"] .ch-ash--far {
  opacity: .4;
}

:root[data-theme="parchment"] .ch-mist__drift {
  opacity: .42;
}

/* still: the moon stays bound, with no turning and no fall */
@media (prefers-reduced-motion: reduce) {
  .ch-ring,
  .ch-ring::before,
  .ch-ash,
  .ch-mist,
  .ch-mist__drift {
    animation: none;
  }
}
</style>
