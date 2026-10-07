<template>
  <!-- Where an answer continues: pages on this site, or another site in a new tab (said aloud too). -->
  <ul class="help-links">
    <li v-for="link in links" :key="link.href">
      <RouterLink v-if="link.internal" :to="$lp(link.href)" class="help-links__link">
        {{ link.label }}<i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
      </RouterLink>
      <a v-else :href="link.href" class="help-links__link" target="_blank" rel="noopener noreferrer">
        {{ link.label }}<i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i><span class="arc-sr">({{ t('header.newTab') }})</span>
      </a>
    </li>
  </ul>
</template>

<script setup lang="ts">
import {useI18n} from '@/composables/useI18n';

export type HelpLink = {label: string; href: string; internal?: boolean};

defineProps<{links: HelpLink[]}>();

const {t} = useI18n();
</script>

<style scoped>
.help-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  padding: 0;
  list-style: none;
}

/* .arc-prose would space and mark these as list items: they are a row of links */
.help-links > li {
  margin: 0;
}

.help-links__link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  font-weight: 600;
}

.help-links__link i {
  color: var(--acc-ink);
  font-size: .8em;
}
</style>
