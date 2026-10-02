<template>
  <section class="bc-progress bc-light" aria-labelledby="bc-progress-title">
    <div class="bc-shell">
      <header class="progress-head">
        <div v-reveal class="progress-intro">
          <p class="bc-label">{{ t('home.broadcast.progress.label') }}</p>
          <h2 id="bc-progress-title" class="bc-h2">{{ t('home.broadcast.progress.title') }}</h2>
          <p class="bc-lede">{{ t('home.broadcast.progress.lede') }}</p>
        </div>
        <figure v-reveal="140" class="ingame">
          <img :src="cauldronInterface" :alt="t('home.broadcast.progress.interfaceAlt')" width="636" height="284" loading="lazy" decoding="async">
          <figcaption>{{ t('home.broadcast.progress.interfaceCaption') }}</figcaption>
        </figure>
      </header>

      <div ref="stripRef" :class="['strip', {'is-static': reduced}]">
        <div class="strip-line" aria-hidden="true"><i></i></div>
        <ol class="steps">
          <li
              v-for="(step, index) in steps"
              :key="step"
              :class="['step', `step-${step}`, {lit: index < lit}]"
          >
            <div class="step-art" aria-hidden="true">
              <template v-if="step === 'recipe'">
                <img :src="recipe" class="px px-lg" alt="" width="16" height="16" loading="lazy">
              </template>
              <template v-else-if="step === 'gather'">
                <img :src="mint" class="px px-sm gather-a" alt="" width="16" height="16" loading="lazy">
                <img :src="blood" class="px px-sm gather-b" alt="" width="16" height="16" loading="lazy">
                <img :src="crystal" class="px px-sm gather-c" alt="" width="16" height="16" loading="lazy">
              </template>
              <template v-else-if="step === 'brew'">
                <span class="cauldron">
                  <img :src="cauldronBody" alt="" width="320" height="336" loading="lazy">
                  <img :src="cauldronWell" alt="" width="320" height="336" loading="lazy">
                  <span class="brew-liquid" :style="{maskImage: `url(${cauldronSurface})`, WebkitMaskImage: `url(${cauldronSurface})`}"></span>
                  <span class="bubble b1"></span><span class="bubble b2"></span><span class="bubble b3"></span>
                </span>
                <span class="fires">
                  <img v-for="n in 3" :key="n" :src="soulFire" alt="" width="24" height="24" class="px fire" loading="lazy">
                </span>
              </template>
              <template v-else-if="step === 'drink'">
                <img :src="potion" class="px px-lg potion" alt="" width="16" height="16" loading="lazy">
              </template>
              <template v-else-if="step === 'act'">
                <span class="meter">
                  <span class="meter-label">{{ t('home.broadcast.progress.meter') }}</span>
                  <span class="meter-track"><i></i></span>
                  <span class="meter-ticks"><b>+12</b><b>+8</b><b>+20</b></span>
                </span>
              </template>
              <template v-else>
                <img :src="circle" class="px ritual" alt="" width="256" height="256" loading="lazy">
              </template>
            </div>
            <span class="step-num">{{ String(index + 1).padStart(2, '0') }}</span>
            <h3 class="step-title">{{ t(`home.broadcast.progress.steps.${step}.title`) }}</h3>
            <p class="step-body">{{ t(`home.broadcast.progress.steps.${step}.body`) }}</p>
          </li>
        </ol>
      </div>

      <div v-reveal class="ladder">
        <div class="ladder-head">
          <h3 class="ladder-title">{{ t('home.broadcast.progress.ladderTitle') }}</h3>
          <p class="ladder-note">{{ t('home.broadcast.progress.ladderNote') }}</p>
        </div>
        <ol class="ladder-track">
          <li v-for="rung in rungs" :key="rung.n" :class="['rung', rung.kind]">
            <span class="rung-n">{{ rung.n }}</span>
            <span class="rung-tag">{{ t(`home.broadcast.progress.rungs.${rung.key}`) }}</span>
          </li>
        </ol>
        <div class="ladder-foot">
        <p class="madness">
          <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
          <span><strong>{{ t('home.broadcast.progress.madnessTitle') }}</strong> {{ t('home.broadcast.progress.madnessBody') }}</span>
        </p>
        <RouterLink :to="$lp('/guide/progression')" class="bc-btn bc-btn-ghost ladder-cta">
          {{ t('home.broadcast.progress.cta') }} <span class="bc-arrow" aria-hidden="true">→</span>
        </RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, ref} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {prefersReducedMotion, vReveal} from './broadcast';
