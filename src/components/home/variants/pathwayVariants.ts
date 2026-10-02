import {defineAsyncComponent} from 'vue';
import type {HomeVariant} from './useHomeVariant';

/* Every pathway chapter renders a section with id="pathways" and emits
   `selected` with a HomePathway, like PathwayOrbit. */
export const PATHWAY_VARIANTS: readonly HomeVariant[] = [
  {id: 'tarot', label: 'Tarot table', component: defineAsyncComponent(() => import('@/components/home/PathwayOrbit.vue'))},
];
