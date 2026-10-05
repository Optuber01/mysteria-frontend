<template>
  <!--
    Error: the moon is pickpocketed. A monocle's glint passes across it and the moon is
    simply gone, leaving only its afterimage; a moment later it is back, a little to one
    side, stuttering into place as if time had been wound back to cover the theft.
    The hero's own moon cannot be moved from here, so the back layer covers it with a
    patch of sky and hangs a copy of it in its new place.
  -->
  <div class="error" aria-hidden="true">
    <div ref="followRef" class="error__moon">
      <div ref="riseRef" class="error__rise">
        <template v-if="layer === 'back'">
          <!-- where the moon was: sky, with a ghost of it fading out -->
          <i class="error__patch"></i>
          <i class="error__ghost"></i>
          <!-- where it is now -->
          <div class="error__stolen">
            <div class="error__stolen-step">
              <i class="error__glow"></i>
              <i class="error__corona"></i>
              <img class="error__disc" :src="moon" alt="" decoding="async" width="640" height="640">
              <i class="error__rim"></i>
            </div>
          </div>
        </template>
        <template v-else>
          <!-- the monocle's glint: a lens ring and its flare, passing across the moon like a hand -->
          <div class="error__pass">
            <div class="error__glint">
              <i class="error__streak"></i>
              <svg class="error__lens" viewBox="-60 -60 120 120">
                <defs>
                  <radialGradient id="error-flare">
                    <stop offset="0" stop-color="#f4fdff" stop-opacity=".9"/>
                    <stop offset=".25" stop-color="#bff1ff" stop-opacity=".35"/>
                    <stop offset="1" stop-color="#6fd9f2" stop-opacity="0"/>
                  </radialGradient>
                  <linearGradient id="error-ring" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="#f6fdff"/>
                    <stop offset=".55" stop-color="#9fe6f7" stop-opacity=".55"/>
                    <stop offset="1" stop-color="#e9fbff" stop-opacity=".9"/>
                  </linearGradient>
                </defs>
                <circle r="58" fill="url(#error-flare)" opacity=".5"/>
                <!-- the lens: a thin rim, a sheen across the glass -->
                <circle r="22" fill="#cdf4ff" fill-opacity=".08" stroke="url(#error-ring)" stroke-width="3"/>
                <circle r="19.6" fill="none" stroke="#e8fbff" stroke-opacity=".25" stroke-width=".8"/>
                <path d="M-14 -9 A17 17 0 0 1 -2 -16.5" fill="none" stroke="#ffffff" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round"/>
                <!-- its cord, falling away -->
                <path d="M15.5 15.5 C24 30 22 44 34 60" fill="none" stroke="#bfe9f4" stroke-opacity=".4" stroke-width=".9"/>
                <!-- the glint where the light catches the rim -->
                <g class="error__star" transform="translate(-15.6 -15.6)">
                  <path d="M0 -15 L1.3 -1.3 L15 0 L1.3 1.3 L0 15 L-1.3 1.3 L-15 0 L-1.3 -1.3 Z" fill="#ffffff" fill-opacity=".9"/>
                  <circle r="2.6" fill="#ffffff"/>
                </g>
              </svg>
            </div>
          </div>
          <!-- a breath of cold light each time the moment skips -->
          <i class="error__skip"></i>
          <!-- now and then, the monocle winks from the moon's edge -->
          <i class="error__wink"></i>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import moon from '../assets/moon/crimson-moon.webp';
import {useMoonAnchor} from './sigKit';

defineOptions({name: 'SignatureError'});
defineProps<{layer: 'back' | 'front'}>();

/* everything here sits on the moon, and follows it as it rises and as the page scrolls */
const followRef = ref<HTMLElement | null>(null);
const riseRef = ref<HTMLElement | null>(null);
useMoonAnchor(followRef, riseRef);
</script>

