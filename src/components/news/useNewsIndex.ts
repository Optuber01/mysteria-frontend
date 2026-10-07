import {computed, ref, watch, type Ref} from 'vue';
import type {ArticleLocale} from '@/locales';
import type {NewsPreview} from '@/types/news';
import {newsAPI} from '@/utils/api/news';
import {newsKind, type NewsFilter} from './newsKind';

/*
 * The news archive. The API has no search and no type filter, but a page can hold 200
 * posts (its cap) and the whole archive is a few dozen kilobytes, so the first page is
 * shown at once and any further pages load behind it. Search and the type filter then
 * run here over everything the API offers, not just what is on screen.
 */
const PAGE_SIZE = 200;
const STEP = 30;

const newestFirst = (a: NewsPreview, b: NewsPreview) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();

// Case and accents never decide a match ("Ukrainian" finds "ukrainian", "é" finds "e").
export const fold = (text: string) => text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();

/*
 * The date as people write it, so "October", "oct 2026", "4 жовтня" and "2026-10" all
 * find a post: the ISO day, then the month spelled out in the reader's language and in
 * English (articles are in English for most locales, so readers search in it too).
 */
function dateWords(iso: string, formats: Intl.DateTimeFormat[]): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return [iso.slice(0, 10), ...formats.map(format => format.format(date))].join(' ');
}

export function useNewsIndex(
    language: Ref<ArticleLocale>,
    filter: Ref<NewsFilter>,
    query: Ref<string>,
    intlLocale: Ref<string>,
) {
  const entries = ref<NewsPreview[]>([]);
  const status = ref<'loading' | 'ready' | 'error'>('loading');
  /** True once every page has arrived. */
  const complete = ref(false);
  /** A page after the first failed: search cannot promise it saw everything. */
  const restFailed = ref(false);
  const limit = ref(STEP);
  let nextPage = 0;
  let loadingRest = false;
  // A language switch or a retry starts a new load; answers to the old one are dropped.
  let generation = 0;

  const searchIndex = computed(() => {
    const locales = [...new Set([intlLocale.value, 'en'])];
    const formats = locales.flatMap(locale => [
      new Intl.DateTimeFormat(locale, {year: 'numeric', month: 'long'}),
      new Intl.DateTimeFormat(locale, {year: 'numeric', month: 'short', day: 'numeric'}),
      new Intl.DateTimeFormat(locale, {year: 'numeric', month: 'long', day: 'numeric'}),
    ]);
    return entries.value.map(entry => ({
      entry,
      // the slug brings "changelog" and the ISO date along
      haystack: fold(`${entry.title} ${entry.shortDescription ?? ''} ${entry.slug} ${dateWords(entry.publishedAt, formats)}`),
    }));
  });

  // Every word must be found somewhere, so "october 2026" narrows and "pantheon" finds one post.
  const terms = computed(() => fold(query.value).split(/\s+/).filter(Boolean));
  const searching = computed(() => terms.value.length > 0);

  const matched = computed(() => searching.value
      ? searchIndex.value.filter(item => terms.value.every(term => item.haystack.includes(term))).map(item => item.entry)
      : entries.value);

  const counts = computed(() => {
    const changelog = matched.value.filter(entry => newsKind(entry.slug) === 'changelog').length;
    return {all: matched.value.length, changelog, announcement: matched.value.length - changelog};
  });

  const filtered = computed(() => filter.value === 'all'
      ? matched.value
      : matched.value.filter(entry => newsKind(entry.slug) === filter.value));
  const visible = computed(() => filtered.value.slice(0, limit.value));
  const canShowMore = computed(() => filtered.value.length > limit.value);

  /** Search needs every page; until they are in, it waits (or, if one failed, says so). */
  const waiting = computed(() => searching.value && !complete.value && !restFailed.value);
  const searchFailed = computed(() => searching.value && !complete.value && restFailed.value);

  const latestChangelog = computed(() => entries.value.find(entry => newsKind(entry.slug) === 'changelog') ?? null);

  async function fetchPage(current: number): Promise<boolean> {
    const response = await newsAPI.getPublished(language.value, {page: nextPage, size: PAGE_SIZE});
    if (current !== generation) return false;
    const page = response.data;
    const known = new Set(entries.value.map(entry => entry.id));
    const incoming = (page?.content ?? []).filter(entry => !known.has(entry.id));
    entries.value = [...entries.value, ...incoming].sort(newestFirst);
    nextPage += 1;
    complete.value = page ? page.last : true;
    return true;
  }

  async function loadRest(current: number) {
    if (loadingRest) return;
    loadingRest = true;
    restFailed.value = false;
    try {
      while (!complete.value) {
        if (!(await fetchPage(current))) return;
      }
    } catch (error) {
      if (current !== generation) return;
      console.error('Failed to fetch more news:', error);
      restFailed.value = true;
    } finally {
      loadingRest = false;
    }
  }

  async function load() {
    const current = ++generation;
    status.value = 'loading';
    entries.value = [];
    nextPage = 0;
    complete.value = false;
    restFailed.value = false;
    loadingRest = false;
    limit.value = STEP;
    try {
      if (!(await fetchPage(current))) return;
      status.value = 'ready';
      void loadRest(current);
    } catch (error) {
      if (current !== generation) return;
      console.error('Failed to fetch news:', error);
      status.value = 'error';
    }
  }

  const showMore = () => (limit.value += STEP);
  const retryRest = () => void loadRest(generation);

  watch(language, () => void load(), {immediate: true});
  watch([filter, terms], () => (limit.value = STEP));

  return {
    status, visible, filtered, counts, complete, canShowMore, showMore, searching, waiting, searchFailed,
    latestChangelog, reload: load, retryRest,
  };
}
