<template>
  <section id="sequence-9" ref="rootRef" class="brew" aria-labelledby="ascent-brew-title">
    <div class="brew__stage">
      <div class="a-shell brew__grid">
        <div class="brew__copy">
          <p class="a-eyebrow">
            <span class="a-seq">9</span>{{ t('home.ascent.brew.eyebrow') }}
          </p>
          <h2 id="ascent-brew-title" class="a-h2 brew__title">{{ t('home.ascent.brew.title') }}</h2>
          <p class="a-lede brew__lede">{{ t('home.ascent.brew.lede') }}</p>

          <ol class="brew__steps">
            <li
                v-for="(step, index) in steps"
                :key="step.title"
                :class="['brew__step', {'is-active': activeStep === index, 'is-done': activeStep > index}]"
            >
              <span class="brew__step-num" aria-hidden="true">0{{ index + 1 }}</span>
              <span class="brew__step-text">
                <strong>{{ step.title }}</strong>
                <span>{{ step.body }}</span>
              </span>
            </li>
          </ol>

          <p class="brew__starter">
            <i class="fa-solid fa-route" aria-hidden="true"></i>
            <span>{{ t('home.ascent.brew.starter') }}</span>
            <RouterLink :to="$lp('/guide/first-potion')" class="a-link">{{ t('home.ascent.brew.guide') }}</RouterLink>
          </p>
        </div>

        <div class="brew__scene-wrap">
          <div class="brew__scene" role="img" :aria-label="t('home.ascent.brew.sceneLabel')">
            <div class="brew__numeral" aria-hidden="true">9</div>
            <div class="brew__floor" aria-hidden="true"></div>
            <div class="brew__circle" aria-hidden="true">
              <img :src="magicCircle" alt="" width="256" height="256" loading="lazy" decoding="async">
            </div>

            <!-- inventory: the formula and what it asks for -->
            <div class="brew__slots" aria-hidden="true">
              <span v-for="item in items" :key="item.id" class="brew__slot" :style="item.vars">
                <span class="brew__slot-label">{{ item.label }}</span>
              </span>
            </div>

            <div class="cauldron" aria-hidden="true">
              <span class="cauldron__fire" :style="{backgroundImage: `url(${soulFire})`}"></span>
              <img class="cauldron__layer" :src="cauldronWell" alt="" width="320" height="336" loading="lazy" decoding="async">
              <span class="cauldron__liquid">
                <img class="cauldron__layer cauldron__surface" :src="cauldronSurface" alt="" width="320" height="336" loading="lazy" decoding="async">
                <span class="cauldron__ripple" v-for="item in items" :key="item.id" :style="item.vars"></span>
              </span>
              <img class="cauldron__layer" :src="cauldronBody" alt="" width="320" height="336" loading="lazy" decoding="async">
              <span class="cauldron__glow"></span>
            </div>

            <div class="brew__bubbles" aria-hidden="true">
              <i v-for="n in 7" :key="n" :style="{'--b-i': n}"></i>
            </div>

            <img
                v-for="item in items"
                :key="item.id"
                class="brew__item"
                :style="item.vars"
                :src="item.src"
                alt=""
                width="16"
                height="16"
                loading="lazy"
                decoding="async"
                aria-hidden="true"
            >

            <div class="brew__beam" aria-hidden="true"></div>
            <div class="brew__potion" aria-hidden="true">
              <span class="brew__halo"></span>
              <img :src="potion" alt="" width="16" height="16" loading="lazy" decoding="async">
            </div>
            <div class="brew__flash" aria-hidden="true"></div>

            <div class="brew__result" aria-hidden="true">
              <span class="brew__result-kicker">{{ t('home.ascent.brew.resultKicker') }}</span>
              <span class="brew__result-name">{{ t('home.ascent.brew.resultName') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {useScene} from './useAscentScroll';
import cauldronBody from '@/assets/images/home-library/cauldron/cauldron-body.png';
import cauldronWell from '@/assets/images/home-library/cauldron/cauldron-well.png';
import cauldronSurface from '@/assets/images/home-library/cauldron/cauldron-surface.png';
import soulFire from '@/assets/images/home-library/cauldron/soul-fire.png';
import recipe from '@/assets/images/home-library/items/fool.png';
import mint from '@/assets/images/home-library/items/gold-mint-leaves.png';
import blood from '@/assets/images/home-library/items/lavos-squid-blood.png';
import crystal from '@/assets/images/home-library/items/stellar-aqua-crystal.png';
import potion from '@/assets/images/home-library/items/sequence-potion.png';
import magicCircle from '@/assets/images/home-library/items/magic-circle.png';

const {t} = useI18n();
const rootRef = ref<HTMLElement | null>(null);
const activeStep = ref(0);

/* Scroll beats (0..1): formula, three ingredients, the recipe last, brew, drink. */
const STEP_STARTS = [0, 0.14, 0.44, 0.78];
useScene(rootRef, 6200, p => {
  let step = 0;
  STEP_STARTS.forEach((start, index) => {
    if (p >= start) step = index;
  });
  if (step !== activeStep.value) activeStep.value = step;
});

const steps = computed(() => [1, 2, 3, 4].map(n => ({
  title: t(`home.ascent.brew.s${n}Title`),
  body: t(`home.ascent.brew.s${n}Body`),
})));

/* x is the slot centre in % of the scene; a/d are the throw's start and length. */
const items = computed(() => [
  {id: 'mint', src: mint, label: t('home.ascent.brew.itemMint'), x: 20, a: 0.14, d: 0.09},
  {id: 'blood', src: blood, label: t('home.ascent.brew.itemBlood'), x: 40, a: 0.24, d: 0.09},
  {id: 'crystal', src: crystal, label: t('home.ascent.brew.itemCrystal'), x: 60, a: 0.34, d: 0.09},
  {id: 'recipe', src: recipe, label: t('home.ascent.brew.itemRecipe'), x: 80, a: 0.44, d: 0.08},
].map((item, index) => ({
  ...item,
  vars: {'--x0': item.x, '--a': item.a, '--d': item.d, '--k': index},
})));
</script>

<style scoped>
.brew {
  --p: 0;
  position: relative;
  height: 150vh;
  background: linear-gradient(180deg, var(--a-stone) 0%, #101114 60%, var(--a-stone-2) 100%);
}

.brew__stage {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  height: 100vh;
  padding-top: var(--site-header-stack, 96px);
  overflow: hidden;
}

.brew__grid {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  gap: clamp(32px, 4vw, 72px);
  align-items: center;
}

.brew__title {
  margin-top: 14px;
  font-size: clamp(44px, 4.6vw, 84px);
}

.brew__lede {
  margin: 20px 0 0;
}

.brew__steps {
  display: grid;
  gap: 4px;
  margin: 30px 0 0;
  padding: 0;
  list-style: none;
  counter-reset: none;
}

.brew__step {
  position: relative;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 14px;
  padding: 12px 0 12px 16px;
  border-left: 2px solid var(--a-line);
  transition: border-color 0.3s ease, background-color 0.3s ease;
}

.brew__step-num {
  font-family: var(--a-mono);
  font-size: 12px;
  line-height: 22px;
  color: var(--a-ink-3);
}

.brew__step-text {
  display: grid;
  gap: 3px;
}

.brew__step strong {
  font-family: var(--a-head);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--a-ink-2);
  transition: color 0.3s ease;
}

.brew__step-text > span {
  font-size: 14px;
  line-height: 1.55;
  color: var(--a-ink-3);
  transition: color 0.3s ease;
}

.brew__step.is-done {
  border-left-color: rgba(73, 226, 255, 0.4);
}

.brew__step.is-active {
  border-left-color: var(--a-accent);
  background: linear-gradient(90deg, rgba(73, 226, 255, 0.08), transparent 80%);
}

.brew__step.is-active strong {
  color: var(--a-ink);
}

.brew__step.is-active .brew__step-text > span {
  color: var(--a-ink-2);
}

.brew__step.is-active .brew__step-num {
  color: var(--a-accent);
}

.brew__starter {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 10px;
  margin: 22px 0 0;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--a-ink-3);
}

.brew__starter i {
  color: var(--a-accent);
}

.brew__starter span {
  flex: 1 1 280px;
}

/* ================= the scene ================= */
.brew__scene-wrap {
  display: flex;
  justify-content: center;
}

.brew__scene {
  /* derived beats */
  --brew: clamp(0, calc((var(--p) - 0.52) / 0.16), 1);
  --beam: clamp(0, calc((var(--p) - 0.66) / 0.1), 1);
  --rise: clamp(0, calc((var(--p) - 0.7) / 0.14), 1);
  --drink: clamp(0, calc((var(--p) - 0.86) / 0.1), 1);
  position: relative;
  width: min(100%, calc(100vh - var(--site-header-stack, 96px) - 64px), 680px);
  aspect-ratio: 1;
  container-type: size;
}

.brew__numeral {
  position: absolute;
  inset: -6cqw -2cqw auto auto;
  font-family: var(--a-display);
  font-size: 118cqw;
  font-weight: 900;
  line-height: 0.82;
  letter-spacing: 0;
  color: transparent;
  -webkit-text-stroke: 1px rgba(226, 234, 242, 0.12);
  transform: translate3d(0, calc(var(--p) * -6cqw), 0);
  pointer-events: none;
}

.brew__floor {
  position: absolute;
  left: 4cqw;
  right: 4cqw;
  bottom: 2cqw;
  height: 30cqw;
  background: radial-gradient(ellipse 50% 50% at 50% 50%, rgba(73, 226, 255, calc(0.06 + 0.28 * var(--brew))), transparent 70%);
}

.brew__circle {
  position: absolute;
  left: 50%;
  bottom: 4cqw;
  width: 84cqw;
  height: 84cqw;
  margin-left: -42cqw;
  transform: scaleY(0.32);
  transform-origin: 50% 100%;
  opacity: calc(0.18 + 0.7 * var(--brew));
}

.brew__circle img {
  width: 100%;
  height: 100%;
  filter: grayscale(1) brightness(2.4) drop-shadow(0 0 6px rgba(73, 226, 255, 0.9));
  animation: ascent-spin 40s linear infinite;
}

@keyframes ascent-spin {
  to {
    transform: rotate(360deg);
  }
}

/* inventory slots along the top */
.brew__slots {
  position: absolute;
  inset: 0;
}

.brew__slot {
  --in: 1;
  --t: clamp(0, calc((var(--p) - var(--a)) / var(--d)), 1);
  position: absolute;
  top: 5cqw;
  left: calc(var(--x0) * 1cqw - 6cqw);
  width: 12cqw;
  height: 12cqw;
  border: 0.5cqw solid #1d1f23;
  background: #2c2f35;
  box-shadow: inset 0.6cqw 0.6cqw 0 #18191c, inset -0.6cqw -0.6cqw 0 #464a52;
  opacity: calc(var(--in) * (1 - 0.6 * var(--t)));
  transform: translate3d(0, calc((1 - var(--in)) * 3cqw), 0);
}

.brew__slot-label {
  position: absolute;
  top: calc(100% + 1.6cqw);
  left: 50%;
  width: 18cqw;
  font-family: var(--a-mono);
  font-size: clamp(9px, 1.6cqw, 11px);
  line-height: 1.35;
  letter-spacing: 0.04em;
  text-align: center;
  text-transform: uppercase;
  color: var(--a-ink-2);
  transform: translateX(-50%);
  opacity: calc(1 - var(--t));
}

.brew__item {
  --in: 1;
  --t: clamp(0, calc((var(--p) - var(--a)) / var(--d)), 1);
  position: absolute;
  top: 0;
  left: 0;
  width: 9cqw;
  height: 9cqw;
  image-rendering: pixelated;
  /* slot centre → cauldron mouth (50, 51) along an arc */
  transform:
      translate3d(
          calc((var(--x0) + (50 - var(--x0)) * var(--t)) * 1cqw - 4.5cqw),
          calc((11 + 40 * var(--t) - 46 * var(--t) * (1 - var(--t))) * 1cqw - 4.5cqw + (1 - var(--in)) * 3cqw),
          0)
      rotate(calc(var(--t) * 220deg))
      scale(calc(1 - 0.55 * var(--t)));
  opacity: min(var(--in), clamp(0, calc((1 - var(--t)) * 7), 1));
  filter: drop-shadow(0 0 1.4cqw rgba(73, 226, 255, calc(0.5 * var(--t))));
}

/* --- the Magic Cauldron, in pixel layers --- */
.cauldron {
  position: absolute;
  left: 22cqw;
  bottom: 12cqw;
  width: 56cqw;
  height: calc(56cqw * 336 / 320);
}

.cauldron__layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}

