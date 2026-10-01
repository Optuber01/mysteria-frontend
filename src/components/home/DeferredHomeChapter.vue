<template>
  <section
    :id="ready ? undefined : name"
    ref="chapterRef"
    class="home-chapter"
    :class="[`home-chapter--${name}`, { 'is-reserved': !settled, 'is-pending': !ready }]"
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
  border-top: 1px solid color-mix(in srgb, var(--ink) 7%, transparent);
}

.home-chapter.is-pending {
  display: grid;
  justify-items: center;
  align-items: start;
}

.home-chapter.is-pending:focus-visible {
  outline: 3px solid var(--primary);
  outline-offset: -6px;
}

/*
 * Reservations mirror each chapter's own layout switch so the document does
 * not jump when the real content replaces the placeholder:
 * - pathways: PathwayOrbit pins for 210svh above 1050×720, else flows (~1.1–1.9k px)
 * - world: BeyondPathways pins for 460svh above 900×700, else flows
 * - join: JoinJourney is at least one viewport tall
 */
.home-chapter--pathways.is-reserved,
.home-chapter--world.is-reserved { background: var(--journey-mid); }
.home-chapter--join.is-reserved { background: var(--journey-end); }

.home-chapter--pathways.is-reserved { min-height: 210svh; }
.home-chapter--world.is-reserved { min-height: 460svh; }
.home-chapter--join.is-reserved { min-height: max(100svh, 1000px); }

@media (max-width: 1050px), (max-height: 720px), (prefers-reduced-motion: reduce) {
  .home-chapter--pathways.is-reserved { min-height: 1400px; }
}

/* BeyondPathways in document flow: fitted to measured heights with live stats loaded. */
@media (max-width: 900px), (max-height: 700px), (prefers-reduced-motion: reduce) {
  .home-chapter--world.is-reserved { min-height: calc(1758px + 95vw); }
}

@media (max-width: 900px) {
  .home-chapter--pathways.is-reserved { min-height: 1250px; }
  .home-chapter--world.is-reserved { min-height: calc(2007px + 67vw); }
}

@media (max-width: 700px) {
  .home-chapter--world.is-reserved { min-height: calc(1546px + 407vw); }
  .home-chapter--join.is-reserved { min-height: 1040px; }
}

@media (max-width: 560px) {
  .home-chapter--world.is-reserved { min-height: 3650px; }
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
  background: color-mix(in srgb, var(--ink) 8%, transparent);
}

.home-chapter__placeholder i { width: 88px; height: 8px; }
.home-chapter__placeholder span { width: min(440px, 64vw); height: 22px; }
.home-chapter__placeholder b { width: min(320px, 48vw); height: 8px; }

@media (prefers-reduced-motion: reduce) {
  .home-chapter__placeholder { opacity: .36; }
}
</style>
