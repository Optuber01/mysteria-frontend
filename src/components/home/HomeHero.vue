<template>
  <section
    ref="heroRef"
    class="hero"
    :class="{ 'is-ready': isReady, 'is-faded': stackFaded }"
    :style="heroStyle"
    aria-labelledby="home-title"
  >
    <div class="hero-sticky">
      <div class="hero-backdrop" aria-hidden="true" />

      <div class="hero-content">
        <div class="hero-copy">
          <h1 id="home-title">A Lord of the Mysteries-inspired Minecraft Server</h1>
          <p class="hero-summary">
            Choose a Pathway, brew your first potion, and step into a world of dungeons, hunts, rituals, and hidden powers.
          </p>

          <div class="hero-actions" aria-label="Get started">
            <RouterLink class="hero-action hero-action--primary" to="/guide">
              <span>Start playing</span>
              <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" /></svg>
            </RouterLink>

            <div class="connection-pill" aria-label="Mysterria server details">
              <span class="connection-status">
                <i class="connection-status__dot" :class="`is-${status.state}`" aria-hidden="true" />
                <small aria-live="polite">{{ statusLabel }}</small>
              </span>
              <strong class="connection-address">{{ MYSTERRIA_ADDRESS }}</strong>
              <button
                class="connection-copy"
                type="button"
                :aria-label="copyState === 'copied' ? 'Server address copied' : 'Copy server address'"
                @click="copyAddress"
              >
                <svg v-if="copyState !== 'copied'" aria-hidden="true" viewBox="0 0 18 18">
                  <rect x="6.5" y="6.5" width="8" height="8" rx="1.5" />
                  <path d="M11.5 3.5h-6a2 2 0 0 0-2 2v6" />
                </svg>
                <svg v-else aria-hidden="true" viewBox="0 0 18 18"><path d="M4 9.5l3.5 3.5L14 5.5" /></svg>
              </button>
              <span class="visually-hidden" aria-live="polite">{{ copyFeedback }}</span>
            </div>
          </div>

          <RouterLink class="hero-link-quiet" :to="latestSlug ? `/news/${latestSlug}` : '/news'">
            <span>Latest changelog</span>
            <svg aria-hidden="true" viewBox="0 0 20 20">
              <path d="M5.5 2.75h6l3 3v11.5h-9z" />
              <path d="M11.5 2.75v3h3M8 9h4.5M8 12h4.5" />
            </svg>
          </RouterLink>
        </div>

        <figure class="hero-plate">
          <div class="hero-plate__frame">
            <img
              v-for="(slide, index) in HOME_HERO_SLIDES"
              :key="slide.src"
              class="hero-slide"
              :class="{ 'is-active': activeSlide === index }"
              :src="index === 0 || slidesLoaded ? slide.src : undefined"
              :style="slideStyle(slide)"
              alt=""
              :loading="index === 0 ? 'eager' : undefined"
              :fetchpriority="index === 0 ? 'high' : undefined"
              decoding="async"
            >

            <div class="hero-plate__signal" aria-hidden="true">
              <i />
              <span>WORLD ONLINE</span>
              <b>FIELD {{ String(activeSlide + 1).padStart(2, '0') }}</b>
            </div>
          </div>

          <div class="hero-plate__footer">
            <figcaption class="hero-plate__caption">
              <span>{{ HOME_HERO_SLIDES[activeSlide].label }}</span>
              <b>{{ HOME_HERO_SLIDES[activeSlide].sequence }}</b>
            </figcaption>

            <div class="hero-plate__controls" role="tablist" aria-label="Hero world scenes">
              <button
                v-for="(slide, index) in HOME_HERO_SLIDES"
                :key="slide.src"
                class="hero-plate__control"
                :class="{ 'is-active': activeSlide === index }"
                type="button"
                role="tab"
                :tabindex="activeSlide === index ? 0 : -1"
                :aria-selected="activeSlide === index"
                :aria-label="`Show ${slide.label}`"
                @click="selectSlide(index)"
                @keydown.left.prevent="selectSlide(index - 1, true)"
                @keydown.right.prevent="selectSlide(index + 1, true)"
                @keydown.home.prevent="selectSlide(0, true)"
                @keydown.end.prevent="selectSlide(HOME_HERO_SLIDES.length - 1, true)"
              >
                <span>{{ String(index + 1).padStart(2, '0') }}</span>
                <i aria-hidden="true" />
              </button>
            </div>
          </div>
        </figure>
      </div>

      <a class="scroll-cue" href="#progression" aria-label="Scroll down to see Mysterria progression">
        <span>Scroll to begin</span>
        <i aria-hidden="true"><b /></i>
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
  type CSSProperties,
} from 'vue';
import { useElementScrollProgress } from '@/composables/useElementScrollProgress';
import { useReducedMotion } from '@/composables/useReducedMotion';
import { HOME_HERO_SLIDES, type HomeHeroSlide } from '@/data/homeHeroSlides';
import { MYSTERRIA_ADDRESS, type ServerStatus } from '@/services/serverStatus';

