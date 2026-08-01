<template>
  <div class="mysterria-home">
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <HeaderItem />
    <main id="main-content" tabindex="-1">
      <HomeHero :status="serverStatus" />
      <ProgressionStory />
      <div
        ref="pathwayTrigger"
        class="deferred-chapter deferred-chapter--pathways"
        :class="{ 'is-pending': !pathwayReady }"
        :aria-busy="!pathwayReady"
      >
        <PathwayOrbit v-if="pathwayReady" @selected="selectedPathway = $event" />
      </div>
      <div
        ref="worldTrigger"
        class="deferred-chapter deferred-chapter--world"
        :class="{ 'is-pending': !worldReady }"
        :aria-busy="!worldReady"
      >
        <BeyondPathways v-if="worldReady" :status="serverStatus" :latest-update="latestUpdate" />
      </div>
      <div
        ref="joinTrigger"
        class="deferred-chapter deferred-chapter--join"
        :class="{ 'is-pending': !joinReady }"
        :aria-busy="!joinReady"
      >
        <JoinJourney v-if="joinReady" />
      </div>
    </main>
    <FooterItem />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue';
import HeaderItem from '@/components/layout/HeaderItem.vue';
import FooterItem from '@/components/layout/FooterItem.vue';
import HomeHero from '@/components/home/HomeHero.vue';
import ProgressionStory from '@/components/home/ProgressionStoryV2.vue';
import type { NewsArticle } from '@/types/news';
import { useSharedServerStatus } from '@/composables/useSharedServerStatus';

const latestNews = ref<NewsArticle[]>([]);
const selectedPathway = ref('Fool');
const pathwayReady = ref(false);
const worldReady = ref(false);
const joinReady = ref(false);
const { status: serverStatus } = useSharedServerStatus();
const pathwayTrigger = ref<HTMLElement | null>(null);
const worldTrigger = ref<HTMLElement | null>(null);
const joinTrigger = ref<HTMLElement | null>(null);
let newsObserver: IntersectionObserver | null = null;
let chapterObserver: IntersectionObserver | null = null;

const PathwayOrbit = defineAsyncComponent(() => import('@/components/home/PathwayOrbit.vue'));
const BeyondPathways = defineAsyncComponent(() => import('@/components/home/BeyondPathways.vue'));
const JoinJourney = defineAsyncComponent(() => import('@/components/home/JoinJourney.vue'));

const latestUpdate = computed(() => {
  const sorted = [...latestNews.value].sort(
    (a, b) =>
      new Date(b.publishedAt ?? b.createdAt).getTime() -
      new Date(a.publishedAt ?? a.createdAt).getTime(),
  );
  const update = sorted[0];
  return update ? { title: update.title, slug: update.slug } : null;
});

async function loadLatestNews() {
  newsObserver?.disconnect();
  newsObserver = null;
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

function revealAllChapters() {
  pathwayReady.value = true;
  worldReady.value = true;
  joinReady.value = true;
  chapterObserver?.disconnect();
}

onMounted(() => {
  document.title = 'Mysterria — Lord of the Mysteries Minecraft RPG Server';
  const description =
    'Brew potions, complete rituals and unlock Pathway abilities in Mysterria, a Lord of the Mysteries-inspired Minecraft RPG server.';
  const descriptionTag = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (descriptionTag) descriptionTag.content = description;

  newsObserver = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) void loadLatestNews();
  }, { rootMargin: '1200px 0px' });
  if (worldTrigger.value) newsObserver.observe(worldTrigger.value);

  chapterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (entry.target === pathwayTrigger.value) pathwayReady.value = true;
      if (entry.target === worldTrigger.value) worldReady.value = true;
      if (entry.target === joinTrigger.value) joinReady.value = true;
      chapterObserver?.unobserve(entry.target);
    });
  }, { rootMargin: '1400px 0px' });
  [pathwayTrigger.value, worldTrigger.value, joinTrigger.value].forEach((element) => {
    if (element) chapterObserver?.observe(element);
  });
  window.addEventListener('keydown', revealAllChapters, { once: true });
});

onUnmounted(() => {
  newsObserver?.disconnect();
  chapterObserver?.disconnect();
  window.removeEventListener('keydown', revealAllChapters);
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
  outline: 3px solid #071f1d;
  outline-offset: 3px;
  box-shadow: 0 0 0 2px #fcf9f2;
}

.skip-link {
  position: fixed;
  z-index: 2000;
  left: 12px;
  top: 10px;
  min-height: 44px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-radius: 9px;
  color: #102924;
  background: #fcf9f2;
  font-size: .78rem;
  font-weight: 750;
  transform: translateY(-150%);
}

.skip-link:focus { transform: none; }

.deferred-chapter { min-width: 0; }
.deferred-chapter--pathways.is-pending { min-height: 420svh; background: #102420; }
.deferred-chapter--world.is-pending { min-height: 690svh; background: #0d1f22; }
.deferred-chapter--join.is-pending { min-height: 430svh; background: #071416; }

@media (prefers-reduced-motion: reduce) {
  .mysterria-home :deep(*) {
    scroll-behavior: auto !important;
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
}
</style>
