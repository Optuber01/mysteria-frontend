<template>
  <section
    :id="ready ? undefined : name"
    ref="chapterRef"
    class="home-chapter"
    :class="[`home-chapter--${name}`, { 'is-pending': !ready }]"
    :aria-busy="ready ? undefined : 'true'"
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
import { onMounted, onUnmounted, ref } from 'vue';

type ChapterName = 'pathways' | 'world' | 'join';

const props = withDefaults(defineProps<{
  name: ChapterName;
  rootMargin?: string;
}>(), {
  rootMargin: '1400px 0px',
});

const chapterRef = ref<HTMLElement | null>(null);
const ready = ref(false);
let observer: IntersectionObserver | null = null;

onMounted(() => {
  if (!('IntersectionObserver' in window)) {
    ready.value = true;
    return;
  }

  observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    ready.value = true;
    observer?.disconnect();
    observer = null;
  }, { rootMargin: props.rootMargin });

  if (chapterRef.value) observer.observe(chapterRef.value);
});

onUnmounted(() => observer?.disconnect());
</script>

<style scoped>
.home-chapter {
  position: relative;
  min-width: 0;
  border-top: 1px solid color-mix(in srgb, var(--ink) 7%, transparent);
}

.home-chapter.is-pending {
  display: grid;
  place-items: center;
}

.home-chapter--pathways.is-pending {
  min-height: clamp(760px, 150svh, 1500px);
  background: var(--journey-mid);
}

.home-chapter--world.is-pending {
  min-height: clamp(860px, 210svh, 2000px);
  background: var(--journey-mid);
}

.home-chapter--join.is-pending {
  min-height: clamp(620px, 100svh, 980px);
  background: var(--journey-end);
}

.home-chapter__placeholder {
  position: sticky;
  top: 0;
  width: min(720px, calc(100% - var(--home-content-gutter, 20px) * 2));
  height: 100svh;
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

.home-chapter__placeholder i {
  width: 88px;
  height: 8px;
}

.home-chapter__placeholder span {
  width: min(440px, 64vw);
  height: 22px;
}

.home-chapter__placeholder b {
  width: min(320px, 48vw);
  height: 8px;
}

@media (max-width: 900px), (max-height: 700px) {
  .home-chapter--pathways.is-pending,
  .home-chapter--world.is-pending,
  .home-chapter--join.is-pending {
    min-height: clamp(560px, 88svh, 820px);
  }

  .home-chapter__placeholder {
    position: relative;
    height: auto;
    min-height: inherit;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-chapter__placeholder { opacity: .36; }
}
</style>
