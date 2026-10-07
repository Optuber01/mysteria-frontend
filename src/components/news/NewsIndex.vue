<template>
  <div class="news-index">
    <ArcTabs :model-value="filter" :tabs="tabs" :label="t('newsPage.filterLabel')" controls="news-entries"
             @update:model-value="id => setFilter(id as NewsFilter)"/>

    <div id="news-entries" role="tabpanel" :aria-label="currentLabel" :aria-busy="status === 'loading'">
      <ArcState v-if="status === 'loading'" kind="loading" :text="t('newsPage.loading')"/>
      <ArcState v-else-if="status === 'error'" kind="error" :text="t('newsPage.error')"
                :retry-label="t('newsPage.retry')" @retry="reload"/>
      <ArcState v-else-if="!groups.length" kind="empty" :text="t('newsPage.empty')"/>

      <template v-else>
        <section v-for="group in groups" :key="group.key" class="news-index__month">
          <h2 class="arc-h4 news-index__month-title">{{ group.label }}</h2>
          <ul class="arc-rows">
            <NewsEntryRow v-for="entry in group.entries" :key="entry.id" :entry="entry"/>
          </ul>
        </section>

        <div v-if="canShowMore" class="news-index__more">
          <button type="button" class="arc-btn arc-btn--ghost" :disabled="loadingMore" @click="showMore">
            {{ loadingMore ? t('newsPage.loadingMore') : t('newsPage.showMore') }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed, ref} from 'vue';
import {useRoute} from 'vue-router';
import ArcState from '@/components/arcana/ArcState.vue';
import ArcTabs from '@/components/arcana/ArcTabs.vue';
import {useI18n} from '@/composables/useI18n';
import type {ArticleLocale} from '@/locales';
import type {NewsPreview} from '@/types/news';
import NewsEntryRow from './NewsEntryRow.vue';
import {isNewsFilter, type NewsFilter} from './newsKind';
import {useNewsIndex} from './useNewsIndex';

const props = defineProps<{ language: ArticleLocale }>();
const {intlLocale, t} = useI18n();
const route = useRoute();

// ?type=changelog makes the archive linkable (the article's back link uses it).
const initial = route.query.type;
const filter = ref<NewsFilter>(isNewsFilter(initial) ? initial : 'all');

/*
 * The address follows the tab without a router navigation: that would scroll the
 * page to the top, and nothing else on the page reads the query.
 */
const setFilter = (next: NewsFilter) => {
  filter.value = next;
  const url = new URL(window.location.href);
  if (next === 'all') url.searchParams.delete('type');
  else url.searchParams.set('type', next);
  window.history.replaceState(window.history.state, '', url);
};

const language = computed(() => props.language);
const {status, visible, canShowMore, loadingMore, showMore, reload} = useNewsIndex(language, filter);

const tabs = computed(() => [
  {id: 'all', label: t('newsPage.all')},
  {id: 'changelog', label: t('newsPage.changelogs')},
  {id: 'announcement', label: t('newsPage.announcements')},
]);
const currentLabel = computed(() => tabs.value.find(tab => tab.id === filter.value)?.label ?? '');

// The index is one page of months, newest first, so the archive reads as a timeline.
const groups = computed(() => {
  const result: { key: string; label: string; entries: NewsPreview[] }[] = [];
  for (const entry of visible.value) {
    const date = new Date(entry.publishedAt);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    let group = result[result.length - 1];
    if (!group || group.key !== key) {
      group = {
        key,
        label: date.toLocaleDateString(intlLocale.value, {year: 'numeric', month: 'long'}),
        entries: [],
      };
      result.push(group);
    }
    group.entries.push(entry);
  }
  return result;
});
</script>

<style scoped>
.news-index {
  display: grid;
  gap: var(--arc-group-gap);
  max-width: 980px;
}

.news-index__month + .news-index__month {
  margin-top: var(--arc-head-gap);
}

.news-index__month-title {
  margin: var(--arc-group-gap) 0 12px;
  color: var(--arc-muted);
}

.news-index__more {
  display: flex;
  justify-content: center;
  margin-top: var(--arc-head-gap);
}
</style>
