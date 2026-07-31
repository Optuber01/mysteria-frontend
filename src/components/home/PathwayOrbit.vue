<template>
  <section id="pathways" ref="section" class="pathway-vault" aria-labelledby="pathway-title">
    <div class="vault-heading">
      <p>Choose your route</p>
      <h2 id="pathway-title">Twenty-two ways to begin.</h2>
      <span>Select a seal. Your choice carries into the advancement journey.</span>
    </div>

    <div
      ref="orbitStage"
      class="orbit-stage"
      tabindex="0"
      aria-label="Pathway orbit. Drag, use the mouse wheel, or press the left and right arrow keys."
      @keydown.left.prevent="previous"
      @keydown.right.prevent="next"
      @pointerdown="startDrag"
      @pointermove="movePointer"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @pointerleave="leaveOrbit"
      @wheel="handleWheel"
    >
      <div class="celestial-plane" aria-hidden="true">
        <i class="plane-ring plane-ring--one" />
        <i class="plane-ring plane-ring--two" />
        <i class="plane-axis plane-axis--x" />
        <i class="plane-axis plane-axis--y" />
        <b />
      </div>

      <button
        v-for="(pathway, index) in standardPathways"
        :key="pathway.id"
        type="button"
        class="orbit-pathway"
        :class="{
          active: index === nearestIndex,
          selected: index === selectedIndex,
          behind: orbitStyles[index].behind,
        }"
        :style="orbitStyles[index].style"
        :aria-label="`${pathway.name}, ${pathway.startingSequence}`"
        :aria-pressed="index === selectedIndex"
        @mouseenter="previewIndex = index"
        @focus="previewIndex = index"
        @click.stop="selectPathway(index, true)"
      >
        <span>
          <img :src="pathway.image" alt="" width="72" height="72" loading="lazy">
          <i>{{ String(index + 1).padStart(2, '0') }}</i>
        </span>
        <strong>{{ pathway.name }}</strong>
      </button>

      <article class="orbit-center" aria-live="polite">
        <div class="selected-seal" aria-hidden="true">
          <i />
          <img :src="previewPathway.image" alt="" width="150" height="150">
        </div>
        <p>{{ previewPathway.startingSequence }}</p>
        <h3>{{ previewPathway.name }}</h3>
        <strong>{{ previewPathway.playstyle }}</strong>
        <ul aria-label="Documented strengths">
          <li v-for="strength in previewPathway.strengths" :key="strength">{{ strength }}</li>
        </ul>
        <small>{{ previewPathway.summary }}</small>
      </article>

      <div class="orbit-affordance" aria-hidden="true">
        <span>Drag</span><i /><span>Wheel</span><i /><span>Arrow keys</span>
      </div>

      <div class="orbit-controls">
        <button type="button" aria-label="Previous Pathway" @click.stop="previous">←</button>
        <span><b>{{ String(nearestIndex + 1).padStart(2, '0') }}</b> / 22</span>
        <button type="button" aria-label="Next Pathway" @click.stop="next">→</button>
      </div>

      <button class="open-dossier" type="button" @click.stop="openDetails">
        Open selected Pathway <span aria-hidden="true">↗</span>
      </button>
    </div>

    <div
      class="mobile-pathway"
      aria-label="Mobile Pathway carousel. Swipe or use the previous and next buttons."
      @touchstart.passive="startMobileSwipe"
      @touchend.passive="endMobileSwipe"
    >
      <div class="mobile-seal">
        <i aria-hidden="true" />
        <img :src="selectedPathway.image" alt="" width="142" height="142">
        <span>{{ String(selectedIndex + 1).padStart(2, '0') }} / 22</span>
      </div>
      <p>{{ selectedPathway.startingSequence }}</p>
      <h3>{{ selectedPathway.name }}</h3>
      <strong>{{ selectedPathway.playstyle }}</strong>
      <ul aria-label="Documented strengths">
        <li v-for="strength in selectedPathway.strengths" :key="strength">{{ strength }}</li>
      </ul>
      <small>{{ selectedPathway.summary }}</small>
      <div class="mobile-controls">
        <button type="button" aria-label="Previous Pathway" @click="previous">←</button>
        <button type="button" @click="openDetails">View details</button>
        <button type="button" aria-label="Next Pathway" @click="next">→</button>
      </div>
    </div>

    <Transition name="dossier">
      <aside
        v-if="detailsOpen"
        class="pathway-dossier"
        role="dialog"
        aria-modal="false"
        :aria-labelledby="`${selectedPathway.id}-dossier-title`"
        @keydown.esc.stop.prevent="closeDetails()"
      >
        <button ref="dossierCloseRef" class="dossier-close" type="button" aria-label="Close Pathway details" @click="closeDetails()">×</button>
        <img :src="selectedPathway.image" alt="" width="110" height="110">
        <p>{{ selectedPathway.startingSequence }}</p>
        <h3 :id="`${selectedPathway.id}-dossier-title`">{{ selectedPathway.name }}</h3>
        <span>{{ selectedPathway.summary }}</span>
        <dl>
          <div><dt>Playstyle</dt><dd>{{ selectedPathway.playstyle }}</dd></div>
          <div><dt>Documented strengths</dt><dd>{{ selectedPathway.strengths.join(' · ') }}</dd></div>
        </dl>
        <RouterLink :to="`/pathways/${selectedPathway.id}`">Browse every Sequence <span aria-hidden="true">↗</span></RouterLink>
      </aside>
    </Transition>

    <details class="pathway-fallback">
      <summary>View all 22 Pathways</summary>
      <ul>
        <li v-for="(pathway, index) in standardPathways" :key="pathway.id">
          <button type="button" @click="selectPathway(index, true)">
            <img :src="pathway.image" alt="" width="40" height="40" loading="lazy">
            <span><strong>{{ pathway.name }}</strong>{{ pathway.startingSequence }}</span>
          </button>
        </li>
      </ul>
    </details>

    <div class="vault-handoff" aria-hidden="true">
      <i /><b />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { standardPathways } from '@/data/pathways';
