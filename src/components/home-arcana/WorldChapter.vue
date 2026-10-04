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
      <section class="world-group" aria-labelledby="world-fight-title">
        <header class="world-group__head">
          <h3 id="world-fight-title">{{ t('home.world.groups.fight.title') }}</h3>
        </header>

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
              <li><i class="fa-solid fa-people-group" aria-hidden="true"></i>{{ t('home.world.rifts.factHelp') }}</li>
            </ul>
          </div>
        </article>

        <ul class="world-cards">
          <li class="world-card">
            <WorldPhoto class="world-card__photo" :shot="shots.guardians" :alt="t('home.world.guardians.alt')" credit="tr" sizes="(max-width: 900px) 100vw, 34vw"/>
            <div class="world-card__copy">
              <h4>{{ t('home.world.guardians.title') }}</h4>
              <p>{{ t('home.world.guardians.body') }}</p>
              <p class="world-card__fact"><i class="fa-solid fa-certificate" aria-hidden="true"></i>{{ t('home.world.guardians.fact') }}</p>
            </div>
          </li>

          <li class="world-card world-card--moon">
            <div class="world-moon" aria-hidden="true">
              <img class="world-moon__disc" :src="moon" alt="" width="640" height="640" loading="lazy" decoding="async">
              <span class="world-moon__week" :title="t('home.world.moon.week')">
                <i v-for="n in 7" :key="n" :class="{'is-red': n === 7}"></i>
              </span>
            </div>
            <div class="world-card__copy">
              <h4>{{ t('home.world.moon.title') }}</h4>
              <p>{{ t('home.world.moon.body') }}</p>
              <p class="world-card__fact"><i class="fa-solid fa-eye" aria-hidden="true"></i>{{ moonFact }}</p>
            </div>
          </li>

          <li class="world-card">
            <WorldPhoto class="world-card__photo" :shot="shots.incursions" :alt="t('home.world.incursions.alt')" credit="tr" sizes="(max-width: 900px) 100vw, 34vw"/>
            <div class="world-card__copy">
              <h4>{{ t('home.world.incursions.title') }}</h4>
              <p>{{ t('home.world.incursions.body') }}</p>
              <p class="world-card__fact"><i class="fa-solid fa-flag-checkered" aria-hidden="true"></i>{{ t('home.world.incursions.fact') }}</p>
            </div>
          </li>
        </ul>
      </section>

      <!-- among players: what to build -->
      <section class="world-group" aria-labelledby="world-build-title">
        <header class="world-group__head">
          <h3 id="world-build-title">{{ t('home.world.groups.build.title') }}</h3>
        </header>

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
            <p class="world-feature__note"><i class="fa-solid fa-compass" aria-hidden="true"></i>{{ t('home.world.towns.solo') }}</p>
          </div>
        </article>

        <ul class="world-cards">
          <li v-for="item in societyCards" :key="item.key" class="world-card">
            <WorldPhoto class="world-card__photo" :shot="item.shot" :alt="item.alt" credit="tr" sizes="(max-width: 900px) 100vw, 34vw"/>
            <div class="world-card__copy">
              <h4>{{ item.title }}</h4>
              <p>{{ item.body }}</p>
              <p class="world-card__fact"><i :class="item.icon" aria-hidden="true"></i>{{ item.fact }}</p>
            </div>
          </li>
        </ul>
      </section>

      <!-- the gallery: everything the players made -->
      <header class="world-gallery__head">
        <h3>{{ t('home.world.gallery.title') }}</h3>
        <div class="world-gallery__aside">
          <p>{{ t('home.world.gallery.lede') }}</p>
          <div class="world-gallery__actions">
            <a :href="DISCORD" class="arc-btn arc-btn--ghost" target="_blank" rel="noopener noreferrer">
              <IconDiscord class="arc-btn__icon" aria-hidden="true"/>
              {{ t('home.world.gallery.cta') }}
            </a>
            <button
                v-if="!reducedMotion"
                type="button"
                class="world-gallery__toggle"
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
          <WorldPhoto :shot="item.shot" :alt="item.copy ? '' : item.shot.place" credit="bl" sizes="360px" :eager="stripWarm"/>
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
import {useArcana} from './useArcana';
import moon from '@/assets/images/home-library/crimson-moon.webp';

