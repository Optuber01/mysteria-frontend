<template>
  <section
      ref="heroRef"
      class="hero"
      :class="{ 'is-ready': isReady, 'is-lens-on': lensOn }"
      :style="heroStyle"
      aria-labelledby="home-title"
      @pointermove="onPointerMove"
      @pointerleave="onPointerLeave"
  >
    <!-- Spirit Vision: the scene sits under the fog; the lens shows it as it is. -->
    <div ref="stageRef" class="hero-stage" aria-hidden="true">
      <div class="hero-layer hero-layer--fogged">
        <img
            v-for="(slide, index) in visibleSlides"
            :key="slide.id"
            class="hero-scene"
            :class="{ 'is-active': index === activeSlide }"
            :src="slide.src"
            :style="{ objectPosition: slide.position }"
            alt=""
            :fetchpriority="index === 0 ? 'high' : 'low'"
            decoding="async"
        >
      </div>
      <div class="hero-fog hero-fog--far"></div>
      <div class="hero-fog hero-fog--near"></div>
      <div class="hero-layer hero-layer--clear">
        <img
            v-for="(slide, index) in visibleSlides"
            :key="slide.id"
            class="hero-scene"
            :class="{ 'is-active': index === activeSlide }"
            :src="slide.src"
            :style="{ objectPosition: slide.position }"
            alt=""
            decoding="async"
        >
      </div>
      <div class="hero-lens"><span>{{ t('home.hero.lensLabel') }}</span></div>
      <div class="hero-scrim"></div>
    </div>

    <div ref="contentRef" class="hero-content">
      <p class="fog-label">{{ eyebrow }}</p>
      <h1 id="home-title" class="hero-title">
        <span>{{ t('home.hero.headlineLead') }}</span>
        <span class="hero-title__accent">{{ t('home.hero.headlineAccent') }}</span>
      </h1>
      <p class="hero-summary">{{ t('home.hero.summary') }}</p>

      <div class="hero-actions">
        <RouterLink class="fog-button" :to="$lp('/guide/connect')">
          {{ t('home.hero.primaryCta') }}
          <span aria-hidden="true">→</span>
        </RouterLink>
        <a class="fog-button fog-button--ghost" href="#pathways">{{ t('homePage.heroSecondaryCta') }}</a>
      </div>

      <div class="hero-address" :class="`is-${copyState}`">
        <span class="hero-address__dot" :class="`is-${status.state}`" aria-hidden="true"></span>
        <span class="hero-address__label">{{ t(COPY_LABEL_KEYS[copyState]) }}</span>
        <strong ref="addressRef" class="hero-address__value">{{ SERVER_IP }}</strong>
        <button
            type="button"
            class="hero-address__copy"
            :aria-label="copyState === 'copied' ? t('home.hero.copiedAria') : t('home.hero.copyAria')"
            @click="copyAddress"
        >
          <svg v-if="copyState === 'copied'" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7"/></svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15V6a1 1 0 0 1 1-1h9"/></svg>
        </button>
        <span class="visually-hidden" aria-live="polite">{{ copyAnnouncement }}</span>
      </div>
    </div>

    <nav class="hero-scenes" :aria-label="t('home.hero.scenesAria')" @focusin="paused = true" @focusout="paused = false"
         @pointerenter="paused = true" @pointerleave="paused = false">
      <p class="hero-hint" aria-hidden="true">{{ t(isCoarse ? 'home.hero.lensHintTouch' : 'home.hero.lensHint') }}</p>
      <ol>
        <li v-for="(slide, index) in HOME_HERO_SLIDES" :key="slide.id">
          <button
              type="button"
              class="hero-scene-tab"
              :class="{ 'is-active': index === activeSlide }"
              :aria-current="index === activeSlide ? 'true' : undefined"
              @click="selectSlide(index)"
          >
            <span class="hero-scene-tab__num" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="hero-scene-tab__text">
              <strong>{{ t(`home.hero.scenes.${slide.id}.label`) }}</strong>
              <small>{{ t(`home.hero.scenes.${slide.id}.place`) }}</small>
            </span>
            <i class="hero-scene-tab__bar" aria-hidden="true"></i>
          </button>
        </li>
      </ol>
    </nav>

    <RouterLink class="hero-changelog" :to="$lp(latestSlug ? `/news/${latestSlug}` : '/news')">
      {{ t('home.hero.latestChangelog') }} <span aria-hidden="true">↗</span>
    </RouterLink>
  </section>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, type CSSProperties} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {useReducedMotion} from '@/composables/useReducedMotion';
