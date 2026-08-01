<template>
  <figure
    ref="host"
    class="minecraft-player"
    :class="[`minecraft-player--${mode}`, { 'is-ready': ready, 'has-error': failed }]"
    role="img"
    :aria-label="accessibleLabel"
  >
    <canvas ref="canvas" class="minecraft-player__canvas" aria-hidden="true" />
    <figcaption class="minecraft-player__caption">
      {{ accessibleLabel }}
    </figcaption>
    <div v-if="failed" class="minecraft-player__fallback" aria-hidden="true">
      <span class="minecraft-player__fallback-head" />
      <span class="minecraft-player__fallback-body" />
    </div>
  </figure>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { PlayerAnimation, SkinViewer } from 'skinview3d';

import steveSkinUrl from '@/assets/images/home/progression/steve.png';
import { useReducedMotion } from '@/composables/useReducedMotion';

export type MinecraftPlayerMode = 'idle' | 'inspect' | 'gather' | 'brew' | 'drink' | 'cast' | 'walk' | 'advance';

const props = withDefaults(
  defineProps<{
    mode?: MinecraftPlayerMode;
    active?: boolean;
    progress?: number;
    label?: string;
  }>(),
  {
    mode: 'idle',
    active: true,
    progress: 0,
    label: '',
  },
);

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

const modeLabels: Record<MinecraftPlayerMode, string> = {
  idle: 'Steve standing ready to enter Mysterria',
  inspect: 'Steve inspecting a recovered potion formula',
  gather: 'Steve gathering ingredients in Mysterria',
  brew: 'Steve loading ingredients into the Ritual Altar',
  drink: 'Steve drinking a Sequence potion',
  cast: 'Steve performing a Seer acting method',
  walk: 'Steve travelling through Mysterria',
  advance: 'Steve advancing to the next Sequence',
};

const accessibleLabel = computed(() => props.label || modeLabels[props.mode]);

function makeAnimation(mode: MinecraftPlayerMode): PlayerAnimation {
  if (!skinview) throw new Error('The player renderer is not ready.');

  if (mode === 'walk') {
    const animation = new skinview.WalkingAnimation();
    animation.speed = 1.25;
    return animation;
  }

  if (mode === 'inspect') {
    const animation = new skinview.FunctionAnimation((player, progress) => {
      const breathe = Math.sin(progress * 1.6) * 0.025;
      player.skin.head.rotation.x = 0.34 + breathe;
      player.skin.head.rotation.y = Math.sin(progress * 0.45) * 0.06;
      player.skin.rightArm.rotation.x = -0.82 + breathe;
      player.skin.rightArm.rotation.z = 0.24;
      player.skin.leftArm.rotation.x = -0.82 - breathe;
      player.skin.leftArm.rotation.z = -0.24;
      player.rotation.y = -0.24;
      player.position.y = breathe;
    });
    animation.speed = 0.72;
    return animation;
  }

  if (mode === 'gather') {
    const animation = new skinview.FunctionAnimation((player, progress) => {
      const swing = (Math.sin(progress * 1.8) + 1) / 2;
      const strike = Math.pow(swing, 2.4);
      player.skin.head.rotation.x = 0.16 - strike * 0.12;
      player.skin.rightArm.rotation.x = -0.38 - strike * 1.55;
      player.skin.rightArm.rotation.z = 0.18 + strike * 0.18;
      player.skin.leftArm.rotation.x = 0.2 + strike * 0.35;
      player.skin.leftArm.rotation.z = -0.1;
      player.skin.body.rotation.y = 0.12 - strike * 0.25;
      player.skin.rightLeg.rotation.x = -0.08;
      player.skin.leftLeg.rotation.x = 0.08;
      player.rotation.y = -0.38;
      player.position.y = Math.sin(progress * 3.6) * 0.025;
    });
    animation.speed = 0.88;
    return animation;
  }

  if (mode === 'brew') {
    const animation = new skinview.FunctionAnimation((player, progress) => {
      const stir = Math.sin(progress * 2.1);
      player.skin.head.rotation.x = 0.24;
      player.skin.rightArm.rotation.x = -1.24 + stir * 0.18;
      player.skin.rightArm.rotation.z = 0.28 + stir * 0.08;
      player.skin.leftArm.rotation.x = -0.72 - stir * 0.16;
      player.skin.leftArm.rotation.z = -0.2;
      player.skin.body.rotation.x = 0.08;
      player.rotation.y = -0.46;
    });
    animation.speed = 0.82;
    return animation;
  }

  if (mode === 'drink') {
    const animation = new skinview.FunctionAnimation((player, progress) => {
      const breath = Math.sin(progress * 2.2) * 0.035;
      const sip = Math.sin(progress * 1.35) * 0.055;
      player.skin.rightArm.rotation.x = -2.05 + sip;
      player.skin.rightArm.rotation.z = 0.18;
      player.skin.leftArm.rotation.x = -0.22 - breath;
      player.skin.leftArm.rotation.z = -0.1;
      player.skin.head.rotation.x = -0.16 + breath;
      player.skin.head.rotation.y = -0.08;
      player.rotation.y = -0.15;
      player.position.y = breath * 1.6;
    });
    animation.speed = 0.82;
    return animation;
  }

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

  if (mode === 'cast') {
    const animation = new skinview.FunctionAnimation((player, progress) => {
      const focus = Math.sin(progress * 1.25) * 0.08;
      player.skin.head.rotation.x = -0.05;
      player.skin.head.rotation.y = focus * 0.4;
      player.skin.rightArm.rotation.x = -1.48 + focus;
      player.skin.rightArm.rotation.z = 0.34;
      player.skin.leftArm.rotation.x = -1.34 - focus;
      player.skin.leftArm.rotation.z = -0.34;
      player.skin.body.rotation.y = focus * 0.25;
      player.rotation.y = -0.08;
      player.position.y = (Math.sin(progress * 1.25) + 1) * 0.05;
    });
    animation.speed = 0.7;
    return animation;
  }

  const animation = new skinview.IdleAnimation();
  animation.speed = 0.72;
  return animation;
}

