<template>
  <!--
    Backlund by night: the sky, the crimson moon rising behind the castle, fog
    crossing its face, fog in the streets. Purely decorative. Placement comes
    from the hero, which measures where the deck's pivot is and sets
    --moon-x/--moon-y/--moon-r and --city-* (all px, relative to the hero box).
  -->
  <div class="night" :class="{'is-risen': risen && moonReady}" aria-hidden="true">
    <picture>
      <source media="(max-width: 720px)" :srcset="skySmall">
      <img class="night__sky" :src="sky" alt="" fetchpriority="high" decoding="async" width="1920" height="1080">
    </picture>
    <i class="night__tint"></i>

    <div class="night__moon">
      <div class="night__moon-rise">
        <i class="night__moon-glow"></i>
        <i class="night__moon-corona"></i>
        <img ref="moonRef" class="night__moon-disc" :src="moon" alt="" decoding="async" width="640" height="640" @load="moonReady = true" @error="moonReady = true">
        <i class="night__moon-rim"></i>
      </div>
    </div>

    <div class="night__fog night__fog--a"><i class="night__fog-drift"></i><i class="night__fog-tint"></i></div>
    <div class="night__fog night__fog--b"><i class="night__fog-drift"></i><i class="night__fog-tint"></i></div>

    <picture>
      <source media="(max-width: 720px)" :srcset="citySmall">
      <img class="night__city" :src="city" alt="" decoding="async" width="1920" height="1080">
    </picture>
    <i class="night__moonlight" :style="{'--city-mask': `url(${city})`}"></i>
    <div class="night__fog night__fog--streets"><i class="night__fog-drift"></i><i class="night__fog-tint"></i></div>
    <i class="night__scrim"></i>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import sky from './assets/moon/backlund-sky.webp';
import skySmall from './assets/moon/backlund-sky-960.webp';
import city from './assets/moon/backlund-skyline.webp';
import citySmall from './assets/moon/backlund-skyline-960.webp';
import moon from './assets/moon/crimson-moon.webp';

defineProps<{risen: boolean}>();

/* The moon only starts to rise once it is there to see. */
const moonRef = ref<HTMLImageElement | null>(null);
const moonReady = ref(false);
onMounted(() => {
  if (moonRef.value?.complete) moonReady.value = true;
});
</script>

<style scoped>
.night {
  /* The moon itself stays crimson; the drawn card colours its corona, rim and the fog. */
  --crimson: #b3202b;
  --moon-tone: color-mix(in oklab, var(--crimson) 72%, var(--acc));
  --fog-tone: color-mix(in oklab, var(--acc) 26%, #d9d5de);
  position: absolute;
  inset: 0 0 auto;
  height: var(--scene-h, 100%);
  overflow: hidden;
  pointer-events: none;
  background: #0d0d11;
}

.night__sky {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 30% 30%;
  opacity: .8;
}

/* The sky warms toward the moon. */
.night__tint {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at var(--moon-x, 72%) var(--moon-y, 48%), rgba(179, 32, 43, .3) 0, transparent calc(var(--moon-r, 200px) * 3)),
    radial-gradient(circle at var(--moon-x, 72%) var(--moon-y, 48%), color-mix(in oklab, var(--acc) 9%, transparent) 0, transparent calc(var(--moon-r, 200px) * 4.2)),
    linear-gradient(180deg, rgba(11, 11, 14, .55), transparent 40%);
}

/* ---- the moon ---- */
.night__moon {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  aspect-ratio: 1;
}

/* On arrival it climbs out from behind the castle. */
.night__moon-rise {
  position: absolute;
  inset: 0;
  transform: translate3d(0, 34%, 0);
  opacity: .0;
  transition: transform 2.6s cubic-bezier(.16, .84, .3, 1) .1s, opacity 1.2s ease .1s;
}

.is-risen .night__moon-rise {
  transform: none;
  opacity: 1;
}

.night__moon-glow {
  position: absolute;
  inset: -75%;
  border-radius: 50%;
  background: radial-gradient(circle,
      rgba(179, 32, 43, .46) 0%,
      rgba(179, 32, 43, .16) 30%,
      transparent 60%);
}

/* A halo in the card's colour, just off the limb. */
.night__moon-corona {
  position: absolute;
  inset: -50%;
  border-radius: 50%;
  background: radial-gradient(circle closest-side,
      transparent 48%,
      color-mix(in oklab, var(--acc) 30%, transparent) 51%,
      color-mix(in oklab, var(--acc) 11%, transparent) 62%,
      transparent 86%);
}

