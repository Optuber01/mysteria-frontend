<template>
  <!-- One way to say "loading", "nothing here" or "this failed" (with a way to retry). -->
  <div class="arc-state" :class="`arc-state--${kind}`" :role="kind === 'error' ? 'alert' : 'status'">
    <span v-if="kind === 'loading'" class="arc-state__spinner" aria-hidden="true"></span>
    <i v-else-if="kind === 'error'" class="fa-solid fa-triangle-exclamation arc-state__icon" aria-hidden="true"></i>
    <p class="arc-state__text"><slot>{{ text }}</slot></p>
    <button v-if="retryLabel" type="button" class="arc-btn arc-btn--ghost arc-btn--sm" @click="$emit('retry')">{{ retryLabel }}</button>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  kind?: 'loading' | 'empty' | 'error';
  text?: string;
  retryLabel?: string;
}>(), {kind: 'empty', text: '', retryLabel: ''});
defineEmits<{(e: 'retry'): void}>();
</script>

<style scoped>
.arc-state {
  display: grid;
  justify-items: center;
  gap: 14px;
  padding: clamp(32px, 5vw, 56px) var(--arc-pad);
  border-radius: var(--arc-r-lg);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
  color: var(--arc-muted);
  text-align: center;
}

.arc-state__text {
  max-width: 48ch;
  margin: 0;
}

.arc-state__icon {
  color: var(--arc-bad);
  font-size: 20px;
}

.arc-state__spinner {
  width: 22px;
  height: 22px;
  border: 2px solid var(--arc-line);
  border-top-color: var(--acc-ink);
  border-radius: 50%;
  animation: arc-state-spin .9s linear infinite;
}

@keyframes arc-state-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .arc-state__spinner {
    animation-duration: 2.4s;
  }
}
</style>
