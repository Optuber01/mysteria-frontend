<template>
  <div ref="hostRef" class="vanilla-book-rig" aria-hidden="true">
    <canvas ref="canvasRef" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
// Types only: three.js itself is imported on demand (see loadAssets) so it
// stays out of the homepage entry chunk until the chapter approaches.
import type * as THREE from 'three';
import bookAtlasUrl from '@/assets/images/home/progression/vanilla-book/vanilla_minecraft_book_reference_1.21.8/enchanting_table_book_1.21.8.png';
import lavosSquidBlood from '@/assets/images/home/progression/real/lavos-squid-blood.png';
import stellarAquaCrystal from '@/assets/images/home/progression/real/stellar-aqua-crystal.png';
import goldMintLeaves from '@/assets/images/home/progression/real/gold-mint-leaves.png';
import foolRecipe from '@/assets/images/home/progression/recipes/fool.png';

export type BookLabels = {
  mainHeading: string;
  supplementaryHeading: string;
  main: Array<{ name: string; role: string }>;
  supplementary: Array<{ name: string; role: string }>;
  noteHeading: string;
  note: string;
  coverPathway: string;
  coverSequence: string;
  coverName: string;
  coverRecipe: string;
};

const props = withDefaults(defineProps<{
  progress: number;
  labels: BookLabels;
  reducedMotion?: boolean;
  /** Start downloading three.js and the artwork before the book is needed. */
  warm?: boolean;
}>(), {
  reducedMotion: false,
  warm: false,
});

const hostRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

let renderer: THREE.WebGLRenderer | null = null;
let camera: THREE.OrthographicCamera | null = null;
let scene: THREE.Scene | null = null;
let bookRoot: THREE.Group | null = null;
let frontCover: THREE.Group | null = null;
let leftPages: THREE.Group | null = null;
let resizeObserver: ResizeObserver | null = null;
let intersectionObserver: IntersectionObserver | null = null;
let initialized = false;
let sourceTexture: THREE.Texture | null = null;
let disposed = false;
let inView = false;
let three!: typeof import('three');
let formulaImages: FormulaImages | null = null;
let builtLabels = '';
const ownedTextures: THREE.Texture[] = [];
const ownedMaterials: THREE.Material[] = [];
const ownedGeometries: THREE.BufferGeometry[] = [];

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

type FormulaImages = {
  lavosSquidBlood: HTMLImageElement;
  stellarAquaCrystal: HTMLImageElement;
  goldMintLeaves: HTMLImageElement;
  foolRecipe: HTMLImageElement;
  mysterriaLogo: HTMLImageElement;
  foolPathwaySymbol: HTMLImageElement;
};

type TexturePainter = (context: CanvasRenderingContext2D, width: number, height: number) => void;

function makeRegionTexture(
  u: number,
  v: number,
  width: number,
  height: number,
  painter?: TexturePainter,
  useCoverPalette = false,
): THREE.Texture {
  if (!sourceTexture) throw new Error('Book atlas has not loaded.');
  const crop = document.createElement('canvas');
  const isIllustratedPage = Boolean(painter);
  crop.width = isIllustratedPage ? 630 : width;
  crop.height = isIllustratedPage ? 1038 : height;
  const context = crop.getContext('2d');
  if (!context) throw new Error('A 2D canvas is required to slice the book atlas.');
  context.imageSmoothingEnabled = false;
  context.drawImage(
    sourceTexture.image as CanvasImageSource,
    u,
    v,
    width,
    height,
    0,
    0,
    crop.width,
    crop.height,
  );
  if (useCoverPalette) recolorCoverTexture(context);
  painter?.(context, crop.width, crop.height);
  const texture = new three.CanvasTexture(crop);
  texture.colorSpace = three.SRGBColorSpace;
  texture.magFilter = isIllustratedPage ? three.LinearFilter : three.NearestFilter;
  texture.minFilter = isIllustratedPage ? three.LinearMipmapLinearFilter : three.NearestFilter;
  texture.generateMipmaps = isIllustratedPage;
  texture.wrapS = three.ClampToEdgeWrapping;
  texture.wrapT = three.ClampToEdgeWrapping;
  ownedTextures.push(texture);
  return texture;
}

