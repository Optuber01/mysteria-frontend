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
            Explore 22 pathways. Hover a symbol to see what each Sequence unlocks.
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
            :style="orbitStyles[index]?.style"
            :tabindex="orbitStyles[index]?.hidden ? -1 : 0"
            :aria-label="`${entry.name}. ${entry.startingSequence}. ${entry.playstyle}`"
            :aria-pressed="index === selectedIndex"
            @mouseenter="previewPathway(index)"
            @mouseleave="schedulePreviewClose"
            @focus="previewPathway(index)"
            @blur="schedulePreviewClose"
            @click.stop="selectPreview(index)"
          >
            <span class="token-seal">
              <img :src="entry.image" alt="" width="96" height="96" :loading="index < 4 ? 'eager' : 'lazy'" :fetchpriority="index < 2 ? 'high' : 'auto'" decoding="async" @error="replaceBrokenImage">
            </span>
            <strong>{{ entry.name }}</strong><small>{{ entry.sequenceCount }} sequences</small>
          </button>
          </template>

          <article v-if="hasActiveEntry" class="orbit-story" :aria-live="interactionReady ? 'polite' : 'off'">
            <div class="motif-stage" :data-motif="activeEntry.motif" aria-hidden="true">
              <img :src="activeEntry.image" alt="" width="220" height="220" loading="eager" fetchpriority="high" decoding="async" @error="replaceBrokenImage">
            </div>
            <h3>{{ activeEntry.name }}</h3>
            <span class="entry-kind">{{ activeEntry.sequenceCount }} sequences</span>
            <small>{{ activeEntry.tagline }}</small>
          </article>

          <aside
            class="sequence-card"
            :class="{ 'is-visible': previewIndex !== null && hasActiveEntry }"
            :aria-hidden="previewIndex === null"
            @mouseenter="cancelPreviewClose"
            @mouseleave="schedulePreviewClose"
          >
            <header><span>PATHWAY ARCHIVE</span><button type="button" aria-label="Close pathway archive" @click="closePreview">×</button></header>
            <h4>{{ activeEntry.name }}</h4>
            <p>{{ activeEntry.sequenceCount }} sequences · {{ activeEntry.abilityCount }} abilities</p>
            <div v-if="loadingSequenceId === activeEntry.id" class="sequence-card__loading">Loading archive…</div>
            <div v-else class="sequence-list">
              <details v-for="sequence in activeSequences" :key="sequence.sequence">
                <summary><span>Sequence {{ sequence.sequence }}</span><b>{{ sequence.name }}</b></summary>
                <ul>
                  <li v-for="ability in sequence.abilities" :key="ability.id"><strong>{{ ability.name }}</strong><span>{{ ability.description }}</span></li>
                </ul>
              </details>
            </div>
          </aside>
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
          :aria-label="`${entry.name}, ${index + 1} of ${activeCatalog.length}`"
        >
          <div class="mobile-card__visual" aria-hidden="true">
            <img :src="entry.image" alt="" width="170" height="170" loading="lazy" decoding="async" @error="replaceBrokenImage">
            <b>{{ String(index + 1).padStart(2, '0') }}</b>
          </div>
          <p>{{ entry.sequenceCount }} sequences</p>
          <h3>{{ entry.name }}</h3>
          <button type="button" @click="selectAndOpen(index, $event)">Open archive <span aria-hidden="true">↗</span></button>
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
              <img :src="selectedEntry.image" alt="" width="150" height="150" @error="replaceBrokenImage">
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
              Learn more in the full archive <span aria-hidden="true">↗</span>
            </RouterLink>
          </aside>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch, type CSSProperties } from 'vue';
import { boonPathways, standardPathways, type ProgressionKind } from '@/data/pathways';
import { useReducedMotion } from '@/composables/useReducedMotion';

const emit = defineEmits<{ selected: [name: string] }>();
const sectionRef = ref<HTMLElement | null>(null);
const orbitStageRef = ref<HTMLElement | null>(null);
const mobileRailRef = ref<HTMLElement | null>(null);
const dossierRef = ref<HTMLElement | null>(null);
const dossierCloseRef = ref<HTMLButtonElement | null>(null);
const reducedMotion = useReducedMotion();
const activeKind = ref<ProgressionKind>('pathway');
const scrollProgress = ref(0);
const selectedIndex = ref(0);
const previewIndex = ref<number | null>(null);
const rotation = ref(0);
const targetRotation = ref(0);
const pointerOffset = ref(0);
const velocity = ref(0);
const dragging = ref(false);
const inView = ref(false);
const detailsOpen = ref(false);
const compactLayout = ref(false);
const lowPower = ref(false);
const sequenceArchive = ref<Record<string, SequenceDetail[]>>({});
const loadingSequenceId = ref<string | null>(null);

