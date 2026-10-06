/*
 * What each Pathway does to the page's world, beyond its accent: the hero's sky and
 * light, what hangs in the air, and how the same mood carries down the page (the potion
 * story's room and the ambient layer behind every section). Undrawn, and for anything
 * without an entry, the page keeps its own crimson night (DEFAULT_SCENE).
 *
 * Each entry is the Pathway's domain made weather, never a colour swap; the signature
 * moments (signatures/*.vue) add what a preset can't.
 */
import {cardById} from './arcana-data';

export type WeatherKind =
  | 'rain' | 'snow' | 'ash' | 'embers' | 'sparks' | 'petals' | 'leaves' | 'feathers'
  | 'fireflies' | 'wisps' | 'bubbles' | 'stars' | 'motes' | 'glitch'
  | 'bats' | 'pages' | 'moths' | 'dust';

/**
 * What hangs over Backlund: the crimson moon, a sun (risen or at the horizon), nothing to
 * see, or 'keep': whatever the last card left up there (a Pathway with no claim on the sky
 * acts on the body that is there; Error steals the sun if the sun was up, and gives back
 * the sun). Only Pathways with a claim change it: Sun (the sun), Twilight Giant (the dusk
 * sun), Tyrant (cloud), and the crimson moon's own (Darkness, Mother, Moon, Chained, Door).
 */
export type Celestial = 'moon' | 'sun' | 'dusk' | 'hidden' | 'keep';

export type Scene = {
  /** The sky's grade, laid over the night photo (a CSS background). */
  sky: string;
  celestial: Celestial;
  /** A filter on the moon disc (pale, darkened...) when it stays up. */
  moonFilter?: string;
  /** The moon's size against the default (Moon: the full crimson moon swells). */
  moonScale?: number;
  /** Light caught on the castle's edges, and the fog's colour. */
  cityLight: string;
  fog: string;
  /** 0..1: how much fog drifts over the moon and the streets. */
  fogAmount: number;
  /** The whole scene darkened by this much (Darkness, Death). */
  shade?: number;
  weather?: WeatherKind;
  weatherColor?: string;
  weatherDensity?: number;
  /** In front of the city (rain, ash, petals) or behind it (stars, far wisps). */
  weatherFront?: boolean;
  lightning?: boolean;
  /** Cloud banks rolling over the top of the sky: their colour and how thick (0..1). */
  clouds?: {color: string; amount: number};
  /** The page behind every section: a wash at the top of the window. */
  wash?: string;
};

export const DEFAULT_SCENE: Scene = {
  sky: 'transparent',
  celestial: 'moon',
  cityLight: '#b3202b',
  fog: '#d9d5de',
  fogAmount: 1,
};

const g = (top: string, mid: string, bottom = 'transparent') => `linear-gradient(180deg, ${top} 0%, ${mid} 48%, ${bottom} 100%)`;

/*
 * Values from the research brief (/tmp/r20/pathways-brief.md, "Mapping to pathwayScenes.ts").
 * The cross-scene rules hold here: fire only for Red Priest (war fire on the horizon), Abyss
 * (sulfur from below) and Demoness (black flame and frost); storms only for Tyrant; Darkness
 * is silence (no particles); the crimson moon is intensified only by those with a claim on
 * it (Darkness, Mother, Moon, Chained, Door) and hidden, changed or set by the rest.
 */
