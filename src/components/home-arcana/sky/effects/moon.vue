<template>
  <!--
    Moon: the full crimson moon (the engine swells it and saturates it) floods Backlund with
    its light. Behind the castle a halo rings the moon and thin cloud streams slowly across
    its face. In front, crimson pools along the skyline's edges and over the stone, and a red
    haze lies in the streets. Nothing is drawn but light and cloud.
  -->
  <div v-if="layer === 'back'" class="fx fx--moon fx--back" :class="`is-from-${from}`">
    <div class="sky-anchor">
      <i class="mn-bloom"></i>
      <div class="mn-rings"><i class="mn-halo"></i></div>
      <div class="mn-wisps">
        <i class="mn-wisp mn-wisp--dark"></i>
        <i class="mn-wisp mn-wisp--pale"></i>
      </div>
    </div>
  </div>
  <div v-else class="fx fx--moon fx--front" :class="`is-from-${from}`" :style="{'--city-mask': `url(${city})`}">
    <i class="mn-flood"></i>
    <i class="mn-rim mn-rim--soft"></i>
    <i class="mn-rim"></i>
    <i class="mn-haze"></i>
    <i class="mn-haze mn-haze--drift"></i>
  </div>
</template>

<script setup lang="ts">
import type {Body} from '../skyScenes';
import city from '../../assets/moon/backlund-skyline.webp';

defineOptions({name: 'SkyMoonEffect'});
defineProps<{layer: 'back' | 'front'; body: Body; from: Body}>();
</script>

