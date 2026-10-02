<template>
  <section
    id="pathways"
    ref="sectionRef"
    class="fog-table"
    :class="{ 'is-rail': railLayout, 'is-low-power': lowPower }"
    aria-labelledby="pathway-title"
  >
    <div class="fog-table__fog fog-table__fog--far" aria-hidden="true"></div>

    <header class="table-head">
      <div class="table-head__title">
        <p class="fog-label">{{ t('home.orbit.kicker') }}</p>
        <h2 id="pathway-title">{{ t('home.orbit.titleLead') }} <em>{{ t('home.orbit.titleAccent') }}</em></h2>
      </div>
      <div class="table-head__aside">
        <p>{{ countCopy(railLayout ? 'home.orbit.introMobile' : 'home.orbit.intro') }}</p>
        <div class="deck-tabs" role="tablist" :aria-label="t('home.orbit.tabsLabel')" @keydown="onTabKeydown">
          <button
            v-for="option in catalogOptions"
            :id="`${option.id}-tab`"
            :key="option.id"
            type="button"
            role="tab"
            :aria-selected="activeKind === option.id"
            aria-controls="pathways-panel"
            :tabindex="activeKind === option.id ? 0 : -1"
            @click="setKind(option.id)"
          >
            {{ option.label }}<b>{{ option.count }}</b>
          </button>
        </div>
      </div>
    </header>

    <div
      id="pathways-panel"
      class="table-panel"
      role="tabpanel"
      :aria-labelledby="`${activeKind}-tab`"
    >
      <div
        ref="stageRef"
        class="table-stage"
        :class="{ 'is-dragging': dragging, 'is-dealing': dealing, 'is-dealt': dealt }"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @click.capture="swallowDragClick"
      >
        <div class="table-surface" aria-hidden="true"></div>

        <div
          ref="deckRef"
          class="deck"
          role="radiogroup"
          :aria-label="t(`home.orbit.deckLabel.${activeKind}`)"
          @keydown="onDeckKeydown"
          @scroll.passive="onRailScroll"
        >
          <button
            v-for="(entry, index) in activeCatalog"
            :key="entry.id"
            type="button"
            role="radio"
            class="tarot"
            :class="{ 'is-lit': index === shownIndex }"
            :style="cardStyles[index]"
            :data-index="index"
            :tabindex="index === selectedIndex ? 0 : -1"
            :aria-checked="index === selectedIndex"
            :aria-label="cardLabel(entry, index)"
            @click="onCardClick(index, $event)"
          >
            <span class="tarot__frame">
              <span class="tarot__numeral" aria-hidden="true">{{ numeral(index) }}</span>
              <span class="tarot__sigil">
                <img
                  :src="entry.thumbnail"
                  alt=""
                  width="128"
                  height="128"
                  :loading="Math.abs(offsetOf(index)) <= 4 ? 'eager' : 'lazy'"
                  decoding="async"
                  draggable="false"
                  @error="replaceBrokenImage"
                >
              </span>
              <span class="tarot__name">{{ nameOf(entry) }}</span>
              <span class="tarot__seq">{{ firstSequenceName(entry) }}</span>
            </span>
          </button>
        </div>

        <div class="fog-table__fog fog-table__fog--near" aria-hidden="true"></div>
      </div>

      <div class="deck-controls">
        <button type="button" class="deck-step" :aria-label="t(`home.orbit.previous.${activeKind}`)" @click="step(-1)"><span aria-hidden="true">←</span></button>
        <p>
          <span class="deck-count" aria-hidden="true"><b>{{ pad(selectedIndex + 1) }}</b> / {{ pad(activeCatalog.length) }}</span>
          <span class="deck-hint">{{ t(railLayout ? 'home.orbit.hintMobile' : 'home.orbit.hint') }}</span>
        </p>
        <button type="button" class="deck-step" :aria-label="t(`home.orbit.next.${activeKind}`)" @click="step(1)"><span aria-hidden="true">→</span></button>
        <span class="visually-hidden" aria-live="polite">{{ announcement }}</span>
      </div>

      <div :key="`${activeKind}-${selectedEntry.id}`" class="reading">
        <div class="reading__identity">
          <p class="fog-label">{{ arcanumLabel(selectedIndex, numeral(selectedIndex)) }}</p>
          <h3>{{ nameOf(selectedEntry) }}</h3>
          <p class="reading__sequence">{{ sequenceLabel(selectedEntry) }}</p>
          <p class="reading__tagline">{{ taglineOf(selectedEntry) }}</p>
        </div>
        <dl class="reading__facts">
          <div>
            <dt>{{ t('home.orbit.earlyAbilities') }}</dt>
            <dd><ul><li v-for="ability in abilitiesOf(selectedEntry)" :key="ability">{{ ability }}</li></ul></dd>
          </div>
          <div>
            <dt>{{ t('home.orbit.archive') }}</dt>
            <dd class="reading__counts">{{ archiveCounts(selectedEntry) }}</dd>
          </div>
        </dl>
        <div class="reading__actions">
          <RouterLink class="fog-button" :to="$lp(selectedEntry.route)" :aria-label="t('home.orbit.openArchiveNamed').replace('{name}', nameOf(selectedEntry))">
            {{ t('home.orbit.openArchive') }}<span aria-hidden="true">↗</span>
          </RouterLink>
          <button
            type="button"
            class="fog-button fog-button--ghost"
            :aria-label="t('home.orbit.readDossierNamed').replace('{name}', nameOf(selectedEntry))"
            @pointerenter="warmNative(selectedEntry)"
            @focus="warmNative(selectedEntry)"
            @click="openDetails($event)"
          >
            {{ t('home.orbit.readDossier') }}
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="dossier">
        <div v-if="detailsOpen" class="dossier-scrim" @click.self="closeDetails()">
          <aside
            ref="dossierRef"
            class="pathway-dossier"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="`${selectedEntry.id}-dossier-title`"
            tabindex="-1"
            @keydown="trapDossierFocus"
          >
            <button ref="dossierCloseRef" class="dossier-close" type="button" :aria-label="t('home.orbit.dossier.close').replace('{name}', nameOf(selectedEntry))" @click="closeDetails()"><span aria-hidden="true">×</span></button>
            <div class="dossier-card" aria-hidden="true">
              <span>{{ numeral(selectedIndex) }}</span>
              <img :src="selectedEntry.image" alt="" width="200" height="200" decoding="async" @error="replaceBrokenImage">
            </div>
            <p class="dossier-kicker">{{ t(`home.orbit.dossier.kicker.${selectedEntry.kind}`) }}</p>
            <h3 :id="`${selectedEntry.id}-dossier-title`">{{ nameOf(selectedEntry) }}</h3>
            <strong>{{ sequenceLabel(selectedEntry) }}</strong>
            <span>{{ taglineOf(selectedEntry) }}</span>
            <dl>
              <div><dt>{{ t('home.orbit.earlyAbilities') }}</dt><dd>{{ abilitiesOf(selectedEntry).join(' · ') }}</dd></div>
              <div><dt>{{ t('home.orbit.archive') }}</dt><dd>{{ archiveCounts(selectedEntry) }}</dd></div>
            </dl>
            <RouterLink class="dossier-cta" :to="$lp(selectedEntry.route)" @click="closeDetails(false)">
              {{ t('home.orbit.dossier.cta') }}<span aria-hidden="true">↗</span>
            </RouterLink>
          </aside>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch, type CSSProperties } from 'vue';