const DISCORD = 'https://discord.com/invite/jc7GSxBWgb';

const {t} = useI18n();
const {reading, hasDrawn} = useArcana();
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

/* Before a draw there is no "your Pathway" to speak of, so the fact stays general. */
const moonFact = computed(() => (hasDrawn.value
    ? t('home.world.moon.pathwayFact').replace('{pathway}', reading.value.name)
    : t('home.world.moon.fact')));

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
  border-block: 1px solid var(--arc-line);
}

.world-rules li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-content: start;
  gap: 6px 12px;
  padding: clamp(18px, 2vw, 26px) clamp(14px, 1.6vw, 24px);
}

.world-rules li + li {
  border-left: 1px solid var(--arc-line);
}

.world-rules i {
  grid-row: span 2;
  margin-top: 3px;
  font-size: 15px;
  color: var(--acc);
}

.world-rules strong {
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: 17px;
  line-height: 1.25;
  color: var(--arc-ink);
}

.world-rules span {
  font-size: 14px;
  line-height: 1.5;
  color: var(--arc-muted);
  text-wrap: pretty;
}

/* ---------- groups ---------- */
.world-group {
  margin-top: var(--arc-block-gap);
}

.world-group__head {
  margin-bottom: clamp(22px, 2.6vw, 36px);
}

.world-group__head h3,
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
  border-radius: var(--arc-radius-lg);
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
  grid-template-columns: 30px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  padding: 10px 0;
  font-size: 15px;
  line-height: 1.5;
  color: var(--arc-muted);
}

.world-steps li:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 14px;
  top: calc(50% + 17px);
  height: calc(100% - 30px);
  width: 1.5px;
  background: color-mix(in oklab, var(--acc) 40%, transparent);
}

.world-steps strong {
  color: var(--arc-ink);
  font-weight: 600;
}

.world-steps__num,
.world-ladder__card {
  display: grid;
  place-items: center;
  width: 28px;
  height: 40px;
  border: 1.5px solid var(--acc);
  border-radius: 4px;
  background: color-mix(in oklab, var(--acc) 14%, #0e0e12);
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-size: 13px;
  font-weight: 700;
  color: var(--acc);
  transform: rotate(-6deg);
  transition: border-color .6s ease, background-color .6s ease, color .6s ease;
}

.world-facts {
  list-style: none;
  margin: 0;
  padding: 16px 0 0;
  display: grid;
  gap: 8px;
  border-top: 1px solid var(--arc-line);
}

.world-facts li {
  text-wrap: pretty;
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--arc-ink);
}

.world-facts i,
.world-feature__note i,
.world-card__fact i {
  flex: none;
  width: 14px;
  text-align: center;
  color: var(--acc);
  font-size: 12px;
}

/* ---------- towns: three shots, one ladder ---------- */
.world-mosaic {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: clamp(10px, 1vw, 14px);
  aspect-ratio: 16 / 10;
}

.world-mosaic__main {
  grid-row: 1 / -1;
  border-radius: var(--arc-radius-lg);
}

.world-mosaic__side {
  border-radius: var(--arc-radius);
}

.world-ladder {
  list-style: none;
  margin: 0 0 20px;
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
  border-radius: var(--arc-radius);
  background: rgba(255, 255, 255, .03);
  box-shadow: inset 0 0 0 1px var(--arc-line);
}

/* the arrow from one rung to the next */
.world-ladder li:not(:last-child)::after {
  content: '';
  position: absolute;
  z-index: 1;
  top: 34px;
  right: -9px;
  width: 8px;
  height: 8px;
  border-top: 1.5px solid var(--acc);
  border-right: 1.5px solid var(--acc);
  transform: rotate(45deg);
}

.world-ladder__card {
  margin-bottom: 6px;
  font-size: 11px;
}

.world-ladder strong {
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: 17px;
  color: var(--arc-ink);
}

.world-ladder span:last-child {
  text-wrap: pretty;
  font-size: 13.5px;
  line-height: 1.45;
  color: var(--arc-muted);
}

.world-feature__note {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 14.5px;
  color: var(--arc-muted);
}