const props = defineProps<{ status: ServerStatus; latestSlug?: string | null }>();

const ROTATE_INTERVAL = 7000;
type HeroCssProperties = CSSProperties & Record<`--${string}`, string>;

const heroRef = ref<HTMLElement | null>(null);
const activeSlide = ref(0);
const slidesLoaded = ref(false);
const isReady = ref(false);
const copyState = ref<'idle' | 'copied' | 'failed'>('idle');
const reducedMotion = useReducedMotion();
const { progress, inView } = useElementScrollProgress(heroRef, {
  rootMargin: '20% 0px',
  disabled: reducedMotion,
});

let readyFrame = 0;
let copyTimer: ReturnType<typeof setTimeout> | null = null;
let deferredSlidesTimer: ReturnType<typeof setTimeout> | null = null;
let rotateTimer: ReturnType<typeof setInterval> | null = null;

const heroStyle = computed<HeroCssProperties>(() => ({
  '--hero-progress': reducedMotion.value ? '0' : progress.value.toFixed(4),
}));

const statusLabel = computed(() => {
  if (props.status.state === 'online') {
    return props.status.playersOnline === null
      ? 'Online'
      : `${props.status.playersOnline} online`;
  }
  if (props.status.state === 'offline') return 'Offline';
  if (props.status.state === 'loading') return 'Checking…';
  return 'Unavailable';
});

const copyFeedback = computed(() => {
  if (copyState.value === 'copied') return 'Server address copied.';
  if (copyState.value === 'failed') return `Copy failed. Select ${MYSTERRIA_ADDRESS} manually.`;
  return '';
});

const stackFaded = computed(() => progress.value >= .18);

function slideStyle(slide: HomeHeroSlide): HeroCssProperties {
  return {
    '--slide-position': slide.position,
    '--slide-position-mobile': slide.mobilePosition,
    '--slide-scale': String(slide.scale),
    '--slide-saturation': String(slide.saturation),
    '--slide-brightness': String(slide.brightness),
    '--slide-contrast': String(slide.contrast),
  };
}

function normalizeSlide(index: number) {
  return ((index % HOME_HERO_SLIDES.length) + HOME_HERO_SLIDES.length) % HOME_HERO_SLIDES.length;
}

async function copyAddress() {
  try {
    await navigator.clipboard.writeText(MYSTERRIA_ADDRESS);
    copyState.value = 'copied';
  } catch {
    copyState.value = 'failed';
  }

  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => {
    copyState.value = 'idle';
  }, 2600);
}

async function revealSlide(index: number) {
  const normalized = normalizeSlide(index);
  const image = heroRef.value?.querySelectorAll<HTMLImageElement>('.hero-slide')[normalized] ?? null;

  if (image && (!image.complete || image.naturalWidth === 0)) {
    try {
      await image.decode();
    } catch {
      return;
    }
  }

  activeSlide.value = normalized;
}

async function selectSlide(index: number, moveFocus = false) {
  slidesLoaded.value = true;
  await nextTick();
  await revealSlide(index);

  if (moveFocus) {
    await nextTick();
    heroRef.value
      ?.querySelectorAll<HTMLButtonElement>('.hero-plate__control')[activeSlide.value]
      ?.focus();
  }

  stopRotation();
  syncRotation();
}

