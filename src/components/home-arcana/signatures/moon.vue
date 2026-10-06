<template>
  <!--
    Moon: the full crimson moon (the base scene swells and brightens it) blooms, and its light
    floods the castle: a crimson wash spreads over the stone from the moon outward and every
    roof edge and spire facing it catches a crimson rim. The bats are the scene's own texel
    weather; nothing is drawn here but light.
  -->
  <div class="mn" :class="{'is-late': from && from !== 'moon'}" aria-hidden="true" :style="{'--sig-city': `url(${city})`}">
    <template v-if="layer === 'back'">
      <!-- kept on the moon (its rise, its sink on scroll, its swell) -->
      <div ref="followRef" class="mn__anchor">
        <div ref="riseRef" class="mn__rise">
          <i class="mn__bloom"></i>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="mn__flood"><i class="mn__spread"></i></div>
      <i class="mn__rim mn__rim--soft"></i>
      <i class="mn__rim"></i>
    </template>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import city from '../assets/moon/backlund-skyline.webp';
import {useMoonAnchor} from './sigKit';

defineProps<{layer: 'back' | 'front'; from?: string}>();

const followRef = ref<HTMLElement | null>(null);
const riseRef = ref<HTMLElement | null>(null);
useMoonAnchor(followRef, riseRef);
</script>

<style scoped>
.mn {
  /* when the light comes: at once if the moon was up, after it has risen (or cleared the cloud) if not */
  --in: .6s;
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.mn.is-late {
  --in: 1.9s;
}

/* ---- behind the castle, on the moon ---- */
.mn__anchor {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  aspect-ratio: 1;
}

.mn__rise {
  position: absolute;
  inset: 0;
  transform: scale(var(--moon-scale, 1));
}

/* the full moon's light thickening the air round it */
.mn__bloom {
  position: absolute;
  inset: -120%;
  border-radius: 50%;
  background: radial-gradient(circle closest-side,
      rgba(255, 70, 90, .34) 18%,
      rgba(220, 40, 62, .2) 30%,
      rgba(170, 20, 44, .08) 52%,
      transparent 80%);
  animation: mn-bloom 2.4s cubic-bezier(.2, .7, .2, 1) var(--in) both;
}

/* ---- in front: the castle flooded with crimson moonlight ---- */
.mn__flood,
.mn__rim {
  --cx: calc(var(--moon-x, 72%) - var(--city-left, 0px));
  --cy: calc(var(--moon-y, 48%) - var(--city-bottom, 100%) + var(--city-h, 600px));
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
}

/* the wash over the stone, spreading out from under the moon */
.mn__flood {
  overflow: hidden;
  -webkit-mask: var(--sig-city) 0 0 / 100% 100% no-repeat;
  mask: var(--sig-city) 0 0 / 100% 100% no-repeat;
}

.mn__spread {
  position: absolute;
  left: calc(var(--cx) - var(--city-h, 600px) * 1.2);
  top: calc(var(--cy) - var(--city-h, 600px) * 1.2);
  width: calc(var(--city-h, 600px) * 2.4);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle closest-side,
      rgba(255, 60, 82, .27) 0,
      rgba(220, 36, 60, .15) 30%,
      rgba(170, 20, 44, .06) 58%,
      transparent 85%);
  animation: mn-spread 2.6s cubic-bezier(.2, .6, .25, 1) calc(var(--in) + .3s) both;
}

/*
 * Rim light: the city minus itself shifted down a few pixels leaves the top edge of every
 * roof, ledge and spire; lit crimson, brightest nearest the moon.
 */
.mn__rim {
  --k: calc(var(--city-h, 600px) * .0045);
  background: radial-gradient(circle at var(--cx) var(--cy),
      rgba(255, 160, 170, .95) 0,
      rgba(255, 70, 92, .8) calc(var(--moon-r, 200px) * 1.6),
      rgba(200, 30, 54, .35) calc(var(--moon-r, 200px) * 3.4),
      transparent calc(var(--moon-r, 200px) * 5));
  -webkit-mask: var(--sig-city) 0 0 / 100% 100% no-repeat, var(--sig-city) 0 var(--k) / 100% 100% no-repeat;
  -webkit-mask-composite: source-out;
  mask: var(--sig-city) 0 0 / 100% 100% no-repeat, var(--sig-city) 0 var(--k) / 100% 100% no-repeat;
  mask-composite: subtract;
  animation: mn-fade 1.8s ease calc(var(--in) + 1.1s) both;
}

/* a broader, fainter edge under it: the light wrapping over the stone */
.mn__rim--soft {
  --k: calc(var(--city-h, 600px) * .016);
  opacity: .42;
  animation-delay: calc(var(--in) + .9s);
}

@keyframes mn-bloom {
  from { opacity: 0; transform: scale(.78); }
}

@keyframes mn-fade {
  from { opacity: 0; }
}

@keyframes mn-spread {
  from { opacity: 0; transform: scale(.25); }
  35% { opacity: 1; }
}

/* paper: a rose light on the haze, never a red sky */
:root[data-theme="parchment"] .mn__bloom {
  background: radial-gradient(circle closest-side, rgba(214, 60, 80, .2) 18%, rgba(200, 50, 70, .08) 40%, transparent 76%);
  mix-blend-mode: multiply;
}

:root[data-theme="parchment"] .mn__flood,
:root[data-theme="parchment"] .mn__rim {
  mix-blend-mode: multiply;
}

:root[data-theme="parchment"] .mn__spread {
  background: radial-gradient(circle closest-side, rgba(200, 60, 80, .28) 0, rgba(200, 70, 90, .12) 40%, transparent 90%);
}

:root[data-theme="parchment"] .mn__rim {
  background: radial-gradient(circle at var(--cx) var(--cy), rgba(190, 40, 60, .7) 0, rgba(190, 40, 60, .4) calc(var(--moon-r, 200px) * 2.4), transparent calc(var(--moon-r, 200px) * 4.6));
}

@media (prefers-reduced-motion: reduce) {
  .mn__bloom,
  .mn__spread,
  .mn__rim {
    animation: none;
  }
}
</style>
