<template>
  <!--
    One entry of the index. Only the title is a link; its ::after stretches over the
    whole row, so the row is one big target but a screen reader hears just the title.
    A changelog is a quiet one-line row (there are over a hundred of them, and their
    summaries all say the same); an announcement gets its cover, a longer summary and a tag.
  -->
  <li class="news-row" :class="`news-row--${kind}`">
    <img
        v-if="kind === 'announcement' && entry.preview"
        class="news-row__thumb"
        :src="entry.preview"
        alt=""
        width="320"
        height="180"
        loading="lazy"
        decoding="async"
    >
    <div class="news-row__body">
      <p v-if="kind === 'announcement'" class="news-row__meta">
        <time :datetime="entry.publishedAt">{{ date }}</time>
        <span class="arc-tag arc-tag--acc">{{ t('newsPage.announcement') }}</span>
      </p>
      <h3 class="news-row__title">
        <RouterLink class="news-row__link" :to="$lp(`/news/${entry.slug}`)">{{ entry.title }}</RouterLink>
      </h3>
      <p v-if="kind === 'announcement' && entry.shortDescription" class="news-row__summary">{{ entry.shortDescription }}</p>
    </div>
    <!-- a changelog's title already names its day; a custom one gets the date beside it -->
    <time v-if="kind === 'changelog' && !titleHasDate" class="news-row__date" :datetime="entry.publishedAt">{{ date }}</time>
  </li>
</template>

<script lang="ts" setup>
import {computed} from 'vue';
import {useI18n} from '@/composables/useI18n';
import type {NewsPreview} from '@/types/news';
import {newsKind} from './newsKind';

const props = defineProps<{ entry: NewsPreview }>();
const {intlLocale, t} = useI18n();

const kind = computed(() => newsKind(props.entry.slug));
const published = computed(() => new Date(props.entry.publishedAt));
const date = computed(() => published.value.toLocaleDateString(intlLocale.value, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}));
const titleHasDate = computed(() => props.entry.title.includes(String(published.value.getFullYear())));
</script>

<style scoped>
.news-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: clamp(14px, 2vw, 24px);
  /* the padding is given back by the negative margin, so hover and focus have room to the sides */
  margin: 0 -12px;
  padding: 12px;
  border-radius: var(--arc-r-md);
  transition: background-color .2s ease;
}

/* hairlines between rows, inset to the text */
.news-row + .news-row::before {
  position: absolute;
  top: 0;
  right: 12px;
  left: 12px;
  height: var(--arc-bw);
  background: var(--arc-line);
  content: '';
}

.news-row:hover {
  background: var(--arc-glass);
}

.news-row:hover + .news-row::before,
.news-row:hover::before {
  opacity: 0;
}

.news-row__body {
  flex: 1;
  min-width: 0;
}

.news-row__title {
  margin: 0;
  font-family: var(--arc-display);
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.01em;
  text-wrap: balance;
}

.news-row__link {
  color: var(--arc-ink);
  text-decoration: none;
  transition: color .2s ease;
}

.news-row__link::after {
  position: absolute;
  inset: 0;
  content: '';
}

.news-row:hover .news-row__link {
  color: var(--acc-ink);
}

/* the ring goes round the whole row, not just the title's text */
.news-row__link:focus-visible {
  outline: none;
}

.news-row:has(.news-row__link:focus-visible) {
  outline: var(--arc-focus-w) solid var(--arc-ink);
  outline-offset: 0;
}

/* ---- changelog: one quiet line ---- */
.news-row--changelog {
  min-height: 52px;
}

.news-row--changelog .news-row__title {
  font-size: var(--arc-fs-body);
}

.news-row__date {
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* ---- announcement: cover, date and tag, title, summary ---- */
.news-row--announcement {
  align-items: flex-start;
  padding-block: 20px;
}

.news-row__thumb {
  flex: none;
  width: clamp(168px, 18vw, 232px);
  height: auto;
  aspect-ratio: 16 / 9;
  border-radius: var(--arc-r-md);
  background: var(--arc-glass);
  box-shadow: 0 0 0 var(--arc-bw) var(--arc-line);
  object-fit: cover;
}

.news-row__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
  margin: 0 0 8px;
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  font-variant-numeric: tabular-nums;
}

.news-row--announcement .news-row__title {
  font-size: var(--arc-fs-h4);
}

.news-row__summary {
  display: -webkit-box;
  margin: 8px 0 0;
  overflow: hidden;
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

/* phones: no cover (each is a 300 KB image, too heavy for a small thumbnail there); the text takes the row */
@media (max-width: 640px) {
  .news-row__thumb {
    display: none;
  }

  .news-row--changelog {
    flex-wrap: wrap;
    gap: 2px 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .news-row,
  .news-row__link {
    transition: none;
  }
}
</style>
