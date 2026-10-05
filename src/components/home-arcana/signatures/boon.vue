<template>
  <!--
    The Boons: something from outside looks in. The crimson moon darkens at its centre and
    opens as an eye (an iris in the Boon's colour round a slit pupil), the stars are drawn
    into a slow spiral round it, faint tendrils reach out of its glow, and the edges of the
    night press in and ease like a heartbeat. Then each Boon's own twist plays.
  -->
  <div ref="rootRef" class="boon" :class="[`boon--${boon}`, {'boon--hush': hush}]" aria-hidden="true">
    <!-- ======== behind the castle ======== -->
    <template v-if="layer === 'back'">
      <!-- the eye, on the moon disc itself (it rises and sinks with the moon) -->
      <Teleport v-if="moonRise" :to="moonRise">
        <i class="boon__eye" :class="`boon__eye--${boon}`">
          <i class="boon__dark"></i>
          <i class="boon__iris"></i>
          <i class="boon__pupil"></i>
        </i>
      </Teleport>

      <!-- the stars wheel wrong, and tendrils reach out of the glow -->
      <div class="boon__wheel">
        <svg class="boon__tendrils" viewBox="-350 -350 700 700">
          <path v-for="(t, i) in tendrils" :key="i" :d="t.d" pathLength="1" :style="t.style"/>
        </svg>
        <i v-for="(s, i) in spiral" :key="i" class="boon__star" :class="{'boon__star--bitten': boon === 'devouring' && s.bite}" :style="s.style"></i>
      </div>

      <!-- aeon: threads of fate weave a ring round the eye; fragments break off -->
      <template v-if="boon === 'aeon'">
        <svg class="boon__ring boon__threads" viewBox="-200 -200 400 400">
          <path v-for="(t, i) in threads" :key="i" :d="t" pathLength="1" :style="{'--d': `${1.5 + i * 0.35}s`}"/>
        </svg>
        <i v-for="(f, i) in fragments" :key="i" class="boon__fragment" :style="f"></i>
      </template>

      <!-- condenser: starlight pulled into the eye; a void hangs beside it -->
      <template v-if="boon === 'condenser'">
        <i v-for="(s, i) in pulls" :key="i" class="boon__pull" :style="s"><i></i></i>
        <i class="boon__void"></i>
      </template>

      <!-- devouring: crumbs fall from the bitten moon -->
      <template v-if="boon === 'devouring'">
        <i v-for="(c, i) in crumbs" :key="i" class="boon__crumb" :style="c"></i>
      </template>

      <!-- edict: rings of sound carrying unreadable words, three beats -->
      <template v-if="boon === 'edict'">
        <svg v-for="k in 3" :key="k" class="boon__ring boon__edict" viewBox="-200 -200 400 400" :style="{'--d': `${1.5 + (k - 1) * 0.7}s`}">
          <circle r="104" class="boon__edict-words"/>
          <circle r="98" class="boon__edict-line"/>
        </svg>
      </template>

      <!-- patriarch: a fallen tree's bare branches behind the eye, sap-light and gold in its twigs -->
      <template v-if="boon === 'patriarch'">
        <svg class="boon__tree" viewBox="-500 -300 1000 600">
          <defs>
            <mask id="boon-tree-hole">
              <rect x="-500" y="-300" width="1000" height="600" fill="#fff"/>
              <circle r="104" fill="#000"/>
            </mask>
          </defs>
          <g mask="url(#boon-tree-hole)">
            <path v-for="(b, i) in branches" :key="i" class="boon__branch" :d="b.d" :stroke-width="b.w" pathLength="1" :style="b.style"/>
            <path v-for="(p, i) in sap" :key="`s${i}`" class="boon__sap" :d="p" pathLength="1" :style="{'--d': `${3 + i * 0.9}s`}"/>
          </g>
        </svg>
        <i v-for="(g, i) in glints" :key="i" class="boon__glint" :style="g"></i>
      </template>
    </template>

    <!-- ======== in front of the castle ======== -->
    <template v-else>
      <!-- chaos: thorny undergrowth along the skyline, rotting as it grows; black flames in it -->
      <div v-if="boon === 'chaos'" class="boon__city">
        <svg class="boon__thorns" :viewBox="`0 0 ${ROOF_W} ${ROOF_H}`" preserveAspectRatio="none">
          <g class="boon__thorns-live">
            <path class="boon__bramble" :d="bramble" pathLength="1"/>
            <path class="boon__spikes" :d="spikes"/>
          </g>
          <g class="boon__thorns-dead">
            <path class="boon__bramble" :d="bramble"/>
            <path class="boon__spikes" :d="spikes"/>
          </g>
        </svg>
        <i v-for="(f, i) in flames" :key="i" class="boon__flame" :style="f">
          <svg viewBox="-10 -26 20 28"><path d="M0 0 C-7 -1 -8 -8 -4 -13 C-3 -9 -1 -9 -1 -12 C-1 -17 2 -21 0 -26 C5 -21 8 -15 6 -9 C8 -10 8 -12 7 -14 C10 -9 9 -1 0 0 Z"/></svg>
        </i>
      </div>

      <!-- chaosmist: mist in the streets; two shadows reach for each other; a seal where they touch -->
      <template v-if="boon === 'chaosmist'">
        <i class="boon__mist"></i>
        <i class="boon__shadow boon__shadow--l"><svg viewBox="0 0 400 40" preserveAspectRatio="none"><path :d="SHADOW"/></svg></i>
        <i class="boon__shadow boon__shadow--r"><svg viewBox="0 0 400 40" preserveAspectRatio="none"><path :d="SHADOW"/></svg></i>
        <i class="boon__seal"></i>
      </template>

      <!-- everlasting: a column of light falls onto the tallest tower; motes rise up it like a choir -->
      <template v-if="boon === 'everlasting'">
        <i class="boon__column"></i>
        <i class="boon__tower-lit" :style="{'--sig-city': `url(${city})`}"></i>
        <i v-for="(m, i) in choir" :key="i" class="boon__choir" :style="m"></i>
      </template>

      <!-- secondlaw: a wave of decay drains the colour; a sickly haze; regulation grids stamp the sky -->
      <template v-if="boon === 'secondlaw'">
        <div class="boon__drain-box">
          <i class="boon__drain"></i>
          <i class="boon__drain-edge"></i>
        </div>
        <i class="boon__haze"></i>
        <i v-for="(g, i) in grids" :key="i" class="boon__grid" :style="g"></i>
      </template>

      <!-- sublunary: the night becomes a painting, framed in gilt; pixie lights slip behind the canvas -->
      <template v-if="boon === 'sublunary'">
        <svg class="boon__canvas" preserveAspectRatio="none">
          <filter id="boon-brush" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency=".0016 .03" numOctaves="3" seed="9"/>
            <feColorMatrix values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1"/>
          </filter>
          <filter id="boon-paint" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="3"/>
            <feDisplacementMap in="SourceGraphic" scale="7" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#boon-brush)"/>
        </svg>
        <i class="boon__frame"></i>
        <i v-for="(p, i) in pixies" :key="i" class="boon__pixie" :style="p"></i>
      </template>

      <!-- edict: the silence after the third beat -->
      <i v-if="boon === 'edict'" class="boon__hush"></i>

      <!-- every Boon: the pressure at the edges, like a heartbeat -->
      <i class="boon__pressure"></i>
    </template>
  </div>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, ref} from 'vue';
