<template>
  <div class="mysterria-home">
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <HeaderItem />

    <main id="main-content" tabindex="-1">
      <HomeHero :status="serverStatus" :latest-slug="latestUpdate?.slug ?? null" />
      <ProgressionStory />

      <DeferredHomeChapter name="pathways">
        <PathwayOrbit @selected="selectedPathway = $event" />
      </DeferredHomeChapter>

      <DeferredHomeChapter name="world">
        <BeyondPathways :status="serverStatus" :latest-update="latestUpdate" />
      </DeferredHomeChapter>

      <DeferredHomeChapter name="join" root-margin="1000px 0px">
        <JoinJourney :selected-pathway="selectedPathway" />
      </DeferredHomeChapter>
    </main>

    <FooterItem />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import HeaderItem from '@/components/layout/HeaderItem.vue';
import FooterItem from '@/components/layout/FooterItem.vue';
import HomeHero from '@/components/home/HomeHero.vue';
import ProgressionStory from '@/components/home/ProgressionStoryV3.vue';
import DeferredHomeChapter from '@/components/home/DeferredHomeChapter.vue';
import type { NewsArticle } from '@/types/news';
import type { HomePathway } from '@/data/pathways';
import { useSharedServerStatus } from '@/composables/useSharedServerStatus';
import '@/assets/styles/homepage-layout.css';

const PathwayOrbit = defineAsyncComponent(() => import('@/components/home/PathwayOrbit.vue'));
const BeyondPathways = defineAsyncComponent(() => import('@/components/home/BeyondPathways.vue'));
const JoinJourney = defineAsyncComponent(() => import('@/components/home/JoinJourney.vue'));

const latestNews = ref<NewsArticle[]>([]);
const selectedPathway = ref<HomePathway | null>(null);
const { status: serverStatus } = useSharedServerStatus();

const latestUpdate = computed(() => {
  const sorted = [...latestNews.value].sort(
    (a, b) =>
      new Date(b.publishedAt ?? b.createdAt).getTime()
      - new Date(a.publishedAt ?? a.createdAt).getTime(),
  );
  const update = sorted[0];
  return update ? { title: update.title, slug: update.slug } : null;
});

async function loadLatestNews() {
  try {
    const { newsAPI } = await import('@/utils/api/news');
    const storedLanguage = localStorage.getItem('mysterria-language');
    const language = storedLanguage === 'uk' ? 'uk' : 'en';
    const response = await newsAPI.getLatest(language);
    latestNews.value = response.data;
  } catch {
    latestNews.value = [];
  }
}

onMounted(() => {
  document.title = 'Mysterria — Lord of the Mysteries Minecraft RPG Server';
  const description =
    'Brew potions, complete rituals and unlock Pathway abilities in Mysterria, a Lord of the Mysteries-inspired Minecraft RPG server.';
  const descriptionTag = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (descriptionTag) descriptionTag.content = description;

  void loadLatestNews();
});
</script>
