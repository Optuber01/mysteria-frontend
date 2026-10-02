<template>
  <section
    id="progression"
    ref="sectionRef"
    class="progression-v3"
    :style="sectionVars"
    aria-labelledby="progression-title"
  >
    <div class="progression-v3__sticky">
      <div class="progression-v3__backdrop" aria-hidden="true">
        <img :src="breweryScene" alt="" width="1920" height="1017" loading="lazy" decoding="async">
      </div>
      <div class="progression-v3__omen" aria-hidden="true" />
      <div class="progression-v3__fogbank" aria-hidden="true">
        <i class="progression-v3__fog progression-v3__fog--far" />
        <i class="progression-v3__fog progression-v3__fog--near" />
      </div>
      <div class="progression-v3__vignette" aria-hidden="true" />
      <div class="progression-v3__threshold" aria-hidden="true" />

      <header class="progression-v3__heading">
        <p class="fog-label">{{ tp('eyebrow') }}</p>
        <h2 id="progression-title">{{ tp('title') }}</h2>
        <p class="progression-v3__tagline">{{ tp('tagline') }}</p>
      </header>

      <div class="progression-v3__layout">
        <Transition name="chapter-copy" mode="out-in">
          <article :key="activeChapter.id" class="chapter-copy">
            <p class="fog-label">{{ chapterText(activeChapter.id, 'kicker') }}</p>
            <h3>{{ chapterText(activeChapter.id, 'title') }}</h3>
            <p class="chapter-copy__body">{{ chapterText(activeChapter.id, 'copy') }}</p>
            <p class="chapter-copy__hint"><i aria-hidden="true" />{{ chapterText(activeChapter.id, 'hint') }}</p>
          </article>
        </Transition>

        <div ref="stageRef" class="progression-v3__stage" @click="onStageClick">
          <div class="scene-window" :style="bookWindowStyle" :aria-hidden="bookOpacity < 0.5">
            <FormulaBookScene
              :progress="bookLocal"
              :closing-progress="bookClosingLocal"
              :active="bookOpacity > 0.5"
              :warm="near"
              @inspect="showDetail"
              @clear-inspect="clearDetail"
            />
          </div>
          <div class="scene-window" :style="altarWindowStyle" :aria-hidden="altarOpacity < 0.5">
            <AltarBrewScene
              :progress="altarLocal"
              :active="altarOpacity > 0.5"
              @inspect="showDetail"
              @clear-inspect="clearDetail"
            />
          </div>
          <div class="scene-window" :style="drinkWindowStyle" :aria-hidden="drinkOpacity < 0.5">
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
          <em v-if="activeChapterIndex > index" class="visually-hidden">{{ tp('navCompleted') }}</em>
        </button>
      </nav>
      <div class="progression-line" aria-hidden="true"><i :style="{ transform: `scaleX(${progress.toFixed(4)})` }" /></div>
    </div>

    <div class="progression-static">
      <ol>
        <li v-for="(chapter, index) in chapters" :key="chapter.id" :class="{ 'is-climax': index === chapters.length - 1 }">
          <p class="fog-label">{{ chapterText(chapter.id, 'kicker') }}</p>
          <h3>{{ chapterText(chapter.id, 'title') }}</h3>
          <p>{{ chapterText(chapter.id, 'copy') }}</p>
        </li>
      </ol>
      <RouterLink class="fog-button" :to="$lp('/game')">
        {{ tp('drink.cta') }} <span aria-hidden="true">→</span>
      </RouterLink>
    </div>
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
 * is not showing. The section is 360svh tall: 2.6 viewports of pinned scroll.
 */
