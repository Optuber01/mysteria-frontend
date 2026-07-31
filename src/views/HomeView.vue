<template>
  <div class="mysterria-home">
    <HeaderItem />
    <main>
      <HomeHero :status="serverStatus" />
      <ProgressionStory />
      <SystemChapters />
      <PathwayOrbit />
      <BeyondPathways />
      <LivingWorld :status="serverStatus" :latest-update="latestUpdate" />
      <JoinJourney />
    </main>
    <FooterItem />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import HeaderItem from '@/components/layout/HeaderItem.vue';
import FooterItem from '@/components/layout/FooterItem.vue';
import HomeHero from '@/components/home/HomeHero.vue';
import ProgressionStory from '@/components/home/ProgressionStory.vue';
import SystemChapters from '@/components/home/SystemChapters.vue';
import PathwayOrbit from '@/components/home/PathwayOrbit.vue';
import BeyondPathways from '@/components/home/BeyondPathways.vue';
import LivingWorld from '@/components/home/LivingWorld.vue';
import JoinJourney from '@/components/home/JoinJourney.vue';
import { newsAPI } from '@/utils/api/news';
import type { NewsArticle } from '@/types/news';
import { useI18n } from '@/composables/useI18n';
import { getServerStatus, type ServerStatus } from '@/services/serverStatus';

const { currentLanguage } = useI18n();
const latestNews = ref<NewsArticle[]>([]);
const serverStatus = ref<ServerStatus>({
  state: 'loading',
  playersOnline: null,
  checkedAt: null,
});
let pollTimer: ReturnType<typeof setInterval> | null = null;
let controller: AbortController | null = null;

const latestUpdate = computed(() => {
  const sorted = [...latestNews.value].sort(
    (a, b) =>
      new Date(b.publishedAt ?? b.createdAt).getTime() -
      new Date(a.publishedAt ?? a.createdAt).getTime(),
  );
  const update = sorted[0];
  return update ? { title: update.title, slug: update.slug } : null;
});

async function refreshStatus() {
  controller?.abort();
  controller = new AbortController();
  try {
    serverStatus.value = await getServerStatus(controller.signal);
  } catch (error) {
    if (!(error instanceof DOMException && error.name === 'AbortError')) {
      serverStatus.value = {
        state: 'unavailable',
        playersOnline: null,
        checkedAt: new Date(),
      };
    }
  }
}

onMounted(async () => {
  document.title = 'Mysterria — Lord of the Mysteries Minecraft RPG Server';
  const description =
    'Brew potions, complete rituals and unlock Pathway abilities in Mysterria, a Lord of the Mysteries-inspired Minecraft RPG server.';
  const descriptionTag = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (descriptionTag) descriptionTag.content = description;

  void refreshStatus();
  pollTimer = setInterval(() => {
    if (document.visibilityState === 'visible') void refreshStatus();
  }, 60_000);

  try {
    const response = await newsAPI.getLatest(currentLanguage.value);
    latestNews.value = response.data;
  } catch {
    latestNews.value = [];
  }
});

onUnmounted(() => {
  controller?.abort();
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<style scoped>
.mysterria-home {
  min-width: 0;
  min-height: 100vh;
  color: #102924;
  background: #08151a;
  font-family: "Manrope", sans-serif;
}

.mysterria-home :deep(button),
.mysterria-home :deep(a) {
  -webkit-tap-highlight-color: transparent;
}

.mysterria-home :deep(:focus-visible) {
  outline: 2px solid #c69b52;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .mysterria-home :deep(*) {
    scroll-behavior: auto !important;
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
}
</style>
