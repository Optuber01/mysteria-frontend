<template>
  <!--
    Justiciar: a thin brass band of inscription rings the moon (an unreadable ancient
    script, never real letters). A verdict writes itself across the sky in the same script,
    and on its last stroke everything stops: the fog freezes mid-drift, the brass motes
    lock into a grid, and the frozen scene holds ("drifting is prohibited here"). Then only
    the ring round the moon turns on, slowly.

    The freeze reaches the base scene's fog: on the verdict this adds `sig-justiciar-still`
    to the closest `.night`, which pauses its fog and cloud drift (see the :global rule
    below), and removes it again on unmount.
  -->
  <div ref="rootRef" aria-hidden="true" :class="{'is-held': held}">
    <template v-if="layer === 'back'">
      <div ref="followRef" class="ju-moon">
        <div ref="riseRef" class="ju-moon__rise">
          <div class="ju-ring">
            <svg class="ju-svg" viewBox="-100 -100 200 200">
              <circle class="ju-ring__rule" r="102.6"/>
              <circle class="ju-ring__rule" r="110"/>
              <path class="ju-script" :d="RING_SCRIPT"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- the verdict, written left to right above the fan -->
      <div class="ju-verdict">
        <div class="ju-verdict__reveal">
          <div class="ju-verdict__ink">
            <svg class="ju-svg" :viewBox="`0 0 ${LINE_W} 16`" preserveAspectRatio="none">
              <path class="ju-script ju-script--line" :d="LINE_SCRIPT"/>
              <path class="ju-verdict__rule" :d="`M0 15 H${LINE_W}`"/>
            </svg>
          </div>
        </div>
        <i class="ju-verdict__nib"></i>
        <i class="ju-verdict__seal"></i>
      </div>

      <!-- brass motes, slowing into a grid that holds -->
      <div class="ju-stage">
        <i v-for="(m, i) in MOTES" :key="i" class="ju-mote" :class="{'ju-mote--big': m.big}" :style="{left: `${m.x}%`, top: `${m.y}%`, '--dx': m.dx, '--dy': m.dy}"></i>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, ref} from 'vue';
import {reducedMotion, seeded, useMoonAnchor} from './sigKit';

const props = defineProps<{layer: 'back' | 'front'}>();

const rootRef = ref<HTMLElement | null>(null);
const followRef = ref<HTMLElement | null>(null);
const riseRef = ref<HTMLElement | null>(null);
useMoonAnchor(followRef, riseRef);

const rnd = seeded(41);
const f1 = (n: number) => n.toFixed(2);
type Seg = [number, number, number, number];

/*
 * One glyph of the script, in a 6 x 10 cell: a stem or a slant, then one or two marks
 * from a small set (bars, hooks, ticks, a dot above). Angular, not Latin, not Hermes.
 */
function glyph(): Seg[] {
  const segs: Seg[] = [];
  const base = rnd();
  if (base < .5) segs.push([3, 0, 3, 10]);
  else if (base < .7) segs.push([1, 0, 5, 10]);
  else if (base < .85) segs.push([5, 0, 1, 10]);
  else segs.push([1, 0, 1, 10], [5, 0, 5, 10]);
  const marks: Seg[][] = [
    [[0, 0, 6, 0]], [[0, 5, 6, 5]], [[0, 10, 6, 10]], [[3, 0, 6, 0]], [[0, 10, 3, 10]],
    [[3, 4, 6, 1]], [[3, 6, 0, 9]], [[6, 0, 6, 4], [6, 4, 3, 4]], [[0, 6, 3, 6], [3, 6, 3, 10]],
    [[2, 2, 4, 4], [4, 2, 2, 4]], [[3, -2.5, 3, -2.4]],
  ];
  const n = 1 + (rnd() < .55 ? 1 : 0);
  for (let i = 0; i < n; i++) segs.push(...marks[Math.floor(rnd() * marks.length)]);
  return segs;
}

