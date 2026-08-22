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
        <div class="hero-scene__vignette" />
        <div class="hero-scene__scrim" />
        <div class="hero-scene__handoff" />
      </div>

      <div class="hero-content" :class="{ 'is-faded': stackFaded }">
        <p class="hero-eyebrow"><i aria-hidden="true" />A Lord of the Mysteries Minecraft server<i aria-hidden="true" /></p>
        <h1 id="home-title">Mysterria</h1>
        <p class="hero-summary">
          Brew Sequence potions, hunt Beyonder creatures and claim a Pathway in a Minecraft RPG server shaped by Lord of the Mysteries.
        </p>

        <div class="hero-actions" aria-label="Get started">
          <RouterLink class="hero-action hero-action--primary" to="/guide">
            <span>Start playing</span>
            <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" /></svg>
          </RouterLink>
          <RouterLink v-if="latestSlug" class="hero-action hero-action--secondary" :to="`/news/${latestSlug}`">
            <span>Changelog</span>
          </RouterLink>
          <a class="hero-action--quiet" href="https://wiki.mysterria.net" target="_blank" rel="noopener noreferrer">Wiki ↗</a>
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
            <b class="connection-address__pill" :class="{ 'is-copied': copied }" aria-live="polite">
              <svg v-if="!copied" aria-hidden="true" viewBox="0 0 18 18"><rect x="6.5" y="6.5" width="8" height="8" rx="1.5" /><path d="M11.5 3.5h-6a2 2 0 0 0-2 2v6" /></svg>
              <svg v-else aria-hidden="true" viewBox="0 0 18 18"><path d="M4 9.5l3.5 3.5L14 5.5" /></svg>
              {{ copied ? 'Copied' : 'Copy' }}
            </b>
          </button>
        </div>
      </div>

      <a class="scroll-cue" href="#progression" aria-label="Scroll down to see Mysterria progression">
        <span>Scroll to explore</span>
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
  min-height: 190svh;
  color: #fcf9f2;
  background: #0b1216;
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
.hero-scene__vignette,
.hero-scene__scrim,
.hero-scene__handoff { position: absolute; inset: 0; }

