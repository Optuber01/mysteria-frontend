<template>
  <div class="concept-arcana" :style="themeStyle">
    <!-- The drawn card's sigil, watching over the whole page (none until the visitor draws) -->
    <div class="arc-ambient" aria-hidden="true">
      <!-- The re-theme happens here: two fixed layers crossfade (opacity only), the rest of the page just switches colour. -->
      <Transition name="arc-wash">
        <span :key="themeKey" class="arc-ambient__wash" :style="{'--wash': card.accent}"></span>
      </Transition>
      <Transition name="arc-sigil">
        <img v-if="hasDrawn" :key="card.id" :src="sigilNative(card.id)" alt="" class="arc-ambient__sigil" width="512" height="512" decoding="async">
      </Transition>
      <span class="arc-ambient__grain" :style="{backgroundImage: `url(${grain})`}"></span>
    </div>

    <HeaderItem overlay show-announcement/>

    <main id="main-content" class="arc-main">
      <ArcanaHero/>
      <ProgressionStory/>
      <ArcanaOrbit/>
      <WorldChapter/>
      <ArcanaFuture/>
      <SectionCompanion/>
    </main>

    <FooterItem variant="full"/>
    <ArcanaDeckControl/>
    <DailyBonusCat page="home"/>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, watch} from 'vue';
import HeaderItem from '@/components/layout/HeaderItem.vue';
import FooterItem from '@/components/layout/FooterItem.vue';
import DailyBonusCat from '@/components/ui/DailyBonusCat.vue';
import {useConceptFonts} from './useConceptFonts';
import ArcanaHero from './ArcanaHero.vue';
import ProgressionStory from './progression/ProgressionStory.vue';
import ArcanaOrbit from './ArcanaOrbit.vue';
import WorldChapter from './WorldChapter.vue';
import ArcanaFuture from './ArcanaFuture.vue';
import SectionCompanion from './SectionCompanion.vue';
import ArcanaDeckControl from './ArcanaDeckControl.vue';
import {sigilNative} from './arcana-data';
import {ensurePathwayData, useArcana} from './useArcana';
import grain from './assets/grain.png';

useConceptFonts('https://fonts.googleapis.com/css2?family=Commissioner:wght,FLAR@400..800,0..100&family=Golos+Text:wght@400..700&family=IBM+Plex+Mono:wght@400;500&family=Tenor+Sans&display=swap');

const {card, hasDrawn} = useArcana();
/** Undrawn, the page wears the neutral accent; the first draw crossfades into the card's. */
const themeKey = computed(() => (hasDrawn.value ? card.value.id : 'undrawn'));

const themeStyle = computed(() => ({'--acc': card.value.accent}));

/* The header's mobile drawer is teleported to <body>, so the accent rides there too. */
watch(() => card.value.accent, accent => document.body.style.setProperty('--acc', accent), {immediate: true});

/*
 * Chapters well outside the viewport get [data-offscreen], which pauses every CSS
 * animation inside them (see the style block): drifting fog, spinning halos and
 * pulses then cost nothing while the visitor reads another chapter.
 */
let offscreenObserver: IntersectionObserver | null = null;

onMounted(() => {
  // The pathway data is ~1.3 MB: fetch it once the first screen has settled.
  const idle = (window as Window & {requestIdleCallback?: (cb: () => void, opts?: {timeout: number}) => number}).requestIdleCallback;
  if (idle) idle(() => void ensurePathwayData(), {timeout: 1500});
  else setTimeout(() => void ensurePathwayData(), 600);

  offscreenObserver = new IntersectionObserver(entries => {
    for (const entry of entries) entry.target.toggleAttribute('data-offscreen', !entry.isIntersecting);
  }, {rootMargin: '200px 0px'});
  document.querySelectorAll('.concept-arcana > .arc-main > *').forEach(section => offscreenObserver?.observe(section));
});

onUnmounted(() => {
  offscreenObserver?.disconnect();
  document.body.style.removeProperty('--acc');
});
</script>

