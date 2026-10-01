<template>
  <section
    id="pathways"
    ref="sectionRef"
    class="pathway-vault"
    :class="[{ 'is-interactive': interactionReady, 'is-low-power': lowPower }, `motif-${activeEntry.motif}`]"
    :style="{ '--motif-accent': activeEntry.theme.accent }"
    aria-labelledby="pathway-title"
  >
    <div class="ambient-field" aria-hidden="true"><i class="ambient-field__haze" /></div>

    <div v-if="!compactLayout && !reducedMotion" class="desktop-experience">
      <div class="sticky-scene">
        <header class="vault-heading">
          <p>{{ t('home.orbit.kicker') }}</p>
          <h2 id="pathway-title">{{ t('home.orbit.titleLead') }}<br><em>{{ t('home.orbit.titleAccent') }}</em></h2>
          <span>{{ introCopy('home.orbit.intro') }}</span>
        </header>

        <div class="catalog-tabs" role="tablist" :aria-label="t('home.orbit.tabsLabel')" @keydown="onTabKeydown($event, '')">
          <button
            v-for="option in catalogOptions"
            :id="`${option.id}-tab`"
            :key="option.id"
            type="button"
            role="tab"
            :aria-selected="activeKind === option.id"
            :aria-controls="activeKind === option.id ? `${option.id}-panel` : undefined"
            :tabindex="activeKind === option.id ? 0 : -1"
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
          @pointerdown="startDrag"
          @pointermove="movePointer"
          @pointerup="endDrag"
          @pointercancel="endDrag"
        >
          <div
            class="orbit-ring"
            role="radiogroup"
            :aria-label="interactionReady ? t(`home.orbit.ringLabel.${activeKind}`) : t('home.orbit.assembling')"
            @keydown="onRingKeydown"
          >
            <template v-for="(entry, index) in activeCatalog" :key="entry.id">
              <button
                v-if="!orbitStyles[index].hidden"
                type="button"
                role="radio"
                class="orbit-token"
                :class="{ 'is-selected': index === shownIndex, 'is-behind': orbitStyles[index].behind }"
                :style="orbitStyles[index].style"
                :data-index="index"
                :tabindex="index === shownIndex ? 0 : -1"
                :aria-checked="index === shownIndex"
                :aria-label="tokenLabel(entry)"
                @pointerenter="warmNative(index)"
                @focus="warmNative(index)"
                @click.stop="chooseToken(index, $event)"
              >
                <span class="token-seal">
                  <img :src="entry.thumbnail" alt="" width="96" height="96" :loading="index < 4 ? 'eager' : 'lazy'" :fetchpriority="index < 2 ? 'high' : 'auto'" decoding="async" @error="replaceBrokenImage">
                </span>
                <strong>{{ nameOf(entry) }}</strong>
              </button>
            </template>
          </div>

          <Transition name="orbit-story">
            <article
              v-if="hasActiveEntry"
              class="orbit-story"
              :aria-live="interactionReady ? 'polite' : 'off'"
              @click="openEntry(shownIndex, $event)"
            >
              <div class="motif-stage" aria-hidden="true">
                <img :src="interactionReady ? activeEntry.image : activeEntry.thumbnail" alt="" width="220" height="220" loading="eager" fetchpriority="high" decoding="async" @error="replaceBrokenImage">
              </div>
              <h3>{{ nameOf(activeEntry) }}</h3>
              <span class="entry-kind">{{ sequenceLabel(activeEntry) }}</span>
              <small>{{ taglineOf(activeEntry) }}</small>
            </article>
          </Transition>

          <Transition name="orbit-ui">
            <div v-if="interactionReady" class="orbit-controls">
              <p>{{ t('home.orbit.hint') }}</p>
              <button type="button" :aria-label="t(`home.orbit.previous.${activeKind}`)" @click="previous"><span aria-hidden="true">←</span></button>
              <span aria-hidden="true"><b>{{ pad(shownIndex + 1) }}</b> / {{ pad(activeCatalog.length) }}</span>
              <button type="button" :aria-label="t(`home.orbit.next.${activeKind}`)" @click="next"><span aria-hidden="true">→</span></button>
            </div>
          </Transition>

          <button v-if="hasActiveEntry" type="button" class="open-dossier" @click="openEntry(shownIndex, $event)">
            {{ t('home.orbit.inspect').replace('{name}', nameOf(activeEntry)) }}<span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="mobile-experience">
      <header class="mobile-heading">
        <p>{{ t('home.orbit.kicker') }}</p>
        <h2 id="pathway-title">{{ t('home.orbit.titleLead') }}<br><em>{{ t('home.orbit.titleAccent') }}</em></h2>
        <span>{{ introCopy('home.orbit.introMobile') }}</span>
      </header>

      <div class="catalog-tabs catalog-tabs--mobile" role="tablist" :aria-label="t('home.orbit.tabsLabel')" @keydown="onTabKeydown($event, '-mobile')">
        <button
          v-for="option in catalogOptions"
          :id="`${option.id}-mobile-tab`"
          :key="option.id"
          type="button"
          role="tab"
          :aria-selected="activeKind === option.id"
          :aria-controls="activeKind === option.id ? `${option.id}-mobile-panel` : undefined"
          :tabindex="activeKind === option.id ? 0 : -1"
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
          :data-mobile-index="index"
        >
          <div class="mobile-card__visual" aria-hidden="true">
            <img :src="entry.image" alt="" width="170" height="170" :loading="activeKind === 'boon' ? 'eager' : 'lazy'" decoding="async" @error="replaceBrokenImage">
            <b>{{ pad(index + 1) }}</b>
          </div>
          <p>{{ sequenceLabel(entry) }}</p>
          <h3>{{ nameOf(entry) }}</h3>
          <small>{{ taglineOf(entry) }}</small>
          <button type="button" :aria-label="t('home.orbit.openArchiveNamed').replace('{name}', nameOf(entry))" @click="openEntry(index, $event)">
            {{ t('home.orbit.openArchive') }}<span aria-hidden="true">↗</span>
          </button>
        </article>
      </div>

      <div class="mobile-pagination">
        <button type="button" :aria-label="t(`home.orbit.previous.${activeKind}`)" @click="previousMobile"><span aria-hidden="true">←</span></button>
        <span aria-hidden="true"><b>{{ pad(selectedIndex + 1) }}</b> / {{ pad(activeCatalog.length) }}</span>
        <button type="button" :aria-label="t(`home.orbit.next.${activeKind}`)" @click="nextMobile"><span aria-hidden="true">→</span></button>
        <span class="visually-hidden" aria-live="polite">{{ nameOf(selectedEntry) }}. {{ t('home.orbit.position').replace('{current}', String(selectedIndex + 1)).replace('{total}', String(activeCatalog.length)) }}</span>
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
            <div class="dossier-symbol" aria-hidden="true">
              <img :src="selectedEntry.image" alt="" width="150" height="150" decoding="async" @error="replaceBrokenImage">
            </div>
            <p>{{ t(`home.orbit.dossier.kicker.${selectedEntry.kind}`) }}</p>
            <h3 :id="`${selectedEntry.id}-dossier-title`">{{ nameOf(selectedEntry) }}</h3>
            <strong>{{ sequenceLabel(selectedEntry) }}</strong>
            <span>{{ taglineOf(selectedEntry) }}</span>
            <dl>
              <div><dt>{{ t('home.orbit.dossier.earlyAbilities') }}</dt><dd>{{ selectedEntry.strengths.map((ability) => localize(ability, currentLanguage)).join(' · ') }}</dd></div>
              <div><dt>{{ t('home.orbit.dossier.archive') }}</dt><dd>{{ countLabel('sequenceCount', selectedEntry.sequenceCount) }} · {{ countLabel('abilityCount', selectedEntry.abilityCount) }}</dd></div>
            </dl>
            <RouterLink :to="$lp(selectedEntry.route)" @click="closeDetails(false)">
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
const sectionRef = ref<HTMLElement | null>(null);
const orbitStageRef = ref<HTMLElement | null>(null);
const mobileRailRef = ref<HTMLElement | null>(null);
const dossierRef = ref<HTMLElement | null>(null);
const dossierCloseRef = ref<HTMLButtonElement | null>(null);
const reducedMotion = useReducedMotion();
const activeKind = ref<ProgressionKind>('pathway');
const scrollProgress = ref(0);
const selectedIndex = ref(0);
const rotation = ref(0);
const targetRotation = ref(0);
const velocity = ref(0);
const dragging = ref(false);
const inView = ref(false);
const detailsOpen = ref(false);
const compactLayout = ref(false);
const lowPower = ref(false);
const stageSize = ref({ width: 0, height: 0 });

