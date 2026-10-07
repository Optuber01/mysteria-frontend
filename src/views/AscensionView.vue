<template>
  <ArcPage :title="ui.title" :lede="ui.lede">
    <ArcState v-if="!data" kind="loading" :text="ui.loading"/>

    <template v-else>
      <!-- the caps are the game's rules, so they stand even when the census can't be read -->
      <section class="asc-section" aria-labelledby="asc-limits-title">
        <h2 id="asc-limits-title" class="arc-h3">{{ ui.limitsTitle }}</h2>
        <SeatLimits :rungs="rungs"/>
      </section>

      <section class="asc-section" aria-labelledby="asc-table-title">
        <div class="asc-section__head">
          <h2 id="asc-table-title" class="arc-h3">{{ ui.tableTitle }}</h2>
          <ArcTabs v-if="stats && !empty" v-model="sortMode" :tabs="sortTabs" :label="ui.sortLabel" controls="asc-table"/>
        </div>

        <ArcState v-if="!stats && loading" kind="loading" :text="ui.loading"/>
        <ArcState v-else-if="!stats" kind="error" :text="ui.error" :retry-label="ui.retry" @retry="reload"/>
        <ArcState v-else-if="empty" kind="empty" :text="ui.empty"/>
        <template v-else>
          <div id="asc-table" class="asc-table" :class="{'has-holders': withHolders}">
            <!-- column names for sighted readers; each row's own labels carry them for screen readers -->
            <div class="asc-table__head" aria-hidden="true">
              <span>{{ ui.colPathway }}</span>
              <span class="asc-table__stats">
                <span>{{ ui.colWalkers }}</span>
                <span v-for="rung in seatRungs" :key="rung.sequence" :class="{'is-top': rung.sequence === 0}">
                  <b>{{ rung.sequence }}</b> {{ rung.rank }}
                </span>
              </span>
              <span v-if="withHolders"></span>
            </div>
            <ol class="asc-table__rows">
              <PathwaySeatRow
                  v-for="row in sortedRows"
                  :key="row.id"
                  :row="row"
                  :max-walkers="maxWalkers"
                  :with-holders="withHolders"
              />
            </ol>
          </div>

          <ul v-if="boonRows.length" class="asc-boons" :aria-label="ui.boonsTitle">
            <li class="asc-boons__note">{{ ui.boonsNote }}</li>
            <li v-for="boon in boonRows" :key="boon.id">
              <RouterLink :to="$lp(`/pathways/${boon.id}`)" class="arc-link">{{ boon.name }}</RouterLink>
              <span class="asc-boons__count">{{ format(boon.walkers) }}</span>
            </li>
          </ul>

          <p class="asc-note">{{ note }}</p>
        </template>
      </section>
    </template>
  </ArcPage>
</template>

<script lang="ts" setup>
import {computed, ref, shallowRef} from 'vue';
import ArcPage from '@/components/arcana/ArcPage.vue';
import ArcState from '@/components/arcana/ArcState.vue';
import ArcTabs from '@/components/arcana/ArcTabs.vue';
import SeatLimits from '@/components/ascension/SeatLimits.vue';
import PathwaySeatRow from '@/components/ascension/PathwaySeatRow.vue';
import {type AscensionStats, type PathwayRow, type RungSummary, SEAT_SEQUENCES} from '@/components/ascension/types';
import {loadPathways, type PathwaysModule} from '@/components/home-arcana/arcana-data';
import {useI18n} from '@/composables/useI18n';
import {useBeyonderStats} from '@/composables/useBeyonderStats';
import {breadcrumbLd, useSeo} from '@/composables/useSeo';
import type {Translations} from '@/locales';

const {currentLanguage, intlLocale, tree} = useI18n();
const ui = computed(() => tree<Translations['ascensionPage']>('ascensionPage'));
const format = (n: number) => n.toLocaleString(intlLocale.value);

const {stats: rawStats, loading, fetchedAt, reload} = useBeyonderStats();
const stats = computed(() => rawStats.value as AscensionStats | null);

// the pathway archive is ~1.3 MB of JSON: fetched with the census, not in this route's chunk
const data = shallowRef<PathwaysModule | null>(null);
void loadPathways().then(module => (data.value = module));

