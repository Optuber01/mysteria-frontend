<template>
  <section id="future" class="arc-section arc-future" aria-labelledby="arc-future-title">
    <div class="arc-future__sky" aria-hidden="true">
      <img :src="sky" alt="" loading="lazy" decoding="async" width="1920" height="1009">
    </div>

    <div class="arc-shell">
      <ArcanaSectionHead numeral="IV" :position="t('home.arcana.future.position')" title-id="arc-future-title">
        <template #title>{{ t('home.arcana.future.titleA') }} <em>{{ t('home.arcana.future.titleB') }}</em></template>
        {{ lede }}
      </ArcanaSectionHead>

      <div class="arc-future__grid">
        <!-- three steps to the table -->
        <ol class="arc-steps">
          <li class="arc-step">
            <span class="arc-step__num">1</span>
            <div class="arc-step__body">
              <h3>{{ t('home.arcana.future.step1Title') }}</h3>
              <button type="button" class="arc-ip arc-ip--big" :class="`is-${copyState}`" @click="copy">
                <span class="arc-ip__address">{{ address }}</span>
                <span class="arc-ip__hint" aria-live="polite">
                  <i :class="copyIcon" aria-hidden="true"></i>
                  {{ copyLabel }}
                </span>
              </button>
              <p v-if="copyState === 'failed'" class="arc-step__note is-warn">{{ t('home.arcana.ip.failedHelp') }}</p>
            </div>
          </li>
          <li class="arc-step">
            <span class="arc-step__num">2</span>
            <div class="arc-step__body">
              <h3>{{ t('home.arcana.future.step2Title') }}</h3>
              <p>{{ t('home.arcana.future.step2Body') }}</p>
            </div>
          </li>
          <li class="arc-step">
            <span class="arc-step__num">3</span>
            <div class="arc-step__body">
              <h3>{{ t('home.arcana.future.step3Title') }}</h3>
              <p>{{ t('home.arcana.future.step3Body') }}</p>
            </div>
          </li>
          <li class="arc-steps__actions">
            <RouterLink :to="$lp('/guide/connect')" class="arc-btn arc-btn--solid">
              {{ t('home.arcana.future.guide') }}
              <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </RouterLink>
            <a :href="DISCORD" class="arc-btn arc-btn--ghost" target="_blank" rel="noopener noreferrer">
              <IconDiscord class="arc-btn__icon" aria-hidden="true"/>
              {{ t('home.arcana.future.discord') }}
            </a>
          </li>
        </ol>

        <div class="arc-future__side">
          <!-- live status -->
          <div class="arc-live" :class="statusClass">
            <p class="arc-label">{{ t('home.arcana.future.liveLabel') }}</p>
            <div class="arc-live__row">
              <span class="arc-live__dot" aria-hidden="true"></span>
              <span v-if="isOnline && checkedAt" class="arc-live__count">{{ playerCount ?? 0 }}</span>
              <span class="arc-live__unit">{{ liveUnit }}</span>
            </div>
            <p class="arc-live__meta">{{ liveMeta }}</p>
          </div>

          <!-- latest update -->
          <RouterLink :to="$lp(newsLink)" class="arc-news">
            <p class="arc-label">{{ t('home.arcana.future.newsLabel') }}</p>
            <h3>{{ newsTitle }}</h3>
            <p v-if="newsBody" class="arc-news__body">{{ newsBody }}</p>
            <span class="arc-news__meta">
              <span v-if="newsDate">{{ newsDate }}</span>
              <span class="arc-news__read">{{ t('home.arcana.future.newsRead') }} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
            </span>
          </RouterLink>
        </div>
      </div>

      <!-- the companion mod -->
      <div id="companion" class="arc-companion">
        <div class="arc-companion__copy">
          <p class="arc-label">{{ t('companion.eyebrow') }}</p>
          <h3 class="arc-companion__title">{{ t('companion.title') }}</h3>
          <p class="arc-companion__lede">{{ t('companion.lede') }}</p>
          <ul class="arc-companion__features">
            <li v-for="feature in features" :key="feature.title">
              <i :class="feature.icon" aria-hidden="true"></i>
              <span><strong>{{ feature.title }}</strong> {{ feature.body }}</span>
            </li>
          </ul>
        </div>
        <div class="arc-companion__get">
          <p class="arc-label">{{ t('companion.downloadEyebrow') }}</p>
          <a
              v-for="platform in platforms"
              :key="platform.url"
              :href="platform.url"
              class="arc-companion__link"
              target="_blank"
              rel="noopener noreferrer"
          >
            <component :is="platform.icon" class="arc-companion__icon" aria-hidden="true"/>
            <span>{{ platform.name }}</span>
            <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
          </a>
          <p class="arc-companion__note"><strong>{{ t('companion.optionalLabel') }}.</strong> {{ t('companion.optional') }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {useServerStatus} from '@/composables/useServer';
import {newsAPI} from '@/utils/api/news';
import type {NewsArticle} from '@/types/news';
import {SEASON_ANNOUNCEMENT_SLUG} from '@/constants/season';
import IconDiscord from '@/assets/icons/IconDiscord.vue';
import IconGithub from '@/assets/icons/IconGithub.vue';
import IconCurseForge from '@/assets/icons/IconCurseForge.vue';
import IconModrinth from '@/assets/icons/IconModrinth.vue';
import ArcanaSectionHead from './ArcanaSectionHead.vue';
import {useArcana} from './useArcana';
import {useCopyAddress} from './useCopyAddress';
import sky from '@/assets/images/home-library/captures/hero-aurora-cliffside.webp';

const DISCORD = 'https://discord.com/invite/jc7GSxBWgb';

const {t, intlLocale, locale, currentLanguage} = useI18n();
const {reading} = useArcana();
const {state: copyState, copy, address} = useCopyAddress();
const {isOnline, playerCount, checkedAt} = useServerStatus();

const lede = computed(() => t('home.arcana.future.lede').replace('{role}', reading.value.seq9 || reading.value.name));

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

/* ---- live status ---- */
const statusClass = computed(() => (!checkedAt.value ? 'is-checking' : isOnline.value ? 'is-online' : 'is-offline'));
const liveUnit = computed(() => {
  if (!checkedAt.value) return t('home.arcana.status.checking');
  return isOnline.value ? t('home.arcana.future.liveUnit') : t('home.arcana.status.offline');
});
const liveMeta = computed(() => {
  if (!checkedAt.value) return t('home.arcana.future.liveMetaChecking');
  const time = checkedAt.value.toLocaleTimeString(intlLocale.value, {hour: '2-digit', minute: '2-digit'});
  return t('home.arcana.future.liveMeta').replace('{time}', time);
});

/* ---- latest update ---- */
const latest = ref<NewsArticle | null>(null);
async function loadNews() {
  try {
    const response = await newsAPI.getLatest(locale.value.articleLocale);
    latest.value = Array.isArray(response.data) && response.data.length ? response.data[0] : null;
  } catch {
    latest.value = null;
  }
}
onMounted(loadNews);
watch(currentLanguage, loadNews);

const fallbackLink = SEASON_ANNOUNCEMENT_SLUG ? `/news/${SEASON_ANNOUNCEMENT_SLUG}` : '/news';
const newsLink = computed(() => (latest.value ? `/news/${latest.value.slug}` : fallbackLink));
const newsTitle = computed(() => latest.value?.title ?? t('home.arcana.future.newsFallbackTitle'));
const newsBody = computed(() => latest.value?.shortDescription ?? t('home.arcana.future.newsFallbackBody'));
const newsDate = computed(() => {
  const raw = latest.value?.publishedAt ?? latest.value?.createdAt;
  if (!raw) return '';
  return new Date(raw).toLocaleDateString(intlLocale.value, {day: 'numeric', month: 'long', year: 'numeric'});
});

/* ---- companion ---- */
const features = computed(() => [
  {icon: 'fa-solid fa-keyboard', title: t('companion.featureHotkeysTitle'), body: t('companion.featureHotkeysBody')},
  {icon: 'fa-solid fa-wand-magic-sparkles', title: t('companion.featureVisualsTitle'), body: t('companion.featureVisualsBody')},
  {icon: 'fa-solid fa-volume-high', title: t('companion.featurePresenceTitle'), body: t('companion.featurePresenceBody')},
]);
const platforms = [
  {name: 'GitHub Releases', url: 'https://github.com/ikeepcalm/coi-client/releases', icon: IconGithub},
  {name: 'CurseForge', url: 'https://www.curseforge.com/minecraft/mc-mods/coi-client', icon: IconCurseForge},
  {name: 'Modrinth', url: 'https://modrinth.com/mod/coi-client', icon: IconModrinth},
];
</script>

<style scoped>
.arc-future {
  position: relative;
  overflow: clip;
}

.arc-future__sky {
  position: absolute;
  inset: 0 0 auto;
  height: 720px;
  z-index: 0;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 25%, #000 45%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 25%, #000 45%, transparent);
}

.arc-future__sky img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: .32;
}

