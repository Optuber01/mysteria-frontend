<template>
  <!--
    Backlund by night: the sky, the crimson moon rising behind the castle, fog
    crossing its face, fog in the streets. Purely decorative. Placement comes
    from the hero, which measures where the deck's pivot is and sets
    --moon-x/--moon-y/--moon-r and --city-* (all px, relative to the hero box).
  -->
  <div ref="rootRef" class="night" :class="{'is-risen': risen && moonReady}" aria-hidden="true">
    <!-- Everything that is far away: on the way down to the brewery it falls behind the page. -->
    <div ref="viewRef" class="night__view">
      <picture>
        <source media="(max-width: 720px)" :srcset="skySmall">
        <img class="night__sky" :src="sky" alt="" fetchpriority="high" decoding="async" width="1920" height="1080">
      </picture>
      <i class="night__tint"></i>

      <div ref="moonBoxRef" class="night__moon">
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
    </div>
    <i ref="duskRef" class="night__dusk"></i>
    <i class="night__scrim"></i>
    <i class="night__horizon"></i>
  </div>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, ref} from 'vue';
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

/*
 * Leaving the hero is a descent: the far scene (sky, moon, castle) falls behind the
 * page, the moon sets behind the roofs and the night closes over it, while the potion
 * story's rooftops rise from below. Transform and opacity only, written straight to
 * three elements once per frame; the hero box is measured on resize, never per frame.
 */
const rootRef = ref<HTMLElement | null>(null);
const viewRef = ref<HTMLElement | null>(null);
const moonBoxRef = ref<HTMLElement | null>(null);
const duskRef = ref<HTMLElement | null>(null);
/** How much of the scroll the far scene and the moon give back (0 = scrolls with the page). */
const VIEW_LAG = 0.34;
const MOON_SINK = 0.24;
const DUSK = 0.6;

let sceneTop = 0;
let sceneH = 0;
let enabled = false;
let frame = 0;
let last = -1;
let resizeObserver: ResizeObserver | null = null;
let wide: MediaQueryList | null = null;
let calm: MediaQueryList | null = null;

function measure() {
  const el = rootRef.value;
  if (!el) return;
  const r = el.getBoundingClientRect();
  sceneTop = r.top + window.scrollY;
  sceneH = r.height;
  enabled = !!wide?.matches && !calm?.matches;
  last = -1;
  apply();
}

function apply() {
  frame = 0;
  const view = viewRef.value;
  const moonBox = moonBoxRef.value;
  const dusk = duskRef.value;
  if (!view || !moonBox || !dusk || !sceneH) return;
  if (!enabled) {
    if (last !== 0) {
      view.style.transform = moonBox.style.transform = dusk.style.opacity = '';
      last = 0;
    }
    return;
  }
  const s = Math.min(Math.max(window.scrollY - sceneTop, 0), sceneH);
  if (s === last) return;
  last = s;
  // eased in, so the first flick of the wheel moves nothing out of step with the deck
  const a = sceneH * 0.2;
  const run = s < a ? (s * s) / (2 * a) : s - a / 2;
  view.style.transform = `translate3d(0, ${(run * VIEW_LAG).toFixed(1)}px, 0)`;
  moonBox.style.transform = `translate3d(0, ${(run * MOON_SINK).toFixed(1)}px, 0)`;
  dusk.style.opacity = (Math.min(1, Math.max(0, (s - a) / (sceneH - a))) * DUSK).toFixed(3);
}

const schedule = () => {
  if (!frame) frame = requestAnimationFrame(apply);
};

