<template>
  <!--
    Mother: warm light comes up off the fields beyond the city, green-gold, from below the
    skyline, as if the earth itself were glowing at dusk; it catches the castle from beneath.
    The ground mist warms and rises a little, pollen lifts off the streets in the light,
    and the crimson moon softens into a harvest moon. Light and air only: nothing grows.
  -->
  <div class="mo" :class="{'is-late': from && from !== 'moon'}" aria-hidden="true" :style="{'--sig-city': `url(${city})`, '--fog': `url(${fog})`}">
    <template v-if="layer === 'back'">
      <!-- the fields' glow beyond the city, behind the castle -->
      <i class="mo__fields"></i>
      <!-- the harvest moon: a warm softness on the disc and round it (kept on the moon) -->
      <div ref="followRef" class="mo__anchor">
        <div ref="riseRef" class="mo__rise">
          <i class="mo__harvest-halo"></i>
          <i class="mo__harvest"></i>
        </div>
      </div>
    </template>
    <template v-else>
      <!-- the castle lit from below by the fields -->
      <i class="mo__uplight"></i>
      <!-- warm ground mist over the streets (the one slow drift) -->
      <div class="mo__mist"><i class="mo__mist-tex"></i></div>
      <!-- pollen lifting off the streets, once -->
      <i v-for="(p, i) in POLLEN" :key="i" class="mo__pollen" :style="p"></i>
    </template>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import city from '../assets/moon/backlund-skyline.webp';
import fog from '../assets/moon/fog-bank.webp';
import {seeded, useMoonAnchor} from './sigKit';

defineProps<{layer: 'back' | 'front'; from?: string}>();

const followRef = ref<HTMLElement | null>(null);
const riseRef = ref<HTMLElement | null>(null);
useMoonAnchor(followRef, riseRef);

/* pollen: where it lifts from (x across the hero, y above the city's foot in city heights), how high, when */
const rnd = seeded(303);
const POLLEN = Array.from({length: 26}, () => {
  const gold = rnd() < .6;
  return {
    left: `${(42 + rnd() * 56).toFixed(1)}%`,
    '--y': (.04 + rnd() * .26).toFixed(3),
    '--rise': (.12 + rnd() * .22).toFixed(3),
    '--dx': `${Math.round((rnd() - .3) * 50)}px`,
    '--s': `${rnd() < .3 ? 3 : 2}px`,
    '--c': gold ? '#f3df8a' : '#cdeb8c',
    '--d': `${(.9 + rnd() * 1.6).toFixed(2)}s`,
    '--t': `${(2.6 + rnd() * 1.6).toFixed(2)}s`,
  };
});
</script>

<style scoped>
.mo {
  --H: var(--city-h, 600px);
  /* the harvest moon's warmth comes once the moon is up */
  --moon-in: .8s;
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.mo.is-late {
  --moon-in: 2.2s;
}

/* ---- behind the castle ---- */
/* light from the fields beyond: a low wide glow under the skyline, gold at the heart, green at the edges */
.mo__fields {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--H) * 1.5);
  top: calc(var(--city-bottom, 100%) - var(--H) * .95);
  width: calc(var(--H) * 3);
  height: calc(var(--H) * 1.1);
  border-radius: 50%;
  background: radial-gradient(closest-side at 50% 70%,
      rgba(255, 214, 130, .5) 0,
      rgba(220, 210, 110, .3) 30%,
      rgba(140, 200, 110, .16) 55%,
      rgba(90, 160, 90, .05) 78%,
      transparent);
  animation: mo-rise 3s cubic-bezier(.25, .6, .3, 1) .3s both;
}

.mo__anchor {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  aspect-ratio: 1;
}

.mo__rise {
  position: absolute;
  inset: 0;
  transform: scale(var(--moon-scale, 1));
}

/* the disc warmed and softened: amber laid over the crimson */
.mo__harvest {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle closest-side, rgba(255, 190, 110, .26) 0, rgba(255, 170, 90, .2) 70%, rgba(255, 160, 80, .1) 96%, transparent);
  animation: mo-fade 2.4s ease var(--moon-in) both;
}

/* and a warm haze round it, the air thick with the harvest */
.mo__harvest-halo {
  position: absolute;
  inset: -90%;
  border-radius: 50%;
  background: radial-gradient(circle closest-side, rgba(255, 180, 90, .2) 26%, rgba(220, 160, 80, .08) 50%, transparent 80%);
  animation: mo-fade 3s ease calc(var(--moon-in) + .3s) both;
}

