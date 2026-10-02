<template>
  <section id="sequence-8" ref="rootRef" class="act" aria-labelledby="ascent-act-title">
    <div class="act__numerals" aria-hidden="true">
      <span>8</span><span>7</span>
    </div>

    <div class="a-shell">
      <header class="act__head a-split">
        <div>
          <p class="a-eyebrow" data-rv><span class="a-seq">8</span><span class="a-seq">7</span>{{ t('home.ascent.act.eyebrow') }}</p>
          <h2 id="ascent-act-title" class="a-h2 act__title" data-rv>{{ t('home.ascent.act.title') }}</h2>
        </div>
        <p class="a-lede act__lede" data-rv>{{ t('home.ascent.act.lede') }}</p>
      </header>

      <div class="act__grid">
        <!-- Digestion: no single source can fill it -->
        <div ref="meterRef" class="act__card act__digest" data-rv>
          <div class="act__card-head">
            <p class="act__card-kicker">{{ t('home.ascent.act.meterKicker') }}</p>
            <p class="act__card-title">{{ t('home.ascent.act.meterTitle') }}</p>
          </div>

          <div class="digest" aria-hidden="true">
            <span
                v-for="(source, index) in sources"
                :key="source.key"
                class="digest__seg"
                :style="{'--w': source.share, '--k': index, '--c': source.color}"
            ></span>
          </div>
          <div class="digest__readout" aria-hidden="true">
            <span class="digest__pct"><b>{{ digestPct }}</b>%</span>
            <span :class="['digest__done', {'is-on': digestPct >= 100}]">
              <i class="fa-solid fa-check" aria-hidden="true"></i>{{ t('home.ascent.act.meterDone') }}
            </span>
          </div>

          <ul class="digest__legend">
            <li v-for="source in sources" :key="source.key" :style="{'--c': source.color}">
              <span class="digest__swatch" aria-hidden="true"></span>{{ source.label }}
            </li>
          </ul>
          <p class="act__note">{{ t('home.ascent.act.meterNote') }}</p>
        </div>

        <!-- The ritual, or the Madness -->
        <div :class="['act__card', 'act__ritual', {'is-mad': skipped}]" data-rv>
          <div class="act__card-head">
            <p class="act__card-kicker">{{ t('home.ascent.act.ritualKicker') }}</p>
            <p class="act__card-title">{{ t('home.ascent.act.ritualTitle') }}</p>
          </div>

          <div class="ritual">
            <div class="ritual__circle" aria-hidden="true">
              <img :src="magicCircle" alt="" width="256" height="256" loading="lazy" decoding="async">
            </div>
            <div class="ritual__body">
              <p class="ritual__text">{{ t('home.ascent.act.ritualBody') }}</p>
              <div class="ritual__choice" role="group" :aria-label="t('home.ascent.act.choiceLabel')">
                <button type="button" :aria-pressed="!skipped" :class="{'is-on': !skipped}" @click="skipped = false">
                  {{ t('home.ascent.act.choicePerform') }}
                </button>
                <button type="button" :aria-pressed="skipped" :class="{'is-on': skipped}" @click="skipped = true">
                  {{ t('home.ascent.act.choiceSkip') }}
                </button>
              </div>
            </div>
          </div>

          <div class="madness">
            <div class="madness__row">
              <span class="madness__label">{{ t('home.ascent.act.madnessLabel') }}</span>
              <span class="madness__state" aria-live="polite">
                {{ skipped ? t('home.ascent.act.madnessHigh') : t('home.ascent.act.madnessCalm') }}
              </span>
            </div>
            <div class="madness__bar" aria-hidden="true"><span></span></div>
            <p class="madness__text">{{ skipped ? t('home.ascent.act.madnessSkip') : t('home.ascent.act.madnessBody') }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {useReveals, useScrollProgress} from './useAscentScroll';
import magicCircle from '@/assets/images/home-library/items/magic-circle.png';

const {t} = useI18n();
const rootRef = ref<HTMLElement | null>(null);
const meterRef = ref<HTMLElement | null>(null);
const skipped = ref(false);
const digestPct = ref(0);

useReveals(rootRef);
/* The meter fills as it travels up the viewport. */
useScrollProgress(meterRef, 'through', p => {
  const next = Math.round(Math.min(1, Math.max(0, (p - 0.2) / 0.45)) * 100);
  if (next !== digestPct.value) digestPct.value = next;
});

const sources = computed(() => [
  {key: 'role', label: t('home.ascent.act.srcRole'), share: 0.34, color: '#49e2ff'},
  {key: 'bottles', label: t('home.ascent.act.srcBottles'), share: 0.18, color: '#8ff0ff'},
  {key: 'bounties', label: t('home.ascent.act.srcBounties'), share: 0.16, color: '#c3f7ff'},
  {key: 'dungeons', label: t('home.ascent.act.srcDungeons'), share: 0.18, color: '#a8b8c8'},
  {key: 'incursions', label: t('home.ascent.act.srcIncursions'), share: 0.14, color: '#e8eef4'},
]);
</script>

<style scoped>
.act {
  position: relative;
  padding: clamp(64px, 8vh, 96px) 0 clamp(64px, 8vh, 90px);
  overflow: hidden;
  background:
      radial-gradient(ellipse 50% 40% at 80% 10%, rgba(73, 226, 255, 0.05), transparent 70%),
      linear-gradient(180deg, var(--a-stone-2) 0%, #15171b 100%);
}

.act__numerals {
  position: absolute;
  top: 4vh;
  right: calc(var(--spine-space) + 2vw);
  display: flex;
  font-family: var(--a-display);
  font-size: min(52vw, 74vh);
  font-weight: 900;
  line-height: 0.8;
  letter-spacing: 0;
  color: transparent;
  pointer-events: none;
  user-select: none;
}

.act__numerals span {
  background: linear-gradient(180deg, rgba(226, 234, 242, 0.12), rgba(226, 234, 242, 0) 70%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-stroke: 1.5px rgba(226, 234, 242, 0.16);
}

.act__numerals span + span {
  margin-left: -0.08em;
  -webkit-text-stroke-color: rgba(73, 226, 255, 0.3);
  transform: translateY(-0.12em);
}

.act__head {
  position: relative;
}

.act__title {
  margin-top: 14px;
}

.act__lede {
  margin: 0;
}

.act__grid {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px;
  margin-top: clamp(32px, 5vh, 48px);
}

.act__card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: clamp(22px, 2.4vw, 32px);
  border: 1px solid var(--a-line);
  background: linear-gradient(170deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.01));
}

.act__card-kicker {
  margin: 0;
  font-family: var(--a-mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--a-accent);
}

.act__card-title {
  margin: 10px 0 0;
  font-family: var(--a-head);
  font-size: clamp(20px, 1.7vw, 25px);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--a-ink);
}

