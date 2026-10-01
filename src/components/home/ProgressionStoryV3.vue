<template>
  <section
    id="progression"
    ref="sectionRef"
    class="progression-v3"
    :style="{ '--journey': progress.toFixed(4), '--entry': entryProgress.toFixed(4) }"
    aria-labelledby="progression-title"
  >
    <div class="progression-v3__sticky">
      <div class="progression-v3__backdrop" aria-hidden="true">
        <img :src="breweryScene" alt="" width="1920" height="1017" decoding="async">
      </div>
      <div class="progression-v3__wash" aria-hidden="true" />
      <div class="progression-v3__threshold-fog" aria-hidden="true"><i /><i /></div>

      <header class="progression-v3__heading">
        <p>{{ tp('eyebrow') }}</p>
        <h2 id="progression-title">{{ tp('title') }}</h2>
        <span>{{ tp('tagline') }}</span>
      </header>

      <div class="progression-v3__layout">
        <Transition name="chapter-copy" mode="out-in">
          <article :key="activeChapter.id" class="chapter-copy">
            <p class="chapter-copy__kicker">{{ chapterText(activeChapter.id, 'kicker') }}</p>
            <h3>{{ chapterText(activeChapter.id, 'title') }}</h3>
            <p class="chapter-copy__body">{{ chapterText(activeChapter.id, 'copy') }}</p>
            <p class="chapter-copy__hint"><i aria-hidden="true" />{{ chapterText(activeChapter.id, 'hint') }}</p>
          </article>
        </Transition>

        <div ref="stageRef" class="progression-v3__stage" @click="onStageClick">
          <div
            class="scene-window"
            :style="bookWindowStyle"
            :aria-hidden="bookOpacity < 0.5"
          >
            <FormulaBookScene
              :progress="bookLocal"
              :closing-progress="bookClosingLocal"
              :active="bookOpacity > 0.5"
              :warm="near"
              @inspect="showDetail"
              @clear-inspect="clearDetail"
            />
          </div>
          <div
            class="scene-window"
            :style="altarWindowStyle"
            :aria-hidden="altarOpacity < 0.5"
          >
            <AltarBrewScene
              :progress="altarLocal"
              :active="altarOpacity > 0.5"
              @inspect="showDetail"
              @clear-inspect="clearDetail"
            />
          </div>
          <div
            class="scene-window"
            :style="drinkWindowStyle"
            :aria-hidden="drinkOpacity < 0.5"
          >
            <DrinkAwakenScene
              :progress="drinkLocal"
              :active="drinkOpacity > 0.5"
              :warm="progress >= TIMELINE.playerWarm"
              @inspect="showDetail"
              @clear-inspect="clearDetail"
            />
          </div>

          <SceneInspectorPopover
            :id="activeHotspotId ? `progression-v3-detail-${activeHotspotId}` : undefined"
            :open="Boolean(activeDetail && inspectorAnchor)"
            :anchor="inspectorAnchor"
            :boundary="stageRef"
            :title="activeDetail?.label"
            :description="activeDetail?.detail"
          />
        </div>
      </div>

      <nav class="progression-nav" :aria-label="tp('navLabel')">
        <button
          v-for="(chapter, index) in chapters"
          :key="chapter.id"
          type="button"
          :class="{ active: activeChapterIndex === index, complete: activeChapterIndex > index }"
          :aria-current="activeChapterIndex === index ? 'step' : undefined"
          @click="goToChapter(index)"
        >
          <i aria-hidden="true">
            <svg v-if="activeChapterIndex > index" viewBox="0 0 12 12" focusable="false"><path d="M2.5 6.4 5 8.8l4.6-5.3" /></svg>
          </i>
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ chapterText(chapter.id, 'short') }}</strong>
          <em v-if="activeChapterIndex > index" class="sr-only">{{ tp('navCompleted') }}</em>
        </button>
      </nav>
      <div class="progression-line" aria-hidden="true"><i :style="{ transform: `scaleX(${progress.toFixed(4)})` }" /></div>
    </div>

    <ol class="progression-static">
      <li v-for="(chapter, index) in chapters" :key="chapter.id">
        <span>{{ String(index + 1).padStart(2, '0') }}</span>
        <div>
          <small>{{ chapterText(chapter.id, 'kicker') }}</small>
          <h3>{{ chapterText(chapter.id, 'title') }}</h3>
          <p>{{ chapterText(chapter.id, 'copy') }}</p>
        </div>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useReducedMotion } from '@/composables/useReducedMotion';
