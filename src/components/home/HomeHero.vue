<template>
  <section
    ref="heroRef"
    class="hero"
    :class="{ 'is-ready': isReady }"
    :style="{ '--hero-progress': progress.toFixed(4) }"
    aria-labelledby="home-title"
  >
    <div class="hero-sticky">
      <div class="hero-melt" aria-hidden="true" />

      <div class="hero-content" :class="{ 'is-faded': stackFaded }">
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
                :aria-label="copied ? 'Server address copied' : 'Copy server address'"
                @click="copyAddress"
              >
                <svg v-if="!copied" aria-hidden="true" viewBox="0 0 18 18"><rect x="6.5" y="6.5" width="8" height="8" rx="1.5" /><path d="M11.5 3.5h-6a2 2 0 0 0-2 2v6" /></svg>
                <svg v-else aria-hidden="true" viewBox="0 0 18 18"><path d="M4 9.5l3.5 3.5L14 5.5" /></svg>
                <b class="visually-hidden" aria-live="polite">{{ copied ? 'Copied' : '' }}</b>
              </button>
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
          <button
            class="hero-plate__peek hero-plate__peek--previous"
            type="button"
            :aria-label="`Show ${heroSlides[(activeSlide + heroSlides.length - 1) % heroSlides.length].label}`"
            @click="selectSlide((activeSlide + heroSlides.length - 1) % heroSlides.length)"
          >
            <img
              :src="heroSlides[(activeSlide + heroSlides.length - 1) % heroSlides.length].src"
              alt=""
              loading="lazy"
            >
          </button>
          <div class="hero-plate__frame">
            <img
              v-for="(slide, index) in heroSlides"
              :key="slide.src"
              class="hero-slide"
              :class="{ 'is-active': activeSlide === index }"
              :src="index === 0 || slidesLoaded ? slide.src : undefined"
              :style="{ objectPosition: slide.position }"
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
          <button
            class="hero-plate__peek hero-plate__peek--next"
            type="button"
            :aria-label="`Show ${heroSlides[(activeSlide + 1) % heroSlides.length].label}`"
            @click="selectSlide((activeSlide + 1) % heroSlides.length)"
          >
            <img
              :src="heroSlides[(activeSlide + 1) % heroSlides.length].src"
              alt=""
              loading="lazy"
            >
          </button>
          <figcaption class="hero-plate__caption">
            <span>{{ heroSlides[activeSlide].label }}</span>
            <b>{{ heroSlides[activeSlide].sequence }}</b>
          </figcaption>
          <div class="hero-plate__controls" role="tablist" aria-label="Hero world scenes">
            <button
              v-for="(slide, index) in heroSlides"
              :key="slide.src"
              class="hero-plate__control"
              :class="{ 'is-active': activeSlide === index }"
              type="button"
              role="tab"
              :aria-selected="activeSlide === index"
              :aria-label="`Show ${slide.label}`"
              @click="selectSlide(index)"
            >
              <span>0{{ index + 1 }}</span>
              <i aria-hidden="true" />
            </button>
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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useReducedMotion } from '@/composables/useReducedMotion';
import { MYSTERRIA_ADDRESS, type ServerStatus } from '@/services/serverStatus';
import heroWatchtower from '@/assets/images/home/hero/hero-watchtower-night.webp';
import heroDawn from '@/assets/images/home/hero/hero-dawn-cliffside.webp';
import heroSanctuary from '@/assets/images/home/hero/hero-blackgold-sanctuary.webp';
import twinTreeRift from '@/assets/images/community-archive/dungeons/twin-tree-rift/twin-tree-rift-wide.webp';
import heroBanner from '@/assets/images/optimized/banner.webp';

const props = defineProps<{ status: ServerStatus; latestSlug?: string | null }>();

