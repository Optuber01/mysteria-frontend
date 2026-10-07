<template>
  <div ref="hostRef" class="vanilla-book-rig" aria-hidden="true">
    <canvas ref="canvasRef" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
// Types only: three.js itself is imported on demand (see loadThree) so it
// stays out of the homepage entry chunk until the chapter approaches.
import type * as THREE from 'three';
import bookAtlasUrl from '@/assets/images/home/progression/vanilla-book/vanilla_minecraft_book_reference_1.21.8/enchanting_table_book_1.21.8.png';
import { hexToRgb, loadImage, mixRgb, rgbCss } from '../art';
import { isNearby, whenWanted } from '../prewarm';
import type { Rgb } from '../art';

export type BookEntry = { key: string; name: string; role: string; icon: string | null };
export type BookLabels = {
  mainHeading: string;
  supplementaryHeading: string;
  main: BookEntry[];
  supplementary: BookEntry[];
  note: string;
  coverPathway: string;
  coverSequence: string;
  coverName: string;
  /** The Pathway's recipe-book item (cover emblem and the page seal). */
  recipeBook: string | null;
  accent: string;
};
/** A point on the book, normalised to the rig's box (0..1), with the icon's size. */
export type BookAnchor = { x: number; y: number; size: number; rect: { l: number; t: number; r: number; b: number } };
export type BookAnchors = Record<string, BookAnchor>;

const props = withDefaults(defineProps<{
  progress: number;
  labels: BookLabels;
  reducedMotion?: boolean;
  /** Start downloading three.js and the artwork before the book is needed. */
  warm?: boolean;
  /** Ingredient keys that have left the page (their icons are hidden). */
  hidden?: string[];
  /**
   * The reader's hand, over what the scroll says (null to follow it): 0 open flat, 1 shut on
   * its front cover (the left half folded over), -1 shut on its back (the right half over).
   */
  fold?: number | null;
}>(), {
  reducedMotion: false,
  warm: false,
  hidden: () => [],
  fold: null,
});
const emit = defineEmits<{ (e: 'anchors', value: BookAnchors): void }>();

const hostRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

let renderer: THREE.WebGLRenderer | null = null;
let camera: THREE.OrthographicCamera | null = null;
let scene: THREE.Scene | null = null;
let bookRoot: THREE.Group | null = null;
let frontCover: THREE.Group | null = null;
let leftPages: THREE.Group | null = null;
let backCover: THREE.Group | null = null;
let rightPages: THREE.Group | null = null;
let resizeObserver: ResizeObserver | null = null;
let intersectionObserver: IntersectionObserver | null = null;
let initialized = false;
let sourceTexture: THREE.Texture | null = null;
let disposed = false;
let inView = false;
let three!: typeof import('three');
let builtKey = '';
let buildToken = 0;
const ownedTextures: THREE.Texture[] = [];
const ownedMaterials: THREE.Material[] = [];
const ownedGeometries: THREE.BufferGeometry[] = [];
/** Ingredient icon meshes by key, plus 'seal' (the recipe book on the right page). */
const iconMeshes = new Map<string, THREE.Mesh>();
/** Hotspot rectangles in face-local units, by the same keys. */
const entryRects = new Map<string, { mesh: THREE.Object3D; l: number; t: number; r: number; b: number }>();

/* The page canvases: 630 x 1038 px mapped onto 5.25 x 8.65 units. */
const PAGE = { w: 630, h: 1038, uw: 5.25, uh: 8.65 };
const ENTRY_TOPS = [150, 360] as const;
const ICON = { x: 44, dy: 26, size: 112 };
const SEAL = { cx: 104, cy: 872, size: 84 };

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
function smoothstep(value: number): number {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
}
function phase(progress: number, start: number, end: number): number {
  return smoothstep((progress - start) / (end - start));
}

const FONT = {
  display: '"Commissioner", "Segoe UI", system-ui, sans-serif',
  body: '"Golos Text", "Segoe UI", system-ui, sans-serif',
  caps: '"Tenor Sans", "Segoe UI", system-ui, sans-serif',
};

type TexturePainter = (context: CanvasRenderingContext2D, width: number, height: number) => void;

