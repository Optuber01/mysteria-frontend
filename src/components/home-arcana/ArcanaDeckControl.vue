<template>
  <!--
    Persistent deck, once the hero's table has scrolled away: your card as a small
    sigil that redraws (a face-down card that draws, before the first draw), seated in
    the header's free space beside its actions (so it never covers the page).
  -->
  <aside class="arc-dock" :class="{'is-shown': visible}" :aria-label="t('home.arcana.dock.label')" :inert="!visible || undefined">
    <!-- Only ever in the header: with no free room there it steps away rather than cover the page. -->
    <div class="arc-dock__seat" :class="{'is-away': !seat}" :style="seatStyle" :inert="!seat || undefined">
      <button
          type="button"
          class="arc-dock__orb"
          :aria-label="orbLabel"
          :aria-describedby="tipId"
          @click="draw(undefined, {crossfade: true})"
      >
        <!-- A redraw turns the old card away edge-on, then the new one in: never a mirrored face. -->
        <Transition name="arc-dock-turn" mode="out-in">
          <span :key="drawCount" class="arc-dock__face" aria-hidden="true">
            <img v-if="hasDrawn" :src="sigilThumb(card.id)" alt="" width="64" height="64" decoding="async">
            <svg v-else class="arc-dock__back" viewBox="0 0 20 30">
              <rect x="1" y="1" width="18" height="28" rx="2.5"/>
              <circle cx="10" cy="15" r="4.2"/>
              <circle cx="10" cy="15" r="1.3" class="arc-dock__back-pupil"/>
            </svg>
          </span>
        </Transition>
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

const pastHero = ref(false);
const navOpen = ref(false);
/** The Pathways orbit is a deck control of its own: step aside while it is on screen. */
const atOrbit = ref(false);
const visible = computed(() => pastHero.value && !navOpen.value && !atOrbit.value);

/* ---------------- the seat: the header's free space, left of its actions ---------------- */
/** The header's control height (its chip, language and theme buttons). */
const ORB = 36;
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
  const orbit = document.getElementById('deck');
  if (orbit) orbitObserver.observe(orbit);

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
  width: 36px;
  height: 36px;
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
  /* the header controls' look: a surface fill tinted by the card, a hairline in the accent */
  background: color-mix(in oklab, var(--acc) 10%, var(--arc-surface));
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line-acc);
  transition: background-color .25s ease, box-shadow .25s ease, transform .3s cubic-bezier(.2, .8, .2, 1);
}

/* the header's hover: lift 2px, the edge hot, a little more of the accent */
.arc-dock__orb:hover {
  transform: translateY(-2px);
  background: color-mix(in oklab, var(--acc) 18%, var(--arc-surface));
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line-hot);
}

.arc-dock__orb:active {
  transform: scale(.98);
  transition-duration: .08s;
}

.arc-dock__orb:focus-visible {
  outline: var(--arc-focus-w) solid var(--arc-ink);
  outline-offset: var(--arc-focus-off);
}

.arc-dock__face {
  display: grid;
  place-items: center;
}

/* The turn: out to edge-on (ease in), then the new face from edge-on (ease out). */
.arc-dock-turn-leave-active {
  transition: transform .16s cubic-bezier(.5, 0, .9, .5), opacity .16s ease-in;
}

.arc-dock-turn-enter-active {
  transition: transform .34s cubic-bezier(.15, .7, .3, 1), opacity .2s ease-out;
}

.arc-dock-turn-leave-to {
  transform: rotateY(-90deg) scale(.86);
  opacity: .4;
}

.arc-dock-turn-enter-from {
  transform: rotateY(90deg) scale(.86);
  opacity: .4;
}

.arc-dock__face img {
  width: 26px;
  height: 26px;
}

/* Before the first draw: a face-down card. */
.arc-dock__back {
  width: 15px;
  height: 22px;
  fill: none;
  stroke: var(--acc-ink);
  stroke-width: 1.6;
}

.arc-dock__back-pupil {
  fill: var(--acc-ink);
  stroke: none;
}

/* A small redraw mark, so the sigil reads as an action. */
.arc-dock__badge {
  position: absolute;
  right: -3px;
  bottom: -3px;
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
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
  border-radius: var(--arc-r-md);
  background: var(--arc-pop);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line-acc), 0 14px 30px var(--arc-shadow);
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
  font-size: 11px;
  letter-spacing: .14em;
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
  font-size: var(--arc-fs-caption);
  font-weight: 600;
  color: var(--acc-ink);
}

@media (prefers-reduced-motion: reduce) {
  .arc-dock__seat,
  .arc-dock-turn-enter-active,
  .arc-dock-turn-leave-active,
  .arc-dock__badge {
    transition: none;
    animation: none;
  }
}

/* While the page crossfades into a new accent (useArcana), the deck keeps its own live
   layer, so its turn plays crisply instead of under the fading snapshot. */
:root.arc-recolour .arc-dock__seat {
  view-transition-name: arc-dock;
}
</style>

<style>
::view-transition-group(arc-dock),
::view-transition-new(arc-dock) {
  animation: none;
}

::view-transition-old(arc-dock) {
  display: none;
}
</style>