const ROTATE_INTERVAL = 7000;
const heroSlides = [
  { src: heroDawn, position: '56% 48%', label: 'The Cliffside Gate', sequence: 'WORLD / 01' },
  { src: heroWatchtower, position: '72% 52%', label: 'Watchtower at Dusk', sequence: 'VEIL / 02' },
  { src: heroSanctuary, position: '50% 48%', label: 'Black-Gold Sanctuary', sequence: 'RITUAL / 03' },
  { src: twinTreeRift, position: '52% 50%', label: 'The Twin-Tree Rift', sequence: 'FIELD / 04' },
  { src: heroBanner, position: '30% 52%', label: 'The First Signal', sequence: 'VEIL / 05' },
];

const heroRef = ref<HTMLElement | null>(null);
const progress = ref(0);
const copied = ref(false);
const isReady = ref(false);
const activeSlide = ref(0);
const slidesLoaded = ref(false);
const reducedMotion = useReducedMotion();

let visible = false;
let observer: IntersectionObserver | null = null;
let frame = 0;
let readyFrame = 0;
let copiedTimer: ReturnType<typeof setTimeout> | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let rotateTimer: ReturnType<typeof setInterval> | null = null;

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

const stackFaded = computed(() => progress.value >= 0.15);

function updateProgress() {
  frame = 0;
  if (!visible || !heroRef.value || reducedMotion.value) return;
  const bounds = heroRef.value.getBoundingClientRect();
  const travel = Math.max(1, bounds.height - innerHeight);
  progress.value = Math.min(1, Math.max(0, -bounds.top / travel));
}

function queueUpdate() {
  if (!frame && !reducedMotion.value) frame = requestAnimationFrame(updateProgress);
}

async function copyAddress() {
  try {
    await navigator.clipboard.writeText(MYSTERRIA_ADDRESS);
    copied.value = true;
    if (copiedTimer) clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => { copied.value = false; }, 1800);
  } catch {
    copied.value = false;
  }
}

function revealSlide(index: number) {
  const target = heroRef.value?.querySelectorAll<HTMLImageElement>('.hero-slide')[index] ?? null;
  if (!target || (target.complete && target.naturalWidth > 0)) {
    activeSlide.value = index;
    return;
  }
  target.decode().then(() => { activeSlide.value = index; }).catch(() => {});
}

function selectSlide(index: number) {
  slidesLoaded.value = true;
  revealSlide(index);
  if (rotateTimer) {
    stopRotation();
    startRotation();
  }
}

function advanceSlide() {
  revealSlide((activeSlide.value + 1) % heroSlides.length);
}

function startRotation() {
  if (rotateTimer || !slidesLoaded.value || reducedMotion.value) return;
  rotateTimer = setInterval(() => {
    if (document.hidden || reducedMotion.value || !visible) return;
    advanceSlide();
  }, ROTATE_INTERVAL);
}

function stopRotation() {
  if (!rotateTimer) return;
  clearInterval(rotateTimer);
  rotateTimer = null;
}

watch([slidesLoaded, reducedMotion], ([loaded, reduced]) => {
  if (!loaded || reduced) {
    stopRotation();
    if (reduced) activeSlide.value = 0;
    return;
  }
  startRotation();
});

function loadDeferredSlides() {
  if (slidesLoaded.value) return;
  slidesLoaded.value = true;
}

function queueDeferredSlides() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(loadDeferredSlides, 300);
}

onMounted(() => {
  observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) queueUpdate();
  }, { rootMargin: '20% 0px' });
  if (heroRef.value) observer.observe(heroRef.value);
  addEventListener('scroll', queueUpdate, { passive: true });
  addEventListener('resize', queueUpdate, { passive: true });
  readyFrame = requestAnimationFrame(() => { isReady.value = true; });
  idleTimer = setTimeout(loadDeferredSlides, 3500);
  if (document.readyState === 'complete') queueDeferredSlides();
  else addEventListener('load', queueDeferredSlides, { once: true });
});

onUnmounted(() => {
  observer?.disconnect();
  removeEventListener('scroll', queueUpdate);
  removeEventListener('resize', queueUpdate);
  removeEventListener('load', queueDeferredSlides);
  if (frame) cancelAnimationFrame(frame);
  if (readyFrame) cancelAnimationFrame(readyFrame);
  if (copiedTimer) clearTimeout(copiedTimer);
  if (idleTimer) clearTimeout(idleTimer);
  stopRotation();
});
</script>