<style>
/*
 * Registered as a colour so color-mix() and transitions on the properties that read it
 * interpolate. The accent itself is NOT transitioned page-wide (that repainted every
 * element each frame for over a second): it switches at once, the ambient wash and sigil
 * crossfade, and a few key elements (labels, solid buttons, head cards) ease their own
 * colour properties.
 */
@property --acc {
  syntax: '<color>';
  inherits: true;
  /* NEUTRAL_ACCENT in arcana-data.ts: the page before the visitor draws */
  initial-value: #e45a64;
}

.concept-arcana,
body:has(.concept-arcana) {
  --arc-bg: #0b0b0e;
  --arc-surface: #15151b;
  --arc-line: rgba(255, 255, 255, .09);
  --arc-ink: #efeef3;
  --arc-muted: #a7a6b2;
  --arc-on-acc: #0b0b0e;
  /* flared grotesk display, wide inscriptional caps for card labels, plain mono for the address */
  --arc-display: 'Commissioner', 'Segoe UI', system-ui, sans-serif;
  --arc-body: 'Golos Text', 'Segoe UI', system-ui, sans-serif;
  --arc-caps: 'Tenor Sans', 'Segoe UI', system-ui, sans-serif;
  --arc-mono: 'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace;

  /* one rhythm for every chapter: gutters, section padding, block gaps, radii, type */
  --arc-gutter: clamp(18px, 4vw, 64px);
  --arc-section-pad: clamp(64px, 7vw, 112px);
  --arc-block-gap: clamp(64px, 7vw, 112px);
  --arc-radius: 14px;
  --arc-radius-lg: 18px;
  --arc-fs-display: clamp(36px, 4.8vw, 68px);
  --arc-fs-h2: clamp(28px, 3vw, 42px);
  --arc-fs-h3: clamp(24px, 2.3vw, 34px);
  --arc-fs-lede: clamp(16px, 1.15vw, 18px);
  --arc-fs-body: clamp(15px, 1.05vw, 16.5px);

  /* upstream tokens, re-pointed at this concept (header, footer, chips, drawer) */
  --myst-bg: #0b0b0e;
  --myst-bg-2: #15151b;
  --myst-bg-deep: #0b0b0e;
  --myst-ink: #efeef3;
  --myst-ink-muted: #a7a6b2;
  --myst-ink-strong: #ffffff;
  --myst-offwhite: #efeef3;
  --myst-gold: var(--acc);
  --myst-gold-soft: var(--acc);
  --myst-on-gold: #0b0b0e;
  --myst-line-10: rgba(255, 255, 255, .07);
  --myst-line-12: rgba(255, 255, 255, .08);
  --myst-line-14: rgba(255, 255, 255, .09);
  --myst-line-16: rgba(255, 255, 255, .1);
  --myst-line-18: rgba(255, 255, 255, .11);
  --myst-line-20: rgba(255, 255, 255, .12);
  --myst-line-28: color-mix(in srgb, var(--acc) 30%, transparent);
  --myst-line-35: color-mix(in srgb, var(--acc) 38%, transparent);
  --myst-line-40: color-mix(in srgb, var(--acc) 44%, transparent);
  --myst-line-55: color-mix(in srgb, var(--acc) 58%, transparent);
  --myst-wash: color-mix(in srgb, var(--acc) 8%, transparent);
  --myst-wash-strong: color-mix(in srgb, var(--acc) 15%, transparent);
  --myst-panel: linear-gradient(160deg, rgba(22, 22, 28, .7), rgba(11, 11, 14, .9));
  --myst-panel-strong: linear-gradient(165deg, rgba(24, 24, 30, .9), rgba(11, 11, 14, .96));
  --myst-font-display: var(--arc-display);
  --myst-font-body: var(--arc-body);
  --myst-font-mono: var(--arc-caps);
}

body:has(.concept-arcana) {
  background-color: #0b0b0e;
}

.concept-arcana {
  position: relative;
  min-height: 100vh;
  background: var(--arc-bg);
  color: var(--arc-ink);
  font-family: var(--arc-body);
  font-synthesis: none;
}

