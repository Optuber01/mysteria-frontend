<template>
  <!--
    Moon: the full crimson moon (the base scene swells it) brightens, and a swarm of bats
    bursts from its face, scattering up and out across the sky and over our heads. A few
    stay, circling slowly in its light. No blood, no wolves: bats are the Moon's.
  -->
  <div ref="rootRef" class="moon" aria-hidden="true">
    <template v-if="layer === 'back'">
      <!-- the swell of light on the disc itself, so it rises and sinks with the moon -->
      <Teleport v-if="moonRise" :to="moonRise">
        <i class="moon__swell"></i>
      </Teleport>
      <i v-for="(b, i) in burst" :key="`b${i}`" class="moon__fly" :style="b.style">
        <i class="moon__fly-y">
          <svg class="moon__bat" viewBox="-50 -30 100 60" :style="b.bat">
            <path :d="BODY"/>
            <g v-for="f in FRAMES" :key="f.k" :class="`moon__f moon__f--${f.k}`"><path :d="f.d"/><path :d="f.d" transform="scale(-1 1)"/></g>
          </svg>
        </i>
      </i>
      <i v-for="(c, i) in circling" :key="`c${i}`" class="moon__orbit" :style="c.style">
        <i class="moon__orbit-x">
          <i class="moon__orbit-y">
            <svg class="moon__bat moon__bat--still" viewBox="-50 -30 100 60" :style="c.bat">
              <path :d="BODY"/>
              <g v-for="f in FRAMES" :key="f.k" :class="`moon__f moon__f--${f.k}`"><path :d="f.d"/><path :d="f.d" transform="scale(-1 1)"/></g>
            </svg>
          </i>
        </i>
      </i>
    </template>
    <template v-else>
      <!-- a few pass close, right over the viewer -->
      <i v-for="(b, i) in near" :key="`n${i}`" class="moon__fly" :style="b.style">
        <i class="moon__fly-y">
          <svg class="moon__bat" viewBox="-50 -30 100 60" :style="b.bat">
            <path :d="BODY"/>
            <g v-for="f in FRAMES" :key="f.k" :class="`moon__f moon__f--${f.k}`"><path :d="f.d"/><path :d="f.d" transform="scale(-1 1)"/></g>
          </svg>
        </i>
      </i>
    </template>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';

defineProps<{layer: 'back' | 'front'}>();

/* A bat seen from below, wings in three positions (up, spread, down), right wing only: the left is mirrored. */
const BODY = 'M-2.6 -9.6 L-2.1 -14.2 L-0.6 -10.2 Q0 -10.6 0.6 -10.2 L2.1 -14.2 L2.6 -9.6 Q4.2 -7.2 3.6 -3 Q4.4 2 2.2 9 Q0 11.5 -2.2 9 Q-4.4 2 -3.6 -3 Q-4.2 -7.2 -2.6 -9.6Z';
const FRAMES = [
  {k: 'up', d: 'M3 -3.4 C6.6 -10 11.6 -17.6 17.8 -22.6 L17.8 -26 L20.2 -23.8 C22.6 -25.6 25.4 -27.4 28.4 -29 Q25.4 -22.4 28.2 -15.8 Q22.2 -19 20.6 -11.2 Q15.6 -14 13.8 -5.8 Q9.4 -7.2 7.8 -0.8 Q5.6 0.2 3 3.2 Z'},
  {k: 'mid', d: 'M3 -3 C9 -7.6 18 -10.6 28 -10.8 L30 -13.4 L30.8 -10.4 C37 -9 43.4 -7 49.6 -4.4 Q45.4 -1.8 42.6 4.8 Q38.6 -3.4 33.4 2.8 Q29.4 -4.4 24.2 5.4 Q19.6 -2.2 13.4 6.4 Q8.6 1.4 3 5.2 Z'},
  {k: 'down', d: 'M3 -2.6 C9 -5.4 17 -7 24.6 -5.6 L26.4 -8.2 L27.2 -5 C31 -1 35 4.6 38.6 11.4 Q33.8 8.4 31.4 14.6 Q29.4 6.4 23.8 11 Q22.2 3.6 15.8 8 Q12.4 2.2 3 5.2 Z'},
];

