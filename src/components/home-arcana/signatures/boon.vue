<template>
  <!--
    Every Boon: something from outside looks in. Whatever hangs in the sky goes dark, as in
    an eclipse, and a ring of the Boon's colour burns round its rim; the stars are drawn
    slowly toward it and a pressure closes in at the edges. Then the Boon's own twist, in
    light and weather only. Nothing drawn: no iris, no branches, no frame, no words.
  -->
  <div ref="rootRef" class="boon" :class="`boon--${boon ?? 'none'}`" aria-hidden="true">
    <template v-if="layer === 'back'">
      <!-- the twists that live in the far sky -->
      <i v-if="boon === 'sublunary'" class="bo-paint"></i>
      <div v-if="boon === 'patriarch'" class="bo-rose"><i class="bo-rose__light"></i></div>
      <div v-if="boon === 'patriarch' || boon === 'chaos'" class="bo-band" :class="`bo-band--${boon}`">
        <i class="bo-band__fog"></i><i class="bo-band__tint"></i>
      </div>

      <!-- a sun that was up goes dark as it sets -->
      <div v-if="from === 'sun' || from === 'dusk'" class="bo-sun">
        <div ref="sunRiseRef" class="bo-sun__rise">
          <i class="bo-corona"></i>
          <i class="bo-eclipse"></i>
        </div>
      </div>

      <!-- the moon, eclipsed, and what gathers round it (follows it as it rises and scrolls) -->
      <div ref="followRef" class="bo-moon">
        <div ref="riseRef" class="bo-moon__rise">
          <i class="bo-corona"></i>
          <i class="bo-eclipse"></i>
        </div>
        <i v-for="(s, i) in STARS" :key="`s${i}`" class="bo-star" :style="s"></i>

        <template v-if="boon === 'aeon'">
          <i v-for="(f, i) in FRAGMENTS" :key="`f${i}`" class="bo-fragment" :style="f"></i>
        </template>
        <template v-else-if="boon === 'condenser'">
          <i class="bo-void"></i>
          <i v-for="(p, i) in PULLS" :key="`p${i}`" class="bo-pull" :style="p"></i>
        </template>
        <template v-else-if="boon === 'devouring'">
          <i v-for="(e, i) in EATEN" :key="`e${i}`" class="bo-eaten" :style="e"></i>
        </template>
      </div>
    </template>

    <template v-else>
      <!-- secondlaw: the colour draining outward from the body, a sickly haze after it -->
      <template v-if="boon === 'secondlaw'">
        <i class="bo-drain"></i>
        <i class="bo-sick"></i>
      </template>
      <!-- chaos: rot on the castle's tops -->
      <div v-if="boon === 'chaos'" class="bo-city">
        <i class="bo-rot" :style="{'--city-mask': `url(${city})`}"></i>
      </div>
      <!-- chaosmist: mist filling the streets -->
      <template v-if="boon === 'chaosmist'">
        <div v-for="k in 2" :key="k" class="bo-mist" :class="`bo-mist--${k}`">
          <i class="bo-band__fog"></i><i class="bo-band__tint"></i>
        </div>
      </template>
      <!-- everlasting: a column of light falling onto the tallest tower -->
      <template v-if="boon === 'everlasting'">
        <i class="bo-column"></i>
        <div class="bo-city">
          <i class="bo-lit" :style="{'--city-mask': `url(${city})`}"></i>
        </div>
      </template>

      <!-- the pressure, at the edges -->
      <i class="bo-press"></i>
      <!-- edict: the hush, when the whole scene holds its breath -->
      <i v-if="boon === 'edict'" class="bo-hush"></i>
    </template>
  </div>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, ref} from 'vue';
import city from '../assets/moon/backlund-skyline.webp';
import {reducedMotion, seeded, useMoonAnchor} from './sigKit';

defineOptions({name: 'SignatureBoon'});
const props = defineProps<{layer: 'back' | 'front'; from?: string; boon?: string}>();

const rnd = seeded(23);
const f2 = (n: number) => n.toFixed(2);

