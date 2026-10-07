<template>
  <div class="news-index">
    <form class="news-search" role="search" @submit.prevent="commit">
      <i class="fa-solid fa-magnifying-glass news-search__icon" aria-hidden="true"></i>
      <input
          id="news-search"
          v-model="draft"
          class="arc-field news-search__field"
          type="search"
          enterkeyhint="search"
          autocomplete="off"
          spellcheck="false"
          maxlength="100"
          :aria-label="t('newsPage.searchLabel')"
          :placeholder="t('newsPage.searchPlaceholder')"
          @keydown.esc="clear"
      >
      <button v-if="draft" type="button" class="news-search__clear" :aria-label="t('newsPage.searchClear')" @click="clear">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
    </form>

    <!-- what a search found, said once it settles (the counts on the tabs are the visible form) -->
    <p class="arc-sr" role="status">{{ announcement }}</p>

    <ArcTabs :model-value="filter" :tabs="tabs" :label="t('newsPage.filterLabel')" controls="news-entries"
             @update:model-value="id => setFilter(id as NewsFilter)"/>

    <div id="news-entries" role="tabpanel" :aria-label="currentLabel" :aria-busy="status === 'loading' || waiting">
      <ArcState v-if="status === 'loading'" kind="loading" :text="t('newsPage.loading')"/>
      <ArcState v-else-if="status === 'error'" kind="error" :text="t('newsPage.error')"
                :retry-label="t('newsPage.retry')" @retry="reload"/>
      <ArcState v-else-if="waiting" kind="loading" :text="t('newsPage.searching')"/>
      <ArcState v-else-if="searchFailed" kind="error" :text="t('newsPage.error')"
                :retry-label="t('newsPage.retry')" @retry="retryRest"/>

      <ArcState v-else-if="!groups.length && searching" kind="empty"
                :text="(otherTabsHaveMatches ? t('newsPage.noResultsHere') : t('newsPage.noResults')).replace('{q}', term)"
                :retry-label="otherTabsHaveMatches ? t('newsPage.searchAll') : t('newsPage.searchClear')"
                @retry="otherTabsHaveMatches ? setFilter('all') : clear()"/>
      <ArcState v-else-if="!groups.length" kind="empty" :text="t('newsPage.empty')"/>

      <template v-else>
        <NewsLatest v-if="latestChangelog && showLatest" :entry="latestChangelog" :language="language"
                    class="news-index__latest"/>

        <section v-for="group in groups" :key="group.key" class="news-index__month">
          <h2 class="arc-h4 news-index__month-title">{{ group.label }}</h2>
          <ul class="arc-rows">
            <NewsEntryRow v-for="entry in group.entries" :key="entry.id" :entry="entry"/>
          </ul>
        </section>

        <div v-if="canShowMore" class="news-index__more">
          <button type="button" class="arc-btn arc-btn--ghost" @click="showMore">{{ t('newsPage.showMore') }}</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed, onBeforeUnmount, ref, watch} from 'vue';
import {useRoute} from 'vue-router';
import ArcState from '@/components/arcana/ArcState.vue';
import ArcTabs from '@/components/arcana/ArcTabs.vue';
import {useI18n} from '@/composables/useI18n';
import type {ArticleLocale} from '@/locales';
import type {NewsPreview} from '@/types/news';
import NewsEntryRow from './NewsEntryRow.vue';
import NewsLatest from './NewsLatest.vue';
import {isNewsFilter, type NewsFilter} from './newsKind';
import {useNewsIndex} from './useNewsIndex';

const props = defineProps<{ language: ArticleLocale }>();
const {intlLocale, t} = useI18n();
const route = useRoute();

const queryOf = (value: unknown) => (typeof value === 'string' ? value.trim().slice(0, 100) : '');

// ?type=changelog makes the archive linkable (the article's back link and the footer use it), ?q= a search.
const filter = ref<NewsFilter>(isNewsFilter(route.query.type) ? route.query.type : 'all');
/** What the search has settled on; the field's own text (draft) runs ahead of it while typing. */
const term = ref(queryOf(route.query.q));
const draft = ref(term.value);

