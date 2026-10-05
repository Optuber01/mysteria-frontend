<template>
  <!--
    Demoness: the sky cracks like a mirror. Fracture lines spread from one point on the
    moon's upper limb, the moon shows doubled (a faint mirrored copy, a little off, as a
    mirror would give it back), a tongue of black flame runs along one crack across the
    moon's face, and frost seals the cracks over and creeps in from the edge of the view.
  -->
  <div aria-hidden="true">
    <template v-if="layer === 'back'">
      <!-- the doubled moon: mirrored and offset, as if seen in the glass -->
      <div ref="followRef" class="dm-moon">
        <div ref="riseRef" class="dm-moon__rise">
          <div class="dm-ghost">
            <img :src="moon" alt="" decoding="async" width="640" height="640">
          </div>
        </div>
      </div>

      <!-- the point of impact; everything below is laid out in moon radii (100 units = r) from it -->
      <div class="dm-k">
        <svg class="dm-svg dm-facets" viewBox="0 0 100 100">
          <polygon v-for="(f, i) in FACETS" :key="i" :points="f" class="dm-facet" :style="{'--d': `${1.25 + i * .12}s`}"/>
        </svg>
        <svg class="dm-svg dm-cracks" viewBox="0 0 100 100">
          <g class="dm-cracks__shadow">
            <path v-for="(c, i) in CRACKS" :key="i" :d="c.d" :style="c.style"/>
          </g>
          <g class="dm-cracks__edge">
            <path v-for="(c, i) in CRACKS" :key="i" :d="c.d" :style="c.style"/>
          </g>
          <!-- the black flame's track, charred as it passes -->
          <path class="dm-char" :d="FLAME_TRACK.d" :style="{'--len': FLAME_TRACK.len}"/>
        </svg>
        <!-- frost sealing the cracks: an icy line over each, and rime growing along them -->
        <svg class="dm-svg dm-seal" viewBox="0 0 100 100">
          <path v-for="(c, i) in CRACKS" :key="i" :d="c.d" class="dm-seal__line"/>
        </svg>
        <svg v-for="(b, i) in RIME" :key="i" class="dm-svg dm-rime" viewBox="0 0 100 100" :style="{'--d': b.delay}">
          <path :d="b.d"/>
        </svg>
        <i class="dm-impact"></i>
        <!-- the black flame, carried along its crack -->
        <div ref="flameRef" class="dm-flamebox">
          <div class="dm-flame">
            <i class="dm-flame__halo"></i>
            <svg class="dm-flame__svg" viewBox="-30 -46 60 50">
              <path v-for="(t, i) in TONGUES" :key="i" :d="t" class="dm-flame__tongue" :style="{'--i': i}"/>
            </svg>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <!-- frost creeping in from the right edge of the view -->
      <i class="dm-haze"></i>
      <div class="dm-edge">
        <svg class="dm-svg dm-edge__svg" viewBox="0 0 100 100">
          <g class="dm-edge__grow">
            <path :d="EDGE_FROST" class="dm-edge__frost"/>
            <path :d="EDGE_FROST_FINE" class="dm-edge__fine"/>
          </g>
        </svg>
        <i v-for="g in EDGE_GLINTS" :key="g.d" class="dm-edge__glint" :style="{right: `calc(var(--moon-r, 200px) * ${g.x})`, top: `calc(var(--moon-r, 200px) * ${g.y})`, '--d': `${g.d}s`}"></i>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, ref} from 'vue';
import moon from '../assets/moon/crimson-moon.webp';
import {reducedMotion, seeded, useMoonAnchor} from './sigKit';

const props = defineProps<{layer: 'back' | 'front'}>();

const followRef = ref<HTMLElement | null>(null);
const riseRef = ref<HTMLElement | null>(null);
const flameRef = ref<HTMLElement | null>(null);
useMoonAnchor(followRef, riseRef);