.night__moon-disc {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  filter: saturate(1.08) brightness(.96);
}

/* Rim light in the card's colour along the moon's upper limb, plus a thin halo. */
.night__moon-rim {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 62%, transparent 58%, color-mix(in oklab, var(--acc) 30%, transparent) 71%, transparent 72%),
    radial-gradient(circle at 34% 28%, color-mix(in oklab, var(--acc) 14%, transparent), transparent 55%);
  box-shadow:
    0 0 0 1px color-mix(in oklab, var(--acc) 22%, transparent),
    0 0 calc(var(--moon-r, 200px) * .35) color-mix(in oklab, var(--acc) 26%, transparent);
  mix-blend-mode: screen;
}

/* ---- fog ---- */
.night__fog {
  position: absolute;
  left: 0;
  right: 0;
  overflow: hidden;
  isolation: isolate;
  mix-blend-mode: screen;
  /* soft top and bottom: a band of fog, never a stripe */
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent);
}

.night__fog-drift {
  position: absolute;
  inset: 0 auto 0 0;
  width: 200%;
  background: url('./assets/moon/fog-bank.webp') repeat-x 0 50% / 50% 100%;
  animation: night-drift 90s linear infinite;
}

/* Multiplying a colour onto grey-on-black fog tints the fog and leaves the black alone. */
.night__fog-tint {
  position: absolute;
  inset: 0;
  background: var(--fog-tone);
  mix-blend-mode: multiply;
}

/* Two bands cross the moon's face at different speeds. */
.night__fog--a {
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * .2);
  height: calc(var(--moon-r, 200px) * .62);
  opacity: .42;
}

.night__fog--b {
  top: calc(var(--moon-y, 48%) + var(--moon-r, 200px) * .34);
  height: calc(var(--moon-r, 200px) * .8);
  opacity: .36;
}

.night__fog--b .night__fog-drift {
  animation-duration: 140s;
  animation-direction: reverse;
}

.night__fog--streets {
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .3);
  height: calc(var(--city-h, 600px) * .3);
  opacity: .34;
}

.night__fog--streets .night__fog-drift {
  animation-duration: 70s;
}

@keyframes night-drift {
  to { translate: -50% 0; }
}

/* ---- the city in front of the moon ---- */
.night__city {
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  width: auto;
  max-width: none;
  -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 22%);
  mask-image: linear-gradient(90deg, transparent 0, #000 22%);
}

/* Moonlight catches the castle's edges nearest the moon (cut to the castle, so the moon keeps its colour). */
.night__moonlight {
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
  background: radial-gradient(circle at calc(var(--moon-x, 72%) - var(--city-left, 0px)) calc(var(--moon-y, 48%) - var(--city-bottom, 100%) + var(--city-h, 600px)),
      var(--moon-tone) 0, transparent calc(var(--moon-r, 200px) * 2.6));
  -webkit-mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mix-blend-mode: color;
  opacity: .5;
}

/* ---- legibility: the copy column, the header, the hand-off to the page ---- */
.night__scrim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(11, 11, 14, .9) 0%, rgba(11, 11, 14, .72) 30%, rgba(11, 11, 14, .2) 52%, transparent 62%),
    linear-gradient(180deg, rgba(11, 11, 14, .6) 0%, transparent calc(var(--site-header-stack, 106px) + 60px)),
    linear-gradient(0deg, var(--arc-bg) 0%, rgba(11, 11, 14, .85) 9%, transparent 24%);
}

/* Stacked layout: the scene is a band behind the title and the deck. */
@media (max-width: 900px) {
  .night__scrim {
    background:
      linear-gradient(180deg, rgba(11, 11, 14, .78) 0%, rgba(11, 11, 14, .35) calc(var(--site-header-stack, 106px) + 150px), transparent calc(var(--site-header-stack, 106px) + 230px)),
      linear-gradient(0deg, var(--arc-bg) 0%, rgba(11, 11, 14, .8) 12%, transparent 30%);
  }

  .night__city {
    -webkit-mask-image: none;
    mask-image: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .night__fog-drift {
    animation: none;
  }

  .night__moon-rise {
    transform: none;
    opacity: 1;
    transition: none;
  }
}
</style>
