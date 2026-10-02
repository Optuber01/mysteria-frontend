<template>
  <section id="ascent-top" ref="rootRef" :class="['hero', {'has-display-font': fontReady, 'is-font-fallback': fontFallback}]" aria-labelledby="ascent-hero-title">
    <div class="hero__bg" aria-hidden="true">
      <img
          class="hero__ground"
          :src="ground"
          :srcset="`${groundSmall} 960w, ${ground} 1920w`"
          sizes="100vw"
          alt=""
          width="1920"
          height="1009"
          fetchpriority="high"
          decoding="async"
      >
      <div class="hero__shaft"></div>
      <div class="hero__numeral"><span>9</span></div>
      <div class="hero__fog hero__fog--far"></div>
      <div class="hero__fog hero__fog--near"></div>
      <div class="hero__shade"></div>
    </div>

    <div class="a-shell hero__inner">
      <p class="hero__eyebrow">
        <span class="hero__eyebrow-mark" aria-hidden="true"></span>
        {{ t('home.ascent.hero.eyebrow') }}
      </p>

      <h1 id="ascent-hero-title" class="hero__title">
        <span class="hero__line">{{ t('home.ascent.hero.titleA') }}</span>
        <span class="hero__line hero__line--lit">{{ t('home.ascent.hero.titleB') }}</span>
      </h1>

      <p class="hero__lede">{{ t('home.ascent.hero.lede') }}</p>

      <div class="hero__actions">
        <RouterLink :to="$lp('/guide/connect')" class="a-btn a-btn--primary hero__join">
          {{ t('home.ascent.hero.join') }}
          <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
        </RouterLink>
        <AscentIp class="hero__ip"/>
      </div>

      <ul class="hero__facts">
        <li class="hero__status" :class="statusClass">
          <span class="hero__dot" aria-hidden="true"></span>
          <span>{{ statusText }}</span>
        </li>
        <li>{{ t('home.ascent.hero.clients') }}</li>
        <li>
          <RouterLink :to="latestTo" class="hero__news">
            <span class="hero__news-label">{{ t('home.ascent.hero.latest') }}</span>
            <span class="hero__news-title">{{ latestTitle }}</span>
            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </RouterLink>
        </li>
      </ul>
    </div>

    <a href="#pathways" class="hero__cue">
      <span>{{ t('home.ascent.hero.cue') }}</span>
      <span class="hero__cue-line" aria-hidden="true"></span>
    </a>
  </section>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {useLocalePath} from '@/composables/useLocalePath';
import {useServerStatus} from '@/composables/useServer';
import AscentIp from './AscentIp.vue';
import {useScrollProgress} from './useAscentScroll';
import ground from './img/ground.webp';
import groundSmall from './img/ground-960.webp';

const props = defineProps<{ latest: { title: string; slug: string } | null }>();

const {t} = useI18n();
const {localePath} = useLocalePath();
const {isOnline, playerCount, checkedAt} = useServerStatus();
const rootRef = ref<HTMLElement | null>(null);
useScrollProgress(rootRef, 'through');

/* The hero copy and giant numeral appear in their real faces, so the
   fallback-to-webfont swap never reflows anything on screen (CLS). A short
   timeout keeps a slow font from holding the first screen hostage. */
const fontReady = ref(false);
/* Set when the display face missed its window: the title then shrinks to fit
   the wider fallback face instead of running off the screen. */
const fontFallback = ref(false);
onMounted(() => {
  let done = false;
  const reveal = () => {
    if (done) return;
    done = true;
    // let the fixed header settle its height for the new faces first
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fontReady.value = true;
    }));
  };
  if (!document.fonts?.load) return reveal();
  window.setTimeout(() => {
    if (!done) fontFallback.value = true;
    reveal();
  }, 1800);
  const check = () => Promise.all([
    document.fonts.load('800 100px "Alumni Sans"'),
    document.fonts.load('400 16px "Golos Text"'),
    document.fonts.load('400 12px "IBM Plex Mono"'),
  ]).then(results => {
    if (results.every(faces => faces.length)) reveal();
    else if (!done) window.setTimeout(check, 150);
  }).catch(reveal);
  void check();
});

const statusClass = computed(() => {
  if (!checkedAt.value) return 'is-checking';
  return isOnline.value ? 'is-online' : 'is-offline';
});

const statusText = computed(() => {
  if (!checkedAt.value) return t('home.ascent.status.checking');
  if (!isOnline.value) return t('home.ascent.status.offline');
  return t('home.ascent.status.online').replace('{n}', String(playerCount.value ?? 0));
});

const latestTo = computed(() => localePath(props.latest ? `/news/${props.latest.slug}` : '/news'));
const latestTitle = computed(() => props.latest?.title || t('home.ascent.hero.latestFallback'));
</script>

