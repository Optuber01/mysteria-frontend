<template>
  <!--
    The deck, laid out as an orbit of seals. The checked seal is the drawn card:
    it is lifted out of the ring into the centre, and the whole page wears it.
  -->
  <section
      id="deck"
      class="arc-section arc-orbit"
      :class="{'is-dial': geo.dial, 'is-dragging': dragging, 'is-still': reducedMotion}"
      aria-labelledby="arc-deck-title"
  >
    <div class="arc-shell">
      <div class="arc-orbit__head">
        <ArcanaSectionHead title-id="arc-deck-title">
          <template #title>{{ t('home.arcana.deck.titleA') }} <em>{{ t('home.arcana.deck.titleB') }}</em></template>
        </ArcanaSectionHead>
        <div class="arc-orbit__aside">
          <div class="arc-orbit__tabs" role="tablist" :aria-label="t('home.arcana.deck.tabsLabel')" @keydown="onTabKeydown">
            <button
                v-for="option in kinds"
                :id="tabId(option.id)"
                :key="option.id"
                type="button"
                role="tab"
                :aria-selected="kind === option.id"
                aria-controls="reading"
                :tabindex="kind === option.id ? 0 : -1"
                @click="chooseKind(option.id)"
            >
              {{ option.label }} <b>{{ option.count }}</b>
            </button>
          </div>
        </div>
      </div>

      <div id="reading" class="arc-orbit__panel" role="tabpanel" :aria-labelledby="tabId(kind)">
        <div
            ref="stageRef"
            class="arc-orbit__stage"
            :style="stageStyle"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
            @pointerleave="onPointerLeave"
            @click.capture="swallowDragClick"
        >
          <Transition :css="false" @enter="onGlowEnter" @leave="onGlowLeave">
            <div :key="`glow-${card.id}`" class="arc-orbit__glow" :style="{'--orb-acc': card.accent}" aria-hidden="true"></div>
          </Transition>
          <div class="arc-orbit__track" aria-hidden="true"></div>

          <!-- The drawn seal: a change dissolves the old one into the new, in place -->
          <Transition :css="false" @before-leave="onCentreBeforeLeave" @enter="onCentreEnter" @leave="onCentreLeave">
            <div :key="card.id" class="arc-orbit__centre" :style="{'--orb-acc': card.accent}">
              <span ref="centreSealRef" class="arc-orbit__drawn" aria-hidden="true">
                <img :src="sigilNative(card.id)" alt="" width="512" height="512" decoding="async" draggable="false">
              </span>
              <h3 id="arc-orbit-name" class="arc-orbit__name">{{ nameOf(card.id) }}</h3>
            </div>
          </Transition>

          <Transition :css="false" @before-leave="onRingBeforeLeave" @enter="onRingEnter" @leave="onRingLeave">
            <div
                ref="ringRef"
                :key="kind"
                class="arc-orbit__ring"
                role="radiogroup"
                :aria-label="kind === 'boon' ? t('home.arcana.deck.ringBoons') : t('home.arcana.deck.ringPathways')"
                @keydown="onRingKeydown"
                @focusin="focusInside = true"
                @focusout="focusInside = false"
            >
              <button
                  v-for="(item, index) in catalog"
                  :key="item.id"
                  type="button"
                  role="radio"
                  class="arc-seal"
                  :class="{'is-drawn': index === selectedIndex}"
                  :style="{'--tok': item.accent}"
                  :data-index="index"
                  :tabindex="index === selectedIndex ? 0 : -1"
                  :aria-checked="index === selectedIndex"
                  :aria-label="`${numeralLabel(item)}. ${nameOf(item.id)}, ${roleLine(item.id)}`"
                  @click="onSealClick(index)"
                  @pointerenter="warm(item.id)"
                  @focus="warm(item.id)"
              >
                <span class="arc-seal__orb">
                  <img :src="sigilThumb(item.id)" alt="" width="128" height="128" decoding="async" draggable="false" :loading="index < 8 ? 'eager' : 'lazy'">
                </span>
                <span class="arc-seal__label" aria-hidden="true">{{ nameOf(item.id) }}</span>
              </button>
            </div>
          </Transition>
        </div>

        <div class="arc-orbit__controls">
          <button type="button" class="arc-orbit__step" :aria-label="t('home.arcana.deck.previous')" @click="step(-1)">
            <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
          </button>
          <button type="button" class="arc-orbit__step" :aria-label="t('home.arcana.deck.next')" @click="step(1)">
            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </button>
          <span class="arc-sr" aria-live="polite">{{ announcement }}</span>
        </div>

        <!-- The dossier: the drawn card's reading -->
        <div class="arc-orbit__dossier" aria-labelledby="arc-orbit-name" role="group">
          <Transition mode="out-in" :css="false" @before-leave="onReadingBeforeLeave" @enter="onReadingEnter" @leave="onReadingLeave">
            <div :key="card.id" class="arc-orbit__reading">
              <!-- the whole climb, Sequence 9 to the throne; a rung opens to what it is and what it gives -->
              <div class="arc-orbit__climb">
                <ol v-if="rungs.length" class="arc-ladder" :aria-label="ladderLabel">
                  <li v-for="rung in rungs" :key="rung.sequence" :class="{'is-top': rung.sequence === topRung, 'is-open': rung.sequence === openRung}">
                    <button
                        type="button"
                        class="arc-ladder__rung"
                        :aria-expanded="rung.sequence === openRung"
                        aria-controls="arc-rung-detail"
                        @click="toggleRung(rung.sequence)"
                    >
                      <b>{{ rung.sequence }}</b>
                      <span>{{ rung.name }}</span>
                      <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
                    </button>
                  </li>
                </ol>
                <!-- the ladder's own room while the archive is on its way: the rung numbers are known, the names follow -->
                <template v-else>
                  <ol class="arc-ladder is-pending" aria-hidden="true">
                    <li v-for="n in pendingRungs" :key="n" :class="{'is-top': n === pendingRungs[pendingRungs.length - 1]}">
                      <span class="arc-ladder__rung"><b>{{ n }}</b><span><i></i></span></span>
                    </li>
                  </ol>
                  <p class="arc-sr">{{ t('home.arcana.deck.loading') }}</p>
                </template>
                <div ref="rungFrame" class="arc-rung-frame">
                  <div id="arc-rung-detail" class="arc-rung" role="region" :aria-label="rungDetail?.title" :hidden="!rungDetail">
                    <div v-if="rungDetail" class="arc-rung__inner">
                      <h4 class="arc-rung__title">{{ rungDetail.title }}</h4>
                      <p v-if="rungDetail.about" class="arc-rung__about">{{ rungDetail.about }}</p>
                      <ul v-if="rungDetail.abilities.length" class="arc-rung__abilities">
                        <li v-for="ability in rungDetail.abilities" :key="ability.id">
                          <strong>{{ ability.name }}</strong>
                          <span>{{ ability.summary }}</span>
                        </li>
                      </ul>
                      <ul v-else-if="rungDetail.pending" class="arc-rung__abilities is-pending" aria-hidden="true">
                        <li v-for="n in RUNG_ABILITIES" :key="n"><strong><i></i></strong><span><i></i><i></i></span></li>
                      </ul>
                      <RouterLink v-if="rungDetail.abilities.length || rungDetail.pending" :to="$lp(`/pathways/${card.id}`)" class="arc-rung__full">
                        {{ rungDetail.full }}
                        <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
                      </RouterLink>
                    </div>
                  </div>
                </div>
                <p v-if="card.boon" class="arc-orbit__note">{{ t('home.arcana.deck.boonNote') }}</p>
              </div>

              <!-- the ladder already shows what the Pathway page would; what it can't show is who sits on it -->
              <div class="arc-orbit__actions">
                <RouterLink v-if="!card.boon" :to="$lp('/ascension')" class="arc-btn arc-btn--solid">
                  {{ t('home.arcana.deck.seats') }}
                  <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
                </RouterLink>
                <RouterLink v-else :to="$lp(`/pathways/${card.id}`)" class="arc-btn arc-btn--solid">
                  {{ t('home.arcana.deck.openBoon').replace('{name}', reading.name) }}
                  <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
                </RouterLink>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {useReducedMotion} from '@/composables/useReducedMotion';