/* ---------- cards: a shot on top, its caption rising out of it ---------- */
.world-cards {
  list-style: none;
  margin: clamp(18px, 2vw, 28px) 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(14px, 1.6vw, 22px);
}

.world-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--arc-radius-lg);
  background: linear-gradient(180deg, #131318, #0f0f13);
  isolation: isolate;
  transition: transform .5s cubic-bezier(.2, .8, .2, 1), box-shadow .3s;
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
  background: linear-gradient(180deg, transparent, #131318);
}

.world-card::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px var(--arc-line);
  transition: box-shadow .3s;
}

.world-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 26px 60px rgba(0, 0, 0, .45);
}

.world-card:hover::after {
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--acc) 70%, transparent);
}

.world-card:hover :deep(.world-photo img) {
  transform: scale(1.045);
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
  font-size: clamp(20px, 1.7vw, 24px);
  line-height: 1.2;
  color: var(--arc-ink);
}

.world-card__copy > p {
  text-wrap: pretty;
  margin: 0;
  font-size: 14.5px;
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
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--arc-ink);
}

.world-card__copy > p:not(.world-card__fact) {
  margin-bottom: 16px;
}

.world-card__copy > p.world-card__fact {
  border-top: 1px solid var(--arc-line);
}

/* the Crimson Moon is a moon, not a photo: give it its own sky */
.world-moon {
  position: relative;
  display: grid;
  place-items: center;
  background:
    radial-gradient(46% 60% at 50% 46%, rgba(150, 22, 30, .5), transparent 72%),
    linear-gradient(180deg, #1a0709, #131318);
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
  transition: transform 1.2s cubic-bezier(.2, .8, .2, 1);
}

.world-card:hover .world-moon__disc {
  transform: scale(1.05) rotate(-4deg);
}

.world-moon__week {
  position: absolute;
  right: 14px;
  top: 14px;
  display: flex;
  gap: 7px;
  padding: 8px 10px;
  border-radius: 99px;
  background: rgba(8, 8, 10, .6);
}

.world-moon__week i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, .25);
}

.world-moon__week i.is-red {
  background: #ff3b47;
  box-shadow: 0 0 8px #ff3b47;
}

/* ---------- gallery ---------- */
.world-gallery__head {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  align-items: end;
  gap: 20px clamp(32px, 5vw, 72px);
  margin-top: var(--arc-block-gap);
  margin-bottom: clamp(22px, 2.6vw, 36px);
}

.world-gallery__aside {
  display: grid;
  justify-items: end;
  gap: 16px;
}

.world-gallery__aside p {
  max-width: 30em;
  margin: 0;
  font-size: var(--arc-fs-body);
  line-height: 1.6;
  color: var(--arc-muted);
  text-align: right;
  text-wrap: balance;
}

.world-gallery__actions {
  display: flex;
  gap: 10px;
}

.world-gallery__toggle {
  display: grid;
  place-items: center;
  width: 50px;
  height: 50px;
  border: 0;
  border-radius: 12px;
  background: rgba(255, 255, 255, .04);
  box-shadow: inset 0 0 0 1px var(--arc-line);
  color: var(--arc-ink);
  cursor: pointer;
  transition: box-shadow .2s;
}

.world-gallery__toggle svg {
  width: 15px;
  height: 15px;
}

.world-gallery__toggle:hover {
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--acc) 60%, transparent);
}

.world-gallery__toggle:focus-visible,
.world-strip:focus-visible {
  outline: 3px solid var(--arc-ink);
  outline-offset: 3px;
}

/* full-bleed: the strip runs edge to edge, fading at both ends */
.world-strip {
  margin-inline: calc(var(--arc-gutter) * -1);
  overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 7%, #000 93%, transparent);
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
  border-radius: var(--arc-radius);
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
    border-top: 1px solid var(--arc-line);
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

  .world-card:hover {
    transform: none;
  }

  .world-gallery__head {
    grid-template-columns: 1fr;
  }

  .world-gallery__aside {
    justify-items: start;
  }

  .world-gallery__aside p {
    text-align: left;
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

@media (prefers-reduced-motion: reduce) {
  .world-card,
  .world-moon__disc {
    transition: none;
  }

  .world-card:hover {
    transform: none;
  }
}
</style>