function recolorCoverTexture(context: CanvasRenderingContext2D) {
  const { width, height } = context.canvas;
  const image = context.getImageData(0, 0, width, height);
  const data = image.data;
  // Oxblood leather, bone clasps and worn grey edges: the Crimson Moon's
  // palette, keeping the vanilla texture's pixel structure intact.
  const leatherRamp = [
    [34, 9, 13],
    [54, 14, 20],
    [78, 21, 28],
  ] as const;
  const claspRamp = [
    [186, 178, 162],
    [222, 215, 201],
  ] as const;
  const wornRamp = [
    [96, 84, 86],
    [124, 112, 112],
  ] as const;

  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] === 0) continue;
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const brightness = (red + green + blue) / (3 * 255);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const isClasp =
      red >= 205 &&
      green >= 135 &&
      blue <= 105 &&
      brightness >= 0.58 &&
      saturation >= 0.46;
    const ramp = isClasp ? claspRamp : saturation < 0.16 && brightness > 0.58 ? wornRamp : leatherRamp;
    const rampIndex = Math.min(ramp.length - 1, Math.floor(brightness * ramp.length));
    const [nextRed, nextGreen, nextBlue] = ramp[rampIndex];
    data[index] = nextRed;
    data[index + 1] = nextGreen;
    data[index + 2] = nextBlue;
  }
  context.putImageData(image, 0, 0);
}

function makeImageTexture(image: HTMLImageElement): THREE.Texture {
  const texture = new three.Texture(image);
  texture.colorSpace = three.SRGBColorSpace;
  texture.magFilter = three.LinearFilter;
  texture.minFilter = three.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.wrapS = three.ClampToEdgeWrapping;
  texture.wrapT = three.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  ownedTextures.push(texture);
  return texture;
}

const PIXEL_GLYPHS: Record<string, readonly string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
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
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  ':': ['00000', '00100', '00100', '00000', '00100', '00100', '00000'],
};

function drawPixelGlyph(
  context: CanvasRenderingContext2D,
  glyph: string,
  x: number,
  y: number,
  pixelSize: number,
) {
  const rows = PIXEL_GLYPHS[glyph];
  if (!rows) return;
  rows.forEach((row, rowIndex) => {
    [...row].forEach((cell, columnIndex) => {
      if (cell === '1') context.fillRect(x + columnIndex * pixelSize, y + rowIndex * pixelSize, pixelSize, pixelSize);
    });
  });
}

function drawPixelLine(
  context: CanvasRenderingContext2D,
  label: string,
  centerX: number,
  y: number,
  pixelSize: number,
) {
  const glyphWidth = 5 * pixelSize;
  const gap = pixelSize;
  const width = label.length * glyphWidth + Math.max(0, label.length - 1) * gap;
  let x = Math.round(centerX - width / 2);
  for (const glyph of label) {
    if (glyph !== ' ') drawPixelGlyph(context, glyph, x, y, pixelSize);
    x += glyphWidth + gap;
  }
}

function makePixelLabelTexture(
  width: number,
  height: number,
  painter: (context: CanvasRenderingContext2D) => void,
  smooth = false,
): THREE.Texture {
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = width;
  labelCanvas.height = height;
  const context = labelCanvas.getContext('2d');
  if (!context) throw new Error('A 2D canvas is required to prepare the book label.');
  context.clearRect(0, 0, width, height);
  painter(context);
  const texture = new three.CanvasTexture(labelCanvas);
  texture.colorSpace = three.SRGBColorSpace;
  texture.magFilter = smooth ? three.LinearFilter : three.NearestFilter;
  texture.minFilter = smooth ? three.LinearMipmapLinearFilter : three.NearestFilter;
  texture.generateMipmaps = smooth;
  ownedTextures.push(texture);
  return texture;
}

function drawPixelLineWithShadow(
  context: CanvasRenderingContext2D,
  label: string,
  centerX: number,
  y: number,
  pixelSize: number,
  color = '#e8e0cf',
) {
  context.fillStyle = 'rgba(10, 4, 6, 0.84)';
  drawPixelLine(context, label, centerX + 3, y + 3, pixelSize);
  context.fillStyle = color;
  drawPixelLine(context, label, centerX, y, pixelSize);
}

function fitsPixelFont(label: string, pixelSize: number, maxWidth: number): boolean {
  const width = label.length * 6 * pixelSize - pixelSize;
  return width <= maxWidth && [...label].every((glyph) => glyph === ' ' || glyph in PIXEL_GLYPHS);
}

