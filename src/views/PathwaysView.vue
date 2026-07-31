<template>
  <div class="pathways-page">
    <HeaderItem/>
    <main id="main-content" tabindex="-1">
      <header class="archive-hero">
        <span class="eyebrow">{{ ui.archive }}</span>
        <h1>{{ ui.title }}</h1>
        <p>{{ ui.subtitle }}</p>
        <div class="archive-stats"><span><b>{{ pathways.length }}</b> {{
            ui.pathways
          }}</span><i/><span><b>{{ totalSequences }}</b> {{ ui.sequences }}</span><i/><span><b>{{ totalAbilities }}</b> {{
            ui.abilities
          }}</span></div>
        <div class="archive-freshness"><span
            class="freshness-dot"/>{{ currentLanguage === 'uk' ? 'Оновлено' : 'Last updated' }} {{
            formattedLastUpdated
          }} <i>·</i> {{
            currentLanguage === 'uk' ? 'Дані можуть дещо відрізнятися від поточної версії гри' : 'Details may differ slightly from the current game version'
          }}
        </div>
      </header>
      <section class="archive-layout">
        <aside class="pathway-browser pathway-browser--desktop">
          <label class="search-label"
                  for="pathway-search-desktop">{{ ui.searchArchive }}</label>
          <label class="search-box">
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7"/>
              <path d="m20 20-4-4"/>
            </svg>
            <input id="pathway-search-desktop" v-model="query" :placeholder="ui.search" autocomplete="off" type="search">
            <button v-if="query" :aria-label="currentLanguage === 'uk' ? 'Очистити пошук' : 'Clear search'"
                    @click="query=''">×
            </button>
            <kbd v-else>⌕</kbd></label>
          <nav class="pathway-list" :aria-label="ui.allPathways">
            <template v-for="group in pathwayGroups" :key="group.id">
              <div v-if="group.pathways.length" class="browser-heading"><span>{{
                  group.label
                }}</span><b>{{ group.pathways.length }}</b></div>
              <button v-for="pathway in group.pathways" :key="pathway.id" :aria-current="pathway.id === selected.id ? 'true' : undefined" :class="{active:pathway.id===selected.id}" type="button"
                       @click="selectPathway(pathway.id)">
                <span class="sigil"><img v-if="imageFor(pathway.id)" :src="imageFor(pathway.id)" alt=""><b
                    v-else>{{ pathway.id[0].toUpperCase() }}</b></span>
                <span><strong>{{ pathwayName(pathway.id) }}</strong><small>{{
                    pathway.sequences.length
                  }} {{ ui.sequences }}</small></span><span class="chevron">›</span>
              </button>
            </template>
          </nav>
          <p v-if="!filteredPathways.length" class="empty">{{ ui.noResults }}</p>
        </aside>
        <article class="pathway-detail">
          <div class="mobile-archive-search">
            <label class="search-label" for="pathway-search-mobile">{{ ui.searchArchive }}</label>
            <label class="search-box">
              <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
              <input id="pathway-search-mobile" v-model="query" :placeholder="ui.search" autocomplete="off" type="search">
              <button v-if="query" :aria-label="ui.clearSearch" type="button" @click="query = ''">×</button>
            </label>
          </div>
          <div class="pathway-controls">
            <header class="pathway-header">
              <div class="large-sigil"><img v-if="imageFor(selected.id)" :src="imageFor(selected.id)" alt=""><b v-else>{{
                  selected.id[0].toUpperCase()
                }}</b></div>
              <div class="pathway-heading-copy"><span>{{ ui.pathway }}</span>
                <h2>{{ pathwayName(selected.id) }}</h2>
                <p>{{ selectedProgression }}</p></div>
              <button
                  ref="pathwayPickerTrigger"
                  :aria-expanded="isPathwayPickerOpen"
                  aria-controls="pathway-picker-dialog"
                  aria-haspopup="dialog"
                  class="pathway-picker-trigger"
                  type="button"
                  @click="openPathwayPicker"
              >{{ ui.changePathway }} <span aria-hidden="true">⌄</span></button>
            </header>
            <div class="sequence-rail-label"><span>{{ ui.sequences }}</span><span>{{ ui.sequenceHint }}</span></div>
            <div class="sequence-jump">
              <button v-for="sequence in visibleSequences" :key="sequence.sequence" :aria-pressed="activeSequence === sequence.sequence" type="button"
                      :class="[sequenceClass(sequence.sequence),{current:activeSequence===sequence.sequence}]"
                      @click="scrollToSequence(sequence.sequence)"><small>{{
                  sequenceRank(sequence.sequence) || ui.seq
                }}</small><b>{{ sequence.sequence }}</b></button>
            </div>
          </div>
          <div v-if="visibleSequences.length" class="sequence-list">
            <section v-for="sequence in visibleSequences" :id="`sequence-${sequence.sequence}`" :key="sequence.sequence"
                     :class="['sequence-card',{current:activeSequence===sequence.sequence}]">
              <div class="sequence-number" :class="sequenceClass(sequence.sequence)">
                <small>{{ sequenceRank(sequence.sequence) || ui.sequence }}</small><b>{{ sequence.sequence }}</b></div>
              <div class="sequence-content">
                <div class="sequence-title">
                  <div><span>{{ ui.designation }}</span>
                    <h3>{{ localized(sequence.name) }}</h3></div>
                  <small>{{ matchingSequenceAbilities(sequence).length }} {{ ui.abilities }}</small></div>
                <div class="abilities-grid">
                  <div v-for="ability in matchingSequenceAbilities(sequence)" :key="ability.id" class="ability"><span
                      class="ability-mark"/>
                    <div><h4>{{ localized(ability.name) }}</h4>
                      <p>{{ localized(ability.description) }}</p></div>
                  </div>
                </div>
              </div>
            </section>
          </div>
          <div v-else class="detail-empty"><span>⌁</span>
            <h3>{{ ui.noAbilities }}</h3>
            <p>{{ ui.trySearch }}</p></div>
        </article>
      </section>
      <dialog
          id="pathway-picker-dialog"
          ref="pathwayPickerDialog"
          aria-labelledby="pathway-picker-title"
          class="pathway-picker-sheet"
          @click.self="closePathwayPicker"
          @close="handlePathwayPickerClosed"
      >
        <div class="picker-sheet-head">
          <div><span class="eyebrow">{{ ui.archive }}</span><h2 id="pathway-picker-title">{{ ui.selectPathway }}</h2></div>
          <button :aria-label="ui.closePathwayPicker" class="picker-sheet-close" type="button" @click="closePathwayPicker">×</button>
        </div>
        <label class="search-label" for="pathway-picker-search">{{ ui.searchPathways }}</label>
        <label class="search-box picker-search">
          <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
          <input id="pathway-picker-search" ref="pathwayPickerSearch" v-model="pickerQuery" :placeholder="ui.searchPathways" autocomplete="off" type="search">
          <button v-if="pickerQuery" :aria-label="ui.clearSearch" type="button" @click="pickerQuery = ''">×</button>
        </label>
        <nav class="pathway-list pathway-picker-list" :aria-label="ui.allPathways">
          <template v-for="group in pickerPathwayGroups" :key="group.id">
            <div v-if="group.pathways.length" class="browser-heading"><span>{{ group.label }}</span><b>{{ group.pathways.length }}</b></div>
            <button
                v-for="pathway in group.pathways"
                :key="pathway.id"
                :aria-current="pathway.id === selected.id ? 'true' : undefined"
                :class="{active: pathway.id === selected.id}"
                type="button"
                @click="selectPathwayFromPicker(pathway.id)"
            >
              <span class="sigil"><img v-if="imageFor(pathway.id)" :src="imageFor(pathway.id)" alt=""><b v-else>{{ pathway.id[0].toUpperCase() }}</b></span>
              <span><strong>{{ pathwayName(pathway.id) }}</strong><small>{{ pathway.sequences.length }} {{ ui.sequences }}</small></span>
              <span aria-hidden="true" class="chevron">›</span>
            </button>
          </template>
        </nav>
        <p v-if="!pickerFilteredPathways.length" class="empty">{{ ui.noResults }}</p>
      </dialog>
    </main>
    <FooterItem/>
  </div>