const ALTAR = { start: 0.24, end: 0.56 };
const DRINK = { start: 0.56, end: 1 };
const altarAt = (local: number) => ALTAR.start + (ALTAR.end - ALTAR.start) * local;
const drinkAt = (local: number) => DRINK.start + (DRINK.end - DRINK.start) * local;
// Step two begins with the book still on stage: it closes around the departing
// ingredients while the cauldron settles underneath it.
const BOOK = {
  // The book waits for the title card to clear before it descends.
  start: 0.015,
  end: 0.17,
  closeStart: altarAt(0.1),
  closeEnd: altarAt(0.42),
  fadeOutStart: altarAt(0.33),
  fadeOutEnd: altarAt(0.46),
};
const FADES = {
  altarIn: [altarAt(0.03), altarAt(0.16)],
  altarOut: [ALTAR.end, ALTAR.end + 0.03],
  drinkIn: [DRINK.start - 0.005, DRINK.start + 0.025],
} as const;
const TIMELINE = {
  // Chapter starts follow the first visible beat of each step: the book
  // closing as the ingredients take flight, the cauldron starting to brew,
  // the altar/drink cross-fade midpoint, and the awakening flash.
  infuse: BOOK.closeStart,
  brew: altarAt(0.55),
  drink: (FADES.altarOut[0] + FADES.altarOut[1]) / 2,
  awaken: drinkAt(0.4),
  // The fog parts while the awakening plays (DrinkAwakenScene: 0.42 -> 0.62).
  awakenEnd: drinkAt(0.62),
  // Book hotspots stop being readable once the pages start closing.
  bookReadableUntil: BOOK.closeStart,
  altarReadableUntil: FADES.altarOut[1],
  // skinview3d/WebGL for the player is created only once the story is close.
  playerWarm: 0.36,
};

type ChapterId = 'discover' | 'infuse' | 'brew' | 'drink' | 'awaken';
type Chapter = { id: ChapterId; end: number; landing: number };

// A chapter runs until `end` (it starts where the previous one ends); `landing`
// is where chapter navigation scrolls to: a settled frame of that step.
const chapters: Chapter[] = [
  { id: 'discover', end: TIMELINE.infuse, landing: BOOK.end + 0.02 },
  { id: 'infuse', end: TIMELINE.brew, landing: altarAt(0.5) + 0.005 },
  { id: 'brew', end: TIMELINE.drink, landing: altarAt(0.93) },
  { id: 'drink', end: TIMELINE.awaken, landing: drinkAt(0.24) },
  { id: 'awaken', end: 1, landing: 1 },
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
function fadeOut(start: number, end: number) {
  return 1 - windowProgress(start, end);
}

const bookLocal = computed(() => windowProgress(BOOK.start, BOOK.end));
const bookClosingLocal = computed(() => windowProgress(BOOK.closeStart, BOOK.closeEnd));
const altarLocal = computed(() => windowProgress(ALTAR.start, ALTAR.end));
const drinkLocal = computed(() => windowProgress(DRINK.start, DRINK.end));

const bookOpacity = computed(() => (reducedMotion.value ? 1 : fadeOut(BOOK.fadeOutStart, BOOK.fadeOutEnd)));
const altarOpacity = computed(() => (reducedMotion.value ? 1 : Math.min(
  windowProgress(...FADES.altarIn),
  fadeOut(...FADES.altarOut),
)));
const drinkOpacity = computed(() => (reducedMotion.value ? 1 : windowProgress(...FADES.drinkIn)));

// CSS drivers for the stage dressing: --journey (whole chapter), --entry (the
// section rising under the hero), --awaken (the fog parting at the climax).
const sectionVars = computed(() => ({
  '--journey': progress.value.toFixed(4),
  '--entry': entryProgress.value.toFixed(4),
  '--awaken': windowProgress(TIMELINE.awaken, TIMELINE.awakenEnd).toFixed(4),
}));

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
// its anchor: clear it on every chapter change and whenever its scene fades.
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
  // A pointer can rest on one spot while the pinned stage scrolls under it:
  // never leave a teleported card attached to a control that has left.
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
  --journey: 0;
  --entry: 0;
  --awaken: 0;
  /* The title card owns the entrance; the chapter copy and stage take over
     as soon as the section pins. */
  --title-in: clamp(0, calc((var(--entry) - 0.35) * 2.5), 1);
  --title-out: clamp(0, calc(1 - var(--journey) * 40), 1);
  --stage-in: clamp(0, calc((var(--journey) - 0.01) * 30), 1);
  position: relative;
  min-height: 360svh;
  color: var(--bone);
  background: var(--fog-0);
  isolation: isolate;
}

.progression-v3__sticky {
  position: sticky;
  top: 0;
  height: 100svh;
  min-height: 620px;
  overflow: hidden;
  background: var(--fog-0);
}

/* ---- The brewery capture, sunk into the dark like the hero's scenes ---- */
.progression-v3__backdrop,
.progression-v3__omen,
.progression-v3__fogbank,
.progression-v3__vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.progression-v3__backdrop {
  opacity: calc(clamp(0, (var(--entry) - 0.3) * 1.43, 1) * (0.62 - var(--awaken) * 0.4));
  transform: scale(calc(1.04 + var(--journey) * 0.06));
  transform-origin: 50% 60%;
}