function makeRegionTexture(
  u: number,
  v: number,
  width: number,
  height: number,
  painter?: TexturePainter,
  coverPalette?: Rgb,
): THREE.Texture {
  if (!sourceTexture) throw new Error('Book atlas has not loaded.');
  const crop = document.createElement('canvas');
  const isIllustratedPage = Boolean(painter);
  crop.width = isIllustratedPage ? PAGE.w : width;
  crop.height = isIllustratedPage ? PAGE.h : height;
  // CPU-backed: it is read back (cover recolour) and uploaded as a texture, never drawn on screen
  const context = crop.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('A 2D canvas is required to slice the book atlas.');
  context.imageSmoothingEnabled = false;
  context.drawImage(sourceTexture.image as CanvasImageSource, u, v, width, height, 0, 0, crop.width, crop.height);
  if (coverPalette) recolorCoverTexture(context, coverPalette);
  painter?.(context, crop.width, crop.height);
  const texture = new three.CanvasTexture(crop);
  texture.colorSpace = three.SRGBColorSpace;
  texture.magFilter = isIllustratedPage ? three.LinearFilter : three.NearestFilter;
  texture.minFilter = isIllustratedPage ? three.LinearMipmapLinearFilter : three.NearestFilter;
  texture.generateMipmaps = isIllustratedPage;
  texture.anisotropy = isIllustratedPage && renderer ? Math.min(4, renderer.capabilities.getMaxAnisotropy()) : 1;
  texture.wrapS = three.ClampToEdgeWrapping;
  texture.wrapT = three.ClampToEdgeWrapping;
  ownedTextures.push(texture);
  return texture;
}

/** Leather in the drawn Pathway's colour (deep shades of the accent), bone clasps. */
function recolorCoverTexture(context: CanvasRenderingContext2D, accent: Rgb) {
  const { width, height } = context.canvas;
  const image = context.getImageData(0, 0, width, height);
  const data = image.data;
  const black: Rgb = [10, 8, 12];
  const leatherRamp = [mixRgb(accent, black, 0.86), mixRgb(accent, black, 0.76), mixRgb(accent, black, 0.64)];
  const claspRamp: Rgb[] = [[186, 182, 194], [228, 226, 236]];
  const wornRamp = [mixRgb(accent, [120, 116, 128], 0.7), mixRgb(accent, [150, 146, 158], 0.72)];
  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] === 0) continue;
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const brightness = (red + green + blue) / (3 * 255);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const isClasp = red >= 205 && green >= 135 && blue <= 105 && brightness >= 0.58 && saturation >= 0.46;
    const ramp = isClasp ? claspRamp : saturation < 0.16 && brightness > 0.58 ? wornRamp : leatherRamp;
    const [r, g, b] = ramp[Math.min(ramp.length - 1, Math.floor(brightness * ramp.length))];
    data[index] = r;
    data[index + 1] = g;
    data[index + 2] = b;
  }
  context.putImageData(image, 0, 0);
}

/** A crisp item texture: 128 px pixel art, sampled nearest at every size. */
function makeIconTexture(source: CanvasImageSource): THREE.Texture {
  const texture = new three.Texture(source as HTMLImageElement);
  texture.colorSpace = three.SRGBColorSpace;
  texture.magFilter = three.NearestFilter;
  texture.minFilter = three.NearestFilter;
  texture.generateMipmaps = false;
  texture.wrapS = three.ClampToEdgeWrapping;
  texture.wrapT = three.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  ownedTextures.push(texture);
  return texture;
}

/** Stand-in for an ingredient without a texture: a pixel rune in the accent. */
function runeCanvas(accent: Rgb): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return canvas;
  const rows = ['......XX......', '.....XooX.....', '....XoAAoX....', '...XoA..AoX...', '..XoA.AA.AoX..', '..XoA.AA.AoX..', '...XoA..AoX...', '....XoAAoX....', '.....XooX.....', '......XX......'];
  const colors: Record<string, string> = { X: rgbCss(mixRgb(accent, [10, 8, 12], 0.7)), o: rgbCss(mixRgb(accent, [10, 8, 12], 0.35)), A: rgbCss(mixRgb(accent, [255, 255, 255], 0.3)) };
  rows.forEach((row, y) => [...row].forEach((cell, x) => {
    if (!colors[cell]) return;
    context.fillStyle = colors[cell];
    context.fillRect(x + 1, y + 3, 1, 1);
  }));
  return canvas;
}

const PIXEL_GLYPHS: Record<string, readonly string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10011', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  ':': ['00000', '00100', '00100', '00000', '00100', '00100', '00000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
};

function drawPixelGlyph(context: CanvasRenderingContext2D, glyph: string, x: number, y: number, pixelSize: number) {
  const rows = PIXEL_GLYPHS[glyph];
  if (!rows) return;
  rows.forEach((row, rowIndex) => {
    [...row].forEach((cell, columnIndex) => {
      if (cell === '1') context.fillRect(x + columnIndex * pixelSize, y + rowIndex * pixelSize, pixelSize, pixelSize);
    });
  });
}

function drawPixelLine(context: CanvasRenderingContext2D, label: string, centerX: number, y: number, pixelSize: number) {
  const glyphWidth = 5 * pixelSize;
  const gap = pixelSize;
  const width = label.length * glyphWidth + Math.max(0, label.length - 1) * gap;
  let x = Math.round(centerX - width / 2);
  for (const glyph of label) {
    if (glyph !== ' ') drawPixelGlyph(context, glyph, x, y, pixelSize);
    x += glyphWidth + gap;
  }
}