import FormulaBookScene from './progression3/FormulaBookScene.vue';
import AltarBrewScene from './progression3/AltarBrewScene.vue';
import DrinkAwakenScene from './progression3/DrinkAwakenScene.vue';
import SceneInspectorPopover from './SceneInspectorPopover.vue';
import { preloadPathwayNames, useProgressionCopy } from './progression3/useProgressionCopy';
import breweryScene from '@/assets/images/home/progression/brewery-scene.webp';

/*
 * One timeline (fractions of the pinned scroll) drives the scenes, the chapter
 * rail and chapter navigation, so the rail can never name a chapter the stage
 * is not showing.
 */
const BOOK = { start: 0, end: 0.28, closeStart: 0.412, closeEnd: 0.515, fadeOutStart: 0.485, fadeOutEnd: 0.525 };
const ALTAR = { start: 0.38, end: 0.68, fadeInStart: 0.39, fadeInEnd: 0.43, fadeOutStart: 0.68, fadeOutEnd: 0.71 };
const DRINK = { start: 0.68, end: 1, fadeInStart: 0.66, fadeInEnd: 0.69 };
const altarAt = (local: number) => ALTAR.start + (ALTAR.end - ALTAR.start) * local;
const drinkAt = (local: number) => DRINK.start + (DRINK.end - DRINK.start) * local;
const TIMELINE = {
  // Chapter starts follow the first visible beat of each step: the book
  // closing as the ingredients take flight, the cauldron starting to brew,
  // the altar/drink cross-fade midpoint, and the awakening flash.
  infuse: BOOK.closeStart,
  brew: altarAt(0.55),
  drink: (ALTAR.fadeOutStart + ALTAR.fadeOutEnd) / 2,
  awaken: drinkAt(0.6),
  // Book hotspots stop being readable once the pages start closing.
  bookReadableUntil: BOOK.closeStart,
  altarReadableUntil: ALTAR.fadeOutEnd,
  // skinview3d/WebGL for the player is created only once the story is close.
  playerWarm: 0.5,
};

type ChapterId = 'discover' | 'infuse' | 'brew' | 'drink' | 'awaken';
type Chapter = { id: ChapterId; start: number; end: number; landing: number };

// `landing` is where chapter navigation scrolls to: a settled frame of that step.
const chapters: Chapter[] = [
  { id: 'discover', start: 0, end: TIMELINE.infuse, landing: BOOK.end + 0.02 },
  { id: 'infuse', start: TIMELINE.infuse, end: TIMELINE.brew, landing: altarAt(0.5) + 0.005 },
  { id: 'brew', start: TIMELINE.brew, end: TIMELINE.drink, landing: altarAt(0.93) },
  { id: 'drink', start: TIMELINE.drink, end: TIMELINE.awaken, landing: drinkAt(0.38) },
  { id: 'awaken', start: TIMELINE.awaken, end: 1, landing: 1 },
];

const { tp, names } = useProgressionCopy();

function chapterText(id: ChapterId, field: 'short' | 'kicker' | 'title' | 'copy' | 'hint'): string {
  return tp(`chapters.${id}.${field}`);
}

type DetailScene = 'book' | 'altar' | 'drink';
type Detail = { label: string; detail: string };

const detailScenes: Record<string, DetailScene> = {
  'formula-fool': 'book',
  'lavos-squid-blood': 'book',
  'stellar-aqua-crystal': 'book',
  'gold-mint-leaves': 'book',
  'brew-recipe-slot': 'altar',
  'brew-main-slots': 'altar',
  'brew-supp-slots': 'altar',
  'brew-circle': 'altar',
  'sequence-potion': 'altar',
  'drink-potion': 'drink',
  'ability-teaser': 'drink',
};

