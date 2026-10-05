<template>
  <section ref="heroRef" class="arc-hero" :style="sceneVars" aria-labelledby="arc-hero-title">
    <HeroNightScene :risen="risen"/>

    <div class="arc-hero__grid">
      <!-- Copy: what this is, how to get in. Shown once the fonts are in, so nothing jumps. -->
      <div ref="introRef" class="arc-hero__intro" :class="{'is-ready': fontsReady}">
        <h1 id="arc-hero-title" class="arc-hero__title">
          <span>{{ titleA }}</span>
          <!-- one line in both states: a long name shrinks to the column (fitTitle), so the hero never changes height -->
          <span class="arc-hero__title-accent"><span ref="accentRef" class="arc-hero__title-fit" :style="{'--fit': titleFit}">{{ titleB }}</span></span>
        </h1>
      </div>

      <div class="arc-hero__body" :class="{'is-ready': fontsReady}">
        <p class="arc-hero__lede">{{ t('home.arcana.hero.lede') }}</p>

        <div class="arc-hero__actions">
          <RouterLink :to="$lp('/guide/connect')" class="arc-btn arc-btn--solid">
            {{ t('home.arcana.hero.join') }}
            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </RouterLink>
          <RouterLink :to="$lp(changelogLink)" class="arc-btn arc-btn--ghost arc-hero__news" :aria-label="changelogAria">
            {{ t('home.arcana.hero.changelog') }}
            <!-- The date's room is kept while the post loads, so the button never resizes. -->
            <span
                v-if="changelogDate || !newsSettled"
                class="arc-hero__news-date"
                :class="{'is-shown': changelogDate}"
                aria-hidden="true"
            >{{ changelogDate }}</span>
          </RouterLink>
        </div>

        <div class="arc-hero__meta">
          <button type="button" class="arc-ip" :class="`is-${copyState}`" @click="copy">
            <span ref="addressRef" class="arc-ip__address">{{ address }}</span>
            <span class="arc-ip__hint">
              <i :class="copyIcon" aria-hidden="true"></i>
              {{ copyLabel }}
            </span>
          </button>
          <p class="arc-hero__copy-note" :class="{'is-shown': copyState === 'failed'}" role="status">
            <template v-if="copyState === 'failed'">{{ t('home.arcana.ip.failedHelp') }}</template>
            <template v-else-if="copyState === 'copied'"><span class="arc-sr">{{ t('home.arcana.ip.copied') }}</span></template>
          </p>
        </div>
      </div>

      <!-- The table: the 22 ring the moon; once drawn, your card stands against it -->
      <div ref="tableRef" class="arc-hero__table">
        <div
            ref="stageRef"
            class="arc-stage"
            :class="{'is-undrawn': !drawn}"
            :style="stageStyle"
            @pointermove="onStagePointer"
            @pointerleave="onStageLeave"
        >
          <i class="arc-stage__backlight" aria-hidden="true"></i>
          <svg class="arc-stage__orbit" :viewBox="`0 0 200 200`" aria-hidden="true">
            <circle cx="100" cy="100" r="99" fill="none" stroke="currentColor" stroke-width=".35" opacity=".5"/>
            <g stroke="currentColor" stroke-width=".5" opacity=".55">
              <path v-for="n in 22" :key="n" :transform="`rotate(${(n - 0.5) * (360 / 22)} 100 100)`" d="M100 1.5v3"/>
            </g>
          </svg>

          <!-- Before the first draw: the empty place where your card will stand (a shortcut to the draw button) -->
          <div class="arc-stage__slot" :class="{'is-gone': drawn}" aria-hidden="true" @click="requestShuffle">
            <span class="arc-stage__slot-mark">?</span>
          </div>

          <div
              class="arc-stage__fan"
              role="group"
              :aria-label="t('home.arcana.hero.fanLabel')"
              @keydown="onFanKey"
          >
            <button
                v-for="id in heroIds"
                :key="id"
                :ref="el => setCardEl(id, el)"
                type="button"
                class="arc-card"
                :class="{'is-drawn': id === drawn, 'is-fan': id !== drawn}"
                :style="cardStyle(id)"
                :tabindex="id === drawn ? -1 : (fanIndex(id) === focusIndex ? 0 : -1)"
                :aria-hidden="id === drawn ? 'true' : undefined"
                :aria-label="id === drawn ? undefined : cardLabel(id)"
                @click="id !== drawn && requestDraw(id)"
                @pointerenter="id !== drawn && preload(id)"
                @focus="id !== drawn && onCardFocus(id)"
            >
              <span class="arc-card__lift" :style="id === drawn ? tiltStyle : undefined">
                <span :ref="el => setFlipEl(id, el)" class="arc-card__flip" :style="{transform: `rotateY(${id === drawn ? 0 : 180}deg)`}">
                  <span class="arc-card__side arc-card__side--front">
                    <ArcanaFace
                        v-if="fronts.has(id)"
                        :id="id"
                        :name="nameOf(id)"
                        :role="roleOf(id)"
                        :boon-label="t('home.arcana.deck.boon')"
                        large
                        eager
                    />
                    <span v-if="id === drawn" class="arc-card__sheen" aria-hidden="true"></span>
                  </span>
                  <span class="arc-card__side arc-card__side--back">
                    <ArcanaBack/>
                  </span>
                </span>
              </span>
            </button>
          </div>
        </div>

        <!-- Under the deck: the draw button and, once drawn, the way to the card's reading (the face names the card) -->
        <div class="arc-hero__draw">
          <div class="arc-hero__draw-row">
            <!-- Never `disabled`: that would drop keyboard focus mid-shuffle. Extra presses queue one more draw. -->
            <button
                type="button"
                class="arc-btn arc-btn--ghost arc-btn--sm arc-hero__shuffle"
                :class="{'is-busy': busy}"
                :aria-busy="busy || undefined"
                @click="requestShuffle"
            >
              <i class="fa-solid fa-layer-group" aria-hidden="true"></i>
              <span class="arc-hero__shuffle-label">
                <span :class="{'is-off': hasDrawn}">{{ t('home.arcana.hero.shuffle') }}</span>
                <span :class="{'is-off': !hasDrawn}">{{ t('home.arcana.hero.drawAgain') }}</span>
              </span>
            </button>
            <p v-if="hasDrawn" class="arc-hero__hint">
              <a href="#reading" class="arc-hero__read">
                {{ t('home.arcana.hero.readCard') }}
                <i class="fa-solid fa-arrow-down" aria-hidden="true"></i>
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>

    <p class="arc-sr" aria-live="polite">{{ announcement }}</p>
  </section>
</template>

<script setup lang="ts">
import {computed, nextTick, onMounted, onUnmounted, ref, shallowReactive, watch, type ComponentPublicInstance} from 'vue';
import ArcanaFace from './ArcanaFace.vue';
import ArcanaBack from './ArcanaBack.vue';
import HeroNightScene from './HeroNightScene.vue';
import {CORE_CARDS, cardById, sigilNative} from './arcana-data';
import {ensurePathwayData, randomCard, useArcana} from './useArcana';
import {useCopyAddress} from './useCopyAddress';
import {useLatestNews} from './useLatestNews';
import {useI18n} from '@/composables/useI18n';

