<template>
  <figure
    ref="host"
    class="minecraft-player"
    :class="{ 'is-ready': ready }"
    :style="{ '--glow': glow.toFixed(3) }"
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
import type { PointLight, Vector3 } from 'three';
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
    /** Accessible description of the pose. */
    label?: string;
  }>(),
  {
    mode: 'drink',
    armed: true,
    progress: 0,
    glow: 0,
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
    const animation = new skinview.FunctionAnimation((player, progress) => {
      const lift = (Math.sin(progress * 1.25) + 1) * 0.34;
      const pulse = Math.sin(progress * 1.25) * 0.06;
      player.skin.rightArm.rotation.x = -2.14 + pulse;
      player.skin.rightArm.rotation.z = -0.82;
      player.skin.leftArm.rotation.x = -2.14 - pulse;
      player.skin.leftArm.rotation.z = 0.82;
      player.skin.head.rotation.x = -0.08;
      player.skin.rightLeg.rotation.x = -0.07;
      player.skin.leftLeg.rotation.x = 0.07;
      player.position.y = lift;
      player.rotation.y = Math.sin(progress * 0.36) * 0.16;
    });
    animation.speed = 0.68;
    return animation;
  }

  const animation = new skinview.FunctionAnimation((player, progress) => {
    const breath = Math.sin(progress * 2.2) * 0.035;
    const sip = Math.sin(progress * 1.35) * 0.05;
    // arm extended toward the camera so the hand overlaps the mouth on screen; head tilted back to drink
    player.skin.rightArm.rotation.x = -1.65 + sip;
    player.skin.rightArm.rotation.z = 0.65;
    player.skin.leftArm.rotation.x = -0.22 - breath;
    player.skin.leftArm.rotation.z = -0.1;
    player.skin.head.rotation.x = 0.26 + breath;
    player.skin.head.rotation.y = -0.06;
    player.rotation.y = -0.15;
    player.position.y = breath * 1.6;
  });
  animation.speed = 0.82;
  return animation;
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
  const glow = Math.max(0, Math.min(1, props.glow));
  viewer.globalLight.intensity = 1.1 + glow * 1.2;
  viewer.cameraLight.intensity = 0.55 + glow * 0.25;
  rimLights.forEach((light) => {
    light.intensity = 0.5 + glow * 2.6;
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
watch(() => props.glow, () => {
  applyLighting();
  if (inViewport.value && viewer && !viewer.disposed) viewer.render();
});
watch(
  () => [props.mode, props.progress, reducedMotion.value] as const,
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
    brightness(calc(0.78 + var(--glow) * 0.27))
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
