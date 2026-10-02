<template>
  <section
      class="tarot-hero"
      :class="{ 'is-ready': isReady, 'is-dealt': dealt }"
      aria-labelledby="home-title"
  >
    <div class="th-backdrop" aria-hidden="true">
      <div class="th-light"></div>
      <div class="th-fog th-fog--far"></div>
      <div class="th-fog th-fog--near"></div>
    </div>

    <div class="th-copy">
      <p class="fog-label">{{ t('home.heroVariants.tarot.kicker') }}</p>
      <h1 id="home-title" class="th-title">
        <span>{{ t('home.hero.headlineLead') }}</span>
        <span class="th-title__accent">{{ t('home.hero.headlineAccent') }}</span>
      </h1>
      <p class="th-summary">{{ t('home.heroVariants.tarot.summary') }}</p>

      <div class="th-actions">
        <RouterLink class="fog-button" :to="$lp('/guide/connect')">
          {{ t('home.hero.primaryCta') }}
          <span aria-hidden="true">→</span>
        </RouterLink>
        <a class="fog-button fog-button--ghost" href="#pathways">{{ t('homePage.heroSecondaryCta') }}</a>
      </div>

      <div class="th-address" :class="`is-${copyState}`">
        <span class="th-address__dot" :class="`is-${status.state}`" aria-hidden="true"></span>
        <span class="th-address__label">{{ copyLabel }}</span>
        <strong ref="addressRef" class="th-address__value">{{ SERVER_IP }}</strong>
        <button type="button" class="th-address__copy" :aria-label="copyButtonLabel" @click="copy">
          <svg v-if="copyState === 'copied'" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7"/></svg>
          <svg v-else-if="copyState === 'failed'" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v6M12 17v.5"/></svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15V6a1 1 0 0 1 1-1h9"/></svg>
        </button>
        <span class="visually-hidden" aria-live="polite">{{ copyAnnouncement }}</span>
      </div>
    </div>

    <!-- The hand: twenty-two Major Arcana, one per Pathway, the Fool already drawn. -->
    <div
        ref="handRef"
        class="th-hand"
        :style="handStyle"
        @pointerenter="wantFaces"
        @pointermove="onHandPointer"
        @focusin="wantFaces"
    >
      <svg v-if="layout" class="th-dial" :viewBox="`0 0 ${layout.w} ${layout.h}`" aria-hidden="true">
        <path :d="layout.dial" fill="none" stroke="rgba(236, 230, 218, .14)"/>
        <line
            v-for="(tick, index) in layout.ticks"
            :key="index"
            :x1="tick.x1" :y1="tick.y1" :x2="tick.x2" :y2="tick.y2"
            :class="{ 'is-active': index === active }"
            class="th-tick"
        />
      </svg>

      <p class="th-hint" aria-hidden="true">{{ t(isCoarse ? 'home.heroVariants.tarot.hintTouch' : 'home.heroVariants.tarot.hint') }}</p>

      <ul class="th-cards" :aria-label="t('home.heroVariants.tarot.handLabel')" @keydown="onKeydown">
        <li
            v-for="(card, index) in hand"
            :key="card.id"
            class="th-card"
            :class="{ 'is-active': index === active, 'is-fool': card.id === 'fool' }"
            :style="cardStyle(index)"
        >
          <RouterLink v-slot="{ href, navigate }" :to="$lp(card.route)" custom>
            <a
                :ref="el => setCardRef(el, index)"
                class="th-card__link"
                :href="href"
                :tabindex="index === active ? 0 : -1"
                :aria-label="cardLabel(card)"
                :aria-current="index === active ? 'true' : undefined"
                @click="onCardClick($event, index, navigate)"
                @focus="active = index"
            >
              <span class="th-card__flip">
                <span class="th-card__back" aria-hidden="true">
                  <b class="th-card__numeral">{{ numeralOf(card) }}</b>
                  <i class="th-card__eye"></i>
                </span>
                <span class="th-card__face" aria-hidden="true">
                  <span class="th-card__seq">{{ sequenceOf(card) }}</span>
                  <img
                      v-if="facesWanted || card.id === 'fool'"
                      class="th-card__sigil"
                      :src="card.thumbnail"
                      alt=""
                      width="256"
                      height="256"
                      :loading="card.id === 'fool' ? 'eager' : 'lazy'"
                      decoding="async"
                  >
                  <span class="th-card__name">{{ nameOf(card) }}</span>
                </span>
              </span>
            </a>
          </RouterLink>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, type ComponentPublicInstance, type CSSProperties} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {useReducedMotion} from '@/composables/useReducedMotion';
