<template>
  <!--
    Demoness: everything freezes. Frost grows in from the top and right edges of the sky in
    hexagonal crystals; a cold mirror-double of whatever hangs in the sky slides out beside
    it, where it can be seen past the deck; the castle's edges take a cold pink light; frost
    glitter falls (the scene's snow). Catastrophe as stillness and cold, nothing drawn but
    ice and light.
  -->
  <div class="dm" :class="`is-from-${body}`" aria-hidden="true" :style="{'--sig-city': `url(${city})`, '--frost': frostUrl ? `url(${frostUrl})` : 'none'}">
    <template v-if="layer === 'back'">
      <!-- the mirror-double: the real moon (or a sun) reflected wrong, up and to the right -->
      <div class="dm__double">
        <img v-if="body === 'moon'" class="dm__double-moon" :src="moon" alt="" width="640" height="640" decoding="async">
        <i v-else class="dm__double-sun"></i>
      </div>
      <i class="dm__cold"></i>
    </template>
    <template v-else>
      <i class="dm__rim"></i>
      <i class="dm__frost dm__frost--top"></i>
      <i class="dm__frost dm__frost--side"></i>
    </template>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, ref} from 'vue';
import city from '../assets/moon/backlund-skyline.webp';
import moon from '../assets/moon/crimson-moon.webp';
import {seeded} from './sigKit';

defineOptions({name: 'SignatureDemoness'});
const props = defineProps<{layer: 'back' | 'front'; from?: string}>();

/* the body the mirror doubles: a sun if a sun was up (it stays), else the moon */
const body = computed(() => (props.from === 'sun' || props.from === 'dusk' ? 'sun' : 'moon'));

/*
 * The frost: hexagonal dendrites (six arms, branches at 60 degrees), drawn once on a small
 * canvas and kept as an image, so it costs nothing after the first frame. Shared by every
 * mount of this file.
 */
let frostCache = '';
function frostTexture(): string {
  if (frostCache) return frostCache;
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const c = canvas.getContext('2d');
  if (!c) return '';
  const rand = seeded(61);
  c.lineCap = 'round';
  const arm = (x: number, y: number, angle: number, length: number, width: number, depth: number) => {
    const ex = x + Math.cos(angle) * length;
    const ey = y + Math.sin(angle) * length;
    c.lineWidth = width;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(ex, ey);
    c.stroke();
    if (depth <= 0) return;
    const branches = 2 + Math.floor(rand() * 3);
    for (let i = 1; i <= branches; i++) {
      const t = i / (branches + 1);
      const bx = x + (ex - x) * t;
      const by = y + (ey - y) * t;
      const sub = length * (0.45 - t * 0.25);
      arm(bx, by, angle + Math.PI / 3, sub, width * 0.6, depth - 1);
      arm(bx, by, angle - Math.PI / 3, sub, width * 0.6, depth - 1);
    }
  };
  for (let i = 0; i < 90; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 6 + rand() * 20;
    const turn = rand() * Math.PI;
    c.strokeStyle = `rgba(250, 236, 252, ${(0.25 + rand() * 0.45).toFixed(2)})`;
    for (let k = 0; k < 6; k++) arm(x, y, turn + (k * Math.PI) / 3, r, 1, 2);
  }
  // a fine rime between the crystals
  for (let i = 0; i < 1400; i++) {
    c.fillStyle = `rgba(245, 230, 250, ${(rand() * 0.35).toFixed(2)})`;
    c.fillRect(rand() * size, rand() * size, 1, 1);
  }
  frostCache = canvas.toDataURL('image/png');
  return frostCache;
}

const frostUrl = ref('');
onMounted(() => {
  if (props.layer === 'front') frostUrl.value = frostTexture();
});
</script>

<style scoped>
.dm {
  --H: var(--city-h, 600px);
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* ---- behind ---- */
/* the double: up and to the right of the body, out past the fan, cold and pale */
.dm__double {
  position: absolute;
  left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * .55);
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * 1.75);
  width: calc(var(--moon-r, 200px) * 1.2);
  aspect-ratio: 1;
  opacity: .5;
  animation: dm-double 1.8s cubic-bezier(.2, .7, .2, 1) .5s both;
}

