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
      <!-- The chapters below the fold mount one by one after the hero has painted (see `shown`). -->
      <ProgressionStory v-if="shown > 0"/>
      <ArcanaOrbit v-if="shown > 1"/>
      <WorldChapter v-if="shown > 2"/>
      <ArcanaFuture v-if="shown > 3"/>
      <SectionCompanion v-if="shown > 4"/>
      <!-- the room they will take, so the page is about as tall from the first paint -->
      <div v-if="shown <= LAST" ref="pendingRef" class="arc-pending" aria-hidden="true"></div>
    </main>

    <template v-if="shown > LAST">
      <FooterItem variant="full"/>
      <ArcanaDeckControl/>
      <DailyBonusCat page="home"/>
    </template>
  </div>
</template>

<script setup lang="ts">
import {computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, watch} from 'vue';
import HeaderItem from '@/components/layout/HeaderItem.vue';
import FooterItem from '@/components/layout/FooterItem.vue';
import DailyBonusCat from '@/components/ui/DailyBonusCat.vue';
import {useI18n} from '@/composables/useI18n';
import {announceNight, lockNight, useTheme} from '@/composables/useTheme';
import ArcanaHero from './ArcanaHero.vue';
import {schedulePathwayData, useArcana} from './useArcana';
import {storyWarmed} from './progression/prewarm';
import {fillAccent, inkAccent} from './accentInk';
import grain from './assets/grain.png';

/*
 * First load: only the hero is in the page's first chunk and its first paint. The chapters
 * below the fold are their own chunks, fetched together right after that paint and mounted
 * one per task, in page order, so no single long task holds the main thread (the whole page
 * at once was a 1-2 s task on a slow phone). The potion story, right under the hero, comes
 * first and builds its book and player before the rest mount (see progression/prewarm.ts):
 * on a slow phone the later chapters' mounting kept the book from being ready in time.
 * Back/forward and #links mount everything at once, so the browser lands on the right spot.
 */
const loaders = [
  () => import('./progression/ProgressionStory.vue'),
  () => import('./ArcanaOrbit.vue'),
  () => import('./WorldChapter.vue'),
  () => import('./ArcanaFuture.vue'),
  () => import('./SectionCompanion.vue'),
  () => import('./ArcanaDeckControl.vue'),
];
const [ProgressionStory, ArcanaOrbit, WorldChapter, ArcanaFuture, SectionCompanion, ArcanaDeckControl] =
    loaders.map(loader => defineAsyncComponent(loader));
/** The five chapters; the footer and the deck control come after the last (the dock looks for the ring). */
const LAST = 5;
const landing = typeof window !== 'undefined' && (!!window.location.hash || (window.history.state?.scroll?.top ?? 0) > 0);
const shown = ref(landing ? LAST + 1 : 0);
let mounting = true;
/** The longest the later chapters wait on the story's scenes. */
const STORY_FIRST_MAX = 8000;
const pendingRef = ref<HTMLElement | null>(null);

/** Resolves when the room kept for the chapters still to mount is two screens away. */
function pendingNear(): Promise<void> {
  return new Promise(resolve => {
    const el = pendingRef.value;
    if (!el) return resolve();
    const near = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      near.disconnect();
      resolve();
    }, {rootMargin: '200% 0px'});
    near.observe(el);
  });
}

function mountChapters() {
  const chunks = loaders.map(loader => loader());
  const next = async () => {
    if (!mounting || shown.value > LAST) return;
    await chunks[Math.min(shown.value, chunks.length - 1)];
    shown.value++;
    await nextTick();
    observeChapters();
    // the rest wait for the story's scenes, unless the visitor is already near them (or something stalls)
    if (shown.value === 1) await Promise.race([storyWarmed(), pendingNear(), new Promise(done => setTimeout(done, STORY_FIRST_MAX))]);
    // its own task: the browser can paint and answer input between two chapters
    setTimeout(next, 0);
  };
  void next();
}

/* after the frame with the hero in it has painted */
const afterPaint = (task: () => void) => requestAnimationFrame(() => setTimeout(task, 0));

const {card, hasDrawn, draw} = useArcana();
// development only: draw any card from a script (the sky's checker, tools/r43-check)
if (import.meta.env.DEV && typeof window !== 'undefined') (window as Window & {__mysterriaDraw?: (id: string) => Promise<void>}).__mysterriaDraw = id => draw(id);
const {t} = useI18n();
const {theme, setTheme} = useTheme();

/*
 * The Darkness keeps the night: while it is the drawn card the light theme is refused
 * (the header says why), and drawing it on paper lets the night fall once the card has
 * landed and the page has taken its colour. Another card, or leaving the page, frees it.
 */
let nightFall = 0;
watch([() => hasDrawn.value && card.value.id === 'darkness', () => t('home.arcana.night')], ([dark]) => {
  clearTimeout(nightFall);
  if (!dark) {
    lockNight(null);
    return;
  }
  lockNight(t('home.arcana.night'));
  // on paper the night falls once the card has landed, and the line under the button says why
  if (theme.value === 'parchment') {
    nightFall = window.setTimeout(() => {
      setTheme('dark');
      nightFall = window.setTimeout(announceNight, 350);
    }, 750);
  }
}, {immediate: true});
/** Undrawn, the page wears the neutral accent; the first draw crossfades into the card's. */
const themeKey = computed(() => (hasDrawn.value ? card.value.id : 'undrawn'));

/* --acc-deep: the accent deepened to read as text on the light theme's paper; --acc-fill: the
   light theme's solid-control fill (near-black where the deepened accent turns olive). See accentInk.ts. */