<style scoped>
.hero {
  --hero-progress: 0;
  position: relative;
  min-height: 190svh;
  color: var(--ink);
  background: transparent;
  isolation: isolate;
}

.hero-sticky {
  position: sticky;
  top: 0;
  height: 100svh;
  min-height: 560px;
  overflow: hidden;
  isolation: isolate;
  background: var(--journey-top);
}

.hero-melt {
  position: absolute;
  z-index: 3;
  right: 0;
  bottom: 0;
  left: 0;
  height: clamp(150px, 28svh, 300px);
  background: linear-gradient(180deg, rgba(252, 248, 240, 0) 0%, rgba(252, 248, 240, .72) 58%, var(--journey-mid) 100%);
  pointer-events: none;
}

.hero-content {
  position: absolute;
  z-index: 5;
  inset: 0;
  width: min(100%, 1480px);
  margin: 0 auto;
  display: flex;
  align-items: center;
  padding: calc(96px + env(safe-area-inset-top)) clamp(20px, 4vw, 56px) clamp(128px, 15svh, 170px);
  opacity: clamp(0, calc((.95 - var(--hero-progress)) / .95), 1);
  transform: translate3d(0, calc(var(--hero-progress) / .95 * -32px), 0);
  will-change: transform, opacity;
}

.hero-content.is-faded { pointer-events: none; }

.hero-copy {
  position: relative;
  z-index: 6;
  width: min(640px, 53%);
  max-width: 640px;
  margin-left: clamp(0px, 2.2vw, 32px);
}

.hero h1 {
  max-width: 680px;
  margin: 0 0 22px;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: clamp(40px, 5.1vw, 76px);
  font-weight: 800;
  line-height: .98;
  letter-spacing: -.035em;
  overflow-wrap: anywhere;
  text-wrap: balance;
  opacity: 1;
  transform: translateY(16px);
  transition: opacity .9s .12s cubic-bezier(.22, 1, .36, 1), transform .9s .12s cubic-bezier(.22, 1, .36, 1);
}

.hero-summary {
  max-width: 520px;
  margin: 0 0 32px;
  color: var(--ink-muted);
  font-size: clamp(1rem, 1.25vw, 1.13rem);
  line-height: 1.65;
  text-wrap: balance;
  opacity: 0;
  transform: translateY(16px);
  transition: opacity .85s .26s cubic-bezier(.22, 1, .36, 1), transform .85s .26s cubic-bezier(.22, 1, .36, 1);
}

.hero-actions {
  max-width: 620px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin: 0 0 10px;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity .8s .38s cubic-bezier(.22, 1, .36, 1), transform .8s .38s cubic-bezier(.22, 1, .36, 1);
}

.hero-action {
  min-width: 0;
  min-height: 52px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0 24px;
  border-radius: 999px;
  font-size: .88rem;
  font-weight: 700;
  transition: transform .32s cubic-bezier(.22, 1, .36, 1), background-color .25s, border-color .25s, box-shadow .32s, color .25s;
}

.hero-action:focus-visible,
.hero-link-quiet:focus-visible,
.connection-copy:focus-visible,
.scroll-cue:focus-visible {
  outline: 3px solid var(--primary);
  outline-offset: 3px;
}

.hero-action svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
  transition: transform .32s cubic-bezier(.22, 1, .36, 1);
}

.hero-action--primary {
  color: #fff;
  background: var(--primary);
  box-shadow: 0 12px 30px rgba(116, 88, 232, .24);
}
.hero-action--primary:hover {
  color: #fff;
  background: var(--primary-deep);
  box-shadow: 0 22px 48px rgba(116, 88, 232, .32);
  transform: translateY(-2px);
}
.hero-action--primary:hover svg { transform: translateX(3px); }
.hero-action--primary:active { box-shadow: 0 8px 18px rgba(116, 88, 232, .26); transform: translateY(0); }

