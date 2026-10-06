<template>
  <!--
    Black Emperor: whatever hangs in the sky is eclipsed. A black body slides across the sun
    (if the sun was up) or the moon; at totality a bead of light flares on the limb and the
    corona comes out round the black disc, its rays uneven, long and short, as a real corona
    is; it stays there, the sky's light bent round a dark centre. A cold edge of that light
    catches the castle. Light only: no crown is drawn.
  -->
  <div class="em" :class="{'is-sun': sun}" aria-hidden="true" :style="{'--sig-city': `url(${city})`}">
    <template v-if="layer === 'back'">
      <!-- on the body: a 2r box kept on the moon (it follows the moon's rise only if the moon was the one up) -->
      <div ref="followRef" class="em__anchor">
        <div ref="riseRef" class="em__rise">
          <i class="em__rays em__rays--long"></i>
          <i class="em__rays"></i>
          <i class="em__corona"></i>
          <i class="em__umbra"></i>
          <i class="em__bead"></i>
        </div>
      </div>
    </template>
    <i v-else class="em__rim"></i>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import city from '../assets/moon/backlund-skyline.webp';
import {useMoonAnchor} from './sigKit';

const props = defineProps<{layer: 'back' | 'front'; from?: string}>();

/* the sun was up: eclipse it where it hangs (the moon comes up under the disc as the sun goes) */
const sun = computed(() => props.from === 'sun');

const followRef = ref<HTMLElement | null>(null);
const riseRef = ref<HTMLElement | null>(null);
/* a sun stays put while the moon rises behind it, so only the moon's own rise is followed */
const noRise = ref<HTMLElement | null>(null);
useMoonAnchor(followRef, sun.value ? noRise : riseRef);
</script>

<style scoped>
.em {
  /* the corona's light: cold pearl and indigo round the moon, white-gold round the sun */
  --c1: rgba(236, 232, 255, .9);
  --c2: rgba(160, 160, 255, .42);
  --c3: rgba(110, 110, 230, .14);
  --ray: rgba(205, 205, 255, .62);
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.em.is-sun {
  --c1: rgba(255, 250, 230, .95);
  --c2: rgba(255, 220, 150, .5);
  --c3: rgba(255, 190, 110, .16);
  --ray: rgba(255, 236, 190, .66);
}

.em__anchor {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  aspect-ratio: 1;
}

.em__rise {
  position: absolute;
  inset: 0;
  transform: scale(var(--moon-scale, 1));
}

/* the eclipsing body: a black disc sliding over from the upper left */
.em__umbra {
  position: absolute;
  inset: -1.5%;
  border-radius: 50%;
  background: radial-gradient(circle, #030208 0%, #05040c 72%, #0b0a1c 94%, #15153a 100%);
  animation: em-eclipse 1.9s cubic-bezier(.33, .08, .22, 1) .5s both;
}

/* on the sun (which is smaller) it closes in to the sun's size and grows as the moon comes up under it */
.em.is-sun .em__umbra {
  animation: em-eclipse-sun 3.6s cubic-bezier(.33, .08, .22, 1) .3s both;
}

/* the inner corona: a bright ring hugging the limb, fading out into the sky */
.em__corona {
  position: absolute;
  inset: -34%;
  border-radius: 50%;
  background: radial-gradient(circle closest-side,
      transparent 70%,
      var(--c1) 74.5%,
      var(--c2) 78%,
      var(--c3) 87%,
      transparent 100%);
  animation: em-corona 1.6s ease 2.1s both;
}

/*
 * The outer corona: streamers of light, uneven in angle, width and strength (one conic),
 * cut off at two different lengths (two layers), so some reach far and most stay short.
 */
.em__rays {
  position: absolute;
  inset: -90%;
  border-radius: 50%;
  background: conic-gradient(from 8deg,
      transparent 0deg, var(--ray) 6deg, transparent 13deg,
      transparent 31deg, var(--ray) 35deg, transparent 38deg,
      transparent 52deg, var(--ray) 61deg, transparent 72deg,
      transparent 96deg, var(--ray) 100deg, transparent 103deg,
      transparent 128deg, var(--ray) 137deg, transparent 141deg,
      transparent 167deg, var(--ray) 176deg, transparent 189deg,
      transparent 214deg, var(--ray) 218deg, transparent 222deg,
      transparent 241deg, var(--ray) 250deg, transparent 263deg,
      transparent 287deg, var(--ray) 291deg, transparent 295deg,
      transparent 318deg, var(--ray) 327deg, transparent 338deg,
      transparent 360deg);
  -webkit-mask-image: radial-gradient(circle closest-side, transparent 30%, #000 34%, rgba(0, 0, 0, .45) 46%, transparent 62%);
  mask-image: radial-gradient(circle closest-side, transparent 30%, #000 34%, rgba(0, 0, 0, .45) 46%, transparent 62%);
  opacity: .95;
  animation: em-rays 2.2s ease 2.3s both;
}

/* the long streamers: fewer, fainter, reaching two radii out */
.em__rays--long {
  inset: -230%;
  background: conic-gradient(from -14deg,
      transparent 0deg, var(--ray) 5deg, transparent 10deg,
      transparent 74deg, var(--ray) 80deg, transparent 88deg,
      transparent 150deg, var(--ray) 154deg, transparent 158deg,
      transparent 232deg, var(--ray) 238deg, transparent 247deg,
      transparent 300deg, var(--ray) 304deg, transparent 309deg,
      transparent 360deg);
  -webkit-mask-image: radial-gradient(circle closest-side, transparent 17%, #000 18.5%, rgba(0, 0, 0, .5) 34%, transparent 64%);
  mask-image: radial-gradient(circle closest-side, transparent 17%, #000 18.5%, rgba(0, 0, 0, .5) 34%, transparent 64%);
  opacity: .8;
  animation-delay: 2.6s;
}

/* the diamond ring: the last bead of light on the limb flares as totality comes, then goes */
.em__bead {
  position: absolute;
  left: 82%;
  top: 14%;
  width: 36%;
  aspect-ratio: 1;
  translate: -50% -50%;
  border-radius: 50%;
  background: radial-gradient(circle, #fff 0 6%, var(--c1) 12%, var(--c2) 26%, transparent 62%);
  opacity: 0;
  animation: em-bead 1.4s ease-out 1.7s both;
}

@keyframes em-eclipse {
  from { opacity: 0; transform: translate3d(-58%, -36%, 0); }
  25% { opacity: .95; }
  to { opacity: 1; transform: none; }
}

@keyframes em-eclipse-sun {
  0% { opacity: 0; transform: translate3d(-50%, -32%, 0) scale(.8); }
  12% { opacity: .95; }
  42% { opacity: 1; transform: scale(.8); }
  100% { opacity: 1; transform: none; }
}

@keyframes em-corona {
  from { opacity: 0; transform: scale(.94); }
}

@keyframes em-rays {
  from { opacity: 0; transform: rotate(-4deg) scale(.9); }
}

@keyframes em-bead {
  0% { opacity: 0; transform: scale(.4); }
  25% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(.7); }
}

/* ---- in front: a cold edge of the corona's light along the roofs, cut to the skyline ---- */
.em__rim {
  --k: calc(var(--city-h, 600px) * .004);
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
  background: radial-gradient(circle at calc(var(--moon-x, 72%) - var(--city-left, 0px)) calc(var(--moon-y, 48%) - var(--city-bottom, 100%) + var(--city-h, 600px)),
      var(--c1) 0, var(--c2) calc(var(--moon-r, 200px) * 1.8), transparent calc(var(--moon-r, 200px) * 4));
  -webkit-mask: var(--sig-city) 0 0 / 100% 100% no-repeat, var(--sig-city) 0 var(--k) / 100% 100% no-repeat;
  -webkit-mask-composite: source-out;
  mask: var(--sig-city) 0 0 / 100% 100% no-repeat, var(--sig-city) 0 var(--k) / 100% 100% no-repeat;
  mask-composite: subtract;
  opacity: .55;
  animation: em-fade 1.8s ease 2.4s both;
}

@keyframes em-fade {
  from { opacity: 0; }
}

/* stacked: the deck covers the moon; the long streamers would only clutter the band */
@media (max-width: 900px) {
  .em__rays--long {
    display: none;
  }
}

/* ---- paper: an ink eclipse on the haze, its corona a warm brown-gold, never a black hole ---- */
:root[data-theme="parchment"] .em {
  --c1: rgba(150, 110, 40, .7);
  --c2: rgba(110, 90, 160, .3);
  --c3: rgba(110, 90, 160, .1);
  --ray: rgba(130, 100, 60, .35);
}

:root[data-theme="parchment"] .em__umbra {
  background: radial-gradient(circle, #3b3352 0%, #4a4064 80%, #5d5378 100%);
  opacity: .55;
}

:root[data-theme="parchment"] .em__umbra,
:root[data-theme="parchment"] .em.is-sun .em__umbra {
  animation-name: em-eclipse-ink;
}

@keyframes em-eclipse-ink {
  from { opacity: 0; transform: translate3d(-58%, -36%, 0); }
}

:root[data-theme="parchment"] .em__rim {
  mix-blend-mode: multiply;
}

@media (prefers-reduced-motion: reduce) {
  .em__umbra,
  .em.is-sun .em__umbra,
  .em__corona,
  .em__rays,
  .em__rim {
    animation: none;
  }

  .em__bead {
    display: none;
  }
}
</style>
