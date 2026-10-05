<template>
  <div ref="host" class="scene-particles" aria-hidden="true">
    <canvas ref="canvasEl" class="scene-particles__canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

// 'brew', 'steam' and 'spirit' draw square texels, like Minecraft's own particles.
type ParticleMode = 'sparkles' | 'bubbles' | 'burst' | 'brew' | 'steam' | 'spirit';
/**
 * 'spirit' is posed by the story, not by a clock: how much of the spirit world is in
 * the room (fog, wandering spirit lights), how much spirituality is streaming into him,
 * and how far the flash's ring has run (0..1). Only the slow drift runs on time.
 */
export type SpiritPhase = { fog: number; gather: number; shock: number };
/** Where he stands on this canvas (px): his chest, the floor under him, his reach. */
export type SpiritAnchor = { x: number; y: number; floor: number; reach: number };
type Color = readonly [number, number, number];

// The drawn Pathway's accent (mutated in place when the card changes, so live
// particles pick it up), near-white ink and the spirit-vision blue.
const CRIMSON: [number, number, number] = [167, 139, 250];
const BONE: Color = [239, 238, 243];
const SPIRIT: Color = [169, 198, 214];
const TAU = Math.PI * 2;
const SEED = 0x5eedcafe;

const props = withDefaults(
  defineProps<{
    mode: ParticleMode;
    active: boolean;
    intensity: number;
    /** Colour of 'brew' bubbles (r, g, b); follows the liquid. */
    tint?: readonly [number, number, number];
    /** The Pathway accent, as #rrggbb. */
    accent?: string;
    /** 'spirit' only. */
    phase?: SpiritPhase;
    anchor?: SpiritAnchor;
  }>(),
  {
    mode: 'sparkles',
    active: false,
    intensity: 0.5,
    tint: undefined,
    accent: '#a78bfa',
    phase: undefined,
    anchor: undefined,
  },
);

function applyAccent(hex: string): void {
  const value = Number.parseInt(hex.replace('#', '').slice(0, 6), 16);
  if (!Number.isFinite(value)) return;
  CRIMSON[0] = (value >> 16) & 255;
  CRIMSON[1] = (value >> 8) & 255;
  CRIMSON[2] = value & 255;
}
applyAccent(props.accent);
watch(() => props.accent, applyAccent);

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
  // spirit
  angle: number;
  dirSpeed: number;
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
let viewObserver: IntersectionObserver | null = null;
/** False while the canvas is scrolled out of view: the loop holds (and keeps its particles). */
let onScreen = true;
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

// Seeded too, so respawned bubbles keep the field reproducible.
const respawnRng = mulberry32(SEED ^ 0x2545f491);

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
    color: BONE,
    phase: 0,
    twinkle: 0,
    baseX: 0,
    wobble: 0,
    wobbleFreq: 0,
    angle: 0,
    dirSpeed: 0,
    life: 0,
    maxLife: 1,
    drag: 1,
  };
}

