import auroraCliffside from '@/assets/images/home/hero/hero-aurora-cliffside.webp';
import eyeRift from '@/assets/images/home/hero/hero-eye-rift.webp';
import radiantAwakening from '@/assets/images/home/hero/hero-radiant-awakening.webp';
import guardianDragon from '@/assets/images/home/hero/hero-guardian-dragon.webp';
import corruptedFrontier from '@/assets/images/home/hero/hero-corrupted-frontier.png';

export type HomeHeroSceneTheme = Readonly<{
  color: string;
  glow: string;
  accent: string;
}>;

export type HomeHeroSlide = Readonly<{
  src: string;
  position: string;
  mobilePosition: string;
  scale: number;
  saturation: number;
  brightness: number;
  contrast: number;
  label: string;
  sequence: string;
  theme: HomeHeroSceneTheme;
}>;

export const HOME_HERO_SLIDES = [
  {
    src: auroraCliffside,
    position: '64% 54%',
    mobilePosition: '67% 52%',
    scale: 1.02,
    saturation: 1.1,
    brightness: 1.08,
    contrast: 1.03,
    label: 'Aurora Cliffside',
    sequence: 'WORLD / 01',
    theme: { color: '#9e7eae', glow: '#edcebe', accent: '#8d6fe4' },
  },
  {
    src: eyeRift,
    position: '61% 56%',
    mobilePosition: '62% 52%',
    scale: 1.04,
    saturation: 1.14,
    brightness: 1.1,
    contrast: 1.05,
    label: 'The Eye Rift',
    sequence: 'RIFT / 02',
    theme: { color: '#344470', glow: '#ad65e0', accent: '#8873e8' },
  },
  {
    src: radiantAwakening,
    position: '58% 55%',
    mobilePosition: '59% 50%',
    scale: 1.03,
    saturation: 1.08,
    brightness: 1.04,
    contrast: 1.04,
    label: 'Sanctuary Awakening',
    sequence: 'RITE / 03',
    theme: { color: '#be8746', glow: '#ffde98', accent: '#ad7d39' },
  },
  {
    src: guardianDragon,
    position: '59% 53%',
    mobilePosition: '60% 50%',
    scale: 1.01,
    saturation: 1.12,
    brightness: 1.06,
    contrast: 1.04,
    label: 'The Guardian’s Trial',
    sequence: 'FIELD / 04',
    theme: { color: '#386678', glow: '#e2a462', accent: '#a66b43' },
  },
  {
    src: corruptedFrontier,
    position: '61% 64%',
    mobilePosition: '62% 60%',
    scale: 1.03,
    saturation: 1.13,
    brightness: 1.03,
    contrast: 1.05,
    label: 'The Corrupted Frontier',
    sequence: 'EVENT / 05',
    theme: { color: '#70416e', glow: '#e1755b', accent: '#9b6dd3' },
  },
] as const satisfies readonly HomeHeroSlide[];