/* the same swarm on every draw */
let seed = 18;
const rnd = (a: number, b: number) => {
  seed = (seed * 16807) % 2147483647;
  return a + ((seed - 1) / 2147483646) * (b - a);
};
const f2 = (n: number) => n.toFixed(2);

type Flight = {style: Record<string, string>; bat: Record<string, string>};
/* All distances in moon radii: the swarm keeps its shape at every size. */
function flight(i: number, n: number, near: boolean): Flight {
  const a0 = rnd(0, Math.PI * 2);
  const r0 = rnd(0.05, 0.55);
  const sx = Math.cos(a0) * r0;
  const sy = Math.sin(a0) * r0 - 0.25;
  // up and out: fanned across the upper half, every bat its own heading
  const th = (-90 + ((i + 0.5) / n - 0.5) * 210 + rnd(-9, 9)) * Math.PI / 180;
  const dist = near ? rnd(4.5, 6) : rnd(4.2, 7.4);
  return {
    style: {
      '--sx': f2(sx), '--sy': f2(sy),
      '--ex': f2(sx + Math.cos(th) * dist), '--ey': f2(sy + Math.sin(th) * dist * 0.72),
      '--d': `${f2((near ? 1.3 : 0.95) + rnd(0, 0.5) ** 1.5)}s`,
      '--t': `${f2(near ? rnd(1.2, 1.5) : rnd(2.1, 3))}s`,
    },
    bat: {
      '--s1': f2(near ? rnd(2.6, 3.4) : rnd(0.75, 1.35)),
      '--tilt': `${f2(Math.cos(th) * 18)}deg`,
      '--p': `${f2(rnd(0.2, 0.28))}s`,
      '--ph': `${f2(-rnd(0, 0.3))}s`,
    },
  };
}
const burst = Array.from({length: 30}, (_, i) => flight(i, 30, false));
const near = [flight(8, 12, true), flight(3, 12, true), flight(11, 12, true)];

/* the few that stay: loose loops in the moonlight, clear of the deck (centre, radii, period, size) */
const circling = [
  {cx: 1.85, cy: -0.3, a: 0.9, b: 0.28, t: 9, s: 0.58, d: 3.1, rev: false},
  {cx: 2.0, cy: 0.1, a: 0.55, b: 0.2, t: 6.6, s: 0.44, d: 3.5, rev: true},
  {cx: -2.25, cy: 0.35, a: 0.5, b: 0.18, t: 7.6, s: 0.46, d: 3.3, rev: false},
  {cx: 0.3, cy: -2.05, a: 1.5, b: 0.22, t: 12, s: 0.36, d: 3.8, rev: true},
].map(c => ({
  style: {
    '--cx': f2(c.cx), '--cy': f2(c.cy), '--a': f2(c.a), '--b': f2(c.b),
    '--t': `${c.t}s`, '--q': `${f2(-c.t / 4)}s`, '--d': `${c.d}s`, '--dir': c.rev ? 'alternate-reverse' : 'alternate',
  },
  bat: {'--s1': f2(c.s), '--tilt': '0deg', '--p': `${f2(rnd(0.3, 0.38))}s`, '--ph': `${f2(-rnd(0, 0.3))}s`},
}));

/* the scene's moon box, so the swell sits on the real disc */
const rootRef = ref<HTMLElement | null>(null);
const moonRise = ref<HTMLElement | null>(null);
onMounted(() => {
  moonRise.value = rootRef.value?.closest('.night')?.querySelector<HTMLElement>('.night__moon-rise') ?? null;
});
</script>

<style scoped>
.moon {
  --u: var(--moon-r, 200px);
  --bat: #13060a;
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* ---- the moon brightens before the swarm breaks from it ---- */
.moon__swell {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle closest-side, rgba(255, 120, 130, .34) 0, rgba(255, 90, 110, .26) 60%, rgba(255, 70, 90, .1) 92%, transparent);
  mix-blend-mode: screen;
  opacity: .5;
  animation: moon-swell 2.2s ease .3s both;
}

/* ---- a bat in flight: x and y eased apart, so every path curves ---- */
.moon__fly {
  position: absolute;
  left: var(--moon-x, 72%);
  top: var(--moon-y, 48%);
  translate: calc(var(--u) * var(--ex)) 0;
  animation: moon-fly-x var(--t) cubic-bezier(.35, .1, .55, 1) var(--d) both;
}

