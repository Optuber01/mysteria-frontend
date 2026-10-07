import {computed, ref, watch, type Ref} from 'vue';
import type {ArticleLocale} from '@/locales';
import type {NewsPreview} from '@/types/news';
import {newsAPI} from '@/utils/api/news';
import {newsKind, type NewsFilter} from './newsKind';

/*
 * The news archive. The API pages its list (pinned announcements first, then by date)
 * and cannot filter by type, so the first page is large, the filter runs here, and
 * further pages are fetched only when "show more" runs past what is loaded.
 */
const PAGE_SIZE = 100;
const STEP = 20;

const newestFirst = (a: NewsPreview, b: NewsPreview) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();

export function useNewsIndex(language: Ref<ArticleLocale>, filter: Ref<NewsFilter>) {
  const entries = ref<NewsPreview[]>([]);
  const status = ref<'loading' | 'ready' | 'error'>('loading');
  const hasMore = ref(false);
  const loadingMore = ref(false);
  const limit = ref(STEP);
  let nextPage = 0;
  // A language switch or a retry starts a new load; answers to the old one are dropped.
  let generation = 0;

  const filtered = computed(() => filter.value === 'all'
      ? entries.value
      : entries.value.filter(entry => newsKind(entry.slug) === filter.value));
  const visible = computed(() => filtered.value.slice(0, limit.value));
  const canShowMore = computed(() => filtered.value.length > limit.value || hasMore.value);

  async function fetchPage(current: number): Promise<boolean> {
    const response = await newsAPI.getPublished(language.value, {page: nextPage, size: PAGE_SIZE});
    if (current !== generation) return false;
    const page = response.data;
    const known = new Set(entries.value.map(entry => entry.id));
    const incoming = (page?.content ?? []).filter(entry => !known.has(entry.id));
    entries.value = [...entries.value, ...incoming].sort(newestFirst);
    nextPage += 1;
    hasMore.value = page ? !page.last : false;
    return true;
  }

  // Fetch pages until the shown count can be filled (a filter may skip most of a page).
  async function fill() {
    if (loadingMore.value || status.value !== 'ready') return;
    const current = generation;
    loadingMore.value = true;
    try {
      while (hasMore.value && filtered.value.length < limit.value) {
        if (!(await fetchPage(current))) return;
      }
    } catch (error) {
      // What is loaded stays; the button is still there to try again.
      console.error('Failed to fetch more news:', error);
    } finally {
      if (current === generation) loadingMore.value = false;
    }
  }

  async function load() {
    const current = ++generation;
    status.value = 'loading';
    entries.value = [];
    nextPage = 0;
    hasMore.value = false;
    loadingMore.value = false;
    limit.value = STEP;
    try {
      if (!(await fetchPage(current))) return;
      status.value = 'ready';
      await fill();
    } catch (error) {
      if (current !== generation) return;
      console.error('Failed to fetch news:', error);
      status.value = 'error';
    }
  }

  function showMore() {
    limit.value += STEP;
    void fill();
  }

  watch(language, () => void load(), {immediate: true});
  watch(filter, () => {
    limit.value = STEP;
    void fill();
  });

  return {status, visible, canShowMore, loadingMore, showMore, reload: load};
}
