<template>
  <section ref="heroRef" class="arc-hero" aria-labelledby="arc-hero-title">
    <div class="arc-hero__glow" aria-hidden="true"></div>

    <div class="arc-hero__grid">
      <!-- Copy: what this is, how to get in. Shown once the fonts are in, so nothing jumps. -->
      <div class="arc-hero__intro" :class="{'is-ready': fontsReady}">
        <p class="arc-eyebrow">
          <span class="arc-eyebrow__dot" aria-hidden="true"></span>{{ t('home.arcana.hero.eyebrow') }}
        </p>
        <h1 id="arc-hero-title" class="arc-hero__title">
          <span>{{ t('home.arcana.hero.titleA') }}</span>
          <span class="arc-hero__title-accent">{{ t('home.arcana.hero.titleB') }}</span>
        </h1>
      </div>
      <div class="arc-hero__body" :class="{'is-ready': fontsReady}">
        <p class="arc-hero__lede">{{ t('home.arcana.hero.lede') }}</p>

        <div class="arc-hero__actions">
          <RouterLink :to="$lp('/guide/connect')" class="arc-btn arc-btn--solid">
            {{ t('home.arcana.hero.join') }}
            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </RouterLink>
          <button type="button" class="arc-btn arc-btn--ghost" :disabled="busy" @click="shuffleAndDraw()">
            <i class="fa-solid fa-layer-group" aria-hidden="true"></i>
            {{ t('home.arcana.hero.shuffle') }}
          </button>
        </div>

        <div class="arc-hero__meta">
          <button type="button" class="arc-ip" :class="`is-${copyState}`" @click="copy">
            <span class="arc-ip__label">{{ t('home.arcana.ip.label') }}</span>
            <span class="arc-ip__address">{{ address }}</span>
            <span class="arc-ip__hint" aria-live="polite">
              <i :class="copyIcon" aria-hidden="true"></i>
              {{ copyLabel }}
            </span>
          </button>
          <p class="arc-status" :class="statusClass">
            <span class="arc-status__dot" aria-hidden="true"></span>
            {{ statusLabel }}
          </p>
        </div>
      </div>

      <!-- The table: 22 cards fanned behind the one you drew -->
      <div class="arc-hero__table">
        <div
            ref="stageRef"
            class="arc-stage"
            :style="stageStyle"
            @pointermove="onStagePointer"
            @pointerleave="onStageLeave"
        >
          <svg class="arc-stage__cloth" viewBox="0 0 400 400" aria-hidden="true">
            <circle cx="200" cy="200" r="196" fill="none" stroke="currentColor" stroke-width=".6" opacity=".35"/>
            <circle cx="200" cy="200" r="180" fill="none" stroke="currentColor" stroke-width=".5" stroke-dasharray="2 6" opacity=".4"/>
            <circle cx="200" cy="200" r="130" fill="none" stroke="currentColor" stroke-width=".4" opacity=".22"/>
            <g stroke="currentColor" stroke-width=".5" opacity=".3">
              <path v-for="n in 22" :key="n" :transform="`rotate(${n * (360 / 22)} 200 200)`" d="M200 6v12"/>
            </g>
          </svg>

          <div
              ref="fanRef"
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
                :class="{'is-drawn': id === drawn, 'is-fan': id !== drawn, 'is-flying': flying.has(id)}"
                :style="cardStyle(id)"
                :tabindex="id === drawn ? -1 : (fanIndex(id) === focusIndex ? 0 : -1)"
                :aria-hidden="id === drawn ? 'true' : undefined"
                :aria-label="id === drawn ? undefined : t('home.arcana.hero.cardLabel').replace('{n}', String(fanIndex(id) + 1)).replace('{total}', String(fanIds.length))"
                @click="id !== drawn && drawFromFan(id)"
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

        <!-- what you drew, in words -->
        <div class="arc-hero__caption">
          <p class="arc-hero__drew">
            <span class="arc-hero__drew-label">{{ t('home.arcana.hero.youDrew') }}</span>
            <span class="arc-hero__drew-name">
              <span class="arc-hero__drew-num">{{ card.boon ? t('home.arcana.deck.boon') : card.numeral }}</span>
              {{ reading.name }}
            </span>
            <span v-if="reading.seq9" class="arc-hero__drew-role">
              {{ t('home.arcana.hero.beginsAs').replace('{role}', reading.seq9) }}
            </span>
          </p>
          <a href="#reading" class="arc-hero__read">
            {{ t('home.arcana.hero.readCard') }}
            <i class="fa-solid fa-arrow-down" aria-hidden="true"></i>
          </a>
        </div>
        <p class="arc-hero__hint">{{ t('home.arcana.hero.hint') }}</p>
      </div>
    </div>

    <p class="arc-sr" aria-live="polite">{{ announcement }}</p>
  </section>
