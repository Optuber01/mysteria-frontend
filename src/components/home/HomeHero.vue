<template>
  <section
    ref="heroRef"
    class="hero"
    :class="{ 'is-ready': isReady }"
    :style="{ '--hero-progress': progress.toFixed(4) }"
    aria-labelledby="home-title"
  >
    <div class="hero-sticky">
      <div class="hero-scene" aria-hidden="true">
        <img
          class="hero-scene__image"
          src="@/assets/images/home/mysterria-dawn.webp"
          alt=""
          width="1792"
          height="1024"
          fetchpriority="high"
          decoding="async"
        >
        <div class="hero-scene__sunwash" />
        <div class="hero-scene__readability" />
        <div class="hero-scene__depth" />
        <div class="hero-scene__handoff" />
      </div>

      <div class="hero-content">
        <p class="hero-eyebrow">
          <span aria-hidden="true" />
          A playable Pathway system
        </p>

        <h1 id="home-title">Welcome to Mysterria</h1>

        <p class="hero-summary">
          A Lord of Mysteries–inspired Minecraft RPG where every potion advances your Pathway.
        </p>

        <div class="hero-actions" aria-label="Get started">
          <RouterLink class="hero-action hero-action--primary" to="/guide">
            <span>Start playing</span>
            <svg aria-hidden="true" viewBox="0 0 20 20">
              <path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" />
            </svg>
          </RouterLink>
          <a class="hero-action hero-action--secondary" href="#progression">
            <span>See your first advancement</span>
            <svg aria-hidden="true" viewBox="0 0 20 20">
              <path d="M10 3v12m-4.5-4.5L10 15l4.5-4.5" />
            </svg>
          </a>
        </div>

        <div class="connection-bar" aria-label="Mysterria server details">
          <div class="connection-status">
            <span class="connection-status__dot" :class="`is-${status.state}`" aria-hidden="true" />
            <span>
              <small>Server status</small>
              <strong>{{ statusLabel }}</strong>
            </span>
          </div>

          <div class="connection-editions" aria-label="Supported editions">
            <small>Supported</small>
            <span>Java</span>
            <span>Bedrock</span>
          </div>

          <button
            class="connection-address"
            type="button"
            :aria-label="copied ? 'Server address copied' : `Copy server address ${MYSTERRIA_ADDRESS}`"
            @click="copyAddress"
          >
            <span>
              <small>Server address</small>
              <strong>{{ MYSTERRIA_ADDRESS }}</strong>
            </span>
            <b aria-live="polite">{{ copied ? 'Copied' : 'Copy' }}</b>
          </button>
        </div>
      </div>

      <a class="scroll-cue" href="#progression" aria-label="Scroll to follow your first Mysterria advancement">
        <span>Scroll to enter</span>
        <i aria-hidden="true"><b /></i>
      </a>

      <div class="chapter-handoff" aria-hidden="true">
        <span>Your first advancement</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useReducedMotion } from '@/composables/useReducedMotion';
import { MYSTERRIA_ADDRESS, type ServerStatus } from '@/services/serverStatus';

const props = defineProps<{ status: ServerStatus }>();

const heroRef = ref<HTMLElement | null>(null);
const progress = ref(0);
const copied = ref(false);
const isReady = ref(false);
const reducedMotion = useReducedMotion();

let isVisible = false;
let observer: IntersectionObserver | null = null;
let animationFrame = 0;
let readyFrame = 0;
let copiedTimer: ReturnType<typeof setTimeout> | null = null;

const statusLabel = computed(() => {
  if (props.status.state === 'online') {
    return props.status.playersOnline === null
      ? 'Online'
      : `${props.status.playersOnline} player${props.status.playersOnline === 1 ? '' : 's'} online`;
  }
  if (props.status.state === 'offline') return 'Offline';
  if (props.status.state === 'loading') return 'Checking…';
  return 'Status unavailable';
});

