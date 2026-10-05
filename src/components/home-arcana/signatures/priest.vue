<template>
  <!--
    Red Priest: the horizon burns behind the hills as if a city were under siege beyond
    them; a flight of fire ravens bursts up out of the glow and crosses the moon's face in
    formation, and a blazing meteor streaks down behind the castle and flares on the
    horizon. Everything plays behind the skyline, so the castle stands black against it.
  -->
  <div aria-hidden="true">
    <template v-if="layer === 'back'">
      <!-- the siege glow beyond the hills -->
      <div class="pr-horizon">
        <i class="pr-horizon__band"></i>
        <i class="pr-horizon__fire pr-horizon__fire--a"></i>
        <i class="pr-horizon__fire pr-horizon__fire--b"></i>
        <i class="pr-horizon__fire pr-horizon__fire--c"></i>
      </div>

      <!-- the meteor: it falls behind the castle, and the horizon flares where it lands -->
      <div class="pr-impact">
        <i class="pr-flare"></i>
        <div class="pr-meteor-path">
          <i class="pr-meteor"></i>
        </div>
      </div>

      <!-- the fire ravens, in formation -->
      <div class="pr-flight">
        <div class="pr-formation">
          <div v-for="(b, i) in RAVENS" :key="i" class="pr-raven" :style="{'--x': b.x, '--y': b.y, '--s': b.s, '--d': `${b.d}s`}">
            <i class="pr-raven__trail"></i>
            <i class="pr-raven__glow"></i>
            <svg class="pr-raven__svg" viewBox="-42 -70 84 140">
              <g class="pr-raven__wings">
                <g class="pr-raven__flame">
                  <path :d="FLAMES" fill="url(#pr-flame)"/>
                  <path :d="FLAMES" fill="url(#pr-flame)" transform="scale(1 -1)"/>
                </g>
                <path class="pr-raven__wing" :d="WING"/>
                <path class="pr-raven__wing" :d="WING" transform="scale(1 -1)"/>
              </g>
              <path class="pr-raven__body" :d="BODY"/>
            </svg>
          </div>
        </div>
      </div>
      <svg class="pr-defs" width="0" height="0">
        <defs>
          <linearGradient id="pr-flame" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#ff3d12" stop-opacity="0"/>
            <stop offset=".45" stop-color="#ff6a1c" stop-opacity=".85"/>
            <stop offset=".85" stop-color="#ffc04a"/>
            <stop offset="1" stop-color="#fff0b0"/>
          </linearGradient>
        </defs>
      </svg>
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps<{layer: 'back' | 'front'}>();

/*
 * A raven seen from below, flying toward +x: heavy beak, thick throat, wedge tail, long
 * "fingered" primaries spread at the wingtip. Units: the body is ~74 long.
 */
const BODY = [
  'M36 0 C32 -1.2 29 -2.3 26 -3 C24 -5.4 20 -6.4 16.5 -5.8 C12.5 -5.4 9 -7 4 -7.8',
  'C-4 -8.6 -12 -6.6 -17 -4.6 L-20.5 -7.2 C-25.5 -9.4 -31 -8.2 -36 -3.4 L-39 0 L-36 3.4',
  'C-31 8.2 -25.5 9.4 -20.5 7.2 L-17 4.6 C-12 6.6 -4 8.6 4 7.8 C9 7 12.5 5.4 16.5 5.8',
  'C20 6.4 24 5.4 26 3 C29 2.3 32 1.2 36 0 Z',
].join(' ');
const WING = [
  'M10 -6 C13 -16 14 -26 10.5 -35 L6.5 -45',
  'L4.5 -61 L1.8 -54.5 L-0.8 -64 L-2.6 -55 L-5.6 -62.5 L-6.4 -53.5 L-9.6 -58.5 L-9.8 -50.5 L-13 -53 L-12.4 -45',
  'C-15.4 -36 -15.6 -23 -13.6 -14.5 C-12.4 -10 -9.5 -7 -6 -6 Z',
].join(' ');
/* tongues of fire streaming back off the trailing edge and the fingers */
const FLAMES = [
  [-13.6, -15], [-15.2, -24], [-15.2, -33], [-13.2, -43], [-11, -52], [-8, -58.5], [-3.5, -62.5],
].map(([x, y], i) => {
  // each tongue licks back and curls a little outward at its tip, some longer than others
  const len = [16, 24, 13, 27, 18, 22, 12][i];
  const curl = (i % 2 ? -1 : 1) * 2.2 - 1.4;
  const w = 3.4 - i * .18;
  return `M${x + 2.5} ${y - w} C${x - len * .3} ${y - w - 2.6} ${x - len * .7} ${y + curl - 1.4} ${x - len} ${y + curl}`
    + ` C${x - len * .62} ${y + curl + 1.6} ${x - len * .3} ${y + w + .4} ${x + 2.5} ${y + w} Z`;
}).join(' ');