</template>

<script setup lang="ts">
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import HeaderItem from '@/components/layout/HeaderItem.vue';
import FooterItem from '@/components/layout/FooterItem.vue';
import {useI18n} from '@/composables/useI18n';
import source from '@/assets/sources/pathway-abilities.json';
import {preferredScrollBehavior} from '@/utils/motion';

type Localized = { en: string; uk: string };
type Ability = { id: string; name: Localized; description: Localized };
type Sequence = { sequence: number; name: Localized; abilities: Ability[] };
type Pathway = { id: string; sequences: Sequence[] };
const pathways = source.pathways as Pathway[];
const formattedLastUpdated = computed(() => new Intl.DateTimeFormat(currentLanguage.value === 'uk' ? 'uk-UA' : 'en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC'
}).format(new Date(`${source.lastUpdated}T00:00:00Z`)));
const images = import.meta.glob('/src/assets/images/pathways/*.webp', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>;
const aliases: Record<string, string> = {aeon: 'eternalaeon'};
const names: Record<string, string> = {
  abyss: 'Abyss',
  chained: 'Chained',
  darkness: 'Darkness',
  death: 'Death',
  demoness: 'Demoness',
  door: 'Door',
  emperor: 'Black Emperor',
  error: 'Error',
  fool: 'Fool',
  fortune: 'Wheel of Fortune',
  giant: 'Twilight Giant',
  hanged: 'Hanged Man',
  hermit: 'Hermit',
  justiciar: 'Justiciar',
  moon: 'Moon',
  mother: 'Mother',
  paragon: 'Paragon',
  priest: 'Red Priest',
  sun: 'Sun',
  tower: 'White Tower',
  tyrant: 'Tyrant',
  visionary: 'Visionary',
  aeon: 'Eternal Aeon',
  chaos: 'Chaos',
  chaosmist: 'Chaos Mist',
  condenser: 'Condenser',
  devouring: 'Devouring',
  edict: 'Edict',
  everlasting: 'Everlasting',
  patriarch: 'Patriarch',
  secondlaw: 'Second Law',
  sublunary: 'Sublunary'
};
const ukNames: Record<string, string> = {
  abyss: 'Безодня',
  chained: 'Прикутий',
  darkness: 'Темрява',
  death: 'Смерть',
  demoness: 'Демонеса',
  door: 'Двері',
  emperor: 'Чорний Імператор',
  error: 'Помилка',
  fool: 'Дурень',
  fortune: 'Колесо Фортуни',
  giant: 'Сутінковий Велетень',
  hanged: 'Повішений',
  hermit: 'Відлюдник',
  justiciar: 'Юстиціар',
  moon: 'Місяць',
  mother: 'Мати',
  paragon: 'Парагон',
  priest: 'Червоний Жрець',
  sun: 'Сонце',
  tower: 'Біла Вежа',
  tyrant: 'Тиран',
  visionary: 'Візіонер',
  aeon: 'Вічний Еон',
  chaos: 'Хаос',
  chaosmist: 'Туман Хаосу',
  condenser: 'Конденсатор',
  devouring: 'Поглинання',
  edict: 'Едикт',
  everlasting: 'Вічність',
  patriarch: 'Патріарх',
  secondlaw: 'Другий Закон',
  sublunary: 'Підмісячний'
};
const copy = {
  en: {
    archive: 'BEYONDER ARCHIVE',
    title: 'Pathways & Sequences',
    subtitle: 'Study every route to the divine. Discover each Sequence and the abilities it unlocks before choosing your fate.',
    pathways: 'Pathways',
    sequences: 'Sequences',
    abilities: 'Abilities',
    search: 'Search pathways or abilities…',
    allPathways: 'All pathways',
    pathway: 'Pathway',
    progression: 'Sequence progression',
    seq: 'SEQ',
    sequence: 'Sequence',
    designation: 'Designation',
    noResults: 'Nothing found in the archive.',
    noAbilities: 'No matching abilities',
    trySearch: 'Try another search or clear the field.',
    searchArchive: 'Search the archive',
    clearSearch: 'Clear search',
    changePathway: 'Change',
    selectPathway: 'Choose a Pathway',
    closePathwayPicker: 'Close Pathway picker',
    searchPathways: 'Search Pathways…',
    standardPathways: 'Standard Pathways',
    boons: 'Boons',
    sequenceHint: 'Swipe for later Sequences →'
  },
  uk: {
    archive: 'АРХІВ ПОТОЙБІЧНОГО',
    title: 'Шляхи та Послідовності',
    subtitle: 'Дослідіть кожен шлях до божественного. Дізнайтеся про Послідовності та здібності, перш ніж обрати свою долю.',
    pathways: 'Шляхів',
    sequences: 'Послідовностей',
    abilities: 'Здібностей',
    search: 'Пошук Шляхів або здібностей…',
    allPathways: 'Усі Шляхи',
    pathway: 'Шлях',
    progression: 'Розвиток Послідовності',
    seq: 'ПОСЛ',
    sequence: 'Послідовність',
    designation: 'Назва',
    noResults: 'В архіві нічого не знайдено.',
    noAbilities: 'Здібностей не знайдено',
    trySearch: 'Спробуйте інший запит або очистьте поле.',
    searchArchive: 'Пошук в архіві',
    clearSearch: 'Очистити пошук',
    changePathway: 'Змінити',
    selectPathway: 'Оберіть Шлях',
    closePathwayPicker: 'Закрити вибір Шляху',
    searchPathways: 'Пошук Шляхів…',
    standardPathways: 'Звичайні Шляхи',
    boons: 'Благословення',
    sequenceHint: 'Гортайте наступні Послідовності →'
  }
};
const {currentLanguage} = useI18n(), route = useRoute(), router = useRouter(), query = ref(''),
    activeSequence = ref<number>();
const isPathwayPickerOpen = ref(false);
const pickerQuery = ref('');
const pathwayPickerDialog = ref<HTMLDialogElement | null>(null);
const pathwayPickerTrigger = ref<HTMLButtonElement | null>(null);
const pathwayPickerSearch = ref<HTMLInputElement | null>(null);
let previousBodyOverflow = '';
let previousRootOverflow = '';
const ui = computed(() => copy[currentLanguage.value]);
const routeId = computed(() => typeof route.params.pathway === 'string' && pathways.some(p => p.id === route.params.pathway) ? route.params.pathway : pathways[0].id),
    selectedId = ref(routeId.value);
watch(routeId, id => selectedId.value = id);
const selected = computed(() => pathways.find(p => p.id === selectedId.value) ?? pathways[0]);
const selectedProgression = computed(() => {
  const sequences = selected.value.sequences.map(sequence => sequence.sequence);
  return `${ui.value.progression} · ${Math.max(...sequences)} → ${Math.min(...sequences)}`;
});
const localized = (v: Localized) => v[currentLanguage.value] || v.en;
const titleCase = (id: string) => id.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase());
const pathwayName = (id: string) => currentLanguage.value === 'uk' ? (ukNames[id] || names[id] || titleCase(id)) : (names[id] || titleCase(id));
const imageFor = (id: string) => images[`/src/assets/images/pathways/${aliases[id] || id}.webp`];
const totalSequences = computed(() => pathways.reduce((n, p) => n + p.sequences.length, 0)),
    totalAbilities = computed(() => pathways.reduce((n, p) => n + p.sequences.reduce((m, s) => m + s.abilities.length, 0), 0));
