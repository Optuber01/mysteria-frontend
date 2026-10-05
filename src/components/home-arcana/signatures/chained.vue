<template>
  <!--
    Chained: the curse comes with the full moon. Two iron chains whip in from off-screen,
    lasso the moon and snap taut; on a castle tower a wolf throws back its head and howls
    at it; the chains strain once more, as though something inside wants out.
  -->
  <div ref="rootRef" class="chained" aria-hidden="true">
    <template v-if="layer === 'back'">
      <!-- the chains ride the moon (its box sinks with the scroll on its own) -->
      <div ref="moonRef" class="chained__moon">
        <div ref="riseRef" class="chained__scale">
          <div v-for="(loop, n) in LOOPS" :key="n" class="chained__loop" :class="`chained__loop--${n}`">
            <svg class="chained__svg" :viewBox="`${-VIEW_W} ${-VIEW_H} ${VIEW_W * 2} ${VIEW_H * 2}`" preserveAspectRatio="xMidYMid meet">
              <use
                  v-for="(l, i) in loop.links"
                  :key="i"
                  :href="l.face ? '#chained-link-face' : '#chained-link-edge'"
                  class="chained__link"
                  :style="{'--d': `${l.delay}ms`}"
                  :transform="`translate(${l.x} ${l.y}) rotate(${l.a})`"
              />
            </svg>
          </div>
        </div>
      </div>

      <!-- the wolf, on whichever tower top the deck leaves in view (in skyline-image pixels) -->
      <div class="chained__city">
        <svg class="chained__wolf" :class="`chained__wolf--${perch}`" viewBox="0 0 100 120">
          <g class="chained__wolf-rim">
            <use href="#chained-wolf-body"/>
            <use href="#chained-wolf-head"/>
          </g>
          <use href="#chained-wolf-body" class="chained__wolf-shape"/>
          <g class="chained__wolf-head">
            <use href="#chained-wolf-head" class="chained__wolf-shape"/>
          </g>
        </svg>
      </div>

      <svg class="chained__defs" width="0" height="0">
        <defs>
          <!-- a link seen face-on (a ring) and one seen edge-on (a bar): alternating, they read as a chain -->
          <g id="chained-link-face">
            <ellipse rx="7.2" ry="4.3" class="chained__iron-stroke" stroke-width="2.6"/>
            <path d="M-6.3 -2.7 A7.2 4.3 0 0 1 6.3 -2.7" class="chained__glint" stroke-width=".8"/>
          </g>
          <g id="chained-link-edge">
            <rect x="-8.6" y="-1.55" width="17.2" height="3.1" rx="1.55" class="chained__iron"/>
            <path d="M-7.2 -.85 H7.2" class="chained__glint" stroke-width=".6"/>
          </g>
          <!-- a wolf sitting on its haunches, facing left; the head pivots at the neck to howl -->
          <path
              id="chained-wolf-body"
              d="M56 44 C60 52 66 60 72 66 C82 74 88 86 87 100 C86.5 106 88 110 92 110 C97 109 100 104 100 99 C101.5 108 98 117 90 119.5 L88 120 L58 120 C56 120 55 119 55.5 117 L59 113 C57 108 54 104 49 103 C47 104 46 106 46 110 L46 117 C46 119 45 120 43 120 L35 120 C33 120 33 117.5 35 117 L37 98 C36 90 34 82 33 74 C32.5 66 31 60 30 54 L44 52 Z"
          />
          <path
              id="chained-wolf-head"
              d="M30 56 C29 50 28 45 26.5 41 L25 36.5 L22.6 33.6 C21 28 19 22 17.5 16 L16.4 12.4 L19.6 11.2 L15 7.2 L13.6 5.2 L17 4 C22 7 27 12 31 17 C33 18 35 17.5 37 16 L46 6.5 L45 19 C49 24 51 30 52 36 L55.5 37 L54 41 L57.8 43 L56 46 L58 52 L44 60 Z"
          />
        </defs>
      </svg>
    </template>
  </div>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, ref} from 'vue';
import {useMoonAnchor} from './sigKit';

defineOptions({name: 'SignatureChained'});
defineProps<{layer: 'back' | 'front'}>();

/*
 * The chains, in moon units: the moon's radius is 100, its centre the origin. A chain
 * looped over a ball and pulled toward one side leaves the limb along a tangent, so
 * each loop is: a straight run in from off-screen, tangent to the limb; a half-ellipse
 * over the moon's face; a straight run back out, parallel to the first.
 */
