<template>
  <section
    id="pathways"
    class="seal-orbit"
    :class="{ 'is-dial': geo.dial, 'is-low-power': lowPower }"
    aria-labelledby="pv-orbit-title"
  >
    <div class="seal-orbit__fog seal-orbit__fog--far" aria-hidden="true"></div>

    <header class="orbit-head">
      <div>
        <p class="fog-label">{{ t('home.pathwayVariants.orbit.kicker') }}</p>
        <h2 id="pv-orbit-title">{{ t('home.pathwayVariants.orbit.titleLead') }} <em>{{ t('home.pathwayVariants.orbit.titleAccent') }}</em></h2>
      </div>
      <div class="orbit-head__aside">
        <p>{{ countCopy(geo.dial ? 'home.pathwayVariants.orbit.introMobile' : 'home.pathwayVariants.orbit.intro') }}</p>
        <KindTabs
          :label="t('home.orbit.tabsLabel')"
          :active="activeKind"
          panel-id="pv-orbit-panel"
          :options="kindOptions"
          :tab-id="tabId"
          @choose="chooseKind"
          @keydown="onTabKeydown"
        />
      </div>
    </header>

    <div id="pv-orbit-panel" role="tabpanel" :aria-labelledby="tabId(activeKind)">
      <div
        ref="stageRef"
        class="orbit-stage"
        :class="{ 'is-dragging': dragging }"
        :style="stageStyle"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @pointerenter="hovering = true"
        @pointerleave="hovering = false"
        @click.capture="swallowDragClick"
      >
        <div class="orbit-track" aria-hidden="true"></div>
        <div class="orbit-track orbit-track--inner" aria-hidden="true"></div>

        <div :key="`${activeKind}-${selectedEntry.id}`" class="orbit-centre" aria-hidden="true">
          <span class="orbit-centre__numeral">{{ arcanumLabel(selectedIndex, numeral(selectedIndex)) }}</span>
          <span class="orbit-centre__seal">
            <img :src="selectedEntry.image" alt="" width="256" height="256" decoding="async" draggable="false" @error="replaceBrokenImage">
          </span>
          <span class="orbit-centre__name">{{ nameOf(selectedEntry) }}</span>
          <span class="orbit-centre__seq">{{ sequenceLabel(selectedEntry) }}</span>
        </div>

        <div
          ref="ringRef"
          class="orbit-ring"
          role="radiogroup"
          :aria-label="t(`home.pathwayVariants.orbit.ringLabel.${activeKind}`)"
          @keydown="onRingKeydown"
          @focusin="focusInside = true"
          @focusout="focusInside = false"
        >
          <button
            v-for="(entry, index) in activeCatalog"
            :key="entry.id"
            type="button"
            role="radio"
            class="seal"
            :class="{ 'is-drawn': index === selectedIndex }"
            :data-index="index"
            :tabindex="index === selectedIndex ? 0 : -1"
            :aria-checked="index === selectedIndex"
            :aria-label="entryLabel(entry, index)"
            @click="onSealClick(index)"
          >
            <span class="seal__orb">
              <img :src="entry.thumbnail" alt="" width="128" height="128" decoding="async" draggable="false" @error="replaceBrokenImage">
            </span>
            <span class="seal__label" aria-hidden="true">{{ nameOf(entry) }}</span>
          </button>
        </div>

        <div class="seal-orbit__fog seal-orbit__fog--near" aria-hidden="true"></div>
      </div>

      <div class="orbit-controls">
        <button type="button" class="orbit-step" :aria-label="t(`home.orbit.previous.${activeKind}`)" @click="step(-1)"><span aria-hidden="true">←</span></button>
        <p>
          <span class="orbit-count" aria-hidden="true"><b>{{ pad(selectedIndex + 1) }}</b> / {{ pad(activeCatalog.length) }}</span>
          <span class="orbit-hint">{{ t(geo.dial ? 'home.pathwayVariants.orbit.hintMobile' : 'home.pathwayVariants.orbit.hint') }}</span>
        </p>
        <button type="button" class="orbit-step" :aria-label="t(`home.orbit.next.${activeKind}`)" @click="step(1)"><span aria-hidden="true">→</span></button>
        <span class="visually-hidden" aria-live="polite">{{ announcement }}</span>
      </div>

      <div :key="`${activeKind}-${selectedEntry.id}`" class="orbit-reading">
        <div class="orbit-reading__lead">
          <h3>{{ nameOf(selectedEntry) }}</h3>
          <p>{{ taglineOf(selectedEntry) }}</p>
        </div>
        <dl>
          <div>
            <dt>{{ t('home.orbit.earlyAbilities') }}</dt>
            <dd><ul><li v-for="ability in abilitiesOf(selectedEntry)" :key="ability">{{ ability }}</li></ul></dd>
          </div>
          <div>
            <dt>{{ t('home.orbit.archive') }}</dt>
            <dd class="orbit-reading__counts">{{ archiveCounts(selectedEntry) }}</dd>
          </div>
        </dl>
        <RouterLink class="fog-button" :to="$lp(selectedEntry.route)" :aria-label="archiveLabel(selectedEntry)">
          {{ t('home.orbit.openArchive') }}<span aria-hidden="true">↗</span>
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import type { HomePathway, ProgressionKind } from '@/data/homePathways';
import { useReducedMotion } from '@/composables/useReducedMotion';
import KindTabs from './KindTabs.vue';
import { replaceBrokenImage, usePathwayDeck } from './usePathwayDeck';

