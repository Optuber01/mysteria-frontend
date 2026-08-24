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
          <p class="hero-eyebrow">Mysterria · Minecraft RPG</p>
          <h1 id="home-title">
            Choose a path.
            <span class="hero-keyword">Make it yours.</span>
          </h1>
          <p class="hero-summary">
            Brew potions, learn a Pathway and explore a living world shaped by the people who play it.
          </p>

          <div class="hero-actions" aria-label="Get started">
            <RouterLink class="hero-action hero-action--primary" to="/guide">
              <span>Enter the world</span>
              <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" /></svg>
            </RouterLink>
            <RouterLink class="hero-action hero-action--ghost" :to="latestSlug ? `/news/${latestSlug}` : '/news'">
              <span>Latest changelog</span>
              <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" /></svg>
            </RouterLink>
          </div>

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

        <figure class="hero-plate">
          <div class="hero-plate__float hero-plate__float--top" aria-hidden="true">
            <img :src="heroWatchtowerNight" alt="" width="420" height="260" decoding="async">
            <span>Watchtower · after dark</span>
          </div>
          <div class="hero-plate__float hero-plate__float--bottom" aria-hidden="true">
            <i />
            <span><b>Field note 01</b><small>Cliffside Sanctuary</small></span>
            <strong>↗</strong>
          </div>
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
          </div>
          <figcaption class="hero-plate__caption"><span>01 / Cliffside</span><b>SEQ IX</b></figcaption>
        </figure>
      </div>

      <a class="scroll-cue" href="#progression" aria-label="Scroll down to see Mysterria progression">
        <span>Scroll to explore</span>
        <i aria-hidden="true"><b /></i>
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useReducedMotion } from '@/composables/useReducedMotion';
import { MYSTERRIA_ADDRESS, type ServerStatus } from '@/services/serverStatus';
import heroDawnCliffside from '@/assets/images/home/hero/hero-dawn-cliffside.webp';
import heroBlackgoldSanctuary from '@/assets/images/home/hero/hero-blackgold-sanctuary.webp';
import heroWatchtowerNight from '@/assets/images/home/hero/hero-watchtower-night.webp';

const props = defineProps<{ status: ServerStatus; latestSlug?: string | null }>();