function targetCount(): number {
  if (props.mode === 'sparkles') return Math.round(34 * intensity.value);
  if (props.mode === 'bubbles') return Math.round(22 * intensity.value);
  if (props.mode === 'brew') return Math.round(34 * intensity.value);
  if (props.mode === 'steam') return Math.round(34 * intensity.value);
  if (props.mode === 'spirit') return SPIRIT_FOG + SPIRIT_MOTES + SPIRIT_GATHER;
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
      p.baseAlpha = 0.22 + rng() * 0.4;
      p.color = rng() < 0.6 ? CRIMSON : BONE;
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
      p.baseAlpha = 0.3 + rng() * 0.3;
      p.color = rng() < 0.62 ? SPIRIT : rng() < 0.5 ? BONE : CRIMSON;
      p.phase = rng() * TAU;
      p.wobble = 6 + rng() * 12;
      p.wobbleFreq = 0.8 + rng() * 1.4;
      return p;
    }
    case 'brew': {
      // Pops on the liquid surface: the lower fifth of the box.
      const p = newParticle();
      p.baseX = width * (0.5 + (rng() - 0.5) * 0.62);
      p.x = p.baseX;
      p.y = height * (0.8 + rng() * 0.16);
      p.vy = -(10 + rng() * 26);
      p.radius = 3 + Math.floor(rng() * 3) * 2;
      p.baseAlpha = 0.5 + rng() * 0.4;
      p.maxLife = 0.5 + rng() * 0.9;
      p.life = rng() * p.maxLife;
      p.phase = rng();
      return p;
    }
    case 'steam': {
      const p = newParticle();
      p.baseX = width * (0.5 + (rng() - 0.5) * 0.4);
      p.x = p.baseX;
      // seeded through the whole column so a fresh field is not empty on top
      p.y = height * (0.15 + rng() * 0.85);
      p.vy = -(16 + rng() * 22);
      p.vx = (rng() - 0.5) * 10;
      p.radius = 6 + rng() * 8;
      p.baseAlpha = 0.14 + rng() * 0.16;
      p.color = rng() < 0.75 ? BONE : SPIRIT;
      p.phase = rng() * TAU;
      p.wobble = 8 + rng() * 14;
      p.wobbleFreq = 0.3 + rng() * 0.5;
      return p;
    }
    case 'spirit':
      return createSpiritParticle(rng);
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
  p.baseAlpha = 0.6 + rng() * 0.3;
  p.color = rng() < 0.55 ? CRIMSON : rng() < 0.85 ? BONE : SPIRIT;
  p.maxLife = maxLife;
  p.life = maxLife;
  p.drag = 0.93;
  return p;
}

/* ---------------- spirit ---------------- */
const SPIRIT_FOG = 34;
const SPIRIT_MOTES = 26;
const SPIRIT_GATHER = 46;
const FOG: Color = [176, 180, 194];
const WHITE: Color = [255, 255, 255];
/*
 * One seeded field, three kinds (by index): blocky banks of gray fog, pale spirit lights
 * wandering in it, and the motes of spirituality that spiral into him. Everything is kept
 * in unit terms (0..1 or radians) and placed from the anchor every frame, so a resize or
 * a different stage never reseeds it.
 */
function createSpiritParticle(rng: () => number): Particle {
  const p = newParticle();
  p.x = rng();
  p.y = rng();
  p.phase = rng() * TAU;
  p.twinkle = 0.4 + rng() * 0.9;
  p.angle = rng() * TAU;
  p.dirSpeed = rng() < 0.5 ? -1 : 1;
  p.wobble = rng();
  p.wobbleFreq = 0.12 + rng() * 0.3;
  p.radius = rng();
  p.baseAlpha = rng();
  return p;
}

function mixColor(a: Color, b: Color, t: number): Color {
  return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
}