let animationFrame = 0;
let scrollFrame = 0;
let lastPointerX = 0;
let lastPointerTime = 0;
let mobileScrollTimer = 0;
let dossierTrigger: HTMLElement | null = null;
let previousBodyOverflow = '';
let sectionObserver: IntersectionObserver | null = null;
let compactMedia: MediaQueryList | null = null;
let scrollTravel = 1;
let previewCloseTimer = 0;

const activeCatalog = computed(() => activeKind.value === 'pathway' ? standardPathways : boonPathways);
const activeKindLabel = computed(() => activeKind.value === 'pathway' ? 'Pathways' : 'Boons');
const catalogOptions = computed(() => [
  { id: 'pathway' as const, label: 'Pathways', count: standardPathways.length },
  { id: 'boon' as const, label: 'Boons', count: boonPathways.length },
]);
// Complete close to the end of the sticky scene, leaving only a small
// hand-off scroll before the next section.
const assemblyProgress = computed(() => clamp((scrollProgress.value - .04) / .87, 0, 1));
const phase = computed<'entry' | 'assembly' | 'orbit'>(() => {
  if (reducedMotion.value || compactLayout.value) return 'orbit';
  if (scrollProgress.value < .08) return 'entry';
  if (assemblyProgress.value < 1) return 'assembly';
  return 'orbit';
});
const interactionReady = computed(() => reducedMotion.value || compactLayout.value || phase.value === 'orbit');
const assemblyCursor = computed(() => assemblyProgress.value * activeCatalog.value.length - 1);
const assemblyIndex = computed(() => clamp(Math.floor(assemblyCursor.value), 0, activeCatalog.value.length - 1));
const shownIndex = computed(() => previewIndex.value ?? (interactionReady.value ? selectedIndex.value : assemblyIndex.value));
const activeEntry = computed(() => activeCatalog.value[shownIndex.value] ?? activeCatalog.value[0]);
const selectedEntry = computed(() => activeCatalog.value[selectedIndex.value] ?? activeCatalog.value[0]);
const activeSequences = computed(() => sequenceArchive.value[activeEntry.value.id] ?? []);
const hasActiveEntry = computed(() => reducedMotion.value || compactLayout.value || assemblyProgress.value * activeCatalog.value.length >= 1);
const neutralTheme = { accent: '#c69b52', accent2: '#4f8275', ink: '#f7f2e7', surface: '#10201f', haze: '#345f58' };
const themeStyle = computed(() => ({
  '--path-accent': (hasActiveEntry.value ? activeEntry.value.theme : neutralTheme).accent,
  '--path-accent-2': (hasActiveEntry.value ? activeEntry.value.theme : neutralTheme).accent2,
  '--path-ink': (hasActiveEntry.value ? activeEntry.value.theme : neutralTheme).ink,
  '--path-surface': (hasActiveEntry.value ? activeEntry.value.theme : neutralTheme).surface,
  '--path-haze': (hasActiveEntry.value ? activeEntry.value.theme : neutralTheme).haze,
}));

type OrbitVisual = { hidden: boolean; behind: boolean; style: CSSProperties };
type SequenceDetail = {
  sequence: number;
  name: string;
  abilities: Array<{ id: string; name: string; description: string }>;
};