import { boonPathways, localize, standardPathways, type HomePathway, type ProgressionKind } from '@/data/homePathways';
import { useReducedMotion } from '@/composables/useReducedMotion';
import { useI18n } from '@/composables/useI18n';

const emit = defineEmits<{ selected: [pathway: HomePathway] }>();
const { t, plural, currentLanguage } = useI18n();
const reducedMotion = useReducedMotion();

const sectionRef = ref<HTMLElement | null>(null);
const stageRef = ref<HTMLElement | null>(null);
const deckRef = ref<HTMLElement | null>(null);
const dossierRef = ref<HTMLElement | null>(null);
const dossierCloseRef = ref<HTMLButtonElement | null>(null);

/*
 * The Fool hosts the gathering above the fog, so it takes arcanum 0 and the
 * first seat; the rest keep archive order. Twenty-two Pathways, twenty-two
 * Major Arcana, numbered 0-XXI.
 */
const tablePathways = [
  ...standardPathways.filter((entry) => entry.id === 'fool'),
  ...standardPathways.filter((entry) => entry.id !== 'fool'),
];

const activeKind = ref<ProgressionKind>('pathway');
const selectedIndex = ref(0);
/** Cards of drag travel not yet committed to a selection. */
const dragShift = ref(0);
const dragging = ref(false);
const dealt = ref(false);
const dealing = ref(false);
const railLayout = ref(false);
const lowPower = ref(false);
const detailsOpen = ref(false);
const announcement = ref('');
const stage = ref({ width: 0, cardWidth: 0 });

const activeCatalog = computed(() => activeKind.value === 'pathway' ? tablePathways : boonPathways);
const catalogOptions = computed(() => [
  { id: 'pathway' as const, label: t('home.orbit.tabs.pathway'), count: standardPathways.length },
  { id: 'boon' as const, label: t('home.orbit.tabs.boon'), count: boonPathways.length },
]);
const focusPosition = computed(() => selectedIndex.value + dragShift.value);
/** The card under the light: follows a drag before it is committed. */
const shownIndex = computed(() => normalizeIndex(Math.round(focusPosition.value)));
const selectedEntry = computed(() => activeCatalog.value[selectedIndex.value] ?? activeCatalog.value[0]);

/* ---- Copy ---- */

const nameOf = (entry: HomePathway) => localize(entry.name, currentLanguage.value);
const pad = (value: number) => String(value).padStart(2, '0');
const abilitiesOf = (entry: HomePathway) => entry.strengths.map((ability) => localize(ability, currentLanguage.value));

function countCopy(key: string) {
  return t(key).replace('{pathways}', String(standardPathways.length)).replace('{boons}', String(boonPathways.length));
}

function countLabel(key: 'sequenceCount' | 'abilityCount', count: number) {
  const forms = { one: t(`home.orbit.${key}.one`), few: t(`home.orbit.${key}.few`), many: t(`home.orbit.${key}.many`) };
  return plural(count, forms).replace('{count}', String(count));
}

const archiveCounts = (entry: HomePathway) => `${countLabel('sequenceCount', entry.sequenceCount)} · ${countLabel('abilityCount', entry.abilityCount)}`;

/** Chinese names a pathway after its Sequence 9, so the repeat is dropped there. */
function startingName(entry: HomePathway) {
  const start = entry.startingSequence;
  if (!start) return '';
  const name = localize(start.name, currentLanguage.value);
  return name && name !== nameOf(entry) ? name : '';
}

/** "Sequence 9 · Seer" */
function sequenceLabel(entry: HomePathway) {
  const start = entry.startingSequence;
  if (!start) return countLabel('sequenceCount', entry.sequenceCount);
  const name = startingName(entry);
  const number = String(start.number);
  return name
    ? t('home.orbit.sequenceNamed').replace('{number}', number).replace('{name}', name)
    : t('home.orbit.sequence').replace('{number}', number);
}

