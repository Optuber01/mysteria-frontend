<template>
  <!--
    Sun: the base scene sets the moon (or lets the clouds go, or lifts the twilight sun) and
    raises the sun where it was. First the horizon pales behind the castle, wherever the sky
    was; out of a clouded sky the light breaks through in shafts. Once the sun clears the
    castle a soft halo ring blooms round it, a wave of light washes over Backlund, and every
    shadow on the castle lifts into one even glow (Unshadowed). Light, never flame.
  -->
  <div class="sun" :class="`is-from-${from ?? 'moon'}`" aria-hidden="true" :style="{'--sig-city': `url(${city})`}">
    <template v-if="layer === 'back'">
      <i class="sun__dawn"></i>
      <i class="sun__rays"></i>
      <i class="sun__halo"></i>
      <i class="sun__halo sun__halo--outer"></i>
    </template>
    <div v-else class="sun__lift">
      <i class="sun__even"></i>
      <i class="sun__wave"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import city from '../assets/moon/backlund-skyline.webp';

defineProps<{layer: 'back' | 'front'; from?: string}>();
</script>

<style scoped>
.sun {
  /* the sun sits where the moon was, a little smaller (HeroNightScene .night__sun) */
  --r: calc(var(--moon-r, 200px) * .8);
  /* when the sun has cleared the castle: it rises (from below, from behind cloud, off the horizon) ~2.3 s in */
  --up: 2.3s;
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* already up (a reload with the Sun drawn): no rise to wait for */
.sun.is-from-sun {
  --up: .5s;
}

/* ---- behind the castle ---- */
/* first light: the sky behind the castle pales and warms before the sun shows */
.sun__dawn {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--city-h, 600px) * 1.3);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * 1.05);
  width: calc(var(--city-h, 600px) * 2.6);
  height: calc(var(--city-h, 600px) * .9);
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(255, 226, 170, .42), rgba(255, 190, 130, .2) 45%, rgba(240, 160, 140, .06) 75%, transparent);
  opacity: .7;
  animation: sun-dawn 3.4s ease .15s both;
}

.sun.is-from-sun .sun__dawn {
  animation: none;
}

.sun__halo,
.sun__rays {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--r) * 4);
  top: calc(var(--moon-y, 48%) - var(--r) * 4);
  width: calc(var(--r) * 8);
  aspect-ratio: 1;
  border-radius: 50%;
}

/* a 22-degree halo: warm inner edge, pale ring, a cool breath outside it (radius = 2.4 suns) */
.sun__halo {
  background: radial-gradient(circle closest-side,
      transparent 52%,
      rgba(255, 176, 110, .0) 54%,
      rgba(255, 182, 112, .34) 57.5%,
      rgba(255, 238, 190, .42) 59.5%,
      rgba(255, 246, 214, .2) 62%,
      rgba(200, 220, 255, .08) 65%,
      transparent 70%);
  opacity: .85;
  animation: sun-bloom 2.2s cubic-bezier(.2, .7, .2, 1) var(--up) both;
}

/* a fainter second ring further out */
.sun__halo--outer {
  background: radial-gradient(circle closest-side,
      transparent 78%,
      rgba(255, 220, 160, .14) 81%,
      rgba(255, 240, 200, .16) 82.5%,
      transparent 86%);
  opacity: .75;
  animation: sun-bloom 2.8s cubic-bezier(.2, .7, .2, 1) calc(var(--up) + .4s) both;
}

/*
 * Soft holy light: long pale rays, faded toward their ends, turning once in a few minutes
 * (the one slow loop). Out of a clouded sky they come first, as shafts breaking through.
 */
