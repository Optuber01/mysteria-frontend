<template>
  <!-- One weather field over a scene: square texels and streaks, like the potion story's particles. -->
  <canvas ref="canvasRef" class="weather" aria-hidden="true"/>
</template>

<script setup lang="ts">
/*
 * One weather field over a scene. Drawn in a worker on an OffscreenCanvas where the
 * browser has one (sceneWeather.worker.ts), so the particles cost the page's main thread
 * nothing; elsewhere drawn here with the same painter (weatherPainter.ts). Either way it
 * runs only while it is on screen, the tab is visible and `active` is set.
 */
import {onMounted, onUnmounted, ref, watch} from 'vue';
import type {WeatherKind} from './pathwayScenes';
import {createWeather, weatherCanvasSize, WEATHER_FPS, type WeatherConfig} from './weatherPainter';

const props = withDefaults(defineProps<{
  kind: WeatherKind | null;
  /** The texels' colour (rain, embers, petals...). */
  color?: string;
  /** 0..1: how much of it. */
  density?: number;
  /** Lightning strikes now and then (the scene flashes with them, see `strike`). */
  lightning?: boolean;
  /** Run only while the scene can be seen. */
  active?: boolean;
}>(), {color: '#ffffff', density: 1, lightning: false, active: true});
const emit = defineEmits<{(e: 'strike'): void}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const config = (): WeatherConfig => ({kind: props.kind, color: props.color, density: props.density, lightning: props.lightning});
const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- the two engines: a worker, or the same painter on this thread ---- */
let worker: Worker | null = null;
let local: ReturnType<typeof createWeather> | null = null;
let frame = 0;
let last = 0;
let onScreen = true;
let w = 0;
let h = 0;

const shouldRun = () => props.active && onScreen && !!props.kind && document.visibilityState === 'visible' && !still();

function tick(now: number) {
  frame = 0;
  if (!local || !shouldRun()) return;
  if (last && now - last < 1000 / WEATHER_FPS - 2) {
    frame = requestAnimationFrame(tick);
    return;
  }
  const dt = Math.min(0.08, last ? (now - last) / 1000 : 0.033);
  last = now;
  local.frame(dt);
  frame = requestAnimationFrame(tick);
}

function sync() {
  if (worker) {
    if (still()) worker.postMessage({type: 'still'});
    else worker.postMessage({type: 'run', on: shouldRun()});
    return;
  }
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  last = 0;
  if (!local) return;
  if (still()) local.frame(0);
  else if (shouldRun()) frame = requestAnimationFrame(tick);
}

/* the canvas's size, from its ResizeObserver entry: never read back from layout mid-render */
function measure(box: DOMRectReadOnly): boolean {
  const nw = Math.max(1, Math.round(box.width));
  const nh = Math.max(1, Math.round(box.height));
  const changed = nw !== w || nh !== h;
  w = nw;
  h = nh;
  return changed;
}

let started = false;
function start() {
  const el = canvasRef.value;
  if (!el) return;
  started = true;
  // one canvas pixel per texel, scaled up pixelated (weatherPainter: WEATHER_SCALE)
  if ('transferControlToOffscreen' in el && typeof Worker !== 'undefined') {
    try {
      const offscreen = el.transferControlToOffscreen();
      worker = new Worker(new URL('./sceneWeather.worker.ts', import.meta.url), {type: 'module'});
      worker.onmessage = (event: MessageEvent<{type: string}>) => event.data.type === 'strike' && emit('strike');
      worker.postMessage({type: 'init', canvas: offscreen, width: w, height: h}, [offscreen]);
      worker.postMessage({type: 'config', config: config()});
      sync();
      return;
    } catch {
      worker = null;
    }
  }
  [el.width, el.height] = weatherCanvasSize(w, h);
  const ctx = el.getContext('2d');
  if (!ctx) return;
  local = createWeather(() => emit('strike'));
  local.setContext(ctx, w, h);
  local.configure(config());
  sync();
}

watch(() => [props.kind, props.density, props.color, props.lightning], () => {
  if (worker) worker.postMessage({type: 'config', config: config()});
  else local?.configure(config());
  sync();
});
watch(() => props.active, sync);

let observer: ResizeObserver | null = null;
let viewObserver: IntersectionObserver | null = null;
const onVisible = () => sync();
onMounted(() => {
  // the observer's first report (after the next layout) gives the size and starts the weather
  observer = new ResizeObserver(([entry]) => {
    const changed = measure(entry.contentRect);
    if (!started) {
      start();
      return;
    }
    if (!changed) return;
    if (worker) worker.postMessage({type: 'size', width: w, height: h});
    else if (local && canvasRef.value) {
      [canvasRef.value.width, canvasRef.value.height] = weatherCanvasSize(w, h);
      const ctx = canvasRef.value.getContext('2d');
      if (ctx) local.setContext(ctx, w, h);
    }
    sync();
  });
  if (canvasRef.value) observer.observe(canvasRef.value);
  viewObserver = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    sync();
  });
  if (canvasRef.value) viewObserver.observe(canvasRef.value);
  document.addEventListener('visibilitychange', onVisible);
});
onUnmounted(() => {
  if (frame) cancelAnimationFrame(frame);
  worker?.terminate();
  worker = null;
  observer?.disconnect();
  viewObserver?.disconnect();
  document.removeEventListener('visibilitychange', onVisible);
});
</script>

<style scoped>
.weather {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  image-rendering: pixelated;
}
</style>
