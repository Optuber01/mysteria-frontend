<template>
  <!--
    Fool: grey fog rises out of the streets, bank over bank, until Backlund is gone under it
    and only the spires stand above. It is the scene's own fog technique (the fog-bank texture
    repeated across a layer twice as wide, drifting), tinted and cut to the texture so it stays
    right on paper too. A few crimson points of light pulse deep in it, like prayers heard.
  -->
  <div v-if="layer === 'back'" class="fx fx--fool fx--back" :class="`is-${tone}`">
    <!-- a sun's light, caught in the fog behind the castle -->
    <div v-if="tone !== 'night'" class="sky-anchor fx__sunbox"><i class="fx__sunlit"></i></div>
    <!-- the thin bank behind the castle, so the spires stand dark against grey -->
    <div class="fx__flow fx__flow--back"><i class="fx__bank fx__bank--far"></i></div>
  </div>
  <div v-else class="fx fx--fool fx--front" :class="`is-${tone}`">
    <!-- two flows, drifting opposite ways, carry two banks each -->
    <div v-for="(flow, f) in FLOWS" :key="f" class="fx__flow" :style="{'--s': `${flow.s}s`, '--dir': flow.dir}">
      <i v-for="(b, i) in flow.banks" :key="i" class="fx__bank" :style="b"></i>
    </div>
    <i v-for="(p, i) in POINTS" :key="`p${i}`" class="fx__points" :style="p"></i>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import type {Body} from '../skyScenes';

defineOptions({name: 'SkyFoolEffect'});
const props = defineProps<{layer: 'back' | 'front'; body: Body; from: Body}>();

/** The fog takes the colour of what hangs over it: grey under the moon, warm under a sun. */
const tone = computed(() => (props.body === 'sun' ? 'sun' : props.body === 'dusk' ? 'dusk' : 'night'));

/*
 * The banks, from the street up: where the bank's foot sits and how tall it is (in city
 * heights above the city's foot), its strength, when it starts to rise, and where in the
 * texture it starts, so no two banks line up. The top one levels off under the spires.
 */
const bank = (b: number, h: number, o: number, d: number, x: number) => ({
  '--b': b,
  '--h': h,
  '--o': o,
  '--d': `${d}s`,
  '--x': `${x}%`,
});
const FLOWS = [
  {s: 150, dir: 'normal', banks: [bank(-.12, .56, .62, 0, 0), bank(.15, .44, .48, .5, 71)]},
  {s: 120, dir: 'reverse', banks: [bank(.02, .5, .55, .25, 37), bank(.27, .4, .4, .75, 13)]},
];

/*
 * Crimson points in the fog, as two sets of radial gradients (x and y in per cent of the
 * city's box, y from its top), pulsing out of step. The first bank's top is about 44%.
 */
const SETS = [
  [[36, 62], [58, 74], [76, 58], [92, 70]],
  [[47, 82], [67, 66], [84, 80], [40, 88]],
];
const POINTS = SETS.map((set, i) => ({
  '--pts': set
    .map(([x, y]) => `radial-gradient(circle 15px at ${x}% ${y}%, #ff5a68 0 1.4px, rgba(214, 50, 66, .5) 3px, rgba(190, 30, 50, .14) 8px, transparent 15px)`)
    .join(', '),
  '--pd': `${1.8 + i * 2.3}s`,
  '--pl': `${5.6 + i * 1.4}s`,
}));
</script>

<style scoped>
.fx {
  --H: var(--city-h, 600px);
  --fog: url('../../assets/moon/fog-bank.webp');
  --tone: #cbc8d6;
  --glow: rgba(255, 190, 120, .5);
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.fx.is-sun {
  --tone: #ecceaa;
}

.fx.is-dusk {
  --tone: #e0b1a2;
  --glow: rgba(240, 120, 90, .5);
}

/* a flow: twice the width, slid one width over minutes (the only thing in a bank that keeps moving) */
.fx__flow {
  position: absolute;
  inset: 0 auto 0 0;
  width: 200%;
  will-change: transform;
  animation: fx-drift var(--s) linear infinite var(--dir);
}

/*
 * One bank of fog, soft at its top and bottom. The texture is the mask (by luminance, three
 * times over because the texture is faint), the fog's colour the fill: where there is no fog
 * there is nothing at all, so it is right while it fades in and out, and on paper as well.
 */
.fx__bank {
  --tile: var(--fog) repeat-x var(--x, 0) 50% / 50% 100%;
  position: absolute;
  left: 0;
  right: 0;
  top: calc(var(--city-bottom, 100%) - var(--H) * (var(--b) + var(--h)));
  height: calc(var(--H) * var(--h));
  overflow: hidden;
  opacity: var(--o);
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 34%, #000 66%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 34%, #000 66%, transparent);
  will-change: transform, opacity;
  animation: fx-rise 1.7s cubic-bezier(.25, .6, .3, 1) var(--d) backwards;
}

.fx__bank::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--tone);
  -webkit-mask: var(--tile), var(--tile), var(--tile);
  mask: var(--tile), var(--tile), var(--tile);
  -webkit-mask-mode: luminance;
  mask-mode: luminance;
}

/* behind the castle: one wide, quieter bank at the spires' feet, drifting its own way */
.fx__flow--back {
  --s: 190s;
  --dir: reverse;
}

.fx__bank--far {
  --b: .4;
  --h: .38;
  --o: .5;
  --d: .6s;
  --x: 54%;
}

/* the crimson points: a layer of gradients laid over the city's box, breathing together */
.fx__points {
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--H));
  height: var(--H);
  aspect-ratio: 16 / 9;
  background: var(--pts);
  will-change: opacity;
  animation: fx-breathe var(--pl) ease-in-out var(--pd) infinite backwards;
}

.fx__sunbox {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  aspect-ratio: 1;
}

/* the light the fog lets through: wide and soft, under the far bank */
.fx__sunlit {
  position: absolute;
  inset: -90% -90% -40%;
  background: radial-gradient(closest-side at 50% 62%, var(--glow), transparent);
  opacity: .55;
  animation: fx-intro 1.8s ease .5s backwards;
}

@keyframes fx-drift {
  to { transform: translate3d(-50%, 0, 0); }
}

@keyframes fx-rise {
  from { opacity: 0; transform: translate3d(0, calc(var(--H) * .22), 0); }
}

@keyframes fx-intro {
  from { opacity: 0; }
}

@keyframes fx-breathe {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

/* paper: a pewter fog laid over the haze, never white on white */
:root[data-theme="parchment"] .fx {
  --tone: #8d8a98;
  --glow: rgba(255, 190, 120, .4);
}

:root[data-theme="parchment"] .fx.is-sun {
  --tone: #a8927c;
}

:root[data-theme="parchment"] .fx.is-dusk {
  --tone: #a98a86;
}

@media (prefers-reduced-motion: reduce) {
  .fx__flow,
  .fx__bank,
  .fx__points,
  .fx__sunlit {
    animation: none;
  }
}
</style>
