/**
 * Homepage projection of the generated Mysterria ability archive.
 *
 * Sequence names, ability names and counts are always read from the archive.
 * The only hand-authored values here are display names and visual direction,
 * which are not present in the source file. Unknown future entries still
 * receive a readable name, image path, route and neutral theme.
 */
import catalog from '@/assets/sources/progression-catalog.json';

type Localized = { en?: string; uk?: string };
type CatalogEntry = {
  id: string;
  kind: ProgressionKind;
  startingSequence: { sequence: number; name: Localized } | null;
  strengths: Array<{ id: string; name: Localized }>;
  sequenceCount: number;
  abilityCount: number;
};

export type ProgressionKind = 'pathway' | 'boon';
export type ProgressionMotif =
  | 'eye' | 'chain' | 'eclipse' | 'bone' | 'blade' | 'door' | 'crown' | 'glitch'
  | 'cards' | 'wheel' | 'sword' | 'cross' | 'runes' | 'scales' | 'moon' | 'vine'
  | 'gear' | 'flame' | 'sun' | 'pages' | 'storm' | 'spiral' | 'clock' | 'fracture'
  | 'mist' | 'star' | 'maw' | 'sigil' | 'ring' | 'coin' | 'plague' | 'canvas';

export type HomePathway = {
  id: string;
  kind: ProgressionKind;
  name: string;
  image: string;
  route: string;
  startingSequence: string;
  startingSequenceNumber: number;
  strengths: string[];
  playstyle: string;
  summary: string;
  sequenceCount: number;
  abilityCount: number;
  motif: ProgressionMotif;
  theme: { accent: string; accent2: string; ink: string; surface: string; haze: string };
};

export const pathwayNames: Record<string, string> = {
  abyss: 'Abyss', chained: 'Chained', darkness: 'Darkness', death: 'Death',
  demoness: 'Demoness', door: 'Door', emperor: 'Black Emperor', error: 'Error',
  fool: 'Fool', fortune: 'Wheel of Fortune', giant: 'Twilight Giant',
  hanged: 'Hanged Man', hermit: 'Hermit', justiciar: 'Justiciar', moon: 'Moon',
  mother: 'Mother', paragon: 'Paragon', priest: 'Red Priest', sun: 'Sun',
  tower: 'White Tower', tyrant: 'Tyrant', visionary: 'Visionary',
  aeon: 'Eternal Aeon', chaos: 'Chaos', chaosmist: 'Chaos Mist',
  condenser: 'Condenser', devouring: 'Devouring', edict: 'Edict',
  everlasting: 'Everlasting', patriarch: 'Patriarch', secondlaw: 'Second Law',
  sublunary: 'Sublunary',
};

/**
 * The standard LOTM set is closed at 22. Treat every additional archive entry
 * as a Boon so new game data appears in the correct homepage tab without a
 * component edit. Rich presentation metadata remains optional.
 */
export const standardPathwayIds = new Set(
  (catalog.entries as CatalogEntry[])
    .filter((entry) => entry.kind === 'pathway')
    .map((entry) => entry.id),
);

export const boonPathwayIds = new Set(
  (catalog.entries as CatalogEntry[])
    .filter((entry) => entry.kind === 'boon')
    .map((entry) => entry.id),
);

