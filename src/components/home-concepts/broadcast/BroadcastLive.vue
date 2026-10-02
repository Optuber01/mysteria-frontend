<template>
  <section id="live" class="bc-live bc-light" aria-labelledby="bc-live-title">
    <div class="bc-shell">
      <header class="live-head">
        <div v-reveal>
          <p class="bc-label">{{ t('home.broadcast.live.label') }}</p>
          <h2 id="bc-live-title" class="bc-h2">{{ t('home.broadcast.live.title') }}</h2>
        </div>
        <RouterLink v-reveal="100" :to="$lp('/news')" class="bc-btn bc-btn-ghost">
          {{ t('home.broadcast.live.allNews') }} <span class="bc-arrow" aria-hidden="true">→</span>
        </RouterLink>
      </header>

      <div class="desk">
        <!-- Server status -->
        <article v-reveal class="card card-status">
          <p class="card-label">{{ t('home.broadcast.live.serverLabel') }}</p>
          <p :class="['status-line', statusClass]">
            <span class="dot" aria-hidden="true"></span>
            {{ statusText }}
          </p>
          <p class="big-number">{{ playersText }}</p>
          <p class="card-sub">{{ isOnline ? t('home.broadcast.live.playersNow') : t('home.broadcast.live.playersUnknown') }}</p>
          <p v-if="checkedText" class="card-meta">{{ checkedText }}</p>
          <button type="button" :class="['mini-copy', copyState]" @click="copy">
            <span class="mini-ip">{{ address }}</span>
            <span class="mini-act">{{ copyState === 'copied' ? t('home.broadcast.copy.done') : copyState === 'failed' ? t('home.broadcast.copy.failedShort') : t('home.broadcast.copy.action') }}</span>
          </button>
          <p class="bc-sr" role="status" aria-live="polite">{{ copyState === 'copied' ? t('home.broadcast.copy.doneLong') : copyState === 'failed' ? t('home.broadcast.copy.failed').replace('{address}', address) : '' }}</p>
        </article>

        <!-- Census -->
        <article v-reveal="90" class="card card-census">
          <p class="card-label">{{ t('home.broadcast.live.censusLabel') }}</p>
          <p class="big-number">{{ beyondersText }}</p>
          <p class="card-sub">{{ t('home.broadcast.live.censusSub') }}</p>
          <dl v-if="stats" class="census-grid">
            <div><dt>{{ t('home.broadcast.live.advanced') }}</dt><dd>{{ format(advancedBeyonders) }}</dd></div>
            <div><dt>{{ t('home.broadcast.live.average') }}</dt><dd>{{ averageSequence }}</dd></div>
            <div><dt>{{ t('home.broadcast.live.active') }}</dt><dd>{{ uniquePathways }}</dd></div>
          </dl>
          <dl v-else class="census-grid">
            <div><dt>{{ t('home.broadcast.live.seasonLabel') }}</dt><dd>{{ season.numeral }}</dd></div>
            <div><dt>{{ t('home.broadcast.live.dayLabel') }}</dt><dd>{{ season.day }}</dd></div>
            <div><dt>{{ t('home.broadcast.live.opened') }}</dt><dd>{{ seasonStart }}</dd></div>
          </dl>
        </article>

        <!-- Top pathways, or the seat caps when the census is unavailable -->
        <article v-reveal="180" class="card card-paths">
          <template v-if="topFive.length">
            <p class="card-label">{{ t('home.broadcast.live.topLabel') }}</p>
            <ol class="top-list">
              <li v-for="(pathway, index) in topFive" :key="pathway.name">
                <RouterLink :to="$lp(`/pathways/${pathway.name.toLowerCase()}`)" class="top-row">
                  <span class="top-rank">{{ index + 1 }}</span>
                  <img :src="sigilThumb(pathway.name.toLowerCase())" alt="" width="256" height="256" loading="lazy">
                  <span class="top-name">{{ nameOf(pathway.name) }}</span>
                  <span class="top-bar" aria-hidden="true"><i :style="{transform: `scaleX(${pathway.count / maxPathwayCount})`}"></i></span>
                  <span class="top-count">{{ format(pathway.count) }}</span>
                </RouterLink>
              </li>
            </ol>
          </template>
          <template v-else>
            <p class="card-label">{{ t('home.broadcast.live.seatsLabel') }}</p>
            <p class="seats-lede">{{ t('home.broadcast.live.seatsLede') }}</p>
            <ol class="seats">
              <li v-for="seat in seats" :key="seat.n">
                <span class="seat-n">{{ t('home.broadcast.live.seq').replace('{n}', String(seat.n)) }}</span>
                <span class="seat-pips" aria-hidden="true"><i v-for="p in Math.min(seat.limit, 18)" :key="p"></i></span>
                <span class="seat-count">{{ t('home.broadcast.live.seatCount').replace('{n}', String(seat.limit)) }}</span>
              </li>
            </ol>
            <RouterLink :to="$lp('/ascension')" class="text-link">{{ t('home.broadcast.live.registry') }} →</RouterLink>
          </template>
        </article>

        <!-- Latest update -->
        <RouterLink v-reveal :to="$lp(latest.to)" class="card card-news">
          <span class="news-media">
            <img :src="latest.image" :alt="latest.alt" loading="lazy" decoding="async" width="1920" height="810">
            <span class="news-flag">{{ t('home.broadcast.live.latest') }}</span>
          </span>
          <span class="news-copy">
            <span class="card-label">{{ latest.date || t('home.broadcast.live.newsFallbackDate') }}</span>
            <span class="news-title">{{ latest.title }}</span>
            <span class="news-body">{{ latest.body }}</span>
            <span class="text-link">{{ t('home.broadcast.live.read') }} →</span>
          </span>
        </RouterLink>
      </div>

      <div class="community">
        <div v-reveal class="community-copy">
          <p class="bc-label">{{ t('home.broadcast.community.label') }}</p>
          <h3 class="community-title">{{ t('home.broadcast.community.title') }}</h3>
          <p class="community-lede">{{ t('home.broadcast.community.lede') }}</p>
        </div>
        <ul class="channels">
          <li v-for="(channel, index) in channels" :key="channel.id" v-reveal="index * 90">
            <a :href="channel.url" target="_blank" rel="noopener noreferrer" :class="['channel', `channel-${channel.id}`]">
              <component :is="channel.icon" class="channel-icon" aria-hidden="true"/>
              <span class="channel-title">{{ t(`home.broadcast.community.${channel.id}.title`) }}</span>
              <span class="channel-body">{{ t(`home.broadcast.community.${channel.id}.body`) }}</span>
              <span class="channel-cta">
                {{ t(`home.broadcast.community.${channel.id}.cta`) }}
                <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
                <span class="bc-sr">{{ t('home.broadcast.newTab') }}</span>
              </span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {useServerStatus} from '@/composables/useServer';
