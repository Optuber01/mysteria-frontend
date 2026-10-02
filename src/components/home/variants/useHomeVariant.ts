import {computed, type Component} from 'vue';
import {useRoute} from 'vue-router';

export type HomeVariant = Readonly<{
  id: string;
  /** Short name shown in the preview switcher. */
  label: string;
  component: Component;
}>;

/**
 * Picks a design variant from the query string (`?hero=lens`), falling back to
 * the first entry. Lets one preview deployment compare several directions.
 */
export function useHomeVariant(param: string, variants: readonly HomeVariant[]) {
  const route = useRoute();
  return computed(() => {
    const wanted = route.query[param];
    return variants.find(variant => variant.id === wanted) ?? variants[0];
  });
}