const emit = defineEmits<{ selected: [pathway: HomePathway] }>();
const reducedMotion = useReducedMotion();
const {
  t, activeKind, selectedIndex, announcement, activeCatalog, selectedEntry, kindOptions,
  nameOf, abilitiesOf, pad, countCopy, archiveCounts, sequenceLabel, taglineOf,
  numeral, arcanumLabel, entryLabel, archiveLabel, select, setKind, tabId, onTabKeydown, radioTarget,
} = usePathwayDeck((entry) => emit('selected', entry), 'pv-orbit');

const stageRef = ref<HTMLElement | null>(null);
const ringRef = ref<HTMLElement | null>(null);
const dragging = ref(false);
const hovering = ref(false);
const focusInside = ref(false);
const lowPower = ref(false);

/* ---- Geometry: an ellipse seen from slightly above; a wide dial on phones ---- */

type Geometry = { width: number; height: number; cx: number; cy: number; a: number; b: number; orb: number; dial: boolean; centreY: number };

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function signedWrap(value: number, length: number) { return ((value + length / 2) % length + length) % length - length / 2; }

function geometryFor(width: number): Geometry {
  if (width < 720) {
    // Only the near arc of a large ring: the drawn seal floats above it.
    const r = Math.max(280, width * .95);
    const orb = 68;
    const centre = 262;
    const height = centre + 150;
    const front = height - orb / 2 - 38;
    return { width, height, cx: width / 2, cy: front - r, a: r, b: r, orb, dial: true, centreY: centre / 2 + 4 };
  }
  const a = Math.min(width * .41, 560);
  const b = Math.max(152, a * .36);
  const orb = Math.round(clamp(width * .068, 78, 100));
  const cy = Math.round(b + orb * .3 + 12);
  const height = Math.round(cy + b + orb / 2 + 36);
  return { width, height, cx: width / 2, cy, a, b, orb, dial: false, centreY: cy - 16 };
}

const geo = ref<Geometry>(geometryFor(1280));

const stageStyle = computed(() => {
  const g = geo.value;
  const seal = g.dial ? 132 : Math.round(clamp(g.b * .74, 108, 176));
  return {
    height: `${g.height}px`,
    '--cx': `${g.cx}px`,
    '--cy': `${g.cy}px`,
    '--rx': `${g.a}px`,
    '--ry': `${g.b}px`,
    '--orb': `${g.orb}px`,
    '--centre-y': `${g.centreY}px`,
    '--seal': `${seal}px`,
  };
});

/* ---- The turn: `spin` is the (fractional) index at the front of the ring ---- */

let spin = 0;
let target = 0;
let frame = 0;
let lastTime = 0;
let lastInteraction = 0;
let inView = false;
let seals: HTMLElement[] = [];

/** One revolution every 200s when left alone. */
const driftRate = () => activeCatalog.value.length / 200;
const canDrift = () => inView && !reducedMotion.value && !lowPower.value && !dragging.value && !hovering.value
  && !focusInside.value && performance.now() - lastInteraction > 4000;

function collectSeals() {
  seals = [...(ringRef.value?.querySelectorAll<HTMLElement>('.seal') ?? [])];
}

