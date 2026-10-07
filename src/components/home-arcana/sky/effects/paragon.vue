<template>
  <!--
    Paragon: Backlund's industry. Forges and chimneys along the skyline glow amber, sparks
    climb out of them now and then, and sooty smoke (the scene's fog texture, tinted and cut
    to a plume) drifts up from the roofs. By day the glow is faint and the smoke and haze
    carry it. Everything sits on the skyline image's own box, so it lines up at any size.
  -->
  <div v-if="layer === 'back'" class="fx fx--paragon fx--back" :class="{'is-day': day}">
    <!-- the glow the forges throw up behind the castle, and the haze over the roofs -->
    <i class="fx__aura" :style="{'--glow': AURA}"></i>
    <!-- the smoke rises from behind the roofline -->
    <i class="fx__smoke" :style="SMOKE"></i>
  </div>
  <div v-else class="fx fx--paragon fx--front" :class="{'is-day': day}">
    <!-- the forges' light on the buildings themselves, cut to the skyline -->
    <i class="fx__lit" :style="{'--glow': LIT, '--city-mask': `url(${city})`}"></i>
    <i v-for="(s, i) in SPARKS" :key="i" class="fx__sparks" :style="s"></i>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import city from '../../assets/moon/backlund-skyline.webp';
import type {Body} from '../skyScenes';

defineOptions({name: 'SkyParagonEffect'});
const props = defineProps<{layer: 'back' | 'front'; body: Body; from: Body}>();

const day = computed(() => props.body === 'sun' || props.body === 'dusk');

/*
 * Chimneys and forge mouths on the roofline (backlund-skyline.webp, image px), and how tall
 * their smoke stands. Sampled from the image's own silhouette: the top of a roof, never the sky.
 */
const CHIMNEYS = [
  {x: 510, y: 652, h: .9},
  {x: 874, y: 527, h: .95},
  {x: 1003, y: 393, h: 1.05},
  {x: 1405, y: 395, h: 1.1},
  {x: 1680, y: 514, h: 1.3},
  {x: 1790, y: 488, h: 1.5},
  {x: 1862, y: 484, h: 1.2},
];
const IMG_W = 1920;
const IMG_H = 1080;
const pctX = (x: number) => ((x / IMG_W) * 100).toFixed(2);
const pctY = (y: number) => ((y / IMG_H) * 100).toFixed(2);

/* amber light round each forge: wide behind the castle, tight and bright on the roofs in front */
const glow = (r: number, a: number, core: boolean) =>
  CHIMNEYS.map(c => {
    const at = `${pctX(c.x)}% ${pctY(c.y)}%`;
    const halo = `radial-gradient(circle calc(var(--H) * ${r}) at ${at}, rgba(255, 150, 60, ${a}), rgba(255, 110, 40, ${(a * .35).toFixed(2)}) 42%, transparent)`;
    return core ? `radial-gradient(circle calc(var(--H) * .012) at ${at}, #fff0c8, rgba(255, 190, 100, .7) 50%, transparent), ${halo}` : halo;
  }).join(', ');
const AURA = glow(.3, .4, false);
const LIT = glow(.13, .62, true);

/*
 * Smoke: the box covers the top SMOKE_H image px of the skyline; each plume is one layer of
 * its mask (a soft column, narrow at the chimney, billowing and leaning above it), and the
 * smoke's own light is a small amber glow at every chimney over a sooty grey.
 */
const SMOKE_H = 740;
const PLUME_W = 200;
const PLUME = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 300'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='white' stop-opacity='0'/%3E%3Cstop offset='.45' stop-color='white' stop-opacity='.6'/%3E%3Cstop offset='1' stop-color='white'/%3E%3C/linearGradient%3E%3Cfilter id='b' x='-50%25' y='-20%25' width='200%25' height='140%25'%3E%3CfeGaussianBlur stdDeviation='9'/%3E%3C/filter%3E%3C/defs%3E%3Cpath filter='url(%23b)' fill='url(%23g)' d='M46 292 C44 250 32 205 26 160 C18 105 26 45 58 30 C86 18 94 66 86 118 C78 168 60 230 54 292 Z'/%3E%3C/svg%3E")`;
const pct = (n: number) => `${n.toFixed(2)}%`;
const plumes = CHIMNEYS.map(c => {
  const h = 330 * c.h;
  const left = c.x - PLUME_W / 2;
  const top = c.y - h;
  return {
    size: `${pct((PLUME_W / IMG_W) * 100)} ${pct((h / SMOKE_H) * 100)}`,
    // a mask-position percentage lines up that fraction of the image with that fraction of the box
    pos: `${pct((left / (IMG_W - PLUME_W)) * 100)} ${pct((top / (SMOKE_H - h)) * 100)}`,
  };
});
const lamps = CHIMNEYS.map(c => `radial-gradient(circle calc(var(--H) * .16) at ${pctX(c.x)}% ${pct((c.y / SMOKE_H) * 100)}, var(--lamp), transparent)`);
const SMOKE = {
  '--plumes': CHIMNEYS.map(() => PLUME).join(', '),
  '--plume-pos': plumes.map(p => p.pos).join(', '),
  '--plume-size': plumes.map(p => p.size).join(', '),
  '--lamps': lamps.join(', '),
};

/*
 * Sparks: two sets of bright points just over the chimneys, each rising and dying out
 * now and then, out of step (a point sits at its chimney's x, and y in per cent of the city's box).
 */
const dot = (x: number, y: number, r: number) =>
  `radial-gradient(circle ${r}px at ${pctX(x)}% ${pctY(y)}%, #fff4d8 0 ${r * .2}px, var(--spark) ${r * .38}px, rgba(255, 120, 40, .4) ${r * .65}px, transparent ${r}px)`;
