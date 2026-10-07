/*
 * Enter and leave for <Transition :css="false" v-bind="fade(...)">, on the Web Animations
 * API: nothing is read back (Vue's class-based transitions force a reflow and read the
 * computed style of every element they move), and opacity animates on the compositor.
 * A leaving element carries `is-leaving`, and leaves from whatever it shows now (even half
 * way through its own entrance), so a quick second draw never jumps.
 */
import type {TransitionProps} from 'vue';

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function run(el: Element, duration: number, frames: Keyframe[], done: () => void, cancelAfter: boolean) {
  if (typeof el.animate !== 'function') return done();
  const animation = el.animate(frames, {duration: reduced() ? Math.min(duration, 200) : duration, easing: 'ease', fill: 'both'});
  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    done();
    if (cancelAfter) animation.cancel();
  };
  animation.onfinish = finish;
  animation.oncancel = finish;
}

export function fade(enter: number, leave = enter): TransitionProps {
  return {
    css: false,
    onEnter: (el, done) => run(el, enter, [{opacity: 0}, {opacity: 1}], done, true),
    onLeave: (el, done) => {
      el.classList.add('is-leaving');
      run(el, leave, [{opacity: 0}], done, false);
    },
  };
}