/* the moon's band: glyphs standing outward between two rules just off the limb */
const ringPath: string[] = [];
{
  const scale = .55;
  let a = 0;
  while (a < 357) {
    const t = (a * Math.PI) / 180;
    const rx = Math.sin(t);
    const ry = -Math.cos(t);
    for (const [x0, y0, x1, y1] of glyph()) {
      const p = (gx: number, gy: number) => {
        const rd = 109 - gy * scale - .6;
        const tg = (gx - 3) * scale;
        return `${f1(rx * rd - ry * tg)} ${f1(ry * rd + rx * tg)}`;
      };
      ringPath.push(`M${p(x0, y0)}L${p(x1, y1)}`);
    }
    a += 2.45 + (rnd() < .14 ? 2.2 : 0);
  }
}
const RING_SCRIPT = ringPath.join('');

/* the verdict: one line of the script with word breaks */
const LINE_W = 760;
const linePath: string[] = [];
{
  let x = 2;
  while (x < LINE_W - 8) {
    for (const [x0, y0, x1, y1] of glyph()) linePath.push(`M${f1(x + x0)} ${f1(y0 + 3)}L${f1(x + x1)} ${f1(y1 + 3)}`);
    x += 9 + (rnd() < .18 ? 9 : 0);
  }
}
const LINE_SCRIPT = linePath.join('');

/* the motes' grid (moon units, 100 = r), in sky the fan leaves open; each starts off its point */
const MOTES: {x: number; y: number; dx: number; dy: number; big: boolean}[] = [];
for (let gx = -340; gx <= 260; gx += 40) {
  for (let gy = -180; gy <= 40; gy += 40) {
    const open = Math.hypot(gx, gy) > 200 && !(gx < -190 && gy > -100);
    if (!open || rnd() < .45) continue;
    MOTES.push({x: gx, y: gy, dx: Math.round((rnd() - .5) * 60) / 100, dy: Math.round((rnd() - .5) * 36) / 100, big: rnd() < .3});
  }
}

/* ---- the verdict's last stroke: everything stops ---- */
const VERDICT_AT = 2.75;
const HOLD = 1.8;
const held = ref(false);
let night: HTMLElement | null = null;
const timers: number[] = [];
onMounted(() => {
  if (props.layer !== 'back') return;
  night = rootRef.value?.closest<HTMLElement>('.night') ?? null;
  const stop = () => {
    held.value = true;
    night?.classList.add('sig-justiciar-still');
  };
  if (reducedMotion()) {
    stop();
    held.value = false;
    return;
  }
  timers.push(window.setTimeout(stop, VERDICT_AT * 1000));
  timers.push(window.setTimeout(() => (held.value = false), (VERDICT_AT + HOLD) * 1000));
});
onUnmounted(() => {
  timers.forEach(t => clearTimeout(t));
  night?.classList.remove('sig-justiciar-still');
});
</script>

<style scoped>
/* the base scene's fog and clouds, frozen mid-drift while the verdict stands */
:global(.night.sig-justiciar-still .night__fog-drift),
:global(.night.sig-justiciar-still .night__clouds-drift) {
  animation-play-state: paused;
}

.ju-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.ju-script {
  fill: none;
  stroke: #e6b67a;
  stroke-width: .5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* ---- the ring round the moon ---- */
.ju-moon {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  height: calc(var(--moon-r, 200px) * 2);
  will-change: transform;
}

.ju-moon__rise {
  position: absolute;
  inset: 0;
}

.ju-ring {
  position: absolute;
  inset: 0;
  filter: drop-shadow(0 0 1.5px rgba(255, 196, 120, .5));
  animation: ju-ring-in 1.6s ease .3s both, ju-turn 140s linear .3s infinite;
}

/* stopped by the verdict, and held a beat; then it alone turns on */
.is-held .ju-ring {
  animation-play-state: running, paused;
}

@keyframes ju-ring-in {
  from { opacity: 0; }
}

@keyframes ju-turn {
  to { transform: rotate(360deg); }
}

.ju-ring__rule {
  fill: none;
  stroke: #d9a464;
  stroke-width: .45;
  opacity: .8;
}

/* ---- the verdict line ---- */
.ju-verdict {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px) * 2.3);
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * 2.02);
  width: calc(var(--moon-r, 200px) * 4.7);
  height: calc(var(--moon-r, 200px) * 4.7 * 16 / 760);
}

