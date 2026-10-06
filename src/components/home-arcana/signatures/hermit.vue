<template>
  <!--
    Hermit: the stars gather. Faint points drift together out of the violet night and settle
    into figures, joined for a while by hair-thin lines of light that come and go, as if
    someone were reading them; a cold violet arcane light settles round the moon and on
    the castle. No eyes, no books, no gears.
  -->
  <div class="hermit" :style="{'--lag': lag}" aria-hidden="true">
    <template v-if="layer === 'back'">
      <!-- the arcane light round whatever hangs in the sky -->
      <div ref="followRef" class="he-body">
        <i class="he-corona"></i>
      </div>

      <!-- the stars, gathering into figures (moon radii round the moon) -->
      <div class="he-sky">
        <div class="he-lines">
          <svg class="he-svg" viewBox="-400 -300 800 600" preserveAspectRatio="xMidYMid meet">
            <path v-for="(l, i) in LINES" :key="i" class="he-line" :d="l.d" :style="{'--d': l.d0}"/>
          </svg>
        </div>
        <i v-for="(s, i) in STARS" :key="i" class="he-star" :class="{'he-star--bright': s.bright}" :style="s.style"></i>
      </div>
    </template>

    <!-- the same light on the castle's moon side -->
    <div v-else class="he-city">
      <i class="he-rim" :style="{'--city-mask': `url(${city})`}"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import city from '../assets/moon/backlund-skyline.webp';
import {seeded, useMoonAnchor} from './sigKit';

defineOptions({name: 'SignatureHermit'});
const props = defineProps<{layer: 'back' | 'front'; from?: string}>();

/* the moon has to be up before its light changes */
const lag = computed(() => (!props.from || props.from === 'moon' ? '0s' : '.9s'));

const followRef = ref<HTMLElement | null>(null);
useMoonAnchor(followRef, ref(null));

const rnd = seeded(909);
const f2 = (n: number) => n.toFixed(2);

/*
 * Three figures in open sky round the moon (units: moon radius / 100, the moon at 0 0):
 * one high to the right, one high to the left, a small one low on the right. Stars are
 * points; edges join them in order.
 */
const FIGURES: {pts: [number, number][]; edges: [number, number][]}[] = [
  {pts: [[196, -150], [228, -118], [262, -132], [290, -96], [272, -58], [318, -70]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5]]},
  {pts: [[-262, -140], [-228, -166], [-190, -148], [-170, -106], [-206, -80], [-150, -184]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5]]},
  {pts: [[226, 18], [254, 44], [292, 30], [312, 64]], edges: [[0, 1], [1, 2], [2, 3]]},
];

/* each star comes from somewhere else in the sky and drifts to its place */
const STARS: {bright: boolean; style: Record<string, string>}[] = [];
FIGURES.forEach((f, k) =>
  f.pts.forEach(([x, y], i) => {
    STARS.push({
      bright: i === 0 || i === 3,
      style: {
        '--x': f2(x / 100), '--y': f2(y / 100),
        '--dx': f2((rnd() - .5) * 1.4), '--dy': f2((rnd() - .5) * 1),
        '--t': `${f2(k * .25 + rnd() * .5)}s`,
      },
    });
  }),
);
/* and a scatter of loose stars that never join a figure */
for (let i = 0; i < 22; i++) {
  const a = rnd() * Math.PI * 2;
  const r = 1.5 + rnd() * 2.1;
  STARS.push({
    bright: false,
    style: {
      '--x': f2(Math.cos(a) * r * 1.2), '--y': f2(Math.min(.8, Math.sin(a) * r * .75)),
      '--dx': f2((rnd() - .5) * .8), '--dy': f2((rnd() - .5) * .6), '--t': `${f2(rnd() * 1)}s`,
    },
  });
}

/* the lines, drawn one after another once the stars are in place */
let n = 0;
const LINES = FIGURES.flatMap(f =>
  f.edges.map(([a, b]) => {
    const [x0, y0] = f.pts[a]!;
    const [x1, y1] = f.pts[b]!;
    return {d: `M${x0} ${y0}L${x1} ${y1}`, d0: `${f2(n++ * .14)}s`};
  }),
);
</script>

