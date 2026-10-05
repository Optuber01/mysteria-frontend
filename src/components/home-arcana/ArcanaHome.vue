<template>
  <div class="concept-arcana" :style="themeStyle">
    <!-- The page's ambient layer: the accent wash and the grain -->
    <div class="arc-ambient" aria-hidden="true">
      <!-- The re-theme happens here: two fixed layers crossfade (opacity only), the rest of the page just switches colour. -->
      <Transition name="arc-wash">
        <span :key="themeKey" class="arc-ambient__wash" :style="{'--wash': card.accent}"></span>
      </Transition>
      <span class="arc-ambient__grain" :style="{backgroundImage: `url(${grain})`}"></span>
    </div>

    <HeaderItem overlay/>

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
import {ensurePathwayData, useArcana} from './useArcana';
import {fillAccent, inkAccent} from './accentInk';
import grain from './assets/grain.png';

useConceptFonts('https://fonts.googleapis.com/css2?family=Commissioner:wght,FLAR@400..800,0..100&family=Golos+Text:wght@400..700&family=IBM+Plex+Mono:wght@400;500&family=Tenor+Sans&display=swap');

const {card, hasDrawn} = useArcana();
/** Undrawn, the page wears the neutral accent; the first draw crossfades into the card's. */
const themeKey = computed(() => (hasDrawn.value ? card.value.id : 'undrawn'));

/* --acc-deep: the accent deepened to read as text on the light theme's paper; --acc-fill: the
   light theme's solid-control fill (near-black where the deepened accent turns olive). See accentInk.ts. */
const themeStyle = computed(() => ({
  '--acc': card.value.accent,
  '--acc-deep': inkAccent(card.value.accent),
  '--acc-fill': fillAccent(card.value.accent),
}));

/* The header's mobile drawer is teleported to <body>, so the accent rides there too. */
watch(() => card.value.accent, accent => {
  document.body.style.setProperty('--acc', accent);
  document.body.style.setProperty('--acc-deep', inkAccent(accent));
  document.body.style.setProperty('--acc-fill', fillAccent(accent));
}, {immediate: true});

/*
 * Chapters well outside the viewport hold their looping animations still: drifting fog,
 * spinning halos and pulses then cost nothing while the visitor reads another chapter.
 * Only the elements that run a loop get the class (.arc-held, see the style block): an
 * attribute on the chapter matched by "[data-offscreen] *" restyled every element in it
 * (25-35 ms on a laptop) each time a chapter crossed the edge mid-scroll.
 */
let offscreenObserver: IntersectionObserver | null = null;
const held = new WeakMap<Element, Element[]>();
function holdLoops(section: Element, offscreen: boolean) {
  held.get(section)?.forEach(el => el.classList.remove('arc-held'));
  held.delete(section);
  if (!offscreen) return;
  const loops = new Set<Element>();
  for (const animation of section.getAnimations({subtree: true})) {
    const effect = animation.effect as KeyframeEffect | null;
    if (animation.playState === 'running' && effect?.target && effect.getTiming().iterations === Infinity) loops.add(effect.target);
  }
  loops.forEach(el => el.classList.add('arc-held'));
  held.set(section, [...loops]);
}

onMounted(() => {
  // The pathway data is ~1.3 MB: fetch it once the first screen has settled.
  const idle = (window as Window & {requestIdleCallback?: (cb: () => void, opts?: {timeout: number}) => number}).requestIdleCallback;
  if (idle) idle(() => void ensurePathwayData(), {timeout: 1500});
  else setTimeout(() => void ensurePathwayData(), 600);

  offscreenObserver = new IntersectionObserver(entries => {
    for (const entry of entries) holdLoops(entry.target, !entry.isIntersecting);
  }, {rootMargin: '200px 0px'});
  document.querySelectorAll('.concept-arcana > .arc-main > *').forEach(section => offscreenObserver?.observe(section));
});

onUnmounted(() => {
  offscreenObserver?.disconnect();
  document.body.style.removeProperty('--acc');
  document.body.style.removeProperty('--acc-deep');
  document.body.style.removeProperty('--acc-fill');
});
</script>