function makeLabelTexture(width: number, height: number, painter: (context: CanvasRenderingContext2D) => void, smooth = false): THREE.Texture {
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = width;
  labelCanvas.height = height;
  const context = labelCanvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('A 2D canvas is required to prepare the book label.');
  painter(context);
  const texture = new three.CanvasTexture(labelCanvas);
  texture.colorSpace = three.SRGBColorSpace;
  texture.magFilter = smooth ? three.LinearFilter : three.NearestFilter;
  texture.minFilter = smooth ? three.LinearMipmapLinearFilter : three.NearestFilter;
  texture.generateMipmaps = smooth;
  ownedTextures.push(texture);
  return texture;
}

function drawPixelLineWithShadow(context: CanvasRenderingContext2D, label: string, centerX: number, y: number, pixelSize: number, color = '#efeef3') {
  context.fillStyle = 'rgba(8, 6, 10, 0.84)';
  drawPixelLine(context, label, centerX + 3, y + 3, pixelSize);
  context.fillStyle = color;
  drawPixelLine(context, label, centerX, y, pixelSize);
}

function fitsPixelFont(label: string, pixelSize: number, maxWidth: number): boolean {
  const width = label.length * 6 * pixelSize - pixelSize;
  return width <= maxWidth && [...label].every((glyph) => glyph === ' ' || glyph in PIXEL_GLYPHS);
}

/** Pixel lettering where the glyph set covers the label (and it fits); the display face otherwise. */
function drawCoverLine(context: CanvasRenderingContext2D, label: string, centerX: number, y: number, pixelSize: number, color: string) {
  const text = label.toLocaleUpperCase();
  const maxWidth = context.canvas.width - 120;
  for (const size of [pixelSize, pixelSize - 1]) {
    if (size >= 2 && fitsPixelFont(text, size, maxWidth)) {
      drawPixelLineWithShadow(context, text, centerX, y + (pixelSize - size) * 3, size, color);
      return;
    }
  }
  context.save();
  context.font = `700 ${pixelSize * 7}px ${FONT.display}`;
  context.textAlign = 'center';
  context.textBaseline = 'top';
  context.fillStyle = 'rgba(8, 6, 10, 0.84)';
  context.fillText(text, centerX + 3, y + 3, maxWidth);
  context.fillStyle = color;
  context.fillText(text, centerX, y, maxWidth);
  context.restore();
}

function paintCoverArtwork(context: CanvasRenderingContext2D, labels: BookLabels) {
  const width = context.canvas.width;
  const height = context.canvas.height;
  const accent = hexToRgb(labels.accent);
  const acc = rgbCss(accent);
  const accText = rgbCss(mixRgb(accent, [255, 255, 255], 0.25));
  const ink = '#efeef3';
  const inkDim = 'rgba(239, 238, 243, 0.4)';

  context.fillStyle = rgbCss(mixRgb(accent, [10, 8, 12], 0.88), 0.8);
  context.fillRect(28, 30, width - 56, height - 60);
  context.strokeStyle = acc;
  context.lineWidth = 6;
  context.strokeRect(34, 36, width - 68, height - 72);
  context.strokeStyle = inkDim;
  context.lineWidth = 2;
  context.strokeRect(50, 52, width - 100, height - 104);

  context.fillStyle = ink;
  const corner = 30;
  const notch = 12;
  for (const [x, y, xDirection, yDirection] of [
    [50, 52, 1, 1],
    [width - 50, 52, -1, 1],
    [50, height - 52, 1, -1],
    [width - 50, height - 52, -1, -1],
  ] as const) {
    context.fillRect(x, y, corner * xDirection, 5 * yDirection);
    context.fillRect(x, y, 5 * xDirection, corner * yDirection);
    context.fillRect(x + notch * xDirection, y + notch * yDirection, 8 * xDirection, 8 * yDirection);
  }

  // the emblem frame: the recipe book itself is a separate, nearest-sampled mesh
  context.fillStyle = 'rgba(8, 6, 10, 0.9)';
  context.fillRect(92, 88, width - 184, 168);
  context.strokeStyle = acc;
  context.lineWidth = 3;
  context.strokeRect(98, 94, width - 196, 156);

  drawCoverLine(context, labels.coverPathway, width / 2, 286, 3, ink);
  context.fillStyle = acc;
  context.fillRect(86, 345, 126, 4);
  context.fillRect(width - 212, 345, 126, 4);
  context.fillRect(width / 2 - 8, 337, 16, 16);

  drawCoverLine(context, labels.coverSequence, width / 2, 392, 5, ink);
  drawCoverLine(context, labels.coverName, width / 2, 474, 4, accText);

  context.fillStyle = acc;
  for (let x = 120; x <= width - 120; x += 32) context.fillRect(x, 700, 12, 4);
}

