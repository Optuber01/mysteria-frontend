<template>
  <!--
    Backlund by night: the sky, the crimson moon rising behind the castle, fog
    crossing its face, fog in the streets. Purely decorative. Placement comes
    from the hero, which measures where the deck's pivot is and sets
    --moon-x/--moon-y/--moon-r and --city-* (all px, relative to the hero box).
  -->
  <div
      ref="rootRef"
      class="night"
      :class="{
        'is-risen': risen && moonReady,
        'is-moon-set': body === 'sun' || body === 'dusk',
        'is-moon-hidden': body === 'hidden',
        'is-sun-up': body === 'sun' || body === 'dusk',
        'is-dusk': body === 'dusk',
        'is-sun-kept': scene.celestial === 'keep' && (body === 'sun' || body === 'dusk'),
        'is-stolen': stolen,
        'is-calm': fxCalm,
      }"
      :data-from="fromCelestial"
      :style="sceneVars"
      aria-hidden="true"
  >
    <!-- Everything that is far away: on the way down to the brewery it falls behind the page. -->
    <div ref="viewRef" class="night__view">
      <picture>
        <source media="(max-width: 720px)" :srcset="skySmall">
        <img class="night__sky" :src="sky" alt="" fetchpriority="high" decoding="async" width="1920" height="1080">
      </picture>
      <i class="night__tint"></i>
      <!-- daylight, whenever a sun is up (the Sun's own, or one a later card kept): the Pathway's sky tints it -->
      <i class="night__daylight"></i>
      <!-- the drawn Pathway's sky, crossfaded over the night -->
      <Transition v-bind="SKY_FADE">
        <i :key="sceneKey" class="night__grade" :style="{background: scene.sky}"></i>
      </Transition>
      <!-- a sun, for the Pathways that bring one: it rises where the moon sets -->
      <div class="night__sun">
        <div class="night__sun-rise">
          <i class="night__sun-glow"></i>
          <i class="night__sun-disc"></i>
        </div>
      </div>
      <Transition v-bind="SKY_FADE">
        <SceneWeather v-if="!scene.weatherFront && scene.weather && !lite && !fxCalm" :key="`${scene.weather}-${scene.weatherColor}`" class="night__weather" :kind="scene.weather" :color="scene.weatherColor" :density="scene.weatherDensity" :lightning="scene.lightning" @strike="strike"/>
      </Transition>

      <div ref="moonBoxRef" class="night__moon">
        <div class="night__moon-rise">
          <i class="night__moon-glow"></i>
          <i class="night__moon-corona"></i>
          <img ref="moonRef" class="night__moon-disc" :src="moon" alt="" decoding="async" width="640" height="640" @load="moonReady = true" @error="moonReady = true">
          <i class="night__moon-rim"></i>
        </div>
      </div>

      <!-- cloud banks rolling in over the sky, in front of the moon (the storm's, the smoke's) -->
      <div class="night__clouds" :style="{'--cloud': scene.clouds?.color ?? '#1a1a22'}">
        <i class="night__clouds-drift"></i>
        <i class="night__clouds-drift night__clouds-drift--near"></i>
      </div>
      <div class="night__fog night__fog--a"><i class="night__fog-drift"></i><i class="night__fog-tint"></i></div>
      <div class="night__fog night__fog--b"><i class="night__fog-drift"></i><i class="night__fog-tint"></i></div>

      <!-- the Pathway's signature moment: what plays behind the castle... -->
      <SceneSignature v-if="!fxCalm" :id="sceneKey" :from="fromCelestial" layer="back"/>
      <picture>
        <source media="(max-width: 720px)" :srcset="citySmall">
        <img class="night__city" :src="city" alt="" decoding="async" width="1920" height="1080">
      </picture>
      <i class="night__moonlight" :style="{'--city-mask': `url(${city})`}"></i>
      <!-- light theme: mist laid over the buildings themselves, so they stay solid in front of the moon -->
      <i class="night__haze" :style="{'--city-mask': `url(${city})`}"></i>
      <div class="night__fog night__fog--streets"><i class="night__fog-drift"></i><i class="night__fog-tint"></i></div>
      <Transition v-bind="SKY_FADE">
        <SceneWeather v-if="scene.weatherFront && scene.weather && !lite && !fxCalm" :key="`${scene.weather}-${scene.weatherColor}`" class="night__weather" :kind="scene.weather" :color="scene.weatherColor" :density="scene.weatherDensity" :lightning="scene.lightning" @strike="strike"/>
      </Transition>
      <!-- ...and what plays in front of it -->
      <SceneSignature v-if="!fxCalm" :id="sceneKey" :from="fromCelestial" layer="front"/>
      <!-- the Pathway's darkness over everything far away, and the flash when lightning splits the sky -->
      <i class="night__shade"></i>
      <i ref="flashRef" class="night__flash"></i>
    </div>
    <i ref="duskRef" class="night__dusk"></i>
    <i class="night__scrim"></i>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from 'vue';
import {useEffects} from './useEffects';
import SceneSignature from './SceneSignature.vue';
import SceneWeather from './SceneWeather.vue';
import {fade} from './fade';
import {sceneFor} from './pathwayScenes';
import {useArcana} from './useArcana';
import sky from './assets/moon/backlund-sky.webp';
import skySmall from './assets/moon/backlund-sky-960.webp';
import city from './assets/moon/backlund-skyline.webp';
import citySmall from './assets/moon/backlund-skyline-960.webp';
import moon from './assets/moon/crimson-moon.webp';

/* the sky's grade and weather crossfade on the compositor (fade.ts) */
const SKY_FADE = fade({duration: 900});

defineProps<{risen: boolean}>();

/* Light mode (the potion story decides it, see ProgressionStory): no weather over the hero either. */
const lite = ref(false);
onMounted(() => {
  try {
    lite.value = sessionStorage.getItem('mysterria-story-lite') === '1';
  } catch {
    // storage blocked: full scene
  }
});

/* The drawn Pathway's world: its sky, its light, its weather (see pathwayScenes.ts). */
const {currentId, hasDrawn} = useArcana();
const sceneKey = computed(() => (hasDrawn.value ? currentId.value : 'undrawn'));
const scene = computed(() => sceneFor(hasDrawn.value ? currentId.value : null));
const sceneVars = computed(() => ({
  '--city-light': scene.value.cityLight,
  '--fog-base': scene.value.fog,
  '--fog-amount': String(scene.value.fogAmount),
  '--shade': String(scene.value.shade ?? 0),
  // empty: the var falls back to nothing ("none" inside a filter list would void it)
  '--moon-filter': scene.value.moonFilter ?? '',
  '--moon-scale': String(scene.value.moonScale ?? 1),
  '--clouds': String(scene.value.clouds?.amount ?? 0),
}));

/*
 * The handover. A new card acts on the world as it is, not on a fresh night: the scene's
 * colours, fog, clouds and shade ease across (CSS transitions), the old weather and
 * signature fade out while the new ones come in (Transitions), and the new signature is
 * told what hung in the sky before it (`from`), so Error steals the sun if the sun was up,
 * the Emperor eclipses whatever is there, Tyrant's clouds swallow it. Error's theft is
 * done here, on the real moon and sun: both vanish at once and the new body comes back.
 */
type Body = 'moon' | 'sun' | 'dusk' | 'hidden';
/** 'keep' takes what is up (a sky lost in cloud gives the moon back). */
const resolveBody = (wanted: string, current: Body): Body => (wanted === 'keep' ? (current === 'hidden' ? 'moon' : current) : wanted as Body);
/** What actually hangs in the sky now. */
const body = ref<Body>(resolveBody(scene.value.celestial, 'moon'));
const fromCelestial = ref<string>(body.value);
const stolen = ref(false);
let stealTimer = 0;
watch(scene, (next) => {
  fromCelestial.value = body.value;
  body.value = resolveBody(next.celestial, body.value);
  if (sceneKey.value === 'error' && !fxCalm.value) {
    window.clearTimeout(stealTimer);
    stealTimer = window.setTimeout(() => {
      stolen.value = true;
      stealTimer = window.setTimeout(() => (stolen.value = false), 900);
    }, 350);
  }
});

/* Calm: the effects toned down site-wide (useEffects): no weather, no signature moments. */
const {calm: fxCalm} = useEffects();

/* lightning: the whole far scene flashes white-blue for a moment (opacity only) */
const flashRef = ref<HTMLElement | null>(null);
function strike() {
  flashRef.value?.animate([{opacity: 0}, {opacity: 0.55, offset: 0.08}, {opacity: 0.1, offset: 0.3}, {opacity: 0.4, offset: 0.4}, {opacity: 0}], {duration: 700, easing: 'ease-out'});
}

/* The moon only starts to rise once it is there to see. */
const moonRef = ref<HTMLImageElement | null>(null);
const moonReady = ref(false);
onMounted(() => {
  if (moonRef.value?.complete) moonReady.value = true;
});

/*
 * Leaving the hero is a descent: the far scene (sky, moon, castle) falls behind the page
 * and the camera closes in on the city while the night deepens over it. The scene runs on
 * under the potion story (its tail, below), whose see-through top deepens into the
 * brewery over it: the city sinks into the room in one picture. Transform and opacity
 * only, written straight to three elements once per frame; the hero box is measured on
 * resize, never per frame.
 */
const rootRef = ref<HTMLElement | null>(null);
const viewRef = ref<HTMLElement | null>(null);
const moonBoxRef = ref<HTMLElement | null>(null);
const duskRef = ref<HTMLElement | null>(null);
/** How much of the scroll the far scene and the moon give back (0 = scrolls with the page). */
const VIEW_LAG = 0.34;
const MOON_SINK = 0.24;
const DUSK = 0.5;
/** How far the camera closes in on the city by the time the hero has scrolled away. */
const ZOOM = 0.12;

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
  const near = s / sceneH;
  view.style.transform = `translate3d(0, ${(run * VIEW_LAG).toFixed(1)}px, 0) scale(${(1 + ZOOM * near * near).toFixed(4)})`;
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
  window.clearTimeout(stealTimer);
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
  --moon-tone: color-mix(in oklab, var(--city-light, var(--crimson)) 72%, var(--acc));
  --fog-tone: color-mix(in oklab, var(--acc) 26%, var(--fog-base, #d9d5de));
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
  /* the camera closes in on the castle's foot */
  transform-origin: var(--moon-x, 72%) calc(var(--moon-y, 48%) + var(--moon-r, 200px));
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
  transition: transform 1.8s cubic-bezier(.16, .84, .3, 1) .1s, opacity .9s ease .1s;
}

.is-risen .night__moon-rise {
  transform: scale(var(--moon-scale, 1));
  opacity: 1;
}

/* a Pathway with a sun of its own: the moon sets behind the castle */
.is-risen.is-moon-set .night__moon-rise {
  transform: translate3d(0, 70%, 0);
  opacity: 0;
  transition: transform 1.3s cubic-bezier(.5, 0, .7, .4), opacity .8s ease .4s;
}

/* lost behind cloud: it stays where it is and fades */
.is-risen.is-moon-hidden .night__moon-rise {
  opacity: 0;
  transition: opacity 1s ease .15s;
}

/*
 * Error: stolen. Whatever hangs in the sky is gone between one frame and the next, and
 * the new one comes back a little out of place and settles (the transition out of this
 * state is the return).
 */
.night.is-stolen .night__moon-rise,
.night.is-stolen .night__sun-rise {
  opacity: 0 !important;
  transition: none !important;
}

.night.is-stolen .night__moon,
.night.is-stolen .night__sun {
  translate: calc(var(--moon-r, 200px) * .5) calc(var(--moon-r, 200px) * -.08);
}

.night__moon,
.night__sun {
  transition: translate .5s steps(4, jump-end);
}

/* the scene's own changes to the disc (paler, darker, greyer) ease across with the rest */
.night__moon-disc {
  transition: filter .9s ease;
}

/* ---- the handover: the old weather and signature fade while the new ones come in ---- */
/* ---- the drawn Pathway's sky ---- */
.night__grade {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* daylight under the Pathway's sky while a sun is up: a kept sun keeps its day */
.night__daylight {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(143, 182, 224, .45) 0%, rgba(244, 198, 106, .45) 48%, rgba(255, 214, 150, .35) 100%);
  opacity: 0;
  transition: opacity .9s ease;
  pointer-events: none;
}

.is-sun-kept .night__daylight {
  opacity: 1;
}

.is-sun-kept.is-dusk .night__daylight {
  background: linear-gradient(180deg, rgba(58, 35, 71, .7) 0%, rgba(200, 100, 70, .4) 48%, rgba(255, 130, 72, .4) 100%);
}

/* ...and the Pathway's own sky is only a tint over it */
.is-sun-kept .night__grade {
  opacity: .45;
}

:root[data-theme="parchment"] .night__daylight {
  display: none;
}

/* ---- a sun where the moon was: rises from behind the castle (Sun), or sits on the horizon (twilight) ---- */
.night__sun {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px) * .8);
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * .8);
  width: calc(var(--moon-r, 200px) * 1.6);
  aspect-ratio: 1;
}

