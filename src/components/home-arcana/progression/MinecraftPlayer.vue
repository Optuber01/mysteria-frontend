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
import type { Mesh, MeshStandardMaterial, Object3D, PointLight, Vector3 } from 'three';
import type { PlayerAnimation, SkinViewer } from 'skinview3d';

// Placeholder: the stock Steve skin until a Mysterria character skin exists.
import steveSkinUrl from '@/assets/images/home/progression/steve.png';
import { useReducedMotion } from '@/composables/useReducedMotion';

export type MinecraftPlayerMode = 'drink' | 'advance';

export type HandPosition = { x: number; y: number };

const props = withDefaults(
  defineProps<{
    mode?: MinecraftPlayerMode;
    /** Allow skinview3d (and its WebGL context) to load once in view. */
    armed?: boolean;
    progress?: number;
    /** 0..1: the awakening's crimson rim light and the lift out of shadow. */
    glow?: number;
    /** 0..1: how far the figure is in silhouette (low front light). */
    shade?: number;
    /** 0..1 (drink): the potion raised from the chest to the mouth. */
    lift?: number;
    /** 0..1 (drink): how far the head has tipped back over the gulps. */
    sip?: number;
    /** A dark frock coat and top hat over the skin, built from its own boxes. */
    costume?: boolean;
    /** Accessible description of the pose. */
    label?: string;
  }>(),
  {
    mode: 'drink',
    armed: true,
    progress: 0,
    glow: 0,
    shade: 0,
    lift: 1,
    sip: 0,
    costume: false,
    label: '',
  },
);

const emit = defineEmits<{
  /** Screen position (px, relative to this figure) of the right hand while drinking. */
  (e: 'hand', pos: HandPosition | null): void;
}>();

const host = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const ready = ref(false);
const failed = ref(false);
const inViewport = ref(false);
const reducedMotion = useReducedMotion();

let viewer: SkinViewer | null = null;
let skinview: typeof import('skinview3d') | null = null;
let resizeObserver: ResizeObserver | null = null;
let intersectionObserver: IntersectionObserver | null = null;
let disposed = false;
let lastHand: HandPosition | null = null;
let viewerCreationStarted = false;
// Borrowed from the loaded three.js instance (via clone) so this component
// never has to import three itself.
let handVector: Vector3 | null = null;
// Crimson lights behind the player, cloned from the camera light for the same reason.
let rimLights: PointLight[] = [];
// One animation per mode, reused across scroll frames.
const animations = new Map<MinecraftPlayerMode, PlayerAnimation>();
// Scroll progress is mapped onto this many animation seconds.
const SCROLL_TIMELINE = 4.2;