.hero-link-quiet {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 28px;
  line-height: 1;
  padding: 0 4px;
  color: var(--ink-muted);
  font-size: .82rem;
  font-weight: 700;
  transition: color .25s;
}
.hero-link-quiet svg {
  display: block;
  flex: 0 0 auto;
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.45;
  transition: transform .32s cubic-bezier(.22, 1, .36, 1);
}
.hero-link-quiet:hover { color: var(--primary); }
.hero-link-quiet:hover svg { transform: translateX(3px); }

.connection-pill {
  width: fit-content;
  max-width: 100%;
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  min-height: 52px;
  gap: 11px;
  padding: 6px 8px 6px 14px;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  background: var(--surface-glass);
  backdrop-filter: blur(14px) saturate(1.05);
  box-shadow: 0 10px 30px rgba(34, 28, 20, .08);
  opacity: 0;
  transform: translateY(14px);
  transition: opacity .8s .5s cubic-bezier(.22, 1, .36, 1), transform .8s .5s cubic-bezier(.22, 1, .36, 1);
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
  color: var(--ink-muted);
  font-size: .6rem;
  font-weight: 700;
  letter-spacing: .1em;
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
  letter-spacing: .01em;
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.connection-copy {
  flex: 0 0 auto;
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
  transition: background-color .25s, border-color .25s, color .25s, transform .32s cubic-bezier(.22, 1, .36, 1);
}
.connection-copy svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; }
.connection-copy:hover { border-color: rgba(116, 88, 232, .45); color: var(--primary-deep); background: var(--primary-tint); }
.connection-copy:active { transform: scale(.94); }

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.hero-plate {
  position: absolute;
  z-index: 4;
  inset: -8% 0 0 34%;
  margin: 0;
  opacity: 0;
  transform: translateY(18px);
  transition: opacity .9s .44s cubic-bezier(.22, 1, .36, 1), transform .9s .44s cubic-bezier(.22, 1, .36, 1);
  pointer-events: none;
}

.hero-plate__frame {
  position: absolute;
  z-index: 1;
  inset: 0 3% 0 0;
  overflow: hidden;
  clip-path: polygon(12% 0, 100% 0, 94% 100%, 0 100%);
  box-shadow: 0 26px 60px rgba(34, 28, 20, .13);
  background: var(--journey-mid);
}

.hero-slide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  filter: saturate(1.08) contrast(1.02) brightness(1.08);
  opacity: 0;
  transform: scale(1.045) translateX(10px);
  transition: opacity 1.05s cubic-bezier(.45, 0, .25, 1), transform 1.05s cubic-bezier(.22, 1, .36, 1);
  will-change: opacity;
}

.hero-slide.is-active { opacity: 1; transform: none; }

.hero-plate__frame::after {
  content: "";
  position: absolute;
  z-index: 2;
  inset: 0;
  background:
    linear-gradient(125deg, rgba(12, 14, 22, .06), transparent 35%, rgba(12, 14, 22, .02) 70%, rgba(12, 14, 22, .2)),
    linear-gradient(180deg, rgba(12, 14, 22, .08), transparent 28%, transparent 68%, rgba(12, 14, 22, .22));
  pointer-events: none;
}

.hero-plate__frame::before {
  content: "";
  position: absolute;
  z-index: 3;
  inset: 0 auto 0 0;
  width: 36%;
  background: linear-gradient(90deg, var(--journey-top) 0%, var(--journey-top) 22%, rgba(252, 248, 240, .94) 48%, rgba(252, 248, 240, .42) 76%, transparent 100%);
  pointer-events: none;
}

.hero-plate__peek {
  position: absolute;
  z-index: 3;
  display: block;
  overflow: hidden;
  padding: 0;
  border: 4px solid rgba(252, 248, 240, .94);
  border-radius: 14px;
  background: var(--journey-mid);
  box-shadow: 0 16px 32px rgba(34, 28, 20, .18);
  cursor: pointer;
  pointer-events: auto;
  transition: transform .35s cubic-bezier(.22, 1, .36, 1), box-shadow .35s, filter .35s;
}