.night__sun-rise {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: translate3d(0, 90%, 0);
  transition: transform 1.6s cubic-bezier(.16, .84, .3, 1) .3s, opacity .8s ease .3s;
}

.is-sun-up .night__sun-rise {
  opacity: 1;
  transform: none;
}

/* twilight: it never clears the rooftops */
.is-sun-up.is-dusk .night__sun-rise {
  transform: translate3d(0, 46%, 0);
}

.night__sun-glow {
  position: absolute;
  inset: -110%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 214, 120, .55) 0%, rgba(255, 170, 70, .22) 24%, rgba(255, 140, 60, .08) 44%, transparent 64%);
}

.is-dusk .night__sun-glow {
  background: radial-gradient(circle, rgba(255, 150, 80, .6) 0%, rgba(230, 90, 60, .25) 26%, rgba(150, 60, 120, .1) 46%, transparent 66%);
}

.night__sun-disc {
  position: absolute;
  inset: 0;
  /* a kept sun takes the scene's treatment, as the moon does (pale, dark, sickly...) */
  filter: var(--moon-filter, );
  transition: filter .9s ease;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 50%, #fffbe6 0%, #ffeaa0 38%, #ffc95a 62%, #ff9f3a 100%);
  box-shadow: 0 0 calc(var(--moon-r, 200px) * .5) rgba(255, 200, 100, .7);
}

