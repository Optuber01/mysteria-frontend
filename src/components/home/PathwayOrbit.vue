<template>
  <section
    id="pathways"
    ref="sectionRef"
    class="pathway-vault"
    :class="[{ 'is-reduced': reducedMotion, 'is-interactive': interactionReady, 'is-low-power': lowPower }, hasActiveEntry ? `motif-${activeEntry.motif}` : 'motif-neutral']"
    :style="themeStyle"
    aria-labelledby="pathway-title"
  >
    <div class="ambient-field" aria-hidden="true"><i class="ambient-field__haze" /></div>

    <div v-if="!compactLayout && !reducedMotion" class="desktop-experience">
      <div class="sticky-scene">
        <header class="vault-heading">
          <p>PLAYABLE ROUTES TO POWER</p>
          <h2 id="pathway-title">
            Choose your path,<br><em>in orbit.</em>
          </h2>
          <span>
            Explore 22 pathways. Select a symbol to open its archive.
          </span>
        </header>

        <div class="catalog-tabs" role="tablist" aria-label="Progression type">
          <button
            v-for="option in catalogOptions"
            :id="`${option.id}-tab`"
            :key="option.id"
            type="button"
            role="tab"
            :aria-selected="activeKind === option.id"
            :aria-controls="`${option.id}-panel`"
            @mouseenter="warmCatalog(option.id)"
            @focus="warmCatalog(option.id)"
            @click="setKind(option.id)"
          >
            <span>{{ option.label }}</span><b>{{ option.count }}</b>
          </button>
        </div>

        <div
          :id="`${activeKind}-panel`"
          ref="orbitStageRef"
          class="orbit-stage"
          role="tabpanel"
          :aria-labelledby="`${activeKind}-tab`"
          :tabindex="hasActiveEntry ? 0 : -1"
          :aria-label="interactionReady
            ? `${activeKindLabel} orbit. Use the arrow keys to browse.`
            : `${activeKindLabel} are assembling as you scroll.`"
          @keydown.left.prevent="previous"
          @keydown.right.prevent="next"
          @keydown.home.prevent="snapTo(0)"
          @keydown.end.prevent="snapTo(activeCatalog.length - 1)"
          @pointerdown="startDrag"
          @pointermove="movePointer"
          @pointerup="endDrag"
          @pointercancel="endDrag"
          @pointerleave="leaveOrbit"
          @contextmenu.prevent
        >
          <template v-for="(entry, index) in activeCatalog" :key="entry.id">
          <button
            v-if="!orbitStyles[index]?.hidden"
            type="button"
            class="orbit-token"
            :class="{
              'is-active': index === shownIndex,
              'is-selected': index === selectedIndex,
              'is-behind': orbitStyles[index]?.behind,
              'is-hidden': orbitStyles[index]?.hidden,
            }"
            :style="[orbitStyles[index]?.style, {
              '--token-accent': entry.theme.accent,
              '--token-haze': entry.theme.haze,
              '--token-surface': entry.theme.surface,
              '--token-ink': entry.theme.ink,
            }]"
            :tabindex="orbitStyles[index]?.hidden ? -1 : 0"
            :aria-label="`${entry.name}. ${entry.startingSequence}. ${entry.playstyle}`"
            :aria-pressed="index === selectedIndex"
            @mouseenter="previewToken(index)"
            @mouseleave="clearTokenPreview"
            @focus="previewToken(index)"
            @blur="clearTokenPreview"
            @click.stop="selectAndOpen(index, $event)"
          >
            <span class="token-seal">
              <img :src="entry.thumbnail" alt="" width="96" height="96" :loading="index < 4 ? 'eager' : 'lazy'" :fetchpriority="index < 2 ? 'high' : 'auto'" decoding="async" @error="replaceBrokenImage">
            </span>
            <strong>{{ entry.name }}</strong><small>{{ entry.sequenceCount }} sequences</small>
          </button>
          </template>

          <Transition name="orbit-story">
            <article
              v-if="hasActiveEntry"
              class="orbit-story"
              role="button"
              tabindex="0"
              :aria-label="`Open ${activeEntry.name} archive`"
              :aria-live="interactionReady ? 'polite' : 'off'"
              @click="selectActiveAndOpen($event)"
              @keydown.enter.prevent="selectActiveAndOpen($event)"
              @keydown.space.prevent="selectActiveAndOpen($event)"
            >
              <div class="motif-stage" :data-motif="activeEntry.motif" aria-hidden="true">
                <img :src="activeStoryImage" alt="" width="220" height="220" loading="eager" fetchpriority="high" decoding="async" @error="replaceBrokenImage">
              </div>
              <h3>{{ activeEntry.name }}</h3>
              <span class="entry-kind">{{ activeEntry.sequenceCount }} sequences</span>
              <small>{{ activeEntry.tagline }}</small>
            </article>
          </Transition>

          <button
            v-if="hasActiveEntry"
            type="button"
            class="open-dossier"
            :class="{ 'is-visible': hasActiveEntry }"
            @click="selectActiveAndOpen($event)"
          >
            Inspect {{ activeEntry.name }}<span aria-hidden="true"> ↗</span>
          </button>

        </div>
      </div>
    </div>

    <div v-if="compactLayout || reducedMotion" class="mobile-experience">
      <header class="mobile-heading">
        <p>PLAYABLE ROUTES TO POWER</p>
        <h2>Choose how<br><em>you advance.</em></h2>
        <span>Swipe through live Mysterria data. Open any entry for its full Sequence archive.</span>
      </header>

      <div class="catalog-tabs catalog-tabs--mobile" role="tablist" aria-label="Progression type">
        <button
          v-for="option in catalogOptions"
          :id="`${option.id}-mobile-tab`"
          :key="option.id"
          type="button"
          role="tab"
            :aria-selected="activeKind === option.id"
            :aria-controls="`${option.id}-mobile-panel`"
            @mouseenter="warmCatalog(option.id)"
            @focus="warmCatalog(option.id)"
            @click="setKind(option.id)"
        >
          <span>{{ option.label }}</span><b>{{ option.count }}</b>
        </button>
      </div>

      <div
        :id="`${activeKind}-mobile-panel`"
        ref="mobileRailRef"
        class="mobile-rail"
        role="tabpanel"
        :aria-labelledby="`${activeKind}-mobile-tab`"
        tabindex="0"
        @scroll.passive="handleMobileScroll"
        @keydown.left.prevent="previousMobile"
        @keydown.right.prevent="nextMobile"
      >
        <article
          v-for="(entry, index) in activeCatalog"
          :key="entry.id"
          class="mobile-card"
          :class="`motif-${entry.motif}`"
          :data-mobile-index="index"
        >
          <div class="mobile-card__visual" aria-hidden="true">
            <img :src="entry.image" alt="" width="170" height="170" :loading="activeKind === 'boon' ? 'eager' : 'lazy'" decoding="async" @error="replaceBrokenImage">
            <b>{{ String(index + 1).padStart(2, '0') }}</b>
          </div>
          <p>{{ entry.sequenceCount }} sequences</p>
          <h3>{{ entry.name }}</h3>
          <button type="button" @click="selectAndOpen(index, $event)">Open archive<span aria-hidden="true"> ↗</span></button>
        </article>
      </div>

      <div class="mobile-pagination" aria-live="polite">
        <button type="button" :aria-label="`Previous ${activeKindLabel.slice(0, -1)}`" @click="previousMobile">←</button>
        <span><b>{{ String(selectedIndex + 1).padStart(2, '0') }}</b> / {{ String(activeCatalog.length).padStart(2, '0') }}</span>
        <button type="button" :aria-label="`Next ${activeKindLabel.slice(0, -1)}`" @click="nextMobile">→</button>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="dossier">
        <div v-if="detailsOpen" class="dossier-scrim" @mousedown.self="closeDetails()">
          <aside
            ref="dossierRef"
            class="pathway-dossier"
            :class="`motif-${selectedEntry.motif}`"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="`${selectedEntry.id}-dossier-title`"
            tabindex="-1"
            @keydown="trapDossierFocus"
            @keydown.esc.stop.prevent="closeDetails()"
          >
            <button ref="dossierCloseRef" class="dossier-close" type="button" :aria-label="`Close ${selectedEntry.name} details`" @click="closeDetails()">×</button>
            <div class="dossier-symbol" aria-hidden="true">
              <img :src="selectedEntry.image" alt="" width="150" height="150" decoding="async" @error="replaceBrokenImage">
            </div>
            <p>{{ selectedEntry.kind === 'boon' ? 'BOON DOSSIER' : 'PATHWAY DOSSIER' }}</p>
            <h3 :id="`${selectedEntry.id}-dossier-title`">{{ selectedEntry.name }}</h3>
            <strong>{{ selectedEntry.startingSequence }}</strong>
            <span>{{ selectedEntry.summary }}</span>
            <dl>
              <div><dt>Early abilities</dt><dd>{{ selectedEntry.strengths.join(' · ') }}</dd></div>
              <div><dt>Archive</dt><dd>{{ selectedEntry.sequenceCount }} Sequences · {{ selectedEntry.abilityCount }} abilities</dd></div>
            </dl>
            <RouterLink :to="selectedEntry.route" @click="closeDetails(false)">
              Learn more in the full archive<span aria-hidden="true"> ↗</span>
            </RouterLink>
          </aside>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch, type CSSProperties } from 'vue';
