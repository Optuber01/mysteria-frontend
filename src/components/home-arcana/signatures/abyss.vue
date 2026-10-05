<template>
  <!--
    Abyss: the pit opens. The sulfur smoke in the streets splits, a fissure glows open
    beneath the skyline and sulfurous fire breathes up out of it, lighting the castle from
    below until the city stands black against it; then it sinks back to a smouldering
    seam that stays. Fire from below only: no horizon blaze, no ravens, no goat heads.
  -->
  <div class="abyss" aria-hidden="true">
    <!-- behind the castle: the pit's glow, rising, so the skyline stands black against it -->
    <i v-if="layer === 'back'" class="abyss__glow"></i>

    <template v-else>
      <!-- the castle's undersides catch the light from below -->
      <div class="abyss__city">
        <i class="abyss__underlight" :style="{'--city-mask': `url(${city})`}"></i>
      </div>

      <div class="abyss__pit">
        <!-- the street's sulfur smoke, parting -->
        <i class="abyss__smoke abyss__smoke--l"></i>
        <i class="abyss__smoke abyss__smoke--r"></i>

        <!-- the fissure -->
        <div class="abyss__fissure">
          <svg class="abyss__crack" viewBox="0 0 1000 60" preserveAspectRatio="none">
            <defs>
              <filter id="abyss-blur" x="-10%" y="-200%" width="120%" height="500%">
                <feGaussianBlur stdDeviation="5 4"/>
              </filter>
              <linearGradient id="abyss-core" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#ff9a30"/>
                <stop offset=".5" stop-color="#fff2b0"/>
                <stop offset="1" stop-color="#ff7a26"/>
              </linearGradient>
            </defs>
            <path :d="CRACK.outer" fill="#ff6a24" opacity=".75" filter="url(#abyss-blur)"/>
            <path v-for="(b, i) in CRACK.branches" :key="i" :d="b" fill="none" stroke="#ff8a32" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
            <path :d="CRACK.outer" fill="url(#abyss-core)"/>
            <path :d="CRACK.inner" fill="#fffbe0" opacity=".85"/>
          </svg>
        </div>

        <!-- the fire breathing up out of it: overlapping sheets of flame, each with its own tongues -->
        <div
            v-for="(f, i) in SHEETS"
            :key="i"
            class="abyss__flame"
            :style="{left: `${f.x}%`, width: `${f.w}%`, '--h': f.h, '--i': i}"
        >
          <svg class="abyss__tongue" viewBox="0 0 200 100" preserveAspectRatio="none">
            <defs>
              <linearGradient :id="`abyss-flame-${i}`" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stop-color="#fff6c8"/>
                <stop offset=".2" stop-color="#ffd860"/>
                <stop offset=".48" stop-color="#ff8f2a" stop-opacity=".85"/>
                <stop offset=".78" stop-color="#d8401c" stop-opacity=".4"/>
                <stop offset="1" stop-color="#a02814" stop-opacity="0"/>
              </linearGradient>
              <filter :id="`abyss-soft-${i}`" x="-5%" y="-5%" width="110%" height="110%">
                <feGaussianBlur stdDeviation="1.6 1"/>
              </filter>
            </defs>
            <path :d="f.d" :fill="`url(#abyss-flame-${i})`" :filter="`url(#abyss-soft-${i})`"/>
          </svg>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import city from '../assets/moon/backlund-skyline.webp';

defineOptions({name: 'SignatureAbyss'});
defineProps<{layer: 'back' | 'front'}>();

/* the same crack on every load */
function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** A jagged seam, thickest in the middle, with a few hairline forks. */
function makeCrack() {
  const r = rand(4021);
  const top: string[] = [];
  const bottom: string[] = [];
  const innerTop: string[] = [];
  const innerBottom: string[] = [];
  const branches: string[] = [];
  let mid = 30;
  for (let i = 0; i <= 40; i++) {
    const x = i * 25;
    const t = Math.pow(Math.sin((Math.PI * x) / 1000), 0.7);
    mid += (r() - 0.5) * 6;
    mid = Math.max(24, Math.min(36, mid));
    const up = t * (7 + r() * 9);
    const down = t * (6 + r() * 9);
    top.push(`${x} ${(mid - up).toFixed(1)}`);
    bottom.unshift(`${x} ${(mid + down).toFixed(1)}`);
    innerTop.push(`${x} ${(mid - up * 0.32).toFixed(1)}`);
    innerBottom.unshift(`${x} ${(mid + down * 0.32).toFixed(1)}`);
    if (i % 5 === 2 && i > 3 && i < 38) {
      const dir = r() < 0.5 ? -1 : 1;
      const len = 30 + r() * 40;
      branches.push(`M${x} ${mid.toFixed(1)} L${(x + len * 0.5).toFixed(1)} ${(mid + dir * (10 + r() * 6)).toFixed(1)} L${(x + len).toFixed(1)} ${(mid + dir * (18 + r() * 8)).toFixed(1)}`);
    }
  }
  return {
    outer: `M${top.join(' L')} L${bottom.join(' L')} Z`,
    inner: `M${innerTop.join(' L')} L${innerBottom.join(' L')} Z`,
    branches,
  };
}
const CRACK = makeCrack();

