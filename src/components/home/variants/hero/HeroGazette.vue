<template>
  <section
      ref="heroRef"
      class="gazette"
      :class="{ 'is-ready': isReady }"
      :style="heroStyle"
      aria-labelledby="home-title"
      @pointermove="onPointerMove"
      @pointerleave="onPointerLeave"
  >
    <!-- Backlund by night: the sky, the moon rising behind the skyline, fog crossing it. -->
    <div class="gz-scene" aria-hidden="true">
      <picture>
        <source media="(max-width: 720px)" :srcset="nightSmall">
        <img class="gz-layer gz-sky" :src="night" alt="" fetchpriority="high" decoding="async">
      </picture>
      <div class="gz-moon">
        <i class="gz-moon__glow"></i>
        <img class="gz-moon__disc" :src="moon" alt="" decoding="async">
      </div>
      <div class="gz-fog gz-fog--moon-a"></div>
      <div class="gz-fog gz-fog--moon-b"></div>
      <picture>
        <source media="(max-width: 720px)" :srcset="skylineSmall">
        <img class="gz-layer gz-skyline" :src="skyline" alt="" decoding="async">
      </picture>
      <div class="gz-layer gz-moonlight"></div>
      <div class="gz-fog gz-fog--streets"></div>
      <div class="gz-layer gz-scrim"></div>
    </div>

    <header class="gz-masthead">
      <p class="gz-ear gz-ear--left">
        <span>{{ t('home.heroVariants.gazette.edition') }}</span>
        <span class="gz-ear__extra">{{ t('home.heroVariants.gazette.volume') }}</span>
      </p>
      <p class="gz-name">{{ t('home.heroVariants.gazette.name') }}</p>
      <p class="gz-ear gz-ear--right">
        <span>{{ today }}</span>
        <RouterLink class="gz-ear__extra" :to="$lp(latestSlug ? `/news/${latestSlug}` : '/news')">
          {{ t('home.heroVariants.gazette.latest') }} <span aria-hidden="true">↗</span>
        </RouterLink>
      </p>
    </header>

    <div class="gz-lead">
      <p class="gz-kicker"><b>{{ t('home.heroVariants.gazette.extra') }}</b> {{ t('home.heroVariants.gazette.kicker') }}</p>
      <h1 id="home-title" class="gz-title">
        <span>{{ t('home.hero.headlineLead') }}</span>
        <span class="gz-title__accent">{{ t('home.hero.headlineAccent') }}</span>
      </h1>
      <p class="gz-deck">{{ t('home.heroVariants.gazette.deck') }}</p>
      <div class="gz-actions">
        <RouterLink class="fog-button" :to="$lp('/guide/connect')">
          {{ t('home.hero.primaryCta') }}
          <span aria-hidden="true">→</span>
        </RouterLink>
      </div>
    </div>

    <div class="gz-columns">
      <div class="gz-column gz-column--stop">
        <p class="gz-column__head">{{ t('home.heroVariants.gazette.stopPress') }}</p>
        <p class="gz-stop" :class="`is-${status.state}`">{{ stopPress }}</p>
        <p class="gz-column__foot">
          <span class="gz-dot" :class="`is-${status.state}`" aria-hidden="true"></span>
          {{ t('home.heroVariants.gazette.stopPressFoot') }}
        </p>
      </div>

      <div class="gz-column">
        <p class="gz-column__head">{{ t('home.heroVariants.gazette.noticeTitle') }}</p>
        <p class="gz-column__body">{{ t('home.heroVariants.gazette.noticeBody') }}</p>
        <a class="gz-continued" href="#pathways">
          {{ t('homePage.heroSecondaryCta') }}
          <span>{{ t('home.heroVariants.gazette.continued') }}</span>
        </a>
      </div>

      <div class="gz-column gz-column--classified">
        <p class="gz-column__head">{{ t('home.heroVariants.gazette.classifiedTitle') }}</p>
        <p class="gz-column__body">{{ t('home.heroVariants.gazette.classifiedBody') }}</p>
        <div class="gz-address" :class="`is-${copyState}`">
          <strong ref="addressRef" class="gz-address__value">{{ SERVER_IP }}</strong>
          <button type="button" class="gz-address__copy" :aria-label="copyButtonLabel" @click="copy">
            <svg v-if="copyState === 'copied'" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7"/></svg>
            <svg v-else-if="copyState === 'failed'" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v6M12 17v.5"/></svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15V6a1 1 0 0 1 1-1h9"/></svg>
            <span>{{ copyState === 'idle' ? t('home.heroVariants.gazette.copy') : copyLabel }}</span>
          </button>
          <span class="visually-hidden" aria-live="polite">{{ copyAnnouncement }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, type CSSProperties} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {useReducedMotion} from '@/composables/useReducedMotion';