/* a V of six: the lead at the point, the rest trailing back and out (formation units, moon radii) */
const RAVENS = [
  {x: 0, y: 0, s: 1.12, d: 0},
  {x: -.38, y: -.26, s: 1, d: .13},
  {x: -.4, y: .28, s: .96, d: .27},
  {x: -.76, y: -.5, s: .9, d: .06},
  {x: -.8, y: .55, s: .92, d: .21},
  {x: -1.15, y: -.74, s: .82, d: .33},
];
</script>

<style scoped>
.pr-defs {
  position: absolute;
}

/* ---- the burning horizon ---- */
.pr-horizon {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * 1.1);
  height: calc(var(--city-bottom, 100%) - var(--moon-y, 48%) + var(--moon-r, 200px) * 1.1 - var(--city-h, 600px) * .2);
  animation: pr-rise 2.2s cubic-bezier(.2, .7, .3, 1) .3s both;
}

@keyframes pr-rise {
  from { opacity: 0; transform: translate3d(0, 12%, 0); }
}

.pr-horizon__band {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(140, 34, 14, .2) 34%, rgba(214, 74, 24, .36) 62%, rgba(255, 120, 44, .5) 86%, rgba(255, 150, 60, .42) 100%);
}

.pr-horizon__fire {
  position: absolute;
  bottom: -14%;
  height: 78%;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(255, 170, 70, .55), rgba(255, 96, 30, .3) 45%, rgba(190, 40, 14, .1) 72%, transparent);
  animation: pr-flicker 3.4s ease-in-out infinite alternate;
}

.pr-horizon__fire--a {
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px) * 2.4);
  width: calc(var(--moon-r, 200px) * 2.6);
  animation-duration: 2.7s;
}

.pr-horizon__fire--b {
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px) * .4);
  width: calc(var(--moon-r, 200px) * 2.2);
  height: 92%;
  animation-duration: 3.9s;
  animation-delay: -1.2s;
}

.pr-horizon__fire--c {
  left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * 1.4);
  width: calc(var(--moon-r, 200px) * 2.4);
  animation-duration: 3.1s;
  animation-delay: -2s;
}

@keyframes pr-flicker {
  0% { opacity: .75; }
  35% { opacity: 1; }
  60% { opacity: .82; }
  100% { opacity: .95; }
}

/* ---- the meteor ---- */
/* the landing point, behind the rooftops to the castle's right; the path comes in from the upper right */
.pr-impact {
  position: absolute;
  left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * 1.75);
  top: calc(var(--moon-y, 48%) + var(--moon-r, 200px) * .78);
  width: 0;
  height: 0;
}

/* its core sits on the roofline, just above where the meteor went down */
.pr-flare {
  position: absolute;
  left: calc(var(--moon-r, 200px) * -1.5);
  top: calc(var(--moon-r, 200px) * -1.1);
  width: calc(var(--moon-r, 200px) * 3);
  height: calc(var(--moon-r, 200px) * 1.6);
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(255, 236, 180, .85), rgba(255, 176, 80, .6) 18%, rgba(255, 110, 40, .3) 45%, rgba(220, 70, 24, .1) 70%, transparent);
  opacity: .42;
  animation: pr-flare 2.6s cubic-bezier(.2, .8, .3, 1) 2.9s both, pr-flicker 4.2s ease-in-out 5.2s infinite alternate;
}

@keyframes pr-flare {
  0% { opacity: 0; transform: scale(.3); }
  12% { opacity: .95; transform: scale(.85); }
  100% { opacity: .42; transform: scale(1); }
}

/* the path, turned to the meteor's heading (steeply down and a little to the left) */
.pr-meteor-path {
  position: absolute;
  left: 0;
  top: 0;
  transform: rotate(102deg);
  transform-origin: 0 0;
}

