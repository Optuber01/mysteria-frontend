<template>
  <!--
    White Tower: nothing is hidden. The air clears to a cold crystal stillness, a pale shaft
    of light comes down from above onto the castle, and a clean white reading light passes
    across the buildings, line by line, then stays on them. Torn pages already tumble in
    the scene's own weather. No tower of books, no eyes, no gears.
  -->
  <div class="tower" :style="{'--lag': lag}" aria-hidden="true">
    <template v-if="layer === 'back'">
      <!-- the air going clear: a cold clarity settling down through the sky -->
      <i class="to-clear"></i>
      <!-- the shaft from above -->
      <div class="to-shaft"><i class="to-shaft__beam"></i></div>
    </template>

    <div v-else class="to-city">
      <!-- the reading light, passing across the castle once and staying -->
      <div class="to-read" :style="{'--city-mask': `url(${city})`}">
        <i class="to-read__wash"></i>
        <i class="to-read__pass"></i>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import city from '../assets/moon/backlund-skyline.webp';

defineOptions({name: 'SignatureTower'});
const props = defineProps<{layer: 'back' | 'front'; from?: string}>();

/* out of a storm or a sunset, the light waits for the sky to change first */
const lag = computed(() => (!props.from || props.from === 'moon' ? '0s' : '.7s'));
</script>

<style scoped>
.tower {
  position: absolute;
  inset: 0;
  pointer-events: none;
  /* where the shaft lands: broad over the castle keep */
  --land-x: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * .3);
  --land-y: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * .2);
}

/* ---- back: the clearing ---- */
.to-clear {
  position: absolute;
  inset: 0 0 auto;
  height: var(--scene-h, 100%);
  background: linear-gradient(180deg, rgba(214, 226, 248, .12), rgba(214, 226, 248, .05) 50%, transparent 80%);
  mix-blend-mode: screen;
  transform-origin: 50% 0;
  animation: to-clear 3s cubic-bezier(.3, .1, .3, 1) calc(.3s + var(--lag)) backwards;
}

@keyframes to-clear {
  from { opacity: 0; transform: scaleY(.2); }
}

/* ---- back: the shaft, slanting down from above the frame onto the keep ---- */
.to-shaft {
  position: absolute;
  left: var(--land-x);
  top: var(--land-y);
  width: 0;
  height: 0;
  /* a few degrees off the vertical, from the upper left */
  rotate: -14deg;
  filter: blur(calc(var(--moon-r, 200px) * .12));
}

.to-shaft__beam {
  position: absolute;
  left: calc(var(--moon-r, 200px) * -1.2);
  bottom: 0;
  width: calc(var(--moon-r, 200px) * 2.4);
  height: calc(var(--land-y) + var(--moon-r, 200px) * 1.5);
  /* narrower at the top, opening as it falls */
  clip-path: polygon(32% 0, 68% 0, 100% 100%, 0 100%);
  background: linear-gradient(180deg, rgba(236, 242, 255, 0), rgba(236, 242, 255, .16) 40%, rgba(240, 245, 255, .28) 85%, rgba(240, 245, 255, .08));
  mix-blend-mode: screen;
  transform-origin: 50% 0;
  animation: to-fall 2.4s cubic-bezier(.3, .1, .2, 1) calc(.9s + var(--lag)) backwards;
}

@keyframes to-fall {
  from { opacity: 0; transform: scaleY(.3); }
}

/* ---- front: the reading light on the castle ---- */
.to-city {
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
}

.to-read {
  position: absolute;
  inset: 0;
  overflow: hidden;
  -webkit-mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mix-blend-mode: screen;
}

/* what stays: cold white from above, strongest where the shaft lands */
.to-read__wash {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(calc(var(--moon-r, 200px) * 1.6) calc(var(--moon-r, 200px) * 2.4) at calc(var(--land-x) - var(--city-left, 0px)) calc(var(--land-y) - var(--city-bottom, 100%) + var(--city-h, 600px)), rgba(236, 242, 255, .5), rgba(220, 230, 250, .12) 60%, transparent),
    linear-gradient(180deg, rgba(225, 233, 250, .26), rgba(225, 233, 250, .06) 55%, transparent 80%);
  opacity: .8;
  animation: to-wash 2.6s ease-out calc(2.2s + var(--lag)) backwards;
}

@keyframes to-wash {
  from { opacity: 0; }
}

/* the pass: a band of clean light moving across the buildings, as an eye moves along a line */
.to-read__pass {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -30%;
  width: 30%;
  background: linear-gradient(90deg, transparent, rgba(240, 245, 255, .45) 50%, transparent);
  opacity: 0;
  will-change: transform;
  animation: to-pass 2.8s cubic-bezier(.45, .05, .55, .95) calc(1.3s + var(--lag)) backwards;
}

@keyframes to-pass {
  0% { opacity: 0; transform: none; }
  15% { opacity: 1; }
  85% { opacity: 1; }
  100% { opacity: 0; transform: translate3d(433%, 0, 0); }
}

/* light theme: the same cold light as a blue-grey clarity on the paper */
:root[data-theme="parchment"] .to-clear,
:root[data-theme="parchment"] .to-shaft__beam,
:root[data-theme="parchment"] .to-read {
  mix-blend-mode: multiply;
}

:root[data-theme="parchment"] .to-clear {
  background: linear-gradient(180deg, rgba(200, 212, 235, .25), transparent 70%);
}

:root[data-theme="parchment"] .to-shaft__beam {
  background: linear-gradient(180deg, rgba(190, 205, 230, 0), rgba(190, 205, 230, .3) 50%, rgba(190, 205, 230, .1));
}

:root[data-theme="parchment"] .to-read {
  opacity: .5;
}

@media (prefers-reduced-motion: reduce) {
  .to-clear,
  .to-shaft__beam,
  .to-read__wash,
  .to-read__pass {
    animation: none;
  }
}
</style>
