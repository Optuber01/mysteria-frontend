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
          <p class="arc-orbit__lede">{{ t('home.arcana.deck.lede') }}</p>
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
          <div :key="`glow-${card.id}`" class="arc-orbit__glow" aria-hidden="true"></div>
          <div class="arc-orbit__track" aria-hidden="true"></div>
          <div class="arc-orbit__track arc-orbit__track--inner" aria-hidden="true"></div>

          <!-- The drawn seal, risen out of the ring -->
          <div :key="card.id" class="arc-orbit__centre">
            <span ref="centreSealRef" class="arc-orbit__drawn" :data-motif="motifOf(card.id)" aria-hidden="true">
              <i class="arc-orbit__halo"></i>
              <img :src="sigilNative(card.id)" alt="" width="512" height="512" decoding="async" draggable="false">
              <b class="arc-orbit__badge">{{ card.boon ? '✶' : card.numeral }}</b>
            </span>
            <h3 id="arc-orbit-name" class="arc-orbit__name">{{ nameOf(card.id) }}</h3>
            <p class="arc-orbit__role">{{ numeralLabel(card) }}</p>
          </div>

          <div
              ref="ringRef"
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
              <span class="arc-seal__label" aria-hidden="true">
                <strong>{{ nameOf(item.id) }}</strong>
                <small>{{ countLabel(sequenceCounts[item.id] ?? (item.boon ? 5 : 10)) }}</small>
              </span>
            </button>
          </div>
        </div>

        <div class="arc-orbit__controls">
          <button type="button" class="arc-orbit__step" :aria-label="t('home.arcana.deck.previous')" @click="step(-1)">
            <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
          </button>
          <p class="arc-orbit__count">
            <span aria-hidden="true"><b>{{ pad(selectedIndex + 1) }}</b> / {{ pad(catalog.length) }}</span>
            <span class="arc-orbit__hint">{{ geo.dial ? t('home.arcana.deck.hintTouch') : t('home.arcana.deck.hint') }}</span>
          </p>
          <button type="button" class="arc-orbit__step" :aria-label="t('home.arcana.deck.next')" @click="step(1)">
            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </button>
          <span class="arc-sr" aria-live="polite">{{ announcement }}</span>
        </div>

        <!-- The dossier: the drawn card's reading -->
        <div class="arc-orbit__dossier" aria-labelledby="arc-orbit-name" role="group">
          <div :key="`lead-${card.id}`" class="arc-orbit__lead">
            <p class="arc-orbit__begins">{{ beginsLine }}</p>
            <dl class="arc-orbit__stats">
              <div>
                <dt>{{ t('home.arcana.deck.statSequences') }}</dt>
                <dd>{{ reading.sequenceCount }}</dd>
              </div>
              <div>
                <dt>{{ t('home.arcana.deck.statAbilities') }}</dt>
                <dd>{{ reading.abilityCount || '–' }}</dd>
              </div>
            </dl>
          </div>

          <div class="arc-orbit__abilities">
            <ul v-if="reading.early.length" :key="`ab-${card.id}`" :aria-label="abilitiesLabel">
              <li v-for="(ability, index) in reading.early" :key="ability.name" :style="{'--i': index}">
                <strong>{{ ability.name }}</strong>
                <span>{{ ability.description }}</span>
              </li>
            </ul>
            <p v-else class="arc-orbit__loading">{{ t('home.arcana.deck.loading') }}</p>
            <p v-if="card.boon" class="arc-orbit__note">{{ t('home.arcana.deck.boonNote') }}</p>
          </div>

          <div class="arc-orbit__actions">
            <RouterLink :to="$lp(`/pathways/${card.id}`)" class="arc-btn arc-btn--solid">
              {{ t(card.boon ? 'home.arcana.deck.openBoon' : 'home.arcana.deck.open').replace('{name}', reading.name) }}
              <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </RouterLink>
            <RouterLink :to="$lp('/pathways')" class="arc-btn arc-btn--ghost">{{ t('home.arcana.deck.archive') }}</RouterLink>
          </div>
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

