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

type IdleWindow = Window & {requestIdleCallback?: (callback: () => void, options?: {timeout: number}) => number};
const REACHING = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;

/**
 * The localized names, ladders and abilities are ~1.3 MB, and the first screen needs none
 * of them (the deck's own table and the Fool's inline reading paint it). They are fetched
 * once the page has loaded and gone idle, or as soon as the visitor touches, types or
 * scrolls, whichever comes first. A draw, the ring and the potion story still ask directly.
 */
export function schedulePathwayData() {
  if (data.value || typeof window === 'undefined') return;
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    REACHING.forEach(type => window.removeEventListener(type, start, true));
    void ensurePathwayData().catch(() => undefined);
  };
  REACHING.forEach(type => window.addEventListener(type, start, {capture: true, passive: true, once: true}));
  const whenIdle = () => {
    const idle = (window as IdleWindow).requestIdleCallback;
    if (idle) idle(start, {timeout: 4000});
    else setTimeout(start, 1500);
  };
  if (document.readyState === 'complete') whenIdle();
  else window.addEventListener('load', whenIdle, {once: true});
}

/*
 * The re-theme. A new accent restyles every element on the page in one go, so it must never
 * land mid-animation, and easing --acc itself would pay that every frame (80-270 ms a frame
 * on a laptop; easing each element's colours instead cost a second a frame). So the accent
 * switches once under a View Transition, and the old and new page crossfade on the compositor.
 *
 * Chrome clears :hover inside everything a View Transition captures, so capturing the whole
 * page dropped the hovered card or button for the length of the crossfade (it fell back and
 * jumped up again). The page is captured region by region instead (header, each section,
 * footer...), all but the one under the hand, which stays live and keeps its hover.
 * A captured element is drawn above everything that is not, so nothing that overlaps the
 * live region may be captured: not the page's ambient layer (it crossfades itself,
 * ArcanaHome), nothing inside the live region, and no region over or under it on screen
 * (the fixed header over the hero, the deck control): those stay live with it. The hero's large tints crossfade themselves too
 * (keyed copies, `arc-tint`), so whichever region is live, its sky does not snap.
 */
type Recolour = {finished: Promise<void>; skipTransition?: () => void};
type TransitionDocument = Document & {startViewTransition?: (update: () => Promise<void>) => Recolour};
let recolour: Recolour | null = null;

const REGIONS = '.concept-arcana > :not(.arc-main, .arc-ambient), .concept-arcana > .arc-main > *';

/** Names the regions the crossfade captures (on screen, not under the hand); returns how to unname them. */
function nameRegions(): () => void {
  const vh = window.innerHeight;
  const regions = [...document.querySelectorAll<HTMLElement>(REGIONS)]
      .map(el => ({el, r: el.getBoundingClientRect()}))
      .filter(({r}) => r.bottom > 0 && r.top < vh && r.width > 0 && r.height > 0);
  const hovered = [...document.querySelectorAll<HTMLElement>(':hover')].at(-1) ?? null;
  const live = regions.find(({el}) => hovered && el.contains(hovered));
  // Sections paint past their own boxes (the hero's sky runs ~350 px down behind the story,
  // the story's backdrop ~390 px up), so neighbours count as overlapping within this reach.
  const SPILL = 400;
  const overlaps = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top - SPILL < b.bottom && b.top - SPILL < a.bottom;
  const named: HTMLElement[] = [];
  for (const {el, r} of regions) {
    if (live && (el === live.el || overlaps(r, live.r))) continue;
    el.style.setProperty('view-transition-name', `arc-region-${named.length}`);
    named.push(el);
  }
  return () => named.forEach(el => el.style.removeProperty('view-transition-name'));
}

function crossfade(update: () => void): Promise<void> {
  const doc = document as TransitionDocument;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!doc.startViewTransition || reduce || document.visibilityState !== 'visible') {
    update();
    return Promise.resolve();
  }
  const root = document.documentElement;
  // Selects this crossfade's own timing (ArcanaHome), and leaves the root itself uncaptured.
  root.classList.add('arc-recolour');
  const unname = nameRegions();
  let transition: Recolour;
  try {
    transition = doc.startViewTransition(() => {
      update();
      return nextTick();
    });
  } catch {
    unname();
    root.classList.remove('arc-recolour');
    update();
    return Promise.resolve();
  }
  recolour = transition;
  return transition.finished.catch(() => undefined).then(() => {
    unname();
    if (recolour === transition) {
      recolour = null;
      root.classList.remove('arc-recolour');
    }
  });
}

/** A newer draw cuts in: the crossfade still running jumps to its end (the new colours). */
export function settleRecolour() {
  recolour?.skipTransition?.();
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
  const seq9Of = (id: string) => (data.value ? data.value.sequenceNineName(id, currentLanguage.value) : cardById(id).seq9);

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