import { useReducedMotion } from '@/composables/useReducedMotion';

const emit = defineEmits<{ selected: [name: string] }>();
const STEP = 360 / standardPathways.length;
const section = ref<HTMLElement | null>(null);
const orbitStage = ref<HTMLElement | null>(null);
const dossierCloseRef = ref<HTMLButtonElement | null>(null);
const rotation = ref(0);
const targetRotation = ref(0);
const velocity = ref(0);
const selectedIndex = ref(0);
const previewIndex = ref<number | null>(null);
const dragging = ref(false);
const detailsOpen = ref(false);
const reducedMotion = useReducedMotion();
let lastX = 0;
let lastTime = 0;
let frame = 0;
let pointerInfluence = 0;
let mobileTouchStart = 0;
let wheelTimer = 0;
let wheelBurst = 0;
let wheelBurstStarted = 0;
let wheelReleasedUntil = 0;
let lastWheelRotation = 0;
let sectionObserver: IntersectionObserver | null = null;
let dossierTrigger: HTMLElement | null = null;

const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360;
const nearestIndex = computed(() => Math.round(normalizeAngle(-rotation.value) / STEP) % standardPathways.length);
const selectedPathway = computed(() => standardPathways[selectedIndex.value]);
const previewPathway = computed(() => standardPathways[previewIndex.value ?? nearestIndex.value]);
const orbitStyles = computed(() =>
  standardPathways.map((_, index) => {
    const radians = (normalizeAngle(index * STEP + rotation.value) * Math.PI) / 180;
    const depth = (Math.cos(radians) + 1) / 2;
    return {
      behind: depth < .33,
      style: {
        left: `${50 + Math.sin(radians) * 46}%`,
        top: `${49 + Math.cos(radians) * 37}%`,
        zIndex: String(Math.round(depth * 50) + 1),
        opacity: String(.34 + depth * .66),
        transform: `translate(-50%, -50%) scale(${.58 + depth * .5})`,
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

function snap(index = nearestIndex.value, announce = true) {
  pointerInfluence = 0;
  targetRotation.value = -index * STEP;
  selectedIndex.value = index;
  previewIndex.value = null;
  if (announce) emit('selected', standardPathways[index].name);
  startAnimation();
}

function previous() {
  snap((nearestIndex.value - 1 + standardPathways.length) % standardPathways.length);
}
function next() {
  snap((nearestIndex.value + 1) % standardPathways.length);
}
function selectPathway(index: number, open = false) {
  snap(index);
  if (open) void openDetails();
}
function startDrag(event: PointerEvent) {
  if (event.button !== 0) return;
  if ((event.target as HTMLElement).closest('button, a, summary, details')) return;
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
    rotation.value += movement * .32;
    targetRotation.value = rotation.value;
    velocity.value = (movement / Math.max(8, now - lastTime)) * 7;
    lastX = event.clientX;
    lastTime = now;
    return;
  }
  if (event.pointerType === 'touch' || !orbitStage.value || reducedMotion.value) return;
  const rect = orbitStage.value.getBoundingClientRect();
  pointerInfluence = (((event.clientX - rect.left) / rect.width) - .5) * STEP * 1.5;
  startAnimation();
}
function endDrag(event: PointerEvent) {
  if (!dragging.value) return;
  dragging.value = false;
  if (orbitStage.value?.hasPointerCapture(event.pointerId)) orbitStage.value.releasePointerCapture(event.pointerId);
  rotation.value += velocity.value * 2.5;
  snap(nearestIndex.value);
}
function leaveOrbit() {
  if (dragging.value) return;
  pointerInfluence = 0;
  previewIndex.value = null;
  snap(nearestIndex.value, false);
}
function handleWheel(event: WheelEvent) {
  const now = performance.now();
  if (now < wheelReleasedUntil) return;
  if (now - wheelBurstStarted > 650) {
    wheelBurst = 0;
    wheelBurstStarted = now;
  }
  if (wheelBurst >= 3) {
    wheelReleasedUntil = now + 900;
    wheelBurst = 0;
    return;
  }
  event.preventDefault();
  const amount = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  if (now - lastWheelRotation > 110) {
    if (Math.sign(amount) > 0) next();
    else previous();
    lastWheelRotation = now;
    wheelBurst++;
  }
  clearTimeout(wheelTimer);
  wheelTimer = window.setTimeout(() => snap(nearestIndex.value), 130);
}
function startMobileSwipe(event: TouchEvent) {
  mobileTouchStart = event.changedTouches[0]?.clientX ?? 0;
}
function endMobileSwipe(event: TouchEvent) {
  const distance = (event.changedTouches[0]?.clientX ?? mobileTouchStart) - mobileTouchStart;
  if (Math.abs(distance) < 42) return;
  if (distance < 0) next();
  else previous();
}

async function openDetails(event?: Event) {
  dossierTrigger = (event?.currentTarget as HTMLElement | null) ?? dossierTrigger;
  detailsOpen.value = true;
  await nextTick();
  dossierCloseRef.value?.focus();
}

async function closeDetails(restoreFocus = true) {
  if (!detailsOpen.value) return;
  detailsOpen.value = false;
  await nextTick();
  if (restoreFocus && dossierTrigger?.isConnected) dossierTrigger.focus();
}

function handleDossierEscape(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !detailsOpen.value) return;
  event.preventDefault();
  void closeDetails();
}

onMounted(() => {
  sectionObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting && detailsOpen.value) void closeDetails(false);
  });
  if (section.value) sectionObserver.observe(section.value);
  document.addEventListener('keydown', handleDossierEscape);
});