import type {ServerStatus} from '@/composables/useSharedServerStatus';
import {fill, useHeroAddress} from './useHeroAddress';
import night from './assets/backlund-sky.webp';
import nightSmall from './assets/backlund-sky-960.webp';
import skyline from './assets/backlund-skyline.webp';
import skylineSmall from './assets/backlund-skyline-960.webp';
import moon from './assets/crimson-moon.webp';

const props = defineProps<{ status: ServerStatus; latestSlug?: string | null }>();

const {t, plural, intlLocale} = useI18n();
const reducedMotion = useReducedMotion();
const heroRef = ref<HTMLElement | null>(null);
const addressRef = ref<HTMLElement | null>(null);
const isReady = ref(false);
const {
  SERVER_IP, copyState, copy,
  label: copyLabel, buttonLabel: copyButtonLabel, announcement: copyAnnouncement,
} = useHeroAddress(addressRef);

const today = computed(() => new Intl.DateTimeFormat(intlLocale.value, {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
}).format(new Date()));

const stopPress = computed(() => {
  const {state, playersOnline} = props.status;
  if (state === 'loading') return t('home.heroVariants.gazette.stopPressLoading');
  if (state === 'offline' || playersOnline === null) return t('home.heroVariants.gazette.stopPressOffline');
  if (playersOnline === 0) return t('home.heroVariants.gazette.stopPressNone');
  const forms = {
    one: t('home.heroVariants.gazette.stopPressCount.one'),
    few: t('home.heroVariants.gazette.stopPressCount.few'),
    many: t('home.heroVariants.gazette.stopPressCount.many'),
  };
  return fill(plural(playersOnline, forms), {count: playersOnline});
});

/* ---- Parallax: the moon, the fog and the skyline sit at different depths ---- */

const pointer = {x: 0, y: 0, tx: 0, ty: 0};
const px = ref(0);
const py = ref(0);
const rise = ref(0);
let frame = 0;
let scrollFrame = 0;

const heroStyle = computed<CSSProperties & Record<`--${string}`, string>>(() => ({
  '--px': px.value.toFixed(3),
  '--py': py.value.toFixed(3),
  '--rise': rise.value.toFixed(3),
}));

function onPointerMove(event: PointerEvent) {
  if (reducedMotion.value || event.pointerType !== 'mouse') return;
  const bounds = heroRef.value?.getBoundingClientRect();
  if (!bounds) return;
  pointer.tx = (event.clientX - bounds.left) / bounds.width * 2 - 1;
  pointer.ty = (event.clientY - bounds.top) / bounds.height * 2 - 1;
  schedule();
}

function onPointerLeave() {
  pointer.tx = 0;
  pointer.ty = 0;
  schedule();
}

function tick() {
  frame = 0;
  pointer.x += (pointer.tx - pointer.x) * .07;
  pointer.y += (pointer.ty - pointer.y) * .07;
  px.value = pointer.x;
  py.value = pointer.y;
  if (Math.abs(pointer.tx - pointer.x) > .002 || Math.abs(pointer.ty - pointer.y) > .002) schedule();
}

function schedule() {
  if (!frame && !reducedMotion.value) frame = requestAnimationFrame(tick);
}

/* Scrolling on, the moon keeps climbing out of the city. */
function onScroll() {
  if (scrollFrame || reducedMotion.value) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
    const height = heroRef.value?.offsetHeight ?? 1;
    rise.value = Math.min(1, Math.max(0, window.scrollY / height));
  });
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, {passive: true});
  requestAnimationFrame(() => {
    isReady.value = true;
  });
});

