import HomeHero from '@/components/home/HomeHero.vue';
import type {HomeVariant} from './useHomeVariant';

/* Every hero takes the same props as HomeHero: `status` and `latestSlug`. */
export const HERO_VARIANTS: readonly HomeVariant[] = [
  {id: 'lens', label: 'Spirit Vision', component: HomeHero},
];