function resolveDetail(id: string): Detail | null {
  const pair = (key: string): Detail => ({ label: tp(`details.${key}.label`), detail: tp(`details.${key}.detail`) });
  const ingredient = (key: string): Detail => ({ label: tp(`ingredients.${key}`), detail: tp(`details.${key}`) });
  switch (id) {
    case 'formula-fool': return pair('formula');
    case 'lavos-squid-blood': return ingredient('lavosSquidBlood');
    case 'stellar-aqua-crystal': return ingredient('stellarAquaCrystal');
    case 'gold-mint-leaves': return ingredient('goldMintLeaves');
    case 'brew-recipe-slot': return pair('recipeSlot');
    case 'brew-main-slots': return pair('mainSlots');
    case 'brew-supp-slots': return pair('supplementarySlots');
    case 'brew-circle': return pair('circle');
    case 'sequence-potion': return pair('sequencePotion');
    case 'drink-potion': return pair('drinkPotion');
    case 'ability-teaser': return pair('nextSequence');
  }
  if (id.startsWith('ability-')) {
    const ability = names.value.abilities.find((entry) => `ability-${entry.id}` === id);
    if (ability) return { label: tp('details.abilityLabel', { ability: ability.name }), detail: ability.description };
  }
  return null;
}

const sectionRef = ref<HTMLElement | null>(null);
const stageRef = ref<HTMLElement | null>(null);
const progress = ref(0);
const entryProgress = ref(0);
const visible = ref(false);
// True once the chapter is within about a viewport: starts lazy downloads.
const near = ref(false);
const reducedMotion = useReducedMotion();
const activeHotspotId = ref<string | null>(null);
const inspectorAnchor = ref<HTMLElement | null>(null);
const inspectorScene = ref<DetailScene | null>(null);
let observer: IntersectionObserver | null = null;
let nearObserver: IntersectionObserver | null = null;
let frame = 0;

const activeChapterIndex = computed(() => {
  const g = progress.value;
  const index = chapters.findIndex((chapter) => g < chapter.end);
  return index === -1 ? chapters.length - 1 : index;
});
const activeChapter = computed(() => chapters[activeChapterIndex.value]);
const activeDetail = computed(() => (activeHotspotId.value ? resolveDetail(activeHotspotId.value) : null));

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
function windowProgress(start: number, end: number) {
  return clamp01((progress.value - start) / (end - start));
}
function fadeIn(start: number, end: number) {
  return clamp01((progress.value - start) / (end - start));
}
function fadeOut(start: number, end: number) {
  return 1 - clamp01((progress.value - start) / (end - start));
}

const bookLocal = computed(() => windowProgress(BOOK.start, BOOK.end));
// Step two begins with the physical book still on stage. Reverse only the
// opening portion of its pose while the altar settles underneath it, so the
// pages close around the departing ingredients instead of the whole book
// simply cross-fading away.
const bookClosingLocal = computed(() => windowProgress(BOOK.closeStart, BOOK.closeEnd));
const altarLocal = computed(() => windowProgress(ALTAR.start, ALTAR.end));
const drinkLocal = computed(() => windowProgress(DRINK.start, DRINK.end));

const bookOpacity = computed(() => (reducedMotion.value ? 1 : fadeOut(BOOK.fadeOutStart, BOOK.fadeOutEnd)));
const altarOpacity = computed(() => (reducedMotion.value ? 1 : Math.min(
  fadeIn(ALTAR.fadeInStart, ALTAR.fadeInEnd),
  fadeOut(ALTAR.fadeOutStart, ALTAR.fadeOutEnd),
)));
const drinkOpacity = computed(() => (reducedMotion.value ? 1 : fadeIn(DRINK.fadeInStart, DRINK.fadeInEnd)));

function windowStyle(opacity: number) {
  return {
    opacity: opacity.toFixed(4),
    visibility: opacity <= 0.001 ? 'hidden' : 'visible',
    pointerEvents: opacity > 0.5 ? 'auto' : 'none',
  } as const;
}
const bookWindowStyle = computed(() => windowStyle(bookOpacity.value));
const altarWindowStyle = computed(() => windowStyle(altarOpacity.value));
const drinkWindowStyle = computed(() => windowStyle(drinkOpacity.value));

