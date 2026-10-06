/*
 * Enter and leave animations for <Transition :css="false" v-bind="fade(...)">.
 *
 * Vue's class-based transitions measure: every leave forces a synchronous reflow
 * (offsetHeight) and every enter and leave reads getComputedStyle to learn its duration.
 * A card switch leaves nine of them at once (the scene's grade, weather and two signature
 * layers, the page wash, the brewery's grade, the dock, the companion's sigil), so each
 * draw paid nine style passes, the first a full-page one, in the middle of its render.
 * These run on the Web Animations API instead: nothing is read back, and opacity and
 * transform animate on the compositor.
 *
 * A leaving element carries `is-leaving` (for styles that change while it goes).
 */
import type {TransitionProps} from 'vue';

export interface FadeStep {
  /** Keyframes; opacity 0 -> 1 on enter, and on leave to 0 from wherever it is, when omitted. */
  frames?: Keyframe[];
  duration: number;
  easing?: string;
  delay?: number;
}

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function run(el: Element, step: FadeStep | undefined, frames: Keyframe[], done: () => void) {
  if (!step || typeof el.animate !== 'function') {
    done();
    return;
  }
  const quiet = reduced();
  // reduced motion: only the opacity, briefly, towards where it ends
  const end = (step.frames ?? frames).at(-1)?.opacity ?? 1;
  const animation = el.animate(quiet ? [{opacity: end}] : step.frames ?? frames, {
    duration: quiet ? Math.min(step.duration, 200) : step.duration,
    easing: step.easing ?? 'ease',
    delay: quiet ? 0 : step.delay ?? 0,
    fill: 'both',
  });
  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    done();
    // an entered element keeps no animation; a leaving one is removed with its own
    if (!el.classList.contains('is-leaving')) animation.cancel();
  };
  animation.onfinish = finish;
  animation.oncancel = finish;
}

export function fade(enter: FadeStep | undefined, leave: FadeStep | undefined = enter): TransitionProps {
  return {
    css: false,
    onEnter: (el, done) => run(el, enter, [{opacity: 0}, {opacity: 1}], done),
    onLeave: (el, done) => {
      el.classList.add('is-leaving');
      // one keyframe: it leaves from whatever it shows now (even half way through its enter)
      run(el, leave, [{opacity: 0}], done);
    },
  };
}