function render() {
  const g = geo.value;
  const count = seals.length;
  if (!count) return;
  const stepAngle = (Math.PI * 2) / count;
  seals.forEach((element, index) => {
    const angle = signedWrap(index - spin, count) * stepAngle;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const depth = (cos + 1) / 2;
    let scale: number;
    let opacity: number;
    let label: number;
    if (g.dial) {
      const near = clamp((cos - .5) / .5, 0, 1);
      scale = .68 + .32 * near;
      opacity = clamp((cos - .55) / .25, 0, 1);
      label = clamp((cos - .9) / .07, 0, 1);
    } else {
      scale = .5 + .5 * depth;
      opacity = .26 + .74 * depth ** 1.3;
      label = clamp((depth - .72) / .16, 0, 1);
    }
    const x = g.cx + g.a * sin - g.orb / 2;
    const y = g.cy + g.b * cos - g.orb / 2;
    element.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
    element.style.opacity = opacity.toFixed(2);
    element.style.zIndex = String(10 + Math.round(depth * 100));
    element.style.pointerEvents = opacity < .2 ? 'none' : '';
    element.style.setProperty('--lab', label.toFixed(2));
    element.style.setProperty('--inv', (1 / scale).toFixed(3));
  });
}

function tick(now: number) {
  frame = 0;
  const dt = Math.min(64, now - (lastTime || now));
  lastTime = now;
  let moving = false;
  if (dragging.value) {
    moving = true;
  } else if (Math.abs(target - spin) > .0005) {
    spin = reducedMotion.value ? target : spin + (target - spin) * (1 - Math.exp(-dt / 120));
    if (Math.abs(target - spin) <= .0005) spin = target;
    moving = true;
  } else if (canDrift()) {
    spin += dt / 1000 * driftRate();
    target = spin;
    moving = true;
  }
  render();
  if (moving || (inView && !reducedMotion.value && !lowPower.value)) schedule();
  else lastTime = 0;
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(tick);
}

/** Turn the shortest way round so `index` faces the front. */
function turnTo(index: number) {
  target = spin + signedWrap(index - spin, activeCatalog.value.length);
  lastInteraction = performance.now();
  schedule();
}

/* ---- Selection ---- */

function choose(index: number, announce = false) {
  select(index, { announce });
  turnTo(selectedIndex.value);
  if (ringRef.value?.contains(document.activeElement)) focusSeal(selectedIndex.value);
}

function focusSeal(index: number) {
  void nextTick(() => ringRef.value?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.focus({ preventScroll: true }));
}

function step(direction: number) {
  choose(selectedIndex.value + direction, true);
}

function onSealClick(index: number) {
  choose(index);
}

function onRingKeydown(event: KeyboardEvent) {
  const index = radioTarget(event);
  if (index === null) return;
  choose(index);
  focusSeal(index);
}

function chooseKind(kind: ProgressionKind) {
  setKind(kind);
}

/* Tabs switch by click or keys; either way the new ring is laid out once it renders. */
watch(activeKind, () => {
  collectSeals();
  // The new ring swings in from a quarter turn away.
  spin = reducedMotion.value ? 0 : -activeCatalog.value.length / 4;
  target = 0;
  lastInteraction = performance.now();
  render();
  schedule();
}, { flush: 'post' });

/* ---- Drag and sideways wheel ---- */

const DRAG_THRESHOLD = 6;
let pointer: { id: number; startX: number; startSpin: number; lastX: number; lastTime: number; velocity: number; moved: boolean } | null = null;
let suppressClick = false;

/** Pointer travel for one seal: the spacing at the front of the ring. */
const sealSpacing = () => Math.max(56, geo.value.a * Math.sin((Math.PI * 2) / activeCatalog.value.length));

function onPointerDown(event: PointerEvent) {
  suppressClick = false;
  if (event.button !== 0) return;
  pointer = { id: event.pointerId, startX: event.clientX, startSpin: spin, lastX: event.clientX, lastTime: performance.now(), velocity: 0, moved: false };
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
  pointer.velocity = pointer.velocity * .6 + ((event.clientX - pointer.lastX) / Math.max(1, now - pointer.lastTime)) * .4;
  pointer.lastX = event.clientX;
  pointer.lastTime = now;
  spin = pointer.startSpin - travel / sealSpacing();
  target = spin;
  schedule();
}

