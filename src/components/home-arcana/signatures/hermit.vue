<template>
  <!--
    Hermit: the stars come out and join into constellations, line by line. Then two vast
    lashless eyes made of stars open faintly in the sky above the moon (the Hidden Sage),
    look down, and close; the same stars redraw themselves into new figures.
  -->
  <div aria-hidden="true">
    <template v-if="layer === 'back'">
      <!-- the sky's fixed stars and their figures, laid out in moon radii from the moon (100 units = r) -->
      <div class="hm-stage">
        <svg class="hm-svg hm-stars" viewBox="0 0 100 100">
          <circle v-for="(s, i) in FIELD" :key="`f${i}`" :cx="s.x" :cy="s.y" :r="s.r" class="hm-dim"/>
          <circle v-for="(s, i) in STARS" :key="`s${i}`" :cx="s.x" :cy="s.y" :r="s.r" class="hm-star"/>
        </svg>
        <!-- the first figures, joined segment by segment, then let go -->
        <svg class="hm-svg hm-lines hm-lines--first" viewBox="0 0 100 100">
          <line v-for="(l, i) in FIRST" :key="i" v-bind="l.at" :style="{'--len': l.len, '--d': `${l.delay}s`}"/>
        </svg>
        <!-- after the eyes close: the same stars, new figures -->
        <svg class="hm-svg hm-lines hm-lines--second" viewBox="0 0 100 100">
          <line v-for="(l, i) in SECOND" :key="i" v-bind="l.at" :style="{'--len': l.len, '--d': `${l.delay}s`}"/>
        </svg>
        <i v-for="(g, i) in GLINTS" :key="`g${i}`" class="hm-glint" :style="{left: `${g.x}%`, top: `${g.y}%`, '--d': `${g.d}s`}"></i>
      </div>

      <!-- the Hidden Sage's eyes: lids and irises traced in stars, no lashes -->
      <div v-for="eye in EYES" :key="eye.side" class="hm-eye" :class="`hm-eye--${eye.side}`">
        <div class="hm-eye__open">
          <svg class="hm-eye__svg" viewBox="-90 -32 180 64">
            <path class="hm-eye__lid" :d="LID"/>
            <!-- the iris, held inside the lids as it turns -->
            <g clip-path="url(#hm-lid)">
              <g class="hm-eye__iris" :style="{'--gx': eye.gaze}">
                <circle class="hm-eye__ring" r="23"/>
                <circle v-for="(s, i) in IRIS_STARS" :key="i" :cx="s.x" :cy="s.y" :r="s.r" class="hm-eye__star"/>
              </g>
            </g>
            <circle v-for="(s, i) in LID_STARS" :key="i" :cx="s.x" :cy="s.y" :r="s.r" class="hm-eye__star"/>
          </svg>
        </div>
      </div>
      <svg class="hm-defs" width="0" height="0">
        <clipPath id="hm-lid"><path :d="LID"/></clipPath>
      </svg>
    </template>
  </div>
</template>

<script setup lang="ts">
import {seeded} from './sigKit';

defineProps<{layer: 'back' | 'front'}>();

type Pt = {x: number; y: number};
const rnd = seeded(9);
const f1 = (n: number) => Number(n.toFixed(1));

/*
 * The named stars, in units from the moon's centre (100 = one moon radius), all in sky
 * the fan of cards leaves open: upper right, the pocket right of the fan, and upper left
 * above the copy.
 */
const STAR_AT: [number, number, number][] = [
  // right of the fan, under the right eye (0-6)
  [142, -140, 1.9], [182, -132, 1.5], [222, -104, 2.2], [206, -66, 1.4], [176, -96, 1.6], [244, -140, 1.3], [246, -60, 1.2],
  // the pocket below (7-10)
  [196, -30, 1.6], [226, -8, 1.2], [206, 20, 1.8], [238, 40, 1.3],
  // upper left, above the copy and under the left eye (11-15)
  [-214, -118, 1.7], [-252, -138, 1.3], [-290, -112, 2], [-326, -134, 1.2], [-262, -96, 1.4],
];
const STARS = STAR_AT.map(([x, y, r]) => ({x, y, r}));
/* faint field stars around them */
const FIELD = Array.from({length: 46}, () => {
  const left = rnd() < .35;
  return {
    x: f1(left ? -340 + rnd() * 150 : 120 + rnd() * 140),
    y: f1(left ? -150 + rnd() * 60 : -150 + rnd() * 200),
    r: f1(.4 + rnd() * .6),
  };
}).filter(s => Math.hypot(s.x, s.y) > 192);