const VIEW_W = 720;
const VIEW_H = 420;
const PITCH = 10;

type Link = {x: number; y: number; a: number; face: boolean; delay: number};

function loopPath(pullDeg: number, bulge: number, runIn: number, runOut: number): [number, number][] {
  const d = (pullDeg * Math.PI) / 180;
  const dx = Math.cos(d);
  const dy = Math.sin(d);
  // the limb point where the chain comes over the edge: a quarter turn from the pull
  const px = 100 * Math.cos(d - Math.PI / 2);
  const py = 100 * Math.sin(d - Math.PI / 2);
  const pts: [number, number][] = [[px + dx * runIn, py + dy * runIn], [px, py]];
  for (let i = 1; i < 48; i++) {
    const t = (i / 48) * Math.PI;
    pts.push([Math.cos(t) * px - Math.sin(t) * bulge * dx, Math.cos(t) * py - Math.sin(t) * bulge * dy]);
  }
  pts.push([-px, -py], [-px + dx * runOut, -py + dy * runOut]);
  return pts;
}

/** Links every PITCH along the path, alternating face-on and edge-on; revealed from the far end in. */
function linksAlong(pts: [number, number][], duration: number, start: number): Link[] {
  const out: {x: number; y: number; a: number}[] = [];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const len = Math.hypot(x1 - x0, y1 - y0);
    const a = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
    while (carry <= len) {
      const t = carry / len;
      out.push({x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, a});
      carry += PITCH;
    }
    carry -= len;
  }
  const n = out.length;
  // fast off-screen, slowing as it wraps the moon
  return out.map((l, i) => ({
    x: +l.x.toFixed(1),
    y: +l.y.toFixed(1),
    a: +l.a.toFixed(1),
    face: i % 2 === 0,
    delay: Math.round(start + duration * Math.pow(i / n, 1.25)),
  }));
}

const LOOPS = [
  // both pulled away east, so nothing crosses the copy: one high, slung low over the moon's left side...
  {links: linksAlong(loopPath(-8, 62, 640, 640), 1150, 950)},
  // ...one low, slung high across it
  {links: linksAlong(loopPath(24, 58, 640, 640), 1150, 1120)},
];

/* the chains ride the moon: its scroll sink and its rise on arrival (see sigKit) */
const rootRef = ref<HTMLElement | null>(null);
const moonRef = ref<HTMLElement | null>(null);
const riseRef = ref<HTMLElement | null>(null);
useMoonAnchor(moonRef, riseRef);

/*
 * The wolf takes the castle tower whose top the deck leaves in view: the near tower when
 * its roof shows in the moon above the drawn card, else the tall tower beside it.
 */
const perch = ref<'near' | 'tall'>('near');
let resize: ResizeObserver | null = null;
let recheck = 0;

function choosePerch() {
  const el = rootRef.value;
  if (!el) return;
  const cs = getComputedStyle(el);
  const n = (k: string) => parseFloat(cs.getPropertyValue(k));
  const mx = n('--moon-x');
  const my = n('--moon-y');
  const r = n('--moon-r') * (n('--moon-scale') || 1);
  const left = n('--city-left');
  const bottom = n('--city-bottom');
  const h = n('--city-h');
  if (!r || !h) return;
  const k = h / 1080;
  const shows = (ix: number, iy: number) => {
    const x = left + ix * k;
    // the wolf's head, not its feet, decides
    const y = bottom - h + iy * k - 70 * k;
    const rx = (x - mx) / r;
    const ry = (y - my) / r;
    const d = Math.hypot(rx, ry);
    const card = Math.abs(rx) < 0.62 && ry > -0.5;
    const fan = d > 0.9 && d < 1.65 && ry < 0.4;
    return !card && !fan && x < el.clientWidth - 24;
  };
  perch.value = shows(1323, 222) || !shows(1508, 174) ? 'near' : 'tall';
}

onMounted(() => {
  choosePerch();
  // the hero places the scene once its fonts have settled: look again then
  recheck = window.setTimeout(choosePerch, 1200);
  if (rootRef.value) {
    resize = new ResizeObserver(choosePerch);
    resize.observe(rootRef.value);
  }
});