const ROTATE_INTERVAL = 7000;
const heroSlides = [
  { src: heroDawnCliffside, position: '36% 54%' },
  { src: heroBlackgoldSanctuary, position: '38% 46%' },
  { src: heroWatchtowerNight, position: '34% 52%' },
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

function advanceSlide() {
  const next = (activeSlide.value + 1) % heroSlides.length;
  const target = heroRef.value?.querySelectorAll<HTMLImageElement>('.hero-slide')[next] ?? null;
  const reveal = () => { activeSlide.value = next; };
  if (!target || (target.complete && target.naturalWidth > 0)) {
    reveal();
    return;
  }
  target.decode().then(reveal).catch(() => {});
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
  min-height: 118svh;
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
  height: clamp(110px, 18svh, 190px);
  background: linear-gradient(180deg, rgba(252, 248, 240, 0) 0%, rgba(252, 248, 240, .72) 58%, var(--journey-mid) 100%);
  pointer-events: none;
}

.hero-content {
  position: absolute;
  z-index: 5;
  inset: 0;
  width: min(100%, 1480px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(320px, .92fr) minmax(0, 1.08fr);
  align-items: center;
  gap: clamp(36px, 5vw, 76px);
  padding: calc(96px + env(safe-area-inset-top)) clamp(20px, 4vw, 56px) clamp(128px, 15svh, 170px);
  opacity: clamp(0, calc((.15 - var(--hero-progress)) / .15), 1);
  transform: translate3d(0, calc(var(--hero-progress) / .15 * -40px), 0);
  will-change: transform, opacity;
}

.hero-content.is-faded { pointer-events: none; }

.hero-copy { max-width: 640px; }

.hero-eyebrow {
  margin: 0 0 18px;
  color: var(--primary-deep);
  font-family: var(--font-mono);
  font-size: .64rem;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: .16em;
  text-transform: uppercase;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity .7s .05s cubic-bezier(.22, 1, .36, 1), transform .7s .05s cubic-bezier(.22, 1, .36, 1);
}

.hero h1 {
  max-width: 9ch;
  margin: 0 0 24px;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: clamp(52px, 6.7vw, 100px);
  font-weight: 800;
  line-height: .98;
  letter-spacing: -.035em;
  overflow-wrap: anywhere;
  text-wrap: balance;
  opacity: 1;
  transform: translateY(16px);
  transition: opacity .9s .12s cubic-bezier(.22, 1, .36, 1), transform .9s .12s cubic-bezier(.22, 1, .36, 1);
}

.hero-keyword {
  position: relative;
  display: block;
  color: var(--primary);
  white-space: normal;
}

.hero-keyword::after {
  content: '';
  position: absolute;
  right: 1%;
  bottom: -.06em;
  left: 1%;
  height: 4px;
  border-radius: 999px;
  background: var(--sunset);
  transform: rotate(-1deg) scaleX(0);
  transform-origin: 0 60%;
  transition: transform .85s .55s cubic-bezier(.22, 1, .36, 1);
}

.is-ready .hero-keyword::after { transform: rotate(-1deg) scaleX(1); }

.hero-summary {
  max-width: 470px;
  margin: 0 0 28px;
  color: var(--ink-muted);
  font-size: clamp(1rem, 1.25vw, 1.13rem);
  line-height: 1.65;
  text-wrap: balance;
  opacity: 0;
  transform: translateY(16px);
  transition: opacity .85s .26s cubic-bezier(.22, 1, .36, 1), transform .85s .26s cubic-bezier(.22, 1, .36, 1);
}

.hero-actions {
  max-width: 560px;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr);
  gap: 10px;
  margin: 0 0 16px;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity .8s .38s cubic-bezier(.22, 1, .36, 1), transform .8s .38s cubic-bezier(.22, 1, .36, 1);
}

.hero-action {
  min-width: 0;
  min-height: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 20px;
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

.hero-action--ghost {
  color: var(--primary);
  border: 1px solid rgba(116, 88, 232, .42);
  background: transparent;
}
.hero-action--ghost:hover {
  color: var(--primary-deep);
  border-color: var(--primary);
  background: var(--primary-tint);
  transform: translateY(-2px);
}
.hero-action--ghost:hover svg { transform: scale(1.08); }
.hero-action--ghost:active { transform: translateY(0); }

.hero-link-quiet {
  display: none;
  align-items: center;
  gap: 7px;
  padding: 0 6px;
  min-height: 52px;
  color: var(--ink-muted);
  font-size: .82rem;
  font-weight: 700;
  transition: color .25s;
}
.hero-link-quiet svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
  transition: transform .32s cubic-bezier(.22, 1, .36, 1);
}
.hero-link-quiet:hover { color: var(--primary); }
.hero-link-quiet:hover svg { transform: translateX(3px); }

.connection-pill {
  width: min(100%, 560px);
  max-width: 100%;
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 9px 10px 9px 16px;
  border: 1px solid var(--hairline);
  border-left: 3px solid var(--coral);
  border-radius: 18px;
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
  font-size: .66rem;
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
  font-size: .88rem;
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
  position: relative;
  margin: 0;
  min-width: 0;
  opacity: 0;
  transform: translateY(18px);
  transition: opacity .9s .44s cubic-bezier(.22, 1, .36, 1), transform .9s .44s cubic-bezier(.22, 1, .36, 1);
}

.hero-plate__frame {
  position: relative;
  height: clamp(340px, 58svh, 640px);
  overflow: hidden;
  border: 1px solid var(--hairline);
  border-radius: 28px;
  background: var(--journey-mid);
  box-shadow: 0 24px 70px rgba(34, 28, 20, .16), 0 10px 30px rgba(34, 28, 20, .08);
}

.hero-plate::before {
  content: "";
  position: absolute;
  z-index: -1;
  inset: 12% -10% -9% 9%;
  border-radius: 42px;
  background: radial-gradient(circle at 50% 40%, rgba(116, 88, 232, .18), transparent 68%);
  filter: blur(24px);
}

.hero-plate__float {
  position: absolute;
  z-index: 4;
  overflow: hidden;
  border: 1px solid var(--hairline);
  color: var(--ink);
  background: var(--surface);
  box-shadow: 0 18px 42px rgba(34, 28, 20, .15);
  pointer-events: none;
}

.hero-plate__float--top {
  top: -24px;
  right: -20px;
  width: clamp(148px, 15vw, 218px);
  padding: 7px 7px 9px;
  transform: rotate(2.8deg);
}

.hero-plate__float--top img {
  width: 100%;
  aspect-ratio: 1.6;
  object-fit: cover;
  border-radius: 2px;
}

.hero-plate__float--top span {
  display: block;
  margin: 8px 3px 0;
  color: var(--ink-muted);
  font: 700 .55rem/1 var(--font-mono);
  letter-spacing: .08em;
  text-transform: uppercase;
}

.hero-plate__float--bottom {
  left: -28px;
  bottom: 32px;
  min-width: 214px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 13px 9px 9px;
  border-radius: 999px;
  background: var(--surface-glass);
  backdrop-filter: blur(14px);
  transform: rotate(-2deg);
}

.hero-plate__float--bottom > i {
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: linear-gradient(145deg, var(--primary), var(--coral));
  box-shadow: inset 0 0 0 5px rgba(255, 255, 255, .65);
}

.hero-plate__float--bottom span { display: grid; gap: 4px; }
.hero-plate__float--bottom b,
.hero-plate__float--bottom small {
  display: block;
  font-family: var(--font-mono);
  text-transform: uppercase;
}
.hero-plate__float--bottom b { color: var(--primary-deep); font-size: .52rem; letter-spacing: .12em; }
.hero-plate__float--bottom small { color: var(--ink-muted); font-size: .58rem; letter-spacing: .05em; }
.hero-plate__float--bottom strong { margin-left: auto; color: var(--primary); font-size: 1rem; }

.hero-slide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  opacity: 0;
  transition: opacity 1.3s cubic-bezier(.45, 0, .25, 1);
  will-change: opacity;
}