let animationFrame = 0;
let scrollFrame = 0;
let lastPointerX = 0;
let lastPointerTime = 0;
let mobileScrollTimer = 0;
let dossierTrigger: HTMLElement | null = null;
let previousBodyOverflow = '';
let previousBodyPaddingRight = '';
let sectionObserver: IntersectionObserver | null = null;
let stageObserver: ResizeObserver | null = null;
let compactMedia: MediaQueryList | null = null;
let scrollTravel = 1;
let catalogWarmTimer = 0;
let openingSymbolWarmTimer = 0;
// Set once the visitor picks an entry, so a finished assembly does not
// silently replace their choice with the last seal to arrive.
let userChose = false;
const warmedCatalogs = new Set<ProgressionKind>();
const warmedNatives = new Set<string>();
const catalogImageWarmers: HTMLImageElement[] = [];
let openingSymbolsWarmed = false;
let orbitStateBeforeDossier: { rotation: number; targetRotation: number; velocity: number } | null = null;

const activeCatalog = computed(() => activeKind.value === 'pathway' ? standardPathways : boonPathways);
const catalogOptions = computed(() => [
  { id: 'pathway' as const, label: t('home.orbit.tabs.pathway'), count: standardPathways.length },
  { id: 'boon' as const, label: t('home.orbit.tabs.boon'), count: boonPathways.length },
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
const interactionReady = computed(() => phase.value === 'orbit');
const assemblyIndex = computed(() => clamp(Math.floor(assemblyProgress.value * activeCatalog.value.length - 1), 0, activeCatalog.value.length - 1));
// Hover never changes this: the centre shows the committed choice, or the
// newest seal while the orbit is still assembling.
const shownIndex = computed(() => interactionReady.value ? selectedIndex.value : assemblyIndex.value);
const activeEntry = computed(() => activeCatalog.value[shownIndex.value] ?? activeCatalog.value[0]);
const selectedEntry = computed(() => activeCatalog.value[selectedIndex.value] ?? activeCatalog.value[0]);
const hasActiveEntry = computed(() => reducedMotion.value || compactLayout.value || assemblyProgress.value * activeCatalog.value.length >= 1);

const nameOf = (entry: HomePathway) => localize(entry.name, currentLanguage.value);
const pad = (value: number) => String(value).padStart(2, '0');

function introCopy(key: string) {
  return t(key).replace('{pathways}', String(standardPathways.length)).replace('{boons}', String(boonPathways.length));
}

function countLabel(key: 'sequenceCount' | 'abilityCount', count: number) {
  const forms = { one: t(`home.orbit.${key}.one`), few: t(`home.orbit.${key}.few`), many: t(`home.orbit.${key}.many`) };
  return plural(count, forms).replace('{count}', String(count));
}

/** "Sequence 9 · Seer". Chinese names a pathway after its Sequence 9, so the repeat is dropped there. */
function sequenceLabel(entry: HomePathway) {
  const start = entry.startingSequence;
  if (!start) return countLabel('sequenceCount', entry.sequenceCount);
  const name = localize(start.name, currentLanguage.value);
  const number = String(start.number);
  return name && name !== nameOf(entry)
    ? t('home.orbit.sequenceNamed').replace('{number}', number).replace('{name}', name)
    : t('home.orbit.sequence').replace('{number}', number);
}

function taglineOf(entry: HomePathway) {
  const key = `home.orbit.taglines.${entry.id}`;
  const tagline = t(key);
  return tagline === key ? t('home.orbit.taglineFallback').replace('{name}', nameOf(entry)) : tagline;
}

const tokenLabel = (entry: HomePathway) => `${nameOf(entry)}, ${sequenceLabel(entry)}`;

type OrbitVisual = { hidden: boolean; behind: boolean; style: CSSProperties };
const ORBIT_RADIUS_X = 42;
const ORBIT_RADIUS_Y = 34;

/** Positions a seal by transform only; percentages are of the stage box. */
function place(x: number, y: number, depth: number, scale: number, opacity: number, interactive: boolean): OrbitVisual {
  const { width, height } = stageSize.value;
  return {
    hidden: false,
    behind: depth < .42,
    style: {
      transform: `translate3d(${Math.round(x / 100 * width)}px, ${Math.round(y / 100 * height)}px, 0) translate(-50%, -50%)`,
      opacity: String(Math.round(opacity * 100) / 100),
      zIndex: String(18 + Math.round(depth * 46)),
      '--seal-scale': String(Math.round(scale * 100) / 100),
      pointerEvents: interactive ? 'auto' : 'none',
    } as CSSProperties,
  };
}

const orbitStyles = computed<OrbitVisual[]>(() => activeCatalog.value.map((_, index) => {
  if (phase.value !== 'orbit') return assemblyStyle(index);
  const delta = signedWrap(index - rotation.value, activeCatalog.value.length);
  const angle = -Math.PI / 2 - delta * ((Math.PI * 2) / activeCatalog.value.length);
  const depth = (Math.sin(angle) + 1) / 2;
  return place(50 + Math.cos(angle) * ORBIT_RADIUS_X, 50 + Math.sin(angle) * ORBIT_RADIUS_Y, depth, .78 + depth * .22, .84 + depth * .16, true);
}));

function assemblyStyle(index: number): OrbitVisual {
  const count = activeCatalog.value.length;
  const visibleCount = assemblyProgress.value * count;
  const entryProgress = clamp(visibleCount - index, 0, 1);
  if (entryProgress <= 0) return { hidden: true, behind: true, style: {} };
  const eased = easeOut(entryProgress);
  // Each new route arrives beside the top of the orbit and pushes every route
  // already present around the ring. This converges exactly to the completed
  // orbit order, avoiding a final-frame remap when the last seal arrives.
  const orbitSlot = visibleCount - index - rotation.value;
  const angle = -Math.PI / 2 + orbitSlot * ((Math.PI * 2) / count);
  const depth = (Math.sin(angle) + 1) / 2;
  return place(
    mix(-14, 50 + Math.cos(angle) * ORBIT_RADIUS_X, eased),
    mix(50, 50 + Math.sin(angle) * ORBIT_RADIUS_Y, eased),
    depth,
    .6 + depth * .2 + eased * .2,
    eased * (.84 + depth * .16),
    entryProgress > .94,
  );
}

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function mix(from: number, to: number, amount: number) { return from + (to - from) * amount; }
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
  // Avoid invalidating every token style for sub-pixel scroll deltas.
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
  rotation.value = 0;
  targetRotation.value = 0;
  userChose = true;
  requestAnimationFrame(() => mobileRailRef.value?.scrollTo({ left: 0, behavior: reducedMotion.value ? 'auto' : 'smooth' }));
  const entry = activeCatalog.value[0];
  if (entry) emit('selected', entry);
}

/** Tabs pattern: arrows/Home/End move focus and activate (automatic activation). */
function onTabKeydown(event: KeyboardEvent, suffix: string) {
  const ids = catalogOptions.value.map((option) => option.id);
  const current = ids.indexOf(activeKind.value);
  const target = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: 0, End: ids.length - 1 }[event.key];
  if (target === undefined) return;
  event.preventDefault();
  const kind = ids[normalizeIndex(target, ids.length)];
  setKind(kind);
  void nextTick(() => document.getElementById(`${kind}${suffix}-tab`)?.focus());
}

