<template>
  <section ref="heroRef" class="hero" :class="{ 'is-ready': isReady }" aria-labelledby="home-title">
    <div class="hero-scenes" aria-hidden="true">
      <img
          v-for="(slide, index) in HOME_HERO_SLIDES"
          v-show="index === 0 || scenesLoaded"
          :key="slide.src"
          class="hero-scene"
          :class="{ 'is-active': index === activeSlide }"
          :src="slide.src"
          :style="{ objectPosition: slide.position }"
          alt=""
          :loading="index === 0 ? 'eager' : 'lazy'"
          :fetchpriority="index === 0 ? 'high' : 'low'"
          decoding="async"
      >
    </div>

    <div class="hero-moon" aria-hidden="true"></div>
    <div class="hero-fog hero-fog--far" aria-hidden="true"></div>
    <div class="hero-fog hero-fog--near" aria-hidden="true"></div>
    <div class="hero-vignette" aria-hidden="true"></div>

    <div class="hero-content">
      <p class="fog-label hero-eyebrow">{{ eyebrow }}</p>
      <h1 id="home-title" class="hero-wordmark">Mysterria</h1>
      <p class="hero-tagline">{{ t('homePage.heroTagline') }}</p>

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

    <div class="hero-footer">
      <p class="hero-caption" aria-hidden="true">
        <span>{{ t(HOME_HERO_SLIDES[activeSlide].labelKey) }}</span>
        <b>{{ t(HOME_HERO_SLIDES[activeSlide].sequenceKey) }}</b>
      </p>
      <a class="hero-scroll" href="#progression" :aria-label="t('home.hero.scrollCueAria')">
        <span>{{ t('home.hero.scrollCue') }}</span>
        <i aria-hidden="true"></i>
      </a>
      <RouterLink class="hero-changelog" :to="$lp(latestSlug ? `/news/${latestSlug}` : '/news')">
        {{ t('home.hero.latestChangelog') }} <span aria-hidden="true">↗</span>
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {useReducedMotion} from '@/composables/useReducedMotion';
import {HOME_HERO_SLIDES} from '@/data/homeHeroSlides';
import {SERVER_IP} from '@/composables/useServer';
import type {ServerStatus} from '@/composables/useSharedServerStatus';

/* `status` only drives the address dot; the player count lives in the header chip. */
defineProps<{ status: ServerStatus; latestSlug?: string | null }>();

const ROTATE_INTERVAL = 8000;
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
const addressRef = ref<HTMLElement | null>(null);
const activeSlide = ref(0);
const scenesLoaded = ref(false);
const isReady = ref(false);
const copyState = ref<CopyState>('idle');

let copyTimer: ReturnType<typeof setTimeout> | null = null;
let rotateTimer: ReturnType<typeof setInterval> | null = null;
let loadTimer: ReturnType<typeof setTimeout> | null = null;

/* Upstream's translated eyebrow is split around the brand name for styling;
   the fog label reads it as one line. */
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

function rotate() {
  if (document.visibilityState !== 'visible') return;
  activeSlide.value = (activeSlide.value + 1) % HOME_HERO_SLIDES.length;
}

onMounted(() => {
  requestAnimationFrame(() => {
    isReady.value = true;
  });
  if (reducedMotion.value) return;
  // The first scene is the LCP image; the rest load once the page has settled.
  loadTimer = setTimeout(() => {
    scenesLoaded.value = true;
    rotateTimer = setInterval(rotate, ROTATE_INTERVAL);
  }, 2500);
});

onUnmounted(() => {
  if (copyTimer) clearTimeout(copyTimer);
  if (rotateTimer) clearInterval(rotateTimer);
  if (loadTimer) clearTimeout(loadTimer);
});
</script>

<style scoped>
.hero {
  position: relative;
  min-height: max(680px, 100svh);
  display: grid;
  grid-template-rows: 1fr auto;
  overflow: hidden;
  color: var(--bone);
  background: var(--fog-0);
  isolation: isolate;
}