import {useBeyonderStats} from '@/composables/useBeyonderStats';
import {newsAPI} from '@/utils/api/news';
import type {NewsArticle} from '@/types/news';
import {SEASON_ANNOUNCEMENT_SLUG, SEASON_START} from '@/constants/season';
import {seasonInfo, sigilThumb, useAddressCopy, usePathwayData, vReveal, whenIdle} from './broadcast';
import IconDiscord from '@/assets/icons/IconDiscord.vue';
import IconWiki from '@/assets/icons/IconWiki.vue';
import IconMap from '@/assets/icons/IconMap.vue';
import startBanner from '@/assets/images/home-library/captures/wiki/start-banner.webp';

const {t, intlLocale, locale, currentLanguage} = useI18n();
const {isOnline, playerCount, checkedAt} = useServerStatus();
const {stats, totalBeyonders, advancedBeyonders, averageSequence, uniquePathways, topPathways, maxPathwayCount} = useBeyonderStats();
const {state: copyState, copy, address} = useAddressCopy();
const {pathways} = usePathwayData();
const season = seasonInfo();

const format = (value: number) => new Intl.NumberFormat(intlLocale.value).format(value);
const nameOf = (id: string) => pathways.value?.pathwayName(id, currentLanguage.value) ?? id;

const statusClass = computed(() => (checkedAt.value === null ? 'checking' : isOnline.value ? 'online' : 'offline'));
const statusText = computed(() =>
  checkedAt.value === null ? t('home.broadcast.stats.checking')
    : isOnline.value ? t('home.broadcast.live.online') : t('home.broadcast.live.offline'),
);
const playersText = computed(() => (isOnline.value && playerCount.value !== null ? format(playerCount.value) : '-'));
const checkedText = computed(() =>
  checkedAt.value
    ? t('home.broadcast.live.checked').replace('{time}', new Intl.DateTimeFormat(intlLocale.value, {hour: '2-digit', minute: '2-digit'}).format(checkedAt.value))
    : '',
);
const beyondersText = computed(() => (totalBeyonders.value > 0 ? format(totalBeyonders.value) : t('home.broadcast.stats.beyondersFallback')));
const seasonStart = computed(() => new Intl.DateTimeFormat(intlLocale.value, {day: 'numeric', month: 'short'}).format(SEASON_START));

