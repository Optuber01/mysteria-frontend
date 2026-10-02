<template>
  <section id="pathways" class="codex" aria-labelledby="pv-codex-title">
    <header class="codex-head">
      <div>
        <p class="fog-label">{{ t('home.pathwayVariants.codex.kicker') }}</p>
        <h2 id="pv-codex-title">{{ t('home.pathwayVariants.codex.titleLead') }} <em>{{ t('home.pathwayVariants.codex.titleAccent') }}</em></h2>
      </div>
      <div class="codex-head__aside">
        <p>{{ countCopy('home.pathwayVariants.codex.intro') }}</p>
        <KindTabs
          :label="t('home.orbit.tabsLabel')"
          :active="activeKind"
          panel-id="pv-codex-panel"
          :options="kindOptions"
          :tab-id="tabId"
          @choose="chooseKind"
          @keydown="onTabKeydown"
        />
      </div>
    </header>

    <div id="pv-codex-panel" class="codex-spread" role="tabpanel" :aria-labelledby="tabId(activeKind)">
      <span class="codex-spread__ribbon" aria-hidden="true"></span>
      <!-- Phones read one page at a time; the turner opens the other. -->
      <div class="codex-turner">
        <button
          v-for="(page, pageIndex) in pages"
          :key="page.from"
          type="button"
          :aria-pressed="pageIndex === openPage"
          @click="turnTo(pageIndex)"
        >
          {{ folioLabel(page.from, page.to) }}
        </button>
      </div>
      <div
        ref="listRef"
        class="codex-spread__pages"
        role="radiogroup"
        :aria-label="t(`home.pathwayVariants.codex.listLabel.${activeKind}`)"
        @keydown="onListKeydown"
      >
        <div v-for="(page, pageIndex) in pages" :key="page.from" class="codex-page" :class="{ 'is-away': pageIndex !== openPage }">
          <div class="codex-page__columns" aria-hidden="true">
            <span>{{ t('home.pathwayVariants.codex.columns.number') }}</span>
            <span></span>
            <span>{{ t('home.pathwayVariants.codex.columns.pathway') }}</span>
            <span class="codex-page__folio">{{ folioLabel(page.from, page.to) }}</span>
          </div>

          <div
            v-for="index in page.indexes"
            :key="activeCatalog[index].id"
            class="entry"
            :class="{ 'is-open': index === selectedIndex }"
          >
            <button
              type="button"
              role="radio"
              class="entry__row"
              :data-index="index"
              :tabindex="index === selectedIndex ? 0 : -1"
              :aria-checked="index === selectedIndex"
              :aria-label="entryLabel(activeCatalog[index], index)"
              :aria-describedby="`pv-codex-tag-${activeCatalog[index].id}`"
              @click="onRowClick(index, $event)"
            >
              <span class="entry__numeral" aria-hidden="true">{{ numeral(index) }}</span>
              <span class="entry__seal" aria-hidden="true">
                <img :src="activeCatalog[index].thumbnail" alt="" width="128" height="128" loading="lazy" decoding="async" @error="replaceBrokenImage">
              </span>
              <span class="entry__main">
                <span class="entry__line">
                  <span class="entry__name">{{ nameOf(activeCatalog[index]) }}</span>
                  <span class="entry__seq">{{ firstSequenceName(activeCatalog[index]) }}</span>
                </span>
                <span :id="`pv-codex-tag-${activeCatalog[index].id}`" class="entry__tagline">{{ taglineOf(activeCatalog[index]) }}</span>
              </span>
              <span class="entry__mark" aria-hidden="true"></span>
            </button>

            <div v-if="index === selectedIndex" class="entry__folio">
              <span class="entry__plate" aria-hidden="true">
                <img :src="activeCatalog[index].image" alt="" width="256" height="256" decoding="async" @error="replaceBrokenImage">
              </span>
              <dl>
                <div>
                  <dt>{{ t('home.orbit.earlyAbilities') }}</dt>
                  <dd><ul><li v-for="ability in abilitiesOf(activeCatalog[index])" :key="ability">{{ ability }}</li></ul></dd>
                </div>
                <div>
                  <dt>{{ t('home.orbit.archive') }}</dt>
                  <dd>
                    <span class="entry__counts">{{ archiveCounts(activeCatalog[index]) }}</span>
                    <RouterLink class="fog-button" :to="$lp(activeCatalog[index].route)" :aria-label="archiveLabel(activeCatalog[index])">
                      {{ t('home.orbit.openArchive') }}<span aria-hidden="true">↗</span>
                    </RouterLink>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
      <span class="visually-hidden" aria-live="polite">{{ announcement }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import type { HomePathway, ProgressionKind } from '@/data/homePathways';
import KindTabs from './KindTabs.vue';
import { replaceBrokenImage, usePathwayDeck } from './usePathwayDeck';

const emit = defineEmits<{ selected: [pathway: HomePathway] }>();
const {
  t, activeKind, selectedIndex, announcement, activeCatalog, kindOptions,
  nameOf, abilitiesOf, countCopy, archiveCounts, firstSequenceName, taglineOf,
  numeral, entryLabel, archiveLabel, select, setKind, tabId, onTabKeydown, radioTarget,
} = usePathwayDeck((entry) => emit('selected', entry), 'pv-codex');

const listRef = ref<HTMLElement | null>(null);

/* An open book: the first half of the index on the left page, the rest on the right. */
const pages = computed(() => {
  const length = activeCatalog.value.length;
  const split = Math.ceil(length / 2);
  const range = (from: number, to: number) => Array.from({ length: to - from }, (_, offset) => from + offset);
  return [
    { from: 0, to: split - 1, indexes: range(0, split) },
    { from: split, to: length - 1, indexes: range(split, length) },
  ];
});

/** The page holding the open entry. */
const openPage = computed(() => selectedIndex.value < pages.value[1].from ? 0 : 1);

function turnTo(pageIndex: number) {
  if (pageIndex !== openPage.value) select(pages.value[pageIndex].from, { announce: true });
}

const folioLabel = (from: number, to: number) => t('home.pathwayVariants.codex.folio').replace('{from}', numeral(from)).replace('{to}', numeral(to));

const rowAt = (index: number) => listRef.value?.querySelector<HTMLElement>(`[data-index="${index}"]`) ?? null;

/**
 * Opening an entry closes the one above it on the same page, which would pull
 * the row out from under the pointer. Hold the chosen row where it was.
 */
async function openEntry(index: number, focus: boolean) {
  const before = rowAt(index)?.getBoundingClientRect().top;
  if (!select(index)) return;
  await nextTick();
  const row = rowAt(index);
  if (!row) return;
  if (before !== undefined) {
    const drift = row.getBoundingClientRect().top - before;
    if (Math.abs(drift) > 1) window.scrollBy({ top: drift, behavior: 'instant' as ScrollBehavior });
  }
  if (focus) row.focus({ preventScroll: true });
}

function onRowClick(index: number, event: MouseEvent) {
  void openEntry(index, event.detail === 0);
}

function onListKeydown(event: KeyboardEvent) {
  if (!(event.target as HTMLElement).matches('.entry__row')) return;
  const index = radioTarget(event);
  if (index === null) return;
  void openEntry(index, true);
}

function chooseKind(kind: ProgressionKind) {
  setKind(kind);
}
</script>

<style scoped>
.codex {
  position: relative;
  padding: clamp(64px, 8vh, 88px) 0 clamp(56px, 7vh, 80px);
  color: var(--bone);
  background:
    radial-gradient(ellipse 60% 40% at 50% 0%, rgba(30, 34, 43, .55), transparent 70%),
    var(--fog-0);
}

/* ---- Heading ---- */
.codex-head {
  width: min(100% - var(--home-content-gutter, 20px) * 2, 1280px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  align-items: end;
  gap: 24px 64px;
}

.codex-head h2 {
  margin: 18px 0 0;
  font: 800 clamp(36px, 4.6vw, 66px)/.94 var(--font-display);
  text-transform: uppercase;
  text-wrap: balance;
}

.codex-head h2 em { display: block; color: var(--crimson-text); font-style: normal; }

.codex-head__aside > p { max-width: 470px; margin: 0 0 20px; color: var(--ash); line-height: 1.6; }

/* ---- The open book ---- */
.codex-spread {
  position: relative;
  width: min(100% - var(--home-content-gutter, 20px) * 2, 1280px);
  margin: clamp(28px, 4vh, 44px) auto 0;
  border-top: 1px solid var(--line-strong);
}

/* The crimson bookmark hanging from the spine. */
.codex-spread__ribbon {
  position: absolute;
  z-index: 2;
  top: -1px;
  left: calc(50% - 5px);
  width: 10px;
  height: 64px;
  background: var(--crimson);
  clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 84%, 0 100%);
  pointer-events: none;
}

.codex-spread__pages {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: start;
  column-gap: 64px;
}

/* The spine between the pages. */
.codex-spread__pages::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  background: linear-gradient(180deg, var(--line-strong), var(--line) 70%, transparent);
  pointer-events: none;
}

