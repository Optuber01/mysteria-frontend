<template>
  <section id="future" class="arc-section arc-future" aria-labelledby="arc-future-title">
    <div class="arc-future__sky" aria-hidden="true">
      <img :src="sky" alt="" loading="lazy" decoding="async" width="1920" height="1009">
    </div>

    <div class="arc-shell">
      <span id="join" class="arc-future__anchor" aria-hidden="true"></span>
      <ArcanaSectionHead split title-id="arc-future-title">
        <template #title>{{ t('home.world.join.titleA') }} <em>{{ t('home.world.join.titleB') }}</em></template>
        {{ lede }}
      </ArcanaSectionHead>

      <div class="arc-future__grid">
        <!-- three steps to the table -->
        <div class="arc-future__steps">
          <ol class="arc-steps">
            <li class="arc-step">
              <span class="arc-step__num" aria-hidden="true">1</span>
              <div class="arc-step__body">
                <h3>{{ t('home.world.join.step1Title') }}</h3>
                <button
                    type="button"
                    class="arc-ip"
                    :class="`is-${copyState}`"
                    :aria-describedby="'arc-future-copy-note'"
                    @click="copy"
                >
                  <span ref="addressRef" class="arc-ip__address">{{ address }}</span>
                  <span class="arc-ip__hint">
                    <i :class="copyIcon" aria-hidden="true"></i>
                    {{ copyLabel }}
                  </span>
                </button>
                <p id="arc-future-copy-note" class="arc-step__note" :class="`is-${copyState}`" aria-live="polite">
                  {{ copyNote }}
                </p>
              </div>
            </li>
            <li class="arc-step">
              <span class="arc-step__num" aria-hidden="true">2</span>
              <div class="arc-step__body">
                <h3>{{ t('home.world.join.step2Title') }}</h3>
                <p>{{ t('home.world.join.step2Body') }}</p>
              </div>
            </li>
            <li class="arc-step">
              <span class="arc-step__num" aria-hidden="true">3</span>
              <div class="arc-step__body">
                <h3>{{ t('home.world.join.step3Title') }}</h3>
                <p>{{ t('home.world.join.step3Body') }}</p>
              </div>
            </li>
          </ol>
        </div>

        <div class="arc-future__actions">
          <RouterLink :to="$lp('/guide/connect')" class="arc-btn arc-btn--solid">
            {{ t('home.world.join.guide') }}
            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </RouterLink>
          <a :href="DISCORD" class="arc-btn arc-btn--ghost" target="_blank" rel="noopener noreferrer">
            <IconDiscord class="arc-btn__icon" aria-hidden="true"/>
            {{ t('home.world.join.discord') }}
          </a>
        </div>

        <!-- live status -->
        <div class="arc-live" :class="statusClass">
          <div class="arc-live__row">
            <span class="arc-live__dot" aria-hidden="true"></span>
            <span v-if="isOnline && checkedAt" class="arc-live__count">{{ playerCount ?? 0 }}</span>
            <span class="arc-live__unit">{{ liveUnit }}</span>
          </div>
          <div v-if="seasonCount" class="arc-live__season">
            <strong>{{ seasonCount }}</strong>
            <span>{{ t('home.world.join.seasonLabel') }}</span>
          </div>
        </div>

        <!-- latest update -->
        <RouterLink :to="$lp(newsLink)" class="arc-news">
          <time v-if="newsDate" class="arc-news__date" :datetime="newsDateIso">{{ newsDate }}</time>
          <h3>{{ newsTitle }}</h3>
          <p v-if="newsBody" class="arc-news__body">{{ newsBody }}</p>
          <span class="arc-news__read">{{ t('home.world.join.newsRead') }} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {useServerStatus} from '@/composables/useServer';
import {useBeyonderStats} from '@/composables/useBeyonderStats';
import {SEASON_ANNOUNCEMENT_SLUG} from '@/constants/season';
import IconDiscord from '@/assets/icons/IconDiscord.vue';
import ArcanaSectionHead from './ArcanaSectionHead.vue';
import {useArcana} from './useArcana';
import {useCopyAddress} from './useCopyAddress';
import {useLatestNews} from './useLatestNews';
import sky from '@/assets/images/home-library/captures/hero-aurora-cliffside.webp';

const DISCORD = 'https://discord.com/invite/jc7GSxBWgb';

const {t, intlLocale} = useI18n();
const {reading, hasDrawn, card} = useArcana();
const addressRef = ref<HTMLElement | null>(null);
const {state: copyState, copy, address} = useCopyAddress(addressRef);
const {isOnline, playerCount, checkedAt} = useServerStatus();
const {totalBeyonders} = useBeyonderStats();

