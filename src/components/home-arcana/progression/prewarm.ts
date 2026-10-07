/*
 * The story's WebGL scenes (the book, the player) used to create their contexts,
 * compile their shaders and upload their textures at the moment the visitor first
 * scrolled into them: a 100-300 ms stall mid-scroll on integrated GPUs. They now do
 * it ahead of time, in an idle slice once the page has settled (after the load event
 * and the hero's intro deal) and the visitor has started down the page: three.js is
 * ~620 KB, so a visitor who only reads the first screen never downloads it.
 */
type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};

/** Past the load event and the hero's intro deal (~2 s of card motion). */
const SETTLE_MS = 1800;

let settled: Promise<void> | null = null;
function pageSettled(): Promise<void> {
  settled ??= new Promise((resolve) => {
    const after = () => setTimeout(resolve, SETTLE_MS);
    if (document.readyState === 'complete') after();
    else addEventListener('load', after, { once: true });
  });
  return settled;
}

/** Runs `task` once, in an idle slice after the page has settled. Returns a cancel function. */
export function whenSettled(task: () => void): () => void {
  let cancelled = false;
  void pageSettled().then(() => {
    if (cancelled) return;
    const run = () => {
      if (!cancelled) task();
    };
    const idle = (window as IdleWindow).requestIdleCallback;
    if (idle) idle(run, { timeout: 2500 });
    else setTimeout(run, 0);
  });
  return () => {
    cancelled = true;
  };
}

let moved: Promise<void> | null = null;
/** Resolves once the visitor has scrolled (or the page opened scrolled, e.g. coming back to it). */
export function visitorMoved(): Promise<void> {
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

/** Like whenSettled, but only once the visitor has started down the page too. */
export function whenApproached(task: () => void): () => void {
  let cancelled = false;
  let cancelSettled: (() => void) | null = null;
  void visitorMoved().then(() => {
    if (!cancelled) cancelSettled = whenSettled(task);
  });
  return () => {
    cancelled = true;
    cancelSettled?.();
  };
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