onUnmounted(() => {
  sectionObserver?.disconnect();
  document.removeEventListener('keydown', handleDossierEscape);
  if (frame) cancelAnimationFrame(frame);
  if (wheelTimer) clearTimeout(wheelTimer);
});
</script>

<style scoped>
.pathway-vault {
  position: relative;
  min-height: 110svh;
  overflow: clip;
  color: #f5f0e6;
  background:
    radial-gradient(circle at 50% 49%, rgba(33, 100, 77, .31), transparent 33%),
    linear-gradient(180deg, #08151a, #0a1d20 60%, #08191b);
}
.pathway-vault::before {
  content: "";
  position: absolute;
  inset: 0;
  opacity: .13;
  background-image:
    linear-gradient(rgba(245, 240, 230, .06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(245, 240, 230, .06) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(circle, #000, transparent 75%);
  pointer-events: none;
}
.pathway-vault::after {
  content: "";
  position: absolute;
  z-index: 2;
  left: 0;
  right: 0;
  bottom: 0;
  height: 190px;
  background:
    radial-gradient(ellipse at 50% 100%, rgba(224, 189, 113, .18), transparent 43%),
    linear-gradient(180deg, transparent, rgba(13, 37, 37, .82));
  pointer-events: none;
}

.vault-heading {
  position: absolute;
  z-index: 80;
  top: clamp(86px, 10vh, 112px);
  left: clamp(22px, 5vw, 76px);
  width: min(390px, calc(100% - 44px));
}
.vault-heading p { margin: 0 0 12px; color: #e0bd71; font: 600 9px/1 "IBM Plex Mono", monospace; letter-spacing: .18em; text-transform: uppercase; }
.vault-heading h2 { margin: 0; font: 650 clamp(2.3rem, 4vw, 4.4rem)/.88 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.045em; }
.vault-heading span { display: block; max-width: 340px; margin-top: 15px; color: rgba(245, 240, 230, .5); font-size: .78rem; line-height: 1.55; }

.orbit-stage {
  position: relative;
  z-index: 1;
  width: min(1540px, 100%);
  height: max(780px, 100svh);
  margin: auto;
  outline: 0;
  cursor: grab;
  touch-action: pan-y;
  user-select: none;
}
.orbit-stage:active { cursor: grabbing; }
.orbit-stage:focus-visible { outline: 2px solid #e0bd71; outline-offset: -8px; }

.celestial-plane {
  position: absolute;
  inset: 14% 3% 7%;
  border: 1px solid rgba(224, 189, 113, .3);
  border-radius: 50%;
  transform: perspective(900px) rotateX(61deg);
}
.plane-ring { position: absolute; border: 1px dashed rgba(245, 240, 230, .1); border-radius: 50%; }
.plane-ring--one { inset: 12%; }
.plane-ring--two { inset: 29%; }
.plane-axis { position: absolute; left: 50%; top: -3%; width: 1px; height: 106%; background: linear-gradient(transparent, rgba(224, 189, 113, .5), transparent); }
.plane-axis--x { transform: rotate(90deg); }
.celestial-plane b { position: absolute; left: 50%; top: 50%; width: 12px; height: 12px; background: #e0bd71; transform: translate(-50%, -50%) rotate(45deg); }

.orbit-pathway {
  position: absolute;
  width: 116px;
  min-height: 128px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 7px;
  padding: 6px;
  border: 0;
  color: rgba(245, 240, 230, .8);
  background: transparent;
  cursor: pointer;
  will-change: left, top, transform;
  transition: opacity .18s, filter .18s;
}
.orbit-pathway.behind { filter: saturate(.5) brightness(.78); }
.orbit-pathway:hover,
.orbit-pathway:focus-visible,
.orbit-pathway.active { color: #fff; filter: none; }
.orbit-pathway:focus-visible { outline: 2px solid #e0bd71; outline-offset: 0; border-radius: 14px; }
.orbit-pathway > span {
  position: relative;
  width: 82px;
  height: 82px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(245, 240, 230, .19);
  border-radius: 50%;
  background: rgba(8, 21, 26, .86);
  box-shadow: 0 14px 30px rgba(0, 0, 0, .26);
  transition: transform .35s cubic-bezier(.22, 1, .36, 1), border-color .25s, background-color .25s;
}
.orbit-pathway.active > span,
.orbit-pathway.selected > span { border-color: #e0bd71; background: #163c33; transform: scale(1.12); }
.orbit-pathway img { width: 66px; height: 66px; object-fit: contain; }
.orbit-pathway i {
  position: absolute;
  right: -2px;
  bottom: 0;
  width: 23px;
  height: 23px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #102924;
  background: #e0bd71;
  font: 700 8px/1 "IBM Plex Mono", monospace;
  font-style: normal;
}
.orbit-pathway > strong { font-size: .66rem; white-space: nowrap; }

.orbit-center {
  position: absolute;
  z-index: 60;
  left: 50%;
  top: 49%;
  width: min(390px, 38vw);
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}
.selected-seal {
  position: relative;
  width: clamp(126px, 13vw, 190px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  margin: 0 auto 17px;
  border: 1px solid rgba(224, 189, 113, .55);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(33, 100, 77, .5), rgba(8, 21, 26, .2) 68%, transparent);
  box-shadow: 0 0 50px rgba(33, 100, 77, .28);
}
.selected-seal i {
  position: absolute;
  inset: -10%;
  border: 1px dashed rgba(224, 189, 113, .35);
  border-radius: 50%;
  transform: rotate(24deg);
}
.selected-seal img { width: 76%; height: 76%; object-fit: contain; filter: drop-shadow(0 10px 20px rgba(0, 0, 0, .36)); }
.orbit-center > p { margin: 0 0 8px; color: #e0bd71; font: 600 8px/1 "IBM Plex Mono", monospace; letter-spacing: .12em; text-transform: uppercase; }
.orbit-center h3 { margin: 0; font: 650 clamp(2.6rem, 4.6vw, 5rem)/.82 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.05em; }
.orbit-center > strong { display: block; margin-top: 10px; color: rgba(245, 240, 230, .62); font-size: .75rem; }
.orbit-center ul { display: flex; justify-content: center; flex-wrap: wrap; gap: 5px; margin: 13px 0 8px; padding: 0; list-style: none; }
.orbit-center li { padding: 5px 7px; border: 1px solid rgba(245, 240, 230, .14); border-radius: 6px; color: rgba(245, 240, 230, .72); font: 500 7px/1 "IBM Plex Mono", monospace; }
.orbit-center small { color: rgba(245, 240, 230, .38); font-size: .64rem; line-height: 1.45; }

.orbit-affordance {
  position: absolute;
  z-index: 70;
  right: clamp(22px, 5vw, 76px);
  top: clamp(102px, 12vh, 132px);
  display: flex;
  align-items: center;
  gap: 9px;
  color: rgba(245, 240, 230, .44);
  font: 500 8px/1 "IBM Plex Mono", monospace;
  letter-spacing: .1em;
  text-transform: uppercase;
}
.orbit-affordance i { width: 3px; height: 3px; border-radius: 50%; background: #e0bd71; }
.orbit-controls {
  position: absolute;
  z-index: 70;
  left: clamp(22px, 5vw, 76px);
  bottom: clamp(30px, 5vh, 58px);
  display: grid;
  grid-template-columns: 48px 80px 48px;
  align-items: center;
  gap: 8px;
}
.orbit-controls button,
.mobile-controls button {
  min-width: 48px;
  min-height: 48px;
  border: 1px solid rgba(245, 240, 230, .23);
  border-radius: 50%;
  color: #f5f0e6;
  background: rgba(8, 21, 26, .62);
  cursor: pointer;
}
.orbit-controls button:hover,
.mobile-controls button:hover { border-color: #e0bd71; background: rgba(224, 189, 113, .08); }
.orbit-controls > span { color: rgba(245, 240, 230, .4); font: 500 9px/1 "IBM Plex Mono", monospace; text-align: center; }
.orbit-controls b { color: #e0bd71; font-size: 13px; }
.open-dossier {
  position: absolute;
  z-index: 70;
  right: clamp(22px, 5vw, 76px);
  bottom: clamp(30px, 5vh, 58px);
  min-height: 48px;
  padding: 0 17px;
  border: 1px solid rgba(245, 240, 230, .22);
  border-radius: 11px;
  color: #f5f0e6;
  background: rgba(8, 21, 26, .72);
  cursor: pointer;
  font-size: .72rem;
  font-weight: 700;
}

.mobile-pathway { display: none; position: relative; z-index: 80; pointer-events: auto; }
.pathway-dossier {
  position: fixed;
  z-index: 1000;
  right: clamp(16px, 4vw, 50px);
  top: 50%;
  width: min(430px, calc(100% - 32px));
  max-height: calc(100svh - 32px);
  overflow: auto;
  padding: 34px;
  border: 1px solid rgba(224, 189, 113, .4);
  border-radius: 22px;
  color: #f5f0e6;
  background: rgba(8, 21, 26, .96);
  box-shadow: 0 30px 90px rgba(0, 0, 0, .5);
  transform: translateY(-50%);
  backdrop-filter: blur(20px);
}
.pathway-dossier > img { width: 94px; height: 94px; object-fit: contain; }
.pathway-dossier > p { margin: 18px 0 8px; color: #e0bd71; font: 600 9px/1 "IBM Plex Mono", monospace; text-transform: uppercase; }
.pathway-dossier h3 { margin: 0 0 10px; font: 650 3rem/.88 "IBM Plex Sans Condensed", sans-serif; }
.pathway-dossier > span { color: rgba(245, 240, 230, .55); font-size: .8rem; line-height: 1.5; }
.pathway-dossier dl { margin: 25px 0; }
.pathway-dossier dl > div { padding: 14px 0; border-top: 1px solid rgba(245, 240, 230, .12); }
.pathway-dossier dt { color: rgba(245, 240, 230, .4); font: 500 8px/1 "IBM Plex Mono", monospace; letter-spacing: .12em; text-transform: uppercase; }
.pathway-dossier dd { margin: 8px 0 0; font-size: .82rem; }
.pathway-dossier > a { min-height: 48px; display: flex; align-items: center; justify-content: space-between; padding: 0 15px; border-radius: 10px; color: #102924; background: #f5f0e6; font-size: .78rem; font-weight: 750; }
.dossier-close { position: absolute; right: 14px; top: 14px; width: 44px; height: 44px; border: 0; border-radius: 50%; color: #f5f0e6; background: rgba(245, 240, 230, .08); cursor: pointer; font-size: 1.4rem; }
.dossier-enter-active,
.dossier-leave-active { transition: opacity .25s, transform .45s cubic-bezier(.22, 1, .36, 1); }
.dossier-enter-from,
.dossier-leave-to { opacity: 0; transform: translate(20px, -50%); }

.pathway-fallback { position: relative; z-index: 80; width: min(1320px, calc(100% - 40px)); margin: -8px auto 90px; }
.pathway-fallback summary { min-height: 48px; display: inline-flex; align-items: center; color: #e0bd71; cursor: pointer; font: 600 10px/1 "IBM Plex Mono", monospace; letter-spacing: .1em; text-transform: uppercase; }
.pathway-fallback ul { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 7px; margin: 0; padding: 16px 0 0; list-style: none; }
.pathway-fallback button { width: 100%; min-height: 58px; display: flex; align-items: center; gap: 10px; padding: 7px 9px; border: 1px solid rgba(245, 240, 230, .1); border-radius: 9px; color: #f5f0e6; background: transparent; cursor: pointer; text-align: left; }
.pathway-fallback button:hover { border-color: #e0bd71; }
.pathway-fallback img { width: 40px; height: 40px; object-fit: contain; }
.pathway-fallback button span { min-width: 0; display: grid; gap: 3px; color: rgba(245, 240, 230, .42); font-size: .62rem; overflow-wrap: anywhere; }
.pathway-fallback button strong { color: #f5f0e6; font-size: .72rem; }

.vault-handoff {
  position: absolute;
  z-index: 3;
  left: 50%;
  bottom: -8px;
  width: 84px;
  height: 116px;
  transform: translateX(-50%);
  pointer-events: none;
}
.vault-handoff::after {
  content: "ADVANCEMENT";
  position: absolute;
  left: 50%;
  bottom: 7px;
  color: rgba(245, 240, 230, .5);
  font: 650 7px/1 "IBM Plex Mono", monospace;
  letter-spacing: .14em;
  transform: translateX(-50%);
}
.vault-handoff i { position: absolute; inset: 0 10px; border: 1px solid rgba(224, 189, 113, .7); border-radius: 26px 26px 34px 34px; background: linear-gradient(transparent 35%, rgba(33, 100, 77, .65)); }
.vault-handoff b { position: absolute; left: 50%; top: 48%; width: 16px; height: 16px; background: #e0bd71; transform: translate(-50%, -50%) rotate(45deg); box-shadow: 0 0 22px rgba(224, 189, 113, .8); }

@media (max-width: 900px) {
  .pathway-vault { min-height: auto; padding: 90px 16px 110px; }
  .vault-heading { position: relative; inset: auto; width: 100%; text-align: center; }
  .vault-heading h2 { font-size: clamp(2.8rem, 13vw, 5rem); }
  .vault-heading span { margin-inline: auto; }
  .orbit-stage { display: none; }
  .mobile-pathway {
    width: min(540px, 100%);
    display: grid;
    justify-items: center;
    margin: 54px auto 0;
    text-align: center;
    touch-action: pan-y;
  }
  .mobile-seal { position: relative; width: min(50vw, 210px); aspect-ratio: 1; display: grid; place-items: center; border: 1px solid rgba(224, 189, 113, .48); border-radius: 50%; background: radial-gradient(circle, rgba(33, 100, 77, .52), transparent 70%); }
  .mobile-seal i { position: absolute; inset: -8%; border: 1px dashed rgba(224, 189, 113, .3); border-radius: 50%; }
  .mobile-seal img { width: 72%; height: 72%; object-fit: contain; }
  .mobile-seal span { position: absolute; bottom: -4px; padding: 6px 9px; border-radius: 999px; color: #102924; background: #e0bd71; font: 700 8px/1 "IBM Plex Mono", monospace; }
  .mobile-pathway > p { margin: 27px 0 8px; color: #e0bd71; font: 600 8px/1 "IBM Plex Mono", monospace; text-transform: uppercase; }
  .mobile-pathway h3 { margin: 0; font: 650 clamp(3.2rem, 16vw, 5.2rem)/.84 "IBM Plex Sans Condensed", sans-serif; }
  .mobile-pathway > strong { margin-top: 13px; color: rgba(245, 240, 230, .65); font-size: .8rem; }
  .mobile-pathway ul { display: flex; justify-content: center; flex-wrap: wrap; gap: 6px; margin: 17px 0 11px; padding: 0; list-style: none; }
  .mobile-pathway li { padding: 6px 8px; border: 1px solid rgba(245, 240, 230, .15); border-radius: 7px; color: rgba(245, 240, 230, .72); font: 500 8px/1 "IBM Plex Mono", monospace; }
  .mobile-pathway > small { max-width: 390px; color: rgba(245, 240, 230, .42); line-height: 1.5; }
  .mobile-controls { position: relative; z-index: 90; width: min(360px, 100%); display: grid; grid-template-columns: 48px 1fr 48px; align-items: center; gap: 10px; margin-top: 24px; pointer-events: auto; }
  .mobile-controls button { position: relative; z-index: 1; pointer-events: auto; touch-action: manipulation; }
  .mobile-controls button:nth-child(2) { border-radius: 11px; font-size: .75rem; font-weight: 700; }
  .pathway-fallback { width: 100%; margin: 48px auto 0; }
  .pathway-fallback ul { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 420px) {
  .pathway-vault { padding-inline: 12px; }
  .pathway-fallback ul { grid-template-columns: 1fr; }
  .pathway-dossier { right: 8px; width: calc(100% - 16px); padding: 26px 18px; }
}

@media (max-width: 260px) {
  .pathway-vault { padding-top: 72px; }
  .vault-heading h2 { font-size: 2.35rem; }
  .mobile-seal { width: 140px; max-width: 100%; }
  .mobile-pathway h3 { font-size: 2.8rem; overflow-wrap: anywhere; }
  .mobile-controls { grid-template-columns: 44px minmax(0, 1fr) 44px; }
}

@media (prefers-reduced-motion: reduce) {
  .orbit-pathway,
  .orbit-pathway > span,
  .dossier-enter-active,
  .dossier-leave-active { transition: none; }
}
</style>
