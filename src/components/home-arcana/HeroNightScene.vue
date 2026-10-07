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
        'is-sun-up': body === 'sun' || body === 'dusk',
        'is-dusk': body === 'dusk',
        'is-moon-hidden': body === 'hidden',
        'is-stolen': theft === 'gone',
        'is-put-back': theft === 'back',
      }"
      :style="sceneVars"
      aria-hidden="true"
  >
    <!-- Everything that is far away: on the way down to the brewery it falls behind the page. -->
    <div ref="viewRef" class="night__view">
      <picture>
        <source media="(max-width: 720px)" :srcset="skySmall">
        <!-- async for the first paint, then sync (see `decoding` below) -->
        <img ref="skyRef" class="night__sky" :src="sky" alt="" fetchpriority="high" :decoding="decoding" width="1920" height="1080">
      </picture>
      <!-- the card's tints: keyed copies holding their own accent, so a recolour crossfades them -->
      <Transition name="arc-tint">
        <i :key="accent" class="night__tint" :style="{'--acc': accent}"></i>
      </Transition>
      <!-- daylight, while a sun is up (the Sun's own, or one a later card kept) -->
      <i class="night__daylight"></i>
      <!-- the drawn Pathway's own tint over the sky, crossfaded from the last one's -->
      <Transition v-bind="GRADE_FADE">
        <i v-if="scene" :key="effectId" class="night__grade" :style="{'--grade': scene.grade, '--grade-light': scene.gradeLight}"></i>
      </Transition>

      <div ref="moonBoxRef" class="night__moon">
        <!-- a sun where the moon was: it rises from behind the castle (Sun), or sits on the horizon (Twilight Giant) -->
        <div class="night__sun">
          <div class="night__sun-rise">
            <i class="night__sun-glow"></i>
            <i class="night__sun-disc"></i>
          </div>
        </div>
        <div class="night__moon-rise">
          <i class="night__moon-glow"></i>
          <Transition name="arc-tint">
            <i :key="accent" class="night__moon-corona" :style="{'--acc': accent}"></i>
          </Transition>
          <img ref="moonRef" class="night__moon-disc" :src="moon" alt="" :decoding="decoding" width="640" height="640" @load="moonReady = true" @error="moonReady = true">
          <Transition name="arc-tint">
            <i :key="accent" class="night__moon-rim" :style="{'--acc': accent}"></i>
          </Transition>
        </div>
      </div>

      <div class="night__fog night__fog--a"><i class="night__fog-drift"></i><i class="night__fog-tint"></i></div>
      <div class="night__fog night__fog--b"><i class="night__fog-drift"></i><i class="night__fog-tint"></i></div>

      <!-- the drawn Pathway's effect: what plays behind the castle... -->
      <SkyEffect :id="shownEffect" layer="back" :body="body" :from="from"/>

      <picture>
        <source media="(max-width: 720px)" :srcset="citySmall">
        <img ref="cityRef" class="night__city" :src="city" alt="" :decoding="decoding" width="1920" height="1080">
      </picture>
      <i class="night__moonlight" :style="{'--city-mask': `url(${city})`}"></i>
      <!-- light theme: mist laid over the buildings themselves, so they stay solid in front of the moon -->
      <i class="night__haze" :style="{'--city-mask': `url(${city})`}"></i>
      <div class="night__fog night__fog--streets"><i class="night__fog-drift"></i><i class="night__fog-tint"></i></div>
      <!-- ...and what plays in front of it -->
      <SkyEffect :id="shownEffect" layer="front" :body="body" :from="from"/>
      <!-- the Pathway's dark over everything far away (Darkness, Tyrant, Chained) -->
      <i class="night__shade"></i>
    </div>
    <i ref="duskRef" class="night__dusk"></i>
    <i class="night__scrim"></i>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from 'vue';
import {useArcana} from './useArcana';
import SkyEffect from './sky/SkyEffect.vue';
import {fade} from './sky/fade';
import {prefetchEffects} from './sky/effectLoader';
import {markHeroImagesIn} from './progression/prewarm';
import {type Body, isSkyEffect, nextBody, skySceneFor} from './sky/skyScenes';
import sky from './assets/moon/backlund-sky.webp';
import skySmall from './assets/moon/backlund-sky-960.webp';
import city from './assets/moon/backlund-skyline.webp';
import citySmall from './assets/moon/backlund-skyline-960.webp';
import moon from './assets/moon/crimson-moon.webp';

defineProps<{risen: boolean}>();

const {card, currentId, hasDrawn} = useArcana();
const accent = computed(() => card.value.accent);

/*
 * The sky (sky/skyScenes.ts). What hangs over the city stays from card to card and only
 * changes when a card claims it; the card's own tint and effect leave with it. The body's
 * moves are CSS transitions on two boxes (the moon sets as the sun rises, behind the
 * castle), the tint a crossfade, the effect a fade out under the new one: transform and
 * opacity, on the compositor.
 */
const GRADE_FADE = fade(900);
const drawnId = computed(() => (hasDrawn.value ? currentId.value : ''));
const effectId = computed(() => (isSkyEffect(drawnId.value) ? drawnId.value : ''));
const scene = computed(() => skySceneFor(effectId.value));
/*
 * Light mode (the potion story turns it on for machines that can't keep up, see
 * ProgressionStory): the sky still changes, but the effects stay off. The story can turn it
 * on after this has mounted (software rendering is found once the story mounts, a slow room
 * while it is scrolled), so it is read again on every draw.
 */
const lite = ref(false);
function readLite() {
  try {
    lite.value = sessionStorage.getItem('mysterria-story-lite') === '1';
  } catch {
    // storage blocked: the full sky
  }
}
onMounted(readLite);
const shownEffect = computed(() => (lite.value ? '' : effectId.value));
/** What hangs in the sky now, what hung there before this card, and what the Tyrant's cloud is covering. */
const body = ref<Body>(nextBody(scene.value?.claim ?? null, 'moon', 'moon'));
const from = ref<Body>(body.value);
let underCloud: Body = 'moon';
watch(drawnId, (id) => {
  readLite();
  from.value = body.value;
  if (body.value !== 'hidden') underCloud = body.value;
  body.value = nextBody(skySceneFor(id)?.claim ?? null, body.value, underCloud);
  // a new card ends a theft still under way (Error's own draw starts a fresh one)
  clearTimeout(stealTimer);
  theft.value = '';
  if (id === 'error') steal();
});
const sceneVars = computed(() => ({
  // empty: the var falls back to nothing ("none" in a filter list would void it)
  '--moon-filter': scene.value?.moonFilter ?? '',
  '--moon-scale': String(scene.value?.moonScale ?? 1),
  '--shade': String(scene.value?.shade ?? 0),
}));

/*
 * Error: whatever hangs in the sky is gone between one frame and the next ('gone'), is back
 * as suddenly but a little out of place ('back'), and then jumps into place.
 */
const theft = ref<'' | 'gone' | 'back'>('');
let stealTimer = 0;
function steal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  clearTimeout(stealTimer);
  stealTimer = window.setTimeout(() => {
    theft.value = 'gone';
    stealTimer = window.setTimeout(() => {
      theft.value = 'back';
      stealTimer = window.setTimeout(() => (theft.value = ''), 380);
    }, 900);
  }, 450);
}