/* ---- in front of the castle ---- */
/* the stone lit from beneath: warm at the foot, fading up the walls, cut to the skyline */
.mo__uplight {
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--H));
  height: var(--H);
  aspect-ratio: 16 / 9;
  background:
    radial-gradient(70% 60% at calc(var(--moon-x, 72%) - var(--city-left, 0px)) 100%, rgba(255, 210, 120, .3), transparent 80%),
    linear-gradient(0deg, rgba(200, 220, 120, .22) 0%, rgba(230, 200, 110, .12) 35%, transparent 70%);
  -webkit-mask: var(--sig-city) 0 0 / 100% 100% no-repeat;
  mask: var(--sig-city) 0 0 / 100% 100% no-repeat;
  animation: mo-fade 2.6s ease 1s both;
}

/* warm ground mist: the scene's fog texture, gold-tinted, cut by its own light, soft-edged */
.mo__mist {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(var(--city-bottom, 100%) - var(--H) * .34);
  height: calc(var(--H) * .3);
  /* soft top and bottom, and clear of the copy column on the left */
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 35%, #000 70%, transparent), linear-gradient(90deg, transparent 22%, #000 52%);
  -webkit-mask-composite: source-in;
  mask-image: linear-gradient(180deg, transparent, #000 35%, #000 70%, transparent), linear-gradient(90deg, transparent 22%, #000 52%);
  mask-composite: intersect;
  opacity: .42;
  animation: mo-mist 3s cubic-bezier(.25, .6, .3, 1) .6s both;
}

.mo__mist-tex {
  --tile: var(--fog) repeat-x 30% 50% / 50% 100%;
  position: absolute;
  inset: 0 auto 0 0;
  width: 200%;
  background: linear-gradient(#e8d79c, #e8d79c), var(--tile);
  background-blend-mode: multiply;
  -webkit-mask: var(--tile);
  mask: var(--tile);
  -webkit-mask-mode: luminance;
  mask-mode: luminance;
  will-change: transform;
  animation: mo-drift 150s linear infinite;
}

/* a mote of pollen: a single warm texel lifting and drifting, then gone */
.mo__pollen {
  position: absolute;
  top: calc(var(--city-bottom, 100%) - var(--H) * var(--y));
  width: var(--s);
  height: var(--s);
  background: var(--c);
  box-shadow: 0 0 4px rgba(240, 220, 120, .6);
  opacity: 0;
  animation: mo-pollen var(--t) ease-out var(--d) both;
}

@keyframes mo-rise {
  from { opacity: 0; transform: translate3d(0, 14%, 0); }
}

@keyframes mo-fade {
  from { opacity: 0; }
}

@keyframes mo-mist {
  from { opacity: 0; transform: translate3d(0, 16%, 0); }
}

@keyframes mo-drift {
  to { transform: translate3d(-50%, 0, 0); }
}

@keyframes mo-pollen {
  0% { opacity: 0; transform: translate3d(0, 0, 0); }
  20% { opacity: .9; }
  70% { opacity: .6; }
  100% { opacity: 0; transform: translate3d(var(--dx), calc(var(--H) * var(--rise) * -1), 0); }
}

/* stacked: the copy sits above the scene, so the mist runs the full width */
@media (max-width: 900px) {
  .mo__mist {
    -webkit-mask-image: linear-gradient(180deg, transparent, #000 35%, #000 70%, transparent);
    mask-image: linear-gradient(180deg, transparent, #000 35%, #000 70%, transparent);
  }
}

/* paper: a green-gold dawn tint on the haze, multiplied, never a glow that whites out */
:root[data-theme="parchment"] .mo__fields {
  background: radial-gradient(closest-side at 50% 70%, rgba(230, 190, 90, .3) 0, rgba(160, 190, 90, .14) 45%, transparent);
  mix-blend-mode: multiply;
}

:root[data-theme="parchment"] .mo__harvest,
:root[data-theme="parchment"] .mo__harvest-halo {
  mix-blend-mode: multiply;
  opacity: .5;
}

:root[data-theme="parchment"] .mo__uplight {
  mix-blend-mode: multiply;
  opacity: .6;
}

:root[data-theme="parchment"] .mo__mist {
  mix-blend-mode: multiply;
  opacity: .3;
}

:root[data-theme="parchment"] .mo__mist-tex {
  background: linear-gradient(#b8a560, #b8a560), var(--tile);
  background-blend-mode: multiply;
}

:root[data-theme="parchment"] .mo__pollen {
  --c: #9a8a2a;
  box-shadow: none;
}

@media (prefers-reduced-motion: reduce) {
  .mo__fields,
  .mo__harvest,
  .mo__harvest-halo,
  .mo__uplight,
  .mo__mist,
  .mo__mist-tex {
    animation: none;
  }

  .mo__pollen {
    display: none;
  }
}
</style>