const channels = [
  {id: 'discord', url: 'https://discord.com/invite/jc7GSxBWgb', icon: IconDiscord},
  {id: 'wiki', url: 'https://wiki.mysterria.net/', icon: IconWiki},
  {id: 'map', url: 'https://map.mysterria.net/', icon: IconMap},
];

const topFive = computed(() => topPathways.value.slice(0, 5));

const seats = [
  {n: 3, limit: 18},
  {n: 2, limit: 9},
  {n: 1, limit: 3},
  {n: 0, limit: 1},
];

/* Latest update: the newest article, or the season announcement when the API is unreachable. */
const article = ref<NewsArticle | null>(null);

const latest = computed(() => {
  const item = article.value;
  if (item) {
    const date = item.publishedAt || item.createdAt;
    return {
      to: `/news/${item.slug}`,
      image: item.preview || startBanner,
      alt: item.title,
      title: item.title,
      body: item.shortDescription,
      date: date ? new Intl.DateTimeFormat(intlLocale.value, {day: 'numeric', month: 'long', year: 'numeric'}).format(new Date(date)) : '',
    };
  }
  return {
    to: SEASON_ANNOUNCEMENT_SLUG ? `/news/${SEASON_ANNOUNCEMENT_SLUG}` : '/news',
    image: startBanner,
    alt: t('home.broadcast.live.newsFallbackAlt'),
    title: t('home.broadcast.live.newsFallbackTitle'),
    body: t('home.broadcast.live.newsFallbackBody'),
    date: '',
  };
});

onMounted(() => {
  whenIdle(async () => {
    try {
      const response = await newsAPI.getLatest(locale.value.articleLocale);
      const list = Array.isArray(response.data) ? response.data : [];
      article.value = [...list].sort(
        (a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime(),
      )[0] ?? null;
    } catch {
      article.value = null;
    }
  }, 3000);
});
</script>

<style scoped>
.bc-live {
  padding: clamp(60px, 6.5vw, 96px) 0;
}

.live-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: clamp(36px, 4vw, 56px);
}

.live-head .bc-h2 {
  margin-top: 18px;
}

.desk {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: clamp(12px, 1.4vw, 20px);
}

.card {
  display: flex;
  flex-direction: column;
  padding: clamp(22px, 2.2vw, 32px);
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 1px 0 rgba(10, 11, 16, 0.04), 0 24px 48px -32px rgba(10, 11, 16, 0.28);
  color: var(--bc-ink);
  text-decoration: none;
  box-sizing: border-box;
}

