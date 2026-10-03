/*
 * Copy and data for the progression chapter, all following the drawn card.
 *
 * Strings live under `home.progression.*` and may contain {pathway},
 * {sequence} and {nextSequence} placeholders, filled from the localized
 * pathway archive that useArcana() loads lazily (it is ~1.3 MB, so it is
 * never imported statically). Until it arrives, the card's English name
 * stands in.
 */
import {computed} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {cardById} from '../../arcana-data';
import {ensurePathwayData, useArcana} from '../../useArcana';
import {hasRecipe, recipeFor} from '../recipes';

type Ability = { id: string; name: string; description: string };
type PathwayCopy = {
  pathway: string;
  sequence: string;
  nextSequence: string;
  abilities: Ability[];
  nextAbilities: Ability[];
};

const FOOL: PathwayCopy = {pathway: 'Fool', sequence: 'Seer', nextSequence: 'Clown', abilities: [], nextAbilities: []};

export type StoryIngredient = {
  key: string;
  name: string;
  role: 'main' | 'supplementary';
  source: string;
  icon: string | null;
};

type ListFormatConstructor = new (locale: string, options: { type: 'conjunction' }) => { format(items: string[]): string };

/** Starts loading the pathway archive (the chapter is getting close). */
export function preloadPathwayNames(): Promise<unknown> {
  return ensurePathwayData().catch(() => undefined);
}

export function useProgressionCopy() {
  const {t, currentLanguage, intlLocale} = useI18n();
  const {currentId, data, card} = useArcana();

  /** The Pathway the story brews: the drawn card (Boons fall back to the Fool's recipe). */
  const pathwayId = computed(() => (hasRecipe(currentId.value) ? currentId.value : 'fool'));

  const names = computed<PathwayCopy>(() => {
    const id = pathwayId.value;
    const module = data.value;
    const language = currentLanguage.value;
    if (!module) return id === 'fool' ? FOOL : {...FOOL, pathway: cardById(id).en, sequence: '', nextSequence: ''};
    const pathway = module.pathwayById(id);
    const rung = (n: number) => pathway?.sequences.find((entry) => entry.sequence === n);
    const abilities = (n: number): Ability[] =>
      (rung(n)?.abilities ?? []).map((ability) => ({
        id: ability.id,
        name: module.pick(ability.name, language),
        description: module.pick(ability.description, language),
      }));
    const next = rung(8);
    return {
      pathway: module.pathwayName(id, language),
      sequence: module.sequenceNineName(id, language) || cardById(id).en,
      nextSequence: next ? module.pick(next.name, language) : '',
      abilities: abilities(9),
      nextAbilities: abilities(8),
    };
  });

  const recipe = computed(() => recipeFor(pathwayId.value));
  const ingredients = computed<StoryIngredient[]>(() => {
    const language = currentLanguage.value;
    const r = recipe.value;
    return [
      ...r.main.map((item) => ({key: item.key, name: item.name(language), role: 'main' as const, source: item.source, icon: item.icon})),
      ...r.supplementary.map((item) => ({key: item.key, name: item.name(language), role: 'supplementary' as const, source: item.source, icon: item.icon})),
    ];
  });

  /** Joins names the way the active locale lists things ("A and B", "A 和 B"). */
  function list(items: string[]): string {
    // Intl.ListFormat is ES2021; the app's TS lib stops at ES2020.
    const ListFormat = (Intl as unknown as { ListFormat?: ListFormatConstructor }).ListFormat;
    try {
      if (ListFormat) return new ListFormat(intlLocale.value, {type: 'conjunction'}).format(items);
    } catch {
      // Unknown locale tag: fall through.
    }
    return items.join(', ');
  }

  /** `t('home.progression.<key>')` with the pathway placeholders filled in. */
  function tp(key: string, vars: Record<string, string> = {}): string {
    const values: Record<string, string> = {
      pathway: names.value.pathway,
      sequence: names.value.sequence,
      nextSequence: names.value.nextSequence,
      ...vars,
    };
    return Object.entries(values).reduce(
      (text, [name, value]) => text.split(`{${name}}`).join(value),
      t(`home.progression.${key}`),
    );
  }

  return {tp, names, list, recipe, ingredients, pathwayId, card, currentId};
}
