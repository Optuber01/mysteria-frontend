/*
 * The story's WebGL scenes (the book, the player) used to create their contexts,
 * compile their shaders and upload their textures at the moment the visitor first
 * scrolled into them: a 100-300 ms stall mid-scroll on integrated GPUs, and on a slow
 * connection seconds of an empty desk while three.js (~140 KB compressed) came down.
 * The story sits right under the hero, so they are made ready while the hero is read,
 * none of it in the first load:
 * - the downloads (three.js, the book's art, the names) start once the hero's own images
 *   are in;
 * - the scenes are built once the hero's intro deal is over too, one per idle slice, the
 *   book first (it is the first thing below the hero);
 * - a visitor who starts down the page sooner starts both at once.
 */
type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};

/** The hero's intro deal (~2 s of card motion; a shader compile holds the GPU's compositing). */
const SETTLE_MS = 1800;

let heroIn: (() => void) | null = null;
const heroImages = new Promise<void>((resolve) => (heroIn = resolve));
/** The hero's sky, moon and city have decoded (HeroNightScene): the first screen is complete. */
export function markHeroImagesIn() {
  heroIn?.();
}

let firstScreen: Promise<void> | null = null;
/** The first screen is complete: what comes next may use the network without slowing it. */
function firstScreenIn(): Promise<void> {
  if (!firstScreen) {
    // the load event stands in if the hero never says (it also waits on the chapters' images, so it comes later)
    if (document.readyState === 'complete') markHeroImagesIn();
    else addEventListener('load', () => markHeroImagesIn(), { once: true });
    firstScreen = heroImages;
  }
  return firstScreen;
}

let settled: Promise<void> | null = null;
/** The first screen is complete and the intro deal has played. */
function pageSettled(): Promise<void> {
  settled ??= Promise.all([firstScreenIn(), new Promise((done) => setTimeout(done, SETTLE_MS))]).then(() => undefined);
  return settled;
}

let moved: Promise<void> | null = null;
/** Resolves once the visitor has scrolled (or the page opened scrolled, e.g. coming back to it). */
function visitorMoved(): Promise<void> {
  moved ??= new Promise((resolve) => {
    if (scrollY > 0) return resolve();
    const onScroll = () => {
      if (scrollY <= 0) return;
      removeEventListener('scroll', onScroll);
      resolve();
    };
    addEventListener('scroll', onScroll, { passive: true });
  });
  return moved;
}

/** Time to download what the story needs: the first screen is in, or the visitor is on the way down. */
export function storyAssetsWanted(): Promise<void> {
  return Promise.race([firstScreenIn(), visitorMoved()]);
}

function inIdle(task: () => void, timeout: number) {
  const idle = (window as IdleWindow).requestIdleCallback;
  if (idle) idle(task, { timeout });
  else setTimeout(task, 0);
}

/** Runs `task` once, in an idle slice after the first screen has settled. Returns a cancel function. */
export function whenSettled(task: () => void): () => void {
  let cancelled = false;
  void pageSettled().then(() => {
    inIdle(() => {
      if (!cancelled) task();
    }, 2500);
  });
  return () => {
    cancelled = true;
  };
}

/* the scenes' warm-ups, one after another in the order they asked (the book mounts first) */
let queue: Promise<void> = Promise.resolve();

/**
 * Builds a scene ahead: once the page has settled or the visitor starts down it, in its
 * own idle slice after the scenes queued before it have finished theirs.
 */
export function whenWanted(task: () => unknown): () => void {
  let cancelled = false;
  const ready = Promise.race([pageSettled(), visitorMoved()]);
  queue = queue
    .then(() => ready)
    .then(() => new Promise<void>((done) => {
      inIdle(() => {
        if (cancelled) return done();
        void Promise.resolve()
          .then(task)
          .catch(() => undefined)
          .finally(done);
      }, 600);
    }));
  return () => {
    cancelled = true;
  };
}

let storyIn: (() => void) | null = null;
const storyMounted = new Promise<void>((resolve) => (storyIn = resolve));
/** The story is on the page (its scenes have queued their warm-ups). */
export function markStoryMounted() {
  storyIn?.();
}
/** The story is on the page and its scenes are built (or were skipped). */
export function storyWarmed(): Promise<void> {
  return storyMounted.then(() => queue);
}

/**
 * Whether an element is laid out (not inside the stacked fallback's display: none)
 * and within a few screens of the viewport, so a visitor is likely to reach it.
 */
export function isNearby(element: Element | null, screens = 3): boolean {
  if (!element || !element.getClientRects().length) return false;
  const rect = element.getBoundingClientRect();
  return rect.bottom > -innerHeight * screens && rect.top < innerHeight * screens;
}
