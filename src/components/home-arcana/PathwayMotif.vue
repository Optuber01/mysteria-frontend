<template>
  <!--
    The drawn Pathway in the page's corners (a mock-up, behind ?motifs=1): fire for the Red
    Priest, vines for the Mother, rain and lightning for the Tyrant, night for Darkness,
    fog for the Fool, light for the Sun. Decorative: no pointer events, hidden from AT.
  -->
  <Transition name="motif">
    <div v-if="motif" :key="motifKey" class="motif" :class="`motif--${motifKey}`" aria-hidden="true">
      <div v-for="corner in motif.corners" :key="corner" class="motif__corner" :class="`motif__corner--${corner}`">
        <i v-if="motif.glow" class="motif__glow" />
        <i v-if="motif.rays" class="motif__rays" />
        <svg v-if="motif.vines" class="motif__vines" viewBox="0 0 320 320">
          <g class="motif__sway">
            <path v-for="(vine, i) in VINES" :key="`v${i}`" class="vine" :d="vine.d" pathLength="1" :style="{'--delay': `${vine.delay}s`, strokeWidth: vine.w}" />
            <g v-for="(leaf, i) in LEAVES" :key="`l${i}`" class="leaf" :style="{'--delay': `${leaf.delay}s`, transform: `translate(${leaf.x}px, ${leaf.y}px) rotate(${leaf.r}deg)`}">
              <path d="M0 0 C 5 -8, 15 -9, 22 0 C 15 9, 5 8, 0 0 Z" />
            </g>
            <g v-for="(flower, i) in FLOWERS" :key="`f${i}`" class="flower" :style="{'--delay': `${flower.delay}s`, transform: `translate(${flower.x}px, ${flower.y}px)`}">
              <circle v-for="p in 5" :key="p" :cx="Math.cos((p / 5) * Math.PI * 2) * 5" :cy="Math.sin((p / 5) * Math.PI * 2) * 5" r="4.2" />
              <circle class="flower__heart" r="2.6" />
            </g>
          </g>
        </svg>
        <canvas v-if="motif.paint" :ref="el => setCanvas(corner, el)" class="motif__canvas" />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, watch} from 'vue';
import {useArcana} from './useArcana';
import {isCardId} from './arcana-data';

type Corner = 'tl' | 'tr' | 'bl' | 'br';
type Particle = {x: number; y: number; vx: number; vy: number; age: number; life: number; size: number; seed: number; kind: number};
/** One corner's canvas, drawn as if it were the left-hand corner (right-hand ones are mirrored in CSS). */
type Field = {ctx: CanvasRenderingContext2D; w: number; h: number; parts: Particle[]; clock: number; flash: number; bolt: number[][] | null; next: number};
type Painter = (f: Field, dt: number) => void;
type Motif = {corners: Corner[]; paint?: Painter; vines?: boolean; rays?: boolean; glow?: boolean};

const {currentId, hasDrawn, reveal} = useArcana();

/* ---------------- painters: square texels, like the potion story's particles ---------------- */
const TEXEL = 4;
const snap = (v: number) => Math.round(v / TEXEL) * TEXEL;
const rand = (a: number, b: number) => a + Math.random() * (b - a);
/** Fades a particle out toward the corner box's inner edges: nothing ends at a hard line. */
const edgeFade = (f: Field, x: number, y: number, fromBottom: boolean) => {
  const fx = 1 - Math.min(1, Math.max(0, (x - f.w * 0.55) / (f.w * 0.45)));
  const fy = fromBottom ? Math.min(1, Math.max(0, y / (f.h * 0.35))) : 1 - Math.min(1, Math.max(0, (y - f.h * 0.55) / (f.h * 0.45)));
  return fx * fy;
};

