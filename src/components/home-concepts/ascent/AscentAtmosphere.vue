<template>
  <canvas ref="canvasRef" class="a-atmo" aria-hidden="true"></canvas>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, ref} from 'vue';
import {prefersReducedMotion} from './useAscentScroll';

/*
 * The air changes as you climb: ash sinking through ground fog, then spirit
 * motes rising, red embers under the Crimson Moon, pale motes in the haze
 * above, and nothing at all in the white of the summit.
 */
const props = defineProps<{ state: { alt: number } }>();

type Key = { alt: number; rgb: [number, number, number]; vy: number; alpha: number };
const KEYS: Key[] = [
  {alt: -1, rgb: [168, 174, 184], vy: 0.32, alpha: 0.5},
  {alt: -0.3, rgb: [168, 174, 184], vy: 0.2, alpha: 0.45},
  {alt: 0.4, rgb: [120, 232, 255], vy: -0.32, alpha: 0.6},
  {alt: 3.4, rgb: [120, 232, 255], vy: -0.4, alpha: 0.55},
  {alt: 4.1, rgb: [255, 96, 86], vy: -0.7, alpha: 0.7},
  {alt: 4.9, rgb: [255, 96, 86], vy: -0.6, alpha: 0.6},
  {alt: 5.6, rgb: [226, 234, 244], vy: -0.45, alpha: 0.5},
  {alt: 7.6, rgb: [236, 242, 250], vy: -0.6, alpha: 0.4},
  {alt: 8.2, rgb: [255, 255, 255], vy: -0.8, alpha: 0},
];

function sample(alt: number) {
  if (alt <= KEYS[0].alt) return KEYS[0];
  for (let i = 0; i < KEYS.length - 1; i++) {
    const a = KEYS[i];
    const b = KEYS[i + 1];
    if (alt <= b.alt) {
      const u = (alt - a.alt) / (b.alt - a.alt);
      return {
        alt,
        rgb: [0, 1, 2].map(c => Math.round(a.rgb[c] + (b.rgb[c] - a.rgb[c]) * u)) as [number, number, number],
        vy: a.vy + (b.vy - a.vy) * u,
        alpha: a.alpha + (b.alpha - a.alpha) * u,
      };
    }
  }
  return KEYS[KEYS.length - 1];
}

const canvasRef = ref<HTMLCanvasElement | null>(null);
let raf = 0;
let running = false;
let cleanup: (() => void) | null = null;

type Mote = { x: number; y: number; s: number; v: number; ph: number; tw: number };

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas || prefersReducedMotion()) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let motes: Mote[] = [];

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const count = width < 700 ? 34 : 72;
    motes = Array.from({length: count}, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      s: 1.5 + Math.random() * 2.5,
      v: 0.5 + Math.random(),
      ph: Math.random() * Math.PI * 2,
      tw: 0.4 + Math.random() * 0.6,
    }));
  };

  let last = performance.now();
  const draw = (now: number) => {
    raf = 0;
    if (!running) return;
    const dt = Math.min(48, now - last) / 16.67;
    last = now;
    const air = sample(props.state.alt);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (air.alpha > 0.01) {
      const [r, g, b] = air.rgb;
      for (const mote of motes) {
        mote.ph += 0.012 * dt;
        mote.y += air.vy * mote.v * dt;
        mote.x += Math.sin(mote.ph) * 0.25 * dt;
        if (mote.y > height + 6) mote.y = -6;
        if (mote.y < -6) mote.y = height + 6;
        if (mote.x > width + 6) mote.x = -6;
        if (mote.x < -6) mote.x = width + 6;
        const alpha = air.alpha * mote.tw * (0.65 + 0.35 * Math.sin(mote.ph * 2));
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
        ctx.fillRect(Math.round(mote.x), Math.round(mote.y), mote.s, mote.s);
      }
    }
    raf = requestAnimationFrame(draw);
  };

  const start = () => {
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(draw);
  };
  const stop = () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };
  const onVisibility = () => (document.hidden ? stop() : start());

  resize();
  start();
  window.addEventListener('resize', resize, {passive: true});
  document.addEventListener('visibilitychange', onVisibility);

  cleanup = () => {
    stop();
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVisibility);
  };
});

onUnmounted(() => cleanup?.());
</script>

<style scoped>
.a-atmo {
  position: fixed;
  inset: 0;
  z-index: 30;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .a-atmo {
    display: none;
  }
}
</style>