function link(pairs: [number, number][], start: number, step: number) {
  return pairs.map(([a, b], i) => {
    const p = STARS[a];
    const q = STARS[b];
    return {at: {x1: p.x, y1: p.y, x2: q.x, y2: q.y}, len: f1(Math.hypot(q.x - p.x, q.y - p.y)), delay: f1((start + i * step) * 100) / 100};
  });
}
/* first figures: a kite with a tail, a chain, a long dipper */
const FIRST = link([[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [2, 5], [7, 8], [8, 9], [9, 10], [11, 12], [12, 13], [13, 14], [13, 15]], .3, .08);
/* second figures: the same stars, joined otherwise */
const SECOND = link([[6, 1], [1, 0], [0, 4], [4, 7], [7, 9], [2, 6], [2, 3], [3, 8], [8, 10], [15, 11], [11, 13], [12, 14], [15, 13]], 4.25, .09);
/* a few of the brightest twinkle (HTML, so the big star layer never repaints) */
const GLINTS = [0, 2, 9, 13, 4].map((i, k) => ({x: STARS[i].x, y: STARS[i].y, d: k * 1.3}));

/* ---- the eyes ---- */
const LID = 'M-90 0 C-48 -44 48 -44 90 0 C48 36 -48 36 -90 0 Z';
function bez(t: number, p0: Pt, p1: Pt, p2: Pt, p3: Pt): Pt {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}
const LID_STARS: {x: number; y: number; r: number}[] = [];
for (const [c1, c2] of [[-44, -44], [36, 36]] as const) {
  const n = c1 < 0 ? 17 : 14;
  for (let i = 0; i <= n; i++) {
    const t = i / n + (rnd() - .5) * .02;
    const p = bez(Math.min(1, Math.max(0, t)), {x: -90, y: 0}, {x: -48, y: c1}, {x: 48, y: c2}, {x: 90, y: 0});
    LID_STARS.push({x: f1(p.x + (rnd() - .5) * 1.4), y: f1(p.y + (rnd() - .5) * 1.4), r: f1(.7 + rnd() * (i % 4 === 0 ? 1.1 : .5))});
  }
}
/* the iris: a ring of stars round a field of countless small ones, an empty pupil */
const IRIS_STARS: {x: number; y: number; r: number}[] = [];
for (let i = 0; i < 18; i++) {
  const a = (i / 18) * Math.PI * 2 + rnd() * .1;
  IRIS_STARS.push({x: f1(Math.cos(a) * 23), y: f1(Math.sin(a) * 23), r: f1(.8 + rnd() * .6)});
}
for (let i = 0; i < 70; i++) {
  const a = rnd() * Math.PI * 2;
  const d = 8.5 + Math.sqrt(rnd()) * 12.5;
  IRIS_STARS.push({x: f1(Math.cos(a) * d), y: f1(Math.sin(a) * d), r: f1(.3 + rnd() * .55)});
}
for (let i = 0; i < 10; i++) {
  const a = (i / 10) * Math.PI * 2;
  IRIS_STARS.push({x: f1(Math.cos(a) * 7.5), y: f1(Math.sin(a) * 7.5), r: .9});
}
/* each looks down and in, toward the moon below and between them */
const EYES = [{side: 'left', gaze: 1}, {side: 'right', gaze: -1}];
</script>

<style scoped>
.hm-stage {
  position: absolute;
  left: var(--moon-x, 72%);
  top: var(--moon-y, 48%);
  width: var(--moon-r, 200px);
  height: var(--moon-r, 200px);
}

.hm-svg {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.hm-stars {
  filter: drop-shadow(0 0 1.5px rgba(214, 196, 255, .9));
  animation: hm-in 1.4s ease .1s both;
}

@keyframes hm-in {
  from { opacity: 0; }
}

.hm-star {
  fill: #f1eaff;
}

.hm-dim {
  fill: #d8cbff;
  opacity: .55;
}

.hm-lines line {
  stroke: rgba(214, 198, 255, .42);
  stroke-width: .45;
  stroke-linecap: round;
  stroke-dasharray: var(--len);
  animation: hm-draw .5s cubic-bezier(.3, .2, .3, 1) var(--d) both;
}

@keyframes hm-draw {
  from { stroke-dashoffset: var(--len); }
}

/* the first figures let go once the eyes have closed */
.hm-lines--first {
  opacity: 0;
  animation: hm-unjoin .7s ease 3.85s both;
}

@keyframes hm-unjoin {
  from { opacity: 1; }
}

.hm-glint {
  position: absolute;
  width: 9%;
  aspect-ratio: 1;
  translate: -50% -50%;
  background:
    linear-gradient(90deg, transparent 47%, rgba(240, 232, 255, .8) 50%, transparent 53%),
    linear-gradient(0deg, transparent 47%, rgba(240, 232, 255, .8) 50%, transparent 53%),
    radial-gradient(closest-side, rgba(240, 232, 255, .55), transparent 55%);
  opacity: 0;
  animation: hm-twinkle 7s ease-in-out calc(5s + var(--d)) infinite;
}

@keyframes hm-twinkle {
  0%, 100% { opacity: 0; transform: scale(.5); }
  10% { opacity: .9; transform: scale(1); }
  24% { opacity: 0; transform: scale(.6); }
}

/* ---- the eyes: centred 1.5 radii either side of the moon, 1.8 above it ---- */
.hm-eye {
  --cx: -1.5;
  --cy: -1.8;
  position: absolute;
  left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * (var(--cx) - .9));
  top: calc(var(--moon-y, 48%) + var(--moon-r, 200px) * (var(--cy) - .32));
  width: calc(var(--moon-r, 200px) * 1.8);
  height: calc(var(--moon-r, 200px) * .64);
}

.hm-eye--right {
  --cx: 1.5;
}

/* they open (the almond widening from a line), look down, and close */
.hm-eye__open {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: scaleY(.03);
  animation: hm-lids 2.7s cubic-bezier(.4, 0, .3, 1) 1.2s both;
  filter: drop-shadow(0 0 1.5px rgba(220, 205, 255, .9));
}

@keyframes hm-lids {
  0% { opacity: 0; transform: scaleY(.03); }
  22% { opacity: .62; transform: scaleY(1); }
  78% { opacity: .62; transform: scaleY(1); }
  94% { opacity: .5; transform: scaleY(.04); }
  100% { opacity: 0; transform: scaleY(.03); }
}

.hm-eye__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.hm-eye__lid {
  fill: rgba(30, 18, 60, .16);
  stroke: rgba(210, 192, 255, .28);
  stroke-width: .5;
}

.hm-eye__star {
  fill: #f4efff;
}

.hm-eye__ring {
  fill: rgba(150, 120, 255, .08);
  stroke: rgba(210, 192, 255, .32);
  stroke-width: .5;
}

/* the iris turns down and in (units of the eye's own drawing) */
.hm-eye__iris {
  transform: translate(calc(var(--gx) * 12px), 11px);
  animation: hm-gaze 1s cubic-bezier(.4, 0, .3, 1) 1.95s both;
}

@keyframes hm-gaze {
  from { transform: translate(calc(var(--gx) * -3px), -2px); }
}

.hm-defs {
  position: absolute;
}

/* stacked: smaller, in the band between the title and the fan */
@media (max-width: 900px) {
  .hm-eye {
    --cx: -1.22;
    --cy: -2.06;
    transform: scale(.82);
  }

  .hm-eye--right {
    --cx: 1.22;
  }
}

/* ---- light theme: ink stars on paper ---- */
:root[data-theme="parchment"] .hm-star,
:root[data-theme="parchment"] .hm-eye__star {
  fill: #4b3c82;
}

:root[data-theme="parchment"] .hm-dim {
  fill: #6a5aa0;
  opacity: .4;
}

:root[data-theme="parchment"] .hm-lines line {
  stroke: rgba(75, 60, 130, .38);
}

:root[data-theme="parchment"] .hm-stars,
:root[data-theme="parchment"] .hm-eye__open {
  filter: none;
}

:root[data-theme="parchment"] .hm-eye__lid {
  fill: rgba(120, 100, 200, .08);
  stroke: rgba(75, 60, 130, .3);
}

:root[data-theme="parchment"] .hm-eye__ring {
  fill: rgba(120, 100, 200, .06);
  stroke: rgba(75, 60, 130, .3);
}

:root[data-theme="parchment"] .hm-glint {
  background:
    linear-gradient(90deg, transparent 47%, rgba(75, 60, 130, .6) 50%, transparent 53%),
    linear-gradient(0deg, transparent 47%, rgba(75, 60, 130, .6) 50%, transparent 53%);
}

/* still: the second figures drawn, no eyes */
@media (prefers-reduced-motion: reduce) {
  .hm-stars,
  .hm-lines line,
  .hm-lines--first,
  .hm-glint,
  .hm-eye__open,
  .hm-eye__iris {
    animation: none;
  }
}
</style>