const themeStyle = computed(() => ({
  '--acc': card.value.accent,
  '--acc-deep': inkAccent(card.value.accent),
  '--acc-fill': fillAccent(card.value.accent),
}));

/* (the accent on <body>, which the header's teleported drawer reads too, is set site-wide in App.vue) */

/*
 * Chapters well outside the viewport hold their looping animations still: drifting fog,
 * spinning halos and pulses then cost nothing while the visitor reads another chapter.
 * Only the elements that run a loop get the class (.arc-held, see the style block): an
 * attribute on the chapter matched by "[data-offscreen] *" restyled every element in it
 * (25-35 ms on a laptop) each time a chapter crossed the edge mid-scroll.
 */
let offscreenObserver: IntersectionObserver | null = null;
const held = new WeakMap<Element, Element[]>();
/** The chapters outside the viewport now. */
const away = new Set<Element>();
function holdLoops(section: Element, offscreen: boolean) {
  held.get(section)?.forEach(el => el.classList.remove('arc-held'));
  held.delete(section);
  if (offscreen) away.add(section);
  else away.delete(section);
  if (!offscreen) return;
  const loops = new Set<Element>();
  for (const animation of section.getAnimations({subtree: true})) {
    const effect = animation.effect as KeyframeEffect | null;
    if (animation.playState === 'running' && effect?.target && effect.getTiming().iterations === Infinity) loops.add(effect.target);
  }
  loops.forEach(el => el.classList.add('arc-held'));
  held.set(section, [...loops]);
}

/*
 * Keyboard focus never lands out of sight (WCAG 2.4.11): leaving the pinned potion story,
 * the browser left the next stop (the ring's tabs) below the fold. Anything the keyboard
 * focuses entirely off screen is brought into view.
 */
function revealFocus(event: FocusEvent) {
  const el = event.target;
  if (!(el instanceof HTMLElement) || !el.matches(':focus-visible')) return;
  const r = el.getBoundingClientRect();
  if (r.bottom < 0 || r.top > window.innerHeight) el.scrollIntoView({block: 'center', behavior: 'instant'});
}

onMounted(() => {
  document.addEventListener('focusin', revealFocus);
  // The pathway data is ~1.3 MB: fetched after the story's scenes are built, or sooner when the visitor reaches for it.
  schedulePathwayData();
  if (shown.value <= LAST) afterPaint(mountChapters);

  offscreenObserver = new IntersectionObserver(entries => {
    for (const entry of entries) holdLoops(entry.target, !entry.isIntersecting);
  }, {rootMargin: '200px 0px'});
  observeChapters();
  // A loop can start after its chapter left the viewport (the online pulse waits for the
  // server's answer): held then too, or it ticked a frame on every refresh from far away.
  document.querySelector('.concept-arcana > .arc-main')?.addEventListener('animationstart', onLoopStart);
});

/** Watches every chapter mounted so far (observing one twice is a no-op). */
function observeChapters() {
  document.querySelectorAll('.concept-arcana > .arc-main > :not(.arc-pending)').forEach(section => offscreenObserver?.observe(section));
}

function onLoopStart(event: Event) {
  const section = event.target instanceof Element ? event.target.closest('.concept-arcana > .arc-main > *') : null;
  if (section && away.has(section)) holdLoops(section, true);
}

onUnmounted(() => {
  mounting = false;
  document.removeEventListener('focusin', revealFocus);
  clearTimeout(nightFall);
  lockNight(null);
  offscreenObserver?.disconnect();
  document.querySelector('.concept-arcana > .arc-main')?.removeEventListener('animationstart', onLoopStart);
});
</script>

<style>
/* (the tokens, the accent's @property and the site-wide pieces live in assets/arcana.css) */

/* The accent crossfade: slower and softer than the theme switch's (main.css). */
:root.arc-recolour::view-transition-old(*),
:root.arc-recolour::view-transition-new(*) {
  animation-duration: .65s;
  animation-timing-function: cubic-bezier(.4, 0, .2, 1);
}

/* the page is captured region by region, not whole (useArcana: crossfade) */
:root.arc-recolour {
  view-transition-name: none;
}

/* clicks reach the page under the crossfade, so the next card can be drawn during it */
:root.arc-recolour::view-transition {
  pointer-events: none;
}

.concept-arcana {
  /* the strip under the hero's deck, before the potion story's room comes up over the city */
  --roof-h: clamp(96px, 15vh, 168px);
  /* the potion story's foot: where its room deepens into the page the next section opens on */
  --room-foot: clamp(180px, 24vh, 280px);
}

/*
 * The potion story follows the theme like every other section: on paper it is a lamplit
 * room in the page's own colours, its text in ink. Only its darkness stays dark: the dread
 * closing in on him as he drinks, and the blackout before the flash (ProgressionStory).
 */

.concept-arcana {
  position: relative;
  min-height: 100vh;
  background: var(--arc-bg);
  color: var(--arc-ink);
  font-family: var(--arc-body);
  font-synthesis: none;
}

/* the chapters still to mount (about their height together); gone a moment after the first paint */
.arc-pending {
  min-height: 1000svh;
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

/* the hero's tints, keyed by accent: the same length as the recolour crossfade */
.arc-tint-enter-active,
.arc-tint-leave-active {
  transition: opacity .65s cubic-bezier(.4, 0, .2, 1);
}

.arc-tint-enter-from,
.arc-tint-leave-to {
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
@media (min-height: 591px) and (prefers-reduced-motion: no-preference) {
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
  .arc-wash-leave-active,
  .arc-tint-enter-active,
  .arc-tint-leave-active {
    transition: opacity .3s ease;
  }
}
</style>