const haystack = (p: Pathway) => [pathwayName(p.id), ...p.sequences.flatMap(s => [localized(s.name), ...s.abilities.flatMap(a => [localized(a.name), localized(a.description)])])].join(' ').toLowerCase();
const filteredPathways = computed(() => {
  const q = query.value.trim().toLowerCase();
  return q ? pathways.filter(p => haystack(p).includes(q)) : pathways
});
const boonIds = new Set(['aeon', 'chaos', 'chaosmist', 'condenser', 'devouring', 'edict', 'everlasting', 'patriarch', 'secondlaw', 'sublunary']);
const groupPathways = (items: Pathway[]) => [
  {
    id: 'normal',
    label: ui.value.standardPathways,
    pathways: items.filter(p => !boonIds.has(p.id))
  },
  {
    id: 'boons',
    label: ui.value.boons,
    pathways: items.filter(p => boonIds.has(p.id))
  }
];
const pathwayGroups = computed(() => groupPathways(filteredPathways.value));
const pickerFilteredPathways = computed(() => {
  const search = pickerQuery.value.trim().toLowerCase();
  return search ? pathways.filter(pathway => pathwayName(pathway.id).toLowerCase().includes(search)) : pathways;
});
const pickerPathwayGroups = computed(() => groupPathways(pickerFilteredPathways.value));

function setMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag)
  }
  tag.content = content
}

function updatePageMeta() {
  const hasPathway = typeof route.params.pathway === 'string';
  const name = pathwayName(selected.value.id),
      abilityCount = selected.value.sequences.reduce((n, s) => n + s.abilities.length, 0);
  const title = hasPathway ? `${name} Pathway – Sequences & Abilities | Mysterria` : 'Pathways & Sequences – Beyonder Archive | Mysterria';
  const description = hasPathway ? `Explore the ${name} Pathway, its ${selected.value.sequences.length} Sequences and ${abilityCount} abilities available on Mysterria.` : `Explore all ${pathways.length} Beyonder Pathways, their Sequence names, and every ability available on Mysterria.`;
  const canonical = `https://mysterria.net/pathways${hasPathway ? `/${selected.value.id}` : ''}`,
      imageName = aliases[selected.value.id] || selected.value.id;
  const image = hasPathway && imageFor(selected.value.id) ? `https://mysterria.net/pathways/${imageName}.webp` : 'https://mysterria.net/banner.webp';
  document.title = title;
  setMeta('meta[name="description"]', 'name', 'description', description);
  for (const [key, value] of Object.entries({
    'og:url': canonical,
    'og:title': title,
    'og:description': description,
    'og:image': image,
    'og:image:alt': hasPathway ? `${name} Pathway symbol` : 'Mysterria Beyonder Pathways'
  })) setMeta(`meta[property="${key}"]`, 'property', key, value);
  for (const [key, value] of Object.entries({
    'twitter:url': canonical,
    'twitter:title': title,
    'twitter:description': description,
    'twitter:image': image
  })) setMeta(`meta[property="${key}"],meta[name="${key}"]`, 'name', key, value);
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link)
  }
  link.href = canonical;
}

const selectedNameMatches = computed(() => {
  const q = query.value.trim().toLowerCase();
  return !!q && pathwayName(selected.value.id).toLowerCase().includes(q)
});
const matchingAbilities = (abilities: Ability[]) => {
  const q = query.value.trim().toLowerCase();
  return q && !selectedNameMatches.value ? abilities.filter(a => `${localized(a.name)} ${localized(a.description)}`.toLowerCase().includes(q)) : abilities
};
const matchingSequenceAbilities = (sequence: Sequence) => {
  const q = query.value.trim().toLowerCase();
  return q && localized(sequence.name).toLowerCase().includes(q) ? sequence.abilities : matchingAbilities(sequence.abilities)
};
const visibleSequences = computed(() => {
  const q = query.value.trim().toLowerCase();
  return !q || selectedNameMatches.value ? selected.value.sequences : selected.value.sequences.filter(s => localized(s.name).toLowerCase().includes(q) || matchingAbilities(s.abilities).length)
});
watch(filteredPathways, (matches) => {
  if (query.value.trim() && matches.length && !matches.some(p => p.id === selectedId.value)) {
    selectedId.value = matches[0].id;
    router.replace({name: 'pathways', params: {pathway: matches[0].id}})
  }
}, {flush: 'post'});
const ranks = {
  en: {4: 'Demigod', 3: 'Saint', 2: 'Angel', 1: 'Archangel', 0: 'Deity'},
  uk: {4: 'Напівбог', 3: 'Святий', 2: 'Янгол', 1: 'Архангел', 0: 'Божество'}
} as const;

function sequenceRank(n: number) {
  return n <= 4 ? ranks[currentLanguage.value][n as keyof typeof ranks.en] : ''
}

function sequenceClass(n: number) {
  return n <= 4 ? `ranked rank-${n}` : ''
}

function updateActiveSequence() {
  const cards = [...document.querySelectorAll<HTMLElement>('.sequence-card')];
  if (!cards.length) return;
  const threshold = 240;
  const current = cards.reduce((best, card) => Math.abs(card.getBoundingClientRect().top - threshold) < Math.abs(best.getBoundingClientRect().top - threshold) ? card : best);
  activeSequence.value = Number(current.id.replace('sequence-', ''))
}

function selectPathway(id: string) {
  selectedId.value = id;
  activeSequence.value = pathways.find(p => p.id === id)?.sequences[0]?.sequence;
  router.replace({name: 'pathways', params: {pathway: id}});
}