import { boonPathways, standardPathways, type HomePathway, type ProgressionKind } from '@/data/pathways';
import { useReducedMotion } from '@/composables/useReducedMotion';

const emit = defineEmits<{ selected: [pathway: HomePathway] }>();
const sectionRef = ref<HTMLElement | null>(null);
const orbitStageRef = ref<HTMLElement | null>(null);
const mobileRailRef = ref<HTMLElement | null>(null);
const dossierRef = ref<HTMLElement | null>(null);
const dossierCloseRef = ref<HTMLButtonElement | null>(null);
const reducedMotion = useReducedMotion();
const activeKind = ref<ProgressionKind>('pathway');
const scrollProgress = ref(0);
const selectedIndex = ref(0);
const hoveredIndex = ref<number | null>(null);
const rotation = ref(0);
const targetRotation = ref(0);
const pointerOffset = ref(0);
const velocity = ref(0);
const dragging = ref(false);
const inView = ref(false);
const detailsOpen = ref(false);
const compactLayout = ref(false);
const lowPower = ref(false);

let animationFrame = 0;
let scrollFrame = 0;
let lastPointerX = 0;
let lastPointerTime = 0;
let mobileScrollTimer = 0;
let dossierTrigger: HTMLElement | null = null;
let previousBodyOverflow = '';
let previousBodyPaddingRight = '';
let sectionObserver: IntersectionObserver | null = null;
let compactMedia: MediaQueryList | null = null;
let scrollTravel = 1;
let catalogWarmTimer = 0;
let openingSymbolWarmTimer = 0;
const warmedCatalogs = new Set<ProgressionKind>();
const warmedNatives = new Set<string>();
const catalogImageWarmers: HTMLImageElement[] = [];
let openingSymbolsWarmed = false;
let orbitStateBeforeDossier: { rotation: number; targetRotation: number; velocity: number; pointerOffset: number } | null = null;

const activeCatalog = computed(() => activeKind.value === 'pathway' ? standardPathways : boonPathways);
const activeKindLabel = computed(() => activeKind.value === 'pathway' ? 'Pathways' : 'Boons');
const catalogOptions = computed(() => [
  { id: 'pathway' as const, label: 'Pathways', count: standardPathways.length },
  { id: 'boon' as const, label: 'Boons', count: boonPathways.length },
]);
// The assembly begins while the section is approaching the viewport, then
// accelerates through the sticky scene and leaves a short completed orbit.
const assemblyProgress = computed(() => clamp(Math.pow(scrollProgress.value, 1.3) / .92, 0, 1));
const phase = computed<'entry' | 'assembly' | 'orbit'>(() => {
  if (reducedMotion.value || compactLayout.value) return 'orbit';
  if (scrollProgress.value < .08) return 'entry';
  if (assemblyProgress.value < 1) return 'assembly';
  return 'orbit';
});
const interactionReady = computed(() => reducedMotion.value || compactLayout.value || phase.value === 'orbit');
const assemblyCursor = computed(() => assemblyProgress.value * activeCatalog.value.length - 1);
const assemblyIndex = computed(() => clamp(Math.floor(assemblyCursor.value), 0, activeCatalog.value.length - 1));
const shownIndex = computed(() => hoveredIndex.value ?? (interactionReady.value ? selectedIndex.value : assemblyIndex.value));
const activeEntry = computed(() => activeCatalog.value[shownIndex.value] ?? activeCatalog.value[0]);
const selectedEntry = computed(() => activeCatalog.value[selectedIndex.value] ?? activeCatalog.value[0]);
const activeStoryImage = computed(() => hoveredIndex.value !== null || !interactionReady.value ? activeEntry.value.thumbnail : activeEntry.value.image);
const hasActiveEntry = computed(() => reducedMotion.value || compactLayout.value || assemblyProgress.value * activeCatalog.value.length >= 1);
const lightTheme = { accent: '#7458E8', accent2: '#D9B45A', ink: '#221C14', surface: '#FFFFFF', haze: '#EFECFA' };
const themeStyle = computed(() => ({
  '--path-accent': lightTheme.accent,
  '--path-accent-2': lightTheme.accent2,
  '--path-ink': lightTheme.ink,
  '--path-surface': lightTheme.surface,
  '--path-haze': lightTheme.haze,
}));

