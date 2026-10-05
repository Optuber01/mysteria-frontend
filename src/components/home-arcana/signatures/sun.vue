<template>
  <!--
    Sun: the base scene sets the moon and raises the sun where it was. Once it clears the
    castle, a soft halo ring blooms round it (behind the city), a wave of light washes out
    from it across Backlund, and every shadow on the castle lifts into one even glow
    (Unshadowed). Light, never flame.
  -->
  <div class="sun" aria-hidden="true" :style="{'--sig-city': `url(${city})`}">
    <template v-if="layer === 'back'">
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

defineProps<{layer: 'back' | 'front'}>();
</script>

<style scoped>
.sun {
  /* the sun sits where the moon was, a little smaller (HeroNightScene .night__sun) */
  --r: calc(var(--moon-r, 200px) * .8);
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* ---- behind the castle: the halo, and faint rays turning slowly ---- */
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
  opacity: .9;
  animation:
    sun-bloom 2.2s cubic-bezier(.2, .7, .2, 1) 2.3s both,
    sun-breathe 9s ease-in-out 4.5s infinite;
}

/* a fainter second ring further out */
.sun__halo--outer {
  background: radial-gradient(circle closest-side,
      transparent 78%,
      rgba(255, 220, 160, .14) 81%,
      rgba(255, 240, 200, .16) 82.5%,
      transparent 86%);
  opacity: .8;
  animation:
    sun-bloom 2.8s cubic-bezier(.2, .7, .2, 1) 2.7s both,
    sun-breathe 11s ease-in-out 5.5s infinite reverse;
}

/* soft holy light: long pale rays, faded toward their ends, turning once in a few minutes */
.sun__rays {
  background: repeating-conic-gradient(from 4deg,
      rgba(255, 236, 180, .2) 0deg 2.5deg,
      transparent 6deg 13deg,
      rgba(255, 236, 180, .1) 15deg 16.5deg,
      transparent 19deg 24deg);
  -webkit-mask-image: radial-gradient(circle closest-side, #000 18%, rgba(0, 0, 0, .5) 45%, transparent 92%);
  mask-image: radial-gradient(circle closest-side, #000 18%, rgba(0, 0, 0, .5) 45%, transparent 92%);
  opacity: .55;
  animation:
    sun-rays-in 3s ease 2.2s both,
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
  /* light added to the stone, never paint over it */
  mix-blend-mode: screen;
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
  animation: sun-even 2.6s ease 3.1s both;
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
  animation: sun-wave 2.4s cubic-bezier(.3, .4, .3, 1) 2.5s both;
}

@keyframes sun-bloom {
  from { opacity: 0; transform: scale(.72); }
}

@keyframes sun-breathe {
  50% { opacity: .62; }
}

@keyframes sun-rays-in {
  from { opacity: 0; }
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
  .sun__halo,
  .sun__halo--outer,
  .sun__rays,
  .sun__even {
    animation: none;
  }

  .sun__wave {
    display: none;
  }
}
</style>