/* ---- shared: stars drawn slowly in toward the body (moon radii from its centre) ---- */
const STARS = Array.from({length: 30}, () => {
  const a = rnd() * Math.PI * 2;
  const r = 1.45 + rnd() * 1.4;
  const a0 = a - .35 - rnd() * .3;
  const r0 = r * (1.45 + rnd() * .4);
  return {
    '--x': f2(Math.cos(a) * r), '--y': f2(Math.sin(a) * r),
    '--dx': f2(Math.cos(a0) * r0 - Math.cos(a) * r), '--dy': f2(Math.sin(a0) * r0 - Math.sin(a) * r),
    '--d': `${f2(.5 + rnd() * 1)}s`, '--s': rnd() < .25 ? '3px' : '2px', '--o': f2(.45 + rnd() * .45),
  };
});

/* ---- aeon: fragments of light breaking off the ring and drifting out ---- */
const FRAGMENTS = Array.from({length: 11}, (_, i) => {
  const a = (i / 11) * Math.PI * 2 + rnd() * .4;
  const out = .5 + rnd() * .8;
  return {
    '--x': f2(Math.cos(a) * 1.04), '--y': f2(Math.sin(a) * 1.04),
    '--dx': f2(Math.cos(a) * out), '--dy': f2(Math.sin(a) * out),
    '--rot': `${Math.round((a * 180) / Math.PI + 90)}deg`,
    '--d': `${f2(2.2 + i * .2 + rnd() * .3)}s`, '--o': f2(.35 + rnd() * .4),
  };
});

/* ---- condenser: stars streaking in ---- */
const PULLS = Array.from({length: 14}, (_, i) => {
  const a = (i / 14) * 360 + rnd() * 18;
  return {'--a': `${Math.round(a)}deg`, '--r0': f2(2.6 + rnd() * 1.2), '--d': `${f2(1.6 + i * .2 + rnd() * .2)}s`, '--t': `${f2(.9 + rnd() * .5)}s`};
});

/* ---- devouring: the stars nearest the body, going out one by one ---- */
const EATEN = Array.from({length: 14}, (_, i) => {
  const a = rnd() * Math.PI * 2;
  const r = 1.2 + rnd() * .75;
  return {'--x': f2(Math.cos(a) * r), '--y': f2(Math.sin(a) * r), '--d': `${f2(2.4 + i * .28)}s`, '--s': rnd() < .3 ? '3px' : '2px'};
});

/* the eclipse rides on the moon as it rises and as the page scrolls */
const rootRef = ref<HTMLElement | null>(null);
const followRef = ref<HTMLElement | null>(null);
const riseRef = ref<HTMLElement | null>(null);
useMoonAnchor(followRef, riseRef);

/*
 * A sun that was up sets under the new card (HeroNightScene .night__sun-rise, a CSS
 * transition): its dark disc copies that transition, frame for frame, so it goes down dark.
 */
const sunRiseRef = ref<HTMLElement | null>(null);
function followSun(night: HTMLElement) {
  const src = night.querySelector<HTMLElement>('.night__sun-rise');
  const dst = sunRiseRef.value;
  if (!src || !dst) return;
  let found = false;
  for (const a of src.getAnimations()) {
    if (!(a instanceof CSSTransition) || !(a.effect instanceof KeyframeEffect)) continue;
    const prop = a.transitionProperty;
    if (prop !== 'transform' && prop !== 'opacity') continue;
    const t = a.effect.getTiming();
    const keys = a.effect.getKeyframes().map(k => ({offset: k.offset, [prop]: String(k[prop])}));
    const m = dst.animate(keys, {duration: t.duration, delay: t.delay, easing: t.easing, fill: 'forwards'});
    m.currentTime = a.currentTime;
    found = true;
  }
  // nothing to follow (reduced motion, or already down): no dark sun
  if (!found) dst.style.opacity = '0';
}

/* ---- edict: the hush; the scene's fog stops for a moment (see the :global rule) ---- */
const HUSH_AT = 3000;
const HUSH_FOR = 1900;
let night: HTMLElement | null = null;
const timers: number[] = [];
onMounted(() => {
  night = rootRef.value?.closest<HTMLElement>('.night') ?? null;
  if (!night) return;
  if (props.layer === 'back' && (props.from === 'sun' || props.from === 'dusk')) followSun(night);
  if (props.layer === 'front' && props.boon === 'edict' && !reducedMotion()) {
    timers.push(window.setTimeout(() => night?.classList.add('sig-boon-hush'), HUSH_AT));
    timers.push(window.setTimeout(() => night?.classList.remove('sig-boon-hush'), HUSH_AT + HUSH_FOR));
  }
});
onUnmounted(() => {
  timers.forEach(t => window.clearTimeout(t));
  if (props.boon === 'edict') night?.classList.remove('sig-boon-hush');
});
</script>

