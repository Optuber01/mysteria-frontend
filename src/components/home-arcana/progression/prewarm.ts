/*
 * The story's WebGL scenes (the book, the player) used to create their contexts,
 * compile their shaders and upload their textures at the moment the visitor first
 * scrolled into them: a 100-300 ms stall mid-scroll on integrated GPUs. They now do
 * it ahead of time, once the page has settled (after the load event and the hero's
 * intro deal), in an idle slice.
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

/** Waits for the browser's next idle slice (a frame later where there is no idle callback). */
export function yieldToIdle(): Promise<void> {
  return new Promise((resolve) => {
    const idle = (window as IdleWindow).requestIdleCallback;
    if (idle) idle(() => resolve(), { timeout: 600 });
    else setTimeout(resolve, 16);
  });
}

/*
 * Prewarm work runs one task at a time, each in its own idle slice: the book, the player
 * and the backdrop used to start in the same slice and land as one ~450 ms block (with
 * three more long tasks right behind it), about 1.2 s of blocked input on a laptop at
 * second three. A task that returns a promise holds the queue until it settles, and
 * yields between its own heavy steps (yieldToIdle).
 */
let queue: Promise<void> = Promise.resolve();

/** Runs `task` once, in an idle slice after the page has settled, after earlier prewarm tasks. Returns a cancel function. */
export function whenSettled(task: () => void | Promise<unknown>): () => void {
  let cancelled = false;
  queue = queue
    .then(() => pageSettled())
    .then(() => yieldToIdle())
    .then(async () => {
      if (!cancelled) await task();
    })
    .catch(() => undefined);
  return () => {
    cancelled = true;
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