/** The small second line on a card face. */
function firstSequenceName(entry: HomePathway) {
  return startingName(entry) || (entry.startingSequence ? t('home.orbit.sequence').replace('{number}', String(entry.startingSequence.number)) : '');
}

function taglineOf(entry: HomePathway) {
  const key = `home.orbit.taglines.${entry.id}`;
  const tagline = t(key);
  return tagline === key ? t('home.orbit.taglineFallback').replace('{name}', nameOf(entry)) : tagline;
}

const ROMAN: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
/** Pathways are Major Arcana from 0; Boons are numbered from I. */
function arcanumNumber(index: number) {
  return activeKind.value === 'pathway' ? index : index + 1;
}
function numeral(index: number) {
  let value = arcanumNumber(index);
  if (value === 0) return '0';
  let out = '';
  for (const [size, glyph] of ROMAN) while (value >= size) { out += glyph; value -= size; }
  return out;
}
/** Screen readers get the arabic number; the card face shows the numeral. */
const arcanumLabel = (index: number, shown = String(arcanumNumber(index))) => t('home.orbit.arcanum').replace('{numeral}', shown);
const cardLabel = (entry: HomePathway, index: number) => `${arcanumLabel(index)}. ${nameOf(entry)}, ${sequenceLabel(entry)}`;
const positionLabel = () => t('home.orbit.position').replace('{current}', String(selectedIndex.value + 1)).replace('{total}', String(activeCatalog.value.length));

/* ---- The spread: cards fanned along a wide arc at the head of the table ---- */

const VISIBLE = 5;        // cards shown either side of the lit one
const ARC_STEP = .1;      // radians between neighbouring cards
const LIFT = 34;          // px the lit card rises off the table

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function normalizeIndex(value: number, length = activeCatalog.value.length) { return ((value % length) + length) % length; }
function signedWrap(value: number, length: number) { return ((value + length / 2) % length + length) % length - length / 2; }
const offsetOf = (index: number) => signedWrap(index - focusPosition.value, activeCatalog.value.length);

/**
 * Transform and opacity only. Cards past the visible fan are parked, invisible,
 * just beyond its ends, so the wrap from one end to the other is never seen.
 */
const cardStyles = computed<CSSProperties[]>(() => {
  if (railLayout.value) return activeCatalog.value.map(() => ({}));
  const { width, cardWidth } = stage.value;
  const radius = width * .92;
  const count = activeCatalog.value.length;
  // Never show the card opposite the lit one: it is where the deck wraps.
  const visible = Math.min(VISIBLE, Math.floor(count / 2) - 1);
  return activeCatalog.value.map((_, index) => {
    const offset = dealt.value ? signedWrap(index - focusPosition.value, count) : 0;
    const distance = Math.abs(offset);
    const parked = clamp(offset, -(visible + 1), visible + 1);
    const angle = parked * ARC_STEP;
    const lift = Math.max(0, 1 - distance);
    // Neighbours step aside so the lifted card is never overlapped.
    const x = radius * Math.sin(angle) + Math.sign(parked) * Math.min(distance, 1) * cardWidth * .3;
    const y = radius * (1 - Math.cos(angle)) * .62 - lift * LIFT;
    const scale = 1 + lift * .2 - Math.min(distance, visible + 1) * .018;
    const opacity = dealt.value ? clamp(visible + .6 - distance, 0, 1) : (index < 4 ? 1 : 0);
    return {
      transform: `translate3d(${(x - cardWidth / 2).toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${(angle * 41).toFixed(2)}deg) scale(${scale.toFixed(3)})`,
      opacity: String(Math.round(opacity * 100) / 100),
      zIndex: String(dealt.value ? 100 - Math.round(distance * 8) : 100 - index),
      pointerEvents: opacity < .3 ? 'none' : undefined,
      '--veil': String(Math.round(clamp(.32 + distance * .09, 0, .8) * (1 - lift) * 100) / 100),
      '--deal-delay': `${Math.round(Math.min(distance, visible + 1) * 55)}ms`,
    } as CSSProperties;
  });
});

/* ---- Selection ---- */

function select(index: number, { announce = false } = {}) {
  const normalized = normalizeIndex(index);
  dragShift.value = 0;
  if (normalized === selectedIndex.value) return;
  selectedIndex.value = normalized;
  emit('selected', activeCatalog.value[normalized]);
  if (announce) announcement.value = `${nameOf(activeCatalog.value[normalized])}. ${positionLabel()}`;
  if (railLayout.value) scrollRailTo(normalized);
  // Roving tabindex: keep focus on the checked radio after a drag or wheel turn.
  if (deckRef.value?.contains(document.activeElement)) focusCard(normalized);
}

function focusCard(index: number) {
  void nextTick(() => deckRef.value?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.focus({ preventScroll: true }));
}

function step(direction: number) {
  select(selectedIndex.value + direction, { announce: true });
}

function setKind(kind: ProgressionKind) {
  if (kind === activeKind.value) return;
  activeKind.value = kind;
  selectedIndex.value = 0;
  dragShift.value = 0;
  emit('selected', activeCatalog.value[0]);
  if (railLayout.value) void nextTick(() => scrollRailTo(0, 'auto'));
}

/** Tabs pattern: arrows/Home/End move focus and activate (automatic activation). */
function onTabKeydown(event: KeyboardEvent) {
  const ids = catalogOptions.value.map((option) => option.id);
  const current = ids.indexOf(activeKind.value);
  const target = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: ids.length - 1 }[event.key];
  if (target === undefined) return;
  event.preventDefault();
  const kind = ids[normalizeIndex(target, ids.length)];
  setKind(kind);
  void nextTick(() => document.getElementById(`${kind}-tab`)?.focus());
}

