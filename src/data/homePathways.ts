/**
 * Homepage projection of the pathway archive, for the orbit and the join beat.
 *
 * Names, counts and the Pathway/Boon split come from
 * progression-catalog.json, which scripts/generate-progression-catalog.mjs
 * records by running src/data/pathways.ts itself (pathwayName(), pick(),
 * boonPathwayIds). That keeps every label identical to the rest of the site,
 * in every locale, without shipping the full ability archive to the homepage.
 *
 * The only hand-authored value here is what the archive has no notion of: the
 * accent color of each sigil, which the join beat reads. Copy lives in the
 * locale files under home.orbit.
 */
import catalog from '@/assets/sources/progression-catalog.json';
import type { Localized } from '@/data/pathways';
import type { Language } from '@/locales';

export type ProgressionKind = 'pathway' | 'boon';

type CatalogEntry = {
  id: string;
  kind: ProgressionKind;
  image: string;
  name: Localized;
  startingSequence: { sequence: number; name: Localized } | null;
  strengths: Localized[];
  sequenceCount: number;
  abilityCount: number;
};

export type HomePathway = {
  id: string;
  kind: ProgressionKind;
  name: Localized;
  image: string;
  thumbnail: string;
  /** Unprefixed archive route; pass it through the locale-path helper. */
  route: string;
  startingSequence: { number: number; name: Localized } | null;
  strengths: Localized[];
  sequenceCount: number;
  abilityCount: number;
  /** Read by JoinJourney. `accent` holds at least 4.5:1 on paper; `tint` is a pale wash of it. */
  theme: { accent: string; tint: string };
};

/** Same fallback rule as pick() in src/data/pathways.ts. */
export const localize = (value: Localized, language: Language): string => value[language] || value.en;

// Dominant non-transparent color of each shipped symbol.
const symbolColors: Record<string, string> = {
  abyss: '#e04030', chained: '#505090', darkness: '#203060', death: '#f0f0e0',
  demoness: '#a02070', door: '#207090', emperor: '#5070a0', error: '#607090',
  fool: '#403060', fortune: '#406060', giant: '#f0b070', hanged: '#c03030',
  hermit: '#403080', justiciar: '#604030', moon: '#903030', mother: '#307060',
  paragon: '#a05020', priest: '#a02010', sun: '#805010', tower: '#3040a0',
  tyrant: '#b0f0f0', visionary: '#506070', aeon: '#405080', chaos: '#502010',
  chaosmist: '#507080', condenser: '#3050a0', devouring: '#e0c0b0', edict: '#407060',
  everlasting: '#504070', patriarch: '#f0e0e0', secondlaw: '#506050', sublunary: '#604020',
};

const PAPER = '#f5eee1';
const INK = '#221c14';
const PRIMARY = '#7458e8';

const channels = (hex: string) => [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));

function mixHex(from: string, to: string, amount: number) {
  const target = channels(to);
  return `#${channels(from).map((value, index) => Math.round(value * (1 - amount) + target[index] * amount).toString(16).padStart(2, '0')).join('')}`;
}

function luminance(hex: string) {
  const [r, g, b] = channels(hex).map((value) => {
    const c = value / 255;
    return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
  });
  return .2126 * r + .7152 * g + .0722 * b;
}

function contrast(a: string, b: string) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + .05) / (dark + .05);
}

/** Darkens pale symbol colors (Death, Tyrant…) toward ink until they read on paper. */
function readableAccent(color: string) {
  let accent = color;
  for (let amount = .1; contrast(accent, PAPER) < 4.5 && amount <= 1; amount += .1) accent = mixHex(color, INK, amount);
  return accent;
}

function theme(id: string): HomePathway['theme'] {
  const accent = readableAccent(symbolColors[id] ?? PRIMARY);
  return { accent, tint: mixHex(accent, '#ffffff', .9) };
}

const progressionCatalog: HomePathway[] = (catalog.entries as CatalogEntry[]).map((entry) => ({
  id: entry.id,
  kind: entry.kind,
  name: entry.name,
  image: `/pathway-art/avif/native/${entry.image}.avif`,
  thumbnail: `/pathway-art/avif/thumbs/${entry.image}.avif`,
  route: `/pathways/${entry.id}`,
  startingSequence: entry.startingSequence
    ? { number: entry.startingSequence.sequence, name: entry.startingSequence.name }
    : null,
  strengths: entry.strengths,
  sequenceCount: entry.sequenceCount,
  abilityCount: entry.abilityCount,
  theme: theme(entry.id),
}));

export const standardPathways = progressionCatalog.filter((entry) => entry.kind === 'pathway');
export const boonPathways = progressionCatalog.filter((entry) => entry.kind === 'boon');