import recipe from '@/assets/images/home-library/items/fool.png';
import mint from '@/assets/images/home-library/items/gold-mint-leaves.png';
import blood from '@/assets/images/home-library/items/lavos-squid-blood.png';
import crystal from '@/assets/images/home-library/items/stellar-aqua-crystal.png';
import potion from '@/assets/images/home-library/items/sequence-potion.png';
import circle from '@/assets/images/home-library/items/magic-circle.png';
import cauldronBody from '@/assets/images/home-library/cauldron/cauldron-body.png';
import cauldronWell from '@/assets/images/home-library/cauldron/cauldron-well.png';
import cauldronSurface from '@/assets/images/home-library/cauldron/cauldron-surface.png';
import soulFire from '@/assets/images/home-library/cauldron/soul-fire.png';
import cauldronInterface from '@/assets/images/home-library/cauldron-interface.png';

const {t} = useI18n();

const steps = ['recipe', 'gather', 'brew', 'drink', 'act', 'ritual'] as const;

const rungs = [
  {n: 9, key: 's9', kind: 'start'},
  {n: 8, key: 's8', kind: 'optional'},
  {n: 7, key: 's7', kind: 'optional'},
  {n: 6, key: 's6', kind: 'optional'},
  {n: 5, key: 's5', kind: 'mandatory'},
  {n: 4, key: 's4', kind: 'divine'},
  {n: 3, key: 's3', kind: 'divine'},
  {n: 2, key: 's2', kind: 'divine'},
  {n: 1, key: 's1', kind: 'divine'},
  {n: 0, key: 's0', kind: 'god'},
];

/* Scroll-linked: the line draws across the strip and lights each step as it passes. */
const stripRef = ref<HTMLElement | null>(null);
const lit = ref(0);
const reduced = ref(false);
let frame: number | null = null;

const update = () => {
  frame = null;
  const el = stripRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const progress = Math.min(1, Math.max(0, (vh * 0.9 - rect.top) / (vh * 0.55)));
  el.style.setProperty('--line', progress.toFixed(4));
  lit.value = Math.min(steps.length, Math.floor(progress * steps.length + 0.35));
};
const onScroll = () => {
  if (frame === null) frame = requestAnimationFrame(update);
};

onMounted(() => {
  reduced.value = prefersReducedMotion();
  if (reduced.value) {
    lit.value = steps.length;
    return;
  }
  update();
  window.addEventListener('scroll', onScroll, {passive: true});
  window.addEventListener('resize', onScroll, {passive: true});
});

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', onScroll);
  if (frame !== null) cancelAnimationFrame(frame);
});
</script>

<style scoped>
.bc-progress {
  padding: clamp(60px, 6.5vw, 96px) 0;
}

.progress-head {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  gap: 32px 64px;
  align-items: end;
  margin-bottom: clamp(40px, 5vw, 68px);
}

.progress-intro .bc-h2 {
  margin: 18px 0 22px;
}

.ingame {
  justify-self: end;
  width: 100%;
  max-width: 420px;
  margin: 0;
  padding: 14px;
  border-radius: 16px;
  background: var(--bc-night);
  color: var(--bc-snow);
  box-shadow: 0 30px 60px -30px rgba(10, 11, 16, 0.6);
}

.ingame img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 8px;
  image-rendering: pixelated;
}

.ingame figcaption {
  margin-top: 10px;
  font-family: var(--bc-font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--bc-mute);
}

/* ── Step strip ── */
.strip {
  --line: 0;
  position: relative;
}