import ArcanaSectionHead from './ArcanaSectionHead.vue';
import {type ArcanaCard, BOON_CARDS, cardById, CORE_CARDS, sigilNative, sigilThumb} from './arcana-data';
import {ensurePathwayData, useArcana} from './useArcana';
import {abilitySummary} from './abilitySummary';
import {stableViewportHeight} from './stableViewport';

type Kind = 'pathway' | 'boon';

const {t, plural, currentLanguage} = useI18n();
const {currentId, card, reading, readingFor, nameOf, seq9Of, data, draw} = useArcana();
const reducedMotion = useReducedMotion();

/* ---------- The deck: one source of truth, the drawn card ---------- */

const kind = computed<Kind>(() => (card.value.boon ? 'boon' : 'pathway'));
const catalog = computed(() => (kind.value === 'boon' ? BOON_CARDS : CORE_CARDS));
const selectedIndex = computed(() => Math.max(0, catalog.value.findIndex(item => item.id === currentId.value)));
const kinds = computed(() => [
  {id: 'pathway' as const, label: t('home.arcana.deck.tabPathways'), count: CORE_CARDS.length},
  {id: 'boon' as const, label: t('home.arcana.deck.tabBoons'), count: BOON_CARDS.length},
]);

/** Last card drawn from each ring, so switching tabs returns to it. */
const lastOf: Record<Kind, string> = {pathway: CORE_CARDS[0].id, boon: BOON_CARDS[0].id};
watch(currentId, id => {
  lastOf[cardById(id).boon ? 'boon' : 'pathway'] = id;
}, {immediate: true});

/* ---------- Copy ---------- */

const numeralLabel = (item: ArcanaCard) =>
  (item.boon ? t('home.arcana.deck.boon') : t('home.arcana.deck.arcanum').replace('{numeral}', item.numeral));
const countLabel = (count: number) => plural(count, {
  one: t('home.arcana.deck.sequences.one'),
  few: t('home.arcana.deck.sequences.few'),
  many: t('home.arcana.deck.sequences.many'),
}).replace('{count}', String(count));
const sequenceCounts = computed<Record<string, number>>(() => {
  void data.value;
  return Object.fromEntries(catalog.value.map(item => [item.id, readingFor(item.id).sequenceCount]));
});
const roleLine = (id: string) => {
  const role = seq9Of(id);
  return role ? t('home.arcana.deck.beginsAs').replace('{role}', role) : countLabel(sequenceCounts.value[id] ?? 10);
};
/** The drawn card's ladder, from Sequence 9 (where everyone starts) up to its top. */
const rungs = computed(() => [...reading.value.ladder].sort((a, b) => b.sequence - a.sequence));
const topRung = computed(() => rungs.value[rungs.value.length - 1]?.sequence ?? 0);
/** Until the archive is in: the rung numbers alone (9 to 0, or 9 to 5 for a Boon). */
const pendingRungs = computed(() => Array.from({length: card.value.boon ? 5 : 10}, (_, k) => 9 - k));
const ladderLabel = computed(() => t('home.arcana.deck.ladderLabel').replace('{name}', reading.value.name));

/*
 * One rung open at a time; a different card closes it. The rung's tile answers at once
 * (openRung); its panel (shownRung) moves: it grows open as its text fades in, fades and
 * shrinks shut, and for another rung its text fades out, the panel eases to the new
 * height and the new text fades in. Each move starts from wherever the panel is, so a
 * quick second click carries on from there rather than jumping.
 */
const openRung = ref<number | null>(null);
const shownRung = ref<number | null>(null);
const rungFrame = ref<HTMLElement | null>(null);
let rungMoves: Animation[] = [];
let rungTurn = 0;
watch(currentId, () => {
  rungTurn++;
  rungMoves.forEach(move => move.cancel());
  rungMoves = [];
  openRung.value = null;
  shownRung.value = null;
});
function toggleRung(sequence: number) {
  void ensurePathwayData();
  openRung.value = openRung.value === sequence ? null : sequence;
  void showRung(openRung.value);
}

