<template>
  <section id="join" ref="rootRef" class="join" aria-labelledby="ascent-join-title">
    <div class="a-shell">
      <header class="join__head">
        <p class="a-eyebrow a-eyebrow--ink" data-rv>{{ t('home.ascent.join.eyebrow') }}</p>
        <h2 id="ascent-join-title" class="a-h2 a-h2--ink join__title" data-rv>
          <span>{{ t('home.ascent.join.titleA') }}</span>
          <span>{{ t('home.ascent.join.titleB') }}</span>
        </h2>
      </header>

      <div class="join__grid">
        <ol class="join__steps">
          <li v-for="(step, index) in steps" :key="step.title" class="join__step" data-rv :style="{'--k': index}">
            <span class="join__step-num" aria-hidden="true">0{{ index + 1 }}</span>
            <span class="join__step-text">
              <strong>{{ step.title }}</strong>
              <span>{{ step.body }}</span>
            </span>
          </li>
        </ol>

        <aside class="join__card" data-rv :aria-label="t('home.ascent.join.cardLabel')">
          <div class="join__live">
            <span :class="['join__dot', statusClass]" aria-hidden="true"></span>
            <span class="join__live-text">{{ statusText }}</span>
            <span class="join__census">{{ censusText }}</span>
          </div>

          <AscentIp tone="light" class="join__ip"/>

          <div class="join__actions">
            <RouterLink :to="$lp('/guide/connect')" class="a-btn a-btn--ink">
              {{ t('home.ascent.join.guide') }}
              <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </RouterLink>
            <a :href="DISCORD" class="a-btn a-btn--outline-ink" target="_blank" rel="noopener noreferrer">
              <IconDiscord class="join__discord-icon"/>
              {{ t('home.ascent.join.discord') }}
            </a>
          </div>
          <p class="join__discord-note">{{ t('home.ascent.join.discordNote') }}</p>

          <RouterLink :to="latestTo" class="join__news">
            <span class="join__news-kicker">{{ t('home.ascent.join.latest') }}</span>
            <span class="join__news-title">{{ latestTitle }}</span>
            <span class="join__news-more">
              {{ t('home.ascent.join.newsAll') }}
              <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </span>
          </RouterLink>
        </aside>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {useLocalePath} from '@/composables/useLocalePath';
import {useServerStatus} from '@/composables/useServer';
import IconDiscord from '@/assets/icons/IconDiscord.vue';
import AscentIp from './AscentIp.vue';
import {useReveals} from './useAscentScroll';

const props = defineProps<{
  latest: { title: string; slug: string } | null;
  beyonders: number;
}>();

const DISCORD = 'https://discord.com/invite/jc7GSxBWgb';

const {t, intlLocale} = useI18n();
const {localePath} = useLocalePath();
const {isOnline, playerCount, checkedAt} = useServerStatus();
const rootRef = ref<HTMLElement | null>(null);
useReveals(rootRef);

const steps = computed(() => [1, 2, 3, 4].map(n => ({
  title: t(`home.ascent.join.s${n}Title`),
  body: t(`home.ascent.join.s${n}Body`),
})));

const statusClass = computed(() => {
  if (!checkedAt.value) return 'is-checking';
  return isOnline.value ? 'is-online' : 'is-offline';
});

const statusText = computed(() => {
  if (!checkedAt.value) return t('home.ascent.status.checking');
  if (!isOnline.value) return t('home.ascent.status.offline');
  return t('home.ascent.status.online').replace('{n}', String(playerCount.value ?? 0));
});

const censusText = computed(() => props.beyonders > 0
    ? t('home.ascent.join.beyonders').replace('{n}', new Intl.NumberFormat(intlLocale.value).format(props.beyonders))
    : t('home.ascent.join.beyondersFallback'));

const latestTo = computed(() => localePath(props.latest ? `/news/${props.latest.slug}` : '/news'));
const latestTitle = computed(() => props.latest?.title || t('home.ascent.hero.latestFallback'));
</script>

