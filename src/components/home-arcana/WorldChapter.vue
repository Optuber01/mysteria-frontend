<template>
  <section id="world" class="arc-section world" aria-labelledby="world-title">
    <div class="arc-shell">
      <ArcanaSectionHead split title-id="world-title">
        <template #title>{{ t('home.world.titleA') }} <em>{{ t('home.world.titleB') }}</em></template>
        {{ t('home.world.lede') }}
      </ArcanaSectionHead>

      <!-- the house rules, before anything else -->
      <ul class="world-rules" :aria-label="t('home.world.rulesLabel')">
        <li v-for="rule in rules" :key="rule.key">
          <i :class="rule.icon" aria-hidden="true"></i>
          <strong>{{ rule.value }}</strong>
          <span>{{ rule.note }}</span>
        </li>
      </ul>

      <!-- out there: what to fight -->
      <div class="world-group">
        <article class="world-feature">
          <WorldPhoto
              class="world-feature__photo"
              :shot="shots.rifts"
              :alt="t('home.world.rifts.alt')"
              sizes="(max-width: 900px) 100vw, 58vw"
          />
          <div class="world-feature__copy">
            <h4 class="world-feature__title">{{ t('home.world.rifts.title') }}</h4>
            <p class="world-feature__body">{{ t('home.world.rifts.body') }}</p>
            <ol class="world-steps">
              <li v-for="(step, index) in riftSteps" :key="step.key">
                <span class="world-steps__num" aria-hidden="true">{{ index + 1 }}</span>
                <span><strong>{{ step.title }}</strong> {{ step.body }}</span>
              </li>
            </ol>
            <ul class="world-facts">
              <li><i class="fa-solid fa-gem" aria-hidden="true"></i>{{ t('home.world.rifts.factLoot') }}</li>
            </ul>
          </div>
        </article>

        <ul class="world-cards">
          <li class="world-card">
            <WorldPhoto class="world-card__photo" :shot="shots.guardians" :alt="t('home.world.guardians.alt')" sizes="(max-width: 900px) 100vw, 34vw"/>
            <div class="world-card__copy">
              <h4>{{ t('home.world.guardians.title') }}</h4>
              <p>{{ t('home.world.guardians.body') }}</p>
            </div>
          </li>

          <li class="world-card world-card--moon">
            <div class="world-moon" aria-hidden="true">
              <img class="world-moon__disc" :src="moon" alt="" width="640" height="640" loading="lazy" decoding="async">
            </div>
            <div class="world-card__copy">
              <h4>{{ t('home.world.moon.title') }}</h4>
              <p>{{ t('home.world.moon.body') }}</p>
            </div>
          </li>

          <li class="world-card">
            <WorldPhoto class="world-card__photo" :shot="shots.incursions" :alt="t('home.world.incursions.alt')" sizes="(max-width: 900px) 100vw, 34vw"/>
            <div class="world-card__copy">
              <h4>{{ t('home.world.incursions.title') }}</h4>
              <p>{{ t('home.world.incursions.body') }}</p>
              <p class="world-card__fact"><i class="fa-solid fa-flag-checkered" aria-hidden="true"></i>{{ t('home.world.incursions.fact') }}</p>
            </div>
          </li>
        </ul>
      </div>

      <!-- among players: what to build -->
      <div class="world-group">
        <article class="world-feature is-reversed">
          <div class="world-mosaic">
            <WorldPhoto class="world-mosaic__main" :shot="shots.townMain" :alt="t('home.world.towns.altMain')" sizes="(max-width: 900px) 100vw, 58vw"/>
            <WorldPhoto class="world-mosaic__side" :shot="shots.townA" :alt="t('home.world.towns.altA')" sizes="(max-width: 900px) 50vw, 29vw"/>
            <WorldPhoto class="world-mosaic__side" :shot="shots.townB" :alt="t('home.world.towns.altB')" sizes="(max-width: 900px) 50vw, 29vw"/>
          </div>
          <div class="world-feature__copy">
            <h4 class="world-feature__title">{{ t('home.world.towns.title') }}</h4>
            <p class="world-feature__body">{{ t('home.world.towns.body') }}</p>
            <ol class="world-ladder">
              <li v-for="(rung, index) in ladder" :key="rung.key">
                <span class="world-ladder__card" aria-hidden="true">{{ ['I', 'II', 'III'][index] }}</span>
                <strong>{{ rung.title }}</strong>
                <span>{{ rung.body }}</span>
              </li>
            </ol>
          </div>
        </article>

        <ul class="world-cards">
          <li v-for="item in societyCards" :key="item.key" class="world-card">
            <WorldPhoto class="world-card__photo" :shot="item.shot" :alt="item.alt" sizes="(max-width: 900px) 100vw, 34vw"/>
            <div class="world-card__copy">
              <h4>{{ item.title }}</h4>
              <p>{{ item.body }}</p>
              <p class="world-card__fact"><i :class="item.icon" aria-hidden="true"></i>{{ item.fact }}</p>
            </div>
          </li>
        </ul>
      </div>

      <!-- the gallery: everything the players made -->
      <header class="world-gallery__head">
        <h3>{{ t('home.world.gallery.title') }}</h3>
        <div class="world-gallery__aside">
          <div class="world-gallery__actions">
            <a :href="DISCORD" class="arc-btn arc-btn--ghost" target="_blank" rel="noopener noreferrer">
              <IconDiscord class="arc-btn__icon" aria-hidden="true"/>
              {{ t('home.world.gallery.cta') }}
            </a>
            <button
                v-if="!reducedMotion"
                type="button"
                class="arc-btn arc-btn--ghost world-gallery__toggle"
                :aria-pressed="paused"
                :aria-label="paused ? t('home.world.gallery.play') : t('home.world.gallery.pause')"
                @click="paused = !paused"
            >
              <svg v-if="paused" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>
              <svg v-else viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" fill="currentColor"/></svg>
            </button>
          </div>
        </div>
      </header>
    </div>

    <div
        ref="stripRef"
        class="world-strip"
        :class="{'is-paused': paused || !inView, 'is-still': reducedMotion}"
        role="region"
        :aria-label="t('home.world.gallery.label')"
        :tabindex="reducedMotion ? 0 : undefined"
    >
      <ul class="world-strip__track">
        <li v-for="item in gallery" :key="item.id" class="world-strip__item" :aria-hidden="item.copy || undefined">
          <WorldPhoto :shot="item.shot" :alt="item.copy ? '' : item.shot.place" sizes="360px" :eager="stripWarm"/>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from 'vue';