<style>
/*
 * Registered as a colour so color-mix() and transitions on the properties that read it
 * interpolate. The accent itself is NOT transitioned page-wide (that restyles and repaints
 * every element each frame for over a second). A draw switches it once, after the card has
 * landed, under a View Transition: the old and new pages crossfade as two composited
 * snapshots (useArcana). Without View Transitions it switches at once while the ambient
 * wash crossfades and a few key elements (labels, solid buttons) ease their own colours.
 */
@property --acc {
  syntax: '<color>';
  inherits: true;
  /* NEUTRAL_ACCENT in arcana-data.ts: the page before the visitor draws */
  initial-value: #e45a64;
}

/* The accent crossfade: slower and softer than the theme switch's (main.css). */
:root.arc-recolour::view-transition-old(root),
:root.arc-recolour::view-transition-new(root) {
  animation-duration: .65s;
  animation-timing-function: cubic-bezier(.4, 0, .2, 1);
}

.concept-arcana,
body:has(.concept-arcana) {
  --arc-bg: #0b0b0e;
  --arc-surface: #15151b;
  --arc-line: rgba(255, 255, 255, .09);
  --arc-ink: #efeef3;
  --arc-muted: #a7a6b2;
  --arc-on-acc: #0b0b0e;
  /* the page itself, for chapters that keep their own dark room inside a light page */
  --arc-page: var(--arc-bg);
  /* The accent where it colours text or hairlines, and where it fills a solid control
     (its label in --arc-on-acc). Dark: the accent itself. Light: --acc-deep (see below). */
  --acc-ink: var(--acc);
  --acc-solid: var(--acc);
  /* faint fill for ghost controls, and the shadow under raised pieces */
  --arc-glass: rgba(255, 255, 255, .04);
  --arc-shadow: rgba(0, 0, 0, .55);
  --arc-shadow-strong: rgba(0, 0, 0, .7);
  /* the face of small accent-edged tokens (step numbers, chapter cards), and status text */
  --arc-chip-bg: #0e0e12;
  /* raised cards that hold a photo (world chapter): top and foot of their face */
  --arc-card: #131318;
  --arc-card-2: #0f0f13;
  /* tooltips and pop-outs that float over the page */
  --arc-pop: rgba(15, 15, 19, .96);
  --arc-ok: #86efac;
  --arc-bad: #ffb3a8;
  /* flared grotesk display, wide inscriptional caps for card labels, plain mono for the address */
  --arc-display: 'Commissioner', 'Segoe UI', system-ui, sans-serif;
  --arc-body: 'Golos Text', 'Segoe UI', system-ui, sans-serif;
  --arc-caps: 'Tenor Sans', 'Segoe UI', system-ui, sans-serif;
  --arc-mono: 'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace;

  /*
   * One system for every chapter (the spec: /tmp/arcana-design-spec.md).
   * Container: every section's content sits between the same two edges.
   */
  --arc-container: 1320px;
  --arc-gutter: clamp(18px, 4vw, 64px);
  /* the strip under the hero's deck, before the potion story's room comes up over the city */
  --roof-h: clamp(96px, 15vh, 168px);
  /* the potion story's foot: where its room deepens into the page the next section opens on */
  --room-foot: clamp(180px, 24vh, 280px);
  /* The content edge inside a full-width box, for left/right/padding-inline (whose % is the
     full-width containing block): the header bar, the potion story, the footer. */
  --arc-edge: max(var(--arc-gutter), (100% - var(--arc-container)) / 2);
  /* rhythm: section padding (top and bottom), groups inside a section, head -> content */
  --arc-section-pad: clamp(64px, 6vw, 96px);
  --arc-block-gap: clamp(56px, 5.5vw, 96px);
  --arc-head-gap: clamp(32px, 3.5vw, 52px);
  --arc-group-gap: clamp(20px, 2.2vw, 32px);
  --arc-grid-gap: clamp(12px, 1.4vw, 20px);
  /* radii: tokens and chips, controls and rows, surfaces and photos */
  --arc-r-sm: 6px;
  --arc-r-md: 12px;
  --arc-r-lg: 18px;
  --arc-radius: var(--arc-r-lg);
  --arc-radius-lg: var(--arc-r-lg);
  /* lines: every hairline, and the one accent width (selected states, accent strokes) */
  --arc-bw: 1px;
  --arc-bw-accent: 2px;
  --arc-line-acc: color-mix(in oklab, var(--acc-ink) 42%, transparent);
  --arc-line-hot: color-mix(in oklab, var(--acc-ink) 70%, transparent);
  /* the card fill: every raised surface on the page */
  --arc-raised: color-mix(in oklab, var(--arc-surface) 88%, transparent);
  /* one button family */
  --arc-btn-h: 48px;
  --arc-btn-h-sm: 40px;
  --arc-btn-fs: 15.5px;
  /* one focus ring */
  --arc-focus-w: 2px;
  --arc-focus-off: 3px;
  /* type */
  --arc-fs-display: clamp(36px, 4.8vw, 68px);
  --arc-fs-h2: clamp(28px, 3vw, 42px);
  --arc-fs-h3: clamp(24px, 2.3vw, 34px);
  --arc-fs-h4: clamp(19px, 1.45vw, 22px);
  --arc-fs-lede: clamp(16px, 1.15vw, 18px);
  --arc-fs-body: clamp(15px, 1.05vw, 16px);
  --arc-fs-small: 14px;
  --arc-fs-caption: 13px;

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

/*
 * Light theme (<html data-theme="parchment">, the header's sun/moon switch): bone paper,
 * ink text. The pathway accents are made for the dark page; on paper the accent keeps
 * tinting washes and fills, while text, hairlines and solid controls use --acc-deep,
 * the same hue deepened to >= 5.3:1 on the paper for every card (accentInk.ts). No gold:
 * upstream's parchment tokens are gold-tinted, so every one of them is re-pointed here.
 */
:root[data-theme="parchment"] .concept-arcana,
:root[data-theme="parchment"] body:has(.concept-arcana) {
  --arc-bg: #efede8;
  --arc-surface: #f8f7f4;
  --arc-line: rgba(28, 24, 36, .13);
  --arc-ink: #17161c;
  --arc-muted: #55535e;
  --arc-on-acc: #ffffff;
  --acc-ink: var(--acc-deep, var(--acc));
  /* solid fills: near-black for the accents that deepen into olive (Sun, Death, Second Law) */
  --acc-solid: var(--acc-fill, var(--acc-deep, var(--acc)));
  --arc-glass: rgba(28, 24, 36, .035);
  --arc-shadow: rgba(46, 36, 58, .16);
  --arc-shadow-strong: rgba(40, 30, 52, .34);
  --arc-chip-bg: #fbfaf7;
  --arc-card: #f8f7f4;
  --arc-card-2: #f5f3ef;
  --arc-pop: rgba(251, 250, 247, .97);
  --arc-ok: #17703a;
  --arc-bad: #b2322b;

  --myst-bg: #efede8;
  --myst-bg-2: #f8f7f4;
  --myst-bg-deep: #efede8;
  --myst-ink: #17161c;
  --myst-ink-muted: #55535e;
  --myst-ink-strong: #0b0b0e;
  --myst-offwhite: #17161c;
  --myst-gold: var(--acc-ink);
  --myst-gold-soft: var(--acc-ink);
  --myst-on-gold: #ffffff;
  --myst-line-10: rgba(28, 24, 36, .08);
  --myst-line-12: rgba(28, 24, 36, .09);
  --myst-line-14: rgba(28, 24, 36, .11);
  --myst-line-16: rgba(28, 24, 36, .12);
  --myst-line-18: rgba(28, 24, 36, .13);
  --myst-line-20: rgba(28, 24, 36, .14);
  --myst-line-28: color-mix(in srgb, var(--acc-ink) 30%, transparent);
  --myst-line-35: color-mix(in srgb, var(--acc-ink) 38%, transparent);
  --myst-line-40: color-mix(in srgb, var(--acc-ink) 44%, transparent);
  --myst-line-55: color-mix(in srgb, var(--acc-ink) 58%, transparent);
  --myst-wash: color-mix(in srgb, var(--acc) 12%, transparent);
  --myst-wash-strong: color-mix(in srgb, var(--acc) 22%, transparent);
  --myst-panel: linear-gradient(160deg, rgba(255, 255, 255, .7), rgba(239, 237, 232, .92));
  --myst-panel-strong: linear-gradient(165deg, rgba(255, 255, 255, .92), rgba(239, 237, 232, .97));
  --myst-green: #17703a;
}

/*
 * The potion story stays a dark room in the light theme: its brewery, blackout and
 * heartbeat are made of darkness. On paper it is a deep warm ink rather than the night
 * page's black, with the dark palette's light text. It has no edges: its top deepens from
 * the paper into the room over a short stretch, its foot back into the paper
 * (ProgressionStory, --room-in and --room-foot).
 */
:root[data-theme="parchment"] .concept-arcana .progression {
  --arc-bg: #1a1519;
  --arc-surface: #241e23;
  --arc-line: rgba(255, 255, 255, .09);
  --arc-ink: #efeef3;
  --arc-muted: #aaa5ae;
  --arc-on-acc: #1a1519;
  --acc-ink: var(--acc);
  --acc-solid: var(--acc);
  --arc-glass: rgba(255, 255, 255, .04);
  --arc-shadow: rgba(0, 0, 0, .55);
  --arc-shadow-strong: rgba(0, 0, 0, .7);
  --arc-chip-bg: #1d181c;
  --arc-card: #211b20;
  --arc-card-2: #1c171b;
  --arc-pop: rgba(33, 27, 32, .96);
  --arc-ok: #86efac;
  --arc-bad: #ffb3a8;
  /* tokens built from the ones above resolve where they are declared: re-derive them here */
  --arc-line-acc: color-mix(in oklab, var(--acc-ink) 42%, transparent);
  --arc-line-hot: color-mix(in oklab, var(--acc-ink) 70%, transparent);
  --arc-raised: color-mix(in oklab, var(--arc-surface) 88%, transparent);
}

/* the stacked story (ProgressionStory's fallback, no dissolve): its foot fades into the paper inside its padding */
@media (max-width: 900px), (max-height: 590px), (prefers-reduced-motion: reduce) {
  :root[data-theme="parchment"] .concept-arcana .progression::after {
    position: absolute;
    z-index: 30;
    right: 0;
    left: 0;
    bottom: 0;
    height: calc(clamp(64px, 12vw, 96px) + 40px);
    pointer-events: none;
    content: '';
    background: linear-gradient(0deg, var(--arc-page), color-mix(in srgb, var(--arc-page) 55%, transparent) 40%, transparent);
  }
}

/*
 * Light theme: over the dark room the bar's 78% paper glass turned a muddy grey. On this
 * page it is near-solid paper, so it reads as the same bar over the hero, the room and the page.
 */
:root[data-theme="parchment"] .concept-arcana .header-stack.is-overlay .site-header::before {
  background: color-mix(in srgb, var(--myst-bg) 95%, transparent);
}

body:has(.concept-arcana) {
  background-color: var(--arc-bg);
}

.concept-arcana {
  position: relative;
  min-height: 100vh;
  background: var(--arc-bg);
  color: var(--arc-ink);
  font-family: var(--arc-body);
  font-synthesis: none;
}

/* From 1280px the gutter is the spec's full 64px. */
@media (min-width: 1280px) {
  .concept-arcana {
    --arc-gutter: 64px;
  }
}

.concept-arcana ::selection {
  background: var(--acc-solid);
  color: var(--arc-on-acc);
}

/* header details that upstream hard-codes in gold */
.concept-arcana .header-stack .brand-mark,
.concept-arcana .footer-brand img,
body:has(.concept-arcana) .mobile-nav .brand-mark {
  filter: grayscale(1) brightness(1.35) drop-shadow(0 0 8px color-mix(in srgb, var(--acc) 55%, transparent));
}

/* on paper the mark is inked, like the name beside it */
:root[data-theme="parchment"] .concept-arcana .header-stack .brand-mark,
:root[data-theme="parchment"] .concept-arcana .footer-brand img,
:root[data-theme="parchment"] body:has(.concept-arcana) .mobile-nav .brand-mark {
  filter: grayscale(1) brightness(.4) contrast(1.3) drop-shadow(0 0 6px color-mix(in srgb, var(--acc) 40%, transparent));
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

/*
 * The shared header and footer, on this page only: their content runs between the page's
 * own two edges, and their controls join the page's family (one height, one radius, the
 * page's focus ring, the tabs' 2px accent underline for the current page).
 */
.concept-arcana .header-stack .header-grid {
  max-width: calc(var(--arc-container) + 2 * var(--arc-gutter));
  padding-inline: var(--arc-gutter);
}

.concept-arcana .header-stack .header-actions :is(.ip-chip, .lang-ritual-trigger, .theme-toggle, .login-button, .profile-chip) {
  min-height: 36px;
  border-radius: var(--arc-r-sm);
}

.concept-arcana .header-stack .header-actions .ip-chip {
  padding-block: 0;
}

.concept-arcana .header-stack .header-actions .login-button {
  padding-block: 0;
}

.concept-arcana .header-stack .header-actions .theme-toggle {
  width: 36px;
  height: 36px;
}

.concept-arcana .header-stack .nav-underline {
  height: var(--arc-bw-accent);
  border-radius: 1px;
  background: var(--acc-ink);
}

.concept-arcana .header-stack :is(a, button):focus-visible,
.concept-arcana > .site-footer a:focus-visible {
  border-radius: var(--arc-r-sm);
  outline: var(--arc-focus-w) solid var(--arc-ink);
  outline-offset: var(--arc-focus-off);
}

/*
 * Light theme: the bar floats over the hero's rose haze, where the accent and the green,
 * tuned for plain paper, drop under 4.5:1. Its small coloured text is inked a step deeper.
 */
:root[data-theme="parchment"] .concept-arcana .header-stack :is(.season-headline, .lang-label) {
  color: color-mix(in oklab, var(--acc-ink) 62%, var(--arc-ink));
}

/* deep enough to hold 4.5:1 where the bar's glass lies over the potion story's dark room */
:root[data-theme="parchment"] .concept-arcana .header-stack .chip-players {
  color: #08401d;
}

/* the footer is part of the page: no band of its own, a hairline at the content's width */
.concept-arcana > .site-footer {
  border-top: 0;
  background: transparent;
}

.concept-arcana > .site-footer.full {
  padding: 0 var(--arc-gutter) 36px;
}

.concept-arcana > .site-footer .footer-shell {
  max-width: var(--arc-container);
  padding-top: clamp(40px, 4vw, 56px);
  border-top: var(--arc-bw) solid var(--arc-line);
}

.concept-arcana > .site-footer .footer-columns {
  border-bottom-color: var(--arc-line);
}

/* over the page's wash (not a solid band) the faded small print needs the full muted ink */
.concept-arcana > .site-footer :is(.footer-copy, .footer-legal a) {
  color: var(--arc-muted);
}

.concept-arcana > .site-footer .footer-legal a:hover {
  color: var(--acc-ink);
}

/* ---------- ambient layer ---------- */
.arc-ambient {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  /* One composited layer, painted once: the wash and the grain are flattened
     into it (only a crossfade lifts a piece onto its own layer, while it runs). */
  contain: strict;
  transform: translateZ(0);
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

.arc-main {
  position: relative;
  z-index: 1;
}

/*
 * The potion story is an opaque room that ends in the plain page colour (its dissolve);
 * the page around it is the background plus the fixed wash and grain. The section after
 * the room starts in that plain colour and lets the wash and grain fade back in, so there
 * is no line where the room ends. (A static gradient that scrolls with the section.)
 */
.concept-arcana .progression + .arc-section::before {
  position: absolute;
  z-index: -1;
  top: var(--story-overlap, 0px);
  right: 0;
  left: 0;
  height: calc(var(--arc-section-pad) * 1.5);
  background: linear-gradient(180deg, var(--arc-page), color-mix(in srgb, var(--arc-page) 62%, transparent) 38%, transparent);
  pointer-events: none;
  content: '';
}

/*
 * The pinned story (not its stacked fallback) scrolls away at its end over its foot, which
 * deepens into the page colour. The next section starts inside the last of that foot, so
 * its heading comes up right behind the room, on the plain page; the seam above starts
 * where the foot ends.
 */
@media (min-width: 901px) and (min-height: 591px) and (prefers-reduced-motion: no-preference) {
  .concept-arcana .progression + .arc-section {
    --story-overlap: calc(var(--room-foot) * .4);
    margin-top: calc(-1 * var(--story-overlap));
  }
}

/* A loop in a chapter far from the viewport (set by ArcanaHome's observer) holds still. */
.concept-arcana .arc-held,
.concept-arcana .arc-held::before,
.concept-arcana .arc-held::after {
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
  max-width: var(--arc-container);
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
  font-size: 11px;
  font-weight: 500;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--acc-ink);
  transition: color .6s ease;
}

/* ---------- one button family: solid, ghost, and the field/tile (copy address, downloads) ---------- */
.concept-arcana .arc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: var(--arc-btn-h);
  padding: 0 22px;
  border: 0;
  border-radius: var(--arc-r-md);
  font-family: var(--arc-body);
  font-size: var(--arc-btn-fs);
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  text-decoration: none;
  transition: transform .3s cubic-bezier(.2, .8, .2, 1), filter .2s, background-color .25s ease, box-shadow .25s ease;
}

.concept-arcana .arc-btn--sm {
  min-height: var(--arc-btn-h-sm);
  padding: 0 16px;
  font-size: 15px;
}

.concept-arcana .arc-btn--solid {
  background: var(--acc-solid);
  color: var(--arc-on-acc);
  box-shadow: 0 10px 30px color-mix(in oklab, var(--acc-solid) 30%, transparent);
}

.concept-arcana .arc-btn--solid:hover {
  color: var(--arc-on-acc);
  filter: brightness(1.08);
}

.concept-arcana .arc-btn--ghost {
  background: var(--arc-glass);
  color: var(--arc-ink);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line-acc);
}

