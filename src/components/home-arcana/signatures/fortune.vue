<template>
  <!--
    Wheel of Fortune: a faint pearly aurora waves over the sky, and the liquid-silver ring
    round the moon shows itself as the mercury serpent: its head closes on its own tail,
    the ring turns once like a wheel, and the glints in the sky reshuffle on the same beat
    (the cycle restarts). Then it turns on, very slowly.
  -->
  <div aria-hidden="true">
    <template v-if="layer === 'back'">
      <!-- the aurora: two blurred ribbons, mint through violet to silver -->
      <div class="fo-aurora">
        <svg class="fo-svg" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="fo-pearl" x1="-340" y1="0" x2="300" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stop-color="#6ee7c0" stop-opacity="0"/>
              <stop offset=".22" stop-color="#6ee7c0"/>
              <stop offset=".48" stop-color="#a78bfa"/>
              <stop offset=".7" stop-color="#e6ecf4"/>
              <stop offset=".88" stop-color="#7fe8d0"/>
              <stop offset="1" stop-color="#7fe8d0" stop-opacity="0"/>
            </linearGradient>
            <filter id="fo-soft" x="-20%" y="-200%" width="140%" height="500%">
              <feGaussianBlur stdDeviation="9"/>
            </filter>
          </defs>
          <path class="fo-ribbon" d="M-360 -150 C-250 -230 -150 -120 -40 -205 S170 -250 300 -160" stroke="url(#fo-pearl)" filter="url(#fo-soft)"/>
          <path class="fo-ribbon fo-ribbon--thin" d="M-360 -140 C-250 -215 -150 -110 -40 -192 S170 -236 300 -148" stroke="url(#fo-pearl)"/>
        </svg>
      </div>

      <!-- the serpent round the moon, kept on the moon -->
      <div ref="followRef" class="fo-moon">
        <div ref="riseRef" class="fo-moon__rise">
          <svg class="fo-svg fo-ring" viewBox="-100 -100 200 200">
            <defs>
              <linearGradient id="fo-silver" x1="-110" y1="-110" x2="110" y2="110" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#ffffff"/>
                <stop offset=".3" stop-color="#b9c4d2"/>
                <stop offset=".5" stop-color="#f4f8ff"/>
                <stop offset=".72" stop-color="#8e9aac"/>
                <stop offset="1" stop-color="#e8eef6"/>
              </linearGradient>
            </defs>
            <circle class="fo-ring__plain" r="106"/>
          </svg>
          <div class="fo-wheel">
            <svg class="fo-svg" viewBox="-100 -100 200 200">
              <path class="fo-body" :d="BODY" fill="url(#fo-silver)"/>
              <path class="fo-scales" :d="SPINE"/>
              <g :transform="HEAD_AT">
                <g class="fo-head">
                  <path class="fo-jaw fo-jaw--low" d="M-2 1 C3 5.6 9 5.4 13.4 2.2 L3 .6 Z" fill="url(#fo-silver)"/>
                  <path d="M-4 -4.8 C1 -7 9 -6.8 14.4 -2.6 C15.8 -1.4 16 -.2 15 .4 L2 .6 C-1 2.6 -4 3.6 -6 3.4 C-6.4 .4 -5.8 -3 -4 -4.8 Z" fill="url(#fo-silver)"/>
                  <path class="fo-ridge" d="M-2 -3.6 C3 -5.2 8 -5 12 -2.6 M2 .6 L14 .3 M-1 -1.8 L4 -2.4"/>
                </g>
              </g>
            </svg>
          </div>
        </div>
      </div>

      <!-- glints of luck: one set gives way to another as the wheel completes its turn -->
      <div class="fo-stage">
        <i v-for="(g, i) in GLINTS" :key="i" class="fo-glint" :class="g.set" :style="{left: `${g.x}%`, top: `${g.y}%`}"></i>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {seeded, useMoonAnchor} from './sigKit';

defineProps<{layer: 'back' | 'front'}>();