/** A sheet of fire (viewBox 200 x 100, base at the bottom): tongues of uneven height, leaning with the draught. */
function sheet(r: () => number) {
  const n = 3 + Math.floor(r() * 3);
  const step = 200 / n;
  let d = 'M0 100 L0 86';
  let x = 0;
  for (let k = 0; k < n; k++) {
    const tipX = x + step * (0.35 + r() * 0.3);
    const tipY = r() * 45;
    const next = x + step;
    const valleyY = 62 + r() * 26;
    const lean = (r() - 0.4) * step * 0.25;
    d += ` C${(x + step * 0.25).toFixed(1)} 80 ${(tipX - step * 0.12).toFixed(1)} ${(tipY + 40).toFixed(1)} ${(tipX + lean).toFixed(1)} ${tipY.toFixed(1)}`;
    d += ` C${(tipX + step * 0.08).toFixed(1)} ${(tipY + 42).toFixed(1)} ${(next - step * 0.25).toFixed(1)} ${(valleyY - 6).toFixed(1)} ${next.toFixed(1)} ${(k === n - 1 ? 86 : valleyY).toFixed(1)}`;
    x = next;
  }
  return `${d} L200 100 Z`;
}

/** The sheets along the seam: where they start (% across), how wide, how tall at the breath's peak. */
const SHEETS = (() => {
  const r = rand(77);
  return Array.from({length: 7}, (_, i) => {
    const x = -2 + i * 14 + (r() - 0.5) * 4;
    // low in the middle, under the deck and its buttons; tallest out at the ends
    const side = Math.min(1, Math.abs(x + 11 - 50) / 40);
    return {x: +x.toFixed(1), w: +(20 + r() * 8).toFixed(1), h: +(0.4 + side * 0.75 + r() * 0.15).toFixed(2), d: sheet(r)};
  });
})();
</script>

<style scoped>
.abyss {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* ---- back: the glow behind the city ---- */
.abyss__glow {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px) * 4);
  width: calc(var(--moon-r, 200px) * 8);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .3 - var(--moon-r, 200px) * 1.8);
  height: calc(var(--moon-r, 200px) * 3.6);
  background: radial-gradient(closest-side at 50% 70%, rgba(255, 196, 90, .85), rgba(242, 96, 44, .5) 35%, rgba(150, 40, 15, .2) 66%, transparent);
  mix-blend-mode: screen;
  transform-origin: 50% 100%;
  opacity: .42;
  will-change: transform, opacity;
  animation:
    abyss-breathe 3.8s ease-in-out 1.1s backwards,
    abyss-smoulder 5s ease-in-out 4.9s infinite alternate;
}

@keyframes abyss-breathe {
  0% { opacity: 0; transform: scaleY(.4); }
  35% { opacity: 1; transform: none; }
  55% { opacity: 1; }
  100% { opacity: .42; }
}

@keyframes abyss-smoulder {
  from { opacity: .42; }
  to { opacity: .3; }
}

/* ---- front: under-light on the castle, cut to its shape ---- */
.abyss__city {
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
}

.abyss__underlight {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(255, 130, 46, .5) 0%, rgba(242, 83, 61, .22) 30%, transparent 58%);
  -webkit-mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mix-blend-mode: screen;
  opacity: .4;
  animation: abyss-breathe 3.8s ease-in-out 1.1s backwards;
}

/* ---- front: the pit, at the castle's foot ---- */
.abyss__pit {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px) * 2.6);
  right: 0;
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .075);
  height: 0;
}