type OrbitVisual = { hidden: boolean; behind: boolean; style: CSSProperties };
const orbitStyles = computed<OrbitVisual[]>(() => activeCatalog.value.map((_, index) => {
  if (phase.value === 'entry' || phase.value === 'assembly') return assemblyStyle(index);
  const delta = signedWrap(index - (rotation.value + pointerOffset.value), activeCatalog.value.length);
  const angle = -Math.PI / 2 - delta * ((Math.PI * 2) / activeCatalog.value.length);
  const x = 50 + Math.cos(angle) * 42;
  const y = 50 + Math.sin(angle) * 34;
  const depth = (Math.sin(angle) + 1) / 2;
  return {
    hidden: false,
    behind: depth < .42,
    style: {
      left: `${x}%`, top: `${y}%`, opacity: String(.7 + depth * .3),
      zIndex: String(18 + Math.round(depth * 46)),
      transform: `translate(-50%, -50%) scale(${.74 + depth * .22})`,
      pointerEvents: 'auto',
    },
  };
}));

function assemblyStyle(index: number): OrbitVisual {
  const count = activeCatalog.value.length;
  const visibleCount = assemblyProgress.value * count;
  const entryProgress = clamp(visibleCount - index, 0, 1);
  if (entryProgress <= 0) {
    return { hidden: true, behind: true, style: { left: '-16%', top: '70%', opacity: '0', pointerEvents: 'none' } };
  }
  const t = easeOut(entryProgress);
  // Each new route arrives beside the top of the orbit and pushes every route
  // already present around the ring. This converges exactly to the completed
  // orbit order, avoiding a final-frame remap when the 22nd seal arrives.
  const orbitSlot = visibleCount - index - rotation.value;
  const angle = -Math.PI / 2 + orbitSlot * ((Math.PI * 2) / count);
  const targetX = 50 + Math.cos(angle) * 42;
  const targetY = 50 + Math.sin(angle) * 34;
  const depth = (Math.sin(angle) + 1) / 2;
  return {
    hidden: false, behind: depth < .42,
    style: {
      left: `${roundPosition(mix(-14, targetX, t))}%`,
      top: `${roundPosition(mix(50, targetY, t))}%`,
      opacity: String(t * (.7 + depth * .3)),
      zIndex: String(18 + Math.round(depth * 46)),
      transform: `translate(-50%, -50%) scale(${(.5 + depth * .26) + t * .2})`,
      pointerEvents: entryProgress > .94 ? 'auto' : 'none',
    },
  };
}

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function mix(from: number, to: number, amount: number) { return from + (to - from) * amount; }
function roundPosition(value: number) { return Math.round(value * 10) / 10; }
function easeOut(value: number) { return 1 - Math.pow(1 - clamp(value, 0, 1), 3); }
function normalizeIndex(value: number, length = activeCatalog.value.length) { return ((value % length) + length) % length; }
function signedWrap(value: number, length: number) { return ((value + length / 2) % length + length) % length - length / 2; }

function measureScroll() {
  scrollFrame = 0;
  if (!sectionRef.value || (!inView.value && !reducedMotion.value)) return;
  const rect = sectionRef.value.getBoundingClientRect();
  // Start the first route while the preceding section is still on screen.
  // Include this lead-in in the range so the final orbit always completes
  // before the sticky scene releases.
  const entryLead = window.innerHeight * .65;
  const nextProgress = reducedMotion.value
    ? 1
    : clamp((entryLead - rect.top) / (scrollTravel + entryLead), 0, 1);
  // Avoid invalidating all 22 token styles for sub-pixel scroll deltas.
  if (Math.abs(nextProgress - scrollProgress.value) >= .001 || nextProgress === 0 || nextProgress === 1) {
    scrollProgress.value = nextProgress;
  }
}

function refreshScrollTravel() {
  if (!sectionRef.value) return;
  scrollTravel = Math.max(1, sectionRef.value.offsetHeight - window.innerHeight);
}

function scheduleScrollMeasure() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(measureScroll);
}

function animateOrbit() {
  const delta = targetRotation.value - rotation.value;
  velocity.value = velocity.value * .78 + delta * .095;
  rotation.value += velocity.value;
  if (Math.abs(delta) < .002 && Math.abs(velocity.value) < .002) {
    rotation.value = targetRotation.value;
    velocity.value = 0;
    animationFrame = 0;
    return;
  }
  animationFrame = requestAnimationFrame(animateOrbit);
}

function startOrbitAnimation() {
  if (reducedMotion.value) {
    rotation.value = targetRotation.value;
    return;
  }
  if (!animationFrame && inView.value) animationFrame = requestAnimationFrame(animateOrbit);
}

function setKind(kind: ProgressionKind) {
  if (kind === activeKind.value) return;
  warmCatalog(kind);
  activeKind.value = kind;
  selectedIndex.value = 0;
  hoveredIndex.value = null;
  rotation.value = 0;
  targetRotation.value = 0;
  pointerOffset.value = 0;
  requestAnimationFrame(() => mobileRailRef.value?.scrollTo({ left: 0, behavior: reducedMotion.value ? 'auto' : 'smooth' }));
  const entry = activeCatalog.value[0];
  if (entry) emit('selected', entry);
}

function snapTo(index: number, announce = true) {
  if (!activeCatalog.value.length) return;
  const normalized = normalizeIndex(index);
  const current = rotation.value;
  const currentNormalized = normalizeIndex(Math.round(current));
  const delta = signedWrap(normalized - currentNormalized, activeCatalog.value.length);
  targetRotation.value = Math.round(current) + delta;
  selectedIndex.value = normalized;
  pointerOffset.value = 0;
  if (announce) emit('selected', activeCatalog.value[normalized]);
  startOrbitAnimation();
}

function previous() { if (hasActiveEntry.value) snapTo(selectedIndex.value - 1); }
function next() { if (hasActiveEntry.value) snapTo(selectedIndex.value + 1); }

function selectAndOpen(index: number, event: Event) {
  hoveredIndex.value = null;
  selectedIndex.value = index;
  // The assembling layout is driven only by scroll. Rotating it while a
  // dossier is open used to change the order of the incoming seals on return.
  if (phase.value === 'orbit') snapTo(index);
  void openDetails(event);
}

function warmCatalog(kind: ProgressionKind) {
  if (kind === activeKind.value) return;
  if (warmedCatalogs.has(kind)) return;
  warmedCatalogs.add(kind);
  catalogWarmTimer = window.setTimeout(() => {
    const catalog = kind === 'pathway' ? standardPathways : boonPathways;
    catalog.forEach((entry) => {
      const image = new Image();
      image.decoding = 'async';
      image.src = entry.thumbnail;
      catalogImageWarmers.push(image);
    });
  }, 180);
}

