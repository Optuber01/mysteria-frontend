import {BOON_CARDS, CORE_CARDS, type ArcanaCard, type PathwaysModule} from '@/components/home-arcana/arcana-data';
import type {Language} from '@/locales';

/** The 22 in arcana order, then the ten Boons: the order every Pathways surface uses. */
export const ORDERED_CARDS: readonly ArcanaCard[] = [...CORE_CARDS, ...BOON_CARDS];

/*
 * The plugin's lang files are Java format strings, and a few descriptions reach us
 * unformatted: "20%%" is how the game writes "20%", and one "%s" is a number the game
 * fills in at runtime.
 */
export const tidy = (text: string) => text.replace(/%%/g, '%').replace(/%s/g, '…');

export const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)}/g, (match, key: string) => (key in values ? String(values[key]) : match));

/** The wiki is its own site with its own locale prefixes (none for English). */
const WIKI = 'https://wiki.mysterria.net/';
export function wikiUrl(language: Language, boon: boolean): string {
  const prefix = language === 'en' ? '' : `${language.toLowerCase()}/`;
  return `${WIKI}${prefix}magic/${boon ? 'boons' : 'pathways'}/`;
}

export type Rung = {sequence: number; name: string};

/** Sequence 9 at the bottom of the climb up to the top: the 22 end on their god's throne at 0. */
export function climbOf(data: PathwaysModule, card: ArcanaCard, language: Language): Rung[] {
  const rungs = data.pathwayLadder(card.id, language);
  if (!card.boon && !rungs.some(rung => rung.sequence === 0)) {
    rungs.push({sequence: 0, name: data.deityName(card.id, language)});
  }
  return rungs;
}

export const abilityCount = (data: PathwaysModule, id: string) =>
  data.pathwayById(id)?.sequences.reduce((sum, sequence) => sum + sequence.abilities.length, 0) ?? 0;
