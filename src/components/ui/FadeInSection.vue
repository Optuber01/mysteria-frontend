<template>
  <div
      ref="sectionRef"
      :style="{ transitionDelay: `${Math.min(Math.max(Number(delay) || 0, 0), 260)}ms` }"
      class="fade-section"
  >
    <slot/>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, ref} from "vue";

interface Props {
  delay?: string | number;
}

const {delay = 0} = defineProps<Props>();

const sectionRef = ref<HTMLElement>();

let observer: IntersectionObserver | null = null;

onMounted(() => {
  if (!sectionRef.value) return;

  observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            // Clean up immediately after animation triggers
            observer?.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      },
  );

  observer.observe(sectionRef.value);
});

// Ensure proper cleanup on component unmount
onUnmounted(() => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
});
</script>

<style scoped>
.fade-section {
  transition: opacity var(--motion-slow) var(--ease-enter);
}
</style>
