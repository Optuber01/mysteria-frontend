<template>
  <section id="pathways" class="pathway-section" aria-labelledby="pathway-title">
    <header class="pathway-intro">
      <div>
        <p class="home-eyebrow">22 standard Pathways</p>
        <h2 id="pathway-title">Find the kit you want to master.</h2>
      </div>
      <p>
        Rotate the orbit to preview each starting Sequence and its documented
        abilities. Choose one for a closer look.
      </p>
    </header>

    <div
      ref="orbitStage"
      class="orbit-stage"
      tabindex="0"
      aria-label="Interactive Pathway selector. Use left and right arrow keys to rotate."
      @keydown.left.prevent="previous"
      @keydown.right.prevent="next"
      @pointerdown="startDrag"
      @pointermove="movePointer"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @pointerleave="leaveOrbit"
      @wheel.prevent="handleWheel"
    >
      <div class="orbit-axis" aria-hidden="true">
        <i />
        <i />
        <span>SEQUENCE 9</span>
      </div>

      <button
        v-for="(pathway, index) in standardPathways"
        :key="pathway.id"
        class="orbit-item"
        :class="{
          active: index === nearestIndex,
          selected: index === selectedIndex,
          behind: orbitStyles[index].behind,
        }"
        :style="orbitStyles[index].style"
        type="button"
        :aria-label="`${pathway.name}, ${pathway.startingSequence}`"
        :aria-pressed="index === selectedIndex"
        @click.stop="selectPathway(index)"
        @focus="previewIndex = index"
        @mouseenter="previewIndex = index"
      >
        <span class="orbit-sigil">
          <img :src="pathway.image" alt="" width="74" height="74" loading="lazy">
          <i>{{ String(index + 1).padStart(2, '0') }}</i>
        </span>
        <strong>{{ pathway.name }}</strong>
      </button>

      <div class="orbit-preview" aria-live="polite">
        <span>{{ previewPathway.startingSequence }}</span>
        <strong>{{ previewPathway.name }}</strong>
        <p class="preview-playstyle">{{ previewPathway.playstyle }}</p>
        <span class="preview-strength-label">Documented strengths</span>
        <ul>
          <li v-for="strength in previewPathway.strengths" :key="strength">{{ strength }}</li>
        </ul>
        <p class="preview-summary">{{ previewPathway.summary }}</p>
      </div>

      <div class="orbit-help" aria-hidden="true">
        <span>Drag</span>
        <i />
        <span>Wheel</span>
        <i />
        <span>Arrow keys</span>
      </div>
    </div>

    <div class="orbit-controls">
      <button type="button" aria-label="Previous Pathway" @click="previous">←</button>
      <span><b>{{ String(nearestIndex + 1).padStart(2, '0') }}</b> / 22</span>
      <button type="button" aria-label="Next Pathway" @click="next">→</button>
    </div>

    <div
      class="mobile-pathway"
      aria-label="Mobile Pathway carousel. Swipe or use the previous and next buttons."
      @touchstart.passive="startMobileSwipe"
      @touchend.passive="endMobileSwipe"
    >
      <div class="mobile-sigil">
        <img :src="selectedPathway.image" alt="" width="120" height="120" loading="lazy">
        <span>{{ String(selectedIndex + 1).padStart(2, '0') }} / 22</span>
      </div>
      <p>{{ selectedPathway.startingSequence }}</p>
      <h3>{{ selectedPathway.name }}</h3>
      <div class="mobile-controls">
        <button type="button" aria-label="Previous Pathway" @click="previous">←</button>
        <button type="button" aria-label="Next Pathway" @click="next">→</button>
      </div>
    </div>

    <article class="pathway-detail" :aria-labelledby="`${selectedPathway.id}-detail-title`">
      <div class="detail-id">
        <img :src="selectedPathway.image" alt="" width="96" height="96" loading="lazy">
        <span>Selected Pathway</span>
      </div>
      <div class="detail-title">
        <p>{{ selectedPathway.startingSequence }}</p>
        <h3 :id="`${selectedPathway.id}-detail-title`">{{ selectedPathway.name }}</h3>
        <span>{{ selectedPathway.summary }}</span>
      </div>
      <div class="detail-playstyle">
        <span>Playstyle</span>
        <strong>{{ selectedPathway.playstyle }}</strong>
      </div>
      <div class="detail-strengths">
        <span>Documented strengths</span>
        <ul>
          <li v-for="strength in selectedPathway.strengths" :key="strength">{{ strength }}</li>
        </ul>
      </div>
      <RouterLink :to="`/pathways/${selectedPathway.id}`">
        Open full Pathway
        <span aria-hidden="true">↗</span>
      </RouterLink>
    </article>

    <details class="pathway-fallback">
      <summary>View all Pathways</summary>
      <ul>
        <li v-for="(pathway, index) in standardPathways" :key="pathway.id">
          <button type="button" @click="selectPathway(index)">
            <img :src="pathway.image" alt="" width="38" height="38" loading="lazy">
            <span><strong>{{ pathway.name }}</strong>{{ pathway.startingSequence }}</span>
          </button>
        </li>
      </ul>
    </details>
  </section>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { standardPathways } from '@/data/pathways';
