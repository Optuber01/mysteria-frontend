/*
 * Small shared helpers for the signature moments (signatures/*.vue). Not a component:
 * SceneSignature only globs the .vue files.
 */
import {onMounted, onUnmounted, type Ref} from 'vue';

/** A seeded random stream, so procedural shapes (cracks, frost, glyphs) are the same on every load. */
export function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Keeps a moon-sized box glued to the scene's moon. The hero moves the moon on its own:
 * it rises from behind the castle on arrival (a CSS transition on .night__moon-rise) and
 * sinks a little slower than the far scene on the way down (an inline transform on
 * .night__moon). `follow` gets the moon's scroll transform, copied whenever the hero
 * writes it (no layout reads); `rise` replays the moon's rise transition, in step.
 * Both boxes must be laid out exactly over the moon (2r square at the moon's centre).
 */
export function useMoonAnchor(follow: Ref<HTMLElement | null>, rise: Ref<HTMLElement | null>) {
  let styleWatch: MutationObserver | null = null;
  let classWatch: MutationObserver | null = null;
  let frame = 0;

  onMounted(() => {
    const outer = follow.value;
    const night = outer?.closest<HTMLElement>('.night');
    const moon = night?.querySelector<HTMLElement>('.night__moon');
    const moonRise = night?.querySelector<HTMLElement>('.night__moon-rise');
    if (!outer || !night || !moon || !moonRise) return;

    const copy = () => {
      outer.style.transform = moon.style.transform;
    };
    copy();
    styleWatch = new MutationObserver(copy);
    styleWatch.observe(moon, {attributes: true, attributeFilter: ['style']});

    const inner = rise.value;
    if (!inner || reducedMotion()) return;
    const mirror = () => {
      frame = 0;
      for (const a of moonRise.getAnimations()) {
        if (!(a instanceof CSSTransition) || a.transitionProperty !== 'transform' || !(a.effect instanceof KeyframeEffect)) continue;
        const timing = a.effect.getTiming();
        const keys = a.effect.getKeyframes().map(k => ({offset: k.offset, transform: String(k.transform)}));
        const m = inner.animate(keys, {duration: timing.duration, delay: timing.delay, easing: timing.easing, fill: 'backwards'});
        m.currentTime = a.currentTime;
      }
    };
    if (night.classList.contains('is-risen')) {
      mirror();
    } else {
      // the moon waits below the castle until the hero lets it rise
      inner.style.transform = 'translate3d(0, 34%, 0)';
      classWatch = new MutationObserver(() => {
        if (!night.classList.contains('is-risen')) return;
        inner.style.transform = '';
        classWatch?.disconnect();
        classWatch = null;
        frame = requestAnimationFrame(mirror);
      });
      classWatch.observe(night, {attributes: true, attributeFilter: ['class']});
    }
  });

  onUnmounted(() => {
    styleWatch?.disconnect();
    classWatch?.disconnect();
    if (frame) cancelAnimationFrame(frame);
  });
}