.progression-v3__backdrop img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center 58%;
  filter: grayscale(0.6) brightness(0.4) contrast(1.1);
}

/* Spirit-vision light behind the awakened player: the only colour on stage. */
.progression-v3__omen {
  opacity: var(--awaken);
  background:
    radial-gradient(ellipse 38% 60% at 46% 52%, rgba(179, 32, 43, 0.34), transparent 70%),
    radial-gradient(ellipse 70% 90% at 46% 60%, rgba(142, 23, 32, 0.22), transparent 78%);
}

/* ---- Fog: two slow banks, parted at the climax ---- */
.progression-v3__fogbank {
  opacity: calc(1 - var(--awaken) * 0.75);
  transform: translate3d(0, calc(var(--awaken) * 14%), 0);
}

.progression-v3__fog {
  position: absolute;
  left: -50%;
  width: 200%;
  background-repeat: repeat-x;
  background-size: 50% 100%;
}

.progression-v3__fog--far {
  top: 6%;
  height: 64%;
  background-image:
    radial-gradient(ellipse 18% 30% at 14% 58%, rgba(176, 184, 196, 0.14), transparent 70%),
    radial-gradient(ellipse 22% 26% at 42% 38%, rgba(176, 184, 196, 0.1), transparent 70%),
    radial-gradient(ellipse 18% 30% at 70% 64%, rgba(176, 184, 196, 0.13), transparent 70%),
    radial-gradient(ellipse 22% 32% at 92% 44%, rgba(176, 184, 196, 0.1), transparent 70%);
  animation: progression-fog 95s linear infinite;
}

.progression-v3__fog--near {
  bottom: -10%;
  height: 52%;
  background-image:
    radial-gradient(ellipse 26% 38% at 18% 72%, rgba(200, 206, 214, 0.2), transparent 72%),
    radial-gradient(ellipse 20% 34% at 50% 84%, rgba(200, 206, 214, 0.16), transparent 72%),
    radial-gradient(ellipse 28% 42% at 84% 76%, rgba(200, 206, 214, 0.2), transparent 72%);
  animation: progression-fog 60s linear infinite reverse;
}

@keyframes progression-fog {
  to { transform: translate3d(-25%, 0, 0); }
}

/* Copy side and rail stay on near-black; the stage keeps its depth. */
.progression-v3__vignette {
  background:
    linear-gradient(90deg, rgba(7, 8, 11, 0.9) 0%, rgba(7, 8, 11, 0.55) 30%, transparent 58%),
    radial-gradient(ellipse 85% 75% at 62% 50%, transparent 45%, rgba(7, 8, 11, 0.75) 100%),
    linear-gradient(180deg, var(--fog-0) 0%, transparent 18%, transparent 78%, var(--fog-0) 100%);
}

/* The hero's fog rolls straight into this chapter; the book descends out of
   it and it burns off as the story begins. */
.progression-v3__threshold {
  position: absolute;
  z-index: 6;
  top: 0;
  right: -10%;
  left: -10%;
  height: 62%;
  /* Banks at the top edge continue the hero's low fog across the seam. */
  background:
    radial-gradient(ellipse 26% 26% at 20% 0%, rgba(200, 206, 214, 0.26), transparent 72%),
    radial-gradient(ellipse 20% 22% at 52% 2%, rgba(200, 206, 214, 0.2), transparent 72%),
    radial-gradient(ellipse 28% 28% at 82% 0%, rgba(200, 206, 214, 0.26), transparent 72%),
    radial-gradient(ellipse 34% 46% at 26% 34%, rgba(176, 184, 196, 0.14), transparent 72%),
    radial-gradient(ellipse 36% 44% at 72% 30%, rgba(176, 184, 196, 0.12), transparent 72%);
  opacity: clamp(0, calc(1 - var(--journey) * 7), 1);
  pointer-events: none;
}

/* ---- Title card: the entrance only ---- */
.progression-v3__heading {
  position: absolute;
  z-index: 8;
  top: calc(var(--home-header-height, 68px) + clamp(48px, 9vh, 96px));
  right: var(--home-rail-inset, clamp(20px, 4vw, 56px));
  left: var(--home-rail-inset, clamp(20px, 4vw, 56px));
  display: grid;
  justify-items: center;
  gap: 16px;
  text-align: center;
  opacity: min(var(--title-in), var(--title-out));
  transform: translate3d(0, calc((1 - var(--title-out)) * -18px), 0);
  pointer-events: none;
}