.hero-plate__peek img {
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  filter: saturate(.92) contrast(1.05);
  transition: transform .5s cubic-bezier(.22, 1, .36, 1), filter .35s;
}

.hero-plate__peek:hover,
.hero-plate__peek:focus-visible {
  box-shadow: 0 22px 42px rgba(34, 28, 20, .24);
  transform: translateY(-5px) rotate(0deg);
}

.hero-plate__peek:hover img,
.hero-plate__peek:focus-visible img { filter: saturate(1.08) contrast(1.08); transform: scale(1.06); }
.hero-plate__peek:focus-visible { outline: 3px solid var(--primary); outline-offset: 3px; }

.hero-plate__peek--previous {
  left: 10%;
  bottom: 12%;
  width: 28%;
  height: 22%;
  transform: rotate(-4deg);
}

.hero-plate__peek--next {
  top: 18%;
  right: 3%;
  width: 25%;
  height: 20%;
  transform: rotate(4deg);
}

.hero-plate__signal {
  position: absolute;
  z-index: 4;
  top: 24px;
  left: 13%;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid rgba(255, 255, 255, .22);
  border-radius: 10px;
  color: rgba(255, 255, 255, .86);
  background: rgba(18, 20, 28, .36);
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
  color: rgba(255, 255, 255, .55);
  font-weight: 700;
}

.hero-plate__controls {
  position: absolute;
  z-index: 5;
  right: 12%;
  bottom: 22px;
  display: inline-flex;
  align-items: center;
  gap: 1px;
  padding: 3px;
  border: 1px solid rgba(255, 255, 255, .2);
  border-radius: 12px;
  background: rgba(18, 20, 28, .48);
  backdrop-filter: blur(12px);
  box-shadow: 0 10px 24px rgba(18, 20, 28, .16);
  pointer-events: auto;
}

.hero-plate__control {
  position: relative;
  width: 32px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  color: rgba(255, 255, 255, .58);
  background: transparent;
  font: 700 .5rem/1 var(--font-mono);
  letter-spacing: .08em;
  cursor: pointer;
  transition: color .2s, background-color .2s;
}

.hero-plate__control i {
  position: absolute;
  right: 6px;
  bottom: 4px;
  left: 6px;
  height: 2px;
  border-radius: 999px;
  background: var(--champagne);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform .3s cubic-bezier(.22, 1, .36, 1);
}