import { useReducedMotion } from '@/composables/useReducedMotion';

const STEP = 360 / standardPathways.length;
const orbitStage = ref<HTMLElement | null>(null);
const rotation = ref(0);
const targetRotation = ref(0);
const velocity = ref(0);
const selectedIndex = ref(0);
const previewIndex = ref<number | null>(null);
const dragging = ref(false);
const reducedMotion = useReducedMotion();
let lastX = 0;
let lastTime = 0;
let frame = 0;
let pointerInfluence = 0;
let mobileTouchStart = 0;

function normalizeAngle(angle: number) {
  return ((angle % 360) + 360) % 360;
}

const nearestIndex = computed(() => {
  const value = normalizeAngle(-rotation.value) / STEP;
  return Math.round(value) % standardPathways.length;
});

const selectedPathway = computed(() => standardPathways[selectedIndex.value]);
const previewPathway = computed(
  () => standardPathways[previewIndex.value ?? nearestIndex.value],
);

const orbitStyles = computed(() =>
  standardPathways.map((_, index) => {
    const angle = normalizeAngle(index * STEP + rotation.value);
    const radians = (angle * Math.PI) / 180;
    const depth = (Math.cos(radians) + 1) / 2;
    const x = 50 + Math.sin(radians) * 45;
    const y = 48 + Math.cos(radians) * 35;
    const scale = .56 + depth * .52;
    return {
      behind: depth < .36,
      style: {
        left: `${x}%`,
        top: `${y}%`,
        zIndex: String(Math.round(depth * 80) + 1),
        opacity: String(.28 + depth * .72),
        transform: `translate(-50%, -50%) scale(${scale})`,
      },
    };
  }),
);

function animate() {
  if (reducedMotion.value) {
    rotation.value = targetRotation.value;
    frame = 0;
    return;
  }
  const delta = targetRotation.value + pointerInfluence - rotation.value;
  velocity.value = velocity.value * .82 + delta * .075;
  rotation.value += velocity.value;
  if (Math.abs(delta) < .015 && Math.abs(velocity.value) < .015) {
    rotation.value = targetRotation.value + pointerInfluence;
    velocity.value = 0;
    frame = 0;
    return;
  }
  frame = requestAnimationFrame(animate);
}

function startAnimation() {
  if (!frame) frame = requestAnimationFrame(animate);
}

function snap(index = nearestIndex.value) {
  targetRotation.value = -index * STEP;
  selectedIndex.value = index;
  previewIndex.value = null;
  startAnimation();
}

function previous() {
  const index = (nearestIndex.value - 1 + standardPathways.length) % standardPathways.length;
  snap(index);
}

function next() {
  const index = (nearestIndex.value + 1) % standardPathways.length;
  snap(index);
}

function selectPathway(index: number) {
  snap(index);
}

function startDrag(event: PointerEvent) {
  if (event.button !== 0) return;
  dragging.value = true;
  lastX = event.clientX;
  lastTime = performance.now();
  pointerInfluence = 0;
  orbitStage.value?.setPointerCapture(event.pointerId);
}

function movePointer(event: PointerEvent) {
  if (dragging.value) {
    const now = performance.now();
    const movement = event.clientX - lastX;
    const elapsed = Math.max(8, now - lastTime);
    rotation.value += movement * .32;
    targetRotation.value = rotation.value;
    velocity.value = (movement / elapsed) * 7;
    lastX = event.clientX;
    lastTime = now;
    return;
  }

  if (event.pointerType === 'touch' || !orbitStage.value || reducedMotion.value) return;
  const rect = orbitStage.value.getBoundingClientRect();
  const horizontal = ((event.clientX - rect.left) / rect.width - .5) * 2;
  pointerInfluence = horizontal * STEP * .42;
  startAnimation();
}