/** Beyonders per Pathway: every Pathway once the server sends them all, else the top eight. */
const walkers = computed(() => {
  const list = stats.value?.pathwayCounts ?? stats.value?.topPathways ?? [];
  return new Map(list.map(entry => [entry.name.toLowerCase(), entry.count]));
});
const walkersPartial = computed(() => !stats.value?.pathwayCounts);

const withHolders = computed(() => (stats.value?.highSeats ?? []).some(entry => Array.isArray(entry.holders)));
/** Sequence 4 is counted per Pathway only in newer responses. */
const withDemigods = computed(() => (stats.value?.highSeats ?? []).some(entry => entry.counts.length > 4));

const rows = computed<PathwayRow[]>(() => {
  const module = data.value;
  if (!module) return [];
  const language = currentLanguage.value;
  const occupancy = new Map((stats.value?.highSeats ?? []).map(entry => [entry.pathway.toLowerCase(), entry]));
  // every Pathway that climbs past Sequence 5 has all four seats on the server (boons stop at 5)
  return module.pathways
      .filter(pathway => !module.boonPathwayIds.has(pathway.id) && pathway.sequences.some(s => s.sequence <= 4))
      .map(pathway => {
        const entry = occupancy.get(pathway.id);
        const seats = SEAT_SEQUENCES.map(sequence => {
          const rung = pathway.sequences.find(s => s.sequence === sequence);
          return {
            sequence,
            rank: module.sequenceRank(sequence, language),
            // in Chinese the throne's god is not the pathway's name (愚者 crowns 占卜家)
            rung: rung ? module.pick(rung.name, language) : module.deityName(pathway.id, language),
            count: sequence === 4 && !withDemigods.value ? null : entry?.counts[sequence] ?? 0,
            limit: module.HIGH_SEAT_LIMITS[sequence] ?? null,
            holders: withHolders.value ? (entry?.holders?.[sequence] ?? []) : null,
          };
        });
        return {
          id: pathway.id,
          name: module.pathwayName(pathway.id, language),
          walkers: walkers.value.get(pathway.id) ?? null,
          seats,
          held: seats.reduce((n, seat) => n + (seat.limit ? Math.min(seat.count ?? 0, seat.limit) : 0), 0),
          total: seats.reduce((n, seat) => n + (seat.limit ?? 0), 0),
        };
      });
});

/** Boons hold no seats; they show only when the census counts their walkers. */
const boonRows = computed(() => {
  const module = data.value;
  if (!module) return [];
  return [...module.boonPathwayIds]
      .map(id => ({id, name: module.pathwayName(id, currentLanguage.value), walkers: walkers.value.get(id) ?? 0}))
      .filter(boon => boon.walkers > 0)
      .sort((a, b) => b.walkers - a.walkers);
});

const maxWalkers = computed(() => Math.max(1, ...rows.value.map(row => row.walkers ?? 0)));
const empty = computed(() => (stats.value?.totalBeyonders ?? 0) === 0);

type SortMode = 'held' | 'open' | 'walkers' | 'az';
const sortMode = ref<SortMode>('held');
const sortTabs = computed(() => [
  {id: 'held', label: ui.value.sort.held},
  {id: 'open', label: ui.value.sort.open},
  {id: 'walkers', label: ui.value.sort.walkers},
  {id: 'az', label: ui.value.sort.az},
]);

const sortedRows = computed(() => {
  const byName = (a: PathwayRow, b: PathwayRow) => a.name.localeCompare(b.name, currentLanguage.value);
  const sorted = [...rows.value];
  switch (sortMode.value) {
    case 'held':
      return sorted.sort((a, b) => b.held - a.held || byName(a, b));
    case 'open':
      return sorted.sort((a, b) => a.held - b.held || byName(a, b));
    case 'walkers':
      return sorted.sort((a, b) => (b.walkers ?? -1) - (a.walkers ?? -1) || byName(a, b));
    default:
      return sorted.sort(byName);
  }
});

const seatRungs = computed(() => rows.value[0]?.seats ?? []);