.is-dusk .night__sun-disc {
  background: radial-gradient(circle at 50% 50%, #ffe2a8 0%, #ffb065 45%, #f2703e 100%);
}

.night__weather {
  z-index: 0;
}

/* ---- cloud banks: the fog texture, darkened to the scene's cloud colour, over the top of the sky ---- */
.night__clouds {
  position: absolute;
  /* (opacity eases with the scene) */
  inset: 0 0 auto;
  height: 70%;
  overflow: hidden;
  opacity: var(--clouds, 0);
  transition: opacity 1s ease;
  -webkit-mask-image: linear-gradient(180deg, #000 40%, transparent);
  mask-image: linear-gradient(180deg, #000 40%, transparent);
}

.night__clouds-drift {
  position: absolute;
  inset: -10% auto 20% 0;
  width: 200%;
  background:
    linear-gradient(var(--cloud), var(--cloud)),
    url('./assets/moon/fog-bank.webp') repeat-x 0 0 / 50% 100%;
  background-blend-mode: multiply;
  -webkit-mask: url('./assets/moon/fog-bank.webp') repeat-x 0 0 / 50% 100%;
  mask: url('./assets/moon/fog-bank.webp') repeat-x 0 0 / 50% 100%;
  mask-mode: luminance;
  -webkit-mask-mode: luminance;
  animation: night-drift 60s linear infinite;
  opacity: .95;
}

.night__clouds-drift--near {
  inset: 10% auto 0 0;
  animation-duration: 38s;
  animation-direction: reverse;
  opacity: .8;
}

/*
 * Paper: the Pathway's sky is a tint over the morning haze, never a dark sky; its shade
 * (Darkness, Death) a light dimming, not a dark grey half of the page.
 */
:root[data-theme="parchment"] .night__grade {
  opacity: .35;
}

:root[data-theme="parchment"] .night__shade {
  background: #6a6672;
  opacity: calc(var(--shade, 0) * .35);
}

/* ---- the Pathway's shade over the far scene, and lightning ---- */
.night__shade {
  position: absolute;
  inset: 0;
  background: #04040a;
  opacity: var(--shade, 0);
  transition: opacity .9s ease;
  pointer-events: none;
}

.night__flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(120% 90% at 70% 0%, rgba(210, 228, 255, .9), rgba(160, 190, 255, .35) 50%, transparent 80%);
  opacity: 0;
  mix-blend-mode: screen;
  pointer-events: none;
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
  filter: saturate(1.08) brightness(.96) var(--moon-filter, );
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
  background-color: var(--fog-tone);
  mix-blend-mode: multiply;
  transition: background-color .9s ease;
}

/* Two bands cross the moon's face at different speeds. */
.night__fog--a {
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * .2);
  height: calc(var(--moon-r, 200px) * .62);
  opacity: calc(.42 * var(--fog-amount, 1));
  transition: opacity .9s ease;
}

.night__fog--b {
  top: calc(var(--moon-y, 48%) + var(--moon-r, 200px) * .34);
  height: calc(var(--moon-r, 200px) * .8);
  opacity: calc(.36 * var(--fog-amount, 1));
  transition: opacity .9s ease;
}

.night__fog--b .night__fog-drift {
  animation-duration: 140s;
  animation-direction: reverse;
}

.night__fog--streets {
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .3);
  height: calc(var(--city-h, 600px) * .3);
  opacity: calc(.34 * var(--fog-amount, 1));
  transition: opacity .9s ease;
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

/*
 * The castle sits back in the haze, but stays solid: the moon is behind it, so the
 * buildings must hide it, not let it show through. The mist is a paper-coloured layer cut
 * to the buildings' own shape (.night__haze), not transparency on the buildings.
 */
.night__haze {
  display: none;
}

:root[data-theme="parchment"] .night__haze {
  display: block;
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
  background: linear-gradient(180deg, color-mix(in srgb, var(--arc-bg) 46%, transparent) 0%, color-mix(in srgb, var(--arc-bg) 62%, transparent) 60%, var(--arc-bg) 100%);
  -webkit-mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  pointer-events: none;
}

:root[data-theme="parchment"] .night__moonlight {
  opacity: .3;
}

/*
 * ...and its foot is lost in the morning fog, so the line under the deck (what you drew,
 * the draw button, the hint) sits on plain haze across the whole width, with no patch of
 * paper of its own behind it. Side by side: the city box is the deck's, so this lines up.
 */
@media (min-width: 901px) {
  :root[data-theme="parchment"] .night__city {
    -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 22%), linear-gradient(180deg, #000 50%, rgba(0, 0, 0, .35) 64%, transparent 76%);
    -webkit-mask-composite: source-in;
    mask-image: linear-gradient(90deg, transparent 0, #000 22%), linear-gradient(180deg, #000 50%, rgba(0, 0, 0, .35) 64%, transparent 76%);
    mask-composite: intersect;
  }

  :root[data-theme="parchment"] .night__moonlight {
    -webkit-mask: var(--city-mask) 0 0 / 100% 100% no-repeat, linear-gradient(180deg, #000 50%, transparent 72%);
    -webkit-mask-composite: source-in;
    mask: var(--city-mask) 0 0 / 100% 100% no-repeat, linear-gradient(180deg, #000 50%, transparent 72%);
    mask-composite: intersect;
  }
}

/*
 * Under the pinned potion story the night runs on below the hero (--night-tail): the
 * streets go on down instead of fading to the page colour, and the story's see-through
 * top deepens into the room over them (ProgressionStory --room-in). The sky photo and
 * the scrims keep the hero's own box, so the hero itself looks as it did.
 */
@media (min-width: 901px) and (min-height: 591px) and (prefers-reduced-motion: no-preference) {
  .night {
    /* as far as the story's see-through top reaches (ProgressionStory --room-in); below it the room is opaque */
    --night-tail: clamp(300px, 46vh, 520px);
    height: calc(var(--scene-h, 100svh) + var(--night-tail));
    background-color: #0d0d11;
  }

  .night__sky {
    height: var(--scene-h, 100%);
    -webkit-mask-image: linear-gradient(180deg, #000 62%, transparent);
    mask-image: linear-gradient(180deg, #000 62%, transparent);
  }

  /* the city's foot dissolves into the night below it, never a cut */
  .night__city {
    -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 22%), linear-gradient(180deg, #000 74%, transparent);
    -webkit-mask-composite: source-in;
    mask-image: linear-gradient(90deg, transparent 0, #000 22%), linear-gradient(180deg, #000 74%, transparent);
    mask-composite: intersect;
  }

  /* the copy column (down the tail too) and the header only: nothing closes the bottom off */
  .night__scrim {
    background:
      linear-gradient(90deg, color-mix(in srgb, var(--s) 90%, transparent) 0%, color-mix(in srgb, var(--s) 72%, transparent) 30%, color-mix(in srgb, var(--s) 20%, transparent) 52%, transparent 62%),
      linear-gradient(180deg, color-mix(in srgb, var(--s) 60%, transparent) 0%, transparent calc(var(--site-header-stack, 106px) + 60px));
  }

  /* first light: the paper sky keeps the hero's box; below it, plain paper */
  :root[data-theme="parchment"] .night {
    --night-tail: clamp(170px, 24vh, 240px);
    background-color: var(--arc-bg);
    background-repeat: no-repeat;
    background-size: 100% var(--scene-h, 100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .night__fog-drift,
  .night__clouds-drift {
    animation: none;
  }

  .night__moon-rise {
    transform: none;
    opacity: 1;
    transition: none;
  }
}
</style>
