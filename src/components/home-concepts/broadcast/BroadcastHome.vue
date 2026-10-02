<template>
  <div class="concept-broadcast">
    <HeaderItem overlay show-announcement/>
    <main id="main-content" class="bc-main">
      <BroadcastHero/>
      <BroadcastFeatures/>
      <BroadcastPathways/>
      <BroadcastProgression/>
      <BroadcastWorld/>
      <BroadcastLive/>
      <BroadcastCompanion/>
      <BroadcastJoin/>
    </main>
    <FooterItem variant="full"/>
    <DailyBonusCat page="home"/>
  </div>
</template>

<script setup lang="ts">
import {onMounted} from 'vue';
import HeaderItem from '@/components/layout/HeaderItem.vue';
import FooterItem from '@/components/layout/FooterItem.vue';
import DailyBonusCat from '@/components/ui/DailyBonusCat.vue';
import {useConceptFonts} from '../useConceptFonts';
import {usePathwayData, whenIdle} from './broadcast';
import BroadcastHero from './BroadcastHero.vue';
import BroadcastFeatures from './BroadcastFeatures.vue';
import BroadcastPathways from './BroadcastPathways.vue';
import BroadcastProgression from './BroadcastProgression.vue';
import BroadcastWorld from './BroadcastWorld.vue';
import BroadcastLive from './BroadcastLive.vue';
import BroadcastCompanion from './BroadcastCompanion.vue';
import BroadcastJoin from './BroadcastJoin.vue';

useConceptFonts('https://fonts.googleapis.com/css2?family=Unbounded:wght@500;600;700&family=Onest:wght@400;500;600;700&family=Martian+Mono:wght@400;500&display=swap');

const {load} = usePathwayData();
onMounted(() => whenIdle(() => void load()));
</script>

<style>
/* ── Theme: "Live from Mysterria" ─────────────────────────────────────
   Night black, cool paper, and one electric cobalt signal. The --myst-*
   overrides re-theme the shared header, footer and teleported mobile nav. */
.concept-broadcast,
body:has(.concept-broadcast) {
  --bc-night: #07080c;
  --bc-night-2: #0e1016;
  --bc-night-3: #161923;
  --bc-paper: #e8e9ee;
  --bc-paper-2: #d9dbe3;
  --bc-ink: #0a0b10;
  --bc-ink-2: #444a5a;
  --bc-snow: #f3f4f8;
  --bc-mute: #a6abbb;
  --bc-blue: #3150f5;
  --bc-blue-ink: #2440e0;
  --bc-blue-hi: #98abff;
  --bc-live: #36e48c;
  --bc-alert: #ff6b6b;
  --bc-line: rgba(243, 244, 248, 0.12);
  --bc-line-strong: rgba(243, 244, 248, 0.24);
  --bc-line-ink: rgba(10, 11, 16, 0.14);

  --bc-font-display: 'Unbounded', 'Onest', system-ui, sans-serif;
  --bc-font-body: 'Onest', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --bc-font-mono: 'Martian Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace;
  --bc-ease: cubic-bezier(0.2, 0.7, 0.1, 1);
  --bc-shell: 1320px;
  --bc-gutter: clamp(20px, 4vw, 56px);

  --myst-bg: var(--bc-night);
  --myst-bg-2: var(--bc-night-3);
  --myst-bg-deep: var(--bc-night);
  --myst-ink: var(--bc-snow);
  --myst-ink-muted: var(--bc-mute);
  --myst-ink-strong: var(--bc-snow);
  --myst-offwhite: var(--bc-snow);
  --myst-gold: var(--bc-blue-hi);
  --myst-gold-soft: var(--bc-blue-hi);
  --myst-on-gold: var(--bc-ink);
  --myst-panel: linear-gradient(160deg, rgba(22, 25, 35, 0.7), rgba(7, 8, 12, 0.9));
  --myst-panel-strong: linear-gradient(165deg, rgba(22, 25, 35, 0.92), rgba(7, 8, 12, 0.97));
  --myst-line-10: rgba(243, 244, 248, 0.08);
  --myst-line-12: rgba(243, 244, 248, 0.1);
  --myst-line-14: rgba(243, 244, 248, 0.1);
  --myst-line-16: rgba(243, 244, 248, 0.12);
  --myst-line-18: rgba(243, 244, 248, 0.12);
  --myst-line-20: rgba(243, 244, 248, 0.14);
  --myst-line-28: rgba(152, 171, 255, 0.3);
  --myst-line-35: rgba(152, 171, 255, 0.35);
  --myst-line-40: rgba(243, 244, 248, 0.3);
  --myst-line-55: rgba(152, 171, 255, 0.55);
  --myst-wash: rgba(49, 80, 245, 0.12);
  --myst-wash-strong: rgba(49, 80, 245, 0.22);
  --myst-green: var(--bc-live);
  --myst-font-display: var(--bc-font-display);
  --myst-font-mono: var(--bc-font-mono);
  --myst-font-body: var(--bc-font-body);
}

