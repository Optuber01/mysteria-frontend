<template>
  <!--
    Red Priest: the horizon burns. Beyond the hills a red-orange glow rises as if a city
    were under siege out of sight, and war smoke rolls up off it in charcoal banks, lit from
    beneath. A blazing meteor streaks down behind the castle and flares on the horizon; after
    it the glow catches every roof edge. Fire stays on the horizon; nothing is drawn but
    light, smoke and one streak.
  -->
  <div class="pr" aria-hidden="true" :style="{'--sig-city': `url(${city})`, '--fog': `url(${fog})`}">
    <template v-if="layer === 'back'">
      <i class="pr__glow"><i class="pr__flicker"></i></i>
      <!-- war smoke off the burning horizon: dark banks, their undersides lit -->
      <div class="pr__smoke pr__smoke--far"><i class="pr__smoke-tex"></i></div>
      <div class="pr__smoke"><i class="pr__smoke-tex"></i></div>
      <div class="pr__underlit"><i class="pr__underlit-tex"></i></div>
      <!-- the meteor, and where it lands -->
      <div class="pr__meteor"><i class="pr__streak"></i></div>
      <i class="pr__impact"></i>
    </template>
    <i v-else class="pr__rim"></i>
  </div>
</template>

<script setup lang="ts">
import city from '../assets/moon/backlund-skyline.webp';
import fog from '../assets/moon/fog-bank.webp';

defineProps<{layer: 'back' | 'front'; from?: string}>();
</script>

<style scoped>
.pr {
  --H: var(--city-h, 600px);
  /* the horizon behind the hills: about where the castle's lower roofs stand */
  --horizon: calc(var(--city-bottom, 100%) - var(--H) * .42);
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* ---- behind the castle ---- */
/* the burning horizon: a low wide glow, deep red at its edge, orange-gold at its heart */
.pr__glow {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--H) * 1.4);
  top: calc(var(--horizon) - var(--H) * .5);
  width: calc(var(--H) * 2.8);
  height: calc(var(--H) * 1);
  animation: pr-rise 2.6s cubic-bezier(.25, .6, .3, 1) .2s both;
}

/* its slow flicker (the one loop), on its own element so it stays on the compositor */
.pr__flicker {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(closest-side at 50% 60%,
      rgba(255, 150, 60, .55) 0,
      rgba(240, 90, 30, .4) 28%,
      rgba(170, 40, 16, .22) 55%,
      rgba(90, 20, 10, .08) 78%,
      transparent);
  will-change: opacity;
  animation: pr-flicker 5.3s ease-in-out 3.2s infinite;
}

/*
 * Smoke: the scene's cloud technique (the fog texture multiplied by the smoke's colour
 * and cut by its own luminance), in soft-edged banks that roll up off the horizon.
 */
.pr__smoke {
  position: absolute;
  left: -10%;
  right: -10%;
  top: calc(var(--horizon) - var(--H) * .42);
  height: calc(var(--H) * .4);
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 35%, #000 65%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 35%, #000 65%, transparent);
  opacity: .85;
  animation: pr-smoke 3.2s cubic-bezier(.25, .6, .3, 1) .5s both;
}

.pr__smoke--far {
  top: calc(var(--horizon) - var(--H) * .7);
  height: calc(var(--H) * .36);
  opacity: .6;
  animation-delay: .9s;
}

.pr__smoke-tex,
.pr__underlit-tex {
  --tile: var(--fog) repeat-x 0 50% / 60% 100%;
  position: absolute;
  inset: 0;
  -webkit-mask: var(--tile);
  mask: var(--tile);
  -webkit-mask-mode: luminance;
  mask-mode: luminance;
}

.pr__smoke-tex {
  background: linear-gradient(#2a201c, #2a201c), var(--tile);
  background-blend-mode: multiply;
}

.pr__smoke--far .pr__smoke-tex {
  --tile: var(--fog) repeat-x 40% 50% / 70% 100%;
}

/* the smoke's underside, catching the glow */
.pr__underlit {
  position: absolute;
  left: -10%;
  right: -10%;
  top: calc(var(--horizon) - var(--H) * .2);
  height: calc(var(--H) * .22);
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 50%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 50%, transparent);
  opacity: .55;
  animation: pr-smoke 3s cubic-bezier(.25, .6, .3, 1) .8s both;
}

.pr__underlit-tex {
  --tile: var(--fog) repeat-x 18% 50% / 60% 100%;
  background: linear-gradient(#ff7a2e, #ff7a2e), var(--tile);
  background-blend-mode: multiply;
}

/* the meteor: a white-gold head with a long burning tail, coming down steeply right of the fan */
.pr__meteor {
  --len: calc(var(--moon-r, 200px) * 3.4);
  position: absolute;
  left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * 2.25);
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * 2.3);
  width: 0;
  height: 0;
  rotate: 12deg;
}

