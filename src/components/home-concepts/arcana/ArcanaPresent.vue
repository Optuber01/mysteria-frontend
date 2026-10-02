<template>
  <section id="present" ref="sectionRef" class="arc-section arc-present" :class="{'is-dealt': dealt}" aria-labelledby="arc-present-title">
    <div class="arc-shell">
      <ArcanaSectionHead numeral="II" :position="t('home.arcana.present.position')" title-id="arc-present-title">
        <template #title>{{ t('home.arcana.present.titleA') }} <em>{{ t('home.arcana.present.titleB') }}</em></template>
        {{ lede }}
      </ArcanaSectionHead>

      <!-- The loop, as a spread of six cards -->
      <ol class="arc-loop">
        <li v-for="(step, index) in steps" :key="step.key" class="arc-loop__card" :style="{'--i': index}">
          <span class="arc-loop__num">{{ step.numeral }}</span>
          <span class="arc-loop__art" :class="`is-${step.key}`" aria-hidden="true">
            <template v-if="step.key === 'formula'">
              <img :src="items.recipe" alt="" class="arc-pixel arc-pixel--big" width="16" height="16" loading="lazy">
            </template>
            <template v-else-if="step.key === 'ingredients'">
              <img :src="items.mint" alt="" class="arc-pixel" width="16" height="16" loading="lazy">
              <img :src="items.blood" alt="" class="arc-pixel" width="16" height="16" loading="lazy">
              <img :src="items.crystal" alt="" class="arc-pixel" width="16" height="16" loading="lazy">
            </template>
            <template v-else-if="step.key === 'cauldron'">
              <span class="arc-loop__cauldron"><ArcanaCauldron/></span>
            </template>
            <template v-else-if="step.key === 'drink'">
              <img :src="items.potion" alt="" class="arc-pixel arc-pixel--big" width="16" height="16" loading="lazy">
            </template>
            <template v-else-if="step.key === 'act'">
              <svg viewBox="0 0 100 100" class="arc-loop__ring">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="6" opacity=".18"/>
                <circle class="arc-loop__ring-fill" cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" pathLength="100"/>
              </svg>
              <svg class="arc-loop__mask" viewBox="0 0 32 32" fill="currentColor">
                <path d="M4 6c4 1.6 8 1.6 12 0v9c0 5-2.7 8.5-6 8.5S4 20 4 15z"/>
                <path d="M16.5 10.5c3.8 1.4 7.6 1.4 11.5 0v8.5c0 4.8-2.6 8-5.75 8s-5.75-3.2-5.75-8z" opacity=".55"/>
                <circle cx="7.4" cy="12" r="1.3" fill="#111116"/><circle cx="12.6" cy="12" r="1.3" fill="#111116"/>
                <path d="M7 17.5c1.8 1.6 4.2 1.6 6 0" stroke="#111116" stroke-width="1.3" fill="none" stroke-linecap="round"/>
              </svg>
            </template>
            <template v-else>
              <span class="arc-loop__circle" :style="{'--circle': `url(${items.circle})`}"></span>
            </template>
          </span>
          <h3 class="arc-loop__title">{{ step.title }}</h3>
          <p class="arc-loop__body">{{ step.body }}</p>
        </li>
      </ol>

      <div class="arc-present__row">
        <!-- the real cauldron interface -->
        <figure class="arc-present__gui">
          <div class="arc-present__gui-frame">
            <img :src="cauldronGui" :alt="t('home.arcana.present.guiAlt')" width="636" height="284" loading="lazy" decoding="async">
          </div>
          <figcaption>
            <p class="arc-label">{{ t('home.arcana.present.guiLabel') }}</p>
            <p>{{ t('home.arcana.present.guiBody') }}</p>
          </figcaption>
        </figure>

        <!-- the risk: a reversed card -->
        <div class="arc-madness">
          <div class="arc-madness__card" aria-hidden="true">
            <span class="arc-madness__inner">
              <span class="arc-madness__eye"></span>
              <span class="arc-madness__word">{{ t('home.arcana.present.madnessWord') }}</span>
            </span>
          </div>
          <div class="arc-madness__copy">
            <p class="arc-label arc-madness__label">{{ t('home.arcana.present.madnessLabel') }}</p>
            <h3>{{ t('home.arcana.present.madnessTitle') }}</h3>
            <p>{{ t('home.arcana.present.madnessBody') }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue';
import {useI18n} from '@/composables/useI18n';
import ArcanaSectionHead from './ArcanaSectionHead.vue';
import ArcanaCauldron from './ArcanaCauldron.vue';
import {useArcana} from './useArcana';
import recipe from '@/assets/images/home-library/items/fool.png';
import mint from '@/assets/images/home-library/items/gold-mint-leaves.png';
import blood from '@/assets/images/home-library/items/lavos-squid-blood.png';
import crystal from '@/assets/images/home-library/items/stellar-aqua-crystal.png';
import potion from '@/assets/images/home-library/items/sequence-potion.png';
import circle from '@/assets/images/home-library/items/magic-circle.png';
import cauldronGui from '@/assets/images/home-library/cauldron-interface.png';

const {t} = useI18n();
const {reading} = useArcana();
const items = {recipe, mint, blood, crystal, potion, circle};

const role = computed(() => reading.value.seq9 || reading.value.name);
const lede = computed(() => t('home.arcana.present.lede').replace('{role}', role.value));

const steps = computed(() => [
  {key: 'formula', numeral: 'I'},
  {key: 'ingredients', numeral: 'II'},
  {key: 'cauldron', numeral: 'III'},
  {key: 'drink', numeral: 'IV'},
  {key: 'act', numeral: 'V'},
  {key: 'ritual', numeral: 'VI'},
].map(step => ({
  ...step,
  title: t(`home.arcana.present.steps.${step.key}.title`),
  body: t(`home.arcana.present.steps.${step.key}.body`).replace('{role}', role.value),
})));

/* Deal the spread the first time it scrolls in. */
const sectionRef = ref<HTMLElement | null>(null);
const dealt = ref(false);
let observer: IntersectionObserver | null = null;
onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    dealt.value = true;
    return;
  }
  observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    dealt.value = true;
    observer?.disconnect();
  }, {threshold: 0.15, rootMargin: '0px 0px -15% 0px'});
  const target = sectionRef.value?.querySelector('.arc-loop');
  if (target) observer.observe(target);
});
onUnmounted(() => observer?.disconnect());
</script>