function updateScrollProgress() {
  animationFrame = 0;
  if (!isVisible || !heroRef.value || reducedMotion.value) return;

  const bounds = heroRef.value.getBoundingClientRect();
  const travel = Math.max(1, bounds.height - window.innerHeight);
  progress.value = Math.min(1, Math.max(0, -bounds.top / travel));
}

function queueScrollUpdate() {
  if (animationFrame || reducedMotion.value) return;
  animationFrame = requestAnimationFrame(updateScrollProgress);
}

async function copyAddress() {
  try {
    await navigator.clipboard.writeText(MYSTERRIA_ADDRESS);
    copied.value = true;
    if (copiedTimer) clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
      copied.value = false;
    }, 1800);
  } catch {
    copied.value = false;
  }
}

onMounted(() => {
  observer = new IntersectionObserver(
    ([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) queueScrollUpdate();
    },
    { rootMargin: '20% 0px' },
  );

  if (heroRef.value) observer.observe(heroRef.value);
  window.addEventListener('scroll', queueScrollUpdate, { passive: true });
  window.addEventListener('resize', queueScrollUpdate, { passive: true });

  readyFrame = requestAnimationFrame(() => {
    isReady.value = true;
  });
});

onUnmounted(() => {
  observer?.disconnect();
  window.removeEventListener('scroll', queueScrollUpdate);
  window.removeEventListener('resize', queueScrollUpdate);
  if (animationFrame) cancelAnimationFrame(animationFrame);
  if (readyFrame) cancelAnimationFrame(readyFrame);
  if (copiedTimer) clearTimeout(copiedTimer);
});
</script>

<style scoped>
.hero {
  --hero-progress: 0;
  position: relative;
  min-height: 178svh;
  color: #102924;
  background: #0e2224;
  isolation: isolate;
}

.hero-sticky {
  position: sticky;
  top: 0;
  height: 100svh;
  min-height: 660px;
  overflow: hidden;
  isolation: isolate;
}

.hero-scene,
.hero-scene__image,
.hero-scene > div {
  position: absolute;
  inset: 0;
}

.hero-scene {
  z-index: -2;
  overflow: hidden;
  background: #cdd4d2;
}

.hero-scene__image {
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  object-position: 54% center;
  filter: saturate(.86) contrast(1.02) brightness(1.04);
  transform-origin: 72% 61%;
  transform: scale(calc(1.075 + var(--hero-progress) * .27)) translate3d(
    calc(var(--hero-progress) * -1.4%),
    calc(var(--hero-progress) * -.8%),
    0
  );
  will-change: transform;
}

.hero-scene__sunwash {
  background:
    radial-gradient(circle at 10% 35%, rgba(255, 249, 225, .7), transparent 26%),
    linear-gradient(90deg, rgba(252, 249, 242, .74) 0%, rgba(252, 249, 242, .34) 31%, transparent 58%);
  opacity: calc(1 - var(--hero-progress) * .52);
}

.hero-scene__readability {
  background:
    linear-gradient(90deg, rgba(245, 240, 230, .52) 0%, rgba(245, 240, 230, .16) 42%, transparent 64%),
    linear-gradient(0deg, rgba(8, 21, 26, .68), transparent 28%);
}

.hero-scene__depth {
  background:
    radial-gradient(circle at 73% 63%, rgba(230, 181, 94, calc(var(--hero-progress) * .42)), transparent calc(7% + var(--hero-progress) * 17%)),
    radial-gradient(circle at 73% 63%, transparent 0 8%, rgba(8, 21, 26, calc(var(--hero-progress) * .55)) 60%);
}

.hero-scene__handoff {
  background: linear-gradient(
    0deg,
    #0e2224 0%,
    rgba(14, 34, 36, .98) 15%,
    rgba(14, 34, 36, calc(var(--hero-progress) * .94)) 54%,
    transparent 100%
  );
  transform: translate3d(0, calc(72% - var(--hero-progress) * 72%), 0);
  will-change: transform;
}

