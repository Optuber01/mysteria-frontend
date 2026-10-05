<template>
  <!--
    Mother: vines climb the castle from the ground and run along its roofline, and blossoms
    open along the skyline in a wave. A moment later a few drop, drift down and sink back
    into the earth: bloom, then return to the land.
  -->
  <div v-if="layer === 'front'" class="mother" aria-hidden="true">
    <div class="mother__city">
      <svg class="mother__vines" :viewBox="`0 0 ${ROOF_W} ${ROOF_H}`" preserveAspectRatio="none">
        <path v-for="(v, i) in vines" :key="`v${i}`" class="mother__vine" :d="v.d" pathLength="1" :style="v.style"/>
        <path v-for="(v, i) in vines" :key="`h${i}`" class="mother__vine mother__vine--lit" :d="v.d" pathLength="1" :style="v.style"/>
        <path v-for="(l, i) in leaves" :key="`l${i}`" class="mother__leaf" :d="LEAF" :transform="l.t" :style="l.style"/>
      </svg>
      <i v-for="(b, i) in blooms" :key="`b${i}`" class="mother__bloom" :class="{'mother__bloom--rose': b.rose}" :style="b.style">
        <svg viewBox="-10 -10 20 20"><path :d="FLOWER"/><circle r="2.2"/></svg>
      </i>
      <i v-for="(f, i) in falls" :key="`f${i}`" class="mother__fall" :style="f.style">
        <i class="mother__fall-y">
          <svg class="mother__petal" viewBox="-10 -10 20 20"><path :d="FLOWER"/><circle r="2.2"/></svg>
        </i>
        <i class="mother__return"></i>
      </i>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ROOF_H, ROOF_W, TOWERS, roofAt} from './roofline';

defineProps<{layer: 'back' | 'front'}>();

/* a pointed leaf on its stalk (pointing right, base at 0,0) and a five-petalled blossom */
const LEAF = 'M0 0 C4 -5 11 -6 16 0 C11 6 4 5 0 0 Z';
const FLOWER = Array.from({length: 5}, (_, i) => {
  const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
  const b = a + Math.PI / 5;
  const c = a - Math.PI / 5;
  const p = (r: number, t: number) => `${(Math.cos(t) * r).toFixed(1)} ${(Math.sin(t) * r).toFixed(1)}`;
  return `M0 0 Q${p(9, c)} ${p(9, a)} Q${p(9, b)} 0 0Z`;
}).join(' ');

let seed = 11;
const rnd = (a: number, b: number) => {
  seed = (seed * 16807) % 2147483647;
  return a + ((seed - 1) / 2147483646) * (b - a);
};
const r1 = (n: number) => Math.round(n * 10) / 10;

/** A vine along the roof from x0 to x1 (image px), hugging just below the edge, gently waving. */
function roofVine(x0: number, x1: number, phase: number) {
  const pts: [number, number][] = [];
  const dir = Math.sign(x1 - x0);
  for (let x = x0; dir > 0 ? x <= x1 : x >= x1; x += dir * 6) {
    pts.push([x, roofAt(x) + 7 + Math.sin(x / 21 + phase) * 3.5]);
  }
  return pts;
}
/** A stem climbing a wall from the ground to the roof at x, swaying side to side. */
function climb(x: number, from: number, phase: number) {
  const top = roofAt(x) + 8;
  const pts: [number, number][] = [];
  for (let y = from; y >= top; y -= 8) pts.push([x + Math.sin(y / 34 + phase) * 9, y]);
  pts.push([x, top]);
  return pts;
}
/** A short tendril hanging off the roof, curling at its end. */
function drape(x: number, len: number, phase: number) {
  const y0 = roofAt(x) + 6;
  const pts: [number, number][] = [];
  for (let t = 0; t <= 1.001; t += 0.1) pts.push([x + Math.sin(t * 3.2 + phase) * 9 * t, y0 + len * t]);
  return pts;
}
const toD = (pts: [number, number][]) => 'M' + pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join(' L');

