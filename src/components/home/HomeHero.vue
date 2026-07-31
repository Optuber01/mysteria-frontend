<template>
  <section
    ref="hero"
    class="arrival"
    aria-labelledby="home-title"
    :style="{ '--arrival': String(progress) }"
  >
    <div class="arrival-sticky">
      <div class="arrival-scene" aria-hidden="true">
        <img
          class="scene-base"
          src="@/assets/images/optimized/Server.webp"
          alt=""
          width="1920"
          height="1080"
          fetchpriority="high"
        >
        <img
          class="scene-memory"
          src="@/assets/images/optimized/banner.webp"
          alt=""
          width="1920"
          height="1080"
        >
        <div class="scene-depth scene-depth--one" />
        <div class="scene-depth scene-depth--two" />
        <div class="scene-shade" />
      </div>

      <div class="guiding-artifact" aria-hidden="true">
        <i class="artifact-halo" />
        <i class="artifact-ring artifact-ring--outer" />
        <i class="artifact-ring artifact-ring--inner" />
        <i class="artifact-axis artifact-axis--x" />
        <i class="artifact-axis artifact-axis--y" />
        <b />
      </div>

      <div class="arrival-copy">
        <div class="arrival-brand">
          <img src="/logo.webp" alt="" width="64" height="64">
          <span>Minecraft RPG server</span>
        </div>
        <p class="arrival-kicker">Choose a Pathway. Earn every advance.</p>
        <h1 id="home-title">{{ t('serverName') }}</h1>
        <p class="arrival-lede">
          Brew potions and complete rituals to advance through a
          Lord of the Mysteries-inspired Minecraft world.
        </p>
        <div class="arrival-actions">
          <RouterLink class="arrival-primary" to="/guide">
            Start playing <span aria-hidden="true">↗</span>
          </RouterLink>
          <a href="#pathways">Choose a Pathway <span aria-hidden="true">↓</span></a>
        </div>
      </div>

      <div class="connection-dock" aria-label="Server connection details">
        <div class="status-reading">
          <i :class="`state-${status.state}`" />
          <span>
            <small>Server</small>
            <strong>{{ statusLabel }}</strong>
          </span>
        </div>
        <div class="edition-reading">
          <span>Java</span>
          <span>Bedrock</span>
        </div>
        <button type="button" @click="copyAddress">
          <span>
            <small>Address</small>
            <strong>{{ MYSTERRIA_ADDRESS }}</strong>
          </span>
          <b>{{ copied ? 'Copied' : 'Copy' }}</b>
        </button>
      </div>

      <a class="arrival-scroll" href="#pathways">
        <span>Follow the light</span>
        <i aria-hidden="true" />
      </a>
    </div>
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
const progress = ref(0);
const copied = ref(false);
let observer: IntersectionObserver | null = null;
let visible = false;
let frame = 0;
let timer: ReturnType<typeof setTimeout> | null = null;

const statusLabel = computed(() => {
  if (props.status.state === 'online') {
    return props.status.playersOnline === null ? 'Online' : `${props.status.playersOnline} online`;
  }
  if (props.status.state === 'offline') return 'Offline';
  if (props.status.state === 'loading') return 'Checking…';
  return 'Unavailable';
});

function update() {
  if (!visible || !hero.value || reducedMotion.value) return;
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const rect = hero.value?.getBoundingClientRect();
    if (!rect) return;
    progress.value = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - innerHeight)));
  });
}

async function copyAddress() {
  try {
    await navigator.clipboard.writeText(MYSTERRIA_ADDRESS);
    copied.value = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => (copied.value = false), 1800);
  } catch {
    copied.value = false;
  }
}

onMounted(() => {
  observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) update();
  });
  if (hero.value) observer.observe(hero.value);
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update, { passive: true });
});

onUnmounted(() => {
  observer?.disconnect();
  removeEventListener('scroll', update);
  removeEventListener('resize', update);
  if (frame) cancelAnimationFrame(frame);
  if (timer) clearTimeout(timer);
});
</script>

