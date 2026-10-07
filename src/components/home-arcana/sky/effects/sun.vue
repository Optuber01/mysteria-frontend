<template>
  <!--
    Sun: the light coming in. The engine has already set the moon and raised a low gold sun;
    this is what that light does to the air. Behind the castle, soft shafts turn very slowly
    round the sun and a warm glow lies along the roofline. In front, the last of the fog
    burns off, warm dust drifts in the light and the skyline's edges catch the sun. A sun
    that clears the castle out of a moonlit sky blooms once as it does.
  -->
  <div v-if="layer === 'back'" class="fx fx--sun fx--back" :class="`is-from-${from}`">
    <div class="sky-anchor">
      <i class="sn-horizon"></i>
      <i class="sn-halo"></i>
      <div class="sn-clip"><i class="sn-rays" :style="{backgroundImage: RAYS}"></i></div>
      <i v-if="late" class="sn-flare"></i>
    </div>
  </div>
  <div v-else class="fx fx--sun fx--front" :class="`is-from-${from}`" :style="{'--city-mask': `url(${city})`}">
    <i class="sn-burn"></i>
    <i class="sn-edge sn-edge--soft"></i>
    <i class="sn-edge"></i>
    <div class="sn-motes">
      <i class="sn-mote sn-mote--near" :style="{'--m': NEAR}"></i>
      <i class="sn-mote sn-mote--far" :style="{'--m': FAR}"></i>
      <i class="sn-mote sn-mote--bokeh" :style="{'--m': BOKEH}"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import type {Body} from '../skyScenes';
import city from '../../assets/moon/backlund-skyline.webp';

defineOptions({name: 'SkySunEffect'});
const props = defineProps<{layer: 'back' | 'front'; body: Body; from: Body}>();

/** The sun clears the castle from below: out of the moon's night, or out of the Tyrant's cloud. */
const late = computed(() => props.from === 'moon' || props.from === 'hidden');

/* Seeded, so the shafts and the dust are the same on every load. */
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

const tone = (name: string, pct: number) => `color-mix(in srgb, var(${name}) ${pct.toFixed(0)}%, transparent)`;

/*
 * Shafts: one conic gradient with a soft triangle of light per ray, around the sun. They
 * are spaced so no two overlap, which keeps every edge soft.
 */
const RAYS = (() => {
  const rnd = seeded(2307);
  const count = 18;
  const stops: string[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i + 0.5) * (360 / count) + (rnd() - 0.5) * 6;
    const w = 2.5 + rnd() * 3.5;
    const o = 22 + rnd() * rnd() * 66;
    stops.push(`transparent ${(a - w).toFixed(1)}deg`, `${tone('--ray', o)} ${a.toFixed(1)}deg`, `transparent ${(a + w).toFixed(1)}deg`);
  }
  return `conic-gradient(from 0deg, ${stops.join(', ')})`;
})();

/*
 * A tile of soft dots, repeated: the layer slides by exactly one tile, so the loop never
 * shows its seam. The tile is one small SVG used as a mask over the light's colour: one
 * image to draw per tile, where a gradient per dot was a full-tile layer each.
 */