</template>

<script setup lang="ts">
import {computed, nextTick, onMounted, onUnmounted, ref, shallowReactive, watch, type ComponentPublicInstance} from 'vue';
import ArcanaFace from './ArcanaFace.vue';
import ArcanaBack from './ArcanaBack.vue';
import {CORE_CARDS, cardById, sigilNative} from './arcana-data';
import {ensurePathwayData, randomCard, storedCard, useArcana} from './useArcana';
import {useCopyAddress} from './useCopyAddress';
import {useI18n} from '@/composables/useI18n';
import {useServerStatus} from '@/composables/useServer';

const {t} = useI18n();
const {currentId, card, reading, readingFor, nameOf, seq9Of, reveal, registerDealer} = useArcana();
const {state: copyState, copy, address} = useCopyAddress();
const {isOnline, playerCount, checkedAt} = useServerStatus();

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
const statusClass = computed(() => (!checkedAt.value ? 'is-checking' : isOnline.value ? 'is-online' : 'is-offline'));
const statusLabel = computed(() => {
  if (!checkedAt.value) return t('home.arcana.status.checking');
  if (!isOnline.value) return t('home.arcana.status.offline');
  return t('home.arcana.status.onlineCount').replace('{count}', String(playerCount.value ?? 0));
});

/* ---------------- deck state ---------------- */
const shuffled = <T, >(list: T[]): T[] => {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const initial = storedCard() ?? 'fool';
/** Cards on the table: the 22, plus any boon drawn from the deck browser. */
const heroIds = ref<string[]>(CORE_CARDS.map(c => c.id).concat(cardById(initial).boon ? [initial] : []));
const drawn = ref(initial);
/** Fan order (every hero card except the drawn one). */
const order = ref<string[]>(shuffled(heroIds.value.filter(id => id !== initial)));
const fanIds = computed(() => order.value);
const fanIndex = (id: string) => order.value.indexOf(id);
/** Cards whose face is rendered (the drawn card and one leaving). */
const fronts = shallowReactive(new Set<string>([initial]));
const flying = shallowReactive(new Set<string>());
const busy = ref(false);
const fontsReady = ref(false);
const focusIndex = ref(0);
const announcement = ref('');

const roleOf = (id: string) => {
  const role = seq9Of(id);
  if (!role) return '';
  return t('home.arcana.hero.seqRole').replace('{role}', role);
};

/* ---------------- geometry ---------------- */
const stageRef = ref<HTMLElement | null>(null);
const heroRef = ref<HTMLElement | null>(null);
const fanRef = ref<HTMLElement | null>(null);
const stageW = ref(600);

type Pose = {x: number; y: number; r: number; s: number};
const FAN_SCALE = 0.4;
const SPAN = 76;

const geo = computed(() => {
  const W = stageW.value;
  const cardW = W * 0.42;
  const cardH = cardW * 1.62;
  return {W, H: W * 0.98, cardW, cardH, pivotX: W / 2, pivotY: W * 0.56, rc: W * 0.37};
});

const slotPose = (index: number, count: number): Pose => {
  const {rc} = geo.value;
  const a = count > 1 ? -SPAN + (2 * SPAN * index) / (count - 1) : 0;
  const rad = (a * Math.PI) / 180;
  return {x: rc * Math.sin(rad), y: -rc * Math.cos(rad), r: a, s: FAN_SCALE};
};
const drawnPose = (): Pose => ({x: 0, y: geo.value.W * 0.045, r: 0, s: 1});
const poseOf = (id: string): Pose => (id === drawn.value ? drawnPose() : slotPose(fanIndex(id), order.value.length));
const css = (p: Pose) => `translate(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px) rotate(${p.r.toFixed(2)}deg) scale(${p.s.toFixed(4)})`;

/** Push a fan pose outward along its own axis (the "lifting a card out" beat). */
const outward = (p: Pose, distance: number, s: number): Pose => {
  const rad = (p.r * Math.PI) / 180;
  return {x: p.x + Math.sin(rad) * distance, y: p.y - Math.cos(rad) * distance, r: p.r * 0.85, s};
};

const stageStyle = computed(() => ({
  width: `${geo.value.W}px`,
  height: `${geo.value.H}px`,
  '--card-w': `${geo.value.cardW}px`,
  '--card-h': `${geo.value.cardH}px`,
  '--pivot-x': `${geo.value.pivotX}px`,
  '--pivot-y': `${geo.value.pivotY}px`,
}));

const cardStyle = (id: string) => ({
  transform: css(poseOf(id)),
  zIndex: id === drawn.value ? 100 : 10 + fanIndex(id),
});

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
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const EASE_OUT = 'cubic-bezier(.16, .84, .24, 1)';
const EASE_IN_OUT = 'cubic-bezier(.65, 0, .35, 1)';
const finished = (animations: Animation[]) => Promise.all(animations.map(a => a.finished.catch(() => undefined)));

const preloaded = new Set<string>();
function preload(id: string): Promise<void> {
  if (preloaded.has(id)) return Promise.resolve();
  preloaded.add(id);
  const img = new Image();
  img.src = sigilNative(id);
  return Promise.race([img.decode().catch(() => undefined), sleep(350)]).then(() => undefined);
}

function flipAnim(id: string, from: number, to: number, options: KeyframeAnimationOptions, holdUntil = 0, doneAt = 1) {
  const el = flipEls.get(id);
  if (!el) return null;
  return el.animate([
    {transform: `rotateY(${from}deg)`, offset: 0},
    {transform: `rotateY(${from}deg)`, offset: holdUntil},
    {transform: `rotateY(${to}deg)`, offset: doneAt},
    {transform: `rotateY(${to}deg)`, offset: 1},
  ], options);
}

/** Announce + re-theme at the moment the face turns toward the viewer. */
function revealAt(id: string, ms: number) {
  return sleep(ms).then(() => {
    reveal(id);
    const r = readingFor(id);
    announcement.value = t('home.arcana.hero.announce')
        .replace('{name}', r.name)
        .replace('{role}', r.seq9 || '-');
  });
}

/* ---------------- draw a specific fan card ---------------- */
async function drawFromFan(id: string) {
  if (busy.value || id === drawn.value) return;
  busy.value = true;
  void ensurePathwayData();
  const old = drawn.value;
  const k = fanIndex(id);
  const fromNew = poseOf(id);
  const fromOld = poseOf(old);

  fronts.add(id);
  await Promise.all([ensurePathwayData(), preload(id)]);

  const hadFocus = document.activeElement === cardEls.get(id);
  const nextOrder = order.value.slice();
  nextOrder[k] = old;
  order.value = nextOrder;
  drawn.value = id;
  focusIndex.value = k;
  await nextTick();
  // The drawn card leaves the fan (and the tab order); keep keyboard focus in the fan.
  if (hadFocus) cardEls.get(old)?.focus({preventScroll: true});

  if (reducedMotion()) {
    fronts.delete(old);
    reveal(id);
    announcement.value = t('home.arcana.hero.announce').replace('{name}', readingFor(id).name).replace('{role}', readingFor(id).seq9 || '-');
    busy.value = false;
    return;
  }

  const W = geo.value.W;
  const D = 1050;
  flying.add(id);
  flying.add(old);
  const animations: Animation[] = [];
  const newEl = cardEls.get(id);
  const oldEl = cardEls.get(old);
  if (newEl) {
    animations.push(newEl.animate([
      {transform: css(fromNew), offset: 0},
      {transform: css(outward(fromNew, W * 0.16, FAN_SCALE * 1.18)), offset: 0.24, easing: EASE_IN_OUT},
      {transform: css({x: 0, y: -W * 0.07, r: 0, s: 1.07}), offset: 0.74, easing: EASE_OUT},
      {transform: css(drawnPose()), offset: 1},
    ], {duration: D, easing: 'linear'}));
  }
  const fNew = flipAnim(id, 180, 0, {duration: D, easing: EASE_IN_OUT}, 0.26, 0.82);
  if (fNew) animations.push(fNew);
  if (oldEl) {
    oldEl.style.zIndex = '90';
    animations.push(oldEl.animate([
      {transform: css(fromOld), offset: 0},
      {transform: css({...fromOld, y: fromOld.y + W * 0.05, s: 0.9}), offset: 0.3, easing: EASE_IN_OUT},
      {transform: css(slotPose(k, order.value.length)), offset: 1},
    ], {duration: D * 0.8, easing: EASE_OUT, delay: 60}));
  }
  const fOld = flipAnim(old, 0, 180, {duration: D * 0.8, easing: EASE_IN_OUT, delay: 60}, 0, 0.45);
  if (fOld) animations.push(fOld);

  await Promise.all([finished(animations), revealAt(id, D * 0.56)]);
  if (oldEl) oldEl.style.zIndex = '';
  fronts.delete(old);
  flying.delete(id);
  flying.delete(old);
  busy.value = false;
}

/* ---------------- shuffle the whole deck, then deal one ---------------- */
async function shuffleAndDraw(targetId?: string) {
  if (busy.value) return;
  busy.value = true;
  const old = drawn.value;
  const target = targetId && targetId !== old ? targetId : randomCard(old);
  const ids = heroIds.value.includes(target) ? heroIds.value.slice() : heroIds.value.concat(target);

  fronts.add(target);
  const ready = Promise.all([ensurePathwayData(), preload(target)]);

  if (reducedMotion()) {
    await ready;
    heroIds.value = ids;
    order.value = shuffled(ids.filter(id => id !== target));
    drawn.value = target;
    fronts.delete(old);
    reveal(target);
    announcement.value = t('home.arcana.hero.announce').replace('{name}', readingFor(target).name).replace('{role}', readingFor(target).seq9 || '-');
    busy.value = false;
    return;
  }

  const W = geo.value.W;
  const stackIndex = new Map(heroIds.value.map((id, i) => [id, i]));
  const stackPose = (id: string): Pose => {
    const i = stackIndex.get(id) ?? 0;
    return {x: Math.sin(i * 2.3) * W * 0.008, y: -W * 0.04 - i * 0.6, r: Math.sin(i * 1.7) * 3, s: 0.62};
  };

  /* 1 - gather everything into one pile; the drawn card turns face-down */
  const gather: Animation[] = [];
  heroIds.value.forEach((id, i) => {
    const el = cardEls.get(id);
    if (!el) return;
    gather.push(el.animate([{transform: css(poseOf(id))}, {transform: css(stackPose(id))}], {
      duration: 520, delay: Math.abs(i - heroIds.value.length / 2) * 14, easing: EASE_IN_OUT, fill: 'forwards',
    }));
  });
  const flipDown = flipAnim(old, 0, 180, {duration: 420, easing: EASE_IN_OUT, fill: 'forwards'});
  await finished(gather);

  /* 2 - riffle twice: the pile splits and interleaves */
  const riffle: Animation[] = [];
  heroIds.value.forEach((id, i) => {
    const el = cardEls.get(id);
    if (!el) return;
    const base = stackPose(id);
    const side = i % 2 ? 1 : -1;
    const split: Pose = {x: side * W * 0.19, y: base.y - W * 0.02, r: side * 9, s: 0.62};
    riffle.push(el.animate([
      {transform: css(base)},
      {transform: css(split), offset: 0.25},
      {transform: css(base), offset: 0.5},
      {transform: css({...split, x: split.x * 0.8}), offset: 0.75},
      {transform: css(base)},
    ], {duration: 980, delay: (i % 11) * 9, easing: EASE_IN_OUT, fill: 'forwards'}));
  });
  await Promise.all([finished(riffle), ready]);

  /* 3 - new order, then fan out and deal the drawn card to the front */
  heroIds.value = ids;
  order.value = shuffled(ids.filter(id => id !== target));
  drawn.value = target;
  focusIndex.value = 0;
  await nextTick();

  const deal: Animation[] = [];
  const count = order.value.length;
  order.value.forEach((id, k) => {
    const el = cardEls.get(id);
    if (!el) return;
    deal.push(el.animate([{transform: css(stackPose(id))}, {transform: css(slotPose(k, count))}], {
      duration: 640, delay: 40 + Math.abs(k - (count - 1) / 2) * 18, easing: EASE_OUT, fill: 'backwards',
    }));
  });
  const targetEl = cardEls.get(target);
  flying.add(target);
  const DEAL = 980;
  if (targetEl) {
    deal.push(targetEl.animate([
      {transform: css(stackPose(target)), offset: 0},
      {transform: css({x: 0, y: -W * 0.16, r: -4, s: 0.78}), offset: 0.42, easing: EASE_OUT},
      {transform: css(drawnPose()), offset: 1},
    ], {duration: DEAL, delay: 260, easing: EASE_IN_OUT, fill: 'backwards'}));
  }
  const flipUp = flipAnim(target, 180, 0, {duration: DEAL, delay: 260, easing: EASE_IN_OUT, fill: 'backwards'}, 0.38, 0.86);
  if (flipUp) deal.push(flipUp);
  // The new animations hold their first frame, so the pile can be released now.
  gather.forEach(a => a.cancel());
  riffle.forEach(a => a.cancel());
  flipDown?.cancel();

  await Promise.all([finished(deal), revealAt(target, 260 + DEAL * 0.6)]);
  if (old !== target) fronts.delete(old);
  flying.delete(target);
  busy.value = false;
}

/* ---------------- intro: the deal on load ---------------- */
function introDeal() {
  if (reducedMotion()) {
    reveal(drawn.value);
    return;
  }
  const W = geo.value.W;
  const start: Pose = {x: 0, y: W * 0.3, r: 0, s: 0.5};
  const count = order.value.length;
  busy.value = true;
  const animations: Animation[] = [];
  order.value.forEach((id, k) => {
    const el = cardEls.get(id);
    if (!el) return;
    animations.push(el.animate([
      {transform: css(start), opacity: 0},
      {transform: css({...start, y: start.y - W * 0.06}), opacity: 1, offset: 0.2},
      {transform: css(slotPose(k, count)), opacity: 1},
    ], {duration: 900, delay: 120 + k * 26, easing: EASE_OUT, fill: 'backwards'}));
  });
  const id = drawn.value;
  const el = cardEls.get(id);
  flying.add(id);
  if (el) {
    animations.push(el.animate([
      {transform: css(start), opacity: 0, offset: 0},
      {transform: css({x: 0, y: -W * 0.12, r: -3, s: 0.8}), opacity: 1, offset: 0.45, easing: EASE_OUT},
      {transform: css(drawnPose()), opacity: 1, offset: 1},
    ], {duration: 1150, delay: 520, easing: EASE_IN_OUT, fill: 'backwards'}));
  }
  const f = flipAnim(id, 180, 0, {duration: 1150, delay: 520, easing: EASE_IN_OUT, fill: 'backwards'}, 0.4, 0.88);
  if (f) animations.push(f);
  void revealAt(id, 520 + 1150 * 0.62);
  void finished(animations).then(() => {
    flying.delete(id);
    busy.value = false;
  });
}

/* ---------------- keep in sync with draws made elsewhere on the page ---------------- */
watch(currentId, id => {
  if (busy.value || id === drawn.value) return;
  const old = drawn.value;
  if (!heroIds.value.includes(id)) {
    heroIds.value = heroIds.value.concat(id);
    order.value = order.value.concat(old);
  } else {
    order.value = order.value.map(entry => (entry === id ? old : entry));
  }
  fronts.add(id);
  fronts.delete(old);
  drawn.value = id;
});

/* ---------------- keyboard: roving focus across the fan ---------------- */
function onCardFocus(id: string) {
  focusIndex.value = fanIndex(id);
  void preload(id);
}

function onFanKey(event: KeyboardEvent) {
  const keys: Record<string, number> = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1};
  let next = focusIndex.value;
  if (event.key in keys) next = (focusIndex.value + keys[event.key] + order.value.length) % order.value.length;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = order.value.length - 1;
  else return;
  event.preventDefault();
  focusIndex.value = next;
  cardEls.get(order.value[next])?.focus();
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
  const settled = Math.abs(next.rx - tiltTarget.rx) + Math.abs(next.ry - tiltTarget.ry) + Math.abs(next.on - tiltTarget.on) < 0.02;
  tiltFrame = settled ? null : requestAnimationFrame(stepTilt);
}