const orbitStyles = computed<OrbitVisual[]>(() => activeCatalog.value.map((_, index) => {
  if (phase.value === 'entry' || phase.value === 'assembly') return assemblyStyle(index);
  const delta = signedWrap(index - (rotation.value + pointerOffset.value), activeCatalog.value.length);
  const angle = -Math.PI / 2 + delta * ((Math.PI * 2) / activeCatalog.value.length);
  const x = 50 + Math.cos(angle) * 42;
  const y = 50 + Math.sin(angle) * 34;
  const depth = (Math.sin(angle) + 1) / 2;
  return {
    hidden: false,
    behind: depth < .42,
    style: {
      left: `${x}%`, top: `${y}%`, opacity: String(.46 + depth * .54),
      zIndex: String(18 + Math.round(depth * 46)),
      transform: `translate(-50%, -50%) scale(${.62 + depth * .34})`,
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
  // Each new route arrives at the top of the orbit. It pushes every route
  // already present one slot clockwise, so the first seal visibly scoots
  // around the ring as the archive fills.
  const orbitSlot = visibleCount - 1 - index - rotation.value;
  const angle = -Math.PI / 2 + orbitSlot * ((Math.PI * 2) / count);
  const targetX = 50 + Math.cos(angle) * 42;
  const targetY = 50 + Math.sin(angle) * 34;
  const depth = (Math.sin(angle) + 1) / 2;
  return {
    hidden: false, behind: depth < .42,
    style: {
      left: `${roundPosition(mix(-14, targetX, t))}%`,
      top: `${roundPosition(mix(50, targetY, t))}%`,
      opacity: String(t * (.46 + depth * .54)),
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
  const nextProgress = reducedMotion.value ? 1 : clamp(-rect.top / scrollTravel, 0, 1);
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
  activeKind.value = kind;
  selectedIndex.value = 0;
  previewIndex.value = null;
  rotation.value = 0;
  targetRotation.value = 0;
  pointerOffset.value = 0;
  requestAnimationFrame(() => mobileRailRef.value?.scrollTo({ left: 0, behavior: reducedMotion.value ? 'auto' : 'smooth' }));
  emit('selected', activeCatalog.value[0]?.name ?? '');
}

function snapTo(index: number, announce = true) {
  if (!activeCatalog.value.length) return;
  const normalized = normalizeIndex(index);
  const current = rotation.value;
  const currentNormalized = normalizeIndex(Math.round(current));
  const delta = signedWrap(normalized - currentNormalized, activeCatalog.value.length);
  targetRotation.value = Math.round(current) + delta;
  selectedIndex.value = normalized;
  previewIndex.value = null;
  pointerOffset.value = 0;
  if (announce) emit('selected', activeCatalog.value[normalized].name);
  startOrbitAnimation();
}

function previous() { if (hasActiveEntry.value) snapTo(selectedIndex.value - 1); }
function next() { if (hasActiveEntry.value) snapTo(selectedIndex.value + 1); }

async function loadSequenceArchive(id: string) {
  if (sequenceArchive.value[id] || loadingSequenceId.value === id) return;
  loadingSequenceId.value = id;
  try {
    const source = await import('@/assets/sources/pathway-abilities.json');
    const pathway = source.default.pathways.find((entry) => entry.id === id);
    sequenceArchive.value = {
      ...sequenceArchive.value,
      [id]: (pathway?.sequences ?? [])
        .slice()
        .sort((a, b) => b.sequence - a.sequence)
        .map((sequence) => ({
          sequence: sequence.sequence,
          name: sequence.name.en ?? sequence.name.uk ?? 'Undocumented',
          abilities: sequence.abilities.map((ability) => ({
            id: ability.id,
            name: ability.name.en ?? ability.name.uk ?? 'Undocumented',
            description: ability.description.en ?? ability.description.uk ?? '',
          })),
        })),
    };
  } finally {
    if (loadingSequenceId.value === id) loadingSequenceId.value = null;
  }
}

function cancelPreviewClose() { window.clearTimeout(previewCloseTimer); }
function schedulePreviewClose() {
  cancelPreviewClose();
  previewCloseTimer = window.setTimeout(() => { previewIndex.value = null; }, 420);
}
function closePreview() { cancelPreviewClose(); previewIndex.value = null; }
function previewPathway(index: number) {
  cancelPreviewClose();
  previewIndex.value = index;
  void loadSequenceArchive(activeCatalog.value[index].id);
}
function selectPreview(index: number) {
  selectedIndex.value = index;
  snapTo(index);
  previewPathway(index);
}

function selectAndOpen(index: number, event: Event) {
  selectedIndex.value = index;
  snapTo(index);
  void openDetails(event);
}

function startDrag(event: PointerEvent) {
  if (!hasActiveEntry.value || event.button !== 0 || (event.target as HTMLElement).closest('button, a')) return;
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
    const delta = -movement / 92;
    rotation.value += delta;
    targetRotation.value = rotation.value;
    velocity.value = delta / Math.max(8, now - lastPointerTime) * 16;
    lastPointerX = event.clientX;
    lastPointerTime = now;
    return;
  }
  if (!orbitStageRef.value || reducedMotion.value) return;
  if (previewIndex.value !== null) return;
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
  emit('selected', activeCatalog.value[index].name);
  startOrbitAnimation();
}

function leaveOrbit() {
  if (dragging.value) return;
  pointerOffset.value = 0;
  previewIndex.value = null;
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
      emit('selected', activeCatalog.value[nearest].name);
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
  dossierTrigger = event?.currentTarget as HTMLElement | null;
  previousBodyOverflow = document.body.style.overflow;
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
  document.querySelector<HTMLElement>('#app')?.removeAttribute('inert');
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
    if (entry.isIntersecting) scheduleScrollMeasure();
    else if (animationFrame) { cancelAnimationFrame(animationFrame); animationFrame = 0; }
    if (!entry.isIntersecting && detailsOpen.value) void closeDetails(false);
  }, { rootMargin: '20% 0px' });
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
  window.clearTimeout(previewCloseTimer);
  document.body.style.overflow = previousBodyOverflow;
  document.querySelector<HTMLElement>('#app')?.removeAttribute('inert');
});
</script>

<style scoped>
.pathway-vault {
  --path-accent: #c69b52;
  --path-accent-2: #4f8275;
  --path-ink: #f7f2e7;
  --path-surface: #10201f;
  --path-haze: #345f58;
  position: relative;
  min-height: 420svh;
  color: var(--path-ink);
  background: var(--path-surface);
  /* Theme changes are immediate: animating a full-screen gradient repaints on
     every frame and is especially costly while the orbit is assembling. */
}

.ambient-field { position: absolute; inset: 0; overflow: clip; pointer-events: none; }
.ambient-field::before {
  content: none; position: absolute; inset: 0;
  opacity: .13;
  background-image: linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px);
  background-size: 72px 72px;
  mask-image: linear-gradient(transparent, #000 12%, #000 88%, transparent);
}
.ambient-field__haze {
  position: sticky; top: 0; display: block; height: 100svh;
  background:
    radial-gradient(circle at 50% 48%, color-mix(in srgb, var(--path-haze) 48%, transparent), transparent 35%),
    radial-gradient(circle at 15% 70%, color-mix(in srgb, var(--path-accent-2) 22%, transparent), transparent 30%),
    radial-gradient(circle at 88% 25%, color-mix(in srgb, var(--path-accent) 15%, transparent), transparent 26%);
}
.is-low-power .ambient-field::before { display: none; }
.is-low-power .ambient-field__haze { background: radial-gradient(circle at 50% 48%, color-mix(in srgb, var(--path-haze) 38%, transparent), transparent 42%); }

.desktop-experience { height: 440svh; }
.sticky-scene { position: sticky; top: 0; height: 100svh; min-height: 700px; overflow: clip; }
.vault-heading { position: absolute; z-index: 90; top: clamp(76px, 9vh, 112px); left: clamp(24px, 5vw, 78px); width: min(470px, 34vw); }
.vault-heading > p, .mobile-heading > p { margin: 0 0 14px; color: var(--path-accent); font: 650 .63rem/1 "IBM Plex Mono", monospace; letter-spacing: .18em; }
.vault-heading h2, .mobile-heading h2 { margin: 0; font: 600 clamp(2.7rem, 5vw, 5.3rem)/.98 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.018em; text-wrap: balance; }
.vault-heading h2 em, .mobile-heading h2 em { color: var(--path-accent); font-style: normal; }
.vault-heading > span { display: block; max-width: 350px; margin-top: 18px; color: color-mix(in srgb, var(--path-ink) 72%, transparent); font-size: .78rem; line-height: 1.65; }

.catalog-tabs { position: absolute; z-index: 100; top: clamp(78px, 9vh, 112px); right: clamp(24px, 5vw, 78px); display: flex; min-height: 48px; padding: 4px; border: 1px solid color-mix(in srgb, var(--path-ink) 18%, transparent); border-radius: 999px; background: color-mix(in srgb, var(--path-surface) 82%, transparent); backdrop-filter: blur(16px); }
.catalog-tabs button { min-width: 124px; min-height: 44px; display: flex; align-items: center; justify-content: center; gap: 10px; border: 0; border-radius: 999px; color: color-mix(in srgb, var(--path-ink) 72%, transparent); background: transparent; cursor: pointer; font: 700 .7rem/1 Manrope, sans-serif; }
.catalog-tabs button b { min-width: 23px; height: 23px; display: grid; place-items: center; border-radius: 99px; color: currentColor; background: color-mix(in srgb, var(--path-ink) 9%, transparent); font: 650 .57rem/1 "IBM Plex Mono", monospace; }
.catalog-tabs button[aria-selected="true"] { color: #08151a; background: var(--path-accent); }

.orbit-stage { position: absolute; z-index: 10; inset: 0; outline: 0; cursor: default; touch-action: pan-y; user-select: none; contain: layout paint; }
.orbit-stage:focus-visible { outline: 3px solid #fcf9f2; outline-offset: -10px; box-shadow: inset 0 0 0 5px #08151a; }
.orbit-token { position: absolute; width: 108px; min-height: 108px; display: grid; place-items: center; align-content: center; gap: 3px; padding: 4px; border: 0; color: color-mix(in srgb, var(--path-ink) 92%, transparent); background: transparent; cursor: pointer; contain: layout paint; }
.orbit-token.is-hidden { visibility: hidden; }
.orbit-token.is-behind { opacity: .68; }
.orbit-token:hover, .orbit-token:focus-visible, .orbit-token.is-active { z-index: 75 !important; color: var(--path-ink); filter: none; }
.orbit-token:focus-visible { outline: 3px solid #fcf9f2; outline-offset: 2px; border-radius: 18px; box-shadow: 0 0 0 5px #08151a; }
.token-seal { position: relative; width: 66px; height: 66px; display: grid; place-items: center; border: 1px solid color-mix(in srgb, var(--path-ink) 24%, transparent); border-radius: 50%; background: color-mix(in srgb, var(--path-surface) 92%, transparent); box-shadow: 0 12px 26px rgba(0,0,0,.24); transition: transform .14s ease-out, border-color .12s linear, background .12s linear; }
.orbit-token:hover .token-seal, .orbit-token:focus-visible .token-seal, .orbit-token.is-active .token-seal { border-color: var(--path-accent); background: color-mix(in srgb, var(--path-haze) 40%, var(--path-surface)); transform: scale(1.14); }
.token-seal img { width: 57px; height: 57px; object-fit: contain; filter: drop-shadow(0 8px 12px rgba(0,0,0,.28)); }
.orbit-token > strong { max-width: 108px; overflow: hidden; text-overflow: ellipsis; color: inherit; font-size: .64rem; white-space: nowrap; }
.orbit-token > small { color: color-mix(in srgb, var(--path-ink) 68%, transparent); font: 600 .46rem/1 "IBM Plex Mono", monospace; letter-spacing: .06em; text-transform: uppercase; }
.is-low-power .token-seal { box-shadow: none; }
.is-low-power .token-seal img, .is-low-power .motif-stage img { filter: none; }
.is-low-power .motif-stage::before { box-shadow: none; }

.orbit-story { position: absolute; z-index: 42; left: 50%; top: 47%; width: min(300px, 25vw); transform: translate(-50%, -50%); text-align: center; pointer-events: none; }
.motif-stage { position: relative; width: clamp(132px, 13vw, 184px); aspect-ratio: 1; display: grid; place-items: center; margin: 0 auto 13px; }
.motif-stage::before { content: ""; position: absolute; inset: 4%; border: 1px solid color-mix(in srgb, var(--path-accent) 52%, transparent); border-radius: 50%; box-shadow: 0 0 60px color-mix(in srgb, var(--path-haze) 46%, transparent); }
.motif-stage img { position: relative; z-index: 4; width: 72%; height: 72%; object-fit: contain; filter: drop-shadow(0 18px 22px rgba(0,0,0,.34)); transition: transform .16s ease-out; }
.orbit-story h3 { margin: 0; font: 620 clamp(2.3rem, 3.8vw, 4.2rem)/.96 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.022em; text-wrap: balance; }
.entry-kind { display: block; margin-top: 10px; color: color-mix(in srgb, var(--path-ink) 76%, transparent); font: 650 .56rem/1 "IBM Plex Mono", monospace; letter-spacing: .13em; text-transform: uppercase; }
.orbit-story > small { display: block; max-width: 270px; margin: 14px auto 0; color: color-mix(in srgb, var(--path-ink) 74%, transparent); font-size: .7rem; line-height: 1.55; }

.sequence-card { position: absolute; z-index: 120; left: 63%; top: 50%; width: min(360px, 30vw); max-height: min(390px, 44vh); overflow: hidden auto; padding: 14px; border: 1px solid color-mix(in srgb, var(--path-accent) 48%, transparent); border-radius: 12px; color: var(--path-ink); background: color-mix(in srgb, var(--path-surface) 98%, transparent); box-shadow: 0 18px 48px rgba(0,0,0,.24); opacity: 0; pointer-events: none; transform: translate(-50%, -46%) scale(.97); transition: opacity .12s linear, transform .16s ease-out; }
.sequence-card.is-visible { opacity: 1; pointer-events: auto; transform: translate(-50%, -50%) scale(1); }
.sequence-card header { display: flex; align-items: center; justify-content: space-between; color: var(--path-accent); font: 700 .53rem/1 "IBM Plex Mono", monospace; letter-spacing: .14em; }
.sequence-card header button { width: 28px; height: 28px; border: 0; color: inherit; background: transparent; cursor: pointer; font-size: 1.2rem; }
.sequence-card h4 { margin: 10px 0 3px; font: 620 clamp(1.7rem, 2.2vw, 2.25rem)/.98 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.016em; }
.sequence-card > p { margin: 0 0 10px; color: color-mix(in srgb, var(--path-ink) 68%, transparent); font: 600 .5rem/1.4 "IBM Plex Mono", monospace; text-transform: uppercase; }
.sequence-card__loading { padding: 24px 0; color: color-mix(in srgb, var(--path-ink) 72%, transparent); font: .68rem/1.4 "IBM Plex Mono", monospace; }
.sequence-list { display: grid; border-top: 1px solid color-mix(in srgb, var(--path-ink) 16%, transparent); }
.sequence-list details { border-bottom: 1px solid color-mix(in srgb, var(--path-ink) 16%, transparent); }
.sequence-list summary { display: grid; grid-template-columns: 74px 1fr auto; align-items: center; gap: 7px; padding: 9px 0; cursor: pointer; list-style: none; }
.sequence-list summary::-webkit-details-marker { display: none; }
.sequence-list summary::after { content: '+'; color: var(--path-accent); font: 1rem/1 "IBM Plex Mono", monospace; }
.sequence-list details[open] summary::after { content: '−'; }
.sequence-list summary span { color: var(--path-accent); font: 650 .5rem/1 "IBM Plex Mono", monospace; text-transform: uppercase; }
.sequence-list summary b { font-size: .72rem; }
.sequence-list ul { display: grid; gap: 8px; margin: 0 0 11px; padding: 0; list-style: none; }
.sequence-list li { display: grid; gap: 3px; padding-left: 10px; border-left: 1px solid color-mix(in srgb, var(--path-accent) 45%, transparent); }
.sequence-list li strong { font-size: .68rem; }
.sequence-list li span { color: color-mix(in srgb, var(--path-ink) 70%, transparent); font-size: .63rem; line-height: 1.42; }

.assembly-readout { position: absolute; z-index: 80; left: clamp(24px, 5vw, 78px); bottom: clamp(38px, 6vh, 70px); width: min(300px, 25vw); display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; color: color-mix(in srgb, var(--path-ink) 72%, transparent); font: 600 .52rem/1 "IBM Plex Mono", monospace; letter-spacing: .1em; }
.assembly-readout > i { height: 1px; overflow: hidden; background: color-mix(in srgb, var(--path-ink) 15%, transparent); }
.assembly-readout > i b { display: block; width: 100%; height: 100%; transform-origin: left; background: var(--path-accent); transition: transform .12s linear; }
.assembly-readout strong { color: var(--path-accent); }
.orbit-controls { position: absolute; z-index: 86; left: clamp(24px, 5vw, 78px); bottom: clamp(88px, 12vh, 132px); display: grid; grid-template-columns: 48px 74px 48px; align-items: center; gap: 8px; opacity: 0; transform: translateY(15px); pointer-events: none; transition: opacity .55s, transform .55s cubic-bezier(.22,1,.36,1); }
.orbit-controls.is-visible, .open-dossier.is-visible, .interaction-hint.is-visible { opacity: 1; transform: none; pointer-events: auto; }
.orbit-controls button, .mobile-pagination button { width: 48px; height: 48px; border: 1px solid color-mix(in srgb, var(--path-ink) 25%, transparent); border-radius: 50%; color: var(--path-ink); background: color-mix(in srgb, var(--path-surface) 76%, transparent); cursor: pointer; }
.orbit-controls button:hover, .mobile-pagination button:hover { border-color: var(--path-accent); color: #08151a; background: var(--path-accent); }
.orbit-controls span, .mobile-pagination span { font: 600 .58rem/1 "IBM Plex Mono", monospace; text-align: center; }
.orbit-controls span b, .mobile-pagination span b { color: var(--path-accent); font-size: .85rem; }
.open-dossier { position: absolute; z-index: 86; right: clamp(24px, 5vw, 78px); bottom: clamp(38px, 6vh, 70px); min-height: 48px; padding: 0 19px; border: 1px solid color-mix(in srgb, var(--path-ink) 22%, transparent); border-radius: 999px; color: var(--path-ink); background: color-mix(in srgb, var(--path-surface) 76%, transparent); cursor: pointer; opacity: 0; transform: translateY(15px); pointer-events: none; transition: opacity .55s, transform .55s cubic-bezier(.22,1,.36,1), background .25s; font-weight: 750; }
.open-dossier:hover { color: #08151a; background: var(--path-accent); }
.interaction-hint { position: absolute; z-index: 80; right: clamp(24px, 5vw, 78px); bottom: clamp(101px, 13vh, 144px); margin: 0; color: color-mix(in srgb, var(--path-ink) 70%, transparent); font: 550 .5rem/1 "IBM Plex Mono", monospace; letter-spacing: .1em; opacity: 0; transform: translateY(12px); transition: opacity .55s, transform .55s; }
.scroll-cue { position: absolute; z-index: 82; left: 50%; bottom: 22px; display: grid; justify-items: center; gap: 8px; transform: translateX(-50%); color: color-mix(in srgb, var(--path-ink) 72%, transparent); font: 600 .48rem/1 "IBM Plex Mono", monospace; letter-spacing: .13em; transition: opacity .4s; }
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

:global(.dossier-scrim) { position: fixed; z-index: 2000; inset: 0; display: grid; justify-items: end; padding: clamp(12px, 3vw, 38px); background: rgba(3, 11, 13, .7); backdrop-filter: blur(12px); }
:global(.pathway-dossier) { --path-accent: #c69b52; position: relative; width: min(490px, 100%); height: 100%; overflow: auto; padding: clamp(28px, 5vw, 58px); border: 1px solid rgba(245,240,230,.17); border-radius: 28px; color: #f5f0e6; background: #0b1c1d; box-shadow: 0 35px 100px rgba(0,0,0,.45); outline: 0; }
:global(.dossier-close) { position: absolute; z-index: 3; top: 18px; right: 18px; width: 48px; height: 48px; border: 1px solid rgba(245,240,230,.2); border-radius: 50%; color: #f5f0e6; background: transparent; cursor: pointer; font-size: 1.5rem; }
:global(.dossier-symbol) { position: relative; width: 180px; aspect-ratio: 1; display: grid; place-items: center; margin-bottom: 40px; border: 1px solid color-mix(in srgb, var(--path-accent) 52%, transparent); border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--path-accent) 22%, transparent), transparent 68%); }
:global(.dossier-symbol img) { width: 78%; height: 78%; object-fit: contain; }
:global(.pathway-dossier > p) { margin: 0 0 12px; color: var(--path-accent); font: 650 .59rem/1 "IBM Plex Mono", monospace; letter-spacing: .17em; }
:global(.pathway-dossier h3) { margin: 0; font: 620 clamp(3.7rem, 7vw, 6.6rem)/.79 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.055em; }
:global(.pathway-dossier > strong) { display: block; margin-top: 18px; color: var(--path-accent); font: 650 .67rem/1 "IBM Plex Mono", monospace; }
:global(.pathway-dossier > span) { display: block; margin-top: 15px; color: rgba(245,240,230,.76); font-size: .78rem; line-height: 1.6; }
:global(.pathway-dossier dl) { margin: 35px 0; border-top: 1px solid rgba(245,240,230,.15); }
:global(.pathway-dossier dl div) { display: grid; grid-template-columns: 105px 1fr; gap: 15px; padding: 16px 0; border-bottom: 1px solid rgba(245,240,230,.15); }
:global(.pathway-dossier dt) { color: rgba(245,240,230,.72); font: 600 .56rem/1.4 "IBM Plex Mono", monospace; text-transform: uppercase; }
:global(.pathway-dossier dd) { margin: 0; color: rgba(245,240,230,.76); font-size: .71rem; line-height: 1.5; }
:global(.pathway-dossier > a) { min-height: 50px; display: flex; align-items: center; justify-content: space-between; padding: 0 18px; border-radius: 999px; color: #10201f; background: var(--path-accent); font-size: .73rem; font-weight: 800; text-decoration: none; }
.dossier-enter-active, .dossier-leave-active { transition: opacity .35s; }
.dossier-enter-active :global(.pathway-dossier), .dossier-leave-active :global(.pathway-dossier) { transition: transform .55s cubic-bezier(.22,1,.36,1); }
.dossier-enter-from, .dossier-leave-to { opacity: 0; }
.dossier-enter-from :global(.pathway-dossier), .dossier-leave-to :global(.pathway-dossier) { transform: translateX(50px); }

button:focus-visible, a:focus-visible, summary:focus-visible { outline: 3px solid #fcf9f2; outline-offset: 3px; box-shadow: 0 0 0 5px #08151a; }

@media (max-width: 1050px), (max-height: 720px), (prefers-reduced-motion: reduce) {
  .pathway-vault { min-height: auto; padding: 100px 0 80px; overflow: clip; }
  .desktop-experience { display: none; }
  .mobile-experience { display: block; }
  .mobile-heading { width: min(720px, calc(100% - 40px)); margin: 0 auto 38px; }
  .mobile-heading h2 { font-size: clamp(3.4rem, 10vw, 6rem); }
  .mobile-heading > span { display: block; max-width: 480px; margin-top: 18px; color: color-mix(in srgb, var(--path-ink) 72%, transparent); font-size: .82rem; line-height: 1.6; }
  .catalog-tabs--mobile { position: relative; top: auto; right: auto; width: fit-content; margin: 0 20px 28px; }
  .mobile-rail { display: flex; gap: 16px; overflow-x: auto; padding: 4px max(20px, calc((100vw - 620px) / 2)) 25px; scroll-snap-type: x mandatory; scrollbar-width: none; overscroll-behavior-x: contain; }
  .mobile-rail::-webkit-scrollbar { display: none; }
  .mobile-card { flex: 0 0 min(620px, calc(100vw - 40px)); min-height: 580px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 42px clamp(24px, 7vw, 60px); border: 1px solid color-mix(in srgb, var(--path-ink) 16%, transparent); border-radius: 28px; background: radial-gradient(circle at 50% 34%, color-mix(in srgb, var(--path-haze) 36%, transparent), transparent 33%), color-mix(in srgb, var(--path-surface) 82%, transparent); scroll-snap-align: center; text-align: center; }
  .mobile-card__visual { position: relative; width: 215px; aspect-ratio: 1; display: grid; place-items: center; margin-bottom: 28px; border: 1px solid color-mix(in srgb, var(--path-accent) 48%, transparent); border-radius: 50%; }
  .mobile-card__visual > i { position: absolute; inset: -12px; border: 1px dashed color-mix(in srgb, var(--path-accent) 37%, transparent); border-radius: 50%; transform: rotate(24deg); }
  .mobile-card__visual > i:nth-child(2) { inset: 23px; transform: rotate(-31deg); }
  .mobile-card__visual img { width: 78%; height: 78%; object-fit: contain; filter: drop-shadow(0 16px 22px rgba(0,0,0,.3)); }
  .mobile-card__visual b { position: absolute; right: 2px; bottom: 17px; width: 32px; height: 32px; display: grid; place-items: center; border-radius: 50%; color: #08151a; background: var(--path-accent); font: 750 .58rem/1 "IBM Plex Mono", monospace; }
  .mobile-card > p { margin: 0 0 9px; color: var(--path-accent); font: 650 .59rem/1 "IBM Plex Mono", monospace; letter-spacing: .1em; text-transform: uppercase; }
  .mobile-card h3 { margin: 0; font: 620 clamp(3.5rem, 10vw, 6.2rem)/.8 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.052em; }
  .mobile-card ul { display: flex; justify-content: center; flex-wrap: wrap; gap: 6px; margin: 20px 0 28px; padding: 0; list-style: none; }
  .mobile-card li { padding: 7px 9px; border: 1px solid color-mix(in srgb, var(--path-ink) 17%, transparent); border-radius: 999px; color: color-mix(in srgb, var(--path-ink) 70%, transparent); font: 600 .52rem/1 "IBM Plex Mono", monospace; }
  .mobile-card > button { min-height: 48px; margin-top: auto; padding: 0 18px; border: 0; border-radius: 999px; color: #08151a; background: var(--path-accent); cursor: pointer; font-size: .72rem; font-weight: 800; }
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
  .catalog-fallback button small { color: color-mix(in srgb, var(--path-ink) 72%, transparent); font: .5rem/1.2 "IBM Plex Mono", monospace; }
}

@media (max-width: 580px) {
  .pathway-vault { padding-top: 82px; }
  .catalog-tabs--mobile { width: calc(100% - 40px); }
  .catalog-tabs button { flex: 1; min-width: 0; }
  .mobile-card { min-height: 540px; }
  .catalog-fallback ul { grid-template-columns: 1fr; }
  :global(.dossier-scrim) { align-items: end; padding: 8px; }
  :global(.pathway-dossier) { width: 100%; height: min(88svh, 760px); border-radius: 24px; }
}

@media (prefers-reduced-motion: reduce) {
  .pathway-vault { min-height: auto; padding: 100px 0 80px; }
  .desktop-experience { display: none; }
  .mobile-experience { display: block; }
  .mobile-rail { scroll-behavior: auto; }
  .orbit-token, .motif-stage::before, .motif-stage::after, .motif-stage > i, .motif-stage img, .dossier-enter-active, .dossier-leave-active, .dossier-enter-active :global(.pathway-dossier), .dossier-leave-active :global(.pathway-dossier) { transition: none !important; }
}
</style>
