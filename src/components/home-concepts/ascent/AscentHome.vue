<template>
  <div ref="rootRef" class="concept-ascent">
    <HeaderItem overlay show-announcement/>
    <AscentSpine :climbed="climbed" :current="current" :light="light" :visible="spineVisible"/>
    <AscentAtmosphere :state="air"/>

    <main id="main-content" ref="mainRef" class="ascent-main">
      <AscentHero :latest="latest"/>
      <AscentPathways/>
      <AscentBrew/>
      <AscentActing/>
      <AscentRifts/>
      <AscentCrimson/>
      <AscentDominion/>
      <AscentSummit :high-seats="highSeats"/>
      <AscentJoin :latest="latest" :beyonders="totalBeyonders"/>
      <AscentCompanion/>
    </main>

    <FooterItem variant="full"/>
  </div>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, ref, watch} from 'vue';
import HeaderItem from '@/components/layout/HeaderItem.vue';
import FooterItem from '@/components/layout/FooterItem.vue';
import {useI18n} from '@/composables/useI18n';
import {useBeyonderStats} from '@/composables/useBeyonderStats';
import {newsAPI} from '@/utils/api/news';
import {useConceptFonts} from '../useConceptFonts';
import AscentSpine from './AscentSpine.vue';
import AscentAtmosphere from './AscentAtmosphere.vue';
import AscentHero from './AscentHero.vue';
import AscentPathways from './AscentPathways.vue';
import AscentBrew from './AscentBrew.vue';
import AscentActing from './AscentActing.vue';
import AscentRifts from './AscentRifts.vue';
import AscentCrimson from './AscentCrimson.vue';
import AscentDominion from './AscentDominion.vue';
import AscentSummit from './AscentSummit.vue';
import AscentJoin from './AscentJoin.vue';
import AscentCompanion from './AscentCompanion.vue';
import {trackElement} from './useAscentScroll';
import {ASCENT_STAGES} from './stages';