function drawRule(context: CanvasRenderingContext2D, y: number, width: number, dashed = false) {
  context.save();
  context.strokeStyle = 'rgba(70, 62, 52, 0.45)';
  context.lineWidth = 2;
  context.setLineDash(dashed ? [10, 8] : []);
  context.beginPath();
  context.moveTo(44, y);
  context.lineTo(width - 44, y);
  context.stroke();
  context.restore();
}

/** Ink for the accent on cream paper: the accent, darkened until it reads. */
function inkOf(accent: Rgb): string {
  return rgbCss(mixRgb(accent, [20, 12, 26], 0.66));
}

function drawHeading(context: CanvasRenderingContext2D, label: string, width: number, accent: Rgb) {
  context.save();
  context.fillStyle = inkOf(accent);
  context.font = `600 44px ${FONT.display}`;
  context.fillText(label, 48, 86, width - 96);
  context.restore();
  drawRule(context, 110, width);
}

/** How many lines wrapText would set `text` in. */
function countLines(context: CanvasRenderingContext2D, text: string, maxWidth: number): number {
  const words = text.includes(' ') ? text.split(' ') : [...text];
  const joiner = text.includes(' ') ? ' ' : '';
  let line = '';
  let lines = 1;
  for (const word of words) {
    const candidate = line ? `${line}${joiner}${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      line = word;
      lines++;
    } else {
      line = candidate;
    }
  }
  return lines;
}

function wrapText(context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 3): number {
  // CJK has no spaces: fall back to breaking between characters.
  const words = text.includes(' ') ? text.split(' ') : [...text];
  const joiner = text.includes(' ') ? ' ' : '';
  let line = '';
  let lineY = y;
  let lines = 1;
  for (const word of words) {
    const candidate = line ? `${line}${joiner}${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth && lines < maxLines) {
      context.fillText(line, x, lineY);
      line = word;
      lineY += lineHeight;
      lines++;
    } else {
      line = candidate;
    }
  }
  if (line) context.fillText(line, x, lineY, maxWidth);
  return lineY;
}

/** The entry's text; its icon is a mesh laid on the empty slot drawn here. */
function drawEntry(context: CanvasRenderingContext2D, entry: BookEntry, top: number, width: number, accent: Rgb) {
  context.save();
  // the slot the ingredient rests in: a faint frame that stays when it leaves
  context.fillStyle = 'rgba(70, 58, 40, 0.1)';
  context.fillRect(ICON.x - 6, top + ICON.dy - 6, ICON.size + 12, ICON.size + 12);
  context.strokeStyle = 'rgba(70, 58, 40, 0.32)';
  context.lineWidth = 2;
  context.strokeRect(ICON.x - 6, top + ICON.dy - 6, ICON.size + 12, ICON.size + 12);

  const textX = ICON.x + ICON.size + 26;
  context.fillStyle = '#1d1a16';
  context.font = `600 31px ${FONT.body}`;
  const lastLineY = wrapText(context, entry.name, textX, top + 62, width - textX - 30, 37);
  context.fillStyle = inkOf(accent);
  context.font = `400 22px ${FONT.caps}`;
  context.letterSpacing = '2px';
  context.fillText(entry.role.toLocaleUpperCase(), textX, Math.max(top + 120, lastLineY + 38), width - textX - 30);
  context.restore();
}

// Softens the vanilla page's big texels so the writing reads first.
const PAPER_WASH = 'rgba(244, 236, 210, 0.62)';

function paintLeftFormula(labels: BookLabels): TexturePainter {
  const accent = hexToRgb(labels.accent);
  return (context, width) => {
    context.fillStyle = PAPER_WASH;
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    drawHeading(context, labels.mainHeading, width, accent);
    labels.main.slice(0, 2).forEach((entry, index) => drawEntry(context, entry, ENTRY_TOPS[index], width, accent));
  };
}

function paintRightFormula(labels: BookLabels): TexturePainter {
  const accent = hexToRgb(labels.accent);
  return (context, width, height) => {
    context.fillStyle = PAPER_WASH;
    context.fillRect(0, 0, width, height);
    drawHeading(context, labels.supplementaryHeading, width, accent);
    labels.supplementary.slice(0, 2).forEach((entry, index) => drawEntry(context, entry, ENTRY_TOPS[index], width, accent));

    drawRule(context, 775, width, true);
    context.save();
    context.strokeStyle = rgbCss(mixRgb(accent, [24, 16, 30], 0.5), 0.6);
    context.lineWidth = 3;
    context.beginPath();
    context.arc(SEAL.cx, SEAL.cy, 59, 0, Math.PI * 2);
    context.stroke();
    // the note itself, centred on the seal beside it (no kicker over it)
    context.fillStyle = '#3f382f';
    context.font = `400 25px ${FONT.body}`;
    const lineCount = Math.min(3, countLines(context, labels.note, width - 228));
    wrapText(context, labels.note, 184, SEAL.cy + 9 - ((lineCount - 1) * 33) / 2, width - 228, 33);
    context.restore();
  };
}

