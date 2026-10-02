<template>
  <section
      ref="heroRef"
      class="bc-hero"
      aria-labelledby="bc-hero-title"
      @pointermove="onPointer"
      @pointerleave="onPointerLeave"
  >
    <div class="hero-stage" aria-hidden="true">
      <div class="stage-move">
        <div
            v-for="(scene, index) in scenes"
            :key="scene.id"
            :class="['scene', `scene-${scene.id}`, {active: index === active}]"
        >
          <img
              v-if="ready[index]"
              :src="scene.src"
              :srcset="`${scene.small} 1024w, ${scene.src} 1920w`"
              sizes="100vw"
              alt=""
              width="1920"
              height="1042"
              :fetchpriority="index === 0 ? 'high' : 'low'"
              decoding="async"
          >
        </div>
      </div>
      <div ref="lightRef" class="hero-light"></div>
      <div class="hero-scrim"></div>
      <div class="hero-scan"></div>
    </div>

    <div class="hero-inner bc-shell">
      <div class="hud-top">
        <span class="live-tag">
          <span :class="['pulse', statusClass]"></span>
          {{ t('home.broadcast.hero.live') }}
        </span>
        <span class="hud-season">{{ seasonLabel }}</span>
        <span class="hud-cam" aria-live="off">
          <span class="hud-cam-num">{{ t('home.broadcast.hero.cam') }} {{ String(active + 1).padStart(2, '0') }}</span>
          <Transition name="hud-swap" mode="out-in">
            <span :key="active" class="hud-cam-name">{{ t(`home.broadcast.hero.scenes.${scenes[active].id}`) }}</span>
          </Transition>
        </span>
      </div>

      <div class="hero-copy">
        <p class="hero-kicker">{{ t('home.broadcast.hero.kicker') }}</p>
        <h1 id="bc-hero-title" class="hero-title">
          <span class="line">{{ t('home.broadcast.hero.titleOne') }}</span>
          <span class="line accent">{{ t('home.broadcast.hero.titleTwo') }}</span>
        </h1>
        <p class="hero-sub">{{ t('home.broadcast.hero.sub') }}</p>

        <div class="hero-actions">
          <RouterLink :to="$lp('/guide/connect')" class="bc-btn bc-btn-primary">
            {{ t('home.broadcast.hero.join') }}
            <span class="bc-arrow" aria-hidden="true">→</span>
          </RouterLink>

          <button
              type="button"
              :class="['address', copyState]"
              :aria-label="t('home.broadcast.copy.aria').replace('{address}', address)"
              @click="copy"
          >
            <span class="address-label">{{ t('home.broadcast.copy.label') }}</span>
            <span class="address-ip">{{ address }}</span>
            <span class="address-action">
              <i :class="copyState === 'copied' ? 'fa-solid fa-check' : copyState === 'failed' ? 'fa-solid fa-xmark' : 'fa-solid fa-copy'" aria-hidden="true"></i>
              <span>{{ copyLabel }}</span>
            </span>
          </button>

          <a href="#pathways" class="bc-btn bc-btn-ghost hero-pathways">
            {{ t('home.broadcast.hero.pathways') }}
          </a>
        </div>
        <p class="copy-feedback" role="status" aria-live="polite">{{ copyFeedback }}</p>
      </div>

      <div class="hero-bottom">
        <dl class="hero-stats">
          <div class="stat stat-online">
            <dt>{{ t('home.broadcast.stats.online') }}</dt>
            <dd>
              <span :class="['dot', statusClass]" aria-hidden="true"></span>
              <span class="stat-value">{{ onlineValue }}</span>
              <span class="stat-unit">{{ onlineUnit }}</span>
            </dd>
          </div>
          <div class="stat">
            <dt>{{ t('home.broadcast.stats.beyonders') }}</dt>
            <dd><span class="stat-value">{{ beyondersValue }}</span></dd>
          </div>
          <div class="stat">
            <dt>{{ t('home.broadcast.stats.season') }}</dt>
            <dd>
              <span class="stat-value">{{ season.numeral }}</span>
              <span class="stat-unit">{{ t('home.broadcast.stats.day').replace('{day}', String(season.day)) }}</span>
            </dd>
          </div>
          <div class="stat stat-paths">
            <dt>{{ t('home.broadcast.stats.pathways') }}</dt>
            <dd>
              <span class="stat-value">22</span>
              <span class="stat-unit">{{ t('home.broadcast.stats.boons') }}</span>
            </dd>
          </div>
        </dl>

        <div class="cams" role="group" :aria-label="t('home.broadcast.hero.camsLabel')">
          <button
              v-for="(scene, index) in scenes"
              :key="scene.id"
              type="button"
              :class="['cam', {active: index === active}]"
              :aria-pressed="index === active"
              :aria-label="t('home.broadcast.hero.showScene').replace('{name}', t(`home.broadcast.hero.scenes.${scene.id}`))"
              @click="select(index)"
          >
            <img :src="scene.thumb" alt="" width="320" height="174" decoding="async">
            <span class="cam-num" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="cam-bar" aria-hidden="true">
              <i
                  v-if="index === active"
                  :key="cycle"
                  :class="{paused: isPaused}"
                  @animationend="next"
              ></i>
            </span>
          </button>
          <button
              type="button"
              class="cam-toggle"
              :aria-label="userPaused ? t('home.broadcast.hero.play') : t('home.broadcast.hero.pause')"
              @click="userPaused = !userPaused"
          >
            <svg v-if="userPaused" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>
            <svg v-else viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor"/></svg>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {useServerStatus} from '@/composables/useServer';
