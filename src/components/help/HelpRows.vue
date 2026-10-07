<template>
  <!-- Short named answers (a problem and its fix, an event and its rules): hairline rows, never boxes. -->
  <dl class="arc-rows help-rows">
    <div v-for="row in rows" :key="row.term" class="arc-row help-rows__row">
      <dt class="help-rows__term">{{ row.term }}</dt>
      <dd class="help-rows__detail">
        <HelpText :text="row.detail" tag="span"/>
      </dd>
    </div>
  </dl>
</template>

<script setup lang="ts">
import HelpText from './HelpText.vue';

export type HelpRow = {term: string; detail: string};

defineProps<{rows: HelpRow[]}>();
</script>

<style scoped>
.help-rows__row {
  display: grid;
  grid-template-columns: minmax(150px, 13em) minmax(0, 1fr);
  gap: 6px 24px;
  align-items: baseline;
  padding: 16px 0;
}

.help-rows__term {
  color: var(--arc-ink);
  font-weight: 650;
  line-height: 1.45;
}

.help-rows__detail {
  margin: 0;
  color: color-mix(in oklab, var(--arc-ink) 86%, var(--arc-muted));
}

@media (max-width: 640px) {
  .help-rows__row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