import type {ServerStatus} from '@/composables/useSharedServerStatus';
import {localize, standardPathways, type HomePathway} from '@/data/homePathways';
import {fill, useHeroAddress} from './useHeroAddress';

defineProps<{ status: ServerStatus; latestSlug?: string | null }>();

const {t, currentLanguage} = useI18n();
const reducedMotion = useReducedMotion();
const handRef = ref<HTMLElement | null>(null);
const addressRef = ref<HTMLElement | null>(null);
const isReady = ref(false);
const dealt = ref(false);
const facesWanted = ref(false);
const isCoarse = ref(false);
const {
  SERVER_IP, copyState, copy,
  label: copyLabel, buttonLabel: copyButtonLabel, announcement: copyAnnouncement,
} = useHeroAddress(addressRef);

/* The Fool sits in the middle of the hand; the rest keep archive order. */
const others = standardPathways.filter((entry) => entry.id !== 'fool');
const fool = standardPathways.find((entry) => entry.id === 'fool');
const hand: HomePathway[] = fool ? [...others.slice(0, 10), fool, ...others.slice(10)] : others;
const FOOL_INDEX = Math.max(0, hand.findIndex((entry) => entry.id === 'fool'));
const CENTER = (hand.length - 1) / 2;
const active = ref(FOOL_INDEX);

/* Same numbering as the pathway chapter's table: the Fool is 0, the rest I-XXI in archive order. */
const ROMAN: Array<[number, string]> = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
function numeralOf(entry: HomePathway) {
  let value = entry.id === 'fool' ? 0 : others.indexOf(entry) + 1;
  if (value === 0) return '0';
  let out = '';
  for (const [unit, glyph] of ROMAN) while (value >= unit) { out += glyph; value -= unit; }
  return out;
}

const nameOf = (entry: HomePathway) => localize(entry.name, currentLanguage.value);
function sequenceOf(entry: HomePathway) {
  const start = entry.startingSequence;
  if (!start) return '';
  return fill(t('home.heroVariants.tarot.sequence'), {
    number: start.number,
    name: localize(start.name, currentLanguage.value),
  });
}
const cardLabel = (entry: HomePathway) => fill(t('home.heroVariants.tarot.cardLabel'), {
  name: nameOf(entry),
  sequence: sequenceOf(entry),
});

/* ---- The fan: every card hangs off one pivot below the hand ---- */

const size = ref<{ w: number; h: number } | null>(null);

const SPREAD = 40 * Math.PI / 180;
/* How far the drawn card rises out of the hand, as a share of its height. */
const LIFT = .3;