const {t, intlLocale} = useI18n();
const {currentId, hasDrawn, readingFor, nameOf, seq9Of, reveal, registerDealer} = useArcana();

/* ---------------- headline: "Draw your first card", then "Read your {pathway}" ---------------- */
const titleA = computed(() => t(hasDrawn.value ? 'home.arcana.hero.drawnTitleA' : 'home.arcana.hero.titleA'));
const titleB = computed(() => (hasDrawn.value
    ? t('home.arcana.hero.drawnTitleB').replace('{pathway}', nameOf(currentId.value))
    : t('home.arcana.hero.titleB')));
const accentRef = ref<HTMLElement | null>(null);
/** Scale of the accent line: 1, or less when the name is wider than the copy column. */
const titleFit = ref(1);
function fitTitle() {
  const line = accentRef.value;
  // a couple of pixels spare for rounding, so the name never pokes past the column
  const room = (introRef.value?.clientWidth ?? 0) - 2;
  if (!line || room <= 0) return;
  const natural = line.getBoundingClientRect().width / titleFit.value;
  const next = natural > room ? Math.max(.4, Math.floor((room / natural) * 1000) / 1000) : 1;
  if (Math.abs(next - titleFit.value) > .002) titleFit.value = next;
}
watch(titleB, () => nextTick(fitTitle));
const addressRef = ref<HTMLElement | null>(null);
const {state: copyState, copy, address} = useCopyAddress(addressRef);

/* ---------------- copy + status labels ---------------- */
const copyLabel = computed(() => ({
  idle: t('home.arcana.ip.copy'),
  copied: t('home.arcana.ip.copied'),
  failed: t('home.arcana.ip.failed'),
}[copyState.value]));
const copyIcon = computed(() => ({
  idle: 'fa-solid fa-copy',
  copied: 'fa-solid fa-check',
  failed: 'fa-solid fa-triangle-exclamation',
}[copyState.value]));

/* ---------------- latest changelog ---------------- */
const {latestChangelog, settled: newsSettled} = useLatestNews();
/** While the post loads (or if it can't), the button simply opens the news list. */
const changelogLink = computed(() => (latestChangelog.value ? `/news/${latestChangelog.value.slug}` : '/news'));
const changelogDay = (options: Intl.DateTimeFormatOptions) => {
  const raw = latestChangelog.value?.publishedAt ?? latestChangelog.value?.createdAt;
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(intlLocale.value, options) : '';
};
const changelogDate = computed(() => changelogDay({month: 'short', day: 'numeric'}));
const changelogAria = computed(() => {
  const label = t('home.arcana.hero.changelog');
  const long = changelogDay({day: 'numeric', month: 'long', year: 'numeric'});
  return long ? `${label}, ${long}` : label;
});