function warmNative(index: number) {
  const entry = activeCatalog.value[normalizeIndex(index)];
  if (!entry || warmedNatives.has(entry.id)) return;
  warmedNatives.add(entry.id);
  const image = new Image();
  image.decoding = 'async';
  image.src = entry.image;
  catalogImageWarmers.push(image);
}

function warmOpeningSymbols() {
  if (openingSymbolsWarmed) return;
  openingSymbolsWarmed = true;
  const openingEntries = standardPathways.slice(0, lowPower.value ? 3 : 8);
  openingSymbolWarmTimer = window.setTimeout(() => {
    openingEntries.forEach((entry) => {
      const image = new Image();
      image.decoding = 'async';
      image.src = entry.thumbnail;
      catalogImageWarmers.push(image);
    });
    const focusedImage = new Image();
    focusedImage.decoding = 'async';
    focusedImage.src = standardPathways[0].image;
    catalogImageWarmers.push(focusedImage);
  }, 0);
}

function selectActiveAndOpen(event: Event) {
  selectAndOpen(shownIndex.value, event);
}

function previewToken(index: number) {
  hoveredIndex.value = index;
  warmNative(index);
}

function clearTokenPreview() {
  hoveredIndex.value = null;
}

function startDrag(event: PointerEvent) {
  if (!hasActiveEntry.value || ![0, 2].includes(event.button) || (event.target as HTMLElement).closest('button, a, [role="button"]')) return;
  dragging.value = true;
  pointerOffset.value = 0;
  lastPointerX = event.clientX;
  lastPointerTime = performance.now();
  orbitStageRef.value?.setPointerCapture(event.pointerId);
}

function movePointer(event: PointerEvent) {
  if (!hasActiveEntry.value || event.pointerType === 'touch') return;
  if (dragging.value) {
    const now = performance.now();
    const movement = event.clientX - lastPointerX;
    // Move the orbit with the pointer so the symbol field feels pulled,
    // rather than pushed away from the drag direction.
    const delta = movement / 92;
    rotation.value += delta;
    targetRotation.value = rotation.value;
    velocity.value = delta / Math.max(8, now - lastPointerTime) * 16;
    lastPointerX = event.clientX;
    lastPointerTime = now;
    return;
  }
  if (!orbitStageRef.value || reducedMotion.value) return;
  const rect = orbitStageRef.value.getBoundingClientRect();
  pointerOffset.value = clamp(((event.clientX - rect.left) / rect.width - .5) * .7, -.35, .35);
}

function endDrag(event: PointerEvent) {
  if (!dragging.value) return;
  dragging.value = false;
  if (orbitStageRef.value?.hasPointerCapture(event.pointerId)) orbitStageRef.value.releasePointerCapture(event.pointerId);
  rotation.value += velocity.value * 8;
  const index = normalizeIndex(Math.round(rotation.value));
  targetRotation.value = Math.round(rotation.value);
  selectedIndex.value = index;
  emit('selected', activeCatalog.value[index]);
  startOrbitAnimation();
}

function leaveOrbit() {
  if (dragging.value) return;
  pointerOffset.value = 0;
}

function handleMobileScroll() {
  window.clearTimeout(mobileScrollTimer);
  mobileScrollTimer = window.setTimeout(() => {
    const rail = mobileRailRef.value;
    if (!rail) return;
    const cards = [...rail.querySelectorAll<HTMLElement>('[data-mobile-index]')];
    const center = rail.scrollLeft + rail.clientWidth / 2;
    let nearest = 0;
    let distance = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const nextDistance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
      if (nextDistance < distance) { distance = nextDistance; nearest = index; }
    });
    if (nearest !== selectedIndex.value) {
      selectedIndex.value = nearest;
      rotation.value = nearest;
      targetRotation.value = nearest;
      emit('selected', activeCatalog.value[nearest]);
    }
  }, 90);
}

function scrollMobileTo(index: number) {
  const normalized = normalizeIndex(index);
  const rail = mobileRailRef.value;
  const card = rail?.querySelector<HTMLElement>(`[data-mobile-index="${normalized}"]`);
  selectedIndex.value = normalized;
  if (!rail || !card) return;
  const left = Math.max(0, card.offsetLeft - (rail.clientWidth - card.offsetWidth) / 2);
  rail.scrollTo({ left, behavior: reducedMotion.value ? 'auto' : 'smooth' });
}
function previousMobile() { scrollMobileTo(selectedIndex.value - 1); }
function nextMobile() { scrollMobileTo(selectedIndex.value + 1); }

async function openDetails(event?: Event) {
  orbitStateBeforeDossier = {
    rotation: rotation.value,
    targetRotation: targetRotation.value,
    velocity: velocity.value,
    pointerOffset: pointerOffset.value,
  };
  if (animationFrame) { cancelAnimationFrame(animationFrame); animationFrame = 0; }
  dossierTrigger = event?.currentTarget as HTMLElement | null;
  previousBodyOverflow = document.body.style.overflow;
  previousBodyPaddingRight = document.body.style.paddingRight;
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
  document.body.style.overflow = 'hidden';
  document.querySelector<HTMLElement>('#app')?.setAttribute('inert', '');
  detailsOpen.value = true;
  await nextTick();
  dossierCloseRef.value?.focus();
}

