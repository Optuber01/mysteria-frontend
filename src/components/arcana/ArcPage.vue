<template>
  <!--
    Every page but the homepage is laid out the same way: the site's header, one main
    column between the site's edges (an optional page head first), and the full footer.
  -->
  <div class="arc-site">
    <HeaderItem/>
    <main id="main-content" class="arc-page">
      <div class="arc-shell" :class="{'arc-shell--narrow': narrow}">
        <ArcPageHead v-if="title" :title="title" :back="back">
          <template v-if="$slots.lede || lede" #lede><slot name="lede">{{ lede }}</slot></template>
          <template v-if="$slots.actions" #actions><slot name="actions"/></template>
        </ArcPageHead>
        <slot/>
      </div>
    </main>
    <FooterItem/>
  </div>
</template>

<script setup lang="ts">
import HeaderItem from '@/components/layout/HeaderItem.vue';
import FooterItem from '@/components/layout/FooterItem.vue';
import ArcPageHead from './ArcPageHead.vue';

defineProps<{
  /** The page's h1 (omit to render your own head). */
  title?: string;
  lede?: string;
  /** A way back up (e.g. from an article to the news): {to, label}. */
  back?: {to: string; label: string};
  /** A reading column (articles, legal text) instead of the full container. */
  narrow?: boolean;
}>();
</script>

<style scoped>
.arc-site {
  position: relative;
  min-height: 100vh;
  background: var(--arc-bg);
  color: var(--arc-ink);
}

.arc-shell--narrow {
  max-width: 860px;
}
</style>