/** Radio-group keys with roving tabindex; Enter and Space reach onCardClick natively. */
function onDeckKeydown(event: KeyboardEvent) {
  const length = activeCatalog.value.length;
  const target = {
    ArrowLeft: selectedIndex.value - 1, ArrowUp: selectedIndex.value - 1,
    ArrowRight: selectedIndex.value + 1, ArrowDown: selectedIndex.value + 1,
    Home: 0, End: length - 1,
  }[event.key];
  if (target === undefined) return;
  event.preventDefault();
  select(target);
  focusCard(selectedIndex.value);
}

/** A click on a card draws it; a click on the drawn card opens its dossier. */
function onCardClick(index: number, event: Event) {
  if (index !== selectedIndex.value) {
    select(index);
    return;
  }
  void openDetails(event);
}

/* ---- Drag and sideways wheel (fan layout only) ---- */

const DRAG_THRESHOLD = 6;
let pointer: { id: number; startX: number; lastX: number; lastTime: number; velocity: number; moved: boolean } | null = null;
let suppressClick = false;
let dragFrame = 0;
let pendingShift = 0;

/** Pixels of pointer travel per card: the spacing at the middle of the fan. */
const cardSpacing = () => Math.max(60, stage.value.width * .92 * Math.sin(ARC_STEP) + stage.value.cardWidth * .15);

function onPointerDown(event: PointerEvent) {
  suppressClick = false;
  if (railLayout.value || event.button !== 0 || !dealt.value) return;
  pointer = { id: event.pointerId, startX: event.clientX, lastX: event.clientX, lastTime: performance.now(), velocity: 0, moved: false };
}

function onPointerMove(event: PointerEvent) {
  if (!pointer || event.pointerId !== pointer.id) return;
  const travel = event.clientX - pointer.startX;
  if (!pointer.moved) {
    if (Math.abs(travel) < DRAG_THRESHOLD) return;
    pointer.moved = true;
    dragging.value = true;
    stageRef.value?.setPointerCapture(event.pointerId);
  }
  const now = performance.now();
  const sample = (event.clientX - pointer.lastX) / Math.max(1, now - pointer.lastTime);
  pointer.velocity = pointer.velocity * .6 + sample * .4;
  pointer.lastX = event.clientX;
  pointer.lastTime = now;
  // Pull the fan with the pointer; coalesce to one style pass per frame.
  pendingShift = -travel / cardSpacing();
  if (!dragFrame) dragFrame = requestAnimationFrame(() => { dragFrame = 0; dragShift.value = pendingShift; });
}

function onPointerUp(event: PointerEvent) {
  if (!pointer || event.pointerId !== pointer.id) return;
  const { moved, velocity } = pointer;
  pointer = null;
  if (!moved) return;
  if (dragFrame) { cancelAnimationFrame(dragFrame); dragFrame = 0; }
  if (stageRef.value?.hasPointerCapture(event.pointerId)) stageRef.value.releasePointerCapture(event.pointerId);
  suppressClick = true;
  dragging.value = false;
  // A flick carries on a little; the projection is capped so it never spins.
  const fling = clamp(-velocity * 180 / cardSpacing(), -3, 3);
  const target = Math.round(selectedIndex.value + pendingShift + fling);
  pendingShift = 0;
  if (normalizeIndex(target) === selectedIndex.value) dragShift.value = 0;
  else select(target, { announce: true });
}

/** The click that ends a drag must not also draw or open a card. */
function swallowDragClick(event: MouseEvent) {
  if (!suppressClick) return;
  suppressClick = false;
  event.stopPropagation();
  event.preventDefault();
}

let wheelTravel = 0;
let wheelLast = 0;
/** Horizontal wheel (trackpads, Shift+wheel) turns the spread; vertical scrolling is never captured. */
function onWheel(event: WheelEvent) {
  if (railLayout.value || !dealt.value) return;
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

/* ---- Mobile rail: a native snap row; the card in the middle is the draw ---- */

let railTimer = 0;

function onRailScroll() {
  if (!railLayout.value) return;
  window.clearTimeout(railTimer);
  railTimer = window.setTimeout(() => {
    const rail = deckRef.value;
    if (!rail) return;
    const center = rail.scrollLeft + rail.clientWidth / 2;
    let nearest = 0;
    let best = Number.POSITIVE_INFINITY;
    rail.querySelectorAll<HTMLElement>('[data-index]').forEach((card, index) => {
      const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
      if (distance < best) { best = distance; nearest = index; }
    });
    if (nearest !== selectedIndex.value) {
      selectedIndex.value = nearest;
      emit('selected', activeCatalog.value[nearest]);
      announcement.value = `${nameOf(activeCatalog.value[nearest])}. ${positionLabel()}`;
    }
  }, 90);
}

function scrollRailTo(index: number, behavior: ScrollBehavior = reducedMotion.value ? 'auto' : 'smooth') {
  const rail = deckRef.value;
  const card = rail?.querySelector<HTMLElement>(`[data-index="${index}"]`);
  if (!rail || !card) return;
  rail.scrollTo({ left: card.offsetLeft - (rail.clientWidth - card.offsetWidth) / 2, behavior });
}

/* ---- Dossier ---- */

let dossierTrigger: HTMLElement | null = null;
let previousBodyOverflow = '';
let previousBodyPaddingRight = '';

function onWindowKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); void closeDetails(); }
}

async function openDetails(event?: Event) {
  if (detailsOpen.value) return;
  dossierTrigger = event?.currentTarget as HTMLElement | null;
  previousBodyOverflow = document.body.style.overflow;
  previousBodyPaddingRight = document.body.style.paddingRight;
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
  document.body.style.overflow = 'hidden';
  document.querySelector<HTMLElement>('#app')?.setAttribute('inert', '');
  window.addEventListener('keydown', onWindowKeydown);
  detailsOpen.value = true;
  await nextTick();
  dossierCloseRef.value?.focus();
}

