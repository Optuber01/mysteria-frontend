import { onMounted, onUnmounted, readonly, ref } from 'vue';

export function useReducedMotion() {
  const prefersReducedMotion = ref(false);
  let query: MediaQueryList | null = null;

  const update = () => {
    prefersReducedMotion.value = query?.matches ?? false;
  };

  onMounted(() => {
    query = window.matchMedia('(prefers-reduced-motion: reduce)');
    update();
    query.addEventListener('change', update);
  });

  onUnmounted(() => query?.removeEventListener('change', update));

  return readonly(prefersReducedMotion);
}
