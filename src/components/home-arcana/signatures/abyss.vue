<template>
  <!--
    Abyss: the ground opens. Molten light wells up out of the earth behind the castle, so it
    stands black against it; sulfur smoke rises off the pit, its underside lit; every lower
    edge of the castle catches the light from below, and the streets in front glow with it.
    Fire from below only (no flames drawn), the scene's own fog texture for the smoke.
  -->
  <div class="ab" aria-hidden="true" :style="{'--sig-city': `url(${city})`, '--fog': `url(${fog})`}">
    <template v-if="layer === 'back'">
      <!-- the pit's light, welling up behind the castle -->
      <i class="ab__well"><i class="ab__well-flicker"></i></i>
      <!-- sulfur smoke rising off it, its underside lit -->
      <div class="ab__smoke ab__smoke--far"><i class="ab__tex ab__tex--smoke"></i></div>
      <div class="ab__smoke"><i class="ab__tex ab__tex--smoke"></i></div>
      <div class="ab__smoke ab__smoke--lit"><i class="ab__tex ab__tex--lit"></i></div>
    </template>
    <template v-else>
      <!-- the castle lit from beneath: its lower edges -->
      <i class="ab__under"></i>
      <!-- the streets in front, glowing up from below -->
      <i class="ab__heat"></i>
    </template>
  </div>
</template>

<script setup lang="ts">
import city from '../assets/moon/backlund-skyline.webp';
import fog from '../assets/moon/fog-bank.webp';

defineOptions({name: 'SignatureAbyss'});
defineProps<{layer: 'back' | 'front'; from?: string}>();
</script>

<style scoped>
.ab {
  --H: var(--city-h, 600px);
  /* the street, above the hero's own fade at its foot */
  --street: calc(var(--city-bottom, 100%) - var(--H) * .24);
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* ---- behind the castle: the pit's glow and its smoke ---- */
/* the light standing up out of the ground, centred off the deck so the castle is backlit */
.ab__well {
  position: absolute;
  left: -10%;
  right: -10%;
  top: calc(var(--street) - var(--H) * .78);
  height: calc(var(--H) * 1.1);
  -webkit-mask-image: linear-gradient(180deg, #000 72%, transparent 96%);
  mask-image: linear-gradient(180deg, #000 72%, transparent 96%);
  transform-origin: 50% 80%;
  animation: ab-well 1.8s cubic-bezier(.25, .6, .3, 1) .3s both;
}

.ab__well-flicker {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(34% 46% at 70% 78%, rgba(255, 226, 140, .9), rgba(255, 150, 50, .6) 30%, rgba(190, 60, 18, .26) 62%, transparent),
    radial-gradient(70% 40% at 40% 80%, rgba(245, 130, 40, .5), rgba(150, 40, 12, .16) 60%, transparent 80%),
    radial-gradient(30% 30% at 12% 82%, rgba(240, 120, 40, .32), transparent 80%);
  will-change: opacity;
  animation: ab-flicker 4.2s ease-in-out 2.2s infinite;
}

.ab__smoke {
  position: absolute;
  left: -15%;
  right: -15%;
  top: calc(var(--street) - var(--H) * .62);
  height: calc(var(--H) * .42);
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 35%, #000 70%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 35%, #000 70%, transparent);
  opacity: .8;
  animation: ab-smoke 2.4s cubic-bezier(.25, .6, .3, 1) .8s both;
}

.ab__smoke--far {
  top: calc(var(--street) - var(--H) * .92);
  height: calc(var(--H) * .38);
  opacity: .55;
  animation-delay: 1.1s;
}

.ab__smoke--lit {
  top: calc(var(--street) - var(--H) * .34);
  height: calc(var(--H) * .26);
  opacity: .7;
  animation-delay: .7s;
}

.ab__tex {
  --tile: var(--fog) repeat-x 0 50% / 64% 100%;
  position: absolute;
  inset: 0;
  -webkit-mask: var(--tile);
  mask: var(--tile);
  -webkit-mask-mode: luminance;
  mask-mode: luminance;
  background-blend-mode: multiply;
}

/* sulfur: a dirty yellow-brown, never grey */
.ab__tex--smoke {
  background: linear-gradient(#4a3a18, #2a1c10), var(--tile);
}

.ab__smoke--far .ab__tex--smoke {
  --tile: var(--fog) repeat-x 38% 50% / 74% 100%;
}

/* the smoke's underside, lit by the pit */
.ab__tex--lit {
  --tile: var(--fog) repeat-x 70% 50% / 56% 100%;
  background: linear-gradient(#ffb04a, #e0601e), var(--tile);
}

@keyframes ab-well {
  from { opacity: 0; transform: translate3d(0, 18%, 0) scaleY(.6); }
}

@keyframes ab-flicker {
  0%, 100% { opacity: 1; }
  35% { opacity: .78; }
  60% { opacity: .95; }
  80% { opacity: .82; }
}

@keyframes ab-smoke {
  from { opacity: 0; transform: translate3d(0, 40%, 0); }
}

/* ---- in front ---- */
/* the castle's lower edges lit from beneath: the skyline mask minus itself shifted up */
.ab__under {
  --k: calc(var(--H) * .006);
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--H));
  height: var(--H);
  aspect-ratio: 16 / 9;
  background: linear-gradient(0deg, rgba(255, 190, 90, .95), rgba(255, 120, 40, .6) 35%, rgba(180, 50, 20, .15) 70%, transparent);
  -webkit-mask: var(--sig-city) 0 0 / 100% 100% no-repeat, var(--sig-city) 0 calc(var(--k) * -1) / 100% 100% no-repeat;
  -webkit-mask-composite: source-out;
  mask: var(--sig-city) 0 0 / 100% 100% no-repeat, var(--sig-city) 0 calc(var(--k) * -1) / 100% 100% no-repeat;
  mask-composite: subtract;
  /* the image's own foot would light up too: cut it off */
  clip-path: inset(0 0 calc(var(--k) * 2) 0);
  opacity: 1;
  animation: ab-lit 1.4s ease 1s both;
}

@keyframes ab-lit {
  from { opacity: 0; }
}

/* the streets in front: a low glow welling out of the ground, breathing with the pit */
.ab__heat {
  position: absolute;
  left: -10%;
  right: -10%;
  top: calc(var(--street) - var(--H) * .14);
  height: calc(var(--H) * .5);
  background:
    radial-gradient(40% 50% at 72% 50%, rgba(255, 170, 70, .42), rgba(230, 90, 30, .2) 45%, transparent 80%),
    radial-gradient(60% 45% at 30% 55%, rgba(230, 100, 30, .22), transparent 80%);
  mix-blend-mode: screen;
  will-change: opacity;
  animation: ab-heat 1.6s ease .8s both, ab-flicker 3.6s ease-in-out 2.6s infinite;
}

@keyframes ab-heat {
  from { opacity: 0; transform: translate3d(0, 20%, 0); }
}

/* paper: rust and ochre on the haze, no black smoke */
:root[data-theme="parchment"] .ab__well-flicker,
:root[data-theme="parchment"] .ab__heat,
:root[data-theme="parchment"] .ab__under {
  mix-blend-mode: multiply;
}

:root[data-theme="parchment"] .ab__smoke {
  opacity: .3;
}

@media (prefers-reduced-motion: reduce) {
  .ab__well,
  .ab__well-flicker,
  .ab__smoke,
  .ab__under,
  .ab__heat {
    animation: none;
  }
}
</style>
