import {onMounted} from 'vue';

/**
 * Loads a concept's Google Fonts stylesheet once, on first use, so each
 * concept can pick its own type without touching index.html.
 */
export function useConceptFonts(href: string) {
  onMounted(() => {
    if (document.head.querySelector(`link[data-concept-font="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.conceptFont = href;
    document.head.append(link);
  });
}