.hero-scene { z-index: -2; overflow: hidden; background: #08121a; }

.hero-slide {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  opacity: 0;
  transform-origin: 38% 52%;
  transform: scale(calc(1.03 + var(--hero-progress) * .16)) translate3d(0, calc(var(--hero-progress) * -1.5%), 0);
  filter: brightness(1.12) saturate(1.05) drop-shadow(0 0 140px rgba(214, 178, 74, .16));
  transition: opacity 1.6s cubic-bezier(.45, 0, .25, 1);
  will-change: transform, opacity;
}

.hero-slide.is-active { opacity: 1; }

.hero-scene__vignette {
  background: radial-gradient(ellipse 130% 100% at 32% 44%, transparent 0 30%, rgba(6, 12, 18, .34) 62%, rgba(6, 12, 18, .68) 100%);
  opacity: .25;
}

.hero-scene__scrim {
  background: linear-gradient(90deg, rgba(7, 11, 16, .94) 0%, rgba(7, 11, 16, .55) 38%, transparent 62%);
}

.hero-scene__handoff {
  background: linear-gradient(180deg, transparent 52%, rgba(11, 17, 24, .38) 74%, #0b1118 96%);
  opacity: calc(.45 + var(--hero-progress) * .55);
}

.hero-content {
  position: absolute;
  z-index: 5;
  top: 21svh;
  right: 0;
  left: 0;
  width: min(100%, 1480px);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin: 0 auto;
  padding-inline: clamp(16px, 3vw, 44px);
  text-align: left;
  opacity: clamp(0, calc((.15 - var(--hero-progress)) / .15), 1);
  transform: translate3d(0, calc(var(--hero-progress) / .15 * -40px), 0);
  will-change: transform, opacity;
}

.hero-content.is-faded { pointer-events: none; }

.hero-eyebrow {
  display: flex;
  align-items: center;
  gap: 13px;
  margin: 0 0 16px;
  color: var(--myst-gold);
  font: 700 .68rem/1.2 "IBM Plex Mono", monospace;
  letter-spacing: .16em;
  text-transform: uppercase;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity .7s .08s cubic-bezier(.22, 1, .36, 1), transform .7s .08s cubic-bezier(.22, 1, .36, 1);
}

.hero-eyebrow i { width: 36px; height: 1px; background: currentColor; opacity: .55; }

.hero h1 {
  max-width: 720px;
  margin: 0 0 20px;
  color: #f5f0e6;
  font: 680 clamp(4.6rem, 9vw, 8.4rem)/.84 "IBM Plex Sans Condensed", sans-serif;
  letter-spacing: -.015em;
  text-wrap: balance;
  text-shadow: 0 3px 18px rgba(3, 9, 14, .65), 0 22px 60px rgba(3, 9, 14, .45);
  opacity: 1;
  transform: translateY(16px);
  transition: opacity .9s .13s cubic-bezier(.22, 1, .36, 1), transform .9s .13s cubic-bezier(.22, 1, .36, 1);
}

.hero-summary {
  max-width: 560px;
  margin: 0 0 32px;
  color: rgba(252, 249, 242, .88);
  font-size: clamp(1rem, 1.35vw, 1.16rem);
  font-weight: 550;
  line-height: 1.58;
  text-wrap: balance;
  opacity: 0;
  transform: translateY(16px);
  transition: opacity .85s .28s cubic-bezier(.22, 1, .36, 1), transform .85s .28s cubic-bezier(.22, 1, .36, 1);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin: 0 0 28px;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity .8s .39s cubic-bezier(.22, 1, .36, 1), transform .8s .39s cubic-bezier(.22, 1, .36, 1);
}

.hero-action {
  min-height: 50px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  border-radius: 999px;
  font-size: .82rem;
  font-weight: 760;
  transition: transform .32s cubic-bezier(.22, 1, .36, 1), background-color .25s, border-color .25s, box-shadow .32s;
}

.hero-action svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.6; transition: transform .32s cubic-bezier(.22, 1, .36, 1); }
.hero-action--primary { min-height: 52px; color: #140f04; border: 1px solid rgba(217, 180, 90, .9); background: linear-gradient(180deg, #d9b45a, #a8823a); box-shadow: 0 12px 30px rgba(198, 155, 82, .26); }
.hero-action--primary:hover { color: #140f04; border-color: #e3c06a; background: linear-gradient(180deg, #e3c06a, #b28d43); box-shadow: 0 18px 42px rgba(198, 155, 82, .38); transform: translateY(-2px); }
.hero-action--primary:hover svg { transform: translateX(3px); }
.hero-action--primary:active { box-shadow: 0 8px 18px rgba(198, 155, 82, .3); transform: translateY(0); }
.hero-action--secondary { min-height: 44px; color: rgba(245, 240, 230, .72); border: 1px solid transparent; background: transparent; box-shadow: none; }
.hero-action--secondary:hover { color: #f5f0e6; border-color: transparent; background: rgba(255, 255, 255, .08); box-shadow: none; transform: translateY(-2px); }
.hero-action--secondary:active { box-shadow: none; transform: translateY(0); }

.hero-action--quiet {
  min-height: 52px;
  display: inline-flex;
  align-items: center;
  padding: 0 8px;
  color: rgba(252, 249, 242, .78);
  font-size: .8rem;
  font-weight: 700;
  text-decoration: underline;
  text-decoration-color: rgba(198, 155, 82, .45);
  text-underline-offset: 6px;
  transition: color .25s, text-decoration-color .25s;
}
.hero-action--quiet:hover { color: var(--myst-gold-soft); text-decoration-color: var(--myst-gold-soft); }

.connection-bar {
  width: 100%;
  display: grid;
  grid-template-columns: .8fr .8fr 1.35fr;
  overflow: hidden;
  border: 1px solid rgba(198, 155, 82, .4);
  border-radius: 16px;
  background: rgba(8, 21, 26, .55);
  box-shadow: 0 20px 48px rgba(3, 9, 14, .4);
  backdrop-filter: blur(17px) saturate(1.08);
  opacity: 0;
  transform: translateY(14px);
  transition: opacity .8s .5s cubic-bezier(.22, 1, .36, 1), transform .8s .5s cubic-bezier(.22, 1, .36, 1);
}

.connection-bar > * { min-width: 0; min-height: 64px; padding: 10px 16px; }
.connection-bar > * + * { border-left: 1px solid rgba(198, 155, 82, .26); }
.connection-status, .connection-address { display: flex; align-items: center; gap: 10px; text-align: left; }
.connection-status__dot { flex: 0 0 auto; width: 9px; height: 9px; border-radius: 50%; background: #7f8985; }
.connection-status__dot.is-online { background: #4ecb8d; box-shadow: 0 0 0 4px rgba(78, 203, 141, .14); }
.connection-status__dot.is-offline { background: #d47a5c; }
.connection-status__dot.is-loading { background: var(--myst-gold); }
.connection-editions { display: flex; flex-direction: column; justify-content: center; text-align: left; }
.connection-bar small { display: block; margin-bottom: 5px; color: rgba(255, 255, 255, .55); font: 600 .55rem/1 "IBM Plex Mono", monospace; letter-spacing: .11em; text-transform: uppercase; }
.connection-bar strong { color: #fff; font: 650 .68rem/1.2 "IBM Plex Mono", monospace; }
.connection-address { justify-content: space-between; gap: 12px; border: 0; color: #fcf9f2; background: transparent; cursor: pointer; }
.connection-address:hover strong { color: var(--myst-gold-soft); }
.connection-address__pill {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid rgba(198, 155, 82, .5);
  border-radius: 999px;
  color: var(--myst-gold);
  font-size: .63rem;
  font-weight: 650;
  letter-spacing: .06em;
  text-transform: uppercase;
  white-space: nowrap;
  background: rgba(212, 175, 74, .14);
  transition: background-color .25s, border-color .25s, color .25s;
}
.connection-address__pill svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; }
.connection-address:hover .connection-address__pill { border-color: var(--myst-gold-soft); color: #140f04; background: var(--myst-gold); }
.connection-address__pill.is-copied { border-color: rgba(126, 217, 163, .6); color: #7ed9a3; background: rgba(126, 217, 163, .1); }

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
  text-shadow: 0 2px 13px rgba(3, 9, 14, .65);
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(198, 155, 82, .3);
  background: rgba(8, 21, 26, .55);
  backdrop-filter: blur(8px);
}

.scroll-cue i { position: relative; width: 22px; height: 37px; overflow: hidden; border: 1px solid rgba(252, 249, 242, .55); border-radius: 999px; }
.scroll-cue b { position: absolute; top: 7px; left: 50%; width: 3px; height: 8px; border-radius: 3px; background: var(--myst-gold-soft); transform: translateX(-50%); animation: scroll-cue 1.9s cubic-bezier(.22, 1, .36, 1) infinite; }

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
.fog-message i { width: 1px; height: 54px; background: linear-gradient(rgba(215, 185, 120, .8), transparent); }

@keyframes scroll-cue {
  0% { opacity: 0; transform: translate(-50%, -4px); }
  25%, 70% { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, 14px); }
}

@media (max-width: 720px) {
  .hero { min-height: 165svh; }
  .hero-sticky { min-height: 100svh; }
  .hero-content { top: 17svh; padding-inline: 15px; }
  .hero-eyebrow { margin-bottom: 12px; font-size: .56rem; }
  .hero-eyebrow i { width: 22px; }
  .hero h1 { max-width: 620px; font-size: clamp(4.1rem, 19vw, 7rem); line-height: .82; }
  .hero-summary { max-width: 510px; margin-bottom: 22px; font-size: .92rem; line-height: 1.46; }
  .hero-actions { margin-bottom: 20px; }
  .hero-action { flex: 1 1 170px; min-height: 48px; justify-content: space-between; }
  .hero-action--primary { min-height: 50px; }
  .hero-action--quiet { flex: 0 0 auto; min-height: 44px; }
  .connection-bar { grid-template-columns: 1fr 1fr; }
  .connection-address { grid-column: 1 / -1; border-top: 1px solid rgba(198, 155, 82, .26); }
  .connection-bar > .connection-address { border-left: 0; }
  .scroll-cue { bottom: 12px; max-width: calc(100% - 30px); white-space: nowrap; }
}

@media (max-width: 420px) {
  .hero-content { padding-inline: 11px; }
  .hero h1 { font-size: clamp(3.65rem, 18vw, 5.1rem); }
  .hero-summary { font-size: .84rem; }
  .hero-actions { width: 100%; }
  .connection-bar { grid-template-columns: 1fr; }
  .connection-bar > * + * { border-top: 1px solid rgba(198, 155, 82, .26); border-left: 0; }
  .connection-address { grid-column: auto; }
  .scroll-cue span { font-size: .54rem; letter-spacing: .1em; }
}

@media (max-width: 720px) and (max-height: 690px) {
  .hero { min-height: auto; }
  .hero-sticky { position: relative; height: auto; min-height: max(620px, 100svh); padding: calc(82px + env(safe-area-inset-top)) 10px 62px; }
  .hero-content { position: relative; inset: auto; top: auto; left: auto; right: auto; width: 100%; transform: none; opacity: 1; padding-inline: 0; }
  .hero h1 { font-size: clamp(3.35rem, 16vw, 4.5rem); }
  .hero-summary { max-width: 430px; margin-bottom: 18px; font-size: .8rem; }
  .hero-actions { margin-bottom: 16px; }
  .connection-bar { grid-template-columns: 1fr 1fr; }
  .connection-bar > * { min-height: 52px; padding: 8px 11px; }
  .connection-address { grid-column: 1 / -1; }
  .scroll-cue { display: none; }
}

@media (max-height: 690px) and (min-width: 721px) {
  .hero-content { top: 12svh; }
  .hero h1 { font-size: clamp(4.2rem, 10vw, 7rem); }
  .hero-summary { margin-bottom: 24px; }
  .hero-actions { margin-bottom: 20px; }
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
  .hero-slide { transform: none; transition: none; will-change: auto; }
  .hero-slide:nth-of-type(n + 2) { display: none; }
  .hero-content { opacity: 1; transform: none; }
  .hero-eyebrow, .hero h1, .hero-summary, .hero-actions, .connection-bar { opacity: 1; transform: none; transition: none; }
  .scroll-cue b { animation: none; }
}
</style>