const layout = computed(() => {
  if (!size.value) return null;
  const {w, h} = size.value;
  const cardW = Math.round(Math.max(60, Math.min(w * .21, h * .24, 156)));
  const cardH = Math.round(cardW * 1.62);
  // A real hand: wide spread, short radius, every card hanging off one grip point.
  const topR = Math.max((w / 2 - cardW * .95) / Math.sin(SPREAD), cardH * 1.7);
  const lift = cardH * (LIFT + .08);
  const below = topR * (1 - Math.cos(SPREAD)) + cardH * Math.cos(SPREAD) + cardW / 2 * Math.sin(SPREAD);
  const hintRoom = 44;
  const group = lift + below + hintRoom;
  const cardTop = Math.max(lift + 8, (h - group) / 2 + lift);
  const pivotY = cardTop + topR;
  const bottomR = topR - cardH;
  const step = (SPREAD * 2) / (hand.length - 1);
  const dialR = topR + 22;
  const cx = w / 2;
  const polar = (angle: number, radius: number) => [cx + Math.sin(angle) * radius, pivotY - Math.cos(angle) * radius];
  const ticks = hand.map((_, index) => {
    const angle = (index - CENTER) * step;
    const [x1, y1] = polar(angle, dialR);
    const [x2, y2] = polar(angle, dialR + 9);
    return {x1, y1, x2, y2};
  });
  const edge = SPREAD + .1;
  const [ax, ay] = polar(-edge, dialR);
  const [bx, by] = polar(edge, dialR);
  const dial = `M${ax.toFixed(1)} ${ay.toFixed(1)}A${dialR.toFixed(1)} ${dialR.toFixed(1)} 0 0 1 ${bx.toFixed(1)} ${by.toFixed(1)}`;
  const hintY = cardTop + below + 16;
  return {w, h, cardW, cardH, cardTop, pivotY, topR, bottomR, step, dial, ticks, hintY};
});

type CssVars = CSSProperties & Record<`--${string}`, string>;

const handStyle = computed<CssVars>(() => {
  const l = layout.value;
  if (!l) return {} as CssVars;
  return {
    '--card-w': `${l.cardW}px`,
    '--card-h': `${l.cardH}px`,
    '--card-top': `${l.cardTop.toFixed(1)}px`,
    '--hint-y': `${l.hintY.toFixed(1)}px`,
    '--pivot': `${l.topR.toFixed(1)}px`,
  };
});

function cardStyle(index: number): CSSProperties & Record<`--${string}`, string> {
  const step = layout.value?.step ?? 0;
  const angle = (index - CENTER) * step * 180 / Math.PI;
  return {
    '--a': `${angle.toFixed(2)}deg`,
    '--deal-delay': `${(Math.abs(index - CENTER) * 28).toFixed(0)}ms`,
    // Like a hand held in the right hand: each card overlaps the one to its left.
    zIndex: index === active.value ? 40 : index + 1,
  };
}

/* ---- Drawing a card ---- */

const cardRefs: Array<HTMLAnchorElement | null> = [];
function setCardRef(el: Element | ComponentPublicInstance | null, index: number) {
  cardRefs[index] = el instanceof HTMLAnchorElement ? el : null;
}

function wantFaces() {
  facesWanted.value = true;
}

/* The pointer's bearing from the pivot picks the card, so thin slivers are easy to hit. */
function onHandPointer(event: PointerEvent) {
  const l = layout.value;
  const hand = handRef.value;
  if (!l || !hand || event.pointerType !== 'mouse') return;
  const bounds = hand.getBoundingClientRect();
  const x = event.clientX - bounds.left - l.w / 2;
  const y = l.pivotY - (event.clientY - bounds.top);
  const radius = Math.hypot(x, y);
  if (radius < l.bottomR * .9) return;
  const index = Math.round(Math.atan2(x, y) / l.step + CENTER);
  if (index >= 0 && index < cardRefs.length) active.value = index;
}

/* On touch the first tap turns the card over; the second opens its archive. */
function onCardClick(event: MouseEvent, index: number, navigate: (e?: MouseEvent) => unknown) {
  if (index !== active.value) {
    event.preventDefault();
    active.value = index;
    wantFaces();
    return;
  }
  navigate(event);
}

function onKeydown(event: KeyboardEvent) {
  const moves: Record<string, number> = {ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1};
  let next: number | null = null;
  if (event.key in moves) next = (active.value + moves[event.key] + hand.length) % hand.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = hand.length - 1;
  if (next === null) return;
  event.preventDefault();
  active.value = next;
  wantFaces();
  cardRefs[next]?.focus();
}

let resizeObserver: ResizeObserver | null = null;
let facesTimer: ReturnType<typeof setTimeout> | null = null;
let dealTimer: ReturnType<typeof setTimeout> | null = null;

function measure() {
  const node = handRef.value;
  if (node) size.value = {w: node.clientWidth, h: node.clientHeight};
}