import {ROOF_H, ROOF_W, roofAt} from './roofline';
import city from '../assets/moon/backlund-skyline.webp';

const props = defineProps<{layer: 'back' | 'front'; boon?: string}>();

let seed = 23;
const rnd = (a: number, b: number) => {
  seed = (seed * 16807) % 2147483647;
  return a + ((seed - 1) / 2147483646) * (b - a);
};
const r1 = (n: number) => Math.round(n * 10) / 10;
const f2 = (n: number) => n.toFixed(2);
const rad = (deg: number) => (deg * Math.PI) / 180;

/* ---- shared: the spiral of stars (in moon radii), each drawn in from somewhere else ---- */
const spiral = Array.from({length: 42}, (_, n) => {
  const arm = n % 3;
  const i = Math.floor(n / 3);
  const a = arm * 120 + i * 21 + rnd(-5, 5);
  const r = 1.25 + i * 0.16 + rnd(-0.05, 0.05);
  return {
    bite: n % 3 === 1,
    style: {
      '--a': `${r1(a)}deg`, '--r': f2(r),
      '--a0': `${r1(a - rnd(70, 150))}deg`, '--r0': f2(r * rnd(1.3, 2)),
      '--d': `${f2(0.9 + rnd(0, 0.9))}s`, '--s': f2(rnd(0.6, 1.2)),
      '--b': `${f2(2.4 + rnd(0, 2.4))}s`,
    },
  };
});

/* tendrils out of the glow: curling outward from the limb (units: moon radius / 100) */
const tendrils = Array.from({length: 11}, (_, i) => {
  const a0 = i * (360 / 11) + rnd(-10, 10);
  const len = rnd(90, 210);
  const curl = rnd(35, 75) * (i % 2 ? 1 : -1);
  const pts: string[] = [];
  for (let t = 0; t <= 1.001; t += 0.05) {
    const r = 106 + len * t;
    const a = rad(a0 + curl * t ** 1.5 + Math.sin(t * 9 + i) * 4 * t);
    pts.push(`${r1(Math.cos(a) * r)} ${r1(Math.sin(a) * r)}`);
  }
  return {d: `M${pts.join(' L')}`, style: {'--d': `${f2(1.2 + rnd(0, 0.8))}s`, '--w': f2(rnd(1.2, 2.4))}};
});

/* ---- aeon: three threads braided round the eye, and the fragments that break away ---- */
const threads = [0, 1, 2].map(k => {
  const pts: string[] = [];
  for (let a = 0; a <= 360; a += 4) {
    const r = 134 + Math.sin(rad(a * 7) + (k * Math.PI * 2) / 3) * 11;
    pts.push(`${r1(Math.cos(rad(a)) * r)} ${r1(Math.sin(rad(a)) * r)}`);
  }
  return `M${pts.join(' L')}`;
});
const fragments = Array.from({length: 9}, (_, i) => ({
  '--a': `${r1(i * 40 + rnd(-12, 12))}deg`, '--d': `${f2(3.4 + i * 0.7)}s`, '--t': `${f2(rnd(5, 7))}s`, '--far': f2(rnd(0.7, 1.3)),
}));

/* ---- condenser: streaks pulled in from all round ---- */
const pulls = Array.from({length: 20}, (_, i) => ({
  '--a': `${r1(i * 18 + rnd(-6, 6))}deg`, '--r0': f2(rnd(2.2, 3.4)), '--d': `${f2(1.4 + rnd(0, 1.6))}s`,
}));

/* ---- devouring: crumbs off the moon's lower limb ---- */
const crumbs = Array.from({length: 16}, (_, i) => {
  const a = rad(rnd(25, 155));
  return {
    '--x': f2(Math.cos(a) * 0.98), '--y': f2(Math.sin(a) * 0.98), '--fall': f2(rnd(0.4, 0.9)),
    '--dx': f2(rnd(-0.12, 0.12)), '--d': `${f2(2.4 + i * 0.14 + rnd(0, 0.3))}s`, '--t': `${f2(rnd(1.2, 1.9))}s`,
  };
});