function scrollToSequence(n: number) {
  activeSequence.value = n;
  document.getElementById(`sequence-${n}`)?.scrollIntoView({behavior: preferredScrollBehavior(), block: 'start'})
}

async function openPathwayPicker() {
  const dialog = pathwayPickerDialog.value;
  if (!dialog || dialog.open) return;
  previousBodyOverflow = document.body.style.overflow;
  previousRootOverflow = document.documentElement.style.overflow;
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
  isPathwayPickerOpen.value = true;
  dialog.showModal();
  await nextTick();
  pathwayPickerSearch.value?.focus();
}

function closePathwayPicker() {
  pathwayPickerDialog.value?.close();
}

function handlePathwayPickerClosed() {
  document.body.style.overflow = previousBodyOverflow;
  document.documentElement.style.overflow = previousRootOverflow;
  isPathwayPickerOpen.value = false;
  pickerQuery.value = '';
  nextTick(() => pathwayPickerTrigger.value?.focus({preventScroll: true}));
}

function selectPathwayFromPicker(id: string) {
  selectPathway(id);
  closePathwayPicker();
}

watch(visibleSequences, sequences => {
  activeSequence.value = sequences[0]?.sequence;
  nextTick(updateActiveSequence)
}, {immediate: true});
watch([selected, currentLanguage, () => route.params.pathway], updatePageMeta, {immediate: true});
onMounted(() => window.addEventListener('scroll', updateActiveSequence, {passive: true}));
onUnmounted(() => {
  window.removeEventListener('scroll', updateActiveSequence);
  if (pathwayPickerDialog.value?.open) pathwayPickerDialog.value.close();
  document.body.style.overflow = previousBodyOverflow;
  document.documentElement.style.overflow = previousRootOverflow;
});
</script>

<style scoped>
.pathways-page {
  min-height: 100vh;
  background: #070910;
  color: #eceae4
}

.archive-hero {
  padding: 150px 24px 72px;
  text-align: center;
  background: radial-gradient(circle at 50% 0, rgba(200, 178, 115, .13), transparent 48%), linear-gradient(#0c0e1a, #070910);
  border-bottom: 1px solid rgba(200, 178, 115, .12)
}

.eyebrow, .pathway-header span, .sequence-title span {
  font: 11px var(--font-ui);
  letter-spacing: 2px;
  color: var(--myst-gold)
}

.archive-hero h1 {
  margin: 10px 0 14px;
  font: 700 clamp(38px, 7vw, 72px) var(--font-display)
}

.archive-hero > p {
  max-width: 700px;
  margin: auto;
  color: #92929c;
  line-height: 1.8
}

.archive-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  margin-top: 36px;
  color: #777780;
  font: 12px var(--font-ui);
  text-transform: uppercase
}

.archive-stats b {
  color: #ded8c6;
  font-size: 16px
}

.archive-stats i {
  height: 20px;
  width: 1px;
  background: #32323a
}

.archive-layout {
  max-width: 1320px;
  margin: auto;
  padding: 56px 24px 100px;
  display: grid;
  grid-template-columns:310px 1fr;
  gap: 42px;
  align-items: start
}

.pathway-browser {
  position: sticky;
  top: 88px;
  max-height: calc(100vh - 112px);
  display: flex;
  flex-direction: column
}

.mobile-archive-search, .pathway-picker-trigger { display: none; }

.search-box {
  height: 46px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 13px;
  border: 1px solid #292b34;
  border-radius: var(--radius-md);
  background: #0d0f17
}

.search-box:focus-within {
  border-color: rgba(200, 178, 115, .6)
}

.search-box svg {
  width: 17px;
  fill: none;
  stroke: #777;
  stroke-width: 1.8
}

.search-box input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: none;
  color: #eee;
  font: 14px var(--font-ui)
}

.search-box button {
  border: 0;
  background: none;
  color: #999;
  font-size: 20px;
  cursor: pointer
}

.browser-heading {
  display: flex;
  justify-content: space-between;
  margin: 22px 4px 10px;
  color: #75757e;
  font: 10px var(--font-ui);
  text-transform: uppercase;
  letter-spacing: 2px
}

.browser-heading b {
  color: var(--myst-gold)
}

.pathway-list {
  overflow: auto;
  padding-right: 5px
}
.pathway-list { scrollbar-width: none; }
.pathway-list::-webkit-scrollbar { display: none; }

.pathway-list > button {
  width: 100%;
  display: grid;
  grid-template-columns:44px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: #aaa;
  text-align: left;
  cursor: pointer;
  transition:
    background-color var(--motion-base) var(--ease-standard),
    border-color var(--motion-base) var(--ease-standard),
    color var(--motion-base) var(--ease-standard)
}

.pathway-list > button:hover {
  background: #10121b;
  color: #eee
}

.pathway-list > button.active {
  background: linear-gradient(90deg, rgba(200, 178, 115, .12), transparent);
  border-color: rgba(200, 178, 115, .2);
  color: #fff
}

.sigil {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 1px solid #292b34;
  border-radius: var(--radius-md);
  background: #090b11
}

.sigil img {
  width: 34px;
  height: 34px;
  object-fit: contain
}

.sigil b, .large-sigil b {
  font-family: var(--font-display);
  color: var(--myst-gold)
}

