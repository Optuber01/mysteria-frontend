/*
 * Player screenshots from the Mysterria Discord (showcase, announcement and town
 * channels; see src/assets/images/home/community/credits.json for sources and dates).
 * Only shots with a credit entry are used. Each has a 960px copy for cards where one
 * exists, the original for wide slots, and the crop focus for object-fit: cover.
 */
import credits from '@/assets/images/home/community/credits.json';

const files = import.meta.glob<string>('@/assets/images/home/community/*.webp', {eager: true, import: 'default'});
/** The Discord message each shot was posted in (credits.json), so a viewer can open the original. */
const sourceOf = (key: string) => credits.images.find(image => image.file === `${key}.webp`)?.source ?? '';
const url = (name: string) => Object.entries(files).find(([path]) => path.endsWith(`/${name}.webp`))?.[1] ?? '';

export type WorldShot = Readonly<{
  key: string;
  src: string;
  small: string;
  w: number;
  h: number;
  /** Player who took it, as credited. */
  author: string;
  /** Town or place it shows (a proper name, not translated). */
  place: string;
  /** object-position for cover crops. */
  focus: string;
  /** Link to the Discord message it was posted in. */
  source: string;
}>;

const shot = (key: string, w: number, h: number, author: string, place: string, focus = '50% 50%'): WorldShot =>
  ({key, src: url(key), small: url(`${key}-960`), w, h, author, place, focus, source: sourceOf(key)});

/** The shots the chapter's systems are illustrated with. */
export const TOPIC_SHOTS = {
  rifts: shot('rift-portal', 1327, 832, 'ikeepca1m', 'Rift', '46% 58%'),
  churches: shot('cathedral-night', 1230, 730, 'RiceMuncher', 'Pyaari', '50% 34%'),
  // the Outer Gods Anchors announcement's own image: an Outer God's eye torn open over the world
  pact: shot('outer-god-eye', 1920, 1047, 'ikeepca1m', 'Outer Gods Anchors', '50% 34%'),
} as const;

/** The gallery strip, in viewing order (alternating warm, dark and bright). */
export const GALLERY_SHOTS: readonly WorldShot[] = [
  shot('sunset-pagoda', 1920, 1080, 'Pianowire', 'Penglai'),
  shot('underground-hall', 1920, 1080, 'origin', 'The Land of Mysteries'),
  shot('ilsi-harbour', 1920, 1080, 'Sebus', 'Ilsi'),
  shot('dark-cathedral', 1648, 1262, 'NerdyGekko', 'Solaris', '50% 35%'),
  shot('floating-isles', 1595, 827, 'RiceMuncher', 'Pyaari'),
  shot('harbour-dusk', 1920, 1080, '10otevap', 'Blindmorr', '62% 58%'),
  shot('underground-city-lights', 1920, 1080, 'origin', 'The Land of Mysteries'),
  shot('valley-beacon', 1901, 975, 'Luent', 'The Great Abyss'),
  shot('ilsi-pagodas', 1920, 1080, 'Sebus', 'Ilsi', '30% 45%'),
  shot('blindmoor-temple', 1920, 1200, 'Halider', 'Blindmorr', '50% 40%'),
  shot('lantern-street', 1920, 1080, 'kodiytf', 'Flores'),
  shot('sunset-skyline', 1920, 1080, 'Pianowire', 'Penglai'),
  shot('hadal-blacksite', 1920, 1080, 'FahavL', 'Hadal Blacksite'),
  shot('event-arena', 1920, 1080, 'Xion', 'Arena', '50% 62%'),
  shot('misty-lake', 1920, 1080, 'ikeepca1m', 'Astoria'),
  shot('red-airship', 942, 490, 'fish', 'Airship'),
  shot('sunset-town', 1920, 1080, 'Pianowire', 'Penglai'),
  shot('underground-forge', 1920, 1080, 'origin', 'The Land of Mysteries'),
  shot('harbour-streets', 1920, 1080, '10otevap', 'Blindmorr'),
];
