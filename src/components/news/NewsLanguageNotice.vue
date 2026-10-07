<template>
  <!-- The shared notice, behaviour untouched; only its look is brought into the design system here. -->
  <div class="news-notice">
    <ContentLanguageNotice/>
  </div>
</template>

<script lang="ts" setup>
import ContentLanguageNotice from '@/components/ui/ContentLanguageNotice.vue';
</script>

<style scoped>
/* display: contents keeps the wrapper out of the page's spacing; the notice is fixed anyway */
.news-notice {
  display: contents;
}

/*
 * The notice's own rules (and its light-theme ones) are scoped to it and fairly specific,
 * so these repeat the wrapper class and add :root to win without !important.
 */
:root .news-notice.news-notice :deep(.lang-notice) {
  align-items: center;
  max-width: 520px;
  padding: 14px 16px;
  border: 0;
  border-radius: var(--arc-r-lg);
  background: var(--arc-pop);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line), 0 18px 50px var(--arc-shadow);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

:root .news-notice.news-notice :deep(.notice-glyph) {
  margin-top: 0;
  color: var(--acc-ink);
}

:root .news-notice.news-notice :deep(.notice-label) {
  margin: 0 0 2px;
  color: var(--arc-ink);
  font-family: var(--arc-body);
  font-size: var(--arc-fs-small);
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}

:root .news-notice.news-notice :deep(.notice-text) {
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  line-height: 1.5;
}

:root .news-notice.news-notice :deep(.notice-dismiss) {
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: var(--arc-r-sm);
  color: var(--arc-muted);
}

:root .news-notice.news-notice :deep(.notice-dismiss:hover),
:root .news-notice.news-notice :deep(.notice-dismiss:focus-visible) {
  color: var(--arc-ink);
}
</style>
