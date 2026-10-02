<template>
  <section
    :id="ready ? undefined : name"
    ref="chapterRef"
    class="home-chapter"
    :class="[`home-chapter--${name}`, { 'is-reserved': !settled, 'is-pending': !ready, 'has-season': hasSeason }]"
    :style="reservedStyle"
    :aria-busy="settled ? undefined : 'true'"
    :tabindex="ready ? undefined : 0"
    :aria-label="ready ? undefined : t('home.deferred.loading')"
    @focus="onPlaceholderFocus"
  >
    <slot v-if="ready" />
    <div v-else class="home-chapter__placeholder" aria-hidden="true">
      <i />
      <span />
      <b />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from '@/composables/useI18n';
import { useBeyonderStats } from '@/composables/useBeyonderStats';

type ChapterName = 'pathways' | 'world' | 'join';

const props = withDefaults(defineProps<{
  name: ChapterName;
  rootMargin?: string;
}>(), {
  rootMargin: '1400px 0px',
});

/**
 * Real heights from the last time this chapter mounted at this exact viewport,
 * so a return visit reserves the precise height. First visits fall back to the
 * per-layout CSS estimates below.
 */
const HEIGHT_CACHE_KEY = 'mysterria-home-chapter-heights-v1';
const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

const { t } = useI18n();
const { stats } = useBeyonderStats();
/** The world chapter's ledger gains a row of season figures when stats exist. */
const hasSeason = computed(() => props.name === 'world' && (stats.value?.totalBeyonders ?? 0) > 0);
const chapterRef = ref<HTMLElement | null>(null);
const ready = ref(false);
/** False until the slot has painted real content; the reservation holds until then. */
const settled = ref(false);
const cachedHeight = ref<number | null>(null);
let observer: IntersectionObserver | null = null;
let mutations: MutationObserver | null = null;
let settleFrame = 0;
let focusWhenSettled = false;

const viewportKey = () => `${props.name}:${window.innerWidth}x${window.innerHeight}`;

const reservedStyle = computed(() =>
  !settled.value && cachedHeight.value ? { minHeight: `${cachedHeight.value}px` } : undefined,
);

function readCache(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(HEIGHT_CACHE_KEY) ?? '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

function writeCache(height: number) {
  try {
    sessionStorage.setItem(HEIGHT_CACHE_KEY, JSON.stringify({ ...readCache(), [viewportKey()]: height }));
  } catch {
    // Storage blocked: the CSS estimate still applies next time.
  }
}

function settle() {
  settled.value = true;
  mutations?.disconnect();
  mutations = null;
  void nextTick(() => {
    const element = chapterRef.value;
    if (!element) return;
    writeCache(element.offsetHeight);
    if (!focusWhenSettled) return;
    focusWhenSettled = false;
    const target = [...element.querySelectorAll<HTMLElement>(FOCUSABLE)].find((candidate) =>
      candidate.tabIndex >= 0
      && candidate.getClientRects().length > 0
      && getComputedStyle(candidate).visibility === 'visible');
    if (target) target.focus();
    else {
      element.tabIndex = -1;
      element.focus();
    }
  });
}

/** Async chapters render an empty comment until their chunk arrives; wait for an element. */
function watchForContent() {
  const element = chapterRef.value;
  if (!element) return;
  const check = () => {
    if (settleFrame || !element.firstElementChild || element.firstElementChild.classList.contains('home-chapter__placeholder')) return;
    // One frame for the chapter's own layout and media dimensions to apply.
    settleFrame = requestAnimationFrame(() => {
      settleFrame = 0;
      settle();
    });
  };
  mutations = new MutationObserver(check);
  mutations.observe(element, { childList: true });
  void nextTick(check);
}

function reveal() {
  if (ready.value) return;
  ready.value = true;
  observer?.disconnect();
  observer = null;
  watchForContent();
}

/**
 * Keyboard users reach the placeholder with Tab; mount only this chapter and
 * hand focus to its first control once it exists.
 */
function onPlaceholderFocus(event: FocusEvent) {
  if (ready.value || event.target !== chapterRef.value) return;
  focusWhenSettled = true;
  reveal();
}

onMounted(() => {
  cachedHeight.value = readCache()[viewportKey()] ?? null;

  if (!('IntersectionObserver' in window)) {
    reveal();
    return;
  }

  observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) reveal();
  }, { rootMargin: props.rootMargin });

  if (chapterRef.value) observer.observe(chapterRef.value);
});

