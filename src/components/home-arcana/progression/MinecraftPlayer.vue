<template>
  <figure
    ref="host"
    class="minecraft-player"
    :class="{ 'is-ready': ready }"
    :style="{ '--glow': glow.toFixed(3), '--shade': shade.toFixed(3) }"
    role="img"
    :aria-label="label || undefined"
  >
    <canvas ref="canvas" class="minecraft-player__canvas" aria-hidden="true" />
    <div v-if="failed" class="minecraft-player__fallback" aria-hidden="true">
      <span class="minecraft-player__fallback-head" />
      <span class="minecraft-player__fallback-body" />
    </div>
  </figure>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import type * as THREE from 'three';
import type { PlayerAnimation, SkinViewer } from 'skinview3d';

// Placeholder: the stock Steve skin until a Mysterria character skin exists.
import steveSkinUrl from '@/assets/images/home/progression/steve.png';
import { useReducedMotion } from '@/composables/useReducedMotion';
import { drawVial, hexToRgb, vialRows } from './art';

export type MinecraftPlayerMode = 'drink' | 'advance';
/** The held bottle on screen: centre and height, px relative to this figure. */
export type BottlePosition = { x: number; y: number; size: number };

const props = withDefaults(
  defineProps<{
    mode?: MinecraftPlayerMode;
    /** Allow skinview3d (and its WebGL context) to load once in view. */
    armed?: boolean;
    progress?: number;
    /** 0..1: the awakening's rim light and the lift out of shadow. */
    glow?: number;
    /** 0..1: how far the figure is in silhouette (low front light). */
    shade?: number;
    /** 0..1: the right arm held out to take the potion. */
    reach?: number;
    /** 0..1: the bottle raised from the chest to the mouth. */
    lift?: number;
    /** 0..1: the bottle tipped up and the head back, over the gulps. */
    sip?: number;
    /** 0..1: the arm lowered again, the empty bottle still in hand. */
    lower?: number;
    /** The bottle is in his hand (before that it is a DOM sprite floating to it). */
    holding?: boolean;
    /** 0..1 potion left in the bottle. */
    level?: number;
    /** The potion's colour (#rrggbb). */
    accent?: string;
    /** A dark frock coat and top hat over the skin, built from its own boxes. */
    costume?: boolean;
    label?: string;
  }>(),
  {
    mode: 'drink',
    armed: true,
    progress: 0,
    glow: 0,
    shade: 0,
    reach: 0,
    lift: 0,
    sip: 0,
    lower: 0,
    holding: false,
    level: 1,
    accent: '#a78bfa',
    costume: false,
    label: '',
  },
);

const emit = defineEmits<{ (e: 'bottle', pos: BottlePosition | null): void }>();

const host = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const ready = ref(false);
const failed = ref(false);
const inViewport = ref(false);
const reducedMotion = useReducedMotion();

let viewer: SkinViewer | null = null;
let skinview: typeof import('skinview3d') | null = null;
let three: typeof import('three') | null = null;
let resizeObserver: ResizeObserver | null = null;
let intersectionObserver: IntersectionObserver | null = null;
let disposed = false;
let viewerCreationStarted = false;
let rimLights: THREE.PointLight[] = [];
const animations = new Map<MinecraftPlayerMode, PlayerAnimation>();
// Scroll progress is mapped onto this many animation seconds.
const SCROLL_TIMELINE = 4.2;

/* ---- the bottle: a 16 px sprite on a plane, held in the right fist ---- */
let holder: THREE.Group | null = null;
let bottle: THREE.Mesh | null = null;
let bottleCanvas: HTMLCanvasElement | null = null;
let bottleTexture: THREE.CanvasTexture | null = null;
let lastBottle = '';
const BOTTLE_SIZE = 9;

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function paintBottle() {
  if (!bottleCanvas || !bottleTexture) return;
  const context = bottleCanvas.getContext('2d');
  if (!context) return;
  context.imageSmoothingEnabled = false;
  drawVial(context, hexToRgb(props.accent), props.level);
  bottleTexture.needsUpdate = true;
}