/* Before a draw (or for a Boon, which has no potion) the lede stays general; after a Pathway draw it names its first potion. */
const lede = computed(() => (hasDrawn.value && !card.value.boon
    ? t('home.world.join.ledeRole').replace('{role}', reading.value.seq9 || reading.value.name)
    : t('home.world.join.lede')));

const copyLabel = computed(() => ({
  idle: t('home.arcana.ip.copy'),
  copied: t('home.arcana.ip.copied'),
  failed: t('home.arcana.ip.failed'),
}[copyState.value]));
const copyIcon = computed(() => ({
  idle: 'fa-solid fa-copy',
  copied: 'fa-solid fa-check',
  failed: 'fa-solid fa-triangle-exclamation',
}[copyState.value]));
/* The line under the address always holds text, so the copy feedback never shifts the layout. */
const copyNote = computed(() => ({
  idle: t('home.world.join.step1Body'),
  copied: t('home.world.join.copiedHelp'),
  failed: t('home.arcana.ip.failedHelp'),
}[copyState.value]));

/* ---- live status ---- */
const statusClass = computed(() => (!checkedAt.value ? 'is-checking' : isOnline.value ? 'is-online' : 'is-offline'));
const liveUnit = computed(() => {
  if (!checkedAt.value) return t('home.arcana.status.checking');
  return isOnline.value ? t('home.world.join.liveUnit') : t('home.arcana.status.offline');
});
/* No number until the real one arrives: a made-up fallback could be wrong. */
const seasonCount = computed(() => (totalBeyonders.value ? totalBeyonders.value.toLocaleString(intlLocale.value) : ''));

/* ---- latest update ---- */
// Shared with the hero's changelog button: one request for both.
const {latest} = useLatestNews();

const fallbackLink = SEASON_ANNOUNCEMENT_SLUG ? `/news/${SEASON_ANNOUNCEMENT_SLUG}` : '/news';
const newsLink = computed(() => (latest.value ? `/news/${latest.value.slug}` : fallbackLink));
const newsTitle = computed(() => latest.value?.title ?? t('home.world.join.newsFallbackTitle'));
const newsBody = computed(() => latest.value?.shortDescription ?? t('home.world.join.newsFallbackBody'));
const newsDateValue = computed(() => {
  const raw = latest.value?.publishedAt ?? latest.value?.createdAt;
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
});
const newsDateIso = computed(() => newsDateValue.value?.toISOString());
const newsDate = computed(() => newsDateValue.value
    ?.toLocaleDateString(intlLocale.value, {day: 'numeric', month: 'long', year: 'numeric'}) ?? '');
</script>

<style scoped>
.arc-future {
  overflow: clip;
}

/* a dawn sky behind the steps, faded in and out so the section has no edges */
.arc-future__sky {
  position: absolute;
  inset: 0 0 auto;
  height: min(100%, 820px);
  z-index: 0;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 30%, #000 50%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 30%, #000 50%, transparent);
}

/* enlarged from its lower right corner: the photo has a stray spear in its upper left, which
   would cross the heading, and this crops it out */
.arc-future__sky img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: .3;
  transform: scale(1.5);
  transform-origin: 100% 100%;
}

.arc-future__sky::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(60% 70% at 70% 35%, color-mix(in oklab, var(--acc) 22%, transparent), transparent 70%);
}

.arc-future .arc-shell {
  position: relative;
  z-index: 1;
}

.arc-future__anchor {
  position: absolute;
  top: calc(var(--arc-section-pad) * -1);
  scroll-margin-top: var(--site-header-stack, 106px);
}

.arc-future__grid {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  /* the steps run down the left; the live count, the news card and the buttons stack on the right
     at their own height (whatever the data brings, no card is stretched to fill) */
  grid-template-rows: auto auto minmax(0, 1fr);
  grid-template-areas:
    'steps live'
    'steps news'
    'steps actions';
  gap: var(--arc-grid-gap);
  align-items: stretch;
}

.arc-future__steps {
  grid-area: steps;
}

/* ---- steps ---- */
.arc-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--arc-grid-gap);
}

.arc-step {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 20px;
  padding: clamp(20px, 2vw, 26px);
  border-radius: var(--arc-r-lg);
  background: var(--arc-raised);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
}

