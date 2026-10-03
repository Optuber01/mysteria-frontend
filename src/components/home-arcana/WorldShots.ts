/*
 * Player screenshots from the Mysterria Discord showcase and town channels
 * (see src/assets/images/home/community/credits.json for sources and dates).
 * Each shot has a 960px copy for cards and the original for wide slots, plus
 * the crop focus used wherever it is shown with object-fit: cover.
 */
const files = import.meta.glob<string>('@/assets/images/home/community/*.webp', {eager: true, import: 'default'});
const url = (name: string) => Object.entries(files).find(([path]) => path.endsWith(`/${name}.webp`))?.[1] ?? '';

export type WorldShot = Readonly<{
  key: string;
  src: string;
  small: string;
  w: number;
  h: number;
  /** Player who took it; empty for the server's own capture. */
  author: string;
  /** Town or place it shows (a proper name, not translated). */
  place: string;
  /** object-position for cover crops. */
  focus: string;
}>;

const shot = (key: string, w: number, h: number, author: string, place: string, focus = '50% 50%'): WorldShot =>
  ({key, src: url(key), small: url(`${key}-960`), w, h, author, place, focus});

/** The shots the chapter's topics are illustrated with. */
export const TOPIC_SHOTS = {
  rifts: shot('rift-portal', 1327, 832, 'ikeepca1m', 'Rift', '46% 60%'),
  guardians: shot('guardian-dragons-1', 1779, 928, 'patder', 'Guardians', '45% 62%'),
  incursions: shot('event-arena', 1920, 1080, 'Xion', 'Event arena', '50% 62%'),
  townMain: shot('harbour-dusk', 1920, 1080, '10otevap', 'Blindmorr', '62% 58%'),
  townA: shot('ilsi-pagodas', 1920, 1080, 'Sebus', 'Ilsi', '30% 45%'),
  townB: shot('sunset-town', 1920, 1080, 'Pianowire', 'Penglai', '50% 50%'),
  churches: shot('cathedral-night', 1230, 730, 'RiceMuncher', 'Pyaari', '50% 30%'),
  economy: shot('emporium', 1920, 1080, '', 'Brilliant Emporium', '50% 62%'),
  orders: shot('map-hall', 1920, 1080, 'Sebus', 'Ilsi', '50% 22%'),
} as const;

/** The gallery strip, in viewing order (alternating warm, dark and bright). */
export const GALLERY_SHOTS: readonly WorldShot[] = [
  shot('sunset-pagoda', 1920, 1080, 'Pianowire', 'Penglai'),
  shot('underground-hall', 1920, 1080, 'origin', 'The Land of Mysteries'),
  shot('ilsi-harbour', 1920, 1080, 'Sebus', 'Ilsi'),
  shot('dark-cathedral', 1648, 1262, 'NerdyGekko', 'Solaris', '50% 35%'),
  shot('floating-isles', 1595, 827, 'RiceMuncher', 'Pyaari'),
  shot('underground-city-lights', 1920, 1080, 'origin', 'The Land of Mysteries'),
  shot('valley-beacon', 1901, 975, 'Luent', 'The Great Abyss'),
  shot('blindmoor-temple', 1920, 1200, 'Halider', 'Blindmorr', '50% 40%'),
  shot('lantern-street', 1920, 1080, 'kodiytf', 'Flores'),
  shot('sunset-skyline', 1920, 1080, 'Pianowire', 'Penglai'),
  shot('hadal-blacksite', 1920, 1080, 'FahavL', 'Hadal Blacksite'),
  shot('misty-lake', 1920, 1080, 'ikeepca1m', 'Astoria'),
  shot('red-airship', 942, 490, 'fish', 'Airship'),
  shot('underground-forge', 1920, 1080, 'origin', 'The Land of Mysteries'),
  shot('harbour-streets', 1920, 1080, '10otevap', 'Blindmorr'),
  shot('guardian-dragons-2', 1756, 916, 'patder', 'Guardians'),
];