function advanceSlide() {
  void revealSlide(activeSlide.value + 1);
}

function startRotation() {
  if (rotateTimer) return;
  rotateTimer = setInterval(advanceSlide, ROTATE_INTERVAL);
}

function stopRotation() {
  if (!rotateTimer) return;
  clearInterval(rotateTimer);
  rotateTimer = null;
}

function syncRotation() {
  const shouldRotate =
    slidesLoaded.value
    && inView.value
    && !reducedMotion.value
    && !document.hidden;

  if (shouldRotate) startRotation();
  else stopRotation();
}

function loadDeferredSlides() {
  slidesLoaded.value = true;
  syncRotation();
}

function queueDeferredSlides() {
  if (deferredSlidesTimer) clearTimeout(deferredSlidesTimer);
  deferredSlidesTimer = setTimeout(loadDeferredSlides, 250);
}

function applySceneTheme() {
  const host = heroRef.value?.closest<HTMLElement>('.mysterria-home');
  const theme = HOME_HERO_SLIDES[activeSlide.value]?.theme;
  if (!host || !theme) return;

  host.style.setProperty('--hero-scene-color', theme.color);
  host.style.setProperty('--hero-scene-glow', theme.glow);
  host.style.setProperty('--hero-scene-accent', theme.accent);
}

watch(activeSlide, applySceneTheme);
watch([slidesLoaded, reducedMotion, inView], syncRotation);

watch(reducedMotion, (reduced) => {
  if (reduced) activeSlide.value = 0;
});

onMounted(() => {
  readyFrame = requestAnimationFrame(() => {
    isReady.value = true;
  });

  applySceneTheme();
  document.addEventListener('visibilitychange', syncRotation);
  deferredSlidesTimer = setTimeout(loadDeferredSlides, 2800);

  if (document.readyState === 'complete') queueDeferredSlides();
  else window.addEventListener('load', queueDeferredSlides, { once: true });
});

onUnmounted(() => {
  const host = heroRef.value?.closest<HTMLElement>('.mysterria-home');
  host?.style.removeProperty('--hero-scene-color');
  host?.style.removeProperty('--hero-scene-glow');
  host?.style.removeProperty('--hero-scene-accent');

  document.removeEventListener('visibilitychange', syncRotation);
  window.removeEventListener('load', queueDeferredSlides);
  if (readyFrame) cancelAnimationFrame(readyFrame);
  if (copyTimer) clearTimeout(copyTimer);
  if (deferredSlidesTimer) clearTimeout(deferredSlidesTimer);
  stopRotation();
});
</script>

<style scoped>
.hero {
  --hero-progress: 0;
  position: relative;
  min-height: clamp(940px, 168svh, 1540px);
  color: var(--ink);
  background: transparent;
  isolation: isolate;
}

.hero-sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100svh;
  min-height: 640px;
  overflow: hidden;
  isolation: isolate;
  background: color-mix(in srgb, var(--journey-top) 82%, var(--hero-scene-color) 18%);
  transition: background 1.45s cubic-bezier(.22, 1, .36, 1);
}

.hero-backdrop {
  position: absolute;
  z-index: 0;
  inset: 0;
  background:
    radial-gradient(ellipse 56% 78% at 78% 42%, color-mix(in srgb, var(--hero-scene-glow) 28%, transparent), transparent 68%),
    radial-gradient(ellipse 54% 86% at 18% 48%, color-mix(in srgb, var(--hero-scene-color) 20%, transparent), transparent 72%),
    linear-gradient(180deg, transparent 58%, color-mix(in srgb, var(--journey-mid) 88%, var(--hero-scene-color) 12%) 84%, var(--journey-mid));
  pointer-events: none;
  transition: background 1.45s cubic-bezier(.22, 1, .36, 1);
}

