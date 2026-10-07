import {ref, watch, type Ref} from 'vue';
import type {ArticleLocale} from '@/locales';
import type {NewsArticle} from '@/types/news';
import {newsAPI} from '@/utils/api/news';

/* One article, by slug and article language. A missing slug is "missing", not an error. */
export function useNewsArticle(slug: Ref<string | undefined>, language: Ref<ArticleLocale>) {
  const article = ref<NewsArticle | null>(null);
  const status = ref<'idle' | 'loading' | 'ready' | 'missing' | 'error'>('idle');
  // Answers to a request that a newer one has replaced are dropped.
  let generation = 0;

  async function load() {
    const current = ++generation;
    const target = slug.value;
    if (!target) {
      article.value = null;
      status.value = 'idle';
      return;
    }
    // Clear the old article first, so its title never sits over the next one's loading state.
    article.value = null;
    status.value = 'loading';
    try {
      const response = await newsAPI.getBySlug(language.value, target);
      if (current !== generation) return;
      article.value = response.data ?? null;
      status.value = article.value ? 'ready' : 'missing';
    } catch (error) {
      if (current !== generation) return;
      console.error('Failed to fetch news article:', error);
      article.value = null;
      status.value = 'error';
    }
  }

  watch([slug, language], () => void load(), {immediate: true});

  return {article, status, reload: load};
}
