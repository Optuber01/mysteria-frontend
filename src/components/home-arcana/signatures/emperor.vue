<template>
  <!--
    Black Emperor: the moon goes black and a crown of light settles on its rim, coming to
    rest a few degrees askew and staying there, subtly wrong (order bent out of true).
    Everything is behind the castle; there is nothing in front of it.
  -->
  <div aria-hidden="true">
    <template v-if="layer === 'back'">
      <div ref="followRef" class="em-moon">
        <div ref="riseRef" class="em-moon__rise">
          <i class="em-umbra"></i>
          <i class="em-corona"></i>
          <div class="em-crown">
            <svg class="em-crown__svg" viewBox="-100 -100 200 200">
              <defs>
                <linearGradient id="em-rim" x1="0" y1="-100" x2="0" y2="100" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stop-color="#ffe6a6"/>
                  <stop offset=".45" stop-color="#c9b6ff"/>
                  <stop offset="1" stop-color="#6d74ff" stop-opacity=".25"/>
                </linearGradient>
                <radialGradient id="em-point" cx="0" cy="0" r="118" gradientUnits="userSpaceOnUse">
                  <stop offset=".82" stop-color="#fff1c4"/>
                  <stop offset=".93" stop-color="#e8c26a" stop-opacity=".85"/>
                  <stop offset="1" stop-color="#8f86ff" stop-opacity="0"/>
                </radialGradient>
              </defs>
              <!-- the rim, broken where the crown's points rise from it -->
              <circle class="em-rim" r="100" pathLength="360" :stroke-dasharray="rimDash" stroke="url(#em-rim)"/>
              <path v-for="p in points" :key="p.a" class="em-point" :d="p.d" fill="url(#em-point)"/>
            </svg>
            <span v-for="p in points" :key="p.a" class="em-glint" :style="{'--a': `${p.a}deg`, '--h': p.h, '--d': `${p.delay}s`}"><i></i></span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {useMoonAnchor} from './sigKit';

defineProps<{layer: 'back' | 'front'}>();

const followRef = ref<HTMLElement | null>(null);
const riseRef = ref<HTMLElement | null>(null);
useMoonAnchor(followRef, riseRef);

/*
 * Nine points on the upper rim (degrees from the top, clockwise), tall and short in turn
 * like a crown's tines; heights in moon radii above the rim. The fan of cards hides
 * anything much beyond 1.12 r on top, so the points stay short and bright.
 */
const R = 100;
const TINES = [
  {a: -96, h: .11}, {a: -72, h: .07}, {a: -48, h: .15}, {a: -24, h: .08}, {a: 0, h: .2},
  {a: 24, h: .08}, {a: 48, h: .15}, {a: 72, h: .07}, {a: 96, h: .11},
];
const polar = (deg: number, r: number) => {
  const t = (deg * Math.PI) / 180;
  return `${(r * Math.sin(t)).toFixed(2)} ${(-r * Math.cos(t)).toFixed(2)}`;
};
const points = TINES.map(({a, h}, i) => {
  const w = 1.3 + h * 8; // half-width of the base, in degrees
  const tip = R * (1 + h);
  const d = `M${polar(a - w, R - 1.5)} Q${polar(a - w * .12, R + h * 40)} ${polar(a, tip)} Q${polar(a + w * .12, R + h * 40)} ${polar(a + w, R - 1.5)} Z`;
  return {a, h: 1 + h, d, delay: (i * 0.73) % 3};
});
/* the rim's dashes: gaps under each tine (pathLength 360 runs clockwise from 3 o'clock) */
const rimDash = (() => {
  const gaps = TINES.map(t => ((t.a - 90 + 360) % 360)).sort((x, y) => x - y);
  const parts: number[] = [];
  let at = 0;
  for (const g of gaps) {
    parts.push(Math.max(0, g - 2.5 - at), 5);
    at = g + 2.5;
  }
  parts.push(360 - at, 0);
  return parts.join(' ');
})();
</script>

<style scoped>
/* ---- the moon box: 2r square on the moon, kept in step with it ---- */
.em-moon {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  height: calc(var(--moon-r, 200px) * 2);
  will-change: transform;
}