function onPointerUp(event: PointerEvent) {
  if (!pointer || event.pointerId !== pointer.id) return;
  const { moved, velocity } = pointer;
  pointer = null;
  if (!moved) return;
  if (stageRef.value?.hasPointerCapture(event.pointerId)) stageRef.value.releasePointerCapture(event.pointerId);
  suppressClick = true;
  dragging.value = false;
  const fling = clamp(-velocity * 200 / sealSpacing(), -4, 4);
  const landing = Math.round(spin + fling);
  select(landing, { announce: true });
  if (ringRef.value?.contains(document.activeElement)) focusSeal(selectedIndex.value);
  target = landing;
  lastInteraction = performance.now();
  schedule();
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

/* ---- Lifecycle ---- */

let resizeObserver: ResizeObserver | null = null;
let viewObserver: IntersectionObserver | null = null;
let arrived = false;

function measure() {
  const width = stageRef.value?.clientWidth ?? 0;
  if (!width || width === geo.value.width) return;
  geo.value = geometryFor(width);
  render();
}

watch([hovering, focusInside], () => { lastInteraction = performance.now(); schedule(); });

onMounted(() => {
  const hints = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  lowPower.value = Boolean(hints.connection?.saveData || (hints.deviceMemory !== undefined && hints.deviceMemory <= 4) || navigator.hardwareConcurrency <= 4);
  collectSeals();
  measure();
  spin = target = 0;
  render();

  resizeObserver = new ResizeObserver(measure);
  if (stageRef.value) resizeObserver.observe(stageRef.value);
  stageRef.value?.addEventListener('wheel', onWheel, { passive: false });

  viewObserver = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView && !arrived) {
      arrived = true;
      // First sight: the ring swings round into place.
      if (!reducedMotion.value) { spin = -activeCatalog.value.length / 3; target = 0; lastInteraction = performance.now(); }
    }
    if (inView) schedule();
  }, { threshold: .15 });
  if (stageRef.value) viewObserver.observe(stageRef.value);
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  viewObserver?.disconnect();
  stageRef.value?.removeEventListener('wheel', onWheel);
  if (frame) cancelAnimationFrame(frame);
});
</script>

<style scoped>
.seal-orbit {
  position: relative;
  padding: clamp(72px, 9vh, 100px) 0 clamp(56px, 7vh, 84px);
  overflow: clip;
  color: var(--bone);
  background:
    radial-gradient(ellipse 52% 40% at 50% 52%, rgba(30, 34, 43, .75), transparent 72%),
    var(--fog-0);
  isolation: isolate;
}

/* ---- Fog: two slow banks, transform-only ---- */
.seal-orbit__fog {
  position: absolute;
  left: -50%;
  width: 200%;
  pointer-events: none;
  background-repeat: repeat-x;
  background-size: 50% 100%;
}

.seal-orbit__fog--far {
  z-index: -1;
  top: 22%;
  height: 56%;
  background-image:
    radial-gradient(ellipse 14% 30% at 18% 55%, rgba(176, 184, 196, .09), transparent 70%),
    radial-gradient(ellipse 16% 24% at 50% 36%, rgba(176, 184, 196, .07), transparent 70%),
    radial-gradient(ellipse 14% 32% at 80% 62%, rgba(176, 184, 196, .09), transparent 70%);
  animation: orbit-fog 90s linear infinite;
}

.seal-orbit__fog--near {
  z-index: 130;
  bottom: -18%;
  height: 46%;
  background-image:
    radial-gradient(ellipse 15% 36% at 14% 60%, rgba(200, 206, 214, .14), transparent 72%),
    radial-gradient(ellipse 15% 40% at 86% 56%, rgba(200, 206, 214, .14), transparent 72%);
  animation: orbit-fog 64s linear infinite reverse;
}

@keyframes orbit-fog {
  to { transform: translate3d(-25%, 0, 0); }
}

