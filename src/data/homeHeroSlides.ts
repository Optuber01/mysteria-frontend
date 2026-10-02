import eyeRift from '@/assets/images/home/hero/hero-eye-rift.webp';
import cathedral from '@/assets/images/community-archive/churches/great-cathedral/cathedral-exterior.webp';
import guardianDragon from '@/assets/images/home/hero/hero-guardian-dragon.webp';
import auroraCliffside from '@/assets/images/home/hero/hero-aurora-cliffside.webp';

export type HomeHeroSlide = Readonly<{
  id: string;
  src: string;
  /** object-position for the capture, so the subject stays clear of the copy. */
  position: string;
  /** Where the Spirit Vision lens rests when no pointer is steering it (% of the stage). */
  focus: Readonly<{ x: number; y: number }>;
}>;

/* Copy for each scene lives under home.hero.scenes.<id>.{label,place}. */
export const HOME_HERO_SLIDES: readonly HomeHeroSlide[] = [
  {id: 'eyeRift', src: eyeRift, position: '50% 42%', focus: {x: 66, y: 44}},
  {id: 'cathedral', src: cathedral, position: '50% 30%', focus: {x: 56, y: 52}},
  {id: 'guardian', src: guardianDragon, position: '40% 50%', focus: {x: 62, y: 46}},
  {id: 'cliffside', src: auroraCliffside, position: '62% 54%', focus: {x: 70, y: 52}},
];