type Kind = 'pathway' | 'boon';

const {t, plural} = useI18n();
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

const pad = (value: number) => String(value).padStart(2, '0');
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
  return role ? t('home.arcana.deck.seqRole').replace('{role}', role) : countLabel(sequenceCounts.value[id] ?? 10);
};
/** "From Seer at Sequence 9 to Fool at Sequence 0": the whole climb in one line. */
const beginsLine = computed(() => {
  const {ladder, seq9, sequenceCount} = reading.value;
  const byRank = [...ladder].sort((a, b) => b.sequence - a.sequence);
  const first = byRank[0];
  const last = byRank[byRank.length - 1];
  if (first && last && first.sequence === 9 && byRank.length > 1) {
    return t('home.arcana.deck.climb')
        .replace('{first}', first.name)
        .replace('{last}', last.name)
        .replace('{top}', String(last.sequence));
  }
  return seq9 ? t('home.arcana.deck.beginsAs').replace('{role}', seq9) : countLabel(sequenceCount);
});
const abilitiesLabel = computed(() =>
  t('home.arcana.deck.firstAbilities').replace('{role}', reading.value.seq9 || reading.value.name));

/** The original orbit's motif grammar: a second shape behind each sigil. */
const MOTIFS: Record<string, string> = {
  abyss: 'flame', chained: 'chain', darkness: 'eclipse', death: 'bone', demoness: 'blade', door: 'door',
  emperor: 'crown', error: 'glitch', fool: 'cards', fortune: 'wheel', giant: 'sword', hanged: 'cross',
  hermit: 'runes', justiciar: 'scales', moon: 'moon', mother: 'vine', paragon: 'gear', priest: 'flame',
  sun: 'sun', tower: 'pages', tyrant: 'storm', visionary: 'eye', aeon: 'clock', chaos: 'fracture',
  chaosmist: 'mist', condenser: 'star', devouring: 'maw', edict: 'sigil', everlasting: 'ring',
  patriarch: 'coin', secondlaw: 'plague', sublunary: 'canvas',
};
const motifOf = (id: string) => MOTIFS[id] ?? 'ring';

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

const still = () => reducedMotion.value;