.dm__double-moon {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  filter: hue-rotate(-40deg) saturate(.55) brightness(1.25);
  transform: scaleX(-1);
}

.dm__double-sun {
  position: absolute;
  inset: 8%;
  border-radius: 50%;
  background: radial-gradient(circle, #fff4fb 0%, #f2c8e6 50%, #c890c8 100%);
  box-shadow: 0 0 40px rgba(240, 190, 230, .6);
}

@keyframes dm-double {
  from { opacity: 0; transform: translate3d(calc(var(--moon-r, 200px) * -.9), calc(var(--moon-r, 200px) * 1.2), 0) scale(.7); }
}

/* the cold over the sky: pink-violet light pooling from the upper right */
.dm__cold {
  position: absolute;
  inset: 0;
  background: radial-gradient(70% 60% at 85% 10%, rgba(230, 170, 230, .22), rgba(150, 90, 170, .1) 45%, transparent 75%);
  animation: dm-fade 1.4s ease .2s both;
}

/* ---- in front ---- */
/* the castle's top edges in a cold pink light */
.dm__rim {
  --k: calc(var(--H) * .005);
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--H));
  height: var(--H);
  aspect-ratio: 16 / 9;
  background: linear-gradient(180deg, rgba(255, 220, 250, .95), rgba(230, 150, 220, .55) 50%, transparent 90%);
  -webkit-mask: var(--sig-city) 0 0 / 100% 100% no-repeat, var(--sig-city) 0 var(--k) / 100% 100% no-repeat;
  -webkit-mask-composite: source-out;
  mask: var(--sig-city) 0 0 / 100% 100% no-repeat, var(--sig-city) 0 var(--k) / 100% 100% no-repeat;
  mask-composite: subtract;
  opacity: .7;
  animation: dm-fade 1.4s ease .9s both;
}

/* frost: the crystal texture, thick at the edge, thinning inward; grows in from the edge */
.dm__frost {
  position: absolute;
  background: var(--frost) repeat 0 0 / 220px 220px;
  will-change: transform, opacity;
}

.dm__frost--top {
  left: 0;
  right: 0;
  top: 0;
  height: 34%;
  -webkit-mask-image: linear-gradient(180deg, #000 0%, rgba(0, 0, 0, .5) 35%, transparent 100%), linear-gradient(90deg, transparent 0%, #000 40%);
  -webkit-mask-composite: source-in;
  mask-image: linear-gradient(180deg, #000 0%, rgba(0, 0, 0, .5) 35%, transparent 100%), linear-gradient(90deg, transparent 0%, #000 40%);
  mask-composite: intersect;
  transform-origin: 50% 0;
  animation: dm-grow-down 1.8s cubic-bezier(.2, .7, .2, 1) .3s both;
}

.dm__frost--side {
  top: 0;
  right: 0;
  bottom: 0;
  width: 26%;
  -webkit-mask-image: linear-gradient(270deg, #000 0%, rgba(0, 0, 0, .45) 40%, transparent 100%);
  mask-image: linear-gradient(270deg, #000 0%, rgba(0, 0, 0, .45) 40%, transparent 100%);
  transform-origin: 100% 50%;
  animation: dm-grow-in 1.8s cubic-bezier(.2, .7, .2, 1) .5s both;
}

@keyframes dm-grow-down {
  from { opacity: 0; transform: scaleY(.2); }
}

@keyframes dm-grow-in {
  from { opacity: 0; transform: scaleX(.2); }
}

@keyframes dm-fade {
  from { opacity: 0; }
}

@media (max-width: 900px) {
  .dm__double {
    left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * .35);
    top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * 1.55);
  }

  .dm__frost--side {
    width: 18%;
  }
}

/* paper: frost as a pale violet rime, the double faint */
:root[data-theme="parchment"] .dm__frost {
  filter: invert(.6) sepia(.2) hue-rotate(250deg);
  opacity: .5;
}

:root[data-theme="parchment"] .dm__rim,
:root[data-theme="parchment"] .dm__cold {
  mix-blend-mode: multiply;
}

@media (prefers-reduced-motion: reduce) {
  .dm__double,
  .dm__cold,
  .dm__rim,
  .dm__frost--top,
  .dm__frost--side {
    animation: none;
  }
}
</style>