onMounted(() => {
  wide = window.matchMedia('(min-width: 901px)');
  calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  measure();
  resizeObserver = new ResizeObserver(measure);
  if (rootRef.value) resizeObserver.observe(rootRef.value);
  window.addEventListener('scroll', schedule, {passive: true});
  wide.addEventListener('change', measure);
  calm.addEventListener('change', measure);
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  window.removeEventListener('scroll', schedule);
  wide?.removeEventListener('change', measure);
  calm?.removeEventListener('change', measure);
  if (frame) cancelAnimationFrame(frame);
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

/* The far scene: one composited layer, so the descent moves it without repainting it. */
.night__view {
  position: absolute;
  inset: 0;
  background: inherit;
  will-change: transform;
}

/* The night closing over the city on the way down (the page colour, so paper in the light theme). */
.night__dusk {
  position: absolute;
  inset: 0;
  background: var(--arc-bg);
  opacity: 0;
  will-change: opacity;
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
  will-change: transform;
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
  /* the page colour (dark: rgb(11, 11, 14)) at the scrim's strengths, so the light theme scrims with paper */
  --s: var(--arc-bg);
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--s) 90%, transparent) 0%, color-mix(in srgb, var(--s) 72%, transparent) 30%, color-mix(in srgb, var(--s) 20%, transparent) 52%, transparent 62%),
    linear-gradient(180deg, color-mix(in srgb, var(--s) 60%, transparent) 0%, transparent calc(var(--site-header-stack, 106px) + 60px)),
    linear-gradient(0deg, var(--s) 0%, color-mix(in srgb, var(--s) 85%, transparent) 9%, transparent 24%);
}

/*
 * The last of the city's light along the horizon: the roofline of the potion story climbs
 * out of the hero's bottom edge against it, so the dark room is a silhouette, not a seam.
 * Static (it scrolls with the hero), plain gradient. The light theme has its own paper sky.
 */
.night__horizon {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: calc(var(--roof-h, 120px) * 2.4);
  background: linear-gradient(0deg,
      color-mix(in oklab, var(--acc) 30%, #2b2a33) 0%,
      color-mix(in oklab, var(--acc) 16%, #1a1a20) 38%,
      transparent 100%);
}

:root[data-theme="parchment"] .night__horizon {
  display: none;
}

/* Stacked layout: the scene is a band behind the title and the deck. */
@media (max-width: 900px) {
  .night__scrim {
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--s) 78%, transparent) 0%, color-mix(in srgb, var(--s) 35%, transparent) calc(var(--site-header-stack, 106px) + 150px), transparent calc(var(--site-header-stack, 106px) + 230px)),
      linear-gradient(0deg, var(--s) 0%, color-mix(in srgb, var(--s) 80%, transparent) 12%, transparent 30%);
  }

  .night__city {
    -webkit-mask-image: none;
    mask-image: none;
  }
}

/*
 * Light theme: the same view at first light. A pale misty sky warming to rose around the
 * crimson moon, Backlund faded into the haze (plain opacity on the same images), the fog
 * banks reading as white mist across the moon, and paper instead of night under the copy.
 * Only colours and opacities change; every layer and animation is the dark one.
 */
:root[data-theme="parchment"] .night {
  background:
    radial-gradient(circle at var(--moon-x, 72%) var(--moon-y, 48%), rgba(214, 120, 120, .2) 0, transparent calc(var(--moon-r, 200px) * 3.4)),
    linear-gradient(180deg, #e3e1e2 0%, #ece8e4 46%, #efe6e2 72%, var(--arc-bg) 100%);
}

/* the night sky's far hills and cloud banks, as a faint wash on the paper */
:root[data-theme="parchment"] .night__sky {
  opacity: .1;
}

:root[data-theme="parchment"] .night__tint {
  background:
    radial-gradient(circle at var(--moon-x, 72%) var(--moon-y, 48%), rgba(179, 32, 43, .14) 0, transparent calc(var(--moon-r, 200px) * 2.6)),
    radial-gradient(circle at var(--moon-x, 72%) var(--moon-y, 48%), color-mix(in oklab, var(--acc) 12%, transparent) 0, transparent calc(var(--moon-r, 200px) * 4.2));
}

:root[data-theme="parchment"] .night__moon-glow {
  background: radial-gradient(circle,
      rgba(179, 32, 43, .26) 0%,
      rgba(179, 32, 43, .08) 30%,
      transparent 60%);
}

/* the castle sits back in the haze: a grey-blue silhouette rather than a black one */
:root[data-theme="parchment"] .night__city {
  opacity: .5;
}

:root[data-theme="parchment"] .night__moonlight {
  opacity: .3;
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
