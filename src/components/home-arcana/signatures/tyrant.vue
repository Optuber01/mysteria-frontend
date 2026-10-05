<template>
  <!--
    Tyrant: the storm's own strike. A lightning bolt forks down behind the castle and the
    sky behind the skyline flashes blue-white, so every tower stands black against it;
    torn cloud races over the moon's place, sea spray churns at the city's foot, rain
    veils drive across on the wind, and the near scene shakes with each thunderclap.
    (The base scene brings the cloud banks, the rain and the later strikes; the shake
    follows those strikes too, by watching the hero's flash.)
  -->
  <div ref="rootRef" aria-hidden="true">
    <template v-if="layer === 'back'">
      <!-- scud: torn cloud tearing past, far faster than the fog -->
      <div class="ty-scud" :style="{'--fog': `url(${fog})`}">
        <i class="ty-scud__band"></i>
        <i class="ty-scud__band ty-scud__band--low"></i>
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
    <template v-else>
      <div ref="shakeRef" class="ty-front">
        <i class="ty-veil"></i>
        <i class="ty-veil ty-veil--far"></i>
        <!-- the sea breaking at the city's foot -->
        <div class="ty-spray" :style="{'--fog': `url(${fog})`}">
          <i class="ty-spray__churn"></i>
          <i v-for="p in PLUMES" :key="p.x" class="ty-spray__plume" :style="{left: `${p.x}%`, '--s': p.s, '--d': `${p.d}s`, '--t': `${p.t}s`}"></i>
          <i v-for="(d, i) in DROPS" :key="`d${i}`" class="ty-spray__drop" :style="{left: `${d.x}%`, '--h': d.h, '--d': `${d.d}s`, '--t': `${d.t}s`, '--dx': `${d.dx}px`}"></i>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, ref} from 'vue';
import fog from '../assets/moon/fog-bank.webp';
import {reducedMotion, seeded} from './sigKit';

const props = defineProps<{layer: 'back' | 'front'}>();

const rootRef = ref<HTMLElement | null>(null);
const shakeRef = ref<HTMLElement | null>(null);

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
const forks = [
  channel(trunk[5][0], trunk[5][1], trunk[5][1] + 90, 7, 12),
  channel(trunk[9][0], trunk[9][1], trunk[9][1] + 120, -8, 12),
  channel(trunk[13][0], trunk[13][1], trunk[13][1] + 60, 6, 10),
];
const BOLT = [trunk, ...forks].map(c => c.map(([x, y], i) => `${i ? 'L' : 'M'}${f1(x)} ${f1(y)}`).join(' ')).join(' ');

/* spray along the street: where the sea breaks (percent of the width), how big, how often */
const PLUMES = [
  {x: 8, s: .8, d: 0, t: 3.6}, {x: 22, s: 1.1, d: 1.3, t: 4.2}, {x: 37, s: .9, d: .5, t: 3.3}, {x: 51, s: 1.2, d: 2.1, t: 4.6},
  {x: 64, s: 1, d: .9, t: 3.9}, {x: 77, s: 1.25, d: 1.7, t: 4.4}, {x: 90, s: .95, d: .2, t: 3.5},
];
const DROPS = Array.from({length: 22}, () => ({
  x: Math.round(rnd() * 96) + 2,
  h: (.5 + rnd() * .9).toFixed(2),
  d: (rnd() * 4).toFixed(2),
  t: (1.4 + rnd() * 1.2).toFixed(2),
  dx: Math.round((rnd() - .3) * 60),
}));

/* ---- thunder: a 2px shake of the near scene on each strike ---- */
const SIGNATURE_STRIKE = 1;
let poll = 0;
let visible = true;
let wasFlashing = false;
let flash: HTMLElement | null = null;
let io: IntersectionObserver | null = null;
const timers: number[] = [];
function shake() {
  shakeRef.value?.animate(
    [{transform: 'none'}, {transform: 'translate3d(2px, -1px, 0)'}, {transform: 'translate3d(-2px, 1px, 0)'}, {transform: 'translate3d(1px, 2px, 0)'}, {transform: 'translate3d(-1px, -1px, 0)'}, {transform: 'none'}],
    {duration: 420, easing: 'linear'},
  );
}
function watch() {
  if (poll || !visible || document.visibilityState !== 'visible') return;
  poll = window.setInterval(() => {
    const flashing = !!flash && flash.getAnimations().length > 0;
    if (flashing && !wasFlashing) timers.push(window.setTimeout(shake, 90));
    wasFlashing = flashing;
  }, 120);
}
function unwatch() {
  clearInterval(poll);
  poll = 0;
}
const onVisibility = () => (document.visibilityState === 'visible' ? watch() : unwatch());
onMounted(() => {
  if (props.layer !== 'front' || reducedMotion() || !rootRef.value) return;
  flash = rootRef.value.closest('.night')?.querySelector<HTMLElement>('.night__flash') ?? null;
  timers.push(window.setTimeout(shake, (SIGNATURE_STRIKE + .1) * 1000));
  io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) watch();
    else unwatch();
  });
  io.observe(rootRef.value);
  document.addEventListener('visibilitychange', onVisibility);
  watch();
});
onUnmounted(() => {
  unwatch();
  timers.forEach(t => clearTimeout(t));
  io?.disconnect();
  document.removeEventListener('visibilitychange', onVisibility);
});
</script>

