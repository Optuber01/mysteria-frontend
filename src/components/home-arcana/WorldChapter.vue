<template>
  <section id="world" class="arc-section world" aria-labelledby="world-title">
    <div class="arc-shell">
      <ArcanaSectionHead split title-id="world-title">
        <template #title>{{ t('home.world.titleA') }} <em>{{ t('home.world.titleB') }}</em></template>
        {{ t('home.world.lede') }}
      </ArcanaSectionHead>

      <!-- the flagship: the Pantheon, its hall of thrones and the road up to it -->
      <article class="pantheon" aria-labelledby="pantheon-title">
        <div class="pantheon__hall">
          <ul class="thrones" :aria-label="t('home.world.pantheon.boardLabel')">
            <li
                v-for="throne in thrones"
                :key="throne.id"
                class="throne"
                :class="{'is-held': throne.held, 'is-yours': throne.yours}"
                :style="{'--seat': throne.accent, '--lift': `${throne.lift}px`}"
                :title="throne.label"
            >
              <img :src="sigilThumb(throne.id)" alt="" width="64" height="64" loading="lazy" decoding="async" draggable="false">
              <span class="arc-sr">{{ throne.label }}</span>
              <span v-if="throne.yours" class="throne__name" aria-hidden="true">{{ throne.name }}</span>
            </li>
          </ul>
        </div>

        <div class="pantheon__intro">
          <h3 id="pantheon-title" class="pantheon__title">{{ t('home.world.pantheon.title') }}</h3>
          <p class="pantheon__body">{{ t('home.world.pantheon.body') }}</p>
          <p class="pantheon__body">{{ t('home.world.pantheon.rule') }}</p>
          <div class="pantheon__foot">
            <RouterLink :to="$lp('/ascension')" class="arc-btn arc-btn--ghost">{{ t('home.world.pantheon.cta') }}</RouterLink>
            <p v-if="hasSeatData" class="arc-status is-online">
              <span class="arc-status__dot" aria-hidden="true"></span>{{ heldText }}
            </p>
          </div>
        </div>

        <ol class="pantheon__road" :aria-label="t('home.world.pantheon.roadLabel')">
          <li v-for="(step, index) in road" :key="step.key">
            <span class="road-token" aria-hidden="true">{{ index + 1 }}</span>
            <span class="road-text">
              <strong>{{ step.title }}</strong>
              <span>{{ step.body }}</span>
            </span>
          </li>
        </ol>
      </article>

      <!-- the second feature: PvP, where the zone's colour is the price -->
      <article class="incursion" aria-labelledby="incursions-title">
        <div class="incursion__copy">
          <h3 id="incursions-title" class="incursion__title">{{ t('home.world.incursions.title') }}</h3>
          <p>{{ t('home.world.incursions.body') }}</p>
        </div>
        <ul class="world-notes incursion__notes">
          <li><i class="fa-solid fa-box-open" aria-hidden="true"></i>{{ t('home.world.incursions.permanent') }}</li>
          <li><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>{{ t('home.world.incursions.logout') }}</li>
        </ul>
        <ol class="tiers" :aria-label="t('home.world.incursions.tiersLabel')">
          <li v-for="tier in tiers" :key="tier.key" class="tier" :class="`tier--${tier.key}`">
            <strong>{{ tier.name }}</strong>
            <span>{{ tier.stake }}</span>
          </li>
        </ol>
      </article>

      <!-- the rest of the native systems: two rows, the wide half swapping sides -->
      <div class="world-bento">
        <article class="sys sys--rifts" aria-labelledby="rifts-title">
          <WorldPhoto
              class="sys__photo"
              :shot="shots.rifts"
              :alt="t('home.world.rifts.alt')"
              sizes="(max-width: 900px) 100vw, 56vw"
          />
          <div class="sys__copy">
            <h3 id="rifts-title" class="sys__title">{{ t('home.world.rifts.title') }}</h3>
            <p class="sys__body">{{ t('home.world.rifts.body') }}</p>
            <ul class="classes" :aria-label="t('home.world.rifts.classesLabel')">
              <li v-for="item in classes" :key="item.key">
                <strong>{{ item.name }}</strong>
                <span>{{ item.body }}</span>
              </li>
            </ul>
            <p class="sys__fact"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>{{ t('home.world.rifts.guardians') }}</p>
          </div>
        </article>

        <article class="sys sys--arena" aria-labelledby="arena-title">
          <div class="fan" aria-hidden="true">
            <div
                v-for="(id, index) in fanCards"
                :key="id"
                class="fan__card"
                :style="{'--i': index - 2}"
            >
              <ArcanaFace :id="id" :name="nameOf(id)"/>
            </div>
          </div>
          <div class="sys__copy">
            <h3 id="arena-title" class="sys__title">{{ t('home.world.arena.title') }}</h3>
            <p class="sys__body">{{ t('home.world.arena.body') }}</p>
            <p class="sys__fact"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i>{{ t('home.world.arena.safe') }}</p>
          </div>
        </article>

        <article class="sys sys--churches" aria-labelledby="churches-title">
          <WorldPhoto
              class="sys__photo"
              :shot="shots.churches"
              :alt="t('home.world.churches.alt')"
              sizes="(max-width: 900px) 100vw, 40vw"
          />
          <div class="sys__copy">
            <h3 id="churches-title" class="sys__title">{{ t('home.world.churches.title') }}</h3>
            <p class="sys__body">{{ t('home.world.churches.body') }}</p>
            <p class="sys__fact"><i class="fa-solid fa-scroll" aria-hidden="true"></i>{{ t('home.world.churches.honorific') }}</p>
          </div>
        </article>

        <article class="sys sys--anchors" aria-labelledby="anchors-title">
          <!-- the Anchor's boss bar: the server wears it down, and under 10% its heart opens -->
          <div class="seed" aria-hidden="true">
            <div class="seed__bar">
              <span class="seed__name">{{ t('home.world.anchors.bar') }}</span>
              <span class="seed__track"><span class="seed__fill"></span><span class="seed__mark"></span></span>
              <span class="seed__raid">{{ t('home.world.anchors.raid') }}</span>
            </div>
          </div>
          <div class="sys__copy">
            <h3 id="anchors-title" class="sys__title">{{ t('home.world.anchors.title') }}</h3>
            <p class="sys__body">{{ t('home.world.anchors.body') }}</p>
            <p class="sys__fact"><i class="fa-solid fa-gem" aria-hidden="true"></i>{{ t('home.world.anchors.boons') }}</p>
          </div>
        </article>
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
import {useBeyonderStats} from '@/composables/useBeyonderStats';
import IconDiscord from '@/assets/icons/IconDiscord.vue';
import ArcanaFace from './ArcanaFace.vue';
import ArcanaSectionHead from './ArcanaSectionHead.vue';
import WorldPhoto from './WorldPhoto.vue';
import {GALLERY_SHOTS, TOPIC_SHOTS} from './WorldShots';
import {CORE_CARDS, sigilThumb} from './arcana-data';
import {useArcana} from './useArcana';