<style scoped>
.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: max(100svh, 720px);
  padding: calc(var(--site-header-stack, 96px) + 40px) 0 120px;
  overflow: hidden;
  background: var(--a-ground);
  isolation: isolate;
}

.hero__bg {
  position: absolute;
  inset: 0;
  z-index: -1;
}

.hero__ground {
  position: absolute;
  inset: -4% 0 auto;
  width: 100%;
  height: 108%;
  object-fit: cover;
  object-position: 50% 40%;
  transform: translate3d(0, calc(var(--p, 0) * 14vh), 0) scale(1.04);
  will-change: transform;
}

/* Far above, the light the whole page climbs toward */
.hero__shaft {
  position: absolute;
  top: -10%;
  right: 12%;
  width: 34vw;
  height: 90%;
  background: radial-gradient(ellipse 40% 70% at 50% 0%, rgba(214, 238, 255, 0.22), transparent 70%);
  transform: translate3d(0, calc(var(--p, 0) * 6vh), 0);
}

.hero__numeral {
  position: absolute;
  right: max(3vw, 120px);
  bottom: -14vh;
  font-family: var(--a-display);
  font-weight: 900;
  font-size: min(118vh, 70vw);
  line-height: 0.8;
  letter-spacing: 0;
  transform: translate3d(0, calc(var(--p, 0) * -16vh), 0);
  will-change: transform;
}

.hero__numeral {
  visibility: hidden;
}

.has-display-font .hero__numeral {
  visibility: visible;
}

.hero__numeral span {
  display: block;
  color: transparent;
  background: linear-gradient(180deg, rgba(240, 246, 252, 0.5) 0%, rgba(200, 214, 228, 0.16) 30%, rgba(120, 128, 140, 0.03) 66%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-stroke: 2px rgba(230, 238, 246, 0.42);
  filter: drop-shadow(0 -2px 30px rgba(73, 226, 255, 0.12));
}

.hero__fog {
  position: absolute;
  left: -20%;
  width: 140%;
  pointer-events: none;
  will-change: transform;
}

.hero__fog--far {
  bottom: 8%;
  height: 46%;
  background:
      radial-gradient(ellipse 30% 40% at 20% 60%, rgba(150, 160, 172, 0.24), transparent 70%),
      radial-gradient(ellipse 34% 46% at 64% 70%, rgba(140, 150, 162, 0.2), transparent 72%);
  animation: ascent-drift 38s ease-in-out infinite alternate;
}

.hero__fog--near {
  bottom: -14%;
  height: 52%;
  background:
      radial-gradient(ellipse 40% 50% at 40% 60%, rgba(176, 184, 194, 0.3), transparent 70%),
      radial-gradient(ellipse 30% 46% at 86% 50%, rgba(160, 168, 180, 0.26), transparent 70%);
  animation: ascent-drift 26s ease-in-out infinite alternate-reverse;
}

@keyframes ascent-drift {
  from {
    transform: translate3d(-4%, 0, 0);
  }
  to {
    transform: translate3d(4%, -2%, 0);
  }
}

.hero__shade {
  position: absolute;
  inset: 0;
  background:
      linear-gradient(90deg, rgba(9, 10, 12, 0.92) 0%, rgba(9, 10, 12, 0.7) 38%, rgba(9, 10, 12, 0.08) 72%),
      linear-gradient(0deg, var(--a-ground) 0%, rgba(9, 10, 12, 0) 34%),
      linear-gradient(180deg, rgba(9, 10, 12, 0.7) 0%, rgba(9, 10, 12, 0) 24%);
}

.hero__inner {
  position: relative;
  visibility: hidden;
}

.has-display-font .hero__inner {
  visibility: visible;
}

.hero__eyebrow {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0 0 28px;
  font-family: var(--a-mono);
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--a-ink-2);
}

.hero__eyebrow-mark {
  width: 34px;
  height: 2px;
  background: var(--a-accent);
  box-shadow: 0 0 12px var(--a-accent);
}

.hero__title {
  margin: 0;
  font-family: var(--a-display);
  font-weight: 800;
  font-size: clamp(56px, 10.6vw, 196px);
  line-height: 0.88;
  text-transform: uppercase;
  letter-spacing: 0;
  color: var(--a-ink);
}

.hero.is-font-fallback .hero__title {
  font-size: clamp(40px, 6.2vw, 112px);
  overflow-wrap: anywhere;
}

.hero__line {
  display: block;
  white-space: nowrap;
}