<style scoped>
.arrival {
  --arrival: 0;
  position: relative;
  min-height: 165svh;
  color: #fcf9f2;
  background: #08151a;
}

.arrival-sticky {
  position: sticky;
  top: 0;
  height: 100svh;
  min-height: 680px;
  overflow: hidden;
  isolation: isolate;
}

.arrival-scene,
.arrival-scene img,
.scene-shade {
  position: absolute;
  inset: 0;
}

.arrival-scene { z-index: -2; background: #08151a; }
.arrival-scene img {
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  object-position: center;
  will-change: transform, opacity;
}

.scene-base {
  filter: saturate(.72) contrast(1.07);
  transform: scale(calc(1.03 + var(--arrival) * .18)) translate3d(calc(var(--arrival) * -2.2%), calc(var(--arrival) * -1%), 0);
}

.scene-memory {
  opacity: calc(.22 - var(--arrival) * .18);
  mix-blend-mode: screen;
  transform: scale(calc(1.09 + var(--arrival) * .24)) translate3d(calc(var(--arrival) * 2%), 0, 0);
}

.scene-depth {
  position: absolute;
  z-index: 1;
  bottom: -7%;
  width: 24vw;
  height: 42vh;
  opacity: calc(.82 - var(--arrival) * .5);
  background:
    linear-gradient(90deg, transparent 20%, rgba(3, 14, 17, .92) 20% 56%, transparent 56%),
    linear-gradient(rgba(3, 14, 17, .94) 33%, transparent 33%);
  background-size: 74px 74px;
  filter: blur(.2px);
  transform: translate3d(calc(var(--arrival) * -9vw), calc(var(--arrival) * 7vh), 0) scale(calc(1 + var(--arrival) * .12));
}

.scene-depth--one { left: -5vw; }
.scene-depth--two {
  right: -7vw;
  transform: translate3d(calc(var(--arrival) * 8vw), calc(var(--arrival) * 5vh), 0) scale(calc(1 + var(--arrival) * .18));
}

.scene-shade {
  z-index: 2;
  background:
    radial-gradient(circle at 71% 47%, transparent 0 4%, rgba(8, 21, 26, .08) 22%, transparent 40%),
    linear-gradient(90deg, rgba(8, 21, 26, .96), rgba(8, 21, 26, .52) 48%, rgba(8, 21, 26, .18)),
    linear-gradient(0deg, #08151a 0, transparent 37%, rgba(8, 21, 26, .68) 100%);
}

.guiding-artifact {
  position: absolute;
  z-index: 2;
  left: calc(72% - var(--arrival) * 22%);
  top: calc(47% + var(--arrival) * 3%);
  width: clamp(76px, 9vw, 136px);
  aspect-ratio: 1;
  transform: translate(-50%, -50%) scale(calc(.55 + var(--arrival) * 3.6));
  opacity: calc(.72 + var(--arrival) * .28);
  filter: drop-shadow(0 0 calc(18px + var(--arrival) * 30px) rgba(198, 155, 82, .46));
  will-change: transform, left, top;
}

.artifact-halo,
.artifact-ring,
.artifact-axis,
.guiding-artifact b {
  position: absolute;
  inset: 50%;
  transform: translate(-50%, -50%);
}

.artifact-halo {
  width: 68%;
  height: 68%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(239, 212, 146, .78), rgba(33, 100, 77, .34) 34%, transparent 70%);
}

.artifact-ring {
  border: 1px solid rgba(215, 185, 120, .72);
  border-radius: 50%;
}
.artifact-ring--outer { width: 100%; height: 100%; transform: translate(-50%, -50%) rotate(calc(var(--arrival) * 82deg)); }
.artifact-ring--inner { width: 62%; height: 62%; border-style: dashed; transform: translate(-50%, -50%) rotate(calc(var(--arrival) * -128deg)); }
.artifact-axis { width: 124%; height: 1px; background: linear-gradient(90deg, transparent, rgba(215, 185, 120, .6), transparent); }
.artifact-axis--y { transform: translate(-50%, -50%) rotate(90deg); }
.guiding-artifact b {
  width: 17%;
  height: 17%;
  border: 1px solid #f1dba8;
  background: #21644d;
  box-shadow: 0 0 16px rgba(215, 185, 120, .9);
  transform: translate(-50%, -50%) rotate(45deg);
}

.arrival-copy {
  position: absolute;
  z-index: 3;
  left: clamp(24px, 6vw, 92px);
  top: 50%;
  width: min(720px, calc(100% - 48px));
  transform: translateY(calc(-45% - var(--arrival) * 8vh));
  opacity: clamp(0, calc(1 - var(--arrival) * 1.8), 1);
  will-change: transform, opacity;
}

.arrival-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: clamp(34px, 7vh, 74px);
  color: rgba(252, 249, 242, .72);
  font: 600 10px/1 "IBM Plex Mono", monospace;
  letter-spacing: .16em;
  text-transform: uppercase;
}
.arrival-brand img { width: 54px; height: 54px; object-fit: contain; }
.arrival-kicker {
  margin: 0 0 15px;
  color: #e0bd71;
  font: 600 10px/1.3 "IBM Plex Mono", monospace;
  letter-spacing: .18em;
  text-transform: uppercase;
}
.arrival h1 {
  margin: 0;
  font: 700 clamp(5rem, 12vw, 10.5rem)/.76 "IBM Plex Sans Condensed", sans-serif;
  letter-spacing: -.07em;
}
.arrival-lede {
  max-width: 620px;
  margin: 30px 0 0;
  color: rgba(252, 249, 242, .76);
  font-size: clamp(1rem, 1.5vw, 1.2rem);
  line-height: 1.65;
}
.arrival-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 34px; }
.arrival-actions a {
  min-height: 50px;
  display: inline-flex;
  align-items: center;
  gap: 18px;
  padding: 0 20px;
  border: 1px solid rgba(252, 249, 242, .28);
  border-radius: 12px;
  color: #fcf9f2;
  background: rgba(8, 21, 26, .44);
  font-size: .83rem;
  font-weight: 750;
  backdrop-filter: blur(12px);
  transition: transform .35s cubic-bezier(.22, 1, .36, 1), border-color .25s, background-color .25s;
}
.arrival-actions a:hover { transform: translateY(-2px); border-color: rgba(252, 249, 242, .6); }
.arrival-actions .arrival-primary { color: #102924; background: #f5f0e6; border-color: #f5f0e6; }

.connection-dock {
  position: absolute;
  z-index: 3;
  left: clamp(24px, 6vw, 92px);
  bottom: clamp(26px, 6vh, 58px);
  width: min(820px, calc(100% - 48px));
  display: grid;
  grid-template-columns: 1fr auto 1.2fr;
  gap: 1px;
  overflow: hidden;
  border: 1px solid rgba(252, 249, 242, .17);
  border-radius: 16px;
  background: rgba(252, 249, 242, .12);
  opacity: clamp(0, calc(1 - var(--arrival) * 2.3), 1);
  backdrop-filter: blur(16px);
}
.connection-dock > * { min-height: 68px; background: rgba(8, 21, 26, .78); }
.status-reading,
.connection-dock button { display: flex; align-items: center; gap: 12px; padding: 12px 18px; }
.status-reading > i { width: 9px; height: 9px; border: 2px solid rgba(252, 249, 242, .2); border-radius: 50%; background: #71817e; }
.status-reading > i.state-online { background: #71c59f; }
.status-reading > i.state-offline { background: #ce8065; }
.connection-dock small { display: block; margin-bottom: 4px; color: rgba(252, 249, 242, .43); font: 500 8px/1 "IBM Plex Mono", monospace; letter-spacing: .12em; text-transform: uppercase; }
.connection-dock strong { color: #fcf9f2; font: 600 11px/1.2 "IBM Plex Mono", monospace; }
.edition-reading { min-width: 170px; display: flex; align-items: center; justify-content: center; gap: 7px; padding: 0 14px; }
.edition-reading span { padding: 7px 9px; border: 1px solid rgba(252, 249, 242, .18); border-radius: 7px; font: 600 9px/1 "IBM Plex Mono", monospace; text-transform: uppercase; }
.connection-dock button { justify-content: space-between; border: 0; color: #fcf9f2; cursor: pointer; text-align: left; }
.connection-dock button:hover { background: #16342e; }
.connection-dock button b { color: #e0bd71; font-size: .72rem; }

.arrival-scroll {
  position: absolute;
  z-index: 3;
  right: clamp(24px, 5vw, 74px);
  bottom: clamp(34px, 6vh, 62px);
  display: flex;
  align-items: center;
  gap: 13px;
  color: rgba(252, 249, 242, .6);
  font: 500 9px/1 "IBM Plex Mono", monospace;
  letter-spacing: .15em;
  text-transform: uppercase;
  opacity: clamp(0, calc(1 - var(--arrival) * 2), 1);
}
.arrival-scroll i { width: 42px; height: 1px; background: linear-gradient(90deg, #e0bd71, transparent); }

@media (max-width: 760px) {
  .arrival { min-height: 145svh; }
  .arrival-sticky { min-height: 710px; }
  .arrival-copy { left: 20px; top: 46%; width: calc(100% - 40px); }
  .arrival-brand { margin-bottom: 46px; }
  .arrival h1 { font-size: clamp(4.6rem, 23vw, 7rem); }
  .arrival-lede { margin-top: 22px; font-size: .98rem; }
  .arrival-actions { display: grid; }
  .arrival-actions a { justify-content: space-between; }
  .guiding-artifact {
    left: calc(78% - var(--arrival) * 28%);
    top: calc(31% + var(--arrival) * 19%);
  }
  .connection-dock {
    left: 20px;
    bottom: 20px;
    width: calc(100% - 40px);
    grid-template-columns: 1fr 1fr;
  }
  .connection-dock button { grid-column: 1 / -1; }
  .arrival-scroll { display: none; }
  .scene-shade {
    background:
      radial-gradient(circle at 78% 31%, transparent, rgba(8, 21, 26, .14) 28%, transparent 44%),
      linear-gradient(0deg, #08151a 0, rgba(8, 21, 26, .22) 58%, rgba(8, 21, 26, .7));
  }
}

@media (max-width: 260px) {
  .arrival { min-height: auto; }
  .arrival-sticky {
    position: relative;
    height: auto;
    min-height: 100svh;
    display: flex;
    flex-direction: column;
    padding: 76px 10px 14px;
    overflow: visible;
  }
  .arrival-copy {
    position: relative;
    inset: auto;
    width: 100%;
    transform: none;
    opacity: 1;
  }
  .arrival-brand { margin-bottom: 28px; gap: 8px; }
  .arrival-brand img { width: 40px; height: 40px; }
  .arrival-brand span { font-size: 7px; overflow-wrap: anywhere; }
  .arrival h1 { font-size: clamp(3rem, 25vw, 4rem); overflow-wrap: anywhere; }
  .arrival-lede { font-size: .78rem; }
  .arrival-actions a { min-width: 0; padding-inline: 10px; font-size: .7rem; }
  .guiding-artifact { left: auto; right: 8px; top: 88px; width: 58px; transform: none; }
  .connection-dock {
    position: relative;
    left: auto;
    bottom: auto;
    width: 100%;
    grid-template-columns: 1fr;
    margin-top: 26px;
    opacity: 1;
  }
  .edition-reading { min-width: 0; }
  .connection-dock button { grid-column: auto; min-width: 0; }
  .scene-depth { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .arrival { min-height: 100svh; }
  .arrival-sticky { position: relative; }
  .scene-base,
  .scene-memory,
  .scene-depth,
  .guiding-artifact,
  .arrival-copy { transform: none; }
}
</style>