/** Pixel lettering where the glyph set covers the label; a bold UI face otherwise (Cyrillic, CJK...). */
function drawCoverLine(
  context: CanvasRenderingContext2D,
  label: string,
  centerX: number,
  y: number,
  pixelSize: number,
  color: string,
) {
  const text = label.toLocaleUpperCase();
  const maxWidth = context.canvas.width - 120;
  if (fitsPixelFont(text, pixelSize, maxWidth)) {
    drawPixelLineWithShadow(context, text, centerX, y, pixelSize, color);
    return;
  }
  context.save();
  context.font = `800 ${pixelSize * 7}px "Manrope", sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'top';
  context.fillStyle = 'rgba(10, 4, 6, 0.84)';
  context.fillText(text, centerX + 3, y + 3, maxWidth);
  context.fillStyle = color;
  context.fillText(text, centerX, y, maxWidth);
  context.restore();
}

function paintCoverArtwork(context: CanvasRenderingContext2D, pathwaySymbol: HTMLImageElement, labels: BookLabels) {
  const width = context.canvas.width;
  const height = context.canvas.height;
  const crimson = '#b3202b';
  const crimsonText = '#e5545d';
  const bone = '#e8e0cf';
  const boneDim = 'rgba(232, 224, 207, 0.42)';

  context.fillStyle = 'rgba(30, 7, 11, 0.8)';
  context.fillRect(28, 30, width - 56, height - 60);
  context.strokeStyle = crimson;
  context.lineWidth = 6;
  context.strokeRect(34, 36, width - 68, height - 72);
  context.strokeStyle = boneDim;
  context.lineWidth = 2;
  context.strokeRect(50, 52, width - 100, height - 104);

  context.fillStyle = bone;
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

  context.fillStyle = 'rgba(12, 4, 6, 0.9)';
  context.fillRect(92, 88, width - 184, 168);
  context.strokeStyle = crimson;
  context.lineWidth = 3;
  context.strokeRect(98, 94, width - 196, 156);
  context.imageSmoothingEnabled = true;
  context.drawImage(pathwaySymbol, width / 2 - 68, 101, 136, 136);
  context.imageSmoothingEnabled = false;

  drawCoverLine(context, labels.coverPathway, width / 2, 286, 3, bone);
  context.fillStyle = crimson;
  context.fillRect(86, 345, 126, 4);
  context.fillRect(width - 212, 345, 126, 4);
  context.fillRect(width / 2 - 8, 337, 16, 16);

  drawCoverLine(context, labels.coverSequence, width / 2, 392, 5, bone);
  drawCoverLine(context, labels.coverName, width / 2, 474, 4, crimsonText);

  context.strokeStyle = boneDim;
  context.lineWidth = 3;
  context.strokeRect(100, 550, width - 200, 96);
  context.fillStyle = 'rgba(179, 32, 43, 0.18)';
  context.fillRect(108, 558, width - 216, 80);
  drawCoverLine(context, labels.coverRecipe, width / 2, 582, 3, bone);

  context.fillStyle = crimson;
  for (let x = 120; x <= width - 120; x += 32) context.fillRect(x, 700, 12, 4);
}

function drawRule(context: CanvasRenderingContext2D, y: number, width: number, dashed = false) {
  context.save();
  context.strokeStyle = 'rgba(90, 82, 70, 0.5)';
  context.lineWidth = 2;
  context.setLineDash(dashed ? [10, 8] : []);
  context.beginPath();
  context.moveTo(44, y);
  context.lineTo(width - 44, y);
  context.stroke();
  context.restore();
}

function drawHeading(context: CanvasRenderingContext2D, label: string, width: number) {
  context.save();
  context.fillStyle = '#8e1720';
  context.font = '600 48px "Cormorant Garamond", Georgia, serif';
  context.letterSpacing = '2px';
  context.fillText(label.toLocaleUpperCase(), 48, 84);
  context.restore();
  drawRule(context, 108, width);
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(' ');
  let line = '';
  let lineY = y;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      context.fillText(line, x, lineY);
      line = word;
      lineY += lineHeight;
    } else {
      line = candidate;
    }
  }
  if (line) context.fillText(line, x, lineY);
  return lineY;
}

function drawIngredient(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  name: string,
  role: string,
  top: number,
  width: number,
) {
  const iconSize = 116;
  context.save();
  context.imageSmoothingEnabled = false;
  context.drawImage(image, 44, top + 22, iconSize, iconSize);
  context.imageSmoothingEnabled = true;

  context.fillStyle = '#1d1b17';
  context.font = '700 31px "Manrope", sans-serif';
  const lastLineY = wrapText(context, name, 184, top + 53, width - 214, 38);
  context.fillStyle = '#5a5246';
  context.font = '500 22px "IBM Plex Mono", monospace';
  context.fillText(role, 184, Math.max(top + 116, lastLineY + 38));
  context.restore();
}

function paintLeftFormula(images: FormulaImages, labels: BookLabels): TexturePainter {
  return (context, width) => {
    context.fillStyle = 'rgba(255, 248, 224, 0.14)';
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    drawHeading(context, labels.mainHeading, width);
    const [first, second] = labels.main;
    if (first) drawIngredient(context, images.lavosSquidBlood, first.name, first.role, 145, width);
    if (second) drawIngredient(context, images.stellarAquaCrystal, second.name, second.role, 350, width);
  };
}

function paintRightFormula(images: FormulaImages, labels: BookLabels): TexturePainter {
  return (context, width, height) => {
    context.fillStyle = 'rgba(255, 248, 224, 0.14)';
    context.fillRect(0, 0, width, height);
    drawHeading(context, labels.supplementaryHeading, width);
    const [supplementary] = labels.supplementary;
    if (supplementary) drawIngredient(context, images.goldMintLeaves, supplementary.name, supplementary.role, 145, width);

    drawRule(context, 775, width, true);
    context.save();
    context.strokeStyle = 'rgba(142, 23, 32, 0.5)';
    context.lineWidth = 3;
    context.beginPath();
    context.arc(104, 872, 59, 0, Math.PI * 2);
    context.stroke();
    context.imageSmoothingEnabled = false;
    context.drawImage(images.foolRecipe, 62, 830, 84, 84);
    context.imageSmoothingEnabled = true;

    context.fillStyle = '#8e1720';
    context.font = '600 23px "IBM Plex Mono", monospace';
    context.letterSpacing = '2px';
    context.fillText(labels.noteHeading.toLocaleUpperCase(), 184, 842, width - 228);
    context.letterSpacing = '0px';
    context.fillStyle = '#5a5246';
    context.font = '500 23px "Manrope", sans-serif';
    wrapText(context, labels.note, 184, 883, width - 228, 31);
    context.restore();
  };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load formula artwork: ${url}`));
    image.src = url;
  });
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
    useCoverPalette?: boolean;
  },
) {
  const { width, height, depth, z, color, front, back, frontPainter, backPainter, useCoverPalette = false } = options;
  if (depth > 0) {
    const bodyMaterial = basicMaterial({ color });
    const body = new three.Mesh(geometry(new three.BoxGeometry(width, height, depth)), bodyMaterial);
    body.position.set(width / 2, 0, z);
    hinge.add(body);
  }

  const faceGeometry = geometry(new three.PlaneGeometry(width, height));
  const frontMaterial = basicMaterial({
    map: makeRegionTexture(...front, frontPainter, useCoverPalette),
    transparent: false,
    opacity: 1,
    alphaTest: 0,
    depthTest: true,
    depthWrite: true,
    blending: three.NoBlending,
    side: three.FrontSide,
  });
  const frontFace = new three.Mesh(faceGeometry, frontMaterial);
  frontFace.position.set(width / 2, 0, z + depth / 2 + 0.006);
  hinge.add(frontFace);

  const backMaterial = basicMaterial({
    map: makeRegionTexture(...back, backPainter, useCoverPalette),
    transparent: false,
    opacity: 1,
    alphaTest: 0,
    depthTest: true,
    depthWrite: true,
    blending: three.NoBlending,
    side: three.FrontSide,
  });
  const backFace = new three.Mesh(faceGeometry, backMaterial);
  backFace.position.set(width / 2, 0, z - depth / 2 - 0.006);
  backFace.rotation.y = Math.PI;
  hinge.add(backFace);
}

