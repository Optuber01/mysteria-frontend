<template>
  <!--
    Hanged Man: the curtain of shadows. A veil draws down over the upper sky and the
    castle's shadows stretch up into it, the wrong way. In its folds, barely there, the
    Hanged Giant hangs head-down above the castle, swaying like a pendulum; its only eye
    glints red, once; then the curtain closes over it. No gallows, no rope, no gore.
  -->
  <div class="hanged" aria-hidden="true">
    <template v-if="layer === 'back'">
      <!-- the castle's shadows, cast up into the sky by the red-brown underlight -->
      <div class="hanged__city">
        <i class="hanged__shadows" :style="{'--city-mask': `url(${city})`}"></i>
      </div>

      <!-- the giant, hung from the veil above the moon (moon units: radius 100) -->
      <div ref="followRef" class="hanged__moon">
        <div ref="riseRef" class="hanged__rise">
          <div class="hanged__sway">
            <svg class="hanged__giant" viewBox="-100 -100 200 200">
              <defs>
                <linearGradient id="hanged-fade" x1="0" y1="-420" x2="0" y2="-40" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stop-color="#050203" stop-opacity="0"/>
                  <stop offset=".55" stop-color="#050203" stop-opacity=".7"/>
                  <stop offset="1" stop-color="#050203"/>
                </linearGradient>
                <radialGradient id="hanged-glint">
                  <stop offset="0" stop-color="#ffd2c4"/>
                  <stop offset=".2" stop-color="#ff3a2a"/>
                  <stop offset=".45" stop-color="#c81c1c" stop-opacity=".55"/>
                  <stop offset="1" stop-color="#b3141a" stop-opacity="0"/>
                </radialGradient>
              </defs>
              <!-- drawn upright (crown at 0, foot at 800), then hung head-down with its crown just above the card -->
              <g transform="translate(-38 -52) scale(.46) rotate(180)" fill="url(#hanged-fade)">
                <!-- hair, hanging past the crown in a mass of strands -->
                <path d="M-34 30 C-38 10 -30 -6 -20 -10 L-27 -42 L-16 -22 L-15 -56 L-6 -28 L-2 -64 L4 -30 L12 -56 L14 -24 L25 -46 L22 -12 C32 -6 38 10 34 30 C30 14 20 4 0 4 C-20 4 -30 14 -34 30 Z"/>
                <!-- the head: broad crown, narrowing jaw (upside down, the jaw is uppermost) -->
                <path d="M0 0 C22 0 36 14 36 38 C36 56 30 70 20 82 C14 90 8 94 0 94 C-8 94 -14 90 -20 82 C-30 70 -36 56 -36 38 C-36 14 -22 0 0 0 Z"/>
                <!-- ears -->
                <path d="M-31 36 C-40 34 -42 52 -32 58 Z M31 36 C40 34 42 52 32 58 Z"/>
                <!-- body: arms bound behind the back, one leg straight to the veil, the other folded behind it -->
                <path
                    fill-rule="evenodd"
                    d="M-15 78 L-15 100 L-40 112 C-70 116 -86 126 -92 150 L-104 268 C-106 280 -98 290 -88 292 L-54 336 L-58 380 C-60 470 -50 560 -40 640 L-30 760 L-38 800 L-4 800 L-8 760 C-6 680 -4 620 -2 600 L108 560 C124 552 126 532 116 522 L58 382 L54 336 L88 292 C98 290 106 280 104 268 L92 150 C86 126 70 116 40 112 L15 100 L15 78 Z M6 420 L92 522 L4 582 Z M-68 190 L-84 262 L-50 312 Z M68 190 L84 262 L50 312 Z"
                />
              </g>
              <!-- its only eye -->
              <circle class="hanged__glint" cx="-38" cy="-70.5" r="7" fill="url(#hanged-glint)"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- the curtain of shadows: drawn down, then closed over him -->
      <div class="hanged__veil">
        <svg class="hanged__folds" viewBox="0 0 1000 100" preserveAspectRatio="none">
          <path v-for="(f, i) in FOLDS" :key="i" :d="f.d" :fill="f.light ? 'rgba(96, 44, 40, .16)' : 'rgba(0, 0, 0, .34)'"/>
        </svg>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import city from '../assets/moon/backlund-skyline.webp';
import {useMoonAnchor} from './sigKit';

defineOptions({name: 'SignatureHanged'});
defineProps<{layer: 'back' | 'front'}>();

const followRef = ref<HTMLElement | null>(null);
const riseRef = ref<HTMLElement | null>(null);
useMoonAnchor(followRef, riseRef);

/*
 * The veil's folds: long tapering pleats gathered at the top, hanging to uneven points,
 * alternately catching the low red light and falling into shadow.
 */