.card-status,
.card-census,
.card-paths,
.card-news {
  grid-column: span 3;
}

.card-status {
  background: var(--bc-night);
  color: var(--bc-snow);
}

.card-label {
  margin: 0 0 16px;
  font-family: var(--bc-font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--bc-ink-2);
}

.card-status .card-label {
  color: var(--bc-mute);
}

.status-line {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-weight: 600;
}

.dot {
  position: relative;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--bc-mute);
}

.online .dot {
  background: var(--bc-live);
}

.online .dot::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--bc-live);
  animation: ping 1.8s ease-out infinite;
}

.offline .dot {
  background: var(--bc-alert);
}

@keyframes ping {
  from { transform: scale(1); opacity: 0.8; }
  to { transform: scale(3); opacity: 0; }
}

.big-number {
  margin: 18px 0 4px;
  font-family: var(--bc-font-display);
  font-size: clamp(40px, 3.7vw, 60px);
  font-weight: 700;
  line-height: 0.95;
  letter-spacing: -0.05em;
}

.card-sub {
  margin: 0;
  font-size: 15px;
  color: var(--bc-ink-2);
}

.card-status .card-sub {
  color: var(--bc-mute);
}

.card-meta {
  margin: 6px 0 0;
  font-family: var(--bc-font-mono);
  font-size: 11px;
  color: var(--bc-mute);
}

.mini-copy {
  display: flex;
  margin-bottom: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding: 6px 6px 6px 16px;
  border: 1px solid var(--bc-line-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--bc-snow);
  font: inherit;
  cursor: pointer;
  transition: border-color .25s ease;
}

.mini-copy:hover {
  border-color: var(--bc-snow);
}

.mini-ip {
  font-family: var(--bc-font-mono);
  font-size: 14px;
}

.mini-act {
  padding: 8px 14px;
  border-radius: 999px;
  background: var(--bc-blue);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}

.mini-copy.copied .mini-act {
  background: var(--bc-live);
  color: var(--bc-ink);
}

.mini-copy.failed .mini-act {
  background: var(--bc-alert);
  color: var(--bc-ink);
}

.census-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: auto 0 0;
  padding-top: 24px;
  border-top: 1px solid var(--bc-line-ink);
}

.card-census .card-sub {
  margin-bottom: 24px;
}

.census-grid dt {
  font-size: 12px;
  line-height: 1.35;
  color: var(--bc-ink-2);
}

.census-grid dd {
  margin: 6px 0 0;
  font-family: var(--bc-font-display);
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

/* Top pathways */
.top-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.top-row {
  display: grid;
  position: relative;
  grid-template-columns: 14px 28px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 6px 0 9px;
  color: inherit;
  text-decoration: none;
}

.top-row:hover .top-name {
  color: var(--bc-blue-ink);
}

.top-rank {
  font-family: var(--bc-font-mono);
  font-size: 12px;
  color: var(--bc-ink-2);
}

.top-row img {
  width: 28px;
  height: 28px;
}

.top-name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-bar {
  position: absolute;
  left: 52px;
  right: 0;
  bottom: 0;
  height: 3px;
  border-radius: 3px;
  background: var(--bc-paper-2);
  overflow: hidden;
}

.top-bar i {
  display: block;
  height: 100%;
  background: var(--bc-blue);
  transform-origin: left;
}

.top-count {
  font-family: var(--bc-font-mono);
  font-size: 12px;
  color: var(--bc-ink-2);
}

/* Seats fallback */
.seats-lede {
  margin: 0 0 20px;
  font-size: 15px;
  line-height: 1.55;
  color: var(--bc-ink-2);
}

.seats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0 0 20px;
  padding: 0;
  list-style: none;
}

.seats li {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 22px;
  align-items: center;
  gap: 10px;
}