function snapTo(index: number) {
  if (!activeCatalog.value.length) return;
  const normalized = normalizeIndex(index);
  const current = Math.round(rotation.value);
  targetRotation.value = current + signedWrap(normalized - normalizeIndex(current), activeCatalog.value.length);
  selectedIndex.value = normalized;
  userChose = true;
  emit('selected', activeCatalog.value[normalized]);
  startOrbitAnimation();
}

function previous() { if (interactionReady.value) snapTo(selectedIndex.value - 1); }
function next() { if (interactionReady.value) snapTo(selectedIndex.value + 1); }

/** Radio-group keys: arrows turn the orbit and keep focus on the chosen seal. */
function onRingKeydown(event: KeyboardEvent) {
  if (!interactionReady.value) return;
  const length = activeCatalog.value.length;
  const target = {
    ArrowLeft: selectedIndex.value - 1, ArrowUp: selectedIndex.value - 1,
    ArrowRight: selectedIndex.value + 1, ArrowDown: selectedIndex.value + 1,
    Home: 0, End: length - 1,
  }[event.key];
  if (target === undefined) return;
  event.preventDefault();
  snapTo(target);
  void nextTick(() => orbitStageRef.value?.querySelector<HTMLElement>(`[data-index="${selectedIndex.value}"]`)?.focus());
}