function renderSpirit(t: number): void {
  const c = ctx;
  const anchor = props.anchor;
  const phase = props.phase;
  if (!c || !anchor || !phase) return;
  const fog = Math.min(1, Math.max(0, phase.fog));
  const gather = Math.min(1, Math.max(0, phase.gather));
  const shock = Math.min(1, Math.max(0, phase.shock));
  const s = t / 1000;
  // half a texel of his skin (his head is 8 texels across): small, still square
  const px = Math.max(3, Math.round(anchor.reach / 40));
  const snap = (v: number) => Math.round(v / px) * px;
  const blow = 1 - (1 - shock) ** 3;

  // gray fog: stepped banks (Minecraft's cloud blocks) welling up off the floor and closing in on him
  if (fog > 0.002 || shock > 0) {
    const amount = Math.max(fog, shock > 0 ? 0.7 * (1 - shock) : 0);
    for (let i = 0; i < SPIRIT_FOG; i++) {
      const p = particles[i];
      if (!p) break;
      const side = p.x < 0.5 ? -1 : 1;
      const home = (p.x - 0.5) * width * 1.2;
      const closeIn = 1 - 0.38 * fog;
      const drift = Math.sin(p.phase + s * p.wobbleFreq) * px * 8;
      const x = anchor.x + home * closeIn + drift + side * blow * width * 0.5;
      const rise = (0.1 + 0.9 * p.y) * anchor.floor * 0.5 * fog;
      const y = anchor.floor + px * 6 - rise * (0.3 + 0.7 * p.wobble) - blow * px * 6;
      const w = px * (14 + Math.round(p.radius * 22));
      const h = px * (3 + Math.round(p.baseAlpha * 2));
      c.fillStyle = rgba(FOG, (0.028 + 0.04 * p.baseAlpha) * amount);
      // a wide foot, a narrower step on it, a crown: a bank, not a bar
      c.fillRect(snap(x - w / 2), snap(y), w, h);
      c.fillRect(snap(x - w * 0.34 + p.twinkle * px * 2), snap(y - h), snap(w * 0.62), h);
      c.fillRect(snap(x - w * 0.12 - p.twinkle * px * 2), snap(y - h * 2), snap(w * 0.28), h);
    }
  }

  c.globalCompositeOperation = 'lighter';
  // spirit lights: pale, slow, wandering in the fog
  if (fog > 0.002) {
    for (let i = SPIRIT_FOG; i < SPIRIT_FOG + SPIRIT_MOTES; i++) {
      const p = particles[i];
      if (!p) break;
      const x = anchor.x + (p.x - 0.5) * width * 0.9 + Math.sin(p.phase + s * p.wobbleFreq * 2) * px * 8;
      const y = anchor.floor * (0.12 + 0.8 * p.y) + Math.cos(p.angle + s * p.wobbleFreq * 1.6) * px * 5;
      const twinkle = 0.5 + 0.5 * Math.sin(p.phase + s * p.twinkle * 2.4);
      const size = p.radius < 0.7 ? px : px * 2;
      c.fillStyle = rgba(SPIRIT, fog * (0.12 + 0.3 * twinkle));
      c.fillRect(snap(x), snap(y), size, size);
    }
  }

  // spirituality in the Pathway's colour, spiralling into his chest
  if (gather > 0.002) {
    for (let i = SPIRIT_FOG + SPIRIT_MOTES; i < SPIRIT_FOG + SPIRIT_MOTES + SPIRIT_GATHER; i++) {
      const p = particles[i];
      if (!p) break;
      const u = (s * (0.16 + 0.22 * p.wobbleFreq) + p.y) % 1;
      const r = anchor.reach * (0.55 + 0.75 * p.radius) * (1 - u) ** 1.6;
      const a = p.angle + p.dirSpeed * u * 2.4;
      const x = anchor.x + Math.cos(a) * r;
      const y = anchor.y + Math.sin(a) * r * 0.8;
      const fade = Math.min(1, u * 6) * Math.min(1, (1 - u) * 12);
      const size = px * (u > 0.7 ? 1 : 2);
      const alpha = gather * fade * (0.35 + 0.5 * p.baseAlpha);
      // a texel of tail where it came from
      const ta = a - p.dirSpeed * 0.16;
      const tr = r * 1.12;
      c.fillStyle = rgba(CRIMSON, alpha * 0.4);
      c.fillRect(snap(anchor.x + Math.cos(ta) * tr), snap(anchor.y + Math.sin(ta) * tr * 0.8), px, px);
      c.fillStyle = rgba(p.baseAlpha > 0.8 ? mixColor(CRIMSON, WHITE, 0.6) : CRIMSON, alpha);
      c.fillRect(snap(x - size / 2), snap(y - size / 2), size, size);
    }
  }

  // the flash: a ring of texels running out over the floor, a second round his chest, shards between
  if (shock > 0) {
    const fade = (1 - shock) ** 1.3;
    const hot = mixColor(CRIMSON, WHITE, 0.55 * fade);
    const floorR = anchor.reach * 0.45 + blow * (width * 0.62 - anchor.reach * 0.45);
    const n = 72;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU;
      const size = px * (shock < 0.4 ? 2 : 1);
      c.fillStyle = rgba(k % 3 ? CRIMSON : hot, fade * 0.85);
      c.fillRect(snap(anchor.x + Math.cos(a) * floorR - size / 2), snap(anchor.floor + Math.sin(a) * floorR * 0.26 - size / 2), size, size);
    }
    const chestR = anchor.reach * (0.3 + 2.1 * blow);
    const m = 56;
    for (let k = 0; k < m; k++) {
      const a = (k / m) * TAU + 0.05;
      const size = px * (shock < 0.3 ? 2 : 1);
      c.fillStyle = rgba(k % 2 ? hot : CRIMSON, fade * fade * 0.8);
      c.fillRect(snap(anchor.x + Math.cos(a) * chestR - size / 2), snap(anchor.y + Math.sin(a) * chestR - size / 2), size, size);
    }
    for (let k = 0; k < 18; k++) {
      const a = (k / 18) * TAU + (k % 2 ? 0.09 : -0.07);
      for (let j = 0; j < 3; j++) {
        const r = anchor.reach * (0.4 + blow * (1.4 + j * 0.55 + (k % 3) * 0.3));
        c.fillStyle = rgba(j ? CRIMSON : hot, fade * (0.75 - j * 0.2));
        c.fillRect(snap(anchor.x + Math.cos(a) * r), snap(anchor.y + Math.sin(a) * r * 0.9), px, px);
      }
    }
  }
  c.globalCompositeOperation = 'source-over';
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
      p.baseX = width * (0.5 + (respawnRng() - 0.5) * 0.16);
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