type Pt = [number, number];
const rnd = seeded(61);
const deg = Math.PI / 180;
const f1 = (n: number) => n.toFixed(1);
const pathOf = (pts: Pt[]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f1(x)} ${f1(y)}`).join(' ');
const lengthOf = (pts: Pt[]) => pts.reduce((sum, p, i) => (i ? sum + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);

/** A jagged fracture: short straight runs, each turning a little (units: 100 = one moon radius). */
function fracture(from: Pt, angle: number, length: number, jitter: number): Pt[] {
  const pts: Pt[] = [from];
  let [x, y] = from;
  let a = angle;
  let run = 0;
  while (run < length) {
    const step = Math.min(12 + rnd() * 16, length - run);
    a += (rnd() - .5) * 2 * jitter;
    x += Math.cos(a * deg) * step;
    y += Math.sin(a * deg) * step;
    pts.push([x, y]);
    run += step;
  }
  return pts;
}

/*
 * The main fractures, from the point of impact on the moon's upper-right limb (angles
 * clockwise from +x; lengths in units). The one at 182deg runs left across the moon's
 * face, where the black flame will travel and where a crack shows best.
 */
const MAIN: [number, number][] = [[182, 172], [-150, 200], [-104, 190], [-62, 300], [-22, 260], [14, 240], [58, 150], [108, 150], [146, 170]];
type Crack = {pts: Pt[]; d: string; len: number; delay: number; dur: number};
const cracks: Crack[] = [];
const IMPACT_AT = 0.85;
const SPEED = 520; // units per second as a fracture runs
MAIN.forEach(([a, l], i) => {
  const pts = i === 0 ? fracture([0, 0], a, l, 3) : fracture([0, 0], a, l, 9);
  const len = lengthOf(pts);
  const delay = IMPACT_AT + rnd() * .12;
  cracks.push({pts, d: pathOf(pts), len, delay, dur: len / SPEED});
  // a branch or two off the longer fractures, starting when the fracture reaches them
  const branches = l > 180 ? 2 : 1;
  for (let b = 0; b < branches; b++) {
    const at = 1 + Math.floor(rnd() * (pts.length - 2));
    const [x0, y0] = pts[at];
    const [xp, yp] = pts[at - 1];
    const heading = Math.atan2(y0 - yp, x0 - xp) / deg + (rnd() < .5 ? -1 : 1) * (26 + rnd() * 26);
    const bp = fracture([x0, y0], heading, 30 + rnd() * 70, 12);
    const bl = lengthOf(bp);
    const reach = lengthOf(pts.slice(0, at + 1));
    cracks.push({pts: bp, d: pathOf(bp), len: bl, delay: delay + reach / SPEED, dur: bl / SPEED});
  }
});
/* the web: short bent links between neighbouring fractures, at two distances from the impact */
function pointAt(pts: Pt[], dist: number): Pt {
  for (const p of pts) if (Math.hypot(p[0], p[1]) >= dist) return p;
  return pts[pts.length - 1];
}
const mains = cracks.filter(c => c.pts[0][0] === 0 && c.pts[0][1] === 0);
const byAngle = mains.map((c, i) => ({c, a: MAIN[i][0]})).sort((p, q) => p.a - q.a);
const facets: string[] = [];
for (const ring of [24, 52]) {
  byAngle.forEach(({c, a}, i) => {
    const next = byAngle[(i + 1) % byAngle.length];
    const gap = (next.a - a + 360) % 360;
    if (gap > 70) return;
    const p = pointAt(c.pts, ring * (.85 + rnd() * .3));
    const q = pointAt(next.c.pts, ring * (.85 + rnd() * .3));
    const mid: Pt = [(p[0] + q[0]) / 2 * (1.04 + rnd() * .08), (p[1] + q[1]) / 2 * (1.04 + rnd() * .08)];
    const pts: Pt[] = [p, mid, q];
    const len = lengthOf(pts);
    cracks.push({pts, d: pathOf(pts), len, delay: IMPACT_AT + ring / SPEED + .25 + rnd() * .2, dur: .22});
    // a few of the inner wedges catch the light, like facets of broken glass
    if (ring === 24 && facets.length < 4 && rnd() < .7) facets.push([[0, 0], p, mid, q].map(([x, y]) => `${f1(x)},${f1(y)}`).join(' '));
  });
}
const CRACKS = cracks.map(c => ({d: c.d, style: {'--len': f1(c.len), '--d': `${c.delay.toFixed(2)}s`, '--t': `${Math.max(.12, c.dur).toFixed(2)}s`}}));
const FACETS = facets;

/* the flame's crack */
const flamePts = cracks[0].pts;
const FLAME_TRACK = {d: cracks[0].d, len: f1(cracks[0].len)};
const FLAME_AT = 1.9;
const FLAME_FOR = 1.5;

/*
 * Rime: frost growing along each fracture as short feathery barbs, angled forward on
 * both sides, denser and longer near the impact. Split into three bands by distance from
 * the impact, so the frost seals the cracks from the centre outward.
 */
const rimeBands: string[][] = [[], [], []];
cracks.forEach(c => {
  for (let i = 1; i < c.pts.length; i++) {
    const [x0, y0] = c.pts[i - 1];
    const [x1, y1] = c.pts[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    const a = Math.atan2(y1 - y0, x1 - x0);
    for (let t = .8; t < seg; t += .9 + rnd() * 1.1) {
      const x = x0 + Math.cos(a) * t;
      const y = y0 + Math.sin(a) * t;
      const dist = Math.hypot(x, y);
      const band = dist < 60 ? 0 : dist < 150 ? 1 : 2;
      for (const side of [-1, 1]) {
        if (rnd() < .4) continue;
        const reach = Math.max(.4, 1.9 - dist / 160) * (.4 + rnd() * .8);
        const ba = a + side * (50 + rnd() * 20) * deg;
        rimeBands[band].push(`M${f1(x)} ${f1(y)}l${f1(Math.cos(ba) * reach)} ${f1(Math.sin(ba) * reach)}`);
      }
    }
  }
});
const RIME = rimeBands.map((b, i) => ({d: b.join(''), delay: `${(3.1 + i * .45).toFixed(2)}s`}));

/* four tongues of black flame, rising from the crack (the box's base line is y = 0) */
const TONGUES = [
  'M-20 0 C-22 -8 -14 -14 -16 -24 C-10 -18 -6 -10 -8 0 Z',
  'M-11 0 C-14 -12 -4 -20 -6 -40 C2 -28 6 -16 3 0 Z',
  'M-1 0 C-3 -10 8 -18 6 -31 C13 -22 15 -10 11 0 Z',
  'M8 0 C8 -7 16 -10 15 -19 C21 -12 22 -6 19 0 Z',
];

/*
 * ---- the edge frost (front layer) ----
 * Window frost: feathered stems growing in from the right edge, each carrying close-set
 * barbs angled toward its tip (longest near the base), a few forking into side stems.
 */
const ef = seeded(19);
function feather(x: number, y: number, a: number, len: number, depth: number, stems: string[], barbs: string[]) {
  const pts: Pt[] = [[x, y]];
  let cx = x;
  let cy = y;
  let ca = a;
  const bend = (ef() - .5) * 3;
  for (let run = 0; run < len; run += 2.2) {
    ca += bend + (ef() - .5) * 5;
    cx += Math.cos(ca * deg) * 2.2;
    cy += Math.sin(ca * deg) * 2.2;
    pts.push([cx, cy]);
    const left = 1 - run / len;
    for (const side of [-1, 1]) {
      if (ef() < .18) continue;
      const bl = (1.2 + left * 5.5) * (.6 + ef() * .6);
      const ba = (ca + side * (52 + ef() * 12)) * deg;
      barbs.push(`M${f1(cx)} ${f1(cy)}l${f1(Math.cos(ba) * bl)} ${f1(Math.sin(ba) * bl)}`);
    }
    if (depth > 0 && run > len * .2 && run < len * .7 && ef() < .09) {
      feather(cx, cy, ca + (ef() < .5 ? -1 : 1) * (38 + ef() * 14), len * (.3 + ef() * .25), depth - 1, stems, barbs);
    }
  }
  stems.push(pathOf(pts));
}
const edgeStems: string[] = [];
const edgeBarbs: string[] = [];
for (const [y, a, l] of [
  [18, 196, 46], [44, 172, 70], [70, 188, 34], [98, 166, 88], [126, 194, 52], [150, 178, 40], [176, 170, 96],
  [206, 192, 58], [232, 182, 36], [258, 168, 78], [290, 190, 48], [318, 176, 64], [350, 194, 40], [378, 172, 70],
] as const) {
  feather(100, y, a, l, 1, edgeStems, edgeBarbs);
}
const EDGE_FROST = edgeStems.join(' ');
const EDGE_FROST_FINE = edgeBarbs.join('');
const EDGE_GLINTS = [{x: .22, y: .8, d: 0}, {x: .5, y: 1.75, d: 1.7}, {x: .3, y: 2.9, d: 3.1}, {x: .62, y: 3.5, d: 4.4}];

/* ---- the flame's run: along its crack, in moon radii, from the impact leftward ---- */
let flameRun: Animation | null = null;
onMounted(() => {
  if (props.layer !== 'back' || !flameRef.value || reducedMotion()) return;
  let walked = 0;
  const total = lengthOf(flamePts);
  const keys = flamePts.map(([x, y], i) => {
    if (i) walked += Math.hypot(x - flamePts[i - 1][0], y - flamePts[i - 1][1]);
    return {transform: `translate3d(${f1(x)}%, ${f1(y)}%, 0)`, offset: walked / total};
  });
  flameRun = flameRef.value.animate(keys, {duration: FLAME_FOR * 1000, delay: FLAME_AT * 1000, easing: 'cubic-bezier(.3, .1, .6, 1)', fill: 'both'});
});
onUnmounted(() => flameRun?.cancel());
</script>

<style scoped>
.dm-svg {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* ---- the doubled moon ---- */
.dm-moon {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  height: calc(var(--moon-r, 200px) * 2);
  will-change: transform;
}

.dm-moon__rise {
  position: absolute;
  inset: 0;
}

/* mirrored and slid a quarter radius to the right, faint, its limb crossing the moon's face */
.dm-ghost {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(255, 222, 244, .5), 0 0 calc(var(--moon-r, 200px) * .06) rgba(255, 190, 236, .25);
  transform: translate3d(14%, -3%, 0);
  opacity: .5;
  animation: dm-ghost 1.8s cubic-bezier(.2, .7, .3, 1) 1s both;
}

.dm-ghost img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transform: scaleX(-1);
  filter: saturate(1.08) brightness(.96) hue-rotate(-30deg) saturate(.8) brightness(.9);
  mix-blend-mode: screen;
  opacity: .55;
}

@keyframes dm-ghost {
  from { opacity: 0; transform: translate3d(2%, 0, 0); }
}

/* ---- the impact point: on the moon's upper-right limb ---- */
.dm-k {
  position: absolute;
  left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * .78);
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * .62);
  width: var(--moon-r, 200px);
  height: var(--moon-r, 200px);
}

.dm-impact {
  position: absolute;
  left: 0;
  top: 0;
  width: 26%;
  aspect-ratio: 1;
  translate: -50% -50%;
  border-radius: 50%;
  background:
    linear-gradient(90deg, transparent 46%, rgba(255, 240, 252, .9) 50%, transparent 54%),
    linear-gradient(0deg, transparent 46%, rgba(255, 240, 252, .9) 50%, transparent 54%),
    radial-gradient(closest-side, rgba(255, 236, 250, .8), rgba(255, 170, 230, .25) 40%, transparent);
  opacity: 0;
  animation: dm-impact 1.1s ease-out .8s both;
}

@keyframes dm-impact {
  0% { opacity: 0; transform: scale(.3) rotate(0deg); }
  14% { opacity: .9; }
  100% { opacity: 0; transform: scale(1.3) rotate(30deg); }
}

/* the fractures run outward from the impact */
.dm-cracks path,
.dm-seal path {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.dm-cracks path {
  stroke-dasharray: var(--len);
  animation: dm-draw var(--t) cubic-bezier(.2, .6, .4, 1) var(--d) both;
}

@keyframes dm-draw {
  from { stroke-dashoffset: var(--len); }
}

/* a dark line under a bright one: the two edges of a crack in glass */
.dm-cracks__shadow path {
  stroke: rgba(20, 6, 22, .6);
  stroke-width: 1.3;
  transform: translate(.45px, .55px);
}

.dm-cracks__edge path {
  stroke: rgba(255, 228, 246, .78);
  stroke-width: .55;
}

.dm-facet {
  fill: rgba(255, 226, 248, .07);
  stroke: none;
  animation: dm-facet 1.2s ease var(--d) both;
}

@keyframes dm-facet {
  from { opacity: 0; }
  30% { opacity: 1; fill: rgba(255, 236, 252, .16); }
}

/* the black flame's crack, charred as it passes, left in the moon's face */
.dm-char {
  stroke: rgba(8, 2, 12, .8);
  stroke-width: 1.6;
  stroke-dasharray: var(--len);
  animation: dm-draw 1.5s cubic-bezier(.3, .1, .6, 1) 1.9s both;
}

/* frost: an icy line over each crack, then rime along them */
.dm-seal {
  opacity: .9;
  animation: dm-seal 1.6s ease 3.1s both;
}

@keyframes dm-seal {
  from { opacity: 0; }
}

.dm-seal__line {
  stroke: rgba(236, 228, 255, .26);
  stroke-width: 1.1;
}

.dm-rime path {
  fill: none;
  stroke: rgba(246, 240, 255, .5);
  stroke-width: .28;
  stroke-linecap: round;
}

.dm-rime {
  filter: drop-shadow(0 0 1px rgba(226, 214, 255, .7));
  animation: dm-rime 1.4s ease var(--d) both;
}

@keyframes dm-rime {
  from { opacity: 0; }
}

/* ---- the black flame ---- */
.dm-flamebox {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}

.dm-flame {
  position: absolute;
  left: 0;
  top: 0;
  width: 34%;
  height: 28%;
  translate: -50% -88%;
  transform-origin: 50% 88%;
  animation: dm-flame-life 1.5s ease 1.9s both;
}

@keyframes dm-flame-life {
  0% { opacity: 0; transform: scale(.2, .1); }
  12% { opacity: 1; transform: scale(1); }
  70% { opacity: 1; transform: scale(1.08, 1.12); }
  100% { opacity: 0; transform: scale(.4, .1); }
}

.dm-flame__halo {
  position: absolute;
  inset: -30% -25% 0;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(10, 2, 16, .55), rgba(60, 10, 70, .25) 55%, transparent);
}

.dm-flame__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.dm-flame__tongue {
  fill: #07020a;
  stroke: rgba(255, 140, 226, .55);
  stroke-width: .8;
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: dm-lick .32s ease-in-out calc(var(--i) * -.11s) infinite alternate;
}

@keyframes dm-lick {
  to { transform: scale(.86, 1.18) skewX(-6deg); }
}

/* ---- the edge frost (in front of everything) ---- */
.dm-edge {
  position: absolute;
  right: 0;
  top: 0;
  width: var(--moon-r, 200px);
  height: var(--moon-r, 200px);
}

.dm-edge__grow {
  transform-box: view-box;
  transform-origin: 100% 0;
  animation: dm-creep 2.2s cubic-bezier(.2, .7, .3, 1) 2.7s both;
}

@keyframes dm-creep {
  from { opacity: 0; transform: translate(14px, 0) scale(.6, 1); }
}

.dm-edge__frost,
.dm-edge__fine {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.dm-edge__frost {
  stroke: rgba(244, 236, 255, .4);
  stroke-width: .5;
}

.dm-edge__fine {
  stroke: rgba(244, 236, 255, .3);
  stroke-width: .3;
}

.dm-edge__svg {
  filter: drop-shadow(0 0 1.5px rgba(230, 220, 255, .5));
}

/* the glass frosting over toward the edge */
.dm-haze {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: calc(var(--moon-r, 200px) * .9);
  background: linear-gradient(270deg, rgba(240, 230, 255, .1), rgba(240, 230, 255, .04) 45%, transparent);
  animation: dm-rime 2.4s ease 2.7s both;
}

.dm-edge__glint {
  position: absolute;
  width: calc(var(--moon-r, 200px) * .09);
  aspect-ratio: 1;
  translate: 50% -50%;
  background:
    linear-gradient(90deg, transparent 47%, rgba(255, 246, 255, .9) 50%, transparent 53%),
    linear-gradient(0deg, transparent 47%, rgba(255, 246, 255, .9) 50%, transparent 53%),
    radial-gradient(closest-side, rgba(255, 240, 255, .7), transparent 60%);
  opacity: 0;
  animation: dm-twinkle 6s ease-in-out calc(5s + var(--d)) infinite;
}

@keyframes dm-twinkle {
  0%, 100% { opacity: 0; transform: scale(.5); }
  12% { opacity: .8; transform: scale(1); }
  30% { opacity: 0; transform: scale(.6); }
}

/* ---- light theme: ink cracks and pale-blue frost on paper ---- */
:root[data-theme="parchment"] .dm-ghost {
  mix-blend-mode: multiply;
  opacity: .18;
}

:root[data-theme="parchment"] .dm-cracks__edge path {
  stroke: rgba(255, 255, 255, .7);
}

:root[data-theme="parchment"] .dm-cracks__shadow path {
  stroke: rgba(70, 40, 80, .45);
}

:root[data-theme="parchment"] .dm-seal__line,
:root[data-theme="parchment"] .dm-rime path {
  stroke: rgba(110, 120, 170, .5);
  filter: none;
}

:root[data-theme="parchment"] .dm-edge__frost,
:root[data-theme="parchment"] .dm-edge__fine {
  stroke: rgba(110, 120, 170, .4);
  filter: none;
}

:root[data-theme="parchment"] .dm-rime,
:root[data-theme="parchment"] .dm-edge__svg {
  filter: none;
}

:root[data-theme="parchment"] .dm-haze {
  background: linear-gradient(270deg, rgba(255, 255, 255, .5), transparent);
}

:root[data-theme="parchment"] .dm-flame__halo {
  opacity: .5;
}

/* small screens: the crack and the flame stay; the frost at the edge stays clear of the title */
@media (max-width: 900px) {
  .dm-edge {
    top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * .4);
    transform: scale(.75);
    transform-origin: 100% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dm-ghost,
  .dm-impact,
  .dm-cracks path,
  .dm-facet,
  .dm-char,
  .dm-seal,
  .dm-rime,
  .dm-haze,
  .dm-edge__grow,
  .dm-edge__glint {
    animation: none;
  }

  .dm-flamebox {
    display: none;
  }
}
</style>
