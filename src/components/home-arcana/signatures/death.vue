<template>
  <!--
    Death: the colour drains out of the night. At the castle's foot a tall pale gate opens
    in the fog, and the souls rising from the streets turn and drift into it, one after
    another, in silence. Then the gate dims to an outline. No skulls, no scythes, no red.
  -->
  <div class="death" aria-hidden="true">
    <template v-if="layer === 'front'">
      <!-- pallor: the scene below loses its colour -->
      <i class="death__drain"></i>
      <i class="death__pallor"></i>

      <div class="death__gate">
        <i class="death__halo"></i>
        <svg class="death__arch" viewBox="0 0 100 282" preserveAspectRatio="none">
          <defs>
            <radialGradient id="death-light" cx="50%" cy="78%" r="70%">
              <stop offset="0" stop-color="#f4faf0" stop-opacity=".95"/>
              <stop offset=".45" stop-color="#d8e8d2" stop-opacity=".55"/>
              <stop offset="1" stop-color="#b8ccb4" stop-opacity=".12"/>
            </radialGradient>
          </defs>
          <!-- beyond the doors: cold light, and a further arch deeper in -->
          <g class="death__beyond">
            <path d="M18 282 L18 76 A32 32 0 0 1 82 76 L82 282 Z" fill="url(#death-light)"/>
            <path d="M34 282 L34 104 A16 16 0 0 1 66 104 L66 282" class="death__line" stroke-opacity=".45"/>
          </g>
          <!-- the two leaves, swinging inward on their hinges -->
          <g class="death__leaf death__leaf--l">
            <path d="M18 282 L18 76 A32 32 0 0 1 50 44 L50 282 Z" class="death__door"/>
            <path d="M24 270 L24 84 A26 26 0 0 1 44 58 L44 270 Z" class="death__line" stroke-opacity=".3"/>
          </g>
          <g class="death__leaf death__leaf--r">
            <path d="M82 282 L82 76 A32 32 0 0 0 50 44 L50 282 Z" class="death__door"/>
            <path d="M76 270 L76 84 A26 26 0 0 0 56 58 L56 270 Z" class="death__line" stroke-opacity=".3"/>
          </g>
          <!-- the frame: pillars, capitals, the round arch and its keystone -->
          <g class="death__frame">
            <path d="M5 282 L5 70 A45 45 0 0 1 95 70 L95 282" class="death__line"/>
            <path d="M18 282 L18 76 A32 32 0 0 1 82 76 L82 282" class="death__line"/>
            <path d="M1 64 H22 M78 64 H99 M1 72 H22 M78 72 H99" class="death__line"/>
            <path d="M44 24 L56 24 L54 42 L46 42 Z" class="death__line"/>
          </g>
        </svg>

        <!-- the souls, filing in -->
        <div class="death__threshold">
          <i
              v-for="(w, i) in WISPS"
              :key="i"
              class="death__wisp"
              :class="{'death__wisp--again': i < 2}"
              :style="{'--x0': `${w[0]}em`, '--y0': `${w[1]}em`, '--d': `${1.7 + i * .26}s`}"
          ></i>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
defineOptions({name: 'SignatureDeath'});
defineProps<{layer: 'back' | 'front'}>();

/** Where each soul rises from, relative to the gate's threshold (em: a tenth of the gate's width). */
const WISPS: [number, number][] = [[-22, 4], [16, 6], [-9, 2], [-27, 8], [24, 3], [-15, 7], [10, 9], [-4, 5], [30, 7], [-19, 3], [-12, 6], [20, 4], [-30, 5], [6, 8]];
</script>

<style scoped>
.death {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* ---- pallor ---- */
.death__drain {
  position: absolute;
  inset: 0;
  background: #7d857c;
  mix-blend-mode: saturation;
  opacity: .86;
  animation: death-drain 2.6s ease-in-out .2s backwards;
}

.death__pallor {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(214, 226, 208, .08), rgba(214, 226, 208, .02) 60%, transparent);
  animation: death-drain 2.6s ease-in-out .2s backwards;
}

@keyframes death-drain {
  from { opacity: 0; }
}

/* ---- the gate: right of the drawn card, standing in the street fog at the castle's foot ---- */
.death__gate {
  /* 1em = a tenth of the gate's width */
  font-size: calc(var(--moon-r, 200px) * .062);
  position: absolute;
  left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * 1.55 - 5em);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .14 - 28.2em);
  width: 10em;
  height: 28.2em;
}