const DISCORD = 'https://discord.com/invite/jc7GSxBWgb';

const {t} = useI18n();
const {currentId, hasDrawn, nameOf} = useArcana();
const {highSeats} = useBeyonderStats();
const shots = TOPIC_SHOTS;

/* ---- the Pantheon: one throne per Pathway, lit where a god sits (live from the Ascension registry) ---- */
const hasSeatData = computed(() => highSeats.value.length > 0);
const heldIds = computed(() => new Set(highSeats.value
    .filter(entry => (entry.counts[0] ?? 0) > 0)
    .map(entry => entry.pathway.toLowerCase())));
const heldText = computed(() => t('home.world.pantheon.held').replace('{count}', String(heldIds.value.size)));

/* The row bows up toward its middle; `lift` is how far each throne sits below the crown. */
const MID = (CORE_CARDS.length - 1) / 2;
const thrones = computed(() => CORE_CARDS.map((card, index) => {
  const held = heldIds.value.has(card.id);
  const name = nameOf(card.id);
  const label = hasSeatData.value
      ? t(held ? 'home.world.pantheon.throneHeld' : 'home.world.pantheon.throneEmpty').replace('{pathway}', name)
      : name;
  return {
    id: card.id,
    accent: card.accent,
    held,
    yours: hasDrawn.value && currentId.value === card.id,
    name,
    label,
    lift: Math.round(((index - MID) / MID) ** 2 * 26),
  };
}));

const road = computed(() => ['climb', 'prove', 'brew', 'vigil', 'rite'].map(key => ({
  key,
  title: t(`home.world.pantheon.road.${key}.title`),
  body: t(`home.world.pantheon.road.${key}.body`),
})));

/* ---- Incursions: the four zone colours, cheapest death first ---- */
const tiers = computed(() => ['green', 'yellow', 'red', 'black'].map(key => ({
  key,
  name: t(`home.world.incursions.tiers.${key}.name`),
  stake: t(`home.world.incursions.tiers.${key}.stake`),
})));

const classes = computed(() => ['tank', 'warrior', 'archer', 'mage'].map(key => ({
  key,
  name: t(`home.world.rifts.classes.${key}.name`),
  body: t(`home.world.rifts.classes.${key}.body`),
})));

