/**
 * Shared state and copy for the pathway chapter variants: which catalogue is
 * open (Pathways or Boons), which entry is chosen, and the labels every
 * variant prints. Copy follows PathwayOrbit so all directions read the same.
 */
import { computed, nextTick, ref } from 'vue';
import { boonPathways, localize, standardPathways, type HomePathway, type ProgressionKind } from '@/data/homePathways';
import { useI18n } from '@/composables/useI18n';

/* The Fool hosts the gathering above the fog: arcanum 0, then archive order. */
export const orderedPathways: readonly HomePathway[] = [
  ...standardPathways.filter((entry) => entry.id === 'fool'),
  ...standardPathways.filter((entry) => entry.id !== 'fool'),
];

const ROMAN: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];

export const fallbackSigil = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><circle cx="48" cy="48" r="39" fill="none" stroke="#a7acb5" stroke-width="2"/><path d="M48 20 58 39l20 9-20 9-10 19-10-19-20-9 20-9Z" fill="#a7acb5" opacity=".6"/></svg>')}`;

export function replaceBrokenImage(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  if (image.src !== fallbackSigil) image.src = fallbackSigil;
}

export const normalizeIndex = (value: number, length: number) => ((value % length) + length) % length;

export function usePathwayDeck(onSelect: (entry: HomePathway) => void, tabPrefix: string) {
  const { t, plural, currentLanguage } = useI18n();

  const activeKind = ref<ProgressionKind>('pathway');
  const selectedIndex = ref(0);
  const announcement = ref('');

  const activeCatalog = computed<readonly HomePathway[]>(() => activeKind.value === 'pathway' ? orderedPathways : boonPathways);
  const selectedEntry = computed(() => activeCatalog.value[selectedIndex.value] ?? activeCatalog.value[0]);
  const kindOptions = computed(() => [
    { id: 'pathway' as const, label: t('home.orbit.tabs.pathway'), count: standardPathways.length },
    { id: 'boon' as const, label: t('home.orbit.tabs.boon'), count: boonPathways.length },
  ]);

  /* ---- Copy ---- */

  const nameOf = (entry: HomePathway) => localize(entry.name, currentLanguage.value);
  const abilitiesOf = (entry: HomePathway) => entry.strengths.map((ability) => localize(ability, currentLanguage.value));
  const pad = (value: number) => String(value).padStart(2, '0');

  const countCopy = (key: string) => t(key).replace('{pathways}', String(standardPathways.length)).replace('{boons}', String(boonPathways.length));

  function countLabel(key: 'sequenceCount' | 'abilityCount', count: number) {
    const forms = { one: t(`home.orbit.${key}.one`), few: t(`home.orbit.${key}.few`), many: t(`home.orbit.${key}.many`) };
    return plural(count, forms).replace('{count}', String(count));
  }
  const archiveCounts = (entry: HomePathway) => `${countLabel('sequenceCount', entry.sequenceCount)} · ${countLabel('abilityCount', entry.abilityCount)}`;

  /** Chinese names a pathway after its Sequence 9, so the repeat is dropped there. */
  function startingName(entry: HomePathway) {
    const start = entry.startingSequence;
    if (!start) return '';
    const name = localize(start.name, currentLanguage.value);
    return name && name !== nameOf(entry) ? name : '';
  }

  /** "Sequence 9 · Seer" */
  function sequenceLabel(entry: HomePathway) {
    const start = entry.startingSequence;
    if (!start) return countLabel('sequenceCount', entry.sequenceCount);
    const name = startingName(entry);
    const number = String(start.number);
    return name
      ? t('home.orbit.sequenceNamed').replace('{number}', number).replace('{name}', name)
      : t('home.orbit.sequence').replace('{number}', number);
  }

  /** Just "Seer", or "Sequence 9" when the name would repeat the Pathway's. */
  function firstSequenceName(entry: HomePathway) {
    return startingName(entry) || (entry.startingSequence ? t('home.orbit.sequence').replace('{number}', String(entry.startingSequence.number)) : '');
  }

  function taglineOf(entry: HomePathway) {
    const key = `home.orbit.taglines.${entry.id}`;
    const tagline = t(key);
    return tagline === key ? t('home.orbit.taglineFallback').replace('{name}', nameOf(entry)) : tagline;
  }

  /** Pathways are Major Arcana from 0; Boons are numbered from I. */
  const arcanumNumber = (index: number) => activeKind.value === 'pathway' ? index : index + 1;
  function numeral(index: number) {
    let value = arcanumNumber(index);
    if (value === 0) return '0';
    let out = '';
    for (const [size, glyph] of ROMAN) while (value >= size) { out += glyph; value -= size; }
    return out;
  }
  const arcanumLabel = (index: number, shown = String(arcanumNumber(index))) => t('home.orbit.arcanum').replace('{numeral}', shown);
  const entryLabel = (entry: HomePathway, index: number) => `${arcanumLabel(index)}. ${nameOf(entry)}, ${sequenceLabel(entry)}`;
  const positionLabel = () => t('home.orbit.position').replace('{current}', String(selectedIndex.value + 1)).replace('{total}', String(activeCatalog.value.length));
  const archiveLabel = (entry: HomePathway) => t('home.orbit.openArchiveNamed').replace('{name}', nameOf(entry));

  /* ---- Selection ---- */

  /** Returns true when the selection changed. */
  function select(index: number, { announce = false } = {}) {
    const normalized = normalizeIndex(index, activeCatalog.value.length);
    if (normalized === selectedIndex.value) return false;
    selectedIndex.value = normalized;
    onSelect(activeCatalog.value[normalized]);
    if (announce) announcement.value = `${nameOf(activeCatalog.value[normalized])}. ${positionLabel()}`;
    return true;
  }

  function setKind(kind: ProgressionKind) {
    if (kind === activeKind.value) return false;
    activeKind.value = kind;
    selectedIndex.value = 0;
    onSelect(activeCatalog.value[0]);
    return true;
  }

  const tabId = (kind: ProgressionKind) => `${tabPrefix}-${kind}-tab`;

  /** Tabs pattern with automatic activation. */
  function onTabKeydown(event: KeyboardEvent) {
    const ids = kindOptions.value.map((option) => option.id);
    const current = ids.indexOf(activeKind.value);
    const target = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: ids.length - 1 }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const kind = ids[normalizeIndex(target, ids.length)];
    setKind(kind);
    void nextTick(() => document.getElementById(tabId(kind))?.focus());
  }

  /** Roving-tabindex radio keys. Returns the target index, or null if not handled. */
  function radioTarget(event: KeyboardEvent) {
    const length = activeCatalog.value.length;
    const target = {
      ArrowLeft: selectedIndex.value - 1, ArrowUp: selectedIndex.value - 1,
      ArrowRight: selectedIndex.value + 1, ArrowDown: selectedIndex.value + 1,
      Home: 0, End: length - 1,
    }[event.key];
    if (target === undefined) return null;
    event.preventDefault();
    return normalizeIndex(target, length);
  }

  return {
    t, currentLanguage,
    activeKind, selectedIndex, announcement, activeCatalog, selectedEntry, kindOptions,
    nameOf, abilitiesOf, pad, countCopy, archiveCounts, sequenceLabel, firstSequenceName, taglineOf,
    numeral, arcanumLabel, entryLabel, positionLabel, archiveLabel,
    select, setKind, tabId, onTabKeydown, radioTarget,
  };
}