.abyss__smoke {
  position: absolute;
  top: calc(var(--moon-r, 200px) * -.5);
  height: calc(var(--moon-r, 200px) * 1);
  width: 62%;
  background: url('../assets/moon/fog-bank.webp') repeat-x 0 50% / 70% 100%;
  filter: sepia(1) saturate(1.6) hue-rotate(-8deg) brightness(.85);
  mix-blend-mode: screen;
  -webkit-mask-image: radial-gradient(closest-side, #000 35%, transparent);
  mask-image: radial-gradient(closest-side, #000 35%, transparent);
  opacity: .32;
  will-change: transform;
}

.abyss__smoke--l {
  left: 0;
  transform: translate3d(-30%, 0, 0);
  animation: abyss-part-l 2.2s cubic-bezier(.4, 0, .2, 1) .7s backwards;
}

.abyss__smoke--r {
  right: 0;
  background-position-x: 40%;
  transform: translate3d(30%, 0, 0);
  animation: abyss-part-r 2.2s cubic-bezier(.4, 0, .2, 1) .7s backwards;
}

@keyframes abyss-part-l {
  from { opacity: .7; transform: translate3d(16%, 0, 0); }
}

@keyframes abyss-part-r {
  from { opacity: .7; transform: translate3d(-16%, 0, 0); }
}

.abyss__fissure {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(var(--moon-r, 200px) * -.11);
  height: calc(var(--moon-r, 200px) * .22);
  transform: scaleY(.6);
  will-change: transform;
  animation:
    abyss-open 4s cubic-bezier(.3, 0, .2, 1) 1s backwards,
    abyss-seam 3.6s ease-in-out 5s infinite alternate;
}

/* it tears open from the middle outward, gapes while the fire breathes, then narrows to a seam */
@keyframes abyss-open {
  0% { opacity: 0; transform: scale(.12, 0); }
  8% { opacity: 1; }
  28% { transform: scale(1, 1.2); }
  55% { transform: scale(1, 1.1); }
  100% { transform: scaleY(.6); }
}

@keyframes abyss-seam {
  from { opacity: 1; }
  to { opacity: .72; }
}

.abyss__crack {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* ---- the fire ---- */
.abyss__flame {
  position: absolute;
  bottom: 0;
  height: calc(var(--moon-r, 200px) * .85 * var(--h));
  transform-origin: 50% 100%;
  mix-blend-mode: screen;
  /* small and low once the breath is spent */
  transform: scaleY(.16);
  will-change: transform;
  animation: abyss-flare 3.2s cubic-bezier(.3, .1, .3, 1) calc(1.35s + var(--i) * .05s) backwards;
}

@keyframes abyss-flare {
  0% { opacity: 0; transform: scaleY(0); }
  10% { opacity: 1; }
  30% { transform: none; }
  45% { transform: scaleY(.82); }
  58% { transform: scaleY(.92); }
  100% { transform: scaleY(.16); }
}

.abyss__tongue {
  display: block;
  width: 100%;
  height: 100%;
  transform-origin: 50% 100%;
  animation: abyss-flicker calc(.9s + var(--i) * .11s) ease-in-out calc(var(--i) * -.37s) infinite alternate;
}

@keyframes abyss-flicker {
  from { transform: scaleY(.88) skewX(-3deg); }
  to { transform: scaleY(1.1) skewX(2deg); }
}

/* light theme: no glow can lighten paper, so the fire is drawn in plain colour, fainter */
:root[data-theme="parchment"] .abyss__glow,
:root[data-theme="parchment"] .abyss__underlight,
:root[data-theme="parchment"] .abyss__flame {
  mix-blend-mode: normal;
}

:root[data-theme="parchment"] .abyss__glow {
  opacity: .22;
  animation: none;
}

:root[data-theme="parchment"] .abyss__underlight {
  opacity: .25;
}

:root[data-theme="parchment"] .abyss__smoke {
  mix-blend-mode: multiply;
  filter: invert(1) sepia(.6) brightness(.95);
  opacity: .2;
}

:root[data-theme="parchment"] .abyss__pit {
  opacity: .85;
}

@media (prefers-reduced-motion: reduce) {
  .abyss__glow,
  .abyss__underlight,
  .abyss__smoke--l,
  .abyss__smoke--r,
  .abyss__fissure,
  .abyss__flame,
  .abyss__tongue {
    animation: none;
  }
}
</style>