/* ---- Bedwars: a fan of Pathways, dealt at random on every visit like the match's loadout ---- */
const fanCards = ref<string[]>(['sun', 'door', 'tyrant', 'error', 'demoness']);
function dealFan() {
  const pool = CORE_CARDS.map(card => card.id);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  fanCards.value = pool.slice(0, 5);
}

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
  dealFan();
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
/* ---------- shared: titles, body copy and the one-line facts under a system ---------- */
.pantheon__title,
.incursion__title,
.sys__title,
.world-gallery__head h3 {
  margin: 0;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  color: var(--arc-ink);
  text-wrap: balance;
}

.pantheon__body,
.incursion__copy p,
.sys__body {
  margin: 0;
  font-size: var(--arc-fs-body);
  line-height: 1.65;
  color: var(--arc-muted);
  text-wrap: pretty;
}

.world-notes {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}

.world-notes li,
.sys__fact {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: var(--arc-fs-small);
  line-height: 1.5;
  color: var(--arc-ink);
  text-wrap: pretty;
}

.world-notes i,
.sys__fact i {
  flex: none;
  width: 14px;
  text-align: center;
  font-size: 12px;
  color: var(--acc-ink);
  transition: color .6s ease;
}

/* ---------- the Pantheon: one surface, the hall of thrones across its top ---------- */
.pantheon {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  gap: clamp(28px, 3vw, 44px) clamp(32px, 5vw, 80px);
  padding: clamp(28px, 3.2vw, 48px);
  border-radius: var(--arc-r-lg);
  overflow: hidden;
  isolation: isolate;
  background:
    radial-gradient(62% 46% at 50% 0%, color-mix(in oklab, var(--acc) 16%, transparent), transparent 72%),
    var(--arc-raised);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
  transition: background-color .6s ease;
}

.pantheon__hall {
  grid-column: 1 / -1;
  padding: 6px 0 calc(var(--arc-fs-caption) + 14px);
}

.thrones {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(22, minmax(0, 1fr));
  gap: clamp(5px, .62vw, 10px);
  align-items: start;
}

/* an arched niche; empty ones hold their sigil faintly, a seated god's glows in its Pathway's colour */
.throne {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 5 / 8;
  translate: 0 var(--lift);
  border-radius: 50% 50% var(--arc-r-sm) var(--arc-r-sm) / 32% 32% var(--arc-r-sm) var(--arc-r-sm);
  background: linear-gradient(180deg, color-mix(in oklab, var(--arc-ink) 7%, transparent), color-mix(in oklab, var(--arc-ink) 2%, transparent));
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
}

.throne img {
  width: 74%;
  height: auto;
  opacity: .34;
  filter: grayscale(1);
  user-select: none;
}

.throne.is-held {
  background:
    radial-gradient(70% 50% at 50% 46%, color-mix(in oklab, var(--seat) 42%, transparent), transparent 75%),
    linear-gradient(180deg, color-mix(in oklab, var(--seat) 14%, transparent), transparent);
  box-shadow:
    inset 0 0 0 var(--arc-bw) color-mix(in oklab, var(--seat) 62%, transparent),
    0 0 26px color-mix(in oklab, var(--seat) 30%, transparent);
}

.throne.is-held img {
  opacity: 1;
  filter: none;
}

/* the drawn Pathway's throne: the page's selected language (accent at the accent width) */
.throne.is-yours {
  box-shadow: inset 0 0 0 var(--arc-bw-accent) var(--acc-ink);
}

.throne.is-yours img {
  opacity: .8;
  filter: none;
}

.throne.is-yours.is-held {
  box-shadow:
    inset 0 0 0 var(--arc-bw-accent) var(--acc-ink),
    0 0 26px color-mix(in oklab, var(--seat) 30%, transparent);
}

.throne__name {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  translate: -50% 0;
  white-space: nowrap;
  font-size: var(--arc-fs-caption);
  font-weight: 600;
  line-height: 1;
  color: var(--acc-ink);
  transition: color .6s ease;
}

.pantheon__intro {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.pantheon__title {
  margin-bottom: 4px;
  font-size: var(--arc-fs-h2);
  line-height: 1.08;
  letter-spacing: -.02em;
}

.pantheon__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px 22px;
  padding-top: 10px;
}

/* the road: five steps on one thread, the last one the rite */
.pantheon__road {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  align-content: start;
  gap: 4px;
}

.pantheon__road li {
  position: relative;
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 16px;
  padding-bottom: 14px;
}