.hero-content {
  position: relative;
  z-index: 2;
  width: min(100%, var(--home-content-max, 1440px));
  height: 100%;
  display: grid;
  grid-template-columns: minmax(300px, .82fr) minmax(500px, 1.18fr);
  align-items: center;
  gap: clamp(24px, 4vw, 68px);
  margin: 0 auto;
  padding:
    calc(var(--home-header-height, 82px) + env(safe-area-inset-top) + 28px)
    var(--home-content-gutter, clamp(20px, 4vw, 56px))
    clamp(112px, 14svh, 156px);
  opacity: clamp(0, calc((.94 - var(--hero-progress)) / .94), 1);
  transform: translate3d(0, calc(var(--hero-progress) * -30px), 0);
  will-change: transform, opacity;
}

.hero.is-faded .hero-content {
  pointer-events: none;
}

.hero-copy {
  position: relative;
  z-index: 4;
  min-width: 0;
  max-width: 650px;
}

.hero-copy::before {
  content: "";
  position: absolute;
  z-index: -1;
  inset: -54px -80px -54px -46px;
  background: radial-gradient(ellipse at 28% 50%, color-mix(in srgb, var(--journey-top) 78%, var(--hero-scene-glow) 22%), transparent 72%);
  opacity: .82;
  pointer-events: none;
}

.hero h1 {
  max-width: 680px;
  margin: 0 0 22px;
  color: color-mix(in srgb, var(--ink) 94%, var(--hero-scene-color) 6%);
  font-family: var(--font-display);
  font-size: clamp(3rem, 5vw, 4.8rem);
  font-weight: 800;
  line-height: .98;
  letter-spacing: -.035em;
  text-wrap: balance;
  opacity: 0;
  transform: translateY(16px);
  transition:
    opacity .9s .12s cubic-bezier(.22, 1, .36, 1),
    transform .9s .12s cubic-bezier(.22, 1, .36, 1),
    color 1.25s cubic-bezier(.22, 1, .36, 1);
}

.hero-summary {
  max-width: 520px;
  margin: 0 0 30px;
  color: color-mix(in srgb, var(--ink) 72%, transparent);
  font-size: clamp(1rem, 1.25vw, 1.13rem);
  line-height: 1.65;
  text-wrap: balance;
  opacity: 0;
  transform: translateY(16px);
  transition: opacity .85s .24s cubic-bezier(.22, 1, .36, 1), transform .85s .24s cubic-bezier(.22, 1, .36, 1);
}

.hero-actions {
  max-width: 650px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin: 0 0 10px;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity .8s .36s cubic-bezier(.22, 1, .36, 1), transform .8s .36s cubic-bezier(.22, 1, .36, 1);
}

.hero-action {
  min-width: 0;
  min-height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 24px;
  border-radius: 999px;
  font-size: .88rem;
  font-weight: 700;
  transition: transform .28s cubic-bezier(.22, 1, .36, 1), background-color .25s, box-shadow .28s, color .25s;
}

.hero-action svg,
.hero-link-quiet svg,
.connection-copy svg {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.hero-action svg {
  width: 18px;
  height: 18px;
  stroke-width: 1.7;
  transition: transform .28s cubic-bezier(.22, 1, .36, 1);
}

.hero-action--primary {
  color: #fff;
  background: color-mix(in srgb, var(--primary) 78%, var(--hero-scene-accent) 22%);
  box-shadow: 0 12px 30px color-mix(in srgb, var(--hero-scene-accent) 30%, transparent);
}

.hero-action--primary:hover {
  color: #fff;
  background: var(--primary-deep);
  box-shadow: 0 22px 48px rgba(116, 88, 232, .32);
  transform: translateY(-2px);
}

.hero-action--primary:hover svg { transform: translateX(3px); }
.hero-action--primary:active { transform: translateY(0); }

.connection-pill {
  min-width: 0;
  max-width: 100%;
  min-height: 52px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 11px;
  padding: 6px 8px 6px 14px;
  border: 1px solid color-mix(in srgb, var(--hairline) 72%, var(--hero-scene-color) 28%);
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface-glass) 86%, var(--hero-scene-color) 14%);
  backdrop-filter: blur(14px) saturate(1.05);
  box-shadow: 0 10px 30px color-mix(in srgb, var(--hero-scene-color) 18%, transparent);
  opacity: 0;
  transform: translateY(14px);
  transition:
    opacity .8s .48s cubic-bezier(.22, 1, .36, 1),
    transform .8s .48s cubic-bezier(.22, 1, .36, 1),
    background-color 1.25s cubic-bezier(.22, 1, .36, 1),
    border-color 1.25s cubic-bezier(.22, 1, .36, 1);
}