<style scoped>
.error {
  position: absolute;
  inset: 0;
  pointer-events: none;
  /* where the moon goes: to the right, a little up (fractions of the moon's diameter) */
  --dx: 13%;
  --dy: -3%;
  /* the sky behind the moon: the crimson night's glow, deepening outward */
  --sky-in: rgb(62, 24, 30);
  --sky-out: rgb(46, 21, 27);
}

.error__moon {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  aspect-ratio: 1;
}

.error__rise {
  position: absolute;
  inset: 0;
  transform: scale(var(--moon-scale, 1));
}

/* ---- back: the patch of sky where the moon was ---- */
.error__patch {
  position: absolute;
  inset: -16%;
  border-radius: 50%;
  background: radial-gradient(circle closest-side, var(--sky-in) 0, var(--sky-in) 70%, var(--sky-out) 80%, transparent 100%);
  /* the moon is gone (its afterimage still faintly there), then the gap is simply sky */
  animation: error-gone 2.2s linear 1.24s backwards;
}

@keyframes error-gone {
  0% { opacity: 0; }
  4% { opacity: .9; }
  52% { opacity: .9; }
  100% { opacity: 1; }
}

/* the afterimage: a cold ring where the limb was, fading */
.error__ghost {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1.5px rgba(160, 232, 250, .32), 0 0 calc(var(--moon-r, 200px) * .12) rgba(111, 217, 242, .14);
  opacity: 0;
  animation: error-ghost 2.4s ease-out 1.24s;
}

@keyframes error-ghost {
  0% { opacity: 0; }
  6% { opacity: 1; }
  100% { opacity: 0; }
}

/* ---- back: the moon in its new place ---- */
.error__stolen {
  position: absolute;
  inset: 0;
  transform: translate(var(--dx), var(--dy));
}

/* it comes back a beat late and a step too far, then is wound back into place in jerks */
.error__stolen-step {
  position: absolute;
  inset: 0;
  animation: error-back 1s linear 2.3s backwards;
}

@keyframes error-back {
  0% { opacity: 0; transform: translate(9%, -2%); }
  1% { opacity: 1; transform: translate(9%, -2%); }
  22% { transform: translate(9%, -2%); }
  23% { transform: translate(5%, -1%); }
  44% { transform: translate(5%, -1%); }
  45% { transform: translate(7%, -1.6%); }
  58% { transform: translate(7%, -1.6%); }
  59% { transform: translate(2%, -.4%); }
  78% { transform: translate(2%, -.4%); }
  79% { transform: none; }
  100% { transform: none; }
}

/* the hero's moon, layer for layer (HeroNightScene .night__moon-*) */
.error__glow {
  position: absolute;
  inset: -75%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(179, 32, 43, .46) 0%, rgba(179, 32, 43, .16) 30%, transparent 60%);
}

.error__corona {
  position: absolute;
  inset: -50%;
  border-radius: 50%;
  background: radial-gradient(circle closest-side,
      transparent 48%,
      color-mix(in oklab, var(--acc) 30%, transparent) 51%,
      color-mix(in oklab, var(--acc) 11%, transparent) 62%,
      transparent 86%);
}

.error__disc {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  filter: saturate(1.08) brightness(.96) var(--moon-filter, );
}

.error__rim {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 62%, transparent 58%, color-mix(in oklab, var(--acc) 30%, transparent) 71%, transparent 72%),
    radial-gradient(circle at 34% 28%, color-mix(in oklab, var(--acc) 14%, transparent), transparent 55%);
  box-shadow:
    0 0 0 1px color-mix(in oklab, var(--acc) 22%, transparent),
    0 0 calc(var(--moon-r, 200px) * .35) color-mix(in oklab, var(--acc) 26%, transparent);
  mix-blend-mode: screen;
}

/* ---- front: the glint passing across the moon, through the band above the drawn card ---- */
.error__pass {
  position: absolute;
  inset: 0;
  opacity: 0;
  animation: error-pass .9s cubic-bezier(.45, 0, .35, 1) .85s;
}