.cauldron__liquid {
  position: absolute;
  inset: 0;
  overflow: hidden;
  clip-path: polygon(50% 19.05%, 87.5% 36.9%, 50% 54.76%, 12.5% 36.9%);
  background: color-mix(in srgb, #7cefff calc(var(--brew) * 100%), #26332f);
}

.cauldron__surface {
  opacity: calc(0.7 - 0.45 * var(--brew));
  mix-blend-mode: luminosity;
}

.cauldron__ripple {
  --t: clamp(0, calc((var(--p) - var(--a)) / var(--d)), 1);
  --after: clamp(0, calc((var(--p) - var(--a) - var(--d)) / 0.05), 1);
  position: absolute;
  left: 50%;
  top: 36.9%;
  width: 40%;
  aspect-ratio: 2;
  border: 0.6cqw solid rgba(220, 250, 255, 0.85);
  border-radius: 50%;
  opacity: calc(clamp(0, calc((var(--t) - 0.86) * 8), 1) * (1 - var(--after)));
  transform: translate(-50%, -50%) scale(calc(0.3 + var(--after) * 1.2));
}

.cauldron__glow {
  position: absolute;
  inset: -10% -10% 34%;
  background: radial-gradient(ellipse 40% 34% at 50% 52%, rgba(124, 239, 255, 0.85), transparent 72%);
  mix-blend-mode: screen;
  opacity: calc(var(--brew) * 0.85);
}

.cauldron__fire {
  position: absolute;
  left: 30%;
  bottom: 1%;
  width: 40%;
  height: 16%;
  background-size: 100% 200%;
  background-repeat: no-repeat;
  image-rendering: pixelated;
  opacity: calc(0.45 + 0.55 * var(--brew));
  animation: ascent-fire 0.5s steps(1) infinite;
  filter: drop-shadow(0 0 2cqw rgba(73, 226, 255, 0.8));
}

@keyframes ascent-fire {
  0% {
    background-position: 0 0;
  }
  50% {
    background-position: 0 100%;
  }
}

.brew__bubbles {
  position: absolute;
  left: 34cqw;
  top: 44cqw;
  width: 32cqw;
  height: 14cqw;
  opacity: var(--brew);
}

.brew__bubbles i {
  position: absolute;
  bottom: 0;
  left: calc(var(--b-i) * 12%);
  width: 1.6cqw;
  height: 1.6cqw;
  background: #d8fbff;
  animation: ascent-bubble 1.8s ease-in infinite;
  animation-delay: calc(var(--b-i) * -0.27s);
}

@keyframes ascent-bubble {
  from {
    transform: translate3d(0, 0, 0);
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  to {
    transform: translate3d(0, -14cqw, 0);
    opacity: 0;
  }
}

.brew__beam {
  position: absolute;
  left: 42cqw;
  top: -10cqw;
  width: 16cqw;
  height: 62cqw;
  background: linear-gradient(0deg, rgba(160, 245, 255, 0.95), rgba(160, 245, 255, 0.32) 60%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 30%, #000 70%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 30%, #000 70%, transparent);
  transform-origin: 50% 100%;
  transform: scaleY(var(--beam));
  opacity: calc(var(--beam) * (1 - var(--drink)));
}

.brew__potion {
  position: absolute;
  left: 50cqw;
  top: 0;
  width: 14cqw;
  height: 14cqw;
  margin-left: -7cqw;
  transform:
      translate3d(0, calc((44 - 30 * var(--rise)) * 1cqw), 0)
      scale(calc(0.3 + 0.9 * var(--rise) + 0.6 * var(--drink)));
  opacity: calc(min(1, var(--rise) * 4) * (1 - var(--drink)));
}

.brew__potion img {
  position: relative;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  filter: drop-shadow(0 0 2cqw rgba(160, 245, 255, 0.9));
}

.brew__halo {
  position: absolute;
  inset: -60%;
  background: radial-gradient(circle, rgba(200, 250, 255, 0.55), transparent 62%);
}

.brew__flash {
  position: absolute;
  inset: -20%;
  background: radial-gradient(circle at 50% 36%, rgba(230, 252, 255, 0.95), rgba(73, 226, 255, 0.35) 30%, transparent 62%);
  opacity: calc(var(--drink) * (1.6 - var(--drink)));
  pointer-events: none;
}

.brew__result {
  position: absolute;
  left: 0;
  right: 0;
  top: 16cqw;
  display: grid;
  justify-items: center;
  gap: 1.4cqw;
  text-align: center;
  opacity: var(--drink);
  transform: translate3d(0, calc((1 - var(--drink)) * 4cqw), 0);
}

.brew__result-kicker {
  font-family: var(--a-mono);
  font-size: clamp(11px, 1.8cqw, 13px);
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--a-accent);
}

.brew__result-name {
  font-family: var(--a-display);
  font-size: clamp(44px, 12cqw, 90px);
  font-weight: 800;
  letter-spacing: 0;
  color: #fff;
  text-shadow: 0 0 4cqw rgba(73, 226, 255, 0.8);
}

/* ================= flat layout ================= */
@media (max-width: 899px), (prefers-reduced-motion: reduce) {
  .brew {
    height: auto;
  }

  .brew__stage {
    position: relative;
    height: auto;
    padding: clamp(72px, 12vh, 120px) 0;
  }
}

@media (max-width: 899px) {
  .brew__grid {
    grid-template-columns: 1fr;
  }

  .brew__scene-wrap {
    order: -1;
  }

  .brew__scene {
    width: min(100%, 520px);
  }
}

@media (min-width: 900px) and (max-width: 1099px) {
  .brew__step-text > span {
    font-size: 13px;
  }
}

@media (max-height: 820px) and (min-width: 900px) {
  .brew__lede {
    font-size: 16px;
  }

  .brew__steps {
    margin-top: 18px;
  }

  .brew__step {
    padding-block: 8px;
  }

  .brew__starter {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .brew__circle img,
  .cauldron__fire,
  .brew__bubbles i {
    animation: none;
  }
}
</style>