type Vine = {pts: [number, number][]; d: number; t: number};
const raw: Vine[] = [
  // from the ground up the keep's towers, then along the roof each way
  {pts: climb(TOWERS.left.x0 + 6, 1060, 0), d: 0.6, t: 1.2},
  {pts: climb(TOWERS.right.x1 - 6, 1060, 1.3), d: 0.75, t: 1.2},
  {pts: climb(760, 1060, 2.1), d: 0.9, t: 1},
  {pts: roofVine(TOWERS.left.x0, 700, 0.4), d: 1.6, t: 1.6},
  {pts: roofVine(TOWERS.left.x0, TOWERS.right.x1, 1.2), d: 1.6, t: 1.3},
  {pts: roofVine(TOWERS.right.x1, 1910, 2.2), d: 1.75, t: 1.3},
  ...[820, 1010, 1180, 1400, 1520, 1690, 1840].map((x, i) => ({pts: drape(x, rnd(40, 90), i), d: 2.3 + i * 0.08, t: 0.7})),
];
const vines = raw.map(v => ({d: toD(v.pts), style: {'--d': `${v.d}s`, '--t': `${v.t}s`}}));

/* leaves along every vine, appearing as it grows past them */
const leaves = raw.flatMap(v => {
  const out: {t: string; style: Record<string, string>}[] = [];
  for (let i = 4; i < v.pts.length - 2; i += 5 + Math.floor(rnd(0, 4))) {
    const [x, y] = v.pts[i]!;
    const [nx, ny] = v.pts[i + 1]!;
    const along = Math.atan2(ny - y, nx - x) * 180 / Math.PI;
    const side = i % 2 ? 1 : -1;
    out.push({
      t: `translate(${r1(x)} ${r1(y)}) rotate(${r1(along + side * rnd(40, 70))}) scale(${r1(rnd(0.7, 1.1) * 10) / 10})`,
      style: {'--d': `${(v.d + v.t * (i / v.pts.length)).toFixed(2)}s`},
    });
  }
  return out;
});

/* blossoms along the skyline: the wave runs left to right; a few are rose, after the crimson moon */
const pct = (x: number, y: number) => ({left: `${r1((x / ROOF_W) * 100)}%`, top: `${r1((y / ROOF_H) * 100)}%`});
const blooms: {rose: boolean; style: Record<string, string>}[] = [];
for (let x = 720; x < 1900; x += rnd(34, 62)) {
  // only where the roof runs level enough to hold a flower (not on a tower's sheer side)
  if (Math.abs(roofAt(x + 8) - roofAt(x - 8)) > 30) continue;
  blooms.push({
    rose: rnd(0, 1) < 0.25,
    style: {...pct(x, roofAt(x) + rnd(0, 10)), '--d': `${(2.2 + ((x - 720) / 1180) * 1.5).toFixed(2)}s`, '--s': r1(rnd(0.7, 1.15)).toString()},
  });
}
/* the ones that fall: from the roof down to the ground, where they sink back in */
const falls = [980, 1210, 1450, 1640, 1790].map((x, i) => ({
  style: {
    ...pct(x, roofAt(x)),
    '--fall': `${r1(((1030 - roofAt(x)) / ROOF_H) * 100)}cqh`,
    '--d': `${(4.4 + i * 0.35).toFixed(2)}s`,
    '--t': `${r1(rnd(3.2, 4.2))}s`,
    '--sway': `${Math.round(rnd(14, 26))}px`,
  },
}));
</script>