function onStagePointer(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || reducedMotion()) return;
  const el = cardEls.get(drawn.value);
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const px = (event.clientX - rect.left) / rect.width;
  const py = (event.clientY - rect.top) / rect.height;
  const near = px > -0.4 && px < 1.4 && py > -0.3 && py < 1.3;
  const cx = Math.max(-0.2, Math.min(1.2, px));
  const cy = Math.max(-0.2, Math.min(1.2, py));
  tiltTarget = near
      ? {rx: (0.5 - cy) * 16, ry: (cx - 0.5) * 18, mx: cx * 100, my: cy * 100, on: 1}
      : {rx: 0, ry: 0, mx: 50, my: 30, on: 0};
  if (tiltFrame === null) tiltFrame = requestAnimationFrame(stepTilt);
}

function onStageLeave() {
  tiltTarget = {rx: 0, ry: 0, mx: 50, my: 30, on: 0};
  if (tiltFrame === null) tiltFrame = requestAnimationFrame(stepTilt);
}

/* ---------------- fonts: reveal the copy once its faces are in (capped) ---------------- */
function waitForFonts(): Promise<void> {
  const cap = sleep(1600);
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
      document.fonts.load('700 64px Commissioner'),
      document.fonts.load('400 18px "Golos Text"'),
      document.fonts.load('600 16px "Golos Text"'),
      document.fonts.load('400 11px "Tenor Sans"'),
      document.fonts.load('500 14px "IBM Plex Mono"'),
    ]).catch(() => undefined);
  })();
  return Promise.race([ready, cap]).then(() => undefined);
}

