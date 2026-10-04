import {computed, ref, watch} from 'vue';
import {useI18n} from '@/composables/useI18n';
import type {ArticleLocale} from '@/locales';
import type {NewsArticle} from '@/types/news';
import {newsAPI} from '@/utils/api/news';

/*
 * The latest news posts, fetched once per article language and shared by every
 * part of the page that links to them (the hero's changelog button, the join section).
 */
const requests = new Map<ArticleLocale, Promise<NewsArticle[]>>();

function fetchLatest(language: ArticleLocale): Promise<NewsArticle[]> {
  let request = requests.get(language);
  if (!request) {
    request = newsAPI.getLatest(language).then(
        response => (Array.isArray(response.data) ? response.data : []),
        () => {
          // Let a later visit to the page try again.
          requests.delete(language);
          return [];
        },
    );
    requests.set(language, request);
  }
  return request;
}

export function useLatestNews() {
  const {locale} = useI18n();
  const posts = ref<NewsArticle[]>([]);
  /** True once the request has settled (with posts or without). */
  const settled = ref(false);

  watch(() => locale.value.articleLocale, language => {
    settled.value = false;
    void fetchLatest(language).then(list => {
      if (language !== locale.value.articleLocale) return;
      posts.value = list;
      settled.value = true;
    });
  }, {immediate: true});

  const latest = computed(() => posts.value[0] ?? null);
  /** The newest daily changelog; any other latest post if there is none. */
  const latestChangelog = computed(() => posts.value.find(post => post.slug.startsWith('changelog')) ?? latest.value);

  return {posts, latest, latestChangelog, settled};
}