/* written left to right: the window opens rightward while the ink stays put */
.ju-verdict__reveal {
  position: absolute;
  inset: -40% 0;
  overflow: hidden;
  animation: ju-write 1.9s cubic-bezier(.4, .1, .6, 1) .85s both;
}

.ju-verdict__ink {
  position: absolute;
  inset: 28.5% 0;
  animation: ju-write-ink 1.9s cubic-bezier(.4, .1, .6, 1) .85s both;
}

@keyframes ju-write {
  from { transform: translate3d(-100%, 0, 0); }
}

@keyframes ju-write-ink {
  from { transform: translate3d(100%, 0, 0); }
}

.ju-script--line {
  stroke: #f0c48a;
  stroke-width: 1.1;
}

.ju-verdict__rule {
  fill: none;
  stroke: #d9a464;
  stroke-width: .5;
  opacity: .6;
}

/* the point of the pen, travelling with the writing */
.ju-verdict__nib {
  position: absolute;
  left: 0;
  top: 50%;
  width: calc(var(--moon-r, 200px) * .14);
  aspect-ratio: 1;
  translate: -50% -50%;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(255, 236, 196, .9), rgba(240, 180, 110, .35) 40%, transparent);
  --run: calc(var(--moon-r, 200px) * 4.7);
  opacity: 0;
  animation: ju-nib 1.9s cubic-bezier(.4, .1, .6, 1) .85s both;
}

@keyframes ju-nib {
  0% { transform: translate3d(0, 0, 0); opacity: 0; }
  6% { opacity: 1; }
  94% { opacity: 1; }
  100% { transform: translate3d(var(--run), 0, 0); opacity: 0; }
}

/* the verdict sealed: a brass light runs once along the whole line (no flash) */
.ju-verdict__seal {
  position: absolute;
  inset: -60% -2%;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(255, 214, 150, .32), rgba(255, 190, 120, .1) 60%, transparent);
  opacity: 0;
  animation: ju-seal 1.6s ease-out 2.75s both;
}

@keyframes ju-seal {
  0% { opacity: 0; }
  15% { opacity: 1; }
  100% { opacity: 0; }
}

/* ---- the brass motes: drifting in, slowing, locked to the grid on the verdict ---- */
.ju-stage {
  position: absolute;
  left: var(--moon-x, 72%);
  top: var(--moon-y, 48%);
  width: var(--moon-r, 200px);
  height: var(--moon-r, 200px);
}

.ju-mote {
  position: absolute;
  width: 2px;
  height: 2px;
  background: #f0c48a;
  box-shadow: 0 0 3px rgba(255, 200, 130, .6);
  opacity: .75;
  animation: ju-lock 2.75s cubic-bezier(.1, .4, .2, 1) both;
}

.ju-mote--big {
  width: 4px;
  height: 4px;
}

@keyframes ju-lock {
  from { transform: translate3d(calc(var(--moon-r, 200px) * var(--dx)), calc(var(--moon-r, 200px) * var(--dy)), 0); opacity: 0; }
  30% { opacity: .75; }
}

/* ---- light theme: brass ink on paper ---- */
:root[data-theme="parchment"] .ju-script,
:root[data-theme="parchment"] .ju-ring__rule,
:root[data-theme="parchment"] .ju-verdict__rule {
  stroke: #8a5a24;
}

:root[data-theme="parchment"] .ju-ring {
  filter: none;
}

:root[data-theme="parchment"] .ju-mote {
  background: #8a5a24;
  box-shadow: none;
}

@media (prefers-reduced-motion: reduce) {
  .ju-ring,
  .ju-verdict__reveal,
  .ju-verdict__ink,
  .ju-verdict__nib,
  .ju-verdict__seal,
  .ju-mote {
    animation: none;
  }
}
</style>
