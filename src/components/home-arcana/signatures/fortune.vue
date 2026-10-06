<template>
  <!--
    Wheel of Fortune: a halo forms round whatever hangs in the sky, the real thing, a ring
    of pale light at a fixed distance from the body with two faint mock-moons on it. It
    brightens and its iridescent sheen turns once round the ring, like a wheel coming
    round; then it settles under a soft aurora. No serpent, no dice, no rainbow.
  -->
  <div class="fortune" :class="{'is-sun': from === 'sun'}" :style="{'--lag': lag}" aria-hidden="true">
    <template v-if="layer === 'back'">
      <!-- the aurora: two soft ribbons high over the city -->
      <div class="fo-aurora">
        <div class="fo-aurora__drift">
          <i class="fo-ribbon fo-ribbon--a"></i>
          <i class="fo-ribbon fo-ribbon--b"></i>
        </div>
      </div>

      <!-- the halo, centred on the body (it follows the moon as the page scrolls) -->
      <div ref="followRef" class="fo-body">
        <i class="fo-halo"></i>
        <div class="fo-sheen">
          <i class="fo-sheen__turn"></i>
        </div>
        <i class="fo-dog fo-dog--l"></i>
        <i class="fo-dog fo-dog--r"></i>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useMoonAnchor} from './sigKit';

defineOptions({name: 'SignatureFortune'});
const props = defineProps<{layer: 'back' | 'front'; from?: string}>();

/* a halo forms on whatever is up: at once round the moon or the sun, later if it is behind cloud */
const lag = computed(() => (props.from === 'hidden' ? '.9s' : '0s'));

const followRef = ref<HTMLElement | null>(null);
useMoonAnchor(followRef, ref(null));
</script>