onUnmounted(() => {
  if (frame) cancelAnimationFrame(frame);
  if (scrollFrame) cancelAnimationFrame(scrollFrame);
  window.removeEventListener('scroll', onScroll);
});
</script>

<style scoped>
.gazette {
  --px: 0;
  --py: 0;
  --rise: 0;
  --rule: rgba(236, 230, 218, .26);
  --moon-size: clamp(230px, 30vw, 470px);
  position: relative;
  min-height: max(720px, 100svh);
  display: grid;
  grid-template-rows: auto 1fr auto;
  padding:
      calc(var(--home-header-height, 68px) + clamp(10px, 2vh, 22px))
      var(--home-content-gutter, clamp(20px, 4vw, 56px))
      clamp(16px, 3vh, 32px);
  overflow: hidden;
  color: var(--bone);
  background: #090a0e;
  isolation: isolate;
}

/* ---- Scene ---- */
.gz-scene,
.gz-layer {
  position: absolute;
  inset: 0;
}

.gz-scene {
  z-index: -1;
  pointer-events: none;
}

.gz-layer {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 25% 62%;
}

.gz-sky {
  transform: translate3d(calc(var(--px) * -4px), calc(var(--py) * -3px), 0) scale(1.04);
}

.gz-skyline {
  transform: translate3d(calc(var(--px) * -10px), calc(var(--py) * -5px + var(--rise) * 4vh), 0) scale(1.05);
}

.gz-moon {
  position: absolute;
  top: calc(var(--home-header-height, 68px) + 7vh);
  right: 17vw;
  width: var(--moon-size);
  aspect-ratio: 1;
  transform: translate3d(calc(var(--px) * -18px), calc(var(--py) * -10px + var(--rise) * -16vh), 0);
}

/* On arrival the moon climbs out from behind the castle. */
.gz-moon__disc,
.gz-moon__glow {
  position: absolute;
  inset: 0;
  transform: translate3d(0, 34%, 0);
  transition: transform 2.8s var(--ease-out) .2s;
}

.is-ready .gz-moon__disc,
.is-ready .gz-moon__glow {
  transform: none;
}

.gz-moon__disc {
  width: 100%;
  height: 100%;
}

.gz-moon__glow {
  inset: -60%;
  background: radial-gradient(circle, rgba(179, 32, 43, .42) 0%, rgba(179, 32, 43, .14) 30%, transparent 62%);
}

.gz-fog {
  position: absolute;
  left: 0;
  width: 200%;
  background: url('./assets/fog-bank.webp') repeat-x 0 50% / 50% 100%;
  mix-blend-mode: screen;
  animation: gz-drift 90s linear infinite;
}

/* Two bands of fog cross the moon's face at different speeds. */
.gz-fog--moon-a {
  top: calc(var(--home-header-height, 68px) + 7vh + var(--moon-size) * .38);
  height: calc(var(--moon-size) * .3);
  opacity: .55;
  transform: translate3d(calc(var(--px) * -26px), 0, 0);
}

.gz-fog--moon-b {
  top: calc(var(--home-header-height, 68px) + 7vh + var(--moon-size) * .66);
  height: calc(var(--moon-size) * .4);
  opacity: .45;
  animation-duration: 140s;
  animation-direction: reverse;
}

.gz-fog--streets {
  bottom: 8%;
  height: 34%;
  opacity: .38;
  animation-duration: 70s;
}

@keyframes gz-drift {
  to { translate: -50% 0; }
}

/* Crimson moonlight catches the city's edges nearest the moon. */
.gz-moonlight {
  background: radial-gradient(ellipse 46% 56% at 76% 34%, rgba(179, 32, 43, .7), transparent 72%);
  mix-blend-mode: color;
  opacity: .55;
}

.gz-scrim {
  background:
      linear-gradient(90deg, rgba(9, 10, 14, .9) 0%, rgba(9, 10, 14, .55) 34%, transparent 58%),
      linear-gradient(180deg, rgba(9, 10, 14, .8) 0%, transparent 26%, transparent 52%, rgba(9, 10, 14, .9) 80%, var(--fog-0) 100%);
}

/* ---- Masthead ---- */
.gz-masthead {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 24px;
  padding: 8px 0 10px;
  border-top: 1px solid var(--rule);
  border-bottom: 3px double var(--rule);
}

