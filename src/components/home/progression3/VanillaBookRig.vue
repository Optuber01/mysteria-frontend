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
let firstTurningPage: THREE.Group | null = null;
let secondTurningPage: THREE.Group | null = null;
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
  context.font = '700 36px "IBM Plex Sans Condensed", sans-serif';
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
  const iconSize = 96;
  context.save();
  context.fillStyle = 'rgba(255, 249, 230, 0.2)';
  context.strokeStyle = 'rgba(118, 72, 42, 0.24)';
  context.lineWidth = 2;
  context.beginPath();
  context.roundRect(38, top, width - 76, 164, 16);
  context.fill();
  context.stroke();

  context.imageSmoothingEnabled = false;
  context.drawImage(image, 54, top + 30, iconSize, iconSize);
  context.imageSmoothingEnabled = true;

  context.fillStyle = '#855735';
  context.font = '700 27px "IBM Plex Mono", monospace';
  const lastLineY = wrapText(context, name, 176, top + 55, width - 218, 34);
  context.fillStyle = '#6e594d';
  context.font = '500 20px "IBM Plex Mono", monospace';
  context.fillText(role, 176, Math.max(top + 112, lastLineY + 34));
  context.restore();
}

function paintLeftFormula(images: FormulaImages): TexturePainter {
  return (context, width) => {
    context.fillStyle = 'rgba(255, 248, 224, 0.14)';
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    drawHeading(context, 'Main ingredients', width);
    drawIngredient(context, images.lavosSquidBlood, 'Blood of the Lavos Squid', 'Main ingredient', 145, width);
    drawIngredient(context, images.stellarAquaCrystal, 'Stellar Aqua Crystal', 'Main ingredient', 345, width);
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

  const turningMaterial = basicMaterial({
    map: makeRegionTexture(24, 10, 5, 8),
    color: 0xfff7d7,
    transparent: false,
    opacity: 1,
    alphaTest: 0,
    depthTest: true,
    depthWrite: true,
    blending: THREE.NoBlending,
    side: THREE.DoubleSide,
  });
  const turningGeometry = geometry(new THREE.PlaneGeometry(5.25, 8.65, 6, 1));

  firstTurningPage = new THREE.Group();
  const firstPage = new THREE.Mesh(turningGeometry, turningMaterial);
  firstPage.position.set(2.625, 0, 0);
  firstTurningPage.add(firstPage);
  bookRoot.add(firstTurningPage);

  secondTurningPage = new THREE.Group();
  const secondPage = new THREE.Mesh(turningGeometry, turningMaterial);
  secondPage.position.set(2.625, 0, 0);
  secondTurningPage.add(secondPage);
  bookRoot.add(secondTurningPage);

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

  const seamMaterial = basicMaterial({
    map: makeRegionTexture(12, 0, 2, 10),
    color: 0xffffff,
    transparent: false,
    opacity: 1,
    alphaTest: 0,
    depthTest: true,
    depthWrite: true,
    blending: THREE.NoBlending,
    side: THREE.DoubleSide,
  });
  const seam = new THREE.Mesh(geometry(new THREE.PlaneGeometry(0.12, 8.85)), seamMaterial);
  seam.position.z = -0.16;
  bookRoot.add(seam);
}

function updatePose() {
  if (!bookRoot || !frontCover || !leftPages || !firstTurningPage || !secondTurningPage) return;

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

  const flutter = Math.sin(pageOpening * Math.PI) * 0.08;
  const firstTurningAngle = -Math.PI * phase(p, 0.59, 0.9) - flutter;
  const secondTurningAngle = -Math.PI * phase(p, 0.66, 0.92) + flutter * 0.65;
  firstTurningPage.rotation.y = firstTurningAngle;
  secondTurningPage.rotation.y = secondTurningAngle;
  firstTurningPage.position.z = 0.39 * Math.cos(firstTurningAngle);
  secondTurningPage.position.z = 0.44 * Math.cos(secondTurningAngle);

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
  const [texture, lavosImage, stellarImage, mintImage, recipeImage] = await Promise.all([
    textureLoader.loadAsync(bookAtlasUrl),
    loadImage(lavosSquidBlood),
    loadImage(stellarAquaCrystal),
    loadImage(goldMintLeaves),
    loadImage(foolRecipe),
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