/* ---- Scenes: real captures, sunk into the dark ---- */
.hero-scenes,
.hero-scene {
  position: absolute;
  inset: 0;
}

.hero-scenes {
  z-index: -5;
}

.hero-scene {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  filter: grayscale(.55) brightness(.42) contrast(1.08);
  transform: scale(1.06);
  transition: opacity 2.2s ease, transform 9s linear;
}

.hero-scene.is-active {
  opacity: 1;
  transform: scale(1.12);
}

/* ---- The Crimson Moon ---- */
.hero-moon {
  position: absolute;
  z-index: -4;
  top: clamp(90px, 14vh, 150px);
  right: clamp(24px, 11vw, 200px);
  width: clamp(120px, 19vmin, 240px);
  aspect-ratio: 1;
  border-radius: 50%;
  /* A flat, mottled disc with a rim glow reads as a moon; a central highlight
     reads as a ball. */
  background:
      radial-gradient(circle at 32% 40%, rgba(50, 4, 10, .22), transparent 16%),
      radial-gradient(circle at 63% 63%, rgba(50, 4, 10, .18), transparent 21%),
      radial-gradient(circle at 70% 31%, rgba(50, 4, 10, .14), transparent 11%),
      radial-gradient(circle at 44% 70%, rgba(255, 140, 140, .06), transparent 14%),
      radial-gradient(circle at 50% 50%, #a51d28 0%, #8e1720 60%, #6c1018 100%);
  box-shadow:
      inset -10px -14px 40px rgba(20, 2, 5, .45),
      0 0 50px 6px rgba(179, 32, 43, .32),
      0 0 160px 50px rgba(179, 32, 43, .12);
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 2.4s ease .3s, transform 2.4s var(--ease-out) .3s;
}

.is-ready .hero-moon {
  opacity: .85;
  transform: none;
}

/* ---- Fog: wide soft banks drifting at two speeds, no filters ---- */
.hero-fog {
  position: absolute;
  left: -50%;
  width: 200%;
  pointer-events: none;
  background-repeat: repeat-x;
}

.hero-fog--far {
  z-index: -2;
  top: 8%;
  height: 70%;
  background-image:
      radial-gradient(ellipse 18% 32% at 12% 60%, rgba(176, 184, 196, .22), transparent 70%),
      radial-gradient(ellipse 22% 28% at 38% 40%, rgba(176, 184, 196, .17), transparent 70%),
      radial-gradient(ellipse 16% 30% at 64% 66%, rgba(176, 184, 196, .2), transparent 70%),
      radial-gradient(ellipse 24% 34% at 88% 46%, rgba(176, 184, 196, .17), transparent 70%);
  background-size: 50% 100%;
  animation: fog-drift 90s linear infinite;
}

.hero-fog--near {
  z-index: -1;
  bottom: -8%;
  height: 58%;
  background-image:
      radial-gradient(ellipse 26% 40% at 20% 70%, rgba(200, 206, 214, .3), transparent 72%),
      radial-gradient(ellipse 20% 36% at 52% 82%, rgba(200, 206, 214, .24), transparent 72%),
      radial-gradient(ellipse 28% 44% at 82% 74%, rgba(200, 206, 214, .3), transparent 72%);
  background-size: 50% 100%;
  animation: fog-drift 55s linear infinite reverse;
  /* Fade out before the section edge so the bank never shows a cut line where
     the next chapter begins. */
  -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 45%, transparent 88%);
  mask-image: linear-gradient(180deg, #000 0%, #000 45%, transparent 88%);
}

@keyframes fog-drift {
  to { transform: translate3d(-25%, 0, 0); }
}

.hero-vignette {
  position: absolute;
  z-index: -3;
  inset: 0;
  background:
      radial-gradient(ellipse 80% 70% at 50% 45%, transparent 40%, rgba(7, 8, 11, .7) 100%),
      linear-gradient(180deg, rgba(7, 8, 11, .55) 0%, transparent 22%, transparent 62%, var(--fog-0) 100%);
}

/* ---- Content ---- */
.hero-content {
  align-self: center;
  width: min(100%, 1040px);
  margin: 0 auto;
  padding:
      calc(var(--home-header-height, 68px) + 48px)
      var(--home-content-gutter, clamp(20px, 4vw, 56px))
      40px;
  text-align: center;
}

.hero-content > * {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity .9s ease, transform .9s var(--ease-out);
}

.is-ready .hero-content > * {
  opacity: 1;
  transform: none;
}

.is-ready .hero-content > :nth-child(2) { transition-delay: .1s; }
.is-ready .hero-content > :nth-child(3) { transition-delay: .25s; }
.is-ready .hero-content > :nth-child(4) { transition-delay: .4s; }
.is-ready .hero-content > :nth-child(5) { transition-delay: .5s; }

.hero-eyebrow {
  justify-content: center;
}

.hero-eyebrow::after {
  content: "";
  width: 18px;
  height: 1px;
  background: var(--crimson-text);
}

.hero-wordmark {
  margin: 22px 0 10px;
  color: var(--bone);
  font: 600 clamp(4rem, 13vw, 11.5rem)/.86 var(--font-display);
  letter-spacing: .015em;
  text-shadow: 0 10px 60px rgba(0, 0, 0, .6);
}

.hero-tagline {
  max-width: 34ch;
  margin: 0 auto;
  color: var(--bone);
  font: italic 500 clamp(1.3rem, 2.3vw, 1.85rem)/1.35 var(--font-display);
  text-wrap: balance;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 38px;
}

/* ---- Address: one quiet line, copy on demand ---- */
.hero-address {
  width: fit-content;
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin: 26px auto 0;
  padding: 6px 6px 6px 16px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(13, 15, 20, .55);
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

/* ---- Footer row ---- */
.hero-footer {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: end;
  gap: 16px;
  padding: 0 var(--home-content-gutter, clamp(20px, 4vw, 56px)) 28px;
}

.hero-caption {
  display: flex;
  gap: 10px;
  margin: 0;
  color: var(--ash-dim);
  font: 500 .7rem/1 var(--font-mono);
  letter-spacing: .12em;
  text-transform: uppercase;
}

.hero-caption b {
  color: var(--ash);
  font-weight: 500;
}

.hero-scroll {
  display: grid;
  justify-items: center;
  gap: 10px;
  color: var(--ash);
  font: 500 .7rem/1 var(--font-mono);
  letter-spacing: .14em;
  text-transform: uppercase;
  text-decoration: none;
}

.hero-scroll i {
  width: 1px;
  height: 38px;
  background: linear-gradient(var(--crimson-text), transparent);
  animation: scroll-hint 2.4s ease-in-out infinite;
  transform-origin: top;
}

.hero-scroll:hover { color: var(--bone); }

@keyframes scroll-hint {
  0% { transform: scaleY(0); opacity: 1; }
  60% { transform: scaleY(1); opacity: 1; }
  100% { transform: scaleY(1); opacity: 0; }
}

.hero-changelog {
  justify-self: end;
  color: var(--ash);
  font-size: .85rem;
  text-decoration: none;
}

.hero-changelog:hover { color: var(--bone); }

@media (max-width: 720px) {
  .hero-moon {
    top: calc(var(--home-header-height, 68px) + 10px);
    right: 16px;
    width: 88px;
  }

  .hero-content {
    padding-top: calc(var(--home-header-height, 68px) + 104px);
  }

  .hero-actions .fog-button {
    flex: 1 1 100%;
  }

  .hero-eyebrow {
    max-width: 28ch;
    text-wrap: balance;
  }

  .hero-eyebrow::before,
  .hero-eyebrow::after {
    display: none;
  }

  .hero-address__label {
    display: none;
  }

  .hero-footer {
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .hero-caption,
  .hero-changelog {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-fog { animation: none; }
  .hero-scroll i { animation: none; }
  .hero-scene { transition: none; transform: none; }
  .hero-content > *,
  .hero-moon {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