/* ---- patriarch: a fallen tree, branching, in moon units / 100 round the moon ---- */
type Branch = {d: string; w: number; style: Record<string, string>};
const branches: Branch[] = [];
const tips: [number, number][] = [];
const sap: string[] = [];
function grow(x: number, y: number, ang: number, len: number, w: number, depth: number, trail: string) {
  const ex = x + Math.cos(rad(ang)) * len;
  const ey = y + Math.sin(rad(ang)) * len;
  const bend = rnd(-0.18, 0.18) * len;
  const cx = (x + ex) / 2 - Math.sin(rad(ang)) * bend;
  const cy = (y + ey) / 2 + Math.cos(rad(ang)) * bend;
  const seg = ` Q${r1(cx)} ${r1(cy)} ${r1(ex)} ${r1(ey)}`;
  branches.push({d: `M${r1(x)} ${r1(y)}${seg}`, w: r1(w), style: {'--d': `${f2(1 + (6 - depth) * 0.26)}s`}});
  if (depth === 0) {
    tips.push([ex, ey]);
    if (sap.length < 5 && rnd(0, 1) < 0.25) sap.push(trail + seg);
    return;
  }
  const n = depth > 4 ? 2 : rnd(0, 1) < 0.35 ? 3 : 2;
  for (let k = 0; k < n; k++) {
    const spread = n === 2 ? (k ? 1 : -1) * rnd(16, 40) : (k - 1) * rnd(22, 36);
    grow(ex, ey, ang + spread + rnd(-6, 6), len * rnd(0.62, 0.8), w * 0.64, depth - 1, trail + seg);
  }
}
if (props.boon === 'patriarch') {
  // the trunk lies off the top right, its crown spread across the sky behind the moon
  grow(560, -250, 196, 210, 15, 6, 'M560 -250');
  grow(540, -160, 168, 150, 9, 5, 'M540 -160');
}
const glints = tips.filter((_, i) => i % 7 === 3).slice(0, 12).map(([x, y]) => ({
  '--x': f2(x / 100), '--y': f2(y / 100), '--d': `${f2(2.6 + rnd(0, 3))}s`, '--t': `${f2(rnd(2.4, 4))}s`,
}));

/* ---- chaos: a bramble along the roof, thorns off it, black flames in it ---- */
const brPts: [number, number][] = [];
for (let x = 760; x <= 1910; x += 9) brPts.push([x, roofAt(x) + 6 + rnd(-3, 3) + Math.sin(x / 15) * 2.5]);
const bramble = 'M' + brPts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join(' L');
const spikes = brPts.filter((_, i) => i % 2 === 0).map(([x, y], i) => {
  const up = i % 3 !== 1;
  const h = rnd(7, 14) * (up ? -1 : 1);
  const lean = rnd(-6, 6);
  return `M${r1(x - 2.5)} ${r1(y)} L${r1(x + lean)} ${r1(y + h)} L${r1(x + 2.5)} ${r1(y)} Z`;
}).join(' ');
const flames = [880, 1120, 1300, 1470, 1700, 1860].map((x, i) => ({
  left: `${r1((x / ROOF_W) * 100)}%`, top: `${r1(((roofAt(x) + 8) / ROOF_H) * 100)}%`,
  '--d': `${f2(2.3 + i * 0.22)}s`, '--f': `${f2(rnd(0.38, 0.6))}s`, '--s': f2(rnd(0.75, 1.15)),
}));

/* ---- chaosmist: a shadow lying on the ground, foot at 0, head at the far end ---- */
const SHADOW = 'M0 20 C60 18 200 13 330 11 C342 11 348 14 352 16 C356 9 370 6 384 8 C398 11 400 29 384 32 C370 34 356 31 352 24 C348 26 342 29 330 29 C200 27 60 22 0 20 Z';

/* ---- everlasting: motes rising up the column ---- */
const choir = Array.from({length: 14}, (_, i) => ({
  '--dx': f2(rnd(-0.5, 0.5)), '--d': `${f2(2.4 + i * 0.42)}s`, '--t': `${f2(rnd(4.5, 6.5))}s`, '--s': f2(rnd(0.7, 1.3)),
}));

/* ---- secondlaw: regulated zones stamped on the sky (moon units) ---- */
const grids = [
  {x: 1.95, y: -1.45, s: 0.62}, {x: -2.2, y: -0.95, s: 0.5}, {x: 2.3, y: -0.35, s: 0.44},
  {x: 0.35, y: -2.1, s: 0.48}, {x: -1.8, y: -1.75, s: 0.38},
].map((g, i) => ({'--x': f2(g.x), '--y': f2(g.y), '--s': f2(g.s), '--d': `${f2(3 + i * 0.3)}s`}));

/* ---- sublunary: pixie lights, each on its own flight before slipping behind the canvas ---- */
const pixies = Array.from({length: 5}, (_, i) => {
  const p = Array.from({length: 4}, () => [rnd(55, 95), rnd(12, 60)]);
  const s: Record<string, string> = {'--d': `${f2(2.8 + i * 1.3)}s`, '--t': `${f2(rnd(7, 10))}s`};
  p.forEach(([x, y], k) => {
    s[`--x${k}`] = `${r1(x!)}vw`;
    s[`--y${k}`] = f2(y! / 100);
  });
  return s;
});

/* ---- edict: three beats, then the silence: the fog stops for a moment ---- */
const hush = ref(false);
const timers: number[] = [];