function dust(seed: number, tile: number, count: number, size: [number, number], alpha: [number, number]) {
  const rnd = seeded(seed);
  let dots = '';
  for (let i = 0; i < count; i++) {
    const r = size[0] + rnd() * (size[1] - size[0]);
    const x = r + rnd() * (tile - 2 * r);
    const y = r + rnd() * (tile - 2 * r);
    const a = (alpha[0] + rnd() * (alpha[1] - alpha[0])) / 100;
    dots += `<circle cx='${x.toFixed(1)}' cy='${y.toFixed(1)}' r='${r.toFixed(1)}' fill='url(#d)' opacity='${a.toFixed(2)}'/>`;
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${tile}' height='${tile}'><defs><radialGradient id='d'><stop offset='0' stop-color='white'/><stop offset='.5' stop-color='white' stop-opacity='.5'/><stop offset='1' stop-color='white' stop-opacity='0'/></radialGradient></defs>${dots}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const NEAR = dust(11, 640, 16, [1.6, 3.2], [55, 100]);
const FAR = dust(29, 420, 12, [1, 1.9], [40, 85]);
const BOKEH = dust(47, 900, 7, [5, 11], [14, 30]);
</script>

<style scoped>
.fx {
  /* when the sun has cleared the castle (the engine raises it 0.3 s in, over 1.6 s) */
  --up: 1.8s;
  --ray: rgb(255, 228, 168);
  --mote: rgb(255, 222, 156);
  --edge: 255, 218, 150;
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.fx.is-from-dusk {
  --up: 1.2s;
}

.fx.is-from-sun {
  --up: .3s;
}

/* ---- behind the castle, on the sun ---- */
.sky-anchor {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  aspect-ratio: 1;
}

/* a warm light along the roofline, where the sun sits */
.sn-horizon {
  position: absolute;
  left: -330%;
  right: -330%;
  top: 8%;
  bottom: -46%;
  background: radial-gradient(closest-side, rgba(255, 206, 134, .5), rgba(255, 176, 100, .2) 46%, transparent);
  animation: sn-in 3s ease var(--up) backwards;
}

/* the sun's light thickening the air round it */
.sn-halo {
  position: absolute;
  inset: -150%;
  border-radius: 50%;
  background: radial-gradient(circle closest-side,
      rgba(255, 220, 160, .36) 0,
      rgba(255, 192, 112, .2) calc(var(--moon-r, 200px) * 1.3),
      rgba(255, 160, 90, .07) calc(var(--moon-r, 200px) * 2.6),
      transparent);
  animation: sn-in 2.6s ease var(--up) backwards;
}

/* the shafts go up and out: below the horizon the castle would hide them anyway */
.sn-clip {
  position: absolute;
  inset: -200%;
  -webkit-mask-image: linear-gradient(180deg, #000 50%, rgba(0, 0, 0, .4) 56%, transparent 66%);
  mask-image: linear-gradient(180deg, #000 50%, rgba(0, 0, 0, .4) 56%, transparent 66%);
}

/* soft shafts through the haze, turning once in seven minutes */
.sn-rays {
  position: absolute;
  inset: 0;
  -webkit-mask-image: radial-gradient(circle closest-side, transparent 7%, #000 20%, rgba(0, 0, 0, .5) 50%, transparent 98%);
  mask-image: radial-gradient(circle closest-side, transparent 7%, #000 20%, rgba(0, 0, 0, .5) 50%, transparent 98%);
  opacity: .8;
  will-change: transform;
  animation:
    sn-in 3.4s ease calc(var(--up) + .2s) backwards,
    sn-turn 420s linear infinite;
}

/* the dawn bloom: the sun clearing the castle, once */
.sn-flare {
  position: absolute;
  /* (as small a box as the bloom needs: it is scaled, and a scaled layer is drawn at its largest) */
  inset: -200%;
  border-radius: 50%;
  background: radial-gradient(circle closest-side, rgba(255, 244, 214, .95) 0, rgba(255, 208, 130, .6) 14%, rgba(255, 168, 96, .16) 48%, transparent 98%);
  opacity: 0;
  animation: sn-flare 2.8s cubic-bezier(.2, .6, .3, 1) calc(var(--up) - .4s) both;
}

/* ---- in front of the castle ---- */
.sn-burn,
.sn-edge,
.sn-motes {
  position: absolute;
}

/* the fog, burning off: the banks lift and thin out of the streets and are gone */
.sn-burn {
  left: -4%;
  right: -4%;
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .62);
  height: calc(var(--city-h, 600px) * .7);
  background: linear-gradient(180deg, transparent, rgba(255, 232, 190, .9) 55%, rgba(255, 220, 170, .9));
  -webkit-mask: url('../../assets/moon/fog-bank.webp') 0 50% / 56% 100% repeat-x luminance, linear-gradient(180deg, transparent, #000 40%, #000 82%, transparent);
  mask: url('../../assets/moon/fog-bank.webp') 0 50% / 56% 100% repeat-x luminance, linear-gradient(180deg, transparent, #000 40%, #000 82%, transparent);
  -webkit-mask-composite: source-in;
  mask-composite: intersect;
  opacity: 0;
  will-change: transform, opacity;
  animation: sn-burn 5.2s ease-out .5s both;
}

.is-from-sun .sn-burn {
  animation-duration: 3s;
}

/* warm light catching the skyline's edges: the city minus itself shifted down is its roofline */
.sn-edge {
  --k: calc(var(--city-h, 600px) * .0065);
  --cx: calc(var(--moon-x, 72%) - var(--city-left, 0px));
  --cy: calc(var(--moon-y, 48%) - var(--city-bottom, 100%) + var(--city-h, 600px));
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
  background: radial-gradient(circle at var(--cx) var(--cy),
      rgba(var(--edge), .95) 0,
      rgba(255, 190, 110, .6) calc(var(--moon-r, 200px) * 1.6),
      rgba(240, 150, 80, .2) calc(var(--moon-r, 200px) * 3.4),
      transparent calc(var(--moon-r, 200px) * 5.5));
  -webkit-mask: var(--city-mask) 0 0 / 100% 100% no-repeat, var(--city-mask) 0 var(--k) / 100% 100% no-repeat;
  -webkit-mask-composite: source-out;
  mask: var(--city-mask) 0 0 / 100% 100% no-repeat, var(--city-mask) 0 var(--k) / 100% 100% no-repeat;
  mask-composite: subtract;
  animation: sn-in 2.4s ease calc(var(--up) + .5s) backwards;
}

/* a broader, fainter edge under it: the light wrapping over the stone */
.sn-edge--soft {
  --k: calc(var(--city-h, 600px) * .022);
  opacity: .5;
}

/* dust in the light, only where the light is */
.sn-motes {
  inset: 0;
  -webkit-mask-image: radial-gradient(70% 78% at var(--moon-x, 72%) calc(var(--moon-y, 48%) + var(--moon-r, 200px) * .8), #000 20%, rgba(0, 0, 0, .55) 58%, transparent);
  mask-image: radial-gradient(70% 78% at var(--moon-x, 72%) calc(var(--moon-y, 48%) + var(--moon-r, 200px) * .8), #000 20%, rgba(0, 0, 0, .55) 58%, transparent);
  animation: sn-in 2.6s ease calc(var(--up) + .4s) backwards;
}

/* each layer is a tile of dots that slides one whole tile, up and to the left, and starts over */
.sn-mote {
  --t: 640px;
  position: absolute;
  left: 0;
  top: 0;
  width: calc(100% + var(--t));
  height: calc(100% + var(--t));
  background: var(--mote);
  -webkit-mask: var(--m) 0 0 / var(--t) var(--t) repeat;
  mask: var(--m) 0 0 / var(--t) var(--t) repeat;
  will-change: transform;
  animation: sn-drift 78s linear infinite;
}

.sn-mote--far {
  --t: 420px;
  animation-duration: 54s;
}

.sn-mote--bokeh {
  --t: 900px;
  animation:
    sn-drift 130s linear infinite,
    sn-breathe 9s ease-in-out infinite alternate;
}

@keyframes sn-in {
  from { opacity: 0; }
}

@keyframes sn-turn {
  to { rotate: 1turn; }
}

@keyframes sn-flare {
  0% { opacity: 0; transform: scale(.3); }
  30% { opacity: 1; }
  100% { opacity: 0; transform: scale(1.2); }
}

@keyframes sn-burn {
  from { opacity: .85; transform: translate3d(0, 0, 0); }
  to { opacity: 0; transform: translate3d(0, -9%, 0); }
}

@keyframes sn-drift {
  to { transform: translate3d(calc(var(--t) * -1), calc(var(--t) * -1), 0); }
}

@keyframes sn-breathe {
  to { opacity: .45; }
}

/* paper: golden light in the morning haze, deeper gold so it reads against the pale sky */
:root[data-theme="parchment"] .fx {
  --ray: rgb(238, 164, 52);
  --mote: rgb(222, 146, 46);
  --edge: 232, 140, 34;
}

:root[data-theme="parchment"] .sn-horizon {
  background: radial-gradient(closest-side, rgba(250, 190, 100, .42), rgba(250, 180, 100, .14) 50%, transparent);
}

:root[data-theme="parchment"] .sn-halo {
  background: radial-gradient(circle closest-side,
      rgba(255, 196, 100, .4) 0,
      rgba(250, 180, 90, .18) calc(var(--moon-r, 200px) * 1.3),
      rgba(250, 170, 90, .06) calc(var(--moon-r, 200px) * 2.6),
      transparent);
}

:root[data-theme="parchment"] .sn-rays {
  opacity: .5;
}

:root[data-theme="parchment"] .sn-burn {
  background: linear-gradient(180deg, transparent, rgba(255, 214, 150, .9) 55%, rgba(255, 206, 140, .9));
}

:root[data-theme="parchment"] .sn-edge {
  background: radial-gradient(circle at var(--cx) var(--cy),
      rgba(var(--edge), .62) 0,
      rgba(232, 146, 52, .32) calc(var(--moon-r, 200px) * 1.8),
      rgba(232, 146, 52, .08) calc(var(--moon-r, 200px) * 3.4),
      transparent calc(var(--moon-r, 200px) * 4.8));
}

@media (prefers-reduced-motion: reduce) {
  .sn-horizon,
  .sn-halo,
  .sn-rays,
  .sn-edge,
  .sn-motes,
  .sn-mote {
    animation: none;
  }

  .sn-flare,
  .sn-burn {
    display: none;
  }
}
</style>
