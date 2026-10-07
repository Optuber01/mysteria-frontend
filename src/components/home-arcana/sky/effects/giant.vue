<template>
  <!--
    Twilight Giant: a dusk that never ends. The engine has stopped the sun on the horizon
    under a bruised violet sky; this is the light that stays. Behind the castle, long bands of
    glowing cloud lie across the low sky and hardly move. In front, a heavy amber haze sits
    on the city and fine dust sinks through it like sand. Nothing arrives and nothing leaves.
  -->
  <div v-if="layer === 'back'" class="fx fx--giant fx--back" :class="`is-from-${from}`">
    <div class="sky-anchor">
      <i class="gi-glare"></i>
      <i class="gi-band gi-band--hot"></i>
      <i class="gi-band gi-band--rose"></i>
      <i class="gi-band gi-band--violet"></i>
    </div>
  </div>
  <div v-else class="fx fx--giant fx--front" :class="`is-from-${from}`" :style="{'--city-mask': `url(${city})`}">
    <i class="gi-haze"></i>
    <i class="gi-haze gi-haze--drift"></i>
    <i class="gi-edge gi-edge--soft"></i>
    <i class="gi-edge"></i>
    <i class="gi-sand" :style="{'--m': SAND}"></i>
  </div>
</template>

<script setup lang="ts">
import type {Body} from '../skyScenes';
import city from '../../assets/moon/backlund-skyline.webp';

defineOptions({name: 'SkyGiantEffect'});
defineProps<{layer: 'back' | 'front'; body: Body; from: Body}>();

/* Seeded, so the sand falls the same way on every load. */
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

const SAND_TILE = 560;

/*
 * A tile of fine grains, repeated: the layer sinks by exactly one tile and starts over, with
 * no seam. The tile is one small SVG used as a mask over the sand's colour (one image per
 * tile to draw, where a gradient per grain was a full-tile layer each).
 */