/* ---------------- lifecycle ---------------- */
let resizeObserver: ResizeObserver | null = null;
let heroObserver: IntersectionObserver | null = null;
let heroVisible = true;
let unregister: (() => void) | null = null;

const measure = () => {
  const host = stageRef.value?.parentElement;
  if (!host) return;
  const width = host.clientWidth;
  const viewport = window.innerHeight;
  // The table never grows taller than the first screen leaves room for.
  const byHeight = viewport > 600 && window.innerWidth > 900 ? (viewport - 230) / 0.98 : Infinity;
  // On phones the outermost fan cards would kiss the screen edge; keep a margin.
  const usable = window.innerWidth < 600 ? width * 0.93 : width;
  stageW.value = Math.round(Math.max(260, Math.min(usable, 780, byHeight)));
};

onMounted(() => {
  measure();
  resizeObserver = new ResizeObserver(measure);
  if (stageRef.value?.parentElement) resizeObserver.observe(stageRef.value.parentElement);
  heroObserver = new IntersectionObserver(([entry]) => {
    heroVisible = entry.intersectionRatio > 0.35;
  }, {threshold: [0, 0.35, 0.6]});
  if (stageRef.value) heroObserver.observe(stageRef.value);
  // A named card that is already in the fan flies straight out of it;
  // anything else (a random draw, a boon) goes through a full shuffle.
  unregister = registerDealer(target => (
    target && order.value.includes(target) ? drawFromFan(target) : shuffleAndDraw(target)
  ), () => heroVisible);

  introDeal();
  void ensurePathwayData();
  void waitForFonts().then(() => (fontsReady.value = true));
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  heroObserver?.disconnect();
  unregister?.();
  if (tiltFrame !== null) cancelAnimationFrame(tiltFrame);
});