function releaseBody() {
  window.removeEventListener('keydown', onWindowKeydown);
  document.body.style.overflow = previousBodyOverflow;
  document.body.style.paddingRight = previousBodyPaddingRight;
  document.querySelector<HTMLElement>('#app')?.removeAttribute('inert');
}

async function closeDetails(restoreFocus = true) {
  if (!detailsOpen.value) return;
  detailsOpen.value = false;
  releaseBody();
  await nextTick();
  const fallback = deckRef.value?.querySelector<HTMLElement>(`[data-index="${selectedIndex.value}"]`);
  const target = dossierTrigger?.isConnected ? dossierTrigger : fallback;
  if (restoreFocus) target?.focus({ preventScroll: true });
  dossierTrigger = null;
}

function trapDossierFocus(event: KeyboardEvent) {
  if (event.key !== 'Tab' || !dossierRef.value) return;
  const focusable = [...dossierRef.value.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

/* ---- Images ---- */

const warmedNatives = new Set<string>();
const imageWarmers: HTMLImageElement[] = [];
function warmNative(entry: HomePathway) {
  if (warmedNatives.has(entry.image)) return;
  warmedNatives.add(entry.image);
  const image = new Image();
  image.decoding = 'async';
  image.src = entry.image;
  imageWarmers.push(image);
}

const fallbackImage = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><circle cx="48" cy="48" r="39" fill="none" stroke="#a7acb5" stroke-width="2"/><path d="M48 20 58 39l20 9-20 9-10 19-10-19-20-9 20-9Z" fill="#a7acb5" opacity=".6"/></svg>')}`;
function replaceBrokenImage(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  if (image.src !== fallbackImage) image.src = fallbackImage;
}

/* ---- Lifecycle ---- */

let railMedia: MediaQueryList | null = null;
let stageObserver: ResizeObserver | null = null;
let sectionObserver: IntersectionObserver | null = null;
let dealTimer = 0;

function measureStage() {
  const element = stageRef.value;
  if (!element) return;
  const card = element.querySelector<HTMLElement>('.tarot');
  const next = { width: element.clientWidth, cardWidth: card?.offsetWidth ?? 0 };
  if (next.width !== stage.value.width || next.cardWidth !== stage.value.cardWidth) stage.value = next;
}

function syncLayout() {
  railLayout.value = railMedia?.matches ?? false;
  dragShift.value = 0;
  void nextTick(() => {
    measureStage();
    if (railLayout.value) scrollRailTo(selectedIndex.value, 'auto');
  });
}

/** Deal the spread once, the first time the table comes into view. */
function deal() {
  if (dealt.value) return;
  dealt.value = true;
  if (reducedMotion.value || railLayout.value) return;
  dealing.value = true;
  dealTimer = window.setTimeout(() => { dealing.value = false; }, 1400);
}

watch(selectedEntry, (entry) => { if (dealt.value) warmNative(entry); });

onMounted(() => {
  const hints = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  lowPower.value = Boolean(
    hints.connection?.saveData
    || (hints.deviceMemory !== undefined && hints.deviceMemory <= 4)
    || navigator.hardwareConcurrency <= 4,
  );
  railMedia = window.matchMedia('(max-width: 899px)');
  railMedia.addEventListener('change', syncLayout);
  syncLayout();

  stageObserver = new ResizeObserver(measureStage);
  if (stageRef.value) stageObserver.observe(stageRef.value);
  stageRef.value?.addEventListener('wheel', onWheel, { passive: false });

  if (reducedMotion.value) deal();
  sectionObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    deal();
    sectionObserver?.disconnect();
  }, { threshold: .18 });
  if (stageRef.value) sectionObserver.observe(stageRef.value);
});

onUnmounted(() => {
  railMedia?.removeEventListener('change', syncLayout);
  stageObserver?.disconnect();
  sectionObserver?.disconnect();
  stageRef.value?.removeEventListener('wheel', onWheel);
  if (dragFrame) cancelAnimationFrame(dragFrame);
  window.clearTimeout(railTimer);
  window.clearTimeout(dealTimer);
  if (detailsOpen.value) releaseBody();
});
</script>

<style scoped>
.fog-table {
  --card-w: clamp(118px, 9.4vw, 150px);
  --card-h: calc(var(--card-w) * 1.7);
  position: relative;
  padding: clamp(72px, 9vh, 104px) 0 clamp(56px, 7vh, 88px);
  overflow: clip;
  color: var(--bone);
  background:
    radial-gradient(ellipse 60% 46% at 50% 58%, rgba(30, 34, 43, .7), transparent 72%),
    var(--fog-0);
  isolation: isolate;
}

/* ---- Fog: two slow banks, transform-only ---- */
.fog-table__fog {
  position: absolute;
  left: -50%;
  width: 200%;
  pointer-events: none;
  background-repeat: repeat-x;
  background-size: 50% 100%;
}

.fog-table__fog--far {
  z-index: -1;
  top: 18%;
  height: 60%;
  background-image:
    radial-gradient(ellipse 14% 30% at 16% 55%, rgba(176, 184, 196, .1), transparent 70%),
    radial-gradient(ellipse 16% 26% at 48% 38%, rgba(176, 184, 196, .08), transparent 70%),
    radial-gradient(ellipse 14% 32% at 82% 60%, rgba(176, 184, 196, .1), transparent 70%);
  animation: table-fog 90s linear infinite;
}

/* In front of the outer cards, so the ends of the spread sink into fog.
   Every bank ends inside its tile, or the repeat shows a seam. */