// The inspector is teleported, so it must never outlive the scene that owns
// its anchor. Clearing on a chapter/window transition fixes the stray cards
// that previously remained on-screen after the book or altar had faded away.
watch(activeChapterIndex, () => clearDetail());
watch([bookOpacity, altarOpacity, drinkOpacity], ([book, altar, drink]) => {
  const ownerHasFaded =
    (inspectorScene.value === 'book' && book <= 0.5) ||
    (inspectorScene.value === 'altar' && altar <= 0.5) ||
    (inspectorScene.value === 'drink' && drink <= 0.5);
  if (ownerHasFaded) clearDetail();
});

function showDetail(id: string, anchor: HTMLElement) {
  if (!resolveDetail(id)) return;
  activeHotspotId.value = id;
  inspectorAnchor.value = anchor;
  inspectorScene.value = detailScenes[id] ?? 'drink';
}
function clearDetail() {
  activeHotspotId.value = null;
  inspectorAnchor.value = null;
  inspectorScene.value = null;
}
function onStageClick(event: MouseEvent) {
  if (!(event.target instanceof HTMLElement) || !event.target.closest('button')) clearDetail();
}
// Escape dismisses the inspector wherever focus is (WCAG 1.4.13), not only
// when focus happens to sit inside the stage.
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && activeHotspotId.value) clearDetail();
}
function clearExpiredInspector(nextProgress: number) {
  // A pointer can remain at the same screen coordinate while the sticky scene
  // scrolls underneath it. Do not let a teleported tooltip remain attached to
  // a now-hidden control in that case.
  if (
    (inspectorScene.value === 'book' && nextProgress >= TIMELINE.bookReadableUntil) ||
    (inspectorScene.value === 'altar' && nextProgress >= TIMELINE.altarReadableUntil)
  ) clearDetail();
}

function update() {
  if (!visible.value || !sectionRef.value || reducedMotion.value || frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const rect = sectionRef.value?.getBoundingClientRect();
    if (!rect) return;
    const range = Math.max(1, rect.height - innerHeight);
    entryProgress.value = clamp01(1 - Math.max(0, rect.top) / innerHeight);
    const nextProgress = clamp01(-rect.top / range);
    progress.value = nextProgress;
    clearExpiredInspector(nextProgress);
  });
}
function goToChapter(index: number) {
  const section = sectionRef.value;
  const chapter = chapters[index];
  if (!section || !chapter) return;
  clearDetail();
  const rect = section.getBoundingClientRect();
  const range = rect.height - innerHeight;
  const sectionTop = rect.top + scrollY;
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
  // Without a pinned range (static layout) there is nothing to scrub: just
  // bring the section itself into view.
  const target = range > 1 ? sectionTop + clamp01(chapter.landing) * range : sectionTop;
  const destination = Math.round(Math.min(maxScroll, Math.max(sectionTop, target)));
  scrollTo({ top: destination, behavior: reducedMotion.value ? 'instant' : 'smooth' });
}

onMounted(() => {
  observer = new IntersectionObserver(([entry]) => {
    visible.value = entry.isIntersecting;
    if (visible.value) update();
  }, { rootMargin: '120px 0px' });
  nearObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    near.value = true;
    void preloadPathwayNames();
    nearObserver?.disconnect();
    nearObserver = null;
  }, { rootMargin: '100% 0px' });
  if (sectionRef.value) {
    observer.observe(sectionRef.value);
    nearObserver.observe(sectionRef.value);
  }
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update, { passive: true });
  addEventListener('keydown', onKeydown);
});
onUnmounted(() => {
  observer?.disconnect();
  nearObserver?.disconnect();
  removeEventListener('scroll', update);
  removeEventListener('resize', update);
  removeEventListener('keydown', onKeydown);
  if (frame) cancelAnimationFrame(frame);
});
</script>

