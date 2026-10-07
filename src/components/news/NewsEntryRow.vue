<template>
  <!--
    One entry of the index. Only the title is a link; its ::after stretches over the
    whole row, so the row is one big target but a screen reader hears just the title.
  -->
  <li class="news-row">
    <time class="news-row__date" :datetime="entry.publishedAt">{{ date }}</time>
    <span class="arc-tag news-row__tag" :class="{'arc-tag--acc': kind === 'announcement'}">{{ kindLabel }}</span>
    <div class="news-row__body">
      <h3 class="news-row__title">
        <RouterLink class="news-row__link" :to="$lp(`/news/${entry.slug}`)">{{ entry.title }}</RouterLink>
      </h3>
      <p v-if="entry.shortDescription" class="news-row__summary">{{ entry.shortDescription }}</p>
    </div>
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
const kindLabel = computed(() => t(kind.value === 'changelog' ? 'newsPage.changelog' : 'newsPage.announcement'));
const date = computed(() => new Date(props.entry.publishedAt).toLocaleDateString(intlLocale.value, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}));
</script>

<style scoped>
.news-row {
  position: relative;
  display: grid;
  grid-template-columns: 8.5rem minmax(0, 1fr) auto;
  grid-template-areas: "date body tag";
  align-items: start;
  gap: 4px clamp(14px, 2vw, 28px);
  padding: 20px 0;
  border-top: var(--arc-bw) solid var(--arc-line);
}

.news-row__date {
  grid-area: date;
  padding-top: 2px;
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  font-variant-numeric: tabular-nums;
}

.news-row__tag {
  grid-area: tag;
  justify-self: end;
}

.news-row__body {
  grid-area: body;
  min-width: 0;
}

.news-row__title {
  margin: 0;
  font-family: var(--arc-display);
  font-size: var(--arc-fs-h4);
  font-weight: 600;
  line-height: 1.25;
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
  border-radius: var(--arc-r-md);
  outline: var(--arc-focus-w) solid var(--arc-ink);
  outline-offset: 8px;
}

.news-row__summary {
  display: -webkit-box;
  margin: 6px 0 0;
  overflow: hidden;
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

@media (max-width: 640px) {
  .news-row {
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas:
      "tag date"
      "body body";
    align-items: center;
    padding: 18px 0;
  }

  .news-row__date {
    padding-top: 0;
  }

  .news-row__tag {
    justify-self: start;
  }

  .news-row__body {
    margin-top: 6px;
  }
}
</style>