body:has(.concept-broadcast) {
  background: var(--bc-night);
  font-family: var(--bc-font-body);
}

.concept-broadcast {
  background: var(--bc-night);
  color: var(--bc-snow);
  font-family: var(--bc-font-body);
  font-size: 17px;
  line-height: 1.55;
}

/* Scrolled header: solid night instead of a murky tint over the light sections. */
.concept-broadcast .header-stack.is-overlay:not(.is-at-top) .site-header {
  background: rgba(7, 8, 12, 0.9);
  border-bottom-color: rgba(243, 244, 248, 0.08);
}

.concept-broadcast .header-stack.is-overlay:not(.is-at-top) .season-bar {
  background: linear-gradient(90deg, #07080c, #111a4a 50%, #07080c);
}

.concept-broadcast .season-bar {
  background: linear-gradient(90deg, transparent, rgba(49, 80, 245, 0.16), transparent);
}

/* The header's brand word in a wide display face needs less tracking. */
.concept-broadcast .brand-name {
  font-weight: 600;
  letter-spacing: 0;
}

.concept-broadcast :focus-visible {
  outline: 2px solid var(--bc-blue-hi);
  outline-offset: 3px;
  border-radius: 4px;
}

.concept-broadcast .bc-light :focus-visible {
  outline-color: var(--bc-blue-ink);
}

/* ── Shared building blocks for every broadcast section ── */
.concept-broadcast :where(.bc-shell) {
  width: 100%;
  max-width: calc(var(--bc-shell) + var(--bc-gutter) * 2);
  margin-inline: auto;
  padding-inline: var(--bc-gutter);
  box-sizing: border-box;
}

.concept-broadcast :where(.bc-light) {
  background: var(--bc-paper);
  color: var(--bc-ink);
}

.concept-broadcast :where(.bc-label) {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-family: var(--bc-font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--bc-blue-hi);
}

.concept-broadcast :where(.bc-light .bc-label) {
  color: var(--bc-blue-ink);
}

.concept-broadcast :where(.bc-label)::before {
  content: '';
  width: 22px;
  height: 2px;
  background: currentColor;
}

.concept-broadcast :where(.bc-h2) {
  margin: 0;
  font-family: var(--bc-font-display);
  font-weight: 600;
  font-size: clamp(30px, 3.8vw, 56px);
  line-height: 1.04;
  letter-spacing: -0.03em;
  text-wrap: balance;
}

.concept-broadcast :where(.bc-lede) {
  margin: 0;
  max-width: 60ch;
  font-size: clamp(16px, 1.25vw, 19px);
  line-height: 1.6;
  color: var(--bc-mute);
}

.concept-broadcast :where(.bc-light .bc-lede) {
  color: var(--bc-ink-2);
}

.concept-broadcast :where(.bc-btn) {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 52px;
  padding: 0 24px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-family: var(--bc-font-body);
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
  transition: transform .3s var(--bc-ease), background-color .25s ease, border-color .25s ease, color .25s ease;
  white-space: nowrap;
}

.concept-broadcast :where(.bc-btn-primary) {
  background: var(--bc-blue);
  color: #fff;
}

.concept-broadcast :where(.bc-btn-primary:hover) {
  background: #2341e6;
  transform: translateY(-2px);
}

.concept-broadcast :where(.bc-btn-ghost) {
  border-color: var(--bc-line-strong);
  color: var(--bc-snow);
  background: rgba(7, 8, 12, 0.35);
  backdrop-filter: blur(8px);
}

.concept-broadcast :where(.bc-btn-ghost:hover) {
  border-color: var(--bc-snow);
  transform: translateY(-2px);
}

.concept-broadcast :where(.bc-light .bc-btn-ghost) {
  border-color: var(--bc-line-ink);
  color: var(--bc-ink);
  background: transparent;
}

.concept-broadcast :where(.bc-light .bc-btn-ghost:hover) {
  border-color: var(--bc-ink);
}

.concept-broadcast :where(.bc-btn .bc-arrow) {
  transition: transform .3s var(--bc-ease);
}

.concept-broadcast :where(.bc-btn:hover .bc-arrow) {
  transform: translateX(4px);
}

/* Reveal-on-scroll (see vReveal). */
.concept-broadcast .bc-reveal {
  opacity: 0;
  transform: translate3d(0, 28px, 0);
  transition: opacity .8s var(--bc-ease), transform .9s var(--bc-ease);
  transition-delay: var(--bc-delay, 0ms);
}

.concept-broadcast .bc-reveal.is-in {
  opacity: 1;
  transform: none;
}

.concept-broadcast .bc-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .concept-broadcast .bc-reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .concept-broadcast *,
  .concept-broadcast *::before,
  .concept-broadcast *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }
}
</style>
