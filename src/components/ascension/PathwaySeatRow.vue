<template>
  <!--
    One Pathway: its name and how many walk it, then its four capped seats from
    Sequence 3 up to the throne, filled and open. With names from the server, the
    row opens to the holders, rung by rung (the homepage's rung panel).
  -->
  <li class="asc-row" :class="{'is-open': open}">
    <div class="asc-row__main">
      <div class="asc-row__pathway">
        <img :src="sigilThumb(row.id)" alt="" width="40" height="40" loading="lazy" decoding="async">
        <RouterLink :to="$lp(`/pathways/${row.id}`)" class="asc-row__name">{{ row.name }}</RouterLink>
      </div>

      <dl class="asc-row__stats">
        <div class="asc-cell asc-cell--walkers">
          <dt class="asc-cell__label">{{ t('ascensionPage.colWalkers') }}</dt>
          <dd>
            <template v-if="row.walkers !== null">
              <span class="asc-cell__num">{{ format(row.walkers) }}</span>
              <span class="asc-bar" aria-hidden="true"><i :style="{transform: `scaleX(${walkerShare})`}"></i></span>
            </template>
            <span v-else class="asc-cell__none">
              <span aria-hidden="true">–</span><span class="arc-sr">{{ t('ascensionPage.notCounted') }}</span>
            </span>
          </dd>
        </div>

        <div
            v-for="seat in row.seats"
            :key="seat.sequence"
            class="asc-cell asc-cell--seat"
            :class="{'is-full': isFull(seat), 'is-throne': seat.sequence === 0}"
        >
          <dt class="asc-cell__label"><b>{{ seat.sequence }}</b> {{ seat.rank }}</dt>
          <dd>
            <span v-if="seat.count === null" class="asc-cell__none">
              <span aria-hidden="true">–</span><span class="arc-sr">{{ t('ascensionPage.notCounted') }}</span>
            </span>
            <!-- the throne is one seat: say whether it's taken (and by whom), not "1/1" -->
            <span v-else-if="seat.sequence === 0" class="asc-cell__num asc-cell__throne">
              {{ seat.count ? (seat.holders?.[0] ?? t('ascensionPage.taken')) : t('ascensionPage.open') }}
            </span>
            <span v-else-if="seat.limit === null" class="asc-cell__num">{{ format(seat.count) }}</span>
            <span v-else class="asc-cell__num">
              <span aria-hidden="true">{{ format(seat.count) }}<span class="asc-cell__of">/{{ seat.limit }}</span></span>
              <span class="arc-sr">{{ t('ascensionPage.seatsOf').replace('{count}', format(seat.count)).replace('{limit}', String(seat.limit)) }}</span>
            </span>
            <span v-if="seat.limit !== null" class="asc-meter" aria-hidden="true">
              <i v-for="tick in seat.limit" :key="tick" :class="{'is-held': tick <= (seat.count ?? 0)}"></i>
            </span>
          </dd>
        </div>
      </dl>

      <button
          v-if="withHolders"
          type="button"
          class="asc-row__toggle"
          :aria-expanded="open"
          :aria-controls="panelId"
          @click="open = !open"
      >
        {{ t('ascensionPage.holders') }}<span class="arc-sr">: {{ row.name }}</span>
        <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
      </button>
    </div>

    <div v-if="withHolders" :id="panelId" class="asc-holders" role="region" :aria-label="panelLabel" :hidden="!open">
      <ol class="asc-holders__rungs">
        <li v-for="seat in row.seats" :key="seat.sequence" :class="{'is-throne': seat.sequence === 0}">
          <h3 class="asc-holders__title">
            <b>{{ seat.sequence }}</b> {{ seat.rank }}
            <span>{{ seat.rung }}</span>
          </h3>
          <ul class="asc-holders__names">
            <li v-for="name in seat.holders ?? []" :key="name" class="arc-tag" :class="{'arc-tag--acc': seat.sequence === 0}">{{ name }}</li>
            <li v-if="seat.limit !== null && seat.limit > (seat.count ?? 0)" class="asc-holders__open">
              {{ openSeats(seat.limit - (seat.count ?? 0)) }}
            </li>
            <li v-else-if="seat.limit === null && !seat.holders?.length" class="asc-holders__none">{{ t('ascensionPage.nobody') }}</li>
          </ul>
        </li>
      </ol>
    </div>
  </li>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {sigilThumb} from '@/components/home-arcana/arcana-data';
import type {PathwayRow, SeatCell} from './types';

const props = defineProps<{
  row: PathwayRow;
  /** The most walked Pathway's count, for the population bar's scale. */
  maxWalkers: number;
  /** The server sent names: rows open to their holders. */
  withHolders: boolean;
}>();

const {t, tree, plural, intlLocale} = useI18n();
const format = (n: number) => n.toLocaleString(intlLocale.value);

const open = ref(false);
const panelId = computed(() => `asc-holders-${props.row.id}`);
const panelLabel = computed(() => t('ascensionPage.holdersOf').replace('{pathway}', props.row.name));
const walkerShare = computed(() => Math.min(1, (props.row.walkers ?? 0) / Math.max(1, props.maxWalkers)));

const isFull = (seat: SeatCell) => seat.limit !== null && (seat.count ?? 0) >= seat.limit;

const openSeats = (n: number) =>
  plural(n, tree<{one: string; few: string; many: string}>('ascensionPage.openSeats')).replace('{count}', format(n));
</script>

<style scoped>
.asc-row {
  border-top: var(--arc-bw) solid var(--arc-line);
}

.asc-row__main {
  display: grid;
  grid-template-columns: var(--asc-cols);
  align-items: center;
  gap: 0 var(--asc-col-gap);
  min-height: 68px;
  padding: 12px 0;
}

.asc-row__pathway {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.asc-row__pathway img {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.asc-row__name {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  font-weight: 600;
  font-size: var(--arc-fs-body);
  line-height: 1.3;
  color: var(--arc-ink);
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: .22em;
  transition: color .2s ease, text-decoration-color .2s ease;
}

.asc-row__name:hover {
  color: var(--acc-ink);
  text-decoration-color: currentColor;
}

/* the walkers column and the four seats share the head row's tracks */
.asc-row__stats {
  display: grid;
  grid-template-columns: var(--asc-stat-cols);
  gap: 0 var(--asc-col-gap);
  margin: 0;
}

.asc-cell {
  min-width: 0;
}

.asc-cell dd {
  display: grid;
  gap: 7px;
  margin: 0;
}

/* on wide screens the head row names the columns; the labels stay for screen readers */
.asc-cell__label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.asc-cell__num {
  font-weight: 600;
  font-size: var(--arc-fs-body);
  line-height: 1.2;
  color: var(--arc-ink);
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.asc-cell__of {
  font-weight: 500;
  color: var(--arc-muted);
}

.asc-cell__none {
  color: var(--arc-muted);
}

/* a full rung reads as full in ink; the accent is kept for a seated god */
.asc-cell--seat.is-full .asc-cell__of {
  color: var(--arc-ink);
}

.is-throne.is-full .asc-cell__throne {
  color: var(--acc-ink);
}

.is-throne:not(.is-full) .asc-cell__throne {
  font-weight: 500;
  color: var(--arc-muted);
}

/* population: a quiet bar under the number, scaled to the most walked Pathway */
.asc-bar {
  display: block;
  height: 3px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--arc-line);
}

.asc-bar i {
  display: block;
  height: 100%;
  background: color-mix(in oklab, var(--arc-ink) 55%, transparent);
  transform-origin: left;
}

/* a seat meter: one tick per seat, held ones filled; a full rung fills solid */
.asc-meter {
  display: flex;
  gap: 2px;
  height: 6px;
}

.asc-meter i {
  flex: 1;
  min-width: 0;
  border-radius: 1px;
  background: var(--arc-line);
}

.asc-meter i.is-held {
  background: color-mix(in oklab, var(--arc-ink) 50%, transparent);
}

.is-full .asc-meter i.is-held {
  background: var(--arc-ink);
}

.is-throne.is-full .asc-meter i.is-held {
  background: var(--acc-ink);
}

.asc-row__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-height: 36px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--arc-r-md);
  background: none;
  color: var(--arc-muted);
  font: inherit;
  font-size: var(--arc-fs-small);
  font-weight: 600;
  cursor: pointer;
  transition: color .2s ease, background-color .2s ease;
}

.asc-row__toggle:hover {
  color: var(--arc-ink);
  background: var(--arc-glass);
}

.asc-row__toggle i {
  font-size: 11px;
  transition: transform .25s ease;
}

.is-open .asc-row__toggle {
  color: var(--acc-ink);
}

.is-open .asc-row__toggle i {
  transform: rotate(180deg);
}

/* the open row: the homepage's rung panel, across the row */
.asc-holders {
  margin: 0 0 16px;
  padding: 6px 20px;
  border-radius: var(--arc-r-lg);
  background: color-mix(in oklab, var(--acc) 5%, var(--arc-raised));
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
}

.asc-holders[hidden] {
  display: none;
}

/* one hairline row per rung: the rung on the left, its holders on the right */
.asc-holders__rungs {
  list-style: none;
  margin: 0;
  padding: 0;
}

.asc-holders__rungs > li {
  display: grid;
  grid-template-columns: minmax(180px, 260px) minmax(0, 1fr);
  align-items: baseline;
  gap: 8px 24px;
  padding: 12px 0;
}

.asc-holders__rungs > li + li {
  border-top: var(--arc-bw) solid var(--arc-line);
}

.asc-holders__title {
  margin: 0;
  font-size: var(--arc-fs-small);
  font-weight: 600;
  line-height: 1.4;
  color: var(--arc-ink);
}

.asc-holders__title b {
  margin-right: 4px;
  color: var(--arc-muted);
}

.is-throne .asc-holders__title,
.is-throne .asc-holders__title b {
  color: var(--acc-ink);
}

.asc-holders__title span {
  display: block;
  font-weight: 500;
  color: var(--arc-muted);
}

.asc-holders__names {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
}

.asc-holders__names .arc-tag {
  color: var(--arc-ink);
}

.asc-holders__names .arc-tag--acc {
  color: var(--acc-ink);
}

/* open seats: one dashed slot that counts them, not a row of empties */
.asc-holders__open {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 2px 8px;
  border: var(--arc-bw) dashed color-mix(in oklab, var(--arc-ink) 28%, transparent);
  border-radius: var(--arc-r-sm);
  color: var(--arc-muted);
  font-size: var(--arc-fs-caption);
  font-weight: 600;
}

.asc-holders__none {
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
}

/*
 * A phone: the Pathway and its holders button on one line, the walkers under it,
 * then the five seats side by side with their labels shown.
 */
@media (max-width: 900px) {
  .asc-row__main {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 14px 12px;
    padding: 16px 0;
  }

  .asc-row__stats {
    grid-column: 1 / -1;
    grid-row: 2;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 14px 8px;
  }

  /* the walkers on one line: label, number, bar */
  .asc-cell--walkers {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 12px;
  }

  .asc-cell--walkers dd {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 12px;
  }

  .asc-cell__label {
    position: static;
    width: auto;
    height: auto;
    overflow: visible;
    clip: auto;
    margin-bottom: 6px;
    font-size: var(--arc-fs-caption);
    font-weight: 600;
    color: var(--arc-muted);
    overflow-wrap: anywhere;
    white-space: normal;
  }

  .asc-cell--walkers .asc-cell__label {
    margin: 0;
  }

  /* number over rank, so the five seats line up whatever wraps */
  .asc-cell--seat .asc-cell__label {
    display: grid;
    font-size: 12px;
    line-height: 1.3;
    overflow-wrap: normal;
    white-space: nowrap;
  }

  .asc-row__toggle {
    grid-column: 2;
    grid-row: 1;
    padding-right: 8px;
  }

  .asc-holders {
    padding: 4px 16px;
  }

  .asc-holders__rungs > li {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .asc-row__toggle i {
    transition: none;
  }
}
</style>