/* ---------------- deck state ---------------- */
const shuffled = <T, >(list: T[]): T[] => {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/*
 * A first visit starts with all 22 face down and nothing in front of the moon;
 * a returning visitor's card (restored by useArcana) is already standing there.
 */
const initial = hasDrawn.value ? currentId.value : null;

/** Cards on the table: the 22, plus any boon drawn from the deck browser. */
const heroIds = ref<string[]>(CORE_CARDS.map(c => c.id).concat(initial && cardById(initial).boon ? [initial] : []));
/** The card standing in front of the moon; null until the visitor draws. */
const drawn = ref<string | null>(initial);
/** Fan order (every hero card except the drawn one). */
const order = ref<string[]>(shuffled(heroIds.value.filter(id => id !== initial)));
const fanIndex = (id: string) => order.value.indexOf(id);
/** Cards whose face is rendered (the drawn card and one leaving). */
const fronts = shallowReactive(new Set<string>(initial ? [initial] : []));
/** The card travelling to the front: above everything until it lands. */
const incoming = ref<string | null>(null);
const busy = ref(false);
const fontsReady = ref(false);
const risen = ref(false);
const focusIndex = ref(0);
const announcement = ref('');

const roleOf = (id: string) => {
  const role = seq9Of(id);
  return role ? t('home.arcana.hero.beginsAs').replace('{role}', role) : '';
};
const cardLabel = (id: string) => t('home.arcana.hero.cardLabel')
    .replace('{n}', String(fanIndex(id) + 1))
    .replace('{total}', String(order.value.length));

/* ---------------- geometry ----------------
 * Everything is measured in moon radii (u). The fan is a ring just outside the
 * moon; the drawn card stands in front of the moon's lower half, so the moon
 * backlights it. The stage is exactly the box this composition needs.
 */
type Pose = {x: number; y: number; r: number; s: number};
type Shape = {card: number; cardTop: number; fan: number; gap: number; span: number};
const WIDE: Shape = {card: 1.24, cardTop: -0.5, fan: 0.36, gap: 0.12, span: 76};
const STACKED: Shape = {card: 1.5, cardTop: -0.3, fan: 0.335, gap: 0.11, span: 66};
/** Hover/focus lift of a fan card, as a share of its own height. */
const LIFT = 0.12;

function shapeOf(p: Shape) {
  const cardH = p.card * 1.62;
  const fanH = cardH * p.fan;
  const fanW = p.card * p.fan;
  const rc = 1 + p.gap + fanH / 2;
  const a = (p.span * Math.PI) / 180;
  const reach = rc + fanH / 2 + fanH * LIFT;
  return {
    cardW: p.card,
    cardH,
    rc,
    halfW: Math.max(reach * Math.sin(a) + (fanW / 2) * Math.cos(a), p.card / 2) + 0.02,
    top: reach + 0.02,
    bottom: p.cardTop + cardH + 0.08,
  };
}

const stacked = ref(false);
const u = ref(180);
const stageRef = ref<HTMLElement | null>(null);
const heroRef = ref<HTMLElement | null>(null);
const tableRef = ref<HTMLElement | null>(null);
const introRef = ref<HTMLElement | null>(null);

const geo = computed(() => {
  const p = stacked.value ? STACKED : WIDE;
  const s = shapeOf(p);
  const k = u.value;
  const W = Math.round(s.halfW * 2 * k);
  return {
    p,
    u: k,
    W,
    H: Math.round((s.top + s.bottom) * k),
    pivotX: W / 2,
    pivotY: s.top * k,
    cardW: s.cardW * k,
    cardH: s.cardH * k,
    rc: s.rc * k,
    drawnY: (p.cardTop + s.cardH / 2) * k,
  };
});

const slotPose = (index: number, count: number): Pose => {
  const {rc, p} = geo.value;
  const a = count > 1 ? -p.span + (2 * p.span * index) / (count - 1) : 0;
  const rad = (a * Math.PI) / 180;
  return {x: rc * Math.sin(rad), y: -rc * Math.cos(rad), r: a, s: p.fan};
};
const drawnPose = (): Pose => ({x: 0, y: geo.value.drawnY, r: 0, s: 1});
const poseOf = (id: string): Pose => (id === drawn.value ? drawnPose() : slotPose(fanIndex(id), order.value.length));
const css = (p: Pose) => `translate(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px) rotate(${p.r.toFixed(2)}deg) scale(${p.s.toFixed(4)})`;
/** Push a fan pose outward along its own axis (the "lifting a card out" beat). */
const outward = (p: Pose, distance: number, s = p.s, turn = 1): Pose => {
  const rad = (p.r * Math.PI) / 180;
  return {x: p.x + Math.sin(rad) * distance, y: p.y - Math.cos(rad) * distance, r: p.r * turn, s};
};
/** Fan stacking: the ring is symmetric, the cards nearest the top lie on top. */
const fanZ = (index: number, count: number) => 10 + Math.round(((count - 1) / 2 - Math.abs(index - (count - 1) / 2)) * 2);

const stageStyle = computed(() => ({
  width: `${geo.value.W}px`,
  height: `${geo.value.H}px`,
  '--card-w': `${geo.value.cardW.toFixed(2)}px`,
  '--card-h': `${geo.value.cardH.toFixed(2)}px`,
  '--pivot-x': `${geo.value.pivotX.toFixed(2)}px`,
  '--pivot-y': `${geo.value.pivotY.toFixed(2)}px`,
  '--drawn-y': `${geo.value.drawnY.toFixed(2)}px`,
  '--u': `${geo.value.u.toFixed(2)}px`,
}));

const cardStyle = (id: string) => ({
  transform: css(poseOf(id)),
  zIndex: id === incoming.value ? 80 : id === drawn.value ? 60 : fanZ(fanIndex(id), order.value.length),
});

/* ---------------- the scene follows the stage ---------------- */
const scene = ref({moonX: 0, moonY: 0, moonR: 0, cityLeft: 0, cityH: 0, cityBottom: 0, sceneH: 0, ready: false});
const sceneVars = computed(() => {
  const s = scene.value;
  if (!s.ready) return {};
  return {
    '--moon-x': `${s.moonX.toFixed(1)}px`,
    '--moon-y': `${s.moonY.toFixed(1)}px`,
    '--moon-r': `${s.moonR.toFixed(1)}px`,
    '--city-left': `${s.cityLeft.toFixed(1)}px`,
    '--city-h': `${s.cityH.toFixed(1)}px`,
    '--city-bottom': `${s.cityBottom.toFixed(1)}px`,
    '--scene-h': `${s.sceneH.toFixed(1)}px`,
  };
});

/** Skyline art: where the castle's main roofline and its towers sit in the image. */
const CITY_ROOF = 0.5;
const CITY_TOWERS = 0.78;
const CITY_RATIO = 16 / 9;

function placeScene() {
  const hero = heroRef.value;
  const stage = stageRef.value;
  if (!hero || !stage) return;
  const h = hero.getBoundingClientRect();
  const st = stage.getBoundingClientRect();
  const g = geo.value;
  const moonX = st.left - h.left + g.pivotX;
  const moonY = st.top - h.top + g.pivotY;
  const moonR = g.u;
  // Wide: the scene fills the hero. Stacked: it is a band that ends under the deck.
  const sceneH = stacked.value ? Math.min(h.height, st.bottom - h.top + g.u * 0.9) : h.height;
  // The castle's roofline crosses the moon's lower half; its towers stand to the moon's right.
  const roof = moonY + g.u * (stacked.value ? 0.55 : 0.5);
  const cityH = Math.max(2 * (sceneH - roof), g.u * 2.6, h.width / CITY_RATIO * 0.62);
  const cityW = cityH * CITY_RATIO;
  const cityBottom = roof + cityH * (1 - CITY_ROOF);
  const cityLeft = Math.max(moonX + g.u * (stacked.value ? 1.45 : 0.9) - cityW * CITY_TOWERS, h.width - cityW);
  scene.value = {moonX, moonY, moonR, cityLeft, cityH, cityBottom, sceneH, ready: true};
}

/* ---------------- element refs ---------------- */
const cardEls = new Map<string, HTMLElement>();
const flipEls = new Map<string, HTMLElement>();
const toEl = (el: Element | ComponentPublicInstance | null) => (el instanceof HTMLElement ? el : null);
const setCardEl = (id: string, el: Element | ComponentPublicInstance | null) => {
  const node = toEl(el);
  if (node) cardEls.set(id, node);
  else cardEls.delete(id);
};
const setFlipEl = (id: string, el: Element | ComponentPublicInstance | null) => {
  const node = toEl(el);
  if (node) flipEls.set(id, node);
  else flipEls.delete(id);
};

/* ---------------- motion helpers ---------------- */
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = () => window.matchMedia('(hover: hover)').matches;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
/** Heavy start, soft landing. */
const EASE_LAND = 'cubic-bezier(.2, .9, .25, 1)';
const EASE_SWING = 'cubic-bezier(.6, 0, .3, 1)';
const EASE_LIFT = 'cubic-bezier(.3, 0, .2, 1)';
/** A card turning over: an even turn, so the edge-on moment spans frames rather than one. */
const EASE_TURN = 'cubic-bezier(.42, 0, .38, 1)';

const running = new Set<Animation>();
function play(el: Element | undefined, keyframes: Keyframe[], options: KeyframeAnimationOptions): Animation | null {
  if (!el) return null;
  const animation = el.animate(keyframes, options);
  running.add(animation);
  const forget = () => running.delete(animation);
  animation.addEventListener('finish', forget);
  animation.addEventListener('cancel', forget);
  return animation;
}
const settled = (list: (Animation | null)[]) => Promise.all(
    list.map(a => (a ? a.finished.then(() => undefined, () => undefined) : undefined)),
);

function flip(id: string, from: number, to: number, options: KeyframeAnimationOptions, start = 0, end = 1) {
  return play(flipEls.get(id), [
    {transform: `rotateY(${from}deg)`, offset: 0},
    {transform: `rotateY(${from}deg)`, offset: start, easing: EASE_TURN},
    {transform: `rotateY(${to}deg)`, offset: end},
    {transform: `rotateY(${to}deg)`, offset: 1},
  ], options);
}

const preloaded = new Map<string, Promise<void>>();
function preload(id: string): Promise<void> {
  let done = preloaded.get(id);
  if (!done) {
    const img = new Image();
    img.src = sigilNative(id);
    done = img.decode().catch(() => undefined);
    preloaded.set(id, done);
  }
  return done;
}

function announce(id: string) {
  const r = readingFor(id);
  announcement.value = t('home.arcana.hero.announce').replace('{name}', r.name).replace('{role}', r.seq9 || '-');
}

/*
 * Wear the drawn card once it has landed and nothing on the table is moving: the re-theme
 * restyles the whole page in one long task, which mid-flip froze the card edge-on and then
 * showed it face up. The page then crossfades into the card's colour (useArcana). The move
 * holds the table until the crossfade is done, so a queued draw never runs under it.
 */
function wear(id: string) {
  announce(id);
  return reveal(id, {crossfade: true});
}

function resetTilt() {
  tiltTarget = {rx: 0, ry: 0, mx: 50, my: 30, on: 0};
  tilt.value = {...tiltTarget};
}

/* ---------------- one move at a time; the latest request waits its turn ---------------- */
let pending: (() => Promise<void>) | null = null;
async function run(job: () => Promise<void>) {
  if (busy.value) {
    pending = job;
    return;
  }
  busy.value = true;
  try {
    await job();
  } finally {
    busy.value = false;
  }
  syncWithPage();
  const next = pending;
  pending = null;
  if (next) await run(next);
}

const requestDraw = (id: string) => run(() => drawFromFan(id));
const requestShuffle = () => run(() => shuffleAndDraw());

/* ---------------- draw a specific fan card ---------------- */
async function drawFromFan(id: string) {
  if (id === drawn.value || !order.value.includes(id)) return;
  const old = drawn.value;
  const k = fanIndex(id);
  const count = order.value.length;
  const el = cardEls.get(id);
  const g = geo.value;
  // Start exactly where the card is drawn on screen, including its hover lift.
  const wasLifted = !!el && (el.matches(':focus-visible') || (canHover() && el.matches(':hover')));
  const slot = slotPose(k, count);
  const fromNew = wasLifted ? outward(slot, g.cardH * g.p.fan * LIFT) : slot;
  // The first draw leaves a gap in the ring: the others close it up behind the card.
  const before = old ? null : new Map(order.value.map((fid, i) => [fid, slotPose(i, count)]));

  fronts.add(id);
  void ensurePathwayData();
  // Let the face decode, but never let the click feel dead.
  await Promise.race([preload(id), sleep(140)]);

  const hadFocus = document.activeElement === el;
  const nextOrder = order.value.slice();
  if (old) nextOrder[k] = old;
  else nextOrder.splice(k, 1);
  order.value = nextOrder;
  drawn.value = id;
  focusIndex.value = Math.min(k, nextOrder.length - 1);
  resetTilt();
  // Keyboard focus stays in the ring, on the card now in that slot.
  const keepFocus = () => {
    if (hadFocus) cardEls.get(nextOrder[focusIndex.value])?.focus({preventScroll: true});
  };

  if (reducedMotion()) {
    await nextTick();
    keepFocus();
    if (old) fronts.delete(old);
    reveal(id);
    announce(id);
    return;
  }

  incoming.value = id;
  await nextTick();
  keepFocus();

  const D = 1080;
  const u = g.u;
  const side = Math.sign(slot.r) || 1;
  // On phones the ring is near the screen edge: lift less, never off-screen.
  const lifted = outward(fromNew, u * (stacked.value ? 0.28 : 0.5), slot.s * 1.15, 0.85);
  const above: Pose = {x: -side * u * 0.06, y: g.drawnY - u * 0.42, r: -side * 2.5, s: 0.97};
  const landing: Pose = {x: 0, y: g.drawnY + u * 0.025, r: 0, s: 1.012};
  const moves = [
    play(cardEls.get(id), [
      {transform: css(fromNew), offset: 0, easing: EASE_LIFT},
      {transform: css(lifted), offset: 0.2, easing: EASE_SWING},
      {transform: css(above), offset: 0.64, easing: EASE_LAND},
      {transform: css(landing), offset: 0.86, easing: 'ease-in-out'},
      {transform: css(drawnPose()), offset: 1},
    ], {duration: D}),
    flip(id, 180, 0, {duration: D}, 0.2, 0.7),
  ];

  if (old) {
    // The old card holds the centre until the new one is on its way, then bows out
    // behind it and is tucked into the free slot.
    const back = slotPose(k, count);
    const D2 = D * 0.9;
    const wait = D * 0.26;
    const sink: Pose = {x: side * u * 0.2, y: g.drawnY + u * 0.28, r: side * 5, s: 0.62};
    moves.push(
        play(cardEls.get(old), [
          {transform: css(drawnPose()), offset: 0, easing: EASE_SWING},
          {transform: css(sink), offset: 0.4, easing: EASE_SWING},
          {transform: css(outward(back, u * 0.16)), offset: 0.84, easing: EASE_LAND},
          {transform: css(back), offset: 1},
        ], {duration: D2, delay: wait, fill: 'backwards'}),
        flip(old, 0, 180, {duration: D2, delay: wait, fill: 'backwards'}, 0.05, 0.45),
    );
  } else if (before) {
    const next = nextOrder.length;
    nextOrder.forEach((fid, i) => {
      const from = before.get(fid);
      if (from) {
        moves.push(play(cardEls.get(fid), [{transform: css(from)}, {transform: css(slotPose(i, next))}], {
          duration: 760, delay: D * 0.22, easing: EASE_SWING, fill: 'backwards',
        }));
      }
    });
  }

  await settled(moves);
  incoming.value = null;
  if (old) fronts.delete(old);
  await wear(id);
}

/* ---------------- shuffle the whole deck, then deal one ---------------- */
async function shuffleAndDraw(targetId?: string) {
  const old = drawn.value;
  const target = targetId && targetId !== old ? targetId : randomCard(old ?? '');
  const ids = heroIds.value.includes(target) ? heroIds.value.slice() : heroIds.value.concat(target);

  fronts.add(target);
  const ready = Promise.all([ensurePathwayData().catch(() => undefined), preload(target)]);

  if (reducedMotion()) {
    await Promise.race([ready, sleep(400)]);
    heroIds.value = ids;
    order.value = shuffled(ids.filter(id => id !== target));
    drawn.value = target;
    if (old) fronts.delete(old);
    resetTilt();
    reveal(target);
    announce(target);
    return;
  }

  const g = geo.value;
  const u = g.u;
  const before = heroIds.value.slice();
  const stackIndex = new Map(before.map((id, i) => [id, i]));
  const pileY = g.drawnY * 0.45;
  const pilePose = (id: string): Pose => {
    const i = stackIndex.get(id) ?? 0;
    return {x: Math.sin(i * 2.3) * u * 0.025, y: pileY - i * 0.7, r: Math.sin(i * 1.7) * 2.5, s: 0.62};
  };
  resetTilt();

  /* 1 - gather everything into one pile; the drawn card (if any) turns face-down on top */
  const center = (order.value.length - 1) / 2;
  const gather = before.map(id => {
    const k = fanIndex(id);
    const delay = id === old ? 0 : (center - Math.abs(k - center)) * 9;
    return play(cardEls.get(id), [{transform: css(poseOf(id))}, {transform: css(pilePose(id))}], {
      duration: 420, delay, easing: EASE_SWING, fill: 'both',
    });
  });
  const flipDown = old ? flip(old, 0, 180, {duration: 400, fill: 'forwards'}, 0, 1) : null;
  await settled([...gather, flipDown]);

  /* 2 - one riffle: the pile splits in two, the halves tilt in and rain back together */
  const count0 = before.length;
  const half = Math.ceil(count0 / 2);
  const riffle = before.map((id, i) => {
    const base = pilePose(id);
    const left = i < half;
    const dir = left ? -1 : 1;
    const split: Pose = {x: dir * u * 0.5, y: base.y - u * 0.08, r: -dir * 9, s: base.s};
    const turn = left ? i * 2 : (i - half) * 2 + 1;
    const drop = 0.48 + (turn / count0) * 0.36;
    return play(cardEls.get(id), [
      {transform: css(base), offset: 0, easing: EASE_SWING},
      {transform: css(split), offset: 0.3},
      {transform: css({...split, y: split.y - u * 0.02}), offset: drop - 0.12, easing: 'cubic-bezier(.5, 0, .7, .4)'},
      {transform: css({...base, y: base.y - u * 0.02}), offset: drop, easing: EASE_LAND},
      {transform: css(base), offset: 1},
    ], {duration: 860, fill: 'forwards'});
  });
  await Promise.all([settled(riffle), Promise.race([ready, sleep(1500)])]);

  /* 3 - new order: fan out from the pile and deal the drawn card to the front */
  heroIds.value = ids;
  order.value = shuffled(ids.filter(id => id !== target));
  drawn.value = target;
  incoming.value = target;
  focusIndex.value = 0;
  await nextTick();

  const count = order.value.length;
  const mid = (count - 1) / 2;
  const deal = order.value.map((id, k) => play(cardEls.get(id), [
    {transform: css(pilePose(id))},
    {transform: css(outward(slotPose(k, count), u * 0.12)), offset: 0.7, easing: EASE_LAND},
    {transform: css(slotPose(k, count))},
  ], {duration: 780, delay: 30 + Math.abs(k - mid) * 16, easing: EASE_LAND, fill: 'backwards'}));

  const DEAL = 1040;
  const rise: Pose = {x: 0, y: pileY - u * 0.55, r: -3, s: 0.8};
  const landing: Pose = {x: 0, y: g.drawnY + u * 0.025, r: 0, s: 1.012};
  deal.push(play(cardEls.get(target), [
    {transform: css(pilePose(target)), offset: 0, easing: EASE_LAND},
    {transform: css(rise), offset: 0.36, easing: EASE_SWING},
    {transform: css(landing), offset: 0.84, easing: 'ease-in-out'},
    {transform: css(drawnPose()), offset: 1},
  ], {duration: DEAL, delay: 140, fill: 'backwards'}));
  deal.push(flip(target, 180, 0, {duration: DEAL, delay: 140, fill: 'backwards'}, 0.3, 0.76));
  // The deal holds its first frames, so the pile can be released now.
  [...gather, ...riffle, flipDown].forEach(a => a?.cancel());

  await settled(deal);
  incoming.value = null;
  if (old && old !== target) fronts.delete(old);
  await wear(target);
}

/* ---------------- intro: the moon rises and the deal comes out of it ---------------- */
async function introDeal() {
  risen.value = true;
  if (reducedMotion()) return;
  busy.value = true;
  const g = geo.value;
  const u = g.u;
  const count = order.value.length;
  const mid = (count - 1) / 2;
  const id = drawn.value;
  const from: Pose = {x: 0, y: u * 0.2, r: 0, s: 0.3};
  const animations = order.value.map((fid, k) => {
    const slot = slotPose(k, count);
    return play(cardEls.get(fid), [
      {transform: css(from), opacity: 0},
      {transform: css({...from, s: 0.34}), opacity: 1, offset: 0.12},
      {transform: css(outward(slot, u * 0.1)), opacity: 1, offset: 0.76, easing: EASE_LAND},
      {transform: css(slot), opacity: 1},
    ], {duration: 1100, delay: 260 + Math.abs(k - mid) * 34, easing: EASE_SWING, fill: 'backwards'});
  });
  // A returning visitor's card rises back into place; it is already theirs, so nothing is re-drawn.
  if (id) {
    incoming.value = id;
    const D = 1300;
    const delay = 620;
    animations.push(play(cardEls.get(id), [
      {transform: css({x: 0, y: g.drawnY + u * 0.9, r: 0, s: 0.86}), opacity: 0, offset: 0, easing: EASE_LAND},
      {transform: css({x: 0, y: g.drawnY - u * 0.3, r: -2, s: 0.95}), opacity: 1, offset: 0.48, easing: EASE_SWING},
      {transform: css({x: 0, y: g.drawnY + u * 0.025, r: 0, s: 1.012}), opacity: 1, offset: 0.86, easing: 'ease-in-out'},
      {transform: css(drawnPose()), opacity: 1, offset: 1},
    ], {duration: D, delay, fill: 'backwards'}));
    animations.push(flip(id, 180, 0, {duration: D, delay, fill: 'backwards'}, 0.36, 0.8));
  }
  await settled(animations);
  incoming.value = null;
  busy.value = false;
  syncWithPage();
  const next = pending;
  pending = null;
  if (next) void run(next);
}

/* ---------------- keep in sync with draws made elsewhere on the page ---------------- */
function syncWithPage() {
  const id = currentId.value;
  if (busy.value || !hasDrawn.value || id === drawn.value) return;
  const old = drawn.value;
  if (!heroIds.value.includes(id)) {
    heroIds.value = heroIds.value.concat(id);
    if (old) order.value = order.value.concat(old);
  } else {
    order.value = old
        ? order.value.map(entry => (entry === id ? old : entry))
        : order.value.filter(entry => entry !== id);
  }
  fronts.add(id);
  if (old) fronts.delete(old);
  drawn.value = id;
  focusIndex.value = Math.min(focusIndex.value, order.value.length - 1);
  resetTilt();
}
// The first draw may be the Fool the page was already showing: watch the flag too.
watch([currentId, hasDrawn], syncWithPage);

/* ---------------- keyboard: roving focus across the fan ---------------- */
function onCardFocus(id: string) {
  focusIndex.value = fanIndex(id);
  void preload(id);
}

function onFanKey(event: KeyboardEvent) {
  const keys: Record<string, number> = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1};
  const count = order.value.length;
  let next = focusIndex.value;
  if (event.key in keys) next = (focusIndex.value + keys[event.key] + count) % count;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = count - 1;
  else return;
  event.preventDefault();
  focusIndex.value = next;
  cardEls.get(order.value[next])?.focus({preventScroll: true});
}