import {useBeyonderStats} from '@/composables/useBeyonderStats';
import {prefersReducedMotion, seasonInfo, useAddressCopy, whenIdle} from './broadcast';
import riftLarge from './assets/hero-rift-1920.webp';
import riftSmall from './assets/hero-rift-1024.webp';
import riftThumb from './assets/thumb-rift.webp';
import coastLarge from './assets/hero-coast-1920.webp';
import coastSmall from './assets/hero-coast-1024.webp';
import coastThumb from './assets/thumb-coast.webp';
import dragonLarge from './assets/hero-dragon-1920.webp';
import dragonSmall from './assets/hero-dragon-1024.webp';
import dragonThumb from './assets/thumb-dragon.webp';

const {t, intlLocale} = useI18n();
const {isOnline, playerCount, checkedAt} = useServerStatus();
const {totalBeyonders} = useBeyonderStats();
const {state: copyState, copy, address} = useAddressCopy();
const season = seasonInfo();

const scenes = [
  {id: 'rift', src: riftLarge, small: riftSmall, thumb: riftThumb},
  {id: 'dragon', src: dragonLarge, small: dragonSmall, thumb: dragonThumb},
  {id: 'coast', src: coastLarge, small: coastSmall, thumb: coastThumb},
];

/* Only the first scene is in the first paint; the others arrive on idle. */
const ready = ref(scenes.map((_, index) => index === 0));
const active = ref(0);
const cycle = ref(0);
const userPaused = ref(prefersReducedMotion());
const inView = ref(true);
const isPaused = computed(() => userPaused.value || !inView.value);

const select = (index: number) => {
  ready.value[index] = true;
  active.value = index;
  cycle.value++;
};
const next = () => {
  if (isPaused.value) return;
  select((active.value + 1) % scenes.length);
};

const statusClass = computed(() => (checkedAt.value === null ? 'checking' : isOnline.value ? 'online' : 'offline'));
const seasonLabel = computed(() =>
  t('home.broadcast.hero.season').replace('{season}', season.numeral).replace('{day}', String(season.day)),
);
const onlineValue = computed(() => {
  if (checkedAt.value === null) return '…';
  if (!isOnline.value) return t('home.broadcast.stats.offline');
  return new Intl.NumberFormat(intlLocale.value).format(playerCount.value ?? 0);
});
const onlineUnit = computed(() => {
  if (checkedAt.value === null) return t('home.broadcast.stats.checking');
  return isOnline.value ? t('home.broadcast.stats.playersNow') : '';
});
const beyondersValue = computed(() =>
  totalBeyonders.value > 0
    ? new Intl.NumberFormat(intlLocale.value).format(totalBeyonders.value)
    : t('home.broadcast.stats.beyondersFallback'),
);

