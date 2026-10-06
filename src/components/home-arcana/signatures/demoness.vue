<template>
  <!--
    Demoness: the light goes cold and violet, and whatever hangs in the sky is doubled, as if
    seen in a mirror: a faint second moon (or sun) slides out of the real one and stays a
    little apart from it. Frost creeps in from the edges of the view, a soft frosted rim
    on the glass, and the castle's edges catch a cold pink-white light. Catastrophe is
    quiet here: no cracks, no flame.
  -->
  <div class="de" :class="`is-from-${from ?? 'moon'}`" aria-hidden="true" :style="{'--sig-city': `url(${city})`}">
    <template v-if="layer === 'back'">
      <i class="de__cold"></i>
      <!-- the doubled sun: splits off the sun that was up, and sets with it -->
      <div v-if="from === 'sun'" class="de__sun">
        <div class="de__sun-set">
          <i class="de__sun-double"></i>
        </div>
      </div>
      <!-- the doubled moon, kept on the moon (its rise, its sink on scroll) -->
      <div ref="followRef" class="de__anchor">
        <div ref="riseRef" class="de__rise">
          <img class="de__moon-double" :src="moonImg" alt="" decoding="async">
        </div>
      </div>
    </template>
    <template v-else>
      <i class="de__rim"></i>
      <i class="de__frost" :style="{'--noise': NOISE}"></i>
    </template>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import city from '../assets/moon/backlund-skyline.webp';
import moonImg from '../assets/moon/crimson-moon.webp';
import {useMoonAnchor} from './sigKit';

defineProps<{layer: 'back' | 'front'; from?: string}>();

const followRef = ref<HTMLElement | null>(null);
const riseRef = ref<HTMLElement | null>(null);
useMoonAnchor(followRef, riseRef);

/*
 * Hoarfrost, as noise rather than line art: fine grains (high-frequency turbulence, its
 * alpha pushed to a threshold so it reads as crystals) gathered in drifts (a low-frequency
 * turbulence modulating them). A static tile; the frost only ever moves as a whole.
 */