/* ---------------- drawn card: tilt + sheen toward the pointer ---------------- */
const tilt = ref({rx: 0, ry: 0, mx: 50, my: 30, on: 0});
let tiltTarget = {rx: 0, ry: 0, mx: 50, my: 30, on: 0};
let tiltFrame: number | null = null;
const tiltStyle = computed(() => ({
  transform: `rotateX(${tilt.value.rx.toFixed(2)}deg) rotateY(${tilt.value.ry.toFixed(2)}deg)`,
  '--mx': `${tilt.value.mx.toFixed(1)}%`,
  '--my': `${tilt.value.my.toFixed(1)}%`,
  '--sheen': tilt.value.on.toFixed(3),
}));

function stepTilt() {
  const cur = tilt.value;
  const k = 0.14;
  const next = {
    rx: cur.rx + (tiltTarget.rx - cur.rx) * k,
    ry: cur.ry + (tiltTarget.ry - cur.ry) * k,
    mx: cur.mx + (tiltTarget.mx - cur.mx) * k,
    my: cur.my + (tiltTarget.my - cur.my) * k,
    on: cur.on + (tiltTarget.on - cur.on) * k,
  };
  tilt.value = next;
  const done = Math.abs(next.rx - tiltTarget.rx) + Math.abs(next.ry - tiltTarget.ry) + Math.abs(next.on - tiltTarget.on) < 0.02;
  tiltFrame = done ? null : requestAnimationFrame(stepTilt);
}

