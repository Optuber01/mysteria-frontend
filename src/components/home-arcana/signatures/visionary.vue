<template>
  <!--
    Visionary: the lower part of the hero becomes a still mirror sea (the Sea of Collective
    Subconscious), the city and the moon reflected upside down in it. The reflection ripples,
    and something vast glides beneath the surface, seen only as a disturbance in the mirrored
    city and a long shadow, a dragon of imagination. Then the water stills.
  -->
  <div class="vis" aria-hidden="true" :style="{'--sig-city': `url(${city})`}">
    <div v-if="layer === 'front'" class="vis__sea">
      <i class="vis__water"></i>
      <!-- the mirror, cut in strips so each can sway on its own -->
      <i class="vis__reflect">
        <i v-for="k in STRIPS" :key="k" class="vis__strip" :style="{'--k': k - 1, '--amp': (0.5 + (k / STRIPS) * 1.2).toFixed(2)}">
          <i class="vis__mirror">
            <i class="vis__city"></i>
            <img class="vis__moon" :src="moonImg" alt="" decoding="async">
          </i>
        </i>
      </i>
      <!-- the dragon: a lens of warped reflection and a long shadow, gliding under the surface -->
      <i class="vis__dragon">
        <i class="vis__lens">
          <i class="vis__mirror vis__mirror--warp">
            <i class="vis__city"></i>
            <img class="vis__moon" :src="moonImg" alt="" decoding="async">
          </i>
        </i>
        <svg class="vis__body" viewBox="0 0 400 60" preserveAspectRatio="none">
          <path d="M0 34 C40 30 70 22 110 26 S180 44 220 38 S300 18 340 24 C364 27 384 22 400 28 C386 36 366 40 340 38 S292 34 252 44 S170 54 120 42 S48 36 0 34 Z"/>
        </svg>
      </i>
      <i class="vis__tint"></i>
      <i class="vis__horizon"></i>
      <svg class="vis__defs" width="0" height="0">
        <filter id="vis-warp" x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency=".012 .05" numOctaves="2" seed="4"/>
          <feDisplacementMap in="SourceGraphic" scale="52" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import city from '../assets/moon/backlund-skyline.webp';
import moonImg from '../assets/moon/crimson-moon.webp';

defineProps<{layer: 'back' | 'front'}>();

const STRIPS = 12;
</script>

<style scoped>
.vis {
  /* the waterline, and how much the reflection is foreshortened */
  --wl: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .3);
  --fold: .55;
  --sh: calc(var(--city-h, 600px) * .036);
  --water-top: rgba(28, 40, 76, .9);
  --water-deep: rgba(12, 18, 38, .97);
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.vis__sea {
  position: absolute;
  inset: var(--wl) 0 0;
  overflow: hidden;
  animation: vis-flood 1.8s ease .4s both;
  -webkit-mask-image: linear-gradient(180deg, #000 70%, transparent);
  mask-image: linear-gradient(180deg, #000 70%, transparent);
}

@keyframes vis-flood {
  from { opacity: 0; }
}

.vis__water {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(60% 40% at calc(var(--moon-x, 72%)) 0, rgba(142, 197, 255, .14), transparent 70%),
    linear-gradient(180deg, var(--water-top), var(--water-deep) 60%);
}

/* ---- the mirror: the view above the waterline, flipped and foreshortened ---- */
/* one opacity for all the strips, so where they overlap by a pixel there is no seam */
.vis__reflect {
  position: absolute;
  inset: 0;
  opacity: .55;
}

.vis__strip {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(var(--sh) * var(--k));
  height: calc(var(--sh) + 1px);
  overflow: hidden;
  animation: vis-ripple 3.4s ease-out calc(1.1s + var(--k) * .07s) both;
}

/* each strip sees the whole mirror, shifted up by its own place */
.vis__strip > .vis__mirror {
  top: calc(var(--wl) * -1 - var(--sh) * var(--k));
}

.vis__mirror {
  position: absolute;
  left: 0;
  width: 100vw;
  height: var(--wl);
  transform-origin: 50% 100%;
  transform: scaleY(calc(var(--fold) * -1));
}

.vis__city {
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
  background: var(--sig-city) 0 0 / 100% 100% no-repeat;
}

.vis__moon {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px) * var(--moon-scale, 1));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * var(--moon-scale, 1));
  width: calc(var(--moon-r, 200px) * 2 * var(--moon-scale, 1));
  max-width: none;
  height: auto;
  filter: saturate(.9) brightness(.8) var(--moon-filter, );
}