import {useI18n} from '@/composables/useI18n';
import IconDiscord from '@/assets/icons/IconDiscord.vue';
import ArcanaSectionHead from './ArcanaSectionHead.vue';
import WorldPhoto from './WorldPhoto.vue';
import {GALLERY_SHOTS, TOPIC_SHOTS} from './WorldShots';
import moon from '@/assets/images/home-library/crimson-moon.webp';

const DISCORD = 'https://discord.com/invite/jc7GSxBWgb';

const {t} = useI18n();
const shots = TOPIC_SHOTS;

const rules = computed(() => [
  {key: 'distance', icon: 'fa-solid fa-route'},
  {key: 'safe', icon: 'fa-solid fa-shield-halved'},
  {key: 'chests', icon: 'fa-solid fa-box-open'},
  {key: 'season', icon: 'fa-solid fa-rotate'},
].map(rule => ({
  ...rule,
  value: t(`home.world.rules.${rule.key}.value`),
  note: t(`home.world.rules.${rule.key}.note`),
})));

const riftSteps = computed(() => ['find', 'weaken', 'enter'].map(key => ({
  key,
  title: t(`home.world.rifts.steps.${key}.title`),
  body: t(`home.world.rifts.steps.${key}.body`),
})));

const ladder = computed(() => ['town', 'domain', 'nation'].map(key => ({
  key,
  title: t(`home.world.towns.ladder.${key}.title`),
  body: t(`home.world.towns.ladder.${key}.body`),
})));

const SOCIETY_FACTS = {
  churches: {icon: 'fa-solid fa-scroll', key: 'home.world.churches.fact'},
  economy: {icon: 'fa-solid fa-coins', key: 'home.world.economy.income'},
  orders: {icon: 'fa-solid fa-lock', key: 'home.world.orders.fact'},
};
const societyCards = computed(() => (['churches', 'economy', 'orders'] as const).map(key => ({
  key,
  icon: SOCIETY_FACTS[key].icon,
  fact: t(SOCIETY_FACTS[key].key),
  shot: shots[key],
  title: t(`home.world.${key}.title`),
  body: t(`home.world.${key}.body`),
  alt: t(`home.world.${key}.alt`),
})));

/* ---- the strip: one pass, then the same pass again so the loop is seamless ---- */
const reducedMotion = ref(false);
const paused = ref(false);
const inView = ref(false);
/* Once the strip is on screen, load every tile: lazy ones clipped by the strip would pop in blank. */
const stripWarm = ref(false);
watch(inView, visible => visible && (stripWarm.value = true));
const stripRef = ref<HTMLElement | null>(null);