/* ---- digestion meter ---- */
.digest {
  display: flex;
  gap: 4px;
  height: 56px;
  margin-top: 24px;
  padding: 6px;
  border: 1px solid var(--a-line-strong);
  background: #0c0d0f;
}

.digest__seg {
  --fill: clamp(0, calc((var(--p, 0) - 0.2) / 0.45 * 5 - var(--k)), 1);
  position: relative;
  flex: var(--w) 1 0;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
}

.digest__seg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--c);
  box-shadow: 0 0 18px var(--c);
  transform-origin: 0 50%;
  transform: scaleX(var(--fill));
}

.digest__readout {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
}

.digest__pct {
  white-space: nowrap;
  font-family: var(--a-display);
  font-size: clamp(64px, 6.4vw, 120px);
  line-height: 0.9;
  font-weight: 800;
  letter-spacing: 0;
  color: var(--a-ink);
  font-variant-numeric: tabular-nums;
}

.digest__pct b {
  display: inline-block;
  min-width: 2.2ch;
  text-align: right;
  font-weight: 800;
}

.digest__done {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--a-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--a-accent);
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.digest__done.is-on {
  opacity: 1;
  transform: none;
}

.digest__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
  font-size: 14px;
  color: var(--a-ink-2);
}

.digest__legend li {
  display: flex;
  align-items: center;
  gap: 8px;
}

.digest__swatch {
  width: 10px;
  height: 10px;
  background: var(--c);
}

.act__note {
  margin: auto 0 0;
  padding-top: 16px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--a-ink-3);
}