<style scoped>
.ty-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* ---- scud ---- */
.ty-scud {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.ty-scud__band {
  position: absolute;
  left: 0;
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * 1.6);
  width: 200%;
  height: calc(var(--moon-r, 200px) * 1.1);
  background: var(--fog) repeat-x 0 50% / 50% 100%;
  mix-blend-mode: screen;
  opacity: .2;
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 35%, #000 65%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 35%, #000 65%, transparent);
  animation: ty-tear 24s linear infinite;
}

.ty-scud__band--low {
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * .3);
  height: calc(var(--moon-r, 200px) * .8);
  opacity: .16;
  animation-duration: 17s;
  animation-delay: -6s;
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
  animation: ty-strike .75s linear .9s both;
}

.ty-bolt {
  position: absolute;
  left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * 1.98);
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * 2.5);
  width: var(--moon-r, 200px);
  height: var(--moon-r, 200px);
  opacity: 0;
  animation: ty-strike .75s linear .9s both;
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

/* ---- in front: everything that shakes with the thunder ---- */
.ty-front {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

/* rain veils: sheets of rain driven across by the wind */
.ty-veil {
  position: absolute;
  inset: -10% -60% 0 0;
  background: repeating-linear-gradient(104deg, transparent 0 22px, rgba(190, 214, 255, .05) 22px 24px, transparent 24px 61px);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 20%, #000 45%, transparent 60%, #000 75%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 20%, #000 45%, transparent 60%, #000 75%, transparent);
  animation: ty-gust 6s linear infinite;
}

.ty-veil--far {
  opacity: .6;
  animation-duration: 9s;
  animation-delay: -4s;
}

@keyframes ty-gust {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(-37.5%, 0, 0); }
}

/* ---- sea spray at street level ---- */
.ty-spray {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .34);
  height: calc(var(--city-h, 600px) * .26);
}

.ty-spray__churn {
  position: absolute;
  inset: 20% auto 0 0;
  width: 200%;
  background: var(--fog) repeat-x 0 60% / 50% 100%;
  mix-blend-mode: screen;
  opacity: .36;
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 40%, #000 80%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 40%, #000 80%, transparent);
  animation: ty-tear 13s linear infinite;
}

/* a wave breaking: a burst of white spray thrown up, falling back, again */
.ty-spray__plume {
  position: absolute;
  bottom: 12%;
  width: calc(var(--city-h, 600px) * .3 * var(--s));
  height: calc(var(--city-h, 600px) * .2 * var(--s));
  translate: -50% 0;
  border-radius: 50% 50% 40% 40%;
  background: radial-gradient(closest-side at 50% 70%, rgba(224, 236, 255, .42), rgba(190, 210, 240, .16) 55%, transparent);
  transform-origin: 50% 100%;
  opacity: 0;
  animation: ty-burst var(--t) cubic-bezier(.2, .7, .4, 1) var(--d) infinite;
}

@keyframes ty-burst {
  0% { opacity: 0; transform: scale(.4, .2); }
  14% { opacity: 1; transform: scale(.9, 1); }
  45% { opacity: .5; transform: scale(1.15, 1.1) translate3d(0, -6%, 0); }
  70%, 100% { opacity: 0; transform: scale(1.3, .9) translate3d(-8%, 0, 0); }
}

/* droplets flung up out of it, in square texels */
.ty-spray__drop {
  position: absolute;
  bottom: 30%;
  width: 4px;
  height: 4px;
  background: rgba(225, 238, 255, .7);
  opacity: 0;
  animation: ty-fling var(--t) cubic-bezier(.25, .6, .5, 1) var(--d) infinite;
}

@keyframes ty-fling {
  0% { opacity: 0; transform: translate3d(0, 0, 0); }
  10% { opacity: .9; }
  50% { transform: translate3d(calc(var(--dx) * .6), calc(var(--city-h, 600px) * -.14 * var(--h)), 0); }
  100% { opacity: 0; transform: translate3d(var(--dx), calc(var(--city-h, 600px) * -.02), 0); }
}

/* ---- light theme: grey-blue storm wash on paper ---- */
:root[data-theme="parchment"] .ty-backlight {
  background: radial-gradient(closest-side at 50% 72%, rgba(255, 255, 255, .6), rgba(220, 230, 250, .25) 45%, transparent);
}

:root[data-theme="parchment"] .ty-bolt__core {
  stroke: #5f7bb0;
}

:root[data-theme="parchment"] .ty-scud__band,
:root[data-theme="parchment"] .ty-spray__churn {
  mix-blend-mode: multiply;
  opacity: .12;
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

/* still: the storm stands; no strike, no drift */
@media (prefers-reduced-motion: reduce) {
  .ty-scud__band,
  .ty-veil,
  .ty-spray__churn {
    animation: none;
  }

  .ty-backlight,
  .ty-bolt,
  .ty-spray__drop {
    display: none;
  }

  .ty-spray__plume {
    animation: none;
    opacity: .6;
    transform: none;
  }
}
</style>