.codex-page { min-width: 0; }

.codex-page__columns {
  display: grid;
  grid-template-columns: 52px 44px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  height: 40px;
  padding: 0 12px;
  border-bottom: 1px solid var(--line);
  color: var(--ash-dim);
  font: 500 .68rem/1 var(--font-mono);
  letter-spacing: .14em;
  text-transform: uppercase;
}

.codex-page__columns span:first-child { text-align: right; }
.codex-page__folio { color: var(--ash); }

/* ---- An entry ---- */
.entry { position: relative; border-bottom: 1px solid var(--line); }

.entry__row {
  width: 100%;
  min-height: 56px;
  display: grid;
  grid-template-columns: 52px 44px minmax(0, 1fr) 24px;
  align-items: center;
  gap: 14px;
  padding: 6px 12px;
  border: 0;
  color: inherit;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background-color .2s ease;
}

/* A crimson rule in the margin marks the open entry; hover shows a pale one. */
.entry__row::before {
  content: "";
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 2px;
  background: var(--ash-dim);
  opacity: 0;
  transform: scaleY(.4);
  transition: opacity .2s ease, transform .3s var(--ease-out);
}

.entry__row:hover { background: var(--fog-veil); }
.entry__row:hover::before { opacity: .7; transform: none; }
.entry__row:focus-visible { outline: 2px solid var(--crimson-text); outline-offset: -2px; }