function onStagePointer(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || busy.value || !drawn.value || reducedMotion()) return;
  const el = cardEls.get(drawn.value);
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const px = (event.clientX - rect.left) / rect.width;
  const py = (event.clientY - rect.top) / rect.height;
  const near = px > -0.3 && px < 1.3 && py > -0.2 && py < 1.2;
  const cx = Math.max(-0.2, Math.min(1.2, px));
  const cy = Math.max(-0.2, Math.min(1.2, py));
  tiltTarget = near
      ? {rx: (0.5 - cy) * 14, ry: (cx - 0.5) * 16, mx: cx * 100, my: cy * 100, on: 1}
      : {rx: 0, ry: 0, mx: 50, my: 30, on: 0};
  if (tiltFrame === null) tiltFrame = requestAnimationFrame(stepTilt);
}

function onStageLeave() {
  tiltTarget = {rx: 0, ry: 0, mx: 50, my: 30, on: 0};
  if (tiltFrame === null) tiltFrame = requestAnimationFrame(stepTilt);
}

/* ---------------- fonts: reveal the copy once its faces are in (capped) ---------------- */
function waitForFonts(): Promise<void> {
  const cap = sleep(1400);
  const ready = (async () => {
    await sleep(0); // the concept's <link> is injected by the parent's onMounted
    const link = document.querySelector<HTMLLinkElement>('link[data-concept-font*="Commissioner"]');
    if (link && !link.sheet) {
      await new Promise(resolve => {
        link.addEventListener('load', resolve, {once: true});
        link.addEventListener('error', resolve, {once: true});
      });
    }
    await Promise.all([
      document.fonts.load('600 64px Commissioner'),
      document.fonts.load('400 18px "Golos Text"'),
      document.fonts.load('600 16px "Golos Text"'),
      document.fonts.load('400 11px "Tenor Sans"'),
      document.fonts.load('500 14px "IBM Plex Mono"'),
    ]).catch(() => undefined);
  })();
  return Promise.race([ready, cap]).then(() => undefined);
}