const followRef = ref<HTMLElement | null>(null);
const riseRef = ref<HTMLElement | null>(null);
useMoonAnchor(followRef, riseRef);

/*
 * The serpent, in moon units (100 = r), on a ring just off the limb. Angles are clockwise
 * from the top. Its head sits at -48deg (upper left, where the fan leaves the limb clear) facing clockwise; the body runs back round the
 * moon, thinning, and the tail's tip ends in the jaws.
 */
const RING = 106;
const HEAD = -48;
const f1 = (n: number) => n.toFixed(1);
const at = (deg: number, r: number) => {
  const t = (deg * Math.PI) / 180;
  return [r * Math.sin(t), -r * Math.cos(t)];
};
const N = 160;
const outer: string[] = [];
const inner: string[] = [];
const spine: string[] = [];
for (let i = 0; i <= N; i++) {
  const t = i / N;
  const a = HEAD - 3 - t * 354;
  const hw = 2.9 * Math.pow(1 - t, .65) + .35;
  const [ox, oy] = at(a, RING + hw);
  const [ix, iy] = at(a, RING - hw);
  outer.push(`${f1(ox)} ${f1(oy)}`);
  inner.unshift(`${f1(ix)} ${f1(iy)}`);
  if (t < .9) spine.push(`${f1(at(a, RING)[0])} ${f1(at(a, RING)[1])}`);
}
const BODY = `M${outer.join(' L')} L${inner.join(' L')} Z`;
const SPINE = `M${spine.join(' L')}`;
const [hx, hy] = at(HEAD - 3, RING);
/* the head drawn facing +x; turned to the ring's clockwise tangent at its angle */
const HEAD_AT = `translate(${f1(hx)} ${f1(hy)}) rotate(${HEAD - 1}) scale(1.45)`;

/* two sets of glints in open sky (moon units), swapped as the wheel completes its turn */
const rnd = seeded(23);
const spot = () => {
  for (;;) {
    const x = -320 + rnd() * 580;
    const y = -210 + rnd() * 250;
    if (Math.hypot(x, y) > 200 && !(x < -200 && y > -90)) return {x: Number(f1(x)), y: Number(f1(y))};
  }
};
const GLINTS = [
  ...Array.from({length: 9}, () => ({...spot(), set: 'fo-glint--a'})),
  ...Array.from({length: 9}, () => ({...spot(), set: 'fo-glint--b'})),
];
</script>