.em-moon__rise {
  position: absolute;
  inset: 0;
}

/* The eclipse: a black body slides over the grey moon and covers it. */
.em-umbra {
  position: absolute;
  inset: -.6%;
  border-radius: 50%;
  background: radial-gradient(circle, #040308 0%, #060510 70%, #0a0820 92%, #16143c 100%);
  opacity: .96;
  animation: em-eclipse 1.8s cubic-bezier(.33, .08, .22, 1) .7s both;
}

@keyframes em-eclipse {
  from { transform: translate3d(-62%, -34%, 0); opacity: 0; }
  30% { opacity: .9; }
  to { transform: none; opacity: .96; }
}

/* totality: a thin indigo-gold corona breathes round the black disc */
.em-corona {
  position: absolute;
  inset: -16%;
  border-radius: 50%;
  background: radial-gradient(circle closest-side,
      transparent 83%,
      rgba(255, 226, 150, .5) 85.6%,
      rgba(150, 140, 255, .26) 88%,
      rgba(110, 110, 255, .1) 93%,
      transparent 100%);
  animation: em-corona-in 1.4s ease 2.2s both, em-breathe 9s ease-in-out 3.6s infinite;
}

@keyframes em-corona-in {
  from { opacity: 0; transform: scale(.96); }
}

@keyframes em-breathe {
  50% { opacity: .72; }
}

/* the crown settles onto the rim from above, coming to rest a few degrees askew */
.em-crown {
  position: absolute;
  inset: 0;
  transform: rotate(6deg);
  animation: em-crown 1.3s cubic-bezier(.2, .9, .3, 1.08) 2.3s both;
}

@keyframes em-crown {
  from { opacity: 0; transform: translate3d(0, -10%, 0) scale(1.05) rotate(0deg); }
  55% { opacity: 1; }
  to { opacity: 1; transform: rotate(6deg); }
}

.em-crown__svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.em-rim {
  fill: none;
  stroke-width: 1.6;
  vector-effect: non-scaling-stroke;
}

.em-point {
  filter: drop-shadow(0 0 2px rgba(255, 214, 140, .8));
}

/* points of light at the tines' tips */
.em-glint {
  position: absolute;
  inset: 0;
  transform: rotate(var(--a));
}

.em-glint i {
  position: absolute;
  left: 50%;
  top: calc(50% - var(--h) * 50%);
  width: calc(var(--moon-r, 200px) * .1);
  aspect-ratio: 1;
  translate: -50% -50%;
  border-radius: 50%;
  background: radial-gradient(circle, #fffaf0 0 10%, rgba(255, 220, 150, .75) 22%, rgba(170, 160, 255, .2) 45%, transparent 68%);
  animation: em-glint 5.5s ease-in-out calc(3.6s + var(--d)) infinite;
}

@keyframes em-glint {
  50% { opacity: .35; }
}

/* ---- light theme: an ink eclipse on paper, never a black hole ---- */
:root[data-theme="parchment"] .em-umbra {
  background: radial-gradient(circle, #3b3352 0%, #4a4064 80%, #5d5378 100%);
  opacity: .5;
  animation-name: em-eclipse-ink;
}

@keyframes em-eclipse-ink {
  from { transform: translate3d(-62%, -34%, 0); opacity: 0; }
  to { transform: none; opacity: .5; }
}

:root[data-theme="parchment"] .em-corona {
  background: radial-gradient(circle closest-side,
      transparent 83%,
      rgba(170, 120, 40, .45) 85.6%,
      rgba(90, 80, 170, .18) 89%,
      transparent 96%);
}

:root[data-theme="parchment"] .em-point {
  fill: #a87a22;
  filter: none;
}

:root[data-theme="parchment"] .em-rim {
  stroke: #8c6a2c;
}

:root[data-theme="parchment"] .em-glint i {
  background: radial-gradient(circle, #fff5d6 0 12%, rgba(190, 140, 50, .55) 26%, transparent 62%);
}

@media (prefers-reduced-motion: reduce) {
  .em-umbra,
  .em-corona,
  .em-crown,
  .em-glint i {
    animation: none;
  }
}
</style>