function sizeViewer() {
  if (!viewer || !host.value) return;

  const bounds = host.value.getBoundingClientRect();
  const width = Math.max(1, Math.round(bounds.width));
  const height = Math.max(1, Math.round(bounds.height));
  viewer.setSize(width, height);
  viewer.render();
}

function syncPlayback() {
  if (!viewer || !skinview || viewer.disposed) return;

  const shouldAnimate = props.active && inViewport.value && !reducedMotion.value;
  const scrollDriven = props.mode !== 'idle';
  const animation = makeAnimation(props.mode);
  viewer.animation = animation;
  if (scrollDriven) animation.update(viewer.playerObject, Math.max(0, Math.min(1, props.progress)) * 4.2);
  else if (!shouldAnimate) animation.update(viewer.playerObject, 0);
  animation.paused = scrollDriven || !shouldAnimate;
  viewer.autoRotate = props.mode === 'idle' && shouldAnimate;
  viewer.autoRotateSpeed = 0.12;
  viewer.renderPaused = scrollDriven || !shouldAnimate;

  if (scrollDriven || !shouldAnimate) viewer.render();
}

onMounted(async () => {
  if (!canvas.value || !host.value) return;

  try {
    skinview = await import('skinview3d');
    if (disposed || !canvas.value) return;

    viewer = new skinview.SkinViewer({
      canvas: canvas.value,
      width: 1,
      height: 1,
      enableControls: false,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      renderPaused: true,
      zoom: 0.84,
      fov: 46,
    });
    viewer.background = null;
    viewer.globalLight.intensity = 2.35;
    viewer.cameraLight.intensity = 0.72;

    resizeObserver = new ResizeObserver(sizeViewer);
    resizeObserver.observe(host.value);

    intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        inViewport.value = entry?.isIntersecting ?? false;
        syncPlayback();
      },
      { rootMargin: '120px 0px', threshold: 0.01 },
    );
    intersectionObserver.observe(host.value);

    await viewer.loadSkin(steveSkinUrl, { model: 'default' });
    if (disposed || !viewer) return;

    ready.value = true;
    sizeViewer();
    syncPlayback();
  } catch (error) {
    failed.value = true;
    console.warn('The Minecraft player model could not be initialized.', error);
  }
});

watch(
  () => [props.mode, props.active, props.progress, reducedMotion.value] as const,
  () => syncPlayback(),
);

onUnmounted(() => {
  disposed = true;
  resizeObserver?.disconnect();
  intersectionObserver?.disconnect();
  viewer?.dispose();
  viewer = null;
  skinview = null;
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
  background: radial-gradient(ellipse, rgba(22, 53, 47, 0.34), transparent 72%);
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
  background: radial-gradient(ellipse, rgba(198, 155, 82, 0.38), transparent 72%);
}

.minecraft-player__canvas {
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  filter: brightness(1.12) saturate(1.08) drop-shadow(0 24px 22px rgba(2, 9, 10, 0.3));
  transition: opacity 0.14s ease;
}

.minecraft-player.is-ready .minecraft-player__canvas {
  opacity: 1;
}

.minecraft-player__caption {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
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