<style scoped>
.fortune {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* ---- the halo: a little over two radii out from the body, where a real halo sits ---- */
.fo-body {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  aspect-ratio: 1;
  will-change: transform;
  --ring: 2.4;
}

/* the ring: a faint red inner edge, white-silver, bleeding out to blue; darker sky inside */
.fo-halo {
  position: absolute;
  inset: calc(50% - var(--ring) * 50%);
  border-radius: 50%;
  background: radial-gradient(circle closest-side,
      transparent 58%,
      rgba(8, 10, 14, .14) 80%,
      rgba(255, 150, 140, .16) 85.5%,
      rgba(236, 246, 255, .34) 88%,
      rgba(190, 220, 255, .18) 91.5%,
      rgba(150, 190, 255, .06) 96%,
      transparent 100%);
  opacity: .7;
  animation: fo-form 3.4s ease-out calc(.7s + var(--lag)) backwards;
}

/* it gathers, brightens once as the sheen comes round, then rests */
@keyframes fo-form {
  0% { opacity: 0; transform: scale(.96); }
  45% { opacity: 1; transform: none; }
  70% { opacity: 1; }
}

/* the sheen: mint, violet and silver running round the ring, cut to the ring's width */
.fo-sheen {
  position: absolute;
  inset: calc(50% - var(--ring) * 50%);
  border-radius: 50%;
  -webkit-mask: radial-gradient(circle closest-side, transparent 83%, #000 87%, #000 90%, transparent 95%);
  mask: radial-gradient(circle closest-side, transparent 83%, #000 87%, #000 90%, transparent 95%);
  mix-blend-mode: screen;
  opacity: .38;
  animation: fo-sheen-in 3.4s ease-out calc(.9s + var(--lag)) backwards;
}

@keyframes fo-sheen-in {
  0% { opacity: 0; }
  50% { opacity: 1; }
}

.fo-sheen__turn {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(from 0deg,
      rgba(110, 231, 192, .55), rgba(167, 139, 250, .5) 60deg, rgba(230, 236, 245, .35) 120deg,
      rgba(110, 231, 192, .1) 180deg, rgba(167, 139, 250, .45) 250deg, rgba(220, 230, 240, .2) 310deg, rgba(110, 231, 192, .55));
  will-change: transform;
  /* once round, like a wheel coming to rest */
  animation: fo-turn 3.6s cubic-bezier(.5, 0, .2, 1) calc(1.1s + var(--lag)) backwards;
}

@keyframes fo-turn {
  from { transform: rotate(-360deg); }
}

/* mock moons: two soft brightenings on the ring, level with the body, a little iridescent */
.fo-dog {
  position: absolute;
  top: 50%;
  width: 30%;
  aspect-ratio: 1;
  translate: -50% -50%;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(245, 250, 255, .5), rgba(170, 230, 210, .18) 45%, transparent);
  mix-blend-mode: screen;
  opacity: .7;
  animation: fo-form 3.4s ease-out calc(1.6s + var(--lag)) backwards;
}

.fo-dog--l {
  left: calc(50% - var(--ring) * 44%);
}

.fo-dog--r {
  left: calc(50% + var(--ring) * 44%);
}

/* round the sun the halo is warmer at its inner edge and the mock suns brighter */
.is-sun .fo-dog {
  background: radial-gradient(closest-side, rgba(255, 246, 225, .6), rgba(255, 210, 160, .2) 45%, transparent);
}

/* ---- the aurora: soft curtains of light, rayed upward, high over the city ---- */
.fo-aurora {
  position: absolute;
  inset: 0 0 auto;
  height: calc(var(--moon-y, 48%) + var(--moon-r, 200px) * .4);
  overflow: hidden;
  /* fades out downward and toward the copy column (one radial fade: no composited mask pairs here) */
  -webkit-mask: radial-gradient(70% 100% at 85% 0%, #000 45%, transparent);
  mask: radial-gradient(70% 100% at 85% 0%, #000 45%, transparent);
  animation: fo-aurora-in 4s ease-out calc(.4s + var(--lag)) backwards;
}

@keyframes fo-aurora-in {
  from { opacity: 0; }
}

.fo-aurora__drift {
  position: absolute;
  inset: 0 -10%;
  will-change: transform;
  /* the only thing still moving: the curtains swaying, very slowly */
  animation: fo-sway 24s ease-in-out 4s infinite alternate;
}

@keyframes fo-sway {
  to { transform: translate3d(4%, 0, 0); }
}

.fo-ribbon {
  position: absolute;
  left: 30%;
  width: 80%;
  border-radius: 50%;
  mix-blend-mode: screen;
  /* the rays of the curtain: uneven vertical streaks, softened */
  -webkit-mask: repeating-linear-gradient(90deg, #000 0 9px, rgba(0, 0, 0, .45) 13px, #000 17px, rgba(0, 0, 0, .7) 26px, #000 31px), radial-gradient(closest-side, #000 40%, transparent);
  -webkit-mask-composite: source-in;
  mask: repeating-linear-gradient(90deg, #000 0 9px, rgba(0, 0, 0, .45) 13px, #000 17px, rgba(0, 0, 0, .7) 26px, #000 31px), radial-gradient(closest-side, #000 40%, transparent);
  mask-composite: intersect;
  filter: blur(6px);
}

.fo-ribbon--a {
  top: 6%;
  height: 34%;
  transform: rotate(-7deg);
  background: linear-gradient(180deg, transparent, rgba(110, 231, 192, .44) 55%, rgba(110, 231, 192, .14) 80%, transparent);
}

.fo-ribbon--b {
  top: 16%;
  left: 46%;
  width: 70%;
  height: 30%;
  transform: rotate(5deg);
  background: linear-gradient(180deg, transparent, rgba(167, 139, 250, .36) 50%, rgba(200, 210, 240, .12) 78%, transparent);
}

/* light theme: the same light as faint ink washes on the paper sky */
:root[data-theme="parchment"] .fo-halo {
  background: radial-gradient(circle closest-side,
      transparent 82%,
      rgba(200, 110, 100, .14) 85.5%,
      rgba(90, 110, 150, .2) 88.5%,
      rgba(90, 130, 170, .08) 93%,
      transparent 100%);
}

:root[data-theme="parchment"] .fo-sheen,
:root[data-theme="parchment"] .fo-dog,
:root[data-theme="parchment"] .fo-ribbon {
  mix-blend-mode: multiply;
}

:root[data-theme="parchment"] .fo-aurora {
  opacity: .6;
}

@media (prefers-reduced-motion: reduce) {
  .fo-halo,
  .fo-sheen,
  .fo-sheen__turn,
  .fo-dog,
  .fo-aurora,
  .fo-aurora__drift {
    animation: none;
  }
}
</style>