.hero-slide.is-active { opacity: 1; }

.hero-plate__caption {
  position: absolute;
  left: 22px;
  top: 22px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 15px;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  background: var(--surface-glass);
  backdrop-filter: blur(14px) saturate(1.05);
  box-shadow: 0 10px 30px rgba(34, 28, 20, .1);
  color: var(--ink);
  font-size: .64rem;
  font-weight: 700;
  letter-spacing: .13em;
  text-transform: uppercase;
  white-space: nowrap;
}

.hero-plate__caption b { color: #a98634; font-weight: 700; }

.is-ready .hero-eyebrow,
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
  .hero-content { gap: clamp(28px, 4vw, 44px); }
  .hero-plate__frame { height: clamp(280px, 46svh, 480px); }
}

@media (max-width: 720px) {
  .hero { min-height: 118svh; }
  .hero-sticky { min-height: 100svh; }
  .hero-content {
    grid-template-columns: 1fr;
    align-content: start;
    gap: 0;
    padding: calc(84px + env(safe-area-inset-top)) 15px 96px;
  }
  .hero-copy { max-width: 560px; }
  .hero-eyebrow { margin-bottom: 12px; font-size: .66rem; }
  .hero h1 { max-width: 10ch; font-size: clamp(44px, 12.5vw, 68px); }
  .hero-summary { margin-bottom: 24px; font-size: .94rem; }
  .hero-actions { gap: 9px; margin-bottom: 14px; }
  .hero-action { min-height: 50px; padding: 0 16px; font-size: .78rem; }
  .connection-pill { padding: 8px 9px 8px 15px; gap: 11px; }
  .connection-address { font-size: .8rem; }
  .connection-copy { width: 36px; height: 36px; }
  .hero-plate { display: none; }
  .scroll-cue { bottom: 12px; max-width: calc(100% - 30px); white-space: nowrap; }
}

@media (max-width: 420px) {
  .hero-content { padding-inline: 11px; }
  .hero h1 { font-size: clamp(38px, 12vw, 54px); }
  .hero-summary { font-size: .87rem; }
  .hero-actions { width: 100%; }
  .hero-action { padding-inline: 13px; font-size: .72rem; }
  .connection-pill { width: 100%; }
}

@media (max-width: 720px) and (max-height: 690px) {
  .hero { min-height: auto; }
  .hero-sticky { position: relative; height: auto; min-height: max(620px, 100svh); padding: calc(82px + env(safe-area-inset-top)) 10px 62px; }
  .hero-content { position: relative; inset: auto; width: 100%; padding: 0; transform: none; opacity: 1; }
  .hero h1 { font-size: clamp(34px, 10.5vw, 46px); }
  .hero-summary { margin-bottom: 18px; font-size: .82rem; }
  .hero-actions { margin-bottom: 16px; }
  .scroll-cue { display: none; }
}

@media (max-height: 690px) and (min-width: 721px) {
  .hero-content { padding-top: calc(76px + env(safe-area-inset-top)); }
  .hero h1 { font-size: clamp(40px, 5vw, 68px); }
  .hero-plate__frame { height: clamp(240px, 52svh, 420px); }
}

@media (max-width: 270px) {
  .hero { min-height: auto; }
  .hero-sticky { position: relative; height: auto; min-height: 100svh; padding: 86px 10px 70px; }
  .hero-content { position: relative; inset: auto; width: 100%; padding: 0; transform: none; opacity: 1; }
  .hero h1 { font-size: 2.1rem; overflow-wrap: anywhere; }
  .hero-keyword { white-space: normal; }
  .connection-address { overflow-wrap: anywhere; white-space: normal; }
  .scroll-cue { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .hero { min-height: 100svh; }
  .hero-sticky { position: relative; }
  .hero-slide { transition: none; will-change: auto; }
  .hero-slide:nth-of-type(n + 2) { display: none; }
  .hero-content { opacity: 1; transform: none; }
  .hero-eyebrow, .hero h1, .hero-summary, .hero-actions, .connection-pill, .hero-plate { opacity: 1; transform: none; transition: none; }
  .hero-keyword::after { transform: rotate(-1deg) scaleX(1); transition: none; }
  .scroll-cue i b { animation: none; }
}
</style>
