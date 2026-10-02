import {onMounted, onUnmounted, ref, type Ref} from 'vue';

/*
 * One rAF-throttled scroll loop for the whole Ascent page. Sections register
 * an element and get a 0..1 progress written to it as the CSS var `--p`
 * (plus an optional callback), so the choreography lives in CSS transforms
 * and opacity and Vue never re-renders per frame.
 *
 * "Flat" mode (narrow screens or reduced motion) drops the tall sticky
 * stages: scenes then play once on a short timer when they enter view, or
 * jump straight to their end state when motion is reduced.
 */

export type ProgressMode =
/** Tall container with a sticky child: 0 when it pins, 1 when it unpins. */
    | 'sticky'
    /** 0 as the element's top enters the bottom edge, 1 as its bottom leaves the top. */
    | 'through'
    /** How far the viewport's centre line has travelled through the element. */
    | 'center';

type Entry = {
  el: HTMLElement;
  mode: ProgressMode;
  last: number;
  /** Writes `--p` unless false; a scene playing on a timer owns `--p` itself. */
  write: boolean;
  onProgress?: (p: number) => void;
};

const entries = new Set<Entry>();
let frame = 0;
let listening = false;

const clamp = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);

function measure(entry: Entry, vh: number) {
  const rect = entry.el.getBoundingClientRect();
  if (entry.mode === 'sticky') {
    const span = rect.height - vh;
    return span <= 0 ? (rect.top <= 0 ? 1 : 0) : clamp(-rect.top / span);
  }
  if (entry.mode === 'through') return clamp((vh - rect.top) / (vh + rect.height));
  return clamp((vh * 0.5 - rect.top) / rect.height);
}

function tick() {
  frame = 0;
  const vh = window.innerHeight;
  for (const entry of entries) {
    const p = measure(entry, vh);
    if (Math.abs(p - entry.last) < 0.0005) continue;
    entry.last = p;
    if (entry.write) entry.el.style.setProperty('--p', p.toFixed(4));
    entry.onProgress?.(p);
  }
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(tick);
}

function listen() {
  if (listening) return;
  listening = true;
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule, {passive: true});
}

function unlistenIfIdle() {
  if (entries.size || !listening) return;
  listening = false;
  window.removeEventListener('scroll', schedule);
  window.removeEventListener('resize', schedule);
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
}

const FLAT_QUERY = '(max-width: 899px), (prefers-reduced-motion: reduce)';
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia(REDUCED_QUERY).matches;
}

export function isFlatLayout() {
  return typeof window !== 'undefined' && window.matchMedia(FLAT_QUERY).matches;
}

/** Re-evaluates a media query reactively. */
export function useMedia(query: string) {
  const matches = ref(false);
  let list: MediaQueryList | null = null;
  const update = () => {
    matches.value = !!list?.matches;
  };
  onMounted(() => {
    list = window.matchMedia(query);
    update();
    list.addEventListener('change', update);
  });
  onUnmounted(() => list?.removeEventListener('change', update));
  return matches;
}

/** Imperative form for elements the caller found itself; returns an unsubscribe. */
export function trackElement(el: HTMLElement, mode: ProgressMode, onProgress?: (p: number) => void, write = false) {
  const entry: Entry = {el, mode, last: -1, write, onProgress};
  entries.add(entry);
  listen();
  schedule();
  return () => {
    entries.delete(entry);
    unlistenIfIdle();
  };
}

export function useScrollProgress(
    target: Ref<HTMLElement | null>,
    mode: ProgressMode,
    onProgress?: (p: number) => void,
) {
  let entry: Entry | null = null;
  onMounted(() => {
    if (!target.value) return;
    entry = {el: target.value, mode, last: -1, write: true, onProgress};
    entries.add(entry);
    listen();
    schedule();
  });
  onUnmounted(() => {
    if (entry) entries.delete(entry);
    unlistenIfIdle();
  });
}

/**
 * A scene scrubbed by scroll on wide screens (`sticky` container) and played
 * on a timer when it scrolls into view in the flat layout.
 */
export function useScene(target: Ref<HTMLElement | null>, durationMs = 3600, onProgress?: (p: number) => void) {
  let entry: Entry | null = null;
  let observer: IntersectionObserver | null = null;
  let raf = 0;
  let query: MediaQueryList | null = null;

  const set = (p: number) => {
    target.value?.style.setProperty('--p', p.toFixed(4));
    onProgress?.(p);
  };

  const stopPlay = () => {
    observer?.disconnect();
    observer = null;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const play = () => {
    const start = performance.now();
    const step = (now: number) => {
      const t = clamp((now - start) / durationMs);
      set(t);
      raf = t < 1 ? requestAnimationFrame(step) : 0;
    };
    raf = requestAnimationFrame(step);
  };

  const configure = () => {
    const el = target.value;
    if (!el) return;
    stopPlay();
    if (entry) {
      entries.delete(entry);
      entry = null;
    }
    if (prefersReducedMotion()) {
      set(1);
      return;
    }
    if (isFlatLayout()) {
      set(0);
      observer = new IntersectionObserver(records => {
        if (records.some(record => record.isIntersecting)) {
          observer?.disconnect();
          observer = null;
          play();
        }
      }, {threshold: 0, rootMargin: '0px 0px -30% 0px'});
      observer.observe(el);
      return;
    }
    entry = {el, mode: 'sticky', last: -1, write: true, onProgress};
    entries.add(entry);
    listen();
    schedule();
  };

  onMounted(() => {
    query = window.matchMedia(FLAT_QUERY);
    query.addEventListener('change', configure);
    configure();
  });
  onUnmounted(() => {
    query?.removeEventListener('change', configure);
    stopPlay();
    if (entry) entries.delete(entry);
    unlistenIfIdle();
  });
}

/**
 * Adds `.is-in` to every `[data-rv]` element inside the root once it scrolls
 * into view. CSS owns the actual motion; without JS nothing is hidden.
 */
export function useReveals(root: Ref<HTMLElement | null>) {
  let observer: IntersectionObserver | null = null;
  onMounted(() => {
    const el = root.value;
    if (!el) return;
    el.classList.add('rv-ready');
    const targets = el.querySelectorAll<HTMLElement>('[data-rv]');
    if (prefersReducedMotion()) {
      targets.forEach(node => node.classList.add('is-in'));
      return;
    }
    observer = new IntersectionObserver(records => {
      for (const record of records) {
        if (!record.isIntersecting) continue;
        record.target.classList.add('is-in');
        observer?.unobserve(record.target);
      }
    }, {rootMargin: '0px 0px -12% 0px', threshold: 0.01});
    targets.forEach(node => observer?.observe(node));
  });
  onUnmounted(() => observer?.disconnect());
}