/* The moon only starts to rise once it is there to see. */
const moonRef = ref<HTMLImageElement | null>(null);
const moonReady = ref(false);
onMounted(() => {
  if (moonRef.value?.complete) moonReady.value = true;
});

/*
 * Decoding. The first paint must not wait for the sky, the moon and the city to decode
 * (sync held the whole first frame back by about 0.7 s), so they start async. Once they
 * have decoded they turn sync: Chrome frees decoded images while the tab is hidden, and
 * async ones were then drawn missing for a few frames on the way back, the scene flickering
 * in. Leaving the tab before that turns them sync too, so no return is ever async.
 */
const decoding = ref<'async' | 'sync'>('async');
const skyRef = ref<HTMLImageElement | null>(null);
const cityRef = ref<HTMLImageElement | null>(null);
function decoded() {
  decoding.value = 'sync';
  document.removeEventListener('visibilitychange', onHide);
}
function onHide() {
  if (document.visibilityState === 'hidden') decoded();
}
onMounted(() => {
  document.addEventListener('visibilitychange', onHide);
  const images = [skyRef.value, moonRef.value, cityRef.value].filter((img): img is HTMLImageElement => !!img);
  void Promise.all(images.map(img => img.decode().catch(() => undefined))).then(() => {
    decoded();
    // the first screen is complete: the story below may fetch its own (progression/prewarm.ts)
    markHeroImagesIn();
  });
});
onUnmounted(() => document.removeEventListener('visibilitychange', onHide));

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
      for (const anchor of anchors) anchor.style.transform = '';
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
  for (const anchor of anchors) anchor.style.transform = moonBox.style.transform;
  dusk.style.opacity = (Math.min(1, Math.max(0, (s - a) / (sceneH - a))) * DUSK).toFixed(3);
}