<style scoped>
.fx {
  /* when the moon is up and full: at once if it already was, after it has risen if it was not */
  --in: 1.9s;
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.fx.is-from-moon {
  --in: .6s;
}

.fx.is-from-hidden {
  --in: 1.2s;
}

/* ---- behind the castle, on the moon ---- */
.sky-anchor {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  aspect-ratio: 1;
}

/* the full moon's light thickening the air round it (the disc is 1.3 radii once swollen) */
.mn-bloom {
  position: absolute;
  inset: -190%;
  border-radius: 50%;
  background: radial-gradient(circle closest-side,
      rgba(255, 70, 92, .3) calc(var(--moon-r, 200px) * 1.3),
      rgba(210, 36, 60, .17) calc(var(--moon-r, 200px) * 1.9),
      rgba(150, 18, 42, .07) calc(var(--moon-r, 200px) * 3.1),
      transparent);
  animation: mn-bloom 2.6s cubic-bezier(.2, .7, .2, 1) var(--in) backwards;
}

/* a halo ring round the moon, and a fainter one beyond it; it breathes a little (on the box, so the two fades never share an element) */
.mn-rings {
  position: absolute;
  inset: 0;
  will-change: opacity;
  animation: mn-breathe 14s ease-in-out calc(var(--in) + 3.1s) infinite alternate;
}

.mn-halo {
  position: absolute;
  inset: -190%;
  border-radius: 50%;
  background: radial-gradient(circle closest-side,
      transparent calc(var(--moon-r, 200px) * 1.9),
      rgba(255, 120, 132, .12) calc(var(--moon-r, 200px) * 1.97),
      rgba(255, 150, 160, .3) calc(var(--moon-r, 200px) * 2.03),
      rgba(255, 92, 112, .1) calc(var(--moon-r, 200px) * 2.1),
      transparent calc(var(--moon-r, 200px) * 2.22),
      transparent calc(var(--moon-r, 200px) * 2.78),
      rgba(255, 110, 124, .14) calc(var(--moon-r, 200px) * 2.86),
      transparent calc(var(--moon-r, 200px) * 2.96));
  animation: mn-halo 2.8s ease calc(var(--in) + .3s) backwards;
}

/* thin cloud streaming across the moon's face, a dark band and a pale one at different speeds */
.mn-wisps {
  position: absolute;
  left: -130%;
  top: -17%;
  width: 360%;
  height: 134%;
  overflow: hidden;
  -webkit-mask-image: radial-gradient(closest-side, #000 52%, transparent);
  mask-image: radial-gradient(closest-side, #000 52%, transparent);
  animation: mn-in 3s ease calc(var(--in) + .5s) backwards;
}

.mn-wisp {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 200%;
  background-size: 50% 100%;
  background-repeat: repeat-x;
  /* the fog bank twice over, one copy shifted, so the streaks break up into ragged wisps */
  -webkit-mask: url('../../assets/moon/fog-bank.webp') 0 50% / 50% 100% repeat-x luminance, url('../../assets/moon/fog-bank.webp') 340px 50% / 50% 100% repeat-x luminance;
  mask: url('../../assets/moon/fog-bank.webp') 0 50% / 50% 100% repeat-x luminance, url('../../assets/moon/fog-bank.webp') 340px 50% / 50% 100% repeat-x luminance;
  will-change: transform;
  animation: mn-stream 150s linear infinite;
}

/* each is a tile of long thin streaks (kept clear of the tile's edges, so the loop has no seam) */
.mn-wisp--dark {
  background-image:
    radial-gradient(ellipse 46% 6.5% at 50% 33%, rgba(28, 3, 10, .95), transparent),
    radial-gradient(ellipse 30% 5.5% at 34% 52%, rgba(28, 3, 10, .9), transparent),
    radial-gradient(ellipse 38% 7% at 62% 74%, rgba(28, 3, 10, .85), transparent);
}

.mn-wisp--pale {
  background-image:
    radial-gradient(ellipse 40% 5% at 46% 42%, rgba(255, 186, 196, .95), transparent),
    radial-gradient(ellipse 32% 5.5% at 64% 62%, rgba(255, 170, 184, .9), transparent),
    radial-gradient(ellipse 44% 5% at 50% 86%, rgba(255, 190, 200, .85), transparent);
  animation-duration: 105s;
}

/* ---- in front of the castle ---- */
.mn-flood,
.mn-rim,
.mn-haze {
  position: absolute;
}

/* the castle flooded: crimson over the stone, spreading out from the moon */
.mn-flood,
.mn-rim {
  --cx: calc(var(--moon-x, 72%) - var(--city-left, 0px));
  --cy: calc(var(--moon-y, 48%) - var(--city-bottom, 100%) + var(--city-h, 600px));
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
}

.mn-flood {
  background:
    radial-gradient(circle at var(--cx) var(--cy), rgba(255, 60, 82, .34) 0, rgba(220, 36, 60, .18) calc(var(--moon-r, 200px) * 2.4), rgba(170, 20, 44, .07) calc(var(--moon-r, 200px) * 4.8), transparent calc(var(--moon-r, 200px) * 7)),
    linear-gradient(180deg, transparent 40%, rgba(180, 24, 48, .14));
  -webkit-mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  animation: mn-in 2.8s ease calc(var(--in) + .3s) backwards;
}

/* crimson pooling on every roof, ledge and spire: the city minus itself shifted down, brightest nearest the moon */
.mn-rim {
  --k: calc(var(--city-h, 600px) * .006);
  background: radial-gradient(circle at var(--cx) var(--cy),
      rgba(255, 168, 178, .72) 0,
      rgba(240, 86, 106, .4) calc(var(--moon-r, 200px) * 1.5),
      rgba(196, 38, 60, .13) calc(var(--moon-r, 200px) * 3),
      transparent calc(var(--moon-r, 200px) * 4.6));
  -webkit-mask: var(--city-mask) 0 0 / 100% 100% no-repeat, var(--city-mask) 0 var(--k) / 100% 100% no-repeat;
  -webkit-mask-composite: source-out;
  mask: var(--city-mask) 0 0 / 100% 100% no-repeat, var(--city-mask) 0 var(--k) / 100% 100% no-repeat;
  mask-composite: subtract;
  animation: mn-in 2.2s ease calc(var(--in) + 1s) backwards;
}

/* a broader, fainter edge under it: the light wrapping over the stone */
.mn-rim--soft {
  --k: calc(var(--city-h, 600px) * .022);
  opacity: .3;
}

/* a red haze in the streets, with banks of its own drifting through it */
.mn-haze {
  left: -4%;
  right: -4%;
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .46);
  height: calc(var(--city-h, 600px) * .58);
  background: linear-gradient(180deg, transparent, rgba(150, 20, 40, .17) 42%, rgba(120, 14, 32, .3));
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 36%, #000 84%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 36%, #000 84%, transparent);
  animation: mn-in 3s ease calc(var(--in) + .6s) backwards;
}

.mn-haze--drift {
  background: linear-gradient(180deg, transparent, rgba(206, 46, 66, .46) 38%, rgba(176, 30, 50, .54) 76%, transparent);
  -webkit-mask: url('../../assets/moon/fog-bank.webp') 0 50% / 1500px 100% repeat-x luminance, url('../../assets/moon/fog-bank.webp') 620px 50% / 1500px 100% repeat-x luminance;
  mask: url('../../assets/moon/fog-bank.webp') 0 50% / 1500px 100% repeat-x luminance, url('../../assets/moon/fog-bank.webp') 620px 50% / 1500px 100% repeat-x luminance;
  will-change: transform;
  animation:
    mn-in 3s ease calc(var(--in) + .6s) backwards,
    mn-sway 120s ease-in-out infinite alternate;
}

@keyframes mn-in {
  from { opacity: 0; }
}

@keyframes mn-bloom {
  from { opacity: 0; transform: scale(.8); }
}

@keyframes mn-halo {
  from { opacity: 0; transform: scale(.88); }
}

@keyframes mn-breathe {
  to { opacity: .6; }
}

@keyframes mn-stream {
  to { transform: translate3d(-50%, 0, 0); }
}

@keyframes mn-sway {
  from { transform: translate3d(-3%, 0, 0); }
  to { transform: translate3d(3%, 0, 0); }
}

/* paper: a rose-crimson glow in the haze, never a red sky and never a dark band */
:root[data-theme="parchment"] .mn-bloom {
  background: radial-gradient(circle closest-side,
      rgba(224, 70, 92, .3) calc(var(--moon-r, 200px) * 1.3),
      rgba(214, 70, 92, .15) calc(var(--moon-r, 200px) * 1.9),
      rgba(210, 80, 100, .06) calc(var(--moon-r, 200px) * 3.1),
      transparent);
}

:root[data-theme="parchment"] .mn-halo {
  background: radial-gradient(circle closest-side,
      transparent calc(var(--moon-r, 200px) * 1.9),
      rgba(206, 60, 84, .12) calc(var(--moon-r, 200px) * 1.97),
      rgba(204, 52, 76, .5) calc(var(--moon-r, 200px) * 2.03),
      rgba(206, 60, 84, .16) calc(var(--moon-r, 200px) * 2.1),
      transparent calc(var(--moon-r, 200px) * 2.22),
      transparent calc(var(--moon-r, 200px) * 2.78),
      rgba(206, 60, 84, .14) calc(var(--moon-r, 200px) * 2.86),
      transparent calc(var(--moon-r, 200px) * 2.96));
}

:root[data-theme="parchment"] .mn-wisp--dark {
  background-image:
    radial-gradient(ellipse 46% 6.5% at 50% 33%, rgba(150, 52, 80, .85), transparent),
    radial-gradient(ellipse 30% 5.5% at 34% 52%, rgba(150, 52, 80, .8), transparent),
    radial-gradient(ellipse 38% 7% at 62% 74%, rgba(150, 52, 80, .75), transparent);
}

:root[data-theme="parchment"] .mn-wisp--pale {
  background-image:
    radial-gradient(ellipse 40% 5% at 46% 42%, rgba(255, 246, 248, .98), transparent),
    radial-gradient(ellipse 32% 5.5% at 64% 62%, rgba(255, 246, 248, .95), transparent),
    radial-gradient(ellipse 44% 5% at 50% 86%, rgba(255, 246, 248, .9), transparent);
}

:root[data-theme="parchment"] .mn-flood {
  opacity: .6;
}

:root[data-theme="parchment"] .mn-rim {
  background: radial-gradient(circle at var(--cx) var(--cy),
      rgba(206, 58, 82, .6) 0,
      rgba(206, 62, 86, .34) calc(var(--moon-r, 200px) * 1.8),
      rgba(206, 62, 86, .1) calc(var(--moon-r, 200px) * 3.4),
      transparent calc(var(--moon-r, 200px) * 4.8));
}

:root[data-theme="parchment"] .mn-haze {
  background: linear-gradient(180deg, transparent, rgba(228, 110, 130, .22) 42%, rgba(222, 100, 122, .34));
}

:root[data-theme="parchment"] .mn-haze--drift {
  background: linear-gradient(180deg, transparent, rgba(236, 128, 146, .7) 38%, rgba(230, 116, 136, .8) 76%, transparent);
}

@media (prefers-reduced-motion: reduce) {
  .mn-bloom,
  .mn-rings,
  .mn-halo,
  .mn-wisps,
  .mn-wisp,
  .mn-flood,
  .mn-rim,
  .mn-haze {
    animation: none;
  }
}
</style>