<style scoped>
/* edict's hush: the base scene's fog and clouds stop mid-drift */
:global(.night.sig-boon-hush .night__fog-drift),
:global(.night.sig-boon-hush .night__clouds-drift) {
  animation-play-state: paused;
}

.boon {
  position: absolute;
  inset: 0;
  pointer-events: none;
  /* the Boon's colour, stronger and paler for the burning rim */
  --burn: color-mix(in oklab, var(--acc) 70%, #fff);
}

/* ---- the body: a box on the moon (and one on the sun, while it sets) ---- */
.bo-moon {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px));
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px));
  width: calc(var(--moon-r, 200px) * 2);
  aspect-ratio: 1;
  will-change: transform;
}

.bo-moon__rise,
.bo-sun__rise {
  position: absolute;
  inset: 0;
}

.bo-sun {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px) * .8);
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * .8);
  width: calc(var(--moon-r, 200px) * 1.6);
  aspect-ratio: 1;
}

/* the dark disc over the body */
.bo-eclipse {
  position: absolute;
  inset: -1%;
  border-radius: 50%;
  background: radial-gradient(circle closest-side, #060508 0, #08060b 90%, rgba(8, 6, 11, .8) 97%, transparent);
  opacity: .93;
  animation: bo-dark 2.2s cubic-bezier(.5, 0, .5, 1) .4s backwards;
}

.bo-sun .bo-eclipse {
  animation-duration: .9s;
  animation-delay: .1s;
}

@keyframes bo-dark {
  from { opacity: 0; }
}

/* the ring that burns round its rim, and the faint streamers off it */
.bo-corona {
  position: absolute;
  inset: -55%;
  border-radius: 50%;
  background:
    /* the limb sits at 47.6% of this box's radius */
    radial-gradient(circle closest-side,
      transparent 45.5%,
      var(--burn) 47.8%,
      color-mix(in oklab, var(--acc) 62%, transparent) 49.2%,
      color-mix(in oklab, var(--acc) 26%, transparent) 53%,
      color-mix(in oklab, var(--acc) 9%, transparent) 64%,
      transparent 84%),
    conic-gradient(from 20deg,
      transparent, color-mix(in oklab, var(--acc) 18%, transparent) 30deg, transparent 55deg,
      color-mix(in oklab, var(--acc) 13%, transparent) 110deg, transparent 150deg,
      color-mix(in oklab, var(--acc) 20%, transparent) 205deg, transparent 240deg,
      color-mix(in oklab, var(--acc) 11%, transparent) 290deg, transparent 330deg);
  /* the streamers fade out from the limb */
  -webkit-mask: radial-gradient(circle closest-side, #000 48%, rgba(0, 0, 0, .45) 66%, transparent 92%);
  mask: radial-gradient(circle closest-side, #000 48%, rgba(0, 0, 0, .45) 66%, transparent 92%);
  mix-blend-mode: screen;
  animation: bo-burn 2.6s ease-out 1.4s backwards;
}

.bo-sun .bo-corona {
  animation-duration: 1s;
  animation-delay: .4s;
}

@keyframes bo-burn {
  0% { opacity: 0; transform: scale(.9); }
  40% { opacity: 1; }
}

/* ---- the stars, drawn in ---- */
.bo-star {
  position: absolute;
  left: calc(50% + var(--x) * 50%);
  top: calc(50% + var(--y) * 50%);
  width: var(--s);
  height: var(--s);
  background: #e6e0f4;
  box-shadow: 0 0 3px color-mix(in oklab, var(--acc) 60%, transparent);
  opacity: var(--o);
  animation: bo-drawn 5.6s cubic-bezier(.45, 0, .3, 1) var(--d) backwards;
}

@keyframes bo-drawn {
  0% { opacity: 0; transform: translate3d(calc(var(--moon-r, 200px) * var(--dx)), calc(var(--moon-r, 200px) * var(--dy)), 0); }
  20% { opacity: var(--o); }
}

/* ---- aeon: fragments of light breaking from the ring ---- */
.bo-fragment {
  position: absolute;
  left: calc(50% + var(--x) * 50%);
  top: calc(50% + var(--y) * 50%);
  width: 3px;
  height: 7px;
  rotate: var(--rot);
  background: var(--burn);
  box-shadow: 0 0 5px var(--acc);
  opacity: var(--o);
  transform: translate3d(calc(var(--moon-r, 200px) * var(--dx)), calc(var(--moon-r, 200px) * var(--dy)), 0);
  animation: bo-break 3.2s cubic-bezier(.2, .5, .3, 1) var(--d) backwards;
}

@keyframes bo-break {
  0% { opacity: 0; transform: none; }
  12% { opacity: 1; }
}

/* ---- condenser: a black void beside the body, and stars pulled into the body in streaks ---- */
.bo-void {
  position: absolute;
  left: calc(50% + 50% * 1.7 - var(--moon-r, 200px) * .3);
  top: calc(50% - 50% * .95 - var(--moon-r, 200px) * .3);
  width: calc(var(--moon-r, 200px) * .6);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(closest-side, #000 0 30%, rgba(0, 0, 0, .85) 40%, color-mix(in oklab, #000 50%, var(--acc)) 50%, color-mix(in oklab, var(--acc) 22%, transparent) 62%, color-mix(in oklab, var(--acc) 6%, transparent) 80%, transparent);
  filter: blur(1.5px);
  animation: bo-void 2.4s cubic-bezier(.3, 0, .2, 1) 2.2s backwards;
}

@keyframes bo-void {
  from { opacity: 0; transform: scale(.15); }
}

.bo-pull {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(var(--moon-r, 200px) * .5);
  height: 1.5px;
  rotate: var(--a);
  transform-origin: 0 50%;
  background: linear-gradient(90deg, rgba(240, 240, 255, .9), color-mix(in oklab, var(--acc) 50%, transparent) 40%, transparent);
  opacity: 0;
  animation: bo-pull var(--t) cubic-bezier(.6, 0, .9, .5) var(--d) backwards;
}

/* from far out along its line to the rim, gone as it lands */
@keyframes bo-pull {
  0% { opacity: 0; transform: translate3d(calc(var(--moon-r, 200px) * var(--r0)), 0, 0); }
  25% { opacity: .9; }
  100% { opacity: 0; transform: translate3d(calc(var(--moon-r, 200px) * 1.05), 0, 0); }
}

/* ---- devouring: stars near the body going out, one after another ---- */
.bo-eaten {
  position: absolute;
  left: calc(50% + var(--x) * 50%);
  top: calc(50% + var(--y) * 50%);
  width: var(--s);
  height: var(--s);
  background: #f2ece6;
  box-shadow: 0 0 3px rgba(236, 193, 173, .7);
  opacity: 0;
  animation: bo-eaten var(--d) linear backwards;
}

@keyframes bo-eaten {
  0% { opacity: 0; }
  20% { opacity: .9; }
  92% { opacity: .9; transform: none; }
  100% { opacity: 0; transform: scale(.2); }
}

/* ---- sublunary: a painterly grain over the sky, as if the night were on canvas ---- */
.bo-paint {
  position: absolute;
  inset: 0 0 auto;
  height: var(--scene-h, 100%);
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='520' height='520'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.005 .045' numOctaves='3' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 1.4 -.2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)'/%3E%3C/svg%3E") 0 0 / 520px 520px;
  mix-blend-mode: overlay;
  opacity: .55;
  -webkit-mask-image: linear-gradient(180deg, #000 55%, transparent 90%);
  mask-image: linear-gradient(180deg, #000 55%, transparent 90%);
  animation: bo-wash 3s ease-out 2s backwards;
}

@keyframes bo-wash {
  from { opacity: 0; }
}

/* ---- patriarch: a rose light in the haze low behind the castle, slowly pulsing ---- */
.bo-rose {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px) * 3);
  width: calc(var(--moon-r, 200px) * 6);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .68);
  height: calc(var(--city-h, 600px) * .5);
  mix-blend-mode: screen;
  animation: bo-wash 3s ease-out 1.8s backwards;
}

/* (the blend on the box, the pulse on the light: so the pulse stays on the compositor) */
.bo-rose__light {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(240, 120, 160, .75), rgba(231, 119, 153, .3) 50%, transparent);
  opacity: .6;
  will-change: opacity;
  /* the one thing still moving: the light swelling and ebbing, like a slow pulse */
  animation: bo-pulse 4.4s ease-in-out 4.8s infinite alternate;
}

@keyframes bo-pulse {
  to { opacity: 1; }
}

/* ---- fog bands in the scene's own technique: chaos's rot along the skyline, patriarch's rose haze, chaosmist's mist ---- */
.bo-band,
.bo-mist {
  position: absolute;
  left: 0;
  right: 0;
  overflow: hidden;
  isolation: isolate;
  mix-blend-mode: screen;
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent);
  animation: bo-rise 3.2s ease-out 1.6s backwards;
}

@keyframes bo-rise {
  from { opacity: 0; transform: translate3d(0, 12%, 0); }
}

.bo-band__fog {
  position: absolute;
  inset: 0;
  background: url('../assets/moon/fog-bank.webp') repeat-x 20% 50% / 50% 100%;
}

.bo-band__tint {
  position: absolute;
  inset: 0;
  mix-blend-mode: multiply;
}

.bo-band--chaos {
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .72);
  height: calc(var(--city-h, 600px) * .34);
  opacity: .7;
}