/** A click on a seal selects it; a click on the selected seal opens its dossier. */
function chooseToken(index: number, event: Event) {
  if (interactionReady.value && index !== selectedIndex.value) {
    snapTo(index);
    return;
  }
  openEntry(index, event);
}

function openEntry(index: number, event: Event) {
  if (index !== selectedIndex.value || !userChose) {
    selectedIndex.value = index;
    userChose = true;
    // The assembling layout is driven only by scroll, so it is not rotated.
    if (interactionReady.value) snapTo(index);
    else emit('selected', activeCatalog.value[index]);
  }
  void openDetails(event);
}

function warmCatalog(kind: ProgressionKind) {
  if (kind === activeKind.value || warmedCatalogs.has(kind)) return;
  warmedCatalogs.add(kind);
  catalogWarmTimer = window.setTimeout(() => {
    (kind === 'pathway' ? standardPathways : boonPathways).forEach((entry) => warmImage(entry.thumbnail));
  }, 180);
}

function warmImage(src: string) {
  const image = new Image();
  image.decoding = 'async';
  image.src = src;
  catalogImageWarmers.push(image);
}

function warmNative(index: number) {
  const entry = activeCatalog.value[normalizeIndex(index)];
  if (!entry || warmedNatives.has(entry.id)) return;
  warmedNatives.add(entry.id);
  warmImage(entry.image);
}

function warmOpeningSymbols() {
  if (openingSymbolsWarmed) return;
  openingSymbolsWarmed = true;
  openingSymbolWarmTimer = window.setTimeout(() => {
    standardPathways.slice(0, lowPower.value ? 3 : 8).forEach((entry) => warmImage(entry.thumbnail));
    warmImage(standardPathways[0].image);
  }, 0);
}

function startDrag(event: PointerEvent) {
  if (!interactionReady.value || event.button !== 0 || (event.target as HTMLElement).closest('button, a')) return;
  dragging.value = true;
  lastPointerX = event.clientX;
  lastPointerTime = performance.now();
  orbitStageRef.value?.setPointerCapture(event.pointerId);
}

function movePointer(event: PointerEvent) {
  if (!dragging.value || event.pointerType === 'touch') return;
  const now = performance.now();
  // Move the orbit with the pointer so the symbol field feels pulled,
  // rather than pushed away from the drag direction.
  const delta = (event.clientX - lastPointerX) / 92;
  rotation.value += delta;
  targetRotation.value = rotation.value;
  velocity.value = delta / Math.max(8, now - lastPointerTime) * 16;
  lastPointerX = event.clientX;
  lastPointerTime = now;
}

function endDrag(event: PointerEvent) {
  if (!dragging.value) return;
  dragging.value = false;
  if (orbitStageRef.value?.hasPointerCapture(event.pointerId)) orbitStageRef.value.releasePointerCapture(event.pointerId);
  rotation.value += velocity.value * 8;
  const index = normalizeIndex(Math.round(rotation.value));
  targetRotation.value = Math.round(rotation.value);
  if (index !== selectedIndex.value) {
    selectedIndex.value = index;
    userChose = true;
    emit('selected', activeCatalog.value[index]);
  }
  startOrbitAnimation();
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
      userChose = true;
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

function onWindowKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); void closeDetails(); }
}