function makeBottle(instance: SkinViewer) {
  if (!three) return;
  bottleCanvas = document.createElement('canvas');
  bottleCanvas.width = 16;
  bottleCanvas.height = 16;
  bottleTexture = new three.CanvasTexture(bottleCanvas);
  bottleTexture.colorSpace = three.SRGBColorSpace;
  bottleTexture.magFilter = three.NearestFilter;
  bottleTexture.minFilter = three.NearestFilter;
  bottleTexture.generateMipmaps = false;
  paintBottle();
  // Unlit: the potion glows in the dark around him; the empty glass stays glass.
  const material = new three.MeshBasicMaterial({ map: bottleTexture, transparent: true, alphaTest: 0.04, side: three.DoubleSide, depthWrite: false });
  bottle = new three.Mesh(new three.PlaneGeometry(BOTTLE_SIZE, BOTTLE_SIZE), material);
  bottle.renderOrder = 2;
  holder = new three.Group();
  holder.add(bottle);
  // the fist: the bottom of the right arm (its pivot spans y -10..2)
  holder.position.set(0, -10.2, 0.4);
  instance.playerObject.skin.rightArm.add(holder);
  holder.visible = props.holding;
}

/**
 * Keeps the bottle upright in the player's own frame (so it never turns
 * edge-on as the arm swings), then tips it in the picture plane while he
 * drinks, neck to his mouth. It sits in front of the fist, toward the camera,
 * so it is always drawn over the face, never inside the head.
 */
let qArm: THREE.Quaternion | null = null;
let qWant: THREE.Quaternion | null = null;
let zAxis: THREE.Vector3 | null = null;
function orientBottle(tip: number) {
  if (!three || !holder || !bottle || !viewer) return;
  const arm = viewer.playerObject.skin.rightArm;
  qArm ??= new three.Quaternion();
  qWant ??= new three.Quaternion();
  zAxis ??= new three.Vector3(0, 0, 1);
  qArm.copy(arm.quaternion).invert();
  qWant.setFromAxisAngle(zAxis, tip);
  holder.quaternion.copy(qArm.multiply(qWant));
  // the neck leads as it tips, so the mouth of the bottle meets his
  bottle.position.set(-Math.sin(tip) * 1.6, 1.6 + Math.cos(tip) * 0.6, 3.2);
}

function makeAnimation(mode: MinecraftPlayerMode): PlayerAnimation {
  if (!skinview) throw new Error('The player renderer is not ready.');

  if (mode === 'advance') {
    // Awakened: lifted off the circle, arms opening, face up to the moon;
    // the empty bottle is still in his right hand.
    const animation = new skinview.FunctionAnimation((player, progress) => {
      const open = clamp01((progress - 0.4) / 1.6);
      const float = Math.sin(progress * 1.25) * 0.05;
      player.skin.rightArm.rotation.x = lerp(-0.3, -0.36, open) + float;
      player.skin.rightArm.rotation.z = lerp(0.1, -0.42, open);
      player.skin.leftArm.rotation.x = lerp(-0.12, -0.36, open) - float;
      player.skin.leftArm.rotation.z = lerp(0.06, 0.42, open);
      player.skin.head.rotation.x = lerp(-0.05, -0.28, open);
      player.skin.head.rotation.y = 0;
      player.skin.rightLeg.rotation.x = -0.05 * open;
      player.skin.leftLeg.rotation.x = 0.07 * open;
      player.position.y = open * 1.2 + float * 4;
      player.rotation.y = lerp(-0.12, 0.04, open);
      orientBottle(lerp(0.1, 0.3, open));
    });
    animation.speed = 0.68;
    return animation;
  }

  const animation = new skinview.FunctionAnimation((player, progress) => {
    const breath = Math.sin(progress * 2.2) * 0.03;
    const reach = clamp01(props.reach);
    const lift = clamp01(props.lift);
    const sip = clamp01(props.sip);
    const lower = clamp01(props.lower);
    // rest -> held out for the potion -> raised to the mouth -> tipped -> lowered
    let armX = lerp(-0.12, -1.25, reach);
    let armZ = lerp(0.06, 0.1, reach);
    armX = lerp(armX, -2.05, lift) - sip * 0.32;
    armZ = lerp(armZ, 0.5, lift) + sip * 0.06;
    armX = lerp(armX, -0.3, lower);
    armZ = lerp(armZ, 0.1, lower);
    player.skin.rightArm.rotation.x = armX + breath * 0.5;
    player.skin.rightArm.rotation.z = armZ;
    player.skin.rightArm.rotation.y = 0;
    player.skin.leftArm.rotation.x = -0.18 - breath - sip * 0.1 * (1 - lower);
    player.skin.leftArm.rotation.z = -0.08 - sip * 0.1 * (1 - lower);
    player.skin.head.rotation.x = lerp(0.12, 0.06, lift) - sip * 0.42 * (1 - lower) + breath + lower * 0.18;
    player.skin.head.rotation.y = -0.05;
    player.rotation.y = -0.16 + sip * 0.05 * (1 - lower);
    player.position.y = breath * 1.4;
    // tipped up as he drinks: neck toward his mouth, bottom to the sky
    orientBottle(-(lift * 0.35 + sip * 1.55) * (1 - lower) - lower * 0.12);
  });
  animation.speed = 0.82;
  return animation;
}

