<template>
  <div class="pw-list">
    <div class="pw-list__bar">
      <ArcTabs
          v-if="!query"
          v-model="kind"
          class="pw-list__tabs"
          :tabs="tabs"
          :label="ui.tabsLabel"
          controls="pw-grid"
      />
      <!-- holds the tabs' place while searching, so the field doesn't jump -->
      <div v-else class="pw-list__tabs" aria-hidden="true"></div>
      <div class="pw-search">
        <label class="arc-sr" for="pw-search">{{ ui.searchLabel }}</label>
        <i class="fa-solid fa-magnifying-glass pw-search__icon" aria-hidden="true"></i>
        <input
            id="pw-search"
            v-model="rawQuery"
            class="arc-field pw-search__field"
            type="search"
            autocomplete="off"
            :placeholder="ui.searchPlaceholder"
        >
        <button v-if="rawQuery" type="button" class="pw-search__clear" :aria-label="ui.clearSearch" @click="rawQuery = ''">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </div>
    </div>

    <!-- browsing, a tab, or searching: the old view fades as the new one comes up over it -->
    <ArcSwap>
      <!-- browsing: one tab of tiles -->
      <ArcSwap v-if="!query" id="pw-grid" role="tabpanel" :aria-label="kind === 'boon' ? ui.tabBoons : ui.tabCore">
        <div :key="kind">
          <p v-if="kind === 'boon'" class="pw-list__note arc-muted">{{ ui.boonsNote }}</p>
          <ul class="pw-grid">
            <li v-for="item in shown" :key="item.card.id">
              <PathwayTile v-bind="item"/>
            </li>
          </ul>
        </div>
      </ArcSwap>

      <!-- searching: matching Pathways, then matching abilities; each list eases as the words change -->
      <div v-else class="pw-results" aria-live="polite">
        <!-- a kind of result coming or going changes the layout: that eases as one swap -->
        <ArcSwap>
          <div :key="resultShape" class="pw-results__body">
            <p v-if="!pathwayHits.length && !abilityHits.length" class="pw-results__none">{{ fill(ui.noResults, {query}) }}</p>
            <section v-if="pathwayHits.length" aria-labelledby="pw-hits-pathways">
              <h2 id="pw-hits-pathways" class="arc-h4 pw-results__head">
                {{ ui.resultsPathways }} <span class="arc-muted">{{ pathwayHits.length }}</span>
              </h2>
              <ArcList class="pw-grid">
                <li v-for="item in pathwayHits" :key="item.card.id">
                  <PathwayTile v-bind="item"/>
                </li>
              </ArcList>
            </section>
            <section v-if="abilityHits.length" aria-labelledby="pw-hits-abilities">
              <h2 id="pw-hits-abilities" class="arc-h4 pw-results__head">
                {{ ui.resultsAbilities }} <span class="arc-muted">{{ abilityHits.length }}</span>
              </h2>
              <ArcList class="arc-rows pw-hits">
                <li v-for="hit in abilityHits.slice(0, LIMIT)" :key="hit.key" class="arc-row">
                  <RouterLink :to="$lp(`/pathways/${hit.pathwayId}#seq-${hit.sequence}`)" class="pw-hit">
                    <span class="pw-hit__name">{{ hit.name }}</span>
                    <span class="pw-hit__where arc-muted">{{ hit.pathwayName }} · {{ fill(ui.sequence, {n: hit.sequence}) }}</span>
                    <span class="pw-hit__text arc-muted">{{ hit.description }}</span>
                  </RouterLink>
                </li>
              </ArcList>
              <p v-if="abilityHits.length > LIMIT" class="pw-results__more arc-muted">
                {{ fill(ui.moreResults, {shown: LIMIT, total: abilityHits.length}) }}
              </p>
            </section>
          </div>
        </ArcSwap>
      </div>
    </ArcSwap>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import ArcList from '@/components/arcana/ArcList.vue';
import ArcSwap from '@/components/arcana/ArcSwap.vue';
import ArcTabs from '@/components/arcana/ArcTabs.vue';
import {BOON_CARDS, CORE_CARDS, type ArcanaCard, type PathwaysModule} from '@/components/home-arcana/arcana-data';
import {useI18n} from '@/composables/useI18n';
import type {Translations} from '@/locales';
import PathwayTile from './PathwayTile.vue';
import {abilityCount, climbOf, fill, ORDERED_CARDS, tidy} from './pathwayText';

const props = defineProps<{data: PathwaysModule}>();
const {currentLanguage, plural, tree} = useI18n();
const ui = computed(() => tree<Translations['pathwaysPage']>('pathwaysPage'));

const LIMIT = 40;
const kind = ref<'core' | 'boon'>('core');
const rawQuery = ref('');
const query = computed(() => rawQuery.value.trim());

const tabs = computed(() => [
  {id: 'core', label: ui.value.tabCore, count: CORE_CARDS.length},
  {id: 'boon', label: ui.value.tabBoons, count: BOON_CARDS.length},
]);

/* everything a tile shows, in the reader's language */
function tileOf(card: ArcanaCard) {
  const language = currentLanguage.value;
  const climb = climbOf(props.data, card, language);
  const name = props.data.pathwayName(card.id, language);
  const first = climb[0]?.name ?? '';
  const count = abilityCount(props.data, card.id);
  return {
    card,
    name,
    // Chinese already names a Pathway after its Sequence 9, so the line would repeat the title
    start: first && first !== name ? fill(ui.value.seq9, {name: first}) : '',
    meta: `${fill(ui.value.range, {top: climb.at(-1)?.sequence ?? 0})} · ${fill(plural(count, ui.value.abilities), {count})}`,
  };
}

