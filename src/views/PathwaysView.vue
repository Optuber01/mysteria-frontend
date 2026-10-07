<template>
  <ArcPage :title="pathwayId ? undefined : ui.title">
    <template v-if="!pathwayId" #lede>{{ ui.lede }}</template>

    <ArcState v-if="failed" kind="error" :text="ui.loadError" :retry-label="ui.retry" @retry="load"/>
    <ArcState v-else-if="!data" kind="loading" :text="ui.loading"/>

    <template v-else-if="pathwayId">
      <PathwayDetail v-if="card" :data="data" :card="card"/>
      <div v-else class="pw-missing">
        <ArcState kind="empty" :text="fill(ui.notFound, {id: pathwayId})"/>
        <RouterLink :to="$lp('/pathways')" class="arc-btn arc-btn--ghost">{{ ui.back }}</RouterLink>
      </div>
    </template>

    <PathwayList v-else :data="data"/>

    <footer v-if="data" class="pw-foot">
      <p class="arc-muted">{{ fill(ui.updated, {date: updated}) }}</p>
      <p v-if="!pathwayId" class="pw-foot__links">
        <RouterLink :to="$lp('/ascension')" class="arc-link">{{ ui.ascension }}</RouterLink>
        <a :href="wikiUrl(currentLanguage, false)" class="arc-link" target="_blank" rel="noopener noreferrer">
          {{ ui.wikiPathways }}
          <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
        </a>
      </p>
    </footer>
  </ArcPage>
</template>

<script setup lang="ts">
import {computed, shallowRef} from 'vue';
import {useRoute} from 'vue-router';
import ArcPage from '@/components/arcana/ArcPage.vue';
import ArcState from '@/components/arcana/ArcState.vue';
import {ALL_CARDS, CORE_CARDS, loadPathways, type PathwaysModule} from '@/components/home-arcana/arcana-data';
import PathwayDetail from '@/components/pathways/PathwayDetail.vue';
import PathwayList from '@/components/pathways/PathwayList.vue';
import {abilityCount, fill, wikiUrl} from '@/components/pathways/pathwayText';
import {breadcrumbLd, itemListLd, useSeo} from '@/composables/useSeo';
import {useI18n} from '@/composables/useI18n';
import type {Translations} from '@/locales';

const route = useRoute();
const {currentLanguage, intlLocale, tree} = useI18n();
const ui = computed(() => tree<Translations['pathwaysPage']>('pathwaysPage'));

/* the ability data is ~1 MB of JSON, so it arrives as its own chunk (shared with the homepage) */
const data = shallowRef<PathwaysModule | null>(null);
const failed = shallowRef(false);

function load() {
  failed.value = false;
  loadPathways().then(module => (data.value = module), () => (failed.value = true));
}

load();

const pathwayId = computed(() => (typeof route.params.pathway === 'string' ? route.params.pathway.toLowerCase() : ''));
const card = computed(() => ALL_CARDS.find(item => item.id === pathwayId.value));

const updated = computed(() => {
  if (!data.value) return '';
  return new Intl.DateTimeFormat(intlLocale.value, {dateStyle: 'long', timeZone: 'UTC'})
    .format(new Date(`${data.value.pathwaysLastUpdated}T00:00:00Z`));
});

/* Titles and descriptions stay English, as on every page; names come from the data once it's here. */
useSeo(() => {
  const trail = [{name: 'Home', path: '/'}, {name: 'Pathways', path: '/pathways'}];
  const nameOf = (id: string) => data.value?.pathwayName(id) ?? ALL_CARDS.find(item => item.id === id)?.en ?? id;

  if (!pathwayId.value) {
    return {
      title: 'Pathways & Sequences - Beyonder Archive',
      description: `All ${CORE_CARDS.length} Beyonder Pathways from Lord of the Mysteries and the Boons beside them, playable on Mysterria: every Sequence from 9 to 0 and every ability, as the game describes it.`,
      path: '/pathways',
      imageAlt: 'Mysterria Beyonder Pathways',
      jsonLd: [
        breadcrumbLd(trail),
        itemListLd('Beyonder Pathways', CORE_CARDS.map(item => ({name: nameOf(item.id), path: `/pathways/${item.id}`}))),
      ],
    };
  }

  if (!card.value) {
    return {title: 'Pathway not found', description: 'There is no Pathway by that name on Mysterria.', path: '/pathways', noindex: true};
  }

  const id = card.value.id;
  const name = nameOf(id);
  const top = card.value.boon ? 5 : 0;
  const abilities = data.value ? abilityCount(data.value, id) : 0;
  // /pathways/ is redirected in production (308), which breaks link previews; /pathway-art/og/ is served as is
  const image = `/pathway-art/og/${data.value?.pathwayImageName(id) ?? id}.webp`;
  return {
    title: `${name} Pathway - Sequences & Abilities`,
    description: `The ${name} Pathway on Mysterria, from Sequence 9 to ${top}${abilities ? `, with all ${abilities} Beyonder abilities as the game describes them` : ''}.`,
    path: `/pathways/${id}`,
    image,
    imageAlt: `${name} Pathway symbol`,
    jsonLd: [breadcrumbLd([...trail, {name, path: `/pathways/${id}`}])],
  };
});
</script>

<style scoped>
.pw-missing {
  display: grid;
  justify-items: start;
  gap: var(--arc-group-gap);
}

.pw-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px 32px;
  padding-top: var(--arc-group-gap);
  border-top: var(--arc-bw) solid var(--arc-line);
  font-size: var(--arc-fs-small);
}

.pw-foot p {
  margin: 0;
}

.pw-foot__links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  font-weight: 600;
}

.pw-foot__links i {
  margin-left: 4px;
  font-size: 11px;
}
</style>