.seat-n {
  font-family: var(--bc-font-mono);
  font-size: 12px;
  color: var(--bc-ink);
}

.seat-pips {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.seat-pips i {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--bc-blue);
}

.seat-count {
  font-size: 13px;
  color: var(--bc-ink-2);
}

.text-link {
  margin-top: auto;
  font-family: var(--bc-font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--bc-blue-ink);
  text-decoration: none;
}

/* Latest update */
.card-news {
  padding: 0;
  overflow: hidden;
}

.news-media {
  position: relative;
  display: block;
  flex: none;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--bc-night);
}

.news-media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 1.1s var(--bc-ease);
}

.card-news:hover .news-media img {
  transform: scale(1.04);
}

.news-flag {
  position: absolute;
  top: 16px;
  left: 16px;
  padding: 6px 10px;
  border-radius: 4px;
  background: var(--bc-blue);
  color: #fff;
  font-family: var(--bc-font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.news-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: clamp(20px, 2vw, 28px);
}

.news-copy .card-label {
  margin-bottom: 10px;
}

.news-title {
  font-family: var(--bc-font-display);
  font-size: clamp(19px, 1.5vw, 23px);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.025em;
  text-wrap: balance;
}

.news-body {
  margin: 10px 0 18px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--bc-ink-2);
}

.card-news:hover .news-title {
  color: var(--bc-blue-ink);
}

/* ── Community row ── */
.community {
  display: grid;
  gap: 24px;
  margin-top: clamp(40px, 4.5vw, 64px);
  padding-top: clamp(32px, 3.5vw, 48px);
  border-top: 1px solid var(--bc-line-ink);
}

.community-copy {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 8px 72px;
  align-items: end;
}

.community-copy .bc-label {
  grid-column: 1 / -1;
}

.community-title {
  margin: 4px 0 0;
  font-family: var(--bc-font-display);
  font-size: clamp(22px, 2vw, 30px);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.community-lede {
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
  color: var(--bc-ink-2);
}

.channels {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: clamp(12px, 1.4vw, 20px);
  margin: 0;
  padding: 0;
  list-style: none;
}

.channel {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  grid-template-rows: auto 1fr auto;
  column-gap: 18px;
  height: 100%;
  padding: clamp(24px, 2.4vw, 36px);
  border: 1px solid var(--bc-line);
  border-radius: 18px;
  background: var(--bc-night);
  color: var(--bc-snow);
  text-decoration: none;
  box-sizing: border-box;
  transition: transform .4s var(--bc-ease), border-color .3s ease, background-color .3s ease;
}

.channel:hover {
  transform: translateY(-4px);
  border-color: var(--bc-line-strong);
}

.channel-discord {
  border-color: transparent;
  background: var(--bc-blue);
  color: #fff;
}

.channel-discord:hover {
  background: #2341e6;
  border-color: transparent;
}

.channel-icon {
  grid-row: 1 / span 3;
  width: 40px;
  height: 40px;
  fill: currentColor;
  color: inherit;
}

.channel-title {
  margin-top: 4px;
  font-family: var(--bc-font-display);
  font-size: clamp(20px, 1.7vw, 26px);
  font-weight: 600;
  letter-spacing: -0.025em;
}

.channel-body {
  margin: 8px 0 18px;
  font-size: 15px;
  line-height: 1.55;
  color: var(--bc-mute);
}

.channel-discord .channel-body {
  color: #e2e7ff;
}

.channel-cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--bc-font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.channel-cta i {
  font-size: 11px;
}


@media (max-width: 1100px) {
  .channels {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .community-copy {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1100px) {
  .card-status,
  .card-census,
  .card-paths,
  .card-news {
    grid-column: span 6;
  }
}

@media (max-width: 640px) {
  .card-status,
  .card-census,
  .card-paths,
  .card-news {
    grid-column: 1 / -1;
  }
}
</style>