const SETS = [
  [dot(510, 634, 7), dot(1003, 368, 8), dot(1000, 335, 5), dot(1680, 490, 7), dot(1686, 455, 5), dot(1862, 458, 7), dot(1858, 420, 5)],
  [dot(874, 504, 7), dot(880, 470, 5), dot(1405, 368, 8), dot(1790, 462, 7), dot(1796, 424, 5), dot(1795, 380, 4), dot(1409, 335, 5)],
];
const SPARKS = SETS.map((set, i) => ({
  '--dots': set.join(', '),
  '--sd': `${1.6 + i * 3.1}s`,
  '--sl': `${7.2 + i * 2.6}s`,
}));
</script>

<style scoped>
.fx {
  --H: var(--city-h, 600px);
  --spark: #ffb050;
  --lamp: rgba(255, 150, 70, .6);
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* a box laid exactly over the skyline image (the whole of it, or the top 740 px of it) */
.fx__aura,
.fx__lit,
.fx__sparks {
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--H));
  height: var(--H);
  aspect-ratio: 16 / 9;
}

.fx__smoke {
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--H));
  height: calc(var(--H) * 740 / 1080);
  aspect-ratio: 1920 / 740;
  background: var(--lamps), var(--smoke);
  -webkit-mask: var(--plumes);
  -webkit-mask-position: var(--plume-pos);
  -webkit-mask-size: var(--plume-size);
  -webkit-mask-repeat: no-repeat;
  mask: var(--plumes);
  mask-position: var(--plume-pos);
  mask-size: var(--plume-size);
  mask-repeat: no-repeat;
  opacity: var(--smoke-o);
  animation: fx-in 3s ease-out .8s backwards;
}

/* the soot: the scene's fog texture, two tiles one above the other, rising one tile per loop */
.fx__smoke::before {
  --tile: url('../../assets/moon/fog-bank.webp') repeat 0 0 / 26% 12.5%;
  content: '';
  position: absolute;
  inset: 0 0 -100%;
  background: var(--soot);
  -webkit-mask: var(--tile), var(--tile), var(--tile);
  mask: var(--tile), var(--tile), var(--tile);
  -webkit-mask-mode: luminance;
  mask-mode: luminance;
  will-change: transform;
  animation: fx-rise 22s linear infinite;
}

/* the glow: the box fades in as the forges are fed, the light inside it wavers (a child, so the two never fight) */
.fx__aura,
.fx__lit {
  opacity: var(--glow-o);
  animation: fx-in 1.8s ease-out .5s backwards;
}

.fx__aura::before,
.fx__lit::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--glow);
  will-change: opacity;
  animation: fx-waver 6.5s ease-in-out infinite;
}

.fx__lit::before {
  animation-duration: 8.5s;
  animation-delay: -3s;
}

/* the haze a working city holds over its roofs */
.fx__aura::after {
  content: '';
  position: absolute;
  inset: 20% -10% -10%;
  background: radial-gradient(60% 55% at 55% 70%, var(--haze), transparent);
}

.fx__lit {
  -webkit-mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
}

.fx__sparks {
  background: var(--dots);
  opacity: 0;
  will-change: transform, opacity;
  animation: fx-spark var(--sl) cubic-bezier(.2, .5, .4, 1) var(--sd) infinite;
}

@keyframes fx-in {
  from { opacity: 0; }
}

@keyframes fx-rise {
  to { transform: translate3d(0, -50%, 0); }
}

/* an uneven fire, never a clean pulse */
@keyframes fx-waver {
  0%, 100% { opacity: .82; }
  18% { opacity: 1; }
  34% { opacity: .74; }
  55% { opacity: .96; }
  78% { opacity: .8; }
}

/* a few sparks climb and go out, and then nothing for a while */
@keyframes fx-spark {
  0% { opacity: 0; transform: translate3d(0, 0, 0); }
  5% { opacity: 1; }
  34% { opacity: 0; transform: translate3d(calc(var(--H) * .035), calc(var(--H) * -.2), 0); }
  100% { opacity: 0; transform: translate3d(calc(var(--H) * .035), calc(var(--H) * -.2), 0); }
}

/* ---- night (dark theme) ---- */
.fx {
  --glow-o: 1;
  --smoke-o: 1;
  --smoke: rgba(150, 118, 96, .46);
  --soot: rgba(12, 8, 6, .85);
  --haze: rgba(255, 140, 60, .2);
}

/* by day the forges barely show: the smoke is heavier and the haze greyer */
.fx.is-day {
  --glow-o: .35;
  --smoke-o: 1;
  --smoke: rgba(150, 128, 112, .42);
  --haze: rgba(220, 170, 120, .22);
}

/* ---- paper: warm amber haze and soft grey smoke on the morning mist ---- */
:root[data-theme="parchment"] .fx {
  --glow-o: .8;
  --spark: #e8802a;
  --lamp: rgba(236, 140, 60, .32);
  --smoke: rgba(140, 126, 118, .3);
  --soot: rgba(78, 70, 66, .6);
  --haze: rgba(240, 160, 80, .26);
}

:root[data-theme="parchment"] .fx.is-day {
  --glow-o: .3;
  --smoke: rgba(150, 136, 126, .34);
}

@media (prefers-reduced-motion: reduce) {
  .fx__smoke,
  .fx__smoke::before,
  .fx__aura,
  .fx__lit,
  .fx__aura::before,
  .fx__lit::before {
    animation: none;
  }

  .fx__sparks {
    display: none;
  }
}
</style>