const tiles = computed(() => ORDERED_CARDS.map(tileOf));
const shown = computed(() => tiles.value.filter(tile => tile.card.boon === (kind.value === 'boon')));

/* search: Pathway and Sequence names find tiles; ability names and text find abilities */
const index = computed(() => {
  const language = currentLanguage.value;
  const entries: Array<{key: string; pathwayId: string; pathwayName: string; sequence: number; name: string; description: string; nameLc: string; textLc: string}> = [];
  for (const card of ORDERED_CARDS) {
    const pathway = props.data.pathwayById(card.id);
    const pathwayName = props.data.pathwayName(card.id, language);
    for (const sequence of pathway?.sequences ?? []) {
      for (const ability of sequence.abilities) {
        const name = tidy(props.data.pick(ability.name, language));
        const description = tidy(props.data.pick(ability.description, language));
        entries.push({
          key: `${card.id}:${sequence.sequence}:${ability.id}`,
          pathwayId: card.id,
          pathwayName,
          sequence: sequence.sequence,
          name,
          description,
          // English names match in every language: players trade them in chat
          nameLc: `${name} ${ability.name.en}`.toLocaleLowerCase(),
          textLc: description.toLocaleLowerCase(),
        });
      }
    }
  }
  return entries;
});

const needle = computed(() => query.value.toLocaleLowerCase());

const pathwayHits = computed(() => {
  if (!needle.value) return [];
  const language = currentLanguage.value;
  return tiles.value.filter(tile =>
    `${tile.name} ${tile.card.en}`.toLocaleLowerCase().includes(needle.value)
    || climbOf(props.data, tile.card, language).some(rung => rung.name.toLocaleLowerCase().includes(needle.value)));
});

const abilityHits = computed(() => {
  if (!needle.value) return [];
  const byName = index.value.filter(entry => entry.nameLc.includes(needle.value));
  const byText = index.value.filter(entry => !entry.nameLc.includes(needle.value) && entry.textLc.includes(needle.value));
  return [...byName, ...byText];
});

/** Which kinds of result there are: a change here re-lays the results out. */
const resultShape = computed(() => `${pathwayHits.value.length > 0}-${abilityHits.value.length > 0}`);
</script>

<style scoped>
.pw-list {
  display: grid;
  gap: var(--arc-group-gap);
}

.pw-list__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px 32px;
}

.pw-list__tabs {
  flex: 1 1 auto;
}

.pw-search {
  position: relative;
  flex: 0 1 360px;
  min-width: min(100%, 260px);
}

.pw-search__field {
  min-height: 48px;
  padding-left: 42px;
  padding-right: 44px;
}

/* the field's own clear control duplicates ours */
.pw-search__field::-webkit-search-cancel-button {
  display: none;
}

.pw-search__icon {
  position: absolute;
  top: 50%;
  left: 15px;
  color: var(--arc-muted);
  font-size: 14px;
  transform: translateY(-50%);
  pointer-events: none;
}

.pw-search__clear {
  position: absolute;
  top: 50%;
  right: 6px;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: var(--arc-r-sm);
  background: none;
  color: var(--arc-muted);
  cursor: pointer;
  transform: translateY(-50%);
}

.pw-search__clear:hover {
  color: var(--arc-ink);
  background: var(--arc-glass);
}

.pw-list__note {
  max-width: var(--arc-measure);
  margin: 0 0 var(--arc-group-gap);
  line-height: 1.6;
}

.pw-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 264px), 1fr));
  gap: var(--arc-grid-gap);
  margin: 0;
  padding: 0;
  list-style: none;
}

.pw-grid > li {
  display: grid;
  min-width: 0;
}

.pw-results__body {
  display: grid;
  gap: var(--arc-head-gap);
}

.pw-results__head {
  margin-bottom: 16px;
}

.pw-results__head span {
  font-size: var(--arc-fs-small);
  font-variant-numeric: tabular-nums;
}

.pw-results__none,
.pw-results__more {
  margin: 0;
}

.pw-results__more {
  margin-top: 16px;
  font-size: var(--arc-fs-small);
}

.pw-hits {
  max-width: 880px;
}

.pw-hits .arc-row {
  padding: 0;
}

.pw-hit {
  display: grid;
  gap: 4px;
  width: 100%;
  min-width: 0;
  padding: 14px 12px;
  margin-inline: -12px;
  border-radius: var(--arc-r-md);
  color: inherit;
  text-decoration: none;
  transition: background-color .2s ease;
}

.pw-hit:hover {
  background: var(--arc-glass);
}

.pw-hit:hover .pw-hit__name {
  color: var(--acc-ink);
}

.pw-hit__name {
  font-weight: 600;
  overflow-wrap: anywhere;
}

.pw-hit__where {
  font-size: var(--arc-fs-caption);
  font-weight: 600;
}

.pw-hit__text {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--arc-fs-small);
  line-height: 1.55;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

@media (max-width: 640px) {
  .pw-search {
    flex-basis: 100%;
  }

  .pw-list__tabs:empty {
    display: none;
  }
}
</style>
