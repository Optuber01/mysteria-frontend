<template>
  <section
    ref="hero"
    class="home-hero"
    aria-labelledby="home-title"
    :style="{ '--hero-progress': heroProgress }"
  >
    <div class="hero-scene" aria-hidden="true">
      <img
        class="hero-scene__back"
        src="@/assets/images/optimized/Server.webp"
        alt=""
        fetchpriority="high"
        width="1920"
        height="1080"
      >
      <img
        class="hero-scene__front"
        src="@/assets/images/optimized/banner.webp"
        alt=""
        width="1920"
        height="1080"
      >
      <div class="hero-scene__wash" />
      <svg class="hero-chart" viewBox="0 0 900 500">
        <path d="M70 372 C220 210 318 430 454 250 S690 170 826 82" />
        <circle cx="70" cy="372" r="5" />
        <circle cx="454" cy="250" r="5" />
        <circle cx="826" cy="82" r="5" />
      </svg>
    </div>

    <div class="hero-shell">
      <div class="hero-brand">
        <img src="/logo.webp" alt="" width="96" height="96">
        <span>Minecraft RPG server</span>
      </div>
      <div class="hero-copy">
        <p class="hero-kicker">Choose a Pathway. Earn every advance.</p>
        <h1 id="home-title">{{ t('serverName') }}</h1>
        <p class="hero-lede">
          {{ t('home.heroSubtitleHome') }}. Brew potions, complete rituals and
          build a character whose abilities change how you play Minecraft.
        </p>
        <div class="hero-actions">
          <RouterLink class="home-button home-button--primary" to="/guide">
            Start playing
            <span aria-hidden="true">↗</span>
          </RouterLink>
          <a class="home-button home-button--glass" href="#progression">
            Explore the systems
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>

      <div class="server-bar" aria-label="Server connection details">
        <div class="server-state">
          <span class="status-dot" :class="`status-dot--${status.state}`" />
          <span>
            <small>Server status</small>
            <strong>{{ statusLabel }}</strong>
          </span>
        </div>
        <div class="server-platforms">
          <span>Java</span>
          <span>Bedrock</span>
        </div>
        <button class="server-address" type="button" @click="copyAddress">
          <span>
            <small>Server address</small>
            <strong>{{ MYSTERRIA_ADDRESS }}</strong>
          </span>
          <span class="copy-label">{{ copied ? 'Copied' : 'Copy' }}</span>
        </button>
      </div>
    </div>

    <a class="hero-scroll" href="#progression">
      <span>Scroll to progress</span>
      <i aria-hidden="true" />
    </a>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from '@/composables/useI18n';
import { useReducedMotion } from '@/composables/useReducedMotion';
import { MYSTERRIA_ADDRESS, type ServerStatus } from '@/services/serverStatus';

const props = defineProps<{ status: ServerStatus }>();
const { t } = useI18n();
const reducedMotion = useReducedMotion();
const hero = ref<HTMLElement | null>(null);
const heroProgress = ref('0');
const copied = ref(false);
let observer: IntersectionObserver | null = null;
let active = false;
let frame = 0;
let copiedTimer: ReturnType<typeof setTimeout> | null = null;

const statusLabel = computed(() => {
  if (props.status.state === 'loading') return 'Checking…';
  if (props.status.state === 'online') {
    return props.status.playersOnline === null
      ? 'Online'
      : `${props.status.playersOnline} online`;
  }
  if (props.status.state === 'offline') return 'Offline';
  return 'Status unavailable';
});

function updateDepth() {
  if (!active || reducedMotion.value || !hero.value) return;
  if (frame) cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    const rect = hero.value?.getBoundingClientRect();
    if (!rect) return;
    heroProgress.value = String(Math.min(1, Math.max(0, -rect.top / rect.height)));
  });
}

async function copyAddress() {
  try {
    await navigator.clipboard.writeText(MYSTERRIA_ADDRESS);
    copied.value = true;
    if (copiedTimer) clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => (copied.value = false), 1800);
  } catch {
    copied.value = false;
  }
}