/* From 1280px the reading's spread (ArcanaDeckControl) sits in the right gutter:
   keep every chapter's content clear of it. */
@media (min-width: 1280px) {
  .concept-arcana {
    --arc-gutter: 64px;
  }
}

.concept-arcana ::selection {
  background: var(--acc);
  color: var(--arc-on-acc);
}

/* header details that upstream hard-codes in gold */
.concept-arcana .header-stack .brand-mark {
  filter: grayscale(1) brightness(1.35) drop-shadow(0 0 8px color-mix(in srgb, var(--acc) 55%, transparent));
}

.concept-arcana .header-stack .season-bar {
  background-image: linear-gradient(90deg, transparent, color-mix(in srgb, var(--acc) 16%, transparent), transparent);
}

/* the language code: upstream sets it in a mono face the page doesn't use */
.concept-arcana .header-stack .lang-label,
.concept-arcana .header-stack .lang-option-short {
  font-family: var(--arc-caps);
}

.concept-arcana .header-stack .brand-name {
  font-weight: 600;
  font-size: 17px;
  letter-spacing: .02em;
}

/* ---------- ambient layer ---------- */
.arc-ambient {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  /* One composited layer, painted once: the wash, the sigil and the grain are flattened
     into it (only a crossfade lifts a piece onto its own layer, while it runs). */
  contain: strict;
  transform: translateZ(0);
}

.arc-ambient__sigil {
  position: absolute;
  right: -14vmax;
  top: 50%;
  width: 78vmax;
  height: 78vmax;
  margin-top: -39vmax;
  opacity: .055;
  filter: saturate(.6);
}

.arc-ambient__wash {
  position: absolute;
  inset: 0;
  opacity: .5;
  background:
    radial-gradient(60vmax 50vmax at 100% 50%, color-mix(in oklab, var(--wash) 9%, transparent), transparent 70%),
    radial-gradient(50vmax 40vmax at 0% 100%, color-mix(in oklab, var(--wash) 6%, transparent), transparent 70%);
}

.arc-wash-enter-active,
.arc-wash-leave-active {
  transition: opacity 1.1s cubic-bezier(.4, 0, .2, 1);
}

.arc-wash-enter-from,
.arc-wash-leave-to {
  opacity: 0;
}

.arc-ambient__grain {
  position: absolute;
  inset: 0;
  opacity: .05;
  background-size: 160px 160px;
}

.arc-sigil-enter-active,
.arc-sigil-leave-active {
  transition: opacity 1.2s ease, transform 1.4s cubic-bezier(.2, .8, .2, 1);
}

.arc-sigil-enter-from {
  opacity: 0;
  transform: rotate(-25deg) scale(.9);
}

.arc-sigil-leave-to {
  opacity: 0;
  transform: rotate(25deg) scale(1.08);
}

.arc-main {
  position: relative;
  z-index: 1;
}

/* A chapter far from the viewport (set by ArcanaHome's observer): its loops hold still. */
.concept-arcana [data-offscreen] *,
.concept-arcana [data-offscreen] *::before,
.concept-arcana [data-offscreen] *::after {
  animation-play-state: paused !important;
}

.concept-arcana > footer,
.concept-arcana > .site-footer {
  position: relative;
  z-index: 1;
}

/* ---------- shared building blocks ---------- */
.concept-arcana .arc-shell {
  width: 100%;
  max-width: 1320px;
  margin: 0 auto;
}

.concept-arcana .arc-section {
  position: relative;
  padding: var(--arc-section-pad) var(--arc-gutter);
  scroll-margin-top: var(--site-header-stack, 106px);
}

.concept-arcana .arc-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.concept-arcana .arc-label {
  margin: 0;
  font-family: var(--arc-caps);
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--acc);
  transition: color .6s ease;
}

.concept-arcana .arc-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 7px 14px 7px 12px;
  border-radius: 99px;
  background: color-mix(in oklab, var(--acc) 12%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--acc) 30%, transparent);
  font-family: var(--arc-caps);
  font-size: 11px;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--arc-ink);
}

.concept-arcana .arc-eyebrow__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--acc);
  box-shadow: 0 0 10px var(--acc);
}

