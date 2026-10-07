<template>
  <!-- One Pathway in the grid: its seal in its own colour, its name, where it starts and how far it goes. -->
  <RouterLink :to="$lp(`/pathways/${card.id}`)" class="pw-tile" :style="{'--tok': card.accent}">
    <PathwaySeal :id="card.id" :accent="card.accent"/>
    <span class="pw-tile__text">
      <span class="pw-tile__name">{{ name }}</span>
      <span v-if="start" class="pw-tile__line">{{ start }}</span>
      <span class="pw-tile__line">{{ meta }}</span>
    </span>
    <span v-if="card.numeral" class="pw-tile__numeral" aria-hidden="true">{{ card.numeral }}</span>
  </RouterLink>
</template>

<script setup lang="ts">
import type {ArcanaCard} from '@/components/home-arcana/arcana-data';
import PathwaySeal from './PathwaySeal.vue';

defineProps<{card: ArcanaCard; name: string; start: string; meta: string}>();
</script>

<style scoped>
.pw-tile {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  padding: 16px 18px;
  border-radius: var(--arc-r-lg);
  background: var(--arc-raised);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
  color: inherit;
  text-decoration: none;
  transition: box-shadow .25s ease, transform .3s cubic-bezier(.2, .8, .2, 1);
}

.pw-tile:hover {
  color: inherit;
  transform: translateY(-2px);
  box-shadow: inset 0 0 0 var(--arc-bw) color-mix(in oklab, var(--tok) 55%, transparent);
}

/* the seal lifts toward the reader, the way the orbit's seals do */
.pw-tile:hover :deep(.pw-seal),
.pw-tile:focus-visible :deep(.pw-seal) {
  transform: scale(1.06);
  box-shadow:
    inset 0 0 0 var(--arc-bw) var(--tok),
    0 0 24px color-mix(in oklab, var(--tok) 35%, transparent),
    0 10px 24px var(--arc-shadow);
}

.pw-tile:focus-visible {
  outline: var(--arc-focus-w) solid var(--arc-ink);
  outline-offset: var(--arc-focus-off);
}

.pw-tile__text {
  display: grid;
  gap: 3px;
  min-width: 0;
  padding-right: 22px;
}

.pw-tile__name {
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-size: var(--arc-fs-h4);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.01em;
  overflow-wrap: anywhere;
}

.pw-tile__line {
  color: var(--arc-muted);
  font-size: var(--arc-fs-caption);
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.pw-tile__numeral {
  position: absolute;
  top: 14px;
  right: 16px;
  color: var(--arc-muted);
  font-size: var(--arc-fs-caption);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .pw-tile {
    transition: none;
  }

  .pw-tile:hover {
    transform: none;
  }
}
</style>
