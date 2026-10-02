import {computed, ref, shallowRef} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {
  ALL_CARDS,
  buildReading,
  cardById,
  CORE_CARDS,
  isCardId,
  loadPathways,
  type PathwaysModule,
  shellReading,
} from './arcana-data';

/*
 * One reading per page: which card is drawn, and the localized data behind it.
 * Module-level so the hero, the sections and the floating deck control share it.
 */

const STORAGE_KEY = 'mysterria-arcana-card';

/** The card whose colours the page currently wears (switches as the card is revealed). */
const currentId = ref('fool');
const data = shallowRef<PathwaysModule | null>(null);
/** Bumps on every draw, so sections can replay their small reveal. */
const drawCount = ref(0);

type Dealer = (targetId?: string) => Promise<void>;
let dealer: Dealer | null = null;
let dealerVisible = () => false;

export function storedCard(): string | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isCardId(value) ? value : null;
  } catch {
    return null;
  }
}

function remember(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Storage blocked: the reading simply resets on the next visit.
  }
}

export function ensurePathwayData() {
  if (data.value) return Promise.resolve(data.value);
  return loadPathways().then(module => (data.value = module));
}

/** Pick a random card id other than `except`, from the 22 by default. */
export function randomCard(except: string, pool = CORE_CARDS): string {
  const choices = pool.filter(card => card.id !== except);
  return choices[Math.floor(Math.random() * choices.length)].id;
}

export function useArcana() {
  const {currentLanguage} = useI18n();

  const card = computed(() => cardById(currentId.value));
  const reading = computed(() => {
    const module = data.value;
    return module ? buildReading(module, currentId.value, currentLanguage.value) : shellReading(currentId.value);
  });
  const readingFor = (id: string) => {
    const module = data.value;
    return module ? buildReading(module, id, currentLanguage.value) : shellReading(id);
  };
  const nameOf = (id: string) => (data.value ? data.value.pathwayName(id, currentLanguage.value) : cardById(id).en);
  const seq9Of = (id: string) => (data.value ? data.value.sequenceNineName(id, currentLanguage.value) : id === 'fool' ? 'Seer' : '');

  /** Wear a card: re-theme the page and remember it. */
  const reveal = (id: string) => {
    if (!isCardId(id)) return;
    currentId.value = id;
    drawCount.value++;
    remember(id);
  };

  /**
   * Draw from anywhere on the page. When the hero's table is on screen it deals
   * the card with the full animation; otherwise the page just re-themes.
   */
  const draw = async (targetId?: string) => {
    void ensurePathwayData();
    if (dealer && dealerVisible()) return dealer(targetId);
    reveal(targetId ?? randomCard(currentId.value));
  };

  const registerDealer = (fn: Dealer, visible: () => boolean) => {
    dealer = fn;
    dealerVisible = visible;
    return () => {
      if (dealer === fn) dealer = null;
    };
  };

  return {
    currentId,
    card,
    reading,
    readingFor,
    nameOf,
    seq9Of,
    data,
    drawCount,
    reveal,
    draw,
    registerDealer,
    allCards: ALL_CARDS,
  };
}