.moon__fly-y {
  position: absolute;
  translate: 0 calc(var(--u) * var(--ey));
  animation: moon-fly-y var(--t) cubic-bezier(.12, .55, .45, 1) var(--d) both;
}

.moon__bat {
  position: absolute;
  width: calc(var(--u) * .4);
  max-width: none;
  height: auto;
  aspect-ratio: 100 / 60;
  translate: -50% -50%;
  fill: var(--bat);
  overflow: visible;
  opacity: 0;
  transform: rotate(var(--tilt)) scale(var(--s1));
}

/* the swarm's timing lives on the flight; the bat inside follows it */
.moon__fly .moon__bat {
  animation: moon-bat var(--t) cubic-bezier(.2, .6, .4, 1) var(--d) both;
}

@keyframes moon-fly-x {
  from { translate: calc(var(--u) * var(--sx)) 0; }
}

@keyframes moon-fly-y {
  from { translate: 0 calc(var(--u) * var(--sy)); }
}

@keyframes moon-bat {
  0% { opacity: 0; transform: rotate(var(--tilt)) scale(.16); }
  10% { opacity: 1; }
  82% { opacity: 1; }
  100% { opacity: 0; transform: rotate(var(--tilt)) scale(var(--s1)); }
}

/* ---- wingbeats: up, spread, down, spread ---- */
.moon__f {
  opacity: 0;
  animation: var(--p) step-end var(--ph) infinite;
}

.moon__f--up { animation-name: moon-wing-up; }
.moon__f--mid { animation-name: moon-wing-mid; opacity: 1; }
.moon__f--down { animation-name: moon-wing-down; }

@keyframes moon-wing-up {
  0% { opacity: 1; }
  25%, 100% { opacity: 0; }
}

@keyframes moon-wing-mid {
  0% { opacity: 0; }
  25% { opacity: 1; }
  50% { opacity: 0; }
  75%, 100% { opacity: 1; }
}

@keyframes moon-wing-down {
  0%, 25% { opacity: 0; }
  50% { opacity: 1; }
  75%, 100% { opacity: 0; }
}

/* ---- the few that stay, looping slowly round the moon ---- */
.moon__orbit {
  position: absolute;
  left: calc(var(--moon-x, 72%) + var(--u) * var(--cx));
  top: calc(var(--moon-y, 48%) + var(--u) * var(--cy));
  animation: moon-arrive 1.6s ease var(--d) both;
}

.moon__orbit-x {
  position: absolute;
  animation: moon-orbit-x calc(var(--t) / 2) ease-in-out var(--d) infinite var(--dir);
}

.moon__orbit-y {
  position: absolute;
  animation: moon-orbit-y calc(var(--t) / 2) ease-in-out calc(var(--d) + var(--q)) infinite alternate;
}

.moon__bat--still {
  opacity: 1;
  transform: scale(var(--s1));
  animation: none;
}

@keyframes moon-orbit-x {
  from { transform: translateX(calc(var(--u) * var(--a) * -1)); }
  to { transform: translateX(calc(var(--u) * var(--a))); }
}

@keyframes moon-orbit-y {
  from { transform: translateY(calc(var(--u) * var(--b) * -1)) scale(.82); }
  to { transform: translateY(calc(var(--u) * var(--b))) scale(1.12); }
}

@keyframes moon-arrive {
  from { opacity: 0; }
}

@keyframes moon-swell {
  0% { opacity: 0; }
  45% { opacity: 1; }
}

/* paper: the bats in ink, a little lighter */
:root[data-theme="parchment"] .moon {
  --bat: #3a1d24;
}

:root[data-theme="parchment"] .moon__orbit {
  opacity: .75;
}

:root[data-theme="parchment"] .moon__swell {
  mix-blend-mode: normal;
  background: radial-gradient(circle closest-side, rgba(220, 70, 90, .16) 0, rgba(220, 70, 90, .1) 70%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .moon__fly {
    display: none;
  }

  .moon__swell,
  .moon__orbit,
  .moon__orbit-x,
  .moon__orbit-y,
  .moon__f {
    animation: none;
  }
}
</style>
