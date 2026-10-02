<template>
  <header class="arc-head" :class="{'is-center': center}">
    <p class="arc-head__position">
      <span class="arc-head__card" aria-hidden="true"><span>{{ numeral }}</span></span>
      <span>{{ position }}</span>
    </p>
    <h2 :id="titleId" class="arc-head__title">
      <slot name="title">{{ title }}</slot>
    </h2>
    <p v-if="$slots.default" class="arc-head__lede">
      <slot/>
    </p>
  </header>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  numeral: string;
  position: string;
  title?: string;
  titleId?: string;
  center?: boolean;
}>(), {title: '', titleId: undefined, center: false});
</script>

<style scoped>
.arc-head {
  max-width: 820px;
  margin-bottom: clamp(28px, 4vw, 48px);
}

.arc-head.is-center {
  margin-inline: auto;
  text-align: center;
}

.arc-head__position {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  margin: 0 0 20px;
  font-family: var(--arc-caps);
  font-size: 11.5px;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--acc);
}

.arc-head__card {
  display: grid;
  place-items: center;
  width: 26px;
  height: 42px;
  border: 1.5px solid var(--acc);
  border-radius: 3px;
  background: color-mix(in oklab, var(--acc) 12%, transparent);
  transform: rotate(-8deg);
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0;
}

.arc-head__title {
  margin: 0;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: clamp(34px, 4.6vw, 66px);
  line-height: 1;
  letter-spacing: -.025em;
  color: var(--arc-ink);
  text-wrap: balance;
}

.arc-head__title :deep(em) {
  font-style: normal;
  color: var(--acc);
}

.arc-head__lede {
  max-width: 40em;
  margin: 22px 0 0;
  font-size: clamp(16px, 1.2vw, 18px);
  line-height: 1.65;
  color: var(--arc-muted);
}

.arc-head.is-center .arc-head__lede {
  margin-inline: auto;
}
</style>