.sun__rays {
  background: repeating-conic-gradient(from 4deg,
      rgba(255, 236, 180, .2) 0deg 2.5deg,
      transparent 6deg 13deg,
      rgba(255, 236, 180, .1) 15deg 16.5deg,
      transparent 19deg 24deg);
  -webkit-mask-image: radial-gradient(circle closest-side, #000 18%, rgba(0, 0, 0, .5) 45%, transparent 92%);
  mask-image: radial-gradient(circle closest-side, #000 18%, rgba(0, 0, 0, .5) 45%, transparent 92%);
  opacity: .55;
  will-change: transform;
  animation:
    sun-rays-in 3s ease calc(var(--up) - .1s) both,
    sun-turn 240s linear infinite;
}

.sun.is-from-hidden .sun__rays {
  animation:
    sun-break 4.2s ease .7s both,
    sun-turn 240s linear infinite;
}

/* ---- in front of the castle, cut to its silhouette: the wave and the lifted shadows ---- */
.sun__lift {
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
  overflow: hidden;
  -webkit-mask: var(--sig-city) 0 0 / 100% 100% no-repeat;
  mask: var(--sig-city) 0 0 / 100% 100% no-repeat;
}

/* the sun's centre, in the city box */
.sun__wave,
.sun__even {
  --cx: calc(var(--moon-x, 72%) - var(--city-left, 0px));
  --cy: calc(var(--moon-y, 48%) - var(--city-bottom, 100%) + var(--city-h, 600px));
}

/* every shadow lifts: an even warm light over the whole castle, strongest under the sun */
.sun__even {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at var(--cx) var(--cy), rgba(255, 226, 160, .36) 0, rgba(255, 210, 140, .12) calc(var(--r) * 4.5), transparent calc(var(--r) * 7)),
    linear-gradient(180deg, rgba(255, 214, 150, .1) 20%, rgba(255, 200, 130, .24) 70%, rgba(255, 196, 120, .26));
  animation: sun-even 2.6s ease calc(var(--up) + .8s) both;
}

/* the wave: a broad ring of light running out from the sun across the stone */
.sun__wave {
  position: absolute;
  left: calc(var(--cx) - var(--city-h, 600px) * 1.7);
  top: calc(var(--cy) - var(--city-h, 600px) * 1.7);
  width: calc(var(--city-h, 600px) * 3.4);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle closest-side,
      transparent 60%,
      rgba(255, 230, 170, .1) 72%,
      rgba(255, 246, 210, .62) 85%,
      rgba(255, 236, 180, .18) 91%,
      transparent 96%);
  opacity: 0;
  transform: scale(.04);
  animation: sun-wave 2.4s cubic-bezier(.3, .4, .3, 1) calc(var(--up) + .2s) both;
}

@keyframes sun-dawn {
  0% { opacity: 0; transform: translate3d(0, 8%, 0); }
  45% { opacity: 1; }
  100% { opacity: .7; transform: none; }
}

@keyframes sun-bloom {
  from { opacity: 0; transform: scale(.72); }
}

@keyframes sun-rays-in {
  from { opacity: 0; }
}

/* shafts breaking through the last of the cloud, then easing to the day's soft rays */
@keyframes sun-break {
  0% { opacity: 0; }
  40% { opacity: .95; }
  100% { opacity: .55; }
}

@keyframes sun-turn {
  to { transform: rotate(1turn); }
}

@keyframes sun-even {
  from { opacity: 0; }
}

@keyframes sun-wave {
  0% { opacity: 0; transform: scale(.04); }
  14% { opacity: 1; }
  70% { opacity: .75; }
  100% { opacity: 0; transform: scale(1); }
}

/* first light on paper: the same light, gentler */
:root[data-theme="parchment"] .sun__lift {
  opacity: .55;
}

:root[data-theme="parchment"] .sun__dawn {
  background: radial-gradient(closest-side, rgba(240, 190, 110, .3), rgba(240, 180, 120, .12) 50%, transparent);
  mix-blend-mode: multiply;
}

:root[data-theme="parchment"] .sun__halo {
  background: radial-gradient(circle closest-side,
      transparent 52%,
      rgba(214, 140, 60, .0) 54%,
      rgba(214, 140, 60, .26) 57.5%,
      rgba(230, 180, 80, .32) 59.5%,
      rgba(230, 190, 110, .14) 62%,
      transparent 68%);
}

:root[data-theme="parchment"] .sun__rays {
  opacity: .4;
}

@media (prefers-reduced-motion: reduce) {
  .sun__dawn,
  .sun__halo,
  .sun__halo--outer,
  .sun__rays,
  .sun.is-from-hidden .sun__rays,
  .sun__even {
    animation: none;
  }

  .sun__wave {
    display: none;
  }
}
</style>