.entry__numeral {
  color: var(--ash-dim);
  font: 800 1.35rem/1 var(--font-display);
  letter-spacing: .04em;
  text-align: right;
  font-variant-numeric: lining-nums;
}

.entry__seal {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(169, 198, 214, .08), transparent 70%);
}

.entry__seal img {
  width: 90%;
  height: 90%;
  object-fit: contain;
  filter: grayscale(.85) brightness(.72);
  transition: filter .25s ease;
}

.entry__row:hover .entry__seal img { filter: none; }

.entry__main { min-width: 0; display: grid; gap: 3px; }

.entry__line { display: flex; align-items: baseline; gap: 12px; min-width: 0; }

.entry__name {
  flex: none;
  font: 800 1.55rem/1 var(--font-display);
  letter-spacing: .01em;
  text-transform: uppercase;
}

.entry__seq {
  min-width: 0;
  overflow: hidden;
  color: var(--ash);
  font: 500 .7rem/1 var(--font-mono);
  letter-spacing: .12em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.entry__tagline {
  overflow: hidden;
  color: var(--ash-dim);
  font-size: .84rem;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* A plus that turns into a minus. */
.entry__mark {
  position: relative;
  width: 14px;
  height: 14px;
  justify-self: end;
}
.entry__mark::before,
.entry__mark::after {
  content: "";
  position: absolute;
  top: 6.5px;
  left: 0;
  width: 14px;
  height: 1px;
  background: var(--ash);
  transition: transform .3s var(--ease-out), background-color .2s ease;
}
.entry__mark::after { transform: rotate(90deg); }

/* ---- The open entry ---- */
.entry.is-open { background: linear-gradient(90deg, var(--crimson-tint), rgba(179, 32, 43, 0) 70%); }
.entry.is-open .entry__row::before { background: var(--crimson); opacity: 1; transform: none; top: 0; bottom: 0; width: 3px; }
.entry.is-open .entry__numeral { color: var(--crimson-text); }
.entry.is-open .entry__seal { border-color: rgba(169, 198, 214, .5); }
.entry.is-open .entry__seal img { filter: none; }
.entry.is-open .entry__tagline { color: var(--bone); white-space: normal; }
.entry.is-open .entry__mark::before { background: var(--crimson-text); }
.entry.is-open .entry__mark::after { transform: rotate(0deg); background: var(--crimson-text); }

.entry__folio {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  align-items: start;
  gap: 24px;
  padding: 0 12px 20px 78px;
  animation: folio-in .45s var(--ease-out);
}

@keyframes folio-in { from { opacity: 0; transform: translateY(-6px); } }

.entry__plate {
  width: 112px;
  height: 112px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(169, 198, 214, .14), rgba(7, 8, 11, .9) 66%);
  box-shadow: 0 0 0 1px rgba(169, 198, 214, .35), 0 0 40px rgba(169, 198, 214, .08);
}

.entry__plate img { width: 86%; height: 86%; object-fit: contain; }

.entry__folio dl {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px 24px;
  margin: 6px 0 0;
}

.entry__folio dt {
  margin-bottom: 9px;
  color: var(--ash);
  font: 500 .68rem/1 var(--font-mono);
  letter-spacing: .14em;
  text-transform: uppercase;
}

.entry__folio dd { margin: 0; display: grid; justify-items: start; gap: 14px; }
.entry__folio ul { display: grid; gap: 5px; margin: 0; padding: 0; list-style: none; }
.entry__folio li { display: flex; align-items: baseline; gap: 8px; font-size: .9rem; font-weight: 600; line-height: 1.35; }
.entry__folio li::before { content: ""; flex: none; width: 8px; height: 1px; transform: translateY(-4px); background: var(--crimson-text); }
.entry__counts { color: var(--spirit); font-size: .88rem; font-weight: 600; line-height: 1.4; }

.entry__folio .fog-button {
  min-height: 44px;
  padding: 0 18px;
  font-size: .88rem;
  text-decoration: none;
  white-space: nowrap;
}
.entry__folio .fog-button:focus-visible { outline: 2px solid var(--crimson-text); outline-offset: 3px; }

.codex-turner { display: none; }

/* ---- Narrower spreads: the tagline only shows on the open entry ---- */
@media (max-width: 1100px) {
  .codex-spread__pages { column-gap: 40px; }
  .entry__row { grid-template-columns: 34px 40px minmax(0, 1fr) 16px; gap: 12px; min-height: 54px; padding-inline: 8px; }
  .codex-page__columns { grid-template-columns: 34px 40px minmax(0, 1fr) auto; gap: 12px; padding-inline: 8px; }
  .entry__seal { width: 40px; height: 40px; }
  .entry__line { flex-wrap: wrap; row-gap: 3px; }
  .entry__tagline { display: none; }
  .entry.is-open .entry__tagline { display: block; }
  .entry__folio { grid-template-columns: 72px minmax(0, 1fr); gap: 16px; padding: 0 8px 18px 54px; }
  .entry__plate { width: 72px; height: 72px; }
  .entry__folio dl { gap: 12px 16px; }
}

/* ---- Phones: one page at a time ---- */
@media (max-width: 760px) {
  .codex-head { grid-template-columns: 1fr; gap: 18px; }
  .codex-spread { border-top: 0; }
  .codex-spread__pages { grid-template-columns: 1fr; }
  .codex-spread__pages::before,
  .codex-spread__ribbon { display: none; }
  .codex-page.is-away { display: none; }
  .codex-page__folio { visibility: hidden; }
  .entry__row { min-height: 52px; }
  .entry__name { font-size: 1.4rem; }
  .entry__folio dl { grid-template-columns: 1fr; }

  .codex-turner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    margin-bottom: 10px;
  }
  .codex-turner button {
    min-height: 44px;
    border: 1px solid var(--line);
    border-radius: 8px;
    color: var(--ash);
    background: transparent;
    cursor: pointer;
    font: 500 .72rem/1 var(--font-mono);
    letter-spacing: .14em;
    text-transform: uppercase;
  }
  .codex-turner button[aria-pressed="true"] { border-color: var(--crimson); color: var(--bone); background: var(--crimson-tint); }
  .codex-turner button:focus-visible { outline: 2px solid var(--crimson-text); outline-offset: 2px; }
}

@media (prefers-reduced-motion: reduce) {
  .entry__folio { animation: none; }
  .entry__row,
  .entry__row::before,
  .entry__seal img,
  .entry__mark::before,
  .entry__mark::after { transition: none; }
}
</style>
