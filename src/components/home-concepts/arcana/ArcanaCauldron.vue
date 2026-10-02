<template>
  <!-- A Magic Cauldron from its pixel layers; the brew takes the page accent. -->
  <div class="arc-cauldron" :class="{'is-boiling': boiling}" aria-hidden="true">
    <span class="arc-cauldron__fire" :style="{backgroundImage: `url(${fire})`}"></span>
    <img class="arc-cauldron__layer" :src="well" alt="" width="320" height="336" loading="lazy" draggable="false">
    <span class="arc-cauldron__liquid">
      <img class="arc-cauldron__layer arc-cauldron__surface" :src="surface" alt="" width="320" height="336" loading="lazy" draggable="false">
    </span>
    <img class="arc-cauldron__layer" :src="body" alt="" width="320" height="336" loading="lazy" draggable="false">
    <span class="arc-cauldron__glow"></span>
    <span v-if="boiling" class="arc-cauldron__bubbles">
      <i v-for="n in 6" :key="n" :style="{'--n': n}"></i>
    </span>
  </div>
</template>

<script setup lang="ts">
import well from '@/assets/images/home-library/cauldron/cauldron-well.png';
import surface from '@/assets/images/home-library/cauldron/cauldron-surface.png';
import body from '@/assets/images/home-library/cauldron/cauldron-body.png';
import fire from '@/assets/images/home-library/cauldron/soul-fire.png';

withDefaults(defineProps<{boiling?: boolean}>(), {boiling: true});
</script>

<style scoped>
.arc-cauldron {
  position: relative;
  width: 100%;
  aspect-ratio: 320 / 336;
}

.arc-cauldron__layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  user-select: none;
}

.arc-cauldron__liquid {
  position: absolute;
  inset: 0;
  overflow: hidden;
  clip-path: polygon(50% 19.05%, 87.5% 36.9%, 50% 54.76%, 12.5% 36.9%);
  background:
    radial-gradient(ellipse 30% 14% at 50% 36.9%, rgba(255, 255, 255, .45), transparent 100%),
    var(--acc);
}

.arc-cauldron__surface {
  opacity: .55;
  mix-blend-mode: multiply;
}

.arc-cauldron__glow {
  position: absolute;
  inset: -6% -14% 32%;
  background: radial-gradient(ellipse 46% 40% at 50% 46%, color-mix(in oklab, var(--acc) 60%, transparent), transparent 72%);
  mix-blend-mode: screen;
  opacity: .7;
  pointer-events: none;
}

.arc-cauldron__fire {
  position: absolute;
  bottom: 0;
  left: 26%;
  width: 48%;
  height: 18%;
  background-size: 100% 200%;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  -webkit-mask-image: linear-gradient(0deg, transparent, #000 35%);
  mask-image: linear-gradient(0deg, transparent, #000 35%);
  animation: arc-fire .5s steps(1) infinite;
}

@keyframes arc-fire {
  0% { background-position: 0 0; }
  50% { background-position: 0 100%; }
}

.arc-cauldron__bubbles i {
  position: absolute;
  left: calc(30% + var(--n) * 6.5%);
  top: 34%;
  width: 4.5%;
  aspect-ratio: 1;
  background: color-mix(in oklab, var(--acc) 50%, #fff);
  opacity: 0;
  animation: arc-bubble 2.4s steps(6) infinite;
  animation-delay: calc(var(--n) * -0.43s);
}

@keyframes arc-bubble {
  0% { transform: translateY(0); opacity: 0; }
  15% { opacity: .9; }
  100% { transform: translateY(-260%); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .arc-cauldron__fire,
  .arc-cauldron__bubbles i {
    animation: none;
  }
}
</style>
