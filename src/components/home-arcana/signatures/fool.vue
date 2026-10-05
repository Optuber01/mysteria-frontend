<template>
  <!--
    Fool: the gray fog rises out of the streets and swallows Backlund whole, until only the
    keep's two towers stand above a sea of fog, like the palace above the gray fog. Crimson
    stars hang over it, pulsing slowly and out of step; one brightens as if someone just
    prayed, then settles.
  -->
  <div class="fool" aria-hidden="true">
    <template v-if="layer === 'back'">
      <i v-for="(s, i) in stars" :key="i" class="fool__star" :class="{'fool__star--prayer': s.prayer}" :style="s.style">
        <i class="fool__glint"></i>
      </i>
    </template>
    <div v-else class="fool__sea">
      <div class="fool__rise">
        <i class="fool__body"></i>
        <!-- the surface: rows of moonlit billows, far to near -->
        <svg v-for="row in rows" :key="row.k" class="fool__swell" :class="`fool__swell--${row.k}`" :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="xMidYMax meet">
          <defs>
            <linearGradient :id="`fool-lobe-${row.k}`" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style="stop-color: rgb(var(--top))"/>
              <stop :offset="row.k === 'near' ? .3 : .42" style="stop-color: rgb(var(--mid))"/>
              <stop offset="1" style="stop-color: rgb(var(--mid))"/>
            </linearGradient>
          </defs>
          <rect x="0" :y="row.base" :width="W" :height="H - row.base" style="fill: rgb(var(--mid))"/>
          <ellipse v-for="(c, i) in row.lobes" :key="i" :cx="c[0]" :cy="c[1]" :rx="c[2] * 1.8" :ry="c[2] * .72" :fill="`url(#fool-lobe-${row.k})`"/>
        </svg>
        <i class="fool__wisps"></i>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{layer: 'back' | 'front'}>();

/*
 * The fog's surface, drawn as overlapping lobes (one row per depth) in a wide strip that
 * sways slowly: wider than any screen, so it never shows an end. Seeded, so the same sea
 * rises on every draw.
 */
const W = 3600;
const H = 300;
let seed = 7;
const rnd = (a: number, b: number) => {
  seed = (seed * 16807) % 2147483647;
  return a + ((seed - 1) / 2147483646) * (b - a);
};
function lobes(surface: number, rMin: number, rMax: number) {
  const out: [number, number, number][] = [];
  for (let x = -60; x < W + 60;) {
    const r = Math.round(rnd(rMin, rMax));
    out.push([Math.round(x), Math.round(surface + r * rnd(0.35, 0.6)), r]);
    x += r * rnd(1.5, 2.4);
  }
  return out;
}
const rows = [
  {k: 'far', base: 150, lobes: lobes(118, 26, 62)},
  {k: 'mid', base: 190, lobes: lobes(150, 34, 84)},
  {k: 'near', base: 236, lobes: lobes(196, 40, 100)},
];

/* Where the stars hang, in moon radii from the moon: in the open sky round the deck, above the fog. */
const stars = [
  {x: 1.95, y: -0.72, s: 1.25, t: 5.2, d: 0.3, prayer: true},
  {x: 2.2, y: -1.35, s: 0.9, t: 6.8, d: 1.9},
  {x: 2.36, y: -0.55, s: 0.7, t: 4.6, d: 3.1},
  {x: -2.25, y: -0.78, s: 0.85, t: 7.4, d: 2.4},
  {x: -1.9, y: -1.56, s: 1, t: 5.8, d: 0.9},
  {x: 0.55, y: -2.02, s: 0.75, t: 6.2, d: 3.6},
  {x: -0.62, y: -2.06, s: 0.8, t: 7.9, d: 1.4},
  {x: 1.5, y: -1.95, s: 0.95, t: 5.5, d: 2.8},
  {x: 2.3, y: -1.98, s: 0.65, t: 6.6, d: 0.6},
].map(s => ({
  prayer: !!s.prayer,
  style: {'--x': String(s.x), '--y': String(s.y), '--s': String(s.s), '--t': `${s.t}s`, '--d': `${s.d}s`},
}));
</script>

<style scoped>
.fool {
  /* the fog sea's colours: a moonlit top, a deep grey body */
  --top: 184, 182, 194;
  --mid: 128, 126, 140;
  --deep: 74, 72, 84;
  /* sea level: where the keep's body ends and only its two towers rise above */
  --sea: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .565);
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* ---- the crimson stars ---- */
.fool__star {
  position: absolute;
  left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * var(--x));
  top: calc(var(--moon-y, 48%) + var(--moon-r, 200px) * var(--y));
  width: 4px;
  height: 4px;
  margin: -2px 0 0 -2px;
  background: #ff5a64;
  scale: var(--s);
  animation:
    fool-appear 1.6s ease calc(1.4s + var(--d) * .3) both,
    fool-pulse var(--t) ease-in-out var(--d) infinite;
}

/* the star's own soft light (static; the star's opacity carries it) */
.fool__star::before {
  content: '';
  position: absolute;
  inset: -9px;
  border-radius: 50%;
  background: radial-gradient(circle closest-side, rgba(220, 40, 56, .7), rgba(200, 40, 60, .22) 45%, transparent);
}