<style scoped>
.join {
  position: relative;
  padding: clamp(24px, 4vh, 48px) 0 clamp(64px, 9vh, 100px);
  background: linear-gradient(180deg, #f4f7f9 0%, #e8ecf0 100%);
  color: var(--l-ink);
}

.join__title {
  margin-top: 14px;
  color: var(--l-ink);
}

.join__title span {
  display: block;
}

.join__title span + span {
  color: #5b626c;
}

.join__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.75fr);
  gap: clamp(32px, 5vw, 88px);
  align-items: start;
  margin-top: clamp(28px, 4vh, 44px);
}

.join__steps {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 32px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.join__step {
  display: grid;
  align-content: start;
  gap: 16px;
  padding: 18px 0;
  border-top: 1px solid rgba(11, 12, 14, 0.14);
  transition-delay: calc(var(--k) * 80ms) !important;
}

.join__step:nth-last-child(-n + 2) {
  border-bottom: 1px solid rgba(11, 12, 14, 0.14);
}

.join__step-num {
  font-family: var(--a-display);
  font-size: clamp(48px, 5.4vw, 84px);
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: 0;
  color: transparent;
  -webkit-text-stroke: 1.5px var(--l-ink);
}

.join__step-text {
  display: grid;
  gap: 6px;
}

.join__step strong {
  font-family: var(--a-head);
  font-size: clamp(18px, 1.5vw, 22px);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.join__step-text > span {
  font-size: 16px;
  line-height: 1.6;
  color: var(--l-muted);
}

.join__card {
  position: sticky;
  top: calc(var(--site-header-stack, 96px) + 24px);
  display: grid;
  gap: 16px;
  padding: clamp(22px, 2.4vw, 30px);
  border: 1px solid rgba(11, 12, 14, 0.12);
  background: #fff;
  box-shadow: 0 30px 80px rgba(60, 80, 100, 0.14);
}

.join__live {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 10px;
  align-items: center;
}

.join__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #8a9099;
}

.join__dot.is-online {
  background: #11a75c;
  box-shadow: 0 0 0 4px rgba(17, 167, 92, 0.16);
}

.join__dot.is-offline {
  background: #c43a3a;
}

.join__live-text {
  font-weight: 600;
}

.join__census {
  grid-column: 2;
  font-size: 14px;
  color: var(--l-muted);
}

.join__ip {
  width: 100%;
}

.join__ip :deep(.a-ip__button) {
  width: 100%;
}

.join__ip :deep(.a-ip__address) {
  flex: 1;
}

.join__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.join__actions .a-btn {
  flex: 1 1 200px;
  justify-content: center;
}

.join__discord-icon {
  width: 18px;
  height: 18px;
}

.join__discord-note {
  margin: -10px 0 0;
  font-size: 13.5px;
  color: var(--l-muted);
}

.join__news {
  display: grid;
  gap: 6px;
  padding-top: 20px;
  border-top: 1px solid rgba(11, 12, 14, 0.12);
  color: var(--l-ink);
  text-decoration: none;
}

.join__news-kicker {
  font-family: var(--a-mono);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--l-accent);
}

.join__news-title {
  font-family: var(--a-head);
  font-size: 17px;
  font-weight: 600;
  line-height: 1.3;
}

.join__news-more {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--l-muted);
}

.join__news:hover .join__news-title {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.join__news:focus-visible {
  outline: 2px solid var(--l-accent);
  outline-offset: 4px;
}

@media (max-width: 1199px) {
  .join__grid {
    grid-template-columns: 1fr;
  }

  .join__card {
    position: relative;
    top: 0;
  }
}

@media (max-width: 599px) {
  .join__steps {
    grid-template-columns: 1fr;
  }

  .join__step {
    grid-template-columns: 52px minmax(0, 1fr);
    gap: 14px;
    padding: 18px 0;
  }

  .join__step-num {
    font-size: 30px;
  }

  .join__step-text > span {
    font-size: 14.5px;
  }

  .join__step:nth-last-child(2) {
    border-bottom: 0;
  }
}
</style>