const gallery = computed(() => {
  const once = GALLERY_SHOTS.map(shot => ({id: shot.key, shot, copy: false}));
  if (reducedMotion.value) return once;
  return [...once, ...GALLERY_SHOTS.map(shot => ({id: `${shot.key}-again`, shot, copy: true}))];
});

let observer: IntersectionObserver | null = null;
let motionQuery: MediaQueryList | null = null;
const syncMotion = () => (reducedMotion.value = !!motionQuery?.matches);

onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  syncMotion();
  motionQuery.addEventListener('change', syncMotion);
  observer = new IntersectionObserver(([entry]) => (inView.value = entry.isIntersecting));
  if (stripRef.value) observer.observe(stripRef.value);
});

onUnmounted(() => {
  observer?.disconnect();
  motionQuery?.removeEventListener('change', syncMotion);
});
</script>

<style scoped>
/* ---------- house rules ---------- */
.world-rules {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-block: var(--arc-bw) solid var(--arc-line);
}

.world-rules li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-content: start;
  gap: 6px 12px;
  padding: clamp(18px, 2vw, 26px) clamp(14px, 1.6vw, 24px);
}

/* the strip's outer items sit on the page's edges, like every other block */
.world-rules li:first-child {
  padding-left: 0;
}

.world-rules li:last-child {
  padding-right: 0;
}

.world-rules li + li {
  border-left: var(--arc-bw) solid var(--arc-line);
}

.world-rules i {
  grid-row: span 2;
  margin-top: 3px;
  font-size: 15px;
  color: var(--acc-ink);
}

.world-rules strong {
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: var(--arc-fs-h4);
  line-height: 1.22;
  color: var(--arc-ink);
}

.world-rules span {
  font-size: var(--arc-fs-small);
  line-height: 1.5;
  color: var(--arc-muted);
  text-wrap: pretty;
}

/* ---------- groups ---------- */
.world-group {
  margin-top: var(--arc-block-gap);
}

.world-gallery__head h3 {
  margin: 0;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: var(--arc-fs-h2);
  line-height: 1.08;
  letter-spacing: -.02em;
  color: var(--arc-ink);
  text-wrap: balance;
}

/* ---------- feature: a wide shot and its story ---------- */
.world-feature {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  align-items: center;
  gap: clamp(28px, 4vw, 64px);
}

.world-feature.is-reversed {
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
}

.world-feature.is-reversed .world-mosaic {
  order: 2;
}

.world-feature__photo {
  aspect-ratio: 16 / 10;
  border-radius: var(--arc-r-lg);
}

.world-feature__title {
  margin: 0 0 12px;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: var(--arc-fs-h3);
  line-height: 1.12;
  letter-spacing: -.015em;
  color: var(--arc-ink);
}

.world-feature__body {
  text-wrap: pretty;
  margin: 0 0 22px;
  font-size: var(--arc-fs-body);
  line-height: 1.65;
  color: var(--arc-muted);
}

.world-steps {
  list-style: none;
  margin: 0 0 20px;
  padding: 0;
  display: grid;
  gap: 2px;
}

.world-steps li {
  text-wrap: pretty;
  position: relative;
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  padding: 6px 0;
  font-size: var(--arc-fs-body);
  line-height: 1.5;
  color: var(--arc-muted);
}

.world-steps strong {
  color: var(--arc-ink);
  font-weight: 600;
}

.world-steps__num,
.world-ladder__card {
  display: grid;
  place-items: center;
  width: 32px;
  height: 46px;
  border: var(--arc-bw-accent) solid var(--acc-ink);
  border-radius: var(--arc-r-sm);
  background: color-mix(in oklab, var(--acc) 14%, var(--arc-chip-bg));
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-size: var(--arc-fs-body);
  font-weight: 700;
  color: var(--arc-ink);
  transform: rotate(-6deg);
  transition: border-color .6s ease, background-color .6s ease;
}

.world-facts {
  list-style: none;
  margin: 0;
  padding: 16px 0 0;
  display: grid;
  gap: 8px;
  border-top: var(--arc-bw) solid var(--arc-line);
}

.world-facts li {
  text-wrap: pretty;
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: var(--arc-fs-small);
  line-height: 1.5;
  color: var(--arc-ink);
}

.world-facts i,
.world-card__fact i {
  flex: none;
  width: 14px;
  text-align: center;
  color: var(--acc-ink);
  font-size: 12px;
}

/* ---------- towns: three shots, one ladder ---------- */
.world-mosaic {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: var(--arc-grid-gap);
  aspect-ratio: 16 / 10;
}