useConceptFonts('https://fonts.googleapis.com/css2?family=Alumni+Sans:wght@500;600;700;800;900&family=Golos+Text:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

const {locale, currentLanguage} = useI18n();
const {totalBeyonders, highSeats} = useBeyonderStats();

/* ---------------- latest update ---------------- */
const latest = ref<{ title: string; slug: string } | null>(null);

async function loadNews() {
  try {
    const response = await newsAPI.getLatest(locale.value.articleLocale);
    const first = Array.isArray(response.data) ? response.data[0] : null;
    latest.value = first ? {title: first.title, slug: first.slug} : null;
  } catch {
    latest.value = null;
  }
}

onMounted(loadNews);
watch(currentLanguage, loadNews);

/* ---------------- altitude: where on the ladder the reader is ---------------- */
const rootRef = ref<HTMLElement | null>(null);
const mainRef = ref<HTMLElement | null>(null);
const climbed = ref(-1);
const current = ref<number | null>(null);
const light = ref(false);
const spineVisible = ref(false);
/* Read every frame by the particle canvas; deliberately not reactive. */
const air = {alt: -1};

const progress = ASCENT_STAGES.map(() => 0);
let mainDone = 0;
const stops: Array<() => void> = [];

function update() {
  let index = 0;
  for (let i = 0; i < progress.length; i++) {
    if (progress[i] > 0) index = i;
  }
  const stage = ASCENT_STAGES[index];
  const alt = stage.from + (stage.to - stage.from) * progress[index];
  air.alt = alt;
  rootRef.value?.style.setProperty('--alt', alt.toFixed(3));

  const nextClimbed = Math.floor(alt);
  if (nextClimbed !== climbed.value) climbed.value = nextClimbed;

  const nextCurrent = alt < -0.25 ? null : alt < 0 ? 9 : Math.max(0, Math.min(9, 8 - Math.floor(alt)));
  if (nextCurrent !== current.value) current.value = nextCurrent;

  const nextLight = !!stage.light && (stage.id !== 'sequence-0' || progress[index] > 0.12);
  if (nextLight !== light.value) light.value = nextLight;

  const mainBottom = mainRef.value?.getBoundingClientRect().bottom ?? Infinity;
  const nextVisible = mainDone < 1 && mainBottom > window.innerHeight * 0.8;
  if (nextVisible !== spineVisible.value) spineVisible.value = nextVisible;
}

onMounted(() => {
  ASCENT_STAGES.forEach((stage, index) => {
    const el = document.getElementById(stage.id);
    if (!el) return;
    stops.push(trackElement(el, 'center', p => {
      progress[index] = p;
      update();
    }));
  });
  if (mainRef.value) {
    stops.push(trackElement(mainRef.value, 'center', p => {
      mainDone = p;
      update();
    }));
  }
});

onUnmounted(() => stops.forEach(stop => stop()));
</script>

<style>
/* ======================================================================
   The Ascent — tokens. Stone and ash at the bottom, searing white at the
   summit, one electric "soul-fire" accent the whole way up.
   ====================================================================== */
.concept-ascent {
  --a-ground: #090a0c;
  --a-stone: #0f1013;
  --a-stone-2: #131518;
  --a-ink: #f2f3f5;
  --a-ink-2: #b9bec6;
  --a-ink-3: #8d939c;
  --a-line: rgba(242, 243, 245, 0.1);
  --a-line-strong: rgba(242, 243, 245, 0.22);
  --a-accent: #49e2ff;
  --a-on-accent: #021216;
  --a-warn: #ff6b6b;
  --a-ok: #5eeaa0;
  /* summit (light) palette */
  --l-ink: #0b0c0e;
  --l-muted: #474d56;
  --l-accent: #006b80;

  /* tall, condensed, heavy display for the climb; a plain grotesk to read by */
  --a-display: 'Alumni Sans', 'Arial Narrow', 'Roboto Condensed', sans-serif;
  --a-head: 'Golos Text', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --a-body: 'Golos Text', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --a-mono: 'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace;

  --gutter: clamp(20px, 5vw, 80px);
  --spine-space: 0px;

  position: relative;
  min-height: 100vh;
  background: var(--a-ground);
  color: var(--a-ink);
  font-family: var(--a-body);
  -webkit-font-smoothing: antialiased;
}

@media (min-width: 1100px) {
  .concept-ascent {
    --spine-space: 96px;
  }
}

/* Re-theme the shared header, footer and the teleported mobile nav. */
.concept-ascent,
body:has(.concept-ascent) {
  --myst-bg: #0a0b0d;
  --myst-bg-2: #16181c;
  --myst-bg-deep: #0a0b0d;
  --myst-ink: #f2f3f5;
  --myst-ink-muted: #b9bec6;
  --myst-ink-strong: #ffffff;
  --myst-gold: #49e2ff;
  --myst-gold-soft: #8ff0ff;
  --myst-offwhite: #f2f3f5;
  --myst-on-gold: #021216;
  --myst-panel: linear-gradient(160deg, rgba(22, 24, 28, 0.6), rgba(10, 11, 13, 0.85));
  --myst-panel-strong: linear-gradient(165deg, rgba(22, 24, 28, 0.9), rgba(10, 11, 13, 0.96));
  --myst-panel-warm: var(--myst-panel);
  --myst-line-10: rgba(242, 243, 245, 0.08);
  --myst-line-12: rgba(242, 243, 245, 0.1);
  --myst-line-14: rgba(242, 243, 245, 0.11);
  --myst-line-16: rgba(242, 243, 245, 0.13);
  --myst-line-18: rgba(242, 243, 245, 0.14);
  --myst-line-20: rgba(242, 243, 245, 0.16);
  --myst-line-28: rgba(242, 243, 245, 0.22);
  --myst-line-35: rgba(242, 243, 245, 0.28);
  --myst-line-40: rgba(242, 243, 245, 0.32);
  --myst-line-55: rgba(242, 243, 245, 0.45);
  --myst-wash: rgba(73, 226, 255, 0.06);
  --myst-wash-strong: rgba(73, 226, 255, 0.12);
  --myst-font-display: 'Golos Text', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --myst-font-mono: 'IBM Plex Mono', ui-monospace, Menlo, monospace;
  --myst-font-body: 'Golos Text', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}

body:has(.concept-ascent) {
  background: #090a0c;
  font-family: var(--myst-font-body);
}

.concept-ascent .header-stack .season-bar {
  background: linear-gradient(90deg, rgba(73, 226, 255, 0), rgba(73, 226, 255, 0.1), rgba(73, 226, 255, 0));
}

.concept-ascent .header-stack .brand-name {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.concept-ascent .header-stack .nav-link {
  font-size: 11px;
  letter-spacing: 0.12em;
}

body:has(.concept-ascent) .mobile-nav-link:hover,
body:has(.concept-ascent) .mobile-nav-link.active,
body:has(.concept-ascent) .mobile-service-link:hover {
  background: rgba(73, 226, 255, 0.06);
}

.concept-ascent .ascent-main {
  position: relative;
  overflow-x: clip;
}

/* ---------------- shared building blocks ---------------- */
.concept-ascent .a-shell {
  box-sizing: border-box;
  width: min(1360px, 100% - var(--gutter) * 2);
  margin-inline: auto;
  padding-right: var(--spine-space);
}

.concept-ascent .sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

.concept-ascent .a-eyebrow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  margin: 0;
  font-family: var(--a-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--a-ink-2);
}

.concept-ascent .a-eyebrow--ink {
  color: var(--l-muted);
}

.concept-ascent .a-seq {
  display: inline-grid;
  place-items: center;
  min-width: 30px;
  height: 30px;
  padding: 0 6px;
  border: 1px solid var(--a-accent);
  font-family: var(--a-display);
  font-size: 21px;
  font-weight: 800;
  letter-spacing: 0;
  color: var(--a-accent);
  box-shadow: 0 0 18px rgba(73, 226, 255, 0.25), inset 0 0 10px rgba(73, 226, 255, 0.12);
}

.concept-ascent .a-seq + .a-seq {
  margin-left: -8px;
}

.concept-ascent .a-seq--red {
  border-color: #ff7a7a;
  color: #ff9a9a;
  box-shadow: 0 0 18px rgba(255, 90, 90, 0.3);
}

.concept-ascent .a-seq--ink {
  border-color: var(--l-ink);
  color: var(--l-ink);
  box-shadow: none;
}

.concept-ascent .a-h2 {
  margin: 0;
  font-family: var(--a-display);
  font-size: clamp(46px, 6.4vw, 112px);
  font-weight: 800;
  line-height: 0.9;
  text-transform: uppercase;
  letter-spacing: 0;
  color: var(--a-ink);
  text-wrap: balance;
}

.concept-ascent .a-h2.a-h2--ink {
  color: var(--l-ink);
}

.concept-ascent .a-h2--xl {
  font-size: clamp(56px, 8.6vw, 156px);
  line-height: 0.88;
}

.concept-ascent .a-split {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 24px clamp(32px, 5vw, 80px);
  align-items: end;
}

@media (max-width: 899px) {
  .concept-ascent .a-split {
    grid-template-columns: 1fr;
  }
}

.concept-ascent .a-lede {
  font-size: clamp(16px, 1.2vw, 19px);
  line-height: 1.65;
  color: var(--a-ink-2);
}

.concept-ascent .a-btn {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-height: 54px;
  padding: 0 26px;
  border: 1px solid transparent;
  font-family: var(--a-head);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}

.concept-ascent .a-btn i {
  font-size: 12px;
  transition: transform 0.25s ease;
}

.concept-ascent .a-btn:hover i {
  transform: translateX(4px);
}

.concept-ascent .a-btn--primary {
  background: var(--a-accent);
  color: var(--a-on-accent);
  box-shadow: 0 0 0 0 rgba(73, 226, 255, 0.4), 0 10px 40px rgba(73, 226, 255, 0.25);
}

.concept-ascent .a-btn--primary:hover {
  background: #8ff0ff;
  box-shadow: 0 0 0 6px rgba(73, 226, 255, 0.14), 0 10px 50px rgba(73, 226, 255, 0.35);
}

.concept-ascent .a-btn--ink {
  background: var(--l-ink);
  color: #fff;
}

.concept-ascent .a-btn--ink:hover {
  background: #23262b;
}

.concept-ascent .a-btn--outline-ink {
  border-color: rgba(11, 12, 14, 0.3);
  background: transparent;
  color: var(--l-ink);
}

.concept-ascent .a-btn--outline-ink:hover {
  border-color: var(--l-ink);
}

.concept-ascent .a-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--a-mono);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--a-accent);
  text-decoration: none;
}