/*
 * The address follows the tab and the search without a router navigation: that would
 * scroll the page to the top, and nothing else on the page reads the query.
 */
function syncUrl() {
  const url = new URL(window.location.href);
  if (filter.value === 'all') url.searchParams.delete('type');
  else url.searchParams.set('type', filter.value);
  if (term.value) url.searchParams.set('q', term.value);
  else url.searchParams.delete('q');
  window.history.replaceState(window.history.state, '', url);
}

const setFilter = (next: NewsFilter) => {
  filter.value = next;
  syncUrl();
};

// Typing waits a moment, so a word is searched once rather than once a letter.
const DEBOUNCE = 250;
let timer: ReturnType<typeof setTimeout> | undefined;
function commit() {
  clearTimeout(timer);
  const next = draft.value.trim();
  if (next === term.value) return;
  term.value = next;
  syncUrl();
}
function clear() {
  draft.value = '';
  commit();
  document.getElementById('news-search')?.focus();
}
watch(draft, () => {
  clearTimeout(timer);
  timer = setTimeout(commit, DEBOUNCE);
});
onBeforeUnmount(() => clearTimeout(timer));

// A link to /news?type=changelog from elsewhere (the footer, the menu) while already on the page.
watch(() => [route.query.type, route.query.q], ([type, q]) => {
  filter.value = isNewsFilter(type) ? type : 'all';
  const next = queryOf(q);
  if (next !== term.value) {
    term.value = next;
    draft.value = next;
  }
});

const language = computed(() => props.language);
const {
  status, visible, counts, complete, canShowMore, showMore, searching, waiting, searchFailed,
  latestChangelog, reload, retryRest,
} = useNewsIndex(language, filter, term, intlLocale);

// Counts are shown once every page is in; before that they would only be a guess.
const tabs = computed(() => [
  {id: 'all', label: t('newsPage.all'), count: complete.value ? counts.value.all : undefined},
  {id: 'changelog', label: t('newsPage.changelogs'), count: complete.value ? counts.value.changelog : undefined},
  {id: 'announcement', label: t('newsPage.announcements'), count: complete.value ? counts.value.announcement : undefined},
]);
const currentLabel = computed(() => tabs.value.find(tab => tab.id === filter.value)?.label ?? '');

const showLatest = computed(() => !searching.value && filter.value !== 'announcement');
const otherTabsHaveMatches = computed(() => filter.value !== 'all' && counts.value.all > 0);

const announcement = computed(() => {
  if (!searching.value) return '';
  if (waiting.value) return t('newsPage.searching');
  const shown = filter.value === 'all' ? counts.value.all : counts.value[filter.value];
  return `${t('newsPage.matches')}: ${shown}`;
});

// The index is months, newest first, so the archive reads as a timeline.
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

/* the field is the page's first control: wide, with the glyph and the clear button inside it */
.news-search {
  position: relative;
  display: flex;
  align-items: center;
}

.news-search__icon {
  position: absolute;
  left: 16px;
  color: var(--arc-muted);
  pointer-events: none;
}

.news-search__field {
  min-height: 48px;
  padding-right: 48px;
  padding-left: 44px;
  appearance: none;
}

/* the page draws its own clear button; the browser's would sit beside it */
.news-search__field::-webkit-search-cancel-button,
.news-search__field::-webkit-search-decoration {
  display: none;
  appearance: none;
}

.news-search__clear {
  position: absolute;
  right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: var(--arc-r-sm);
  background: none;
  color: var(--arc-muted);
  cursor: pointer;
  transition: color .2s ease, background-color .2s ease;
}

.news-search__clear:hover {
  background: var(--arc-glass);
  color: var(--arc-ink);
}

.news-index__latest {
  margin-bottom: var(--arc-head-gap);
}

.news-index__month + .news-index__month {
  margin-top: var(--arc-head-gap);
}

.news-index__month-title {
  margin: 0 0 8px;
  color: var(--arc-muted);
}

.news-index__more {
  display: flex;
  justify-content: center;
  margin-top: var(--arc-head-gap);
}
</style>