/*
 * A frock coat and top hat for the silhouette, made by cloning the skin's own
 * unit-box arm mesh with a plain dark material. The face, hands and legs
 * still read as the player's.
 */
function dress(instance: SkinViewer): void {
  const skin = instance.playerObject.skin;
  const unit = skin.rightArm.innerLayer as THREE.Mesh;
  const base = unit.material as THREE.MeshStandardMaterial;
  const cloth = (color: number) => {
    const material = base.clone();
    material.map = null;
    material.color.setHex(color);
    material.roughness = 0.95;
    material.metalness = 0;
    material.needsUpdate = true;
    return material;
  };
  const coat = cloth(0x17171d);
  const hat = cloth(0x0e0e11);
  const band = cloth(0x2a2833);
  const box = (parent: THREE.Object3D, material: THREE.MeshStandardMaterial, size: [number, number, number], at: [number, number, number]) => {
    const mesh = unit.clone();
    mesh.material = material;
    mesh.scale.set(...size);
    mesh.position.set(...at);
    parent.add(mesh);
    return mesh;
  };
  box(skin.head, hat, [10.6, 0.7, 10.6], [0, 8.55, 0]);
  box(skin.head, hat, [7.4, 6.6, 7.4], [0, 12.1, 0]);
  // the hat band takes the Pathway's colour (see setBand)
  bandMaterial = box(skin.head, band, [7.6, 1.1, 7.6], [0, 9.5, 0]).material as THREE.MeshStandardMaterial;
  box(skin.body, coat, [3.3, 12.7, 4.9], [-2.6, 0, 0]);
  box(skin.body, coat, [3.3, 12.7, 4.9], [2.6, 0, 0]);
  box(skin.body, coat, [8.9, 12.7, 1.2], [0, 0, -1.9]);
  box(skin.body, coat, [4.3, 7, 5], [-2.25, -9.4, 0]);
  box(skin.body, coat, [4.3, 7, 5], [2.25, -9.4, 0]);
  [skin.rightArm, skin.leftArm].forEach((arm) => {
    const pivot = arm.innerLayer.parent;
    if (pivot) box(pivot, coat, [4.7, 9.6, 4.7], [0, 1.3, 0]);
  });
  setBand();
}
let bandMaterial: THREE.MeshStandardMaterial | null = null;
function setBand() {
  if (!bandMaterial) return;
  const [r, g, b] = hexToRgb(props.accent);
  bandMaterial.color.setRGB((r / 255) * 0.55, (g / 255) * 0.55, (b / 255) * 0.55);
}

