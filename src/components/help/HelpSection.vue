<template>
  <!-- One answer on the page: an anchor other pages link to (/help#top-ups), its heading, then the text. -->
  <section :id="id" class="help-section" :aria-labelledby="`${id}-title`" data-spy>
    <h2 :id="`${id}-title`" class="arc-h2 help-section__title">{{ title }}</h2>
    <div class="arc-prose help-section__body">
      <slot/>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{id: string; title: string}>();
</script>

<style scoped>
/* a deep link lands with the heading clear of the fixed header */
.help-section {
  scroll-margin-top: calc(var(--site-header-stack, 106px) + 16px);
}

.help-section + .help-section {
  margin-top: var(--arc-head-gap);
  padding-top: var(--arc-head-gap);
  border-top: var(--arc-bw) solid var(--arc-line);
}

.help-section__body {
  margin-top: var(--arc-group-gap);
}

/* a command stays on one line rather than breaking at its spaces */
.help-section__body :deep(code) {
  white-space: nowrap;
}

/* sub-heads inside an answer sit closer than the prose default */
.help-section__body :deep(h3) {
  margin-top: 1.6em;
}
</style>
