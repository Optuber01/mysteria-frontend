<template>
  <!-- The card of a single-purpose screen: the Mysterria mark, then whatever the page puts in it, centred. -->
  <div class="arc-panel arc-gate-card">
    <img :src="logo" alt="" class="arc-gate-card__mark" width="56" height="56">
    <slot/>
  </div>
</template>

<script setup lang="ts">
import logo from '@/assets/icons/sources/IconLogo-128.webp';
</script>

<style scoped>
.arc-gate-card {
  display: grid;
  justify-items: center;
  gap: 14px;
  width: min(100%, 440px);
  padding: clamp(28px, 4vw, 44px) var(--arc-pad);
  text-align: center;
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line),
  0 30px 80px color-mix(in oklab, var(--acc) 9%, transparent);
}

.arc-gate-card__mark {
  width: 56px;
  height: 56px;
  margin-bottom: 8px;
  border-radius: var(--arc-r-md);
}

.arc-gate-card :deep(h1),
.arc-gate-card :deep(p) {
  margin: 0;
}

.arc-gate-card :deep(.arc-lede) {
  font-size: var(--arc-fs-body);
}
</style>