/* the scene's moon box, so the eye sits on the real disc */
const rootRef = ref<HTMLElement | null>(null);
const moonRise = ref<HTMLElement | null>(null);
onMounted(() => {
  moonRise.value = rootRef.value?.closest('.night')?.querySelector<HTMLElement>('.night__moon-rise') ?? null;
  if (props.boon === 'edict' && props.layer === 'front' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    timers.push(window.setTimeout(() => (hush.value = true), 4000));
    timers.push(window.setTimeout(() => (hush.value = false), 5900));
  }
});
onUnmounted(() => timers.forEach(t => window.clearTimeout(t)));
</script>

<style scoped>
.boon {
  --u: var(--moon-r, 200px);
  --ink: color-mix(in oklab, var(--acc) 22%, #08020a);
  --glow: color-mix(in oklab, var(--acc) 70%, #fff);
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* ================= the eye (teleported onto the moon disc) ================= */
.boon__eye {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  overflow: hidden;
}

.boon__dark {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle closest-side, rgba(10, 0, 5, .78) 0, rgba(10, 0, 5, .5) 50%, rgba(10, 0, 5, .12) 85%, transparent);
  animation: boon-fade 1.6s ease .5s both;
}

.boon__iris {
  /* the iris fills the disc, so it reads in the crescent the drawn card leaves uncovered */
  position: absolute;
  inset: 2%;
  border-radius: 50%;
  background:
    radial-gradient(circle closest-side,
      transparent 18%,
      color-mix(in oklab, var(--acc) 90%, #fff) 22%,
      color-mix(in oklab, var(--acc) 55%, transparent) 34%,
      color-mix(in oklab, var(--acc) 42%, #1a0410) 62%,
      color-mix(in oklab, var(--acc) 70%, #2a0814) 80%,
      rgba(6, 0, 4, .95) 90%,
      rgba(6, 0, 4, .6) 97%,
      transparent 100%),
    repeating-conic-gradient(from 3deg, color-mix(in oklab, var(--acc) 75%, #fff) 0 1.2deg, transparent 1.2deg 4.2deg);
  -webkit-mask-image: radial-gradient(circle closest-side, #000 96%, transparent);
  mask-image: radial-gradient(circle closest-side, #000 96%, transparent);
  opacity: .92;
  will-change: transform;
  animation:
    boon-iris 1.6s cubic-bezier(.2, .8, .3, 1) .8s both,
    boon-spin 140s linear 2.4s infinite;
}

.boon__pupil {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 12%;
  height: 94%;
  margin: -47% 0 0 -6%;
  border-radius: 50%;
  background: radial-gradient(closest-side, #040002 62%, rgba(4, 0, 2, .7) 82%, transparent);
  animation:
    boon-slit 1.2s cubic-bezier(.3, .8, .3, 1) 1.2s both,
    boon-breathe 7s ease-in-out 2.4s infinite alternate;
}

@keyframes boon-fade {
  from { opacity: 0; }
}

@keyframes boon-iris {
  from { opacity: 0; transform: scale(.25) rotate(-40deg); }
}

@keyframes boon-spin {
  to { transform: rotate(1turn); }
}

@keyframes boon-slit {
  from { transform: scale(0, .5); }
}

@keyframes boon-breathe {
  to { transform: scale(1.3, 1); }
}

/* devouring: the pupil widens into a hungry dark */
.boon__eye--devouring .boon__pupil {
  animation:
    boon-slit 1.2s cubic-bezier(.3, .8, .3, 1) 1.2s both,
    boon-hunger 1.4s cubic-bezier(.5, 0, .2, 1) 2.2s both;
}

@keyframes boon-hunger {
  to { transform: scale(4.6, 1.05); }
}

/* sublunary: the eye is painted, its edges laid on with a brush */
.boon__eye--sublunary .boon__iris {
  filter: url(#boon-paint);
}

/* ================= the wheel: spiral stars and tendrils ================= */
.boon__wheel {
  position: absolute;
  left: var(--moon-x, 72%);
  top: var(--moon-y, 48%);
  width: 0;
  height: 0;
  animation: boon-spin 420s linear infinite reverse;
}

.boon__tendrils {
  position: absolute;
  left: calc(var(--u) * -3.5);
  top: calc(var(--u) * -3.5);
  width: calc(var(--u) * 7);
  max-width: none;
  height: auto;
  aspect-ratio: 1;
  overflow: visible;
  fill: none;
}

.boon__tendrils path {
  stroke: color-mix(in oklab, var(--acc) 45%, #2a0610);
  stroke-width: var(--w);
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  opacity: .55;
  animation: boon-draw 2s cubic-bezier(.3, .2, .3, 1) var(--d) both;
}

@keyframes boon-draw {
  to { stroke-dashoffset: 0; }
}

.boon__star {
  position: absolute;
  width: 3px;
  height: 3px;
  margin: -1.5px 0 0 -1.5px;
  background: color-mix(in oklab, var(--acc) 40%, #fff);
  box-shadow: 0 0 5px color-mix(in oklab, var(--acc) 70%, transparent);
  transform: rotate(var(--a)) translateX(calc(var(--u) * var(--r))) scale(var(--s));
  animation: boon-gather 3.2s cubic-bezier(.3, .1, .2, 1) var(--d) both;
}

@keyframes boon-gather {
  from { opacity: 0; transform: rotate(var(--a0)) translateX(calc(var(--u) * var(--r0))) scale(var(--s)); }
  30% { opacity: 1; }
}

/* devouring: stars bitten out of the sky, gone for good */
.boon__star--bitten {
  animation:
    boon-gather 3.2s cubic-bezier(.3, .1, .2, 1) var(--d) both,
    boon-bite .25s steps(2, end) calc(var(--d) + var(--b)) both;
}

@keyframes boon-bite {
  0% { opacity: 1; }
  50% { opacity: 1; scale: 1.8; }
  100% { opacity: 0; scale: 0; }
}

/* ================= pressure: the edges press in and ease, like a heartbeat ================= */
.boon__pressure {
  position: absolute;
  inset: 0;
  background: radial-gradient(farthest-corner at var(--moon-x, 72%) var(--moon-y, 48%), transparent 38%, color-mix(in oklab, var(--ink) 55%, transparent) 72%, var(--ink) 100%);
  opacity: .55;
  animation: boon-fade 2s ease .6s both, boon-beat 3.4s ease-in-out 2.6s infinite;
}

@keyframes boon-beat {
  0%, 100% { opacity: .55; }
  9% { opacity: .82; }
  18% { opacity: .62; }
  27% { opacity: .78; }
  48% { opacity: .55; }
}

/* ================= aeon ================= */
.boon__ring {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--u) * 2);
  top: calc(var(--moon-y, 48%) - var(--u) * 2);
  width: calc(var(--u) * 4);
  max-width: none;
  height: auto;
  aspect-ratio: 1;
  overflow: visible;
  fill: none;
}

.boon__threads {
  animation: boon-spin 160s linear 3s infinite;
}

.boon__threads path {
  stroke: color-mix(in oklab, var(--acc) 60%, #fff);
  stroke-width: 1.3;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  opacity: .8;
  vector-effect: non-scaling-stroke;
  filter: drop-shadow(0 0 2px var(--acc));
  animation: boon-draw 1.8s cubic-bezier(.4, .1, .3, 1) var(--d) both;
}

.boon__fragment {
  position: absolute;
  left: var(--moon-x, 72%);
  top: var(--moon-y, 48%);
  rotate: var(--a);
}

.boon__fragment::before {
  content: '';
  position: absolute;
  width: 5px;
  height: 5px;
  background: #eef4ff;
  box-shadow: 0 0 6px var(--acc);
  opacity: 0;
  transform: translateX(calc(var(--u) * 1.34)) rotate(45deg);
  animation: boon-shard var(--t) ease-out var(--d) infinite;
}

@keyframes boon-shard {
  0% { opacity: 0; transform: translateX(calc(var(--u) * 1.34)) rotate(45deg) scale(1); }
  10% { opacity: 1; }
  70% { opacity: .6; }
  100% { opacity: 0; transform: translateX(calc(var(--u) * (1.34 + var(--far)))) rotate(225deg) scale(.4); }
}

/* ================= condenser ================= */
.boon__pull {
  position: absolute;
  left: var(--moon-x, 72%);
  top: var(--moon-y, 48%);
  rotate: var(--a);
}

.boon__pull > i {
  position: absolute;
  left: -1px;
  width: 2px;
  height: calc(var(--u) * .3);
  background: linear-gradient(180deg, var(--glow), transparent);
  opacity: 0;
  transform-origin: 50% 0;
  animation: boon-pull 1.1s cubic-bezier(.6, 0, .9, .5) var(--d) 2 both;
}

@keyframes boon-pull {
  0% { opacity: 0; transform: translateY(calc(var(--u) * var(--r0) * -1)) scaleY(.3); }
  20% { opacity: .9; }
  100% { opacity: 0; transform: translateY(calc(var(--u) * -1.02)) scaleY(1.6); }
}

/* a perfectly black sphere, lensing a thin rim of light */
.boon__void {
  position: absolute;
  left: calc(var(--moon-x, 72%) + var(--u) * 1.95 - var(--u) * .36);
  top: calc(var(--moon-y, 48%) - var(--u) * 1.4 - var(--u) * .36);
  width: calc(var(--u) * .72);
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    radial-gradient(circle closest-side, #000 86%, color-mix(in oklab, var(--acc) 80%, #fff) 91%, color-mix(in oklab, var(--acc) 40%, transparent) 95%, transparent);
  box-shadow: 0 0 calc(var(--u) * .3) color-mix(in oklab, var(--acc) 30%, transparent);
  animation: boon-void 2.4s cubic-bezier(.2, .8, .3, 1) 2s both;
}

@keyframes boon-void {
  from { opacity: 0; transform: scale(.05); }
}

/* ================= devouring ================= */
.boon__crumb {
  position: absolute;
  left: calc(var(--moon-x, 72%) + var(--u) * var(--x));
  top: calc(var(--moon-y, 48%) + var(--u) * var(--y));
  width: 4px;
  height: 4px;
  background: color-mix(in oklab, var(--acc) 50%, #8a2a2a);
  opacity: 0;
  animation: boon-crumb var(--t) cubic-bezier(.5, 0, .9, .6) var(--d) both;
}

@keyframes boon-crumb {
  0% { opacity: 0; transform: translate(0, 0); }
  8% { opacity: 1; }
  100% { opacity: 0; transform: translate(calc(var(--u) * var(--dx)), calc(var(--u) * var(--fall))); }
}

/* ================= edict ================= */
.boon__edict {
  opacity: 0;
  animation: boon-sound 1.8s cubic-bezier(.2, .6, .4, 1) var(--d) both;
}

.boon__edict-words {
  stroke: var(--acc);
  stroke-width: 5;
  stroke-dasharray: 3 2 9 2 2 6 1 3 6 4 2 2 7 5;
}

.boon__edict-line {
  stroke: color-mix(in oklab, var(--acc) 60%, transparent);
  stroke-width: 1;
}

@keyframes boon-sound {
  0% { opacity: 0; transform: scale(.95); }
  12% { opacity: .9; }
  100% { opacity: 0; transform: scale(3.2); }
}

.boon__hush {
  position: absolute;
  inset: 0;
  background: #030105;
  opacity: 0;
  transition: opacity 1.2s ease;
}

.boon--hush .boon__hush {
  opacity: .32;
  transition-duration: .25s;
}

/* the silence: the fog itself holds still */
:global(.night:has(.boon--hush) .night__fog-drift),
:global(.night:has(.boon--hush) .night__clouds-drift),
:global(.night:has(.boon--hush) .boon__pupil),
:global(.night:has(.boon--hush) .boon__iris) {
  animation-play-state: paused;
}

/* ================= everlasting ================= */
.boon__column {
  --tx: calc(var(--city-left, 0px) + var(--city-h, 600px) * 16 / 9 * .786);
  position: absolute;
  left: calc(var(--tx) - var(--u) * .3);
  top: 0;
  width: calc(var(--u) * .6);
  height: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .55);
  background: linear-gradient(180deg, transparent, color-mix(in oklab, var(--acc) 40%, transparent) 30%, color-mix(in oklab, var(--acc) 55%, transparent) 75%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 35%, #000 65%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 35%, #000 65%, transparent);
  mix-blend-mode: screen;
  transform-origin: 50% 0;
  animation: boon-fall 1.4s cubic-bezier(.5, 0, .3, 1) 1.8s both;
}

@keyframes boon-fall {
  from { opacity: 0; transform: scaleY(0); }
}

/* the tower takes the light */
.boon__tower-lit {
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
  background: radial-gradient(18% 34% at 78.6% 22%, color-mix(in oklab, var(--acc) 70%, #fff), transparent);
  -webkit-mask: var(--sig-city) 0 0 / 100% 100% no-repeat;
  mask: var(--sig-city) 0 0 / 100% 100% no-repeat;
  mix-blend-mode: screen;
  opacity: .7;
  animation: boon-fade 1.6s ease 2.8s both;
}

.boon__choir {
  position: absolute;
  left: calc(var(--city-left, 0px) + var(--city-h, 600px) * 16 / 9 * .786 + var(--u) * .2 * var(--dx));
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .85);
  width: 3px;
  height: 3px;
  background: var(--glow);
  box-shadow: 0 0 5px var(--acc);
  opacity: 0;
  scale: var(--s);
  animation: boon-rise var(--t) linear var(--d) infinite;
}

@keyframes boon-rise {
  0% { opacity: 0; transform: translateY(0); }
  15% { opacity: .9; }
  80% { opacity: .5; }
  100% { opacity: 0; transform: translateY(calc(var(--city-bottom, 100%) * -.32)); }
}

/* ================= secondlaw ================= */
/* no mask or opacity here: it would isolate the blend below from the scene */
.boon__drain-box {
  position: absolute;
  inset: 0;
}

.boon__drain,
.boon__drain-edge {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--scene-h, 900px) * 1.6);
  top: calc(var(--moon-y, 48%) - var(--scene-h, 900px) * 1.6);
  width: calc(var(--scene-h, 900px) * 3.2);
  aspect-ratio: 1;
  border-radius: 50%;
}

.boon__drain {
  /* the eye keeps its colour: the decay runs out from it */
  background: radial-gradient(circle, transparent calc(var(--u) * .85), #7d7d74 calc(var(--u) * 1.15));
  mix-blend-mode: saturation;
  opacity: .78;
  animation: boon-wave 2.6s cubic-bezier(.4, 0, .6, 1) 1.4s both;
}

.boon__drain-edge {
  background: radial-gradient(circle closest-side, transparent 84%, rgba(200, 198, 120, .28) 95%, transparent);
  opacity: 0;
  animation: boon-wave-edge 2.6s cubic-bezier(.4, 0, .6, 1) 1.4s both;
}

@keyframes boon-wave {
  from { transform: scale(.02); }
}

@keyframes boon-wave-edge {
  0% { opacity: 0; transform: scale(.02); }
  15% { opacity: 1; }
  100% { opacity: 0; transform: scale(1); }
}

.boon__haze {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(186, 184, 96, .2), rgba(170, 170, 90, .08) 60%, transparent);
  animation: boon-fade 3s ease 3s both;
}

/* a regulated zone: a square of fine grid, stamped */
.boon__grid {
  position: absolute;
  left: calc(var(--moon-x, 72%) + var(--u) * var(--x) - var(--u) * var(--s) / 2);
  top: calc(var(--moon-y, 48%) + var(--u) * var(--y) - var(--u) * var(--s) / 2);
  width: calc(var(--u) * var(--s));
  aspect-ratio: 1;
  border: 1px solid rgba(216, 211, 166, .5);
  background:
    repeating-linear-gradient(0deg, rgba(216, 211, 166, .3) 0 1px, transparent 1px 12.5%),
    repeating-linear-gradient(90deg, rgba(216, 211, 166, .3) 0 1px, transparent 1px 12.5%);
  opacity: .5;
  animation: boon-stamp .5s steps(3, end) var(--d) both;
}

@keyframes boon-stamp {
  0% { opacity: 0; transform: scale(1.25); }
  40% { opacity: 1; transform: scale(1); }
}

/* ================= patriarch ================= */
.boon__tree {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--u) * 5);
  top: calc(var(--moon-y, 48%) - var(--u) * 3);
  width: calc(var(--u) * 10);
  max-width: none;
  height: auto;
  aspect-ratio: 1000 / 600;
  overflow: visible;
  fill: none;
}

.boon__branch {
  stroke: color-mix(in oklab, var(--acc) 14%, #160a10);
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  opacity: .92;
  animation: boon-draw .7s ease-out var(--d) both;
}

/* rose sap-light running out along a few limbs, again and again */
.boon__sap {
  stroke: color-mix(in oklab, var(--acc) 85%, #fff);
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-dasharray: .07 .93;
  stroke-dashoffset: .07;
  opacity: 0;
  filter: drop-shadow(0 0 3px var(--acc));
  animation: boon-sap 6s ease-in var(--d) infinite;
}

@keyframes boon-sap {
  0% { opacity: 0; stroke-dashoffset: .07; }
  6% { opacity: .9; }
  45% { opacity: .9; stroke-dashoffset: -.93; }
  50%, 100% { opacity: 0; stroke-dashoffset: -.93; }
}

/* greed: gold catching in the twigs */
.boon__glint {
  position: absolute;
  left: calc(var(--moon-x, 72%) + var(--u) * var(--x));
  top: calc(var(--moon-y, 48%) + var(--u) * var(--y));
  width: 14px;
  height: 14px;
  margin: -7px 0 0 -7px;
  background:
    linear-gradient(90deg, transparent, #ffd56a 50%, transparent) center / 100% 1px no-repeat,
    linear-gradient(0deg, transparent, #ffd56a 50%, transparent) center / 1px 100% no-repeat,
    radial-gradient(circle closest-side, rgba(255, 214, 106, .9), transparent 45%);
  opacity: 0;
  animation: boon-glint var(--t) ease-in-out var(--d) infinite;
}

@keyframes boon-glint {
  0%, 100% { opacity: 0; transform: scale(.4) rotate(0); }
  40% { opacity: 1; transform: scale(1) rotate(30deg); }
  60% { opacity: .2; }
}

/* ================= chaos ================= */
.boon__city {
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
  container-type: size;
}

.boon__thorns {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  overflow: visible;
}

.boon__bramble {
  fill: none;
  stroke-width: 4;
  stroke-linejoin: round;
}

.boon__thorns-live .boon__bramble {
  stroke: #6e1620;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: boon-draw 1.8s cubic-bezier(.4, .1, .4, 1) 1.3s both;
}

.boon__thorns-live .boon__spikes {
  fill: #8a1d26;
  animation: boon-fade 1s ease 2.2s both;
}

/* red while it grows, then the rot: grey-brown, sagging */
.boon__thorns-live {
  animation: boon-wither-out 2.4s ease 4.2s both;
}

.boon__thorns-dead {
  opacity: 0;
  animation: boon-wither-in 2.4s ease 4.2s both;
}

.boon__thorns-dead .boon__bramble {
  stroke: #3b2a26;
}

.boon__thorns-dead .boon__spikes {
  fill: #4a3530;
}

@keyframes boon-wither-out {
  to { opacity: 0; }
}

@keyframes boon-wither-in {
  from { opacity: 0; transform: translateY(0); }
  to { opacity: .85; transform: translateY(3px); }
}

/* black flame: dark tongues with an ember edge, flickering on and on */
.boon__flame {
  position: absolute;
  width: 0;
  height: 0;
}

.boon__flame svg {
  position: absolute;
  left: -1.2cqh;
  bottom: 0;
  width: 2.4cqh;
  min-width: 14px;
  max-width: none;
  height: auto;
  fill: #070205;
  stroke: rgba(224, 149, 108, .75);
  stroke-width: .9;
  transform-origin: 50% 100%;
  scale: var(--s);
  filter: drop-shadow(0 0 4px rgba(200, 70, 40, .55));
  animation: boon-fade .8s ease var(--d) both, boon-flicker var(--f) ease-in-out var(--d) infinite alternate;
}

@keyframes boon-flicker {
  from { transform: scale(1, 1) skewX(0deg); }
  to { transform: scale(.88, 1.16) skewX(-5deg); }
}

/* ================= chaosmist ================= */
.boon__mist {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .34);
  bottom: 0;
  background:
    linear-gradient(180deg, transparent, rgba(169, 221, 232, .26) 30%, rgba(150, 200, 214, .34)),
    url('../assets/moon/fog-bank.webp') repeat-x 0 30% / 60% 100%;
  background-blend-mode: normal, screen;
  opacity: .9;
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 35%);
  mask-image: linear-gradient(180deg, transparent, #000 35%);
  animation: boon-fade 2s ease .6s both;
}

.boon__shadow,
.boon__seal {
  --meet-x: calc(var(--moon-x, 72%) + var(--u) * .2);
  --meet-y: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .14);
}

.boon__shadow {
  position: absolute;
  top: calc(var(--meet-y) - var(--city-h, 600px) * .025);
  height: calc(var(--city-h, 600px) * .05);
}

.boon__shadow svg {
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  fill: rgba(10, 18, 24, .62);
  filter: blur(1.5px);
}

.boon__shadow--l {
  left: 28%;
  width: calc(var(--meet-x) - 28%);
  transform-origin: 0 50%;
  animation: boon-reach 1.8s cubic-bezier(.4, .1, .3, 1) 1.2s both;
}

.boon__shadow--r {
  left: var(--meet-x);
  width: calc(98% - var(--meet-x));
  transform-origin: 100% 50%;
  animation: boon-reach 1.8s cubic-bezier(.4, .1, .3, 1) 1.35s both;
}

.boon__shadow--r svg {
  transform: scaleX(-1);
}

@keyframes boon-reach {
  from { opacity: 0; transform: scaleX(.05); }
  25% { opacity: 1; }
}

/* the contract struck: a small seal glints where the shadows touch, then stays, quiet */
.boon__seal {
  position: absolute;
  left: calc(var(--meet-x) - 13px);
  top: calc(var(--meet-y) - 13px);
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1.5px solid var(--glow);
  background:
    linear-gradient(45deg, transparent 46%, var(--glow) 47% 53%, transparent 54%) center / 50% 50% no-repeat,
    linear-gradient(-45deg, transparent 46%, var(--glow) 47% 53%, transparent 54%) center / 50% 50% no-repeat,
    radial-gradient(circle closest-side, color-mix(in oklab, var(--acc) 40%, transparent), transparent);
  box-shadow: 0 0 10px var(--acc);
  opacity: .5;
  animation: boon-seal 1.4s cubic-bezier(.3, 1.6, .5, 1) 3s both;
}

@keyframes boon-seal {
  0% { opacity: 0; transform: scale(.2) rotate(-45deg); }
  30% { opacity: 1; transform: scale(1.25) rotate(0); }
}

/* ================= sublunary ================= */
.boon__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  mix-blend-mode: soft-light;
  opacity: .5;
  animation: boon-fade 2.4s ease 1.6s both;
}

.boon__frame {
  position: absolute;
  left: 14px;
  right: 14px;
  top: calc(var(--site-header-stack, 96px) - 6px);
  height: calc(var(--scene-h, 100%) - var(--site-header-stack, 96px) - 8px);
  border: 9px solid transparent;
  border-image: linear-gradient(135deg, #7a5a24, #f3d58a 22%, #a67c34 42%, #ffe7a6 58%, #7a5a24 78%, #d9b064) 1;
  box-shadow: inset 0 0 0 1px rgba(50, 32, 8, .7), inset 0 0 24px rgba(0, 0, 0, .55);
  -webkit-mask-image: linear-gradient(90deg, transparent 8%, rgba(0, 0, 0, .35) 38%, #000 62%);
  mask-image: linear-gradient(90deg, transparent 8%, rgba(0, 0, 0, .35) 38%, #000 62%);
  animation: boon-fade 1.6s ease 2.4s both;
}

.boon__pixie {
  position: absolute;
  left: 0;
  top: 0;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #fff4d6;
  box-shadow: 0 0 6px 2px rgba(255, 220, 150, .7);
  opacity: 0;
  animation: boon-pixie var(--t) ease-in-out var(--d) infinite;
}

@keyframes boon-pixie {
  0% { opacity: 0; transform: translate(var(--x0), calc(var(--scene-h, 100vh) * var(--y0))) scale(1); }
  8% { opacity: 1; }
  33% { transform: translate(var(--x1), calc(var(--scene-h, 100vh) * var(--y1))) scale(1); }
  66% { opacity: 1; transform: translate(var(--x2), calc(var(--scene-h, 100vh) * var(--y2))) scale(1); }
  /* into the frame's edge, and gone behind the canvas */
  90%, 100% { opacity: 0; transform: translate(calc(100vw - 30px), calc(var(--scene-h, 100vh) * var(--y3))) scale(0); }
}

/* ================= paper ================= */
:root[data-theme="parchment"] .boon {
  --ink: color-mix(in oklab, var(--acc) 25%, #6a6074);
}

:root[data-theme="parchment"] .boon__pressure {
  opacity: .3;
  animation: boon-fade 2s ease .6s both;
}

:root[data-theme="parchment"] .boon__star {
  background: color-mix(in oklab, var(--acc) 60%, #3a2a40);
  box-shadow: none;
}

:root[data-theme="parchment"] .boon__void {
  background: radial-gradient(circle closest-side, #1c1820 86%, color-mix(in oklab, var(--acc) 70%, #333) 91%, transparent);
  box-shadow: none;
}

:root[data-theme="parchment"] .boon__branch {
  stroke: rgba(70, 48, 56, .6);
}

:root[data-theme="parchment"] .boon__hush {
  background: #6a6070;
}

:root[data-theme="parchment"] .boon__shadow svg {
  fill: rgba(60, 80, 90, .35);
}

:root[data-theme="parchment"] .boon__mist {
  opacity: .5;
}

:root[data-theme="parchment"] .boon__canvas {
  opacity: .3;
}

@media (max-width: 900px) {
  .boon__frame {
    left: 6px;
    right: 6px;
    border-width: 5px;
  }

  .boon__void,
  .boon__grid {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .boon__pull,
  .boon__crumb,
  .boon__fragment,
  .boon__edict,
  .boon__choir,
  .boon__pixie,
  .boon__drain-edge,
  .boon__hush,
  .boon__sap {
    display: none;
  }

  .boon__dark,
  .boon__iris,
  .boon__pupil,
  .boon__wheel,
  .boon__star,
  .boon__tendrils path,
  .boon__pressure,
  .boon__threads,
  .boon__threads path,
  .boon__void,
  .boon__column,
  .boon__tower-lit,
  .boon__drain,
  .boon__haze,
  .boon__grid,
  .boon__branch,
  .boon__glint,
  .boon__thorns-live,
  .boon__thorns-live .boon__bramble,
  .boon__thorns-live .boon__spikes,
  .boon__thorns-dead,
  .boon__flame svg,
  .boon__mist,
  .boon__shadow--l,
  .boon__shadow--r,
  .boon__seal,
  .boon__canvas,
  .boon__frame {
    animation: none;
  }

  .boon__tendrils path,
  .boon__threads path,
  .boon__branch {
    stroke-dashoffset: 0;
  }

  /* the end of each moment, held */
  .boon__eye--devouring .boon__pupil {
    transform: scale(4.6, 1.05);
  }

  .boon__thorns-live {
    opacity: 0;
  }

  .boon__thorns-dead {
    opacity: .85;
  }

  .boon__glint {
    opacity: .7;
  }
}
</style>
