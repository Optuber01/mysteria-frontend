<template>
  <!--
    Twilight Giant: the twilight of all things. The sun stalls on the horizon and long, low
    shafts of dawn light rake out from behind the castle across the city; the dust in them
    slows and hangs where it is (time decelerating), and the light stays on the castle's
    faces. A frozen dusk: no figure, no sunrise, no fire.
  -->
  <div class="giant" :style="{'--lag': lag}" aria-hidden="true">
    <!-- the shafts, fanning low from the sun behind the castle (and, fainter, in the air before it) -->
    <div class="gi-rays" :class="`gi-rays--${layer}`">
      <div class="gi-rays__breath">
        <i v-for="(s, i) in SHAFTS" :key="i" class="gi-shaft" :style="s"></i>
      </div>
    </div>
    <template v-if="layer === 'back'">
      <!-- dust caught in the light, slowing to a stop -->
      <div class="gi-dust">
        <i v-for="(d, i) in DUST" :key="i" class="gi-mote" :style="d"></i>
      </div>
    </template>

    <!-- the low light laid across the castle's faces, cut to the skyline -->
    <div v-else class="gi-city">
      <i class="gi-rake" :style="{'--city-mask': `url(${city})`}"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import city from '../assets/moon/backlund-skyline.webp';
import {seeded} from './sigKit';

defineOptions({name: 'SignatureGiant'});
const props = defineProps<{layer: 'back' | 'front'; from?: string}>();

/* the sun has to come down (or up) to the horizon first; the shafts wait for it */
const lag = computed(() => (props.from === 'dusk' ? '0s' : props.from === 'sun' ? '.5s' : '.9s'));

const rnd = seeded(808);
const f2 = (n: number) => n.toFixed(2);

/*
 * Shafts: angle (deg; 0 = right, 180 = left, negative tilts up), length and spread in moon
 * radii, strength. Low and nearly level, longer to the west where the city lies.
 */
const SHAFTS = [
  {a: 182, l: 8, w: .5, o: 1}, {a: 187.5, l: 7.6, w: .7, o: .75}, {a: 193, l: 7, w: .46, o: .9},
  {a: 200, l: 6, w: .64, o: .6}, {a: 210, l: 4.8, w: .5, o: .45},
  {a: -2, l: 5.2, w: .46, o: .9}, {a: -8, l: 4.8, w: .66, o: .7}, {a: -15, l: 4.2, w: .44, o: .55}, {a: -26, l: 3.6, w: .56, o: .38},
].map((s, i) => ({
  '--a': `${s.a}deg`, '--l': s.l, '--w': s.w, '--o': s.o, '--i': i,
}));

/* dust along the shafts: where it ends up (moon radii from the sun) and how far it was still drifting */
const DUST = Array.from({length: 34}, () => {
  const s = SHAFTS[rnd() < .35 ? 5 + Math.floor(rnd() * 4) : Math.floor(rnd() * 5)]!;
  const a = (parseFloat(s['--a']) * Math.PI) / 180;
  const d = 1.2 + rnd() * (s['--l'] as number) * .55;
  const off = (rnd() - .5) * .3;
  return {
    '--x': f2(Math.cos(a) * d - Math.sin(a) * off),
    '--y': f2(Math.sin(a) * d + Math.cos(a) * off),
    '--dx': f2((rnd() - .3) * .5),
    '--dy': f2(.12 + rnd() * .3),
    '--s': rnd() < .3 ? '3px' : '2px',
    '--o': f2(.35 + rnd() * .5),
    '--t': `${f2(rnd() * .8)}s`,
  };
});
</script>

<style scoped>
.giant {
  position: absolute;
  inset: 0;
  pointer-events: none;
  /* the twilight sun's centre: it sits 46% of its box below the moon's place (HeroNightScene .is-dusk) */
  --sun-x: var(--moon-x, 72%);
  --sun-y: calc(var(--moon-y, 48%) + var(--moon-r, 200px) * .736);
}

/* ---- the shafts ---- */
.gi-rays {
  position: absolute;
  left: var(--sun-x);
  top: var(--sun-y);
  width: 0;
  height: 0;
  /* one soft blur over every shaft: light in air, never a drawn wedge */
  filter: blur(calc(var(--moon-r, 200px) * .05));
}

/* in front of the castle: the same light in the near air, much fainter (and still: one breathing layer is enough) */
.gi-rays--front {
  opacity: .32;
}