async function closeDetails(restoreFocus = true) {
  if (!detailsOpen.value) return;
  detailsOpen.value = false;
  document.body.style.overflow = previousBodyOverflow;
  document.body.style.paddingRight = previousBodyPaddingRight;
  document.querySelector<HTMLElement>('#app')?.removeAttribute('inert');
  if (orbitStateBeforeDossier) {
    rotation.value = orbitStateBeforeDossier.rotation;
    targetRotation.value = orbitStateBeforeDossier.targetRotation;
    velocity.value = orbitStateBeforeDossier.velocity;
    pointerOffset.value = orbitStateBeforeDossier.pointerOffset;
    orbitStateBeforeDossier = null;
    startOrbitAnimation();
  }
  await nextTick();
  if (restoreFocus && dossierTrigger?.isConnected) dossierTrigger.focus();
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

const fallbackImage = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><circle cx="48" cy="48" r="39" fill="none" stroke="#c69b52" stroke-width="2"/><path d="M48 20 58 39l20 9-20 9-10 19-10-19-20-9 20-9Z" fill="#c69b52" opacity=".8"/></svg>')}`;
function replaceBrokenImage(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  if (image.src !== fallbackImage) image.src = fallbackImage;
}

function syncCompactLayout(event?: MediaQueryListEvent) {
  compactLayout.value = event?.matches ?? compactMedia?.matches ?? false;
  refreshScrollTravel();
}

watch(interactionReady, (ready) => {
  if (!ready) return;
  const index = assemblyIndex.value;
  selectedIndex.value = index;
  rotation.value = index;
  targetRotation.value = index;
});

watch([selectedIndex, activeKind], () => {
  warmNative(selectedIndex.value);
  warmNative(selectedIndex.value + 1);
});

onMounted(() => {
  const browserHints = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  lowPower.value = Boolean(
    browserHints.connection?.saveData
    || (browserHints.deviceMemory !== undefined && browserHints.deviceMemory <= 4)
    || navigator.hardwareConcurrency <= 4,
  );
  compactMedia = window.matchMedia('(max-width: 1050px), (max-height: 720px)');
  syncCompactLayout();
  compactMedia.addEventListener('change', syncCompactLayout);
  sectionObserver = new IntersectionObserver(([entry]) => {
    inView.value = entry.isIntersecting;
    if (entry.isIntersecting) {
      warmOpeningSymbols();
      scheduleScrollMeasure();
    }
    else if (animationFrame) { cancelAnimationFrame(animationFrame); animationFrame = 0; }
    if (!entry.isIntersecting && detailsOpen.value) void closeDetails(false);
  }, { rootMargin: '60% 0px' });
  if (sectionRef.value) sectionObserver.observe(sectionRef.value);
  window.addEventListener('scroll', scheduleScrollMeasure, { passive: true });
  window.addEventListener('resize', refreshScrollTravel, { passive: true });
  window.addEventListener('resize', scheduleScrollMeasure, { passive: true });
  scheduleScrollMeasure();
});

onUnmounted(() => {
  compactMedia?.removeEventListener('change', syncCompactLayout);
  sectionObserver?.disconnect();
  window.removeEventListener('scroll', scheduleScrollMeasure);
  window.removeEventListener('resize', refreshScrollTravel);
  window.removeEventListener('resize', scheduleScrollMeasure);
  if (animationFrame) cancelAnimationFrame(animationFrame);
  if (scrollFrame) cancelAnimationFrame(scrollFrame);
  window.clearTimeout(mobileScrollTimer);
  window.clearTimeout(catalogWarmTimer);
  window.clearTimeout(openingSymbolWarmTimer);
  document.body.style.overflow = previousBodyOverflow;
  document.body.style.paddingRight = previousBodyPaddingRight;
  document.querySelector<HTMLElement>('#app')?.removeAttribute('inert');
});
</script>

<style scoped>
.pathway-vault {
  --path-accent: #7458E8;
  --path-accent-2: #D9B45A;
  --path-ink: #221C14;
  --path-surface: #FFFFFF;
  --path-haze: #EFECFA;
  position: relative;
  min-height: 210svh;
  color: var(--path-ink);
  background-color: transparent;
}

.ambient-field { position: absolute; inset: 0; overflow: clip; pointer-events: none; }
.ambient-field::before {
  content: none; position: absolute; inset: 0;
  opacity: .13;
  background-image: linear-gradient(rgba(34,28,20,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(34,28,20,.055) 1px, transparent 1px);
  background-size: 72px 72px;
  mask-image: linear-gradient(transparent, #000 12%, #000 88%, transparent);
}
.ambient-field__haze {
  position: sticky; top: 0; display: block; height: 100svh;
  background:
    radial-gradient(circle at 50% 48%, color-mix(in srgb, var(--path-haze) 48%, transparent), transparent 35%),
    radial-gradient(circle at 15% 70%, color-mix(in srgb, var(--path-accent-2) 22%, transparent), transparent 30%),
    radial-gradient(circle at 88% 25%, color-mix(in srgb, var(--path-accent) 15%, transparent), transparent 26%);
  transition: background .36s ease-out;
}
.is-low-power .ambient-field::before { display: none; }
.is-low-power .ambient-field__haze { background: radial-gradient(circle at 50% 48%, color-mix(in srgb, var(--path-haze) 38%, transparent), transparent 42%); }

.desktop-experience { height: 210svh; }
.sticky-scene { position: sticky; top: 0; height: 100svh; min-height: 700px; overflow: clip; }
.vault-heading { position: absolute; z-index: 90; top: clamp(76px, 9vh, 112px); left: clamp(24px, 5vw, 78px); width: min(470px, 34vw); pointer-events: none; }
.vault-heading > p, .mobile-heading > p { margin: 0 0 14px; color: var(--path-accent); font: 800 .63rem/1 Manrope, sans-serif; letter-spacing: .18em; }
.vault-heading h2, .mobile-heading h2 { margin: 0; font: 700 clamp(2.7rem, 5vw, 5.3rem)/.92 var(--font-display, "IBM Plex Sans Condensed", sans-serif); letter-spacing: -.028em; text-wrap: balance; overflow-wrap: anywhere; }
.vault-heading h2 em, .mobile-heading h2 em { color: var(--path-accent); font-style: normal; }
.vault-heading > span { display: block; max-width: 350px; margin-top: 22px; color: color-mix(in srgb, var(--path-ink) 72%, transparent); font-size: .8rem; font-weight: 500; line-height: 1.7; letter-spacing: .005em; }

.catalog-tabs { position: absolute; z-index: 100; top: clamp(78px, 9vh, 112px); right: clamp(24px, 5vw, 78px); display: flex; min-height: 48px; padding: 4px; border: 1px solid color-mix(in srgb, var(--path-ink) 18%, transparent); border-radius: 999px; background: color-mix(in srgb, var(--path-surface) 82%, transparent); backdrop-filter: blur(16px); }
.catalog-tabs button { min-width: 124px; min-height: 44px; display: flex; align-items: center; justify-content: center; gap: 10px; border: 0; border-radius: 999px; color: color-mix(in srgb, var(--path-ink) 72%, transparent); background: transparent; cursor: pointer; font: 700 .7rem/1 Manrope, sans-serif; }
.catalog-tabs button b { min-width: 23px; height: 23px; display: grid; place-items: center; border-radius: 99px; color: currentColor; background: color-mix(in srgb, var(--path-ink) 9%, transparent); font: 700 .57rem/1 Manrope, sans-serif; }
.catalog-tabs button[aria-selected="true"] { color: #fff; background: var(--path-accent); }

.orbit-stage { position: absolute; z-index: 10; inset: 0; outline: 0; cursor: default; touch-action: pan-y; user-select: none; contain: layout paint; }
.orbit-stage:focus-visible { outline: 3px solid var(--primary); outline-offset: -10px; }
.orbit-token { position: absolute; width: 108px; min-height: 108px; display: grid; place-items: center; align-content: center; gap: 3px; padding: 4px; border: 0; color: var(--ink-muted); background: transparent; cursor: pointer; contain: layout paint; }
.pathway-vault:not(.is-interactive) .orbit-token { transition: left .06s linear, top .06s linear, transform .08s cubic-bezier(.22, 1, .36, 1), opacity .06s linear; }
.orbit-token.is-hidden { visibility: hidden; }
.orbit-token:hover, .orbit-token:focus-visible, .orbit-token.is-active { z-index: 75 !important; color: var(--path-ink); filter: none; }
.orbit-token:focus-visible { outline: 3px solid var(--primary); outline-offset: 2px; border-radius: 18px; }
.token-seal { position: relative; width: 66px; height: 66px; display: grid; place-items: center; border: 1px solid var(--hairline); border-radius: 50%; background: #FFFFFF; box-shadow: 0 12px 26px rgba(34,28,20,.14); transition: transform .14s ease-out, border-color .12s linear, background .12s linear; }
.orbit-token:hover .token-seal, .orbit-token:focus-visible .token-seal, .orbit-token.is-active .token-seal { border-color: var(--primary); background: #FFFFFF; transform: scale(1.14); }
.orbit-token.is-selected { z-index: 76 !important; }
.token-seal img { width: 57px; height: 57px; object-fit: contain; filter: brightness(1.1) drop-shadow(0 8px 12px rgba(34,28,20,.22)) drop-shadow(0 0 6px rgba(116,88,232,.28)); }
.orbit-token > strong { max-width: 108px; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; color: var(--ink-muted); font-size: calc(.64rem + 1px); font-weight: 700; line-height: 1.3; }
.orbit-token:hover > strong, .orbit-token:focus-visible > strong, .orbit-token.is-active > strong { color: var(--path-ink); }
.orbit-token > small { color: color-mix(in srgb, var(--token-ink, var(--path-ink)) 68%, transparent); font: 800 .46rem/1 Manrope, sans-serif; letter-spacing: .06em; text-transform: uppercase; }
.is-low-power .token-seal { box-shadow: none; }
.is-low-power .token-seal img, .is-low-power .motif-stage img { filter: none; }
.is-low-power .motif-stage::before { box-shadow: none; }

.orbit-story { position: absolute; z-index: 42; left: 50%; top: 47%; width: min(540px, 44vw); padding: 0; border: 0; color: inherit; background: transparent; transform: translate(-50%, -50%); text-align: center; cursor: pointer; }
.orbit-story:focus-visible { outline: 3px solid var(--primary); outline-offset: 10px; border-radius: 16px; }
.orbit-story-enter-active { transition: opacity .34s ease-out, transform .52s cubic-bezier(.22, 1, .36, 1); }
.orbit-story-enter-from { opacity: 0; transform: translate(-50%, -34%) scale(.92); }
.orbit-story-leave-active { transition: opacity .24s ease-in, transform .34s cubic-bezier(.4, 0, 1, 1); }
.orbit-story-leave-to { opacity: 0; transform: translate(-50%, -58%) scale(.96); }
.motif-stage { position: relative; width: clamp(132px, 13vw, 184px); aspect-ratio: 1; display: grid; place-items: center; margin: 0 auto 13px; }
.motif-stage::before { content: ""; position: absolute; inset: 4%; border: 1px solid color-mix(in srgb, var(--path-accent) 52%, transparent); border-radius: 50%; box-shadow: 0 0 60px color-mix(in srgb, var(--path-haze) 46%, transparent); }
.motif-stage img { position: relative; z-index: 4; width: 72%; height: 72%; object-fit: contain; filter: drop-shadow(0 18px 22px rgba(34,28,20,.24)); transition: transform .16s ease-out; }
.orbit-story h3 { margin: 0; max-width: 100%; font: 700 clamp(2.15rem, 3.35vw, 3.8rem)/.98 var(--font-display, "IBM Plex Sans Condensed", sans-serif); letter-spacing: -.028em; overflow-wrap: anywhere; }
.entry-kind { display: block; margin-top: 9px; color: color-mix(in srgb, var(--path-ink) 76%, transparent); font: 800 .56rem/1 Manrope, sans-serif; letter-spacing: .13em; text-transform: uppercase; }
.orbit-story > small { display: block; max-width: 470px; margin: 12px auto 0; color: color-mix(in srgb, var(--path-ink) 74%, transparent); font-size: .72rem; font-weight: 500; line-height: 1.45; letter-spacing: .005em; overflow-wrap: anywhere; }

.assembly-readout { position: absolute; z-index: 80; left: clamp(24px, 5vw, 78px); bottom: clamp(38px, 6vh, 70px); width: min(300px, 25vw); display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; color: color-mix(in srgb, var(--path-ink) 72%, transparent); font: 800 .52rem/1 Manrope, sans-serif; letter-spacing: .1em; }
.assembly-readout > i { height: 1px; overflow: hidden; background: color-mix(in srgb, var(--path-ink) 15%, transparent); }
.assembly-readout > i b { display: block; width: 100%; height: 100%; transform-origin: left; background: var(--path-accent); transition: transform .12s linear; }
.assembly-readout strong { color: var(--path-accent); }
.orbit-controls { position: absolute; z-index: 86; left: clamp(24px, 5vw, 78px); bottom: clamp(88px, 12vh, 132px); display: grid; grid-template-columns: 48px 74px 48px; align-items: center; gap: 8px; opacity: 0; transform: translateY(15px); pointer-events: none; transition: opacity .55s, transform .55s cubic-bezier(.22,1,.36,1); }
.orbit-controls.is-visible, .open-dossier.is-visible, .interaction-hint.is-visible { opacity: 1; transform: none; pointer-events: auto; }
.orbit-controls button, .mobile-pagination button { width: 48px; height: 48px; border: 1px solid color-mix(in srgb, var(--path-ink) 25%, transparent); border-radius: 50%; color: var(--path-ink); background: color-mix(in srgb, var(--path-surface) 76%, transparent); cursor: pointer; }
.orbit-controls button:hover, .mobile-pagination button:hover { border-color: var(--primary); color: #fff; background: var(--path-accent); }
.orbit-controls span, .mobile-pagination span { font: 600 .58rem/1 Manrope, sans-serif; text-align: center; }
.orbit-controls span b, .mobile-pagination span b { color: var(--path-accent); font-size: .85rem; }
.open-dossier { position: absolute; z-index: 86; right: clamp(24px, 5vw, 78px); bottom: clamp(38px, 6vh, 70px); min-height: 48px; padding: 0 19px; border: 1px solid color-mix(in srgb, var(--path-ink) 22%, transparent); border-radius: 999px; color: var(--path-ink); background: color-mix(in srgb, var(--path-surface) 76%, transparent); cursor: pointer; opacity: 0; transform: translateY(15px); pointer-events: none; transition: opacity .55s, transform .55s cubic-bezier(.22,1,.36,1), background .25s; font: 750 .72rem/1 Manrope, sans-serif; letter-spacing: .01em; white-space: nowrap; }
.open-dossier:hover { color: #fff; background: var(--path-accent); }
.interaction-hint { position: absolute; z-index: 80; right: clamp(24px, 5vw, 78px); bottom: clamp(101px, 13vh, 144px); margin: 0; color: color-mix(in srgb, var(--path-ink) 70%, transparent); font: 550 .5rem/1 Manrope, sans-serif; letter-spacing: .1em; opacity: 0; transform: translateY(12px); transition: opacity .55s, transform .55s; }
.scroll-cue { position: absolute; z-index: 82; left: 50%; bottom: 22px; display: grid; justify-items: center; gap: 8px; transform: translateX(-50%); color: color-mix(in srgb, var(--path-ink) 72%, transparent); font: 600 .48rem/1 Manrope, sans-serif; letter-spacing: .13em; transition: opacity .4s; }
.scroll-cue i { width: 1px; height: 24px; background: linear-gradient(var(--path-accent), transparent); }
.scroll-cue.is-complete { opacity: .35; }

/* One motif system, many distinct visual grammars. The symbol and label remain primary. */
.motif-chain .motif-stage::after, .motif-chain .mobile-card__visual > i { border-radius: 999px; transform: rotate(38deg) scale(.66, 1.2); }
.motif-eclipse .motif-stage::after, .motif-moon .motif-stage::after { inset: 9% 25% 9% 3%; border-radius: 50%; border-style: solid; box-shadow: 24px 0 0 -3px var(--path-surface); transform: none; }
.motif-bone .motif-stage::after, .motif-sword .motif-stage::after, .motif-blade .motif-stage::after { inset: 4% 47%; border-radius: 999px; transform: rotate(42deg); border-style: solid; }
.motif-door .motif-stage::after, .motif-pages .motif-stage::after, .motif-canvas .motif-stage::after { inset: 7% 24%; border-radius: 50% 50% 4% 4%; transform: none; border-style: solid; }
.motif-crown .motif-stage::after, .motif-sun .motif-stage::after, .motif-star .motif-stage::after { inset: 2%; border-radius: 4%; transform: rotate(45deg) scale(.62); border-style: solid; }
.motif-glitch .motif-stage::after, .motif-fracture .motif-stage::after { inset: 13% 4%; border-radius: 0; transform: skew(-22deg) rotate(-12deg); }
.motif-cards .motif-stage::after, .motif-runes .motif-stage::after, .motif-sigil .motif-stage::after { inset: 9% 28%; border-radius: 8px; transform: rotate(27deg); border-style: solid; }
.motif-wheel .motif-stage::after, .motif-gear .motif-stage::after, .motif-clock .motif-stage::after, .motif-ring .motif-stage::after { inset: 8%; border-radius: 50%; transform: none; border: 7px double color-mix(in srgb, var(--path-accent) 45%, transparent); }
.motif-cross .motif-stage::after, .motif-scales .motif-stage::after { inset: 10% 48%; border-radius: 0; transform: none; border-style: solid; }
.motif-vine .motif-stage::after, .motif-plague .motif-stage::after { inset: 4% 35% 4% 15%; border-radius: 60% 10% 60% 10%; transform: rotate(32deg); border-style: solid; }
.motif-flame .motif-stage::after, .motif-maw .motif-stage::after { inset: 7% 28% 12%; border-radius: 70% 25% 65% 35%; transform: rotate(45deg); border-style: solid; }
.motif-storm .motif-stage::after, .motif-mist .motif-stage::after { inset: 34% -3%; border-radius: 50%; transform: skew(-18deg); border-style: solid; }
.motif-eye .motif-stage::after { inset: 24% 3%; border-radius: 70% 10% 70% 10%; transform: rotate(45deg); border-style: solid; }
.motif-coin .motif-stage::after { inset: 11%; border-radius: 50%; transform: rotate(28deg); border: 5px double color-mix(in srgb, var(--path-accent) 48%, transparent); }

.mobile-experience { display: none; }
.catalog-fallback { position: relative; z-index: 5; display: block; width: min(800px, calc(100% - 40px)); margin: 70px auto 0; }

:global(.dossier-scrim) { position: fixed; z-index: 2000; inset: 0; overflow: hidden; isolation: isolate; background: rgba(34, 28, 20, .32); backdrop-filter: blur(8px); }
:global(.pathway-dossier) { --path-accent: #7458E8; position: fixed; top: clamp(12px, 3vw, 38px); right: clamp(12px, 3vw, 38px); bottom: clamp(12px, 3vw, 38px); width: min(490px, calc(100vw - 24px)); box-sizing: border-box; overflow: auto; overscroll-behavior: contain; padding: clamp(28px, 5vw, 58px); border: 1px solid var(--hairline); border-radius: 28px; color: #221C14; background: #FFFFFF; box-shadow: 0 35px 100px rgba(34,28,20,.22); outline: 0; will-change: transform; }
:global(.dossier-close) { position: absolute; z-index: 3; top: 18px; right: 18px; width: 48px; height: 48px; border: 1px solid var(--hairline); border-radius: 50%; color: #221C14; background: transparent; cursor: pointer; font-size: 1.5rem; }
:global(.dossier-symbol) { position: relative; width: 180px; aspect-ratio: 1; display: grid; place-items: center; margin-bottom: 40px; border: 1px solid color-mix(in srgb, var(--path-accent) 52%, transparent); border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--path-accent) 22%, transparent), transparent 68%); }
:global(.dossier-symbol img) { width: 78%; height: 78%; object-fit: contain; }
:global(.pathway-dossier > p) { margin: 0 0 12px; color: var(--path-accent); font: 800 .59rem/1 Manrope, sans-serif; letter-spacing: .17em; }
:global(.pathway-dossier h3) { margin: 0; font: 800 clamp(3.7rem, 7vw, 6.6rem)/.79 Manrope, sans-serif; letter-spacing: -.055em; }
:global(.pathway-dossier > strong) { display: block; margin-top: 18px; color: var(--path-accent); font: 700 .67rem/1 Manrope, sans-serif; }
:global(.pathway-dossier > span) { display: block; margin-top: 15px; color: var(--ink-muted); font-size: .78rem; font-weight: 500; line-height: 1.6; }
:global(.pathway-dossier dl) { margin: 35px 0; border-top: 1px solid var(--hairline); }
:global(.pathway-dossier dl div) { display: grid; grid-template-columns: 105px 1fr; gap: 15px; padding: 16px 0; border-bottom: 1px solid var(--hairline); }
:global(.pathway-dossier dt) { color: var(--ink-muted); font: 700 .56rem/1.4 Manrope, sans-serif; text-transform: uppercase; }
:global(.pathway-dossier dd) { margin: 0; color: var(--ink-muted); font-size: .71rem; font-weight: 500; line-height: 1.5; }
:global(.pathway-dossier > a) { min-height: 50px; display: flex; align-items: center; justify-content: space-between; padding: 0 18px; border-radius: 999px; color: #fff; background: var(--path-accent); font-size: .73rem; font-weight: 800; text-decoration: none; }
.dossier-enter-active, .dossier-leave-active { transition: opacity .35s; }
.dossier-enter-active :global(.pathway-dossier), .dossier-leave-active :global(.pathway-dossier) { transition: transform .55s cubic-bezier(.22,1,.36,1); }
.dossier-enter-from, .dossier-leave-to { opacity: 0; }
.dossier-enter-from :global(.pathway-dossier), .dossier-leave-to :global(.pathway-dossier) { transform: translateX(50px); }

button:focus-visible, a:focus-visible, summary:focus-visible { outline: 3px solid var(--primary); outline-offset: 3px; }

@media (max-width: 1050px), (max-height: 720px), (prefers-reduced-motion: reduce) {
  .pathway-vault { min-height: auto; padding: 100px 0 80px; overflow: clip; }
  .desktop-experience { display: none; }
  .mobile-experience { display: block; }
  .mobile-heading { width: min(720px, calc(100% - 40px)); margin: 0 auto 38px; }
  .mobile-heading h2 { font-size: clamp(3.4rem, 10vw, 6rem); }
  .mobile-heading > span { display: block; max-width: 480px; margin-top: 18px; color: color-mix(in srgb, var(--path-ink) 72%, transparent); font-size: .82rem; font-weight: 500; line-height: 1.6; }
  .catalog-tabs--mobile { position: relative; top: auto; right: auto; width: fit-content; margin: 0 20px 28px; }
  .mobile-rail { display: flex; gap: 16px; overflow-x: auto; padding: 4px max(20px, calc((100vw - 620px) / 2)) 25px; scroll-snap-type: x mandatory; scrollbar-width: none; overscroll-behavior-x: contain; }
  .mobile-rail::-webkit-scrollbar { display: none; }
  .mobile-card { flex: 0 0 min(620px, calc(100vw - 40px)); min-height: 580px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 42px clamp(24px, 7vw, 60px); border: 1px solid color-mix(in srgb, var(--path-ink) 16%, transparent); border-radius: 28px; background: radial-gradient(circle at 50% 34%, color-mix(in srgb, var(--path-haze) 36%, transparent), transparent 33%), color-mix(in srgb, var(--path-surface) 82%, transparent); scroll-snap-align: center; text-align: center; }
  .mobile-card__visual { position: relative; width: 215px; aspect-ratio: 1; display: grid; place-items: center; margin-bottom: 28px; border: 1px solid color-mix(in srgb, var(--path-accent) 48%, transparent); border-radius: 50%; }
  .mobile-card__visual > i { position: absolute; inset: -12px; border: 1px dashed color-mix(in srgb, var(--path-accent) 37%, transparent); border-radius: 50%; transform: rotate(24deg); }
  .mobile-card__visual > i:nth-child(2) { inset: 23px; transform: rotate(-31deg); }
  .mobile-card__visual img { width: 78%; height: 78%; object-fit: contain; filter: drop-shadow(0 16px 22px rgba(34,28,20,.22)); }
  .mobile-card__visual b { position: absolute; right: 2px; bottom: 17px; width: 32px; height: 32px; display: grid; place-items: center; border-radius: 50%; color: #fff; background: var(--path-accent); font: 750 .58rem/1 Manrope, sans-serif; }
  .mobile-card > p { margin: 0 0 9px; color: var(--path-accent); font: 800 .59rem/1 Manrope, sans-serif; letter-spacing: .1em; text-transform: uppercase; }
  .mobile-card h3 { margin: 0; font: 800 clamp(3.5rem, 10vw, 6.2rem)/.8 Manrope, sans-serif; letter-spacing: -.052em; }
  .mobile-card ul { display: flex; justify-content: center; flex-wrap: wrap; gap: 6px; margin: 20px 0 28px; padding: 0; list-style: none; }
  .mobile-card li { padding: 7px 9px; border: 1px solid color-mix(in srgb, var(--path-ink) 17%, transparent); border-radius: 999px; color: color-mix(in srgb, var(--path-ink) 70%, transparent); font: 700 .52rem/1 Manrope, sans-serif; }
  .mobile-card > button { min-height: 48px; margin-top: auto; padding: 0 18px; border: 0; border-radius: 999px; color: #fff; background: var(--path-accent); cursor: pointer; font-size: .72rem; font-weight: 800; }
  .mobile-pagination { display: flex; align-items: center; justify-content: center; gap: 20px; margin-top: 16px; }
  .mobile-pagination span { min-width: 72px; }
  .catalog-fallback { display: block; }
  .catalog-fallback summary { min-height: 48px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; border: 1px solid color-mix(in srgb, var(--path-ink) 20%, transparent); border-radius: 12px; cursor: pointer; font-size: .76rem; font-weight: 750; }
  .catalog-fallback summary::after { content: "+"; font-size: 1.2rem; }
  .catalog-fallback[open] summary::after { content: "−"; }
  .catalog-fallback ul { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 7px; margin: 12px 0 0; padding: 0; list-style: none; }
  .catalog-fallback button { width: 100%; min-height: 62px; display: flex; align-items: center; gap: 11px; padding: 8px; border: 1px solid color-mix(in srgb, var(--path-ink) 14%, transparent); border-radius: 11px; color: var(--path-ink); background: color-mix(in srgb, var(--path-surface) 70%, transparent); cursor: pointer; text-align: left; }
  .catalog-fallback img { width: 44px; height: 44px; object-fit: contain; }
  .catalog-fallback button span { min-width: 0; display: grid; gap: 4px; }
  .catalog-fallback button strong { overflow: hidden; text-overflow: ellipsis; font-size: .69rem; white-space: nowrap; }
  .catalog-fallback button small { color: color-mix(in srgb, var(--path-ink) 72%, transparent); font: 500 .5rem/1.2 Manrope, sans-serif; }
}

@media (max-width: 580px) {
  .pathway-vault { padding-top: 82px; }
  .catalog-tabs--mobile { width: calc(100% - 40px); }
  .catalog-tabs button { flex: 1; min-width: 0; }
  .mobile-card { min-height: 540px; }
  .catalog-fallback ul { grid-template-columns: 1fr; }
  :global(.pathway-dossier) { top: auto; right: 8px; bottom: 8px; width: calc(100% - 16px); height: min(88svh, 760px); border-radius: 24px; }
}

@media (prefers-reduced-motion: reduce) {
  .pathway-vault { min-height: auto; padding: 100px 0 80px; }
  .desktop-experience { display: none; }
  .mobile-experience { display: block; }
  .mobile-rail { scroll-behavior: auto; }
  .orbit-token, .motif-stage::before, .motif-stage::after, .motif-stage > i, .motif-stage img, .dossier-enter-active, .dossier-leave-active, .dossier-enter-active :global(.pathway-dossier), .dossier-leave-active :global(.pathway-dossier) { transition: none !important; }
}
</style>