.hero-content {
  position: absolute;
  z-index: 2;
  left: clamp(24px, 7vw, 112px);
  top: 50%;
  width: min(760px, calc(100% - 48px));
  transform: translate3d(0, calc(-47% - var(--hero-progress) * 7vh), 0);
  opacity: clamp(0, calc((.84 - var(--hero-progress)) * 7), 1);
  will-change: transform, opacity;
}

.hero-eyebrow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 clamp(19px, 3vh, 32px);
  color: #21644d;
  font: 700 .7rem/1.2 "IBM Plex Mono", monospace;
  letter-spacing: .14em;
  text-transform: uppercase;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity .75s .12s cubic-bezier(.22, 1, .36, 1), transform .75s .12s cubic-bezier(.22, 1, .36, 1);
}

.hero-eyebrow > span {
  width: 30px;
  height: 1px;
  background: #21644d;
}

.hero h1 {
  max-width: 720px;
  margin: 0;
  color: #102924;
  font: 700 clamp(4.7rem, 10vw, 9.4rem)/.79 "IBM Plex Sans Condensed", sans-serif;
  letter-spacing: -.06em;
  text-wrap: balance;
  text-shadow: 0 1px 0 rgba(252, 249, 242, .4);
}

.hero-summary {
  max-width: 610px;
  margin: clamp(24px, 3vh, 34px) 0 0;
  color: rgba(16, 41, 36, .83);
  font-size: clamp(1.02rem, 1.55vw, 1.26rem);
  font-weight: 560;
  line-height: 1.55;
  text-wrap: balance;
  opacity: 0;
  transform: translateY(18px);
  transition: opacity .9s .31s cubic-bezier(.22, 1, .36, 1), transform .9s .31s cubic-bezier(.22, 1, .36, 1);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 30px;
  opacity: 0;
  transform: translateY(16px);
  transition: opacity .85s .42s cubic-bezier(.22, 1, .36, 1), transform .85s .42s cubic-bezier(.22, 1, .36, 1);
}

.is-ready .hero-eyebrow,
.is-ready h1,
.is-ready .hero-summary,
.is-ready .hero-actions,
.is-ready .connection-bar {
  opacity: 1;
  transform: none;
}

.hero-action {
  min-height: 50px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 0 19px;
  border: 1px solid rgba(16, 41, 36, .21);
  border-radius: 13px;
  color: #102924;
  background: rgba(252, 249, 242, .46);
  font-size: .83rem;
  font-weight: 760;
  backdrop-filter: blur(13px) saturate(1.15);
  box-shadow: 0 9px 30px rgba(16, 41, 36, .08);
  transition: transform .35s cubic-bezier(.22, 1, .36, 1), background-color .25s, border-color .25s, box-shadow .35s;
}

.hero-action svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
  transition: transform .35s cubic-bezier(.22, 1, .36, 1);
}

.hero-action:hover {
  color: #102924;
  border-color: rgba(16, 41, 36, .38);
  background: rgba(252, 249, 242, .8);
  box-shadow: 0 14px 35px rgba(16, 41, 36, .12);
  transform: translateY(-2px);
}

.hero-action:hover svg { transform: translateX(3px); }
.hero-action--secondary:hover svg { transform: translateY(3px); }

.hero-action--primary {
  color: #fcf9f2;
  background: #21644d;
  border-color: #21644d;
  box-shadow: 0 12px 30px rgba(33, 100, 77, .25);
}

.hero-action--primary:hover {
  color: #fcf9f2;
  background: #184f3c;
  border-color: #184f3c;
}