.pr__streak {
  position: absolute;
  left: -1.5px;
  top: calc(var(--moon-r, 200px) * -.9);
  width: 3px;
  height: calc(var(--moon-r, 200px) * .9);
  border-radius: 2px;
  background: linear-gradient(180deg, transparent, rgba(255, 110, 40, .35) 40%, rgba(255, 190, 110, .85) 88%, #fff6e0);
  box-shadow: 0 0 6px rgba(255, 150, 60, .6);
  opacity: 0;
  animation: pr-fall 1s cubic-bezier(.5, 0, .9, .6) 1.1s both;
}

/* where it lands: a flare on the horizon behind the castle, sinking into the glow */
.pr__impact {
  position: absolute;
  left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * 1.55 - var(--H) * .35);
  top: calc(var(--horizon) - var(--H) * .3);
  width: calc(var(--H) * .7);
  height: calc(var(--H) * .5);
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(255, 236, 190, .7), rgba(255, 150, 60, .4) 30%, rgba(220, 70, 20, .14) 60%, transparent);
  opacity: 0;
  animation: pr-impact 2.2s ease-out 2.05s both;
}

@keyframes pr-rise {
  from { opacity: 0; transform: translate3d(0, 12%, 0) scaleY(.7); }
}

@keyframes pr-flicker {
  0%, 100% { opacity: 1; }
  30% { opacity: .82; }
  55% { opacity: .95; }
  72% { opacity: .78; }
}

@keyframes pr-smoke {
  from { opacity: 0; transform: translate3d(0, 30%, 0); }
}

@keyframes pr-fall {
  0% { opacity: 0; transform: translate3d(0, 0, 0); }
  12% { opacity: 1; }
  88% { opacity: 1; }
  100% { opacity: 0; transform: translate3d(0, var(--len), 0); }
}

@keyframes pr-impact {
  0% { opacity: 0; transform: scale(.4); }
  12% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.3, 1.1); }
}

/* ---- in front: the glow catching every roof edge, strongest low and toward the fire ---- */
.pr__rim {
  --k: calc(var(--H) * .005);
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--H));
  height: var(--H);
  aspect-ratio: 16 / 9;
  background: radial-gradient(90% 70% at calc(var(--moon-x, 72%) - var(--city-left, 0px) + var(--moon-r, 200px) * .8) 75%,
      rgba(255, 170, 80, .95), rgba(255, 100, 40, .6) 40%, rgba(200, 50, 20, .2) 70%, transparent);
  -webkit-mask: var(--sig-city) 0 0 / 100% 100% no-repeat, var(--sig-city) 0 var(--k) / 100% 100% no-repeat;
  -webkit-mask-composite: source-out;
  mask: var(--sig-city) 0 0 / 100% 100% no-repeat, var(--sig-city) 0 var(--k) / 100% 100% no-repeat;
  mask-composite: subtract;
  opacity: .75;
  animation: pr-lit 2s ease 2.2s both;
}

@keyframes pr-lit {
  from { opacity: 0; }
}

/* stacked: the meteor comes down just right of the deck */
@media (max-width: 900px) {
  .pr__meteor {
    left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * 1.7);
    top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * 1.4);
  }

  .pr__impact {
    left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * 1.1 - var(--H) * .35);
  }
}

/* paper: the fire as a rust-orange glow on the haze, the smoke a soft grey-brown */
:root[data-theme="parchment"] .pr__flicker,
:root[data-theme="parchment"] .pr__underlit,
:root[data-theme="parchment"] .pr__impact,
:root[data-theme="parchment"] .pr__rim {
  mix-blend-mode: multiply;
}

:root[data-theme="parchment"] .pr__flicker {
  background: radial-gradient(closest-side at 50% 60%, rgba(230, 120, 60, .4) 0, rgba(210, 110, 70, .2) 40%, transparent 80%);
}

:root[data-theme="parchment"] .pr__smoke {
  opacity: .35;
}

:root[data-theme="parchment"] .pr__smoke-tex {
  background: linear-gradient(#7a6a62, #7a6a62), var(--tile);
  background-blend-mode: multiply;
}

:root[data-theme="parchment"] .pr__streak {
  background: linear-gradient(180deg, transparent, rgba(200, 80, 30, .4) 40%, #b8501e);
  box-shadow: none;
}

@media (prefers-reduced-motion: reduce) {
  .pr__glow,
  .pr__flicker,
  .pr__smoke,
  .pr__underlit,
  .pr__rim {
    animation: none;
  }

  .pr__meteor,
  .pr__impact {
    display: none;
  }
}
</style>
