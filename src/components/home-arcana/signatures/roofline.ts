/*
 * The skyline's roofline (backlund-skyline.webp, 1920 x 1080): for every 16 px across, the
 * first opaque row from the top. Signatures that grow along the castle (vines, thorns) or
 * aim at its towers read it, so they land on the real silhouette at every size.
 */

export const ROOF_W = 1920;
export const ROOF_H = 1080;
export const ROOF_STEP = 16;

/** y of the roof at x = i * ROOF_STEP (image px). */
export const ROOF: readonly number[] = [854, 806, 793, 792, 792, 792, 792, 792, 792, 780, 744, 740, 718, 718, 720, 744, 728, 691, 674, 674, 689, 748, 764, 756, 674, 667, 666, 666, 668, 671, 671, 644, 644, 648, 660, 655, 651, 645, 640, 625, 619, 563, 535, 512, 528, 561, 623, 632, 658, 672, 672, 660, 660, 567, 526, 520, 518, 461, 459, 424, 408, 390, 390, 390, 410, 426, 438, 439, 456, 456, 431, 424, 428, 428, 421, 405, 414, 414, 393, 237, 232, 226, 222, 222, 228, 232, 297, 354, 356, 193, 180, 178, 178, 173, 172, 170, 165, 165, 169, 255, 389, 512, 512, 512, 512, 514, 527, 560, 560, 556, 511, 503, 495, 484, 482, 482, 484, 496, 536, 527];

/** The roof's y at any x (image px), linearly interpolated. */
export function roofAt(x: number): number {
  const f = Math.max(0, Math.min(ROOF.length - 1, x / ROOF_STEP));
  const i = Math.floor(f);
  const j = Math.min(ROOF.length - 1, i + 1);
  return ROOF[i]! + (ROOF[j]! - ROOF[i]!) * (f - i);
}

/** The castle keep's two towers right of the moon (image px): edges, centre and top. */
export const TOWERS = {
  left: {x0: 1268, x1: 1374, x: 1321, top: 222},
  right: {x0: 1436, x1: 1582, x: 1509, top: 166},
} as const;