/* the step token: the same card as the rift steps and the town ladder (WorldChapter) */
.arc-step__num {
  display: grid;
  place-items: center;
  width: 32px;
  height: 46px;
  border-radius: var(--arc-r-sm);
  border: var(--arc-bw-accent) solid var(--acc-ink);
  background: color-mix(in oklab, var(--acc) 14%, var(--arc-chip-bg));
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 700;
  font-size: 15px;
  color: var(--acc-ink);
  transform: rotate(-6deg);
  transition: border-color .6s ease, background-color .6s ease, color .6s ease;
}

.arc-step h3 {
  margin: 2px 0 8px;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: var(--arc-fs-h4);
  line-height: 1.22;
  color: var(--arc-ink);
}

.arc-step p {
  text-wrap: pretty;
  margin: 0;
  font-size: var(--arc-fs-body);
  line-height: 1.6;
  color: var(--arc-muted);
}

/* the hero's copy field (global .arc-ip), full width */
.arc-step .arc-ip {
  width: 100%;
  justify-content: space-between;
  margin-top: 4px;
}

.arc-step p.arc-step__note {
  min-height: 1.6em;
  margin-top: 10px;
  font-size: var(--arc-fs-small);
  transition: color .2s;
}

.arc-step p.arc-step__note.is-copied {
  color: var(--arc-ok);
}

.arc-step p.arc-step__note.is-failed {
  color: var(--arc-bad);
}

.arc-future__actions {
  grid-area: actions;
  align-self: start;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

/* ---- live + news ---- */
.arc-live {
  grid-area: live;
}

.arc-news {
  grid-area: news;
  align-self: start;
}

.arc-live,
.arc-news {
  display: block;
  padding: clamp(20px, 2vw, 26px);
  border-radius: var(--arc-r-lg);
  background: var(--arc-raised);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
}

.arc-live__row {
  display: flex;
  align-items: baseline;
  min-height: 54px;
  gap: 12px;
  margin: 0;
}

.arc-live__dot {
  flex: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--arc-muted);
  align-self: center;
}

.is-online .arc-live__dot {
  position: relative;
  background: #4ade80;
}

/* the ring grows and fades (transform + opacity, composited) instead of animating a box-shadow */
.is-online .arc-live__dot::after {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(74, 222, 128, .55);
  content: '';
  animation: arc-pulse 2s infinite;
}

.is-offline .arc-live__dot {
  background: #f87171;
}

@keyframes arc-pulse {
  0% { transform: scale(1); opacity: 1; }
  70% { transform: scale(3); opacity: 0; }
  100% { transform: scale(1); opacity: 0; }
}

.arc-live__count {
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 700;
  font-size: 54px;
  line-height: 1;
  color: var(--arc-ink);
}

.arc-live__unit {
  font-size: 16px;
  line-height: 1.3;
  color: var(--arc-muted);
}

.arc-live__season {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: var(--arc-bw) solid var(--arc-line);
}

.arc-live__season strong {
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: 26px;
  line-height: 1;
  color: var(--acc-ink);
  transition: color .6s ease;
}

.arc-live__season span {
  font-size: var(--arc-fs-small);
  color: var(--arc-muted);
}

.arc-news {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  color: inherit;
  transition: box-shadow .25s, transform .3s cubic-bezier(.2, .8, .2, 1);
}

/* a link card: the family's hover (2px lift, accent edge) and press */
.arc-news:hover {
  color: inherit;
  transform: translateY(-2px);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line-hot);
}

.arc-news:active {
  transform: scale(.98);
  transition-duration: .08s;
}

.arc-news__date {
  margin-bottom: 8px;
  font-size: var(--arc-fs-caption);
  line-height: 1.4;
  color: var(--arc-muted);
}

.arc-news h3 {
  margin: 0 0 8px;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: var(--arc-fs-h4);
  line-height: 1.22;
  color: var(--arc-ink);
}

.arc-news__body {
  margin: 0 0 14px;
  font-size: var(--arc-fs-body);
  line-height: 1.55;
  color: var(--arc-muted);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.arc-news__read {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--arc-ink);
}

.arc-news__read i {
  font-size: 12px;
  color: var(--acc-ink);
  transition: transform .3s cubic-bezier(.2, .8, .2, 1);
}

.arc-news:hover .arc-news__read i {
  transform: translateX(3px);
}

@media (max-width: 960px) {
  .arc-future__grid {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    grid-template-areas:
      'steps'
      'actions'
      'live'
      'news';
  }
}

@media (max-width: 520px) {
  .arc-step {
    grid-template-columns: 1fr;
    gap: 14px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .is-online .arc-live__dot::after {
    animation: none;
    opacity: 0;
  }
}
</style>