.world-mosaic__main {
  grid-row: 1 / -1;
  border-radius: var(--arc-r-lg);
}

.world-mosaic__side {
  border-radius: var(--arc-r-lg);
}

.world-ladder {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.world-ladder li {
  position: relative;
  display: grid;
  align-content: start;
  gap: 6px;
  padding: 16px 14px 16px;
  border-radius: var(--arc-r-md);
  background: var(--arc-glass);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
}

/* the arrow from one rung to the next */
.world-ladder li:not(:last-child)::after {
  content: '';
  position: absolute;
  z-index: 1;
  top: 35px;
  right: -9px;
  width: 8px;
  height: 8px;
  border-top: var(--arc-bw-accent) solid var(--acc-ink);
  border-right: var(--arc-bw-accent) solid var(--acc-ink);
  transform: rotate(45deg);
}

.world-ladder__card {
  margin-bottom: 6px;
}

.world-ladder strong {
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: var(--arc-fs-h4);
  color: var(--arc-ink);
}

.world-ladder span:last-child {
  text-wrap: pretty;
  font-size: var(--arc-fs-small);
  line-height: 1.45;
  color: var(--arc-muted);
}

/* ---------- cards: a shot on top, its caption rising out of it ---------- */
.world-cards {
  list-style: none;
  margin: var(--arc-group-gap) 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--arc-grid-gap);
}

.world-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--arc-r-lg);
  background: var(--arc-card);
  isolation: isolate;
}

.world-card__photo,
.world-moon {
  flex: none;
  aspect-ratio: 16 / 10.5;
}

/* the photo melts into the card */
.world-card__photo::before {
  content: '';
  position: absolute;
  inset: 40% 0 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(180deg, transparent, var(--arc-card) 78%);
}

.world-card::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  border-radius: inherit;
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
}

.world-card__copy {
  position: relative;
  z-index: 3;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: -30px;
  padding: 0 clamp(20px, 2vw, 26px) clamp(20px, 2vw, 26px);
}

.world-card h4 {
  margin: 0 0 8px;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: var(--arc-fs-h4);
  line-height: 1.22;
  color: var(--arc-ink);
}

.world-card__copy > p {
  text-wrap: pretty;
  margin: 0;
  font-size: var(--arc-fs-body);
  line-height: 1.6;
  color: var(--arc-muted);
}

.world-card__copy > p.world-card__fact {
  display: flex;
  align-items: baseline;
  gap: 9px;
  width: 100%;
  margin-top: auto;
  padding-top: 14px;
  font-size: var(--arc-fs-small);
  line-height: 1.5;
  color: var(--arc-ink);
}

.world-card__copy > p:not(.world-card__fact) {
  margin-bottom: 16px;
}

.world-card__copy > p.world-card__fact {
  border-top: var(--arc-bw) solid var(--arc-line);
}

/*
 * Cards in a row share their rows (photo / title / text / note), so every title, text block and
 * note rule lands on the same line whatever the copy length; below 900px they are separate
 * swipeable cards and keep the plain flex stack.
 */
@media (min-width: 901px) {
  .world-cards {
    row-gap: 0;
  }

  .world-card {
    display: grid;
    grid-row: span 4;
    grid-template-rows: subgrid;
  }

  /* the caption's overlap with the photo moves to the photo's foot, so it can't skew the shared rows */
  .world-card__photo,
  .world-moon {
    margin-bottom: -30px;
  }

  .world-card__copy {
    display: grid;
    margin-top: 0;
    grid-row: 2 / span 3;
    grid-template-rows: subgrid;
    align-items: start;
    justify-items: stretch;
  }

  .world-card__copy > p.world-card__fact {
    margin-top: 0;
    align-self: stretch;
  }
}