.progression-v3__heading .fog-label::after {
  content: "";
  width: 18px;
  height: 1px;
  background: var(--crimson-text);
}

.progression-v3__heading h2 {
  margin: 0;
  color: var(--bone);
  font: 600 clamp(2.6rem, 6vw, 5.4rem)/0.95 var(--font-display);
  text-shadow: 0 10px 60px rgba(0, 0, 0, 0.6);
}

.progression-v3__tagline,
.chapter-copy h3 + p,
.progression-static p:not(.fog-label) {
  text-wrap: pretty;
}

.progression-v3__tagline {
  margin: 0;
  color: var(--ash);
  font: italic 500 clamp(1.15rem, 1.8vw, 1.5rem)/1.3 var(--font-display);
}

/* ---- Chapter copy + stage ---- */
.progression-v3__layout {
  position: absolute;
  z-index: 4;
  inset:
    calc(var(--home-header-height, 68px) + clamp(20px, 4vh, 48px))
    var(--home-rail-inset, clamp(20px, 4vw, 56px))
    clamp(84px, 11vh, 108px);
  display: grid;
  grid-template-columns: minmax(250px, 0.55fr) minmax(560px, 1.45fr);
  align-items: center;
  gap: clamp(26px, 4vw, 72px);
  opacity: var(--stage-in);
}

.chapter-copy {
  min-width: 0;
}

.chapter-copy h3 {
  margin: 20px 0 18px;
  color: var(--bone);
  font: 600 clamp(2.3rem, 3.4vw, 3.4rem)/0.98 var(--font-display);
  text-wrap: balance;
}

.chapter-copy__body {
  max-width: 400px;
  margin: 0;
  color: var(--ash);
  font-size: clamp(0.95rem, 1.05vw, 1.04rem);
  line-height: 1.6;
}

.chapter-copy__hint {
  max-width: 400px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 22px 0 0;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  color: var(--ash);
  font-size: 0.86rem;
  line-height: 1.5;
}

.chapter-copy__hint i {
  flex: 0 0 auto;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--crimson-text);
  box-shadow: 0 0 0 4px var(--crimson-tint);
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

/* ---- Chapter rail ---- */
.progression-nav {
  position: absolute;
  z-index: 20;
  right: var(--home-rail-inset, clamp(20px, 4vw, 56px));
  bottom: 14px;
  left: var(--home-rail-inset, clamp(20px, 4vw, 56px));
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  border-top: 1px solid var(--line);
}

.progression-nav button {
  position: relative;
  min-width: 44px;
  min-height: 56px;
  display: grid;
  grid-template-columns: 14px 24px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border: 0;
  color: var(--ash);
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: color 0.2s ease;
}

.progression-nav button:hover {
  color: var(--bone);
}

/* States differ by shape, not only hue (WCAG 1.4.1): upcoming = hollow ring,
   active = filled crimson dot + bar on the rail + bold label, complete = check. */
.progression-nav button > i {
  width: 8px;
  height: 8px;
  display: grid;
  place-items: center;
  border: 1.5px solid currentColor;
  border-radius: 50%;
}

.progression-nav button.active {
  color: var(--bone);
}

.progression-nav button.active::before {
  content: '';
  position: absolute;
  top: -1px;
  right: 8px;
  left: 8px;
  height: 2px;
  background: var(--crimson);
  box-shadow: 0 0 14px rgba(179, 32, 43, 0.7);
}

.progression-nav button.active > i {
  width: 10px;
  height: 10px;
  border-color: var(--crimson-text);
  background: var(--crimson);
  box-shadow: 0 0 0 4px var(--crimson-tint);
}

.progression-nav button.active strong {
  font-weight: 700;
}

.progression-nav button.complete > i {
  width: 14px;
  height: 14px;
  border-color: var(--line-strong);
  background: var(--fog-3);
}

.progression-nav button > i svg {
  width: 10px;
  height: 10px;
  fill: none;
  stroke: var(--bone);
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.progression-nav span {
  font: 500 0.7rem/1 var(--font-mono);
  letter-spacing: 0.12em;
}

.progression-nav strong {
  font-size: 0.84rem;
  font-weight: 500;
}

.progression-line {
  position: absolute;
  z-index: 21;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  background: var(--line);
}

.progression-line i {
  display: block;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, var(--crimson-deep), var(--crimson));
  transform-origin: left center;
}