.strip.is-static {
  --line: 1;
}

.strip-line {
  position: absolute;
  top: 62px;
  left: calc(100% / 12);
  right: calc(100% / 12);
  height: 2px;
  background: var(--bc-line-ink);
}

.strip-line i {
  display: block;
  height: 100%;
  background: var(--bc-blue);
  transform-origin: left;
  transform: scaleX(var(--line));
}

.steps {
  position: relative;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: clamp(14px, 1.6vw, 24px);
  margin: 0;
  padding: 0;
  list-style: none;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.step-art {
  position: relative;
  display: grid;
  place-items: center;
  width: 124px;
  height: 124px;
  margin-bottom: 18px;
  border-radius: 50%;
  background: var(--bc-paper);
  box-shadow: inset 0 0 0 2px var(--bc-line-ink);
  transition: box-shadow .5s ease, background-color .5s ease, transform .6s var(--bc-ease);
}

.step.lit .step-art {
  background: #fff;
  box-shadow: inset 0 0 0 2px var(--bc-blue), 0 18px 40px -18px rgba(49, 80, 245, 0.55);
  transform: translateY(-4px);
}

.px {
  image-rendering: pixelated;
}

.px-lg {
  width: 72px;
  height: 72px;
}

.px-sm {
  position: absolute;
  width: 44px;
  height: 44px;
}

.gather-a { transform: translate(-30px, -16px) rotate(-8deg); }
.gather-b { transform: translate(28px, -12px) rotate(6deg); }
.gather-c { transform: translate(0, 22px); }

.step.lit .gather-a { animation: bob 3s ease-in-out infinite; }
.step.lit .gather-b { animation: bob 3s ease-in-out .4s infinite; }
.step.lit .gather-c { animation: bob 3s ease-in-out .8s infinite; }

@keyframes bob {
  0%, 100% { translate: 0 0; }
  50% { translate: 0 -5px; }
}

.cauldron {
  position: relative;
  width: 76px;
  height: 80px;
  margin-top: -12px;
}

.cauldron img,
.brew-liquid {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}

.brew-liquid {
  mask-size: 100% 100%;
  -webkit-mask-size: 100% 100%;
  background: linear-gradient(120deg, #6a4dff, #3fb6ff, #a24dff, #6a4dff);
  background-size: 300% 100%;
  animation: brew 6s linear infinite;
}

@keyframes brew {
  to { background-position: 300% 0; }
}

.bubble {
  position: absolute;
  left: 50%;
  top: 26%;
  width: 6px;
  height: 6px;
  background: #b9c6ff;
  opacity: 0;
}

.step.lit .bubble { animation: bubble 2.4s ease-in infinite; }
.b1 { margin-left: -14px; }
.b2 { margin-left: 4px; animation-delay: .8s !important; }
.b3 { margin-left: 14px; animation-delay: 1.6s !important; }

@keyframes bubble {
  0% { transform: translateY(0); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translateY(-34px); opacity: 0; }
}

.fires {
  position: absolute;
  bottom: 16px;
  display: flex;
  gap: 2px;
}

.fire {
  width: 22px;
  height: 22px;
}

.potion {
  transform-origin: 50% 80%;
}

.step.lit .potion {
  animation: tilt 3.4s ease-in-out infinite;
}

@keyframes tilt {
  0%, 100% { transform: rotate(0); }
  40% { transform: rotate(-14deg); }
  60% { transform: rotate(-14deg); }
}

.meter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 92px;
}

.meter-label {
  font-family: var(--bc-font-mono);
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--bc-ink-2);
}

.meter-track {
  width: 100%;
  height: 10px;
  border-radius: 5px;
  background: var(--bc-paper-2);
  overflow: hidden;
}

.meter-track i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--bc-blue), #7d93ff);
  transform-origin: left;
  transform: scaleX(0.15);
  transition: transform 1.6s var(--bc-ease);
}

.step.lit .meter-track i {
  transform: scaleX(0.78);
}

