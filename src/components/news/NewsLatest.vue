<template>
  <!--
    The newest changelog, lifted above the archive: its date, and which parts of the
    game it touches. Only the title is a link; its ::after stretches over the panel.
  -->
  <section class="arc-panel news-latest" aria-labelledby="news-latest-title">
    <div class="news-latest__head">
      <h2 id="news-latest-title" class="arc-h4 news-latest__label">{{ t('newsPage.latest') }}</h2>
      <time class="news-latest__date" :datetime="entry.publishedAt">{{ date }}</time>
    </div>
    <p class="news-latest__title">
      <RouterLink class="news-latest__link" :to="$lp(`/news/${entry.slug}`)">
        {{ entry.title }}
        <i class="fa-solid fa-arrow-right news-latest__arrow" aria-hidden="true"></i>
      </RouterLink>
    </p>
    <!-- the line keeps its room while the article loads, so the list below never jumps -->
    <p class="news-latest__areas">{{ areasText }}</p>
  </section>
</template>

<script lang="ts" setup>
import {computed, toRef} from 'vue';
import {useI18n} from '@/composables/useI18n';
import type {ArticleLocale} from '@/locales';
import type {NewsPreview} from '@/types/news';
import {useChangelogAreas} from './useChangelogAreas';

const props = defineProps<{ entry: NewsPreview; language: ArticleLocale }>();
const {intlLocale, t} = useI18n();

const date = computed(() => new Date(props.entry.publishedAt).toLocaleDateString(intlLocale.value, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}));

const {areas} = useChangelogAreas(computed(() => props.entry.slug), toRef(props, 'language'));

const SHOWN = 6;
// "Changes to Mother, General, Moon +4": the count of the rest is a bare number, in any language.
const areasText = computed(() => {
  if (!areas.value.length) return '';
  const rest = areas.value.length - SHOWN;
  const list = areas.value.slice(0, SHOWN).join(', ') + (rest > 0 ? ` +${rest}` : '');
  return t('newsPage.latestAreas').replace('{areas}', list);
});
</script>

<style scoped>
.news-latest {
  position: relative;
  display: grid;
  gap: 8px;
  padding: clamp(20px, 2.4vw, 28px);
  transition: box-shadow .25s ease;
}

.news-latest:hover {
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line-hot);
}

.news-latest:has(.news-latest__link:focus-visible) {
  outline: var(--arc-focus-w) solid var(--arc-ink);
  outline-offset: 4px;
}

.news-latest__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px 16px;
}

.news-latest__label {
  margin: 0;
}

.news-latest__date {
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  font-variant-numeric: tabular-nums;
}

.news-latest__title {
  margin: 0;
  font-family: var(--arc-display);
  font-size: var(--arc-fs-h3);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.15;
  text-wrap: balance;
}

.news-latest__link {
  color: var(--arc-ink);
  text-decoration: none;
}

.news-latest__link::after {
  position: absolute;
  inset: 0;
  border-radius: var(--arc-r-lg);
  content: '';
}

.news-latest__link:focus-visible {
  outline: none;
}

.news-latest__arrow {
  margin-left: 6px;
  color: var(--acc-ink);
  font-size: .6em;
  vertical-align: .12em;
  transition: transform .3s cubic-bezier(.2, .8, .2, 1);
}

.news-latest:hover .news-latest__arrow {
  transform: translateX(4px);
}

.news-latest__areas {
  min-height: 1.6em;
  margin: 0;
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  line-height: 1.6;
}

@media (prefers-reduced-motion: reduce) {
  .news-latest,
  .news-latest__arrow {
    transition: none;
  }

  .news-latest:hover .news-latest__arrow {
    transform: none;
  }
}
</style>