<style scoped>
.arc-loop {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: clamp(10px, 1.2vw, 18px);
  perspective: 1400px;
}

.arc-loop__card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 300px;
  padding: 18px 16px 20px;
  border-radius: 14px;
  background:
    radial-gradient(90% 46% at 50% 30%, color-mix(in oklab, var(--acc) 14%, transparent), transparent 72%),
    linear-gradient(170deg, #1b1b22, #111116);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--acc) 26%, transparent), 0 18px 40px rgba(0, 0, 0, .35);
  transition: transform .5s cubic-bezier(.2, .8, .2, 1), box-shadow .3s;
}

/* deal-in: from a pile on the left, one after another */
.arc-loop__card {
  opacity: 0;
  transform: translate3d(calc(var(--i) * -40%), 40px, 0) rotate(calc(-10deg + var(--i) * 3deg));
}

.is-dealt .arc-loop__card {
  opacity: 1;
  transform: none;
  transition:
    transform .8s cubic-bezier(.16, .84, .24, 1) calc(var(--i) * 90ms),
    opacity .4s ease calc(var(--i) * 90ms),
    box-shadow .3s;
}

.is-dealt .arc-loop__card:hover {
  transform: translateY(-8px) rotate(-1deg);
  transition-delay: 0s;
  box-shadow: inset 0 0 0 1px var(--acc), 0 26px 50px rgba(0, 0, 0, .45);
}

/* the connecting thread between cards */
.arc-loop__card:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 50%;
  right: calc(clamp(10px, 1.2vw, 18px) * -1);
  width: clamp(10px, 1.2vw, 18px);
  height: 2px;
  background: var(--acc);
  opacity: .6;
}

.arc-loop__num {
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: 14px;
  color: var(--acc);
}

.arc-loop__art {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 104px;
  margin: 6px 0 12px;
}

.arc-pixel {
  width: 40px;
  height: 40px;
  image-rendering: pixelated;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, .6));
}

.arc-pixel--big {
  width: 80px;
  height: 80px;
}

.is-ingredients .arc-pixel:nth-child(2) {
  transform: translateY(-16px);
  width: 52px;
  height: 52px;
}

.is-drink .arc-pixel {
  filter: drop-shadow(0 0 22px color-mix(in oklab, var(--acc) 70%, transparent));
}

.arc-loop__cauldron {
  width: 116px;
}

