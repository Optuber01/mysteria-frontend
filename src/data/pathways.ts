/**
 * Lightweight homepage projection of pathway-abilities.json.
 *
 * Keep this file limited to orbit content so the homepage does not download
 * every Sequence description. Values are derived from the source archive:
 * starting Sequence, its first documented abilities, and aggregate counts.
 */
export type HomePathway = {
  id: string;
  name: string;
  image: string;
  startingSequence: string;
  playstyle: string;
  strengths: string[];
  summary: string;
  sequenceCount: number;
  abilityCount: number;
};

type PathwaySnapshot = Omit<HomePathway, 'name' | 'image' | 'playstyle' | 'summary'>;

export const pathwayNames: Record<string, string> = {
  abyss: 'Abyss',
  chained: 'Chained',
  darkness: 'Darkness',
  death: 'Death',
  demoness: 'Demoness',
  door: 'Door',
  emperor: 'Black Emperor',
  error: 'Error',
  fool: 'Fool',
  fortune: 'Wheel of Fortune',
  giant: 'Twilight Giant',
  hanged: 'Hanged Man',
  hermit: 'Hermit',
  justiciar: 'Justiciar',
  moon: 'Moon',
  mother: 'Mother',
  paragon: 'Paragon',
  priest: 'Red Priest',
  sun: 'Sun',
  tower: 'White Tower',
  tyrant: 'Tyrant',
  visionary: 'Visionary',
};

export const boonPathwayIds = new Set([
  'aeon', 'chaos', 'chaosmist', 'condenser', 'devouring', 'edict',
  'everlasting', 'patriarch', 'secondlaw', 'sublunary',
]);

const snapshots: PathwaySnapshot[] = [
  { id: 'abyss', startingSequence: 'Sequence 9 · Criminal', strengths: ['Criminal Proficiency', 'Physical Enhancement', 'Poisonous Flames'], sequenceCount: 9, abilityCount: 29 },
  { id: 'chained', startingSequence: 'Sequence 9 · Prisoner', strengths: ['Escapism', 'Binding', 'Binding (Enhanced)'], sequenceCount: 9, abilityCount: 48 },
  { id: 'darkness', startingSequence: 'Sequence 9 · Shadow Wanderer', strengths: ['Spirit Vision', 'Nocturnality', 'Spiritualism'], sequenceCount: 9, abilityCount: 29 },
  { id: 'death', startingSequence: 'Sequence 9 · Corpse Collector', strengths: ['Cold Resistance', 'Perception of Spiritual Bodies', 'Undead Protection'], sequenceCount: 9, abilityCount: 41 },
  { id: 'demoness', startingSequence: 'Sequence 9 · Assassin', strengths: ['Feather Fall', 'Stealth Blow', 'Agility'], sequenceCount: 9, abilityCount: 30 },
  { id: 'door', startingSequence: 'Sequence 9 · Apprentice', strengths: ['Door Opening', 'Tricky Spells', 'Light Wind'], sequenceCount: 9, abilityCount: 25 },
  { id: 'emperor', startingSequence: 'Sequence 9 · Lawyer', strengths: ['Eloquence', 'Persuasion', 'Law Proficiency'], sequenceCount: 9, abilityCount: 29 },
  { id: 'error', startingSequence: 'Sequence 9 · Marauder', strengths: ['Acrobatic Skills', 'Dexterous Hands', 'Agile Proficiency'], sequenceCount: 9, abilityCount: 32 },
  { id: 'fool', startingSequence: 'Sequence 9 · Seer', strengths: ['Divination', 'Spiritualism', 'Paper Dagger'], sequenceCount: 9, abilityCount: 31 },
  { id: 'fortune', startingSequence: 'Sequence 9 · Monster', strengths: ['Danger Premonition', 'Foresight', 'Calculation Mastery'], sequenceCount: 9, abilityCount: 32 },
  { id: 'giant', startingSequence: 'Sequence 9 · Warrior', strengths: ['Simplified Combat', 'Combat Roll', 'Physical Enhancement'], sequenceCount: 9, abilityCount: 32 },
  { id: 'hanged', startingSequence: 'Sequence 9 · Secrets Supplicant', strengths: ['Divination', 'Spiritual Intuition', 'Knowledge'], sequenceCount: 9, abilityCount: 33 },
  { id: 'hermit', startingSequence: 'Sequence 9 · Mystery Pryer', strengths: ['Eyes of Mystery Prying', 'Knowledge Pursuit', 'Spirit Vision'], sequenceCount: 9, abilityCount: 31 },
  { id: 'justiciar', startingSequence: 'Sequence 9 · Arbiter', strengths: ['Coercion', 'Authority Reserve', 'Physical Enhancement'], sequenceCount: 9, abilityCount: 34 },
  { id: 'moon', startingSequence: 'Sequence 9 · Apothecary', strengths: ['Apothecary Brew', 'Toxin Resistance', 'Herbal Healing'], sequenceCount: 9, abilityCount: 28 },
  { id: 'mother', startingSequence: 'Sequence 9 · Planter', strengths: ['Enhanced Strength', 'Green Thumb', 'Weather Sense'], sequenceCount: 9, abilityCount: 27 },
  { id: 'paragon', startingSequence: 'Sequence 9 · Savant', strengths: ['Savant Crafting', 'Recall', 'Tough Nature'], sequenceCount: 9, abilityCount: 35 },
  { id: 'priest', startingSequence: 'Sequence 9 · Hunter', strengths: ['Explosive Trap', "Hunter's Body", 'Provocation'], sequenceCount: 9, abilityCount: 28 },
  { id: 'sun', startingSequence: 'Sequence 9 · Bard', strengths: ['Song of the Bard', 'Light and Fire', 'Immunity to Horror'], sequenceCount: 9, abilityCount: 34 },
  { id: 'tower', startingSequence: 'Sequence 9 · Reader', strengths: ['Enhanced Cognition', 'Minor Ritual', 'Reading'], sequenceCount: 9, abilityCount: 30 },
  { id: 'tyrant', startingSequence: 'Sequence 9 · Sailor', strengths: ['Phantom Scales', 'Active Scales', 'Strength Buff'], sequenceCount: 9, abilityCount: 48 },
  { id: 'visionary', startingSequence: 'Sequence 9 · Spectator', strengths: ['Body Language Analysis', 'Enhanced Vision', 'Mind Reading'], sequenceCount: 9, abilityCount: 31 },
];

export const standardPathways: HomePathway[] = snapshots.map((pathway) => ({
  ...pathway,
  name: pathwayNames[pathway.id],
  image: `/pathways/${pathway.id}.webp`,
  playstyle: pathway.strengths.slice(0, 2).join(' + '),
  summary: `Implemented with ${pathway.abilityCount} documented abilities across ${pathway.sequenceCount} Sequences.`,
}));