/* Red Priest: flames lick up out of the bottom corner, embers ride the heat higher. */
const FIRE = ['#fff4c8', '#ffd25a', '#ff9a2e', '#f2552a', '#c2261d', '#5c120e'];
const paintFire: Painter = (f, dt) => {
  const {ctx, w, h} = f;
  const spawn = dt * 120;
  for (let i = 0; i < spawn; i++) {
    const ember = Math.random() < 0.08;
    const x = w * 0.85 * Math.random() ** 2.2;
    const tall = 1 - x / w;
    f.parts.push({x, y: h + 4, vx: rand(-8, 14), vy: -rand(70, 150) * (0.5 + tall), age: 0, life: ember ? rand(2.2, 3.6) : rand(0.6, 1.6) * (0.4 + tall), size: ember ? 3 : TEXEL * (1 + Math.floor(Math.random() * 3)), seed: Math.random() * 10, kind: ember ? 1 : 0});
  }
  ctx.clearRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'lighter';
  f.parts = f.parts.filter(p => (p.age += dt) < p.life);
  for (const p of f.parts) {
    p.x += (p.vx + Math.sin(f.clock * 6 + p.seed) * 18) * dt;
    p.y += p.vy * dt;
    const k = p.age / p.life;
    const fade = edgeFade(f, p.x, p.y, true);
    if (p.kind === 1) {
      ctx.fillStyle = `rgba(255, 200, 90, ${((1 - k) * 0.9 * fade).toFixed(3)})`;
      ctx.fillRect(snap(p.x), snap(p.y), 3, 3);
      continue;
    }
    const color = FIRE[Math.min(FIRE.length - 1, Math.floor(k * FIRE.length))];
    ctx.globalAlpha = Math.max(0, (1 - k * 0.85) * fade);
    ctx.fillStyle = color;
    const s = p.size * (1 - k * 0.5);
    ctx.fillRect(snap(p.x - s / 2), snap(p.y - s / 2), Math.max(TEXEL, snap(s)), Math.max(TEXEL, snap(s)));
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
};

/* Tyrant: a squall in the top corner, and now and then the sky splits. */
const paintStorm: Painter = (f, dt) => {
  const {ctx, w, h} = f;
  if (!f.parts.length) {
    for (let i = 0; i < 150; i++) f.parts.push({x: rand(-40, w), y: rand(0, h), vx: 190, vy: rand(820, 1060), age: 0, life: 1, size: rand(16, 30), seed: Math.random(), kind: 0});
  }
  ctx.clearRect(0, 0, w, h);
  ctx.lineWidth = 2;
  for (const p of f.parts) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.y > h || p.x > w) {
      p.y = rand(-30, 0);
      p.x = rand(-60, w * 0.9);
    }
    const a = 0.55 * edgeFade(f, p.x, p.y, false);
    if (a < 0.01) continue;
    ctx.strokeStyle = `rgba(170, 205, 255, ${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - p.size * 0.17, p.y - p.size);
    ctx.stroke();
  }
  // lightning: every few seconds a jagged bolt from the top edge, and the corner flashes
  f.next -= dt;
  if (f.next <= 0) {
    f.next = rand(4, 8);
    f.flash = 1;
    const bolt: number[][] = [];
    let x = rand(w * 0.15, w * 0.55);
    for (let y = 0; y < h * rand(0.45, 0.7); y += rand(14, 26)) {
      bolt.push([x, y]);
      x += rand(-18, 18);
    }
    f.bolt = bolt;
  }
  if (f.flash > 0) {
    ctx.fillStyle = `rgba(170, 205, 255, ${(f.flash * 0.3).toFixed(3)})`;
    ctx.fillRect(0, 0, w, h);
    if (f.bolt) {
      ctx.strokeStyle = `rgba(230, 240, 255, ${f.flash.toFixed(3)})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(140, 190, 255, 0.9)';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      f.bolt.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    f.flash = Math.max(0, f.flash - dt * 4.5);
  }
};