/* Square bubbles that rise a short way off the brew and pop. */
function renderBrew(dt: number, alphaMul: number, speedMul: number): void {
  if (!ctx) return;
  const tint = props.tint ?? SPIRIT;
  for (const p of particles) {
    p.life += dt * speedMul;
    if (p.life >= p.maxLife) {
      p.life = 0;
      p.baseX = width * (0.5 + (respawnRng() - 0.5) * 0.62);
      p.y = height * (0.8 + respawnRng() * 0.16);
    }
    const age = p.life / p.maxLife;
    const y = p.y + p.vy * p.life;
    const size = Math.round(p.radius * (0.6 + age * 0.7));
    // light texels near the surface, then the bubble thins out and pops
    const alpha = p.baseAlpha * alphaMul * (age < 0.8 ? 1 : (1 - age) / 0.2);
    const lift = p.phase < 0.35 ? BONE : tint;
    ctx.fillStyle = rgba(lift, alpha);
    ctx.fillRect(Math.round(p.baseX - size / 2), Math.round(y - size / 2), size, size);
  }
}

/* Large faint square puffs that grow and fade as they climb. */
function renderSteam(t: number, dt: number, alphaMul: number, speedMul: number): void {
  if (!ctx) return;
  for (const p of particles) {
    p.y += p.vy * speedMul * dt;
    p.baseX += p.vx * dt;
    if (p.y < -p.radius * 3) {
      p.y = height * (0.78 + respawnRng() * 0.22);
      p.baseX = width * (0.5 + (respawnRng() - 0.5) * 0.4);
    }
    const climb = 1 - Math.max(0, Math.min(1, p.y / height));
    const x = p.baseX + Math.sin(p.phase + t * 0.001 * p.wobbleFreq * 6) * p.wobble * climb;
    const size = Math.round(p.radius * (1 + climb * 1.8));
    // fade in off the surface, out before the top of the box
    const alpha = p.baseAlpha * alphaMul * Math.min(1, climb * 4) * (1 - climb) ** 1.4;
    ctx.fillStyle = rgba(p.color, alpha);
    ctx.fillRect(Math.round(x - size / 2), Math.round(p.y - size / 2), size, size);
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
    case 'burst':
      renderBurst(t, dt, alphaMul);
      break;
    case 'brew':
      renderBrew(dt, alphaMul, speedMul);
      break;
    case 'steam':
      renderSteam(t, dt, alphaMul, speedMul);
      break;
    case 'spirit':
      renderSpirit(t);
      break;
  }
}

function start(): void {
  if (running) return;
  if (!ctx || !width || !height) return;
  if (!props.active || !onScreen || document.visibilityState !== 'visible' || reducedMotion.value) return;
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
  if (!onScreen) {
    running = false;
    rafId = 0;
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
  viewObserver = new IntersectionObserver(([entry]) => {
    onScreen = entry?.isIntersecting ?? true;
    if (onScreen && !reducedMotion.value) sync();
  }, { rootMargin: '100px 0px' });
  if (host.value) viewObserver.observe(host.value);
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
  viewObserver?.disconnect();
  viewObserver = null;
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
