<template>
  <!-- A page opens like a homepage chapter: the title and a lede, nothing above the title. -->
  <header class="arc-page-head">
    <RouterLink v-if="back" :to="back.to" class="arc-page-head__back">
      <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
      {{ back.label }}
    </RouterLink>
    <h1 :id="titleId" class="arc-h1">
      <slot name="title">{{ title }}</slot>
    </h1>
    <p v-if="$slots.lede" class="arc-lede">
      <slot name="lede"/>
    </p>
    <div v-if="$slots.actions" class="arc-page-head__actions">
      <slot name="actions"/>
    </div>
  </header>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title?: string;
  titleId?: string;
  back?: {to: string; label: string};
}>(), {title: '', titleId: undefined, back: undefined});
</script>

<style scoped>
.arc-page-head {
  display: grid;
  gap: 16px;
  max-width: 860px;
}

.arc-page-head__back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-self: start;
  min-height: 24px;
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  font-weight: 600;
  text-decoration: none;
}

.arc-page-head__back:hover {
  color: var(--acc-ink);
}

.arc-page-head__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}
</style>