async function showRung(next: number | null) {
  const frame = rungFrame.value;
  if (!frame || reducedMotion.value) {
    shownRung.value = next;
    return;
  }
  const my = ++rungTurn;
  const stale = () => my !== rungTurn;
  const panel = () => frame.querySelector<HTMLElement>('.arc-rung');
  const inner = () => frame.querySelector<HTMLElement>('.arc-rung__inner');
  // where everything is now, mid-move or at rest
  const from = frame.getBoundingClientRect().height;
  const panelOpacity = panel() ? Number(getComputedStyle(panel()!).opacity) : 1;
  const innerOpacity = inner() ? Number(getComputedStyle(inner()!).opacity) : 1;
  rungMoves.forEach(move => move.cancel());
  rungMoves = [];
  const track = (move: Animation | undefined) => (move && rungMoves.push(move), move);
  frame.classList.add('is-moving');
  const hold = track(frame.animate({height: [`${from}px`, `${from}px`]}, {duration: 1e6}))!;
  const wasOpen = shownRung.value !== null && from > 0;

  if (wasOpen) {
    // closing: the whole panel fades; switching: only its text
    const target = next === null ? panel() : inner();
    const opacity = next === null ? panelOpacity : innerOpacity;
    const out = track(target?.animate({opacity: [opacity, 0]}, {duration: 130, easing: 'ease-in', fill: 'forwards'}));
    await out?.finished.catch(() => undefined);
    if (stale()) return;
  }

  if (next === null) {
    const shrink = track(frame.animate({height: [`${from}px`, '0px']}, {duration: 220, easing: SETTLE, fill: 'forwards'}))!;
    hold.cancel();
    await shrink.finished.catch(() => undefined);
    if (stale()) return;
    shownRung.value = null;
    await nextTick();
    if (stale()) return;
  } else {
    shownRung.value = next;
    await nextTick();
    if (stale()) return;
    hold.cancel();
    // the new height, measured without the held one; then from where it was to there
    const to = frame.getBoundingClientRect().height;
    const grow = track(frame.animate({height: [`${from}px`, `${to}px`]}, {duration: 260, easing: SETTLE}))!;
    if (wasOpen) {
      track(inner()?.animate({opacity: [0, 1], transform: ['translateY(6px)', 'none']}, {duration: 220, delay: 40, easing: SETTLE, fill: 'backwards'}));
    } else {
      track(panel()?.animate({opacity: [panelOpacity < 1 ? panelOpacity : 0, 1]}, {duration: 200, easing: 'ease-out', fill: 'backwards'}));
      track(inner()?.animate({transform: ['translateY(6px)', 'none']}, {duration: 260, easing: SETTLE, fill: 'backwards'}));
    }
    // the fade-outs (held at 0) give way to the fade-ins just started
    rungMoves.filter(move => move.effect?.getTiming().fill === 'forwards').forEach(move => move.cancel());
    await grow.finished.catch(() => undefined);
    if (stale()) return;
  }
  rungMoves.forEach(move => move.cancel());
  rungMoves = [];
  frame.classList.remove('is-moving');
}
/** Shown at most, so an open rung stays a glance; the rest are on the Pathway's page. */
const RUNG_ABILITIES = 4;
/** What the open rung is: its place on the climb (seats, rank) and the abilities it brings. */
const rungDetail = computed(() => {
  const n = shownRung.value;
  const module = data.value;
  if (n === null) return null;
  const rung = rungs.value.find(entry => entry.sequence === n);
  if (!rung) return null;
  const language = currentLanguage.value;
  const deck = (key: string) => t(`home.arcana.deck.rung.${key}`);
  const rank = module && !card.value.boon ? module.sequenceRank(n, language) : '';
  const title = deck('title').replace('{n}', String(n)).replace('{name}', rung.name) + (rank ? ` · ${rank}` : '');
  let about = '';
  if (!card.value.boon) {
    const seats = module?.HIGH_SEAT_LIMITS[n];
    if (n === 9) about = deck('start');
    else if (n === 0) about = deck('throne');
    else if (seats) about = deck('seats').replace('{count}', String(seats));
    else if (n === 4) about = deck('demigod');
    else about = deck('digest');
  }
  const sequence = module?.pathwayById(currentId.value)?.sequences.find(entry => entry.sequence === n);
  const all = (sequence?.abilities ?? []).map(ability => ({
    id: ability.id,
    name: module!.pick(ability.name, language),
    summary: abilitySummary(module!.pick(ability.description, language)),
  }));
  return {
    title,
    about,
    abilities: all.slice(0, RUNG_ABILITIES),
    /** the archive is still on its way: placeholders hold the abilities' room */
    pending: !module,
    // the descriptions here are cut to three lines, and some rungs have more abilities than shown
    full: deck('full'),
  };
});


/* ---------- Geometry: a ring seen from slightly above; the near arc of a dial on phones ---------- */