/* ---- Heading ---- */
.orbit-head {
  width: min(100% - var(--home-content-gutter, 20px) * 2, 1280px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  align-items: end;
  gap: 24px 56px;
}

.orbit-head h2 {
  margin: 18px 0 0;
  font: 800 clamp(36px, 4.4vw, 64px)/.94 var(--font-display);
  text-transform: uppercase;
  text-wrap: balance;
}

.orbit-head h2 em { display: block; color: var(--crimson-text); font-style: normal; }

.orbit-head__aside > p {
  max-width: 470px;
  margin: 0 0 20px;
  color: var(--ash);
  line-height: 1.6;
}

/* ---- Stage ---- */
.orbit-stage {
  position: relative;
  margin-top: clamp(4px, 1.5vh, 20px);
  cursor: grab;
  touch-action: pan-y;
  user-select: none;
}

.orbit-stage.is-dragging { cursor: grabbing; }

.orbit-track {
  position: absolute;
  left: calc(var(--cx) - var(--rx));
  top: calc(var(--cy) - var(--ry));
  width: calc(var(--rx) * 2);
  height: calc(var(--ry) * 2);
  border: 1px solid var(--line);
  border-radius: 50%;
  pointer-events: none;
}

/* A second, fainter orbit inside the first: the ring has depth. */
.orbit-track--inner {
  left: calc(var(--cx) - var(--rx) * .72);
  top: calc(var(--cy) - var(--ry) * .72);
  width: calc(var(--rx) * 1.44);
  height: calc(var(--ry) * 1.44);
  border-color: rgba(169, 198, 214, .08);
  border-style: dashed;
}

/* ---- The drawn seal ---- */
.orbit-centre {
  position: absolute;
  z-index: 60;
  left: var(--cx);
  top: var(--centre-y);
  width: min(420px, 80%);
  display: grid;
  justify-items: center;
  text-align: center;
  transform: translate(-50%, calc(var(--seal) * -.5 - 30px));
  pointer-events: none;
  animation: centre-in .7s var(--ease-out);
}

@keyframes centre-in {
  from { opacity: 0; transform: translate(-50%, calc(var(--seal) * -.5 - 14px)) scale(.94); }
}

.orbit-centre__numeral {
  color: var(--crimson-text);
  font: 500 .72rem/1 var(--font-mono);
  letter-spacing: .16em;
  text-transform: uppercase;
}

.orbit-centre__seal {
  position: relative;
  width: var(--seal);
  height: var(--seal);
  display: grid;
  place-items: center;
  margin-top: 14px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(169, 198, 214, .14), rgba(13, 15, 20, .9) 62%);
  box-shadow: 0 0 0 1px rgba(169, 198, 214, .4), 0 0 0 9px rgba(7, 8, 11, .6), 0 0 0 10px rgba(179, 32, 43, .55), 0 0 70px 10px rgba(179, 32, 43, .22), var(--shadow-deep);
}

.orbit-centre__seal img { width: 84%; height: 84%; object-fit: contain; }

.orbit-centre__name {
  margin-top: 22px;
  font: 800 clamp(34px, 3.4vw, 52px)/.9 var(--font-display);
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.orbit-centre__seq {
  margin-top: 8px;
  color: var(--spirit);
  font: 600 .9rem/1.3 var(--font-body);
}

/* ---- Seals on the ring ---- */
.orbit-ring { position: absolute; inset: 0; }

.seal {
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
  color: var(--bone);
  background: none;
  cursor: pointer;
  transform-origin: 50% 50%;
  will-change: transform, opacity;
}

.seal__orb {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  background: radial-gradient(circle at 50% 38%, rgba(169, 198, 214, .16), rgba(13, 15, 20, .94) 66%);
  box-shadow: 0 14px 34px rgba(0, 0, 0, .55), inset 0 0 18px rgba(169, 198, 214, .06);
  transition: border-color .3s ease, box-shadow .3s ease;
}

.seal__orb img {
  width: 86%;
  height: 86%;
  object-fit: contain;
  transition: opacity .35s ease;
}

.seal:hover .seal__orb { border-color: rgba(169, 198, 214, .6); box-shadow: 0 0 26px rgba(169, 198, 214, .2), 0 14px 34px rgba(0, 0, 0, .55); }

.seal__label {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  width: max-content;
  max-width: 150px;
  color: var(--bone);
  font: 600 .78rem/1.2 var(--font-body);
  letter-spacing: .02em;
  text-align: center;
  text-shadow: 0 1px 8px var(--fog-0);
  transform: translateX(-50%) scale(var(--inv));
  transform-origin: 50% 0;
  opacity: max(var(--lab), var(--hot, 0));
  pointer-events: none;
}

.seal:hover,
.seal:focus-visible { --hot: 1; }

.seal:focus-visible { outline: none; }
.seal:focus-visible .seal__orb { outline: 2px solid var(--crimson-text); outline-offset: 4px; }

/* The drawn seal leaves an empty crimson socket on the ring. */
.seal.is-drawn .seal__orb {
  border: 2px solid var(--crimson);
  background: radial-gradient(circle, rgba(179, 32, 43, .2), rgba(7, 8, 11, .92) 70%);
  box-shadow: 0 0 30px rgba(179, 32, 43, .35);
}
.seal.is-drawn .seal__orb img { opacity: .22; }
.seal.is-drawn .seal__label { color: var(--crimson-text); }

/* ---- Controls ---- */
.orbit-controls {
  position: relative;
  z-index: 140;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: -6px;
}

.orbit-controls p { min-width: 260px; display: grid; justify-items: center; gap: 6px; margin: 0; }

.orbit-count { color: var(--ash); font: 500 .75rem/1 var(--font-mono); letter-spacing: .14em; font-variant-numeric: tabular-nums; }
.orbit-count b { color: var(--bone); font-weight: 500; }
.orbit-hint { color: var(--ash-dim); font-size: .8rem; line-height: 1.3; text-align: center; }

.orbit-step {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  color: var(--bone);
  background: rgba(13, 15, 20, .8);
  cursor: pointer;
  transition: border-color .2s ease, background-color .2s ease;
}

.orbit-step:hover { border-color: var(--bone); background: var(--fog-3); }
.orbit-step:focus-visible { outline: 2px solid var(--crimson-text); outline-offset: 3px; }

/* ---- Reading ---- */
.orbit-reading {
  width: min(100% - var(--home-content-gutter, 20px) * 2, 1180px);
  margin: clamp(22px, 3.4vh, 36px) auto 0;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.3fr) auto;
  align-items: start;
  gap: 24px 48px;
  padding-top: 26px;
  border-top: 1px solid var(--line);
  animation: reading-in .6s var(--ease-out);
}

