<template>
  <div ref="host" class="scene-particles" aria-hidden="true">
    <canvas ref="canvasEl" class="scene-particles__canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

type ParticleMode = 'sparkles' | 'bubbles' | 'aura' | 'burst';
type Color = readonly [number, number, number];

const GOLD: Color = [223, 185, 104];
const PALE_GOLD: Color = [240, 211, 140];
const GREEN: Color = [131, 188, 162];
const TAU = Math.PI * 2;
const SEED = 0x5eedcafe;

const props = withDefaults(
  defineProps<{
    mode: ParticleMode;
    active: boolean;
    intensity: number;
  }>(),
  {
    mode: 'sparkles',
    active: false,
    intensity: 0.5,
  },
);

const host = ref<HTMLElement | null>(null);
const canvasEl = ref<HTMLCanvasElement | null>(null);

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  color: Color;
  phase: number;
  twinkle: number;
  // bubbles
  baseX: number;
  wobble: number;
  wobbleFreq: number;
  // aura
  angle: number;
  orbitA: number;
  orbitB: number;
  dirSpeed: number;
  tailLen: number;
  lineWidth: number;
  // burst
  life: number;
  maxLife: number;
  drag: number;
}

let ctx: CanvasRenderingContext2D | null = null;
let width = 0;
let height = 0;
let particles: Particle[] = [];
let rafId = 0;
let running = false;
let lastTime = 0;
let burstTriggered = false;
let resizeObserver: ResizeObserver | null = null;
let reducedQuery: MediaQueryList | null = null;
const reducedMotion = ref(false);

/** Clamped 0..1 intensity; guards against NaN/infinity from the parent. */
const intensity = computed(() => {
  const value = props.intensity;
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(1, Math.max(0, value));
});