function buildBook(formulaImages: FormulaImages, labels: BookLabels) {
  if (!scene) return;
  builtLabels = JSON.stringify(labels);

  bookRoot = new three.Group();
  scene.add(bookRoot);

  const backCover = new three.Group();
  bookRoot.add(backCover);
  addTexturedLeaf(backCover, {
    width: 6,
    height: 10,
    depth: 0.24,
    z: -0.42,
    color: 0x2a0b10,
    front: [16, 0, 6, 10],
    back: [22, 0, 6, 10],
    useCoverPalette: true,
  });

  const rightStack = new three.Group();
  bookRoot.add(rightStack);
  addTexturedLeaf(rightStack, {
    width: 5.25,
    height: 8.65,
    depth: 0,
    z: -0.18,
    color: 0xe8ddb4,
    front: [13, 11, 5, 8],
    back: [19, 11, 5, 8],
    frontPainter: paintRightFormula(formulaImages, labels),
  });

  leftPages = new three.Group();
  bookRoot.add(leftPages);
  addTexturedLeaf(leftPages, {
    width: 5.25,
    height: 8.65,
    depth: 0,
    z: 0.18,
    color: 0xeee4bd,
    front: [1, 11, 5, 8],
    back: [7, 11, 5, 8],
    backPainter: paintLeftFormula(formulaImages, labels),
  });

  frontCover = new three.Group();
  bookRoot.add(frontCover);
  addTexturedLeaf(frontCover, {
    width: 6,
    height: 10,
    depth: 0.24,
    z: 0.55,
    color: 0x2a0b10,
    front: [0, 0, 6, 10],
    back: [6, 0, 6, 10],
    useCoverPalette: true,
  });

  const coverLabelMaterial = basicMaterial({
    map: makePixelLabelTexture(
      512,
      800,
      (context) => paintCoverArtwork(context, formulaImages.foolPathwaySymbol, labels),
      true,
    ),
    transparent: true,
    alphaTest: 0.08,
    depthTest: true,
    depthWrite: true,
    side: three.FrontSide,
  });
  const coverLabel = new three.Mesh(
    geometry(new three.PlaneGeometry(4.72, 7.38)),
    coverLabelMaterial,
  );
  coverLabel.position.set(3, 0, 0.686);
  frontCover.add(coverLabel);

  const seamMaterial = basicMaterial({
    map: makeRegionTexture(12, 0, 2, 10, undefined, true),
    color: 0xffffff,
    transparent: false,
    opacity: 1,
    alphaTest: 0,
    depthTest: true,
    depthWrite: true,
    blending: three.NoBlending,
  });
  const seam = new three.Mesh(geometry(new three.BoxGeometry(0.42, 10.15, 0.76)), seamMaterial);
  seam.position.z = 0.06;
  bookRoot.add(seam);

  // The entrance presents the book edge-on, making the seam's -X face the visible
  // exterior spine. These archive marks live in bookRoot's local space so they
  // rotate and recede with the physical spine as the cover opens.
  const spineEmblemMaterial = basicMaterial({
    map: makeImageTexture(formulaImages.mysterriaLogo),
    transparent: true,
    alphaTest: 0.08,
    depthTest: true,
    depthWrite: true,
    side: three.FrontSide,
  });
  const spineEmblem = new three.Mesh(
    geometry(new three.PlaneGeometry(0.62, 0.62)),
    spineEmblemMaterial,
  );
  spineEmblem.position.set(-0.217, 3.58, 0.06);
  spineEmblem.rotation.y = -Math.PI / 2;
  bookRoot.add(spineEmblem);

  const spineLabelMaterial = basicMaterial({
    map: makePixelLabelTexture(72, 512, (context) => {
      context.save();
      context.translate(36, 256);
      context.rotate(Math.PI / 2);
      drawPixelLineWithShadow(context, 'MYSTERRIA', 0, -18, 5);
      context.restore();
    }),
    transparent: true,
    alphaTest: 0.08,
    depthTest: true,
    depthWrite: true,
    side: three.FrontSide,
  });
  const spineLabel = new three.Mesh(
    geometry(new three.PlaneGeometry(0.32, 4)),
    spineLabelMaterial,
  );
  spineLabel.position.set(-0.218, 0.45, 0.06);
  spineLabel.rotation.y = -Math.PI / 2;
  bookRoot.add(spineLabel);
}

