<template>
  <figure
    ref="host"
    class="minecraft-player"
    :class="[`minecraft-player--${mode}`, { 'is-ready': ready, 'has-error': failed }]"
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
import type { Vector3 } from 'three';
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
    /** Accessible description of the pose. */
    label?: string;
  }>(),
  {
    mode: 'drink',
    armed: true,
    progress: 0,
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
    // Brighter ambient + camera fill so the figure reads on the ivory stage.
    instance.globalLight.intensity = 3.05;
    instance.cameraLight.intensity = 1.0;

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
  skinview = null;
  animations.clear();
});
</script>

<style scoped>
.minecraft-player {
  position: relative;
  width: 100%;
  min-width: 0;
  height: 100%;
  min-height: 220px;
  margin: 0;
  isolation: isolate;
  overflow: visible;
}

.minecraft-player::before {
  position: absolute;
  z-index: -1;
  left: 50%;
  bottom: 2%;
  width: min(56%, 260px);
  aspect-ratio: 2.6;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(60, 48, 30, 0.2), transparent 72%);
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

.minecraft-player--advance::before {
  background: radial-gradient(ellipse, rgba(198, 155, 82, 0.3), transparent 72%);
}

.minecraft-player__canvas {
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  filter: brightness(1.04) saturate(1.05) drop-shadow(0 24px 22px rgba(50, 40, 26, 0.26));
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