/* ---------------- sizing ---------------- */
const px = (value: string) => parseFloat(value) || 0;

/** Room kept under the deck for the caption, so a long name never resizes the table. */
const CAPTION_ROOM = {wide: 48, stacked: 80};

function measure() {
  const hero = heroRef.value;
  const table = tableRef.value;
  if (!hero || !table) return;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isStacked = vw <= 900;
  const shape = shapeOf(isStacked ? STACKED : WIDE);
  const style = getComputedStyle(hero);
  const padTop = px(style.paddingTop);
  const padBottom = px(style.paddingBottom);
  const padX = px(style.paddingLeft);
  // Phones may let the outermost fan cards use part of the page gutter, never the screen edge.
  const width = table.clientWidth + (isStacked ? Math.max(0, padX - 10) * 2 : 0);
  const height = isStacked
      // Title, deck and caption together fill the first screen; the pitch follows.
      ? vh - padTop - (introRef.value?.offsetHeight ?? 160) - CAPTION_ROOM.stacked - 30
      : Math.max(vh, 600) - padTop - padBottom - CAPTION_ROOM.wide;
  const next = Math.round(Math.max(70, Math.min(width / (shape.halfW * 2), height / (shape.top + shape.bottom), 260)) * 2) / 2;
  if (isStacked === stacked.value && Math.abs(next - u.value) < 1) return;
  // A real resize mid-move: land every card in place rather than finish at the old size.
  running.forEach(a => a.finish());
  stacked.value = isStacked;
  u.value = next;
}

let resizeObserver: ResizeObserver | null = null;
let heroObserver: IntersectionObserver | null = null;
let heroVisible = true;
let unregister: (() => void) | null = null;
let sceneFrame = 0;
const scheduleScene = () => {
  if (sceneFrame) return;
  sceneFrame = requestAnimationFrame(() => {
    sceneFrame = 0;
    placeScene();
  });
};

watch(geo, () => nextTick(placeScene));

onMounted(() => {
  measure();
  placeScene();
  resizeObserver = new ResizeObserver(() => {
    measure();
    scheduleScene();
    fitTitle();
  });
  // the name line too: it resizes when the display face swaps in, and is fitted again
  [heroRef.value, tableRef.value, introRef.value, accentRef.value].forEach(el => el && resizeObserver?.observe(el));
  window.addEventListener('resize', measure);

  heroObserver = new IntersectionObserver(([entry]) => {
    heroVisible = entry.intersectionRatio > 0.35;
  }, {threshold: [0, 0.35, 0.6]});
  if (stageRef.value) heroObserver.observe(stageRef.value);
  // A named card that is already in the fan flies straight out of it;
  // anything else (a random draw, a boon) goes through a full shuffle.
  unregister = registerDealer(target => run(() => (
    target && order.value.includes(target) ? drawFromFan(target) : shuffleAndDraw(target)
  )), () => heroVisible);

  void introDeal();
  void ensurePathwayData();
  void waitForFonts().then(() => {
    fitTitle();
    fontsReady.value = true;
  });
  // the display face can land after the capped wait: fit the name again on its real metrics
  document.fonts?.addEventListener('loadingdone', fitTitle);
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  heroObserver?.disconnect();
  window.removeEventListener('resize', measure);
  document.fonts?.removeEventListener('loadingdone', fitTitle);
  unregister?.();
  running.forEach(a => a.cancel());
  if (tiltFrame !== null) cancelAnimationFrame(tiltFrame);
  if (sceneFrame) cancelAnimationFrame(sceneFrame);
});
</script>

<style scoped>
.arc-hero {
  position: relative;
  isolation: isolate;
  min-height: max(600px, 100svh);
  padding: calc(var(--site-header-stack, 106px) + clamp(12px, 2.6vh, 36px)) clamp(18px, 4vw, 64px) clamp(20px, 3.4vh, 44px);
  /* the page's gutter, so the copy starts on the same edge as every section below */
  padding-inline: var(--arc-gutter);
  /* room under the deck before the potion story's room comes up over the city */
  padding-bottom: calc(var(--roof-h, 96px) + clamp(0px, 1vh, 12px));
  display: flex;
  align-items: center;
  overflow: clip;
}