onUnmounted(() => {
  resize?.disconnect();
  clearTimeout(recheck);
});
</script>

<style scoped>
.chained {
  position: absolute;
  inset: 0;
  pointer-events: none;
  --iron: #16171c;
  --glint: #a3a8b4;
}

.chained__defs {
  position: absolute;
}

.chained__iron {
  fill: var(--iron);
}

.chained__iron-stroke {
  fill: none;
  stroke: var(--iron);
}

.chained__glint {
  fill: none;
  stroke: var(--glint);
  stroke-opacity: .5;
  stroke-linecap: round;
}

/* ---- the chains: a box on the moon, one moon-unit = radius / 100 ---- */
.chained__moon {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  aspect-ratio: 1;
}

.chained__scale {
  position: absolute;
  inset: 0;
  transform: scale(var(--moon-scale, 1));
}

.chained__loop {
  position: absolute;
  left: calc(50% - 50% * 7.2);
  top: calc(50% - 50% * 4.2);
  width: calc(100% * 7.2);
  height: calc(100% * 4.2);
  will-change: transform;
  /* snapped taut: a jolt inward, a small shudder, settled; then the strain, as something pushes out */
  animation:
    chained-taut 1s cubic-bezier(.2, .7, .3, 1) 2.15s backwards,
    chained-strain 1.3s ease-in-out 4.3s,
    chained-strain 1.3s ease-in-out 16s infinite;
}

.chained__loop--1 {
  animation-delay: 2.3s, 4.36s, 16.06s;
}

.chained__svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.chained__link {
  animation: chained-link .16s ease-out var(--d) backwards;
}

@keyframes chained-link {
  from { opacity: 0; }
}

@keyframes chained-taut {
  0% { transform: scale(1.035) rotate(-.6deg); }
  22% { transform: scale(.988) rotate(.35deg); }
  40% { transform: scale(1.006) rotate(-.2deg); }
  58% { transform: scale(.997) rotate(.1deg); }
  100% { transform: none; }
}

@keyframes chained-strain {
  0%, 100% { transform: none; }
  18% { transform: scale(1.012) translate(.15%, -.1%); }
  30% { transform: scale(1.004) translate(-.12%, .06%); }
  44% { transform: scale(1.016) translate(.1%, .08%); }
  62% { transform: scale(.998); }
}

/* ---- the wolf: a box over the skyline image, in its pixels ---- */
.chained__city {
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
}

.chained__wolf {
  position: absolute;
  /* 68 x 82 image pixels, sitting on the roof (its feet tucked a little behind the parapet) */
  width: calc(68 / 1920 * 100%);
  height: calc(82 / 1080 * 100%);
  overflow: visible;
  animation: chained-wolf-in .9s ease-out 1.9s backwards;
}

.chained__wolf--near {
  left: calc((1323 - 38) / 1920 * 100%);
  top: calc((222 - 82 + 9) / 1080 * 100%);
}

.chained__wolf--tall {
  left: calc((1508 - 38) / 1920 * 100%);
  top: calc((174 - 82 + 9) / 1080 * 100%);
}

.chained__wolf-shape {
  fill: #0a0a0e;
}

/* moonlight along the edge that faces the moon */
.chained__wolf-rim {
  fill: #b9bdcc;
  opacity: .45;
  transform: translate(-1.6px, .8px);
}

.chained__wolf-head {
  transform-box: view-box;
  transform-origin: 44px 50px;
  animation: chained-howl 1.1s cubic-bezier(.3, 0, .2, 1) 2.75s backwards;
}

@keyframes chained-wolf-in {
  from { opacity: 0; transform: translate3d(0, 10%, 0); }
}

/* head level, looking out; then thrown back, and the howl */
@keyframes chained-howl {
  0% { transform: rotate(-34deg); }
  30% { transform: rotate(-38deg); }
  100% { transform: none; }
}

/* light theme: ink on paper, never a black mass */
:root[data-theme="parchment"] .chained {
  --iron: #3a3640;
  --glint: #f4efe8;
}

:root[data-theme="parchment"] .chained__moon {
  opacity: .62;
}

:root[data-theme="parchment"] .chained__wolf-shape {
  fill: #2c2830;
}

:root[data-theme="parchment"] .chained__wolf-rim {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .chained__loop,
  .chained__link,
  .chained__wolf,
  .chained__wolf-head {
    animation: none;
  }
}
</style>
