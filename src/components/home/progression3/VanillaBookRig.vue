<template>
  <div ref="hostRef" class="vanilla-book-rig" aria-hidden="true">
    <canvas ref="canvasRef" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as THREE from 'three';
import bookAtlasUrl from '@/assets/images/home/progression/vanilla-book/vanilla_minecraft_book_reference_1.21.8/enchanting_table_book_1.21.8.png';
import lavosSquidBlood from '@/assets/images/home/progression/real/lavos-squid-blood.png';
import stellarAquaCrystal from '@/assets/images/home/progression/real/stellar-aqua-crystal.png';
import goldMintLeaves from '@/assets/images/home/progression/real/gold-mint-leaves.png';
import foolRecipe from '@/assets/images/home/progression/recipes/fool.png';

const props = withDefaults(defineProps<{
  progress: number;
  reducedMotion?: boolean;
}>(), {
  reducedMotion: false,
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
let sourceTexture: THREE.Texture | null = null;
let disposed = false;
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
};

type TexturePainter = (context: CanvasRenderingContext2D, width: number, height: number) => void;

function makeRegionTexture(
  u: number,
  v: number,
  width: number,
  height: number,
  painter?: TexturePainter,
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
  painter?.(context, crop.width, crop.height);
  const texture = new THREE.CanvasTexture(crop);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = isIllustratedPage ? THREE.LinearFilter : THREE.NearestFilter;
  texture.minFilter = isIllustratedPage ? THREE.LinearMipmapLinearFilter : THREE.NearestFilter;
  texture.generateMipmaps = isIllustratedPage;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  ownedTextures.push(texture);
  return texture;
}

function makeImageTexture(image: HTMLImageElement): THREE.Texture {
  const texture = new THREE.Texture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
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
  const texture = new THREE.CanvasTexture(labelCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = smooth ? THREE.LinearFilter : THREE.NearestFilter;
  texture.minFilter = smooth ? THREE.LinearMipmapLinearFilter : THREE.NearestFilter;
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
  color = '#f2cf75',
) {
  context.fillStyle = 'rgba(36, 16, 6, 0.8)';
  drawPixelLine(context, label, centerX + 3, y + 3, pixelSize);
  context.fillStyle = color;
  drawPixelLine(context, label, centerX, y, pixelSize);
}

function paintCoverArtwork(context: CanvasRenderingContext2D, logo: HTMLImageElement) {
  const width = context.canvas.width;
  const height = context.canvas.height;
  const gold = '#d9aa4e';
  const paleGold = '#f0d184';
  const ink = 'rgba(46, 21, 8, 0.78)';

  context.fillStyle = 'rgba(54, 25, 10, 0.34)';
  context.fillRect(28, 30, width - 56, height - 60);
  context.strokeStyle = gold;
  context.lineWidth = 6;
  context.strokeRect(34, 36, width - 68, height - 72);
  context.strokeStyle = 'rgba(241, 209, 132, 0.54)';
  context.lineWidth = 2;
  context.strokeRect(50, 52, width - 100, height - 104);

  context.fillStyle = gold;
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

  context.fillStyle = ink;
  context.fillRect(92, 88, width - 184, 168);
  context.strokeStyle = 'rgba(217, 170, 78, 0.72)';
  context.lineWidth = 3;
  context.strokeRect(98, 94, width - 196, 156);
  context.imageSmoothingEnabled = true;
  context.drawImage(logo, width / 2 - 68, 101, 136, 136);
  context.imageSmoothingEnabled = false;

  drawPixelLineWithShadow(context, 'FOOL PATHWAY', width / 2, 286, 3, paleGold);
  context.fillStyle = 'rgba(217, 170, 78, 0.74)';
  context.fillRect(86, 345, 126, 4);
  context.fillRect(width - 212, 345, 126, 4);
  context.fillRect(width / 2 - 8, 337, 16, 16);

  drawPixelLineWithShadow(context, 'SEQUENCE 9', width / 2, 392, 5, '#f3d684');
  drawPixelLineWithShadow(context, 'SEER', width / 2, 474, 4, '#dcb35e');

  context.strokeStyle = 'rgba(217, 170, 78, 0.68)';
  context.lineWidth = 3;
  context.strokeRect(100, 550, width - 200, 96);
  context.fillStyle = 'rgba(217, 170, 78, 0.13)';
  context.fillRect(108, 558, width - 216, 80);
  drawPixelLineWithShadow(context, 'BEYONDER RECIPE', width / 2, 582, 3, paleGold);

  context.fillStyle = 'rgba(217, 170, 78, 0.66)';
  for (let x = 120; x <= width - 120; x += 32) context.fillRect(x, 700, 12, 4);
}

function drawRule(context: CanvasRenderingContext2D, y: number, width: number, dashed = false) {
  context.save();
  context.strokeStyle = 'rgba(116, 71, 42, 0.52)';
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
  context.fillStyle = '#7f211b';
  context.font = '800 40px "IBM Plex Sans Condensed", sans-serif';
  context.letterSpacing = '3px';
  context.fillText(label.toUpperCase(), 48, 82);
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

  context.fillStyle = '#744527';
  context.font = '800 31px "IBM Plex Mono", monospace';
  const lastLineY = wrapText(context, name, 184, top + 53, width - 214, 38);
  context.fillStyle = '#5f4a3d';
  context.font = '650 23px "IBM Plex Mono", monospace';
  context.fillText(role, 184, Math.max(top + 116, lastLineY + 38));
  context.restore();
}

function paintLeftFormula(images: FormulaImages): TexturePainter {
  return (context, width) => {
    context.fillStyle = 'rgba(255, 248, 224, 0.14)';
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    drawHeading(context, 'Main ingredients', width);
    drawIngredient(context, images.lavosSquidBlood, 'Blood of the Lavos Squid', 'Main ingredient', 145, width);
    drawIngredient(context, images.stellarAquaCrystal, 'Stellar Aqua Crystal', 'Main ingredient', 350, width);
  };
}

function paintRightFormula(images: FormulaImages): TexturePainter {
  return (context, width, height) => {
    context.fillStyle = 'rgba(255, 248, 224, 0.14)';
    context.fillRect(0, 0, width, height);
    drawHeading(context, 'Supplementary', width);
    drawIngredient(context, images.goldMintLeaves, 'Gold Mint Leaves', 'Supplementary ingredient', 145, width);

    drawRule(context, 775, width, true);
    context.save();
    context.strokeStyle = 'rgba(127, 33, 27, 0.48)';
    context.lineWidth = 3;
    context.beginPath();
    context.arc(104, 872, 59, 0, Math.PI * 2);
    context.stroke();
    context.imageSmoothingEnabled = false;
    context.drawImage(images.foolRecipe, 62, 830, 84, 84);
    context.imageSmoothingEnabled = true;

    context.fillStyle = '#18763a';
    context.font = '700 23px "IBM Plex Mono", monospace';
    context.letterSpacing = '2px';
    context.fillText('RITUAL NOTE', 184, 842);
    context.letterSpacing = '0px';
    context.fillStyle = '#49352c';
    context.font = '500 22px "IBM Plex Mono", monospace';
    wrapText(context, 'Build the altar before brewing.', 184, 883, width - 228, 31);
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
  const material = new THREE.MeshBasicMaterial(parameters);
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
  },
) {
  const { width, height, depth, z, color, front, back, frontPainter, backPainter } = options;
  if (depth > 0) {
    const bodyMaterial = basicMaterial({ color });
    const body = new THREE.Mesh(geometry(new THREE.BoxGeometry(width, height, depth)), bodyMaterial);
    body.position.set(width / 2, 0, z);
    hinge.add(body);
  }

  const faceGeometry = geometry(new THREE.PlaneGeometry(width, height));
  const frontMaterial = basicMaterial({
    map: makeRegionTexture(...front, frontPainter),
    transparent: false,
    opacity: 1,
    alphaTest: 0,
    depthTest: true,
    depthWrite: true,
    blending: THREE.NoBlending,
    side: THREE.FrontSide,
  });
  const frontFace = new THREE.Mesh(faceGeometry, frontMaterial);
  frontFace.position.set(width / 2, 0, z + depth / 2 + 0.006);
  hinge.add(frontFace);

  const backMaterial = basicMaterial({
    map: makeRegionTexture(...back, backPainter),
    transparent: false,
    opacity: 1,
    alphaTest: 0,
    depthTest: true,
    depthWrite: true,
    blending: THREE.NoBlending,
    side: THREE.FrontSide,
  });
  const backFace = new THREE.Mesh(faceGeometry, backMaterial);
  backFace.position.set(width / 2, 0, z - depth / 2 - 0.006);
  backFace.rotation.y = Math.PI;
  hinge.add(backFace);
}

function buildBook(formulaImages: FormulaImages) {
  if (!scene) return;

  bookRoot = new THREE.Group();
  scene.add(bookRoot);

  const backCover = new THREE.Group();
  bookRoot.add(backCover);
  addTexturedLeaf(backCover, {
    width: 6,
    height: 10,
    depth: 0.24,
    z: -0.42,
    color: 0x744317,
    front: [16, 0, 6, 10],
    back: [22, 0, 6, 10],
  });

  const rightStack = new THREE.Group();
  bookRoot.add(rightStack);
  addTexturedLeaf(rightStack, {
    width: 5.25,
    height: 8.65,
    depth: 0,
    z: -0.18,
    color: 0xe8ddb4,
    front: [13, 11, 5, 8],
    back: [19, 11, 5, 8],
    frontPainter: paintRightFormula(formulaImages),
  });

  leftPages = new THREE.Group();
  bookRoot.add(leftPages);
  addTexturedLeaf(leftPages, {
    width: 5.25,
    height: 8.65,
    depth: 0,
    z: 0.18,
    color: 0xeee4bd,
    front: [1, 11, 5, 8],
    back: [7, 11, 5, 8],
    backPainter: paintLeftFormula(formulaImages),
  });

  frontCover = new THREE.Group();
  bookRoot.add(frontCover);
  addTexturedLeaf(frontCover, {
    width: 6,
    height: 10,
    depth: 0.24,
    z: 0.55,
    color: 0x744317,
    front: [0, 0, 6, 10],
    back: [6, 0, 6, 10],
  });

  const coverLabelMaterial = basicMaterial({
    map: makePixelLabelTexture(
      512,
      800,
      (context) => paintCoverArtwork(context, formulaImages.mysterriaLogo),
      true,
    ),
    transparent: true,
    alphaTest: 0.08,
    depthTest: true,
    depthWrite: true,
    side: THREE.FrontSide,
  });
  const coverLabel = new THREE.Mesh(
    geometry(new THREE.PlaneGeometry(4.72, 7.38)),
    coverLabelMaterial,
  );
  coverLabel.position.set(3, 0, 0.686);
  frontCover.add(coverLabel);

  const seamMaterial = basicMaterial({
    map: makeRegionTexture(12, 0, 2, 10),
    color: 0xffffff,
    transparent: false,
    opacity: 1,
    alphaTest: 0,
    depthTest: true,
    depthWrite: true,
    blending: THREE.NoBlending,
  });
  const seam = new THREE.Mesh(geometry(new THREE.BoxGeometry(0.42, 10.15, 0.76)), seamMaterial);
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
    side: THREE.FrontSide,
  });
  const spineEmblem = new THREE.Mesh(
    geometry(new THREE.PlaneGeometry(0.62, 0.62)),
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
      drawPixelLineWithShadow(context, 'MYSTERRIA', 0, -18, 5, '#f0ce78');
      context.restore();
    }),
    transparent: true,
    alphaTest: 0.08,
    depthTest: true,
    depthWrite: true,
    side: THREE.FrontSide,
  });
  const spineLabel = new THREE.Mesh(
    geometry(new THREE.PlaneGeometry(0.32, 4)),
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
  if (renderer && scene && camera) renderer.render(scene, camera);
}