.hero__line--lit {
  color: transparent;
  background: linear-gradient(90deg, #ffffff 0%, #dff8ff 40%, var(--a-accent) 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

.hero__lede {
  max-width: 41em;
  margin: 32px 0 0;
  font-size: clamp(17px, 1.3vw, 20px);
  line-height: 1.6;
  color: var(--a-ink-2);
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 18px 22px;
  margin-top: 40px;
}

.hero__join {
  min-height: 56px;
}

/* The copy-feedback line lives under the address; keep the row aligned. */
.hero__ip {
  margin-bottom: -26px;
}

.hero__facts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 0;
  margin: 46px 0 0;
  padding: 0;
  list-style: none;
  font-size: 14px;
  color: var(--a-ink-2);
}

.hero__facts > li {
  display: flex;
  align-items: center;
  gap: 9px;
}

.hero__facts > li + li::before {
  content: '';
  width: 1px;
  height: 14px;
  margin: 0 18px;
  background: var(--a-line-strong);
}

.hero__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--a-ink-3);
}

.is-online .hero__dot {
  background: var(--a-ok);
  box-shadow: 0 0 0 4px rgba(94, 234, 160, 0.16);
}

.is-offline .hero__dot {
  background: var(--a-warn);
}

.is-online {
  color: var(--a-ink);
}

.hero__news {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  max-width: min(420px, 80vw);
  color: var(--a-ink);
  text-decoration: none;
}

.hero__news-label {
  flex-shrink: 0;
  font-family: var(--a-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--a-accent);
}

.hero__news-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-decoration: underline;
  text-decoration-color: var(--a-line-strong);
  text-underline-offset: 4px;
}

.hero__news:hover .hero__news-title {
  text-decoration-color: var(--a-accent);
}

.hero__news i {
  font-size: 11px;
  color: var(--a-accent);
  transition: transform 0.2s ease;
}

.hero__news:hover i {
  transform: translateX(3px);
}

.hero__cue {
  position: absolute;
  left: 50%;
  bottom: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  font-family: var(--a-mono);
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--a-ink-2);
  text-decoration: none;
  transform: translateX(-50%);
}

.hero__cue-line {
  position: relative;
  width: 1px;
  height: 46px;
  overflow: hidden;
  background: var(--a-line-strong);
}

.hero__cue-line::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent, var(--a-accent));
  animation: ascent-cue 2.4s ease-in-out infinite;
}

@keyframes ascent-cue {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(100%);
  }
}

/* Load choreography: the copy rises out of the fog */
.has-display-font .hero__eyebrow,
.has-display-font .hero__line,
.has-display-font .hero__lede,
.has-display-font .hero__actions,
.has-display-font .hero__facts {
  animation: ascent-rise 1.1s cubic-bezier(0.2, 0.7, 0.1, 1) both;
}

.has-display-font .hero__line:nth-child(2) {
  animation-delay: 0.12s;
}

.has-display-font .hero__lede {
  animation-delay: 0.24s;
}

.has-display-font .hero__actions {
  animation-delay: 0.34s;
}

.has-display-font .hero__facts {
  animation-delay: 0.44s;
}

.has-display-font .hero__numeral span {
  animation: ascent-loom 2.2s cubic-bezier(0.2, 0.7, 0.1, 1) both;
}

@keyframes ascent-rise {
  from {
    opacity: 0;
    transform: translate3d(0, 28px, 0);
  }
}

@keyframes ascent-loom {
  from {
    opacity: 0;
    transform: translate3d(0, 6vh, 0);
  }
}

@media (max-width: 1099px) {
  .hero__numeral {
    right: 2vw;
  }
}

@media (max-width: 899px) {
  .hero {
    min-height: auto;
    padding: 148px 0 110px;
  }

  .hero__bg {
    bottom: auto;
    height: max(100svh, 760px);
  }

  .hero__line {
    white-space: normal;
  }

  .hero__title {
    font-size: clamp(54px, 15vw, 104px);
  }

  .hero__numeral {
    right: -4vw;
    bottom: auto;
    top: 10vh;
    font-size: 120vw;
    opacity: 0.6;
  }

  .hero__shade {
    background:
        linear-gradient(180deg, rgba(9, 10, 12, 0.66) 0%, rgba(9, 10, 12, 0.82) 50%, var(--a-ground) 100%);
  }

  .hero__facts {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero__facts > li + li::before {
    display: none;
  }
}

@media (max-width: 560px) {
  .hero__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .hero__join {
    justify-content: center;
  }

  .hero__ip {
    margin-bottom: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__fog,
  .hero__cue-line::after,
  .has-display-font .hero__eyebrow,
  .has-display-font .hero__line,
  .has-display-font .hero__lede,
  .has-display-font .hero__actions,
  .has-display-font .hero__facts,
  .has-display-font .hero__numeral span {
    animation: none;
  }

  .hero__ground,
  .hero__numeral,
  .hero__shaft {
    transform: none;
  }
}
</style>
