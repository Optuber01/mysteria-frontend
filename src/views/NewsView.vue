<template>
  <ArcPage :title="headTitle" :lede="slug ? undefined : t('newsPage.lede')" :back="back" :narrow="Boolean(slug)">
    <template v-if="article" #lede>
      <span class="news-meta">
        <span class="arc-tag" :class="{'arc-tag--acc': kind === 'announcement'}">{{ kindLabel }}</span>
        <time :datetime="published">{{ publishedLabel }}</time>
      </span>
    </template>

    <NewsIndex v-if="!slug" :language="language"/>

    <ArcState v-else-if="status === 'loading' || status === 'idle'" kind="loading" :text="t('newsPage.loadingArticle')"/>
    <ArcState v-else-if="status === 'error'" kind="error" :text="t('newsPage.articleError')"
              :retry-label="t('newsPage.retry')" @retry="reload"/>
    <ArcState v-else-if="!article" kind="empty" :text="t('newsPage.notFound')"/>
    <NewsArticleBody v-else :article="article"/>

    <NewsLanguageNotice/>
  </ArcPage>
</template>

<script lang="ts" setup>
import {computed} from 'vue';
import {useRoute} from 'vue-router';
import ArcPage from '@/components/arcana/ArcPage.vue';
import ArcState from '@/components/arcana/ArcState.vue';
import NewsArticleBody from '@/components/news/NewsArticleBody.vue';
import NewsIndex from '@/components/news/NewsIndex.vue';
import NewsLanguageNotice from '@/components/news/NewsLanguageNotice.vue';
import {newsKind} from '@/components/news/newsKind';
import {useNewsArticle} from '@/components/news/useNewsArticle';
import {useI18n} from '@/composables/useI18n';
import {localePath} from '@/composables/useLocalePath';
import {ARTICLE_LOCALES, type ArticleLocale, hasOwnArticles, LANGUAGES} from '@/locales';
import {articleLd, breadcrumbLd, useSeo} from '@/composables/useSeo';

const route = useRoute();
const {currentLanguage, intlLocale, locale, t} = useI18n();

const SUPPORTED_LOCALES = new Set<string>(ARTICLE_LOCALES);

const slug = computed(() => route.params.slug as string | undefined);

/*
 * Which language to request the article in. A legacy /news/:locale/:slug URL
 * pins it explicitly; otherwise it follows from the reader's locale. This no
 * longer changes the site language - that is owned by the URL's locale segment.
 */
const language = computed<ArticleLocale>(() => {
  const localeParam = route.params.locale as string | undefined;
  if (localeParam && SUPPORTED_LOCALES.has(localeParam)) return localeParam as ArticleLocale;
  return locale.value.articleLocale;
});

const {article, status, reload} = useNewsArticle(slug, language);

const kind = computed(() => newsKind(article.value?.slug ?? ''));
const kindLabel = computed(() => t(kind.value === 'changelog' ? 'newsPage.changelog' : 'newsPage.announcement'));
const published = computed(() => article.value?.publishedAt || article.value?.createdAt || '');
const publishedLabel = computed(() => published.value
    ? new Date(published.value).toLocaleDateString(intlLocale.value, {year: 'numeric', month: 'long', day: 'numeric'})
    : '');

const headTitle = computed(() => article.value?.title ?? t('newsPage.title'));

// A changelog goes back to the changelog archive, an announcement to the full list.
const back = computed(() => slug.value
    ? {
      to: localePath(kind.value === 'changelog' && article.value ? '/news?type=changelog' : '/news', currentLanguage.value),
      label: t('newsPage.back'),
    }
    : undefined);

/*
 * Articles are authored in the CMS in English and Ukrainian only, so a Chinese
 * reader is served the English text. The canonical URL therefore points at the
 * article's own language (/en/news/:slug), not at the reader's locale - two
 * URLs showing the same English article would otherwise compete as duplicates.
 * hreflang advertises only the locales the article genuinely exists in.
 */
useSeo(() => {
  const current = article.value;
  if (!current) {
    return {
      title: t('newsPage.title'),
      description: 'Patch notes, season announcements and dispatches from Mysterria, the Lord of the Mysteries Minecraft server.',
      path: '/news',
      jsonLd: [breadcrumbLd([{name: 'Home', path: '/'}, {name: 'News', path: '/news'}])],
    };
  }

  const articleSlug = current.slug;
  const articleLanguage = locale.value.articleLocale;
  const path = localePath(`/news/${articleSlug}`, articleLanguage);
  const description = current.shortDescription || current.title;

  return {
    title: current.title,
    description,
    path,
    type: 'article' as const,
    image: current.preview || undefined,
    imageAlt: current.title,
    publishedTime: current.publishedAt,
    modifiedTime: current.updatedAt,
    /*
     * A locale is advertised only if it has its own edition. Chinese readers are
     * served the English text, so claiming a Chinese alternate would point Google
     * at an English page under a Chinese hreflang. Derived from articleLocale so
     * that giving a locale its own articles needs no edit here.
     */
    alternates: Object.fromEntries(LANGUAGES.map(lang => [
      lang,
      hasOwnArticles(lang) ? localePath(`/news/${articleSlug}`, lang) : null,
    ])),
    jsonLd: [
      articleLd({
        title: current.title,
        description,
        url: path,
        image: current.preview || undefined,
        published: current.publishedAt,
        modified: current.updatedAt,
        language: locale.value.articleLocale,
      }),
      breadcrumbLd([
        {name: 'Home', path: '/'},
        {name: 'News', path: '/news'},
        {name: current.title, path},
      ]),
    ],
  };
});
</script>

<style scoped>
.news-meta {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
}
</style>