.connection-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.connection-status__dot {
  flex: 0 0 auto;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--ink-muted);
}

.connection-status__dot.is-online { background: var(--live); box-shadow: 0 0 0 4px rgba(52, 199, 123, .16); }
.connection-status__dot.is-loading { background: var(--champagne); }
.connection-status__dot.is-offline { background: rgba(34, 28, 20, .35); }

.connection-status small {
  color: color-mix(in srgb, var(--ink) 68%, transparent);
  font-size: .62rem;
  font-weight: 800;
  letter-spacing: .09em;
  text-transform: uppercase;
  white-space: nowrap;
}

.connection-address {
  min-width: 0;
  overflow: hidden;
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: .78rem;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.connection-copy {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--hairline);
  border-radius: 50%;
  color: var(--ink-muted);
  background: transparent;
  cursor: pointer;
  transition: background-color .25s, border-color .25s, color .25s, transform .25s;
}

.connection-copy svg { width: 16px; height: 16px; stroke-width: 1.5; }
.connection-copy:hover { border-color: rgba(116, 88, 232, .45); color: var(--primary-deep); background: var(--primary-tint); }
.connection-copy:active { transform: scale(.94); }

.hero-link-quiet {
  width: fit-content;
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 4px;
  color: var(--ink-muted);
  font-size: .82rem;
  font-weight: 700;
  transition: color .25s;
}

.hero-link-quiet svg {
  width: 17px;
  height: 17px;
  stroke-width: 1.45;
  transition: transform .28s cubic-bezier(.22, 1, .36, 1);
}

.hero-link-quiet:hover { color: var(--primary); }
.hero-link-quiet:hover svg { transform: translateX(3px); }

.hero-plate {
  position: relative;
  z-index: 2;
  min-width: 0;
  min-height: clamp(440px, 68svh, 760px);
  max-height: 780px;
  align-self: center;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 14px;
  margin: 0;
  opacity: 0;
  transform: translateY(18px);
  transition: opacity .9s .42s cubic-bezier(.22, 1, .36, 1), transform .9s .42s cubic-bezier(.22, 1, .36, 1);
}

.hero-plate__frame {
  position: relative;
  min-height: 0;
  overflow: hidden;
  border-radius: 30px;
  background: color-mix(in srgb, var(--journey-mid) 84%, var(--hero-scene-color) 16%);
  -webkit-mask-image:
    linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, .12) 5%, rgba(0, 0, 0, .68) 14%, #000 25%, #000 92%, rgba(0, 0, 0, .48) 97%, transparent 100%),
    linear-gradient(180deg, #000 0%, #000 74%, rgba(0, 0, 0, .62) 84%, transparent 100%);
  -webkit-mask-composite: source-in;
  mask-image:
    linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, .12) 5%, rgba(0, 0, 0, .68) 14%, #000 25%, #000 92%, rgba(0, 0, 0, .48) 97%, transparent 100%),
    linear-gradient(180deg, #000 0%, #000 74%, rgba(0, 0, 0, .62) 84%, transparent 100%);
  mask-composite: intersect;
}

.hero-plate__frame::before,
.hero-plate__frame::after {
  content: "";
  position: absolute;
  z-index: 3;
  inset: 0;
  pointer-events: none;
}

.hero-plate__frame::before {
  background: linear-gradient(90deg, color-mix(in srgb, var(--journey-top) 48%, transparent), transparent 34%);
}

.hero-plate__frame::after {
  background:
    linear-gradient(125deg, rgba(12, 14, 22, .08), transparent 38%, rgba(12, 14, 22, .02) 68%, rgba(12, 14, 22, .2)),
    linear-gradient(180deg, rgba(12, 14, 22, .08), transparent 28%, transparent 70%, rgba(12, 14, 22, .24));
}