type Presentation = Pick<HomePathway, 'motif' | 'theme'>;
const presentation: Record<string, Presentation> = {
  abyss: visual('flame', '#e8783b', '#7e241c', '#fff3dd', '#1c0f0b', '#ba3c22'),
  chained: visual('chain', '#b6c6bd', '#748678', '#f5f0e6', '#111a18', '#596e65'),
  darkness: visual('eclipse', '#7397b4', '#243f5d', '#f1f4f4', '#07121d', '#18334a'),
  death: visual('bone', '#c8d3c7', '#6c8379', '#f2f2e9', '#101716', '#526c62'),
  demoness: visual('blade', '#df6e74', '#71343a', '#fff0e9', '#1d0c10', '#9d384a'),
  door: visual('door', '#6baab2', '#d5ad62', '#f7f1df', '#0a1d24', '#2f7180'),
  emperor: visual('crown', '#d6ad5c', '#704429', '#fff4da', '#1b130e', '#8c5e2d'),
  error: visual('glitch', '#65aeb1', '#d2a351', '#f5f1df', '#091a1d', '#276e73'),
  fool: visual('cards', '#c59a51', '#457d74', '#fff5df', '#0e201f', '#526e56'),
  fortune: visual('wheel', '#d5a64c', '#388b79', '#fff4d8', '#10201d', '#91712d'),
  giant: visual('sword', '#d8b978', '#8d5e3d', '#fff5dd', '#21160f', '#80603c'),
  hanged: visual('cross', '#b19066', '#6f3d34', '#f9eee0', '#190f0e', '#6f4033'),
  hermit: visual('runes', '#56a7a0', '#ca9b50', '#eef8ef', '#071c1b', '#2b6c68'),
  justiciar: visual('scales', '#cfaa65', '#557676', '#fff3d9', '#11201f', '#71653d'),
  moon: visual('moon', '#ca7180', '#796f9b', '#fff0ed', '#1d111b', '#713c54'),
  mother: visual('vine', '#72a96a', '#d2a85e', '#eff8e9', '#102014', '#3c713b'),
  paragon: visual('gear', '#d29f4d', '#668d88', '#fff2d7', '#17201d', '#84652f'),
  priest: visual('flame', '#e15b35', '#a32e23', '#fff0dc', '#210f0b', '#a83c23'),
  sun: visual('sun', '#e4b858', '#fff0a0', '#fff4d8', '#211b0c', '#d18d2e'),
  tower: visual('pages', '#88a7a6', '#c4a868', '#f6f1e5', '#102020', '#597d7c'),
  tyrant: visual('storm', '#4c99bc', '#c7b061', '#eef8f8', '#071b27', '#17637f'),
  visionary: visual('eye', '#98a86c', '#c2a25e', '#f7f1df', '#172015', '#5b713e'),
  aeon: visual('clock', '#98a9b5', '#d1a95b', '#f4f1e7', '#12191f', '#687986'),
  chaos: visual('fracture', '#d06d4f', '#385f67', '#fff0df', '#1c1110', '#863928'),
  chaosmist: visual('mist', '#8aafb0', '#6c7d87', '#f2f6ef', '#10191c', '#49686b'),
  condenser: visual('star', '#78a7c2', '#d2a45a', '#f2f6ef', '#0b1821', '#355f79'),
  devouring: visual('maw', '#b9a05d', '#6e3e31', '#fff0d9', '#1b110d', '#72422b'),
  edict: visual('sigil', '#b9a06c', '#536d86', '#f8f2e5', '#131a21', '#66717b'),
  everlasting: visual('ring', '#a8b3a7', '#d0aa61', '#f5f4e8', '#151b18', '#647369'),
  patriarch: visual('coin', '#d0a24b', '#68502d', '#fff2d5', '#1d160d', '#856629'),
  secondlaw: visual('plague', '#8cab63', '#a86f42', '#f1f4df', '#151a0d', '#597235'),
  sublunary: visual('canvas', '#76a0a6', '#c88f64', '#f6efe3', '#0f1c20', '#466d75'),
};

function visual(motif: ProgressionMotif, accent: string, accent2: string, ink: string, surface: string, haze: string): Presentation {
  return { motif, theme: { accent, accent2, ink, surface, haze } };
}

const neutral = visual('spiral', '#c69b52', '#4f8275', '#f7f2e7', '#10201f', '#345f58');
const titleCase = (id: string) => id
  .replace(/[-_]+/g, ' ')
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());
const english = (value?: Localized) => value?.en?.trim() || value?.uk?.trim() || 'Undocumented';

export const progressionCatalog: HomePathway[] = (catalog.entries as CatalogEntry[]).map((entry) => {
  const starting = entry.startingSequence;
  const strengths = entry.strengths.map((ability) => english(ability.name));
  while (strengths.length < 3) strengths.push('See documented abilities');
  const display = presentation[entry.id] ?? neutral;
  const imageId = entry.id === 'aeon' ? 'eternalaeon' : entry.id;
  const startingName = english(starting?.name);
  const startingNumber = Number.isFinite(starting?.sequence) ? (starting?.sequence ?? 9) : 9;
  return {
    id: entry.id,
    kind: entry.kind,
    name: pathwayNames[entry.id] ?? titleCase(entry.id),
    image: `/pathways/thumbs/${imageId}.webp`,
    route: `/pathways/${entry.id}`,
    startingSequence: `Sequence ${startingNumber} · ${startingName}`,
    startingSequenceNumber: startingNumber,
    strengths,
    playstyle: strengths.slice(0, 2).join(' · '),
    summary: `${entry.abilityCount} documented abilities across ${entry.sequenceCount} Sequences in Mysterria.`,
    sequenceCount: entry.sequenceCount,
    abilityCount: entry.abilityCount,
    ...display,
  };
});

export const standardPathways = progressionCatalog.filter((entry) => entry.kind === 'pathway');
export const boonPathways = progressionCatalog.filter((entry) => entry.kind === 'boon');