function animationFor(mode: MinecraftPlayerMode): PlayerAnimation {
  let animation = animations.get(mode);
  if (!animation) {
    animation = makeAnimation(mode);
    animations.set(mode, animation);
  }
  return animation;
}

function applyLighting() {
  if (!viewer) return;
  const glow = clamp01(props.glow);
  const shade = clamp01(props.shade);
  viewer.globalLight.intensity = (1.1 + glow * 1.2) * (1 - 0.72 * shade);
  viewer.cameraLight.intensity = (0.55 + glow * 0.25) * (1 - 0.6 * shade);
  const [r, g, b] = hexToRgb(props.accent);
  rimLights.forEach((light) => {
    light.color.setRGB(r / 255, g / 255, b / 255);
    light.intensity = 0.5 + glow * 2.6 + shade * 0.8;
  });
}

function sizeViewer() {
  if (!viewer || !host.value) return;
  const bounds = host.value.getBoundingClientRect();
  viewer.setSize(Math.max(1, Math.round(host.value.clientWidth || bounds.width)), Math.max(1, Math.round(host.value.clientHeight || bounds.height)));
  viewer.render();
  emitBottle();
}

let projector: THREE.Vector3 | null = null;
let edge: THREE.Vector3 | null = null;
/** Projects the bottle to px relative to this figure, so the DOM sprite can meet it. */
function emitBottle(): void {
  if (!viewer || !three || !bottle || !host.value || !ready.value) return;
  viewer.playerWrapper.updateMatrixWorld(true);
  projector ??= new three.Vector3();
  edge ??= new three.Vector3();
  const w = host.value.clientWidth;
  const h = host.value.clientHeight;
  projector.set(0, 0, 0);
  bottle.localToWorld(projector);
  projector.project(viewer.camera);
  edge.set(0, BOTTLE_SIZE / 2, 0);
  bottle.localToWorld(edge);
  edge.project(viewer.camera);
  const x = (projector.x * 0.5 + 0.5) * w;
  const y = (0.5 - projector.y * 0.5) * h;
  const size = Math.hypot((edge.x - projector.x) * 0.5 * w, (edge.y - projector.y) * 0.5 * h) * 2;
  const key = `${x.toFixed(1)},${y.toFixed(1)},${size.toFixed(1)}`;
  if (key === lastBottle) return;
  lastBottle = key;
  emit('bottle', { x, y, size });
}

/*
 * The pose is scrubbed by scroll rather than played on a clock: the animation
 * stays paused, its progress is set directly, then one frame is rendered.
 */
function syncPlayback() {
  if (!viewer || !skinview || viewer.disposed) return;
  const animation = animationFor(props.mode);
  viewer.animation = animation;
  viewer.autoRotate = false;
  viewer.renderPaused = true;
  const progress = reducedMotion.value ? SCROLL_TIMELINE : clamp01(props.progress) * SCROLL_TIMELINE;
  animation.paused = false;
  animation.progress = progress;
  animation.update(viewer.playerObject, 0);
  animation.paused = true;
  if (holder) holder.visible = props.holding;
  if (inViewport.value) viewer.render();
  emitBottle();
}

async function createViewer() {
  if (viewerCreationStarted || disposed || !canvas.value || !host.value) return;
  viewerCreationStarted = true;
  try {
    [skinview, three] = await Promise.all([import('skinview3d'), import('three')]);
    if (disposed || !canvas.value || !host.value || viewer) return;

    const instance = new skinview.SkinViewer({
      canvas: canvas.value,
      width: 1,
      height: 1,
      enableControls: false,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      renderPaused: true,
      // layout.ts PLAYER_FRAME mirrors this framing
      zoom: 0.66,
      fov: 40,
    });
    viewer = instance;
    instance.background = null;
    // A dark stage: low ambient, two rim lights in the Pathway's colour
    // behind the shoulders that the awakening turns up.
    rimLights = [-1, 1].map((side) => {
      const light = instance.cameraLight.clone();
      light.position.set(side * 26, 18, -30);
      instance.scene.add(light);
      return light;
    });
    applyLighting();

    resizeObserver = new ResizeObserver(sizeViewer);
    resizeObserver.observe(host.value);

    await instance.loadSkin(steveSkinUrl, { model: 'default' });
    if (disposed || !viewer) return;
    if (props.costume) dress(instance);
    makeBottle(instance);

    ready.value = true;
    sizeViewer();
    syncPlayback();
  } catch (error) {
    failed.value = true;
    console.warn('The Minecraft player model could not be initialized.', error);
  }
}