.bo-band--chaos .bo-band__tint {
  background: #c2402c;
}

.bo-band--patriarch {
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .62);
  height: calc(var(--city-h, 600px) * .3);
  opacity: .45;
}

.bo-band--patriarch .bo-band__tint {
  background: #e98aa6;
}

.bo-mist--1 {
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .34);
  height: calc(var(--city-h, 600px) * .3);
  opacity: .55;
}

.bo-mist--2 {
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px) * .2);
  height: calc(var(--city-h, 600px) * .24);
  opacity: .65;
  animation-delay: 2.1s;
}

.bo-mist--2 .bo-band__fog {
  background-position-x: 65%;
}

.bo-mist .bo-band__tint {
  background: #a9dde8;
}

/* ---- a box over the skyline image, for light cut to the buildings ---- */
.bo-city {
  position: absolute;
  left: var(--city-left, 0);
  top: calc(var(--city-bottom, 100%) - var(--city-h, 600px));
  height: var(--city-h, 600px);
  aspect-ratio: 16 / 9;
}

/* chaos: a red rot creeping on the tops of the buildings */
.bo-rot {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(160, 44, 30, .55), rgba(120, 30, 24, .2) 35%, transparent 60%);
  -webkit-mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mix-blend-mode: screen;
  opacity: .6;
  animation: bo-wash 3s ease-out 2s backwards;
}