.concept-arcana .arc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 50px;
  padding: 0 22px;
  border: 0;
  border-radius: 12px;
  font-family: var(--arc-body);
  font-size: 15.5px;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  text-decoration: none;
  transition: transform .3s cubic-bezier(.2, .8, .2, 1), filter .2s, background-color .6s ease, box-shadow .6s ease;
}

.concept-arcana .arc-btn--solid {
  background: var(--acc);
  color: var(--arc-on-acc);
  box-shadow: 0 10px 30px color-mix(in oklab, var(--acc) 30%, transparent);
}

.concept-arcana .arc-btn--solid:hover {
  color: var(--arc-on-acc);
  filter: brightness(1.08);
  transform: translateY(-2px);
}

.concept-arcana .arc-btn--ghost {
  background: rgba(255, 255, 255, .04);
  color: var(--arc-ink);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--acc) 45%, transparent);
}

.concept-arcana .arc-btn--ghost:hover {
  color: var(--arc-ink);
  background: color-mix(in oklab, var(--acc) 14%, transparent);
  transform: translateY(-2px);
}

.concept-arcana .arc-btn:disabled {
  opacity: .6;
  cursor: progress;
  transform: none;
}

.concept-arcana .arc-btn:focus-visible,
.concept-arcana .arc-ip:focus-visible,
.concept-arcana a:focus-visible {
  outline: 3px solid var(--arc-ink);
  outline-offset: 3px;
}

.concept-arcana .arc-btn__icon {
  width: 18px;
  height: 18px;
}

.concept-arcana .arc-ip {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 8px 8px 8px 14px;
  border: 0;
  border-radius: 12px;
  background: rgba(255, 255, 255, .04);
  box-shadow: inset 0 0 0 1px var(--arc-line);
  color: var(--arc-ink);
  font: inherit;
  cursor: pointer;
  transition: box-shadow .2s;
}

.concept-arcana .arc-ip:hover {
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--acc) 60%, transparent);
}

.concept-arcana .arc-ip__label {
  font-family: var(--arc-caps);
  font-size: 10px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--arc-muted);
}

.concept-arcana .arc-ip__address {
  font-family: var(--arc-mono);
  font-size: 14px;
  font-weight: 500;
  user-select: all;
}

.concept-arcana .arc-ip__hint {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 10px;
  border-radius: 8px;
  background: color-mix(in oklab, var(--acc) 16%, transparent);
  color: var(--arc-ink);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.concept-arcana .arc-ip.is-copied .arc-ip__hint {
  background: #4ade80;
  color: #06210f;
}

.concept-arcana .arc-ip.is-failed .arc-ip__hint {
  background: #f87171;
  color: #2a0606;
}

.concept-arcana .arc-ip--big {
  width: 100%;
  justify-content: space-between;
  padding: 10px 10px 10px 18px;
}

.concept-arcana .arc-ip--big .arc-ip__address {
  font-size: clamp(16px, 1.6vw, 20px);
}

.concept-arcana .arc-status {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  margin: 0;
  font-size: 14px;
  color: var(--arc-muted);
}

.concept-arcana .arc-status__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--arc-muted);
}

.concept-arcana .arc-status.is-online .arc-status__dot {
  background: #4ade80;
  box-shadow: 0 0 10px #4ade80;
}

.concept-arcana .arc-status.is-offline .arc-status__dot {
  background: #f87171;
}

@keyframes arc-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes arc-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 520px) {
  .concept-arcana .arc-btn {
    width: 100%;
  }

  .concept-arcana .arc-ip {
    flex-wrap: wrap;
  }
}

@media (prefers-reduced-motion: reduce) {
  .concept-arcana *,
  .concept-arcana *::before,
  .concept-arcana *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
  }

  .arc-sigil-enter-active,
  .arc-sigil-leave-active,
  .arc-wash-enter-active,
  .arc-wash-leave-active {
    transition: opacity .3s ease;
  }

  .arc-sigil-enter-from,
  .arc-sigil-leave-to {
    transform: none;
  }
}
</style>