function updatePose() {
  if (!bookRoot || !frontCover || !leftPages) return;

  const p = props.reducedMotion ? 1 : clamp01(props.progress);
  const descend = phase(p, 0, 0.2);
  const faceCover = phase(p, 0.2, 0.43);
  const opening = phase(p, 0.5, 0.88);
  const pageOpening = phase(p, 0.55, 0.9);
  const settle = phase(p, 0.88, 1);

  bookRoot.visible = props.reducedMotion || p > 0.004;
  bookRoot.position.y = (1 - descend) * 5.8 - settle * 0.08;
  bookRoot.position.x = -3 * (1 - opening);
  bookRoot.rotation.y = (Math.PI / 2) * (1 - faceCover);
  bookRoot.rotation.x = -0.06 - opening * 0.035;
  bookRoot.rotation.z = -0.045 * (1 - faceCover) + Math.sin(settle * Math.PI) * 0.012;
  const entranceScale = 0.9 + descend * 0.1;
  bookRoot.scale.setScalar(entranceScale);

  frontCover.rotation.y = -Math.PI * 0.985 * opening;
  leftPages.rotation.y = -Math.PI * pageOpening;

  render();
}

function resize() {
  if (!renderer || !camera || !hostRef.value) return;
  const width = Math.max(1, hostRef.value.clientWidth);
  const height = Math.max(1, hostRef.value.clientHeight);
  const aspect = width / height;
  const viewHeight = 12.8;
  camera.left = -(viewHeight * aspect) / 2;
  camera.right = (viewHeight * aspect) / 2;
  camera.top = viewHeight / 2;
  camera.bottom = -viewHeight / 2;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
  render();
}

