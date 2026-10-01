import { onMounted, onUnmounted, readonly, ref, watch, type Ref } from 'vue';

type ElementScrollProgressOptions = {
  rootMargin?: string;
  disabled?: Readonly<Ref<boolean>>;
};

export function useElementScrollProgress(
  target: Ref<HTMLElement | null>,
  options: ElementScrollProgressOptions = {},
) {
  const progress = ref(0);
  const inView = ref(false);

  let observer: IntersectionObserver | null = null;
  let frame = 0;

  function measure() {
    frame = 0;
    if (!target.value || options.disabled?.value) return;

    const bounds = target.value.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const travel = Math.max(1, bounds.height - viewportHeight);
    progress.value = Math.min(1, Math.max(0, -bounds.top / travel));
  }

  function refresh() {
    if (frame || !inView.value || options.disabled?.value) return;
    frame = window.requestAnimationFrame(measure);
  }

  watch(
    () => options.disabled?.value ?? false,
    (disabled) => {
      if (disabled) {
        progress.value = 0;
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        return;
      }
      refresh();
    },
  );

  onMounted(() => {
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => {
        inView.value = entry.isIntersecting;
        if (entry.isIntersecting) {
          refresh();
          return;
        }

        if (entry.boundingClientRect.bottom <= 0) progress.value = 1;
        else if (entry.boundingClientRect.top >= window.innerHeight) progress.value = 0;
      }, { rootMargin: options.rootMargin ?? '20% 0px' });
      if (target.value) observer.observe(target.value);
    } else {
      inView.value = true;
      refresh();
    }

    window.addEventListener('scroll', refresh, { passive: true });
    window.addEventListener('resize', refresh, { passive: true });
  });

  onUnmounted(() => {
    observer?.disconnect();
    window.removeEventListener('scroll', refresh);
    window.removeEventListener('resize', refresh);
    if (frame) window.cancelAnimationFrame(frame);
  });

  return {
    progress: readonly(progress),
    inView: readonly(inView),
    refresh,
  };
}