const FOLDS = Array.from({length: 22}, (_, i) => {
  const x = (i + 0.5) * (1000 / 22) + Math.sin(i * 2.3) * 12;
  const w = 14 + Math.abs(Math.sin(i * 1.7)) * 16;
  const end = 72 + Math.abs(Math.sin(i * 3.1)) * 26;
  const lean = Math.sin(i * 0.9) * 6;
  const d = `M${(x - w * 0.35).toFixed(1)} 0 C${(x - w * 0.5).toFixed(1)} 30 ${(x - w * 0.6 + lean).toFixed(1)} 60 ${(x + lean).toFixed(1)} ${end.toFixed(1)} C${(x + w * 0.6 + lean).toFixed(1)} 60 ${(x + w * 0.5).toFixed(1)} 30 ${(x + w * 0.35).toFixed(1)} 0 Z`;
  return {d, light: i % 2 === 0};
});
</script>

<style scoped>
.hanged {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* ---- the shadows: the skyline's own silhouette, stretched upward from the streets ---- */
.hanged__city {
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
}

.hanged__shadows {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(10, 4, 6, .82) 0%, rgba(10, 4, 6, .82) 52%, rgba(14, 5, 7, .5) 78%, rgba(14, 5, 7, 0) 100%);
  -webkit-mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  transform: scaleY(1.34);
  transform-origin: 50% 100%;
  will-change: transform;
  animation: hanged-stretch 2.6s cubic-bezier(.5, 0, .2, 1) .8s backwards;
}

@keyframes hanged-stretch {
  from { transform: scaleY(1); }
}

/* ---- the giant ---- */
.hanged__moon {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  aspect-ratio: 1;
}

.hanged__rise {
  position: absolute;
  inset: 0;
  transform: scale(var(--moon-scale, 1));
}

/* a pendulum: it swings from somewhere far above, out of sight */
.hanged__sway {
  position: absolute;
  inset: 0;
  transform-origin: 31% -160%;
  opacity: .06;
  animation:
    hanged-appear 3.6s ease-in-out 1.5s backwards,
    hanged-swing 9s ease-in-out 1.5s infinite alternate;
}

@keyframes hanged-appear {
  0% { opacity: 0; }
  30% { opacity: .9; }
  58% { opacity: .9; }
  100% { opacity: .06; }
}

@keyframes hanged-swing {
  from { rotate: -1.4deg; }
  to { rotate: 1.4deg; }
}

.hanged__giant {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* once, and only once: a blood-red glow in the giant's only eye */
.hanged__glint {
  opacity: 0;
  transform-box: fill-box;
  transform-origin: center;
  animation: hanged-glint .9s ease-out 2.9s;
}

@keyframes hanged-glint {
  0% { opacity: 0; transform: scale(.3); }
  25% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(.6); }
}

/* ---- the veil ---- */
.hanged__veil {
  position: absolute;
  inset: 0 0 auto;
  height: calc(var(--moon-y, 48%) + var(--moon-r, 200px) * .25);
  background: linear-gradient(180deg, rgba(11, 7, 9, .94) 0%, rgba(13, 7, 9, .84) 40%, rgba(20, 9, 11, .6) 66%, rgba(26, 10, 12, .26) 86%, transparent 100%);
  will-change: transform;
  /* drawn down over the upper sky; held while he shows; then closed over him */
  animation: hanged-veil 5.4s cubic-bezier(.45, 0, .25, 1) .4s backwards;
}

@keyframes hanged-veil {
  0% { transform: translate3d(0, -100%, 0); }
  /* first, only the sky above the moon */
  30% { transform: translate3d(0, calc(var(--moon-r, 200px) * -1.2), 0); }
  64% { transform: translate3d(0, calc(var(--moon-r, 200px) * -1.2), 0); }
  100% { transform: none; }
}

.hanged__folds {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* light theme: the veil and the shadows as a bruised sepia wash on the paper */
:root[data-theme="parchment"] .hanged__veil {
  background: linear-gradient(180deg, rgba(70, 44, 44, .36) 0%, rgba(80, 48, 46, .26) 45%, rgba(90, 52, 50, .12) 75%, transparent 100%);
}

:root[data-theme="parchment"] .hanged__folds {
  opacity: .45;
}

:root[data-theme="parchment"] .hanged__shadows {
  background: linear-gradient(0deg, rgba(70, 40, 40, .3) 0%, rgba(70, 40, 40, .3) 52%, rgba(70, 40, 40, .16) 78%, transparent 100%);
}

:root[data-theme="parchment"] .hanged__giant {
  opacity: .55;
}

@media (prefers-reduced-motion: reduce) {
  .hanged__shadows,
  .hanged__sway,
  .hanged__glint,
  .hanged__veil {
    animation: none;
  }
}
</style>
