<template>
  <article class="pw-detail" :style="{'--tok': card.accent}">
    <div class="pw-detail__head">
      <ArcPageHead class="pw-detail__title" :title="name" :back="{to: $lp('/pathways'), label: ui.back}">
        <template #lede>{{ lede }}</template>
        <template #actions>
          <RouterLink v-if="!card.boon" :to="$lp('/ascension')" class="arc-btn arc-btn--solid">
            {{ ui.ascension }}
            <i class="fa-solid fa-arrow-right arc-btn__icon" aria-hidden="true"></i>
          </RouterLink>
          <a :href="wikiUrl(currentLanguage, card.boon)" class="arc-btn arc-btn--ghost" target="_blank" rel="noopener noreferrer">
            {{ card.boon ? ui.wikiBoons : ui.wikiPathways }}
            <i class="fa-solid fa-arrow-up-right-from-square arc-btn__icon" aria-hidden="true"></i>
          </a>
        </template>
      </ArcPageHead>
      <PathwaySeal :id="card.id" :accent="card.accent" large eager class="pw-detail__seal"/>
    </div>

    <div class="arc-split pw-detail__body">
      <ArcToc :label="ui.ladder" :groups="toc" :current="current"/>

      <!-- the climb, read top to bottom: Sequence 9 first, the throne last -->
      <ol class="pw-climb">
        <li
            v-for="rung in rungs"
            :id="`seq-${rung.sequence}`"
            :key="rung.sequence"
            ref="rungEls"
            class="pw-rung"
            :class="{'is-current': `seq-${rung.sequence}` === current, 'is-throne': rung.sequence === 0}"
        >
          <span class="pw-rung__node" aria-hidden="true">{{ rung.sequence }}</span>
          <div class="pw-rung__body">
            <h2 :id="`seq-${rung.sequence}-name`" class="arc-h3 pw-rung__name">
              <span class="arc-sr">{{ fill(ui.sequence, {n: rung.sequence}) }}: </span>{{ rung.name }}
            </h2>
            <p class="pw-rung__meta">
              <span><span aria-hidden="true">{{ fill(ui.sequence, {n: rung.sequence}) }}</span><span v-if="rung.abilities.length" class="pw-rung__count"><span aria-hidden="true"> · </span>{{ countOf(rung.abilities.length) }}</span></span>
              <span v-if="rankOf(rung.sequence)" class="arc-tag arc-tag--acc">{{ rankOf(rung.sequence) }}</span>
              <span v-if="seatsOf(rung.sequence)" class="arc-tag">{{ seatsOf(rung.sequence) }}</span>
            </p>

            <template v-if="rung.sequence === 0">
              <p class="pw-rung__throne">{{ ui.throne }}</p>
              <RouterLink :to="$lp('/ascension')" class="arc-link pw-rung__link">{{ ui.throneLink }}</RouterLink>
            </template>
            <ul v-else-if="rung.abilities.length" class="pw-abilities">
              <li v-for="ability in rung.abilities" :key="ability.id" class="pw-ability">
                <h3 class="pw-ability__name">{{ ability.name }}</h3>
                <p class="pw-ability__text">{{ ability.description }}</p>
              </li>
            </ul>
            <p v-else class="arc-muted pw-rung__empty">{{ ui.empty }}</p>
          </div>
        </li>
      </ol>
    </div>

    <nav class="pw-pager" :aria-label="card.boon ? ui.tabBoons : ui.tabCore">
      <RouterLink v-if="neighbours.previous" :to="$lp(`/pathways/${neighbours.previous.id}`)" class="arc-panel arc-panel--link pw-pager__link">
        <span class="pw-pager__dir">
          <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
          {{ ui.previous }}
        </span>
        <span class="pw-pager__name">{{ data.pathwayName(neighbours.previous.id, currentLanguage) }}</span>
      </RouterLink>
      <RouterLink v-if="neighbours.next" :to="$lp(`/pathways/${neighbours.next.id}`)" class="arc-panel arc-panel--link pw-pager__link pw-pager__link--next">
        <span class="pw-pager__dir">
          {{ ui.next }}
          <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
        </span>
        <span class="pw-pager__name">{{ data.pathwayName(neighbours.next.id, currentLanguage) }}</span>
      </RouterLink>
    </nav>
  </article>
