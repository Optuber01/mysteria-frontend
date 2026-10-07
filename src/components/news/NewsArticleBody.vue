<template>
  <article class="news-article">
    <!-- the cover is the first thing on the page: it loads at once and keeps its place -->
    <img
        v-if="cover"
        class="news-article__cover"
        :src="article.preview"
        alt=""
        width="1600"
        height="900"
        fetchpriority="high"
        decoding="async"
    >
    <div v-dompurify-html="html" class="arc-prose news-prose"></div>
  </article>
</template>

<script lang="ts" setup>
import {computed} from 'vue';
import MarkdownIt from 'markdown-it';
import type {NewsArticle} from '@/types/news';
import {pathwayEmojiPlugin} from '@/utils/pathwayPlugin';
import {newsKind} from './newsKind';
import {vDompurifyHtml} from '@/directives/dompurifyHtml';

const props = defineProps<{ article: NewsArticle }>();

const md = new MarkdownIt({html: true, linkify: true, typographer: true});
md.use(pathwayEmojiPlugin);

// Images below the cover load as they are scrolled to.
const defaultImage = md.renderer.rules.image
    ?? ((tokens, index, options, _env, self) => self.renderToken(tokens, index, options));
md.renderer.rules.image = (tokens, index, options, env, self) => {
  tokens[index].attrSet('loading', 'lazy');
  tokens[index].attrSet('decoding', 'async');
  return defaultImage(tokens, index, options, env, self);
};

// Wide tables scroll inside their own frame instead of widening the page.
md.renderer.rules.table_open = () => '<div class="arc-table-wrap"><table class="arc-table">\n';
md.renderer.rules.table_close = () => '</table></div>\n';

// Changelogs share one stock banner; showing it on every one would be filler.
const cover = computed(() => newsKind(props.article.slug) === 'announcement' && Boolean(props.article.preview));

const html = computed(() => props.article.content
    ? md.render(props.article.content)
    : props.article.renderedContent ?? '');
</script>

<style scoped>
.news-article {
  display: grid;
  gap: var(--arc-head-gap);
  max-width: 46rem;
}

.news-article__cover {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: var(--arc-r-lg);
  box-shadow: 0 0 0 var(--arc-bw) var(--arc-line);
}

.news-prose {
  max-width: none;
  overflow-wrap: break-word;
}

.news-prose > :deep(:first-child) {
  margin-top: 0;
}

.news-prose :deep(img) {
  margin-block: 1.4em;
  box-shadow: 0 0 0 var(--arc-bw) var(--arc-line);
}

/* pathway emoji (:moon:) are glyphs in a line of text, not figures */
.news-prose :deep(img.pathway-emoji) {
  display: inline;
  width: auto;
  height: 1.15em;
  margin: 0 .1em;
  border-radius: 0;
  box-shadow: none;
  vertical-align: -.2em;
}

.news-prose :deep(.arc-table-wrap) {
  margin-block: 1.4em;
}

.news-prose :deep(pre) {
  margin-block: 1.2em;
  font-size: var(--arc-fs-small);
  line-height: 1.6;
}

.news-prose :deep(hr) {
  margin-block: 2em;
}
</style>