.arc-loop__ring {
  width: 100px;
  height: 100px;
  color: var(--acc);
  transform: rotate(-90deg);
}

.arc-loop__ring-fill {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  transition: stroke-dashoffset 2.2s cubic-bezier(.4, 0, .2, 1) .9s;
}

.is-dealt .arc-loop__ring-fill {
  stroke-dashoffset: 0;
}

.arc-loop__mask {
  position: absolute;
  width: 40px;
  height: 40px;
  color: var(--arc-ink);
}

.arc-loop__circle {
  width: 104px;
  height: 104px;
  background: var(--acc);
  -webkit-mask: var(--circle) center / contain no-repeat;
  mask: var(--circle) center / contain no-repeat;
  filter: drop-shadow(0 0 12px color-mix(in oklab, var(--acc) 60%, transparent));
  animation: arc-spin 40s linear infinite;
}

.arc-loop__title {
  margin: 0 0 8px;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: 15px;
  line-height: 1.25;
  color: var(--arc-ink);
}

.arc-loop__body {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: var(--arc-muted);
}

/* ---- second row ---- */
.arc-present__row {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: clamp(16px, 2vw, 28px);
  margin-top: clamp(20px, 3vw, 36px);
}

.arc-present__gui {
  margin: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 22px;
  align-items: center;
  padding: 22px;
  border-radius: 14px;
  border: 1px solid var(--arc-line);
  background: var(--arc-surface);
}

.arc-present__gui-frame {
  padding: 10px;
  border-radius: 8px;
  background: #0a0a0c;
  box-shadow: inset 0 0 0 1px var(--arc-line);
}

.arc-present__gui img {
  display: block;
  width: 100%;
  height: auto;
  image-rendering: pixelated;
}

.arc-present__gui figcaption p:not(.arc-label) {
  margin: 0;
  color: var(--arc-muted);
  font-size: 15px;
  line-height: 1.6;
}

.arc-present__gui figcaption .arc-label {
  margin-bottom: 8px;
}

/* ---- Madness, reversed ---- */
.arc-madness {
  --mad: #ff4a4a;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 22px;
  align-items: center;
  padding: 22px;
  border-radius: 14px;
  border: 1px solid rgba(255, 74, 74, .3);
  background:
    radial-gradient(60% 80% at 0% 50%, rgba(255, 50, 50, .14), transparent 70%),
    var(--arc-surface);
}

.arc-madness__card {
  width: 104px;
  aspect-ratio: 1 / 1.62;
  border-radius: 8px;
  transform: rotate(180deg);
  background:
    repeating-linear-gradient(45deg, rgba(255, 74, 74, .1) 0 2px, transparent 2px 7px),
    linear-gradient(170deg, #2a1215, #120809);
  box-shadow: inset 0 0 0 1.5px var(--mad), 0 14px 34px rgba(0, 0, 0, .5), 0 0 40px rgba(255, 60, 60, .25);
  animation: arc-unease 5s ease-in-out infinite;
}

@keyframes arc-unease {
  0%, 86%, 100% { transform: rotate(180deg); }
  88% { transform: rotate(177deg) translateX(2px); }
  90% { transform: rotate(183deg) translateX(-2px); }
  92% { transform: rotate(179deg); }
}

.arc-madness__inner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.arc-madness__card {
  position: relative;
}

.arc-madness__eye {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 2px solid var(--mad);
  background: radial-gradient(circle, var(--mad) 0 7px, transparent 8px);
}

.arc-madness__word {
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--mad);
}

.arc-madness .arc-madness__label {
  color: #ff8a8a;
}

.arc-madness__copy h3 {
  margin: 6px 0 8px;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: 20px;
  color: var(--arc-ink);
}

.arc-madness__copy p:last-child {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--arc-muted);
}

@media (max-width: 1200px) {
  .arc-loop {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .arc-loop__card:nth-child(3)::after {
    display: none;
  }

  .arc-loop__card {
    min-height: 0;
  }

  .arc-present__row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .arc-loop {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .arc-loop__card::after {
    display: none;
  }

  .arc-loop__art {
    height: 96px;
  }

  .arc-present__gui {
    grid-template-columns: 1fr;
  }

  .arc-madness {
    grid-template-columns: 1fr;
    justify-items: start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .arc-loop__card,
  .is-dealt .arc-loop__card {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .arc-loop__ring-fill {
    transition: none;
  }

  .arc-loop__circle,
  .arc-madness__card {
    animation: none;
  }
}
</style>
