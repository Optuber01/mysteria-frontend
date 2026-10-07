<template>
  <!--
    Darkness: silence. The last stars go out one by one, ink creeps in from the edges of the
    frame, and only a faint cold sheen is left on the rim of the moon. Nothing moves once it
    has settled.
  -->
  <div v-if="layer === 'back'" class="fx fx--darkness fx--back" :class="{'is-late': late}">
    <!-- the stars, in groups that go out together: one group at a time reads as one by one -->
    <div class="dk-stars">
      <i v-for="(group, i) in STARS" :key="i" class="dk-star" :style="group"></i>
    </div>
    <div class="sky-anchor dk-anchor">
      <i class="dk-rim"></i>
    </div>
  </div>
  <div v-else class="fx fx--darkness fx--front">
    <div class="dk-ink">
      <i v-for="(tongue, i) in TONGUES" :key="i" class="dk-tongue" :style="tongue"></i>
      <i class="dk-veil"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import type {Body} from '../skyScenes';

defineOptions({name: 'SkyDarknessEffect'});
const props = defineProps<{layer: 'back' | 'front'; body: Body; from: Body}>();

/* The moon comes back into a sky that held a sun (or a storm); the dark waits for it. */
const late = computed(() => props.from !== 'moon');

/* A seeded stream, so the sky is the same on every load. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/*
 * Twelve groups of stars, each one element with its stars as shadows: they go out in a
 * scattered order, a group at a time, between 0.4s and 1.8s.
 */
const rnd = seeded(2026);
const GROUPS = 12;
const ORDER = Array.from({length: GROUPS}, (_, i) => 0.4 + (i * 1.4) / (GROUPS - 1)).sort(() => rnd() - 0.5);
const STARS = ORDER.map((delay) => {
  const shadows = Array.from({length: 9}, () => {
    const x = 0.02 + rnd() * 0.96;
    const y = 0.03 + rnd() * 0.5;
    const glow = rnd() < 0.45 ? '5px' : '1px';
    const spread = rnd() < 0.4 ? '1.2px' : '.5px';
    return `calc(100vw * ${x.toFixed(3)}) calc(var(--scene-h, 100vh) * ${y.toFixed(3)}) ${glow} ${spread} var(--star)`;
  });
  return {boxShadow: shadows.join(','), '--d': `${delay.toFixed(2)}s`};
});

/*
 * The ink: where each tongue enters (the edge point, in % of the frame), its size, when it
 * starts, and the way it pours in from (as a % of its own size).
 */
const TONGUES = [
  {x: 58, y: -6, w: 120, h: 62, d: 0.5, fx: 0, fy: -55},
  {x: 104, y: 6, w: 80, h: 80, d: 0.65, fx: 55, fy: -30},
  {x: 18, y: -6, w: 100, h: 60, d: 0.8, fx: -20, fy: -55},
  {x: 106, y: 56, w: 60, h: 110, d: 0.9, fx: 55, fy: 0},
  {x: -6, y: 46, w: 64, h: 120, d: 1, fx: -55, fy: 0},
  {x: 28, y: 108, w: 110, h: 58, d: 1.15, fx: -10, fy: 55},
  {x: 82, y: 110, w: 100, h: 62, d: 1.25, fx: 10, fy: 55},
].map(t => ({
  left: `${t.x}%`, top: `${t.y}%`, '--w': `${t.w}%`, '--h': `${t.h}%`, '--d': `${t.d}s`, '--fx': `${t.fx}%`, '--fy': `${t.fy}%`,
}));
</script>

