/*
 * Where everything stands on the stage, from its measured size (px). One
 * vertical axis runs down the middle of the stage: the book, the cauldron
 * under it, the potion over the cauldron and the player on the cauldron's
 * spot all share it, so each step hands over to the next in place.
 */

/** The rig's camera frames the open book at this fraction of the box (see VanillaBookRig). */
export const BOOK_FILL = { w: 12 / (11.4 * 1.24), h: 10 / 11.4 } as const;
export const BOOK_RATIO = 1.24;
/** Cauldron art (cauldron/*.png, 320 x 336): liquid plane and footing, as fractions of the image. */
export const CAULDRON_ART = { ratio: 336 / 320, liquidY: 0.369, footY: 0.7619 } as const;

/** Where the figure stands in MinecraftPlayer's frame (zoom 0.66, fov 40): feet and hat top, as fractions of its height. */
export const PLAYER_FRAME = { feet: 0.8, top: 0.06 } as const;

export type Box = { x: number; y: number; w: number; h: number };
export type StageLayout = {
  w: number;
  h: number;
  cx: number;
  /** The open book while it is read (Discover). */
  book: Box;
  bookCaptionY: number;
  /** The book while it pours its ingredients (Brew): scale and offset of the whole book window. */
  bookBrew: { s: number; tx: number; ty: number };
  cauldron: { x: number; top: number; w: number; h: number; liquidY: number; floorY: number; circleW: number };
  /** Where the finished potion floats, waiting to be taken. */
  potion: { x: number; y: number; size: number };
  /** The player's box: feet on the cauldron's spot. */
  player: Box;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function stageLayout(w: number, h: number): StageLayout | null {
  if (w <= 0 || h <= 0) return null;
  const cx = w / 2;
  const caption = 34;

  // Discover: the biggest book that fits under its caption.
  const bookW = Math.min(720, w, h * BOOK_RATIO, ((h - caption) / BOOK_FILL.h) * BOOK_RATIO * 0.98);
  const bookH = bookW / BOOK_RATIO;
  const visualH = bookH * BOOK_FILL.h;
  const bookY = caption + (h - caption - visualH) / 2 - (bookH - visualH) / 2;
  const book = { x: (w - bookW) / 2, y: bookY, w: bookW, h: bookH };
  const bookCaptionY = bookY + (bookH - visualH) / 2 - caption + 6;

  // Brew: the cauldron stands at the foot of the stage, its circle on the floor.
  const cw = clamp(Math.min(w * 0.24, h * 0.3), 120, 230);
  const ch = cw * CAULDRON_ART.ratio;
  const circleW = Math.min(cw * 1.8, w * 0.7);
  const floorY = h - circleW * 0.25 - 4;
  const top = floorY - CAULDRON_ART.footY * ch;
  const liquidY = top + CAULDRON_ART.liquidY * ch;
  const cauldron = { x: cx, top, w: cw, h: ch, liquidY, floorY, circleW };

  // ...and the book hangs over it, small enough to leave the drops room to fall.
  const gap = clamp(h * 0.06, 26, 54);
  const bandH = Math.max(80, top - gap);
  const s = Math.min(0.78, (bandH / BOOK_FILL.h) / bookH, (w * 0.92) / (bookW * BOOK_FILL.w));
  const brewH = bookH * s;
  const brewY = Math.max(0, bandH / 2 - brewH / 2 + 2);
  const brewX = cx - (bookW * s) / 2;
  const bookBrew = { s, tx: brewX - book.x * s, ty: brewY - book.y * s };

  // The potion floats above the brew, where the player will reach for it.
  const potionSize = clamp(Math.round(h * 0.11 / 16) * 16, 48, 96);
  const potion = { x: cx, y: Math.max(potionSize, top - potionSize * 0.9), size: potionSize };

  // The player: feet on the circle, hat clear of the stage's top even as he
  // rises at the awakening (MinecraftPlayer frames him: feet at PLAYER_FRAME.feet).
  const ph = Math.min(h * 0.94, (floorY - 18) / (PLAYER_FRAME.feet - PLAYER_FRAME.top + 0.02));
  const pw = ph * 0.62;
  const player = { x: cx - pw / 2, y: floorY - PLAYER_FRAME.feet * ph, w: pw, h: ph };

  return { w, h, cx, book, bookCaptionY, bookBrew, cauldron, potion, player };
}
