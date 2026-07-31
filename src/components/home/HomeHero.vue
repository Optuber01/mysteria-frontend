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
          width="1672"
          height="941"
          fetchpriority="high"
          decoding="async"
        >
        <div class="hero-scene__daylight" />
        <div class="hero-scene__focus" />
        <div class="fog fog--far" />
        <div class="fog fog--middle" />
        <div class="fog fog--near" />
        <div class="fog-threshold" />
      </div>

      <div class="hero-content">
        <p class="hero-eyebrow"><i aria-hidden="true" />A playable Pathway system<i aria-hidden="true" /></p>
        <h1 id="home-title">Welcome to Mysterria</h1>
        <p class="hero-summary">
          A Lord of Mysteries–inspired Minecraft RPG where you brew potions, act your Sequence and advance toward godhood.
        </p>

        <div class="hero-actions" aria-label="Get started">
          <RouterLink class="hero-action hero-action--primary" to="/guide">
            <span>Start playing</span>
            <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" /></svg>
          </RouterLink>
          <a class="hero-action hero-action--secondary" href="#progression">
            <span>Explore progression</span>
            <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M10 3v12m-4.5-4.5L10 15l4.5-4.5" /></svg>
          </a>
        </div>

        <div class="connection-bar" aria-label="Mysterria server details">
          <div class="connection-status">
            <span class="connection-status__dot" :class="`is-${status.state}`" aria-hidden="true" />
            <span><small>Server</small><strong aria-live="polite">{{ statusLabel }}</strong></span>
          </div>
          <div class="connection-editions"><small>Play on</small><strong>Java + Bedrock</strong></div>
          <button
            class="connection-address"
            type="button"
            @click="copyAddress"
          >
            <span><small>Address</small><strong>{{ MYSTERRIA_ADDRESS }}</strong></span>
            <b aria-live="polite">{{ copied ? 'Copied' : 'Copy' }}</b>
          </button>
        </div>
      </div>

      <a class="scroll-cue" href="#progression" aria-label="Scroll into the gray fog to see Mysterria progression">
        <span>Scroll into the gray fog</span>
        <i aria-hidden="true"><b /></i>
      </a>

      <div class="fog-message" aria-hidden="true">
        <span>Above the gray fog</span>
        <i />
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

let visible = false;
let observer: IntersectionObserver | null = null;
let frame = 0;
let readyFrame = 0;
let copiedTimer: ReturnType<typeof setTimeout> | null = null;

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

onMounted(() => {
  observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) queueUpdate();
  }, { rootMargin: '20% 0px' });
  if (heroRef.value) observer.observe(heroRef.value);
  addEventListener('scroll', queueUpdate, { passive: true });
  addEventListener('resize', queueUpdate, { passive: true });
  readyFrame = requestAnimationFrame(() => { isReady.value = true; });
});

onUnmounted(() => {
  observer?.disconnect();
  removeEventListener('scroll', queueUpdate);
  removeEventListener('resize', queueUpdate);
  if (frame) cancelAnimationFrame(frame);
  if (readyFrame) cancelAnimationFrame(readyFrame);
  if (copiedTimer) clearTimeout(copiedTimer);
});
</script>

<style scoped>
.hero {
  --hero-progress: 0;
  position: relative;
  min-height: 190svh;
  color: #102924;
  background: #aeb7b5;
  isolation: isolate;
}

.hero-sticky {
  position: sticky;
  top: 0;
  height: 100svh;
  min-height: 560px;
  overflow: hidden;
  isolation: isolate;
}

.hero-scene,
.hero-scene__image,
.hero-scene > div { position: absolute; inset: 0; }