.pr-meteor {
  position: absolute;
  right: 0;
  top: calc(var(--moon-r, 200px) * -.07);
  width: calc(var(--moon-r, 200px) * 1.4);
  height: calc(var(--moon-r, 200px) * .14);
  background:
    radial-gradient(closest-side, #fffbe8, rgba(255, 220, 140, .9) 40%, transparent) right center / calc(var(--moon-r, 200px) * .14) 100% no-repeat,
    linear-gradient(90deg, transparent, rgba(255, 90, 30, .35) 45%, rgba(255, 170, 80, .8) 86%, rgba(255, 240, 200, .95)) center / 100% 34% no-repeat,
    linear-gradient(90deg, transparent 30%, rgba(255, 120, 40, .22) 80%, rgba(255, 180, 90, .4)) center / 100% 100% no-repeat;
  border-radius: 50%;
  opacity: 0;
  /* from 3.5 radii out along the path, gathering speed, gone where it meets the horizon */
  animation: pr-fall 1.25s cubic-bezier(.4, 0, .85, .75) 1.7s both;
}

@keyframes pr-fall {
  0% { transform: translate3d(-250%, 0, 0); opacity: 0; }
  8% { opacity: 1; }
  92% { opacity: 1; }
  100% { transform: translate3d(0, 0, 0); opacity: 0; }
}

/* ---- the fire ravens ---- */
/* the flight is laid out in moon radii (the box is one radius square) and starts at the moon's centre */
.pr-flight {
  position: absolute;
  left: var(--moon-x, 72%);
  top: var(--moon-y, 48%);
  width: var(--moon-r, 200px);
  height: var(--moon-r, 200px);
  opacity: 0;
  /* up out of the glow behind the castle, across the moon's face, away to the upper right; once, then now and then */
  animation: pr-fly 30s linear .9s infinite;
}

@keyframes pr-fly {
  0% { transform: translate3d(-160%, 80%, 0); opacity: 0; }
  2% { opacity: 1; }
  3.2% { transform: translate3d(-75%, -25%, 0); }
  5.6% { transform: translate3d(10%, -80%, 0); }
  12.4% { transform: translate3d(240%, -250%, 0); opacity: 1; }
  13.4%, 100% { transform: translate3d(270%, -270%, 0); opacity: 0; }
}

.pr-formation {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-36deg);
  transform-origin: 0 0;
}

.pr-raven {
  position: absolute;
  left: calc(var(--x) * 100%);
  top: calc(var(--y) * 100%);
  width: calc(22% * var(--s));
  height: calc(38% * var(--s));
  translate: -50% -50%;
  animation: pr-bob 1.3s ease-in-out var(--d) infinite alternate;
}

@keyframes pr-bob {
  to { transform: translate3d(-6%, 9%, 0); }
}

/* the fire it trails */
.pr-raven__trail {
  position: absolute;
  right: 62%;
  top: 44%;
  width: 260%;
  height: 12%;
  border-radius: 50%;
  background: linear-gradient(90deg, transparent, rgba(255, 70, 20, .16) 40%, rgba(255, 130, 40, .5) 85%, rgba(255, 200, 110, .7));
}

.pr-raven__glow {
  position: absolute;
  inset: -40% -90%;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(255, 140, 50, .4), rgba(255, 80, 20, .14) 50%, transparent);
}

.pr-raven__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.pr-raven__body {
  fill: #1c0a06;
  stroke: #ff9a40;
  stroke-width: .9;
  stroke-opacity: .7;
}

.pr-raven__wing {
  fill: #23100a;
  stroke: #ffa34a;
  stroke-width: 1;
  stroke-linejoin: round;
}

/* the wingbeat: seen from below, the wings shorten as they sweep */
.pr-raven__wings {
  transform-box: view-box;
  transform-origin: 50% 50%;
  animation: pr-flap .46s cubic-bezier(.45, 0, .55, 1) var(--d) infinite alternate;
}

@keyframes pr-flap {
  to { transform: scale(.92, .4); }
}

.pr-raven__flame {
  animation: pr-burn .18s steps(2) infinite alternate;
}

@keyframes pr-burn {
  to { opacity: .7; }
}

/* ---- light theme: the same war over paper, as a warm wash and ink birds ---- */
:root[data-theme="parchment"] .pr-horizon__band {
  background: linear-gradient(180deg, transparent 0%, rgba(214, 90, 40, .1) 40%, rgba(226, 110, 50, .2) 80%, rgba(230, 130, 60, .16) 100%);
}

:root[data-theme="parchment"] .pr-horizon__fire {
  background: radial-gradient(closest-side, rgba(240, 130, 60, .3), rgba(230, 100, 40, .14) 50%, transparent);
}

:root[data-theme="parchment"] .pr-flare {
  background: radial-gradient(closest-side, rgba(255, 190, 110, .55), rgba(240, 120, 50, .25) 35%, transparent);
}

:root[data-theme="parchment"] .pr-raven__body,
:root[data-theme="parchment"] .pr-raven__wing {
  fill: #4a2a22;
}

:root[data-theme="parchment"] /* the fire it trails */
.pr-raven__trail {
  position: absolute;
  right: 62%;
  top: 44%;
  width: 260%;
  height: 12%;
  border-radius: 50%;
  background: linear-gradient(90deg, transparent, rgba(255, 70, 20, .16) 40%, rgba(255, 130, 40, .5) 85%, rgba(255, 200, 110, .7));
}

.pr-raven__glow {
  opacity: .5;
}

/* still: the horizon burning and the meteor's glow on it; the ravens have gone */
@media (prefers-reduced-motion: reduce) {
  .pr-horizon,
  .pr-horizon__fire,
  .pr-flare,
  .pr-raven,
  .pr-raven__wings,
  .pr-raven__flame {
    animation: none;
  }

  .pr-meteor,
  .pr-flight {
    display: none;
  }
}
</style>