<style scoped>
.progression-v3 {
  --entry: 0;
  position: relative;
  min-height: 500svh;
  color: var(--ink, #221c14);
  background: var(--journey-mid, #f4ecdf);
  isolation: isolate;
}

.progression-v3__sticky {
  position: sticky;
  top: 0;
  height: 100svh;
  min-height: 620px;
  overflow: hidden;
  background: var(--journey-mid, #f4ecdf);
}
.progression-v3__backdrop,
.progression-v3__wash {
  position: absolute;
  inset: 0;
}
.progression-v3__backdrop {
  opacity: clamp(0, calc(var(--journey) * 22), 0.18);
  transform: scale(calc(1.03 + var(--journey) * 0.05)) translate3d(0, calc(var(--journey) * -1.2%), 0);
  transform-origin: 50% 56%;
}
.progression-v3__backdrop img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center 56%;
  filter: saturate(0.72) contrast(0.92) brightness(1.1);
  mix-blend-mode: multiply;
}
.progression-v3__wash {
  z-index: 1;
  opacity: clamp(0, calc(var(--journey) * 18), 1);
  background:
    linear-gradient(90deg, rgba(250, 246, 238, 0.88) 0%, rgba(250, 246, 238, 0.42) 36%, rgba(250, 246, 238, 0.58) 100%),
    linear-gradient(180deg, rgba(250, 246, 238, 0.92), rgba(250, 246, 238, 0.38) 34%, rgba(250, 246, 238, 0.94));
}

.progression-v3__threshold-fog {
  position: absolute;
  z-index: 6;
  top: -1px;
  right: -8%;
  left: -8%;
  height: min(58vh, 560px);
  overflow: hidden;
  background:
    radial-gradient(ellipse at 18% 42%, rgba(250, 246, 238, 0.95), transparent 44%),
    radial-gradient(ellipse at 76% 38%, rgba(232, 225, 237, 0.85), transparent 48%);
  filter: blur(0.2px);
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 26%, #000 76%, transparent 100%);
  mask-image: linear-gradient(180deg, transparent 0%, #000 26%, #000 76%, transparent 100%);
  opacity: clamp(0, calc(1.18 - var(--journey) * 9.5), 1);
  pointer-events: none;
}

.progression-v3__threshold-fog::before,
.progression-v3__threshold-fog::after,
.progression-v3__threshold-fog i {
  position: absolute;
  border-radius: 50%;
  background: rgba(250, 246, 238, 0.8);
  filter: blur(32px);
  content: '';
}

.progression-v3__threshold-fog::before {
  top: 25%;
  left: 4%;
  width: 54%;
  height: 44%;
}

.progression-v3__threshold-fog::after {
  top: 18%;
  right: 0;
  width: 48%;
  height: 52%;
}

.progression-v3__threshold-fog i:first-child {
  top: 49%;
  left: 24%;
  width: 38%;
  height: 28%;
}

.progression-v3__threshold-fog i:last-child {
  top: 55%;
  right: 19%;
  width: 31%;
  height: 24%;
}

.progression-v3__heading {
  position: absolute;
  z-index: 8;
  top: clamp(88px, 11vh, 110px);
  left: var(--home-rail-inset, clamp(20px, 4vw, 56px));
  display: grid;
  gap: 7px;
  /* A title card for the entrance only: it yields to each chapter's own
     kicker once the book has landed, instead of pinning a stale tagline over
     the later chapters. */
  opacity: clamp(0, min(calc((var(--entry) - 0.2) * 2.8), calc(1 - (var(--journey) - 0.1) * 16)), 1);
  transform: translate3d(0, calc(clamp(0, (var(--journey) - 0.1) * 16, 1) * -10px), 0);
  pointer-events: none;
}
.progression-v3__heading p,
.chapter-copy__kicker {
  margin: 0;
  color: #87691d;
  font: 800 0.72rem/1 var(--font-body, "Manrope", sans-serif);
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.progression-v3__heading h2 {
  margin: 0;
  color: var(--ink, #221c14);
  font: 700 clamp(1.55rem, 2.2vw, 2.1rem)/1 var(--font-display, "IBM Plex Sans Condensed", sans-serif);
  letter-spacing: -0.025em;
}
.progression-v3__heading span {
  color: var(--ink-muted, #756b5c);
  font: 600 0.72rem/1.3 var(--font-body, "Manrope", sans-serif);
  letter-spacing: 0.08em;
}

.progression-v3__layout {
  position: absolute;
  z-index: 4;
  inset: clamp(150px, 19vh, 190px) var(--home-rail-inset, clamp(20px, 4vw, 56px)) clamp(84px, 11vh, 112px);
  display: grid;
  grid-template-columns: minmax(240px, 0.55fr) minmax(560px, 1.45fr);
  align-items: center;
  gap: clamp(26px, 4vw, 72px);
  opacity: clamp(0, calc((var(--entry) - 0.52) * 3.2), 1);
}
.chapter-copy {
  min-width: 0;
  align-self: center;
}
.chapter-copy h3 {
  max-width: 420px;
  margin: 14px 0 14px;
  color: var(--ink, #221c14);
  font: 700 clamp(2.1rem, 3.6vw, 3.5rem)/.94 var(--font-display, "IBM Plex Sans Condensed", sans-serif);
  letter-spacing: -0.03em;
  text-wrap: balance;
}
.chapter-copy__body {
  max-width: 400px;
  margin: 0;
  color: var(--ink-muted, #756b5c);
  font-size: clamp(0.85rem, 1vw, 0.95rem);
  font-weight: 500;
  line-height: 1.6;
}
.chapter-copy__hint {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 18px 0 0;
  padding-top: 14px;
  border-top: 1px solid var(--hairline, #eae1d0);
  color: var(--ink-muted, #756b5c);
  font: 600 0.74rem/1.5 var(--font-body, "Manrope", sans-serif);
  letter-spacing: 0.04em;
}
.chapter-copy__hint i {
  flex: 0 0 auto;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--primary, #7458e8);
  box-shadow: 0 0 10px rgba(116, 88, 232, 0.35);
}

.progression-v3__stage {
  position: relative;
  min-width: 0;
  height: min(72vh, 720px);
  min-height: 420px;
  outline: none;
}
.scene-window {
  position: absolute;
  inset: 0;
  transition: opacity 0.18s linear;
}

.progression-nav {
  position: absolute;
  z-index: 20;
  right: var(--home-rail-inset, clamp(20px, 4vw, 56px));
  bottom: 16px;
  left: var(--home-rail-inset, clamp(20px, 4vw, 56px));
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  border-top: 1px solid var(--hairline, #eae1d0);
}
.progression-nav button {
  position: relative;
  min-width: 44px;
  min-height: 56px;
  display: grid;
  grid-template-columns: 14px 22px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border: 0;
  color: var(--ink-muted, #756b5c);
  background: transparent;
  cursor: pointer;
  text-align: left;
}
/* States differ by shape, not only hue (WCAG 1.4.1): upcoming = hollow ring,
   active = filled dot + bar on the rail + bold label, complete = check mark. */
.progression-nav button > i {
  width: 8px;
  height: 8px;
  display: grid;
  place-items: center;
  border: 1.5px solid currentColor;
  border-radius: 50%;
}
.progression-nav button.active {
  color: var(--primary, #7458e8);
}
.progression-nav button.active::before {
  content: '';
  position: absolute;
  top: -2px;
  right: 8px;
  left: 8px;
  height: 3px;
  border-radius: 0 0 3px 3px;
  background: var(--primary, #7458e8);
}
.progression-nav button.active > i {
  width: 10px;
  height: 10px;
  border-color: var(--primary, #7458e8);
  background: var(--primary, #7458e8);
  box-shadow: 0 0 0 3px var(--primary-tint, rgba(116, 88, 232, 0.12));
}
.progression-nav button.active strong {
  font-weight: 800;
}
.progression-nav button.complete {
  color: var(--ink, #221c14);
}
.progression-nav button.complete > i {
  width: 14px;
  height: 14px;
  border-color: var(--ink, #221c14);
  background: var(--ink, #221c14);
}
.progression-nav button > i svg {
  width: 10px;
  height: 10px;
  fill: none;
  stroke: #fff;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.progression-nav span {
  font: 700 0.68rem/1 var(--font-body, "Manrope", sans-serif);
  letter-spacing: 0.08em;
}
.progression-nav strong {
  font-size: 0.74rem;
  font-weight: 700;
}
.progression-nav button:focus-visible {
  outline: 3px solid var(--primary, #7458e8);
  outline-offset: 2px;
}
.progression-line {
  position: absolute;
  z-index: 21;
  right: 0;
  bottom: 0;
  left: 0;
  height: 3px;
  background: rgba(34, 28, 20, 0.08);
}
.progression-line i {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--primary, #7458e8);
  transform-origin: left center;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.progression-static {
  display: none;
}

.chapter-copy-enter-active,
.chapter-copy-leave-active {
  transition: opacity 0.25s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}
.chapter-copy-enter-from {
  opacity: 0;
  transform: translateY(14px);
}
.chapter-copy-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 1120px) {
  .progression-v3__layout {
    grid-template-columns: minmax(210px, 0.55fr) minmax(480px, 1.3fr);
    gap: 24px;
  }
  .progression-nav strong {
    display: none;
  }
  .progression-nav button {
    grid-template-columns: 14px 1fr;
    justify-items: center;
  }
}
@media (max-width: 820px) {
  .progression-v3 {
    min-height: 560svh;
  }
  .progression-v3__layout {
    inset: 132px var(--home-content-gutter, clamp(20px, 4vw, 56px)) 70px;
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(320px, 1fr);
    gap: 6px;
    align-items: start;
  }
  .chapter-copy h3 {
    margin: 8px 0 8px;
    font-size: clamp(1.7rem, 7.5vw, 2.6rem);
  }
  .chapter-copy__body {
    max-width: 620px;
    font-size: 0.8rem;
    line-height: 1.45;
  }
  .chapter-copy__hint {
    display: none;
  }
  .progression-v3__stage {
    height: 100%;
    min-height: 320px;
  }
}
@media (max-width: 520px) {
  .progression-v3__heading {
    top: 80px;
    right: var(--home-content-gutter, 20px);
    left: var(--home-content-gutter, 20px);
  }
  .progression-v3__heading span {
    display: none;
  }
  .progression-v3__layout {
    /* The two-line mobile heading finishes around 142px. Start the chapter
       copy below it so the stage never clips the kicker into the title. */
    inset: 154px var(--home-content-gutter, 20px) 62px;
  }
}

@media (prefers-reduced-motion: reduce), (max-height: 640px) {
  .progression-v3 {
    min-height: auto;
    padding: clamp(96px, 12vw, 140px) clamp(16px, 4vw, 58px);
    background: transparent;
  }
  .progression-v3__sticky {
    position: relative;
    height: auto;
    min-height: 0;
    overflow: visible;
    background: transparent;
  }
  .progression-v3__backdrop,
  .progression-v3__wash,
  .progression-v3__layout,
  .progression-nav,
  .progression-line {
    display: none;
  }
  .progression-v3__heading {
    position: relative;
    top: auto;
    left: auto;
    width: min(760px, 100%);
    margin: 0 auto 40px;
    opacity: 1;
    transform: none;
  }
  .progression-v3__heading h2 {
    margin-top: 8px;
    font-size: clamp(2.2rem, 7vw, 4rem);
  }
  .progression-static {
    width: min(880px, 100%);
    display: block;
    margin: 0 auto;
    padding: 0;
    list-style: none;
  }
  .progression-static li {
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr);
    gap: clamp(16px, 4vw, 40px);
    padding: clamp(24px, 4.5vw, 42px) 0;
    border-top: 1px solid var(--hairline, #eae1d0);
  }
  .progression-static li > span {
    color: #87691d;
    font: 700 0.72rem/1 var(--font-body, "Manrope", sans-serif);
    letter-spacing: 0.12em;
  }
  .progression-static small {
    color: var(--primary-deep, #5f46d6);
    font: 800 0.72rem/1 var(--font-body, "Manrope", sans-serif);
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .progression-static h3 {
    margin: 9px 0 10px;
    color: var(--ink, #221c14);
    font: 800 clamp(1.8rem, 5vw, 3rem)/1 var(--font-body, "Manrope", sans-serif);
    letter-spacing: -0.03em;
  }
  .progression-static p {
    max-width: 620px;
    margin: 0;
    color: var(--ink-muted, #756b5c);
    font-size: 0.9rem;
    font-weight: 500;
    line-height: 1.6;
  }
}
@media (prefers-reduced-motion: reduce) {
  .chapter-copy-enter-active,
  .chapter-copy-leave-active,
  .scene-window {
    transition: none;
  }
  .progression-v3__backdrop {
    transform: none;
  }
}
</style>