function basicMaterial(parameters: THREE.MeshBasicMaterialParameters): THREE.MeshBasicMaterial {
  const material = new three.MeshBasicMaterial(parameters);
  ownedMaterials.push(material);
  return material;
}

function geometry<T extends THREE.BufferGeometry>(value: T): T {
  ownedGeometries.push(value);
  return value;
}

function addTexturedLeaf(
  hinge: THREE.Group,
  options: {
    width: number;
    height: number;
    depth: number;
    z: number;
    color: number;
    front: [number, number, number, number];
    back: [number, number, number, number];
    frontPainter?: TexturePainter;
    backPainter?: TexturePainter;
    coverPalette?: Rgb;
  },
): { front: THREE.Mesh; back: THREE.Mesh } {
  const { width, height, depth, z, color, front, back, frontPainter, backPainter, coverPalette } = options;
  if (depth > 0) {
    const body = new three.Mesh(geometry(new three.BoxGeometry(width, height, depth)), basicMaterial({ color }));
    body.position.set(width / 2, 0, z);
    hinge.add(body);
  }
  const faceGeometry = geometry(new three.PlaneGeometry(width, height));
  const faceMaterial = (map: THREE.Texture) => basicMaterial({
    map,
    transparent: false,
    depthTest: true,
    depthWrite: true,
    blending: three.NoBlending,
    side: three.FrontSide,
  });
  const frontFace = new three.Mesh(faceGeometry, faceMaterial(makeRegionTexture(...front, frontPainter, coverPalette)));
  frontFace.position.set(width / 2, 0, z + depth / 2 + 0.006);
  hinge.add(frontFace);

  const backFace = new three.Mesh(faceGeometry, faceMaterial(makeRegionTexture(...back, backPainter, coverPalette)));
  backFace.position.set(width / 2, 0, z - depth / 2 - 0.006);
  backFace.rotation.y = Math.PI;
  hinge.add(backFace);
  return { front: frontFace, back: backFace };
}

/** Canvas px on a page -> that page face's local units. */
function pageLocal(cx: number, cy: number): [number, number] {
  return [(cx / PAGE.w - 0.5) * PAGE.uw, (0.5 - cy / PAGE.h) * PAGE.uh];
}

function addIcon(face: THREE.Object3D, key: string, source: CanvasImageSource, cx: number, cy: number, size: number) {
  const unit = (size / PAGE.w) * PAGE.uw;
  const material = basicMaterial({ map: makeIconTexture(source), transparent: true, alphaTest: 0.5, depthTest: true, depthWrite: true, side: three.FrontSide });
  const mesh = new three.Mesh(geometry(new three.PlaneGeometry(unit, unit)), material);
  const [x, y] = pageLocal(cx, cy);
  mesh.position.set(x, y, 0.01);
  mesh.visible = !props.hidden.includes(key);
  face.add(mesh);
  iconMeshes.set(key, mesh);
}

function addEntries(face: THREE.Object3D, entries: BookEntry[], images: Map<string, CanvasImageSource>) {
  entries.slice(0, 2).forEach((entry, index) => {
    const top = ENTRY_TOPS[index];
    const image = images.get(entry.key);
    if (image) addIcon(face, entry.key, image, ICON.x + ICON.size / 2, top + ICON.dy + ICON.size / 2, ICON.size);
    const [l, t] = pageLocal(ICON.x - 14, top + 8);
    const [r, b] = pageLocal(PAGE.w - 26, top + ICON.dy + ICON.size + 18);
    entryRects.set(entry.key, { mesh: face, l, t, r, b });
  });
}

