<template>
  <!--
    Death: pallor. The colour drains out of the whole scene; a cold bone-white halo stands
    round whatever hangs in the sky; pale mist pools in the streets; and at the castle's
    foot a quiet column of cold light opens, the threshold the souls (the scene's wisps)
    drift toward. No skulls, no gate drawn: light, mist and the loss of colour.
  -->
  <div class="de" aria-hidden="true" :style="{'--fog': `url(${fog})`}">
    <template v-if="layer === 'back'">
      <i class="de__halo"></i>
      <i class="de__threshold"></i>
    </template>
    <template v-else>
      <div class="de__mist"><i class="de__tex"></i></div>
      <div class="de__mist de__mist--near"><i class="de__tex"></i></div>
      <!-- the colour leaving: a grey laid over everything in saturation mode -->
      <i class="de__drain"></i>
    </template>
  </div>
</template>

<script setup lang="ts">
import fog from '../assets/moon/fog-bank.webp';

defineOptions({name: 'SignatureDeath'});
defineProps<{layer: 'back' | 'front'; from?: string}>();
</script>

<style scoped>
.de {
  --H: var(--city-h, 600px);
  --street: calc(var(--city-bottom, 100%) - var(--H) * .12);
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* ---- behind: the cold halo, and the threshold ---- */
/* a ring of bone-white light well outside the body, so it shows round the deck */
.de__halo {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px) * 2.1);
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * 2.1);
  width: calc(var(--moon-r, 200px) * 4.2);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(closest-side, transparent 52%, rgba(226, 236, 228, .16) 60%, rgba(226, 236, 228, .3) 66%, rgba(200, 216, 206, .1) 76%, transparent 92%);
  animation: de-halo 1.6s cubic-bezier(.2, .7, .2, 1) .4s both;
}

/* the threshold: a tall soft column of cold light at the castle's foot, right of the deck */
.de__threshold {
  position: absolute;
  left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * 1.15);
  bottom: calc(100% - var(--street));
  width: calc(var(--moon-r, 200px) * .55);
  height: calc(var(--H) * .62);
  background:
    radial-gradient(60% 100% at 50% 100%, rgba(236, 244, 238, .55), rgba(206, 224, 212, .22) 45%, transparent 85%);
  transform-origin: 50% 100%;
  animation: de-open 1.4s cubic-bezier(.2, .7, .2, 1) 1s both;
}

@keyframes de-halo {
  from { opacity: 0; transform: scale(.85); }
}

@keyframes de-open {
  from { opacity: 0; transform: scaleY(.1); }
}

/* ---- in front ---- */
/* pale mist pooling in the streets (the scene's fog texture, bone-coloured) */
.de__mist {
  position: absolute;
  left: -10%;
  right: -10%;
  top: calc(var(--street) - var(--H) * .3);
  height: calc(var(--H) * .42);
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 40%, #000 75%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 40%, #000 75%, transparent);
  opacity: .6;
  animation: de-mist 1.8s cubic-bezier(.25, .6, .3, 1) .3s both;
}

.de__mist--near {
  top: calc(var(--street) - var(--H) * .12);
  height: calc(var(--H) * .3);
  opacity: .5;
  animation-delay: .6s;
}

.de__tex {
  --tile: var(--fog) repeat-x 0 50% / 62% 100%;
  position: absolute;
  inset: 0;
  background: linear-gradient(#e2e8e0, #c6d0c8), var(--tile);
  background-blend-mode: multiply;
  -webkit-mask: var(--tile);
  mask: var(--tile);
  -webkit-mask-mode: luminance;
  mask-mode: luminance;
}

.de__mist--near .de__tex {
  --tile: var(--fog) repeat-x 45% 50% / 70% 100%;
}

@keyframes de-mist {
  from { opacity: 0; transform: translate3d(0, 25%, 0); }
}

/* the colour draining: grey in saturation mode takes the hue out of everything under it */
.de__drain {
  position: absolute;
  inset: 0;
  background: #808080;
  mix-blend-mode: saturation;
  opacity: .82;
  animation: de-drain 1.4s ease .2s both;
}

@keyframes de-drain {
  from { opacity: 0; }
}

/* paper: lighter mist, the same drain */
:root[data-theme="parchment"] .de__mist {
  opacity: .35;
}

:root[data-theme="parchment"] .de__halo,
:root[data-theme="parchment"] .de__threshold {
  mix-blend-mode: multiply;
  opacity: .5;
}

@media (prefers-reduced-motion: reduce) {
  .de__halo,
  .de__threshold,
  .de__mist,
  .de__drain {
    animation: none;
  }
}
</style>