import {HOME_HERO_SLIDES} from '@/data/homeHeroSlides';
import {SERVER_IP} from '@/composables/useServer';
import type {ServerStatus} from '@/composables/useSharedServerStatus';

/* `status` only drives the address dot; the player count lives in the header chip. */
defineProps<{ status: ServerStatus; latestSlug?: string | null }>();

const SCENE_MS = 9000;
/* Hands the lens back to its idle drift this long after the pointer stops. */
const IDLE_AFTER_MS = 2600;
/* Same confirmation window as the header chip (useCopyIp). Failure stays up
   longer: it asks the reader to do something. */
const COPIED_MS = 1800;
const FAILED_MS = 4000;
type CopyState = 'idle' | 'copied' | 'failed';
const COPY_LABEL_KEYS: Record<CopyState, string> = {
  idle: 'home.hero.addressLabel',
  copied: 'home.hero.copied',
  failed: 'home.hero.copyFailed',
};

const {t} = useI18n();
const reducedMotion = useReducedMotion();
const heroRef = ref<HTMLElement | null>(null);
const stageRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const addressRef = ref<HTMLElement | null>(null);
const activeSlide = ref(0);
const scenesLoaded = ref(false);
const isReady = ref(false);
const lensOn = ref(false);
const paused = ref(false);
const isCoarse = ref(false);
const copyState = ref<CopyState>('idle');

/* Lens position in px within the stage, eased toward its target each frame.
   The stage is the whole hero on desktop and a band above the copy on phones. */
const lens = {x: 0, y: 0, tx: 0, ty: 0};
const lensX = ref(0);
const lensY = ref(0);
const sceneProgress = ref(0);
let lastPointerAt = 0;
let sceneElapsed = 0;
let frame = 0;
let lastFrameAt = 0;
let inView = true;
let observer: IntersectionObserver | null = null;
let copyTimer: ReturnType<typeof setTimeout> | null = null;
let loadTimer: ReturnType<typeof setTimeout> | null = null;

/* Only the first capture loads with the page; the rest follow once it has settled. */
const visibleSlides = computed(() => (scenesLoaded.value ? HOME_HERO_SLIDES : HOME_HERO_SLIDES.slice(0, 1)));

const heroStyle = computed<CSSProperties & Record<`--${string}`, string>>(() => ({
  '--lx': `${lensX.value.toFixed(1)}px`,
  '--ly': `${lensY.value.toFixed(1)}px`,
  '--scene-progress': sceneProgress.value.toFixed(4),
}));

/* Upstream's translated eyebrow is split around the brand name for styling. */
const eyebrow = computed(() =>
    [t('homePage.heroEyebrowBefore'), t('homePage.heroEyebrowBrand'), t('homePage.heroEyebrowAfter')]
        .filter(Boolean)
        .join(' '),
);

const copyAnnouncement = computed(() => {
  if (copyState.value === 'copied') return t('home.hero.copiedAnnouncement');
  if (copyState.value === 'failed') return t('home.hero.copyFailedAnnouncement');
  return '';
});