const copyLabel = computed(() =>
  copyState.value === 'copied' ? t('home.broadcast.copy.done')
    : copyState.value === 'failed' ? t('home.broadcast.copy.failedShort')
      : t('home.broadcast.copy.action'),
);
const copyFeedback = computed(() =>
  copyState.value === 'copied' ? t('home.broadcast.copy.doneLong')
    : copyState.value === 'failed' ? t('home.broadcast.copy.failed').replace('{address}', address)
      : '',
);

/* ── Depth: pointer light + parallax, one rAF ── */
const heroRef = ref<HTMLElement | null>(null);
const lightRef = ref<HTMLElement | null>(null);
let frame: number | null = null;
let pointerX = 0.5;
let pointerY = 0.4;
let reduced = false;
let finePointer = false;

const paint = () => {
  frame = null;
  const hero = heroRef.value;
  if (!hero) return;
  const y = Math.min(window.scrollY, hero.offsetHeight);
  hero.style.setProperty('--sy', y.toFixed(1));
  hero.style.setProperty('--px', (pointerX - 0.5).toFixed(4));
  hero.style.setProperty('--py', (pointerY - 0.5).toFixed(4));
  if (lightRef.value) {
    lightRef.value.style.transform = `translate3d(${(pointerX * hero.offsetWidth).toFixed(0)}px, ${(pointerY * hero.offsetHeight).toFixed(0)}px, 0)`;
  }
};
const schedule = () => {
  if (frame === null && !reduced) frame = requestAnimationFrame(paint);
};
const onPointer = (event: PointerEvent) => {
  if (!finePointer || !heroRef.value) return;
  const rect = heroRef.value.getBoundingClientRect();
  pointerX = (event.clientX - rect.left) / rect.width;
  pointerY = (event.clientY - rect.top) / rect.height;
  heroRef.value.classList.add('has-pointer');
  schedule();
};
const onPointerLeave = () => heroRef.value?.classList.remove('has-pointer');

let visibility: IntersectionObserver | null = null;

onMounted(() => {
  reduced = prefersReducedMotion();
  finePointer = window.matchMedia('(pointer: fine)').matches;
  paint();
  window.addEventListener('scroll', schedule, {passive: true});
  visibility = new IntersectionObserver(([entry]) => (inView.value = entry.isIntersecting), {threshold: 0.15});
  if (heroRef.value) visibility.observe(heroRef.value);
  whenIdle(() => (ready.value = scenes.map(() => true)), 2500);
});

onUnmounted(() => {
  window.removeEventListener('scroll', schedule);
  if (frame !== null) cancelAnimationFrame(frame);
  visibility?.disconnect();
});
</script>

<style scoped>
.bc-hero {
  --sy: 0;
  --px: 0;
  --py: 0;
  position: relative;
  min-height: max(100svh, 720px);
  display: flex;
  overflow: hidden;
  isolation: isolate;
  background: var(--bc-night);
  color: var(--bc-snow);
}

/* ── Stage ── */
.hero-stage {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
}

.stage-move {
  position: absolute;
  inset: -3%;
  transform: translate3d(calc(var(--px) * -18px), calc(var(--sy) * 0.28px + var(--py) * -12px), 0);
  will-change: transform;
}

.scene {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 1.1s ease;
}

.scene.active {
  opacity: 1;
}

.scene img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.04);
}

.scene.active img {
  animation: kenburns 9s linear both;
}

/* The Rift is symmetrical: slide it right so the eye sits beside the headline, not behind it. */
.scene-rift {
  left: 30%;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 30%);
  mask-image: linear-gradient(90deg, transparent, #000 30%);
}

.scene-rift img { object-position: 50% 40%; --kb-x: 0%; --kb-y: -1.5%; filter: brightness(1.2) saturate(1.1); }
.scene-coast img { object-position: 50% 45%; --kb-x: -2%; --kb-y: 0%; }
/* Mirrored so the Guardian rears up on the open side, away from the headline. */
.scene-dragon { transform: scaleX(-1); }
.scene-dragon img { object-position: 22% 40%; --kb-x: 2%; --kb-y: 1%; }
.scene-coast img { filter: brightness(1.12); }

@keyframes kenburns {
  from { transform: scale(1.04) translate3d(0, 0, 0); }
  to { transform: scale(1.13) translate3d(var(--kb-x), var(--kb-y), 0); }
}