function maybeCreateViewer() {
  if (props.armed && inViewport.value) void createViewer();
}

onMounted(() => {
  if (!canvas.value || !host.value) return;
  intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      inViewport.value = entry?.isIntersecting ?? false;
      maybeCreateViewer();
      syncPlayback();
    },
    { rootMargin: '120px 0px', threshold: 0.01 },
  );
  intersectionObserver.observe(host.value);
});

watch(() => props.armed, maybeCreateViewer);
watch(() => [props.glow, props.shade] as const, () => {
  applyLighting();
  if (inViewport.value && viewer && !viewer.disposed) viewer.render();
});
watch(() => props.accent, () => {
  setBand();
  applyLighting();
  paintBottle();
  syncPlayback();
});
watch(() => vialRows(props.level), () => {
  paintBottle();
  if (inViewport.value && viewer && !viewer.disposed) viewer.render();
});
watch(
  () => [props.mode, props.progress, props.reach, props.lift, props.sip, props.lower, props.holding, reducedMotion.value] as const,
  () => syncPlayback(),
);

onUnmounted(() => {
  disposed = true;
  resizeObserver?.disconnect();
  intersectionObserver?.disconnect();
  bottleTexture?.dispose();
  (bottle?.material as THREE.Material | undefined)?.dispose();
  bottle?.geometry.dispose();
  viewer?.dispose();
  viewer = null;
  rimLights = [];
  skinview = null;
  three = null;
  animations.clear();
});
</script>

<style scoped>
.minecraft-player {
  --glow: 0;
  --shade: 0;
  position: relative;
  width: 100%;
  min-width: 0;
  height: 100%;
  margin: 0;
  isolation: isolate;
  overflow: visible;
}

/* contact shadow on the floor (feet at 80% of the frame, see layout.ts) */
.minecraft-player::before {
  position: absolute;
  z-index: -1;
  left: 50%;
  top: 80%;
  width: min(62%, 260px);
  aspect-ratio: 2.6;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(0, 0, 0, 0.75), transparent 72%);
  content: '';
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.78);
  transition: opacity 0.45s ease, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

.minecraft-player.is-ready::before {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
}

.minecraft-player__canvas {
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  /* In shadow while drinking; the awakening lifts the figure and haloes it. */
  filter:
    brightness(calc(0.8 + var(--glow) * 0.25 - var(--shade) * 0.3))
    drop-shadow(0 0 calc(var(--glow) * 22px) color-mix(in oklab, var(--acc) calc(var(--glow) * 65%), transparent))
    drop-shadow(0 24px 22px rgba(0, 0, 0, 0.5));
  transition: opacity 0.14s ease;
}

.minecraft-player.is-ready .minecraft-player__canvas {
  opacity: 1;
}

.minecraft-player__fallback {
  position: absolute;
  inset: 12% 32% 8%;
  display: grid;
  grid-template-rows: 28% 1fr;
  justify-items: center;
  opacity: 0.7;
}

.minecraft-player__fallback-head {
  width: 64%;
  aspect-ratio: 1;
  align-self: end;
  background: #b98465;
  box-shadow: inset 0 22% #32261f;
}

.minecraft-player__fallback-body {
  width: 82%;
  height: 80%;
  background: linear-gradient(#3a9aa0 0 46%, #314b82 46%);
}

@media (prefers-reduced-motion: reduce) {
  .minecraft-player::before,
  .minecraft-player__canvas {
    transition: none;
  }
}
</style>