.gz-name {
  margin: 0;
  color: var(--bone);
  font: 800 clamp(2rem, 5vw, 4.6rem)/.9 var(--font-display);
  letter-spacing: .06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.gz-ear {
  display: grid;
  gap: 6px;
  margin: 0;
  color: var(--ash);
  font: 500 .68rem/1.3 var(--font-mono);
  letter-spacing: .14em;
  text-transform: uppercase;
}

.gz-ear--right {
  justify-items: end;
  text-align: right;
}

.gz-ear a {
  color: var(--bone);
  text-decoration: none;
}

.gz-ear a:hover {
  color: var(--crimson-text);
}

/* ---- Lead story ---- */
.gz-lead {
  align-self: center;
  max-width: min(720px, 56vw);
  padding: clamp(14px, 3vh, 36px) 0;
}

.gz-lead > *,
.gz-columns {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity .8s ease, transform .8s var(--ease-out);
}

.is-ready .gz-lead > *,
.is-ready .gz-columns {
  opacity: 1;
  transform: none;
}

.is-ready .gz-lead > :nth-child(2) { transition-delay: .1s; }
.is-ready .gz-lead > :nth-child(3) { transition-delay: .22s; }
.is-ready .gz-lead > :nth-child(4) { transition-delay: .3s; }
.is-ready .gz-columns { transition-delay: .45s; }

.gz-kicker {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin: 0;
  color: var(--ash);
  font: 500 .72rem/1.3 var(--font-mono);
  letter-spacing: .14em;
  text-transform: uppercase;
}

.gz-kicker b {
  padding: 5px 8px 4px;
  color: var(--bone);
  background: var(--crimson);
  font-weight: 600;
}

.gz-title {
  display: grid;
  margin: 14px 0 16px;
  color: var(--bone);
  font: 800 clamp(3.4rem, 7vw, 7.4rem)/.86 var(--font-display);
  letter-spacing: .005em;
  text-transform: uppercase;
}

.gz-title__accent {
  color: var(--crimson-text);
}

.gz-deck {
  max-width: 54ch;
  margin: 0;
  padding-top: 14px;
  border-top: 1px solid var(--rule);
  color: var(--bone);
  font-size: clamp(1rem, 1.2vw, 1.12rem);
  line-height: 1.6;
}

.gz-actions {
  margin-top: 22px;
}

/* ---- Columns ---- */
.gz-columns {
  display: grid;
  grid-template-columns: 1fr 1.25fr 1.25fr;
  border-top: 1px solid var(--rule);
}

.gz-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  padding: 14px 24px 2px;
  border-left: 1px solid var(--line);
}

.gz-column:first-child {
  padding-left: 0;
  border-left: 0;
}

.gz-column:last-child {
  padding-right: 0;
}

.gz-column__head {
  margin: 0;
  color: var(--ash);
  font: 500 .68rem/1.2 var(--font-mono);
  letter-spacing: .16em;
  text-transform: uppercase;
}

.gz-column__body {
  margin: 0;
  color: var(--ash);
  font-size: .92rem;
  line-height: 1.55;
}

.gz-stop {
  margin: 0;
  color: var(--bone);
  font: 800 clamp(1.5rem, 2.3vw, 2.1rem)/.95 var(--font-display);
  text-transform: uppercase;
}

.gz-column__foot {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: auto 0 0;
  color: var(--ash);
  font: 500 .66rem/1.3 var(--font-mono);
  letter-spacing: .12em;
  text-transform: uppercase;
}

.gz-dot {
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 50%;
  background: var(--ash-dim);
}

.gz-dot.is-online {
  background: var(--live);
  box-shadow: 0 0 0 4px rgba(76, 195, 138, .16);
}

.gz-dot.is-offline { background: var(--crimson-text); }

.gz-continued {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 10px;
  margin-top: auto;
  min-height: 44px;
  align-content: center;
  color: var(--bone);
  font-weight: 600;
  text-decoration: none;
}

.gz-continued span {
  color: var(--ash);
  font: 500 .66rem/1 var(--font-mono);
  letter-spacing: .12em;
  text-transform: uppercase;
}

.gz-continued:hover {
  color: var(--crimson-text);
}