</script>

<style scoped>
.arc-hero {
  position: relative;
  min-height: 100svh;
  padding: calc(var(--site-header-stack, 106px) + clamp(12px, 3vh, 40px)) clamp(18px, 4vw, 64px) clamp(28px, 5vh, 56px);
  display: flex;
  align-items: flex-start;
  overflow: clip;
}

.arc-hero__glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(42% 52% at 72% 52%, color-mix(in oklab, var(--acc) 20%, transparent), transparent 70%),
    radial-gradient(60% 40% at 20% 100%, color-mix(in oklab, var(--acc) 8%, transparent), transparent 70%);
}

.arc-hero__grid {
  position: relative;
  width: 100%;
  max-width: 1320px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  grid-template-rows: 1fr auto auto 1fr;
  grid-template-areas: ". table" "intro table" "body table" ". table";
  column-gap: clamp(24px, 4vw, 72px);
}

/* Big screens: the table is the tallest thing, so centring cannot jump. */
@media (min-width: 1200px) {
  .arc-hero__grid {
    margin-block: auto;
  }
}

.arc-hero__intro { grid-area: intro; }
.arc-hero__body { grid-area: body; }
.arc-hero__table { grid-area: table; align-self: start; }

.arc-hero__intro,
.arc-hero__body {
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
  margin: 18px 0 22px;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: clamp(48px, 7.6vw, 118px);
  line-height: .92;
  letter-spacing: -.03em;
  color: var(--arc-ink);
}

