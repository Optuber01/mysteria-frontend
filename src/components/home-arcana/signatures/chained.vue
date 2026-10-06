<template>
  <!--
    Chained: the full moon bound. Bands of iron-grey cloud close across the crimson moon
    from either side like bindings, settle over its face, and tighten once with a small
    shudder, as if something inside had pulled against them; a cold pressure closes in at
    the edges of the sky. No chains drawn, no wolf, no bars.
  -->
  <div class="chained" :style="{'--lag': lag}" aria-hidden="true">
    <div v-if="layer === 'back'" ref="followRef" class="ch-moon">
      <div v-for="(b, i) in BANDS" :key="i" class="ch-band" :style="b">
        <div class="ch-band__bind">
          <i class="ch-band__cloud"></i>
          <i class="ch-band__cloud"></i>
          <i class="ch-band__cloud"></i>
        </div>
      </div>
    </div>

    <!-- the cold pressing in -->
    <i v-else class="ch-press"></i>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useMoonAnchor} from './sigKit';

defineOptions({name: 'SignatureChained'});
const props = defineProps<{layer: 'back' | 'front'; from?: string}>();

/* the moon has to be up to be bound */
const lag = computed(() => (!props.from || props.from === 'moon' ? '0s' : '.9s'));

const followRef = ref<HTMLElement | null>(null);
useMoonAnchor(followRef, ref(null));

/*
 * The bands: height across the moon (moon radii from its centre), thickness, tilt, which
 * side they close from, and the cloud texture's offset so no two look alike.
 */
const BANDS = [
  {y: -.5, h: .62, tilt: -7, from: -1, bg: '0%', i: 0},
  {y: .04, h: .78, tilt: 4, from: 1, bg: '35%', i: 1},
  {y: .6, h: .56, tilt: -3, from: -1, bg: '70%', i: 2},
].map(b => ({
  '--y': b.y, '--h': b.h, '--tilt': `${b.tilt}deg`, '--from': b.from, '--bg': b.bg, '--i': b.i,
}));
</script>

<style scoped>
.chained {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* ---- back: a box on the moon, following it as the page scrolls ---- */
.ch-moon {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  aspect-ratio: 1;
  will-change: transform;
}

.ch-band {
  position: absolute;
  left: -150%;
  width: 400%;
  top: calc(50% + var(--y) * 50% - var(--h) * 25%);
  height: calc(var(--h) * 50%);
  transform: rotate(var(--tilt));
  will-change: transform;
  /* closing in from the side, slowing as it covers the moon */
  animation: ch-close 2.6s cubic-bezier(.2, .55, .25, 1) calc(.5s + var(--lag) + var(--i) * .25s) backwards;
}

@keyframes ch-close {
  from { opacity: 0; transform: translate3d(calc(var(--from) * 45%), 0, 0) rotate(var(--tilt)); }
  35% { opacity: 1; }
}

/* the bind: pulled tight once, with a small shudder, then held */
.ch-band__bind {
  position: absolute;
  inset: 0;
  transform: scaleY(.8) translate3d(0, calc(var(--y) * -14%), 0);
  /* soft all round: one radial fade (a gradient pair composited here would hide the luminance-masked cloud in Chrome) */
  -webkit-mask: radial-gradient(closest-side, #000 50%, transparent);
  mask: radial-gradient(closest-side, #000 50%, transparent);
  animation: ch-tighten 1.1s cubic-bezier(.5, 0, .3, 1) calc(3.2s + var(--lag)) backwards;
}

@keyframes ch-tighten {
  0% { transform: none; }
  45% { transform: scaleY(.74) translate3d(0, calc(var(--y) * -18%), 0); }
  60% { transform: scaleY(.84) translate3d(0, calc(var(--y) * -12%), 0); }
  75% { transform: scaleY(.77) translate3d(0, calc(var(--y) * -15%), 0); }
  100% { transform: scaleY(.8) translate3d(0, calc(var(--y) * -14%), 0); }
}

/*
 * Iron-grey cloud: the scene's fog texture darkened and cut by its own light, as in
 * HeroNightScene .night__clouds. Three offset copies make the band dense.
 */
.ch-band__cloud {
  --fog-x: var(--bg);
  position: absolute;
  inset: 0;
  background:
    linear-gradient(var(--iron, #23262c), var(--iron, #23262c)),
    url('../assets/moon/fog-bank.webp') repeat-x var(--fog-x) 0 / 30% 100%;
  background-blend-mode: multiply;
  -webkit-mask: url('../assets/moon/fog-bank.webp') repeat-x var(--fog-x) 0 / 30% 100%;
  mask: url('../assets/moon/fog-bank.webp') repeat-x var(--fog-x) 0 / 30% 100%;
  -webkit-mask-mode: luminance;
  mask-mode: luminance;
}

.ch-band__cloud:nth-child(2) {
  --fog-x: calc(var(--bg) + 47%);
}

.ch-band__cloud:nth-child(3) {
  --fog-x: calc(var(--bg) + 21%);
  background-size: 100% 100%, 41% 100%;
  -webkit-mask-size: 41% 100%;
  mask-size: 41% 100%;
}

/* ---- front: the pressure, a cold vignette that closes in as the bands tighten ---- */
.ch-press {
  position: absolute;
  inset: 0 0 auto;
  height: var(--scene-h, 100%);
  background: radial-gradient(ellipse 70% 75% at var(--moon-x, 72%) var(--moon-y, 48%), transparent 40%, rgba(12, 14, 18, .34) 75%, rgba(8, 9, 12, .6));
  opacity: .8;
  animation: ch-press 4.4s ease-in-out calc(.4s + var(--lag)) backwards;
}

@keyframes ch-press {
  0% { opacity: 0; }
  62% { opacity: .75; }
  74% { opacity: 1; }
  100% { opacity: .8; }
}

/* light theme: grey rain-cloud bands and a soft grey pressure on the paper */
:root[data-theme="parchment"] .chained {
  --iron: #8a9098;
}

:root[data-theme="parchment"] .ch-band__bind {
  opacity: .7;
}

:root[data-theme="parchment"] .ch-press {
  background: radial-gradient(ellipse 70% 75% at var(--moon-x, 72%) var(--moon-y, 48%), transparent 45%, rgba(110, 116, 126, .18) 80%, rgba(110, 116, 126, .3));
}

@media (prefers-reduced-motion: reduce) {
  .ch-band,
  .ch-band__bind,
  .ch-press {
    animation: none;
  }
}
</style>
