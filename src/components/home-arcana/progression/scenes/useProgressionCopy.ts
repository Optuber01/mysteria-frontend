/*
 * Copy helper shared by the progression chapter and its scenes.
 *
 * Strings live under `home.progression.*` and may contain {pathway},
 * {sequence} and {nextSequence} placeholders, filled from the localized
 * pathway archive in src/data/pathways.ts.
 *
 * That archive is ~1.7 MB of JSON, so it is not pulled into the homepage entry
 * chunk: `preloadPathwayNames()` imports it once the chapter approaches the
 * viewport. Until it resolves, the English names below stand in - in practice
 * the module has loaded long before the chapter is on screen.
 */
import {computed, shallowRef} from 'vue';
import {useI18n} from '@/composables/useI18n';
import type {Language} from '@/locales';

const PATHWAY_ID = 'fool';

type Ability = { id: string; name: string; description: string };
type PathwayCopy = {
  pathway: string;
  sequence: string;
  nextSequence: string;
  abilities: Ability[];
  nextAbilities: Ability[];
};

const FALLBACK: PathwayCopy = {
  pathway: 'Fool',
  sequence: 'Seer',
  nextSequence: 'Clown',
  abilities: [],
  nextAbilities: [],
};

type PathwaysModule = typeof import('@/data/pathways');
type ListFormatConstructor = new (locale: string, options: { type: 'conjunction' }) => { format(items: string[]): string };
const pathwaysModule = shallowRef<PathwaysModule | null>(null);
let pending: Promise<void> | null = null;

export function preloadPathwayNames(): Promise<void> {
  pending ??= import('@/data/pathways')
    .then((module) => {
      pathwaysModule.value = module;
    })
    .catch(() => {
      pending = null;
    });
  return pending;
}

function resolveCopy(module: PathwaysModule | null, language: Language): PathwayCopy {
  if (!module) return FALLBACK;
  const pathway = module.pathwayById(PATHWAY_ID);
  const rung = (sequence: number) => pathway?.sequences.find((entry) => entry.sequence === sequence);
  const abilities = (sequence: number): Ability[] =>
    (rung(sequence)?.abilities ?? []).map((ability) => ({
      id: ability.id,
      name: module.pick(ability.name, language),
      description: module.pick(ability.description, language),
    }));
  const next = rung(8);
  return {
    pathway: module.pathwayName(PATHWAY_ID, language),
    sequence: module.sequenceNineName(PATHWAY_ID, language) || FALLBACK.sequence,
    nextSequence: next ? module.pick(next.name, language) : FALLBACK.nextSequence,
    abilities: abilities(9),
    nextAbilities: abilities(8),
  };
}

export function useProgressionCopy() {
  const {t, currentLanguage, intlLocale} = useI18n();
  const names = computed(() => resolveCopy(pathwaysModule.value, currentLanguage.value));

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

  return {tp, names, list};
}