.pathway-list strong {
  display: block;
  font: 600 15px var(--font-display)
}

.pathway-list small {
  display: block;
  color: #62626b;
  font: 12px var(--font-ui);
  text-transform: uppercase
}

.chevron {
  color: #595961;
  font-size: 21px
}

.empty {
  padding: 30px 10px;
  color: #777;
  text-align: center
}

.pathway-header {
  min-height: 150px;
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 22px 28px;
  border: 1px solid rgba(200, 178, 115, .22);
  border-radius: var(--radius-xl);
  background: radial-gradient(circle at 10% 50%, rgba(200, 178, 115, .12), transparent 42%), #0d0f17
}

.pathway-detail, .pathway-controls { min-width: 0; width: 100%; }

.pathway-heading-copy { min-width: 0; }
.pathway-picker-trigger { min-height: 44px; margin-left: auto; flex: none; align-items: center; gap: 8px; padding: 0 12px; border: 1px solid rgba(200, 178, 115, .35); border-radius: var(--radius-md); background: rgba(200, 178, 115, .08); color: #eee9dd; font: 700 13px var(--font-ui); cursor: pointer; }

.large-sigil {
  width: 105px;
  height: 105px;
  display: grid;
  place-items: center;
  flex: none
}

.large-sigil img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 0 20px rgba(200, 178, 115, .18))
}

.large-sigil b {
  font-size: 55px
}

.pathway-header h2 {
  margin: 3px 0 2px;
  font: 700 clamp(30px, 5vw, 48px) var(--font-display)
}

.pathway-header p {
  margin: 0;
  color: #72727c;
  font: 12px var(--font-ui);
  text-transform: uppercase
}

.sequence-jump {
  display: flex;
  gap: 8px;
  overflow: auto;
  padding: 18px 0 22px
}

.sequence-jump button {
  min-width: 60px;
  height: 48px;
  border: 1px solid #292b34;
  border-radius: var(--radius-md);
  background: #0c0e15;
  color: #aaa;
  cursor: pointer
}

.sequence-jump button:hover {
  border-color: var(--myst-gold);
  color: var(--myst-gold)
}

.sequence-jump small {
  display: block;
  font: 10px var(--font-ui);
  color: #9a979d
}

.sequence-jump b {
  font: 20px var(--font-display)
}

.sequence-list {
  display: flex;
  flex-direction: column;
  gap: 16px
}

.sequence-card {
  scroll-margin-top: 82px;
  display: grid;
  grid-template-columns:100px 1fr;
  border: 1px solid #22242c;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: #0b0d14
}

.sequence-number {
  padding: 25px 15px;
  text-align: center;
  border-right: 1px solid #22242c;
  background: linear-gradient(135deg, rgba(200, 178, 115, .08), transparent)
}

.sequence-number small {
  display: block;
  color: #707079;
  font: 10px var(--font-ui);
  text-transform: uppercase;
  letter-spacing: 2px
}

.sequence-number b {
  font: 700 52px var(--font-display);
  color: var(--myst-gold)
}

.sequence-content {
  padding: 25px 28px 30px
}

.sequence-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-bottom: 18px;
  border-bottom: 1px solid #22242c
}

.sequence-title h3 {
  margin: 4px 0 0;
  font: 600 28px var(--font-display)
}

.sequence-title > small {
  color: #a3a0a6;
  font: 12px var(--font-ui);
  text-transform: uppercase
}

.abilities-grid {
  display: grid;
  grid-template-columns:repeat(2, minmax(0, 1fr));
  gap: 14px 28px;
  padding-top: 22px
}

.ability {
  display: flex;
  gap: 12px
}

.ability-mark {
  width: 5px;
  height: 5px;
  margin-top: 8px;
  flex: none;
  transform: rotate(45deg);
  background: var(--myst-gold)
}

.ability h4 {
  margin: 0 0 4px;
  color: #ddd9ce;
  font: 600 14px var(--font-display)
}

.ability p {
  margin: 0;
  color: #85858e;
  font-size: 14px;
  line-height: 1.6
}

.detail-empty {
  padding: 100px 20px;
  text-align: center;
  border: 1px solid #22242c;
  border-radius: var(--radius-lg);
  color: #777
}

.detail-empty span {
  font-size: 44px;
  color: var(--myst-gold)
}

.detail-empty h3 {
  color: #ddd
}
.sequence-rail-label { display: none; }
.sequence-jump { scrollbar-width: none; scroll-snap-type: x proximity; }
.sequence-jump::-webkit-scrollbar { display: none; }
.sequence-jump button { scroll-snap-align: start; }