.concept-arcana .arc-btn--ghost:hover {
  color: var(--arc-ink);
  background: color-mix(in oklab, var(--acc) 12%, transparent);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line-hot);
}

/* hover lifts every interactive surface by the same 2px; a press sets it down */
.concept-arcana .arc-btn:hover,
.concept-arcana .arc-tile:hover {
  transform: translateY(-2px);
}

.concept-arcana .arc-btn:active,
.concept-arcana .arc-tile:active,
.concept-arcana .arc-ip:active {
  transform: scale(.98);
  transition-duration: .08s;
}

.concept-arcana .arc-btn:disabled {
  opacity: .55;
  cursor: progress;
  transform: none;
}

/* one focus ring for the whole page (low specificity: things that tilt draw it themselves) */
.concept-arcana :where(a, button, [tabindex], summary):focus-visible {
  outline: var(--arc-focus-w) solid var(--arc-ink);
  outline-offset: var(--arc-focus-off);
}

.concept-arcana .arc-btn__icon {
  width: 18px;
  height: 18px;
}

/* the field/tile look: a quiet hairline that turns accent on hover */
.concept-arcana .arc-ip,
.concept-arcana .arc-tile {
  border: 0;
  border-radius: var(--arc-r-md);
  background: var(--arc-glass);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
  color: var(--arc-ink);
  transition: box-shadow .25s ease, background-color .25s ease, transform .3s cubic-bezier(.2, .8, .2, 1);
}