function buildBook(labels: BookLabels, images: Map<string, CanvasImageSource>) {
  if (!scene) return;
  const accent = hexToRgb(labels.accent);

  bookRoot = new three.Group();
  scene.add(bookRoot);

  backCover = new three.Group();
  bookRoot.add(backCover);
  addTexturedLeaf(backCover, { width: 6, height: 10, depth: 0.24, z: -0.42, color: 0x15121a, front: [16, 0, 6, 10], back: [22, 0, 6, 10], coverPalette: accent });

  rightPages = new three.Group();
  bookRoot.add(rightPages);
  const right = addTexturedLeaf(rightPages, {
    width: PAGE.uw, height: PAGE.uh, depth: 0, z: -0.18, color: 0xe8ddb4,
    front: [13, 11, 5, 8], back: [19, 11, 5, 8],
    frontPainter: paintRightFormula(labels),
  });
  addEntries(right.front, labels.supplementary, images);
  const seal = images.get('__book');
  if (seal) addIcon(right.front, 'seal', seal, SEAL.cx, SEAL.cy, SEAL.size);
  {
    const [l, t] = pageLocal(30, 800);
    const [r, b] = pageLocal(PAGE.w - 26, 960);
    entryRects.set('seal', { mesh: right.front, l, t, r, b });
  }

  leftPages = new three.Group();
  bookRoot.add(leftPages);
  const left = addTexturedLeaf(leftPages, {
    width: PAGE.uw, height: PAGE.uh, depth: 0, z: 0.18, color: 0xeee4bd,
    front: [1, 11, 5, 8], back: [7, 11, 5, 8],
    backPainter: paintLeftFormula(labels),
  });
  addEntries(left.back, labels.main, images);

  frontCover = new three.Group();
  bookRoot.add(frontCover);
  addTexturedLeaf(frontCover, { width: 6, height: 10, depth: 0.24, z: 0.55, color: 0x15121a, front: [0, 0, 6, 10], back: [6, 0, 6, 10], coverPalette: accent });

  const coverLabel = new three.Mesh(
    geometry(new three.PlaneGeometry(4.72, 7.38)),
    basicMaterial({
      map: makeLabelTexture(512, 800, (context) => paintCoverArtwork(context, labels), true),
      transparent: true,
      alphaTest: 0.08,
      side: three.FrontSide,
    }),
  );
  coverLabel.position.set(3, 0, 0.686);
  frontCover.add(coverLabel);
  if (seal) {
    // the recipe book in the cover's emblem frame (canvas 512 x 800 -> 4.72 x 7.38)
    const size = (136 / 512) * 4.72;
    const emblem = new three.Mesh(
      geometry(new three.PlaneGeometry(size, size)),
      basicMaterial({ map: makeIconTexture(seal), transparent: true, alphaTest: 0.5, side: three.FrontSide }),
    );
    emblem.position.set(0, (0.5 - 172 / 800) * 7.38, 0.004);
    coverLabel.add(emblem);
  }

  const seam = new three.Mesh(
    geometry(new three.BoxGeometry(0.42, 10.15, 0.76)),
    basicMaterial({ map: makeRegionTexture(12, 0, 2, 10, undefined, accent), blending: three.NoBlending }),
  );
  seam.position.z = 0.06;
  bookRoot.add(seam);

  // The entrance presents the book edge-on: the seam's -X face is the spine.
  const spineLabel = new three.Mesh(
    geometry(new three.PlaneGeometry(0.32, 4)),
    basicMaterial({
      map: makeLabelTexture(72, 512, (context) => {
        context.save();
        context.translate(36, 256);
        context.rotate(Math.PI / 2);
        drawPixelLineWithShadow(context, 'MYSTERRIA', 0, -18, 5);
        context.restore();
      }),
      transparent: true,
      alphaTest: 0.08,
      side: three.FrontSide,
    }),
  );
  spineLabel.position.set(-0.218, 0.45, 0.06);
  spineLabel.rotation.y = -Math.PI / 2;
  bookRoot.add(spineLabel);
}

function updatePose() {
  if (!bookRoot || !frontCover || !leftPages || !backCover || !rightPages) return;
  const p = props.reducedMotion ? 1 : clamp01(props.progress);
  const descend = phase(p, 0, 0.2);
  const faceCover = phase(p, 0.2, 0.43);
  const held = props.fold === null ? null : Math.min(1, Math.max(-1, props.fold));
  // in the hand a cover follows the finger, and its page lands a step ahead of it
  const opening = held === null ? phase(p, 0.5, 0.88) : 1 - Math.max(0, held);
  const pageOpening = held === null ? phase(p, 0.55, 0.9) : clamp01((opening - 0.1) / 0.9);
  const backFold = held === null ? 0 : Math.max(0, -held);
  const flat = held === null ? 1 : 1 - Math.abs(held);
  const settle = phase(p, 0.88, 1) * flat;

  bookRoot.visible = props.reducedMotion || p > 0.004;
  // a short fall into place (the scene fades it in): never from beyond the canvas edge
  bookRoot.position.y = (1 - descend) * 1.6 - settle * 0.08;
  // centred edge-on, then on the cover (which spans x 0..6), then on the open spread
  // (shut on its back, the book lies on the left half, x -6..0)
  bookRoot.position.x = -3 * faceCover * (1 - opening) + 3 * backFold;
  bookRoot.rotation.y = (Math.PI / 2) * (1 - faceCover);
  bookRoot.rotation.x = -0.06 - opening * (1 - backFold) * 0.035;
  bookRoot.rotation.z = -0.045 * (1 - faceCover) + Math.sin(settle * Math.PI) * 0.012;
  bookRoot.scale.setScalar(0.9 + descend * 0.1);

  frontCover.rotation.y = -Math.PI * 0.985 * opening;
  leftPages.rotation.y = -Math.PI * pageOpening;
  // the other way: the right page folds over onto the left one, then the back cover over both.
  // The same turn as the front cover's (negative): the half lifts towards the reader and over,
  // never back through the pages behind it.
  rightPages.rotation.y = -Math.PI * clamp01(backFold / 0.9);
  backCover.rotation.y = -Math.PI * 0.985 * backFold;
  render();
}