.concept-ascent .a-link i {
  font-size: 11px;
  transition: transform 0.25s ease;
}

.concept-ascent .a-link:hover i {
  transform: translateX(4px);
}

.concept-ascent .a-link:hover {
  text-decoration: underline;
  text-underline-offset: 5px;
}

.concept-ascent a:focus-visible,
.concept-ascent button:focus-visible {
  outline: 2px solid var(--a-accent);
  outline-offset: 3px;
}

.concept-ascent .join a:focus-visible,
.concept-ascent .join button:focus-visible,
.concept-ascent .summit a:focus-visible,
.concept-ascent .comp a:focus-visible {
  outline-color: var(--l-accent);
}

/* reveal on entry (JS adds .rv-ready to the section, then .is-in per element) */
.concept-ascent .rv-ready [data-rv] {
  opacity: 0;
  transform: translate3d(0, 34px, 0);
  transition: opacity 0.9s ease, transform 1.1s cubic-bezier(0.2, 0.7, 0.1, 1);
}

.concept-ascent .rv-ready [data-rv].is-in {
  opacity: 1;
  transform: none;
}

.concept-ascent .rv-ready .paths__field[data-rv] {
  opacity: 1;
  transform: none;
}

/* Phones: a shorter climb - tighter chapter spacing everywhere */
@media (max-width: 599px) {
  .concept-ascent .act,
  .concept-ascent .join,
  .concept-ascent .comp {
    padding-top: 72px !important;
    padding-bottom: 76px !important;
  }

  .concept-ascent .paths {
    padding-top: 64px !important;
  }

  .concept-ascent .a-split {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 24px clamp(32px, 5vw, 80px);
  align-items: end;
}

@media (max-width: 899px) {
  .concept-ascent .a-split {
    grid-template-columns: 1fr;
  }
}

.concept-ascent .a-lede {
    font-size: 16px;
    line-height: 1.6;
  }
}

@media (prefers-reduced-motion: reduce) {
  .concept-ascent .rv-ready [data-rv] {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