<style scoped>
.hermit {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* ---- the violet light round the body ---- */
.he-body {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  aspect-ratio: 1;
  will-change: transform;
}

.he-corona {
  position: absolute;
  inset: -90%;
  border-radius: 50%;
  background: radial-gradient(circle closest-side,
      rgba(150, 100, 255, .28) 30%,
      rgba(140, 90, 240, .2) 38%,
      rgba(110, 70, 210, .08) 60%,
      transparent 100%);
  mix-blend-mode: screen;
  animation: he-in 3s ease-out calc(.6s + var(--lag)) backwards;
}

@keyframes he-in {
  from { opacity: 0; }
}

/* ---- the gathering stars ---- */
.he-sky {
  position: absolute;
  left: var(--moon-x, 72%);
  top: var(--moon-y, 48%);
  width: var(--moon-r, 200px);
  height: var(--moon-r, 200px);
}

.he-star {
  position: absolute;
  left: calc(var(--x) * 100% - 1px);
  top: calc(var(--y) * 100% - 1px);
  width: 2px;
  height: 2px;
  background: #e8dcff;
  box-shadow: 0 0 3px rgba(200, 170, 255, .7);
  opacity: .55;
  animation: he-gather 3.4s cubic-bezier(.3, .1, .2, 1) calc(.5s + var(--lag) + var(--t)) backwards;
}

.he-star--bright {
  left: calc(var(--x) * 100% - 1.5px);
  top: calc(var(--y) * 100% - 1.5px);
  width: 3px;
  height: 3px;
  opacity: .8;
}

@keyframes he-gather {
  0% { opacity: 0; transform: translate3d(calc(var(--moon-r, 200px) * var(--dx)), calc(var(--moon-r, 200px) * var(--dy)), 0); }
  30% { opacity: .5; }
}

/* the lines: one box sized like the sky round the moon (800 x 600 units = 8 x 6 radii) */
.he-lines {
  position: absolute;
  left: -400%;
  top: -300%;
  width: 800%;
  height: 600%;
  will-change: opacity;
  /* once drawn, they come and go together, very slowly */
  animation: he-read 9s ease-in-out calc(6.5s + var(--lag)) infinite alternate;
}

@keyframes he-read {
  to { opacity: .1; }
}

.he-svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.he-line {
  fill: none;
  stroke: #cdb8ff;
  stroke-width: .5;
  stroke-linecap: round;
  opacity: .5;
  vector-effect: non-scaling-stroke;
  animation: he-draw 1.4s ease-in-out calc(3.6s + var(--lag) + var(--d)) backwards;
}

@keyframes he-draw {
  from { opacity: 0; }
}

/* ---- front: violet light on the castle near the moon ---- */
.he-city {
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
}

.he-rim {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at calc(var(--moon-x, 72%) - var(--city-left, 0px)) calc(var(--moon-y, 48%) - var(--city-bottom, 100%) + var(--city-h, 600px)),
      rgba(170, 120, 255, .5) 0, rgba(140, 90, 230, .16) calc(var(--moon-r, 200px) * 1.6), transparent calc(var(--moon-r, 200px) * 2.8));
  -webkit-mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mix-blend-mode: screen;
  opacity: .6;
  animation: he-in 3s ease-out calc(1s + var(--lag)) backwards;
}

/* light theme: violet ink on the paper sky */
:root[data-theme="parchment"] .he-corona,
:root[data-theme="parchment"] .he-rim {
  mix-blend-mode: multiply;
  opacity: .35;
}

:root[data-theme="parchment"] .he-star {
  background: #5b3f9a;
  box-shadow: none;
}

:root[data-theme="parchment"] .he-line {
  stroke: #5b3f9a;
}

@media (prefers-reduced-motion: reduce) {
  .he-corona,
  .he-star,
  .he-lines,
  .he-line,
  .he-rim {
    animation: none;
  }
}
</style>