/* Darkness: the corner sinks into night (the glow layer) and stars come out in it. */
const paintNight: Painter = (f, dt) => {
  const {ctx, w, h} = f;
  if (!f.parts.length) {
    for (let i = 0; i < 46; i++) {
      const x = w * Math.random() ** 1.6;
      const y = h * Math.random() ** 1.6;
      f.parts.push({x, y, vx: 0, vy: 0, age: 0, life: 1, size: Math.random() < 0.2 ? 4 : 2, seed: Math.random() * 10, kind: 0});
    }
  }
  ctx.clearRect(0, 0, w, h);
  for (const p of f.parts) {
    const twinkle = 0.45 + 0.55 * Math.sin(f.clock * (0.8 + p.seed * 0.2) + p.seed * 7);
    const a = twinkle * edgeFade(f, p.x, p.y, false);
    ctx.fillStyle = `rgba(222, 226, 255, ${(a * 0.9).toFixed(3)})`;
    ctx.fillRect(snap(p.x), snap(p.y), p.size, p.size);
  }
  // a shooting star across the corner every so often
  f.next -= dt;
  if (f.next <= 0) {
    f.next = rand(5, 10);
    f.flash = 1;
    f.bolt = [[rand(w * 0.3, w * 0.8), rand(0, h * 0.2)]];
  }
  if (f.flash > 0 && f.bolt) {
    const [sx, sy] = f.bolt[0];
    const k = 1 - f.flash;
    const x = sx - k * w * 0.5;
    const y = sy + k * h * 0.35;
    const grad = ctx.createLinearGradient(x, y, x + 46, y - 32);
    grad.addColorStop(0, `rgba(235, 238, 255, ${f.flash.toFixed(3)})`);
    grad.addColorStop(1, 'rgba(235, 238, 255, 0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 46, y - 32);
    ctx.stroke();
    f.flash = Math.max(0, f.flash - dt * 1.4);
  }
};

/* Fool: banks of gray fog roll in at the bottom corner and drift (the Gray Fog above the sea). */
const paintFog: Painter = (f, dt) => {
  const {ctx, w, h} = f;
  if (!f.parts.length) {
    for (let i = 0; i < 26; i++) f.parts.push({x: rand(-w * 0.3, w * 0.9), y: h - rand(0, h * 0.6) * Math.random(), vx: rand(6, 16), vy: 0, age: 0, life: 1, size: rand(40, 110), seed: Math.random() * 10, kind: 0});
  }
  ctx.clearRect(0, 0, w, h);
  for (const p of f.parts) {
    p.x += p.vx * dt;
    if (p.x - p.size > w) p.x = -p.size;
    const bob = Math.sin(f.clock * 0.4 + p.seed) * 6;
    const a = 0.075 * edgeFade(f, p.x, p.y, true) + 0.01;
    ctx.fillStyle = `rgba(196, 198, 210, ${a.toFixed(3)})`;
    const bw = snap(p.size);
    const bh = TEXEL * 3;
    ctx.fillRect(snap(p.x - bw / 2), snap(p.y + bob), bw, bh);
    ctx.fillRect(snap(p.x - bw * 0.3), snap(p.y + bob - bh), snap(bw * 0.6), bh);
    ctx.fillRect(snap(p.x - bw * 0.12), snap(p.y + bob - bh * 2), snap(bw * 0.26), bh);
  }
};

/* Sun: golden motes drifting down through the rays (the rays are a CSS layer). */
const paintMotes: Painter = (f, dt) => {
  const {ctx, w, h} = f;
  if (!f.parts.length) {
    for (let i = 0; i < 34; i++) f.parts.push({x: rand(0, w), y: rand(0, h), vx: rand(-6, 4), vy: rand(8, 22), age: 0, life: 1, size: Math.random() < 0.3 ? 4 : 2, seed: Math.random() * 10, kind: 0});
  }
  ctx.clearRect(0, 0, w, h);
  for (const p of f.parts) {
    p.x += (p.vx + Math.sin(f.clock + p.seed) * 6) * dt;
    p.y += p.vy * dt;
    if (p.y > h) {
      p.y = -4;
      p.x = rand(0, w);
    }
    const a = (0.5 + 0.5 * Math.sin(f.clock * 2 + p.seed)) * edgeFade(f, p.x, p.y, false);
    ctx.fillStyle = `rgba(255, 236, 150, ${(a * 0.85).toFixed(3)})`;
    ctx.fillRect(snap(p.x), snap(p.y), p.size, p.size);
  }
};

const MOTIFS: Record<string, Motif> = {
  priest: {corners: ['bl', 'br'], paint: paintFire, glow: true},
  mother: {corners: ['tl', 'br'], vines: true},
  tyrant: {corners: ['tl', 'tr'], paint: paintStorm, glow: true},
  darkness: {corners: ['tl', 'tr'], paint: paintNight, glow: true},
  fool: {corners: ['bl', 'br'], paint: paintFog, glow: true},
  sun: {corners: ['tr'], paint: paintMotes, rays: true},
};

/* ---------------- the Mother's vines: drawn in, then leaves and flowers open along them ---------------- */
const VINES = [
  {d: 'M0 34 C 52 30, 78 70, 118 92 S 186 120, 214 176 S 238 250, 262 300', w: 6, delay: 0},
  {d: 'M34 0 C 32 54, 70 80, 92 120 S 118 190, 176 214', w: 5, delay: 0.5},
  {d: 'M118 92 C 140 70, 168 66, 196 74', w: 3, delay: 1.6},
  {d: 'M92 120 C 70 150, 66 178, 74 206', w: 3, delay: 1.9},
  {d: 'M214 176 C 236 168, 258 172, 276 186', w: 2.5, delay: 2.4},
];
const LEAVES = [
  {x: 50, y: 34, r: -30, delay: 1.0}, {x: 86, y: 66, r: 40, delay: 1.3}, {x: 150, y: 104, r: -20, delay: 1.7},
  {x: 196, y: 150, r: 60, delay: 2.1}, {x: 228, y: 228, r: 20, delay: 2.6}, {x: 34, y: 52, r: 120, delay: 1.2},
  {x: 62, y: 94, r: 150, delay: 1.5}, {x: 108, y: 160, r: 100, delay: 2.0}, {x: 170, y: 72, r: -60, delay: 2.2},
  {x: 70, y: 180, r: 200, delay: 2.4}, {x: 250, y: 176, r: -10, delay: 2.9},
];
const FLOWERS = [
  {x: 196, y: 74, delay: 3.0}, {x: 74, y: 206, delay: 3.3}, {x: 118, y: 92, delay: 2.8}, {x: 276, y: 186, delay: 3.6},
];

/* ---------------- the switch (mock-up): ?motifs=1 on, ?motifs=0 off, ?card=<id> to jump to one ---------------- */
const motifKey = computed(() => (hasDrawn.value && MOTIFS[currentId.value] ? currentId.value : ''));
const motif = computed<Motif | null>(() => (motifKey.value ? MOTIFS[motifKey.value] : null));

const canvases = new Map<Corner, HTMLCanvasElement>();
const fields = new Map<Corner, Field>();
function setCanvas(corner: Corner, el: unknown) {
  if (el instanceof HTMLCanvasElement) canvases.set(corner, el);
  else canvases.delete(corner);
}

function sizeFields() {
  fields.clear();
  for (const [corner, canvas] of canvases) {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) fields.set(corner, {ctx, w, h, parts: [], clock: Math.random() * 10, flash: 0, bolt: null, next: rand(1.5, 4)});
  }
}