.hero-scene { z-index: -2; overflow: hidden; background: #c8ceca; }

.hero-scene__image {
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  object-position: 58% 54%;
  filter: saturate(.9) contrast(1.02) brightness(1.03);
  transform-origin: 63% 58%;
  transform: scale(calc(1.025 + var(--hero-progress) * .21)) translate3d(0, calc(var(--hero-progress) * -1.8%), 0);
  will-change: transform, filter;
}

.hero-scene__daylight {
  background:
    radial-gradient(circle at 12% 42%, rgba(255, 249, 225, .58), transparent 25%),
    linear-gradient(180deg, rgba(252, 249, 242, .1), transparent 55%, rgba(8, 21, 26, .3));
  opacity: calc(1 - var(--hero-progress) * .74);
}

.hero-scene__focus {
  background:
    radial-gradient(ellipse at 50% 47%, transparent 0 18%, rgba(245, 240, 230, .16) 58%, rgba(8, 21, 26, .36) 100%),
    linear-gradient(180deg, rgba(252, 249, 242, .1), transparent 45%, rgba(8, 21, 26, .44));
}

.fog {
  inset: auto -18% -25% !important;
  height: 66%;
  opacity: clamp(0, calc((var(--hero-progress) - .08) * 1.55), .94);
  background:
    radial-gradient(ellipse at 12% 78%, rgba(211, 217, 214, .98) 0 13%, transparent 39%),
    radial-gradient(ellipse at 38% 74%, rgba(184, 193, 191, .94) 0 17%, transparent 44%),
    radial-gradient(ellipse at 70% 78%, rgba(220, 224, 220, .96) 0 18%, transparent 46%),
    radial-gradient(ellipse at 92% 72%, rgba(172, 184, 183, .94) 0 14%, transparent 41%);
  filter: blur(28px);
  transform: translate3d(calc((.5 - var(--hero-progress)) * 4%), calc((1 - var(--hero-progress)) * 48%), 0) scale(calc(.98 + var(--hero-progress) * .22));
  will-change: transform, opacity;
}

.hero-content::before {
  position: absolute;
  z-index: -1;
  inset: -12% -10%;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(252, 249, 242, .62) 0%, rgba(252, 249, 242, .3) 42%, transparent 72%);
  content: '';
  filter: blur(22px);
  pointer-events: none;
}

.fog--middle {
  inset: auto -24% -18% !important;
  height: 78%;
  opacity: clamp(0, calc((var(--hero-progress) - .26) * 1.7), .95);
  filter: blur(44px);
  transform: translate3d(calc((var(--hero-progress) - .5) * 5%), calc((1 - var(--hero-progress)) * 64%), 0) scale(calc(.92 + var(--hero-progress) * .3));
}

.fog--near {
  inset: auto -30% -38% !important;
  height: 105%;
  opacity: clamp(0, calc((var(--hero-progress) - .47) * 2.1), 1);
  filter: blur(58px);
  transform: translate3d(0, calc((1 - var(--hero-progress)) * 72%), 0) scale(calc(.86 + var(--hero-progress) * .34));
}

