<template>
  <!--
    Error: it looks normal, but isn't. Whatever hangs in the sky is taken and put back by the
    scene (HeroNightScene: is-stolen); this is the wrongness around it. Now and then a faint
    cold ghost of the body shows beside it, a thin slice of the body slips sideways for a few
    frames, and a few pale cyan motes hiccup about in steps instead of drifting. Nothing here
    ever moves smoothly.
  -->
  <div v-if="layer === 'back'" class="fx fx--error fx--back" :class="`is-${kind}`">
    <!-- on the body, behind the castle like the body itself (under a storm there is nothing to see) -->
    <div v-if="body !== 'hidden'" class="sky-anchor fx__anchor" :style="{'--moon-img': `url(${moon})`}">
      <i class="fx__ghost"></i>
      <!-- slices: a strip of a copy of the body, laid exactly over it, slipped sideways -->
      <span class="fx__slice fx__slice--a"><i class="fx__copy"></i></span>
      <span class="fx__slice fx__slice--b"><i class="fx__copy"></i></span>
    </div>
  </div>
  <div v-else class="fx fx--error fx--front">
    <i v-for="(m, i) in MOTES" :key="i" class="fx__motes" :style="m"></i>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import type {Body} from '../skyScenes';
import moon from '../../assets/moon/crimson-moon.webp';

defineOptions({name: 'SkyErrorEffect'});
const props = defineProps<{layer: 'back' | 'front'; body: Body; from: Body}>();

/** What the ghost looks like: the sun (high or low), or the moon. */
const kind = computed(() => (props.body === 'sun' || props.body === 'dusk' ? props.body : 'moon'));

/*
 * Motes: two sets of pale points round the body, clear of the copy column (x and y in per
 * cent of the scene, size in px). A set jumps from place to place in steps, and winks, out
 * of step with the other. The colours are the theme's (--mc*).
 */
const mote = (x: number, y: number, r: number) =>
  `radial-gradient(circle ${r}px at ${x}% ${y}%, var(--mc1) 0 ${r * .22}px, var(--mc2) ${r * .4}px, var(--mc3) ${r * .72}px, transparent ${r}px)`;
const SETS = [
  [mote(58, 18, 6), mote(63, 44, 5), mote(78, 26, 7), mote(90, 58, 5), mote(70, 70, 6)],
  [mote(60, 62, 5), mote(84, 38, 6), mote(74, 14, 5), mote(93, 76, 5), mote(66, 30, 4)],
];
const MOTES = SETS.map((set, i) => ({
  '--dots': set.join(', '),
  '--ml': `${5.4 + i * 2.1}s`,
  '--md': `${.8 + i * 1.7}s`,
}));
</script>