.gz-address {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding: 6px 6px 6px 14px;
  border: 1px dashed var(--line-strong);
  border-radius: 6px;
  background: rgba(9, 10, 14, .55);
  transition: border-color .2s ease;
}

.gz-address.is-copied { border-color: rgba(76, 195, 138, .7); border-style: solid; }
.gz-address.is-failed { border-color: var(--crimson-text); border-style: solid; }

.gz-address__value {
  min-width: 0;
  color: var(--bone);
  font: 500 .98rem/1 var(--font-mono);
  user-select: all;
  overflow-wrap: anywhere;
}

.gz-address__copy {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 0;
  border-radius: 4px;
  color: var(--bone);
  background: var(--fog-3);
  font: 500 .66rem/1 var(--font-mono);
  letter-spacing: .12em;
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color .2s ease, color .2s ease;
}

.gz-address__copy:hover { background: #2a2f3a; }
.gz-address__copy:active { background: var(--crimson-deep); }
.is-copied .gz-address__copy { color: var(--live); }
.is-failed .gz-address__copy { color: var(--crimson-text); }

.gz-address__copy svg {
  width: 16px;
  height: 16px;
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.gazette :focus-visible {
  outline: 2px solid var(--crimson-text);
  outline-offset: 3px;
}

/* ---- Tablet ---- */
@media (max-width: 1100px) {
  .gz-layer {
    object-position: 0 62%;
  }

  .gz-ear__extra:not(a) {
    display: none;
  }

  .gz-lead {
    max-width: min(640px, 64vw);
    padding: 10px 0;
  }

  .gz-title {
    margin: 10px 0 12px;
  }

  .gz-moon {
    right: 11vw;
  }

  .gz-column__body {
    font-size: .86rem;
  }
}

/* ---- Phone: masthead on top, the moon over the castle, columns stacked ---- */
@media (max-width: 720px) {
  .gazette {
    --moon-size: 44vw;
    --band: calc(var(--home-header-height, 68px) + 370px);
    --moon-top: calc(var(--home-header-height, 68px) + 108px);
    grid-template-rows: auto auto auto;
  }

  .gz-masthead {
    grid-template-columns: 1fr auto;
    gap: 8px 12px;
  }

  .gz-name {
    grid-column: 1 / -1;
    grid-row: 1;
    font-size: clamp(1.9rem, 10.4vw, 2.6rem);
    text-align: center;
  }

  .gz-ear {
    font-size: .58rem;
    letter-spacing: .1em;
    white-space: nowrap;
  }

  .gz-ear__extra {
    display: none;
  }

  /* The scene becomes a band behind the masthead and the top of the story. */
  .gz-sky,
  .gz-skyline,
  .gz-moonlight {
    height: var(--band);
  }

  .gz-layer {
    object-position: 36% 50%;
  }

  .gz-moon {
    top: var(--moon-top);
    right: 40vw;
  }

  .gz-fog--moon-a { top: calc(var(--moon-top) + var(--moon-size) * .3); }
  .gz-fog--moon-b { top: calc(var(--moon-top) + var(--moon-size) * .62); }
  .gz-fog--streets { top: calc(var(--band) - 160px); bottom: auto; height: 160px; }

  .gz-moonlight {
    background: radial-gradient(ellipse 80% 40% at 40% 46%, rgba(179, 32, 43, .7), transparent 72%);
  }

  .gz-scrim {
    background:
        linear-gradient(180deg, rgba(9, 10, 14, .7) 0%, transparent 20%, transparent calc(var(--band) - 150px), #090a0e var(--band), #090a0e 92%, var(--fog-0) 100%);
  }

  .gz-lead {
    max-width: none;
    padding: 196px 0 26px;
  }

  .gz-actions .fog-button {
    width: 100%;
  }

  .gz-columns {
    grid-template-columns: 1fr;
  }

  .gz-column,
  .gz-column:first-child,
  .gz-column:last-child {
    padding: 14px 0;
    border-left: 0;
    border-top: 1px solid var(--line);
  }

  .gz-column:first-child {
    border-top: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gz-fog { animation: none; }
  .gz-moon__disc,
  .gz-moon__glow {
    transform: none;
    transition: none;
  }
  .gz-lead > *,
  .gz-columns {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
