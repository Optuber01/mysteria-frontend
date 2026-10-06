<template>
  <!--
    Hanged Man: the curtain of shadows. A veil of shadow draws down over the upper sky and
    dims the moon; behind the castle its own shadows stretch the wrong way, upward into the
    veil; and once, high in the folds, something glints red and is gone. No giant drawn,
    no gallows, no sea.
  -->
  <div class="hanged" aria-hidden="true">
    <template v-if="layer === 'back'">
      <!-- the curtain -->
      <div class="ha-veil">
        <i class="ha-veil__cloth"></i>
      </div>
      <!-- the castle's shadow, climbing up into it -->
      <div class="ha-city ha-city--shadow">
        <i class="ha-shadow" :style="{'--city-mask': `url(${city})`}"></i>
      </div>
      <!-- the single glint, high in the folds -->
      <i class="ha-glint"></i>
    </template>

    <!-- a sickly red-brown light from below on the castle's foot -->
    <div v-else class="ha-city">
      <i class="ha-under" :style="{'--city-mask': `url(${city})`}"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import city from '../assets/moon/backlund-skyline.webp';

defineOptions({name: 'SignatureHanged'});
defineProps<{layer: 'back' | 'front'; from?: string}>();
</script>

<style scoped>
.hanged {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.ha-city {
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
}

/* the shadows gather round the castle and thin out toward the edges of the city */
.ha-city--shadow {
  -webkit-mask: radial-gradient(60% 120% at 66% 100%, #000 40%, transparent);
  mask: radial-gradient(60% 120% at 66% 100%, #000 40%, transparent);
}

/* ---- the shadow: the skyline's own shape, stretched upward from its foot and fading as it climbs ---- */
.ha-shadow {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(5, 2, 3, .85) 45%, rgba(8, 3, 4, .45) 62%, rgba(10, 4, 5, .12) 76%, transparent 88%);
  -webkit-mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  filter: blur(calc(var(--city-h, 600px) * .009));
  transform-origin: 50% 100%;
  transform: scaleY(1.34);
  opacity: var(--so, 1);
  will-change: transform;
  animation: ha-stretch 3.6s cubic-bezier(.45, 0, .25, 1) 1.2s backwards;
}

@keyframes ha-stretch {
  from { transform: none; opacity: 0; }
  20% { opacity: var(--so, 1); }
}

/* ---- the veil: shadow drawn down like cloth, with slow folds in it ---- */
.ha-veil {
  position: absolute;
  inset: 0 0 auto;
  height: calc(var(--moon-y, 48%) + var(--moon-r, 200px) * .55);
  overflow: hidden;
  -webkit-mask-image: linear-gradient(180deg, #000 55%, transparent);
  mask-image: linear-gradient(180deg, #000 55%, transparent);
}

.ha-veil__cloth {
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(90deg, transparent 0, rgba(0, 0, 0, .2) 53px, transparent 121px),
    repeating-linear-gradient(90deg, transparent 0, rgba(70, 28, 26, .12) 97px, transparent 211px),
    linear-gradient(180deg, rgba(9, 4, 5, .95), rgba(12, 6, 7, .84) 40%, rgba(22, 10, 10, .45) 75%, rgba(30, 12, 12, .2));
  will-change: transform;
  animation: ha-draw 3.2s cubic-bezier(.55, 0, .3, 1) .3s backwards;
}

@keyframes ha-draw {
  from { transform: translate3d(0, -100%, 0); }
}

/* ---- the glint: one red point that catches the light once, then all but goes ---- */
.ha-glint {
  position: absolute;
  left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * 1.95);
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * 1.5);
  width: calc(var(--moon-r, 200px) * .3);
  aspect-ratio: 1;
  translate: -50% -50%;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(255, 120, 110, .95) 0 6%, rgba(220, 30, 40, .5) 14%, rgba(160, 20, 30, .14) 40%, transparent);
  mix-blend-mode: screen;
  opacity: .12;
  animation: ha-glint 1.6s ease-in-out 3.5s backwards;
}

@keyframes ha-glint {
  0% { opacity: 0; transform: scale(.4); }
  30% { opacity: 1; transform: none; }
  100% { opacity: .12; transform: scale(.7); }
}

/* ---- front: the underlight ---- */
.ha-under {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(150, 60, 46, .45), rgba(138, 58, 46, .14) 35%, transparent 60%);
  -webkit-mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mix-blend-mode: screen;
  opacity: .5;
  animation: ha-under 3s ease-out 1.5s backwards;
}

@keyframes ha-under {
  from { opacity: 0; }
}

/* light theme: a brown-grey veil of haze, never a black sky */
:root[data-theme="parchment"] .ha-veil {
  opacity: .32;
}

:root[data-theme="parchment"] .ha-shadow {
  --so: .3;
}

:root[data-theme="parchment"] .ha-glint {
  mix-blend-mode: multiply;
}

:root[data-theme="parchment"] .ha-under {
  mix-blend-mode: multiply;
  opacity: .3;
}

@media (prefers-reduced-motion: reduce) {
  .ha-shadow,
  .ha-veil__cloth,
  .ha-glint,
  .ha-under {
    animation: none;
  }
}
</style>