.arc-hero__title span {
  display: block;
}

.arc-hero__title-accent {
  color: var(--acc);
  transition: color .2s;
}

.arc-hero__lede {
  max-width: 34em;
  margin: 0 0 30px;
  font-size: clamp(16px, 1.25vw, 19px);
  line-height: 1.6;
  color: var(--arc-muted);
}

.arc-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.arc-hero__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px 22px;
  margin-top: 26px;
}

/* ---- the table ---- */
.arc-hero__table {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.arc-stage {
  position: relative;
  touch-action: manipulation;
}

.arc-stage__cloth {
  position: absolute;
  left: calc(var(--pivot-x) - var(--card-h) * 1.02);
  top: calc(var(--pivot-y) - var(--card-h) * 1.02);
  width: calc(var(--card-h) * 2.04);
  height: calc(var(--card-h) * 2.04);
  color: var(--acc);
  pointer-events: none;
  animation: arc-spin 120s linear infinite;
}

@keyframes arc-spin {
  to { transform: rotate(360deg); }
}

.arc-stage__fan {
  position: absolute;
  inset: 0;
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
  will-change: transform;
  border-radius: calc(var(--card-w) * .05);
  -webkit-tap-highlight-color: transparent;
}

.arc-card.is-drawn {
  cursor: default;
}

.arc-card:focus-visible {
  outline: 3px solid var(--arc-ink);
  outline-offset: 6px;
}

.arc-card__lift {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transition: transform .45s cubic-bezier(.2, .8, .2, 1);
}

.arc-card.is-fan:hover .arc-card__lift,
.arc-card.is-fan:focus-visible .arc-card__lift {
  transform: translateY(-11%);
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
  box-shadow: 0 2cqw 6cqw rgba(0, 0, 0, .55);
}

.arc-card.is-fan .arc-card__side {
  box-shadow: 0 1cqw 3cqw rgba(0, 0, 0, .6);
}

.arc-card.is-drawn .arc-card__side--front {
  box-shadow:
    0 4cqw 14cqw rgba(0, 0, 0, .65),
    0 0 18cqw color-mix(in oklab, var(--acc) 26%, transparent);
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
    radial-gradient(circle at var(--mx, 50%) var(--my, 30%), rgba(255, 255, 255, .22), transparent 42%),
    linear-gradient(115deg, transparent 30%, color-mix(in oklab, var(--acc) 22%, transparent) 48%, rgba(255, 255, 255, .08) 52%, transparent 70%);
  background-size: 100% 100%, 260% 260%;
  background-position: 0 0, calc(var(--mx, 50%) * -1) 50%;
  mix-blend-mode: screen;
}

/* ---- caption ---- */
.arc-hero__caption {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px 22px;
  margin-top: 4px;
  text-align: center;
}

.arc-hero__drew {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  gap: 4px 12px;
  margin: 0;
}

.arc-hero__drew-label,
.arc-hero__drew-role {
  font-family: var(--arc-caps);
  font-size: 11px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--arc-muted);
}