onMounted(() => {
  isCoarse.value = window.matchMedia('(pointer: coarse)').matches;
  measure();
  resizeObserver = new ResizeObserver(measure);
  if (handRef.value) resizeObserver.observe(handRef.value);
  requestAnimationFrame(() => {
    isReady.value = true;
    // The deal waits a beat so the reader sees the cards fan out.
    dealTimer = setTimeout(() => {
      dealt.value = true;
    }, reducedMotion.value ? 0 : 250);
  });
  // The other twenty-one faces follow once the page has settled.
  facesTimer = setTimeout(wantFaces, 3500);
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  if (facesTimer) clearTimeout(facesTimer);
  if (dealTimer) clearTimeout(dealTimer);
});
</script>

<style scoped>
.tarot-hero {
  position: relative;
  min-height: max(700px, 100svh);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.08fr);
  align-items: stretch;
  column-gap: clamp(16px, 3vw, 48px);
  padding:
      calc(var(--home-header-height, 68px) + clamp(24px, 5vh, 56px))
      var(--home-content-gutter, clamp(20px, 4vw, 56px))
      0;
  overflow: hidden;
  color: var(--bone);
  background: var(--fog-0);
  isolation: isolate;
}

/* ---- Backdrop: candle-dark room, fog drifting through ---- */
.th-backdrop,
.th-light {
  position: absolute;
  inset: 0;
}

.th-backdrop {
  z-index: -1;
  pointer-events: none;
}

.th-light {
  background:
      radial-gradient(ellipse 34% 46% at 74% 46%, rgba(236, 230, 218, .1), transparent 70%),
      radial-gradient(ellipse 22% 22% at 74% 30%, rgba(179, 32, 43, .12), transparent 75%),
      linear-gradient(180deg, #06070a 0%, var(--fog-1) 60%, var(--fog-0) 100%);
}

.th-fog {
  position: absolute;
  left: 0;
  width: 200%;
  background: url('./assets/fog-bank.webp') repeat-x 0 50% / 50% 100%;
  mix-blend-mode: screen;
  animation: th-drift 110s linear infinite;
}

.th-fog--far {
  top: 18%;
  height: 40%;
  opacity: .16;
}

.th-fog--near {
  bottom: -6%;
  height: 34%;
  opacity: .3;
  animation-duration: 70s;
  animation-direction: reverse;
}

@keyframes th-drift {
  to { transform: translate3d(-50%, 0, 0); }
}

/* ---- Copy ---- */
.th-copy {
  position: relative;
  z-index: 2;
  align-self: center;
  max-width: 600px;
  padding-bottom: clamp(32px, 7vh, 72px);
}

.th-copy > * {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity .8s ease, transform .8s var(--ease-out);
}

.is-ready .th-copy > * {
  opacity: 1;
  transform: none;
}

.is-ready .th-copy > :nth-child(2) { transition-delay: .08s; }
.is-ready .th-copy > :nth-child(3) { transition-delay: .2s; }
.is-ready .th-copy > :nth-child(4) { transition-delay: .3s; }
.is-ready .th-copy > :nth-child(5) { transition-delay: .38s; }

.th-title {
  display: grid;
  margin: 20px 0;
  color: var(--bone);
  font: 800 clamp(3.4rem, 7.2vw, 7.6rem)/.86 var(--font-display);
  letter-spacing: .005em;
  text-transform: uppercase;
}

.th-title__accent {
  color: var(--crimson-text);
}

.th-summary {
  max-width: 44ch;
  margin: 0;
  color: var(--ash);
  font-size: clamp(1rem, 1.2vw, 1.12rem);
  line-height: 1.6;
}

.th-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 30px;
}

/* ---- Address ---- */
.th-address {
  width: fit-content;
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding: 6px 6px 6px 16px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(13, 15, 20, .7);
  transition: border-color .2s ease;
}

.th-address.is-copied { border-color: rgba(76, 195, 138, .6); }
.th-address.is-failed { border-color: var(--crimson-text); }

.th-address__dot {
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 50%;
  background: var(--ash-dim);
}