/* ---- ritual & madness ---- */
.ritual {
  display: grid;
  grid-template-columns: 116px minmax(0, 1fr);
  gap: 24px;
  align-items: center;
  margin-top: 20px;
}

.ritual__circle {
  position: relative;
  width: 116px;
  aspect-ratio: 1;
}

.ritual__circle img {
  width: 100%;
  height: 100%;
  filter: grayscale(1) brightness(2.2) drop-shadow(0 0 8px rgba(73, 226, 255, 0.85));
  animation: ascent-spin 30s linear infinite;
  transition: filter 0.6s ease;
}

.ritual__text {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--a-ink-2);
}

.ritual__choice {
  display: inline-flex;
  margin-top: 18px;
  border: 1px solid var(--a-line-strong);
}

.ritual__choice button {
  min-height: 44px;
  padding: 0 16px;
  border: 0;
  background: transparent;
  color: var(--a-ink-2);
  font-family: var(--a-mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 0.25s ease, color 0.25s ease;
}

.ritual__choice button + button {
  border-left: 1px solid var(--a-line-strong);
}

.ritual__choice button.is-on {
  background: var(--a-ink);
  color: var(--a-ground);
}

.is-mad .ritual__choice button.is-on {
  background: var(--a-warn);
  color: #1a0505;
}

.ritual__choice button:focus-visible {
  outline: 2px solid var(--a-accent);
  outline-offset: 2px;
}

.madness {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--a-line);
}

.madness__row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-family: var(--a-mono);
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.madness__label {
  color: var(--a-ink-3);
}

.madness__state {
  color: var(--a-ink);
}

.is-mad .madness__state {
  color: var(--a-warn);
}

.madness__bar {
  position: relative;
  height: 8px;
  margin-top: 12px;
  background: rgba(255, 255, 255, 0.06);
}

.madness__bar span {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #8a96a6, var(--a-warn));
  transform-origin: 0 50%;
  transform: scaleX(0.14);
  transition: transform 0.9s cubic-bezier(0.2, 0.7, 0.1, 1);
}

.is-mad .madness__bar span {
  transform: scaleX(0.82);
}

.madness__text {
  min-height: 3.2em;
  margin: 14px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--a-ink-2);
}

/* Madness bleeds into the card: a chromatic tremor on the circle and title */
.act__ritual::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 70% 60% at 30% 40%, rgba(255, 93, 93, 0.12), transparent 70%);
  opacity: 0;
  transition: opacity 0.6s ease;
  pointer-events: none;
}

.act__ritual.is-mad::after {
  opacity: 1;
}

.is-mad .ritual__circle img {
  filter: grayscale(1) brightness(1.8) drop-shadow(2px 0 0 rgba(255, 70, 90, 0.9)) drop-shadow(-2px 0 0 rgba(73, 226, 255, 0.9));
  animation: ascent-spin 30s linear infinite, ascent-tremor 0.24s steps(2) infinite;
}

.is-mad .act__card-title {
  text-shadow: 2px 0 rgba(255, 70, 90, 0.55), -2px 0 rgba(73, 226, 255, 0.55);
}

@keyframes ascent-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes ascent-tremor {
  50% {
    translate: 1.5px -1px;
  }
}

@media (max-width: 899px) {
  .act__grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .digest {
    height: 48px;
    margin-top: 24px;
  }

  .digest__pct {
    font-size: 52px;
  }

  .digest__readout {
    flex-wrap: wrap;
  }

  .digest__legend {
    margin-top: 18px;
    font-size: 13px;
  }

  .act__note {
    padding-top: 16px;
  }

  .ritual {
    margin-top: 20px;
  }

  .madness {
    margin-top: 22px;
  }

  .act__numerals {
    top: 2vh;
    right: -4vw;
    font-size: 62vw;
  }
}

@media (max-width: 480px) {
  .ritual {
    grid-template-columns: 1fr;
  }

  .ritual__circle {
    width: 104px;
  }

  .ritual__choice {
    display: flex;
  }

  .ritual__choice button {
    flex: 1;
    padding: 0 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ritual__circle img,
  .is-mad .ritual__circle img {
    animation: none;
  }

  .madness__bar span,
  .digest__done {
    transition: none;
  }
}
</style>