<style scoped>
.fx {
  --rim: rgba(160, 238, 252, .5);
  --tint: rgba(150, 236, 252, .2);
  --mc1: #eafcff;
  --mc2: rgba(150, 232, 250, .75);
  --mc3: rgba(111, 217, 242, .2);
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* ---- the body's box: the moon's, as the scene lays it out ---- */
.fx__anchor {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  aspect-ratio: 1;
  /* the body as the scene draws it: the moon's disc, or a sun (smaller, and on the horizon at dusk) */
  --tinted: radial-gradient(circle closest-side, var(--tint) 98%, transparent);
  --disc: var(--tinted), var(--moon-img);
  --disc-size: 100% 100%;
  --disc-at: 50% 50%;
}

.is-sun .fx__anchor,
.is-dusk .fx__anchor {
  --disc: var(--tinted), radial-gradient(circle closest-side, #fff1c4 0%, #ffd77e 36%, #ffb24a 64%, #f08a34 99%, transparent);
  --disc-size: 80% 80%;
}

/* the dusk sun sits .736 of a radius lower: 46.8% of the box, a background offset of 234% */
.is-dusk .fx__anchor {
  --disc: var(--tinted), radial-gradient(circle closest-side, #ffd9a0 0%, #ffa25c 45%, #e2603a 99%, transparent);
  --disc-at: 50% 234%;
}

/* ---- the ghost: an echo of the body, a little aside, soft and cold ---- */
.fx__ghost {
  --fill: rgba(190, 80, 100, .26);
  position: absolute;
  left: calc(var(--moon-r, 200px) * .6);
  top: calc(var(--moon-r, 200px) * -.1);
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle closest-side, var(--fill) 0 78%, var(--rim) 92%, transparent);
  opacity: 0;
  will-change: opacity;
  animation: fx-ghost 9.5s steps(1, end) 2.2s infinite;
}

.is-sun .fx__ghost,
.is-dusk .fx__ghost {
  --fill: rgba(255, 232, 180, .34);
  left: calc(var(--moon-r, 200px) * .6 + 10%);
  top: calc(var(--moon-r, 200px) * -.1 + 10%);
  width: 80%;
  height: 80%;
}

.is-dusk .fx__ghost {
  top: calc(var(--moon-r, 200px) * (.736 - .1) + 10%);
}

/* now you see it: a few frames, a blink, a few more, and it is gone */
@keyframes fx-ghost {
  0%, 100% { opacity: 0; }
  62% { opacity: .5; }
  64.5% { opacity: 0; }
  65.5% { opacity: .36; }
  69% { opacity: 0; }
}

/*
 * ---- the slices: a thin strip of the body, slipped sideways for a few frames ----
 * The strip is a band of the body's box; the copy inside it is the whole box again, lifted
 * by the band's own top, so it lies exactly over the body until the band slips. A copy
 * drawn from the same image, not a backdrop filter: it looks the same in every browser
 * and costs nothing between glitches.
 */
.fx__slice {
  --t: 36;
  --h: 5;
  position: absolute;
  left: 0;
  right: 0;
  top: calc(var(--t) * 1%);
  height: calc(var(--h) * 1%);
  overflow: hidden;
  opacity: 0;
  will-change: opacity, translate;
  animation: fx-slice 11s steps(1, end) 3.4s infinite;
}

.fx__slice--b {
  --t: 58;
  --h: 2.6;
  --slip: -1;
  animation-delay: 7.6s;
  animation-duration: 13s;
}

.fx__copy {
  position: absolute;
  left: 0;
  width: 100%;
  top: calc(var(--t) / var(--h) * -100%);
  height: calc(10000% / var(--h));
  scale: var(--moon-scale, 1);
  background: var(--disc);
  background-size: var(--disc-size);
  background-position: var(--disc-at);
  background-repeat: no-repeat;
}

/* a few frames at a time, slipping one way and then the other, with nothing for seconds in between */
@keyframes fx-slice {
  0%, 100% { opacity: 0; translate: 0 0; }
  50% { opacity: 1; translate: calc(var(--moon-r, 200px) * .13 * var(--slip, 1)) 0; }
  51.2% { opacity: 0; }
  52.4% { opacity: 1; translate: calc(var(--moon-r, 200px) * -.07 * var(--slip, 1)) 0; }
  53.4% { opacity: 0; translate: 0 0; }
}

/* ---- the motes: a set of points that jump about in steps, and wink ---- */
.fx__motes {
  position: absolute;
  inset: 0;
  background: var(--dots);
  opacity: 0;
  will-change: transform, opacity;
  animation: fx-hiccup var(--ml) steps(1, end) var(--md) infinite;
}

@keyframes fx-hiccup {
  0% { translate: 0 0; opacity: .85; }
  17% { translate: 9px -5px; opacity: .85; }
  19% { translate: 9px -5px; opacity: .2; }
  20% { translate: 9px -5px; opacity: .85; }
  46% { translate: -6px 8px; opacity: .85; }
  63% { translate: 4px 3px; opacity: .85; }
  64% { translate: 4px 3px; opacity: 0; }
  66% { translate: 4px 3px; opacity: .85; }
  83% { translate: -3px -7px; opacity: .85; }
  100% { translate: -3px -7px; opacity: .85; }
}

/* ---- paper: the same, in a softer, deeper cyan ---- */
:root[data-theme="parchment"] .fx {
  --rim: rgba(50, 160, 195, .45);
  /* a pale, cold wash: cyan over the sun's gold turned it muddy on paper */
  --tint: rgba(232, 248, 255, .3);
  --mc1: rgb(36, 130, 166);
  --mc2: rgba(50, 156, 192, .6);
  --mc3: rgba(50, 156, 192, .16);
}

:root[data-theme="parchment"] .fx__ghost {
  --fill: rgba(190, 90, 110, .2);
}

:root[data-theme="parchment"] .is-sun .fx__ghost,
:root[data-theme="parchment"] .is-dusk .fx__ghost {
  --fill: rgba(240, 190, 110, .28);
}

@media (prefers-reduced-motion: reduce) {
  .fx__ghost,
  .fx__slice,
  .fx__motes {
    animation: none;
  }

  .fx__motes {
    opacity: .6;
  }
}
</style>