/*
 * Effects mark the boxes that hang on the moon (.sky-anchor): they get the moon's scroll
 * transform with it. The list is refreshed when an effect comes or goes, never per frame.
 */
let anchors: HTMLElement[] = [];
let anchorWatch: MutationObserver | null = null;
let stopPrefetch: (() => void) | null = null;
function refreshAnchors() {
  anchors = [...(viewRef.value?.querySelectorAll<HTMLElement>('.sky-anchor') ?? [])];
  const t = moonBoxRef.value?.style.transform ?? '';
  for (const anchor of anchors) anchor.style.transform = t;
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
  if (viewRef.value) {
    anchorWatch = new MutationObserver(refreshAnchors);
    anchorWatch.observe(viewRef.value, {childList: true, subtree: true});
  }
  stopPrefetch = prefetchEffects();
  wide.addEventListener('change', measure);
  calm.addEventListener('change', measure);
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  anchorWatch?.disconnect();
  stopPrefetch?.();
  clearTimeout(stealTimer);
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
  transition: transform 2.6s cubic-bezier(.16, .84, .3, 1) .1s, opacity 1.2s ease .1s, translate .5s steps(4, jump-end);
}

.is-risen .night__moon-rise {
  transform: scale(var(--moon-scale, 1));
  opacity: 1;
}

/* a card with a sun of its own: the moon sets behind the castle as the sun comes up */
.is-risen.is-sun-up .night__moon-rise {
  transform: translate3d(0, 70%, 0);
  opacity: 0;
  transition: transform 1.3s cubic-bezier(.5, 0, .7, .4), opacity .8s ease .4s, translate .5s steps(4, jump-end);
}

/* lost behind the storm: it stays where it is and fades */
.is-risen.is-moon-hidden .night__moon-rise {
  opacity: 0;
  transition: opacity 1s ease .15s, translate .5s steps(4, jump-end);
}

/*
 * Error: stolen. Whatever hangs in the sky is gone between one frame and the next, is back
 * as suddenly but a little out of place, then settles in four jumps (the translate
 * transitions, on the way out of is-put-back).
 */
.night.is-stolen .night__moon-rise,
.night.is-stolen .night__sun-rise {
  opacity: 0 !important;
  transition: none !important;
}

.night.is-put-back .night__moon-rise,
.night.is-put-back .night__sun-rise,
.night.is-put-back .night__sun {
  transition: none !important;
}

.night__moon-rise,
.night__sun {
  translate: 0 0;
}

.night.is-stolen .night__moon-rise,
.night.is-stolen .night__sun,
.night.is-put-back .night__moon-rise,
.night.is-put-back .night__sun {
  translate: calc(var(--moon-r, 200px) * .3) calc(var(--moon-r, 200px) * -.06);
}

.night__sun {
  transition: translate .5s steps(4, jump-end);
}

/* ---- a sun where the moon was: it rises from behind the castle, or sits on the horizon ---- */
.night__sun {
  position: absolute;
  inset: 10%;
}

.night__sun-rise {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: translate3d(0, 90%, 0);
  transition: transform 1.6s cubic-bezier(.16, .84, .3, 1) .3s, opacity .8s ease .3s;
}

