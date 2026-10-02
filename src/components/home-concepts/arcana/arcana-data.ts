/*
 * The deck: a tiny, always-available table of the 32 cards (ids, accents,
 * arcana numerals, English fallback names) plus an inline Fool reading for the
 * first paint. Everything localized and data-heavy comes from @/data/pathways,
 * which is ~1.3 MB of JSON and so is only ever imported dynamically.
 */
import type {Language} from '@/locales';

export type ArcanaCard = Readonly<{
  id: string;
  /** Accent for the whole page while this card is drawn (dark text stays >= 4.5:1 on it). */
  accent: string;
  /** Major-arcana numeral; boons have none. */
  numeral: string;
  boon: boolean;
  /** English label, used until the localized data has loaded. */
  en: string;
}>;

const core = (id: string, numeral: string, accent: string, en: string): ArcanaCard =>
  ({id, numeral, accent, en, boon: false});
const boon = (id: string, accent: string, en: string): ArcanaCard =>
  ({id, numeral: '', accent, en, boon: true});

/** The 22, in arcana order. Tarot-named pathways keep their canonical numbers. */
export const CORE_CARDS: readonly ArcanaCard[] = [
  core('fool', '0', '#a78bfa', 'Fool'),
  core('door', 'I', '#3edbd0', 'Door'),
  core('visionary', 'II', '#8ec5ff', 'Visionary'),
  core('mother', 'III', '#5fd38d', 'Mother'),
  core('emperor', 'IV', '#7d88ff', 'Black Emperor'),
  core('priest', 'V', '#ff5468', 'Red Priest'),
  core('demoness', 'VI', '#ff62bd', 'Demoness'),
  core('tyrant', 'VII', '#4d9eff', 'Tyrant'),
  core('giant', 'VIII', '#ff8248', 'Twilight Giant'),
  core('hermit', 'IX', '#c38dff', 'Hermit'),
  core('fortune', 'X', '#6ee7c0', 'Wheel of Fortune'),
  core('justiciar', 'XI', '#f2ab8c', 'Justiciar'),
  core('hanged', 'XII', '#ff7d6b', 'Hanged Man'),
  core('death', 'XIII', '#cfe69e', 'Death'),
  core('paragon', 'XIV', '#ffa655', 'Paragon'),
  core('abyss', 'XV', '#f2533d', 'Abyss'),
  core('tower', 'XVI', '#93adff', 'White Tower'),
  core('darkness', 'XVII', '#98a2ff', 'Darkness'),
  core('moon', 'XVIII', '#ff8fae', 'Moon'),
  core('sun', 'XIX', '#f4ea6a', 'Sun'),
  core('chained', 'XX', '#b9aef0', 'Chained'),
  core('error', 'XXI', '#6fd9f2', 'Error'),
];

export const BOON_CARDS: readonly ArcanaCard[] = [
  boon('aeon', '#b8c8ee', 'Eternal Aeon'),
  boon('chaos', '#e0956c', 'Chaos'),
  boon('chaosmist', '#a9dde8', 'Chaos Mist'),
  boon('condenser', '#6f9dff', 'Condenser'),
  boon('devouring', '#ecc1ad', 'Devouring'),
  boon('edict', '#4fc2a8', 'Edict'),
  boon('everlasting', '#c4adf0', 'Everlasting'),
  boon('patriarch', '#e77799', 'Patriarch'),
  boon('secondlaw', '#d8d3a6', 'Second Law'),
  boon('sublunary', '#d6b08a', 'Sublunary'),
];

export const ALL_CARDS: readonly ArcanaCard[] = [...CORE_CARDS, ...BOON_CARDS];
const BY_ID = new Map(ALL_CARDS.map(card => [card.id, card]));
export const cardById = (id: string): ArcanaCard => BY_ID.get(id) ?? CORE_CARDS[0];
export const isCardId = (id: unknown): id is string => typeof id === 'string' && BY_ID.has(id);