let frame = 0;
let last = 0;
const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function tick(now: number) {
  frame = 0;
  const paint = motif.value?.paint;
  if (!paint || document.visibilityState !== 'visible') return;
  const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
  last = now;
  for (const f of fields.values()) {
    f.clock += dt;
    paint(f, dt);
  }
  frame = requestAnimationFrame(tick);
}
function start() {
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  last = 0;
  if (!motif.value?.paint || still()) return;
  // after the corners are in the DOM and laid out
  requestAnimationFrame(() => {
    sizeFields();
    frame = requestAnimationFrame(tick);
  });
}

watch(motifKey, () => start(), {flush: 'post'});
const onVisible = () => document.visibilityState === 'visible' && start();
let resizeTimer = 0;
const onResize = () => {
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(start, 200);
};

onMounted(() => {
  const asked = new URLSearchParams(location.search).get('card');
  if (asked && isCardId(asked)) void reveal(asked);
  start();
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('resize', onResize, {passive: true});
});
onUnmounted(() => {
  if (frame) cancelAnimationFrame(frame);
  document.removeEventListener('visibilitychange', onVisible);
  window.removeEventListener('resize', onResize);
});
</script>

<style scoped>
.motif {
  position: fixed;
  inset: 0;
  /* over the page's content, under the header (1000) and the floating controls */
  z-index: 40;
  pointer-events: none;
}

.motif__corner {
  --cw: clamp(150px, 24vw, 340px);
  --ch: clamp(170px, 38vh, 380px);
  position: absolute;
  width: var(--cw);
  height: var(--ch);
}

/* vines reach in further than light does: smaller corners, so they frame the copy instead of covering it */
.motif--mother .motif__corner {
  --cw: clamp(120px, 15vw, 230px);
  --ch: clamp(120px, 26vh, 240px);
}