</template>

<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import ArcPageHead from '@/components/arcana/ArcPageHead.vue';
import ArcToc from '@/components/arcana/ArcToc.vue';
import {BOON_CARDS, CORE_CARDS, type ArcanaCard, type PathwaysModule} from '@/components/home-arcana/arcana-data';
import {useI18n} from '@/composables/useI18n';
import type {Translations} from '@/locales';
import PathwaySeal from './PathwaySeal.vue';
import {abilityCount, climbOf, fill, tidy, wikiUrl} from './pathwayText';

const props = defineProps<{data: PathwaysModule; card: ArcanaCard}>();
const {currentLanguage, plural, tree} = useI18n();
const ui = computed(() => tree<Translations['pathwaysPage']>('pathwaysPage'));

const name = computed(() => props.data.pathwayName(props.card.id, currentLanguage.value));
const countOf = (count: number) => fill(plural(count, ui.value.abilities), {count});

const rungs = computed(() => {
  const language = currentLanguage.value;
  const pathway = props.data.pathwayById(props.card.id);
  return climbOf(props.data, props.card, language).map(rung => ({
    ...rung,
    abilities: (pathway?.sequences.find(sequence => sequence.sequence === rung.sequence)?.abilities ?? []).map(ability => ({
      id: ability.id,
      name: tidy(props.data.pick(ability.name, language)),
      description: tidy(props.data.pick(ability.description, language)),
    })),
  }));
});

const lede = computed(() => {
  const first = rungs.value[0];
  const last = rungs.value.at(-1);
  if (!first || !last) return '';
  return fill(ui.value.detailLede, {
    first: first.name,
    last: last.name,
    top: last.sequence,
    abilities: countOf(abilityCount(props.data, props.card.id)),
  });
});

/* Sequence 4 and up carry a divine rank; 3 to 0 have a limited number of seats per Pathway */
const rankOf = (n: number) => (n <= 4 ? ui.value.ranks[String(n) as keyof Translations['pathwaysPage']['ranks']] ?? '' : '');
const seatsOf = (n: number) => {
  const seats = props.card.boon ? undefined : props.data.HIGH_SEAT_LIMITS[n];
  return seats ? fill(plural(seats, ui.value.seats), {count: seats}) : '';
};

const toc = computed(() => [{
  items: rungs.value.map(rung => ({id: `seq-${rung.sequence}`, label: rung.name, mark: String(rung.sequence)})),
}]);

const neighbours = computed(() => {
  const deck = props.card.boon ? BOON_CARDS : CORE_CARDS;
  const at = deck.findIndex(card => card.id === props.card.id);
  return {previous: deck[at - 1], next: deck[at + 1]};
});

/*
 * The contents column marks the Sequence being read: whichever rung crosses a band
 * a third of the way down the screen. An IntersectionObserver, so nothing runs while
 * the page sits still.
 */
const current = ref('seq-9');
const rungEls = ref<HTMLElement[]>([]);
let observer: IntersectionObserver | null = null;

function observe() {
  observer?.disconnect();
  observer = new IntersectionObserver(entries => {
    const hit = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (hit) current.value = hit.target.id;
  }, {rootMargin: '-30% 0px -65% 0px'});
  for (const el of rungEls.value) observer.observe(el);
}

async function settle() {
  current.value = `seq-${rungs.value[0]?.sequence ?? 9}`;
  await nextTick();
  observe();
  // a link to one Sequence (#seq-4) lands once the rungs exist
  const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
  target?.scrollIntoView({block: 'start'});
}

onMounted(settle);
watch(() => props.card.id, settle);

onBeforeUnmount(() => observer?.disconnect());
</script>

<style scoped>
.pw-detail {
  display: grid;
  gap: var(--arc-block-gap);
}

.pw-detail__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
}

.pw-detail__seal {
  margin-right: clamp(0px, 4vw, 64px);
}

.pw-detail__body {
  align-items: start;
}

