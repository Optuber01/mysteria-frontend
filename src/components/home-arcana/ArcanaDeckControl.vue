<template>
  <!--
    Persistent deck, once the hero's table has scrolled away: your card as a small
    sigil that redraws (a face-down card that draws, before the first draw), seated in
    the header's free space beside its actions (so it never covers the page), plus the
    page's four sections in the right gutter.
  -->
  <aside class="arc-dock" :class="{'is-shown': visible}" :aria-label="t('home.arcana.dock.label')" :inert="!visible || undefined">
    <nav class="arc-dock__spread" :aria-label="t('home.arcana.dock.spreadLabel')">
      <a
          v-for="spot in spread"
          :key="spot.id"
          :href="`#${spot.id}`"
          class="arc-dock__spot"
          :class="{'is-active': active === spot.id}"
          :aria-current="active === spot.id ? 'location' : undefined"
      >
        <span class="arc-dock__spot-card" aria-hidden="true">{{ spot.numeral }}</span>
        <span class="arc-dock__spot-name">{{ spot.label }}</span>
      </a>
    </nav>

    <!-- Only ever in the header: with no free room there it steps away rather than cover the page. -->
    <div class="arc-dock__seat" :class="{'is-away': !seat}" :style="seatStyle" :inert="!seat || undefined">
      <button
          type="button"
          class="arc-dock__orb"
          :aria-label="orbLabel"
          :aria-describedby="tipId"
          @click="draw()"
      >
        <span :key="drawCount" class="arc-dock__face" aria-hidden="true">
          <img v-if="hasDrawn" :src="sigilThumb(card.id)" alt="" width="64" height="64" decoding="async">
          <svg v-else class="arc-dock__back" viewBox="0 0 20 30">
            <rect x="1" y="1" width="18" height="28" rx="2.5"/>
            <circle cx="10" cy="15" r="4.2"/>
            <circle cx="10" cy="15" r="1.3" class="arc-dock__back-pupil"/>
          </svg>
        </span>
        <span class="arc-dock__badge" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>
        </span>
      </button>
      <span :id="tipId" class="arc-dock__tip" role="tooltip">
        <template v-if="hasDrawn">
          <span class="arc-dock__tip-label">{{ t('home.arcana.dock.your') }}</span>
          <span class="arc-dock__tip-name">{{ reading.name }}</span>
          <span class="arc-dock__tip-action">{{ t('home.arcana.dock.draw') }}</span>
        </template>
        <template v-else>
          <span class="arc-dock__tip-label">{{ t('home.arcana.dock.none') }}</span>
          <span class="arc-dock__tip-name">{{ t('home.arcana.dock.drawFirst') }}</span>
          <span class="arc-dock__tip-action">{{ t('home.arcana.dock.drawFirstHint') }}</span>
        </template>
      </span>
    </div>
  </aside>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {sigilThumb} from './arcana-data';
import {useArcana} from './useArcana';

const {t} = useI18n();
const {card, hasDrawn, reading, drawCount, draw} = useArcana();
const tipId = 'arc-dock-tip';
const orbLabel = computed(() => (hasDrawn.value
    ? `${t('home.arcana.dock.draw')}. ${t('home.arcana.dock.current').replace('{name}', reading.value.name)}`
    : t('home.arcana.dock.drawFirst')));

const spread = computed(() => [
  {id: 'progression', numeral: 'I', label: t('home.world.spread.potion')},
  {id: 'deck', numeral: 'II', label: t('home.world.spread.deck')},
  {id: 'world', numeral: 'III', label: t('home.world.spread.world')},
  {id: 'future', numeral: 'IV', label: t('home.world.spread.seat')},
]);

const pastHero = ref(false);
const navOpen = ref(false);
/** The Pathways orbit is a deck control of its own: step aside while it is on screen. */
const atOrbit = ref(false);
const active = ref('');
const visible = computed(() => pastHero.value && !navOpen.value && !atOrbit.value);

/* ---------------- the seat: the header's free space, left of its actions ---------------- */
const ORB = 40;
const seat = ref<{x: number; y: number} | null>(null);
const seatStyle = computed(() => (seat.value
    ? {left: `${seat.value.x}px`, top: `${seat.value.y}px`}
    : undefined));

function locate() {
  const bar = document.querySelector<HTMLElement>('.header-stack .site-header');
  const actions = bar?.querySelector<HTMLElement>('.header-actions');
  if (!bar || !actions) {
    seat.value = null;
    return;
  }
  const visibleRight = (el: Element | null) => {
    const r = el?.getBoundingClientRect();
    return r && r.width > 0 ? r.right : 0;
  };
  const b = bar.getBoundingClientRect();
  const a = actions.getBoundingClientRect();
  const leftNeighbour = Math.max(visibleRight(bar.querySelector('.primary-nav')), visibleRight(bar.querySelector('.brand')));
  const gap = window.innerWidth < 600 ? 10 : 16;
  const x = a.left - gap - ORB;
  // Not enough room between the nav and the actions: stay out of sight (the hero and the orbit still draw).
  seat.value = x - leftNeighbour >= gap ? {x: Math.round(x), y: Math.round(b.top + (b.height - ORB) / 2)} : null;
}

