<template>
  <div class="mysterria-home">
    <a class="skip-link" href="#main-content">{{ t('home.skipToContent') }}</a>
    <HeaderItem overlay show-announcement/>

    <main id="main-content" tabindex="-1">
      <component :is="heroVariant.component" :key="heroVariant.id" :status="serverStatus" :latest-slug="latestUpdate?.slug ?? null"/>
      <ProgressionStory/>

      <DeferredHomeChapter name="pathways">
        <component :is="pathwayVariant.component" :key="pathwayVariant.id" @selected="selectedPathway = $event"/>
      </DeferredHomeChapter>

      <DeferredHomeChapter name="world">
        <BeyondPathways :status="serverStatus" :latest-update="latestUpdate"/>
      </DeferredHomeChapter>

      <DeferredHomeChapter name="join" root-margin="1000px 0px">
        <JoinJourney :selected-pathway="selectedPathway"/>
      </DeferredHomeChapter>

      <CompanionMod/>
    </main>

    <FooterItem variant="full"/>
    <DailyBonusCat page="home"/>
    <VariantSwitcher :groups="variantGroups"/>
  </div>
</template>

<script setup lang="ts">
import {computed, defineAsyncComponent, onMounted, ref} from 'vue';
import HeaderItem from '@/components/layout/HeaderItem.vue';
import FooterItem from '@/components/layout/FooterItem.vue';
import DailyBonusCat from '@/components/ui/DailyBonusCat.vue';
import VariantSwitcher from '@/components/home/variants/VariantSwitcher.vue';
import {useHomeVariant} from '@/components/home/variants/useHomeVariant';
import {HERO_VARIANTS} from '@/components/home/variants/heroVariants';
import {PATHWAY_VARIANTS} from '@/components/home/variants/pathwayVariants';
import ProgressionStory from '@/components/home/ProgressionStoryV3.vue';
import DeferredHomeChapter from '@/components/home/DeferredHomeChapter.vue';
import CompanionMod from '@/components/home/CompanionMod.vue';
import type {NewsArticle} from '@/types/news';
import type {HomePathway} from '@/data/homePathways';
import {useSharedServerStatus} from '@/composables/useSharedServerStatus';
import {useI18n} from '@/composables/useI18n';
import {useSeo, videoGameLd} from '@/composables/useSeo';
import {useBeyonderStats} from '@/composables/useBeyonderStats';
import {newsAPI} from '@/utils/api/news';
import '@/assets/styles/home-theme.css';
import '@/assets/styles/homepage-layout.css';

const BeyondPathways = defineAsyncComponent(() => import('@/components/home/BeyondPathways.vue'));
const JoinJourney = defineAsyncComponent(() => import('@/components/home/JoinJourney.vue'));

const {t, locale} = useI18n();
const heroVariant = useHomeVariant('hero', HERO_VARIANTS);
const pathwayVariant = useHomeVariant('pathways', PATHWAY_VARIANTS);
const variantGroups = [
  {param: 'hero', label: 'Hero', variants: HERO_VARIANTS},
  {param: 'pathways', label: 'Pathways', variants: PATHWAY_VARIANTS},
];
const {totalBeyonders} = useBeyonderStats();

useSeo(() => ({
  // The home page owns the bare brand title; every other route appends it.
  title: null,
  description: t('homePage.heroTagline'),
  path: '/',
  imageAlt: 'Mysterria - a Lord of the Mysteries Minecraft server',
  jsonLd: [videoGameLd(totalBeyonders.value)],
}));

const latestNews = ref<NewsArticle[]>([]);
const selectedPathway = ref<HomePathway | null>(null);
const {status: serverStatus} = useSharedServerStatus();

const latestUpdate = computed(() => {
  const sorted = [...latestNews.value].sort(
      (a, b) =>
          new Date(b.publishedAt ?? b.createdAt).getTime()
          - new Date(a.publishedAt ?? a.createdAt).getTime(),
  );
  const update = sorted[0];
  return update ? {title: update.title, slug: update.slug, language: update.language} : null;
});

async function loadLatestNews() {
  try {
    const response = await newsAPI.getLatest(locale.value.articleLocale);
    latestNews.value = response.data;
  } catch {
    latestNews.value = [];
  }
}

onMounted(() => {
  void loadLatestNews();
});
</script>