function render() {
  if (!renderer || !scene || !camera || !bookRoot?.visible) return;
  renderer.render(scene, camera);
}

function disposeBookResources() {
  ownedGeometries.forEach((item) => item.dispose());
  ownedMaterials.forEach((item) => item.dispose());
  ownedTextures.forEach((item) => item.dispose());
  ownedGeometries.length = 0;
  ownedMaterials.length = 0;
  ownedTextures.length = 0;
}

/** Repaints the page and cover textures, e.g. after a locale switch. */
function rebuildBook() {
  if (!scene || !formulaImages || !bookRoot) return;
  if (JSON.stringify(props.labels) === builtLabels) return;
  scene.remove(bookRoot);
  disposeBookResources();
  bookRoot = null;
  frontCover = null;
  leftPages = null;
  buildBook(formulaImages, props.labels);
  updatePose();
}

type LoadedAssets = { module: typeof import('three'); atlas: HTMLImageElement; images: FormulaImages };
let assets: Promise<LoadedAssets> | null = null;

function loadAssets(): Promise<LoadedAssets> {
  assets ??= Promise.all([
    import('three'),
    loadImage(bookAtlasUrl),
    loadImage(lavosSquidBlood),
    loadImage(stellarAquaCrystal),
    loadImage(goldMintLeaves),
    loadImage(foolRecipe),
    loadImage('/logo-mark.webp'),
    loadImage('/pathway-art/native/fool.webp'),
    document.fonts?.ready ?? Promise.resolve(),
  ]).then(([module, atlas, lavos, stellar, mint, recipe, logo, symbol]) => ({
    module,
    atlas,
    images: {
      lavosSquidBlood: lavos,
      stellarAquaCrystal: stellar,
      goldMintLeaves: mint,
      foolRecipe: recipe,
      mysterriaLogo: logo,
      foolPathwaySymbol: symbol,
    },
  }));
  assets.catch(() => {
    assets = null;
  });
  return assets;
}

// The WebGL context is only created once the book actually has to draw: the
// chapter has started scrolling (or reduced motion shows the final pose).
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
  formulaImages = loaded.images;

  renderer = new three.WebGLRenderer({
    canvas: canvasRef.value,
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance',
  });
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
  buildBook(formulaImages, props.labels);
  updatePose();

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(hostRef.value);
  resize();
}

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
});

watch(() => props.warm, (warm) => {
  if (warm) void loadAssets().catch(() => undefined);
});
watch(() => [props.progress, props.reducedMotion], () => {
  if (!initialized && shouldInitialize()) void initialize();
  updatePose();
});
watch(() => props.labels, rebuildBook);

onBeforeUnmount(() => {
  disposed = true;
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
