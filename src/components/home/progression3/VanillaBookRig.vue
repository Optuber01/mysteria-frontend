<template>
  <div ref="hostRef" class="vanilla-book-rig" aria-hidden="true">
    <canvas ref="canvasRef" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as THREE from 'three';
import bookAtlasUrl from '@/assets/images/home/progression/vanilla-book/vanilla_minecraft_book_reference_1.21.8/enchanting_table_book_1.21.8.png';

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

function makeRegionTexture(u: number, v: number, width: number, height: number): THREE.Texture {
  if (!sourceTexture) throw new Error('Book atlas has not loaded.');
  const crop = document.createElement('canvas');
  crop.width = width;
  crop.height = height;
  const context = crop.getContext('2d');
  if (!context) throw new Error('A 2D canvas is required to slice the book atlas.');
  context.imageSmoothingEnabled = false;
  context.drawImage(sourceTexture.image as CanvasImageSource, u, v, width, height, 0, 0, width, height);
  const texture = new THREE.CanvasTexture(crop);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  ownedTextures.push(texture);
  return texture;
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
  },
) {
  const { width, height, depth, z, color, front, back } = options;
  const bodyMaterial = basicMaterial({ color });
  const body = new THREE.Mesh(geometry(new THREE.BoxGeometry(width, height, depth)), bodyMaterial);
  body.position.set(width / 2, 0, z);
  hinge.add(body);

  const faceGeometry = geometry(new THREE.PlaneGeometry(width, height));
  const frontMaterial = basicMaterial({
    map: makeRegionTexture(...front),
    transparent: true,
    alphaTest: 0.01,
    side: THREE.FrontSide,
  });
  const frontFace = new THREE.Mesh(faceGeometry, frontMaterial);
  frontFace.position.set(width / 2, 0, z + depth / 2 + 0.006);
  hinge.add(frontFace);

  const backMaterial = basicMaterial({
    map: makeRegionTexture(...back),
    transparent: true,
    alphaTest: 0.01,
    side: THREE.FrontSide,
  });
  const backFace = new THREE.Mesh(faceGeometry, backMaterial);
  backFace.position.set(width / 2, 0, z - depth / 2 - 0.006);
  backFace.rotation.y = Math.PI;
  hinge.add(backFace);
}

function buildBook() {
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
    depth: 0.5,
    z: -0.06,
    color: 0xe8ddb4,
    front: [13, 11, 5, 8],
    back: [19, 11, 5, 8],
  });
  rightStack.position.x = 0.32;

  leftPages = new THREE.Group();
  bookRoot.add(leftPages);
  addTexturedLeaf(leftPages, {
    width: 5.25,
    height: 8.65,
    depth: 0.34,
    z: 0.18,
    color: 0xeee4bd,
    front: [1, 11, 5, 8],
    back: [7, 11, 5, 8],
  });
  leftPages.position.x = 0.32;

  const turningMaterial = basicMaterial({
    map: makeRegionTexture(24, 10, 5, 8),
    color: 0xfff7d7,
    transparent: true,
    alphaTest: 0.01,
    side: THREE.DoubleSide,
  });
  const turningGeometry = geometry(new THREE.PlaneGeometry(5.15, 8.45, 6, 1));

  firstTurningPage = new THREE.Group();
  const firstPage = new THREE.Mesh(turningGeometry, turningMaterial);
  firstPage.position.set(2.88, 0, 0.39);
  firstTurningPage.add(firstPage);
  bookRoot.add(firstTurningPage);

  secondTurningPage = new THREE.Group();
  const secondPage = new THREE.Mesh(turningGeometry, turningMaterial);
  secondPage.position.set(2.88, 0, 0.44);
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
    transparent: true,
    alphaTest: 0.01,
  });
  const seam = new THREE.Mesh(geometry(new THREE.BoxGeometry(0.42, 10.15, 0.76)), seamMaterial);
  seam.position.z = 0.06;
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
  leftPages.rotation.y = -Math.PI * 0.955 * pageOpening;

  const flutter = Math.sin(pageOpening * Math.PI) * 0.08;
  firstTurningPage.rotation.y = -Math.PI * pageOpening * 0.72 - flutter;
  secondTurningPage.rotation.y = -Math.PI * pageOpening * 0.86 + flutter * 0.65;

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

onMounted(() => {
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

  new THREE.TextureLoader().load(bookAtlasUrl, (texture) => {
    sourceTexture = texture;
    sourceTexture.colorSpace = THREE.SRGBColorSpace;
    sourceTexture.magFilter = THREE.NearestFilter;
    sourceTexture.minFilter = THREE.NearestFilter;
    sourceTexture.generateMipmaps = false;
    buildBook();
    updatePose();
  });

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(hostRef.value);
  resize();
});

watch(() => [props.progress, props.reducedMotion], updatePose);

onBeforeUnmount(() => {
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
