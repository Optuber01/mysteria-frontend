import auroraCliffside from '@/assets/images/home/hero/hero-aurora-cliffside.webp';
import eyeRift from '@/assets/images/home/hero/hero-eye-rift.webp';
import radiantAwakening from '@/assets/images/home/hero/hero-radiant-awakening.webp';
import guardianDragon from '@/assets/images/home/hero/hero-guardian-dragon.webp';
import corruptedFrontier from '@/assets/images/home/hero/hero-corrupted-frontier.webp';

export type HomeHeroSlide = Readonly<{
  src: string;
  position: string;
  /** i18n key for the scene name shown in the hero caption. */
  labelKey: string;
  /** i18n key for the short scene tag beside the caption ("World / 01"). */
  sequenceKey: string;
}>;

export const HOME_HERO_SLIDES = [
  {
    src: auroraCliffside,
    position: '64% 54%',
    labelKey: 'home.hero.slides.auroraCliffside.label',
    sequenceKey: 'home.hero.slides.auroraCliffside.sequence',
  },
  {
    src: eyeRift,
    position: '61% 56%',
    labelKey: 'home.hero.slides.eyeRift.label',
    sequenceKey: 'home.hero.slides.eyeRift.sequence',
  },
  {
    src: radiantAwakening,
    position: '58% 55%',
    labelKey: 'home.hero.slides.sanctuaryAwakening.label',
    sequenceKey: 'home.hero.slides.sanctuaryAwakening.sequence',
  },
  {
    src: guardianDragon,
    position: '59% 53%',
    labelKey: 'home.hero.slides.guardianTrial.label',
    sequenceKey: 'home.hero.slides.guardianTrial.sequence',
  },
  {
    src: corruptedFrontier,
    position: '61% 64%',
    labelKey: 'home.hero.slides.corruptedFrontier.label',
    sequenceKey: 'home.hero.slides.corruptedFrontier.sequence',
  },
] as const satisfies readonly HomeHeroSlide[];