.fog-table__fog--near {
  z-index: 120;
  bottom: -14%;
  height: 52%;
  background-image:
    radial-gradient(ellipse 15% 38% at 16% 58%, rgba(200, 206, 214, .2), transparent 72%),
    radial-gradient(ellipse 12% 26% at 50% 70%, rgba(200, 206, 214, .1), transparent 72%),
    radial-gradient(ellipse 15% 40% at 84% 56%, rgba(200, 206, 214, .2), transparent 72%);
  animation: table-fog 60s linear infinite reverse;
}

@keyframes table-fog {
  to { transform: translate3d(-25%, 0, 0); }
}

/* ---- Heading ---- */
.table-head {
  width: min(100% - var(--home-content-gutter, 20px) * 2, 1280px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  align-items: end;
  gap: 24px 64px;
}

.table-head h2 {
  margin: 18px 0 0;
  font: 600 clamp(36px, 5vw, 72px)/1.02 var(--font-display);
  text-wrap: balance;
}

.table-head h2 em {
  display: block;
  color: var(--ash);
  font-style: italic;
  font-weight: 500;
}

.table-head__aside > p {
  max-width: 460px;
  margin: 0 0 22px;
  color: var(--ash);
  font-size: 1rem;
  line-height: 1.6;
}

.deck-tabs {
  width: fit-content;
  display: flex;
  padding: 4px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(13, 15, 20, .7);
}

.deck-tabs button {
  min-width: 128px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  color: var(--ash);
  background: transparent;
  cursor: pointer;
  font: 600 .9rem/1 var(--font-body);
  transition: background-color .2s ease, color .2s ease;
}

.deck-tabs button:hover { color: var(--bone); background: var(--fog-veil); }

.deck-tabs button b {
  min-width: 26px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: 99px;
  color: var(--ash);
  background: rgba(214, 220, 228, .08);
  font: 500 .72rem/1 var(--font-mono);
}

.deck-tabs button[aria-selected="true"] { color: var(--bone); background: var(--crimson); }
.deck-tabs button[aria-selected="true"] b { color: var(--bone); background: rgba(7, 8, 11, .28); }

/* ---- Stage ---- */
.table-stage {
  position: relative;
  height: calc(var(--card-h) * 1.86 + 24px);
  margin-top: clamp(8px, 2vh, 24px);
  cursor: grab;
  touch-action: pan-y;
  user-select: none;
}

.table-stage.is-dragging { cursor: grabbing; }

/* The ends of the spread fade into the dark at the sides of the room. */
.table-stage::before,
.table-stage::after {
  content: "";
  position: absolute;
  z-index: 125;
  top: 0;
  bottom: 0;
  width: clamp(40px, 9vw, 160px);
  pointer-events: none;
}
.table-stage::before { left: 0; background: linear-gradient(90deg, var(--fog-0), transparent); }
.table-stage::after { right: 0; background: linear-gradient(270deg, var(--fog-0), transparent); }
.is-rail .table-stage::before,
.is-rail .table-stage::after { width: 28px; }

/* The head of the long table: a tabletop seen from the chair, fading into fog. */
.table-surface {
  position: absolute;
  left: 50%;
  top: calc(var(--card-h) * .78 + 70px);
  width: min(1500px, 112%);
  height: 70%;
  transform: translateX(-50%);
  border-top: 1px solid var(--line);
  border-radius: 50% 50% 0 0 / 34% 34% 0 0;
  background:
    radial-gradient(ellipse 22% 34% at 50% 0%, rgba(179, 32, 43, .2), transparent 80%),
    radial-gradient(ellipse 70% 90% at 50% 0%, rgba(30, 34, 43, .85), transparent 70%);
  pointer-events: none;
}

.deck {
  position: absolute;
  inset: 0;
}

/* ---- A tarot card ---- */
.tarot {
  --veil: .5;
  position: absolute;
  top: 70px;
  left: 50%;
  width: var(--card-w);
  height: var(--card-h);
  padding: 0;
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  color: var(--bone);
  background:
    radial-gradient(circle at 50% 40%, rgba(169, 198, 214, .07), transparent 55%),
    linear-gradient(180deg, #181b23, #0e1016);
  box-shadow: 0 18px 40px rgba(0, 0, 0, .5);
  cursor: pointer;
  transform-origin: 50% 100%;
  will-change: transform, opacity;
  transition: transform .62s var(--ease-out), opacity .45s ease, border-color .3s ease;
}

.is-dragging .tarot { transition: border-color .3s ease, opacity .2s ease; }
.is-dealing .tarot { transition-delay: var(--deal-delay), var(--deal-delay), 0s; transition-duration: .9s, .6s, .3s; }

/* Fog veil over cards that are not drawn. */
.tarot::after {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(7, 8, 11, .55), rgba(13, 15, 20, .92));
  opacity: var(--veil);
  pointer-events: none;
  transition: opacity .45s ease;
}

/* Crimson rim light on the drawn card. */
.tarot::before {
  content: "";
  position: absolute;
  z-index: -1;
  inset: -1px;
  border-radius: inherit;
  box-shadow: 0 0 0 1px var(--crimson), 0 0 46px 4px rgba(179, 32, 43, .38), var(--shadow-deep);
  opacity: 0;
  transition: opacity .45s ease;
}

.tarot.is-lit { border-color: var(--crimson); }
.tarot.is-lit::before { opacity: 1; }
.tarot.is-lit::after { opacity: 0; }

.tarot:hover:not(.is-lit)::after { opacity: calc(var(--veil) * .55); }

.tarot:focus-visible { outline: 2px solid var(--crimson-text); outline-offset: 5px; }

.tarot__frame {
  position: absolute;
  inset: 6px;
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  justify-items: center;
  padding: 10px 8px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  text-align: center;
}

/* Corner pips, as on a printed deck. */
.tarot__frame::before,
.tarot__frame::after {
  content: "";
  position: absolute;
  width: 5px;
  height: 5px;
  border: 1px solid var(--line-strong);
  transform: rotate(45deg);
}
.tarot__frame::before { top: 6px; left: 6px; }
.tarot__frame::after { right: 6px; bottom: 6px; }

.tarot__numeral {
  color: var(--ash);
  font: italic 600 1.75rem/1 var(--font-display);
  font-variant-numeric: lining-nums;
  letter-spacing: .04em;
}

.tarot.is-lit .tarot__numeral { color: var(--crimson-text); }

.tarot__sigil {
  align-self: center;
  width: 76%;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  transition: border-color .45s ease, box-shadow .45s ease;
}

.tarot__sigil img {
  width: 92%;
  height: 92%;
  object-fit: contain;
  filter: grayscale(.9) brightness(.62);
  transition: filter .45s ease;
}

/* Spirit vision: the drawn sigil takes its colour and a pale rim. */
.tarot.is-lit .tarot__sigil {
  border-color: rgba(169, 198, 214, .55);
  box-shadow: 0 0 26px rgba(169, 198, 214, .16), inset 0 0 18px rgba(169, 198, 214, .1);
}
.tarot.is-lit .tarot__sigil img { filter: none; }

.tarot__name {
  max-width: 100%;
  margin-top: 8px;
  font: 600 .8rem/1.2 var(--font-body);
  letter-spacing: .02em;
  text-wrap: balance;
  overflow-wrap: anywhere;
}

.tarot__seq {
  max-width: 100%;
  margin-top: 3px;
  color: var(--ash);
  font: 500 .68rem/1.25 var(--font-body);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---- Controls ---- */
.deck-controls {
  position: relative;
  z-index: 130;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: -18px;
}

.deck-controls p {
  min-width: 260px;
  display: grid;
  justify-items: center;
  gap: 6px;
  margin: 0;
}

.deck-count {
  color: var(--ash);
  font: 500 .75rem/1 var(--font-mono);
  letter-spacing: .14em;
  font-variant-numeric: tabular-nums;
}

.deck-count b { color: var(--bone); font-weight: 500; }

.deck-hint {
  color: var(--ash-dim);
  font-size: .8rem;
  line-height: 1.3;
}

.deck-step {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  color: var(--bone);
  background: rgba(13, 15, 20, .8);
  cursor: pointer;
  font-size: 1rem;
  transition: border-color .2s ease, background-color .2s ease;
}

.deck-step:hover { border-color: var(--bone); background: var(--fog-3); }

/* ---- The reading: what the drawn card says ---- */
.reading {
  width: min(100% - var(--home-content-gutter, 20px) * 2, 1180px);
  margin: clamp(28px, 4vh, 44px) auto 0;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) auto;
  align-items: start;
  gap: 28px 56px;
  padding-top: 28px;
  border-top: 1px solid var(--line);
  animation: reading-in .6s var(--ease-out);
}

@keyframes reading-in {
  from { opacity: 0; transform: translateY(12px); }
}

.reading h3 {
  margin: 14px 0 0;
  font: 600 clamp(36px, 3.6vw, 54px)/1 var(--font-display);
  overflow-wrap: anywhere;
}

.reading__sequence {
  margin: 10px 0 0;
  color: var(--spirit);
  font: 600 .92rem/1.4 var(--font-body);
}

.reading__tagline {
  max-width: 440px;
  margin: 8px 0 0;
  color: var(--ash);
  line-height: 1.6;
}

.reading__facts { display: grid; gap: 18px; margin: 4px 0 0; }

.reading__facts dt {
  margin-bottom: 8px;
  color: var(--ash);
  font: 500 .72rem/1 var(--font-mono);
  letter-spacing: .14em;
  text-transform: uppercase;
}

.reading__facts dd { margin: 0; }

.reading__facts ul { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }

.reading__facts li {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-weight: 600;
  line-height: 1.4;
}

.reading__facts li::before {
  content: "";
  flex: none;
  width: 10px;
  height: 1px;
  transform: translateY(-4px);
  background: var(--crimson-text);
}

.reading__counts { color: var(--spirit); font-weight: 600; }

.reading__actions { display: grid; gap: 12px; padding-top: 4px; }
.reading__actions .fog-button { text-decoration: none; white-space: nowrap; }

/* ---- Dossier ---- */
.dossier-scrim {
  position: fixed;
  z-index: 2000;
  inset: 0;
  overflow: hidden;
  isolation: isolate;
  background: rgba(7, 8, 11, .62);
  backdrop-filter: blur(6px);
}

.pathway-dossier {
  position: fixed;
  top: clamp(12px, 3vw, 32px);
  right: clamp(12px, 3vw, 32px);
  bottom: clamp(12px, 3vw, 32px);
  width: min(480px, calc(100vw - 24px));
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow: auto;
  overscroll-behavior: contain;
  padding: clamp(28px, 4vw, 48px);
  border: 1px solid var(--line);
  border-radius: 14px;
  color: var(--bone);
  background:
    radial-gradient(ellipse 80% 40% at 50% 0%, rgba(179, 32, 43, .1), transparent 70%),
    var(--fog-1);
  box-shadow: var(--shadow-deep);
  font-family: var(--font-body);
  outline: 0;
}

.dossier-close {
  position: absolute;
  z-index: 3;
  top: 16px;
  right: 16px;
  width: 48px;
  height: 48px;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  color: var(--bone);
  background: transparent;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
}

.dossier-close:hover { border-color: var(--bone); background: var(--fog-veil); }
.dossier-close:focus-visible,
.pathway-dossier a:focus-visible { outline: 2px solid var(--crimson-text); outline-offset: 3px; }

.dossier-card {
  position: relative;
  flex: none;
  width: 150px;
  aspect-ratio: 1 / 1.7;
  display: grid;
  grid-template-rows: auto 1fr;
  justify-items: center;
  margin-bottom: 28px;
  padding: 14px 10px;
  border: 1px solid var(--crimson);
  border-radius: 12px;
  background: linear-gradient(180deg, #181b23, #0e1016);
  box-shadow: 0 0 46px 4px rgba(179, 32, 43, .3), var(--shadow-deep);
}

.dossier-card span {
  color: var(--crimson-text);
  font: italic 600 1.9rem/1 var(--font-display);
  font-variant-numeric: lining-nums;
}

.dossier-card img { align-self: center; width: 100%; height: auto; object-fit: contain; }

.pathway-dossier h3 {
  margin: 14px 0 0;
  font: 600 clamp(40px, 4.4vw, 56px)/1 var(--font-display);
  overflow-wrap: anywhere;
}

.pathway-dossier > strong { margin-top: 12px; color: var(--spirit); font-size: .95rem; font-weight: 600; }

.pathway-dossier > span { margin-top: 10px; color: var(--ash); line-height: 1.6; }

.pathway-dossier dl { align-self: stretch; margin: 26px 0; border-top: 1px solid var(--line); }

.pathway-dossier dl div {
  display: grid;
  grid-template-columns: 128px 1fr;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
}

.pathway-dossier dt {
  color: var(--ash);
  font: 500 .72rem/1.5 var(--font-mono);
  letter-spacing: .12em;
  text-transform: uppercase;
}

.pathway-dossier dd { margin: 0; font-size: .92rem; font-weight: 600; line-height: 1.5; }

.dossier-kicker {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  color: var(--ash);
  font: 500 .72rem/1 var(--font-mono);
  letter-spacing: .14em;
  text-transform: uppercase;
}

.dossier-kicker::before { content: ""; width: 18px; height: 1px; background: var(--crimson-text); }

/* Same as .fog-button, which does not reach the teleported dialog. */
.dossier-cta {
  align-self: stretch;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding: 0 24px;
  border-radius: 999px;
  color: var(--bone);
  background: var(--crimson);
  font: 600 .95rem/1 var(--font-body);
  text-decoration: none;
  transition: background-color .2s ease;
}

.dossier-cta:hover { background: #c42633; }
.dossier-cta:active { background: var(--crimson-deep); }

.dossier-enter-active, .dossier-leave-active { transition: opacity .35s ease; }
.dossier-enter-active .pathway-dossier, .dossier-leave-active .pathway-dossier { transition: transform .55s var(--ease-out); }
.dossier-enter-from, .dossier-leave-to { opacity: 0; }
.dossier-enter-from .pathway-dossier, .dossier-leave-to .pathway-dossier { transform: translateX(48px); }

/* ---- Narrow desktop ---- */
@media (max-width: 1180px) {
  .reading { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .reading__actions { grid-column: 1 / -1; display: flex; flex-wrap: wrap; }
}

/* ---- Mobile: a snap row of cards, the reading below ---- */
.is-rail { --card-w: 148px; }

.is-rail .table-head { grid-template-columns: 1fr; gap: 20px; }

.is-rail .deck-tabs { width: 100%; }
.is-rail .deck-tabs button { flex: 1; min-width: 0; }

.is-rail .table-stage { height: auto; margin-top: 18px; cursor: auto; }
.is-rail .table-surface { top: calc(var(--card-h) * .62); width: 160%; height: 60%; }
.is-rail .fog-table__fog--near { bottom: -30%; }

.is-rail .deck {
  position: relative;
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding: 44px calc(50% - var(--card-w) / 2) 30px;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  overscroll-behavior-x: contain;
}

.is-rail .deck::-webkit-scrollbar { display: none; }

.is-rail .tarot {
  position: relative;
  top: auto;
  left: auto;
  flex: none;
  --veil: .55;
  scroll-snap-align: center;
  transform: none;
  will-change: auto;
  transition: transform .4s var(--ease-out), border-color .3s ease;
}

.is-rail .tarot.is-lit { transform: translateY(-14px) scale(1.04); }
/* The rail clips vertically, so its rim light stays tight. */
.is-rail .tarot::before { box-shadow: 0 0 0 1px var(--crimson), 0 0 22px 2px rgba(179, 32, 43, .34), 0 16px 30px rgba(0, 0, 0, .5); }

.is-rail .deck-controls { margin-top: 0; gap: 14px; }
.is-rail .deck-controls p { min-width: 0; flex: 1; max-width: 220px; }

.is-rail .reading {
  grid-template-columns: 1fr;
  gap: 22px;
  margin-top: 28px;
}

.is-rail .reading__actions { display: grid; }
.is-rail .reading__actions .fog-button { width: 100%; }

@media (max-width: 580px) {
  .pathway-dossier { top: auto; right: 8px; bottom: 8px; width: calc(100% - 16px); height: min(88svh, 760px); }
  .pathway-dossier dl div { grid-template-columns: 1fr; gap: 6px; }
}

/* ---- Low power: one fog bank, no filter fades ---- */
.is-low-power .fog-table__fog--far { display: none; }
.is-low-power .tarot__sigil img { transition: none; }

@media (prefers-reduced-motion: reduce) {
  .fog-table__fog { animation: none; }
  .reading { animation: none; }
  .tarot,
  .tarot::before,
  .tarot::after,
  .tarot__sigil,
  .tarot__sigil img,
  .dossier-enter-active,
  .dossier-leave-active,
  .dossier-enter-active .pathway-dossier,
  .dossier-leave-active .pathway-dossier { transition: none !important; }
  .is-rail .deck { scroll-behavior: auto; }
}
</style>
