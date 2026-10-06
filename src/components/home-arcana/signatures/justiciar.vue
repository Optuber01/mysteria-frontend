<template>
  <!--
    Justiciar: the verdict is stillness. A single level line of light draws itself along
    the horizon, outward from under the moon; as it reaches the edges everything stops.
    Thin strata of fog level out and hold, the scene's own fog freezes mid-drift ("drifting
    is prohibited here"), and a clear brass-cold light settles on the castle. No glyphs,
    no scales, no gavel.

    The freeze reaches the base scene's fog: on the verdict this adds `sig-justiciar-still`
    to the closest `.night`, which pauses its fog and cloud drift (the :global rule below),
    and removes it again on unmount.
  -->
  <div ref="rootRef" class="justiciar" :style="{'--lag': lag}" aria-hidden="true">
    <template v-if="layer === 'back'">
      <!-- strata of fog, levelling out and holding -->
      <div v-for="(s, i) in STRATA" :key="i" class="ju-stratum" :style="s">
        <i class="ju-stratum__fog"></i>
        <i class="ju-stratum__tint"></i>
      </div>
      <!-- the line along the horizon -->
      <div class="ju-horizon">
        <i class="ju-horizon__glow"></i>
        <i class="ju-horizon__line"></i>
      </div>
    </template>

    <!-- clear, cold light on the castle, with a brass edge where the moon catches it -->
    <div v-else class="ju-city">
      <i class="ju-light" :style="{'--city-mask': `url(${city})`}"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue';
import city from '../assets/moon/backlund-skyline.webp';
import {reducedMotion} from './sigKit';

defineOptions({name: 'SignatureJusticiar'});
const props = defineProps<{layer: 'back' | 'front'; from?: string}>();

/* the moon rises first if it was not up */
const lagS = computed(() => (!props.from || props.from === 'moon' ? 0 : .9));
const lag = computed(() => `${lagS.value}s`);

/* strata: height in the sky (moon radii from the moon's centre), thickness, opacity, which way they were leaning */
const STRATA = [
  {y: -1.05, h: .2, o: .5, tilt: -1.4, i: 0},
  {y: .12, h: .26, o: .42, tilt: 1.1, i: 1},
  {y: .78, h: .3, o: .55, tilt: -.8, i: 2},
].map(s => ({'--y': s.y, '--h': s.h, '--o': s.o, '--tilt': `${s.tilt}deg`, '--i': s.i}));

/* ---- the line's last stretch: everything stops ---- */
const VERDICT_AT = 2.3;
const rootRef = ref<HTMLElement | null>(null);
let night: HTMLElement | null = null;
let timer = 0;
onMounted(() => {
  if (props.layer !== 'back') return;
  night = rootRef.value?.closest<HTMLElement>('.night') ?? null;
  const stop = () => night?.classList.add('sig-justiciar-still');
  if (reducedMotion()) stop();
  else timer = window.setTimeout(stop, (VERDICT_AT + lagS.value) * 1000);
});
onUnmounted(() => {
  window.clearTimeout(timer);
  night?.classList.remove('sig-justiciar-still');
});
</script>

<style scoped>
/* the base scene's fog and clouds, frozen mid-drift while the verdict stands */
:global(.night.sig-justiciar-still .night__fog-drift),
:global(.night.sig-justiciar-still .night__clouds-drift) {
  animation-play-state: paused;
}

.justiciar {
  position: absolute;
  inset: 0;
  pointer-events: none;
  /* the horizon behind the city: about half-way up the skyline */
  --horizon: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .5);
}

/* ---- the strata: the scene's fog texture, flattened into level bands ---- */
.ju-stratum {
  position: absolute;
  left: -4%;
  right: -4%;
  top: calc(var(--moon-y, 48%) + var(--moon-r, 200px) * (var(--y) - var(--h) / 2));
  height: calc(var(--moon-r, 200px) * var(--h));
  overflow: hidden;
  isolation: isolate;
  mix-blend-mode: screen;
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 35%, #000 65%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 35%, #000 65%, transparent);
  opacity: var(--o);
  will-change: transform;
  /* leaning and drifting, slowing, level: and held */
  animation: ju-level 2.6s cubic-bezier(.1, .5, .15, 1) calc(.2s + var(--lag) + var(--i) * .12s) backwards;
}

@keyframes ju-level {
  0% { opacity: 0; transform: translate3d(-3%, 0, 0) rotate(var(--tilt)); }
  30% { opacity: var(--o); }
}

