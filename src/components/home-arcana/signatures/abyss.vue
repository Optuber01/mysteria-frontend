<template>
  <!--
    Abyss: the pit opens. The sulfur smoke in the streets parts, a seam of light opens
    beneath the skyline and breathes heat up out of it, lighting the castle from below until
    the city stands black against the glow; then it sinks to a smouldering seam that stays.
    Light from below only: no horizon blaze, no ravens, no drawn flames.
  -->
  <div class="abyss" aria-hidden="true">
    <!-- behind the castle: the pit's glow, rising, so the skyline stands black against it -->
    <div v-if="layer === 'back'" class="ab-glow"><div class="ab-glow__light"><i class="ab-glow__ember"></i></div></div>

    <template v-else>
      <!-- the castle's undersides catch the light from below -->
      <div class="ab-city">
        <i class="ab-under" :style="{'--city-mask': `url(${city})`}"></i>
      </div>

      <!-- the street's sulfur smoke, parting -->
      <div class="ab-smoke ab-smoke--l"><i class="ab-smoke__fog"></i><i class="ab-smoke__tint"></i></div>
      <div class="ab-smoke ab-smoke--r"><i class="ab-smoke__fog"></i><i class="ab-smoke__tint"></i></div>

      <!-- the seam, and the heat it breathes out -->
      <div class="ab-pit">
        <i class="ab-breath"></i>
        <i class="ab-seam__glow"></i>
        <i v-for="(s, i) in SEAM" :key="i" class="ab-seam" :style="s"></i>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import city from '../assets/moon/backlund-skyline.webp';

defineOptions({name: 'SignatureAbyss'});
defineProps<{layer: 'back' | 'front'; from?: string}>();

/* the seam: a few overlapping runs at slightly different heights, so it is never a ruled line */
const SEAM = [
  {left: '4%', width: '40%', '--dy': '-1px', '--i': 1},
  {left: '30%', width: '42%', '--dy': '1px', '--i': 0},
  {left: '60%', width: '36%', '--dy': '0px', '--i': 2},
];
</script>

<style scoped>
.abyss {
  position: absolute;
  inset: 0;
  pointer-events: none;
  /* the pit's line: just above the castle's foot */
  --pit-y: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .075);
}

/* ---- back: the glow behind the city ---- */
/* the blend sits on the box, the motion on the light inside it: an element that blends and animates its own opacity is not composited */
.ab-glow {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px) * 4);
  width: calc(var(--moon-r, 200px) * 8);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .3 - var(--moon-r, 200px) * 1.8);
  height: calc(var(--moon-r, 200px) * 3.6);
  mix-blend-mode: screen;
}

/* the breath (once) and the smoulder (looping) each on their own element: two animations on one element are not composited */
.ab-glow__light {
  position: absolute;
  inset: 0;
  transform-origin: 50% 100%;
  opacity: .42;
  animation: ab-breathe 3.8s ease-in-out 1.1s backwards;
}

.ab-glow__ember {
  position: absolute;
  inset: 0;
  background: radial-gradient(closest-side at 50% 70%, rgba(255, 196, 90, .85), rgba(242, 96, 44, .5) 35%, rgba(150, 40, 15, .2) 66%, transparent);
  will-change: opacity;
  animation: ab-smoulder 6s ease-in-out 4.9s infinite alternate;
}

@keyframes ab-breathe {
  0% { opacity: 0; transform: scaleY(.4); }
  35% { opacity: 1; transform: none; }
  55% { opacity: 1; }
  100% { opacity: .42; }
}

/* the one thing that keeps moving: the pit's glow, slowly brightening and sinking */
@keyframes ab-smoulder {
  to { opacity: .7; }
}

/* ---- front: under-light on the castle, cut to its shape ---- */
.ab-city {
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
}

.ab-under {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(255, 130, 46, .5) 0%, rgba(242, 83, 61, .22) 30%, transparent 58%);
  -webkit-mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mix-blend-mode: screen;
  opacity: .4;
  animation: ab-breathe 3.8s ease-in-out 1.1s backwards;
}

