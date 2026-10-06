<template>
  <!--
    Fool: the gray fog rises out of the streets, bank over bank, until Backlund is gone under
    it and only the castle's spires stand above, like the palace above the gray fog. A few
    crimson stars hang in it, and one brightens as if someone had just prayed. The fog is
    the scene's own fog-bank texture, in soft bands like .night__fog, tinted and cut like .night__clouds.
  -->
  <div class="fool" aria-hidden="true" :style="{'--fog': `url(${fog})`}">
    <template v-if="layer === 'back'">
      <!-- far fog behind the castle, so the spires stand dark against grey -->
      <div class="fool__bank fool__bank--far"><i class="fool__tex"></i></div>
    </template>
    <template v-else>
      <!-- the banks drift together (one layer, one slow loop); each rises on its own -->
      <div class="fool__drift">
        <div v-for="(b, i) in BANDS" :key="i" class="fool__bank" :style="b"><i class="fool__tex"></i></div>
      </div>
      <i v-for="(s, i) in STARS" :key="`s${i}`" class="fool__star" :class="{'fool__star--prayer': i === PRAYER}" :style="s"></i>
    </template>
  </div>
</template>

<script setup lang="ts">
import fog from '../assets/moon/fog-bank.webp';

defineProps<{layer: 'back' | 'front'; from?: string}>();

/*
 * The banks, from the street up: bottom edge and height (city heights above the city's
 * foot), strength, when it starts rising, and where in the texture it starts (so no two
 * banks line up). The top one levels off at the castle's shoulders, under the spires.
 */
const BANDS = [
  {b: -.06, h: .34, o: .5, d: .2, x: 0},
  {b: .08, h: .3, o: .5, d: .5, x: 37},
  {b: .2, h: .3, o: .52, d: .8, x: 71},
  {b: .31, h: .28, o: .5, d: 1.1, x: 13},
  {b: .4, h: .24, o: .42, d: 1.4, x: 88},
].map(({b, h, o, d, x}) => ({'--b': b, '--h': h, '--o': o, '--d': `${d}s`, '--x': `${x}%`}));

/* crimson stars in the fog round the spires (x across the city box, y above its foot), the
   last one the prayer that flares */
const STARS = [
  {x: .37, y: .58, o: .45, d: 2.2}, {x: .47, y: .69, o: .3, d: 2.5}, {x: .61, y: .55, o: .5, d: 2.35},
  {x: .7, y: .79, o: .35, d: 2.7}, {x: .79, y: .6, o: .42, d: 2.45}, {x: .88, y: .7, o: .32, d: 2.8},
  {x: .95, y: .57, o: .38, d: 2.6}, {x: .83, y: .66, o: .55, d: 2.3},
].map(({x, y, o, d}) => ({'--sx': x, '--sy': y, '--o': o, '--d': `${d}s`}));
const PRAYER = STARS.length - 1;
</script>

<style scoped>
.fool {
  --H: var(--city-h, 600px);
  --tone: #cfccd8;
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* the drifting layer: twice the width, slid one width over three minutes (the one loop) */
.fool__drift {
  position: absolute;
  left: 0;
  top: calc(var(--city-bottom, 100%) - var(--H) * .7);
  height: calc(var(--H) * .76);
  width: 200%;
  will-change: transform;
  animation: fool-drift 180s linear infinite;
}

/*
 * One bank of fog, soft at top and bottom. The fog is the scene's cloud technique: the
 * texture multiplied by the fog's colour and cut by its own luminance, so where there is
 * no fog there is nothing at all (it stays right even while the moment fades in or out).
 */
.fool__bank {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(var(--H) * (var(--b) + .06));
  height: calc(var(--H) * var(--h));
  opacity: var(--o);
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 32%, #000 68%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 32%, #000 68%, transparent);
  animation: fool-rise 2.4s cubic-bezier(.25, .6, .3, 1) var(--d) both;
}

.fool__tex {
  --tile: var(--fog) repeat-x var(--x, 0) 50% / 50% 100%;
  position: absolute;
  inset: 0;
  background: linear-gradient(var(--tone), var(--tone)), var(--tile);
  background-blend-mode: multiply;
  -webkit-mask: var(--tile);
  mask: var(--tile);
  -webkit-mask-mode: luminance;
  mask-mode: luminance;
}

/* behind the castle: one wide bank at the spires' feet */
.fool__bank--far {
  --b: .44;
  --h: .3;
  --o: .4;
  --d: 1s;
  --x: 54%;
  bottom: auto;
  top: calc(var(--city-bottom, 100%) - var(--H) * .76);
}

.fool__bank--far .fool__tex {
  --tile: var(--fog) repeat-x var(--x) 50% / 100% 100%;
}

/* a crimson star in the fog: a single texel of light */
.fool__star {
  position: absolute;
  left: calc(var(--city-left, 0px) + var(--H) * 16 / 9 * var(--sx));
  top: calc(var(--city-bottom, 100%) - var(--H) * var(--sy));
  width: 4px;
  height: 4px;
  margin: -2px 0 0 -2px;
  background: #e2404e;
  box-shadow: 0 0 8px 2px rgba(200, 40, 56, .55);
  opacity: var(--o);
  animation: fool-star 1.6s ease var(--d) both;
}

/* someone prays: it brightens, swells a little, and settles back among the others */
.fool__star--prayer {
  animation: fool-prayer 3.4s ease var(--d) both;
}

@keyframes fool-drift {
  to { transform: translate3d(-50%, 0, 0); }
}

@keyframes fool-rise {
  from { opacity: 0; transform: translate3d(0, calc(var(--H) * .2), 0); }
}

@keyframes fool-star {
  from { opacity: 0; }
}

@keyframes fool-prayer {
  0% { opacity: 0; transform: none; }
  25% { opacity: var(--o); transform: none; }
  45% { opacity: 1; transform: scale(2); }
  100% { opacity: var(--o); transform: none; }
}

/* paper: a pewter fog laid over the haze (multiplied, darker), never white on white */
:root[data-theme="parchment"] .fool {
  --tone: #8f8c99;
}

:root[data-theme="parchment"] .fool__drift,
:root[data-theme="parchment"] .fool__bank--far {
  mix-blend-mode: multiply;
}

:root[data-theme="parchment"] .fool__star {
  background: #b3202b;
  box-shadow: none;
}

@media (prefers-reduced-motion: reduce) {
  .fool__drift,
  .fool__bank,
  .fool__star,
  .fool__star--prayer {
    animation: none;
  }
}
</style>