.hero-plate__control:hover { color: #fff; background: rgba(255, 255, 255, .1); }
.hero-plate__control:focus-visible { color: #fff; background: rgba(255, 255, 255, .14); }
.hero-plate__control.is-active {
  color: var(--ink);
  background: var(--journey-top);
  box-shadow: 0 1px 3px rgba(18, 20, 28, .2);
}
.hero-plate__control.is-active i { background: var(--primary); transform: scaleX(1); }

.hero-plate__caption {
  position: absolute;
  left: 10%;
  bottom: 22px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 13px;
  border: 1px solid var(--hairline);
  border-radius: 12px;
  background: rgba(252, 248, 240, .9);
  backdrop-filter: blur(14px) saturate(1.05);
  box-shadow: 0 8px 22px rgba(34, 28, 20, .1);
  color: var(--ink-muted);
  font-size: .64rem;
  font-weight: 700;
  letter-spacing: .13em;
  text-transform: uppercase;
  white-space: nowrap;
}

.hero-plate__caption b { color: #a98634; font-weight: 700; }

.is-ready h1,
.is-ready .hero-summary,
.is-ready .hero-actions,
.is-ready .connection-pill,
.is-ready .hero-plate { opacity: 1; transform: none; }

.scroll-cue {
  position: absolute;
  z-index: 7;
  left: 50%;
  bottom: clamp(18px, 4vh, 38px);
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--ink-muted);
  font-size: .66rem;
  font-weight: 700;
  letter-spacing: .15em;
  text-transform: uppercase;
  opacity: clamp(0, calc((.6 - var(--hero-progress)) * 4), 1);
  transform: translateX(-50%);
  transition: color .25s;
}
.scroll-cue:hover { color: var(--primary); }

.scroll-cue i {
  position: relative;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--primary);
}
.scroll-cue i b {
  position: absolute;
  inset: 0;
  border: 1px solid var(--primary);
  border-radius: 50%;
  animation: hero-cue 2s cubic-bezier(.22, 1, .36, 1) infinite;
}

@keyframes hero-cue {
  0% { opacity: .65; transform: scale(1); }
  70%, 100% { opacity: 0; transform: scale(2.4); }
}

@media (max-width: 1080px) {
  .hero-plate { inset: -5% -2% -4% 23%; }
}

@media (max-width: 720px) {
  .hero { min-height: 165svh; }
  .hero-sticky { min-height: 100svh; }
  .hero-content {
    display: block;
    align-content: start;
    gap: 0;
    padding: calc(84px + env(safe-area-inset-top)) 15px 96px;
  }
  .hero-copy { width: 100%; max-width: 560px; margin-left: 0; }
  .hero h1 { font-size: clamp(38px, 11.5vw, 60px); }
  .hero-summary { margin-bottom: 24px; font-size: .94rem; }
  .hero-actions { display: grid; grid-template-columns: 1fr; gap: 9px; margin-bottom: 8px; }
  .hero-action { min-height: 52px; justify-content: space-between; padding: 0 18px; font-size: .82rem; }
  .connection-pill { width: 100%; padding: 6px 9px 6px 15px; gap: 10px; }
  .connection-address { font-size: .8rem; }
  .connection-copy { width: 36px; height: 36px; }
  .hero-plate { display: none; }
  .scroll-cue { bottom: 12px; max-width: calc(100% - 30px); white-space: nowrap; }
}

@media (max-width: 420px) {
  .hero-content { padding-inline: 11px; }
  .hero-copy { margin-left: 0; }
  .hero h1 { font-size: clamp(36px, 11vw, 52px); }
  .hero-summary { font-size: .87rem; }
  .hero-actions { width: 100%; }
  .connection-pill { width: 100%; }
}

@media (max-width: 720px) and (max-height: 690px) {
  .hero { min-height: auto; }
  .hero-sticky { position: relative; height: auto; min-height: max(620px, 100svh); padding: calc(82px + env(safe-area-inset-top)) 10px 62px; }
  .hero-content { position: relative; inset: auto; width: 100%; padding: 0; transform: none; opacity: 1; }
  .hero h1 { font-size: clamp(34px, 10.5vw, 46px); }
  .hero-summary { margin-bottom: 18px; font-size: .82rem; }
  .hero-actions { margin-bottom: 8px; }
  .scroll-cue { display: none; }
}

@media (max-height: 690px) and (min-width: 721px) {
  .hero-content { padding-top: calc(76px + env(safe-area-inset-top)); }
  .hero h1 { font-size: clamp(40px, 5vw, 68px); }
  .hero-plate { inset: -4% -2% -4% 27%; }
}

@media (max-width: 270px) {
  .hero { min-height: auto; }
  .hero-sticky { position: relative; height: auto; min-height: 100svh; padding: 86px 10px 70px; }
  .hero-content { position: relative; inset: auto; width: 100%; padding: 0; transform: none; opacity: 1; }
  .hero-copy { margin-left: 0; }
  .hero h1 { font-size: 2.1rem; overflow-wrap: anywhere; }
  .connection-address { overflow-wrap: anywhere; white-space: normal; }
  .scroll-cue { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .hero { min-height: 100svh; }
  .hero-sticky { position: relative; }
  .hero-slide { transition: none; will-change: auto; }
  .hero-slide:nth-of-type(n + 2) { display: none; }
  .hero-content { opacity: 1; transform: none; }
  .hero h1, .hero-summary, .hero-actions, .connection-pill, .hero-plate { opacity: 1; transform: none; transition: none; }
  .scroll-cue i b { animation: none; }
}
</style>
