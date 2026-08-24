<template>
  <div class="mysterria-home">
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <HeaderItem />
    <main id="main-content" tabindex="-1">
      <HomeHero :status="serverStatus" :latest-slug="latestUpdate?.slug ?? null" />
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
        <JoinJourney v-if="joinReady" :selected-pathway="selectedPathway" />
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
import type { NewsArticle } from '@/types/news';
import type { HomePathway } from '@/data/pathways';
import { useSharedServerStatus } from '@/composables/useSharedServerStatus';

const latestNews = ref<NewsArticle[]>([]);
const selectedPathway = ref<HomePathway | null>(null);
const pathwayReady = ref(false);
const worldReady = ref(false);
const joinReady = ref(false);
const { status: serverStatus } = useSharedServerStatus();
const pathwayTrigger = ref<HTMLElement | null>(null);
const worldTrigger = ref<HTMLElement | null>(null);
const joinTrigger = ref<HTMLElement | null>(null);
let chapterObserver: IntersectionObserver | null = null;

const PathwayOrbit = defineAsyncComponent(() => import('@/components/home/PathwayOrbit.vue'));
const ProgressionStory = defineAsyncComponent(() => import('@/components/home/ProgressionStoryV3.vue'));
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

  // Resolve the CTA against the latest published entry before the hero is
  // interactive, instead of waiting for the lower world chapter to enter view.
  void loadLatestNews();

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
  chapterObserver?.disconnect();
  window.removeEventListener('keydown', revealAllChapters);
});
</script>

<style scoped>
.mysterria-home {
  min-width: 0;
  min-height: 100vh;
  color: var(--ink);
  background: linear-gradient(180deg, var(--journey-top) 0%, var(--journey-mid) 55%, var(--journey-end) 100%);
  font-family: var(--font-body);
}

.mysterria-home :deep(button),
.mysterria-home :deep(a) {
  -webkit-tap-highlight-color: transparent;
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
  color: var(--ink);
  background: var(--surface);
  font-size: .78rem;
  font-weight: 750;
  transform: translateY(-150%);
}

.skip-link:focus { transform: none; }
.skip-link:focus-visible { outline: 3px solid var(--primary); outline-offset: 3px; }

.deferred-chapter { min-width: 0; }
.deferred-chapter--pathways.is-pending { min-height: 290svh; background: var(--journey-mid); }
.deferred-chapter--world.is-pending { min-height: 610svh; background: var(--journey-mid); }
.deferred-chapter--join.is-pending { min-height: 120svh; background: var(--journey-end); }

/* Keep each chapter on the same visual grid while async sections arrive. */
.deferred-chapter {
  position: relative;
  overflow: clip;
  border-top: 1px solid color-mix(in srgb, var(--ink) 7%, transparent);
}

.mysterria-home :deep(.pathway-vault),
.mysterria-home :deep(.progression-v3),
.mysterria-home :deep(.world-story),
.mysterria-home :deep(.join-threshold) {
  font-family: var(--font-body);
}

.mysterria-home :deep(h1),
.mysterria-home :deep(h2),
.mysterria-home :deep(h3) {
  max-width: 100%;
  overflow-wrap: anywhere;
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