function endDrag(event: PointerEvent) {
  if (!dragging.value) return;
  dragging.value = false;
  if (orbitStage.value?.hasPointerCapture(event.pointerId)) {
    orbitStage.value.releasePointerCapture(event.pointerId);
  }
  rotation.value += velocity.value * 2.6;
  snap(nearestIndex.value);
}

function leaveOrbit() {
  if (dragging.value) return;
  pointerInfluence = 0;
  previewIndex.value = null;
  snap(nearestIndex.value);
}

function handleWheel(event: WheelEvent) {
  const amount = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  targetRotation.value -= Math.sign(amount) * STEP * .42;
  velocity.value -= Math.sign(amount) * .7;
  startAnimation();
  window.clearTimeout((handleWheel as typeof handleWheel & { timer?: number }).timer);
  (handleWheel as typeof handleWheel & { timer?: number }).timer = window.setTimeout(
    () => snap(nearestIndex.value),
    130,
  );
}

function startMobileSwipe(event: TouchEvent) {
  mobileTouchStart = event.changedTouches[0]?.clientX ?? 0;
}

function endMobileSwipe(event: TouchEvent) {
  const end = event.changedTouches[0]?.clientX ?? mobileTouchStart;
  const distance = end - mobileTouchStart;
  if (Math.abs(distance) < 42) return;
  if (distance < 0) next();
  else previous();
}

onUnmounted(() => {
  if (frame) cancelAnimationFrame(frame);
  const timer = (handleWheel as typeof handleWheel & { timer?: number }).timer;
  if (timer) window.clearTimeout(timer);
});
</script>

<style scoped>
.pathway-section {
  padding: clamp(90px, 13vw, 180px) clamp(18px, 4vw, 64px);
  overflow: clip;
  color: #f5f0e6;
  background:
    radial-gradient(ellipse at 50% 30%, rgba(33, 100, 77, .33), transparent 42%),
    #08151a;
}

.pathway-intro,
.pathway-detail,
.pathway-fallback {
  width: min(1380px, 100%);
  margin-inline: auto;
}

.pathway-intro {
  display: grid;
  grid-template-columns: 1.25fr .75fr;
  align-items: end;
  gap: 60px;
}

.home-eyebrow {
  margin: 0 0 18px;
  color: #d7b978;
  font: 600 10px/1 "IBM Plex Mono", monospace;
  letter-spacing: .18em;
  text-transform: uppercase;
}

.pathway-intro h2 {
  max-width: 900px;
  margin: 0;
  font: 650 clamp(3.3rem, 7vw, 7rem)/.86 "IBM Plex Sans Condensed", sans-serif;
  letter-spacing: -.055em;
}

.pathway-intro > p {
  max-width: 470px;
  margin: 0 0 8px;
  color: rgba(245, 240, 230, .58);
  line-height: 1.7;
}

.orbit-stage {
  position: relative;
  width: min(1280px, 100%);
  height: min(72vw, 820px);
  min-height: 620px;
  margin: 70px auto 0;
  outline: none;
  cursor: grab;
  touch-action: pan-y;
  user-select: none;
}

.orbit-stage:active { cursor: grabbing; }
.orbit-stage:focus-visible {
  outline: 2px solid #d7b978;
  outline-offset: 8px;
  border-radius: 28px;
}

.orbit-axis {
  position: absolute;
  inset: 6% 2% 11%;
  border: 1px solid rgba(215, 185, 120, .26);
  border-radius: 50%;
  transform: perspective(900px) rotateX(61deg);
}