/* ---- everlasting: a narrow column of light falling from high in the sky onto the tallest tower ---- */
.bo-column {
  /* the tower's top (backlund-skyline.webp: x 1509, y 166 of 1920 x 1080) */
  --tx: calc(var(--city-left, 0px) + var(--city-h, 600px) * 16 / 9 * 1509 / 1920);
  --ty: calc(var(--city-bottom, 100%) - var(--city-h, 600px) + var(--city-h, 600px) * 166 / 1080);
  position: absolute;
  left: calc(var(--tx) - var(--moon-r, 200px) * .2);
  top: 0;
  width: calc(var(--moon-r, 200px) * .4);
  height: calc(var(--ty) + var(--moon-r, 200px) * .05);
  background: linear-gradient(180deg, transparent, color-mix(in oklab, var(--acc) 22%, transparent) 30%, color-mix(in oklab, var(--burn) 50%, transparent) 88%, color-mix(in oklab, var(--burn) 20%, transparent));
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 38%, #000 62%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 38%, #000 62%, transparent);
  mix-blend-mode: screen;
  transform-origin: 50% 0;
  animation: bo-fall 1.8s cubic-bezier(.5, 0, .3, 1) 2.4s backwards;
}

/* it comes down onto the tower */
@keyframes bo-fall {
  from { opacity: 0; transform: scaleY(0); }
}

/* where it lands, the tower lit */
.bo-lit {
  position: absolute;
  inset: 0;
  background: radial-gradient(calc(var(--moon-r, 200px) * .7) calc(var(--moon-r, 200px) * 1.2) at 78.6% 15.4%, color-mix(in oklab, var(--burn) 60%, transparent), transparent);
  -webkit-mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mask: var(--city-mask) 0 0 / 100% 100% no-repeat;
  mix-blend-mode: screen;
  animation: bo-wash 2s ease-out 3.6s backwards;
}