function makeAnimation(mode: MinecraftPlayerMode): PlayerAnimation {
  if (!skinview) throw new Error('The player renderer is not ready.');

  if (mode === 'advance') {
    // Awakened: lifted off the circle, arms opening, face up to the moon.
    const animation = new skinview.FunctionAnimation((player, progress) => {
      const open = clamp01((progress - 1.6) / 1.2);
      const float = Math.sin(progress * 1.25) * 0.05;
      player.skin.rightArm.rotation.x = lerp(-0.12, -0.3, open) + float;
      player.skin.rightArm.rotation.z = lerp(-0.06, -0.36, open);
      player.skin.leftArm.rotation.x = lerp(-0.12, -0.3, open) - float;
      player.skin.leftArm.rotation.z = lerp(0.06, 0.36, open);
      player.skin.head.rotation.x = lerp(-0.08, -0.3, open);
      player.skin.head.rotation.y = 0;
      player.skin.rightLeg.rotation.x = -0.05;
      player.skin.leftLeg.rotation.x = 0.07;
      player.position.y = 0.4 + open * 0.6 + float * 4;
      player.rotation.y = lerp(-0.1, 0.06, open);
    });
    animation.speed = 0.68;
    return animation;
  }

  const animation = new skinview.FunctionAnimation((player, progress) => {
    const breath = Math.sin(progress * 2.2) * 0.035;
    const lift = clamp01(props.lift);
    const sip = clamp01(props.sip);
    // The potion is held at the chest, then raised: the arm comes forward and
    // in so the hand overlaps the mouth on screen; the head tips back to drink.
    player.skin.rightArm.rotation.x = lerp(-0.62, -1.65, lift) + sip * 0.12;
    player.skin.rightArm.rotation.z = lerp(0.18, 0.65, lift);
    player.skin.leftArm.rotation.x = -0.22 - breath - sip * 0.1;
    player.skin.leftArm.rotation.z = -0.1 - sip * 0.12;
    player.skin.head.rotation.x = lerp(0.3, 0.12, lift) - sip * 0.34 + breath;
    player.skin.head.rotation.y = -0.06;
    player.rotation.y = -0.15 + sip * 0.06;
    player.position.y = breath * 1.6;
  });
  animation.speed = 0.82;
  return animation;
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/*
 * A frock coat and top hat for the awakening's silhouette, made by cloning the
 * skin's own unit-box arm mesh (so three.js is never imported here) with a
 * plain dark material. The skin itself is untouched: the face, hands and legs
 * still read as the player's.
 */
function dress(instance: SkinViewer): void {
  const skin = instance.playerObject.skin;
  const unit = skin.rightArm.innerLayer as Mesh;
  const base = unit.material as MeshStandardMaterial;
  const cloth = (color: number) => {
    const material = base.clone();
    material.map = null;
    material.color.setHex(color);
    material.roughness = 0.95;
    material.metalness = 0;
    material.needsUpdate = true;
    return material;
  };
  const coat = cloth(0x17181d);
  const hat = cloth(0x0e0e11);
  const band = cloth(0x5e0f17);
  const box = (parent: Object3D, material: MeshStandardMaterial, size: [number, number, number], at: [number, number, number]) => {
    const mesh = unit.clone();
    mesh.material = material;
    mesh.scale.set(...size);
    mesh.position.set(...at);
    parent.add(mesh);
  };
  // top hat: brim, crown, crimson band (the head spans y 0..8)
  box(skin.head, hat, [10.6, 0.7, 10.6], [0, 8.55, 0]);
  box(skin.head, hat, [7.4, 6.6, 7.4], [0, 12.1, 0]);
  box(skin.head, band, [7.6, 1.1, 7.6], [0, 9.5, 0]);
  // open coat: two front panels leave the shirt showing down the middle
  box(skin.body, coat, [3.3, 12.7, 4.9], [-2.6, 0, 0]);
  box(skin.body, coat, [3.3, 12.7, 4.9], [2.6, 0, 0]);
  box(skin.body, coat, [8.9, 12.7, 1.2], [0, 0, -1.9]);
  // coat skirts to the knee, split at the front
  box(skin.body, coat, [4.3, 7, 5], [-2.25, -9.4, 0]);
  box(skin.body, coat, [4.3, 7, 5], [2.25, -9.4, 0]);
  // sleeves to the wrist (each arm's pivot spans y -6..6)
  [skin.rightArm, skin.leftArm].forEach((arm) => {
    const pivot = arm.innerLayer.parent;
    if (pivot) box(pivot, coat, [4.7, 9.6, 4.7], [0, 1.3, 0]);
  });
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
  // In silhouette the front light falls away and the rim carries the figure.
  viewer.globalLight.intensity = (1.1 + glow * 1.2) * (1 - 0.72 * shade);
  viewer.cameraLight.intensity = (0.55 + glow * 0.25) * (1 - 0.6 * shade);
  rimLights.forEach((light) => {
    light.intensity = 0.5 + glow * 2.6 + shade * 0.8;
  });
}

function sizeViewer() {
  if (!viewer || !host.value) return;

  const bounds = host.value.getBoundingClientRect();
  const width = Math.max(1, Math.round(bounds.width));
  const height = Math.max(1, Math.round(bounds.height));
  viewer.setSize(width, height);
  viewer.render();
  emitHandPosition();
}

/** Projects the right hand (end of the raised arm) to screen px relative to this figure. */
function emitHandPosition(): void {
  if (!viewer || !ready.value || props.mode !== 'drink' || !host.value) return;
  const arm = viewer.playerObject?.skin?.rightArm;
  if (!arm) return;

  // the hand is the bottom of the arm mesh in the arm's local space
  handVector ??= arm.position.clone();
  handVector.set(0, -10, 0);
  arm.localToWorld(handVector);
  handVector.project(viewer.camera);

  const next: HandPosition = {
    x: (handVector.x * 0.5 + 0.5) * host.value.clientWidth,
    y: (0.5 - handVector.y * 0.5) * host.value.clientHeight,
  };
  if (lastHand && Math.abs(next.x - lastHand.x) < 0.4 && Math.abs(next.y - lastHand.y) < 0.4) return;
  lastHand = next;
  emit('hand', next);
}

/*
 * The pose is scrubbed by scroll rather than played on a clock: the animation
 * stays paused and its progress is set directly, then one frame is rendered.
 * Reduced motion holds the first frame.
 */
function syncPlayback() {
  if (!viewer || !skinview || viewer.disposed) return;

  const animation = animationFor(props.mode);
  viewer.animation = animation;
  viewer.autoRotate = false;
  viewer.renderPaused = true;
  const progress = reducedMotion.value ? 0 : Math.max(0, Math.min(1, props.progress)) * SCROLL_TIMELINE;
  animation.paused = false;
  animation.progress = progress;
  animation.update(viewer.playerObject, 0);
  animation.paused = true;
  if (inViewport.value) viewer.render();
  emitHandPosition();
}

async function createViewer() {
  if (viewerCreationStarted || disposed || !canvas.value || !host.value) return;
  viewerCreationStarted = true;

  try {
    skinview = await import('skinview3d');
    if (disposed || !canvas.value || !host.value || viewer) return;

    const instance = new skinview.SkinViewer({
      canvas: canvas.value,
      width: 1,
      height: 1,
      enableControls: false,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      renderPaused: true,
      zoom: 0.84,
      fov: 46,
    });
    viewer = instance;
    instance.background = null;
    // A dark stage: low ambient so the figure starts as a near-silhouette, and
    // two crimson rim lights behind the shoulders that the awakening turns up.
    rimLights = [-1, 1].map((side) => {
      const light = instance.cameraLight.clone();
      light.color.set(0xe5545d);
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
watch(
  () => [props.mode, props.progress, props.lift, props.sip, reducedMotion.value] as const,
  () => syncPlayback(),
);

onUnmounted(() => {
  disposed = true;
  resizeObserver?.disconnect();
  intersectionObserver?.disconnect();
  viewer?.dispose();
  viewer = null;
  rimLights = [];
  skinview = null;
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
  min-height: 220px;
  margin: 0;
  isolation: isolate;
  overflow: visible;
}

/* contact shadow on the floor */
.minecraft-player::before {
  position: absolute;
  z-index: -1;
  left: 50%;
  bottom: 2%;
  width: min(60%, 260px);
  aspect-ratio: 2.6;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(0, 0, 0, 0.75), transparent 72%);
  content: '';
  opacity: 0;
  transform: translateX(-50%) scale(0.78);
  transition:
    opacity 0.45s ease,
    transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

.minecraft-player.is-ready::before {
  opacity: 1;
  transform: translateX(-50%) scale(1);
}

.minecraft-player__canvas {
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  /* In shadow while drinking; the awakening lifts the figure and haloes it. */
  filter:
    brightness(calc(0.78 + var(--glow) * 0.27 - var(--shade) * 0.3))
    drop-shadow(0 0 calc(var(--glow) * 22px) rgba(229, 84, 93, calc(var(--glow) * 0.65)))
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

/* Steve's own colours: the fallback stands in for the in-game skin. */
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