function focusPoint() {
  const stage = stageRef.value;
  const focus = HOME_HERO_SLIDES[activeSlide.value].focus;
  if (!stage) return {x: 0, y: 0};
  // On the narrow band the subject sits centred, whatever the desktop framing.
  const narrow = stage.clientHeight < (heroRef.value?.clientHeight ?? 0) * .8;
  if (narrow) return {x: stage.clientWidth * .5, y: stage.clientHeight * .55};
  // On desktop the idle lens rests right of the copy, so it never sits behind the headline.
  const copyRight = (contentRef.value?.getBoundingClientRect().right ?? 0) - stage.getBoundingClientRect().left;
  const lensRadius = stage.clientWidth * .12;
  return {
    x: Math.max(stage.clientWidth * focus.x / 100, copyRight + lensRadius),
    y: stage.clientHeight * focus.y / 100,
  };
}

function onPointerMove(event: PointerEvent) {
  const stage = stageRef.value;
  if (!stage || reducedMotion.value) return;
  const bounds = stage.getBoundingClientRect();
  lens.tx = event.clientX - bounds.left;
  lens.ty = event.clientY - bounds.top;
  lastPointerAt = performance.now();
  lensOn.value = true;
}

function onPointerLeave() {
  lastPointerAt = 0;
}

function selectSlide(index: number) {
  activeSlide.value = index;
  sceneElapsed = 0;
  sceneProgress.value = 0;
  if (reducedMotion.value) placeLensAtFocus();
}

function placeLensAtFocus() {
  const point = focusPoint();
  lens.x = lens.tx = point.x;
  lens.y = lens.ty = point.y;
  lensX.value = point.x;
  lensY.value = point.y;
}

function tick(now: number) {
  frame = 0;
  const dt = lastFrameAt ? Math.min(now - lastFrameAt, 64) : 16;
  lastFrameAt = now;

  // With no pointer steering it, the lens wanders slowly around the scene's subject.
  if (!lastPointerAt || now - lastPointerAt > IDLE_AFTER_MS) {
    const stage = stageRef.value;
    const point = focusPoint();
    const reach = stage ? Math.min(stage.clientWidth, stage.clientHeight) * .16 : 0;
    lens.tx = point.x + Math.abs(Math.cos(now / 3100)) * reach;
    lens.ty = point.y + Math.sin(now / 2300) * reach * .6;
    lensOn.value = true;
  }

  const ease = 1 - Math.pow(.0009, dt / 1000);
  lens.x += (lens.tx - lens.x) * ease;
  lens.y += (lens.ty - lens.y) * ease;
  lensX.value = lens.x;
  lensY.value = lens.y;

  if (!paused.value && document.visibilityState === 'visible') {
    sceneElapsed += dt;
    if (sceneElapsed >= SCENE_MS) {
      sceneElapsed = 0;
      activeSlide.value = (activeSlide.value + 1) % HOME_HERO_SLIDES.length;
    }
    sceneProgress.value = sceneElapsed / SCENE_MS;
  }

  schedule();
}

function schedule() {
  if (!frame && inView && !reducedMotion.value) frame = requestAnimationFrame(tick);
}

/** Leaves the address selected so a blocked clipboard is one keystroke from done. */
function selectAddress() {
  const node = addressRef.value;
  const selection = window.getSelection();
  if (!node || !selection) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  selection.removeAllRanges();
  selection.addRange(range);
}

async function copyAddress() {
  try {
    await navigator.clipboard.writeText(SERVER_IP);
    copyState.value = 'copied';
  } catch {
    copyState.value = 'failed';
    selectAddress();
  }
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => {
    copyState.value = 'idle';
  }, copyState.value === 'copied' ? COPIED_MS : FAILED_MS);
}

onMounted(() => {
  isCoarse.value = window.matchMedia('(pointer: coarse)').matches;
  placeLensAtFocus();
  requestAnimationFrame(() => {
    isReady.value = true;
    lensOn.value = true;
  });
  loadTimer = setTimeout(() => {
    scenesLoaded.value = true;
  }, 2200);

  if (reducedMotion.value) return;
  observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    lastFrameAt = 0;
    if (inView) schedule();
    else if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  });
  if (heroRef.value) observer.observe(heroRef.value);
  schedule();
});