.connection-bar {
  width: min(790px, 100%);
  display: grid;
  grid-template-columns: minmax(145px, .78fr) minmax(170px, .88fr) minmax(240px, 1.25fr);
  margin-top: clamp(28px, 5vh, 52px);
  overflow: hidden;
  border: 1px solid rgba(16, 41, 36, .16);
  border-radius: 15px;
  background: rgba(252, 249, 242, .39);
  box-shadow: 0 18px 45px rgba(16, 41, 36, .1);
  backdrop-filter: blur(18px) saturate(1.12);
  opacity: 0;
  transform: translateY(14px);
  transition: opacity .85s .5s cubic-bezier(.22, 1, .36, 1), transform .85s .5s cubic-bezier(.22, 1, .36, 1);
}

.connection-bar > * {
  min-width: 0;
  min-height: 66px;
  padding: 11px 16px;
}

.connection-bar > * + * { border-left: 1px solid rgba(16, 41, 36, .12); }

.connection-status,
.connection-address {
  display: flex;
  align-items: center;
  gap: 11px;
}

.connection-status__dot {
  flex: 0 0 auto;
  width: 10px;
  height: 10px;
  border: 2px solid rgba(16, 41, 36, .18);
  border-radius: 50%;
  background: #7f8985;
}

.connection-status__dot.is-online { background: #238361; }
.connection-status__dot.is-offline { background: #a9543b; }
.connection-status__dot.is-loading { background: #c69b52; }

.connection-bar small {
  display: block;
  margin-bottom: 5px;
  color: rgba(16, 41, 36, .55);
  font: 600 .58rem/1 "IBM Plex Mono", monospace;
  letter-spacing: .11em;
  text-transform: uppercase;
}

.connection-bar strong,
.connection-editions span {
  color: #102924;
  font: 650 .71rem/1.2 "IBM Plex Mono", monospace;
}

.connection-editions {
  display: flex;
  align-items: center;
  align-content: center;
  flex-wrap: wrap;
  gap: 6px;
}

.connection-editions small { flex-basis: 100%; }

.connection-editions span {
  padding: 5px 7px;
  border: 1px solid rgba(16, 41, 36, .17);
  border-radius: 6px;
  font-size: .61rem;
  text-transform: uppercase;
}

.connection-address {
  justify-content: space-between;
  border: 0;
  color: #102924;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background-color .25s;
}

.connection-address:hover { background: rgba(252, 249, 242, .45); }
.connection-address b { color: #21644d; font-size: .7rem; }

.scroll-cue {
  position: absolute;
  z-index: 2;
  right: clamp(22px, 4vw, 64px);
  bottom: clamp(26px, 5vh, 48px);
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 14px;
  color: rgba(252, 249, 242, .78);
  font: 600 .61rem/1 "IBM Plex Mono", monospace;
  letter-spacing: .13em;
  text-transform: uppercase;
  opacity: clamp(0, calc(1 - var(--hero-progress) * 2.1), 1);
}

.scroll-cue i {
  position: relative;
  width: 22px;
  height: 38px;
  overflow: hidden;
  border: 1px solid rgba(252, 249, 242, .42);
  border-radius: 999px;
}

.scroll-cue b {
  position: absolute;
  top: 7px;
  left: 50%;
  width: 3px;
  height: 8px;
  border-radius: 3px;
  background: #fcf9f2;
  transform: translateX(-50%);
  animation: scroll-cue 1.8s cubic-bezier(.22, 1, .36, 1) infinite;
}

.chapter-handoff {
  position: absolute;
  z-index: 3;
  left: 50%;
  bottom: clamp(35px, 7vh, 76px);
  display: flex;
  align-items: center;
  gap: 14px;
  color: #d7b978;
  font: 600 .67rem/1 "IBM Plex Mono", monospace;
  letter-spacing: .2em;
  text-transform: uppercase;
  opacity: clamp(0, calc((var(--hero-progress) - .66) * 5), 1);
  transform: translate3d(-50%, calc((1 - var(--hero-progress)) * 30px), 0);
}

.chapter-handoff::before,
.chapter-handoff::after {
  content: "";
  width: clamp(34px, 5vw, 76px);
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(215, 185, 120, .68));
}

.chapter-handoff::after { transform: rotate(180deg); }

@keyframes scroll-cue {
  0% { opacity: 0; transform: translate(-50%, -4px); }
  24% { opacity: 1; }
  72% { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, 15px); }
}

@media (max-width: 900px) {
  .hero-content { top: 48%; }
  .connection-bar { grid-template-columns: 1fr 1fr; }
  .connection-address { grid-column: 1 / -1; border-top: 1px solid rgba(16, 41, 36, .12); }
  .connection-bar > .connection-address { border-left: 0; }
}

@media (max-width: 680px) {
  .hero { min-height: 150svh; }
  .hero-sticky { min-height: 700px; }
  .hero-scene__image {
    object-position: 64% center;
    transform-origin: 69% 58%;
  }
  .hero-scene__sunwash {
    background:
      linear-gradient(0deg, rgba(245, 240, 230, .9) 0%, rgba(245, 240, 230, .5) 53%, transparent 75%),
      radial-gradient(circle at 11% 36%, rgba(255, 249, 225, .58), transparent 30%);
  }
  .hero-scene__readability {
    background: linear-gradient(0deg, rgba(245, 240, 230, .58) 0%, transparent 63%);
  }
  .hero-content {
    left: 20px;
    top: auto;
    bottom: 20px;
    width: calc(100% - 40px);
    transform: translate3d(0, calc(var(--hero-progress) * -8vh), 0);
  }
  .hero-eyebrow { margin-bottom: 15px; font-size: .58rem; }
  .hero h1 { max-width: 540px; font-size: clamp(4rem, 20vw, 6.4rem); line-height: .82; }
  .hero-summary { max-width: 500px; margin-top: 18px; font-size: .96rem; }
  .hero-actions { margin-top: 20px; }
  .hero-action { flex: 1 1 180px; }
  .connection-bar { margin-top: 20px; }
  .connection-bar > * { min-height: 58px; padding: 9px 12px; }
  .scroll-cue { display: none; }
  .chapter-handoff { bottom: 20px; }
}

@media (max-width: 420px) {
  .hero-sticky { min-height: 720px; }
  .hero-content { bottom: 14px; width: calc(100% - 28px); left: 14px; }
  .hero h1 { font-size: clamp(3.65rem, 19vw, 5rem); }
  .hero-summary { font-size: .88rem; line-height: 1.45; }
  .hero-action { min-height: 46px; padding: 0 14px; }
  .connection-bar { grid-template-columns: 1fr; }
  .connection-bar > * + * { border-top: 1px solid rgba(16, 41, 36, .12); border-left: 0; }
  .connection-address { grid-column: auto; }
  .connection-editions small { flex-basis: auto; margin: 0 auto 0 0; }
}

@media (max-width: 270px) {
  .hero { min-height: auto; }
  .hero-sticky {
    position: relative;
    height: auto;
    min-height: 100svh;
    padding: 94px 10px 14px;
  }
  .hero-content {
    position: relative;
    inset: auto;
    width: 100%;
    transform: none;
    opacity: 1;
  }
  .hero h1 { font-size: 2.7rem; overflow-wrap: anywhere; }
  .hero-eyebrow { overflow-wrap: anywhere; }
  .hero-actions { display: grid; }
  .hero-action { min-width: 0; font-size: .7rem; }
  .connection-bar { overflow: visible; }
  .connection-bar strong { overflow-wrap: anywhere; }
  .chapter-handoff { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .hero { min-height: 100svh; }
  .hero-sticky { position: relative; }
  .hero-scene__image,
  .hero-scene__handoff,
  .hero-content,
  .chapter-handoff { transform: none; }
  .hero-scene__depth,
  .hero-scene__handoff,
  .chapter-handoff { display: none; }
  .hero-content { opacity: 1; }
  .hero-eyebrow,
  .hero h1,
  .hero-summary,
  .hero-actions,
  .connection-bar { opacity: 1; transform: none; transition: none; }
  .scroll-cue b { animation: none; }
}
</style>