.orbit-axis::before,
.orbit-axis::after {
  content: "";
  position: absolute;
  inset: 12%;
  border: 1px dashed rgba(245, 240, 230, .08);
  border-radius: inherit;
}
.orbit-axis::after { inset: 27%; }
.orbit-axis i {
  position: absolute;
  left: 50%;
  width: 1px;
  height: 16%;
  background: linear-gradient(#d7b978, transparent);
}
.orbit-axis i:first-child { top: -2%; }
.orbit-axis i:nth-child(2) { bottom: -2%; transform: rotate(180deg); }
.orbit-axis span {
  position: absolute;
  left: 50%;
  bottom: -4%;
  transform: translateX(-50%) rotateX(-61deg);
  color: rgba(215, 185, 120, .5);
  font: 500 9px/1 "IBM Plex Mono", monospace;
  letter-spacing: .2em;
}

.orbit-item {
  position: absolute;
  width: 116px;
  min-height: 132px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 7px;
  padding: 7px;
  border: 0;
  color: rgba(245, 240, 230, .72);
  background: transparent;
  cursor: pointer;
  transition: opacity .2s, filter .2s;
  will-change: transform, left, top;
}

.orbit-item.behind { filter: saturate(.35); }
.orbit-item:hover,
.orbit-item:focus-visible,
.orbit-item.active { color: #fcf9f2; filter: none; }
.orbit-item:focus-visible { outline: 2px solid #d7b978; outline-offset: 2px; border-radius: 16px; }

.orbit-sigil {
  position: relative;
  width: 86px;
  height: 86px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(245, 240, 230, .13);
  border-radius: 50%;
  background: rgba(8, 21, 26, .78);
  box-shadow: 0 14px 30px rgba(0, 0, 0, .25);
  transition: border-color .25s, background .25s, transform .35s cubic-bezier(.22, 1, .36, 1);
}

.orbit-item.active .orbit-sigil,
.orbit-item.selected .orbit-sigil {
  border-color: #c69b52;
  background: #153b32;
  transform: scale(1.08);
}

.orbit-sigil img {
  width: 68px;
  height: 68px;
  object-fit: contain;
}

.orbit-sigil i {
  position: absolute;
  right: -3px;
  bottom: 2px;
  min-width: 23px;
  height: 23px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #0d2824;
  background: #d7b978;
  font: 700 8px/1 "IBM Plex Mono", monospace;
  font-style: normal;
}

.orbit-item > strong {
  font: 600 10px/1.2 "Manrope", sans-serif;
  white-space: nowrap;
}

.orbit-preview {
  position: absolute;
  left: 50%;
  top: 47%;
  width: min(360px, 42%);
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.orbit-preview span {
  color: #d7b978;
  font: 600 9px/1 "IBM Plex Mono", monospace;
  letter-spacing: .14em;
  text-transform: uppercase;
}
.orbit-preview strong {
  display: block;
  margin: 12px 0 8px;
  font: 650 clamp(2.8rem, 5vw, 5rem)/.9 "IBM Plex Sans Condensed", sans-serif;
  letter-spacing: -.045em;
}
.orbit-preview p { margin: 0; color: rgba(245, 240, 230, .5); font-size: .85rem; }
.orbit-preview .preview-strength-label {
  display: block;
  margin-top: 13px;
  color: rgba(245, 240, 230, .34);
  font-size: 7px;
}
.orbit-preview ul {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 5px;
  margin: 7px 0 9px;
  padding: 0;
  list-style: none;
}
.orbit-preview li {
  padding: 5px 7px;
  border: 1px solid rgba(245, 240, 230, .12);
  border-radius: 6px;
  color: rgba(245, 240, 230, .7);
  font: 500 8px/1 "IBM Plex Mono", monospace;
}
.orbit-preview .preview-summary { color: rgba(245, 240, 230, .38); font-size: .7rem; line-height: 1.45; }

.orbit-help {
  position: absolute;
  left: 50%;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  transform: translateX(-50%);
  color: rgba(245, 240, 230, .34);
  font: 500 8px/1 "IBM Plex Mono", monospace;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.orbit-help i { width: 3px; height: 3px; border-radius: 50%; background: #d7b978; opacity: .6; }

.orbit-controls {
  width: min(400px, 100%);
  display: grid;
  grid-template-columns: 48px 1fr 48px;
  align-items: center;
  gap: 14px;
  margin: 14px auto 60px;
}
.orbit-controls button,
.mobile-controls button {
  width: 48px;
  height: 48px;
  border: 1px solid rgba(245, 240, 230, .18);
  border-radius: 50%;
  color: #f5f0e6;
  background: transparent;
  cursor: pointer;
}
.orbit-controls button:hover,
.mobile-controls button:hover { border-color: #d7b978; background: rgba(215, 185, 120, .08); }
.orbit-controls > span {
  color: rgba(245, 240, 230, .38);
  font: 500 9px/1 "IBM Plex Mono", monospace;
  text-align: center;
}
.orbit-controls b { color: #d7b978; font-size: 13px; }

.pathway-detail {
  display: grid;
  grid-template-columns: auto 1.2fr .8fr 1fr auto;
  align-items: center;
  gap: clamp(20px, 3vw, 44px);
  padding: 28px;
  border: 1px solid rgba(245, 240, 230, .13);
  border-radius: 24px;
  background: rgba(245, 240, 230, .035);
}

.detail-id {
  display: grid;
  gap: 9px;
  justify-items: center;
}
.detail-id img { width: 74px; height: 74px; object-fit: contain; }
.detail-id span,
.detail-playstyle span,
.detail-strengths > span {
  color: rgba(245, 240, 230, .42);
  font: 500 8px/1 "IBM Plex Mono", monospace;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.detail-title p { margin: 0 0 7px; color: #d7b978; font: 600 9px/1 "IBM Plex Mono", monospace; text-transform: uppercase; }
.detail-title h3 { margin: 0 0 8px; font: 650 2rem/1 "IBM Plex Sans Condensed", sans-serif; }
.detail-title > span { color: rgba(245, 240, 230, .52); font-size: .78rem; }
.detail-playstyle strong { display: block; margin-top: 10px; font-size: .85rem; }
.detail-strengths ul { margin: 9px 0 0; padding: 0; list-style: none; }
.detail-strengths li {
  position: relative;
  margin: 5px 0;
  padding-left: 13px;
  color: rgba(245, 240, 230, .7);
  font-size: .76rem;
}
.detail-strengths li::before { content: ""; position: absolute; left: 0; top: .55em; width: 4px; height: 4px; background: #d7b978; transform: rotate(45deg); }
.pathway-detail > a {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 0 17px;
  border-radius: 12px;
  color: #102924;
  background: #f5f0e6;
  font-size: .78rem;
  font-weight: 700;
  white-space: nowrap;
}

.mobile-pathway { display: none; }

.pathway-fallback { margin-top: 24px; }
.pathway-fallback summary {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  color: #d7b978;
  font: 600 11px/1 "IBM Plex Mono", monospace;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.pathway-fallback ul {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 18px 0 0;
  list-style: none;
}
.pathway-fallback button {
  width: 100%;
  min-height: 58px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid rgba(245, 240, 230, .1);
  border-radius: 10px;
  color: #f5f0e6;
  background: transparent;
  cursor: pointer;
  text-align: left;
}
.pathway-fallback button:hover { border-color: #d7b978; }
.pathway-fallback img { width: 38px; height: 38px; object-fit: contain; }
.pathway-fallback button span { display: grid; gap: 4px; color: rgba(245, 240, 230, .46); font-size: .65rem; }
.pathway-fallback button strong { color: #f5f0e6; font-size: .75rem; }

@media (max-width: 900px) {
  .pathway-intro { grid-template-columns: 1fr; gap: 22px; }
  .orbit-stage,
  .orbit-controls { display: none; }
  .mobile-pathway {
    display: grid;
    justify-items: center;
    margin: 64px 0 36px;
    text-align: center;
    touch-action: pan-y;
  }
  .mobile-sigil {
    position: relative;
    width: 190px;
    height: 190px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(215, 185, 120, .28);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(33, 100, 77, .48), transparent 68%);
  }
  .mobile-sigil img { width: 128px; height: 128px; object-fit: contain; }
  .mobile-sigil span {
    position: absolute;
    bottom: 0;
    padding: 7px 10px;
    border-radius: 999px;
    color: #102924;
    background: #d7b978;
    font: 700 9px/1 "IBM Plex Mono", monospace;
  }
  .mobile-pathway > p { margin: 24px 0 8px; color: #d7b978; font: 600 9px/1 "IBM Plex Mono", monospace; text-transform: uppercase; }
  .mobile-pathway h3 { margin: 0; font: 650 3.6rem/.9 "IBM Plex Sans Condensed", sans-serif; }
  .mobile-controls { display: flex; gap: 26px; margin-top: 24px; }
  .pathway-detail { grid-template-columns: auto 1fr; }
  .detail-playstyle,
  .detail-strengths { padding-top: 18px; border-top: 1px solid rgba(245, 240, 230, .1); }
  .pathway-detail > a { justify-self: start; }
  .pathway-fallback ul { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 560px) {
  .pathway-section { padding-inline: 16px; }
  .pathway-detail { grid-template-columns: 1fr; padding: 22px; text-align: left; }
  .detail-id { grid-template-columns: auto 1fr; justify-items: start; align-items: center; }
  .detail-id img { width: 58px; height: 58px; }
  .pathway-fallback ul { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .orbit-item,
  .orbit-sigil,
  .pathway-detail { transition: none; }
}
</style>