/* a ripple runs down the reflection and dies away */
@keyframes vis-ripple {
  0% { transform: translateX(0); }
  8% { transform: translateX(calc(var(--amp) * 7px)); }
  18% { transform: translateX(calc(var(--amp) * -6px)); }
  30% { transform: translateX(calc(var(--amp) * 4px)); }
  44% { transform: translateX(calc(var(--amp) * -3px)); }
  60% { transform: translateX(calc(var(--amp) * 1.6px)); }
  78% { transform: translateX(calc(var(--amp) * -.6px)); }
  100% { transform: translateX(0); }
}

/* ---- the dragon passing beneath ---- */
.vis__dragon {
  --len: calc(var(--city-h, 600px) * 1.1);
  position: absolute;
  left: 0;
  top: calc(var(--city-h, 600px) * .07);
  width: var(--len);
  height: calc(var(--city-h, 600px) * .16);
  transform: translateX(calc(100vw + 10%));
  opacity: 0;
  animation: vis-glide 5.2s cubic-bezier(.45, .1, .5, .95) 1.7s both;
}

/* the lens moves; the warped mirror inside it holds still against the world */
.vis__lens {
  position: absolute;
  inset: 0;
  overflow: hidden;
  -webkit-mask-image: radial-gradient(50% 50% at 50% 50%, #000 40%, transparent 100%);
  mask-image: radial-gradient(50% 50% at 50% 50%, #000 40%, transparent 100%);
}

.vis__mirror--warp {
  top: calc(var(--wl) * -1 - var(--city-h, 600px) * .07);
  opacity: .8;
  filter: url(#vis-warp);
  animation: vis-hold 5.2s cubic-bezier(.45, .1, .5, .95) 1.7s both;
}

/* a long dark shape under the water, its own outline lost in the deep */
.vis__body {
  position: absolute;
  left: 0;
  top: 30%;
  width: 100%;
  max-width: none;
  height: 60%;
  fill: rgba(4, 8, 22, .7);
  filter: blur(7px);
  animation: vis-undulate 2.6s ease-in-out infinite alternate;
}

@keyframes vis-glide {
  0% { opacity: 0; transform: translateX(calc(var(--len) * -1)); }
  18%, 78% { opacity: 1; }
  100% { opacity: 0; transform: translateX(100vw); }
}

@keyframes vis-hold {
  0% { transform: translateX(var(--len)) scaleY(calc(var(--fold) * -1)); }
  100% { transform: translateX(-100vw) scaleY(calc(var(--fold) * -1)); }
}

@keyframes vis-undulate {
  to { transform: translateY(6px) scaleY(.85); }
}

/* the dream's colour over the whole sea, and a fine bright waterline */
.vis__tint {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(120, 150, 230, .16), rgba(40, 50, 110, .2));
}

.vis__horizon {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(190, 220, 255, .4) 40%, rgba(220, 235, 255, .55) 70%, rgba(190, 220, 255, .3));
}

.vis__defs {
  position: absolute;
}

/* paper: a pale pearly mirror */
:root[data-theme="parchment"] .vis {
  --water-top: rgba(214, 222, 238, .88);
  --water-deep: rgba(226, 230, 240, .96);
}

:root[data-theme="parchment"] .vis__reflect {
  opacity: .3;
}

:root[data-theme="parchment"] .vis__body {
  fill: rgba(70, 90, 140, .25);
}

:root[data-theme="parchment"] .vis__tint {
  background: linear-gradient(180deg, rgba(160, 180, 230, .12), transparent);
}

@media (prefers-reduced-motion: reduce) {
  .vis__sea,
  .vis__strip {
    animation: none;
  }

  .vis__dragon {
    display: none;
  }
}
</style>