type Geometry = {
  width: number; height: number; cx: number; cy: number; a: number; b: number;
  orb: number; seal: number; dial: boolean; front: number; centreBottom: number; labelWidth: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;
const easeOut = (value: number) => 1 - Math.pow(1 - value, 3);
const signedWrap = (value: number, length: number) => ((value + length / 2) % length + length) % length - length / 2;
const normalize = (value: number, length: number) => ((value % length) + length) % length;

function geometryFor(width: number, viewportHeight: number, dial: boolean): Geometry {
  if (dial) {
    const small = width < 440;
    const orb = small ? 64 : 72;
    const seal = small ? 128 : 150;
    const r = clamp(width * .95, 320, 540);
    // drawn seal + name + role line, then a gap above the front of the ring
    const front = Math.round(18 + seal + 16 + 40 + 10 + 18 + 34 + orb / 2);
    const height = Math.round(front + orb / 2 + 54);
    return {
      width, height, cx: width / 2, cy: front - r, a: r, b: r, orb, seal, dial: true, front,
      centreBottom: height - (front - orb / 2 - 30), labelWidth: 132,
    };
  }
  const a = Math.min(width * .42, 580);
  const b = clamp(a * .36, 150, Math.max(150, viewportHeight * .245));
  const orb = Math.round(clamp(Math.min(width * .066, b * .44), 70, 96));
  const seal = Math.round(clamp(b * .8, 112, 168));
  const cy = Math.round(b + orb * .3 + 14);
  const front = cy + b;
  const height = Math.round(front + orb / 2 + 54);
  const stepAngle = (Math.PI * 2) / CORE_CARDS.length;
  const labelWidth = Math.round(clamp(a * (Math.sin(stepAngle * 2) - Math.sin(stepAngle)) - 14, 84, 132));
  return {
    width, height, cx: width / 2, cy, a, b, orb, seal, dial: false, front,
    centreBottom: height - (front - orb / 2 - 18), labelWidth,
  };
}

const geo = ref<Geometry>(geometryFor(1280, 900, false));

const stageStyle = computed(() => {
  const g = geo.value;
  return {
    height: `${g.height}px`,
    '--cx': `${g.cx}px`,
    '--cy': `${g.cy}px`,
    '--rx': `${g.a}px`,
    '--ry': `${g.b}px`,
    '--orb': `${g.orb}px`,
    '--seal': `${g.seal}px`,
    '--centre-bottom': `${g.centreBottom}px`,
    '--lab-w': `${g.labelWidth}px`,
    // the drawn card's accent, switched at once on re-keyed elements instead of gliding (cheap to paint)
    '--orb-acc': card.value.accent,
  };
});

/* ---------- Motion: `spin` is the (fractional) index facing the front ---------- */

const stageRef = ref<HTMLElement | null>(null);
const ringRef = ref<HTMLElement | null>(null);
const centreSealRef = ref<HTMLElement | null>(null);
const dragging = ref(false);
const focusInside = ref(false);
const announcement = ref('');
let announcedId = '';

let seals: HTMLElement[] = [];
/** Each seal's disc: the ring's depth fades the disc only, never its caption. */
let orbs: HTMLElement[] = [];
let spin = 0;
let target = 0;
let velocity = 0;
let lean = 0;
let leanTarget = 0;
/** 0..1: the seals dealing themselves out of the drawn seal as the ring scrolls in. */
let assembly = 0;
let assembled = false;
let frame = 0;
let lastTime = 0;
let inView = false;
let lowPower = false;
let originY = 0;
/** Set by a drag's release: the ring is already where the card is, so it coasts instead of snapping. */
let releasedByDrag = false;

const still = () => reducedMotion.value;
/** Spring stiffness (rad/s) of the ring's turn, and how far it may turn before it dissolves into place instead. */
const SPRING = 22;
const TURN_LIMIT = 2.5;

function collectSeals() {
  // the ring being dissolved away (a tab switch) is marked, so only the live one is collected
  seals = [...(stageRef.value?.querySelectorAll<HTMLElement>('.arc-orbit__ring:not([data-leaving]) .arc-seal') ?? [])];
  orbs = seals.map(seal => seal.querySelector<HTMLElement>('.arc-seal__orb') ?? seal);
}

function render() {
  const g = geo.value;
  const count = seals.length;
  if (!count) return;
  const stepAngle = (Math.PI * 2) / count;
  const view = spin + lean;
  const chosen = selectedIndex.value;
  for (let index = 0; index < count; index++) {
    const element = seals[index];
    const rel = signedWrap(index - view, count);
    let angle = rel * stepAngle;
    let enter = 1;
    if (assembly < 1) {
      // nearest the drawn seal first, the far side of the ring last
      const order = Math.abs(signedWrap(index - chosen, count)) / (count / 2);
      enter = easeOut(clamp((assembly - order * .55) / .45, 0, 1));
      angle += (1 - enter) * (rel < 0 ? -1 : 1) * .9;
    }
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const depth = (cos + 1) / 2;
    let scale: number;
    let opacity: number;
    let label: number;
    if (g.dial) {
      const near = clamp((cos - .5) / .5, 0, 1);
      scale = .7 + .3 * near;
      opacity = clamp((cos - .55) / .25, 0, 1);
      label = cos > .95 ? 1 : 0;
    } else {
      scale = .5 + .5 * depth;
      opacity = .26 + .74 * depth ** 1.3;
      // captions are on or off (full contrast), only for the seals at the front
      label = depth > .88 ? 1 : 0;
    }
    let x = g.cx + g.a * sin;
    let y = g.cy + g.b * cos;
    if (enter < 1) {
      x = mix(g.cx, x, enter);
      y = mix(originY, y, enter);
      scale *= .3 + .7 * enter;
      opacity *= enter;
      if (enter < 1) label = 0;
    }
    element.style.transform = `translate3d(${(x - g.orb / 2).toFixed(1)}px, ${(y - g.orb / 2).toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
    orbs[index].style.opacity = opacity.toFixed(3);
    element.style.zIndex = String(10 + Math.round(depth * 100));
    element.style.pointerEvents = opacity < .2 ? 'none' : '';
    element.style.setProperty('--lab', String(label));
    // the page disc under the seal deals in with it (it would cover the drawn seal mid-flight)
    element.style.setProperty('--enter', enter < 1 ? enter.toFixed(3) : '1');
    // a seal faded out entirely (the dial's far side) takes its page disc with it
    element.style.setProperty('--shown', opacity < .02 ? '0' : '1');
    element.style.setProperty('--inv', (1 / scale).toFixed(3));
  }
}

function tick(now: number) {
  frame = 0;
  const dt = Math.min(64, lastTime ? now - lastTime : 16.7);
  lastTime = now;
  let moving = dragging.value;
  if (!dragging.value) {
    // A critically damped spring (no overshoot): the ring settles in about 300 ms and never swings back.
    const steps = Math.max(1, Math.ceil(dt / 8));
    const h = dt / 1000 / steps;
    for (let i = 0; i < steps; i++) {
      velocity += (SPRING * SPRING * (target - spin) - 2 * SPRING * velocity) * h;
      spin += velocity * h;
    }
    if (Math.abs(target - spin) < .001 && Math.abs(velocity) < .02) {
      spin = target;
      velocity = 0;
    } else {
      moving = true;
    }
  }
  if (Math.abs(leanTarget - lean) > .0005) {
    lean += (leanTarget - lean) * (1 - Math.exp(-dt / 220));
    moving = true;
  } else {
    lean = leanTarget;
  }
  render();
  if (moving) schedule();
  else lastTime = 0;
}

function schedule() {
  if (still()) {
    spin = target;
    velocity = 0;
    lean = leanTarget = 0;
    render();
    return;
  }
  if (!frame) frame = requestAnimationFrame(tick);
}

function finishAssembly() {
  if (assembled) return;
  assembled = true;
  assembly = 1;
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', measure);
  pageObserver?.disconnect();
  pageObserver = null;
}

/* ---------- Choosing ---------- */

function choose(index: number, announce = false) {
  const item = catalog.value[normalize(index, catalog.value.length)];
  if (!item) return;
  finishAssembly();
  announcedId = announce ? item.id : '';
  if (announce) {
    announcement.value = t('home.arcana.deck.announce')
        .replace('{name}', nameOf(item.id))
        .replace('{current}', String(normalize(index, catalog.value.length) + 1))
        .replace('{total}', String(catalog.value.length));
  }
  if (item.id !== currentId.value) void draw(item.id);
}

function focusSeal(index: number) {
  void nextTick(() => ringRef.value?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.focus({preventScroll: true}));
}

function step(direction: number) {
  choose(selectedIndex.value + direction, true);
}

function onSealClick(index: number) {
  choose(index, true);
}

function onRingKeydown(event: KeyboardEvent) {
  const length = catalog.value.length;
  const keyTarget: Record<string, number> = {
    ArrowLeft: selectedIndex.value - 1, ArrowUp: selectedIndex.value - 1,
    ArrowRight: selectedIndex.value + 1, ArrowDown: selectedIndex.value + 1,
    Home: 0, End: length - 1,
  };
  if (!(event.key in keyTarget)) return;
  event.preventDefault();
  const index = normalize(keyTarget[event.key], length);
  choose(index, true);
  focusSeal(index);
}

const tabId = (id: Kind) => `arc-orbit-tab-${id}`;

function chooseKind(id: Kind) {
  if (id === kind.value) return;
  finishAssembly();
  announcement.value = '';
  void draw(lastOf[id]);
}

function onTabKeydown(event: KeyboardEvent) {
  const ids = kinds.value.map(option => option.id);
  const current = ids.indexOf(kind.value);
  const keyTarget: Record<string, number> = {ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: ids.length - 1};
  if (!(event.key in keyTarget)) return;
  event.preventDefault();
  const id = ids[normalize(keyTarget[event.key], ids.length)];
  chooseKind(id);
  void nextTick(() => document.getElementById(tabId(id))?.focus());
}

const warmed = new Set<string>();
function warm(id: string) {
  if (warmed.has(id)) return;
  warmed.add(id);
  const image = new Image();
  image.decoding = 'async';
  image.src = sigilNative(id);
}

/*
 * The drawn card changed (here, in the hero, or from the dock). The centre dissolves from one card to the
 * next where it stands (the hooks below); the ring only turns to put the new seal at the front. A turn of
 * more than a couple of places is not swept: the ring snaps and dissolves into its new place instead.
 */
watch(currentId, (id, previous) => {
  const count = catalog.value.length;
  const index = selectedIndex.value;
  const swapped = cardById(id).boon !== cardById(previous ?? id).boon;
  const byDrag = releasedByDrag;
  releasedByDrag = false;
  if (swapped) {
    // the other ring dissolves in over this one (onRingEnter), already in place
    collectSeals();
    velocity = 0;
    spin = target = index;
    render();
  } else {
    const delta = signedWrap(index - spin, count);
    target = spin + delta;
    if (inView && !still() && !byDrag && Math.abs(delta) > TURN_LIMIT) {
      spin = target;
      velocity = 0;
      render();
      dissolveIn(ringRef.value, 280, 0, .3);
    }
  }
  if (!inView) {
    spin = target;
    velocity = 0;
    render();
  }
  schedule();
  if (id !== announcedId) announcement.value = '';
  for (const offset of [-1, 1, 2, -2]) warm(catalog.value[normalize(index + offset, count)].id);
}, {flush: 'post'});

/* ---------- The change itself: one card dissolves into the next, in place ---------- */

const SETTLE = 'cubic-bezier(.2, .8, .2, 1)';
/** Per thing that changes: what is still dissolving away. A quicker change hurries it, so ghosts never pile up. */
const leavingOf = {glow: new Set<Animation>(), centre: new Set<Animation>(), ring: new Set<Animation>(), reading: new Set<Animation>()};
const canSwap = () => inView && !still();

function dissolveIn(el: Element | null, duration: number, delay = 0, from = 0, done?: () => void) {
  if (!el) return done?.();
  const fade = el.animate({opacity: [from, 1]}, {duration, delay, easing: 'ease-out', fill: 'backwards'});
  if (done) fade.onfinish = done;
}

/** Opacity only; the element takes its fade from wherever an unfinished entrance had got to. */
function dissolveOut(el: Element, leaving: Set<Animation>, duration: number, done: () => void) {
  for (const older of leaving) older.updatePlaybackRate(3);
  const fade = el.animate({opacity: 0}, {duration, easing: 'ease-in', fill: 'forwards'});
  leaving.add(fade);
  const end = () => {
    leaving.delete(fade);
    done();
  };
  fade.onfinish = end;
  fade.oncancel = end;
}

function onGlowEnter(el: Element, done: () => void) {
  if (!canSwap()) return done();
  dissolveIn(el, 300, 0, 0, done);
}

function onGlowLeave(el: Element, done: () => void) {
  if (!canSwap()) return done();
  dissolveOut(el, leavingOf.glow, 300, done);
}

/** The outgoing name must not stay the dossier's label, nor be read out twice. */
function onCentreBeforeLeave(el: Element) {
  el.querySelector('#arc-orbit-name')?.removeAttribute('id');
  el.setAttribute('aria-hidden', 'true');
}

function onCentreEnter(el: Element, done: () => void) {
  if (!canSwap()) return done();
  const root = el as HTMLElement;
  // the seal settles in from a touch smaller, its sigil turning in as it is drawn again; the name follows
  root.querySelector('.arc-orbit__drawn')?.animate(
      {transform: ['scale(.9)', 'none']}, {duration: 300, easing: SETTLE, fill: 'backwards'});
  root.querySelector('.arc-orbit__drawn img')?.animate(
      {transform: ['scale(.74) rotate(-16deg)', 'none'], opacity: [0, 1]}, {duration: 300, delay: 40, easing: SETTLE, fill: 'backwards'});
  root.querySelector('.arc-orbit__name')?.animate(
      {transform: ['translateY(6px)', 'none'], opacity: [0, 1]}, {duration: 210, delay: 90, easing: SETTLE, fill: 'backwards'});
  dissolveIn(root, 260, 40, 0, done);
}

function onCentreLeave(el: Element, done: () => void) {
  if (!canSwap()) return done();
  el.querySelector('.arc-orbit__drawn')?.animate({transform: 'scale(1.06)'}, {duration: 220, easing: 'ease-in', fill: 'forwards'});
  dissolveOut(el, leavingOf.centre, 220, done);
}

function onRingBeforeLeave(el: Element) {
  el.setAttribute('data-leaving', '');
  el.setAttribute('inert', '');
}

function onRingEnter(el: Element, done: () => void) {
  if (!canSwap()) return done();
  dissolveIn(el, 280, 0, 0, done);
}

function onRingLeave(el: Element, done: () => void) {
  if (!canSwap()) return done();
  dissolveOut(el, leavingOf.ring, 220, done);
}

/* The dossier's text swaps out and in (out first: it reflows, and that happens while it is clear). */
function onReadingBeforeLeave(el: Element) {
  el.setAttribute('aria-hidden', 'true');
}

function onReadingLeave(el: Element, done: () => void) {
  // out-in must not be finished synchronously from inside its own leave hook
  if (!canSwap()) return queueMicrotask(done);
  dissolveOut(el, leavingOf.reading, 90, done);
}

function onReadingEnter(el: Element, done: () => void) {
  if (!canSwap()) return done();
  el.animate({transform: ['translateY(6px)', 'none']}, {duration: 180, easing: SETTLE, fill: 'backwards'});
  dissolveIn(el, 180, 0, 0, done);
}

/* ---------- Drag, flick, lean and sideways wheel ---------- */

const DRAG_THRESHOLD = 6;
let pointer: {id: number; startX: number; startSpin: number; lastX: number; lastTime: number; velocity: number; moved: boolean} | null = null;
let suppressClick = false;
let finePointer = false;

/** Pointer travel for one seal: the spacing at the front of the ring. */
const sealSpacing = () => Math.max(56, geo.value.a * Math.sin((Math.PI * 2) / catalog.value.length));

function onPointerDown(event: PointerEvent) {
  suppressClick = false;
  if (event.button !== 0) return;
  pointer = {id: event.pointerId, startX: event.clientX, startSpin: spin, lastX: event.clientX, lastTime: performance.now(), velocity: 0, moved: false};
}

function onPointerMove(event: PointerEvent) {
  if (!pointer || event.pointerId !== pointer.id) {
    // The ring leans a little toward the cursor, as the original orbit did.
    if (event.pointerType === 'mouse' && finePointer && !lowPower && !still() && stageRef.value && assembled) {
      const rect = stageRef.value.getBoundingClientRect();
      leanTarget = clamp(((event.clientX - rect.left) / rect.width - .5) * .7, -.35, .35);
      schedule();
    }
    return;
  }
  const travel = event.clientX - pointer.startX;
  if (!pointer.moved) {
    if (Math.abs(travel) < DRAG_THRESHOLD) return;
    pointer.moved = true;
    dragging.value = true;
    finishAssembly();
    leanTarget = 0;
    stageRef.value?.setPointerCapture(event.pointerId);
  }
  const now = performance.now();
  pointer.velocity = pointer.velocity * .6 + ((event.clientX - pointer.lastX) / Math.max(1, now - pointer.lastTime)) * .4;
  pointer.lastX = event.clientX;
  pointer.lastTime = now;
  spin = pointer.startSpin - travel / sealSpacing();
  target = spin;
  velocity = 0;
  schedule();
}

function onPointerUp(event: PointerEvent) {
  if (!pointer || event.pointerId !== pointer.id) return;
  const {moved, velocity: pointerVelocity} = pointer;
  pointer = null;
  if (!moved) return;
  if (stageRef.value?.hasPointerCapture(event.pointerId)) stageRef.value.releasePointerCapture(event.pointerId);
  suppressClick = true;
  dragging.value = false;
  const spacing = sealSpacing();
  const fling = clamp(-pointerVelocity * 220 / spacing, -5, 5);
  const landing = Math.round(spin + fling);
  // hand the flick's speed to the spring, so the ring coasts into place
  velocity = clamp(-pointerVelocity * 1000 / spacing, -8, 8);
  target = landing;
  releasedByDrag = true;
  choose(landing, true);
  // a release that lands on the same card draws nothing: the flag must not outlive it
  void nextTick(() => {
    releasedByDrag = false;
  });
  if (ringRef.value?.contains(document.activeElement)) focusSeal(normalize(landing, catalog.value.length));
  schedule();
}

function onPointerLeave() {
  if (leanTarget !== 0) {
    leanTarget = 0;
    schedule();
  }
}

function swallowDragClick(event: MouseEvent) {
  if (!suppressClick) return;
  suppressClick = false;
  event.stopPropagation();
  event.preventDefault();
}

let wheelTravel = 0;
let wheelLast = 0;
/** Horizontal wheel and Shift+wheel turn the ring; vertical scrolling passes through. */
function onWheel(event: WheelEvent) {
  const sideways = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.shiftKey ? event.deltaY : 0;
  if (!sideways) return;
  event.preventDefault();
  wheelTravel += sideways;
  const now = performance.now();
  if (Math.abs(wheelTravel) < 40 || now - wheelLast < 140) return;
  wheelLast = now;
  step(Math.sign(wheelTravel));
  wheelTravel = 0;
}

/* ---------- Scroll-in assembly and lifecycle ---------- */

let scrollFrame = 0;
/** The stage's page offset, cached so a scroll frame reads only scrollY (see measureStageTop). */
let stageTop = 0;
function measureStageTop() {
  if (stageRef.value) stageTop = stageRef.value.getBoundingClientRect().top + window.scrollY;
}

function measureAssembly() {
  scrollFrame = 0;
  if (assembled || !stageRef.value) return;
  const top = stageTop - window.scrollY;
  const progress = clamp((window.innerHeight * .88 - top) / (window.innerHeight * .6), 0, 1);
  if (progress >= 1) finishAssembly();
  else if (progress === assembly) return;
  else assembly = progress;
  render();
}

function onScroll() {
  // far from the ring there is nothing to deal: the observer catches up when it nears
  if (!inView) return;
  if (!scrollFrame) scrollFrame = requestAnimationFrame(measureAssembly);
}

let resizeObserver: ResizeObserver | null = null;
let pageObserver: ResizeObserver | null = null;
let viewObserver: IntersectionObserver | null = null;
let dialQuery: MediaQueryList | null = null;
let lastViewportHeight = 0;

function measure() {
  const stage = stageRef.value;
  if (!stage) return;
  measureStageTop();
  const width = stage.clientWidth;
  const dial = dialQuery?.matches ?? false;
  const g = geo.value;
  const viewportHeight = stableViewportHeight();
  if (width && (width !== g.width || dial !== g.dial || Math.abs(viewportHeight - lastViewportHeight) > 1)) {
    lastViewportHeight = viewportHeight;
    geo.value = geometryFor(width, viewportHeight, dial);
  }
  void nextTick(() => {
    // where the dealt seals fly out from: the drawn seal's centre
    const seal = centreSealRef.value;
    if (seal && stageRef.value) {
      const s = seal.getBoundingClientRect();
      originY = s.top + s.height / 2 - stageRef.value.getBoundingClientRect().top;
    } else {
      originY = geo.value.cy;
    }
    render();
  });
}

onMounted(() => {
  const hints = navigator as Navigator & {deviceMemory?: number; connection?: {saveData?: boolean}};
  lowPower = Boolean(hints.connection?.saveData || (hints.deviceMemory !== undefined && hints.deviceMemory <= 2));
  finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  dialQuery = window.matchMedia('(max-width: 819px)');
  dialQuery.addEventListener('change', measure);

  collectSeals();
  spin = target = selectedIndex.value;
  const motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (motion) {
    window.addEventListener('scroll', onScroll, {passive: true});
  } else {
    assembled = true;
    assembly = 1;
  }
  measure();
  if (motion) {
    measureAssembly();
    // anything above the ring growing or shrinking moves it on the page
    const main = stageRef.value?.closest('main');
    if (main) {
      pageObserver = new ResizeObserver(measureStageTop);
      pageObserver.observe(main);
    }
  }
  for (const offset of [-1, 1]) warm(catalog.value[normalize(selectedIndex.value + offset, catalog.value.length)].id);
  render();

  resizeObserver = new ResizeObserver(() => measure());
  if (stageRef.value) resizeObserver.observe(stageRef.value);
  stageRef.value?.addEventListener('wheel', onWheel, {passive: false});
  window.addEventListener('resize', measure, {passive: true});

  viewObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) {
      void ensurePathwayData();
      if (!assembled) {
        measureStageTop();
        onScroll();
      }
      schedule();
    } else if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      spin = target;
      velocity = 0;
      render();
    }
  }, {rootMargin: '10% 0px'});
  if (stageRef.value) viewObserver.observe(stageRef.value);
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  pageObserver?.disconnect();
  viewObserver?.disconnect();
  dialQuery?.removeEventListener('change', measure);
  stageRef.value?.removeEventListener('wheel', onWheel);
  window.removeEventListener('scroll', onScroll);
  if (frame) cancelAnimationFrame(frame);
  if (scrollFrame) cancelAnimationFrame(scrollFrame);
});
</script>

<style scoped>
/* ---------- heading ---------- */
.arc-orbit__head {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  align-items: end;
  gap: 20px clamp(32px, 5vw, 72px);
  margin-bottom: clamp(8px, 1.5vw, 20px);
}

.arc-orbit__head .arc-head {
  margin-bottom: 0;
}

.arc-orbit__aside {
  display: grid;
  justify-items: end;
  gap: 18px;
}

/* a plain two-way switch: the chosen ring is underlined in the accent */
.arc-orbit__tabs {
  display: flex;
  gap: 28px;
}

.arc-orbit__tabs button {
  position: relative;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--arc-muted);
  font-family: var(--arc-body);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: color .25s;
}

.arc-orbit__tabs button::after {
  position: absolute;
  right: 0;
  bottom: 4px;
  left: 0;
  height: var(--arc-bw-accent);
  border-radius: 1px;
  background: var(--acc-ink);
  content: '';
  opacity: 0;
  transform: scaleX(.4);
  transition: opacity .25s, transform .3s cubic-bezier(.2, .8, .2, 1);
}

.arc-orbit__tabs button:hover {
  color: var(--arc-ink);
}

.arc-orbit__tabs button b {
  font-weight: 500;
  color: var(--arc-muted);
  font-variant-numeric: tabular-nums;
}

.arc-orbit__tabs button[aria-selected='true'] {
  color: var(--arc-ink);
}

.arc-orbit__tabs button[aria-selected='true'] b {
  color: var(--acc-ink);
}

.arc-orbit__tabs button[aria-selected='true']::after {
  opacity: 1;
  transform: none;
}

.arc-orbit__tabs button:focus-visible {
  border-radius: var(--arc-r-sm);
  outline: var(--arc-focus-w) solid var(--arc-ink);
  outline-offset: var(--arc-focus-off);
}

.arc-orbit__panel {
  /* a jump to the reading leaves the ring's far seals clear of the header */
  scroll-margin-top: calc(var(--site-header-stack, 106px) + 16px);
}

/* ---------- the stage ---------- */
.arc-orbit__stage {
  position: relative;
  cursor: grab;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.arc-orbit.is-dragging .arc-orbit__stage {
  cursor: grabbing;
}

.arc-orbit__glow,
.arc-orbit__track {
  position: absolute;
  left: calc(var(--cx) - var(--rx));
  top: calc(var(--cy) - var(--ry));
  width: calc(var(--rx) * 2);
  height: calc(var(--ry) * 2);
  border-radius: 50%;
  pointer-events: none;
}

/* the floor the ring turns over: a soft pool of the drawn card's colour */
.arc-orbit__glow {
  background: radial-gradient(closest-side, color-mix(in oklab, var(--orb-acc) 15%, transparent), color-mix(in oklab, var(--orb-acc) 5%, transparent) 62%, transparent);
}

.arc-orbit__track {
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--orb-acc) 22%, var(--arc-line));
}

/* ---------- the drawn seal ---------- */
.arc-orbit__centre {
  position: absolute;
  z-index: 60;
  left: var(--cx);
  bottom: var(--centre-bottom);
  width: min(560px, calc(var(--rx) * 2 - var(--orb) * 2.4));
  display: grid;
  justify-items: center;
  text-align: center;
  /* `translate`, not `transform`: the dissolve between two cards animates transform */
  translate: -50% 0;
  pointer-events: none;
}

.arc-orbit__drawn {
  position: relative;
  width: var(--seal);
  height: var(--seal);
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 42%, color-mix(in oklab, var(--orb-acc) 24%, #15151b), #0b0b0e 66%);
  box-shadow:
    0 0 0 1px color-mix(in oklab, var(--orb-acc) 60%, transparent),
    0 0 0 9px rgba(11, 11, 14, .78),
    0 0 0 10px color-mix(in oklab, var(--orb-acc) 45%, transparent),
    0 0 80px 10px color-mix(in oklab, var(--orb-acc) 22%, transparent),
    0 26px 60px var(--arc-shadow);
}

.arc-orbit__drawn img {
  position: relative;
  z-index: 2;
  width: 82%;
  height: 82%;
  object-fit: contain;
  filter: drop-shadow(0 10px 18px rgba(0, 0, 0, .45));
}



.arc-orbit__name {
  margin: 24px 0 0;
  max-width: 100%;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  /* the group heading's step of the scale (spec: h3) */
  font-size: var(--arc-fs-h2);
  line-height: 1.08;
  letter-spacing: -.02em;
  color: var(--arc-ink);
  text-wrap: balance;
  overflow-wrap: anywhere;
}

/* ---------- seals on the ring ---------- */
.arc-orbit__ring {
  position: absolute;
  inset: 0;
}

.arc-seal {
  --lab: 0;
  --inv: 1;
  position: absolute;
  top: 0;
  left: 0;
  width: var(--orb);
  height: var(--orb);
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--arc-ink);
  font: inherit;
  cursor: pointer;
  transform-origin: 50% 50%;
  will-change: transform;
}

/* a disc of the page under each seal: the ring's line runs beneath the faded back row, not through it */
.arc-seal::before {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--arc-bg);
  content: '';
  opacity: calc(var(--enter, 1) * var(--shown, 1));
}

.arc-seal__orb {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 38%, color-mix(in oklab, var(--tok) 20%, #15151b), #0b0b0e 70%);
  box-shadow:
    inset 0 0 0 1px color-mix(in oklab, var(--tok) 38%, transparent),
    0 14px 30px var(--arc-shadow);
  transition: transform .35s cubic-bezier(.2, .8, .2, 1), box-shadow .3s;
  will-change: opacity;
}

.arc-seal__orb img {
  width: 84%;
  height: 84%;
  object-fit: contain;
  transition: opacity .4s;
}

.arc-seal:focus-visible .arc-seal__orb {
  transform: scale(1.1);
  box-shadow:
    inset 0 0 0 1px var(--tok),
    0 0 28px color-mix(in oklab, var(--tok) 40%, transparent),
    0 14px 30px var(--arc-shadow);
}

/* the ring sits on the seal itself, so the back row's fade never dims it (spec: rotating things use the shadow ring) */
.arc-seal:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--arc-bg), 0 0 0 5px var(--arc-ink);
}

.arc-seal__label {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  width: max-content;
  max-width: var(--lab-w);
  font-size: var(--arc-fs-small);
  font-weight: 600;
  line-height: 1.2;
  color: var(--arc-ink);
  text-align: center;
  transform: translateX(-50%) scale(var(--inv));
  transform-origin: 50% 0;
  opacity: max(var(--lab), var(--hot, 0));
  pointer-events: none;
  transition: opacity .2s ease;
  text-shadow: 0 1px 10px var(--arc-bg), 0 0 3px var(--arc-bg);
}

.arc-seal:focus-visible {
  --hot: 1;
}

.arc-seal.is-drawn .arc-seal__label {
  visibility: hidden;
}

@media (hover: hover) {
  .arc-seal:hover {
    --hot: 1;
  }

  .arc-seal:hover .arc-seal__orb {
    transform: scale(1.1);
    box-shadow:
      inset 0 0 0 1px var(--tok),
      0 0 28px color-mix(in oklab, var(--tok) 40%, transparent),
      0 14px 30px var(--arc-shadow);
  }
}

/* selected (spec): the seal stays whole, ringed in the accent at the accent width */
.arc-seal.is-drawn .arc-seal__orb,
.arc-seal.is-drawn:hover .arc-seal__orb,
.arc-seal.is-drawn:focus-visible .arc-seal__orb {
  box-shadow:
    inset 0 0 0 var(--arc-bw) color-mix(in oklab, var(--tok) 38%, transparent),
    0 0 0 var(--arc-bw-accent) var(--acc-ink),
    0 0 26px color-mix(in oklab, var(--orb-acc) 35%, transparent),
    0 14px 30px var(--arc-shadow);
}

/* ---------- controls ---------- */
.arc-orbit__controls {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.arc-orbit__step {
  width: 44px;
  height: 44px;
  flex: none;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: var(--arc-glass);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line-acc);
  color: var(--arc-ink);
  cursor: pointer;
  transition: background-color .25s, box-shadow .25s, transform .3s cubic-bezier(.2, .8, .2, 1);
}

/* the dial's steppers: ghost buttons cut round, with the family's hover and press */
.arc-orbit__step:hover {
  background: color-mix(in oklab, var(--acc) 12%, transparent);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line-hot);
  transform: translateY(-2px);
}

.arc-orbit__step:active {
  transform: scale(.98);
  transition-duration: .08s;
}

/* ---------- dossier ---------- */
.arc-orbit__dossier {
  margin-top: clamp(22px, 3vh, 32px);
  padding-top: clamp(22px, 3vh, 30px);
  border-top: var(--arc-bw) solid var(--arc-line);
}

.arc-orbit__reading {
  display: grid;
  /* fixed tracks: the columns and buttons stay put from one card to the next */
  grid-template-columns: minmax(0, 1fr) var(--dossier-actions, 264px);
  align-items: start;
  gap: 24px clamp(28px, 4vw, 56px);
}

/*
 * The climb as a ladder of names: ten rungs in two rows of five (a boon's five in one),
 * each numbered, the throne at the top in the accent.
 */
.arc-ladder {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
}

.arc-ladder li {
  min-width: 0;
}

/* each rung a rounded tile, like the dungeon classes and the Ordeals */
.arc-ladder__rung {
  position: relative;
  display: grid;
  align-content: start;
  gap: 4px;
  width: 100%;
  height: 100%;
  padding: 12px 34px 14px 14px;
  border: 0;
  border-radius: var(--arc-r-md);
  background: var(--arc-glass);
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color .2s ease;
}

.arc-ladder__rung:hover {
  background: color-mix(in oklab, var(--acc) 8%, var(--arc-glass));
}

.arc-ladder__rung:focus-visible {
  outline: 2px solid var(--acc-ink);
  outline-offset: 2px;
}

.arc-ladder__rung > i {
  position: absolute;
  top: 14px;
  right: 12px;
  font-size: 11px;
  color: var(--arc-muted);
  transition: transform .25s ease, color .2s ease;
}

.arc-ladder li.is-open .arc-ladder__rung {
  background: color-mix(in oklab, var(--acc) 12%, var(--arc-glass));
  box-shadow: inset 0 0 0 var(--arc-bw-accent) var(--acc-ink);
}

.arc-ladder li.is-open .arc-ladder__rung > i {
  color: var(--acc-ink);
  transform: rotate(180deg);
}

/* the open rung: under the ladder, across its width; its frame's height is what animates */
.arc-rung-frame {
  display: flow-root;
}

.arc-rung-frame.is-moving {
  overflow: hidden;
}

.arc-rung {
  margin-top: 8px;
  padding: 18px 20px 20px;
  border-radius: var(--arc-r-lg);
  background: color-mix(in oklab, var(--acc) 5%, var(--arc-raised));
  box-shadow: inset 0 0 0 var(--arc-bw) var(--arc-line);
}

.arc-rung[hidden] {
  display: none;
}

.arc-rung__title {
  margin: 0;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: var(--arc-fs-h4);
  line-height: 1.22;
  color: var(--arc-ink);
}

.arc-rung__about {
  margin: 6px 0 0;
  font-size: var(--arc-fs-small);
  line-height: 1.55;
  color: var(--arc-muted);
  text-wrap: pretty;
}

.arc-rung__abilities {
  list-style: none;
  display: grid;
  align-items: start;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 24px;
  margin: 16px 0 0;
  padding: 0;
}

.arc-rung__abilities li {
  display: grid;
  align-content: start;
  gap: 2px;
  padding-left: 12px;
  border-left: var(--arc-bw-accent) solid var(--acc-ink);
}

.arc-rung__abilities strong {
  font-weight: 600;
  color: var(--arc-ink);
}

/* a glance, not the archive: some entries are whole manuals, so each keeps to three lines */
.arc-rung__abilities span {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  font-size: var(--arc-fs-small);
  line-height: 1.5;
  color: var(--arc-muted);
}

/* the Pathway page, for what the panel cuts short */
.arc-rung__full {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  font-size: var(--arc-fs-small);
  font-weight: 600;
  color: var(--acc-ink);
  text-decoration: none;
  transition: color .6s ease;
}

.arc-rung__full:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.arc-rung__full:focus-visible {
  outline: 2px solid var(--acc-ink);
  outline-offset: 3px;
  border-radius: 4px;
}

.arc-ladder__rung b {
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: var(--arc-fs-caption);
  color: var(--arc-muted);
}

.arc-ladder__rung span {
  font-weight: 600;
  line-height: 1.3;
  color: var(--arc-ink);
  overflow-wrap: anywhere;
}

.arc-ladder li.is-top .arc-ladder__rung {
  background: linear-gradient(180deg, color-mix(in oklab, var(--acc) 14%, var(--arc-glass)), var(--arc-glass));
}

.arc-ladder li.is-top b,
.arc-ladder li.is-top span {
  color: var(--acc-ink);
  transition: color .6s ease;
}

/* placeholder lines at the text's own height, until the archive arrives */
.arc-ladder.is-pending .arc-ladder__rung {
  cursor: default;
  background: var(--arc-glass);
}

.arc-ladder.is-pending i,
.arc-rung__abilities.is-pending i {
  display: block;
  width: 80%;
  height: .62em;
  margin-block: calc((1lh - .62em) / 2);
  border-radius: 3px;
  background: var(--arc-line);
}

.arc-rung__abilities.is-pending strong i {
  width: 9em;
  max-width: 100%;
}

.arc-rung__abilities.is-pending span i + i {
  width: 62%;
}

.arc-orbit__note {
  margin: 12px 0 0;
  font-size: var(--arc-fs-small);
  line-height: 1.5;
  color: var(--arc-muted);
}

.arc-orbit__actions {
  display: grid;
  gap: 10px;
}

@media (max-width: 1180px) {
  .arc-orbit__reading {
    grid-template-columns: minmax(0, 1fr);
  }

  .arc-orbit__actions {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    padding-top: 0;
  }
}

@media (max-width: 900px) {
  .arc-orbit__head {
    grid-template-columns: 1fr;
  }

  .arc-orbit__aside {
    justify-items: start;
  }
}

/* ---------- phones and narrow tablets: the near arc of a dial ---------- */
.arc-orbit.is-dial .arc-orbit__stage {
  margin-inline: calc(clamp(18px, 4vw, 64px) * -1);
  overflow-x: clip;
}

.arc-orbit.is-dial .arc-orbit__centre {
  width: calc(100% - 36px);
}

.arc-orbit.is-dial .arc-orbit__name {
  font-size: 34px;
  margin-top: 26px;
}

.arc-orbit.is-dial .arc-orbit__reading {
  grid-template-columns: 1fr;
}

@media (max-width: 520px) {
  .arc-ladder {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .arc-rung__abilities {
    grid-template-columns: minmax(0, 1fr);
  }

  .arc-orbit__actions {
    display: grid;
  }
}

@media (prefers-reduced-motion: reduce) {
  .arc-seal__orb,
  .arc-seal__orb img,
  .arc-orbit__step {
    transition: none;
  }
}
</style>