onMounted(() => {
  observer = new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting;
    if (active) updateDepth();
  });
  if (hero.value) observer.observe(hero.value);
  window.addEventListener('scroll', updateDepth, { passive: true });
});

onUnmounted(() => {
  observer?.disconnect();
  window.removeEventListener('scroll', updateDepth);
  if (frame) cancelAnimationFrame(frame);
  if (copiedTimer) clearTimeout(copiedTimer);
});
</script>

<style scoped>
.home-hero {
  --hero-progress: 0;
  position: relative;
  min-height: max(760px, 100svh);
  display: grid;
  align-items: end;
  overflow: clip;
  color: #fcf9f2;
  background: #08151a;
  isolation: isolate;
}

.hero-scene,
.hero-scene::after,
.hero-scene__wash {
  position: absolute;
  inset: 0;
}

.hero-scene {
  z-index: -1;
  overflow: hidden;
  background: #08151a;
}

.hero-scene img {
  position: absolute;
  inset: -6%;
  width: 112%;
  max-width: none;
  height: 112%;
  object-fit: cover;
  object-position: center;
}

.hero-scene__back {
  opacity: .86;
  transform: scale(calc(1.04 + var(--hero-progress) * .08));
  filter: saturate(.72) contrast(1.04);
}

.hero-scene__front {
  opacity: calc(.24 - var(--hero-progress) * .15);
  mix-blend-mode: screen;
  transform: scale(calc(1.1 + var(--hero-progress) * .12)) translateY(calc(var(--hero-progress) * -2%));
}

