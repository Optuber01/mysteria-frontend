<template>
  <!--
    A single-purpose page (sign in, sign out, not found): the usual header and footer, and one
    column centred both ways in the room between them. Wraps ArcPage rather than changing it.
  -->
  <ArcPage class="arc-centered">
    <slot/>
  </ArcPage>
</template>

<script setup lang="ts">
import ArcPage from './ArcPage.vue';
</script>

<style scoped>
/* ArcPage's main pads for an overlay header; here the header is in the flow, so pad evenly. */
.arc-centered :deep(.arc-page) {
  display: grid;
  place-items: center;
  min-height: clamp(520px, 80dvh, 760px);
  padding-block: var(--arc-section-pad);
}

.arc-centered :deep(.arc-shell) {
  display: grid;
  justify-items: center;
  max-width: 560px;
}
</style>