onUnmounted(() => {
  if (frame) cancelAnimationFrame(frame);
  observer?.disconnect();
  if (copyTimer) clearTimeout(copyTimer);
  if (loadTimer) clearTimeout(loadTimer);
});
</script>

<style scoped>
.hero {
  --lens-r: clamp(150px, 19vw, 300px);
  position: relative;
  min-height: max(700px, 100svh);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 340px);
  grid-template-rows: 1fr auto;
  column-gap: clamp(24px, 4vw, 64px);
  padding:
      calc(var(--home-header-height, 68px) + clamp(32px, 6vh, 72px))
      var(--home-content-gutter, clamp(20px, 4vw, 56px))
      clamp(28px, 5vh, 48px);
  overflow: hidden;
  color: var(--bone);
  background: var(--fog-0);
  isolation: isolate;
}

/* ---- Stage: fogged scene, fog banks, the clear scene inside the lens ---- */
.hero-stage,
.hero-layer,
.hero-scene,
.hero-scrim {
  position: absolute;
  inset: 0;
}

.hero-stage {
  z-index: -1;
  pointer-events: none;
}

.hero-scene {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.04);
  transition: opacity 1.6s ease, transform 10s linear;
}

.hero-scene.is-active {
  opacity: 1;
  transform: scale(1.1);
}

.hero-layer--fogged .hero-scene {
  filter: grayscale(.9) brightness(.38) contrast(1.05);
}