export const PATHWAY_SCENES: Record<string, Scene> = {
  // the gray fog rises out of the streets until only the spires stand above it; crimson stars pulse in it like prayers
  fool: {sky: g('rgba(110, 110, 122, .6)', 'rgba(80, 80, 92, .4)'), celestial: 'keep', moonFilter: 'blur(2px) brightness(.55) saturate(.6)', cityLight: '#9a97a3', fog: '#c9c6cf', fogAmount: 2.2, shade: .05, weather: 'stars', weatherColor: '#c8323c', weatherDensity: .08, wash: 'radial-gradient(120% 60% at 50% 0%, rgba(150, 150, 165, .14), transparent 70%)'},
  // a clear ink-blue cosmos, the full moon Mr. Door calls under, stars that blink across the sky
  door: {sky: g('rgba(10, 21, 48, .85)', 'rgba(20, 40, 80, .4)'), celestial: 'moon', moonScale: 1.08, cityLight: '#3edbd0', fog: '#bfe9ef', fogAmount: .4, weather: 'stars', weatherColor: '#cfefff', weatherDensity: .9, wash: 'radial-gradient(120% 70% at 50% 0%, rgba(20, 40, 110, .22), transparent 70%)'},
  // a soft dream-blue over a still mirror sea, thoughts surfacing as slow bubbles
  visionary: {sky: g('rgba(26, 42, 68, .7)', 'rgba(43, 60, 102, .35)'), celestial: 'keep', moonFilter: 'saturate(.5) brightness(1.1)', cityLight: '#8ec5ff', fog: '#dfe8f7', fogAmount: .7, weather: 'bubbles', weatherColor: '#bfe0ff', weatherDensity: .4, weatherFront: true, wash: 'radial-gradient(120% 70% at 50% 0%, rgba(120, 140, 220, .13), transparent 70%)'},
  // a green harvest dusk under a warm crimson moon, fireflies over the fields
  mother: {sky: g('rgba(29, 43, 31, .7)', 'rgba(40, 60, 36, .3)', 'rgba(200, 140, 60, .22)'), celestial: 'moon', moonFilter: 'sepia(.25) brightness(1.05)', cityLight: '#5fd38d', fog: '#e6e0c2', fogAmount: .6, weather: 'fireflies', weatherColor: '#d9f27a', weatherDensity: .7, weatherFront: true, wash: 'radial-gradient(120% 70% at 50% 0%, rgba(110, 170, 80, .13), transparent 70%), radial-gradient(100% 50% at 50% 100%, rgba(200, 150, 60, .08), transparent 70%)'},
  // an inky regal indigo-black, the moon eclipsed under a crown of light, dull gold blinking out
  emperor: {sky: g('rgba(7, 7, 26, .88)', 'rgba(20, 18, 50, .45)'), celestial: 'keep', moonFilter: 'grayscale(1) brightness(.25)', cityLight: '#7d88ff', fog: '#8e93b8', fogAmount: .6, shade: .2, weather: 'motes', weatherColor: '#c9a64a', weatherDensity: .4, weatherFront: true, wash: 'linear-gradient(180deg, rgba(4, 4, 20, .4), rgba(10, 10, 30, .2))'},
  // the horizon burns behind the hills, the moon dimmed orange through war smoke, embers rising
  priest: {sky: g('rgba(14, 8, 6, .75)', 'rgba(60, 20, 10, .4)', 'rgba(170, 55, 15, .6)'), celestial: 'keep', moonFilter: 'brightness(.65) sepia(.4)', cityLight: '#ff6a2a', fog: '#3a302c', fogAmount: .9, clouds: {color: '#2a1e1a', amount: .55}, weather: 'embers', weatherColor: '#ff7a2e', weatherDensity: .9, weatherFront: true, wash: 'radial-gradient(120% 60% at 50% 100%, rgba(200, 60, 20, .16), transparent 70%), linear-gradient(180deg, rgba(10, 6, 4, .25), transparent 50%)'},
  // a cold violet-black, the moon doubled in a mirror, frost glitter falling straight down
  demoness: {sky: g('rgba(30, 16, 36, .85)', 'rgba(50, 24, 60, .4)'), celestial: 'keep', cityLight: '#e07ab8', fog: '#e9dff0', fogAmount: .6, shade: .1, weather: 'snow', weatherColor: '#f3e6f0', weatherDensity: .35, weatherFront: true, wash: 'radial-gradient(120% 70% at 50% 0%, rgba(200, 110, 210, .11), transparent 70%)'},
  // clouds bury the moon, rain drives in, lightning forks behind the castle
  tyrant: {sky: g('rgba(13, 23, 38, .88)', 'rgba(26, 40, 62, .5)'), celestial: 'hidden', cityLight: '#6fa8ff', fog: '#9aa6b4', fogAmount: 1.2, shade: .15, weather: 'rain', weatherColor: '#a9c8e8', weatherDensity: 1, weatherFront: true, lightning: true, clouds: {color: '#1c2638', amount: 1}, wash: 'linear-gradient(180deg, rgba(20, 34, 60, .3), rgba(40, 70, 120, .1))'},
  // a frozen dusk that never becomes day, the sun stuck on the horizon, dust sinking like sand
  giant: {sky: g('rgba(58, 35, 71, .7)', 'rgba(200, 100, 70, .4)', 'rgba(255, 130, 72, .4)'), celestial: 'dusk', cityLight: '#ff9a5a', fog: '#f0c79a', fogAmount: .5, weather: 'dust', weatherColor: '#ffcf8a', weatherDensity: .5, weatherFront: true, wash: 'linear-gradient(180deg, rgba(90, 50, 110, .16), rgba(230, 120, 60, .1))'},
  // a violet-black night of constellations, glyph-light drifting
  hermit: {sky: g('rgba(22, 15, 42, .85)', 'rgba(40, 28, 70, .4)'), celestial: 'keep', moonFilter: 'saturate(.7) hue-rotate(-20deg)', cityLight: '#c38dff', fog: '#b9a6d6', fogAmount: .3, weather: 'motes', weatherColor: '#e2ccff', weatherDensity: .5, weatherFront: true, wash: 'radial-gradient(120% 70% at 50% 0%, rgba(120, 70, 200, .16), transparent 70%)'},
  // a pearly aurora, the moon ringed in mercury, silver glints of luck
  fortune: {sky: g('rgba(14, 30, 34, .7)', 'rgba(30, 50, 60, .3)'), celestial: 'keep', cityLight: '#6ee7c0', fog: '#d6e9e4', fogAmount: .5, weather: 'sparks', weatherColor: '#dfe7ee', weatherDensity: .5, wash: 'radial-gradient(100% 60% at 30% 0%, rgba(110, 230, 190, .1), transparent 70%), radial-gradient(100% 60% at 70% 0%, rgba(167, 139, 250, .1), transparent 70%)'},
  // a still, level dark; brass motes; the moon ringed in an inscription
  justiciar: {sky: g('rgba(20, 19, 26, .75)', 'rgba(30, 28, 36, .3)'), celestial: 'keep', cityLight: '#f2ab8c', fog: '#d8cfc6', fogAmount: .4, weather: 'motes', weatherColor: '#f2ab8c', weatherDensity: .4, weatherFront: true, wash: 'radial-gradient(120% 70% at 50% 0%, rgba(242, 171, 140, .09), transparent 70%)'},
  // a bruised brown-black veil drawn down, sickly underlight, pale moths low in the streets
  hanged: {sky: g('rgba(11, 7, 9, .9)', 'rgba(40, 20, 20, .45)', 'rgba(60, 25, 20, .3)'), celestial: 'keep', moonFilter: 'brightness(.5)', cityLight: '#8a3a2e', fog: '#2a1e1c', fogAmount: .9, shade: .15, weather: 'moths', weatherColor: '#efe8e0', weatherDensity: .25, weatherFront: true, wash: 'linear-gradient(180deg, rgba(40, 10, 8, .42), transparent 65%)'},
  // colour drained to pallor, the moon bone-white, souls rising from the streets
  death: {sky: g('rgba(30, 36, 32, .7)', 'rgba(70, 80, 72, .35)'), celestial: 'keep', moonFilter: 'grayscale(1) brightness(1.25)', cityLight: '#cfe6c8', fog: '#e4e6df', fogAmount: .7, shade: .2, weather: 'wisps', weatherColor: '#cfe6c8', weatherDensity: .6, weatherFront: true, wash: 'linear-gradient(180deg, rgba(200, 220, 200, .07), rgba(120, 140, 125, .05))'},
  // Backlund's industrial night: a sooty amber glow, gaslight, forge sparks
  paragon: {sky: g('rgba(28, 23, 18, .8)', 'rgba(60, 46, 30, .4)', 'rgba(120, 80, 40, .3)'), celestial: 'keep', moonFilter: 'brightness(.8) sepia(.3)', cityLight: '#ffa655', fog: '#e8e2d8', fogAmount: .5, weather: 'sparks', weatherColor: '#ffb35a', weatherDensity: .3, weatherFront: true, wash: 'radial-gradient(120% 70% at 50% 100%, rgba(255, 166, 85, .11), transparent 70%)'},
  // brown-black with sulfur haze low down, light from beneath, ash falling
  abyss: {sky: g('rgba(26, 8, 5, .88)', 'rgba(60, 20, 10, .45)', 'rgba(150, 120, 40, .35)'), celestial: 'keep', moonFilter: 'sepia(.6) hue-rotate(-15deg) brightness(.7)', cityLight: '#f2533d', fog: '#b8ae6a', fogAmount: .8, shade: .1, weather: 'ash', weatherColor: '#8f8a6a', weatherDensity: .6, weatherFront: true, wash: 'linear-gradient(180deg, rgba(40, 8, 4, .32), transparent 55%), radial-gradient(120% 50% at 50% 100%, rgba(190, 160, 60, .1), transparent 70%)'},
  // crystal-clear cool white air, nothing hidden, torn pages tumbling
  tower: {sky: g('rgba(16, 19, 28, .6)', 'rgba(40, 48, 66, .25)'), celestial: 'keep', moonFilter: 'saturate(.55) brightness(1.15)', cityLight: '#e9ecf5', fog: '#eef0f6', fogAmount: .15, weather: 'pages', weatherColor: '#f4f2ea', weatherDensity: .35, weatherFront: true, wash: 'radial-gradient(120% 70% at 50% 0%, rgba(220, 230, 255, .08), transparent 70%)'},
  // the stars go out; true black; only her crimson moon remains, faint. Silence: no particles.
  darkness: {sky: g('rgba(0, 0, 0, .92)', 'rgba(0, 0, 0, .6)'), celestial: 'moon', moonFilter: 'brightness(.55)', cityLight: '#3a2a3a', fog: '#0b0b10', fogAmount: .8, shade: .65, wash: 'linear-gradient(180deg, rgba(0, 0, 0, .5), rgba(0, 0, 0, .35))'},
  // the full crimson moon swells and floods the castle with crimson light; bats cross it
  moon: {sky: g('rgba(40, 6, 14, .7)', 'rgba(110, 14, 36, .35)'), celestial: 'moon', moonScale: 1.35, moonFilter: 'saturate(1.3) brightness(1.12)', cityLight: '#ff3b4e', fog: '#f1c9d2', fogAmount: .5, weather: 'bats', weatherColor: '#1a0a0e', weatherDensity: .6, wash: 'radial-gradient(120% 70% at 50% 0%, rgba(255, 59, 78, .14), transparent 70%)'},
  // the moon sets, the sun rises, the fog burns off, the dust turns to light
  sun: {sky: g('rgba(143, 182, 224, .45)', 'rgba(244, 198, 106, .45)', 'rgba(255, 214, 150, .35)'), celestial: 'sun', cityLight: '#ffd27a', fog: '#fff1d0', fogAmount: .15, weather: 'motes', weatherColor: '#fff3b0', weatherDensity: .6, weatherFront: true, wash: 'radial-gradient(130% 80% at 50% 0%, rgba(255, 214, 140, .16), transparent 72%)'},
  // iron-grey and still, a full cold moon to be bound, grey ash falling dead straight
  chained: {sky: g('rgba(16, 18, 22, .85)', 'rgba(40, 44, 52, .4)'), celestial: 'moon', moonFilter: 'saturate(.6) brightness(.9)', cityLight: '#9aa0a8', fog: '#8c9098', fogAmount: 1, shade: .15, weather: 'ash', weatherColor: '#9aa0a8', weatherDensity: .3, weatherFront: true, wash: 'linear-gradient(180deg, rgba(20, 22, 26, .3), rgba(150, 155, 165, .05))'},
  // it looks normal, but isn't: pale cyan motes that hiccup (the moon is stolen in its signature)
  error: {sky: 'transparent', celestial: 'keep', cityLight: '#6fd9f2', fog: '#d6e6ea', fogAmount: .7, weather: 'motes', weatherColor: '#6fd9f2', weatherDensity: .4, weatherFront: true, wash: 'radial-gradient(120% 70% at 50% 0%, rgba(111, 217, 242, .09), transparent 70%)'},
};

/* Every Boon: something from outside looks in (the moon opens as an eye in signatures/boon.vue). */
export const BOON_SCENE: Scene = {
  sky: g('rgba(14, 12, 20, .72)', 'rgba(30, 24, 40, .32)'),
  celestial: 'keep',
  moonFilter: 'saturate(.8)',
  cityLight: '#8a7aa8',
  fog: '#b8b0c8',
  fogAmount: 1.3,
  shade: .12,
  weather: 'stars',
  weatherColor: '#d6d0e8',
  weatherDensity: .35,
  wash: 'linear-gradient(180deg, rgba(14, 12, 20, .3), rgba(40, 30, 50, .12))',
};

export function sceneFor(id: string | null): Scene {
  if (!id) return DEFAULT_SCENE;
  if (PATHWAY_SCENES[id]) return PATHWAY_SCENES[id];
  return cardById(id).boon ? BOON_SCENE : DEFAULT_SCENE;
}