/** Small deterministic PRNG so the field is reproducible across mounts/resizes. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rgba(color: Color, alpha: number): string {
  const clamped = alpha < 0 ? 0 : alpha > 1 ? 1 : alpha;
  return `rgba(${color[0]},${color[1]},${color[2]},${clamped.toFixed(3)})`;
}

function newParticle(): Particle {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 1,
    baseAlpha: 0.5,
    color: GOLD,
    phase: 0,
    twinkle: 0,
    baseX: 0,
    wobble: 0,
    wobbleFreq: 0,
    angle: 0,
    orbitA: 0,
    orbitB: 0,
    dirSpeed: 0,
    tailLen: 0,
    lineWidth: 1,
    life: 0,
    maxLife: 1,
    drag: 1,
  };
}

function targetCount(): number {
  if (props.mode === 'sparkles') return Math.round(34 * intensity.value);
  if (props.mode === 'bubbles') return Math.round(22 * intensity.value);
  if (props.mode === 'aura') return Math.round(26 * intensity.value);
  return Math.round(60 * intensity.value);
}

function createParticle(rng: () => number): Particle {
  switch (props.mode) {
    case 'sparkles': {
      const p = newParticle();
      p.x = rng() * width;
      p.y = rng() * height;
      p.vx = (rng() - 0.5) * 14;
      p.vy = -(2 + rng() * 9);
      p.radius = 1 + rng() * 1.7;
      p.baseAlpha = 0.3 + rng() * 0.55;
      p.color = rng() < 0.6 ? GOLD : PALE_GOLD;
      p.phase = rng() * TAU;
      p.twinkle = 0.6 + rng() * 1.6;
      return p;
    }
    case 'bubbles': {
      const p = newParticle();
      const centerX = width * (0.5 + (rng() - 0.5) * 0.16);
      p.x = centerX;
      p.baseX = centerX;
      p.y = height * (0.55 + rng() * 0.6);
      p.vy = -(14 + rng() * 22);
      p.radius = 2 + rng() * 3.4;
      p.baseAlpha = 0.4 + rng() * 0.4;
      p.color = rng() < 0.62 ? GREEN : rng() < 0.5 ? GOLD : PALE_GOLD;
      p.phase = rng() * TAU;
      p.wobble = 6 + rng() * 12;
      p.wobbleFreq = 0.8 + rng() * 1.4;
      return p;
    }
    case 'aura': {
      const p = newParticle();
      p.orbitA = Math.min(width, height) * (0.16 + rng() * 0.1);
      p.orbitB = p.orbitA * (0.5 + rng() * 0.2);
      p.angle = rng() * TAU;
      p.dirSpeed = (rng() < 0.5 ? -1 : 1) * (0.22 + rng() * 0.4);
      p.baseAlpha = 0.35 + rng() * 0.5;
      p.color = rng() < 0.55 ? GOLD : PALE_GOLD;
      p.phase = rng() * TAU;
      p.twinkle = 0.5 + rng() * 1.2;
      p.tailLen = 14 + rng() * 20;
      p.lineWidth = 1.4 + rng() * 1.2;
      return p;
    }
    case 'burst':
    default:
      return createBurstParticle(rng);
  }
}

function createBurstParticle(rng: () => number): Particle {
  const angle = rng() * TAU;
  const speed = 30 + rng() * 150;
  const maxLife = 0.7 + rng() * 0.8;
  const p = newParticle();
  p.x = width / 2 + Math.cos(angle) * speed * 0.1;
  p.y = height / 2 + Math.sin(angle) * speed * 0.1;
  p.vx = Math.cos(angle) * speed;
  p.vy = Math.sin(angle) * speed;
  p.radius = 1.2 + rng() * 2.2;
  p.baseAlpha = 0.75 + rng() * 0.25;
  p.color = rng() < 0.55 ? GOLD : rng() < 0.85 ? PALE_GOLD : GREEN;
  p.maxLife = maxLife;
  p.life = maxLife;
  p.drag = 0.93;
  return p;
}

function seedField(): void {
  if (props.mode === 'burst') {
    particles = [];
    return;
  }
  if (!width || !height) return;
  const rng = mulberry32(SEED);
  const count = targetCount();
  particles = [];
  for (let i = 0; i < count; i++) particles.push(createParticle(rng));
}

function adjustCount(): void {
  if (props.mode === 'burst' || !width || !height) return;
  const target = targetCount();
  if (particles.length === target) return;
  if (particles.length > target) {
    particles.length = target;
    return;
  }
  const rng = mulberry32(SEED + particles.length);
  while (particles.length < target) particles.push(createParticle(rng));
}

function drawGlow(x: number, y: number, radius: number, color: Color, alpha: number): void {
  if (!ctx || alpha <= 0.003 || radius <= 0) return;
  // soft halo pass
  ctx.fillStyle = rgba(color, alpha * 0.22);
  ctx.beginPath();
  ctx.arc(x, y, radius * 2.4, 0, TAU);
  ctx.fill();
  // bright core pass
  ctx.fillStyle = rgba(color, alpha);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
}

function renderSparkles(t: number, dt: number, alphaMul: number, speedMul: number): void {
  if (!ctx) return;
  for (const p of particles) {
    p.x += p.vx * speedMul * dt;
    p.y += p.vy * speedMul * dt;
    if (p.x < -10) p.x = width + 10;
    else if (p.x > width + 10) p.x = -10;
    if (p.y < -10) p.y = height + 10;
    else if (p.y > height + 10) p.y = -10;
    const twinkle = 0.5 + 0.5 * Math.sin(p.phase + t * p.twinkle);
    drawGlow(p.x, p.y, p.radius, p.color, p.baseAlpha * (0.25 + 0.75 * twinkle) * alphaMul);
  }
}

function renderBubbles(t: number, dt: number, alphaMul: number, speedMul: number): void {
  if (!ctx) return;
  const c = ctx;
  for (const p of particles) {
    p.y += p.vy * speedMul * dt;
    p.x = p.baseX + Math.sin(p.phase + t * p.wobbleFreq) * p.wobble;
    if (p.y < -p.radius * 2) {
      p.y = height + p.radius * 2;
      p.baseX = width * (0.5 + (Math.random() - 0.5) * 0.16);
      p.x = p.baseX;
    }
    const alpha = p.baseAlpha * alphaMul;
    // halo
    c.fillStyle = rgba(p.color, alpha * 0.16);
    c.beginPath();
    c.arc(p.x, p.y, p.radius * 2.2, 0, TAU);
    c.fill();
    // body
    c.fillStyle = rgba(p.color, alpha * 0.85);
    c.beginPath();
    c.arc(p.x, p.y, p.radius, 0, TAU);
    c.fill();
    // specular dot
    c.fillStyle = `rgba(255,255,255,${(0.35 * alphaMul).toFixed(3)})`;
    c.beginPath();
    c.arc(p.x - p.radius * 0.35, p.y - p.radius * 0.35, p.radius * 0.28, 0, TAU);
    c.fill();
  }
}

function renderAura(t: number, dt: number, alphaMul: number, speedMul: number): void {
  if (!ctx) return;
  const c = ctx;
  const cx = width / 2;
  const cy = height / 2;
  for (const p of particles) {
    const angle = p.angle + t * p.dirSpeed * speedMul;
    const ripple = 1 + 0.06 * Math.sin(p.phase + t * 1.3);
    const x = cx + Math.cos(angle) * p.orbitA * ripple;
    const y = cy + Math.sin(angle) * p.orbitB * ripple;
    const tx = -Math.sin(angle) * p.orbitA;
    const ty = Math.cos(angle) * p.orbitB;
    const magnitude = Math.max(0.0001, Math.hypot(tx, ty));
    const ux = tx / magnitude;
    const uy = ty / magnitude;
    const fromX = x - ux * p.tailLen;
    const fromY = y - uy * p.tailLen;
    const twinkle = 0.5 + 0.5 * Math.sin(p.phase * 2 + t * 1.1);
    const alpha = p.baseAlpha * twinkle * alphaMul;
    // soft halo streak
    c.strokeStyle = rgba(p.color, alpha * 0.14);
    c.lineWidth = p.lineWidth * 3;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(fromX, fromY);
    c.lineTo(x, y);
    c.stroke();
    // bright core streak
    c.strokeStyle = rgba(p.color, alpha);
    c.lineWidth = p.lineWidth;
    c.beginPath();
    c.moveTo(fromX, fromY);
    c.lineTo(x, y);
    c.stroke();
    // head dot
    c.fillStyle = rgba(p.color, alpha);
    c.beginPath();
    c.arc(x, y, p.lineWidth * 0.9, 0, TAU);
    c.fill();
  }
}

function renderBurst(t: number, dt: number, alphaMul: number): void {
  if (!ctx) return;
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    const decay = Math.pow(p.drag, dt * 60);
    p.vx *= decay;
    p.vy *= decay;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const lifeRatio = Math.min(1, Math.max(0, p.life / p.maxLife));
    drawGlow(p.x, p.y, p.radius, p.color, p.baseAlpha * lifeRatio * alphaMul);
  }
}

function render(t: number, dt: number): void {
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  const alphaMul = 0.3 + 0.7 * intensity.value;
  const speedMul = 0.5 + 0.5 * intensity.value;
  switch (props.mode) {
    case 'sparkles':
      renderSparkles(t, dt, alphaMul, speedMul);
      break;
    case 'bubbles':
      renderBubbles(t, dt, alphaMul, speedMul);
      break;
    case 'aura':
      renderAura(t, dt, alphaMul, speedMul);
      break;
    case 'burst':
      renderBurst(t, dt, alphaMul);
      break;
  }
}

function start(): void {
  if (running) return;
  if (!ctx || !width || !height) return;
  if (!props.active || document.visibilityState !== 'visible' || reducedMotion.value) return;
  running = true;
  lastTime = performance.now();
  rafId = requestAnimationFrame(tick);
}

function stop(): void {
  running = false;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
  if (ctx) ctx.clearRect(0, 0, width, height);
}

function tick(now: number): void {
  if (!running) {
    rafId = 0;
    return;
  }
  if (!props.active || document.visibilityState !== 'visible' || reducedMotion.value) {
    stop();
    return;
  }
  const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
  lastTime = now;
  render(now, dt);
  rafId = requestAnimationFrame(tick);
}

function sync(): void {
  if (!ctx || !width || !height) return;
  if (props.active && document.visibilityState === 'visible' && !reducedMotion.value) {
    if (props.mode !== 'burst' && particles.length === 0) seedField();
    start();
  } else {
    stop();
  }
}

function triggerBurst(): void {
  if (burstTriggered || intensity.value < 0.9999) return;
  if (!ctx || !width || !height) return;
  burstTriggered = true;
  const count = Math.round(60 * intensity.value);
  const rng = Math.random;
  particles = [];
  for (let i = 0; i < count; i++) particles.push(createBurstParticle(rng));
}

function maybeTriggerBurst(): void {
  if (props.mode === 'burst' && props.active) triggerBurst();
}

function renderStaticFrame(): void {
  if (!props.active || !ctx || !width || !height) return;
  if (props.mode === 'burst') {
    if (!burstTriggered) triggerBurst();
  } else {
    seedField();
  }
  render(0, 0);
}

function resize(): void {
  const canvas = canvasEl.value;
  const rect = host.value?.getBoundingClientRect();
  if (!canvas || !rect) return;
  const nextWidth = Math.round(rect.width);
  const nextHeight = Math.round(rect.height);
  if (nextWidth < 1 || nextHeight < 1) return;
  width = nextWidth;
  height = nextHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (props.mode !== 'burst') seedField();
}

function onVisibilityChange(): void {
  if (document.visibilityState === 'visible') sync();
  else stop();
}

function onReducedMotionChange(event: MediaQueryListEvent): void {
  reducedMotion.value = event.matches;
  if (reducedMotion.value) {
    stop();
    renderStaticFrame();
  } else {
    sync();
  }
}

watch(
  () => props.mode,
  () => {
    if (props.mode === 'burst') {
      burstTriggered = false;
      maybeTriggerBurst();
    } else if (!reducedMotion.value) {
      seedField();
    }
    if (reducedMotion.value) renderStaticFrame();
    else sync();
  },
);

watch(
  () => props.active,
  (active) => {
    if (!active) {
      burstTriggered = false;
      stop();
      return;
    }
    if (props.mode === 'burst') {
      burstTriggered = false;
      maybeTriggerBurst();
    }
    if (reducedMotion.value) renderStaticFrame();
    else sync();
  },
);

watch(intensity, (value) => {
  if (props.mode === 'burst') {
    if (value >= 0.9999 && props.active) maybeTriggerBurst();
    return;
  }
  adjustCount();
  if (reducedMotion.value) renderStaticFrame();
  else sync();
});

onMounted(() => {
  const canvas = canvasEl.value;
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  if (!ctx) return;
  reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  reducedMotion.value = reducedQuery.matches;
  reducedQuery.addEventListener('change', onReducedMotionChange);
  resizeObserver = new ResizeObserver(resize);
  if (host.value) resizeObserver.observe(host.value);
  document.addEventListener('visibilitychange', onVisibilityChange);
  resize();
  if (props.mode === 'burst') maybeTriggerBurst();
  if (reducedMotion.value) renderStaticFrame();
  else sync();
});

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange);
  reducedQuery?.removeEventListener('change', onReducedMotionChange);
  resizeObserver?.disconnect();
  resizeObserver = null;
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  ctx = null;
});
</script>

<style scoped>
.scene-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.scene-particles__canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
