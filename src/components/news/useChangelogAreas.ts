import {ref, watch, type Ref} from 'vue';
import type {ArticleLocale} from '@/locales';
import type {NewsArticle} from '@/types/news';
import {newsAPI} from '@/utils/api/news';

/*
 * What a changelog touches, read from its section headings (MOTHER, GENERAL, MOON ...).
 * The index only has previews, so the highlight fetches the one article it shows.
 */
const requests = new Map<string, Promise<string[]>>();

// ":moon: MOON" -> "Moon"; the CMS writes the headings in capitals, which shout in a sentence.
const tidy = (heading: string) => {
  const text = heading.replace(/:[a-z0-9_+-]+:/gi, '').replace(/[*_`]/g, '').trim();
  const shouted = text === text.toUpperCase() && text !== text.toLowerCase();
  return shouted ? text.charAt(0) + text.slice(1).toLowerCase() : text;
};

function areasOf(article: NewsArticle): string[] {
  const headings = article.content
      ? [...article.content.matchAll(/^#{2,3}\s+(.+)$/gm)].map(match => match[1])
      : [...(article.renderedContent ?? '').matchAll(/<h[23][^>]*>(.*?)<\/h[23]>/gi)].map(match => match[1].replace(/<[^>]+>/g, ''));
  return [...new Set(headings.map(tidy).filter(Boolean))];
}

function fetchAreas(language: ArticleLocale, slug: string): Promise<string[]> {
  const key = `${language}/${slug}`;
  let request = requests.get(key);
  if (!request) {
    request = newsAPI.getBySlug(language, slug).then(
        response => (response.data ? areasOf(response.data) : []),
        () => {
          // Let a later visit try again; the highlight simply shows no areas meanwhile.
          requests.delete(key);
          return [];
        },
    );
    requests.set(key, request);
  }
  return request;
}

export function useChangelogAreas(slug: Ref<string | undefined>, language: Ref<ArticleLocale>) {
  const areas = ref<string[]>([]);

  watch([slug, language], ([target, lang]) => {
    areas.value = [];
    if (!target) return;
    void fetchAreas(lang, target).then(list => {
      if (target === slug.value && lang === language.value) areas.value = list;
    });
  }, {immediate: true});

  return {areas};
}