.pantheon__road li:not(:last-child)::before {
  content: '';
  position: absolute;
  top: 50px;
  bottom: -2px;
  left: 17px;
  width: var(--arc-bw);
  background: var(--arc-line);
}

.road-token {
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

.road-text {
  display: grid;
  gap: 3px;
  padding-top: 2px;
}

.road-text strong {
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: var(--arc-fs-h4);
  line-height: 1.22;
  color: var(--arc-ink);
}

.road-text span {
  font-size: var(--arc-fs-small);
  line-height: 1.55;
  color: var(--arc-muted);
  text-wrap: pretty;
}

/* ---------- Incursions: open page, the price scale under it ---------- */
.incursion {
  margin-top: var(--arc-block-gap);
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  align-items: end;
  gap: 24px clamp(32px, 5vw, 80px);
}

.incursion__copy {
  display: grid;
  gap: 14px;
}

.incursion__title {
  font-size: var(--arc-fs-h3);
  line-height: 1.12;
  letter-spacing: -.015em;
}

.incursion__notes {
  padding-left: clamp(20px, 2vw, 28px);
  border-left: var(--arc-bw) solid var(--arc-line);
}

.tiers {
  grid-column: 1 / -1;
  list-style: none;
  margin: calc(var(--arc-group-gap) - 24px) 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--arc-grid-gap);
}

/* each colour is a bar; the price rises left to right */
.tier {
  --tier: #3fbf6e;
  position: relative;
  display: grid;
  align-content: start;
  gap: 6px;
  padding-top: 26px;
}

.tier::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 8px;
  border-radius: 4px;
  background: var(--tier);
  box-shadow: 0 0 22px color-mix(in oklab, var(--tier) 34%, transparent);
}

.tier--yellow {
  --tier: #e6c24a;
}

.tier--red {
  --tier: #e5484d;
}

.tier--black {
  --tier: #040405;
}

.tier--black::before {
  box-shadow: inset 0 0 0 var(--arc-bw) rgba(255, 255, 255, .26), 0 0 0 transparent;
}

.tier strong {
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: var(--arc-fs-h4);
  line-height: 1.22;
  color: var(--arc-ink);
}

.tier span {
  font-size: var(--arc-fs-small);
  line-height: 1.5;
  color: var(--arc-muted);
  text-wrap: pretty;
}

/* ---------- the rest: a twelve-column bento, wide and narrow halves swapping sides ---------- */
.world-bento {
  margin-top: var(--arc-block-gap);
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: var(--arc-grid-gap);
}

.sys {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--arc-r-lg);
  background: var(--arc-card);
  isolation: isolate;
}

.sys::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  border-radius: inherit;
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
}

.sys--rifts {
  grid-column: span 7;
}

.sys--arena {
  grid-column: span 5;
}

.sys--churches {
  grid-column: span 5;
}

.sys--anchors {
  grid-column: span 7;
}

/* where a system is drawn rather than photographed, the drawing takes the card's spare height */
.sys--arena .sys__copy,
.sys--anchors .sys__copy {
  flex: none;
}

.sys__photo {
  flex: none;
  aspect-ratio: 2 / 1;
}

.sys--churches .sys__photo {
  aspect-ratio: 16 / 9;
}

/* the photo melts into the card */
.sys__photo::before {
  content: '';
  position: absolute;
  inset: 45% 0 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(180deg, transparent, var(--arc-card) 82%);
}

.sys__copy {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: -26px;
  padding: 0 clamp(22px, 2.2vw, 32px) clamp(22px, 2.2vw, 32px);
}

.sys__title {
  font-size: var(--arc-fs-h4);
  line-height: 1.22;
}

.sys__fact {
  margin: auto 0 0;
  padding-top: 14px;
  border-top: var(--arc-bw) solid var(--arc-line);
}

