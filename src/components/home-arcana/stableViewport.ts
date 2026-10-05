/*
 * The viewport height to lay sections out from. On a phone the browser's bars slide away
 * and back as you scroll, and innerHeight follows them: anything sized from it re-laid
 * itself out mid-scroll. On touch screens a height change under 200 px at the same width
 * is those bars, so it is ignored; rotation, a new width or a real resize still count.
 */
let stableW = 0;
let stableH = 0;

export function stableViewportHeight(): number {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  if (!coarse || !stableH || w !== stableW || Math.abs(h - stableH) > 200) {
    stableW = w;
    stableH = h;
  }
  return stableH;
}