let heroObserver: IntersectionObserver | null = null;
let orbitObserver: IntersectionObserver | null = null;
let sectionObserver: IntersectionObserver | null = null;
let headerSizes: ResizeObserver | null = null;
let headerChanges: MutationObserver | null = null;

onMounted(() => {
  const hero = document.querySelector('.concept-arcana .arc-hero');
  heroObserver = new IntersectionObserver(([entry]) => {
    pastHero.value = !entry.isIntersecting;
  }, {rootMargin: '0px 0px -55% 0px'});
  if (hero) heroObserver.observe(hero);

  orbitObserver = new IntersectionObserver(([entry]) => {
    atOrbit.value = entry.isIntersecting;
  }, {rootMargin: '-10% 0px -10% 0px'});
  const orbit = document.getElementById('pathways');
  if (orbit) orbitObserver.observe(orbit);

  sectionObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) active.value = entry.target.id;
      else if (active.value === entry.target.id) active.value = '';
    }
  }, {rootMargin: '-45% 0px -45% 0px'});
  spread.value.forEach(spot => {
    const el = document.getElementById(spot.id);
    if (el) sectionObserver?.observe(el);
  });

  // Follow the header: announcement dismissed, language or sign-in changing its actions, mobile menu.
  const stack = document.querySelector('.header-stack');
  headerSizes = new ResizeObserver(locate);
  [stack, stack?.querySelector('.header-actions'), stack?.querySelector('.primary-nav')]
      .forEach(el => el && headerSizes?.observe(el));
  if (stack) {
    headerChanges = new MutationObserver(() => {
      navOpen.value = !!stack.querySelector('.mobile-nav-overlay');
      locate();
    });
    headerChanges.observe(stack, {childList: true, subtree: true});
  }
  window.addEventListener('resize', locate);
  locate();
});

onUnmounted(() => {
  heroObserver?.disconnect();
  orbitObserver?.disconnect();
  sectionObserver?.disconnect();
  headerSizes?.disconnect();
  headerChanges?.disconnect();
  window.removeEventListener('resize', locate);
});
</script>

<style scoped>
.arc-dock {
  pointer-events: none;
}

.arc-dock.is-shown > * {
  pointer-events: auto;
}

/* ---- the seat ---- */
.arc-dock__seat {
  position: fixed;
  z-index: 1001;
  width: 40px;
  height: 40px;
  opacity: 0;
  transform: translateY(-6px) scale(.6);
  transition: opacity .3s ease, transform .45s cubic-bezier(.2, .9, .25, 1);
}

.is-shown .arc-dock__seat {
  opacity: 1;
  transform: none;
}

.arc-dock .arc-dock__seat.is-away {
  visibility: hidden;
  opacity: 0;
  transition: none;
}

.arc-dock__orb {
  all: unset;
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  cursor: pointer;
  perspective: 300px;
  background: radial-gradient(circle at 50% 42%, color-mix(in oklab, var(--acc) 34%, #17171d), #0d0d11 76%);
  box-shadow:
    inset 0 0 0 1.5px color-mix(in oklab, var(--acc) 85%, transparent),
    0 0 18px color-mix(in oklab, var(--acc) 30%, transparent);
  transition: box-shadow .25s ease, transform .3s cubic-bezier(.2, .9, .25, 1);
}

.arc-dock__orb:hover {
  transform: scale(1.06);
  box-shadow:
    inset 0 0 0 1.5px var(--acc),
    0 0 26px color-mix(in oklab, var(--acc) 50%, transparent);
}

.arc-dock__orb:focus-visible {
  outline: 2px solid var(--arc-ink);
  outline-offset: 3px;
}

.arc-dock__face {
  display: grid;
  place-items: center;
  animation: arc-dock-flip .7s cubic-bezier(.2, .8, .2, 1);
}

.arc-dock__face img {
  width: 30px;
  height: 30px;
}

/* Before the first draw: a face-down card. */
.arc-dock__back {
  width: 15px;
  height: 22px;
  fill: none;
  stroke: var(--acc);
  stroke-width: 1.6;
}

.arc-dock__back-pupil {
  fill: var(--acc);
  stroke: none;
}

@keyframes arc-dock-flip {
  from { transform: rotateY(180deg) scale(.7); opacity: .2; }
  to { transform: none; opacity: 1; }
}

/* A small redraw mark, so the sigil reads as an action. */
.arc-dock__badge {
  position: absolute;
  right: -3px;
  bottom: -3px;
  display: grid;
  place-items: center;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background: var(--acc-solid);
  box-shadow: 0 0 0 2px var(--arc-bg);
  transition: transform .4s cubic-bezier(.2, .9, .25, 1);
}

.arc-dock__badge svg {
  width: 10px;
  height: 10px;
  fill: none;
  stroke: var(--arc-on-acc);
  stroke-width: 3.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.arc-dock__orb:hover .arc-dock__badge,
.arc-dock__orb:focus-visible .arc-dock__badge {
  transform: rotate(-120deg);
}

/* ---- the tooltip: your card, and what the button does ---- */
.arc-dock__tip {
  position: absolute;
  top: calc(100% + 12px);
  right: -6px;
  display: grid;
  gap: 2px;
  min-width: 150px;
  max-width: 220px;
  padding: 9px 12px 10px;
  border-radius: 10px;
  background: var(--arc-pop);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--acc-ink) 35%, transparent), 0 14px 30px var(--arc-shadow);
  text-align: left;
  pointer-events: none;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity .2s ease, transform .25s ease;
}

.arc-dock__seat:hover .arc-dock__tip,
.arc-dock__seat:has(:focus-visible) .arc-dock__tip {
  opacity: 1;
  transform: none;
}

.arc-dock__tip-label {
  font-family: var(--arc-caps);
  font-size: 9.5px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--arc-muted);
}