.concept-arcana .arc-ip:hover,
.concept-arcana .arc-tile:hover {
  color: var(--arc-ink);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line-hot);
}

.concept-arcana .arc-ip {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-height: var(--arc-btn-h);
  padding: 0 7px 0 18px;
  font: inherit;
  cursor: pointer;
}

.concept-arcana .arc-ip__label {
  font-family: var(--arc-caps);
  font-size: 10.5px;
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
  min-height: 34px;
  padding: 0 11px;
  border-radius: var(--arc-r-sm);
  background: color-mix(in oklab, var(--acc) 16%, transparent);
  color: var(--arc-ink);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  transition: background-color .2s ease;
}

.concept-arcana .arc-ip:hover .arc-ip__hint {
  background: color-mix(in oklab, var(--acc) 26%, transparent);
}

.concept-arcana .arc-ip.is-copied .arc-ip__hint {
  background: #4ade80;
  color: #06210f;
}

.concept-arcana .arc-ip.is-failed .arc-ip__hint {
  background: #f87171;
  color: #2a0606;
}

/* links: inline (accent, underlined) and action links (ink, accent arrow that steps on) */
.concept-arcana .arc-link {
  color: var(--acc-ink);
  font-weight: 600;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-decoration-color: color-mix(in oklab, var(--acc-ink) 45%, transparent);
  text-underline-offset: 4px;
  transition: color .2s ease, text-decoration-color .2s ease;
}

.concept-arcana .arc-link:hover {
  color: var(--arc-ink);
  text-decoration-color: currentColor;
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

  .arc-wash-enter-active,
  .arc-wash-leave-active {
    transition: opacity .3s ease;
  }
}
</style>