/* Over the pinned potion story the night runs on below the hero, under the room's see-through top (HeroNightScene). */
@media (min-width: 901px) and (min-height: 591px) and (prefers-reduced-motion: no-preference) {
  .arc-hero {
    overflow-x: clip;
    overflow-y: visible;
  }
}

.arc-hero__grid {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: var(--arc-container);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  grid-template-rows: 1fr auto auto 1fr;
  grid-template-areas: ". table" "intro table" "body table" ". table";
  column-gap: clamp(24px, 3.5vw, 64px);
}

.arc-hero__intro { grid-area: intro; container-type: inline-size; }
.arc-hero__body { grid-area: body; }
.arc-hero__table { grid-area: table; }

.arc-hero__intro,
.arc-hero__body {
  position: relative;
  visibility: hidden;
  opacity: 0;
  transform: translateY(16px);
}

.arc-hero__intro.is-ready,
.arc-hero__body.is-ready {
  visibility: visible;
  opacity: 1;
  transform: none;
  transition: opacity .8s ease, transform 1s cubic-bezier(.2, .8, .2, 1);
}

.arc-hero__body.is-ready {
  transition-delay: .15s;
}

/* ---- copy ---- */
.arc-hero__title {
  margin: 0 0 clamp(18px, 2.6vh, 24px);
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  /* "Draw your" is ~4.9em wide: in English the title never wraps inside its own column */
  font-size: clamp(44px, min(19.5cqi, 12.5vh), 112px);
  line-height: .92;
  letter-spacing: -.03em;
  color: var(--arc-ink);
  text-shadow: 0 2px 30px color-mix(in srgb, var(--arc-bg) 60%, transparent);
}

.arc-hero__title > span {
  display: block;
}

.arc-hero__title-accent {
  color: var(--acc-ink);
  white-space: nowrap;
}

/* scaled by --fit with the line box kept at the title's own height (top-aligned, line-height compensated) */
.arc-hero__title-fit {
  display: inline-block;
  vertical-align: top;
  font-size: calc(1em * var(--fit, 1));
  line-height: calc(.92 / var(--fit, 1));
}

.arc-hero__lede {
  max-width: 34em;
  margin: 0 0 clamp(20px, 3.2vh, 30px);
  font-size: var(--arc-fs-lede);
  line-height: 1.6;
  color: color-mix(in oklab, var(--arc-ink) 72%, var(--arc-muted));
  text-wrap: pretty;
}

.arc-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.arc-hero__news-date {
  min-width: 3.4em;
  margin-left: 2px;
  padding-left: 11px;
  border-left: var(--arc-bw) solid var(--arc-line);
  font-size: var(--arc-fs-small);
  font-weight: 500;
  color: var(--arc-muted);
  text-align: left;
  white-space: nowrap;
  opacity: 0;
  transition: opacity .4s ease;
}

.arc-hero__news-date.is-shown {
  opacity: 1;
}

/* Laptop widths: the copy column is too narrow for both buttons with the date; keep them on one row. */
@media (min-width: 901px) and (max-width: 1140px) {
  .arc-hero__news-date {
    display: none;
  }
}

.arc-hero__shuffle.is-busy .fa-layer-group {
  animation: arc-hero-riffle .9s cubic-bezier(.6, 0, .3, 1) infinite;
}

@keyframes arc-hero-riffle {
  50% { transform: translateY(-2px) rotate(-12deg); }
}

.arc-hero__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 22px;
  margin-top: clamp(18px, 3vh, 26px);
}

.arc-hero .arc-ip {
  /* the field look (spec, global .arc-ip); blurred where it lies over the night scene */
  backdrop-filter: blur(6px);
}

/* The header's server chip shows and copies the address on wide screens; the hero's field
   only stands in where the bar drops the chip (HeaderItem, max-width 1220px). */
@media (min-width: 1221px) {
  .arc-hero__meta {
    display: none;
  }
}

.arc-hero__copy-note {
  flex-basis: 100%;
  max-width: 30em;
  margin: -2px 0 0;
  font-size: var(--arc-fs-small);
  line-height: 1.5;
  color: var(--arc-bad);
}

.arc-hero__copy-note:not(.is-shown) {
  margin: 0;
  height: 0;
  overflow: hidden;
}