/* Sigil file names that differ from the id (mirrors pathwayAliases). */
const SIGIL_FILE: Record<string, string> = {aeon: 'eternalaeon'};
/** 256px sigil, for small cards. Public path (never /pathways/: production redirects it). */
export const sigilThumb = (id: string) => `/pathway-art/avif/thumbs/${SIGIL_FILE[id] ?? id}.avif`;
/** 512px sigil, for the drawn card and the page watermark. */
export const sigilNative = (id: string) => `/pathway-art/avif/native/${SIGIL_FILE[id] ?? id}.avif`;

export type ReadingAbility = Readonly<{name: string; description: string}>;
export type Reading = Readonly<{
  id: string;
  name: string;
  /** Sequence 9 role. */
  seq9: string;
  /** Rungs from Sequence 9 upward, including the Sequence 0 throne for the 22. */
  ladder: ReadonlyArray<{sequence: number; name: string}>;
  /** Number of Sequences on the ladder (10 for the 22, 5 for boons). */
  sequenceCount: number;
  abilityCount: number;
  /** Sequence 9 abilities. */
  early: readonly ReadingAbility[];
  /** True once real localized data backs this reading. */
  loaded: boolean;
}>;

/** Enough of the Fool to paint the first screen before the data chunk arrives. */
export const FOOL_READING: Reading = {
  id: 'fool',
  name: 'Fool',
  seq9: 'Seer',
  ladder: [
    {sequence: 9, name: 'Seer'},
    {sequence: 8, name: 'Clown'},
    {sequence: 7, name: 'Magician'},
    {sequence: 6, name: 'Faceless'},
    {sequence: 5, name: 'Marionettist'},
    {sequence: 4, name: 'Bizarro Sorcerer'},
    {sequence: 3, name: 'Scholar of Yore'},
    {sequence: 2, name: 'Miracle Invoker'},
    {sequence: 1, name: 'Attendant of Mysteries'},
    {sequence: 0, name: 'Fool'},
  ],
  sequenceCount: 10,
  abilityCount: 34,
  early: [
    {name: 'Divination', description: 'Allows foresight into potential outcomes and events.'},
    {name: 'Spiritualism', description: 'Your spirituality restores faster.'},
  ],
  loaded: false,
};

/** Placeholder for any other card while the data chunk is still in flight. */
export function shellReading(id: string): Reading {
  if (id === 'fool') return FOOL_READING;
  const card = cardById(id);
  return {id, name: card.en, seq9: '', ladder: [], sequenceCount: card.boon ? 5 : 10, abilityCount: 0, early: [], loaded: false};
}

export type PathwaysModule = typeof import('@/data/pathways');

let pending: Promise<PathwaysModule> | null = null;
/** Lazily fetches the pathway data chunk (once). */
export function loadPathways(): Promise<PathwaysModule> {
  pending ??= import('@/data/pathways');
  return pending;
}

export function buildReading(data: PathwaysModule, id: string, language: Language): Reading {
  const pathway = data.pathwayById(id);
  if (!pathway) return shellReading(id);
  const card = cardById(id);
  const ladder = data.pathwayLadder(id, language).slice().reverse();
  if (!card.boon && !ladder.some(rung => rung.sequence === 0)) {
    ladder.push({sequence: 0, name: data.deityName(id, language)});
  }
  const nine = pathway.sequences.find(sequence => sequence.sequence === 9);
  return {
    id,
    name: data.pathwayName(id, language),
    seq9: data.sequenceNineName(id, language),
    ladder,
    sequenceCount: ladder.length,
    abilityCount: pathway.sequences.reduce((sum, sequence) => sum + sequence.abilities.length, 0),
    early: (nine?.abilities ?? []).slice(0, 3).map(ability => ({
      name: data.pick(ability.name, language),
      description: data.pick(ability.description, language),
    })),
    loaded: true,
  };
}
