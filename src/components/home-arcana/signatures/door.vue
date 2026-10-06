<template>
  <!--
    Door: a seam of starlight splits the sky beside the moon and opens. Through it is another
    space: a deeper, denser starfield than the sky around it. A few stars streak out of the
    opening, then it closes again to a faint line, as if a door in the air had shut behind a
    Traveler. No frame, no leaves: only the seam and what lies behind it.
  -->
  <div class="door" aria-hidden="true">
    <div v-if="layer === 'back'" class="door__seam">
      <i class="door__spill"></i>
      <!-- the other space, seen through the opening -->
      <div class="door__space">
        <svg class="door__stars" viewBox="0 0 100 260" preserveAspectRatio="xMidYMid slice">
          <rect v-for="(s, i) in STARS" :key="i" :x="s.x" :y="s.y" :width="s.s" :height="s.s" :fill="s.c" :opacity="s.o"/>
        </svg>
      </div>
      <i class="door__line"></i>
      <i v-for="(t, i) in STREAKS" :key="`t${i}`" class="door__streak" :style="t"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import {seeded} from './sigKit';

defineProps<{layer: 'back' | 'front'; from?: string}>();

/* the far side's stars, the same on every draw: dense, small, a few bright, cold blue to teal */
const rnd = seeded(41);
const TINTS = ['#e6f6ff', '#cfefff', '#a9dcff', '#9ff3ea', '#d9d2ff'];
const STARS = Array.from({length: 150}, () => {
  const big = rnd() < .08;
  return {
    x: (rnd() * 100).toFixed(1),
    y: (rnd() * 260).toFixed(1),
    s: big ? 1.6 : (.6 + rnd() * .5).toFixed(2),
    c: TINTS[Math.floor(rnd() * TINTS.length)],
    o: big ? 1 : (.35 + rnd() * .6).toFixed(2),
  };
});

/* stars flung out of the opening: the way each goes (degrees from straight up, clockwise), how far, when */
const STREAKS = [
  {a: -62, len: 1.5, d: 1.7},
  {a: 48, len: 1.2, d: 2.15},
  {a: -118, len: 1.1, d: 2.6},
].map(({a, len, d}) => ({'--a': `${a}deg`, '--len': len, '--d': `${d}s`}));
</script>

<style scoped>
.door {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* the seam's place: in open sky right of the fan, level with the moon's upper half */
.door__seam {
  --w: calc(var(--moon-r, 200px) * .62);
  --h: calc(var(--moon-r, 200px) * 1.7);
  position: absolute;
  left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * 2.02);
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * 1.32);
  width: 0;
  height: 0;
}

/* the opening: deep space in a tall soft lens, unfolding sideways from the seam and folding back */
.door__space {
  position: absolute;
  left: calc(var(--w) * -.5);
  top: calc(var(--h) * -.5);
  width: var(--w);
  height: var(--h);
  background:
    radial-gradient(40% 30% at 46% 42%, rgba(70, 220, 210, .22), transparent 70%),
    radial-gradient(50% 36% at 58% 64%, rgba(120, 110, 255, .18), transparent 72%),
    radial-gradient(closest-side, #02050f 40%, #050b20 80%, rgba(8, 16, 40, .7));
  -webkit-mask-image: radial-gradient(closest-side, #000 52%, rgba(0, 0, 0, .7) 74%, transparent);
  mask-image: radial-gradient(closest-side, #000 52%, rgba(0, 0, 0, .7) 74%, transparent);
  opacity: 0;
  transform: scaleX(.02);
  animation: door-open 4.4s cubic-bezier(.5, 0, .3, 1) .6s both;
}

.door__stars {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* the seam itself: a hairline of starlight, drawn first, quiet while it stands open, left behind when it shuts */
.door__line {
  position: absolute;
  left: -1px;
  top: calc(var(--h) * -.5);
  width: 2px;
  height: var(--h);
  background: linear-gradient(180deg, transparent, rgba(200, 245, 255, .9) 22%, #f2fdff 50%, rgba(200, 245, 255, .9) 78%, transparent);
  box-shadow: 0 0 6px 1px rgba(110, 230, 225, .55);
  opacity: .22;
  transform-origin: 50% 50%;
  animation: door-line 5s ease .25s both;
}

/* light spilling round the seam while it is open, a trace of it after */
.door__spill {
  position: absolute;
  left: calc(var(--w) * -1.4);
  top: calc(var(--h) * -.85);
  width: calc(var(--w) * 2.8);
  height: calc(var(--h) * 1.7);
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(90, 225, 215, .2), rgba(70, 140, 255, .08) 55%, transparent);
  opacity: .3;
  animation: door-spill 4.6s ease .6s both;
}

/* a star flung out of the opening: a short bright streak, gone */
.door__streak {
  position: absolute;
  left: -1px;
  top: 0;
  width: 2px;
  height: calc(var(--moon-r, 200px) * .34);
  background: linear-gradient(180deg, #f4fdff, rgba(170, 235, 255, .5) 30%, transparent);
  transform-origin: 50% 0;
  rotate: var(--a);
  opacity: 0;
  animation: door-streak .9s cubic-bezier(.2, .6, .4, 1) var(--d) both;
}

@keyframes door-open {
  0% { opacity: 0; transform: scaleX(.02); }
  6% { opacity: 1; }
  26% { transform: scaleX(1); }
  70% { opacity: 1; transform: scaleX(1); }
  94% { opacity: .6; transform: scaleX(.04); }
  100% { opacity: 0; transform: scaleX(.02); }
}

@keyframes door-line {
  0% { opacity: 0; transform: scaleY(0); }
  10% { opacity: 1; transform: scaleY(1); }
  24% { opacity: .3; }
  74% { opacity: .3; }
  88% { opacity: 1; transform: scaleY(1); }
  100% { opacity: .22; transform: scaleY(.8); }
}

@keyframes door-spill {
  0% { opacity: 0; }
  30%, 60% { opacity: 1; }
  100% { opacity: .3; }
}

@keyframes door-streak {
  0% { opacity: 0; transform: translate3d(0, 0, 0) scaleY(.3); }
  20% { opacity: 1; }
  100% { opacity: 0; transform: translate3d(0, calc(var(--moon-r, 200px) * var(--len) * -1), 0) scaleY(1); }
}

/* stacked: the moon is smaller and the deck sits on it; the seam stands just right of the fan */
@media (max-width: 900px) {
  .door__seam {
    left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * 1.75);
    top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * .2);
  }
}

/* paper: the seam and its starlight as ink-blue on the haze; the far side a dusk-blue window */
:root[data-theme="parchment"] .door__space {
  background:
    radial-gradient(40% 30% at 46% 42%, rgba(40, 150, 150, .2), transparent 70%),
    radial-gradient(closest-side, rgba(30, 44, 84, .75) 40%, rgba(40, 56, 100, .5) 80%, transparent);
}

:root[data-theme="parchment"] .door__line {
  background: linear-gradient(180deg, transparent, rgba(30, 110, 130, .7) 30%, rgba(30, 110, 130, .7) 70%, transparent);
  box-shadow: none;
}

:root[data-theme="parchment"] .door__spill {
  mix-blend-mode: multiply;
  background: radial-gradient(closest-side, rgba(60, 150, 160, .14), transparent);
}

:root[data-theme="parchment"] .door__streak {
  background: linear-gradient(180deg, #2a6f86, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .door__space,
  .door__streak {
    display: none;
  }

  .door__line,
  .door__spill {
    animation: none;
  }
}
</style>