.arc-dock__tip-name {
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: 15px;
  color: var(--arc-ink);
}

.arc-dock__tip-action {
  margin-top: 4px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--acc-ink);
}

/* ---- the spread: four small cards in the right gutter ---- */
.arc-dock__spread {
  position: fixed;
  z-index: 950;
  right: 18px;
  top: 50%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  opacity: 0;
  translate: 12px -50%;
  transition: opacity .35s ease, translate .5s cubic-bezier(.2, .8, .2, 1);
}

.is-shown .arc-dock__spread {
  opacity: 1;
  translate: 0 -50%;
}

.arc-dock__spot {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px;
  border-radius: 6px;
  color: var(--arc-muted);
  font-family: var(--arc-caps);
  font-size: 10px;
  letter-spacing: .08em;
  text-transform: uppercase;
  transition: color .2s;
}

.arc-dock__spot:hover,
.arc-dock__spot:focus-visible {
  color: var(--arc-ink);
}

.arc-dock__spot.is-active {
  color: var(--acc-ink);
}

.arc-dock__spot-card {
  display: grid;
  place-items: center;
  width: 20px;
  height: 32px;
  border: 1.5px solid currentColor;
  border-radius: 3px;
  background: color-mix(in srgb, var(--arc-bg) 70%, transparent);
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-size: 8.5px;
  letter-spacing: 0;
  transition: transform .4s cubic-bezier(.2, .8, .2, 1), background-color .3s, color .3s;
}

.arc-dock__spot.is-active .arc-dock__spot-card {
  background: var(--acc-solid);
  border-color: var(--acc-solid);
  color: var(--arc-on-acc);
  transform: rotate(-8deg) scale(1.15);
}

/* The name pops out to the left only while pointed at, so it never sits on the page. */
.arc-dock__spot-name {
  position: absolute;
  right: calc(100% + 8px);
  padding: 5px 9px;
  border-radius: 99px;
  background: color-mix(in srgb, var(--arc-bg) 92%, transparent);
  white-space: nowrap;
  opacity: 0;
  translate: 6px 0;
  pointer-events: none;
  transition: opacity .25s, translate .3s;
}

.arc-dock__spot:hover .arc-dock__spot-name,
.arc-dock__spot:focus-visible .arc-dock__spot-name {
  opacity: 1;
  translate: 0 0;
}

.arc-dock__spot:focus-visible {
  outline: 2px solid var(--arc-ink);
  outline-offset: 2px;
}

/* The gutter is only wide enough for the spread on wide screens. */
/* Light theme: the spread floats over paper and over the dark potion story alike, so its
   little cards keep the dark theme's look (dark faces, light rims, the card's own accent)
   and read on both. */
:root[data-theme="parchment"] .arc-dock__spread {
  --arc-bg: #0b0b0e;
  --arc-ink: #efeef3;
  --arc-muted: #a7a6b2;
  --arc-on-acc: #0b0b0e;
  --acc-ink: var(--acc);
  --acc-solid: var(--acc);
}

:root[data-theme="parchment"] .arc-dock__spot:not(.is-active) .arc-dock__spot-card {
  background: color-mix(in srgb, var(--arc-bg) 88%, transparent);
  box-shadow: 0 4px 10px rgba(46, 36, 58, .18);
}

@media (max-width: 1279px) {
  .arc-dock__spread {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .arc-dock__seat,
  .arc-dock__spread,
  .arc-dock__face,
  .arc-dock__badge {
    transition: none;
    animation: none;
  }
}
</style>