/* ---- secondlaw: the drain spreading outward from the body, then the sickly haze ---- */
.bo-drain {
  position: absolute;
  left: calc(var(--moon-x, 72%) - var(--moon-r, 200px) * 9);
  top: calc(var(--moon-y, 48%) - var(--moon-r, 200px) * 9);
  width: calc(var(--moon-r, 200px) * 18);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(closest-side, #808080 70%, transparent);
  mix-blend-mode: saturation;
  opacity: .7;
  will-change: transform;
  animation: bo-spread 4s cubic-bezier(.3, 0, .3, 1) 1.6s backwards;
}

@keyframes bo-spread {
  from { opacity: 0; transform: scale(.08); }
  15% { opacity: .7; }
}

.bo-sick {
  position: absolute;
  inset: 0 0 auto;
  height: var(--scene-h, 100%);
  background: linear-gradient(0deg, rgba(196, 200, 112, .24), rgba(180, 190, 100, .1) 45%, rgba(170, 180, 100, .04) 80%);
  mix-blend-mode: screen;
  animation: bo-wash 3s ease-out 3.4s backwards;
}

/*
 * While the next card takes over, SceneSignature fades this layer as a group; inside it a
 * blend has nothing to blend with and would lay plain grey over the scene, so the drain
 * simply lets go.
 */
.boon.is-leaving .bo-drain {
  display: none;
}

/* ---- the pressure: a vignette closing in, with two heavy beats, then held ---- */
.bo-press {
  position: absolute;
  inset: 0 0 auto;
  height: var(--scene-h, 100%);
  background: radial-gradient(ellipse 72% 78% at var(--moon-x, 72%) var(--moon-y, 48%), transparent 42%, color-mix(in oklab, #060509 82%, var(--acc)) 100%);
  opacity: .62;
  animation: bo-press 4s ease-in-out .6s backwards;
}

@keyframes bo-press {
  0% { opacity: 0; }
  40% { opacity: .55; }
  52% { opacity: .8; }
  62% { opacity: .58; }
  72% { opacity: .78; }
  100% { opacity: .62; }
}

/* ---- edict: the scene dims while it holds still ---- */
.bo-hush {
  position: absolute;
  inset: 0 0 auto;
  height: var(--scene-h, 100%);
  background: #040306;
  opacity: 0;
  animation: bo-hush 1.9s ease-in-out 3s;
}

@keyframes bo-hush {
  0% { opacity: 0; }
  15% { opacity: .4; }
  80% { opacity: .4; }
  100% { opacity: 0; }
}

/* ---- light theme: the same presence as grey-violet ink and tinted haze on the paper ---- */
:root[data-theme="parchment"] .bo-eclipse {
  background: radial-gradient(circle closest-side, #3a3542 0, #3a3542 90%, rgba(58, 53, 66, .7) 97%, transparent);
  opacity: .6;
}

:root[data-theme="parchment"] .bo-corona,
:root[data-theme="parchment"] .bo-rose,
:root[data-theme="parchment"] .bo-rot,
:root[data-theme="parchment"] .bo-column,
:root[data-theme="parchment"] .bo-lit,
:root[data-theme="parchment"] .bo-sick {
  mix-blend-mode: multiply;
}

:root[data-theme="parchment"] .bo-star,
:root[data-theme="parchment"] .bo-eaten {
  background: #4a4058;
  box-shadow: none;
}

:root[data-theme="parchment"] .bo-band,
:root[data-theme="parchment"] .bo-mist {
  mix-blend-mode: multiply;
}

:root[data-theme="parchment"] .bo-band__fog {
  filter: invert(1);
}

:root[data-theme="parchment"] .bo-band__tint {
  mix-blend-mode: screen;
}

:root[data-theme="parchment"] .bo-paint {
  mix-blend-mode: multiply;
  opacity: .25;
}

:root[data-theme="parchment"] .bo-press {
  background: radial-gradient(ellipse 72% 78% at var(--moon-x, 72%) var(--moon-y, 48%), transparent 50%, color-mix(in oklab, #8a8496 70%, var(--acc)) 100%);
  opacity: .3;
}

:root[data-theme="parchment"] .bo-void {
  opacity: .5;
}

:root[data-theme="parchment"] .bo-hush {
  background: #6c6676;
}

@media (prefers-reduced-motion: reduce) {
  .bo-eclipse,
  .bo-corona,
  .bo-star,
  .bo-fragment,
  .bo-void,
  .bo-pull,
  .bo-eaten,
  .bo-paint,
  .bo-rose,
  .bo-rose__light,
  .bo-band,
  .bo-mist,
  .bo-rot,
  .bo-column,
  .bo-lit,
  .bo-drain,
  .bo-sick,
  .bo-press,
  .bo-hush {
    animation: none;
  }
}
</style>