/* dungeon classes: four small tiles, two by two */
.classes {
  list-style: none;
  margin: 4px 0 6px;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.classes li {
  display: grid;
  gap: 2px;
  padding: 11px 14px 12px;
  border-radius: var(--arc-r-md);
  background: var(--arc-glass);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
}

.classes strong {
  font-size: var(--arc-fs-small);
  font-weight: 650;
  color: var(--arc-ink);
}

.classes span {
  font-size: var(--arc-fs-caption);
  line-height: 1.45;
  color: var(--arc-muted);
}

/* Bedwars: five Pathways fanned like a dealt hand, a different hand every visit */
.fan {
  position: relative;
  flex: 1 1 auto;
  min-height: 240px;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(180deg, #000 62%, transparent 96%);
  mask-image: linear-gradient(180deg, #000 62%, transparent 96%);
  background:
    radial-gradient(56% 62% at 50% 62%, color-mix(in oklab, var(--acc) 20%, transparent), transparent 72%),
    linear-gradient(180deg, color-mix(in oklab, var(--arc-ink) 4%, transparent), transparent 80%);
  transition: background-color .6s ease;
}

.fan__card {
  position: absolute;
  container-type: inline-size;
  --fw: clamp(76px, 8.4vw, 124px);
  left: 50%;
  /* the fan sits in the middle of whatever height the card gives it, never in its foot */
  bottom: max(18%, calc(50% - var(--fw) * .62));
  width: var(--fw);
  aspect-ratio: 1 / 1.62;
  transform-origin: 50% 160%;
  transform: translateX(-50%) rotate(calc(var(--i) * 12deg));
  z-index: calc(3 - max(var(--i), -1 * var(--i)));
  filter: drop-shadow(0 12px 22px rgba(0, 0, 0, .45));
}

/*
 * Outer Gods Anchors: a night over corrupted ground and the Anchor's boss bar, worn down to
 * just above the Heart Raid mark. A scene, so it stays dark (with light ink) in either theme.
 */
.seed {
  position: relative;
  flex: 1 1 auto;
  min-height: 220px;
  display: grid;
  place-items: center;
  padding: 28px clamp(22px, 2.2vw, 32px) 54px;
  overflow: hidden;
  background:
    radial-gradient(46% 70% at 50% 108%, rgba(146, 84, 255, .5), transparent 70%),
    radial-gradient(30% 40% at 18% 100%, rgba(52, 211, 180, .22), transparent 70%),
    radial-gradient(34% 44% at 84% 104%, rgba(232, 72, 140, .24), transparent 70%),
    linear-gradient(180deg, #0c0b12, #171126 70%, #221437);
  -webkit-mask-image: linear-gradient(180deg, #000 70%, transparent);
  mask-image: linear-gradient(180deg, #000 70%, transparent);
}

.seed__bar {
  width: min(100%, 440px);
  display: grid;
  grid-template-columns: 1fr;
  justify-items: center;
  gap: 9px;
  color: #f1f0f5;
}

.seed__name {
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: var(--arc-fs-small);
  letter-spacing: .02em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .6);
}

/* a boss bar: notched track, violet fill, a tick at 10% */
.seed__track {
  position: relative;
  width: 100%;
  height: 10px;
  border-radius: 2px;
  background: rgba(255, 255, 255, .1);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .16), 0 0 18px rgba(146, 84, 255, .35);
}

.seed__track::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: repeating-linear-gradient(90deg, transparent 0 calc(10% - 1px), rgba(0, 0, 0, .55) calc(10% - 1px) 10%);
}

.seed__fill {
  position: absolute;
  inset: 0 auto 0 0;
  width: 17%;
  border-radius: inherit;
  background: linear-gradient(180deg, #c4a2ff, #8b5cf6 55%, #6d3fd8);
}

.seed__mark {
  position: absolute;
  top: -5px;
  bottom: -5px;
  z-index: 1;
  left: 10%;
  width: 2px;
  background: #f1f0f5;
}

.seed__raid {
  justify-self: start;
  margin-left: 10%;
  translate: -50% 0;
  font-size: var(--arc-fs-caption);
  font-weight: 600;
  color: #e4e3ea;
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

.world-gallery__head h3 {
  font-size: var(--arc-fs-h2);
  line-height: 1.08;
  letter-spacing: -.02em;
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
  .tiers {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    row-gap: 26px;
  }
}

@media (max-width: 900px) {
  .pantheon,
  .incursion {
    grid-template-columns: 1fr;
  }

  /* two rows of eleven, flat */
  .thrones {
    grid-template-columns: repeat(11, minmax(0, 1fr));
    row-gap: 12px;
  }

  .throne {
    translate: none;
  }

  .incursion__notes {
    padding-left: 0;
    border-left: 0;
  }

  .tiers {
    margin-top: 8px;
  }

  .sys--rifts,
  .sys--arena,
  .sys--churches,
  .sys--anchors {
    grid-column: 1 / -1;
  }

  .world-gallery__head {
    grid-template-columns: 1fr;
  }

  .world-gallery__aside {
    justify-items: start;
  }
}

@media (max-width: 600px) {
  .tiers {
    grid-template-columns: 1fr;
  }

  .classes {
    grid-template-columns: 1fr;
  }

  .world-gallery__actions {
    width: 100%;
  }

  .world-gallery__actions .arc-btn:not(.world-gallery__toggle) {
    flex: 1;
    width: auto;
    white-space: nowrap;
  }
}
</style>
