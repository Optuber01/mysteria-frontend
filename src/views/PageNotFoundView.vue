<template>
  <ArcPage :lede="t('notFound.message')" :title="t('notFound.title')">
    <template #actions>
      <RouterLink :to="$lp('/')" class="arc-btn arc-btn--solid">{{ t('navHome') }}</RouterLink>
      <RouterLink :to="$lp('/guide')" class="arc-btn arc-btn--ghost">{{ t('navGame') }}</RouterLink>
      <RouterLink :to="$lp('/help')" class="arc-btn arc-btn--ghost">{{ t('footer.linkHelp') }}</RouterLink>
    </template>
  </ArcPage>
</template>

<script lang="ts" setup>
import {useI18n} from "@/composables/useI18n";
import {useSeo} from "@/composables/useSeo";
import ArcPage from "@/components/arcana/ArcPage.vue";

const {t} = useI18n();

// A soft 404: the SPA answers 200, so the noindex tag is what keeps these
// out of the index instead of the status code.
useSeo(() => ({
  title: t("notFound.title"),
  description: t("notFound.message"),
  noindex: true,
}));
</script>