.hero-layer--clear {
  opacity: 0;
  transition: opacity 1.2s ease;
  -webkit-mask-image: radial-gradient(circle var(--lens-r) at var(--lx) var(--ly), #000 0%, #000 42%, rgba(0, 0, 0, .55) 70%, transparent 100%);
  mask-image: radial-gradient(circle var(--lens-r) at var(--lx) var(--ly), #000 0%, #000 42%, rgba(0, 0, 0, .55) 70%, transparent 100%);
}

.is-lens-on .hero-layer--clear {
  opacity: 1;
}

.hero-lens {
  position: absolute;
  top: 0;
  left: 0;
  width: calc(var(--lens-r) * 1.14);
  aspect-ratio: 1;
  border: 1px solid rgba(236, 230, 218, .18);
  border-radius: 50%;
  opacity: 0;
  transform: translate3d(calc(var(--lx) - 50%), calc(var(--ly) - 50%), 0);
  transition: opacity 1.2s ease;
}

.is-lens-on .hero-lens {
  opacity: 1;
}

/* A short crimson tick and a mono label ride the rim, so the lens reads as an instrument. */
.hero-lens::before {
  content: "";
  position: absolute;
  top: -1px;
  left: 50%;
  width: 26px;
  height: 2px;
  background: var(--crimson-text);
  transform: translateX(-50%);
}

.hero-lens span {
  position: absolute;
  top: -22px;
  left: 50%;
  color: var(--ash);
  font: 500 .62rem/1 var(--font-mono);
  letter-spacing: .16em;
  text-transform: uppercase;
  white-space: nowrap;
  transform: translateX(-50%);
}

.hero-fog {
  position: absolute;
  left: -50%;
  width: 200%;
  background-repeat: repeat-x;
  background-size: 50% 100%;
}

.hero-fog--far {
  top: 10%;
  height: 70%;
  background-image:
      radial-gradient(ellipse 18% 32% at 12% 60%, rgba(176, 184, 196, .2), transparent 70%),
      radial-gradient(ellipse 22% 28% at 38% 40%, rgba(176, 184, 196, .15), transparent 70%),
      radial-gradient(ellipse 16% 30% at 64% 66%, rgba(176, 184, 196, .18), transparent 70%),
      radial-gradient(ellipse 24% 34% at 88% 46%, rgba(176, 184, 196, .15), transparent 70%);
  animation: fog-drift 90s linear infinite;
}

.hero-fog--near {
  bottom: -6%;
  height: 56%;
  background-image:
      radial-gradient(ellipse 26% 40% at 20% 70%, rgba(200, 206, 214, .26), transparent 72%),
      radial-gradient(ellipse 20% 36% at 52% 82%, rgba(200, 206, 214, .2), transparent 72%),
      radial-gradient(ellipse 28% 44% at 82% 74%, rgba(200, 206, 214, .26), transparent 72%);
  animation: fog-drift 55s linear infinite reverse;
  -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 45%, transparent 88%);
  mask-image: linear-gradient(180deg, #000 0%, #000 45%, transparent 88%);
}

@keyframes fog-drift {
  to { transform: translate3d(-25%, 0, 0); }
}

/* Keeps the copy legible whatever the lens reveals behind it. */
.hero-scrim {
  background:
      linear-gradient(90deg, rgba(7, 8, 11, .92) 0%, rgba(7, 8, 11, .72) 30%, rgba(7, 8, 11, .1) 62%, transparent 75%),
      linear-gradient(180deg, rgba(7, 8, 11, .6) 0%, transparent 20%, transparent 70%, var(--fog-0) 100%);
}

/* ---- Copy ---- */
.hero-content {
  align-self: center;
  max-width: 660px;
}

.hero-content > * {
  opacity: 0;
  transform: translateY(14px);
  transition: opacity .8s ease, transform .8s var(--ease-out);
}

.is-ready .hero-content > * {
  opacity: 1;
  transform: none;
}

.is-ready .hero-content > :nth-child(2) { transition-delay: .08s; }
.is-ready .hero-content > :nth-child(3) { transition-delay: .2s; }
.is-ready .hero-content > :nth-child(4) { transition-delay: .3s; }
.is-ready .hero-content > :nth-child(5) { transition-delay: .38s; }

.hero-title {
  display: grid;
  margin: 22px 0 22px;
  color: var(--bone);
  font: 800 clamp(3.6rem, 8.4vw, 8.4rem)/.86 var(--font-display);
  letter-spacing: .005em;
  text-transform: uppercase;
}

.hero-title__accent {
  color: var(--crimson-text);
}

.hero-summary {
  max-width: 44ch;
  margin: 0;
  color: var(--ash);
  font-size: clamp(1rem, 1.25vw, 1.15rem);
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;
}

/* ---- Address ---- */
.hero-address {
  width: fit-content;
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-top: 22px;
  padding: 6px 6px 6px 16px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(13, 15, 20, .6);
  transition: border-color .2s ease;
}

.hero-address.is-copied { border-color: rgba(76, 195, 138, .6); }
.hero-address.is-failed { border-color: var(--crimson-text); }

.hero-address__dot {
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 50%;
  background: var(--ash-dim);
}

.hero-address__dot.is-online {
  background: var(--live);
  box-shadow: 0 0 0 4px rgba(76, 195, 138, .16);
}

.hero-address__dot.is-offline { background: var(--crimson-text); }

.hero-address__label {
  color: var(--ash);
  font: 500 .72rem/1 var(--font-mono);
  letter-spacing: .12em;
  text-transform: uppercase;
}

.is-copied .hero-address__label { color: var(--live); }
.is-failed .hero-address__label { color: var(--crimson-text); }

.hero-address__value {
  color: var(--bone);
  font: 500 .92rem/1 var(--font-mono);
  user-select: all;
}

.hero-address__copy {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: var(--bone);
  background: var(--fog-3);
  cursor: pointer;
  transition: background-color .2s ease;
}

.hero-address__copy:hover { background: #2a2f3a; }
.hero-address__copy:active { background: var(--crimson-deep); }

.hero-address__copy svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* ---- Scene index ---- */
.hero-scenes {
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: end;
}

.hero-hint {
  margin: 0 0 14px;
  color: var(--ash);
  font: 500 .7rem/1.4 var(--font-mono);
  letter-spacing: .12em;
  text-transform: uppercase;
}

.hero-scenes ol {
  display: grid;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.hero-scene-tab {
  position: relative;
  width: 100%;
  min-height: 56px;
  display: grid;
  grid-template-columns: 34px 1fr;
  align-items: center;
  gap: 10px;
  padding: 10px 14px 12px 12px;
  border: 0;
  border-radius: 10px;
  color: var(--ash);
  background: rgba(13, 15, 20, .55);
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  transition: background-color .2s ease, color .2s ease;
}

.hero-scene-tab:hover {
  color: var(--bone);
  background: rgba(30, 34, 43, .8);
}

.hero-scene-tab.is-active {
  color: var(--bone);
  background: rgba(30, 34, 43, .9);
}

.hero-scene-tab__num {
  font: 500 .72rem/1 var(--font-mono);
  letter-spacing: .08em;
}

.hero-scene-tab.is-active .hero-scene-tab__num {
  color: var(--crimson-text);
}

.hero-scene-tab__text {
  display: grid;
  gap: 4px;
}

.hero-scene-tab__text strong {
  font: 700 1.15rem/1 var(--font-display);
  letter-spacing: .02em;
  text-transform: uppercase;
}

.hero-scene-tab__text small {
  color: var(--ash);
  font-size: .78rem;
}

.hero-scene-tab__bar {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 6px;
  height: 2px;
  background: var(--line);
  opacity: 0;
}

.hero-scene-tab.is-active .hero-scene-tab__bar {
  opacity: 1;
  background:
      linear-gradient(90deg, var(--crimson-text) calc(var(--scene-progress) * 100%), var(--line) 0);
}

.hero-changelog {
  position: absolute;
  top: calc(var(--home-header-height, 68px) + 20px);
  right: var(--home-content-gutter, clamp(20px, 4vw, 56px));
  color: var(--ash);
  font-size: .85rem;
  text-decoration: none;
}

.hero-changelog:hover { color: var(--bone); }

/* ---- Narrow: copy first, scenes as a compact row ---- */
@media (max-width: 960px) {
  .hero {
    --lens-r: clamp(120px, 34vw, 200px);
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
    row-gap: 28px;
  }

  .hero-scenes {
    grid-column: 1;
    grid-row: 2;
  }

  /* The scene becomes a band above the copy, so the lens never crosses text. */
  .hero {
    padding-top: calc(var(--home-header-height, 68px) + 34svh);
  }

  .hero-stage {
    inset: 0 0 auto;
    height: calc(var(--home-header-height, 68px) + 42svh);
    -webkit-mask-image: linear-gradient(180deg, #000 70%, transparent 100%);
    mask-image: linear-gradient(180deg, #000 70%, transparent 100%);
  }

  .hero-scenes ol {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
  }

  .hero-scene-tab {
    min-height: 52px;
    grid-template-columns: 1fr;
    gap: 6px;
    padding: 9px 10px 12px;
  }

  .hero-scene-tab__text strong {
    font-size: .95rem;
  }

  .hero-scene-tab__text small {
    display: none;
  }

  .hero-scrim {
    background: linear-gradient(180deg, rgba(7, 8, 11, .65) 0%, transparent 28%, transparent 70%, var(--fog-0) 100%);
  }

  .hero-changelog {
    display: none;
  }
}

@media (max-width: 560px) {
  .hero-actions .fog-button {
    flex: 1 1 100%;
  }

  .hero-address__label {
    display: none;
  }

  .hero-scene-tab__num {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-fog { animation: none; }
  .hero-scene { transition: opacity .01s; transform: none; }
  .hero-scene.is-active { transform: none; }
  .hero-content > * {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