/** Server-wide, Sequence 4 up to the throne: the cap per Pathway and how many sit each rung. */
const rungs = computed<RungSummary[]>(() => {
  const module = data.value;
  if (!module) return [];
  const language = currentLanguage.value;
  const four = stats.value?.sequenceDistribution.find(entry => entry.sequence === '4');
  // without the census the caps still stand; only the counts go
  return [
    {sequence: 4, rank: module.sequenceRank(4, language), limit: null, count: four?.count ?? null, total: 0},
    ...SEAT_SEQUENCES.filter(sequence => sequence < 4).map(sequence => {
      const limit = module.HIGH_SEAT_LIMITS[sequence];
      return {
        sequence,
        rank: module.sequenceRank(sequence, language),
        limit,
        count: stats.value ? rows.value.reduce((n, row) => n + (row.seats.find(seat => seat.sequence === sequence)?.count ?? 0), 0) : null,
        total: limit * rows.value.length,
      };
    }),
  ];
});

const updatedAt = computed(() => fetchedAt.value
    ? new Intl.DateTimeFormat(intlLocale.value, {hour: '2-digit', minute: '2-digit'}).format(new Date(fetchedAt.value))
    : '');

/** Where the numbers come from, and what they can't promise (joined here: templates drop the spaces). */
const note = computed(() => [
  ui.value.recordsNote,
  walkersPartial.value ? ui.value.walkersNote : '',
  updatedAt.value ? ui.value.updated.replace('{time}', updatedAt.value) : '',
].filter(Boolean).join(' '));

useSeo(() => ({
  title: 'High Sequence seats - who holds Sequences 3 to 0',
  description: 'Every Pathway on Mysterria seats at most 18 Saints, 9 Angels, 3 Archangels and one Deity at a time. See how full each Pathway is and how many players walk it. A new Epoch empties every seat.',
  path: '/ascension',
  imageAlt: 'Mysterria High Sequence seats',
  jsonLd: [breadcrumbLd([
    {name: 'Home', path: '/'},
    {name: 'Pathways', path: '/pathways'},
    {name: 'High Sequence seats', path: '/ascension'},
  ])],
}));
</script>

<style scoped>
.asc-section {
  display: grid;
  gap: var(--arc-group-gap);
}

.asc-section__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px 32px;
}

.asc-section__head :deep(.arc-tabs) {
  border-bottom: 0;
}

/*
 * The seats table: hairline rows sharing one set of tracks with the head row.
 * Pathway | Beyonders | Demigod | Saint | Angel | Archangel | Deity (| Holders)
 */
.asc-table {
  --asc-col-gap: clamp(16px, 2vw, 28px);
  --asc-cols: minmax(0, 1.3fr) minmax(0, 5fr);
  --asc-stat-cols: minmax(0, 1.2fr) repeat(5, minmax(0, 1fr));
}

.asc-table.has-holders {
  --asc-cols: minmax(0, 1.3fr) minmax(0, 5fr) 7.5rem;
}

.asc-table__head {
  display: grid;
  grid-template-columns: var(--asc-cols);
  gap: 0 var(--asc-col-gap);
  padding: 0 0 10px;
  color: var(--arc-muted);
  font-size: var(--arc-fs-caption);
  font-weight: 600;
}

.asc-table__stats {
  display: grid;
  grid-template-columns: var(--asc-stat-cols);
  gap: 0 var(--asc-col-gap);
}

.asc-table__head b {
  margin-right: 2px;
}

.asc-table__head .is-top {
  color: var(--acc-ink);
}

.asc-table__rows {
  margin: 0;
  padding: 0;
  list-style: none;
  border-bottom: var(--arc-bw) solid var(--arc-line);
}

.asc-boons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--arc-fs-small);
}

.asc-boons__note {
  flex-basis: 100%;
  color: var(--arc-muted);
}

.asc-boons li:not(.asc-boons__note) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
}

.asc-boons__count {
  color: var(--arc-muted);
  font-variant-numeric: tabular-nums;
}

.asc-note {
  max-width: var(--arc-measure);
  margin: 0;
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  line-height: 1.6;
}

@media (max-width: 900px) {
  .asc-table__head {
    display: none;
  }
}
</style>
