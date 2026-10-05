<template>
  <!--
    Twilight Giant: in the frozen dusk a colossal armoured giant rises behind the skyline,
    leaning on a greatsword planted in the city; a bar of dawn light runs down the blade,
    then the figure fades back into the haze while the low light stays on the castle.
  -->
  <div aria-hidden="true">
    <template v-if="layer === 'back'">
      <div class="gi-figure">
        <svg class="gi-svg" viewBox="-230 -430 460 870" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="gi-skin" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stop-color="#3a2234"/>
              <stop offset=".35" stop-color="#22142a"/>
              <stop offset="1" stop-color="#170d1e"/>
            </linearGradient>
            <linearGradient id="gi-blade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stop-color="#4a2c3a"/>
              <stop offset=".5" stop-color="#24162c"/>
              <stop offset="1" stop-color="#160d1c"/>
            </linearGradient>
          </defs>
          <!-- the cloak behind him, falling wide from the shoulders -->
          <path class="gi-cloak" d="M-112 -262 C-170 -214 -214 -70 -232 440 L232 440 C214 -70 170 -214 112 -262 Z"/>
          <!-- legs, set apart (mostly hidden behind the city) -->
          <path class="gi-armour" d="M-74 20 L-28 20 L-34 210 C-36 240 -40 300 -44 440 L-104 440 C-98 300 -92 240 -88 210 Z M74 20 L28 20 L34 210 C36 240 40 300 44 440 L104 440 C98 300 92 240 88 210 Z"/>
          <!-- breastplate and faulds -->
          <path class="gi-armour" d="M-72 -266 C-82 -222 -82 -170 -66 -112 L-58 -64 L58 -64 L66 -112 C82 -170 82 -222 72 -266 Z"/>
          <path class="gi-armour" d="M-60 -66 L60 -66 L74 -26 L84 26 L-84 26 L-74 -26 Z"/>
          <!-- the greatsword: blade into the ground, crossguard, grip -->
          <path class="gi-blade" d="M-21 -34 L21 -34 L19 380 L0 436 L-19 380 Z"/>
          <path class="gi-armour" d="M-98 -46 C-60 -51 60 -51 98 -46 L103 -38 C107 -31 102 -27 95 -30 L60 -34 C30 -36 -30 -36 -60 -34 L-95 -30 C-102 -27 -107 -31 -103 -38 Z"/>
          <path class="gi-armour" d="M0 -50 L10 -38 L0 -24 L-10 -38 Z"/>
          <rect class="gi-armour" x="-7.5" y="-64" width="15" height="20"/>
          <!-- arms: rerebraces down and out to the elbows, vambraces in to the hands on the pommel -->
          <g class="gi-armour">
            <path d="M-152 -184 C-165 -150 -177 -120 -186 -98 L-152 -74 C-142 -110 -128 -146 -112 -178 Z"/>
            <path d="M-192 -108 C-203 -90 -192 -68 -166 -66 C-155 -72 -149 -83 -150 -92 C-160 -105 -177 -112 -192 -108 Z M-188 -97 L-212 -84 L-184 -79 Z"/>
            <path d="M-170 -100 C-130 -102 -80 -100 -40 -96 L-38 -56 C-80 -58 -128 -62 -162 -66 Z"/>
            <path d="M152 -184 C165 -150 177 -120 186 -98 L152 -74 C142 -110 128 -146 112 -178 Z"/>
            <path d="M192 -108 C203 -90 192 -68 166 -66 C155 -72 149 -83 150 -92 C160 -105 177 -112 192 -108 Z M188 -97 L212 -84 L184 -79 Z"/>
            <path d="M170 -100 C130 -102 80 -100 40 -96 L38 -56 C80 -58 128 -62 162 -66 Z"/>
            <!-- the gauntlets folded over the pommel, its ball showing above them -->
            <circle cx="0" cy="-118" r="11"/>
            <path d="M-44 -98 C-40 -112 -18 -116 0 -113 C18 -116 40 -112 44 -98 L46 -64 C32 -55 -32 -55 -46 -64 Z"/>
          </g>
          <!-- pauldrons, three lames stepping down at the shoulder's edge -->
          <path class="gi-armour" d="M-42 -278 C-62 -296 -112 -300 -140 -270 C-154 -256 -160 -238 -158 -220 L-163 -205 L-150 -203 L-157 -189 L-140 -187 L-147 -173 L-118 -175 C-108 -191 -96 -207 -80 -215 C-66 -223 -52 -237 -44 -251 Z"/>
          <path class="gi-armour" d="M42 -278 C62 -296 112 -300 140 -270 C154 -256 160 -238 158 -220 L163 -205 L150 -203 L157 -189 L140 -187 L147 -173 L118 -175 C108 -191 96 -207 80 -215 C66 -223 52 -237 44 -251 Z"/>
          <!-- gorget and the great helm, bowed a little, its plume blown aside -->
          <path class="gi-armour" d="M-31 -300 L31 -300 C36 -290 40 -282 46 -272 L-46 -272 C-40 -282 -36 -290 -31 -300 Z"/>
          <g class="gi-head">
            <path class="gi-plume" d="M-3 -392 C2 -414 26 -426 54 -418 C70 -412 80 -398 86 -382 C72 -394 54 -399 34 -397 C20 -396 10 -393 4 -389 Z"/>
            <path class="gi-armour" d="M0 -397 C19 -397 33 -389 37 -373 L39 -352 L42 -346 L39 -339 L38 -318 C37 -305 30 -296 17 -290 L0 -282 L-17 -290 C-30 -296 -37 -305 -38 -318 L-39 -339 L-42 -346 L-39 -352 L-37 -373 C-33 -389 -19 -397 0 -397 Z"/>
            <path class="gi-detail" d="M-38 -346 L38 -346 M-30 -312 C-18 -304 18 -304 30 -312"/>
            <path class="gi-rim" d="M-39 -352 L-37 -373 C-33 -389 -19 -397 0 -397 M-38 -318 L-39 -339"/>
            <path class="gi-rim" d="M-3 -392 C2 -414 26 -426 54 -418"/>
          </g>
          <!-- plate edges in a slightly lighter tone, so it reads as armour and not a shadow -->
          <g class="gi-detail">
            <path d="M-44 -40 C-20 -44 20 -44 44 -40 M-56 -16 C-24 -20 24 -20 56 -16 M-62 8 C-26 4 26 4 62 8"/>
            <path d="M-150 -203 C-130 -210 -110 -212 -96 -208 M-140 -187 C-125 -192 -110 -193 -100 -190 M150 -203 C130 -210 110 -212 96 -208 M140 -187 C125 -192 110 -193 100 -190"/>
            <path d="M-54 -250 C-40 -232 -36 -200 -34 -170 M54 -250 C40 -232 36 -200 34 -170 M-162 -82 L-150 -92 M162 -82 L150 -92"/>
            <path d="M0 -20 L0 200"/>
          </g>
          <!-- the low sun behind and to his right (our left) catching the near edges -->
          <g class="gi-rim">
            <path d="M-140 -270 C-154 -256 -160 -238 -158 -220 M-42 -278 C-62 -296 -112 -300 -140 -270"/>
            <path d="M-165 -150 C-177 -120 -186 -98 -186 -98 M-192 -108 C-203 -90 -192 -68 -166 -66"/>
            <path d="M-170 -100 C-130 -102 -80 -100 -40 -96 M-98 -46 C-60 -51 -20 -51 0 -51"/>
            <path d="M-21 -34 L-19 380"/>
          </g>
        </svg>
      </div>

      <!-- the dawn light running down the blade: a bar inside a blade-wide window -->
      <div class="gi-blade-light">
        <i class="gi-blade-light__edge"></i>
        <i class="gi-blade-light__bar"></i>
      </div>
      <i class="gi-guard-glint"></i>
    </template>
    <template v-else>
      <!-- the low light that stays on the castle's edges after he is gone -->
      <i class="gi-castle-light" :style="{'--city-mask': `url(${city})`}"></i>
    </template>
  </div>