.pathway-picker-sheet {
  width: min(620px, 100%);
  max-height: min(88dvh, 760px);
  margin: auto auto 0;
  padding: 24px;
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid rgba(200, 178, 115, .25);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  color: #eceae4;
  background: #0b0d14;
  box-shadow: 0 -24px 70px rgba(0, 0, 0, .55);
}
.pathway-picker-sheet::backdrop { background: rgba(3, 4, 7, .78); backdrop-filter: blur(8px); }
.picker-sheet-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 22px; }
.picker-sheet-head h2 { margin: 5px 0 0; font-size: 30px; }
.picker-sheet-close { width: 44px; height: 44px; flex: none; border: 1px solid #30323b; border-radius: var(--radius-md); background: transparent; color: #d6d2cb; font-size: 25px; cursor: pointer; }
.picker-search { margin-bottom: 8px; }
.pathway-picker-list { max-height: none; overflow: visible; padding-right: 0; }

@media (max-width: 900px) {
  .archive-layout {
    grid-template-columns:1fr;
    padding-top: 30px
  }

  .pathway-browser--desktop { display: none; }
  .mobile-archive-search { display: block; margin-bottom: 14px; }
  .pathway-picker-trigger { display: inline-flex; }
  .pathway-controls .pathway-header { position: relative; padding-right: 108px; }
  .pathway-heading-copy { flex: 1; min-width: 0; }
  .pathway-picker-trigger { position: absolute; top: 50%; right: 10px; transform: translateY(-50%); }
  .sequence-rail-label { display: flex; justify-content: space-between; gap: 16px; padding-top: 9px; color: #aaa7aa; font: 650 11px var(--font-ui); }
  .sequence-rail-label span:last-child { color: var(--myst-gold); }

  .archive-stats {
    gap: 12px
  }

  .abilities-grid {
    grid-template-columns:1fr
  }
}

@media (max-width: 560px) {
  .archive-hero {
    padding-top: 120px
  }

  .archive-stats {
    font-size: 8px
  }

  .archive-layout {
    padding-left: 14px;
    padding-right: 14px
  }

  .pathway-header {
    padding: 18px;
    gap: 16px
  }

  .large-sigil {
    width: 72px;
    height: 72px
  }

  .sequence-card {
    grid-template-columns:1fr
  }

  .sequence-number {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 8px;
    border-right: 0;
    border-bottom: 1px solid #22242c
  }

  .sequence-number b {
    font-size: 30px
  }

  .sequence-content {
    padding: 20px 18px
  }

  .sequence-title h3 {
    font-size: 23px
  }
}

/* Keep the archive itself in the first viewport and make discovery controls unmistakable. */
.archive-hero {
  padding: 88px 24px 20px
}

.archive-hero h1 {
  margin: 3px 0 4px;
  font-size: clamp(32px, 5vw, 52px)
}

.archive-hero > p {
  line-height: 1.5
}

.archive-stats {
  margin-top: 12px;
  gap: 18px
}

.archive-layout {
  padding-top: 24px
}

.pathway-browser {
  top: 76px;
  max-height: calc(100vh - 88px)
}

.search-label {
  margin: 0 0 7px;
  color: var(--myst-gold);
  font: 700 11px var(--font-ui);
  text-transform: uppercase;
  letter-spacing: 1.6px
}

.search-box {
  height: 52px;
  border-color: rgba(200, 178, 115, .5);
  background: #11131d;
  box-shadow: 0 0 0 3px rgba(200, 178, 115, .05)
}

.search-box:focus-within {
  border-color: var(--myst-gold);
  box-shadow: 0 0 0 3px rgba(200, 178, 115, .12)
}

.search-box svg {
  width: 20px;
  stroke: var(--myst-gold)
}

.search-box kbd {
  color: #777;
  font: 18px var(--font-mono)
}

.browser-heading {
  margin: 18px 4px 7px;
  color: #aaaab2;
  font-weight: 700
}

@media (max-width: 900px) {
  .archive-hero {
    padding-top: 82px
  }

  .archive-layout {
    padding-top: 20px
  }

  .pathway-browser--desktop { display: none; }
}

@media (max-width: 560px) {
  .archive-hero {
    padding: 78px 16px 18px
  }

  .archive-hero .eyebrow {
    display: none
  }

  .archive-hero > p {
    font-size: 13px
  }

  .archive-stats {
    margin-top: 9px
  }

  .archive-layout {
    padding-top: 16px
  }
}

/* Persistent pathway context and progression controls. */
.pathway-controls {
  position: sticky;
  top: 64px;
  z-index: 20;
  background: #070910;
  padding-bottom: 1px;
  box-shadow: 0 12px 22px rgba(7, 9, 16, .92)
}

.pathway-controls .pathway-header {
  min-height: 94px;
  padding: 10px 20px
}

.pathway-controls .large-sigil {
  width: 72px;
  height: 72px
}

.pathway-controls .pathway-header h2 {
  font-size: clamp(26px, 4vw, 38px)
}

.pathway-controls .sequence-jump {
  display: flex;
  width: 100%;
  gap: 6px;
  padding: 8px 0 12px
}

.pathway-controls .sequence-jump button {
  flex: 1;
  min-width: 0;
  height: 51px
}

.sequence-card {
  scroll-margin-top: 232px
}

/* Sequence 4 onward crosses into divinity; each rank gets a stronger aura. */
.sequence-jump button.ranked {
  position: relative;
  overflow: hidden;
  border-color: rgba(200, 178, 115, .34);
  color: #d7c88f;
  background: linear-gradient(145deg, rgba(200, 178, 115, .12), #0c0e15)
}

.sequence-jump button.ranked:after {
  content: '';
  position: absolute;
  inset: auto 12% 0;
  height: 1px;
  background: currentColor;
  box-shadow: 0 0 9px currentColor
}

.sequence-jump button.ranked small {
  color: currentColor;
  font-size: 7px
}

.sequence-jump button.rank-3 {
  color: #c9d7e8;
  border-color: rgba(170, 196, 226, .42);
  background: linear-gradient(145deg, rgba(133, 166, 204, .15), #0c0e15)
}

.sequence-jump button.rank-2 {
  color: #e7d7ff;
  border-color: rgba(204, 171, 255, .48);
  background: radial-gradient(circle at 50% 120%, rgba(170, 109, 255, .25), transparent 65%), #0c0e15
}

.sequence-jump button.rank-1 {
  color: #ffe7a5;
  border-color: rgba(255, 216, 114, .58);
  background: radial-gradient(circle at 50% 120%, rgba(255, 190, 66, .3), transparent 65%), #0c0e15
}

.sequence-jump button.rank-0 {
  color: #fff2bc;
  border-color: rgba(255, 229, 145, .8);
  background: radial-gradient(circle at 50% 110%, rgba(255, 218, 102, .38), transparent 70%), #17140d;
  box-shadow: inset 0 0 14px rgba(255, 221, 118, .12), 0 0 12px rgba(255, 221, 118, .08)
}

.sequence-number.ranked {
  color: #d7c88f;
  background: radial-gradient(circle at 50% 40%, rgba(200, 178, 115, .18), transparent 65%)
}

.sequence-number.ranked small {
  color: currentColor
}

.sequence-number.rank-3 {
  color: #b8cee8;
  background: radial-gradient(circle at 50% 40%, rgba(133, 166, 204, .2), transparent 65%)
}

.sequence-number.rank-2 {
  color: #d9bdff;
  background: radial-gradient(circle at 50% 40%, rgba(170, 109, 255, .22), transparent 65%)
}

.sequence-number.rank-1, .sequence-number.rank-0 {
  color: #ffe3a0;
  background: radial-gradient(circle at 50% 40%, rgba(255, 195, 70, .25), transparent 65%)
}

.sequence-number.ranked b {
  color: currentColor;
  text-shadow: 0 0 18px currentColor
}

@media (max-width: 900px) {
  .pathway-controls {
    top: 64px
  }

  .pathway-controls .pathway-header {
    min-height: 82px
  }

  .pathway-controls .large-sigil {
    width: 60px;
    height: 60px
  }

  .pathway-controls .sequence-jump {
    overflow-x: auto
  }

  .pathway-controls .sequence-jump button {
    flex: 1 0 62px
  }

  .sequence-card {
    scroll-margin-top: 220px
  }
}

@media (max-width: 560px) {
  .archive-hero > p {
    display: none
  }

  .archive-hero {
    padding-bottom: 10px
  }

  .pathway-controls .pathway-header {
    min-height: 70px;
    padding: 7px 108px 7px 12px
  }

  .pathway-controls .large-sigil {
    width: 52px;
    height: 52px
  }

  .pathway-controls .pathway-header p {
    display: none
  }

  .archive-stats { display: flex; gap: 9px; font-size: 10.5px; }
  .archive-stats b { font-size: 13px; }
  .archive-stats span:last-child, .archive-stats i:last-of-type { display: none; }
  .archive-freshness { font-size: 11px; padding-inline: 8px; }
  .pathway-picker-trigger { padding-inline: 10px; }
  .pathway-picker-sheet { width: 100%; height: 100dvh; max-height: none; padding: max(18px, env(safe-area-inset-top)) 16px max(18px, env(safe-area-inset-bottom)); border-radius: 0; }
  .pathway-picker-list > button:hover:not(.active) { background: transparent; color: #aaa; }

  .pathway-controls .sequence-jump {
    padding: 6px 0 9px
  }

  .pathway-controls .sequence-jump button {
    height: 46px
  }

  .sequence-card {
    scroll-margin-top: 200px
  }
}

/* Search stays prominent before interaction; current Sequence remains easy to locate. */
.search-box {
  height: 58px;
  border-color: #343640;
  box-shadow: 0 8px 24px rgba(0, 0, 0, .18)
}

.search-box:focus-within {
  box-shadow: 0 0 0 3px rgba(200, 178, 115, .14), 0 8px 24px rgba(0, 0, 0, .24)
}

.sequence-jump button.current {
  color: #fff3c7;
  border-color: var(--myst-gold);
  background: linear-gradient(145deg, rgba(200, 178, 115, .27), rgba(200, 178, 115, .07));
  box-shadow: inset 0 0 14px rgba(200, 178, 115, .14), 0 0 9px rgba(200, 178, 115, .13);
  transform: translateY(var(--hover-control))
}

.sequence-card.current {
  border-color: rgba(200, 178, 115, .38);
  box-shadow: 0 0 0 1px rgba(200, 178, 115, .06), 0 8px 28px rgba(0, 0, 0, .18)
}

.archive-freshness {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin-top: 9px;
  color: #a3a0a6;
  font: 12px var(--font-ui);
  letter-spacing: .35px
}

.archive-freshness i {
  font-style: normal;
  color: #42434b
}

.freshness-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--myst-gold);
  box-shadow: 0 0 7px rgba(200, 178, 115, .65)
}

@media (max-width: 560px) {
  .archive-freshness {
    margin-top: 5px;
    line-height: 1.4;
    flex-wrap: wrap
  }

  .archive-freshness i {
    flex-basis: 100%;
    width: 0;
    height: 0;
    overflow: hidden
  }
}
</style>