.th-address__dot.is-online {
  background: var(--live);
  box-shadow: 0 0 0 4px rgba(76, 195, 138, .16);
}

.th-address__dot.is-offline { background: var(--crimson-text); }

.th-address__label {
  color: var(--ash);
  font: 500 .72rem/1 var(--font-mono);
  letter-spacing: .12em;
  text-transform: uppercase;
}

.is-copied .th-address__label { color: var(--live); }
.is-failed .th-address__label { color: var(--crimson-text); }

.th-address__value {
  color: var(--bone);
  font: 500 .92rem/1 var(--font-mono);
  user-select: all;
}

.th-address__copy {
  width: 44px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 999px;
  color: var(--bone);
  background: var(--fog-3);
  cursor: pointer;
  transition: background-color .2s ease;
}

.th-address__copy:hover { background: #2a2f3a; }
.th-address__copy:active { background: var(--crimson-deep); }

.th-address__copy svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* ---- The hand ---- */
.th-hand {
  position: relative;
  min-height: 420px;
  margin-right: calc(var(--home-content-gutter, clamp(20px, 4vw, 56px)) * -1);
  perspective: 1400px;
}

.th-dial {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  opacity: 0;
  transition: opacity 1.2s ease .6s;
}

.is-dealt .th-dial { opacity: 1; }

.th-tick {
  stroke: rgba(236, 230, 218, .26);
  stroke-width: 1;
  transition: stroke .25s ease;
}

.th-tick.is-active {
  stroke: var(--crimson-text);
  stroke-width: 2;
}

.th-hint {
  position: absolute;
  top: var(--hint-y);
  left: 0;
  right: 0;
  margin: 0;
  color: var(--ash);
  font: 500 .68rem/1.4 var(--font-mono);
  letter-spacing: .14em;
  text-align: center;
  text-transform: uppercase;
}

.th-cards {
  margin: 0;
  padding: 0;
  list-style: none;
}

.th-card {
  position: absolute;
  top: var(--card-top);
  left: calc(50% - var(--card-w) / 2);
  width: var(--card-w);
  height: var(--card-h);
  transform-origin: 50% var(--pivot);
  /* Before the deal, the deck sits squared up in the middle. */
  transform: rotate(0deg) translate3d(0, 18%, 0);
  opacity: 0;
  transition:
      transform .9s var(--ease-out) var(--deal-delay),
      opacity .4s ease var(--deal-delay);
}

.is-dealt .th-card {
  transform: rotate(var(--a));
  opacity: 1;
}

.th-card__link {
  position: absolute;
  inset: 0;
  display: block;
  border-radius: 10px;
  color: var(--bone);
  text-decoration: none;
  perspective: 900px;
  transition: transform .45s var(--ease-out);
}

/* The drawn card rises out of the hand along its own axis. */
.is-dealt .th-card.is-active .th-card__link {
  transform: translate3d(0, calc(var(--card-h) * -.3), 0) rotate(calc(var(--a) * -.5)) scale(1.14);
}

.th-card__flip {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transition: transform .6s var(--ease-out);
}

.is-dealt .th-card.is-active .th-card__flip {
  transform: rotateY(180deg);
}

.th-card__back,
.th-card__face {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  box-shadow: -6px 10px 28px rgba(0, 0, 0, .6), 0 0 0 1px rgba(236, 230, 218, .26);
}

/* Card back: a framed eye over fine hatching, the club's crest. */
.th-card__back {
  background:
      radial-gradient(circle at 50% 50%, transparent 0 22%, rgba(236, 230, 218, .18) 22.5% 23.2%, transparent 23.8% 31%, rgba(236, 230, 218, .1) 31.5% 32%, transparent 32.5%),
      repeating-linear-gradient(45deg, rgba(236, 230, 218, .035) 0 1px, transparent 1px 6px),
      repeating-linear-gradient(-45deg, rgba(236, 230, 218, .035) 0 1px, transparent 1px 6px),
      linear-gradient(100deg, #262a33 0%, #1a1d24 30%, #121419 100%);
}

/* The index sits in the corner, so it still reads on the sliver a fanned card shows. */
.th-card__numeral {
  position: absolute;
  top: 9%;
  left: 10%;
  z-index: 1;
  color: var(--bone);
  font: 800 calc(var(--card-w) * .12)/1 var(--font-display);
  letter-spacing: .08em;
  writing-mode: vertical-rl;
  text-orientation: sideways;
  opacity: .78;
}

.th-card.is-fool .th-card__numeral {
  color: var(--crimson-text);
  opacity: 1;
}

.th-card__back::before {
  content: "";
  position: absolute;
  inset: 6%;
  border: 1px solid rgba(236, 230, 218, .2);
  border-radius: 6px;
}

.th-card__eye {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40%;
  aspect-ratio: 2 / 1;
  border: 1px solid rgba(236, 230, 218, .4);
  border-radius: 100% 0;
  transform: translate(-50%, -50%) rotate(45deg) scale(.72);
}

.th-card__eye::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 34%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--crimson);
  transform: translate(-50%, -50%);
}