@keyframes error-pass {
  0% { opacity: 0; transform: translate(-48%, 6%); }
  18% { opacity: 1; }
  50% { transform: translate(0, -1%); }
  78% { opacity: 1; }
  100% { opacity: 0; transform: translate(50%, 7%); }
}

.error__glint {
  position: absolute;
  left: 50%;
  top: 13%;
  width: 46%;
  aspect-ratio: 1;
  translate: -50% -50%;
}

/* the flare's long thin streak, as light catches a lens */
.error__streak {
  position: absolute;
  left: -130%;
  right: -130%;
  top: calc(50% - 1px);
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(170, 236, 252, .35) 35%, rgba(240, 252, 255, .85) 50%, rgba(170, 236, 252, .35) 65%, transparent);
}

.error__lens {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.error__star {
  transform-box: fill-box;
  transform-origin: center;
  animation: error-star .9s ease-in-out .85s;
}

@keyframes error-star {
  0%, 100% { transform: translate(-15.6px, -15.6px) scale(.5) rotate(0deg); }
  45% { transform: translate(-15.6px, -15.6px) scale(1.25) rotate(40deg); }
}

.error__skip {
  position: absolute;
  inset: -110%;
  background: radial-gradient(closest-side, rgba(150, 225, 245, .2), rgba(111, 217, 242, .06) 60%, transparent);
  opacity: 0;
  animation: error-skip 1s steps(1, end) 2.3s;
}

/* two short cold beats, where time is wound back */
@keyframes error-skip {
  0% { opacity: .6; }
  12% { opacity: 0; }
  45% { opacity: .35; }
  52% { opacity: 0; }
  100% { opacity: 0; }
}

.error__wink {
  position: absolute;
  left: calc(50% + var(--dx) - 30%);
  top: calc(50% + var(--dy) - 41%);
  width: 9%;
  aspect-ratio: 1;
  translate: -50% -50%;
  background:
    linear-gradient(90deg, transparent, rgba(240, 252, 255, .9) 50%, transparent) center / 100% 7% no-repeat,
    linear-gradient(0deg, transparent, rgba(240, 252, 255, .9) 50%, transparent) center / 7% 100% no-repeat,
    radial-gradient(circle, rgba(255, 255, 255, .95) 0 9%, rgba(160, 232, 250, .3) 22%, transparent 60%);
  opacity: 0;
  animation: error-wink 13s ease-in-out 9s infinite;
}

@keyframes error-wink {
  0%, 5%, 100% { opacity: 0; transform: scale(.4) rotate(0deg); }
  2.5% { opacity: .85; transform: scale(1) rotate(45deg); }
}

/* ---- light theme: the patch is the paper sky ---- */
:root[data-theme="parchment"] .error {
  --sky-in: rgb(228, 216, 216);
  --sky-out: rgb(232, 224, 222);
}

:root[data-theme="parchment"] .error__glow {
  background: radial-gradient(circle, rgba(179, 32, 43, .26) 0%, rgba(179, 32, 43, .08) 30%, transparent 60%);
}

:root[data-theme="parchment"] .error__ghost {
  box-shadow: inset 0 0 0 1.5px rgba(40, 120, 140, .3);
}

:root[data-theme="parchment"] .error__lens,
:root[data-theme="parchment"] .error__wink {
  filter: drop-shadow(0 0 1px rgba(20, 90, 110, .6));
}

:root[data-theme="parchment"] .error__skip {
  background: radial-gradient(closest-side, rgba(90, 170, 195, .14), transparent);
}

@media (prefers-reduced-motion: reduce) {
  .error__patch,
  .error__ghost,
  .error__stolen-step,
  .error__pass,
  .error__star,
  .error__skip,
  .error__wink {
    animation: none;
  }
}
</style>