function resize() {
  if (!renderer || !camera || !hostRef.value) return;
  const width = Math.max(1, hostRef.value.clientWidth);
  const height = Math.max(1, hostRef.value.clientHeight);
  const aspect = width / height;
  // layout.ts BOOK_FILL mirrors this framing
  const viewHeight = 11.4;
  camera.left = -(viewHeight * aspect) / 2;
  camera.right = (viewHeight * aspect) / 2;
  camera.top = viewHeight / 2;
  camera.bottom = -viewHeight / 2;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
  render();
}

let projector: THREE.Vector3 | null = null;
let lastAnchors = '';
/** Where each ingredient sits on screen (normalised to the rig box). */
function emitAnchors() {
  if (!camera || !bookRoot) return;
  bookRoot.updateMatrixWorld(true);
  projector ??= new three.Vector3();
  const v = projector;
  const project = (object: THREE.Object3D, x: number, y: number): [number, number] => {
    v.set(x, y, 0);
    object.localToWorld(v);
    v.project(camera as THREE.OrthographicCamera);
    return [(v.x + 1) / 2, (1 - v.y) / 2];
  };
  const anchors: BookAnchors = {};
  for (const [key, rect] of entryRects) {
    const icon = iconMeshes.get(key);
    const a = project(rect.mesh, rect.l, rect.t);
    const b = project(rect.mesh, rect.r, rect.b);
    let center: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let size = 0;
    if (icon) {
      center = project(icon, 0, 0);
      const params = (icon.geometry as THREE.PlaneGeometry).parameters;
      const top = project(icon, 0, params.height / 2);
      size = Math.abs(center[1] - top[1]) * 2;
    }
    anchors[key] = {
      x: center[0],
      y: center[1],
      size,
      rect: { l: Math.min(a[0], b[0]), t: Math.min(a[1], b[1]), r: Math.max(a[0], b[0]), b: Math.max(a[1], b[1]) },
    };
  }
  const serial = JSON.stringify(anchors, (_, value) => (typeof value === 'number' ? Math.round(value * 2000) / 2000 : value));
  if (serial === lastAnchors) return;
  lastAnchors = serial;
  emit('anchors', anchors);
}

/* Pose, hotspot and resize changes in one tick share a single WebGL frame. */
let renderQueued = false;
function render() {
  if (renderQueued) return;
  renderQueued = true;
  queueMicrotask(() => {
    renderQueued = false;
    if (disposed || !renderer || !scene || !camera || !bookRoot?.visible) return;
    renderer.render(scene, camera);
    emitAnchors();
  });
}

function disposeBookResources() {
  ownedGeometries.forEach((item) => item.dispose());
  ownedMaterials.forEach((item) => item.dispose());
  ownedTextures.forEach((item) => item.dispose());
  ownedGeometries.length = 0;
  ownedMaterials.length = 0;
  ownedTextures.length = 0;
  iconMeshes.clear();
  entryRects.clear();
}

function labelsKey(labels: BookLabels): string {
  return JSON.stringify(labels);
}

/** Loads every image the book needs for these labels (cached), the fallback rune for missing ones. */
async function imagesFor(labels: BookLabels): Promise<Map<string, CanvasImageSource>> {
  const accent = hexToRgb(labels.accent);
  const entries = [...labels.main, ...labels.supplementary];
  const images = new Map<string, CanvasImageSource>();
  await Promise.all([
    ...entries.map(async (entry) => {
      const image = entry.icon ? await loadImage(entry.icon).catch(() => null) : null;
      images.set(entry.key, image ?? runeCanvas(accent));
    }),
    (async () => {
      const image = labels.recipeBook ? await loadImage(labels.recipeBook).catch(() => null) : null;
      if (image) images.set('__book', image);
    })(),
  ]);
  return images;
}

/** (Re)builds the book for the current labels: a new card, a new language. */
async function rebuildBook() {
  if (!scene || !initialized) return;
  const key = labelsKey(props.labels);
  if (key === builtKey) return;
  const token = ++buildToken;
  const labels = JSON.parse(key) as BookLabels;
  const images = await imagesFor(labels);
  if (disposed || token !== buildToken || !scene) return;
  if (bookRoot) scene.remove(bookRoot);
  disposeBookResources();
  bookRoot = null;
  frontCover = null;
  leftPages = null;
  lastAnchors = '';
  buildBook(labels, images);
  builtKey = key;
  updatePose();
}