.progression-static {
  display: none;
}

.chapter-copy-enter-active,
.chapter-copy-leave-active {
  transition: opacity 0.3s ease, transform 0.6s var(--ease-out);
}

.chapter-copy-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.chapter-copy-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 1120px) {
  .progression-v3__layout {
    grid-template-columns: minmax(220px, 0.55fr) minmax(480px, 1.3fr);
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

/*
 * Sticky storytelling needs room for its copy, controls and media to coexist.
 * Narrow and short viewports, and reduced motion, get one document-flow list.
 */
@media (max-width: 900px), (max-height: 700px), (prefers-reduced-motion: reduce) {
  .progression-v3 {
    min-height: auto;
    padding: var(--home-section-block, 96px) var(--home-content-gutter, 20px);
    overflow: hidden;
  }

  .progression-v3__sticky {
    position: relative;
    height: auto;
    min-height: 0;
    overflow: visible;
    background: transparent;
  }

  /* The capture becomes a band behind the heading, fading into the list. */
  .progression-v3__backdrop,
  .progression-v3__vignette {
    inset: calc(-1 * var(--home-section-block, 96px)) calc(-1 * var(--home-content-gutter, 20px)) auto;
    height: min(560px, 80vh);
  }

  .progression-v3__backdrop {
    opacity: 0.55;
    transform: none;
    -webkit-mask-image: linear-gradient(180deg, transparent, #000 20%, #000 45%, transparent);
    mask-image: linear-gradient(180deg, transparent, #000 20%, #000 45%, transparent);
  }

  .progression-v3__omen,
  .progression-v3__fogbank,
  .progression-v3__threshold,
  .progression-v3__layout,
  .progression-nav,
  .progression-line {
    display: none;
  }

  /* low fog carried over from the hero, then the copy side kept dark */
  .progression-v3__vignette {
    background:
      radial-gradient(ellipse 40% 22% at 15% 0%, rgba(200, 206, 214, 0.2), transparent 72%),
      radial-gradient(ellipse 36% 18% at 60% 0%, rgba(200, 206, 214, 0.16), transparent 72%),
      radial-gradient(ellipse 40% 22% at 95% 0%, rgba(200, 206, 214, 0.2), transparent 72%),
      linear-gradient(90deg, rgba(7, 8, 11, 0.7), transparent 70%);
  }

  .progression-v3__heading {
    position: relative;
    inset: auto;
    width: min(880px, 100%);
    margin: 0 auto clamp(36px, 7vw, 56px);
    justify-items: start;
    text-align: left;
    opacity: 1;
    transform: none;
  }

  .progression-v3__heading .fog-label::after {
    display: none;
  }

  .progression-v3__heading h2 {
    font-size: clamp(2.5rem, 9vw, 4.2rem);
  }

  .progression-static {
    position: relative;
    width: min(880px, 100%);
    display: block;
    margin: 0 auto;
  }

  .progression-static ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .progression-static li {
    position: relative;
    padding: clamp(26px, 5vw, 40px) 0;
    border-top: 1px solid var(--line);
  }

  .progression-static h3 {
    margin: 14px 0 10px;
    color: var(--bone);
    font: 600 clamp(2rem, 7vw, 2.9rem)/1 var(--font-display);
    text-wrap: balance;
  }

  .progression-static p:not(.fog-label) {
    max-width: 620px;
    margin: 0;
    color: var(--ash);
    font-size: 0.98rem;
    line-height: 1.6;
  }

  /* The awakening is the climax: a crimson rule under a faint crimson moon. */
  .progression-static li.is-climax {
    border-top-color: rgba(229, 84, 93, 0.45);
  }

  .progression-static li.is-climax::before {
    position: absolute;
    z-index: -1;
    inset: 0 -20% -30% -10%;
    background: radial-gradient(ellipse 50% 60% at 18% 40%, rgba(179, 32, 43, 0.2), transparent 70%);
    content: '';
    pointer-events: none;
  }

  .progression-static .fog-button {
    margin-top: 8px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chapter-copy-enter-active,
  .chapter-copy-leave-active,
  .scene-window {
    transition: none;
  }

  .progression-v3__fog {
    animation: none;
  }
}
</style>
