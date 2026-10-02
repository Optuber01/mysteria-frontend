import {computed, defineAsyncComponent, type Component} from 'vue';
import {useRoute} from 'vue-router';

export type HomeConcept = Readonly<{
  id: string;
  /** Short name shown in the preview switcher. */
  label: string;
  component: Component;
}>;

/*
 * Whole-homepage concepts. Each renders the full page (header, chapters,
 * footer) and owns its look. `?concept=<id>` picks one; the first is default.
 */
export const HOME_CONCEPTS: readonly HomeConcept[] = [
  {id: 'ascent', label: 'The Ascent', component: defineAsyncComponent(() => import('./ascent/AscentHome.vue'))},
  {id: 'arcana', label: 'The 22 Arcana', component: defineAsyncComponent(() => import('./arcana/ArcanaHome.vue'))},
  {id: 'broadcast', label: 'Live from Mysterria', component: defineAsyncComponent(() => import('./broadcast/BroadcastHome.vue'))},
];

export function useHomeConcept() {
  const route = useRoute();
  return computed(() => HOME_CONCEPTS.find(concept => concept.id === route.query.concept) ?? HOME_CONCEPTS[0]);
}