.hero-slide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  object-position: var(--slide-position, 50% 50%);
  filter:
    saturate(var(--slide-saturation, 1.08))
    contrast(var(--slide-contrast, 1.02))
    brightness(var(--slide-brightness, 1.08));
  opacity: 0;
  transform: scale(1.045) translateX(10px);
  transition: opacity 1.05s cubic-bezier(.45, 0, .25, 1), transform 1.05s cubic-bezier(.22, 1, .36, 1);
  will-change: opacity;
}

.hero-slide.is-active {
  opacity: 1;
  transform: scale(var(--slide-scale, 1));
}

.hero-plate__signal {
  position: absolute;
  z-index: 5;
  top: 22px;
  left: 12%;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid rgba(255, 255, 255, .22);
  border-radius: 10px;
  color: rgba(255, 255, 255, .9);
  background: rgba(18, 20, 28, .38);
  backdrop-filter: blur(12px);
  font: 700 .55rem/1 var(--font-mono);
  letter-spacing: .1em;
  white-space: nowrap;
}

.hero-plate__signal i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--live);
  box-shadow: 0 0 0 4px rgba(52, 199, 123, .16);
}

.hero-plate__signal b {
  color: rgba(255, 255, 255, .58);
  font-weight: 700;
}

.hero-plate__footer {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 clamp(8px, 2vw, 24px) 0 12%;
}

.hero-plate__caption {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ink-muted);
  font-size: .64rem;
  font-weight: 800;
  letter-spacing: .11em;
  text-transform: uppercase;
}

.hero-plate__caption span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-plate__caption b {
  flex: 0 0 auto;
  color: var(--hero-scene-accent);
  font-weight: 800;
}

.hero-plate__controls {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border: 1px solid color-mix(in srgb, var(--hairline) 72%, var(--hero-scene-color) 28%);
  border-radius: 12px;
  background: color-mix(in srgb, var(--surface-glass) 88%, var(--hero-scene-color) 12%);
  backdrop-filter: blur(12px);
}

.hero-plate__control {
  position: relative;
  width: 34px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  color: var(--ink-muted);
  background: transparent;
  font: 800 .52rem/1 var(--font-mono);
  letter-spacing: .06em;
  cursor: pointer;
  transition: color .2s, background-color .2s;
}

.hero-plate__control i {
  position: absolute;
  right: 7px;
  bottom: 4px;
  left: 7px;
  height: 2px;
  border-radius: 999px;
  background: var(--hero-scene-accent);
  transform: scaleX(0);
  transition: transform .3s cubic-bezier(.22, 1, .36, 1);
}

.hero-plate__control:hover,
.hero-plate__control:focus-visible {
  color: var(--ink);
  background: color-mix(in srgb, var(--hero-scene-color) 12%, transparent);
}

.hero-plate__control.is-active {
  color: var(--ink);
  background: color-mix(in srgb, var(--journey-top) 78%, var(--hero-scene-color) 22%);
}

.hero-plate__control.is-active i { transform: scaleX(1); }

.is-ready h1,
.is-ready .hero-summary,
.is-ready .hero-actions,
.is-ready .connection-pill,
.is-ready .hero-plate {
  opacity: 1;
  transform: none;
}

.scroll-cue {
  position: absolute;
  z-index: 4;
  left: 50%;
  bottom: clamp(18px, 4vh, 38px);
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--ink-muted);
  font-size: .66rem;
  font-weight: 800;
  letter-spacing: .15em;
  text-transform: uppercase;
  opacity: clamp(0, calc((.6 - var(--hero-progress)) * 4), 1);
  transform: translateX(-50%);
  transition: color .25s;
}

.scroll-cue:hover { color: var(--primary); }

.scroll-cue > i {
  position: relative;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--primary);
}

