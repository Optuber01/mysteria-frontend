/*
 * Eases a box's height from what it was to what it now holds (a list that was filtered,
 * content that was swapped), so whatever follows it moves instead of jumping. One run per
 * box: a new change starts from wherever the last one had got to. It clips while it runs
 * (new content rises into the opening box, gone content is cut as it shrinks), and keeps
 * to the shared timing: --arc-dur-2 and --arc-ease, so with reduced motion it does nothing.
 */
const runs = new WeakMap<HTMLElement, Animation>();

/** The box's height now, mid-ease or at rest. */
export const heightOf = (el: HTMLElement) => el.getBoundingClientRect().height;

export function easeHeight(el: HTMLElement, from: number, to?: number) {
  runs.get(el)?.cancel();
  runs.delete(el);
  el.classList.remove('is-resizing');
  const style = getComputedStyle(el);
  const duration = parseFloat(style.getPropertyValue('--arc-dur-2')) || 0;
  const target = to ?? heightOf(el);
  if (!duration || Math.abs(target - from) < 1) return;
  el.classList.add('is-resizing');
  const run = el.animate(
      {height: [`${from}px`, `${target}px`]},
      {duration, easing: style.getPropertyValue('--arc-ease').trim() || 'ease-out'},
  );
  runs.set(el, run);
  const done = () => {
    if (runs.get(el) !== run) return;
    runs.delete(el);
    el.classList.remove('is-resizing');
  };
  run.onfinish = done;
  run.oncancel = done;
}