/* a prayer arriving: thin crossed rays, only on the star that flares */
.fool__glint {
  display: none;
}

.fool__star--prayer .fool__glint {
  display: block;
  position: absolute;
  left: 50%;
  top: 50%;
  width: 46px;
  height: 46px;
  margin: -23px 0 0 -23px;
  background:
    linear-gradient(90deg, transparent, rgba(255, 120, 128, .85) 50%, transparent) center / 100% 1px no-repeat,
    linear-gradient(0deg, transparent, rgba(255, 120, 128, .85) 50%, transparent) center / 1px 100% no-repeat,
    radial-gradient(circle closest-side, rgba(255, 90, 100, .55), transparent 70%);
  opacity: 0;
  animation: fool-prayer 2.6s ease-out 3.4s both;
}

.fool__star--prayer {
  animation:
    fool-appear 1.6s ease 1.2s both,
    fool-flare 2.6s ease-out 3.4s both,
    fool-pulse var(--t) ease-in-out 6s infinite;
}

@keyframes fool-appear {
  from { opacity: 0; }
}

@keyframes fool-pulse {
  50% { opacity: .45; }
}

@keyframes fool-flare {
  0% { scale: var(--s); }
  18% { scale: calc(var(--s) * 2); }
  100% { scale: var(--s); }
}

@keyframes fool-prayer {
  0% { opacity: 0; transform: scale(.4) rotate(0deg); }
  16% { opacity: 1; transform: scale(1.15) rotate(8deg); }
  100% { opacity: 0; transform: scale(.8) rotate(16deg); }
}

/* ---- the sea of gray fog, in front of the city ---- */
.fool__sea {
  position: absolute;
  inset: calc(var(--sea) - 130px) 0 0;
  overflow: hidden;
  /* thinner over the copy column, full over the castle */
  -webkit-mask-image: linear-gradient(90deg, rgba(0, 0, 0, .5) 0%, rgba(0, 0, 0, .8) 30%, #000 50%);
  mask-image: linear-gradient(90deg, rgba(0, 0, 0, .5) 0%, rgba(0, 0, 0, .8) 30%, #000 50%);
}

/* it climbs out of the streets */
.fool__rise {
  position: absolute;
  inset: 0;
  animation: fool-rise 3.2s cubic-bezier(.25, .6, .3, 1) .5s both;
}

@keyframes fool-rise {
  from { opacity: 0; transform: translate3d(0, 62%, 0); }
  30% { opacity: 1; }
}

/* the deep fog under the surface, hiding the streets */
.fool__body {
  position: absolute;
  inset: 280px 0 0;
  background: linear-gradient(180deg, rgba(var(--mid), .94), rgba(var(--deep), .97) 45%, rgba(var(--deep), .98));
}

/* the billows: each row a wide strip, swaying slowly against the others (softened once, never re-blurred) */
.fool__swell {
  position: absolute;
  left: 50%;
  top: 0;
  height: 300px;
  width: auto;
  max-width: none;
  aspect-ratio: 3600 / 300;
  translate: -50% 0;
  filter: blur(3.5px);
  animation: fool-sway 52s ease-in-out infinite alternate;
  /* its own layer: rastered and blurred once, then only slid (otherwise the blur reruns every frame) */
  will-change: transform;
}

.fool__swell--far {
  opacity: .7;
  animation-duration: 70s;
}

.fool__swell--mid {
  opacity: .92;
  animation-direction: alternate-reverse;
}

.fool__swell--near {
  filter: blur(6px);
  animation-duration: 40s;
}

@keyframes fool-sway {
  from { transform: translate3d(-3%, 0, 0); }
  to { transform: translate3d(3%, 0, 0); }
}

/* wisps moving through it (the scene's own fog texture, lightened) */
.fool__wisps {
  position: absolute;
  top: 150px;
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 40%);
  mask-image: linear-gradient(180deg, transparent, #000 40%);
  left: 0;
  width: 200%;
  height: 260px;
  background: url('../assets/moon/fog-bank.webp') repeat-x 0 0 / 50% 100%;
  mix-blend-mode: screen;
  opacity: .4;
  animation: fool-drift 120s linear infinite;
  will-change: transform;
}

@keyframes fool-drift {
  to { transform: translate3d(-50%, 0, 0); }
}

/* paper: a pale fog, the same sea */
:root[data-theme="parchment"] .fool {
  --top: 246, 245, 248;
  --mid: 226, 224, 230;
  --deep: 216, 213, 220;
}

:root[data-theme="parchment"] .fool__wisps {
  display: none;
}

:root[data-theme="parchment"] .fool__star::before {
  background: radial-gradient(circle closest-side, rgba(200, 40, 56, .35), transparent);
}

@media (max-width: 900px) {
  /* stacked: the sea stays, the stars round the deck would only sit under it */
  .fool__star {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fool__rise,
  .fool__swell,
  .fool__wisps,
  .fool__star,
  .fool__star--prayer {
    animation: none;
  }

  .fool__glint {
    display: none !important;
  }
}
</style>