.hero-scene__wash {
  background:
    linear-gradient(90deg, rgba(8, 21, 26, .96) 0%, rgba(8, 21, 26, .72) 44%, rgba(8, 21, 26, .18) 76%),
    linear-gradient(0deg, #08151a 0%, rgba(8, 21, 26, .06) 44%, rgba(8, 21, 26, .6) 100%);
}

.hero-scene::after {
  content: "";
  opacity: .12;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.3'/%3E%3C/svg%3E");
  pointer-events: none;
}

.hero-chart {
  position: absolute;
  right: -6vw;
  top: 13%;
  width: min(58vw, 900px);
  opacity: .38;
  overflow: visible;
  transform: translateY(calc(var(--hero-progress) * -36px));
}

.hero-chart path,
.hero-chart circle {
  fill: none;
  stroke: #c69b52;
  stroke-width: 1.2;
  vector-effect: non-scaling-stroke;
}

.hero-chart path { stroke-dasharray: 3 12; }
.hero-chart circle { fill: #c69b52; }

.hero-shell {
  width: min(1420px, 100%);
  margin: 0 auto;
  padding: 130px clamp(20px, 5vw, 72px) 86px;
}

.hero-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: clamp(50px, 9vh, 110px);
  font: 600 11px/1.2 "IBM Plex Mono", monospace;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: rgba(252, 249, 242, .75);
}

.hero-brand img {
  width: 58px;
  height: 58px;
  object-fit: contain;
  filter: drop-shadow(0 12px 26px rgba(0, 0, 0, .3));
}

.hero-copy { max-width: 780px; }
.hero-kicker {
  margin: 0 0 17px;
  font: 600 12px/1.2 "IBM Plex Mono", monospace;
  letter-spacing: .17em;
  text-transform: uppercase;
  color: #d7b978;
}

h1 {
  margin: 0;
  font: 700 clamp(4.4rem, 11vw, 9.4rem)/.78 "IBM Plex Sans Condensed", sans-serif;
  letter-spacing: -.065em;
  text-wrap: balance;
}

.hero-lede {
  max-width: 670px;
  margin: 32px 0 0;
  color: rgba(252, 249, 242, .78);
  font-size: clamp(1rem, 1.7vw, 1.25rem);
  line-height: 1.65;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 36px;
}

.home-button {
  min-height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 0 22px;
  border: 1px solid transparent;
  border-radius: 14px;
  font-weight: 700;
  transition: transform .3s cubic-bezier(.22, 1, .36, 1), background .3s, border-color .3s;
}

.home-button:hover { transform: translateY(-2px); }
.home-button--primary { background: #f5f0e6; color: #102924; }
.home-button--primary:hover { background: #fff; color: #102924; }
.home-button--glass {
  background: rgba(8, 21, 26, .48);
  border-color: rgba(252, 249, 242, .24);
  color: #fcf9f2;
  backdrop-filter: blur(12px);
}

.server-bar {
  max-width: 940px;
  display: grid;
  grid-template-columns: 1fr auto minmax(240px, .8fr);
  align-items: stretch;
  gap: 1px;
  margin-top: clamp(60px, 10vh, 116px);
  overflow: hidden;
  border: 1px solid rgba(252, 249, 242, .14);
  border-radius: 18px;
  background: rgba(252, 249, 242, .12);
  box-shadow: 0 24px 70px rgba(0, 0, 0, .2);
  backdrop-filter: blur(18px);
}

.server-state,
.server-address {
  min-height: 74px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  color: #fcf9f2;
  background: rgba(8, 21, 26, .78);
}

.server-state small,
.server-address small {
  display: block;
  margin-bottom: 3px;
  color: rgba(252, 249, 242, .5);
  font: 500 9px/1.2 "IBM Plex Mono", monospace;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.server-state strong,
.server-address strong {
  font: 600 13px/1.2 "IBM Plex Mono", monospace;
}

.status-dot {
  width: 10px;
  height: 10px;
  flex: none;
  border: 2px solid rgba(252, 249, 242, .22);
  border-radius: 50%;
  background: #71817e;
}

.status-dot--online { background: #68c19c; border-color: #a6dfc7; }
.status-dot--offline { background: #c98267; border-color: #efbba8; }
.status-dot--loading { animation: status-pulse 1.2s ease infinite alternate; }

.server-platforms {
  min-width: 188px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 18px;
  background: rgba(8, 21, 26, .78);
}

.server-platforms span {
  padding: 7px 11px;
  border: 1px solid rgba(252, 249, 242, .16);
  border-radius: 8px;
  font: 600 10px/1 "IBM Plex Mono", monospace;
  text-transform: uppercase;
}

.server-address {
  justify-content: space-between;
  border: 0;
  cursor: pointer;
  text-align: left;
}

.server-address:hover { background: #16342e; }
.copy-label { color: #d7b978; font-size: 12px; font-weight: 700; }

.hero-scroll {
  position: absolute;
  right: clamp(20px, 5vw, 72px);
  bottom: 40px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(252, 249, 242, .62);
  font: 500 10px/1 "IBM Plex Mono", monospace;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.hero-scroll i {
  width: 28px;
  height: 44px;
  border: 1px solid rgba(252, 249, 242, .3);
  border-radius: 20px;
}

.hero-scroll i::after {
  content: "";
  display: block;
  width: 2px;
  height: 8px;
  margin: 9px auto;
  border-radius: 2px;
  background: #d7b978;
}

@keyframes status-pulse {
  to { opacity: .45; }
}

@media (max-width: 760px) {
  .home-hero { min-height: max(720px, 100svh); }
  .hero-shell { padding-top: 112px; padding-bottom: 54px; }
  .hero-brand { margin-bottom: 60px; }
  .hero-brand img { width: 46px; height: 46px; }
  h1 { font-size: clamp(4rem, 24vw, 6.5rem); }
  .hero-lede { margin-top: 24px; }
  .hero-actions { display: grid; }
  .server-bar { grid-template-columns: 1fr 1fr; margin-top: 54px; }
  .server-platforms { min-width: 0; }
  .server-address { grid-column: 1 / -1; }
  .hero-scroll { display: none; }
  .hero-scene__wash {
    background:
      linear-gradient(0deg, #08151a 0%, rgba(8, 21, 26, .48) 60%, rgba(8, 21, 26, .7) 100%),
      linear-gradient(90deg, rgba(8, 21, 26, .85), transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-scene__back,
  .hero-scene__front,
  .hero-chart { transform: none; }
  .status-dot--loading { animation: none; }
}
</style>