.hero-light {
  position: absolute;
  top: 0;
  left: 0;
  width: 900px;
  height: 900px;
  margin: -450px 0 0 -450px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(152, 171, 255, 0.2), rgba(49, 80, 245, 0.08) 35%, transparent 65%);
  mix-blend-mode: screen;
  opacity: 0;
  transition: opacity .6s ease;
  pointer-events: none;
}

.bc-hero.has-pointer .hero-light {
  opacity: 1;
}

.hero-scrim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(7, 8, 12, 0.92) 0%, rgba(7, 8, 12, 0.72) 34%, rgba(7, 8, 12, 0.18) 66%, rgba(7, 8, 12, 0.3) 100%),
    linear-gradient(180deg, rgba(7, 8, 12, 0.65) 0%, transparent 22%, transparent 55%, rgba(7, 8, 12, 0.96) 100%);
}

/* A thin moving scanline sells "live feed" without noise textures. */
.hero-scan {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.025) 0 1px, transparent 1px 3px);
  pointer-events: none;
}

/* ── Content ── */
.hero-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  padding-top: calc(var(--site-header-stack, 104px) + clamp(16px, 3vh, 32px));
  padding-bottom: clamp(20px, 3.5vh, 36px);
  gap: clamp(24px, 4vh, 48px);
}

.hud-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 22px;
  font-family: var(--bc-font-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--bc-snow);
}

.live-tag {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 6px 12px 6px 10px;
  border-radius: 4px;
  background: var(--bc-blue);
  color: #fff;
  font-weight: 500;
}

.pulse,
.dot {
  position: relative;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--bc-mute);
  flex: none;
}

.pulse.online,
.dot.online {
  background: var(--bc-live);
}

.pulse.offline,
.dot.offline {
  background: var(--bc-alert);
}

.pulse.online::after,
.dot.online::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--bc-live);
  animation: ping 1.8s ease-out infinite;
}

@keyframes ping {
  from { transform: scale(1); opacity: 0.8; }
  to { transform: scale(3.2); opacity: 0; }
}

.hud-season {
  color: var(--bc-snow);
}

.hud-cam {
  margin-left: auto;
  display: inline-flex;
  gap: 12px;
  color: var(--bc-mute);
}

.hud-cam-num {
  color: var(--bc-blue-hi);
}

.hud-cam-name {
  display: inline-block;
  color: var(--bc-snow);
}

.hud-swap-enter-active,
.hud-swap-leave-active {
  transition: opacity .3s ease, transform .3s ease;
}

.hud-swap-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.hud-swap-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.hero-copy {
  margin-top: auto;
  max-width: 1120px;
}

.hero-kicker {
  margin: 0 0 18px;
  font-family: var(--bc-font-mono);
  font-size: 13px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--bc-blue-hi);
}

.hero-title {
  margin: 0;
  font-family: var(--bc-font-display);
  font-weight: 700;
  font-size: clamp(34px, 4.5vw, 80px);
  line-height: 1;
  letter-spacing: -0.035em;
}

.hero-title .line {
  display: block;
}

.hero-title .accent {
  color: transparent;
  -webkit-text-stroke: 0;
  background: linear-gradient(90deg, #fff 0%, #c9d3ff 55%, var(--bc-blue-hi) 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

.hero-sub {
  margin: 24px 0 0;
  max-width: 600px;
  font-size: clamp(16px, 1.3vw, 19px);
  line-height: 1.6;
  color: #d4d7e2;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 32px;
}

.address {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  min-height: 52px;
  padding: 0 8px 0 20px;
  border: 1px solid var(--bc-line-strong);
  border-radius: 999px;
  background: rgba(7, 8, 12, 0.55);
  backdrop-filter: blur(10px);
  color: var(--bc-snow);
  font: inherit;
  cursor: pointer;
  transition: border-color .25s ease, background-color .25s ease;
}

.address:hover {
  border-color: var(--bc-blue-hi);
}

.address-label {
  font-family: var(--bc-font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--bc-mute);
}

.address-ip {
  font-family: var(--bc-font-mono);
  font-size: 15px;
  font-weight: 500;
}

.address-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(243, 244, 248, 0.1);
  font-size: 14px;
  font-weight: 600;
  min-width: 92px;
  justify-content: center;
  transition: background-color .25s ease, color .25s ease;
}

.address.copied .address-action {
  background: var(--bc-live);
  color: var(--bc-ink);
}

.address.failed .address-action {
  background: var(--bc-alert);
  color: var(--bc-ink);
}

.copy-feedback {
  min-height: 1.5em;
  margin: 10px 0 0 4px;
  font-size: 14px;
  color: var(--bc-mute);
}

/* ── Lower third ── */
.hero-bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--bc-line);
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(4, auto);
  gap: 0;
  margin: 0;
}