async function openDetails(event?: Event) {
  orbitStateBeforeDossier = { rotation: rotation.value, targetRotation: targetRotation.value, velocity: velocity.value };
  if (animationFrame) { cancelAnimationFrame(animationFrame); animationFrame = 0; }
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

async function closeDetails(restoreFocus = true) {
  if (!detailsOpen.value) return;
  detailsOpen.value = false;
  window.removeEventListener('keydown', onWindowKeydown);
  document.body.style.overflow = previousBodyOverflow;
  document.body.style.paddingRight = previousBodyPaddingRight;
  document.querySelector<HTMLElement>('#app')?.removeAttribute('inert');
  if (orbitStateBeforeDossier) {
    rotation.value = orbitStateBeforeDossier.rotation;
    targetRotation.value = orbitStateBeforeDossier.targetRotation;
    velocity.value = orbitStateBeforeDossier.velocity;
    orbitStateBeforeDossier = null;
    startOrbitAnimation();
  }
  await nextTick();
  // The trigger may have been the centre story, which is not focusable; fall
  // back to the selected seal so focus never drops to <body>.
  const fallback = orbitStageRef.value?.querySelector<HTMLElement>(`[data-index="${selectedIndex.value}"]`);
  const target = dossierTrigger?.isConnected && dossierTrigger.tabIndex >= 0 ? dossierTrigger : fallback;
  if (restoreFocus) target?.focus();
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

const fallbackImage = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><circle cx="48" cy="48" r="39" fill="none" stroke="#c69b52" stroke-width="2"/><path d="M48 20 58 39l20 9-20 9-10 19-10-19-20-9 20-9Z" fill="#c69b52" opacity=".8"/></svg>')}`;
function replaceBrokenImage(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  if (image.src !== fallbackImage) image.src = fallbackImage;
}

function syncCompactLayout(event?: MediaQueryListEvent) {
  compactLayout.value = event?.matches ?? compactMedia?.matches ?? false;
  refreshScrollTravel();
}

function measureStage(element: Element) {
  const { width, height } = element.getBoundingClientRect();
  if (width !== stageSize.value.width || height !== stageSize.value.height) stageSize.value = { width, height };
}

watch(orbitStageRef, (stage) => {
  stageObserver?.disconnect();
  if (!stage) return;
  measureStage(stage);
  stageObserver ??= new ResizeObserver(([entry]) => measureStage(entry.target));
  stageObserver.observe(stage);
});

watch(interactionReady, (ready) => {
  if (!ready) return;
  if (!userChose) selectedIndex.value = assemblyIndex.value;
  rotation.value = selectedIndex.value;
  targetRotation.value = selectedIndex.value;
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
  stageObserver?.disconnect();
  window.removeEventListener('scroll', scheduleScrollMeasure);
  window.removeEventListener('resize', refreshScrollTravel);
  window.removeEventListener('resize', scheduleScrollMeasure);
  window.removeEventListener('keydown', onWindowKeydown);
  if (animationFrame) cancelAnimationFrame(animationFrame);
  if (scrollFrame) cancelAnimationFrame(scrollFrame);
  window.clearTimeout(mobileScrollTimer);
  window.clearTimeout(catalogWarmTimer);
  window.clearTimeout(openingSymbolWarmTimer);
  if (detailsOpen.value) {
    document.body.style.overflow = previousBodyOverflow;
    document.body.style.paddingRight = previousBodyPaddingRight;
    document.querySelector<HTMLElement>('#app')?.removeAttribute('inert');
  }
});
</script>

<style scoped>
.pathway-vault {
  --path-accent: var(--primary, #7458e8);
  --path-ink: var(--ink, #221c14);
  --path-surface: var(--surface, #fff);
  --path-haze: #efecfa;
  --motif-accent: var(--path-accent);
  --scene-top: calc(var(--home-header-height, 72px) + clamp(18px, 3.4vh, 40px));
  position: relative;
  min-height: 210svh;
  color: var(--path-ink);
  background-color: transparent;
}

.ambient-field { position: absolute; inset: 0; overflow: clip; pointer-events: none; }
.ambient-field__haze {
  position: sticky; top: 0; display: block; height: 100svh;
  background:
    radial-gradient(circle at 50% 48%, color-mix(in srgb, var(--path-haze) 48%, transparent), transparent 35%),
    radial-gradient(circle at 15% 70%, color-mix(in srgb, var(--champagne, #c8943f) 18%, transparent), transparent 30%),
    radial-gradient(circle at 88% 25%, color-mix(in srgb, var(--path-accent) 15%, transparent), transparent 26%);
}
.is-low-power .ambient-field__haze { background: radial-gradient(circle at 50% 48%, color-mix(in srgb, var(--path-haze) 38%, transparent), transparent 42%); }

.desktop-experience { height: 210svh; }
.sticky-scene { position: sticky; top: 0; height: 100svh; min-height: 700px; overflow: clip; }
.vault-heading { position: absolute; z-index: 90; top: var(--scene-top); left: var(--home-rail-inset, clamp(20px, 4vw, 56px)); width: min(440px, 31vw); pointer-events: none; }
/* Seals pass behind the heading; a paper halo keeps it from reading as a collision. */
.vault-heading::before { content: ""; position: absolute; z-index: -1; inset: -64px -90px -110px -160px; background: radial-gradient(closest-side, color-mix(in srgb, var(--journey-mid, #f5eee1) 94%, transparent) 72%, transparent); }
.vault-heading > p, .mobile-heading > p { margin: 0 0 14px; color: var(--path-accent); font: 800 .75rem/1 var(--font-body, Manrope, sans-serif); letter-spacing: .16em; text-transform: uppercase; }
.vault-heading h2, .mobile-heading h2 { margin: 0; font: 700 clamp(2.6rem, 4.6vw, 5rem)/.92 var(--font-display, "IBM Plex Sans Condensed", sans-serif); letter-spacing: -.028em; text-wrap: balance; overflow-wrap: anywhere; }
.vault-heading h2 em, .mobile-heading h2 em { color: var(--path-accent); font-style: normal; }
.vault-heading > span { display: block; max-width: 340px; margin-top: 20px; color: color-mix(in srgb, var(--path-ink) 76%, transparent); font-size: .875rem; font-weight: 500; line-height: 1.6; }

.catalog-tabs { position: absolute; z-index: 100; top: var(--scene-top); right: var(--home-rail-inset, clamp(20px, 4vw, 56px)); display: flex; min-height: 48px; padding: 4px; border: 1px solid color-mix(in srgb, var(--path-ink) 18%, transparent); border-radius: 999px; background: color-mix(in srgb, var(--path-surface) 82%, transparent); backdrop-filter: blur(16px); }
.catalog-tabs button { min-width: 124px; min-height: 44px; display: flex; align-items: center; justify-content: center; gap: 10px; border: 0; border-radius: 999px; color: color-mix(in srgb, var(--path-ink) 76%, transparent); background: transparent; cursor: pointer; font: 700 .8rem/1 var(--font-body, Manrope, sans-serif); transition: background-color .2s, color .2s; }
.catalog-tabs button:hover { color: var(--path-ink); background: var(--primary-tint, rgba(116, 88, 232, .12)); }
.catalog-tabs button b { min-width: 24px; height: 24px; display: grid; place-items: center; border-radius: 99px; color: currentColor; background: color-mix(in srgb, var(--path-ink) 9%, transparent); font: 700 .7rem/1 var(--font-body, Manrope, sans-serif); }
.catalog-tabs button[aria-selected="true"] { color: #fff; background: var(--path-accent); }
.catalog-tabs button[aria-selected="true"] b { background: rgba(255, 255, 255, .22); }

.orbit-stage { position: absolute; z-index: 10; inset: 0; cursor: grab; touch-action: pan-y; user-select: none; contain: layout paint; }
.orbit-stage:active { cursor: grabbing; }
.orbit-ring { position: absolute; inset: 0; pointer-events: none; }
.orbit-token { position: absolute; top: 0; left: 0; width: 116px; display: grid; justify-items: center; align-content: start; gap: 6px; padding: 4px; border: 0; color: var(--path-ink); background: transparent; cursor: pointer; will-change: transform, opacity; }
.pathway-vault:not(.is-interactive) .orbit-token { transition: transform .08s cubic-bezier(.22, 1, .36, 1), opacity .06s linear; }
.orbit-token:hover, .orbit-token:focus-visible, .orbit-token.is-selected { z-index: 75 !important; }
.orbit-token:focus-visible { outline: 3px solid var(--primary); outline-offset: 2px; border-radius: 18px; }
.token-seal { position: relative; width: 66px; height: 66px; display: grid; place-items: center; border: 1px solid var(--hairline); border-radius: 50%; background: var(--surface, #fff); box-shadow: 0 10px 22px rgba(34,28,20,.12); transform: scale(var(--seal-scale, 1)); transition: transform .16s ease-out, border-color .16s, box-shadow .16s; }
.token-seal img { width: 54px; height: 54px; object-fit: contain; filter: drop-shadow(0 6px 10px rgba(34,28,20,.2)); }
/* Hover only previews: a lift on the seal. The centre keeps the committed choice. */
.orbit-token:hover .token-seal, .orbit-token:focus-visible .token-seal { border-color: color-mix(in srgb, var(--primary) 55%, var(--hairline)); transform: scale(calc(var(--seal-scale, 1) * 1.1)); }
.orbit-token.is-selected .token-seal { border: 2px solid var(--primary); box-shadow: 0 0 0 6px var(--primary-tint, rgba(116,88,232,.12)), 0 14px 28px rgba(34,28,20,.16); transform: scale(calc(var(--seal-scale, 1) * 1.16)); }
.orbit-token > strong { max-width: 116px; color: color-mix(in srgb, var(--path-ink) 82%, transparent); font: 700 .8rem/1.2 var(--font-body, Manrope, sans-serif); text-wrap: balance; }
.orbit-token.is-behind > strong { color: var(--ink-muted); }
.orbit-token:hover > strong, .orbit-token:focus-visible > strong { color: var(--path-ink); }
.orbit-token.is-selected > strong { color: var(--primary-deep, #5c42d0); }
.is-low-power .token-seal { box-shadow: none; }
.is-low-power .token-seal img, .is-low-power .motif-stage img { filter: none; }

.orbit-story { position: absolute; z-index: 42; left: 50%; top: 47%; width: min(520px, 40vw); color: inherit; transform: translate(-50%, -50%); text-align: center; cursor: pointer; }
.orbit-story-enter-active { transition: opacity .34s ease-out, transform .52s cubic-bezier(.22, 1, .36, 1); }
.orbit-story-enter-from { opacity: 0; transform: translate(-50%, -34%) scale(.92); }
.orbit-story-leave-active { transition: opacity .24s ease-in, transform .34s cubic-bezier(.4, 0, 1, 1); }
.orbit-story-leave-to { opacity: 0; transform: translate(-50%, -58%) scale(.96); }
.motif-stage { position: relative; width: clamp(132px, 13vw, 184px); aspect-ratio: 1; display: grid; place-items: center; margin: 0 auto 13px; }
.motif-stage::before { content: ""; position: absolute; inset: 4%; border: 1px solid color-mix(in srgb, var(--path-accent) 52%, transparent); border-radius: 50%; box-shadow: 0 0 60px color-mix(in srgb, var(--path-haze) 46%, transparent); }
.motif-stage img { position: relative; z-index: 4; width: 72%; height: 72%; object-fit: contain; filter: drop-shadow(0 18px 22px rgba(34,28,20,.24)); }
.orbit-story h3 { margin: 0; max-width: 100%; font: 700 clamp(2.15rem, 3.35vw, 3.8rem)/.98 var(--font-display, "IBM Plex Sans Condensed", sans-serif); letter-spacing: -.028em; overflow-wrap: anywhere; }
.entry-kind { display: block; margin-top: 10px; color: color-mix(in srgb, var(--path-ink) 78%, transparent); font: 800 .75rem/1.2 var(--font-body, Manrope, sans-serif); letter-spacing: .1em; text-transform: uppercase; }
.orbit-story > small { display: block; max-width: 420px; margin: 12px auto 0; color: color-mix(in srgb, var(--path-ink) 78%, transparent); font-size: .875rem; font-weight: 500; line-height: 1.5; overflow-wrap: anywhere; }

/* Each pathway draws its own figure behind the emblem, in its symbol color. */
.motif-stage::after { content: ""; position: absolute; inset: 0; border: 1px dashed color-mix(in srgb, var(--motif-accent) 42%, transparent); border-radius: 50%; pointer-events: none; }
.motif-chain .motif-stage::after { border-radius: 999px; transform: rotate(38deg) scale(.66, 1.2); }
.motif-eclipse .motif-stage::after, .motif-moon .motif-stage::after { inset: 9% 25% 9% 3%; border-style: solid; box-shadow: 24px 0 0 -3px var(--path-surface); }
.motif-bone .motif-stage::after, .motif-sword .motif-stage::after, .motif-blade .motif-stage::after { inset: 4% 47%; border-radius: 999px; transform: rotate(42deg); border-style: solid; }
.motif-door .motif-stage::after, .motif-pages .motif-stage::after, .motif-canvas .motif-stage::after { inset: 7% 24%; border-radius: 50% 50% 4% 4%; border-style: solid; }
.motif-crown .motif-stage::after, .motif-sun .motif-stage::after, .motif-star .motif-stage::after { inset: 2%; border-radius: 4%; transform: rotate(45deg) scale(.62); border-style: solid; }
.motif-glitch .motif-stage::after, .motif-fracture .motif-stage::after { inset: 13% 4%; border-radius: 0; transform: skew(-22deg) rotate(-12deg); }
.motif-cards .motif-stage::after, .motif-runes .motif-stage::after, .motif-sigil .motif-stage::after { inset: 9% 28%; border-radius: 8px; transform: rotate(27deg); border-style: solid; }
.motif-wheel .motif-stage::after, .motif-gear .motif-stage::after, .motif-clock .motif-stage::after, .motif-ring .motif-stage::after { inset: 8%; border: 7px double color-mix(in srgb, var(--motif-accent) 40%, transparent); }
.motif-cross .motif-stage::after, .motif-scales .motif-stage::after { inset: 10% 48%; border-radius: 0; border-style: solid; }
.motif-vine .motif-stage::after, .motif-plague .motif-stage::after { inset: 4% 35% 4% 15%; border-radius: 60% 10% 60% 10%; transform: rotate(32deg); border-style: solid; }
.motif-flame .motif-stage::after, .motif-maw .motif-stage::after { inset: 7% 28% 12%; border-radius: 70% 25% 65% 35%; transform: rotate(45deg); border-style: solid; }
.motif-storm .motif-stage::after, .motif-mist .motif-stage::after { inset: 34% -3%; transform: skew(-18deg); border-style: solid; }
.motif-eye .motif-stage::after { inset: 24% 3%; border-radius: 70% 10% 70% 10%; transform: rotate(45deg); border-style: solid; }
.motif-coin .motif-stage::after { inset: 11%; transform: rotate(28deg); border: 5px double color-mix(in srgb, var(--motif-accent) 44%, transparent); }

.orbit-controls { position: absolute; z-index: 86; left: var(--home-rail-inset, clamp(20px, 4vw, 56px)); bottom: clamp(32px, 5vh, 64px); display: grid; grid-template-columns: 48px auto 48px; align-items: center; gap: 12px; }
.orbit-controls p { grid-column: 1 / -1; margin: 0; color: var(--ink-muted); font: 600 .75rem/1.3 var(--font-body, Manrope, sans-serif); }
.orbit-controls button, .mobile-pagination button { width: 48px; height: 48px; border: 1px solid color-mix(in srgb, var(--path-ink) 25%, transparent); border-radius: 50%; color: var(--path-ink); background: color-mix(in srgb, var(--path-surface) 76%, transparent); cursor: pointer; font-size: 1rem; transition: background-color .2s, color .2s, border-color .2s; }
.orbit-controls button:hover, .mobile-pagination button:hover { border-color: var(--primary); color: #fff; background: var(--path-accent); }
.orbit-controls > span, .mobile-pagination > span { min-width: 72px; color: var(--ink-muted); font: 600 .8rem/1 var(--font-body, Manrope, sans-serif); text-align: center; font-variant-numeric: tabular-nums; }
.orbit-controls > span b, .mobile-pagination > span b { color: var(--path-accent); font-size: 1rem; }
.orbit-ui-enter-active, .orbit-ui-leave-active { transition: opacity .45s, transform .45s cubic-bezier(.22,1,.36,1); }
.orbit-ui-enter-from, .orbit-ui-leave-to { opacity: 0; transform: translateY(12px); }
.open-dossier { position: absolute; z-index: 86; right: var(--home-rail-inset, clamp(20px, 4vw, 56px)); bottom: clamp(32px, 5vh, 64px); min-height: 48px; display: inline-flex; align-items: center; gap: 8px; padding: 0 20px; border: 1px solid color-mix(in srgb, var(--path-ink) 22%, transparent); border-radius: 999px; color: var(--path-ink); background: color-mix(in srgb, var(--path-surface) 76%, transparent); cursor: pointer; transition: background-color .25s, color .25s; font: 750 .8rem/1 var(--font-body, Manrope, sans-serif); white-space: nowrap; }
.open-dossier:hover { color: #fff; background: var(--path-accent); }

.mobile-experience { display: none; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

.dossier-scrim { position: fixed; z-index: 2000; inset: 0; overflow: hidden; isolation: isolate; background: rgba(34, 28, 20, .32); backdrop-filter: blur(8px); }
.pathway-dossier { --path-accent: #7458E8; position: fixed; top: clamp(12px, 3vw, 38px); right: clamp(12px, 3vw, 38px); bottom: clamp(12px, 3vw, 38px); width: min(490px, calc(100vw - 24px)); box-sizing: border-box; display: flex; flex-direction: column; align-items: flex-start; overflow: auto; overscroll-behavior: contain; padding: clamp(28px, 4.4vw, 52px); border: 1px solid var(--hairline); border-radius: 28px; color: #221C14; background: #FFFFFF; box-shadow: 0 35px 100px rgba(34,28,20,.22); outline: 0; will-change: transform; }
.dossier-close { position: absolute; z-index: 3; top: 18px; right: 18px; width: 48px; height: 48px; border: 1px solid var(--hairline); border-radius: 50%; color: #221C14; background: transparent; cursor: pointer; font-size: 1.5rem; }
.dossier-close:hover { border-color: var(--primary); color: var(--primary-deep); }
.dossier-symbol { position: relative; flex: none; width: 168px; aspect-ratio: 1; display: grid; place-items: center; margin-bottom: 32px; border: 1px solid color-mix(in srgb, var(--path-accent) 52%, transparent); border-radius: 50%; background: radial-gradient(circle, color-mix(in srgb, var(--path-accent) 22%, transparent), transparent 68%); }
.dossier-symbol img { width: 78%; height: 78%; object-fit: contain; }
.pathway-dossier > p { margin: 0 0 12px; color: var(--path-accent); font: 800 .75rem/1 Manrope, sans-serif; letter-spacing: .16em; text-transform: uppercase; }
/* Two lines are reserved so short and long names leave the rest of the panel where it was. */
.pathway-dossier h3 { display: flex; align-items: flex-end; min-height: 1.8em; margin: 0; font: 800 clamp(2.6rem, 4.4vw, 4rem)/.9 Manrope, sans-serif; letter-spacing: -.04em; text-wrap: balance; overflow-wrap: anywhere; }
.pathway-dossier > strong { display: block; margin-top: 16px; color: var(--path-accent); font: 700 .875rem/1.3 Manrope, sans-serif; }
.pathway-dossier > span { display: block; min-height: 3em; margin-top: 12px; color: var(--ink-muted); font-size: .9375rem; font-weight: 500; line-height: 1.55; }
.pathway-dossier dl { align-self: stretch; margin: 28px 0; border-top: 1px solid var(--hairline); }
.pathway-dossier dl div { display: grid; grid-template-columns: 120px 1fr; gap: 15px; padding: 16px 0; border-bottom: 1px solid var(--hairline); }
.pathway-dossier dt { color: var(--ink-muted); font: 700 .75rem/1.4 Manrope, sans-serif; letter-spacing: .06em; text-transform: uppercase; }
.pathway-dossier dd { margin: 0; color: #221C14; font-size: .875rem; font-weight: 500; line-height: 1.5; }
.pathway-dossier > a { align-self: stretch; min-height: 50px; display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding: 0 20px; border-radius: 999px; color: #fff; background: var(--path-accent); font-size: .875rem; font-weight: 800; text-decoration: none; transition: background-color .2s; }
.pathway-dossier > a:hover { background: var(--primary-deep, #5c42d0); }
.dossier-enter-active, .dossier-leave-active { transition: opacity .35s; }
.dossier-enter-active .pathway-dossier, .dossier-leave-active .pathway-dossier { transition: transform .55s cubic-bezier(.22,1,.36,1); }
.dossier-enter-from, .dossier-leave-to { opacity: 0; }
.dossier-enter-from .pathway-dossier, .dossier-leave-to .pathway-dossier { transform: translateX(50px); }

button:focus-visible, a:focus-visible, .mobile-rail:focus-visible { outline: 3px solid var(--primary); outline-offset: 3px; }

@media (max-width: 1050px), (max-height: 720px), (prefers-reduced-motion: reduce) {
  .pathway-vault { min-height: auto; padding: 100px 0 80px; overflow: clip; }
  .desktop-experience { display: none; }
  .mobile-experience { display: block; }
  .mobile-heading { width: min(720px, calc(100% - var(--home-content-gutter, 20px) - var(--home-content-gutter, 20px))); margin: 0 auto 38px; }
  .mobile-heading h2 { font-size: clamp(3.2rem, 10vw, 6rem); }
  .mobile-heading > span { display: block; max-width: 480px; margin-top: 18px; color: color-mix(in srgb, var(--path-ink) 76%, transparent); font-size: .9375rem; font-weight: 500; line-height: 1.6; }
  .catalog-tabs--mobile { position: relative; top: auto; right: auto; width: fit-content; margin: 0 auto 28px; margin-left: max(var(--home-content-gutter, 20px), calc((100% - 720px) / 2)); }
  .mobile-rail { display: flex; gap: 16px; overflow-x: auto; padding: 4px max(20px, calc((100vw - 620px) / 2)) 25px; scroll-snap-type: x mandatory; scrollbar-width: none; overscroll-behavior-x: contain; }
  .mobile-rail::-webkit-scrollbar { display: none; }
  .mobile-card { flex: 0 0 min(620px, calc(100vw - 40px)); min-height: 560px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 42px clamp(24px, 7vw, 60px); border: 1px solid color-mix(in srgb, var(--path-ink) 16%, transparent); border-radius: 28px; background: radial-gradient(circle at 50% 34%, color-mix(in srgb, var(--path-haze) 36%, transparent), transparent 33%), color-mix(in srgb, var(--path-surface) 82%, transparent); scroll-snap-align: center; text-align: center; }
  .mobile-card__visual { position: relative; width: 215px; aspect-ratio: 1; display: grid; place-items: center; margin-bottom: 28px; border: 1px solid color-mix(in srgb, var(--path-accent) 48%, transparent); border-radius: 50%; }
  .mobile-card__visual img { width: 78%; height: 78%; object-fit: contain; filter: drop-shadow(0 16px 22px rgba(34,28,20,.22)); }
  .mobile-card__visual b { position: absolute; right: 2px; bottom: 17px; width: 34px; height: 34px; display: grid; place-items: center; border-radius: 50%; color: #fff; background: var(--path-accent); font: 750 .75rem/1 var(--font-body, Manrope, sans-serif); }
  .mobile-card > p { margin: 0 0 10px; color: var(--path-accent); font: 800 .75rem/1.2 var(--font-body, Manrope, sans-serif); letter-spacing: .1em; text-transform: uppercase; }
  .mobile-card h3 { margin: 0; font: 800 clamp(3rem, 10vw, 5.6rem)/.86 var(--font-body, Manrope, sans-serif); letter-spacing: -.045em; text-wrap: balance; overflow-wrap: anywhere; }
  .mobile-card > small { max-width: 380px; margin: 16px 0 26px; color: color-mix(in srgb, var(--path-ink) 76%, transparent); font-size: .9375rem; font-weight: 500; line-height: 1.5; }
  .mobile-card > button { min-height: 48px; display: inline-flex; align-items: center; gap: 8px; margin-top: auto; padding: 0 20px; border: 0; border-radius: 999px; color: #fff; background: var(--path-accent); cursor: pointer; font-size: .875rem; font-weight: 800; }
  .mobile-pagination { display: flex; align-items: center; justify-content: center; gap: 20px; margin-top: 16px; }
}

@media (max-width: 580px) {
  .pathway-vault { padding-top: 82px; }
  .catalog-tabs--mobile { width: calc(100% - 40px); margin-left: 20px; }
  .catalog-tabs button { flex: 1; min-width: 0; }
  .mobile-card { min-height: 520px; }
  .pathway-dossier { top: auto; right: 8px; bottom: 8px; width: calc(100% - 16px); height: min(88svh, 760px); border-radius: 24px; }
}

@media (prefers-reduced-motion: reduce) {
  .mobile-rail { scroll-behavior: auto; }
  .orbit-token, .token-seal, .motif-stage img, .dossier-enter-active, .dossier-leave-active, .dossier-enter-active .pathway-dossier, .dossier-leave-active .pathway-dossier { transition: none !important; }
}
</style>