onMounted(async () => {
  if (!canvasRef.value || !hostRef.value) return;
  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-8, 8, 6.4, -6.4, 0.1, 100);
  camera.position.set(0, 0, 24);
  camera.lookAt(0, 0, 0);

  const textureLoader = new THREE.TextureLoader();
  const [texture, lavosImage, stellarImage, mintImage, recipeImage, mysterriaLogoImage] = await Promise.all([
    textureLoader.loadAsync(bookAtlasUrl),
    loadImage(lavosSquidBlood),
    loadImage(stellarAquaCrystal),
    loadImage(goldMintLeaves),
    loadImage(foolRecipe),
    loadImage('/logo-mark.webp'),
    document.fonts?.ready ?? Promise.resolve(),
  ]);
  if (disposed) {
    texture.dispose();
    return;
  }
  sourceTexture = texture;
  sourceTexture.colorSpace = THREE.SRGBColorSpace;
  sourceTexture.magFilter = THREE.NearestFilter;
  sourceTexture.minFilter = THREE.NearestFilter;
  sourceTexture.generateMipmaps = false;
  buildBook({
    lavosSquidBlood: lavosImage,
    stellarAquaCrystal: stellarImage,
    goldMintLeaves: mintImage,
    foolRecipe: recipeImage,
    mysterriaLogo: mysterriaLogoImage,
  });
  updatePose();

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(hostRef.value);
  resize();
});

watch(() => [props.progress, props.reducedMotion], updatePose);

onBeforeUnmount(() => {
  disposed = true;
  resizeObserver?.disconnect();
  ownedGeometries.forEach((item) => item.dispose());
  ownedMaterials.forEach((item) => item.dispose());
  ownedTextures.forEach((item) => item.dispose());
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

.vanilla-book-rig canvas {
  image-rendering: pixelated;
}
</style>