/* ---- the table ---- */
.arc-hero__table {
  position: relative;
  align-self: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.arc-stage {
  position: relative;
  flex: none;
  touch-action: manipulation;
}

/* The moon behind the drawn card spills a little of the card's light. */
.arc-stage__backlight {
  position: absolute;
  left: calc(var(--pivot-x) - var(--card-w) * 1.1);
  top: calc(var(--pivot-y) + var(--drawn-y) - var(--card-h) * .75);
  width: calc(var(--card-w) * 2.2);
  height: calc(var(--card-h) * 1.5);
  border-radius: 50%;
  background: radial-gradient(closest-side, color-mix(in oklab, var(--acc) 26%, transparent), transparent);
  pointer-events: none;
}

/* A thin dial just outside the moon: 22 ticks, one per card. */
.arc-stage__orbit {
  position: absolute;
  left: calc(var(--pivot-x) - var(--u) * 1.06);
  top: calc(var(--pivot-y) - var(--u) * 1.06);
  width: calc(var(--u) * 2.12);
  height: calc(var(--u) * 2.12);
  color: color-mix(in oklab, var(--acc-ink) 60%, var(--arc-ink));
  pointer-events: none;
}

.arc-stage__fan {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.arc-stage__fan > .arc-card {
  pointer-events: auto;
}

.arc-stage__slot {
  position: absolute;
  left: calc(var(--pivot-x) - var(--card-w) / 2);
  top: calc(var(--pivot-y) + var(--drawn-y) - var(--card-h) / 2);
  width: var(--card-w);
  height: var(--card-h);
  display: grid;
  place-items: center;
  border-radius: calc(var(--card-w) * .05);
  border: var(--arc-bw-accent) dashed color-mix(in oklab, var(--acc-ink) 60%, transparent);
  background: radial-gradient(closest-side, color-mix(in oklab, var(--acc) 10%, transparent), color-mix(in srgb, var(--arc-bg) 50%, transparent));
  cursor: pointer;
  transition: opacity .5s ease, border-color .3s ease;
}

.arc-stage__slot:hover {
  border-color: var(--acc-ink);
}

.arc-stage__slot.is-gone {
  opacity: 0;
  pointer-events: none;
}

.arc-stage__slot-mark {
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: calc(var(--card-w) * .34);
  line-height: 1;
  color: color-mix(in oklab, var(--acc-ink) 70%, transparent);
}

/* Light theme: the empty spot is a card like the 22 around it, so it keeps the dark
   recess and light-accent dashes of the dark theme instead of a milky paper panel. */
:root[data-theme="parchment"] .arc-stage__slot {
  --arc-bg: #0b0b0e;
  --acc-ink: var(--acc);
  box-shadow: 0 1.5cqw 4cqw var(--arc-shadow);
}

.arc-card {
  all: unset;
  position: absolute;
  left: calc(var(--pivot-x) - var(--card-w) / 2);
  top: calc(var(--pivot-y) - var(--card-h) / 2);
  width: var(--card-w);
  height: var(--card-h);
  perspective: 1400px;
  cursor: pointer;
  border-radius: calc(var(--card-w) * .05);
  -webkit-tap-highlight-color: transparent;
}

.arc-card.is-drawn {
  cursor: default;
}

.arc-card:focus-visible {
  outline: none;
}

/* The focus ring is drawn on the card itself so it lifts and tilts with it (either face). */
.arc-card:focus-visible .arc-card__side--back,
.arc-card.is-drawn:focus-visible .arc-card__side--front {
  box-shadow:
    0 0 0 var(--arc-focus-off) var(--arc-bg),
    0 0 0 calc(var(--arc-focus-off) + var(--arc-focus-w)) var(--arc-ink),
    0 1cqw 3cqw var(--arc-shadow-strong);
}

.arc-card__lift {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transition: transform .45s cubic-bezier(.2, .8, .2, 1);
}

@media (hover: hover) {
  .arc-card.is-fan:hover .arc-card__lift {
    transform: translateY(-12%);
  }
}

.arc-card.is-fan:focus-visible .arc-card__lift {
  transform: translateY(-12%);
}

.arc-card.is-drawn .arc-card__lift {
  transition: none;
}

.arc-card__flip {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  container-type: inline-size;
}

.arc-card__side {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 5cqw;
  box-shadow: 0 1.5cqw 4cqw var(--arc-shadow-strong);
}

.arc-card.is-drawn .arc-card__side--front {
  box-shadow:
    0 5cqw 16cqw var(--arc-shadow-strong),
    0 0 0 1px color-mix(in oklab, var(--acc) 40%, transparent),
    0 0 20cqw color-mix(in oklab, var(--acc) 22%, transparent);
}

/* Each side is its own plane in the card's 3D space, so every engine culls the face
   turned away (WebKit misses it on an untransformed side with composited content). */
.arc-card__side--front {
  transform: rotateY(0deg);
}

.arc-card__side--back {
  transform: rotateY(180deg);
}

.arc-card__sheen {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  opacity: calc(.25 + var(--sheen, 0) * .75);
  background:
    radial-gradient(circle at var(--mx, 50%) var(--my, 30%), rgba(255, 255, 255, .2), transparent 42%),
    linear-gradient(115deg, transparent 30%, color-mix(in oklab, var(--acc) 22%, transparent) 48%, rgba(255, 255, 255, .08) 52%, transparent 70%);
  background-size: 100% 100%, 260% 260%;
  background-position: 0 0, calc(var(--mx, 50%) * -1) 50%;
  mix-blend-mode: screen;
}

/* ---- under the deck: the draw button and, once drawn, the link to the reading ---- */
.arc-hero__draw {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  max-width: 100%;
  /* the same room drawn or not, so the first draw never moves the page */
  min-height: var(--draw-room, 44px);
  margin-top: 4px;
  text-align: center;
}

.arc-hero__draw-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px 18px;
}

.arc-hero .arc-hero__shuffle {
  flex: none;
  /* compact buttons keep the family's label size (spec) */
  font-size: var(--arc-btn-fs);
}

/* Both labels share one cell, so the button keeps its width when it changes. */
.arc-hero__shuffle-label {
  display: inline-grid;
}

.arc-hero__shuffle-label > span {
  grid-area: 1 / 1;
}

.arc-hero__shuffle-label > .is-off {
  visibility: hidden;
}

.arc-hero__hint {
  max-width: 24em;
  margin: 0;
  font-size: var(--arc-fs-small);
  line-height: 1.5;
  color: var(--arc-muted);
  text-align: left;
  text-wrap: pretty;
}

/* an action link (spec): ink label, accent arrow that steps on */
.arc-hero__read {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  /* padded for a rounded focus ring; the negative margin keeps the text where it was */
  margin: -4px -6px -4px -2px;
  padding: 4px 6px;
  border-radius: var(--arc-r-sm);
  font-weight: 600;
  color: var(--arc-ink);
  text-decoration: none;
  white-space: nowrap;
}

.arc-hero__read:hover {
  color: var(--arc-ink);
}

.arc-hero__read:focus-visible {
  outline: var(--arc-focus-w) solid var(--arc-ink);
  outline-offset: var(--arc-focus-off);
}

.arc-hero__read i {
  font-size: 12px;
  /* lifted toward the ink: the deepest accents (Priest) sit just under 3:1 on the night sky */
  color: color-mix(in oklab, var(--acc-ink) 80%, var(--arc-ink));
  transition: transform .3s cubic-bezier(.2, .8, .2, 1);
}

.arc-hero__read:hover i {
  transform: translateY(3px);
}

/*
 * Light theme: the line under the deck sits on the moon's rose haze, not on paper, so the
 * muted and accent inks (tuned for paper) are taken a step toward the ink to keep 4.5:1.
 */
:root[data-theme="parchment"] .arc-hero__hint {
  color: color-mix(in oklab, var(--arc-muted) 30%, var(--arc-ink));
}

/* (no patch of paper behind the group: the castle's foot fades into the fog instead, HeroNightScene) */

:root[data-theme="parchment"] .arc-hero__read i {
  color: color-mix(in oklab, var(--acc-ink) 45%, var(--arc-ink));
}

/* ---- stacked: title, then the deck, then the pitch ---- */
@media (max-width: 900px) {
  .arc-hero {
    min-height: 0;
    padding-bottom: clamp(28px, 5vh, 60px);
    padding-top: calc(var(--site-header-stack, 106px) + 22px);
    align-items: flex-start;
  }

  .arc-hero__grid {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: none;
    grid-template-areas: "intro" "table" "body";
    row-gap: 22px;
  }

  .arc-hero__title {
    margin-bottom: 0;
    font-size: clamp(42px, 10vw, 84px);
  }

  .arc-hero__body {
    max-width: 640px;
    padding-top: 8px;
  }

  .arc-hero__draw {
    --draw-room: 76px;
  }

  .arc-hero__draw-row {
    flex-direction: column;
  }

  .arc-hero__hint {
    text-align: center;
  }
}

@media (max-width: 520px) {
  .arc-hero__title {
    font-size: clamp(42px, 13.5vw, 60px);
  }

  .arc-hero__lede {
    font-size: 16px;
  }

  .arc-hero .arc-hero__shuffle {
    width: auto;
    min-width: min(100%, 240px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .arc-hero__intro.is-ready,
  .arc-hero__body.is-ready {
    transition: none;
  }

  /* Cards swap instantly: no app-wide micro-transition on the card or its flip. */
  .arc-card,
  .arc-card__lift,
  .arc-card__flip {
    transition: none !important;
  }
}
</style>
