import {onUnmounted, ref, shallowRef, type Directive} from 'vue';
import {SERVER_IP} from '@/composables/useServer';
import {SEASON_NUMERAL, SEASON_START} from '@/constants/season';

/* ------------------------------------------------------------------ *
 * Pathway catalogue. The ids are hard-coded so the gallery can lay out
 * (and reserve its space) before the 1.3 MB pathway module arrives; the
 * localized names come from that module, loaded on idle.
 * ------------------------------------------------------------------ */

/** The 22 canonical pathways, in the order the gallery shows them. */
export const CORE_IDS = [
  'fool', 'door', 'error', 'sun', 'tyrant', 'tower', 'hanged', 'darkness', 'death', 'giant', 'demoness',
  'priest', 'hermit', 'paragon', 'fortune', 'mother', 'moon', 'abyss', 'chained', 'justiciar', 'emperor', 'visionary',
] as const;

export const BOON_IDS = [
  'aeon', 'chaos', 'chaosmist', 'condenser', 'devouring', 'edict', 'everlasting', 'patriarch', 'secondlaw', 'sublunary',
] as const;

/** Sigil glow colour, sampled from each sigil's artwork. */
export const SIGIL_TINT: Record<string, string> = {
  abyss: '#e0402c', chained: '#b0a8d8', chaos: '#d89570', chaosmist: '#a2cad8', condenser: '#6dadd8',
  darkness: '#9cb7d8', death: '#d0d8b2', demoness: '#d869a1', devouring: '#d8b1ab', door: '#65c6d8',
  edict: '#95d8bf', emperor: '#739cd8', error: '#c4d4d8', aeon: '#a3b3d8', everlasting: '#b29dd8',
  fool: '#b4afd8', fortune: '#afccd8', giant: '#dd7847', hanged: '#dd4843', hermit: '#9c7bd8',
  justiciar: '#d8bea6', moon: '#d86b72', mother: '#92d8b1', paragon: '#d89953', patriarch: '#d88398',
  priest: '#e06046', secondlaw: '#cfd8bf', sublunary: '#d8ad73', sun: '#dec05a', tower: '#7895e2',
  tyrant: '#559bde', visionary: '#b2c6d8',
};

const file = (id: string) => (id === 'aeon' ? 'eternalaeon' : id);
export const sigilThumb = (id: string) => `/pathway-art/avif/thumbs/${file(id)}.avif`;
export const sigilLarge = (id: string) => `/pathway-art/avif/native/${file(id)}.avif`;

type PathwayModule = typeof import('@/data/pathways');
const pathwayModule = shallowRef<PathwayModule | null>(null);
let pathwayRequest: Promise<void> | null = null;

/** Loads the pathway data once, off the critical path. */
export function usePathwayData() {
  const load = () => {
    pathwayRequest ??= import('@/data/pathways').then(module => {
      pathwayModule.value = module;
    });
    return pathwayRequest;
  };
  return {pathways: pathwayModule, load};
}

export function whenIdle(callback: () => void, timeout = 1500) {
  const w = window as Window & {requestIdleCallback?: (cb: () => void, opts?: {timeout: number}) => number};
  if (w.requestIdleCallback) w.requestIdleCallback(callback, {timeout});
  else window.setTimeout(callback, 600);
}

/* ------------------------------------------------------------------ *
 * Season clock.
 * ------------------------------------------------------------------ */

export function seasonInfo(now = new Date()) {
  const day = Math.max(1, Math.floor((now.getTime() - SEASON_START.getTime()) / 86_400_000) + 1);
  return {numeral: SEASON_NUMERAL, day, started: now >= SEASON_START};
}

/* ------------------------------------------------------------------ *
 * Copy the address with honest feedback: "copied" only when the
 * clipboard actually took it, otherwise say so (the address stays
 * visible and selectable).
 * ------------------------------------------------------------------ */

export type CopyState = 'idle' | 'copied' | 'failed';

function legacyCopy(text: string): boolean {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.append(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

export function useAddressCopy() {
  const state = ref<CopyState>('idle');
  let timer: ReturnType<typeof setTimeout> | null = null;

  const copy = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(SERVER_IP);
      ok = true;
    } catch {
      ok = legacyCopy(SERVER_IP);
    }
    state.value = ok ? 'copied' : 'failed';
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => (state.value = 'idle'), ok ? 2200 : 4200);
  };

  onUnmounted(() => {
    if (timer) clearTimeout(timer);
  });

  return {state, copy, address: SERVER_IP};
}

/* ------------------------------------------------------------------ *
 * v-reveal: fades/slides an element in the first time it enters the
 * viewport. Motion lives in CSS (transform + opacity only) and is
 * switched off there for prefers-reduced-motion.
 * ------------------------------------------------------------------ */

let revealObserver: IntersectionObserver | null = null;

function observer() {
  revealObserver ??= new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      revealObserver?.unobserve(entry.target);
    }
  }, {rootMargin: '0px 0px -8% 0px', threshold: 0.08});
  return revealObserver;
}

export const vReveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    el.classList.add('bc-reveal');
    if (binding.value) el.style.setProperty('--bc-delay', `${binding.value}ms`);
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-in');
      return;
    }
    observer().observe(el);
  },
  unmounted(el) {
    revealObserver?.unobserve(el);
  },
};

/* ------------------------------------------------------------------ *
 * Scroll progress of an element through the viewport (0 → 1), written
 * to a CSS variable so transforms can follow it. One rAF per frame.
 * ------------------------------------------------------------------ */

export function useScrollProgress(target: () => HTMLElement | null, variable = '--bc-progress') {
  let frame: number | null = null;
  const update = () => {
    frame = null;
    const el = target();
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    if (rect.bottom < -vh || rect.top > vh * 2) return;
    const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
    el.style.setProperty(variable, progress.toFixed(4));
  };
  const onScroll = () => {
    if (frame === null) frame = requestAnimationFrame(update);
  };
  const start = () => {
    update();
    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onScroll, {passive: true});
  };
  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    if (frame !== null) cancelAnimationFrame(frame);
  });
  return {start};
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
