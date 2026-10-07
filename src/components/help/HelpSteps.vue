<template>
  <!-- A procedure: numbered steps, the number in the accent so the order reads at a glance. -->
  <ol class="help-steps">
    <li v-for="(step, index) in steps" :key="index" class="help-steps__step">
      <span class="help-steps__num" aria-hidden="true">{{ index + 1 }}</span>
      <HelpText :text="step" tag="span" class="help-steps__text"/>
    </li>
  </ol>
</template>

<script setup lang="ts">
import HelpText from './HelpText.vue';

defineProps<{steps: string[]}>();
</script>

<style scoped>
/* the list's own numbers are replaced by the drawn ones; the <ol> keeps the order for screen readers */
.help-steps {
  padding: 0;
  list-style: none;
}

.help-steps__step {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 14px;
  align-items: baseline;
}

.help-steps__step + .help-steps__step {
  margin-top: .75em;
}

.help-steps__num {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: var(--arc-r-sm);
  background: color-mix(in oklab, var(--acc) 10%, transparent);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line-acc);
  color: var(--acc-ink);
  font-size: var(--arc-fs-small);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.help-steps__text {
  color: color-mix(in oklab, var(--arc-ink) 86%, var(--arc-muted));
}
</style>