function collectSeals() {
  seals = [...(ringRef.value?.querySelectorAll<HTMLElement>('.arc-seal') ?? [])];
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
      label = clamp((cos - .93) / .05, 0, 1);
    } else {
      scale = .5 + .5 * depth;
      opacity = .26 + .74 * depth ** 1.3;
      label = clamp((depth - .84) / .1, 0, 1);
    }
    let x = g.cx + g.a * sin;
    let y = g.cy + g.b * cos;
    if (enter < 1) {
      x = mix(g.cx, x, enter);
      y = mix(originY, y, enter);
      scale *= .3 + .7 * enter;
      opacity *= enter;
      label *= enter;
    }
    element.style.transform = `translate3d(${(x - g.orb / 2).toFixed(1)}px, ${(y - g.orb / 2).toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
    element.style.opacity = opacity.toFixed(3);
    element.style.zIndex = String(10 + Math.round(depth * 100));
    element.style.pointerEvents = opacity < .2 ? 'none' : '';
    element.style.setProperty('--lab', label.toFixed(2));
    element.style.setProperty('--inv', (1 / scale).toFixed(3));
  }
}

function tick(now: number) {
  frame = 0;
  const dt = Math.min(64, lastTime ? now - lastTime : 16.7);
  lastTime = now;
  let moving = dragging.value;
  if (!dragging.value) {
    // The original orbit's spring: a short, soft overshoot as the ring settles.
    const steps = clamp(Math.round(dt / 16.7), 1, 4);
    for (let i = 0; i < steps; i++) {
      velocity = velocity * .7 + (target - spin) * .05;
      spin += velocity;
    }
    if (Math.abs(target - spin) < .001 && Math.abs(velocity) < .001) {
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

/* The drawn card changed (here, in the hero, or from the dock): turn the ring and lift the seal. */
watch(currentId, (id, previous) => {
  const count = catalog.value.length;
  const index = selectedIndex.value;
  const swapped = cardById(id).boon !== cardById(previous ?? id).boon;
  const from = swapped ? null : seals[index];
  const fromRect = from && inView && !still() ? from.getBoundingClientRect() : null;
  if (swapped) {
    collectSeals();
    velocity = 0;
    target = index;
    // the new ring swings in from a quarter turn away
    spin = inView && !still() ? index - count / 4 : index;
    render();
  } else {
    target = spin + signedWrap(index - spin, count);
  }
  if (!inView) {
    spin = target;
    velocity = 0;
    render();
  }
  lift(fromRect);
  schedule();
  if (id !== announcedId) announcement.value = '';
  for (const offset of [-1, 1, 2, -2]) warm(catalog.value[normalize(index + offset, count)].id);
}, {flush: 'post'});

/** FLIP the centre seal out of the ring seal it came from. */
function lift(fromRect: DOMRect | null) {
  const seal = centreSealRef.value;
  if (!seal || !inView || still()) return;
  const easing = 'cubic-bezier(.2, .8, .2, 1)';
  if (!fromRect) {
    seal.animate([{opacity: 0, transform: 'scale(.86)'}, {opacity: 1, transform: 'none'}], {duration: 600, easing});
    return;
  }
  const to = seal.getBoundingClientRect();
  const dx = fromRect.left + fromRect.width / 2 - (to.left + to.width / 2);
  const dy = fromRect.top + fromRect.height / 2 - (to.top + to.height / 2);
  const scale = fromRect.width / to.width;
  seal.animate(
      [{transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: .5}, {transform: 'none', opacity: 1}],
      {duration: 760, easing},
  );
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
  velocity = clamp(-pointerVelocity * 16.7 / spacing, -.6, .6);
  target = landing;
  choose(landing, true);
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
  if (width && (width !== g.width || dial !== g.dial || Math.abs(window.innerHeight - lastViewportHeight) > 1)) {
    lastViewportHeight = window.innerHeight;
    geo.value = geometryFor(width, window.innerHeight, dial);
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

.arc-orbit__lede {
  max-width: 34em;
  margin: 0;
  font-size: clamp(15px, 1.1vw, 17px);
  line-height: 1.6;
  color: var(--arc-muted);
  text-align: right;
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
  height: 2px;
  border-radius: 2px;
  background: var(--acc);
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
  color: var(--acc);
}

.arc-orbit__tabs button[aria-selected='true']::after {
  opacity: 1;
  transform: none;
}

.arc-orbit__tabs button:focus-visible {
  border-radius: 4px;
  outline: 3px solid var(--arc-ink);
  outline-offset: 4px;
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
  animation: arc-orbit-fade 1.1s ease both;
}

@keyframes arc-orbit-fade {
  from {
    opacity: 0;
  }
}

.arc-orbit__track {
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--orb-acc) 22%, rgba(255, 255, 255, .06));
}

/* a fainter orbit inside the first: the ring has depth */
.arc-orbit__track--inner {
  left: calc(var(--cx) - var(--rx) * .72);
  top: calc(var(--cy) - var(--ry) * .72);
  width: calc(var(--rx) * 1.44);
  height: calc(var(--ry) * 1.44);
  box-shadow: none;
  border: 1px dashed rgba(255, 255, 255, .07);
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
  transform: translateX(-50%);
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
    0 26px 60px rgba(0, 0, 0, .6);
}

.arc-orbit__drawn img {
  position: relative;
  z-index: 2;
  width: 82%;
  height: 82%;
  object-fit: contain;
  filter: drop-shadow(0 10px 18px rgba(0, 0, 0, .45));
}

/* slow dashed halo outside the seal */
.arc-orbit__halo {
  position: absolute;
  inset: -22px;
  border: 1px dashed color-mix(in oklab, var(--orb-acc) 40%, transparent);
  border-radius: 50%;
  animation: arc-spin 80s linear infinite;
}

.arc-orbit__badge {
  position: absolute;
  z-index: 3;
  right: 1%;
  bottom: 4%;
  min-width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  padding: 0 6px;
  border-radius: 99px;
  background: var(--orb-acc);
  color: var(--arc-on-acc);
  box-shadow: 0 0 0 4px #0b0b0e;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-size: 12px;
  font-weight: 700;
  font-style: normal;
}

/* the motif: one shape per pathway behind its sigil */
.arc-orbit__drawn::after {
  content: '';
  position: absolute;
  z-index: 1;
  inset: 12%;
  border: 1px solid color-mix(in oklab, var(--orb-acc) 45%, transparent);
  border-radius: 50%;
  pointer-events: none;
}

.arc-orbit__drawn[data-motif='chain']::after { border-radius: 999px; transform: rotate(38deg) scale(.66, 1.2); }
.arc-orbit__drawn[data-motif='eclipse']::after,
.arc-orbit__drawn[data-motif='moon']::after { inset: 12% 26% 12% 8%; box-shadow: 14px 0 0 -2px color-mix(in oklab, var(--orb-acc) 18%, transparent); }
.arc-orbit__drawn[data-motif='bone']::after,
.arc-orbit__drawn[data-motif='sword']::after,
.arc-orbit__drawn[data-motif='blade']::after { inset: 6% 47%; border-radius: 999px; transform: rotate(42deg); }
.arc-orbit__drawn[data-motif='door']::after,
.arc-orbit__drawn[data-motif='pages']::after,
.arc-orbit__drawn[data-motif='canvas']::after { inset: 10% 25%; border-radius: 50% 50% 4% 4%; }
.arc-orbit__drawn[data-motif='crown']::after,
.arc-orbit__drawn[data-motif='sun']::after,
.arc-orbit__drawn[data-motif='star']::after { inset: 6%; border-radius: 4%; transform: rotate(45deg) scale(.66); }
.arc-orbit__drawn[data-motif='glitch']::after,
.arc-orbit__drawn[data-motif='fracture']::after { inset: 16% 8%; border-radius: 0; transform: skew(-22deg) rotate(-12deg); }
.arc-orbit__drawn[data-motif='cards']::after,
.arc-orbit__drawn[data-motif='runes']::after,
.arc-orbit__drawn[data-motif='sigil']::after { inset: 10% 28%; border-radius: 8px; transform: rotate(27deg); }
.arc-orbit__drawn[data-motif='wheel']::after,
.arc-orbit__drawn[data-motif='gear']::after,
.arc-orbit__drawn[data-motif='clock']::after,
.arc-orbit__drawn[data-motif='ring']::after { inset: 9%; border: 5px double color-mix(in oklab, var(--orb-acc) 35%, transparent); }
.arc-orbit__drawn[data-motif='cross']::after,
.arc-orbit__drawn[data-motif='scales']::after { inset: 10% 48%; border-radius: 0; }
.arc-orbit__drawn[data-motif='vine']::after,
.arc-orbit__drawn[data-motif='plague']::after { inset: 6% 34% 6% 16%; border-radius: 60% 10% 60% 10%; transform: rotate(32deg); }
.arc-orbit__drawn[data-motif='flame']::after,
.arc-orbit__drawn[data-motif='maw']::after { inset: 10% 28% 14%; border-radius: 70% 25% 65% 35%; transform: rotate(45deg); }
.arc-orbit__drawn[data-motif='storm']::after,
.arc-orbit__drawn[data-motif='mist']::after { inset: 34% 2%; transform: skew(-18deg); }
.arc-orbit__drawn[data-motif='eye']::after { inset: 26% 6%; border-radius: 70% 10% 70% 10%; transform: rotate(45deg); }
.arc-orbit__drawn[data-motif='coin']::after { inset: 13%; transform: rotate(28deg); border: 4px double color-mix(in oklab, var(--orb-acc) 38%, transparent); }

.arc-orbit__name {
  margin: 24px 0 0;
  max-width: 100%;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: clamp(30px, 3.1vw, 50px);
  line-height: .98;
  letter-spacing: -.025em;
  color: var(--arc-ink);
  text-wrap: balance;
  overflow-wrap: anywhere;
  animation: arc-rise .6s .12s cubic-bezier(.2, .8, .2, 1) both;
}

.arc-orbit__role {
  margin: 8px 0 0;
  font-size: 15px;
  line-height: 1.4;
  color: var(--arc-muted);
  animation: arc-rise .6s .2s cubic-bezier(.2, .8, .2, 1) both;
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
  will-change: transform, opacity;
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
    0 14px 30px rgba(0, 0, 0, .55);
  transition: transform .35s cubic-bezier(.2, .8, .2, 1), box-shadow .3s;
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
    0 14px 30px rgba(0, 0, 0, .55);
}

.arc-seal:focus-visible {
  outline: none;
}

.arc-seal:focus-visible .arc-seal__orb {
  outline: 3px solid var(--arc-ink);
  outline-offset: 4px;
}

.arc-seal__label {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  width: max-content;
  max-width: var(--lab-w);
  display: grid;
  justify-items: center;
  gap: 2px;
  text-align: center;
  transform: translateX(-50%) scale(var(--inv));
  transform-origin: 50% 0;
  opacity: max(var(--lab), var(--hot, 0));
  pointer-events: none;
  text-shadow: 0 1px 10px #0b0b0e, 0 0 3px #0b0b0e;
}

.arc-seal__label strong {
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--arc-ink);
}

.arc-seal__label small {
  font-size: 12px;
  line-height: 1.2;
  color: var(--arc-muted);
  white-space: nowrap;
}

.arc-seal:focus-visible {
  --hot: 1;
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
      0 14px 30px rgba(0, 0, 0, .55);
  }
}

/* the drawn seal leaves an empty socket on the ring */
.arc-seal.is-drawn .arc-seal__orb {
  background: radial-gradient(circle, color-mix(in oklab, var(--orb-acc) 20%, transparent), #0b0b0e 72%);
  box-shadow:
    inset 0 0 0 2px var(--orb-acc),
    0 0 32px color-mix(in oklab, var(--orb-acc) 40%, transparent);
}

.arc-seal.is-drawn .arc-seal__orb img {
  opacity: .22;
}

.arc-seal.is-drawn .arc-seal__label strong {
  color: var(--orb-acc);
}

/* ---------- controls ---------- */
.arc-orbit__controls {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
}

.arc-orbit__step {
  width: 44px;
  height: 44px;
  flex: none;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, .04);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--acc) 40%, transparent);
  color: var(--arc-ink);
  cursor: pointer;
  transition: background-color .2s, transform .3s cubic-bezier(.2, .8, .2, 1);
}

.arc-orbit__step:hover {
  background: color-mix(in oklab, var(--acc) 18%, transparent);
}

.arc-orbit__step:active {
  transform: scale(.94);
}

.arc-orbit__step:focus-visible {
  outline: 3px solid var(--arc-ink);
  outline-offset: 3px;
}

.arc-orbit__count {
  min-width: 250px;
  display: grid;
  justify-items: center;
  gap: 6px;
  margin: 0;
  font-family: var(--arc-caps);
  font-size: 11px;
  letter-spacing: .14em;
  color: var(--arc-muted);
  font-variant-numeric: tabular-nums;
}

.arc-orbit__count b {
  font-weight: 400;
  color: var(--acc);
}

.arc-orbit__hint {
  font-family: var(--arc-body);
  font-size: 13px;
  letter-spacing: 0;
  color: var(--arc-muted);
  text-align: center;
}

/* ---------- dossier ---------- */
.arc-orbit__dossier {
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(0, 1.45fr) auto;
  align-items: start;
  gap: 24px clamp(28px, 4vw, 56px);
  margin-top: clamp(22px, 3vh, 32px);
  padding-top: clamp(22px, 3vh, 30px);
  border-top: 1px solid var(--arc-line);
}

.arc-orbit__lead {
  animation: arc-rise .6s cubic-bezier(.2, .8, .2, 1) both;
}

.arc-orbit__begins {
  margin: 0;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: clamp(19px, 1.5vw, 22px);
  line-height: 1.25;
  letter-spacing: -.01em;
  color: var(--arc-ink);
  text-wrap: balance;
}

.arc-orbit__stats {
  display: flex;
  gap: 28px;
  margin: 16px 0 0;
}

.arc-orbit__stats div {
  display: grid;
  gap: 2px;
}

.arc-orbit__stats div + div {
  padding-left: 28px;
  border-left: 1px solid var(--arc-line);
}

.arc-orbit__stats dt {
  font-size: 13.5px;
  color: var(--arc-muted);
}

.arc-orbit__stats dd {
  margin: 0;
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: clamp(28px, 2.4vw, 36px);
  line-height: 1.1;
  color: var(--acc);
}

/* one column of names and one of descriptions, shared by every row */
.arc-orbit__abilities ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: fit-content(12em) minmax(0, 1fr);
  gap: 8px 18px;
}

.arc-orbit__abilities li {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: subgrid;
  align-items: baseline;
  row-gap: 2px;
  padding: 10px 14px;
  border-left: 2px solid var(--acc);
  background: linear-gradient(90deg, color-mix(in oklab, var(--acc) 9%, transparent), transparent 85%);
  animation: arc-rise .55s cubic-bezier(.2, .8, .2, 1) both;
  animation-delay: calc(var(--i) * 70ms + 80ms);
}

.arc-orbit__abilities strong {
  font-weight: 600;
  color: var(--arc-ink);
}

.arc-orbit__abilities li span {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  font-size: 14.5px;
  line-height: 1.45;
  color: var(--arc-muted);
}

.arc-orbit__loading {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--arc-muted);
}

.arc-orbit__note {
  margin: 12px 0 0;
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--arc-muted);
}

.arc-orbit__actions {
  display: grid;
  gap: 10px;
}

@media (max-width: 1180px) {
  .arc-orbit__dossier {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
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

  .arc-orbit__lede {
    text-align: left;
  }
}

/* ---------- phones and narrow tablets: the near arc of a dial ---------- */
.arc-orbit.is-dial .arc-orbit__stage {
  margin-inline: calc(clamp(18px, 4vw, 64px) * -1);
  overflow-x: clip;
}

.arc-orbit.is-dial .arc-orbit__track--inner {
  display: none;
}

.arc-orbit.is-dial .arc-orbit__centre {
  width: calc(100% - 36px);
}

.arc-orbit.is-dial .arc-orbit__name {
  font-size: 34px;
  margin-top: 26px;
}

.arc-orbit.is-dial .arc-orbit__count {
  min-width: 0;
  flex: 1;
  max-width: 230px;
}

.arc-orbit.is-dial .arc-orbit__dossier {
  grid-template-columns: 1fr;
}

@media (max-width: 520px) {
  .arc-orbit__abilities ul,
  .arc-orbit__abilities li {
    grid-template-columns: minmax(0, 1fr);
  }

  .arc-orbit__actions {
    display: grid;
  }
}

@media (prefers-reduced-motion: reduce) {
  .arc-orbit__glow,
  .arc-orbit__halo {
    animation: none;
  }

  .arc-seal__orb,
  .arc-seal__orb img,
  .arc-orbit__step {
    transition: none;
  }
}
</style>