<style scoped>
.fx {
  --ink: rgb(3, 3, 9);
  --star: #e8eeff;
  /* her moon is back at the earliest after this: later if it had to rise first */
  --lead: 0s;
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.fx.is-late {
  --lead: 1.3s;
}

/* ---- behind the castle: the stars, and the sheen on the moon ---- */
/* the stars keep off the moon's face (the moon is painted under this layer) */
.dk-stars {
  position: absolute;
  inset: 0;
  -webkit-mask-image: radial-gradient(circle at var(--moon-x, 72%) var(--moon-y, 48%), transparent calc(var(--moon-r, 200px) * 1.15), #000 calc(var(--moon-r, 200px) * 1.4));
  mask-image: radial-gradient(circle at var(--moon-x, 72%) var(--moon-y, 48%), transparent calc(var(--moon-r, 200px) * 1.15), #000 calc(var(--moon-r, 200px) * 1.4));
}

.dk-star {
  position: absolute;
  left: 0;
  top: 0;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  opacity: 1;
  will-change: opacity;
  animation: dk-out 1s ease calc(var(--d) + var(--lead)) both;
}

@keyframes dk-out {
  0% { opacity: 1; }
  35% { opacity: .35; }
  50% { opacity: .8; }
  100% { opacity: 0; }
}

/* the box on the moon, which the scene moves with it as the page scrolls */
.dk-anchor {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  aspect-ratio: 1;
  /* (the sheen fades in on the anchor: a second opacity animation on the sheen itself is not composited) */
  animation: dk-rim-in 1.8s ease calc(.9s + var(--lead)) backwards;
}

/* a cold sheen on the rim, strongest on the side the light would come from */
.dk-rim {
  position: absolute;
  inset: -2%;
  border-radius: 50%;
  scale: var(--moon-scale, 1);
  background: radial-gradient(circle closest-side, transparent 76%, color-mix(in srgb, var(--acc, #8fa6d8) 30%, #c4d2f0 70%) 91%, #e2eaff 96%, transparent 100%);
  -webkit-mask-image: conic-gradient(from 190deg, transparent, #000 20%, rgba(0, 0, 0, .5) 46%, transparent 78%);
  mask-image: conic-gradient(from 190deg, transparent, #000 20%, rgba(0, 0, 0, .5) 46%, transparent 78%);
  opacity: .85;
  will-change: opacity;
  animation: dk-breathe 14s ease-in-out infinite;
}

@keyframes dk-rim-in {
  from { opacity: 0; }
}

@keyframes dk-breathe {
  0%, 100% { opacity: .85; }
  50% { opacity: .5; }
}

/* ---- in front: the ink, kept off the moon by a hole ---- */
.dk-ink {
  position: absolute;
  inset: 0;
  -webkit-mask-image: radial-gradient(circle at var(--moon-x, 72%) var(--moon-y, 48%), transparent calc(var(--moon-r, 200px) * 1.02), rgba(0, 0, 0, .5) calc(var(--moon-r, 200px) * 1.3), #000 calc(var(--moon-r, 200px) * 2));
  mask-image: radial-gradient(circle at var(--moon-x, 72%) var(--moon-y, 48%), transparent calc(var(--moon-r, 200px) * 1.02), rgba(0, 0, 0, .5) calc(var(--moon-r, 200px) * 1.3), #000 calc(var(--moon-r, 200px) * 2));
}

/* a tongue of ink, its soft front leading */
.dk-tongue {
  position: absolute;
  width: var(--w);
  height: var(--h);
  translate: -50% -50%;
  border-radius: 50%;
  background: radial-gradient(closest-side, var(--ink) 30%, color-mix(in srgb, var(--ink) 85%, transparent) 55%, color-mix(in srgb, var(--ink) 35%, transparent) 80%, transparent);
  opacity: .9;
  animation: dk-pour 1.5s cubic-bezier(.45, .05, .3, 1) var(--d) backwards;
}

@keyframes dk-pour {
  from { opacity: 0; transform: translate(var(--fx), var(--fy)) scale(.55); }
}

/* the dark settling evenly where the tongues meet */
.dk-veil {
  position: absolute;
  inset: 0;
  background: var(--ink);
  opacity: .4;
  animation: dk-settle 1.4s ease 1.1s backwards;
}

@keyframes dk-settle {
  from { opacity: 0; }
}

/* ---- light theme (Darkness is never drawn there, but if it is): dusk, not ink ---- */
:root[data-theme="parchment"] .fx {
  --ink: rgb(74, 70, 98);
  --star: #6a6f9a;
}

:root[data-theme="parchment"] .dk-ink {
  opacity: .12;
}

:root[data-theme="parchment"] .dk-rim {
  background: radial-gradient(circle closest-side, transparent 76%, rgba(96, 104, 150, .3) 91%, rgba(80, 88, 134, .55) 96%, transparent 100%);
}

@media (prefers-reduced-motion: reduce) {
  .dk-star {
    display: none;
  }

  .dk-rim,
  .dk-tongue,
  .dk-veil {
    animation: none;
  }
}
</style>
