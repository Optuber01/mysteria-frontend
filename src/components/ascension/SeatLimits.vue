<template>
  <!-- The climb above Sequence 5, server-wide: each rung's cap per Pathway and how full it is. -->
  <ol class="asc-limits">
    <li v-for="rung in rungs" :key="rung.sequence" :class="{'is-top': rung.sequence === 0}">
      <span class="asc-limits__rank"><b>{{ rung.sequence }}</b>{{ rung.rank }}</span>
      <span class="asc-limits__cap">
        {{ rung.limit === null ? t('ascensionPage.noLimit') : t('ascensionPage.perPathway').replace('{count}', format(rung.limit)) }}
      </span>
      <span v-if="rung.count !== null" class="asc-limits__count">
        <template v-if="rung.limit === null">{{ beyonders(rung.count) }}</template>
        <template v-else>{{ t('ascensionPage.heldOf').replace('{held}', format(rung.count)).replace('{total}', format(rung.total)) }}</template>
      </span>
    </li>
  </ol>
</template>

<script setup lang="ts">
import {useI18n} from '@/composables/useI18n';
import type {RungSummary} from './types';

defineProps<{rungs: RungSummary[]}>();

const {t, tree, plural, intlLocale} = useI18n();
const format = (n: number) => n.toLocaleString(intlLocale.value);
const beyonders = (n: number) =>
  plural(n, tree<{one: string; few: string; many: string}>('ascensionPage.beyonders')).replace('{count}', format(n));
</script>

<style scoped>
/* the homepage's ladder tiles, read-only: one per rung, the throne last and in the accent */
.asc-limits {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
}

.asc-limits li {
  display: grid;
  align-content: start;
  gap: 4px;
  min-width: 0;
  padding: 14px 16px 16px;
  border-radius: var(--arc-r-md);
  background: var(--arc-glass);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
}

.asc-limits li.is-top {
  background: linear-gradient(180deg, color-mix(in oklab, var(--acc) 14%, var(--arc-glass)), var(--arc-glass));
}

.asc-limits__rank {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: var(--arc-fs-h4);
  line-height: 1.25;
  color: var(--arc-ink);
}

.asc-limits__rank b {
  font-weight: 600;
  font-size: var(--arc-fs-caption);
  color: var(--arc-muted);
}

.is-top .asc-limits__rank,
.is-top .asc-limits__rank b {
  color: var(--acc-ink);
}

.asc-limits__cap {
  font-size: var(--arc-fs-small);
  font-weight: 600;
  color: var(--arc-ink);
}

.asc-limits__count {
  font-size: var(--arc-fs-small);
  color: var(--arc-muted);
  font-variant-numeric: tabular-nums;
}

/* on a phone the five tiles become hairline rows: rank on the left, numbers on the right */
@media (max-width: 760px) {
  .asc-limits {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
    padding: 4px var(--arc-pad);
    border-radius: var(--arc-r-lg);
    box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
  }

  .asc-limits li,
  .asc-limits li.is-top {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 2px 12px;
    padding: 12px 0;
    border-radius: 0;
    background: none;
    box-shadow: none;
  }

  .asc-limits li + li {
    border-top: var(--arc-bw) solid var(--arc-line);
  }

  .asc-limits__rank {
    grid-row: span 2;
    font-size: 17px;
  }

  .asc-limits__cap,
  .asc-limits__count {
    text-align: right;
  }
}
</style>