.scroll-cue > i > b {
  position: absolute;
  inset: 0;
  border: 1px solid var(--primary);
  border-radius: 50%;
  animation: hero-cue 2s cubic-bezier(.22, 1, .36, 1) infinite;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

@keyframes hero-cue {
  0% { opacity: .65; transform: scale(1); }
  70%, 100% { opacity: 0; transform: scale(2.4); }
}

@media (max-width: 1120px) {
  .hero-content {
    grid-template-columns: minmax(280px, .86fr) minmax(420px, 1.14fr);
    gap: clamp(18px, 3vw, 38px);
  }

  .hero h1 { font-size: clamp(2.8rem, 5.2vw, 4.25rem); }
  .hero-plate__footer { padding-left: 9%; }
}

@media (max-height: 720px) and (min-width: 901px) {
  .hero { min-height: auto; }
  .hero-sticky { position: relative; height: auto; min-height: 720px; }
  .hero-content { min-height: 720px; opacity: 1; transform: none; will-change: auto; }
  .hero-plate { min-height: 430px; }
  .scroll-cue { display: none; }
}

@media (max-width: 900px) {
  .hero { min-height: auto; }

  .hero-sticky {
    position: relative;
    height: auto;
    min-height: 0;
    overflow: hidden;
  }

  .hero-content {
    height: auto;
    grid-template-columns: minmax(0, 1fr);
    gap: clamp(38px, 8vw, 64px);
    padding:
      calc(var(--home-header-height, 76px) + env(safe-area-inset-top) + 36px)
      var(--home-content-gutter, 20px)
      var(--home-section-block, 88px);
    opacity: 1;
    transform: none;
    will-change: auto;
  }

  .hero-copy { max-width: 680px; }
  .hero-copy::before { inset: -44px -24px; }
  .hero h1 { max-width: 640px; font-size: clamp(2.65rem, 8.5vw, 4.5rem); }
  .hero-summary { max-width: 620px; }

  .hero-plate {
    width: 100%;
    min-height: 0;
    max-height: none;
    gap: 12px;
  }

  .hero-plate__frame {
    min-height: 0;
    aspect-ratio: 16 / 9;
  }

  .hero-slide { object-position: var(--slide-position-mobile, var(--slide-position)); }
  .hero-plate__footer { padding-inline: 7%; }
  .scroll-cue { display: none; }
}

@media (max-width: 600px) {
  .hero-content { padding-top: calc(var(--home-header-height, 72px) + env(safe-area-inset-top) + 28px); }
  .hero h1 { font-size: clamp(2.3rem, 11vw, 3.65rem); }
  .hero-summary { margin-bottom: 24px; font-size: .94rem; }
  .hero-actions { display: grid; grid-template-columns: 1fr; gap: 10px; }
  .hero-action { width: 100%; justify-content: space-between; padding-inline: 18px; }
  .connection-pill { width: 100%; }
  .hero-plate__frame { aspect-ratio: 4 / 3; border-radius: 22px; }
  .hero-plate__signal { top: 14px; left: 10%; }
  .hero-plate__signal b { display: none; }
  .hero-plate__footer { align-items: flex-start; padding-inline: 8%; }
  .hero-plate__caption { display: grid; gap: 4px; }
}

@media (max-width: 430px) {
  .hero h1 { font-size: clamp(2.2rem, 11.5vw, 3.15rem); }
  .hero-summary { font-size: .88rem; }
  .connection-pill { grid-template-columns: auto minmax(0, 1fr) auto; gap: 8px; padding-left: 12px; }
  .connection-status small { font-size: .58rem; }
  .connection-address { font-size: .72rem; }
  .hero-plate__footer { display: grid; grid-template-columns: 1fr; gap: 10px; }
  .hero-plate__controls { justify-self: end; }
}

@media (max-width: 290px) {
  .hero-content { padding-inline: 8px; }
  .hero h1 { font-size: 2rem; }
  .connection-pill { grid-template-columns: 1fr auto; border-radius: 20px; }
  .connection-status { grid-column: 1 / -1; }
  .connection-address { white-space: normal; overflow-wrap: anywhere; }
}

@media (prefers-reduced-motion: reduce) {
  .hero { min-height: auto; }
  .hero-sticky { position: relative; height: auto; min-height: 100svh; transition: none; }
  .hero-backdrop { transition: none; }
  .hero-content { height: auto; min-height: 100svh; opacity: 1; transform: none; will-change: auto; }
  .hero-slide { transition: none; will-change: auto; }
  .hero-slide:nth-of-type(n + 2) { display: none; }
  .hero h1,
  .hero-summary,
  .hero-actions,
  .connection-pill,
  .hero-plate { opacity: 1; transform: none; transition: none; }
  .scroll-cue > i > b { animation: none; }
}
</style>