.arc-future__sky::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(60% 70% at 70% 30%, color-mix(in oklab, var(--acc) 22%, transparent), transparent 70%);
}

.arc-future .arc-shell {
  position: relative;
  z-index: 1;
}

.arc-future__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: clamp(20px, 3vw, 40px);
  align-items: start;
}

/* ---- steps ---- */
.arc-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}

.arc-step {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 18px;
  padding: 22px 24px;
  border-radius: 14px;
  background: color-mix(in oklab, var(--arc-surface) 88%, transparent);
  box-shadow: inset 0 0 0 1px var(--arc-line);
  backdrop-filter: blur(6px);
}

.arc-step__num {
  display: grid;
  place-items: center;
  width: 44px;
  height: 64px;
  border-radius: 6px;
  border: 1.5px solid var(--acc);
  background: color-mix(in oklab, var(--acc) 14%, transparent);
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 700;
  font-size: 20px;
  color: var(--acc);
  transform: rotate(-6deg);
}

.arc-step h3 {
  margin: 4px 0 8px;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: 19px;
  color: var(--arc-ink);
}

.arc-step p {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--arc-muted);
}

.arc-step__note {
  margin-top: 10px !important;
}

.arc-step__note.is-warn {
  color: #ffb3a8 !important;
}

.arc-steps__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 10px;
}