/* ---- front: sulfur smoke, the scene's fog bank tinted yellow-grey, parting at the pit ---- */
.ab-smoke {
  position: absolute;
  top: calc(var(--pit-y) - var(--moon-r, 200px) * .55);
  height: calc(var(--moon-r, 200px) * 1.05);
  width: 60%;
  overflow: hidden;
  isolation: isolate;
  mix-blend-mode: screen;
  /* a soft bank, fading out all round */
  -webkit-mask: radial-gradient(closest-side, #000 45%, transparent);
  mask: radial-gradient(closest-side, #000 45%, transparent);
  opacity: .42;
  will-change: transform;
}

.ab-smoke--l {
  left: 0;
  transform: translate3d(-12%, 0, 0);
  animation: ab-part-l 2.4s cubic-bezier(.4, 0, .2, 1) .7s backwards;
}

.ab-smoke--r {
  right: 0;
  transform: translate3d(14%, 0, 0);
  animation: ab-part-r 2.4s cubic-bezier(.4, 0, .2, 1) .7s backwards;
}

@keyframes ab-part-l {
  from { opacity: .6; transform: translate3d(14%, 0, 0); }
}

@keyframes ab-part-r {
  from { opacity: .6; transform: translate3d(-14%, 0, 0); }
}

.ab-smoke__fog {
  position: absolute;
  inset: 0;
  background: url('../assets/moon/fog-bank.webp') repeat-x 0 50% / 60% 100%;
}

.ab-smoke--r .ab-smoke__fog {
  background-position-x: 45%;
}

.ab-smoke__tint {
  position: absolute;
  inset: 0;
  background-color: #c8b86a;
  mix-blend-mode: multiply;
}

/* ---- front: the seam of light at the castle's foot ---- */
.ab-pit {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px) * 2.6);
  right: 0;
  top: var(--pit-y);
  height: 0;
}

/* the heat breathing up out of the seam: one soft rising light, never flames */
.ab-breath {
  position: absolute;
  left: 8%;
  right: 4%;
  bottom: 0;
  height: calc(var(--moon-r, 200px) * 1.5);
  background: radial-gradient(50% 100% at 50% 100%, rgba(255, 214, 120, .7), rgba(255, 140, 50, .34) 35%, rgba(200, 60, 20, .1) 70%, transparent);
  mix-blend-mode: screen;
  transform-origin: 50% 100%;
  transform: scaleY(.22);
  opacity: .6;
  will-change: transform;
  animation: ab-heave 3.6s cubic-bezier(.3, .1, .3, 1) 1.3s backwards;
}

@keyframes ab-heave {
  0% { opacity: 0; transform: scaleY(.05); }
  30% { opacity: 1; transform: none; }
  50% { transform: scaleY(.85); }
  100% { opacity: .6; transform: scaleY(.22); }
}

/* the light the seam throws on the smoke round it */
.ab-seam__glow {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(var(--moon-r, 200px) * -.12);
  height: calc(var(--moon-r, 200px) * .24);
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(255, 170, 70, .55), rgba(255, 110, 40, .18) 55%, transparent);
  mix-blend-mode: screen;
  animation: ab-open 3s cubic-bezier(.3, 0, .2, 1) 1s backwards;
}

/* the seam itself: hot white-yellow at its heart, cooling to orange, fading at its ends */
.ab-seam {
  position: absolute;
  top: calc(-1.5px + var(--dy));
  height: 3px;
  border-radius: 50%;
  background: linear-gradient(90deg, transparent, rgba(255, 128, 40, .8) 12%, rgba(255, 214, 120, .95) 35%, #fff4c8 52%, rgba(255, 190, 90, .9) 70%, rgba(255, 120, 40, .7) 88%, transparent);
  box-shadow: 0 0 6px rgba(255, 150, 60, .8);
  filter: blur(.7px);
  opacity: .9;
  transform-origin: 50% 50%;
  animation: ab-open 2.4s cubic-bezier(.3, 0, .2, 1) calc(1s + var(--i) * .15s) backwards;
}

/* it tears open from the middle outward */
@keyframes ab-open {
  0% { opacity: 0; transform: scaleX(.05); }
  20% { opacity: 1; }
}

/* light theme: no glow can lighten paper, so the light is laid on as plain colour, fainter */
:root[data-theme="parchment"] .ab-glow,
:root[data-theme="parchment"] .ab-under,
:root[data-theme="parchment"] .ab-breath,
:root[data-theme="parchment"] .ab-seam__glow {
  mix-blend-mode: multiply;
}

:root[data-theme="parchment"] .ab-glow {
  opacity: .7;
}

:root[data-theme="parchment"] .ab-glow__light,
:root[data-theme="parchment"] .ab-glow__ember {
  animation: none;
}

:root[data-theme="parchment"] .ab-under {
  opacity: .25;
}

:root[data-theme="parchment"] .ab-smoke {
  mix-blend-mode: multiply;
  opacity: .25;
}

:root[data-theme="parchment"] .ab-smoke__fog {
  filter: invert(1);
}

:root[data-theme="parchment"] .ab-smoke__tint {
  background-color: #a89a50;
  mix-blend-mode: screen;
}

@media (prefers-reduced-motion: reduce) {
  .ab-glow__light,
  .ab-glow__ember,
  .ab-under,
  .ab-smoke--l,
  .ab-smoke--r,
  .ab-breath,
  .ab-seam__glow,
  .ab-seam {
    animation: none;
  }
}
</style>