@keyframes reading-in { from { opacity: 0; transform: translateY(10px); } }

.orbit-reading h3 {
  margin: 0;
  font: 800 clamp(26px, 2.4vw, 34px)/.95 var(--font-display);
  text-transform: uppercase;
}

.orbit-reading__lead p { max-width: 400px; margin: 10px 0 0; color: var(--ash); line-height: 1.6; }

.orbit-reading dl { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr); gap: 18px 32px; margin: 0; }
.orbit-reading dt { margin-bottom: 10px; color: var(--ash); font: 500 .72rem/1 var(--font-mono); letter-spacing: .14em; text-transform: uppercase; }
.orbit-reading dd { margin: 0; }
.orbit-reading ul { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
.orbit-reading li { display: flex; align-items: baseline; gap: 10px; font-weight: 600; line-height: 1.4; }
.orbit-reading li::before { content: ""; flex: none; width: 10px; height: 1px; transform: translateY(-4px); background: var(--crimson-text); }
.orbit-reading__counts { color: var(--spirit); font-weight: 600; line-height: 1.5; }
.orbit-reading .fog-button { text-decoration: none; white-space: nowrap; }
.orbit-reading .fog-button:focus-visible { outline: 2px solid var(--crimson-text); outline-offset: 3px; }

@media (max-width: 1180px) {
  .orbit-reading { grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); }
  .orbit-reading .fog-button { grid-column: 1 / -1; justify-self: start; }
}

/* ---- Phones: the near arc of the ring, the drawn seal above it ---- */
.is-dial .orbit-head { grid-template-columns: 1fr; gap: 18px; }
.is-dial .orbit-head__aside > p { margin-bottom: 18px; }
.is-dial .orbit-stage { margin-top: 10px; }
.is-dial .orbit-track { border-color: rgba(214, 220, 228, .1); }
.is-dial .orbit-track--inner { display: none; }
.is-dial .orbit-centre__name { margin-top: 18px; font-size: 34px; }
.is-dial .orbit-controls { gap: 12px; margin-top: 0; }
.is-dial .orbit-controls p { min-width: 0; flex: 1; max-width: 220px; }
.is-dial .orbit-reading { grid-template-columns: 1fr; gap: 22px; }
.is-dial .orbit-reading dl { grid-template-columns: 1fr; }
.is-dial .orbit-reading .fog-button { width: 100%; }

.is-low-power .seal-orbit__fog--far { display: none; }

@media (prefers-reduced-motion: reduce) {
  .seal-orbit__fog { animation: none; }
  .orbit-centre,
  .orbit-reading { animation: none; }
  .seal__orb,
  .seal__orb img,
  .orbit-step { transition: none; }
}
</style>