/* ---- live + news ---- */
.arc-future__side {
  display: grid;
  gap: 12px;
}

.arc-live,
.arc-news {
  display: block;
  padding: 24px;
  border-radius: 14px;
  background: color-mix(in oklab, var(--arc-surface) 88%, transparent);
  box-shadow: inset 0 0 0 1px var(--arc-line);
  backdrop-filter: blur(6px);
}

.arc-live__row {
  display: flex;
  align-items: baseline;
  min-height: 54px;
  gap: 12px;
  margin: 10px 0 6px;
}

.arc-live__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--arc-muted);
  align-self: center;
}

.is-online .arc-live__dot {
  background: #4ade80;
  box-shadow: 0 0 0 0 rgba(74, 222, 128, .6);
  animation: arc-pulse 2s infinite;
}

.is-offline .arc-live__dot {
  background: #f87171;
}

@keyframes arc-pulse {
  0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, .55); }
  70% { box-shadow: 0 0 0 12px rgba(74, 222, 128, 0); }
  100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
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

.arc-live__meta {
  margin: 0;
  font-family: var(--arc-caps);
  font-size: 10.5px;
  letter-spacing: .08em;
  color: var(--arc-muted);
}

.arc-news {
  color: inherit;
  transition: box-shadow .25s, transform .35s cubic-bezier(.2, .8, .2, 1);
}

.arc-news:hover {
  transform: translateY(-3px);
  box-shadow: inset 0 0 0 1px var(--acc);
}

.arc-news:focus-visible {
  outline: 3px solid var(--arc-ink);
  outline-offset: 3px;
}

.arc-news h3 {
  margin: 10px 0 8px;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: 20px;
  line-height: 1.25;
  color: var(--arc-ink);
}

.arc-news__body {
  margin: 0 0 14px;
  font-size: 15px;
  line-height: 1.55;
  color: var(--arc-muted);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.arc-news__meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  font-family: var(--arc-caps);
  font-size: 11px;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--arc-muted);
}

.arc-news__read {
  color: var(--acc);
}

/* ---- companion ---- */
.arc-companion {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: clamp(24px, 4vw, 56px);
  margin-top: clamp(40px, 6vw, 72px);
  padding: clamp(24px, 3.5vw, 44px);
  border-radius: 18px;
  background:
    radial-gradient(70% 90% at 100% 0%, color-mix(in oklab, var(--acc) 14%, transparent), transparent 70%),
    var(--arc-surface);
  box-shadow: inset 0 0 0 1px var(--arc-line);
  scroll-margin-top: calc(var(--site-header-stack, 106px) + 20px);
}

.arc-companion__title {
  margin: 10px 0 14px;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 700;
  font-size: clamp(26px, 3vw, 40px);
  color: var(--arc-ink);
}

.arc-companion__lede {
  margin: 0 0 22px;
  max-width: 44em;
  color: var(--arc-muted);
  line-height: 1.65;
}

.arc-companion__features {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}

.arc-companion__features li {
  display: flex;
  gap: 14px;
  align-items: baseline;
  color: var(--arc-muted);
  font-size: 15px;
  line-height: 1.55;
}

.arc-companion__features i {
  width: 18px;
  color: var(--acc);
}

.arc-companion__features strong {
  color: var(--arc-ink);
  font-weight: 600;
}

.arc-companion__get {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.arc-companion__link {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 10px;
  background: var(--arc-bg);
  box-shadow: inset 0 0 0 1px var(--arc-line);
  color: var(--arc-ink);
  font-weight: 500;
  transition: box-shadow .2s, transform .3s cubic-bezier(.2, .8, .2, 1);
}

.arc-companion__link:hover {
  box-shadow: inset 0 0 0 1px var(--acc);
  transform: translateX(4px);
  color: var(--arc-ink);
}

.arc-companion__link:focus-visible {
  outline: 3px solid var(--arc-ink);
  outline-offset: 2px;
}

.arc-companion__link i {
  margin-left: auto;
  font-size: 12px;
  color: var(--arc-muted);
}

.arc-companion__icon {
  width: 20px;
  height: 20px;
  color: var(--acc);
}

.arc-companion__note {
  margin: 6px 0 0;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--arc-muted);
}

.arc-companion__note strong {
  color: var(--arc-ink);
}

@media (max-width: 960px) {
  .arc-future__grid,
  .arc-companion {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .arc-step {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .is-online .arc-live__dot {
    animation: none;
  }
}
</style>