/* ---------- the climb: a line through numbered nodes, one per Sequence ---------- */
.pw-climb {
  --node: 44px;
  position: relative;
  display: grid;
  gap: clamp(36px, 4vw, 56px);
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.pw-climb::before {
  position: absolute;
  top: calc(var(--node) / 2);
  bottom: calc(var(--node) / 2);
  left: calc(var(--node) / 2 - .5px);
  width: var(--arc-bw);
  background: var(--arc-line);
  content: '';
}

.pw-rung {
  position: relative;
  display: grid;
  grid-template-columns: var(--node) minmax(0, 1fr);
  gap: clamp(16px, 2vw, 28px);
  scroll-margin-top: calc(var(--site-header-stack, 106px) + 24px);
}

.pw-rung__node {
  position: relative;
  display: grid;
  place-items: center;
  width: var(--node);
  height: var(--node);
  border-radius: 50%;
  background: var(--arc-bg);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
  color: var(--arc-muted);
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-size: 18px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  transition: color .25s ease, box-shadow .25s ease;
}

.pw-rung.is-current .pw-rung__node {
  color: var(--arc-ink);
  box-shadow: inset 0 0 0 var(--arc-bw-accent) var(--acc-ink);
}

/* the throne at the top of the climb wears the accent */
.pw-rung.is-throne .pw-rung__node {
  background: color-mix(in oklab, var(--acc) 14%, var(--arc-bg));
  color: var(--acc-ink);
  box-shadow: inset 0 0 0 var(--arc-bw-accent) var(--acc-ink);
}

.pw-rung__body {
  min-width: 0;
  padding-top: 4px;
}

.pw-rung__name {
  overflow-wrap: anywhere;
}

.pw-rung.is-throne .pw-rung__name {
  color: var(--acc-ink);
}

.pw-rung__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  margin: 10px 0 0;
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  font-weight: 600;
}

.pw-rung__count {
  font-weight: 500;
}

.pw-rung__throne {
  max-width: var(--arc-measure);
  margin: 18px 0 12px;
  line-height: 1.65;
}

.pw-rung__link {
  font-weight: 600;
}

.pw-rung__empty {
  margin: 18px 0 0;
}

/* abilities: hairline rows inside the rung, never boxes in boxes */
.pw-abilities {
  max-width: 76ch;
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
}

.pw-ability {
  min-width: 0;
  padding: 16px 0;
  border-top: var(--arc-bw) solid var(--arc-line);
}

.pw-ability:last-child {
  padding-bottom: 0;
}

.pw-ability__name {
  margin: 0;
  font-size: var(--arc-fs-body);
  font-weight: 650;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.pw-ability__text {
  margin: 6px 0 0;
  color: color-mix(in oklab, var(--arc-ink) 72%, var(--arc-muted));
  font-size: var(--arc-fs-small);
  line-height: 1.65;
  overflow-wrap: anywhere;
}

/* ---------- previous and next Pathway ---------- */
.pw-pager {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--arc-grid-gap);
}

.pw-pager__link {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.pw-pager__link--next {
  grid-column: 2;
  text-align: right;
}

.pw-pager__dir {
  color: var(--arc-muted);
  font-size: var(--arc-fs-small);
  font-weight: 600;
}

.pw-pager__dir i {
  font-size: 12px;
}

.pw-pager__name {
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-size: var(--arc-fs-h4);
  font-weight: 600;
  overflow-wrap: anywhere;
}

@media (max-width: 900px) {
  .pw-detail__seal {
    margin-right: 0;
  }
}

@media (max-width: 640px) {
  /* the seal moves beside the title, so nothing but the way back sits above it */
  .pw-detail__head {
    position: relative;
  }

  .pw-detail__title :deep(.arc-h1) {
    padding-right: 84px;
  }

  .pw-detail__seal {
    --pw-seal: 68px;
    position: absolute;
    top: 0;
    right: 0;
  }

  .pw-climb {
    --node: 36px;
  }

  .pw-rung__node {
    font-size: 16px;
  }

  .pw-rung {
    gap: 14px;
  }

  .pw-pager {
    grid-template-columns: minmax(0, 1fr);
  }

  .pw-pager__link--next {
    grid-column: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pw-rung__node {
    transition: none;
  }
}
</style>