.is-risen.is-sun-up .night__sun-rise {
  opacity: 1;
  transform: none;
}

/* the Twilight Giant's: it never clears the rooftops */
.is-risen.is-sun-up.is-dusk .night__sun-rise {
  transform: translate3d(0, 46%, 0);
}

.night__sun-glow {
  position: absolute;
  inset: -110%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 200, 110, .5) 0%, rgba(255, 160, 70, .2) 24%, rgba(255, 130, 60, .07) 44%, transparent 64%);
}

.is-dusk .night__sun-glow {
  background: radial-gradient(circle, rgba(255, 150, 80, .55) 0%, rgba(230, 90, 60, .24) 26%, rgba(150, 60, 120, .1) 46%, transparent 66%);
}

.night__sun-disc {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  /* a low sun: deep gold, not white noon */
  background: radial-gradient(circle at 50% 50%, #fff1c4 0%, #ffd77e 36%, #ffb24a 64%, #f08a34 100%);
  box-shadow: 0 0 calc(var(--moon-r, 200px) * .45) rgba(255, 180, 90, .6);
}

.is-dusk .night__sun-disc {
  background: radial-gradient(circle at 50% 50%, #ffd9a0 0%, #ffa25c 45%, #e2603a 100%);
}

/* ---- daylight, while a sun is up: a late, low light (the night photo still shows through) ---- */
.night__daylight {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(92, 104, 140, .42) 0%, rgba(205, 152, 86, .36) 52%, rgba(232, 168, 96, .3) 100%);
  opacity: 0;
  transition: opacity 1.2s ease .2s;
  pointer-events: none;
}

.is-sun-up .night__daylight {
  opacity: 1;
}

.is-sun-up.is-dusk .night__daylight {
  background: linear-gradient(180deg, rgba(58, 35, 71, .62) 0%, rgba(176, 88, 66, .36) 52%, rgba(232, 124, 72, .34) 100%);
}

/* ---- the drawn Pathway's own tint over the sky (dark theme, or on paper below) ---- */
.night__grade {
  position: absolute;
  inset: 0;
  background: var(--grade);
  pointer-events: none;
}

/* ---- the Pathway's dark over everything far away ---- */
.night__shade {
  position: absolute;
  inset: 0;
  background: #04040a;
  opacity: var(--shade, 0);
  transition: opacity .9s ease;
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
  /* the drawn card's hold on the moon (darker, colder, swollen...) eases across */
  filter: saturate(1.08) brightness(.96) var(--moon-filter, );
  transition: filter .9s ease;
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
  transition: opacity 1.2s ease;
}

/* the moon has set, or is lost in the storm: its light leaves the stone */
.is-sun-up .night__moonlight,
.is-moon-hidden .night__moonlight {
  opacity: .12;
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
/*
 * Paper: the sky is a morning haze, so a card's tint is a light wash over it, its shade a
 * light dimming, and a sun a warm glow in the haze rather than a darker sky.
 */
:root[data-theme="parchment"] .night__grade {
  background: var(--grade-light);
}

:root[data-theme="parchment"] .night__shade {
  background: #5d5966;
  opacity: calc(var(--shade, 0) * .3);
}

:root[data-theme="parchment"] .night__daylight {
  background: radial-gradient(90% 70% at var(--moon-x, 72%) var(--moon-y, 48%), rgba(255, 214, 140, .34), rgba(255, 224, 170, .14) 55%, transparent 80%);
}

:root[data-theme="parchment"] .is-sun-up.is-dusk .night__daylight {
  background: radial-gradient(90% 70% at var(--moon-x, 72%) var(--moon-y, 48%), rgba(240, 150, 110, .3), rgba(190, 140, 190, .12) 55%, transparent 80%);
}

:root[data-theme="parchment"] .night__sun-glow {
  opacity: .8;
}

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

:root[data-theme="parchment"] .is-sun-up .night__moonlight,
:root[data-theme="parchment"] .is-moon-hidden .night__moonlight {
  opacity: .08;
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