onUnmounted(() => {
  observer?.disconnect();
  mutations?.disconnect();
  if (settleFrame) cancelAnimationFrame(settleFrame);
});
</script>

<style scoped>
.home-chapter {
  position: relative;
  min-width: 0;
}

.home-chapter.is-pending {
  display: grid;
  justify-items: center;
  align-items: start;
}

.home-chapter.is-pending:focus-visible {
  outline: 2px solid var(--crimson-text);
  outline-offset: -6px;
}

.home-chapter.is-reserved { background: var(--fog-0); }

/*
 * First-visit reservations, fitted to each chapter's measured height so the
 * document barely moves when real content replaces the placeholder. Each band
 * follows the chapter's own layout switch:
 * - pathways (PathwayOrbit): table above 899px wide, card rail below
 * - world (BeyondPathways): three files in a row above 960px (ledger in two
 *   columns above 1100px), file beside print to 641px, then stacked; the
 *   ledger's season row adds --season when stats exist
 * - join (JoinJourney): at least one viewport tall
 * Re-measure after changing any of those chapters.
 */
.home-chapter--pathways.is-reserved { min-height: calc(650px + 50vh); }
.home-chapter--world { --season-row: 157px; --season: 0px; }
.home-chapter--world.has-season { --season: var(--season-row); }
.home-chapter--world.is-reserved { min-height: calc(1039px + 35vh + var(--season)); }
.home-chapter--join.is-reserved { min-height: max(100svh, 860px); }

@media (max-width: 1320px) {
  .home-chapter--join.is-reserved { min-height: max(100svh, 840px); }
}

@media (max-width: 1100px) {
  .home-chapter--world { --season-row: 210px; }
  .home-chapter--world.is-reserved { min-height: calc(1080px + 35vh + var(--season)); }
}

@media (max-width: 960px) {
  .home-chapter--world { --season-row: 222px; }
  .home-chapter--world.is-reserved { min-height: calc(2517px - 108vw + 35vh + var(--season)); }
  .home-chapter--join.is-reserved { min-height: max(100svh, 1340px); }
}

@media (max-width: 899px) {
  .home-chapter--pathways.is-reserved { min-height: max(1340px, 1256px + 20vw); }
}

@media (max-width: 640px) {
  .home-chapter--world { --season-row: 400px; }
  .home-chapter--world.is-reserved { min-height: calc(max(2610px, 1960px + 137vw) + var(--season)); }
}

@media (max-width: 560px) {
  .home-chapter--join.is-reserved { min-height: max(1300px, 2016px - 167vw); }
}

.home-chapter__placeholder {
  position: sticky;
  top: 0;
  width: min(720px, calc(100% - var(--home-content-gutter, 20px) * 2));
  height: 100svh;
  max-height: 100%;
  min-height: 560px;
  display: grid;
  place-content: center;
  gap: 14px;
  opacity: .48;
}

.home-chapter__placeholder i,
.home-chapter__placeholder span,
.home-chapter__placeholder b {
  display: block;
  border-radius: 999px;
  background: var(--line-strong);
}

.home-chapter__placeholder i { width: 88px; height: 8px; }
.home-chapter__placeholder span { width: min(440px, 64vw); height: 22px; }
.home-chapter__placeholder b { width: min(320px, 48vw); height: 8px; }

@media (prefers-reduced-motion: reduce) {
  .home-chapter__placeholder { opacity: .36; }
}
</style>
