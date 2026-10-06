<template>
  <!--
    Visionary: the lower part of the hero becomes a still mirror sea (the Sea of Collective
    Subconscious), the city and the moon reflected upside down in it. One slow ripple runs
    down the reflection, as if a thought had touched the surface, and the water stills.
    The reflected moon waits for the real one if it is still rising or behind cloud.
  -->
  <div class="vis" :class="{'is-late': from && from !== 'moon'}" aria-hidden="true" :style="{'--sig-city': `url(${city})`}">
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
      <i class="vis__tint"></i>
      <i class="vis__horizon"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import city from '../assets/moon/backlund-skyline.webp';
import moonImg from '../assets/moon/crimson-moon.webp';

defineProps<{layer: 'back' | 'front'; from?: string}>();

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
  /* the reflected moon shows once the real one is up */
  --moon-in: .6s;
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
  animation: vis-ripple 4.2s ease-out calc(1s + var(--k) * .08s) both;
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
  animation: vis-flood 1.6s ease var(--moon-in) both;
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

.vis.is-late {
  --moon-in: 2.4s;
}

/* paper: a pale pearly mirror */
:root[data-theme="parchment"] .vis {
  --water-top: rgba(214, 222, 238, .88);
  --water-deep: rgba(226, 230, 240, .96);
}

:root[data-theme="parchment"] .vis__reflect {
  opacity: .3;
}

:root[data-theme="parchment"] .vis__tint {
  background: linear-gradient(180deg, rgba(160, 180, 230, .12), transparent);
}

@media (prefers-reduced-motion: reduce) {
  .vis__sea,
  .vis__strip {
    animation: none;
  }

  .vis__moon {
    animation: none;
  }
}
</style>