type LoadedAssets = { module: typeof import('three'); atlas: HTMLImageElement };
let assets: Promise<LoadedAssets> | null = null;

function loadAssets(): Promise<LoadedAssets> {
  const fonts = document.fonts;
  assets ??= Promise.all([
    import('three'),
    loadImage(bookAtlasUrl),
    fonts
      ? Promise.all([
        fonts.load(`600 44px ${FONT.display}`),
        fonts.load(`600 31px ${FONT.body}`),
        fonts.load(`400 21px ${FONT.caps}`),
      ]).catch(() => undefined)
      : Promise.resolve(),
  ]).then(([module, atlas]) => ({ module, atlas }));
  assets.catch(() => {
    assets = null;
  });
  return assets;
}

// The WebGL context is only created once the book actually has to draw.
function shouldInitialize() {
  return inView && (props.progress > 0 || props.reducedMotion);
}

async function initialize() {
  if (initialized || disposed || !canvasRef.value || !hostRef.value) return;
  initialized = true;
  let loaded: LoadedAssets;
  try {
    loaded = await loadAssets();
  } catch (error) {
    initialized = false;
    console.warn('The formula book could not be loaded.', error);
    return;
  }
  if (disposed || !canvasRef.value || !hostRef.value) return;
  three = loaded.module;

  renderer = new three.WebGLRenderer({ canvas: canvasRef.value, alpha: true, antialias: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = three.SRGBColorSpace;

  scene = new three.Scene();
  camera = new three.OrthographicCamera(-8, 8, 6.4, -6.4, 0.1, 100);
  camera.position.set(0, 0, 24);
  camera.lookAt(0, 0, 0);

  sourceTexture = new three.Texture(loaded.atlas);
  sourceTexture.colorSpace = three.SRGBColorSpace;
  sourceTexture.magFilter = three.NearestFilter;
  sourceTexture.minFilter = three.NearestFilter;
  sourceTexture.generateMipmaps = false;
  sourceTexture.needsUpdate = true;

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(hostRef.value);
  resize();
  await rebuildBook();
  primeGpu();
}

/*
 * Before the story starts the book is hidden, so nothing has been drawn yet: draw it
 * once out of sight (then clear) so its shaders, geometry and textures are on the GPU
 * before the first scroll into the chapter needs them.
 */
function primeGpu() {
  if (disposed || !renderer || !scene || !camera || !bookRoot || bookRoot.visible) return;
  bookRoot.visible = true;
  renderer.render(scene, camera);
  bookRoot.visible = false;
  renderer.render(scene, camera);
}

let cancelPrewarm: (() => void) | null = null;

onMounted(() => {
  if (!canvasRef.value || !hostRef.value) return;
  intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      inView = entry?.isIntersecting ?? false;
      if (shouldInitialize()) void initialize();
    },
    { rootMargin: '120px', threshold: 0 },
  );
  intersectionObserver.observe(hostRef.value);
  if (props.warm) void loadAssets().catch(() => undefined);
  // Built ahead of the first scroll into the story (see prewarm.ts).
  cancelPrewarm = whenWanted(() => (isNearby(hostRef.value) ? initialize() : undefined));
});

watch(() => props.warm, (warm) => {
  if (warm) void loadAssets().catch(() => undefined);
});
watch(() => [props.progress, props.reducedMotion, props.fold], () => {
  if (!initialized && shouldInitialize()) void initialize();
  updatePose();
});
watch(() => labelsKey(props.labels), () => void rebuildBook());
watch(() => props.hidden.join('|'), () => {
  for (const [key, mesh] of iconMeshes) mesh.visible = !props.hidden.includes(key);
  render();
});

onBeforeUnmount(() => {
  disposed = true;
  cancelPrewarm?.();
  resizeObserver?.disconnect();
  intersectionObserver?.disconnect();
  intersectionObserver = null;
  disposeBookResources();
  sourceTexture?.dispose();
  renderer?.dispose();
  renderer?.forceContextLoss();
  scene?.clear();
  renderer = null;
  camera = null;
  scene = null;
});
</script>

<style scoped>
.vanilla-book-rig,
.vanilla-book-rig canvas {
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}

.vanilla-book-rig {
  position: relative;
}

/* Contact shadow under the transparent-canvas book so it rests on the desk. */
.vanilla-book-rig::after {
  content: '';
  position: absolute;
  z-index: -1;
  left: 50%;
  bottom: 3%;
  width: 64%;
  aspect-ratio: 2.4;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(0, 0, 0, 0.6), transparent 70%);
  filter: blur(14px);
  transform: translateX(-50%);
  pointer-events: none;
}

.vanilla-book-rig canvas {
  image-rendering: pixelated;
}
</style>