<style scoped>
.fo-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* ---- the aurora (moon units from the moon's centre) ---- */
.fo-aurora {
  position: absolute;
  left: var(--moon-x, 72%);
  top: var(--moon-y, 48%);
  width: var(--moon-r, 200px);
  height: var(--moon-r, 200px);
  will-change: transform;
  opacity: .34;
  animation: fo-aurora-in 2.4s ease .2s both, fo-sway 18s ease-in-out 2.6s infinite alternate;
}

@keyframes fo-aurora-in {
  from { opacity: 0; }
}

@keyframes fo-sway {
  to { transform: translate3d(-6%, 4%, 0) scaleY(1.12); }
}

.fo-ribbon {
  fill: none;
  stroke-width: 34;
  stroke-linecap: round;
}

.fo-ribbon--thin {
  stroke-width: 1.2;
  opacity: .8;
}

/* ---- the serpent ring ---- */
.fo-moon {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  height: calc(var(--moon-r, 200px) * 2);
  will-change: transform;
}

.fo-moon__rise {
  position: absolute;
  inset: 0;
}

/* the plain liquid-silver ring it first seems to be */
.fo-ring__plain {
  fill: none;
  stroke: url(#fo-silver);
  stroke-width: 3.6;
  opacity: 0;
  animation: fo-plain 2.2s ease .5s both;
}

@keyframes fo-plain {
  0% { opacity: 0; }
  35% { opacity: .85; }
  75% { opacity: .85; }
  100% { opacity: 0; }
}

/* the wheel: it turns once when the jaws close, then on, very slowly */
.fo-wheel {
  position: absolute;
  inset: 0;
  filter: drop-shadow(0 0 2px rgba(220, 235, 255, .55));
  animation: fo-reveal 1s ease 1.4s both, fo-turn 2.3s cubic-bezier(.55, 0, .35, 1) 2.7s both, fo-drift 150s linear 5s infinite;
}

@keyframes fo-reveal {
  from { opacity: 0; }
}

@keyframes fo-turn {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fo-drift {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.fo-body,
.fo-head path:not(.fo-ridge) {
  stroke: rgba(36, 46, 62, .75);
  stroke-width: .5;
  stroke-linejoin: round;
}

.fo-scales {
  fill: none;
  stroke: rgba(70, 84, 104, .55);
  stroke-width: 1.4;
  stroke-dasharray: .6 2.4;
}

.fo-ridge {
  fill: none;
  stroke: rgba(40, 52, 70, .8);
  stroke-width: .5;
  stroke-linecap: round;
}

/* the jaws close on the tail */
.fo-jaw--low {
  transform-origin: 2px 0;
  animation: fo-bite .5s cubic-bezier(.5, 0, .2, 1.3) 2.15s both;
}

@keyframes fo-bite {
  from { transform: rotate(26deg); }
}

.fo-head {
  animation: fo-strike .6s cubic-bezier(.3, .6, .3, 1) 2s both;
}

@keyframes fo-strike {
  from { transform: translate(-5px, 0); }
}

/* ---- glints of luck ---- */
.fo-stage {
  position: absolute;
  left: var(--moon-x, 72%);
  top: var(--moon-y, 48%);
  width: var(--moon-r, 200px);
  height: var(--moon-r, 200px);
}

.fo-glint {
  position: absolute;
  width: 7%;
  aspect-ratio: 1;
  translate: -50% -50%;
  background:
    linear-gradient(90deg, transparent 46%, rgba(244, 240, 210, .9) 50%, transparent 54%),
    linear-gradient(0deg, transparent 46%, rgba(244, 240, 210, .9) 50%, transparent 54%),
    radial-gradient(closest-side, rgba(250, 246, 220, .6), transparent 60%);
}

.fo-glint--a {
  opacity: 0;
  animation: fo-glints-a 4.6s ease .6s both;
}

@keyframes fo-glints-a {
  0% { opacity: 0; transform: scale(.4); }
  20%, 82% { opacity: .75; transform: scale(1); }
  100% { opacity: 0; transform: scale(.2) rotate(90deg); }
}

.fo-glint--b {
  opacity: .7;
  animation: fo-glints-b .9s ease 5s both, fo-wink 6s ease-in-out 6s infinite;
}

.fo-glint--b:nth-child(3n) { animation-delay: 5s, 7.4s; }
.fo-glint--b:nth-child(3n + 1) { animation-delay: 5s, 9.1s; }

@keyframes fo-glints-b {
  from { opacity: 0; transform: scale(.2) rotate(-90deg); }
}

@keyframes fo-wink {
  50% { opacity: .2; }
}

/* ---- light theme: pewter on paper, a fainter aurora ---- */
:root[data-theme="parchment"] .fo-aurora {
  opacity: .22;
}

:root[data-theme="parchment"] .fo-wheel {
  filter: none;
}

:root[data-theme="parchment"] .fo-body,
:root[data-theme="parchment"] .fo-head path:not(.fo-ridge) {
  fill: #7c8796;
}

:root[data-theme="parchment"] .fo-ring__plain {
  stroke: #7c8796;
}

:root[data-theme="parchment"] .fo-glint {
  background:
    linear-gradient(90deg, transparent 46%, rgba(120, 110, 60, .7) 50%, transparent 54%),
    linear-gradient(0deg, transparent 46%, rgba(120, 110, 60, .7) 50%, transparent 54%);
}

@media (prefers-reduced-motion: reduce) {
  .fo-aurora,
  .fo-ring__plain,
  .fo-wheel,
  .fo-jaw--low,
  .fo-head,
  .fo-glint--a,
  .fo-glint--b {
    animation: none;
  }
}
</style>
