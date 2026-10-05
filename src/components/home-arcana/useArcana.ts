import {computed, nextTick, ref, shallowRef} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {
  ALL_CARDS,
  type ArcanaCard,
  buildReading,
  cardById,
  CORE_CARDS,
  isCardId,
  loadPathways,
  NEUTRAL_ACCENT,
  type PathwaysModule,
  shellReading,
} from './arcana-data';

/*
 * One reading per page: which card is drawn, and the localized data behind it.
 * Module-level so the hero, the sections and the floating deck control share it.
 */

const STORAGE_KEY = 'mysterria-arcana-card';

export function storedCard(): string | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isCardId(value) ? value : null;
  } catch {
    return null;
  }
}

const stored = typeof window === 'undefined' ? null : storedCard();
/**
 * The card the page is about. Until the visitor draws, it is the Fool as an
 * example (sections show its recipe and abilities) while the page wears the
 * neutral accent; a returning visitor's card is in place from the first paint.
 */
const currentId = ref(stored ?? 'fool');
/** True once the visitor has drawn a card, on this visit or an earlier one. */
const hasDrawn = ref(stored !== null);
const data = shallowRef<PathwaysModule | null>(null);
/** Bumps on every draw, so sections can replay their small reveal. */
const drawCount = ref(0);

type Dealer = (targetId?: string) => Promise<void>;
let dealer: Dealer | null = null;
let dealerVisible = () => false;

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

/*
 * The re-theme. A new accent restyles every element on the page in one go (a few hundred
 * ms on a laptop), so it must never land mid-animation, and easing --acc itself would pay
 * that every frame. Where View Transitions exist, the switch happens once under a snapshot
 * and the old and new pages crossfade on the compositor (no repaint per frame); elsewhere
 * the colours switch at once and the ambient wash crossfades (ArcanaHome).
 */
type Recolour = {finished: Promise<void>};
type TransitionDocument = Document & {startViewTransition?: (update: () => Promise<void>) => Recolour};
let recolour: Recolour | null = null;

function crossfade(update: () => void): Promise<void> {
  const doc = document as TransitionDocument;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!doc.startViewTransition || reduce || document.visibilityState !== 'visible') {
    update();
    return Promise.resolve();
  }
  const root = document.documentElement;
  // Selects this crossfade's own timing (ArcanaHome), apart from the theme switch's.
  root.classList.add('arc-recolour');
  let transition: Recolour;
  try {
    transition = doc.startViewTransition(() => {
      update();
      return nextTick();
    });
  } catch {
    root.classList.remove('arc-recolour');
    update();
    return Promise.resolve();
  }
  recolour = transition;
  const done = transition.finished.catch(() => undefined).then(() => {
    if (recolour === transition) {
      recolour = null;
      root.classList.remove('arc-recolour');
    }
  });
  return done;
}

/** Pick a random card id other than `except`, from the 22 by default. */
export function randomCard(except: string, pool = CORE_CARDS): string {
  const choices = pool.filter(card => card.id !== except);
  return choices[Math.floor(Math.random() * choices.length)].id;
}

export function useArcana() {
  const {currentLanguage} = useI18n();

  /** The current card; before the first draw it carries the neutral accent instead of its own. */
  const card = computed<ArcanaCard>(() => {
    const value = cardById(currentId.value);
    return hasDrawn.value ? value : {...value, accent: NEUTRAL_ACCENT};
  });
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

  /**
   * Wear a card: re-theme the page and remember it. Only a real draw calls this, and
   * only once nothing is mid-flight. With `crossfade` the whole page eases into the new
   * accent; the promise settles when it has.
   */
  const reveal = (id: string, options: {crossfade?: boolean} = {}) => {
    if (!isCardId(id)) return Promise.resolve();
    const apply = () => {
      currentId.value = id;
      hasDrawn.value = true;
      drawCount.value++;
      remember(id);
    };
    if (!options.crossfade) {
      apply();
      return Promise.resolve();
    }
    return crossfade(apply);
  };

  /**
   * Draw from anywhere on the page. When the hero's table is on screen it deals
   * the card with the full animation; otherwise the page just re-themes
   * (crossfading into the new accent when asked to).
   */
  const draw = async (targetId?: string, options: {crossfade?: boolean} = {}) => {
    void ensurePathwayData();
    if (dealer && dealerVisible()) return dealer(targetId);
    return reveal(targetId ?? (hasDrawn.value ? randomCard(currentId.value) : randomCard('')), options);
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
    hasDrawn,
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