.meter-ticks {
  display: flex;
  gap: 6px;
  font-family: var(--bc-font-mono);
  font-size: 10px;
  color: var(--bc-blue-ink);
}

.ritual {
  width: 100px;
  height: 100px;
  filter: hue-rotate(195deg) saturate(1.8) brightness(0.8);
}

.step.lit .ritual {
  animation: spin 24s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.step-num {
  font-family: var(--bc-font-mono);
  font-size: 12px;
  color: var(--bc-ink-2);
  transition: color .4s ease;
}

.step.lit .step-num {
  color: var(--bc-blue-ink);
}

.step-title {
  margin: 8px 0 10px;
  font-family: var(--bc-font-display);
  font-size: clamp(16px, 1.25vw, 19px);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.step-body {
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
  color: var(--bc-ink-2);
}

/* ── Sequence ladder ── */
.ladder {
  margin-top: clamp(40px, 5vw, 72px);
  padding: clamp(22px, 2.6vw, 34px);
  border-radius: 20px;
  background: var(--bc-night);
  color: var(--bc-snow);
}

.ladder-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 32px;
  margin-bottom: 24px;
}

.ladder-title {
  margin: 0;
  font-family: var(--bc-font-display);
  font-size: clamp(20px, 1.8vw, 26px);
  font-weight: 600;
  letter-spacing: -0.02em;
}

.ladder-note {
  margin: 0;
  font-size: 15px;
  color: var(--bc-mute);
}

.ladder-track {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.rung {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  padding: 14px 10px 16px;
  border-radius: 8px;
  background: var(--bc-night-3);
}

.rung-n {
  font-family: var(--bc-font-display);
  font-size: clamp(22px, 2.4vw, 36px);
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.03em;
}

.rung-tag {
  font-size: 12px;
  line-height: 1.35;
  color: var(--bc-mute);
}

.rung.start {
  background: var(--bc-blue);
}

.rung.start .rung-tag {
  color: #e6eaff;
}

.rung.optional {
  background: color-mix(in srgb, var(--bc-blue) 28%, var(--bc-night-3));
}

.rung.mandatory {
  background: color-mix(in srgb, var(--bc-blue) 16%, var(--bc-night-3));
  box-shadow: inset 0 0 0 1px var(--bc-blue-hi);
}

.rung.god {
  background: #fff;
  color: var(--bc-ink);
}

.rung.god .rung-tag {
  color: var(--bc-ink-2);
}

.madness {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin: 24px 0 0;
  font-size: 15px;
  line-height: 1.55;
  color: #c9ccd8;
}

.madness i {
  margin-top: 4px;
  color: var(--bc-alert);
}

.madness strong {
  color: #fff;
}

.ladder-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px 32px;
  margin-top: 24px;
}

.ladder-foot .madness {
  margin: 0;
  max-width: 760px;
}

.bc-progress .ladder .bc-btn-ghost {
  border-color: var(--bc-line-strong);
  color: var(--bc-snow);
}

.bc-progress .ladder .bc-btn-ghost:hover {
  border-color: var(--bc-snow);
}

@media (max-width: 1100px) {
  .steps {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    row-gap: 48px;
  }

  .strip-line {
    display: none;
  }

  .ladder-track {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .progress-head {
    grid-template-columns: 1fr;
  }

}

@media (max-width: 560px) {
  .steps {
    grid-template-columns: 1fr;
    row-gap: 28px;
  }

  .step {
    display: grid;
    grid-template-columns: 96px 1fr;
    grid-template-rows: auto auto auto;
    column-gap: 18px;
    align-items: start;
    text-align: left;
  }

  .step-art {
    grid-row: 1 / span 3;
    width: 96px;
    height: 96px;
    margin: 0;
  }

  .step-art > * {
    scale: 0.72;
  }

  .step-title {
    margin: 2px 0 6px;
  }

  .ladder-track {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .rung {
    flex-direction: row;
    align-items: center;
  }

  .rung-n {
    width: 32px;
    flex: none;
  }
}
</style>
