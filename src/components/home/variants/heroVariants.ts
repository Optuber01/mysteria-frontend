import {defineAsyncComponent} from 'vue';
import HomeHero from '@/components/home/HomeHero.vue';
import type {HomeVariant} from './useHomeVariant';

/* Every hero takes the same props as HomeHero: `status` and `latestSlug`. */
export const HERO_VARIANTS: readonly HomeVariant[] = [
  {id: 'lens', label: 'Spirit Vision', component: HomeHero},
  {id: 'sefirah', label: 'Above the Gray Fog', component: defineAsyncComponent(() => import('./hero/HeroSefirah.vue'))},
  {id: 'tarot', label: 'The Tarot Club', component: defineAsyncComponent(() => import('./hero/HeroTarot.vue'))},
  {id: 'gazette', label: 'Crimson Moon Gazette', component: defineAsyncComponent(() => import('./hero/HeroGazette.vue'))},
];