.gi-rays--front .gi-rays__breath {
  animation: none;
}

.gi-rays__breath {
  position: absolute;
  inset: 0;
  will-change: opacity;
  animation: gi-breath 11s ease-in-out calc(5s + var(--lag)) infinite alternate;
}

@keyframes gi-breath {
  to { opacity: .78; }
}

.gi-shaft {
  position: absolute;
  left: 0;
  top: calc(var(--moon-r, 200px) * var(--w) * -.5);
  width: calc(var(--moon-r, 200px) * var(--l));
  height: calc(var(--moon-r, 200px) * var(--w));
  transform-origin: 0 50%;
  transform: rotate(var(--a));
  /* narrow at the sun, opening as it travels, gone by the far end */
  clip-path: polygon(0 46%, 100% 0, 100% 100%, 0 54%);
  background: linear-gradient(90deg, rgba(255, 214, 150, 0) 0%, rgba(255, 206, 140, .9) 6%, rgba(255, 172, 104, .5) 34%, rgba(240, 132, 90, .16) 70%, transparent);
  mix-blend-mode: screen;
  opacity: var(--o);
  animation: gi-reach 2.6s cubic-bezier(.2, .6, .3, 1) calc(1.1s + var(--lag) + var(--i) * .07s) backwards;
}

/* each shaft runs out from the sun along the rooftops */
@keyframes gi-reach {
  from { opacity: 0; transform: rotate(var(--a)) scaleX(.15); }
}

/* ---- back: the dust, drifting, slowing, hanging ---- */
.gi-dust {
  position: absolute;
  left: var(--sun-x);
  top: var(--sun-y);
  width: var(--moon-r, 200px);
  height: var(--moon-r, 200px);
}

.gi-mote {
  position: absolute;
  left: calc(var(--x) * 100%);
  top: calc(var(--y) * 100%);
  width: var(--s);
  height: var(--s);
  background: #ffdcae;
  box-shadow: 0 0 4px rgba(255, 190, 120, .55);
  opacity: var(--o);
  /* the drift runs down like a clock winding out, and stops */
  animation: gi-hang 4.6s cubic-bezier(.05, .6, .1, 1) calc(1.4s + var(--lag) + var(--t)) backwards;
}

@keyframes gi-hang {
  0% { opacity: 0; transform: translate3d(calc(var(--moon-r, 200px) * var(--dx) * -1), calc(var(--moon-r, 200px) * var(--dy) * -1), 0); }
  20% { opacity: var(--o); }
}

/* ---- front: the low light across the castle's faces ---- */
.gi-city {
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
}

.gi-rake {
  position: absolute;
  inset: 0;
  /* strongest at the sun's height, raking out sideways; a warm edge along the tops */
  background:
    radial-gradient(calc(var(--moon-r, 200px) * 5.5) calc(var(--moon-r, 200px) * .9) at calc(var(--sun-x) - var(--city-left, 0px)) calc(var(--sun-y) - var(--city-bottom, 100%) + var(--city-h, 600px)), rgba(255, 168, 98, .62), rgba(255, 140, 80, .2) 55%, transparent),
    radial-gradient(calc(var(--moon-r, 200px) * 2.2) calc(var(--moon-r, 200px) * 2) at calc(var(--sun-x) - var(--city-left, 0px)) calc(var(--sun-y) - var(--city-bottom, 100%) + var(--city-h, 600px)), rgba(255, 196, 130, .5), transparent 70%);
  -webkit-mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mix-blend-mode: screen;
  opacity: .75;
  animation: gi-lit 3s ease-out calc(1.3s + var(--lag)) backwards;
}

@keyframes gi-lit {
  from { opacity: 0; }
}

/* light theme: the shafts are amber haze over paper, the light a warm tint on the castle */
:root[data-theme="parchment"] .gi-shaft {
  mix-blend-mode: multiply;
  background: linear-gradient(90deg, rgba(240, 170, 100, 0) 0%, rgba(240, 170, 100, .34) 7%, rgba(235, 160, 110, .16) 40%, transparent 80%);
}

:root[data-theme="parchment"] .gi-mote {
  background: #c8823e;
  box-shadow: none;
}

:root[data-theme="parchment"] .gi-rake {
  mix-blend-mode: multiply;
  opacity: .4;
}

@media (prefers-reduced-motion: reduce) {
  .gi-rays__breath,
  .gi-shaft,
  .gi-mote,
  .gi-rake {
    animation: none;
  }
}
</style>