.fog-threshold {
  background:
    radial-gradient(ellipse at 50% 57%, rgba(8, 21, 26, calc(var(--hero-progress) * .08)) 0 12%, transparent 38%),
    linear-gradient(180deg, transparent 0 48%, rgba(112, 124, 123, calc(var(--hero-progress) * .76)) 76%, #0e2224 100%);
  opacity: clamp(0, calc((var(--hero-progress) - .4) * 2), 1);
}

.hero-content {
  position: absolute;
  z-index: 5;
  top: 48%;
  left: 50%;
  width: min(940px, calc(100% - 40px));
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  opacity: clamp(0, calc((.76 - var(--hero-progress)) * 5.2), 1);
  transform: translate3d(-50%, calc(-50% - var(--hero-progress) * 13vh), 0) scale(calc(1 - var(--hero-progress) * .055));
  will-change: transform, opacity;
}

.hero-eyebrow {
  display: flex;
  align-items: center;
  gap: 13px;
  margin: 0 0 clamp(18px, 2.6vh, 28px);
  color: #21644d;
  font: 700 .68rem/1.2 "IBM Plex Mono", monospace;
  letter-spacing: .16em;
  text-transform: uppercase;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity .7s .08s cubic-bezier(.22, 1, .36, 1), transform .7s .08s cubic-bezier(.22, 1, .36, 1);
}

.hero-eyebrow i { width: 36px; height: 1px; background: currentColor; opacity: .55; }

.hero h1 {
  max-width: 920px;
  margin: 0;
  color: #102924;
  font: 680 clamp(5.1rem, 10.7vw, 10rem)/.8 "IBM Plex Sans Condensed", sans-serif;
  letter-spacing: -.06em;
  text-wrap: balance;
  text-shadow: 0 2px 0 rgba(252, 249, 242, .3), 0 18px 55px rgba(252, 249, 242, .24);
  opacity: 1;
  transform: translateY(16px);
  transition: opacity .9s .13s cubic-bezier(.22, 1, .36, 1), transform .9s .13s cubic-bezier(.22, 1, .36, 1);
}

.hero-summary {
  max-width: 690px;
  margin: clamp(22px, 3vh, 32px) auto 0;
  color: rgba(16, 41, 36, .82);
  font-size: clamp(1rem, 1.45vw, 1.22rem);
  font-weight: 570;
  line-height: 1.55;
  text-wrap: balance;
  opacity: 0;
  transform: translateY(16px);
  transition: opacity .85s .28s cubic-bezier(.22, 1, .36, 1), transform .85s .28s cubic-bezier(.22, 1, .36, 1);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 28px;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity .8s .39s cubic-bezier(.22, 1, .36, 1), transform .8s .39s cubic-bezier(.22, 1, .36, 1);
}

.hero-action {
  min-height: 50px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 0 18px;
  border: 1px solid rgba(16, 41, 36, .2);
  border-radius: 14px;
  color: #102924;
  background: rgba(252, 249, 242, .56);
  box-shadow: 0 13px 34px rgba(16, 41, 36, .1);
  backdrop-filter: blur(14px) saturate(1.08);
  font-size: .82rem;
  font-weight: 760;
  transition: transform .32s cubic-bezier(.22, 1, .36, 1), background-color .25s, box-shadow .32s;
}

.hero-action svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.6; transition: transform .32s cubic-bezier(.22, 1, .36, 1); }
.hero-action:hover { color: #102924; background: rgba(252, 249, 242, .88); box-shadow: 0 17px 38px rgba(16, 41, 36, .15); transform: translateY(-2px); }
.hero-action:hover svg { transform: translateX(3px); }
.hero-action--secondary:hover svg { transform: translateY(3px); }
.hero-action--primary { color: #fcf9f2; border-color: #21644d; background: #21644d; box-shadow: 0 13px 34px rgba(33, 100, 77, .25); }
.hero-action--primary:hover { color: #fcf9f2; background: #184f3c; }

.connection-bar {
  width: min(760px, 100%);
  display: grid;
  grid-template-columns: .8fr .8fr 1.35fr;
  margin-top: clamp(25px, 4.5vh, 44px);
  overflow: hidden;
  border: 1px solid rgba(16, 41, 36, .15);
  border-radius: 16px;
  background: rgba(252, 249, 242, .47);
  box-shadow: 0 20px 48px rgba(16, 41, 36, .1);
  backdrop-filter: blur(17px) saturate(1.08);
  opacity: 0;
  transform: translateY(14px);
  transition: opacity .8s .5s cubic-bezier(.22, 1, .36, 1), transform .8s .5s cubic-bezier(.22, 1, .36, 1);
}

.connection-bar > * { min-width: 0; min-height: 64px; padding: 10px 15px; }
.connection-bar > * + * { border-left: 1px solid rgba(16, 41, 36, .12); }
.connection-status, .connection-address { display: flex; align-items: center; gap: 10px; text-align: left; }
.connection-status__dot { flex: 0 0 auto; width: 9px; height: 9px; border-radius: 50%; background: #7f8985; }
.connection-status__dot.is-online { background: #238361; box-shadow: 0 0 0 4px rgba(35, 131, 97, .12); }
.connection-status__dot.is-offline { background: #a9543b; }
.connection-status__dot.is-loading { background: #c69b52; }
.connection-editions { display: flex; flex-direction: column; justify-content: center; text-align: left; }
.connection-bar small { display: block; margin-bottom: 5px; color: rgba(16, 41, 36, .52); font: 600 .55rem/1 "IBM Plex Mono", monospace; letter-spacing: .11em; text-transform: uppercase; }
.connection-bar strong { color: #102924; font: 650 .68rem/1.2 "IBM Plex Mono", monospace; }
.connection-address { justify-content: space-between; border: 0; color: #102924; background: transparent; cursor: pointer; }
.connection-address:hover { background: rgba(252, 249, 242, .45); }
.connection-address b { color: #21644d; font-size: .67rem; }

.is-ready .hero-eyebrow,
.is-ready h1,
.is-ready .hero-summary,
.is-ready .hero-actions,
.is-ready .connection-bar { opacity: 1; transform: none; }

.scroll-cue {
  position: absolute;
  z-index: 7;
  left: 50%;
  bottom: clamp(18px, 4vh, 38px);
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 14px;
  color: rgba(252, 249, 242, .88);
  font: 650 .61rem/1 "IBM Plex Mono", monospace;
  letter-spacing: .13em;
  text-transform: uppercase;
  opacity: clamp(0, calc((.6 - var(--hero-progress)) * 4), 1);
  transform: translateX(-50%);
  text-shadow: 0 2px 13px rgba(8, 21, 26, .65);
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(8, 21, 26, .62);
  backdrop-filter: blur(8px);
}

.scroll-cue i { position: relative; width: 22px; height: 37px; overflow: hidden; border: 1px solid rgba(252, 249, 242, .55); border-radius: 999px; }
.scroll-cue b { position: absolute; top: 7px; left: 50%; width: 3px; height: 8px; border-radius: 3px; background: #fcf9f2; transform: translateX(-50%); animation: scroll-cue 1.9s cubic-bezier(.22, 1, .36, 1) infinite; }

.fog-message {
  position: absolute;
  z-index: 8;
  left: 50%;
  top: 50%;
  display: grid;
  justify-items: center;
  gap: 18px;
  color: rgba(252, 249, 242, .9);
  font: 600 .64rem/1 "IBM Plex Mono", monospace;
  letter-spacing: .24em;
  text-transform: uppercase;
  opacity: clamp(0, calc((var(--hero-progress) - .72) * 5), 1);
  transform: translate(-50%, calc(-50% + (1 - var(--hero-progress)) * 30px));
}
.fog-message i { width: 1px; height: 54px; background: linear-gradient(rgba(252, 249, 242, .8), transparent); }

@keyframes scroll-cue {
  0% { opacity: 0; transform: translate(-50%, -4px); }
  25%, 70% { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, 14px); }
}

@media (max-width: 720px) {
  .hero { min-height: 165svh; }
  .hero-sticky { min-height: 100svh; }
  .hero-scene__image { object-position: 64% 50%; transform-origin: 64% 55%; }
  .hero-content { top: 49%; width: calc(100% - 30px); }
  .hero-content::before { inset: -8% -3%; opacity: .9; }
  .hero-eyebrow { margin-bottom: 14px; font-size: .56rem; }
  .hero-eyebrow i { width: 22px; }
  .hero h1 { max-width: 620px; font-size: clamp(4.1rem, 19vw, 7rem); line-height: .82; }
  .hero-summary { max-width: 510px; margin-top: 18px; font-size: .92rem; line-height: 1.46; }
  .hero-actions { margin-top: 20px; }
  .hero-action { flex: 1 1 170px; min-height: 48px; }
  .connection-bar { grid-template-columns: 1fr 1fr; margin-top: 20px; }
  .connection-address { grid-column: 1 / -1; border-top: 1px solid rgba(16, 41, 36, .12); }
  .connection-bar > .connection-address { border-left: 0; }
  .scroll-cue { bottom: 12px; max-width: calc(100% - 30px); white-space: nowrap; }
}

@media (max-width: 420px) {
  .hero-content { width: calc(100% - 22px); }
  .hero h1 { font-size: clamp(3.65rem, 18vw, 5.1rem); }
  .hero-summary { font-size: .84rem; }
  .hero-actions { width: 100%; }
  .connection-bar { grid-template-columns: 1fr; }
  .connection-bar > * + * { border-top: 1px solid rgba(16, 41, 36, .12); border-left: 0; }
  .connection-address { grid-column: auto; }
  .scroll-cue span { font-size: .54rem; letter-spacing: .1em; }
}

@media (max-width: 720px) and (max-height: 690px) {
  .hero { min-height: auto; }
  .hero-sticky { position: relative; height: auto; min-height: max(620px, 100svh); padding: calc(82px + env(safe-area-inset-top)) 10px 62px; }
  .hero-content { position: relative; inset: auto; top: auto; left: auto; width: 100%; transform: none; opacity: 1; }
  .hero-content::before { inset: -3% 0; }
  .hero h1 { font-size: clamp(3.35rem, 16vw, 4.5rem); }
  .hero-summary { max-width: 430px; margin-top: 12px; font-size: .8rem; }
  .hero-actions { margin-top: 14px; }
  .connection-bar { grid-template-columns: 1fr 1fr; margin-top: 14px; }
  .connection-bar > * { min-height: 52px; padding: 8px 11px; }
  .connection-address { grid-column: 1 / -1; }
  .scroll-cue { display: none; }
}

@media (max-height: 690px) and (min-width: 721px) {
  .hero-content { top: 48%; }
  .hero h1 { font-size: clamp(4.2rem, 10vw, 7rem); }
  .hero-summary { margin-top: 16px; }
  .hero-actions { margin-top: 18px; }
  .connection-bar { margin-top: 18px; }
}

@media (max-width: 270px) {
  .hero { min-height: auto; }
  .hero-sticky { position: relative; height: auto; min-height: 100svh; padding: 86px 10px 70px; }
  .hero-content { position: relative; inset: auto; width: 100%; transform: none; opacity: 1; }
  .hero h1 { font-size: 2.7rem; overflow-wrap: anywhere; }
  .connection-bar { overflow: visible; }
  .connection-bar strong { overflow-wrap: anywhere; }
  .scroll-cue, .fog-message { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .hero { min-height: 100svh; }
  .hero-sticky { position: relative; }
  .hero-scene__image, .hero-content, .fog { transform: none; }
  .hero-scene__image { filter: saturate(.88) contrast(1.02) brightness(1.02); }
  .fog { opacity: .24; }
  .fog--middle { opacity: .14; }
  .fog--near, .fog-threshold, .fog-message { display: none; }
  .hero-content { opacity: 1; }
  .hero-eyebrow, .hero h1, .hero-summary, .hero-actions, .connection-bar { opacity: 1; transform: none; transition: none; }
  .scroll-cue b { animation: none; }
}
</style>