</template>

<script setup lang="ts">
import city from '../assets/moon/backlund-skyline.webp';

defineProps<{layer: 'back' | 'front'}>();
</script>

<style scoped>
/*
 * The giant stands to the castle's right, clear of the fan of cards: the figure box is
 * laid out in moon radii (its viewBox runs 200 units to the radius), centred 2 radii right
 * of the moon, helm at 2.15 radii above the moon's centre, feet far below the skyline.
 */
.gi-figure {
  position: absolute;
  left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * .85);
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * 2.15);
  width: calc(var(--moon-r, 200px) * 2.3);
  height: calc(var(--moon-r, 200px) * 4.35);
  /* his lower half melts into the haze over the city */
  -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 52%, rgba(0, 0, 0, .4) 66%, transparent 80%);
  mask-image: linear-gradient(180deg, #000 0%, #000 52%, rgba(0, 0, 0, .4) 66%, transparent 80%);
  opacity: .16;
  animation: gi-rise 6.6s cubic-bezier(.25, .6, .3, 1) .5s both;
}

/* up out of the haze, holding, then back into it */
@keyframes gi-rise {
  0% { opacity: 0; transform: translate3d(0, 13%, 0); }
  34% { opacity: .66; transform: none; }
  60% { opacity: .66; }
  100% { opacity: .16; transform: none; }
}