.motif__corner--tl { top: 0; left: 0; }
.motif__corner--tr { top: 0; right: 0; transform: scaleX(-1); }
.motif__corner--bl { bottom: 0; left: 0; }
.motif__corner--br { bottom: 0; right: 0; transform: scaleX(-1); }

.motif__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}

/* ---- the corner's light, per Pathway ---- */
.motif__glow {
  position: absolute;
  inset: 0;
}

.motif--priest .motif__glow {
  background: radial-gradient(120% 75% at 0% 100%, rgba(255, 110, 40, .5), rgba(210, 40, 30, .2) 45%, transparent 74%);
  animation: motif-flicker 2.4s steps(6) infinite;
}

/* the squall's cloud over the corner the rain falls from */
.motif--tyrant .motif__glow {
  background: radial-gradient(130% 110% at 0% 0%, rgba(14, 22, 44, .85), rgba(30, 50, 90, .35) 45%, transparent 75%);
}

.motif--darkness .motif__glow {
  background: radial-gradient(130% 120% at 0% 0%, rgba(6, 7, 22, .92), rgba(10, 12, 40, .55) 40%, transparent 75%);
}

.motif--fool .motif__glow {
  background: radial-gradient(130% 80% at 0% 100%, rgba(180, 182, 196, .16), transparent 70%);
}

@keyframes motif-flicker {
  0%, 100% { opacity: .85; }
  20% { opacity: 1; }
  45% { opacity: .7; }
  70% { opacity: .95; }
}

/* ---- the Sun's rays: one slow turn of a ray fan from the corner (transform only) ---- */
.motif__rays {
  position: absolute;
  top: calc(var(--ch) * -1);
  left: calc(var(--cw) * -1);
  width: calc(var(--cw) * 2.2);
  height: calc(var(--ch) * 2.2);
  background: repeating-conic-gradient(from 90deg at 50% 50%, rgba(255, 238, 160, .2) 0deg 5deg, transparent 5deg 13deg);
  -webkit-mask-image: radial-gradient(closest-side, #000 30%, transparent);
  mask-image: radial-gradient(closest-side, #000 30%, transparent);
  animation: motif-rays 60s linear infinite;
}

@keyframes motif-rays {
  to { transform: rotate(360deg); }
}

/* ---- the Mother's vines ---- */
.motif__vines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.motif__corner--br .motif__vines {
  transform: scaleY(-1);
}

.motif__sway {
  transform-origin: 0 0;
  animation: motif-sway 9s ease-in-out 4s infinite alternate;
}

@keyframes motif-sway {
  to { transform: rotate(1.6deg); }
}

.vine {
  fill: none;
  stroke: #3f9a5c;
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, .45));
  animation: motif-grow 3.2s cubic-bezier(.3, .6, .3, 1) var(--delay) forwards;
}

@keyframes motif-grow {
  to { stroke-dashoffset: 0; }
}

.leaf path {
  fill: #5fd38d;
  stroke: #2c7a46;
  stroke-width: 1.2;
}

.leaf > path,
.flower > * {
  transform: scale(0);
  transform-origin: 0 0;
  animation: motif-open .7s cubic-bezier(.3, 1.6, .5, 1) var(--delay) forwards;
}

.flower circle {
  fill: #ffb3d1;
}

.flower .flower__heart {
  fill: #ffe38a;
}

@keyframes motif-open {
  to { transform: scale(1); }
}

/* ---- the swap: one motif fades as the next comes in ---- */
.motif-enter-active,
.motif-leave-active {
  transition: opacity .8s ease;
}

.motif-enter-from,
.motif-leave-to {
  opacity: 0;
}

/* phones: smaller corners, kept off the copy */
@media (max-width: 600px) {
  .motif__corner {
    --cw: 30vw;
    --ch: 17vh;
  }

  .motif--mother .motif__corner {
    --cw: 22vw;
    --ch: 12vh;
  }
}

@media (prefers-reduced-motion: reduce) {
  .motif__canvas {
    display: none;
  }

  .motif__glow,
  .motif__rays,
  .motif__sway {
    animation: none;
  }

  .vine,
  .leaf > path,
  .flower > * {
    animation-duration: 1ms;
    animation-delay: 0s;
  }
}
</style>