const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='280' height='280'>
<filter id='g'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' seed='7' stitchTiles='stitch'/>
<feColorMatrix values='0 0 0 0 .96  0 0 0 0 .92  0 0 0 0 1  0 0 0 3.2 -1.75'/></filter>
<filter id='d'><feTurbulence type='fractalNoise' baseFrequency='.012' numOctaves='3' seed='3' stitchTiles='stitch'/>
<feColorMatrix values='0 0 0 0 .9  0 0 0 0 .86  0 0 0 0 .98  0 0 0 1.6 -.5'/></filter>
<rect width='100%' height='100%' filter='url(#d)' opacity='.55'/><rect width='100%' height='100%' filter='url(#g)'/></svg>`;
const NOISE = `url("data:image/svg+xml,${encodeURIComponent(svg.replace(/\n/g, ''))}")`;
</script>

<style scoped>
.de {
  /* the doubled moon steps out once the moon is up: at once, or after it has risen or come out of cloud */
  --moon-in: .8s;
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.de:not(.is-from-moon) {
  --moon-in: 2.4s;
}

/* ---- behind the castle ---- */
/* cold violet light in the air round the moon */
.de__cold {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px) * 3.6);
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * 3.6);
  width: calc(var(--moon-r, 200px) * 7.2);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle closest-side, rgba(170, 140, 255, .2) 14%, rgba(140, 100, 220, .1) 40%, rgba(110, 70, 180, .04) 66%, transparent);
  animation: de-fade 2.6s ease .3s both;
}

/* the moon's double: the real image, faint, cooled, a little up and to the right of the moon */
.de__anchor {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  aspect-ratio: 1;
}

.de__rise {
  position: absolute;
  inset: 0;
  transform: scale(var(--moon-scale, 1));
}

.de__moon-double {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  filter: saturate(.7) hue-rotate(-18deg) brightness(1.1) var(--moon-filter, );
  opacity: .3;
  transform: translate3d(42%, -30%, 0);
  animation: de-split 2.6s cubic-bezier(.3, .1, .2, 1) var(--moon-in) both;
}

/* the sun's double, where the sun hangs (HeroNightScene .night__sun), going down with it */
.de__sun {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px) * .8);
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * .8);
  width: calc(var(--moon-r, 200px) * 1.6);
  aspect-ratio: 1;
}

/* the sun sets on the scene's own timing (.night__sun-rise: 3.2 s for the drop, 1.6 s fade, both after .9 s) */
.de__sun-set {
  position: absolute;
  inset: 0;
  animation:
    de-sun-drop 3.2s cubic-bezier(.16, .84, .3, 1) .9s both,
    de-sun-fade 1.6s ease .9s both;
}

.de__sun-double {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 246, 240, .9) 0%, rgba(255, 220, 240, .7) 45%, rgba(230, 170, 230, .4) 80%, transparent 100%);
  opacity: .32;
  transform: translate3d(42%, -30%, 0);
  animation: de-split 1.1s cubic-bezier(.3, .1, .2, 1) .1s both;
}

@keyframes de-split {
  0% { opacity: 0; transform: none; }
  25% { opacity: .5; }
  100% { opacity: .3; transform: translate3d(42%, -30%, 0); }
}

@keyframes de-sun-drop {
  to { transform: translate3d(0, 90%, 0); }
}

@keyframes de-sun-fade {
  to { opacity: 0; }
}

@keyframes de-fade {
  from { opacity: 0; }
}

/* ---- in front ---- */
/* a cold pink-white edge on the roofs nearest the moon, cut to the skyline */
.de__rim {
  --k: calc(var(--city-h, 600px) * .004);
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
  background: radial-gradient(circle at calc(var(--moon-x, 72%) - var(--city-left, 0px)) calc(var(--moon-y, 48%) - var(--city-bottom, 100%) + var(--city-h, 600px)),
      rgba(255, 230, 250, .9) 0, rgba(230, 160, 230, .55) calc(var(--moon-r, 200px) * 1.8), transparent calc(var(--moon-r, 200px) * 4));
  -webkit-mask: var(--sig-city) 0 0 / 100% 100% no-repeat, var(--sig-city) 0 var(--k) / 100% 100% no-repeat;
  -webkit-mask-composite: source-out;
  mask: var(--sig-city) 0 0 / 100% 100% no-repeat, var(--sig-city) 0 var(--k) / 100% 100% no-repeat;
  mask-composite: subtract;
  opacity: .5;
  animation: de-fade 2s ease 1.6s both;
}

/*
 * Frost on the glass: the grains and a pale violet-white bloom, thick at the edges and
 * corners, clear in the middle (a static mask). It creeps in by shrinking from beyond the
 * frame to its place: transform only.
 */
.de__frost {
  position: absolute;
  inset: 0;
  background:
    var(--noise) 0 0 / 280px 280px,
    radial-gradient(130% 120% at 62% 46%, transparent 52%, rgba(236, 220, 255, .16) 78%, rgba(246, 236, 255, .3));
  -webkit-mask-image: radial-gradient(120% 110% at 62% 46%, transparent 50%, rgba(0, 0, 0, .35) 66%, #000 92%);
  mask-image: radial-gradient(120% 110% at 62% 46%, transparent 50%, rgba(0, 0, 0, .35) 66%, #000 92%);
  opacity: .62;
  animation: de-frost 2.8s cubic-bezier(.25, .55, .3, 1) .5s both;
}

@keyframes de-frost {
  from { opacity: 0; transform: scale(1.3); }
}

/* stacked: the hero is a band; the frost stays to the corners */
@media (max-width: 900px) {
  .de__frost {
    -webkit-mask-image: radial-gradient(130% 100% at 50% 50%, transparent 58%, rgba(0, 0, 0, .35) 72%, #000 96%);
    mask-image: radial-gradient(130% 100% at 50% 50%, transparent 58%, rgba(0, 0, 0, .35) 72%, #000 96%);
  }
}

/* paper: rime as cool lilac-grey on the haze (multiplied), the doubles faint ink */
:root[data-theme="parchment"] .de__cold,
:root[data-theme="parchment"] .de__rim,
:root[data-theme="parchment"] .de__moon-double,
:root[data-theme="parchment"] .de__sun-double {
  mix-blend-mode: multiply;
}

:root[data-theme="parchment"] .de__rim {
  background: radial-gradient(circle at calc(var(--moon-x, 72%) - var(--city-left, 0px)) calc(var(--moon-y, 48%) - var(--city-bottom, 100%) + var(--city-h, 600px)),
      rgba(150, 90, 150, .7) 0, rgba(150, 90, 150, .3) calc(var(--moon-r, 200px) * 2), transparent calc(var(--moon-r, 200px) * 4));
}

:root[data-theme="parchment"] .de__frost {
  background: radial-gradient(130% 120% at 62% 46%, transparent 50%, rgba(170, 160, 200, .22) 78%, rgba(150, 140, 190, .38));
  mix-blend-mode: multiply;
}

@media (prefers-reduced-motion: reduce) {
  .de__cold,
  .de__moon-double,
  .de__sun-double,
  .de__rim,
  .de__frost {
    animation: none;
  }

  .de__sun {
    display: none;
  }
}
</style>