.death__halo {
  position: absolute;
  inset: -12% -60% 0;
  background: radial-gradient(50% 55% at 50% 62%, rgba(220, 236, 214, .22), rgba(200, 220, 196, .06) 60%, transparent);
  opacity: .25;
  animation: death-bright 6.6s ease-in-out .4s backwards;
}

.death__arch {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  /* its foot is lost in the fog */
  -webkit-mask-image: linear-gradient(0deg, transparent 0, #000 16%);
  mask-image: linear-gradient(0deg, transparent 0, #000 16%);
}

.death__line {
  fill: none;
  stroke: #e8eee2;
  stroke-width: 1.4;
  vector-effect: non-scaling-stroke;
}

.death__door {
  fill: rgba(206, 214, 200, .2);
  stroke: #e8eee2;
  stroke-opacity: .55;
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

/* it comes up out of the fog, then, at the end, dims to an outline */
.death__frame {
  opacity: .42;
  animation: death-frame 6.6s ease-in-out .4s backwards;
}

@keyframes death-frame {
  0% { opacity: 0; transform: translateY(4%); }
  16% { opacity: 1; transform: none; }
  80% { opacity: 1; }
  100% { opacity: .42; }
}

.death__beyond {
  opacity: .1;
  animation: death-bright 6.6s ease-in-out .4s backwards;
}

@keyframes death-bright {
  0%, 18% { opacity: 0; }
  34% { opacity: 1; }
  80% { opacity: .85; }
  100% { opacity: .1; }
}

.death__leaf {
  transform-box: view-box;
  opacity: 0;
  transform: scaleX(.1);
  animation: death-open 6.6s ease-in-out .4s backwards;
}

.death__leaf--l {
  transform-origin: 18px 0;
}

.death__leaf--r {
  transform-origin: 82px 0;
}

@keyframes death-open {
  0% { opacity: 0; transform: none; }
  14% { opacity: .9; transform: none; }
  20% { opacity: .9; transform: none; }
  36% { opacity: .9; transform: scaleX(.1); }
  80% { opacity: .9; transform: scaleX(.1); }
  100% { opacity: 0; transform: scaleX(.1); }
}

/* ---- the procession ---- */
.death__threshold {
  position: absolute;
  left: 50%;
  top: calc(100% - 3em);
}

.death__wisp {
  position: absolute;
  left: -.4em;
  top: -.4em;
  width: .8em;
  height: .8em;
  background: #e2f2da;
  box-shadow: 0 0 .9em .25em rgba(207, 230, 200, .5);
  opacity: 0;
  animation: death-wisp 3.4s ease-in-out var(--d) backwards;
}

/* risen from the street, they turn toward the gate and are drawn in, growing small */
@keyframes death-wisp {
  0% { opacity: 0; transform: translate(var(--x0), var(--y0)); }
  14% { opacity: .9; }
  48% { transform: translate(calc(var(--x0) * .72), calc(var(--y0) - 9em)); }
  80% { opacity: .85; transform: translate(calc(var(--x0) * .16), -9em) scale(.8); }
  100% { opacity: 0; transform: translate(0, -7em) scale(.25); }
}

/* afterwards, now and then, one more */
.death__wisp--again {
  animation:
    death-wisp 3.4s ease-in-out var(--d) backwards,
    death-wisp-again 13s ease-in-out calc(var(--d) + 8s) infinite;
}

@keyframes death-wisp-again {
  0% { opacity: 0; transform: translate(var(--x0), var(--y0)); }
  4% { opacity: .7; }
  14% { transform: translate(calc(var(--x0) * .72), calc(var(--y0) - 9em)); }
  23% { opacity: .65; transform: translate(calc(var(--x0) * .16), -9em) scale(.8); }
  29%, 100% { opacity: 0; transform: translate(0, -7em) scale(.25); }
}

/* light theme: a grey-green ink gate on the misty paper */
:root[data-theme="parchment"] .death__line,
:root[data-theme="parchment"] .death__door {
  stroke: #5d6a5a;
}

:root[data-theme="parchment"] .death__door {
  fill: rgba(120, 136, 116, .14);
}

:root[data-theme="parchment"] .death__wisp {
  background: #8fa88a;
  box-shadow: 0 0 .8em .2em rgba(120, 150, 114, .35);
}

:root[data-theme="parchment"] .death__halo {
  display: none;
}

@media (prefers-reduced-motion: reduce) {
  .death__drain,
  .death__pallor,
  .death__halo,
  .death__frame,
  .death__beyond,
  .death__leaf,
  .death__wisp,
  .death__wisp--again {
    animation: none;
  }
}
</style>
