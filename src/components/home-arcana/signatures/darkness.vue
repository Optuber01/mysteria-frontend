<template>
  <!--
    Darkness: the stars go out one by one, then night pours in from the edges like ink:
    first over the sky, then the city, then the fog in the streets, until only the faint
    crimson moon is left (she is the Lady of Crimson) in a silent black. If a sun was up,
    the ink drinks its light first, and her moon comes back into the dark after it. No
    particles; the stillness holds.
  -->
  <div class="dark" :class="{'is-after-sun': afterSun}" aria-hidden="true">
    <template v-if="layer === 'back'">
      <i v-for="(s, i) in stars" :key="i" class="dark__star" :style="s"></i>
      <!-- the sun's light, drunk: ink pooling over where it hung, before her moon returns -->
      <i v-if="afterSun" class="dark__drink"></i>
      <i class="dark__crimson"><i class="dark__breath"></i></i>
      <!-- on the moon disc itself (kept in step with it): her crimson, kept alight -->
      <div ref="followRef" class="dark__anchor">
        <div ref="riseRef" class="dark__rise">
          <i class="dark__moon"></i>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="dark__ink">
        <i v-for="(t, i) in tongues" :key="i" class="dark__tongue" :style="t"></i>
        <i class="dark__veil dark__veil--far"></i>
        <i class="dark__veil dark__veil--near"></i>
      </div>
      <!-- last, the castle in front of her goes to a plain shape against the moon -->
      <i class="dark__silhouette" :style="{'--sig-city': `url(${city})`}"></i>
    </template>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import city from '../assets/moon/backlund-skyline.webp';
import {useMoonAnchor} from './sigKit';

const props = defineProps<{layer: 'back' | 'front'; from?: string}>();

/* a sun (risen or on the horizon) was up: its light goes first */
const afterSun = computed(() => props.from === 'sun' || props.from === 'dusk');

const followRef = ref<HTMLElement | null>(null);
const riseRef = ref<HTMLElement | null>(null);
useMoonAnchor(followRef, riseRef);

/* the last stars, put out one after another (positions in % of the hero, away from the copy) */
const stars = [
  [58, 14, 0.5], [93, 12, 0.62], [67, 9, 0.74], [88, 30, 0.86], [52, 26, 0.98], [97, 44, 1.1],
  [75, 6, 1.2], [62, 40, 1.32], [84, 20, 1.42], [55, 52, 1.54], [91, 58, 1.66], [70, 22, 1.8],
].map(([x, y, d]) => ({left: `${x}%`, top: `${y}%`, '--d': `${d}s`}));

/*
 * Ink tongues: where each enters (the edge point, in %), the way it travels (unit vector
 * pointing inward), its size against the hero, and when it starts. Sky first, the streets last.
 */
const tongues = [
  {x: 62, y: -6, dx: 0, dy: 1, w: 120, h: 70, d: 0.7},
  {x: 104, y: 4, dx: -0.7, dy: 0.7, w: 90, h: 80, d: 0.8},
  {x: 20, y: -8, dx: 0.3, dy: 1, w: 110, h: 64, d: 0.95},
  {x: 106, y: 52, dx: -1, dy: 0, w: 70, h: 110, d: 1.05},
  {x: -8, y: 40, dx: 1, dy: 0, w: 80, h: 120, d: 1.15},
  {x: 30, y: 108, dx: 0.1, dy: -1, w: 120, h: 64, d: 1.45},
  {x: 84, y: 110, dx: -0.2, dy: -1, w: 110, h: 70, d: 1.55},
].map(t => ({
  left: `${t.x}%`, top: `${t.y}%`, '--w': `${t.w}%`, '--h': `${t.h}%`, '--d': `${t.d}s`,
  '--fx': `${-t.dx * 55}%`, '--fy': `${-t.dy * 55}%`,
}));
</script>

<style scoped>
.dark {
  --ink: rgb(3, 3, 9);
  /* when her moon is lit again: later if the ink had a sun to drink first */
  --moon-in: 2s;
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.dark.is-after-sun {
  --moon-in: 3s;
}

/* ---- behind the castle: the last stars going out, and the moon kept ---- */
.dark__star {
  position: absolute;
  width: 3px;
  height: 3px;
  margin: -1px 0 0 -1px;
  background: #e8ebff;
  box-shadow: 0 0 6px 1px rgba(200, 210, 255, .55);
  opacity: 0;
  animation: dark-out 1s ease var(--d) both;
}

/*
 * The drink: a pool of ink over the sun's place (centred on the moon's, where the sun
 * hangs), wide enough to take its glow. It closes over the light, holds while the sun
 * goes down, then thins away so her faint moon can come back into the dark.
 */
.dark__drink {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px) * 3);
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * 3);
  width: calc(var(--moon-r, 200px) * 6);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle closest-side, var(--ink) 0, var(--ink) 34%, color-mix(in srgb, var(--ink) 80%, transparent) 52%, color-mix(in srgb, var(--ink) 35%, transparent) 76%, transparent);
  opacity: 0;
  animation: dark-drink 4.2s cubic-bezier(.4, 0, .3, 1) .25s both;
}