.ju-stratum__fog {
  position: absolute;
  inset: 0;
  background: url('../assets/moon/fog-bank.webp') repeat-x 0 50% / 38% 100%;
}

.ju-stratum:nth-child(2) .ju-stratum__fog {
  background-position-x: 30%;
}

.ju-stratum:nth-child(3) .ju-stratum__fog {
  background-position-x: 70%;
}

.ju-stratum__tint {
  position: absolute;
  inset: 0;
  background-color: var(--fog-tone, #d8cfc6);
  mix-blend-mode: multiply;
}

/* ---- the horizon line, drawn outward from under the moon ---- */
.ju-horizon {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(var(--horizon) - var(--moon-r, 200px) * .2);
  height: calc(var(--moon-r, 200px) * .4);
  /* clear of the copy column */
  -webkit-mask-image: linear-gradient(90deg, transparent 42%, #000 56%, #000 94%, transparent);
  mask-image: linear-gradient(90deg, transparent 42%, #000 56%, #000 94%, transparent);
}

.ju-horizon__glow,
.ju-horizon__line {
  position: absolute;
  left: 0;
  right: 0;
  transform-origin: var(--moon-x, 72%) 50%;
  animation: ju-draw 1.9s cubic-bezier(.5, 0, .3, 1) calc(.4s + var(--lag)) backwards;
}

.ju-horizon__glow {
  inset: 0 0;
  background: linear-gradient(180deg, transparent, rgba(255, 214, 170, .1) 40%, rgba(255, 228, 196, .28) 50%, rgba(255, 214, 170, .1) 60%, transparent);
  mix-blend-mode: screen;
}

.ju-horizon__line {
  top: calc(50% - .75px);
  height: 1.5px;
  background: linear-gradient(90deg, rgba(240, 200, 150, .5), rgba(255, 244, 226, .95) 50%, rgba(240, 200, 150, .5));
  box-shadow: 0 0 6px rgba(255, 210, 160, .5);
  opacity: .85;
}

@keyframes ju-draw {
  from { transform: scaleX(0); }
}

/* ---- front: the castle in clear, cold light, brass where the moon catches it ---- */
.ju-city {
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
}

.ju-light {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at calc(var(--moon-x, 72%) - var(--city-left, 0px)) calc(var(--moon-y, 48%) - var(--city-bottom, 100%) + var(--city-h, 600px)),
      rgba(242, 171, 120, .5) 0, rgba(242, 171, 120, .12) calc(var(--moon-r, 200px) * 1.8), transparent calc(var(--moon-r, 200px) * 2.6)),
    linear-gradient(180deg, rgba(210, 222, 240, .3), rgba(200, 212, 230, .08) 50%, transparent 75%);
  -webkit-mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mix-blend-mode: screen;
  opacity: .55;
  animation: ju-light 2s ease-out calc(1.9s + var(--lag)) backwards;
}

@keyframes ju-light {
  from { opacity: 0; }
}

/* light theme: a brass-grey ink line and cool grey strata on the paper */
:root[data-theme="parchment"] .ju-stratum {
  mix-blend-mode: multiply;
  opacity: calc(var(--o) * .7);
}

:root[data-theme="parchment"] .ju-stratum__fog {
  filter: invert(1);
}

/* inverted, the fog is grey on white; screening a warm grey over it colours the cloud and leaves the white */
:root[data-theme="parchment"] .ju-stratum__tint {
  background-color: #9a9286;
  mix-blend-mode: screen;
}

:root[data-theme="parchment"] .ju-horizon__glow {
  mix-blend-mode: multiply;
  background: linear-gradient(180deg, transparent, rgba(160, 110, 60, .1) 45%, rgba(160, 110, 60, .18) 50%, rgba(160, 110, 60, .1) 55%, transparent);
}

:root[data-theme="parchment"] .ju-horizon__line {
  background: linear-gradient(90deg, rgba(138, 90, 36, .4), rgba(138, 90, 36, .8) 50%, rgba(138, 90, 36, .4));
  box-shadow: none;
}

:root[data-theme="parchment"] .ju-light {
  mix-blend-mode: multiply;
  opacity: .3;
}

@media (prefers-reduced-motion: reduce) {
  .ju-stratum,
  .ju-horizon__glow,
  .ju-horizon__line,
  .ju-light {
    animation: none;
  }
}
</style>