const SAND = (() => {
  const rnd = seeded(1613);
  let grains = '';
  for (let i = 0; i < 46; i++) {
    const x = 6 + rnd() * (SAND_TILE - 12);
    const y = 6 + rnd() * (SAND_TILE - 12);
    const big = rnd() < 0.14;
    const r = big ? 2.4 + rnd() * 1.6 : 0.9 + rnd() * 0.9;
    const a = big ? 30 + rnd() * 25 : 50 + rnd() * 50;
    grains += `<circle cx='${x.toFixed(0)}' cy='${y.toFixed(0)}' r='${r.toFixed(1)}' fill='url(#g)' opacity='${(a / 100).toFixed(2)}'/>`;
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${SAND_TILE}' height='${SAND_TILE}'><defs><radialGradient id='g'><stop offset='0' stop-color='white'/><stop offset='.5' stop-color='white' stop-opacity='.55'/><stop offset='1' stop-color='white' stop-opacity='0'/></radialGradient></defs>${grains}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
})();
</script>

<style scoped>
.fx {
  /* the sun is already on the horizon, or has to come down (or up) to it first */
  --in: 1.6s;
  --sand: rgb(255, 206, 142);
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.fx.is-from-dusk {
  --in: .2s;
}

.fx.is-from-sun {
  --in: 1s;
}

/* ---- behind the castle ---- */
.sky-anchor {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  aspect-ratio: 1;
  /* the dusk sun's centre is .736 of a moon radius below the moon's: 86.8% down this box */
  --sun-y: 86.8%;
}

/* the sun's light spread flat along the horizon */
.gi-glare {
  position: absolute;
  left: -420%;
  right: -420%;
  top: calc(var(--sun-y) - 28%);
  height: 56%;
  background: radial-gradient(closest-side, rgba(255, 170, 92, .62), rgba(240, 112, 72, .26) 42%, transparent);
  animation: gi-in 3s ease var(--in) backwards;
}

/* long bands of cloud, lit from under; the broken texture is the fog bank's, stretched out flat */
.gi-band {
  position: absolute;
  left: -330%;
  right: -330%;
  top: calc(var(--sun-y) + var(--dy));
  height: var(--h);
  /* the fog bank twice over, one copy shifted, so the cloud has body */
  -webkit-mask: url('../../assets/moon/fog-bank.webp') 0 50% / 1900px 100% repeat-x luminance, url('../../assets/moon/fog-bank.webp') 830px 50% / 1900px 100% repeat-x luminance;
  mask: url('../../assets/moon/fog-bank.webp') 0 50% / 1900px 100% repeat-x luminance, url('../../assets/moon/fog-bank.webp') 830px 50% / 1900px 100% repeat-x luminance;
  will-change: transform;
  animation:
    gi-in 3.4s ease calc(var(--in) + var(--late)) backwards,
    gi-sway var(--sway) ease-in-out infinite alternate;
}

.gi-band--hot {
  --dy: -17%;
  --h: 20%;
  --late: .1s;
  --sway: 96s;
  background: radial-gradient(closest-side, rgba(255, 186, 104, 1), rgba(255, 140, 78, .8) 44%, transparent);
}

.gi-band--rose {
  --dy: -52%;
  --h: 30%;
  --late: .4s;
  --sway: 128s;
  background: radial-gradient(closest-side, rgba(244, 124, 104, .95), rgba(226, 98, 108, .6) 46%, transparent);
  animation-direction: normal, alternate-reverse;
}

.gi-band--violet {
  --dy: -102%;
  --h: 44%;
  --late: .7s;
  --sway: 170s;
  background: radial-gradient(closest-side, rgba(196, 122, 176, .8), rgba(150, 90, 160, .46) 50%, transparent);
}

/* ---- in front of the castle ---- */
.gi-haze,
.gi-edge,
.gi-sand {
  position: absolute;
}

/* a heavy amber haze lying low on the city */
.gi-haze {
  left: -4%;
  right: -4%;
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .56);
  height: calc(var(--city-h, 600px) * .66);
  background: linear-gradient(180deg, transparent, rgba(232, 128, 62, .3) 38%, rgba(212, 108, 54, .5) 100%);
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 36%, #000 84%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 36%, #000 84%, transparent);
  animation: gi-in 3s ease calc(var(--in) + .3s) backwards;
}

/* the haze's own banks, moving more slowly than anything else in the picture */
.gi-haze--drift {
  background: linear-gradient(180deg, transparent, rgba(255, 168, 92, .8) 38%, rgba(246, 140, 76, .9) 76%, transparent);
  -webkit-mask: url('../../assets/moon/fog-bank.webp') 0 50% / 1500px 100% repeat-x luminance, url('../../assets/moon/fog-bank.webp') 620px 50% / 1500px 100% repeat-x luminance;
  mask: url('../../assets/moon/fog-bank.webp') 0 50% / 1500px 100% repeat-x luminance, url('../../assets/moon/fog-bank.webp') 620px 50% / 1500px 100% repeat-x luminance;
  will-change: transform;
  animation:
    gi-in 3s ease calc(var(--in) + .3s) backwards,
    gi-sway 150s ease-in-out infinite alternate;
}

/* amber light left on the skyline's edges by a sun that does not move: the city minus itself shifted down */
.gi-edge {
  --k: calc(var(--city-h, 600px) * .006);
  --cx: calc(var(--moon-x, 72%) - var(--city-left, 0px));
  --cy: calc(var(--moon-y, 48%) + var(--moon-r, 200px) * .736 - var(--city-bottom, 100%) + var(--city-h, 600px));
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
  background: radial-gradient(ellipse calc(var(--moon-r, 200px) * 6) calc(var(--moon-r, 200px) * 3.2) at var(--cx) var(--cy),
      rgba(255, 176, 98, .95) 0,
      rgba(246, 126, 72, .55) 40%,
      rgba(200, 80, 80, .16) 72%,
      transparent);
  -webkit-mask: var(--city-mask) 0 0 / 100% 100% no-repeat, var(--city-mask) 0 var(--k) / 100% 100% no-repeat;
  -webkit-mask-composite: source-out;
  mask: var(--city-mask) 0 0 / 100% 100% no-repeat, var(--city-mask) 0 var(--k) / 100% 100% no-repeat;
  mask-composite: subtract;
  animation: gi-in 3s ease calc(var(--in) + .6s) backwards;
}

.gi-edge--soft {
  --k: calc(var(--city-h, 600px) * .022);
  opacity: .4;
}

/* the sand: a tile of grains that sinks one whole tile, and starts over */
.gi-sand {
  left: 0;
  top: calc(var(--tile) * -1);
  --tile: 560px;
  width: 100%;
  height: calc(100% + var(--tile));
  background: var(--sand);
  -webkit-mask: var(--m) 0 0 / var(--tile) var(--tile) repeat;
  mask: var(--m) 0 0 / var(--tile) var(--tile) repeat;
  will-change: transform;
  animation:
    gi-in 3s ease calc(var(--in) + .5s) backwards,
    gi-sink 64s linear infinite;
}

@keyframes gi-in {
  from { opacity: 0; }
}

@keyframes gi-sway {
  from { transform: translate3d(-3.5%, 0, 0); }
  to { transform: translate3d(3.5%, 0, 0); }
}

@keyframes gi-sink {
  to { transform: translate3d(0, var(--tile), 0); }
}

/* paper: the same dusk as a warm violet and amber haze, light on light, never a dark band */
:root[data-theme="parchment"] .fx {
  --sand: rgb(206, 118, 62);
}

:root[data-theme="parchment"] .gi-glare {
  background: radial-gradient(closest-side, rgba(250, 164, 96, .55), rgba(240, 130, 100, .2) 44%, transparent);
}

:root[data-theme="parchment"] .gi-band--hot {
  background: radial-gradient(closest-side, rgba(248, 160, 84, .95), rgba(244, 140, 90, .6) 44%, transparent);
}

:root[data-theme="parchment"] .gi-band--rose {
  background: radial-gradient(closest-side, rgba(238, 134, 130, .8), rgba(226, 120, 140, .46) 46%, transparent);
}

:root[data-theme="parchment"] .gi-band--violet {
  background: radial-gradient(closest-side, rgba(180, 134, 206, .7), rgba(160, 120, 200, .4) 50%, transparent);
}

:root[data-theme="parchment"] .gi-haze {
  background: linear-gradient(180deg, transparent, rgba(190, 150, 200, .28) 30%, rgba(238, 156, 104, .46) 100%);
}

:root[data-theme="parchment"] .gi-haze--drift {
  background: linear-gradient(180deg, transparent, rgba(244, 170, 120, .7) 38%, rgba(240, 150, 100, .8) 76%, transparent);
}

:root[data-theme="parchment"] .gi-edge {
  background: radial-gradient(ellipse calc(var(--moon-r, 200px) * 6) calc(var(--moon-r, 200px) * 3.2) at var(--cx) var(--cy),
      rgba(226, 116, 50, .62) 0,
      rgba(214, 104, 74, .32) 42%,
      rgba(180, 90, 130, .08) 74%,
      transparent);
}

@media (prefers-reduced-motion: reduce) {
  .gi-glare,
  .gi-band,
  .gi-haze,
  .gi-edge,
  .gi-sand {
    animation: none;
  }

  .gi-sand {
    display: none;
  }
}
</style>