.stat {
  padding: 0 clamp(16px, 2.4vw, 36px);
  border-left: 1px solid var(--bc-line);
}

.stat:first-child {
  padding-left: 0;
  border-left: 0;
}

.stat dt {
  font-family: var(--bc-font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--bc-mute);
  white-space: nowrap;
}

.stat dd {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 8px 0 0;
  white-space: nowrap;
}

.stat .dot {
  align-self: center;
}

.stat-value {
  font-family: var(--bc-font-display);
  font-weight: 600;
  font-size: clamp(22px, 2.1vw, 32px);
  line-height: 1;
  letter-spacing: -0.02em;
}

.stat-unit {
  font-size: 14px;
  color: var(--bc-mute);
}

.cams {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.cam {
  position: relative;
  width: 112px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: none;
  cursor: pointer;
  overflow: hidden;
  opacity: 0.55;
  transition: opacity .3s ease, transform .3s var(--bc-ease);
}

.cam:hover,
.cam.active {
  opacity: 1;
}

.cam:hover {
  transform: translateY(-3px);
}

.cam img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 6px;
}

.cam-num {
  position: absolute;
  top: 6px;
  left: 8px;
  font-family: var(--bc-font-mono);
  font-size: 10px;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
}

.cam-bar {
  display: block;
  height: 3px;
  margin-top: 6px;
  border-radius: 2px;
  background: rgba(243, 244, 248, 0.18);
  overflow: hidden;
}

.cam-bar i {
  display: block;
  height: 100%;
  background: var(--bc-blue-hi);
  transform-origin: left;
  animation: cam-progress 7s linear forwards;
}

.cam-bar i.paused {
  animation-play-state: paused;
}

@keyframes cam-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.cam-toggle {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin-bottom: 9px;
  border: 1px solid var(--bc-line-strong);
  border-radius: 50%;
  background: rgba(7, 8, 12, 0.5);
  color: var(--bc-snow);
  cursor: pointer;
}

.cam-toggle:hover {
  border-color: var(--bc-snow);
}

/* ── Responsive ── */
@media (min-width: 1600px) {
  .scene-rift {
    left: 36%;
  }
}

@media (max-width: 1180px) and (min-width: 861px) {
  .scene-rift {
    left: 40%;
  }
}

@media (max-width: 1180px) {
  .hero-bottom {
    flex-direction: column;
    align-items: stretch;
  }

  .cams {
    justify-content: flex-start;
  }
}

@media (max-width: 860px) {
  .scene-rift {
    left: 0;
    -webkit-mask-image: none;
    mask-image: none;
  }

  .hero-scrim {
    background:
      linear-gradient(180deg, rgba(7, 8, 12, 0.7) 0%, rgba(7, 8, 12, 0.35) 26%, rgba(7, 8, 12, 0.7) 52%, rgba(7, 8, 12, 0.97) 100%);
  }

  .hud-cam {
    margin-left: 0;
    width: 100%;
  }

  .hero-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 18px 0;
  }

  .stat:nth-child(3) {
    padding-left: 0;
    border-left: 0;
  }
}

@media (max-width: 560px) {
  .hero-inner {
    gap: 20px;
  }

  .hero-sub {
    margin-top: 16px;
  }

  .hero-actions {
    margin-top: 24px;
  }

  .hero-actions > * {
    width: 100%;
  }

  .address {
    justify-content: space-between;
    padding-left: 18px;
  }

  .address-label {
    display: none;
  }

  .hud-cam {
    display: none;
  }

  .stat {
    padding: 0 14px;
  }

  .cam {
    width: 76px;
  }

  .cam-num {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stage-move {
    transform: none;
  }

  .scene.active img {
    animation: none;
  }
}
</style>