/* Card face: the sigil, the Pathway and its first Sequence. */
.th-card__face {
  display: grid;
  grid-template-rows: auto 1fr auto;
  justify-items: center;
  align-items: center;
  padding: 10% 8% 9%;
  background:
      radial-gradient(circle at 50% 45%, rgba(236, 230, 218, .12), transparent 60%),
      linear-gradient(180deg, #1c2028, #101217);
  transform: rotateY(180deg);
  overflow: hidden;
}

.th-card__face::before {
  content: "";
  position: absolute;
  inset: 5%;
  border: 1px solid rgba(236, 230, 218, .22);
  border-radius: 6px;
}

.th-card__seq {
  max-width: 100%;
  color: var(--ash);
  font: 500 calc(var(--card-w) * .062)/1.2 var(--font-mono);
  letter-spacing: .1em;
  text-align: center;
  text-transform: uppercase;
}

.th-card__sigil {
  width: 82%;
  height: auto;
  aspect-ratio: 1;
  object-fit: contain;
}

.th-card__name {
  max-width: 100%;
  color: var(--bone);
  font: 800 calc(var(--card-w) * .15)/.9 var(--font-display);
  text-align: center;
  text-transform: uppercase;
}

.th-card.is-active .th-card__face {
  box-shadow: 0 24px 60px rgba(0, 0, 0, .6), 0 0 0 1px var(--crimson-text);
}

.th-card__link:focus-visible {
  outline: 2px solid var(--crimson-text);
  outline-offset: 4px;
}

.tarot-hero :focus-visible {
  outline: 2px solid var(--crimson-text);
  outline-offset: 3px;
}

/* ---- Narrow: copy first, the hand below ---- */
@media (max-width: 860px) {
  .tarot-hero {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    row-gap: 4px;
    padding-top: calc(var(--home-header-height, 68px) + 8px);
    padding-bottom: 40px;
  }

  .th-copy {
    padding-bottom: 0;
  }

  /* The hand leads on phones: it is the idea, so it gets the first screen. */
  .th-hand {
    order: -1;
    min-height: 280px;
    margin: 0 calc(var(--home-content-gutter, clamp(20px, 4vw, 56px)) * -1);
  }

  .th-light {
    background:
        radial-gradient(ellipse 70% 26% at 50% 22%, rgba(236, 230, 218, .1), transparent 70%),
        linear-gradient(180deg, #06070a 0%, var(--fog-1) 60%, var(--fog-0) 100%);
  }
}

@media (max-width: 560px) {
  .th-actions .fog-button {
    flex: 1 1 100%;
  }

  .th-title {
    margin: 14px 0;
  }

  .th-hint {
    letter-spacing: .1em;
  }

  .th-actions {
    margin-top: 22px;
  }

  .th-address__label {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .th-fog { animation: none; }
  .th-copy > * {
    opacity: 1;
    transform: none;
    transition: none;
  }
  .th-card,
  .th-card__link,
  .th-card__flip,
  .th-dial {
    transition: none;
  }
}
</style>