/* the Crimson Moon is a moon, not a photo: give it its own sky */
.world-moon {
  position: relative;
  display: grid;
  place-items: center;
  background:
    radial-gradient(46% 60% at 50% 46%, rgba(150, 22, 30, .5), transparent 72%),
    linear-gradient(180deg, #1a0709, #131318 68%, var(--arc-card));
}

.world-moon__disc {
  position: absolute;
  top: 10%;
  left: 50%;
  width: auto;
  height: 64%;
  aspect-ratio: 1;
  translate: -50% 0;
  filter: drop-shadow(0 0 40px rgba(255, 40, 50, .5));
}

/* ---------- gallery ---------- */
.world-gallery__head {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  align-items: end;
  gap: 20px clamp(32px, 5vw, 72px);
  margin-top: var(--arc-block-gap);
  margin-bottom: var(--arc-group-gap);
}

.world-gallery__aside {
  display: grid;
  justify-items: end;
  gap: 16px;
}

.world-gallery__actions {
  display: flex;
  gap: 10px;
}

/* an icon-only ghost button: square, as tall as the button beside it */
.world-gallery__toggle.arc-btn {
  flex: none;
  width: var(--arc-btn-h);
  padding: 0;
}

.world-gallery__toggle svg {
  width: 15px;
  height: 15px;
}

/* full-bleed: the strip runs edge to edge, fading at both ends */
.world-strip {
  margin-inline: calc(var(--arc-gutter) * -1);
  overflow: hidden;
  --strip-fade: clamp(72px, 9vw, 168px);
  --strip-mask: linear-gradient(
    90deg,
    transparent,
    rgba(0, 0, 0, .3) calc(var(--strip-fade) * .5),
    #000 var(--strip-fade),
    #000 calc(100% - var(--strip-fade)),
    rgba(0, 0, 0, .3) calc(100% - var(--strip-fade) * .5),
    transparent
  );
  -webkit-mask-image: var(--strip-mask);
  mask-image: var(--strip-mask);
}

.world-strip__track {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 14px;
  width: max-content;
  animation: world-drift 120s linear infinite;
}

.world-strip:hover .world-strip__track,
.world-strip:focus-within .world-strip__track,
.world-strip.is-paused .world-strip__track {
  animation-play-state: paused;
}

@keyframes world-drift {
  to {
    transform: translateX(calc(-50% - 7px));
  }
}

.world-strip__item {
  flex: none;
  width: clamp(260px, 25vw, 380px);
}

.world-strip__item :deep(.world-photo) {
  aspect-ratio: 16 / 10;
  border-radius: var(--arc-r-lg);
}

.world-strip.is-still {
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: thin;
  padding-bottom: 10px;
}

.world-strip.is-still .world-strip__track {
  animation: none;
  padding-inline: var(--arc-gutter);
}

.world-strip.is-still .world-strip__item {
  scroll-snap-align: center;
}

/* ---------- responsive ---------- */
@media (max-width: 1100px) {
  .world-rules {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .world-rules li:nth-child(3) {
    border-left: 0;
  }

  .world-rules li:nth-child(n + 3) {
    border-top: var(--arc-bw) solid var(--arc-line);
  }

  .world-rules li:nth-child(odd) {
    padding-left: 0;
  }

  .world-rules li:nth-child(even) {
    padding-right: 0;
  }
}

@media (max-width: 900px) {
  .world-feature,
  .world-feature.is-reversed {
    grid-template-columns: 1fr;
  }

  .world-feature.is-reversed .world-mosaic {
    order: 0;
  }

  /* tablets and phones: the three cards become a swipeable row, the next one peeking in */
  .world-cards {
    grid-template-columns: none;
    grid-auto-flow: column;
    grid-auto-columns: min(84%, 360px);
    margin-inline: calc(var(--arc-gutter) * -1);
    padding: 4px var(--arc-gutter) 14px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
    scroll-padding-inline: var(--arc-gutter);
    scrollbar-width: none;
  }

  .world-cards::-webkit-scrollbar {
    display: none;
  }

  .world-card {
    scroll-snap-align: start;
  }

  .world-gallery__head {
    grid-template-columns: 1fr;
  }

  .world-gallery__aside {
    justify-items: start;
  }
}

@media (max-width: 600px) {
  .world-rules {
    grid-template-columns: 1fr;
  }

  .world-rules li + li {
    border-left: 0;
    border-top: 1px solid var(--arc-line);
  }

  .world-rules li {
    padding-inline: 4px;
  }

  .world-mosaic {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto;
    aspect-ratio: auto;
  }

  .world-mosaic__main {
    grid-row: auto;
    grid-column: 1 / -1;
    aspect-ratio: 16 / 10;
  }

  .world-mosaic__side {
    aspect-ratio: 4 / 3;
  }

  .world-gallery__actions {
    width: 100%;
  }

  .world-gallery__actions .arc-btn {
    flex: 1;
    width: auto;
  }
}

/* the ladder stands upright wherever its column is narrow */
@media (max-width: 600px), (min-width: 901px) and (max-width: 1279px) {
  .world-ladder {
    grid-template-columns: 1fr;
  }

  .world-ladder li {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    column-gap: 14px;
  }

  .world-ladder__card {
    grid-row: span 2;
    margin: 0;
  }

  .world-ladder li:not(:last-child)::after {
    top: auto;
    right: auto;
    bottom: -8px;
    left: 26px;
    transform: rotate(135deg);
  }
}


</style>