.arc-hero__drew-name {
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: 17px;
  color: var(--arc-ink);
}

.arc-hero__drew-num {
  margin-right: 6px;
  font-family: var(--arc-caps);
  font-size: 14px;
  font-weight: 500;
  color: var(--acc);
}

.arc-hero__read {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 2px;
  font-family: var(--arc-caps);
  font-size: 11px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--acc);
  border-bottom: 1px solid color-mix(in oklab, var(--acc) 45%, transparent);
}

.arc-hero__read:hover {
  color: var(--arc-ink);
}

.arc-hero__hint {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--arc-muted);
  text-align: center;
}

/* ---- responsive ---- */
@media (max-width: 900px) {
  .arc-hero {
    min-height: 0;
    padding-top: calc(var(--site-header-stack, 106px) + 28px);
  }

  .arc-hero__grid {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    grid-template-areas: "intro" "table" "body";
    row-gap: 28px;
  }

  .arc-hero__title {
    margin-bottom: 0;
  }

  .arc-hero__body {
    max-width: 640px;
  }
}

@media (max-width: 520px) {
  .arc-hero__title {
    font-size: clamp(44px, 14vw, 60px);
    margin-top: 14px;
  }

  .arc-hero .arc-eyebrow {
    font-size: 9.5px;
    letter-spacing: .06em;
  }

  .arc-hero__lede {
    font-size: 16px;
    margin-bottom: 22px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .arc-hero__intro.is-ready,
  .arc-hero__body.is-ready {
    transition: none;
  }

  .arc-stage__cloth {
    animation: none;
  }

  .arc-card__lift {
    transition: none;
  }
}
</style>