.gi-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.gi-armour {
  fill: url(#gi-skin);
}

.gi-armour path,
.gi-armour circle {
  fill: url(#gi-skin);
}

.gi-cloak {
  fill: #2a1a2e;
  opacity: .8;
}

.gi-plume {
  fill: #2c1a30;
}

.gi-blade {
  fill: url(#gi-blade);
}

.gi-head {
  transform-box: view-box;
  transform-origin: 50% 15.5%;
  transform: rotate(-4deg) translate(0, 3px);
}

.gi-detail,
.gi-detail path {
  fill: none;
  stroke: #452a3c;
  stroke-width: 1.4;
  stroke-linecap: round;
}

/* hugging the near edges, inside the silhouette */
.gi-rim,
.gi-rim path {
  fill: none;
  stroke: #ffa868;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-opacity: .38;
}

/* ---- the dawn on the blade ---- */
.gi-blade-light {
  position: absolute;
  left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * 1.895);
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * .17);
  width: calc(var(--moon-r, 200px) * .21);
  height: calc(var(--moon-r, 200px) * .9);
  overflow: hidden;
  -webkit-mask-image: linear-gradient(180deg, #000 70%, transparent);
  mask-image: linear-gradient(180deg, #000 70%, transparent);
  opacity: .25;
  animation: gi-blade-fade 6.6s ease .5s both;
}

@keyframes gi-blade-fade {
  0%, 30% { opacity: 0; }
  36% { opacity: 1; }
  62% { opacity: 1; }
  100% { opacity: .25; }
}

/* the blade's lit edge, left after the bar has passed */
.gi-blade-light__edge {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(255, 200, 130, .5) 0 12%, rgba(255, 170, 100, .12) 30%, transparent 60%);
}

.gi-blade-light__bar {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 34%;
  background: linear-gradient(180deg, transparent, rgba(255, 214, 150, .55) 35%, rgba(255, 246, 214, .95) 50%, rgba(255, 214, 150, .55) 65%, transparent);
  transform: translate3d(0, 300%, 0);
  opacity: 0;
  animation: gi-bar 1.15s cubic-bezier(.45, 0, .4, 1) 2.75s both;
}

@keyframes gi-bar {
  0% { transform: translate3d(0, -100%, 0); opacity: 0; }
  12% { opacity: 1; }
  80% { opacity: 1; }
  100% { transform: translate3d(0, 300%, 0); opacity: 0; }
}

/* the light catching the crossguard as it begins */
.gi-guard-glint {
  position: absolute;
  left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * 2);
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * .2);
  width: calc(var(--moon-r, 200px) * .7);
  height: calc(var(--moon-r, 200px) * .16);
  translate: -50% -50%;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(255, 236, 190, .75), rgba(255, 180, 110, .3) 45%, transparent);
  opacity: 0;
  animation: gi-glint 1.4s ease-out 2.6s both;
}

@keyframes gi-glint {
  0% { opacity: 0; transform: scaleX(.2); }
  25% { opacity: 1; transform: scaleX(1); }
  100% { opacity: 0; transform: scaleX(1.1); }
}

/* ---- in front: the low sun's light left on the castle (cut to its shape) ---- */
.gi-castle-light {
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
  background: radial-gradient(circle at calc(var(--moon-x, 72%) - var(--city-left, 0px)) calc(var(--moon-y, 48%) + var(--moon-r, 200px) * .8 - var(--city-bottom, 100%) + var(--city-h, 600px)),
      rgba(255, 170, 100, .7) 0, rgba(255, 130, 70, .25) calc(var(--moon-r, 200px) * 1.4), transparent calc(var(--moon-r, 200px) * 2.6));
  -webkit-mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mix-blend-mode: soft-light;
  opacity: .8;
  animation: gi-castle 3s ease 3.4s both;
}

@keyframes gi-castle {
  from { opacity: 0; }
}

/* ---- light theme: a soft grey-violet colossus in the morning haze ---- */
:root[data-theme="parchment"] .gi-figure {
  opacity: .08;
  animation-name: gi-rise-ink;
}

@keyframes gi-rise-ink {
  0% { opacity: 0; transform: translate3d(0, 13%, 0); }
  34% { opacity: .28; transform: none; }
  60% { opacity: .28; }
  100% { opacity: .08; transform: none; }
}

:root[data-theme="parchment"] .gi-rim path {
  stroke: #e0905a;
}

:root[data-theme="parchment"] .gi-castle-light {
  mix-blend-mode: multiply;
  opacity: .35;
}

/* stacked: the deck fills the band, so he stands nearer, helm and shoulder over the fan's edge (the blade is behind the tower there) */
@media (max-width: 900px) {
  .gi-figure {
    left: calc(var(--moon-x, 72%) + var(--moon-r, 200px) * .4);
  }

  .gi-blade-light,
  .gi-guard-glint {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gi-figure,
  .gi-blade-light,
  .gi-castle-light {
    animation: none;
  }

  .gi-blade-light__bar,
  .gi-guard-glint {
    display: none;
  }
}
</style>
