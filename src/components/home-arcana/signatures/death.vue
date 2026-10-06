<template>
  <!--
    Death: pallor. The colour drains out of everything, the sky, the castle, whatever hangs
    over it; at the castle's foot a pale light pools in the fog like a threshold, and the
    souls rising from the streets turn and drift into it, one by one. No gate, no skulls,
    nothing red.
  -->
  <div class="death" aria-hidden="true">
    <template v-if="layer === 'front'">
      <!-- the colour going out of the world -->
      <i class="de-drain"></i>
      <i class="de-pall"></i>

      <!-- the pool of pale light in the fog at the castle's foot -->
      <div class="de-pool">
        <i class="de-pool__haze"></i>
        <i class="de-pool__fog"><i class="de-pool__tint"></i></i>
        <i class="de-pool__light"></i>
        <i class="de-pool__sill"></i>
        <!-- the souls drifting in -->
        <i v-for="(w, i) in WISPS" :key="i" class="de-wisp" :style="w"></i>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {seeded} from './sigKit';

defineOptions({name: 'SignatureDeath'});
defineProps<{layer: 'back' | 'front'; from?: string}>();

const rnd = seeded(1313);
const f2 = (n: number) => n.toFixed(2);

/* each wisp: where it starts (moon radii from the pool's centre), how long it takes, when */
const WISPS = Array.from({length: 11}, (_, i) => {
  const side = i % 2 ? 1 : -1;
  return {
    '--x0': f2(side * (.9 + rnd() * 2.2)),
    '--y0': f2(-.1 - rnd() * .7),
    '--bend': f2((rnd() - .5) * .5),
    '--d': `${f2(1.4 + i * .26 + rnd() * .3)}s`,
    '--t': `${f2(2.4 + rnd() * 1)}s`,
    '--s': f2(.7 + rnd() * .6),
  };
});
</script>

<style scoped>
.death {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* ---- the drain: grey laid on as saturation, so every hue below fades toward pallor ---- */
.de-drain {
  position: absolute;
  inset: 0;
  background: #808080;
  mix-blend-mode: saturation;
  opacity: .62;
  animation: de-drain 3.2s ease-in-out .4s backwards;
}

@keyframes de-drain {
  from { opacity: 0; }
}

/*
 * While the next card takes over, SceneSignature fades this layer out as a group; inside a
 * group a blend has nothing to blend with and would lay plain grey over the scene, so the
 * colour simply comes back as the new card's grade eases in.
 */
.death.signature-leave-active .de-drain,
.death.signature-leave-active .de-pall {
  display: none;
}

/* ...and the cold grey-green that is left */
.de-pall {
  position: absolute;
  inset: 0;
  background: #b8cdb4;
  mix-blend-mode: color;
  opacity: .14;
  animation: de-drain 3.2s ease-in-out .8s backwards;
}

/* ---- the pool: low at the castle's foot, under the drawn card ---- */
.de-pool {
  position: absolute;
  left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * .35);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .1);
  width: var(--moon-r, 200px);
  height: var(--moon-r, 200px);
}

.de-pool__haze {
  position: absolute;
  left: -350%;
  top: -100%;
  width: 700%;
  height: 200%;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(220, 236, 220, .3), rgba(200, 220, 205, .1) 50%, transparent);
  mix-blend-mode: screen;
  animation: de-pool 3.6s ease-out 1.2s backwards;
}

/* fog gathering into the light: the scene's fog bank, pale and pooled */
.de-pool__fog {
  position: absolute;
  left: -300%;
  top: -60%;
  width: 600%;
  height: 120%;
  isolation: isolate;
  background: url('../assets/moon/fog-bank.webp') repeat-x 30% 50% / 50% 100%;
  mix-blend-mode: screen;
  -webkit-mask-image: radial-gradient(closest-side, #000 30%, transparent);
  mask-image: radial-gradient(closest-side, #000 30%, transparent);
  opacity: .55;
  animation: de-pool 3.6s ease-out 1s backwards;
}

.de-pool__tint {
  position: absolute;
  inset: 0;
  background: #e4ece0;
  mix-blend-mode: multiply;
}

/* the threshold: a low, flat brightness in the fog */
.de-pool__light {
  position: absolute;
  left: -120%;
  top: -55%;
  width: 240%;
  height: 90%;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(245, 252, 242, .62), rgba(214, 234, 214, .24) 45%, transparent);
  mix-blend-mode: screen;
  animation: de-pool 3.2s ease-out 1.6s backwards;
}

/* its level edge, where the light lies on the ground */
.de-pool__sill {
  position: absolute;
  left: -90%;
  top: -3%;
  width: 180%;
  height: 6%;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(250, 255, 248, .7), rgba(220, 238, 220, .2) 60%, transparent);
  mix-blend-mode: screen;
  animation: de-pool 3s ease-out 2s backwards;
}

@keyframes de-pool {
  from { opacity: 0; transform: scale(.7, .5); }
}

/* ---- the wisps: soft pale lights curving in from the streets and going into the light ---- */
.de-wisp {
  position: absolute;
  left: calc(50% - var(--moon-r, 200px) * .05);
  top: calc(-20% - var(--moon-r, 200px) * .05);
  width: calc(var(--moon-r, 200px) * .1 * var(--s));
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(240, 252, 236, .95), rgba(207, 230, 200, .4) 45%, transparent);
  mix-blend-mode: screen;
  opacity: 0;
  animation: de-drift var(--t) cubic-bezier(.4, .1, .5, 1) var(--d) backwards;
}

/* from the street, bending, into the pool, and gone */
@keyframes de-drift {
  0% { opacity: 0; transform: translate3d(calc(var(--moon-r, 200px) * var(--x0)), calc(var(--moon-r, 200px) * var(--y0)), 0); }
  15% { opacity: .9; }
  55% { transform: translate3d(calc(var(--moon-r, 200px) * var(--x0) * .4), calc(var(--moon-r, 200px) * (var(--y0) * .4 + var(--bend))), 0) scale(.9); }
  85% { opacity: .7; }
  100% { opacity: 0; transform: scale(.4); }
}

/* light theme: the paper keeps its colour less; the pool reads as a pale clearing in grey haze */
:root[data-theme="parchment"] .de-drain {
  opacity: .45;
}

:root[data-theme="parchment"] .de-pall {
  opacity: .1;
}

:root[data-theme="parchment"] .de-pool__fog {
  filter: invert(1);
  mix-blend-mode: multiply;
  opacity: .3;
}

:root[data-theme="parchment"] .de-pool__tint {
  background: #fff;
  mix-blend-mode: normal;
  opacity: 0;
}

:root[data-theme="parchment"] .de-wisp {
  mix-blend-mode: multiply;
  background: radial-gradient(closest-side, rgba(120, 150, 120, .6), rgba(150, 175, 150, .2) 45%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .de-drain,
  .de-pall,
  .de-pool__haze,
  .de-pool__fog,
  .de-pool__light,
  .de-pool__sill,
  .de-wisp {
    animation: none;
  }
}
</style>