<style scoped>
.mother {
  --vine: #1f4a2c;
  --vine-lit: #8fdc8a;
  --leaf: #2f6a3a;
  --petal: #f4edcf;
  --heart: #e2b34a;
  --rose: #f0a2a8;
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* everything is laid out on the skyline image's own box */
.mother__city {
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
  container-type: size;
}

.mother__vines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  overflow: visible;
  fill: none;
  /* the stems rise out of the dark streets: they fade toward the ground */
  -webkit-mask-image: linear-gradient(180deg, #000 52%, transparent 80%);
  mask-image: linear-gradient(180deg, #000 52%, transparent 80%);
}

/* ---- vines, drawn as they grow ---- */
.mother__vine {
  stroke: var(--vine);
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: mother-grow var(--t) cubic-bezier(.4, .1, .4, 1) var(--d) both;
}

/* moonlight along the top of each stem */
.mother__vine--lit {
  stroke: var(--vine-lit);
  stroke-width: 1.6;
  opacity: .75;
  translate: 0 -1.6px;
}

@keyframes mother-grow {
  to { stroke-dashoffset: 0; }
}

.mother__leaf {
  fill: var(--leaf);
  stroke: var(--vine-lit);
  stroke-width: .8;
  stroke-opacity: .5;
  animation: mother-leaf .5s ease-out var(--d) both;
}

@keyframes mother-leaf {
  from { opacity: 0; }
}

/* ---- blossoms ---- */
.mother__bloom,
.mother__fall {
  position: absolute;
  width: 0;
  height: 0;
}

.mother__bloom svg,
.mother__petal {
  position: absolute;
  left: -.9cqh;
  top: -.9cqh;
  width: 1.8cqh;
  max-width: none;
  height: auto;
  fill: var(--petal);
  overflow: visible;
}

.mother__bloom svg circle,
.mother__petal circle {
  fill: var(--heart);
}

.mother__bloom--rose svg {
  fill: var(--rose);
}

.mother__bloom svg {
  transform: scale(var(--s)) rotate(20deg);
  animation: mother-bloom .9s cubic-bezier(.3, 1.5, .5, 1) var(--d) both;
  filter: drop-shadow(0 0 3px rgba(255, 240, 190, .45));
}

@keyframes mother-bloom {
  from { opacity: 0; transform: scale(0) rotate(-60deg); }
}

/* ---- the fall, and the return to the land ---- */
.mother__fall {
  animation: mother-fall-x var(--t) ease-in-out var(--d) both;
}

.mother__fall-y {
  position: absolute;
  animation: mother-fall-y var(--t) cubic-bezier(.4, .1, .6, 1) var(--d) both;
}

.mother__petal {
  opacity: 0;
  animation: mother-petal var(--t) linear var(--d) both;
}

/* where it lands, the earth takes it in with a faint warm light */
.mother__return {
  position: absolute;
  left: -2cqh;
  top: calc(var(--fall) - 1cqh);
  width: 4cqh;
  height: 2cqh;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(217, 242, 122, .45), transparent);
  opacity: 0;
  animation: mother-return 2.4s ease-out calc(var(--d) + var(--t) * .9) both;
}

@keyframes mother-fall-x {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(var(--sway)); }
  50% { transform: translateX(calc(var(--sway) * -.6)); }
  75% { transform: translateX(calc(var(--sway) * .4)); }
}

@keyframes mother-fall-y {
  from { transform: translateY(0); }
  to { transform: translateY(var(--fall)); }
}

@keyframes mother-petal {
  0% { opacity: 0; transform: rotate(0) scale(.9); }
  6% { opacity: 1; }
  88% { opacity: .9; transform: rotate(320deg) scale(.8); }
  100% { opacity: 0; transform: rotate(340deg) scale(.15, .05); }
}

@keyframes mother-return {
  0% { opacity: 0; transform: scale(.4); }
  30% { opacity: 1; }
  100% { opacity: 0; transform: scale(1.4); }
}

/* paper: the same garden in ink and watercolour */
:root[data-theme="parchment"] .mother {
  --vine: #4f7a55;
  --vine-lit: #2f5e38;
  --leaf: #6a9a6c;
  --petal: #fffaf0;
  --heart: #d8a23a;
}

:root[data-theme="parchment"] .mother__bloom svg {
  filter: drop-shadow(0 0 1px rgba(90, 110, 80, .6));
}

@media (prefers-reduced-motion: reduce) {
  .mother__fall {
    display: none;
  }

  .mother__vine,
  .mother__leaf,
  .mother__bloom svg {
    animation: none;
  }

  .mother__vine {
    stroke-dashoffset: 0;
  }
}
</style>
