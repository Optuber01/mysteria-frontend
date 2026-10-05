<template>
  <!--
    Door: under the full moon, a tall arch is traced in starlight in the sky beside it and its
    two leaves swing open onto another space, a deeper, denser starfield than the sky around
    it. A few stars streak out of the doorway; then it closes to a faint seam of light. Now
    and then a star blinks out and reappears somewhere else (a Traveler's jump).
  -->
  <div class="door" aria-hidden="true">
    <template v-if="layer === 'back'">
      <i v-for="(j, i) in jumpers" :key="i" class="door__jump" :style="j"></i>
    </template>
    <div v-else class="door__arch">
      <!-- the other space, behind the leaves -->
      <div class="door__space">
        <svg class="door__stars" viewBox="-100 -100 200 200">
          <circle v-for="(s, i) in field" :key="i" :cx="s[0]" :cy="s[1]" :r="s[2]" :opacity="s[3]"/>
        </svg>
      </div>
      <!-- the two leaves of night sky that swing open -->
      <div class="door__leaves">
        <i class="door__leaf door__leaf--l"></i>
        <i class="door__leaf door__leaf--r"></i>
      </div>
      <!-- stars leaving through it -->
      <i v-for="(s, i) in streaks" :key="i" class="door__streak" :style="s"><i></i></i>
      <!-- the outline, traced in starlight, and the seam it closes to -->
      <svg class="door__frame" viewBox="0 0 100 200" preserveAspectRatio="none">
        <path class="door__glow" :d="ARCH" pathLength="1"/>
        <path class="door__line" :d="ARCH" pathLength="1"/>
      </svg>
      <i class="door__seam"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{layer: 'back' | 'front'}>();

/* the arch in a 100 x 200 box: straight jambs and a round head, drawn up one side and down the other */
const ARCH = 'M1 199 L1 50 A49 49 0 0 1 99 50 L99 199';

let seed = 31;
const rnd = (a: number, b: number) => {
  seed = (seed * 16807) % 2147483647;
  return a + ((seed - 1) / 2147483646) * (b - a);
};
const r1 = (n: number) => Math.round(n * 10) / 10;

/* a denser field than the sky outside: many faint, a few bright, crowded toward a band */
const field = Array.from({length: 150}, () => {
  const band = rnd(0, 1) < 0.45;
  const x = rnd(-100, 100);
  const y = band ? x * 0.35 + rnd(-22, 22) : rnd(-100, 100);
  const bright = rnd(0, 1) < 0.1;
  return [r1(x), r1(y), bright ? r1(rnd(1.1, 1.7)) : r1(rnd(0.35, 0.8)), bright ? 1 : r1(rnd(0.35, 0.85))];
});

/* stars that fly out of the doorway toward us: heading (deg from up) and when */
const streaks = [
  {a: -38, d: 1.75, l: 1.1},
  {a: 22, d: 1.95, l: 1.4},
  {a: -8, d: 2.2, l: 1.25},
  {a: 48, d: 2.45, l: 1},
  {a: -62, d: 2.6, l: 1.2},
].map(s => ({'--a': `${s.a}deg`, '--d': `${s.d}s`, '--l': String(s.l)}));

/* Traveler's jumps: three stars, each blinking out and turning up somewhere else (in % of the hero) */
const jumpers = [
  {p: [[58, 12], [83, 7], [66, 30]], t: 9, d: 2},
  {p: [[94, 40], [74, 18], [97, 8]], t: 11, d: 4.5},
  {p: [[52, 40], [62, 6], [88, 24]], t: 13, d: 6},
].map(j => ({
  '--x0': `${j.p[0]![0]}vw`, '--y0': String(j.p[0]![1] / 100),
  '--x1': `${j.p[1]![0]}vw`, '--y1': String(j.p[1]![1] / 100),
  '--x2': `${j.p[2]![0]}vw`, '--y2': String(j.p[2]![1] / 100),
  '--t': `${j.t}s`, '--d': `${j.d}s`,
}));
</script>

<style scoped>
.door {
  --star: #e6fbff;
  --line: #bff6f4;
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* ---- the arch: in the open sky right of the moon (and the deck) ---- */
.door__arch {
  --dw: calc(var(--moon-r, 200px) * .66);
  --dh: calc(var(--moon-r, 200px) * 1.4);
  position: absolute;
  left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * 2.1 - var(--dw) / 2);
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * 1.95);
  width: var(--dw);
  height: var(--dh);
  /* it stands in the air: its foot dissolves into the night */
  -webkit-mask-image: linear-gradient(180deg, #000 72%, transparent);
  mask-image: linear-gradient(180deg, #000 72%, transparent);
}

/* stacked: no sky is left beside the moon, so the door opens in the castle wall right of the card */
@media (max-width: 900px) {
  .door__arch {
    --dw: calc(var(--moon-r, 200px) * .62);
    --dh: calc(var(--moon-r, 200px) * 1.32);
    left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * 1.58 - var(--dw) / 2);
    top: calc(var(--moon-y, 48%) + var(--moon-r, 200px) * .2);
  }
}

/* the other space: deep blue, a teal haze, a dense turning field of stars */
.door__space {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: calc(var(--dw) / 2) calc(var(--dw) / 2) 0 0;
  background:
    radial-gradient(60% 40% at 40% 38%, rgba(62, 219, 208, .28), transparent 70%),
    radial-gradient(70% 50% at 70% 72%, rgba(90, 110, 255, .2), transparent 70%),
    linear-gradient(180deg, #071233, #0a1f45 60%, #06142e);
  animation: door-space 2.6s ease 1.3s both;
}

.door__stars {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(var(--dh) * 1.5);
  max-width: none;
  height: auto;
  aspect-ratio: 1;
  translate: -50% -50%;
  fill: var(--star);
  animation: door-turn 240s linear infinite;
}

/* the leaves: night sky, hinged at the jambs, opening toward us */
.door__leaves {
  position: absolute;
  inset: 0;
  perspective: calc(var(--dh) * 2.2);
}

.door__leaf {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50%;
  background:
    linear-gradient(180deg, rgba(160, 230, 240, .07), transparent 40%),
    linear-gradient(180deg, #0c1a3c, #0a1733);
  backface-visibility: hidden;
  opacity: 0;
}

.door__leaf--l {
  left: 0;
  border-radius: calc(var(--dw) / 2) 0 0 0;
  transform-origin: 0 50%;
  box-shadow: inset -1px 0 0 rgba(190, 246, 244, .35);
  animation: door-leaf-l 3.4s cubic-bezier(.5, 0, .3, 1) .6s both;
}

.door__leaf--r {
  right: 0;
  border-radius: 0 calc(var(--dw) / 2) 0 0;
  transform-origin: 100% 50%;
  box-shadow: inset 1px 0 0 rgba(190, 246, 244, .35);
  animation: door-leaf-r 3.4s cubic-bezier(.5, 0, .3, 1) .6s both;
}

/* in the doorway, swung shut at the end, the leaves read as one sheet of sky */
@keyframes door-leaf-l {
  0% { opacity: 0; transform: rotateY(0deg); }
  14% { opacity: 1; transform: rotateY(0deg); }
  34% { opacity: 1; transform: rotateY(-112deg); }
  70% { opacity: 1; transform: rotateY(-112deg); }
  90% { opacity: 1; transform: rotateY(0deg); }
  100% { opacity: 0; transform: rotateY(0deg); }
}

@keyframes door-leaf-r {
  0% { opacity: 0; transform: rotateY(0deg); }
  14% { opacity: 1; transform: rotateY(0deg); }
  34% { opacity: 1; transform: rotateY(112deg); }
  70% { opacity: 1; transform: rotateY(112deg); }
  90% { opacity: 1; transform: rotateY(0deg); }
  100% { opacity: 0; transform: rotateY(0deg); }
}

/* the space is only there while the door stands open */
@keyframes door-space {
  0% { opacity: 0; }
  12% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes door-turn {
  to { transform: rotate(1turn); }
}

/* ---- the outline of starlight ---- */
.door__frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  overflow: visible;
  fill: none;
}

.door__frame path {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  vector-effect: non-scaling-stroke;
  stroke-linecap: round;
}

.door__line {
  stroke: var(--line);
  stroke-width: 1.4;
  animation: door-trace .9s cubic-bezier(.4, 0, .3, 1) .55s both, door-frame-fade 1.4s ease 3.9s both;
}

.door__glow {
  stroke: rgba(62, 219, 208, .55);
  stroke-width: 6;
  filter: blur(3px);
  animation: door-trace .9s cubic-bezier(.4, 0, .3, 1) .55s both, door-glow-fade 1.4s ease 3.9s both;
}

@keyframes door-trace {
  to { stroke-dashoffset: 0; }
}

@keyframes door-frame-fade {
  to { opacity: .2; }
}

@keyframes door-glow-fade {
  to { opacity: 0; }
}

/* ---- what it closes to: a thin seam of light where the leaves meet ---- */
.door__seam {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  margin-left: -1px;
  background: linear-gradient(180deg, transparent, rgba(200, 248, 246, .8) 18%, rgba(200, 248, 246, .6) 80%, transparent);
  box-shadow: 0 0 8px rgba(62, 219, 208, .5);
  opacity: .45;
  animation: door-seam 1.2s ease 3.6s both, door-seam-breathe 7s ease-in-out 5s infinite;
}

@keyframes door-seam {
  from { opacity: 0; transform: scaleY(.3); }
}

@keyframes door-seam-breathe {
  50% { opacity: .22; }
}

/* ---- stars streaking out of the doorway ---- */
.door__streak {
  position: absolute;
  left: 50%;
  top: 46%;
  rotate: var(--a);
}

.door__streak > i {
  position: absolute;
  left: -1px;
  top: 0;
  width: 2px;
  height: calc(var(--dh) * .22);
  background: linear-gradient(180deg, #fff, rgba(190, 246, 244, .5) 30%, transparent);
  border-radius: 1px;
  opacity: 0;
  animation: door-streak 1.1s cubic-bezier(.5, 0, .9, .6) var(--d) both;
}

@keyframes door-streak {
  0% { opacity: 0; transform: translateY(0) scale(.4, .2); }
  15% { opacity: 1; }
  100% { opacity: 0; transform: translateY(calc(var(--dh) * -1.4 * var(--l))) scale(1.4, calc(1.6 * var(--l))); }
}

/* ---- Traveler's jumps in the sky behind the castle ---- */
.door__jump {
  position: absolute;
  left: 0;
  top: 0;
  width: 3px;
  height: 3px;
  background: var(--star);
  box-shadow: 0 0 6px rgba(200, 246, 255, .8);
  transform: translate(var(--x0), calc(var(--scene-h, 100vh) * var(--y0)));
  opacity: 0;
  animation: door-jump var(--t) linear var(--d) infinite;
}

/* shown, gone, shown somewhere else (each move happens while it is out) */
@keyframes door-jump {
  0% { transform: translate(var(--x0), calc(var(--scene-h, 100vh) * var(--y0))); opacity: 0; }
  4%, 26% { transform: translate(var(--x0), calc(var(--scene-h, 100vh) * var(--y0))); opacity: 1; }
  30% { transform: translate(var(--x0), calc(var(--scene-h, 100vh) * var(--y0))); opacity: 0; }
  31% { transform: translate(var(--x1), calc(var(--scene-h, 100vh) * var(--y1))); opacity: 0; }
  35%, 58% { transform: translate(var(--x1), calc(var(--scene-h, 100vh) * var(--y1))); opacity: 1; }
  62% { transform: translate(var(--x1), calc(var(--scene-h, 100vh) * var(--y1))); opacity: 0; }
  63% { transform: translate(var(--x2), calc(var(--scene-h, 100vh) * var(--y2))); opacity: 0; }
  67%, 92% { transform: translate(var(--x2), calc(var(--scene-h, 100vh) * var(--y2))); opacity: 1; }
  96%, 100% { transform: translate(var(--x2), calc(var(--scene-h, 100vh) * var(--y2))); opacity: 0; }
}

/* paper: the same door in ink-blue, never a black hole in the page */
:root[data-theme="parchment"] .door {
  --line: #1f8f88;
}

:root[data-theme="parchment"] .door__space {
  background:
    radial-gradient(60% 40% at 40% 38%, rgba(62, 219, 208, .3), transparent 70%),
    linear-gradient(180deg, #2b4f7e, #3a6a96 60%, #2b4f7e);
}

:root[data-theme="parchment"] .door__leaf {
  background: linear-gradient(180deg, #dfe8ee, #d5e0e8);
}

:root[data-theme="parchment"] .door__jump {
  background: #3d7d96;
  box-shadow: none;
}

:root[data-theme="parchment"] .door__seam {
  background: linear-gradient(180deg, transparent, rgba(31, 143, 136, .7) 18%, rgba(31, 143, 136, .5) 80%, transparent);
  box-shadow: none;
}

@media (prefers-reduced-motion: reduce) {
  .door__jump,
  .door__streak,
  .door__space,
  .door__leaf {
    display: none;
  }

  .door__line,
  .door__glow,
  .door__seam,
  .door__stars {
    animation: none;
  }

  .door__line {
    stroke-dashoffset: 0;
    opacity: .2;
  }

  .door__glow {
    opacity: 0;
  }
}
</style>