/* a breath of crimson round her moon, so it is plainly the last light left */
.dark__crimson {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px) * 2);
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * 2);
  width: calc(var(--moon-r, 200px) * 4);
  aspect-ratio: 1;
  animation: dark-crimson 3s ease calc(var(--moon-in) + .2s) both;
}

/* its slow breathing (the one loop), on its own element so it stays on the compositor */
.dark__breath {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle closest-side, rgba(150, 24, 36, .3) 40%, rgba(120, 16, 30, .12) 62%, transparent);
  will-change: opacity;
  animation: dark-breathe 12s ease-in-out calc(var(--moon-in) + 3.2s) infinite;
}

/* a 2r box on the moon, following its rise and its sink on scroll (sigKit) */
.dark__anchor {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  aspect-ratio: 1;
}

.dark__rise {
  position: absolute;
  inset: 0;
  transform: scale(var(--moon-scale, 1));
}

/* laid on the disc: the moon stays faint, but plainly crimson and plainly there */
.dark__moon {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle closest-side, rgba(170, 30, 44, .5) 0, rgba(160, 26, 40, .42) 70%, rgba(140, 20, 34, .26) 96%, transparent);
  animation: dark-crimson 3s ease var(--moon-in) both;
}

/* ---- in front of everything: the ink, kept off the moon by a fixed hole ---- */
.dark__ink {
  position: absolute;
  inset: 0;
  -webkit-mask-image: radial-gradient(circle at var(--moon-x, 72%) var(--moon-y, 48%), transparent calc(var(--moon-r, 200px) * 1.02), rgba(0, 0, 0, .5) calc(var(--moon-r, 200px) * 1.3), #000 calc(var(--moon-r, 200px) * 2));
  mask-image: radial-gradient(circle at var(--moon-x, 72%) var(--moon-y, 48%), transparent calc(var(--moon-r, 200px) * 1.02), rgba(0, 0, 0, .5) calc(var(--moon-r, 200px) * 1.3), #000 calc(var(--moon-r, 200px) * 2));
}

.dark__silhouette {
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
  background: var(--ink);
  -webkit-mask: var(--sig-city) 0 0 / 100% 100% no-repeat;
  mask: var(--sig-city) 0 0 / 100% 100% no-repeat;
  opacity: .55;
  animation: dark-settle 2s ease 2.8s both;
}

/* a tongue of ink, its soft front leading */
.dark__tongue {
  position: absolute;
  width: var(--w);
  height: var(--h);
  translate: -50% -50%;
  border-radius: 50%;
  background: radial-gradient(closest-side, var(--ink) 30%, color-mix(in srgb, var(--ink) 85%, transparent) 55%, color-mix(in srgb, var(--ink) 35%, transparent) 80%, transparent);
  opacity: .92;
  animation: dark-pour 2.4s cubic-bezier(.45, .05, .3, 1) var(--d) both;
}

/* the dark settling evenly where the tongues meet: first far off, then right up to her */
.dark__veil {
  position: absolute;
  inset: 0;
  background: var(--ink);
}

.dark__veil--far {
  opacity: .55;
  animation: dark-settle 1.6s ease 1.6s both;
}

.dark__veil--near {
  opacity: .5;
  animation: dark-settle 1.8s ease 2.6s both;
}

@keyframes dark-out {
  0% { opacity: .9; }
  40% { opacity: .35; }
  55% { opacity: .75; }
  100% { opacity: 0; }
}

@keyframes dark-drink {
  0% { opacity: 0; transform: scale(1.5); }
  30% { opacity: .96; transform: none; }
  62% { opacity: .96; }
  100% { opacity: 0; }
}

@keyframes dark-pour {
  from { opacity: 0; transform: translate(var(--fx), var(--fy)) scale(.55); }
  30% { opacity: .92; }
}

@keyframes dark-settle {
  from { opacity: 0; }
}

@keyframes dark-crimson {
  from { opacity: 0; }
}

@keyframes dark-breathe {
  50% { opacity: .7; }
}

/* paper: dusk falls over the page instead of ink, never a black sky */
:root[data-theme="parchment"] .dark {
  --ink: rgb(74, 70, 98);
}

/* (the base scene already lays a heavy shade here; the ink only deepens it a touch, so the deck's controls stay legible) */
:root[data-theme="parchment"] .dark__ink {
  opacity: .1;
}

:root[data-theme="parchment"] .dark__silhouette {
  opacity: .16;
}

:root[data-theme="parchment"] .dark__drink {
  animation-name: dark-drink-paper;
}

@keyframes dark-drink-paper {
  0% { opacity: 0; transform: scale(1.5); }
  30% { opacity: .4; transform: none; }
  62% { opacity: .4; }
  100% { opacity: 0; }
}

:root[data-theme="parchment"] .dark__star {
  background: #6a6f9a;
  box-shadow: none;
}

:root[data-theme="parchment"] .dark__moon {
  opacity: .5;
}

:root[data-theme="parchment"] .dark__breath {
  background: radial-gradient(circle closest-side, rgba(179, 32, 43, .14) 40%, rgba(179, 32, 43, .05) 62%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .dark__star,
  .dark__drink {
    display: none;
  }

  .dark__crimson,
  .dark__breath,
  .dark__moon,
  .dark__silhouette,
  .dark__tongue,
  .dark__veil {
    animation: none;
  }
}
</style>
