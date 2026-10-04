<template>
  <section
    id="progression"
    ref="sectionRef"
    class="progression"
    aria-labelledby="progression-title"
  >
    <!-- Backlund's roofs in three depths: the room's top edge, rising over the hero's bottom as the room comes up. -->
    <div class="progression__roofs" :style="dress.roofs" aria-hidden="true">
      <i class="progression__roof progression__roof--far" />
      <i class="progression__roof progression__roof--mid" />
      <i class="progression__roof progression__roof--near" />
    </div>
    <div class="progression__sticky">
      <!-- Decorative: bleeds past the edges on purpose while it slowly zooms. -->
      <div class="progression__backdrop" :style="dress.backdrop" aria-hidden="true" data-sweep-ignore>
        <img ref="backdropRef" :src="breweryScene" alt="" width="1920" height="1017" loading="lazy" decoding="async">
      </div>
      <div class="progression__hearth" :style="dress.hearth" aria-hidden="true" />
      <!-- Decorative: the moon rises behind the player in the Pathway's colour. -->
      <div class="progression__moon" :class="{ 'is-lit': moonLit }" :style="dress.moon" aria-hidden="true" data-sweep-ignore>
        <i class="progression__moon-halo" />
        <i class="progression__moon-disc" :style="{ backgroundImage: `url(${crimsonMoon})` }" />
        <i class="progression__moon-tint" />
        <i class="progression__moon-band progression__moon-band--1" />
        <i class="progression__moon-band progression__moon-band--2" />
        <i class="progression__moon-band progression__moon-band--3" />
      </div>
      <div class="progression__fogbank" :style="dress.fogbank" aria-hidden="true">
        <i class="progression__fog progression__fog--far" />
        <i class="progression__fog progression__fog--near" />
      </div>
      <div class="progression__vignette" aria-hidden="true" />
      <!-- the dark closing in on the drink, with the heart's beat in it -->
      <div class="progression__dread" :class="{ 'is-lit': dreadLit }" :style="dress.dread" aria-hidden="true" data-sweep-ignore />
      <div class="progression__burst" :style="dress.burst" aria-hidden="true" />

      <!-- The title card: it rides in with the room and hands over to the first chapter in the same column. -->
      <header class="progression__heading" :style="dress.heading">
        <h2 id="progression-title">{{ tp('title') }}</h2>
      </header>

      <div class="progression__layout" :class="{ 'is-leaving': copyLeaving }" :style="layoutStyle">
        <!-- Outgoing and incoming copy share one grid cell and cross over. -->
        <div class="chapter-copy-slot" :style="copyStyle">
          <Transition name="chapter-copy">
            <article v-if="activeChapter.id !== 'awaken'" :key="activeChapter.id" class="chapter-copy">
              <h3>{{ chapterText(activeChapter.id, 'title') }}</h3>
              <p class="chapter-copy__body">{{ chapterText(activeChapter.id, 'copy') }}</p>
              <p v-if="isBoon && activeChapter.id === 'discover'" class="chapter-copy__body chapter-copy__boon">{{ tp('boonNote') }}</p>
              <p class="chapter-copy__hint"><i aria-hidden="true" />{{ chapterText(activeChapter.id, 'hint') }}</p>
            </article>
            <article v-else key="awaken" class="chapter-copy chapter-copy--awaken">
              <h3 class="chapter-copy__name" :style="{ '--name-em': nameEm }">
                <template v-for="(part, index) in awakenTitle" :key="index"><em v-if="part.name">{{ part.text }}</em><template v-else>{{ part.text }}</template></template>
              </h3>
              <p class="chapter-copy__sub">{{ tp('drink.panelSub') }}</p>
              <p class="chapter-copy__digest">{{ chapterText('awaken', 'copy') }}</p>
              <ul v-if="firstAbilities.length" class="chapter-copy__abilities" :aria-label="tp('drink.abilitiesHeading')">
                <li v-for="ability in firstAbilities" :key="ability.id">
                  <strong>{{ ability.name }}</strong>
                  <span>{{ ability.description }}</span>
                </li>
              </ul>
              <div class="chapter-copy__onward">
                <p v-if="names.nextSequence" class="chapter-copy__next">{{ tp('drink.teaser') }}</p>
                <RouterLink class="arc-btn arc-btn--solid chapter-copy__cta" :to="$lp('/game')">
                  {{ tp('drink.cta') }}
                  <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
                </RouterLink>
              </div>
            </article>
          </Transition>
        </div>

        <div ref="stageRef" class="progression__stage" @click="onStageClick">
          <div class="scene-window scene-window--book" :style="bookWindowStyle" :aria-hidden="bookOpacity < 0.5">
            <FormulaBookScene
              :progress="progress"
              :layout="stage"
              :active="bookOpacity > 0.5"
              :warm="near"
              :hidden="departed"
              @anchors="bookAnchors = $event"
              @inspect="(id, el) => showDetail(id, 'book', el)"
              @clear-inspect="clearDetail"
            />
          </div>
          <div class="scene-window scene-window--altar" :style="altarWindowStyle" :aria-hidden="altarOpacity < 0.5">
            <AltarBrewScene
              :progress="progress"
              :layout="stage"
              :active="altarOpacity > 0.5"
              :anchors="bookAnchors"
              :book-transform="bookTransform"
              @inspect="(id, el) => showDetail(id, 'altar', el)"
              @clear-inspect="clearDetail"
            />
          </div>
          <div class="scene-window scene-window--drink" :style="drinkWindowStyle" :aria-hidden="drinkOpacity < 0.5">
            <DrinkAwakenScene
              :progress="progress"
              :layout="stage"
              :active="drinkOpacity > 0.5"
              :warm="progress >= T.brewIn[0] || near && progress > 0.1"
              @inspect="(id, el) => showDetail(id, 'drink', el)"
              @clear-inspect="clearDetail"
            />
          </div>

          <SceneInspectorPopover
            :id="activeDetailId ? 'progression-detail' : undefined"
            :open="Boolean(activeDetail && inspectorAnchor)"
            :anchor="inspectorAnchor"
            :boundary="stageRef"
            :title="activeDetail?.label"
            :description="activeDetail?.detail"
          />
        </div>
      </div>

      <nav class="progression-nav" :class="{ 'is-leaving': railLeaving }" :aria-label="tp('navLabel')">
        <i class="progression-nav__line" aria-hidden="true"><b :style="{ transform: `scaleX(${progress.toFixed(4)})` }" /></i>
        <button
          v-for="(chapter, index) in CHAPTERS"
          :key="chapter.id"
          type="button"
          :class="{ active: activeChapterIndex === index, complete: activeChapterIndex > index }"
          :aria-current="activeChapterIndex === index ? 'step' : undefined"
          @click="goToChapter(index)"
        >
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ chapterText(chapter.id, 'short') }}</strong>
          <em v-if="activeChapterIndex > index" class="arc-sr">{{ tp('navCompleted') }}</em>
        </button>
      </nav>

      <!-- The way out: once the story has ended, the room dissolves into the page it opens onto. -->
      <i class="progression__exit" :style="exitStyle" aria-hidden="true" />
    </div>

    <!-- Narrow, short and reduced-motion screens: the same story as one list. -->
    <div class="progression-static">
      <ol>
        <li v-for="chapter in CHAPTERS" :key="chapter.id" :class="`is-${chapter.id}`">
          <h3 v-if="chapter.id === 'awaken'">
            <template v-for="(part, index) in awakenTitle" :key="index"><em v-if="part.name">{{ part.text }}</em><template v-else>{{ part.text }}</template></template>
          </h3>
          <h3 v-else>{{ chapterText(chapter.id, 'title') }}</h3>
          <p class="progression-static__copy">{{ chapterText(chapter.id, 'copy') }}</p>
          <p v-if="isBoon && chapter.id === 'discover'" class="progression-static__copy">{{ tp('boonNote') }}</p>
          <ul v-if="chapter.id === 'discover'" class="progression-static__ingredients">
            <li v-for="item in ingredients" :key="item.key">
              <img v-if="item.icon" :src="item.icon" alt="" width="128" height="128" loading="lazy" decoding="async">
              <i v-else class="progression-static__rune" aria-hidden="true" />
              <span>
                <strong>{{ item.name }}</strong>
                <small>{{ tp(`ingredients.${item.role}Role`) }}</small>
              </span>
            </li>
          </ul>
          <p v-else-if="chapter.id === 'brew' || chapter.id === 'drink'" class="progression-static__note">
            <span class="progression-static__vial" aria-hidden="true">
              <PotionVial :accent="card.accent" :level="chapter.id === 'brew' ? 0.5 : 1" />
            </span>
            {{ chapterText(chapter.id, 'hint') }}
          </p>
          <template v-else>
            <ul v-if="firstAbilities.length" class="chapter-copy__abilities" :aria-label="tp('drink.abilitiesHeading')">
              <li v-for="ability in firstAbilities" :key="ability.id">
                <strong>{{ ability.name }}</strong>
                <span>{{ ability.description }}</span>
              </li>
            </ul>
            <p v-if="names.nextSequence" class="chapter-copy__next">{{ tp('drink.teaser') }}</p>
            <RouterLink class="arc-btn arc-btn--solid chapter-copy__cta" :to="$lp('/game')">
              {{ tp('drink.cta') }}
              <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </RouterLink>
          </template>
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useReducedMotion } from '@/composables/useReducedMotion';
import FormulaBookScene from './scenes/FormulaBookScene.vue';
import AltarBrewScene from './scenes/AltarBrewScene.vue';
import DrinkAwakenScene from './scenes/DrinkAwakenScene.vue';
import SceneInspectorPopover from './SceneInspectorPopover.vue';
import PotionVial from './PotionVial.vue';
import { preloadPathwayNames, useProgressionCopy } from './scenes/useProgressionCopy';
import { abilitySummary } from '../abilitySummary';
import { CHAPTERS, T, awakenAt, blackoutAt, clamp01, dropStarts, ease, flashAt, gulpPulse, lerp, riskAt, scrollAt, span, storyAt } from './timeline';
import type { ChapterId } from './timeline';
import { stageLayout } from './layout';
import { isNearby, whenSettled } from './prewarm';
import type { StageLayout } from './layout';
import breweryScene from '@/assets/images/home/progression/brewery-scene.webp';
import crimsonMoon from '@/assets/images/home/progression/crimson-moon.webp';

const { tp, names, ingredients, card, currentId, isBoon } = useProgressionCopy();

function chapterText(id: ChapterId, field: 'short' | 'title' | 'copy' | 'hint'): string {
  return tp(`chapters.${id}.${field}`);
}

/* complete first sentences, never cut mid-sentence (see abilitySummary) */
const firstAbilities = computed(() =>
  names.value.abilities.slice(0, 2).map((ability) => ({
    ...ability,
    description: summarize(ability.description),
  })),
);
/** One complete sentence: past a leading label ("Passive."), tidied, always ending in a full stop. */
function summarize(description: string): string {
  const text = description.trim();
  const label = /^[^.!?。！？]{1,12}[.!?。！？]\s+/u.exec(text);
  // the archive sometimes leaves a space before the full stop ("from sight .")
  const summary = abilitySummary(label ? text.slice(label[0].length) : text).replace(/\s+([.,!?])/g, '$1');
  return /[\p{L}\p{N})]$/u.test(summary) ? `${summary}.` : summary;
}
/** Rough width of "{name}." in em, so a long name can shrink to one line (see .chapter-copy__name). */
const nameEm = computed(() => ((names.value.sequence.length + 1) * 0.5 + 0.4).toFixed(2));
/** "Become a {sequence}." with the name picked out in the accent. */
const awakenTitle = computed(() => {
  const name = names.value.sequence;
  const text = chapterText('awaken', 'title');
  const index = name ? text.indexOf(name) : -1;
  if (index < 0) return [{ text, name: false }];
  return [
    // "Become the" stays together, so it never leaves "Become" alone on a line
    { text: text.slice(0, index).replace(/ (?=\S)/g, '\u00a0'), name: false },
    { text: name, name: true },
    { text: text.slice(index + name.length), name: false },
  ].filter((part) => part.text);
});

/* ---------------- inspector ---------------- */
type DetailScene = 'book' | 'altar' | 'drink';
type Detail = { label: string; detail: string };
function resolveDetail(id: string): Detail | null {
  const pair = (key: string): Detail => ({ label: tp(`details.${key}.label`), detail: tp(`details.${key}.detail`) });
  if (id === 'formula') return pair('formula');
  if (id === 'cauldron') return pair('cauldron');
  if (id === 'potion') return pair('sequencePotion');
  if (id === 'drink-potion') return pair('drinkPotion');
  if (id.startsWith('ingredient:')) {
    const item = ingredients.value.find((entry) => `ingredient:${entry.key}` === id);
    if (!item) return null;
    const source = ['droppable', 'foundable', 'mineable'].includes(item.source) ? item.source : 'other';
    return { label: item.name, detail: `${tp(`ingredients.${item.role}Role`)} · ${tp(`ingredients.source.${source}`)}` };
  }
  return null;
}

const sectionRef = ref<HTMLElement | null>(null);
const stageRef = ref<HTMLElement | null>(null);
const backdropRef = ref<HTMLImageElement | null>(null);
const progress = ref(0);
const entryProgress = ref(0);
const visible = ref(false);
// True once the chapter is within about a viewport: starts lazy downloads.
const near = ref(false);
const reducedMotion = useReducedMotion();
const activeDetailId = ref<string | null>(null);
const inspectorAnchor = ref<HTMLElement | null>(null);
const inspectorScene = ref<DetailScene | null>(null);
let observer: IntersectionObserver | null = null;
let nearObserver: IntersectionObserver | null = null;
let cancelPrewarm: (() => void) | null = null;
let stageObserver: ResizeObserver | null = null;
let frame = 0;

const activeChapterIndex = computed(() => {
  const index = CHAPTERS.findIndex((chapter) => progress.value < chapter.end);
  return index === -1 ? CHAPTERS.length - 1 : index;
});
const activeChapter = computed(() => CHAPTERS[activeChapterIndex.value]);
const activeDetail = computed(() => (activeDetailId.value ? resolveDetail(activeDetailId.value) : null));

/* ---------------- the stage ---------------- */
const stageSize = ref({ w: 0, h: 0, left: 0, top: 0 });
const stage = computed<StageLayout | null>(() => stageLayout(stageSize.value.w, stageSize.value.h));
function measureStage() {
  const el = stageRef.value;
  const sticky = el?.closest('.progression__sticky');
  if (!el || !sticky) return;
  const s = el.getBoundingClientRect();
  const k = sticky.getBoundingClientRect();
  stageSize.value = { w: el.clientWidth, h: el.clientHeight, left: s.left - k.left, top: s.top - k.top };
}

/* ---------------- the book window: read, then poured out over the cauldron ---------------- */
const bookAnchors = ref<Record<string, { x: number; y: number; size: number }>>({});
const toBrew = computed(() => (reducedMotion.value ? 0 : ease(progress.value, T.brewIn)));
const bookOut = computed(() => (reducedMotion.value ? 0 : ease(progress.value, T.bookOut)));
const bookTransform = computed(() => {
  const b = stage.value?.bookBrew;
  const k = toBrew.value;
  if (!b) return { s: 1, tx: 0, ty: 0 };
  // closed, it settles a little as it fades (never up under the header)
  return { s: lerp(1, b.s, k), tx: lerp(0, b.tx, k), ty: lerp(0, b.ty, k) + bookOut.value * 14 };
});
const departed = computed(() => {
  if (reducedMotion.value) return [];
  const starts = dropStarts(ingredients.value.length);
  return ingredients.value.filter((_, index) => progress.value >= starts[index]).map((item) => item.key);
});

const bookOpacity = computed(() => (reducedMotion.value ? 1 : 1 - span(progress.value, [T.bookOut[0] + 0.02, T.bookOut[1]])));
const altarOpacity = computed(() => (reducedMotion.value ? 1 : progress.value >= T.brewIn[0] - 0.005 && progress.value < T.cauldronOut[1] ? 1 : 0));
const drinkOpacity = computed(() => (reducedMotion.value ? 1 : progress.value >= T.brewFlash - 0.006 ? 1 : 0));

function windowStyle(opacity: number) {
  return {
    opacity: opacity.toFixed(4),
    visibility: opacity <= 0.001 ? 'hidden' : 'visible',
    pointerEvents: opacity > 0.5 ? 'auto' : 'none',
  } as const;
}
const bookWindowStyle = computed(() => {
  const t = bookTransform.value;
  return {
    ...windowStyle(bookOpacity.value),
    transform: `translate3d(${t.tx.toFixed(2)}px, ${t.ty.toFixed(2)}px, 0) scale(${t.s.toFixed(4)})`,
  };
});
const altarWindowStyle = computed(() => windowStyle(altarOpacity.value));
const drinkWindowStyle = computed(() => windowStyle(drinkOpacity.value));

/* ---------------- full-bleed dressing ---------------- */
const sectionVars = computed(() => {
  const g = progress.value;
  const motion = !reducedMotion.value;
  const l = stage.value;
  const s = stageSize.value;
  const brewing = span(g, [T.drops[0], T.boil[1]]) * (1 - span(g, [T.potionUp[1], T.cauldronOut[1]]));
  return {
    '--journey': g.toFixed(4),
    '--entry': entryProgress.value.toFixed(4),
    '--brew': (motion ? brewing : 0).toFixed(4),
    '--risk': (motion ? riskAt(g) : 0).toFixed(4),
    '--thump': (motion ? gulpPulse(g) : 0).toFixed(4),
    '--blackout': (motion ? blackoutAt(g) : 0).toFixed(4),
    '--flash': (motion ? flashAt(g) : 0).toFixed(4),
    '--moon': span(g, [T.lower[0], T.awaken[0] + T.awaken[1]]).toFixed(4),
    '--awaken': (motion ? awakenAt(g) : 0).toFixed(4),
    '--stand-x': `${(s.left + (l ? l.cx : s.w / 2)).toFixed(1)}px`,
    '--stand-y': `${(s.top + (l ? l.player.y + l.player.h * 0.3 : s.h * 0.4)).toFixed(1)}px`,
    // the moon fits between the stage's top and his chest, inside the stage's width
    '--moon-size': `${Math.max(160, l ? Math.min(560, 2 * (l.player.y + l.player.h * 0.3) - 12, l.w * 0.86) : 420).toFixed(1)}px`,
    '--floor-y': `${(s.top + (l ? l.cauldron.floorY : s.h * 0.85)).toFixed(1)}px`,
  };
});
/*
 * Each layer gets only the variables it reads. Set on the section, every scroll frame
 * restyled all ~260 elements under it (the scenes too); this way a frame restyles the
 * handful of layers whose own inputs moved, and a layer whose inputs are steady
 * (the hearth outside the brew, say) is not touched at all.
 */
const DRESS_VARS = {
  backdrop: ['--entry', '--journey', '--awaken', '--risk', '--blackout'],
  hearth: ['--brew', '--stand-x', '--floor-y'],
  moon: ['--moon', '--awaken', '--blackout', '--stand-x', '--stand-y', '--moon-size'],
  fogbank: ['--awaken', '--risk'],
  dread: ['--risk', '--thump', '--blackout', '--stand-x', '--stand-y'],
  burst: ['--flash', '--stand-x', '--stand-y'],
  heading: ['--entry', '--journey'],
  roofs: ['--entry'],
} as const;
type DressLayer = keyof typeof DRESS_VARS;
const dress = computed(() => {
  const vars = sectionVars.value as Record<string, string>;
  const out = {} as Record<DressLayer, Record<string, string>>;
  for (const layer of Object.keys(DRESS_VARS) as DressLayer[]) {
    out[layer] = Object.fromEntries(DRESS_VARS[layer].map((name) => [name, vars[name]]));
  }
  return out;
});
/* The moon's drifting bands and the dread's heartbeat only run while their layer can be seen. */
const moonLit = computed(() => Number(sectionVars.value['--moon']) > 0 || Number(sectionVars.value['--awaken']) > 0);
const dreadLit = computed(() => Number(sectionVars.value['--risk']) > 0 || Number(sectionVars.value['--blackout']) > 0);
/* The stage fades in over the first steps; as an opacity, not a variable, so the scenes under it are not restyled. */
const layoutStyle = computed(() => ({ opacity: clamp01((progress.value - 0.006) * 40).toFixed(4) }));
/*
 * The first chapter's copy and the book come up with the room, under the section's
 * heading (the story's clock starts before the pin, see scrollRange); the heading
 * lifts away as the room settles.
 */
const copyStyle = computed(() => {
  const k = clamp01((progress.value - 0.022) * 36);
  return { opacity: k.toFixed(4), transform: k < 1 ? `translate3d(0, ${((1 - k) * 16).toFixed(2)}px, 0)` : 'none' };
});
/* The page's own colour over the whole room at the very end (one opacity), so the room has no bottom edge. */
const exitProgress = ref(0);
const exitStyle = computed(() => {
  const k = exitProgress.value;
  return { opacity: (k * k * (3 - 2 * k)).toFixed(4), visibility: k <= 0.001 ? 'hidden' : 'visible' } as const;
});

/* ---------------- inspector plumbing ---------------- */
watch(activeChapterIndex, () => clearDetail());
watch([bookOpacity, altarOpacity, drinkOpacity], ([book, altar, drink]) => {
  const faded =
    (inspectorScene.value === 'book' && book <= 0.5) ||
    (inspectorScene.value === 'altar' && altar <= 0.5) ||
    (inspectorScene.value === 'drink' && drink <= 0.5);
  if (faded) clearDetail();
});
// A new card: everything on stage changes, so no note stays pinned to old copy.
watch(currentId, () => clearDetail());

function showDetail(id: string, scene: DetailScene, anchor: HTMLElement) {
  if (!resolveDetail(id) || !anchor) return;
  activeDetailId.value = id;
  inspectorAnchor.value = anchor;
  inspectorScene.value = scene;
}
function clearDetail() {
  activeDetailId.value = null;
  inspectorAnchor.value = null;
  inspectorScene.value = null;
}
function onStageClick(event: MouseEvent) {
  if (!(event.target instanceof HTMLElement) || !event.target.closest('button')) clearDetail();
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && activeDetailId.value) clearDetail();
}
function clearExpiredInspector(next: number) {
  if (inspectorScene.value === 'book' && next >= T.readable[1]) clearDetail();
}

/* ---------------- scroll ---------------- */
/*
 * The section's page offset and height are cached (refreshed on resize, when the
 * page above it changes height, and when it comes into view), so a scroll frame
 * does no layout read: it only reads scrollY.
 */
let sectionTop = 0;
let sectionHeight = 0;
let pageObserver: ResizeObserver | null = null;
function measureSection() {
  const section = sectionRef.value;
  if (!section) return;
  const rect = section.getBoundingClientRect();
  sectionTop = rect.top + scrollY;
  sectionHeight = rect.height;
}
function onResize() {
  measureSection();
  update();
}
/*
 * The pinned scroll is 2.8 viewports of story plus the voices' dwell (the section's
 * min-height); storyAt spends the dwell inside the voices, so each line can be read.
 * The story's clock starts `lead` px before the pin, while the room is still rising
 * (the book falls in and the first chapter's copy arrives with the heading, so the way
 * in is never an empty room), and it ends `tail` px before the pin lets go: that last
 * stretch holds the awakening, then dissolves the room into the page over one wheel
 * step (exitProgress). The next section is pulled up over the room's last OVERLAP
 * screens (ArcanaHome); the dissolve is done just as that section's head (one section
 * pad, about HEAD screens, below its top) comes into view: no edge, and no empty page.
 */
const LEAD = 0.5;
const TAIL = 0.5;
const FADE = 0.14;
const OVERLAP = 0.35;
const HEAD = 0.1;
function scrollRange(height = sectionHeight) {
  const pin = Math.max(1, height - innerHeight);
  const dwell = Math.max(0, Math.min(pin - 1, pin - innerHeight * 2.8));
  const lead = innerHeight * LEAD;
  const tail = Math.min(innerHeight * TAIL, pin * 0.2);
  return { range: Math.max(1, pin + lead - tail), dwell, lead, tail, pin };
}
/* the copy and the rail step out as the room starts to dissolve (no pale ghost text on the page colour) */
const railLeaving = computed(() => exitProgress.value > 0);
const copyLeaving = railLeaving;
function update() {
  if (!visible.value || !sectionRef.value || frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    if (!sectionRef.value) return;
    const top = sectionTop - scrollY;
    entryProgress.value = clamp01(1 - Math.max(0, top) / innerHeight);
    if (reducedMotion.value) return;
    const { range, dwell, lead, pin } = scrollRange();
    const next = storyAt(Math.max(0, lead - top), range, dwell);
    progress.value = next;
    const fade = innerHeight * FADE;
    exitProgress.value = clamp01((-top - (pin - innerHeight * (OVERLAP - HEAD) - fade)) / fade);
    clearExpiredInspector(next);
  });
}
function goToChapter(index: number) {
  const section = sectionRef.value;
  const chapter = CHAPTERS[index];
  if (!section || !chapter) return;
  clearDetail();
  const rect = section.getBoundingClientRect();
  const { range, dwell, lead } = scrollRange(rect.height);
  const sectionTop = rect.top + scrollY;
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
  const target = range > 1 ? sectionTop - lead + scrollAt(chapter.landing, range, dwell) : sectionTop;
  const destination = Math.round(Math.min(maxScroll, Math.max(sectionTop, target)));
  scrollTo({ top: destination, behavior: reducedMotion.value ? 'instant' : 'smooth' });
}

onMounted(() => {
  observer = new IntersectionObserver(([entry]) => {
    visible.value = entry.isIntersecting;
    if (visible.value) {
      measureSection();
      measureStage();
      update();
    }
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
  if (stageRef.value) {
    stageObserver = new ResizeObserver(measureStage);
    stageObserver.observe(stageRef.value);
  }
  // the section's own height, or anything above it growing or shrinking, moves it on the page
  pageObserver = new ResizeObserver(onResize);
  if (sectionRef.value) {
    pageObserver.observe(sectionRef.value);
    if (sectionRef.value.parentElement) pageObserver.observe(sectionRef.value.parentElement);
  }
  // The backdrop photo (a ~50 ms decode) is decoded ahead, not on the first frame it shows.
  cancelPrewarm = whenSettled(() => {
    const img = backdropRef.value;
    if (img && isNearby(img)) {
      img.loading = 'eager';
      void img.decode().catch(() => undefined);
    }
  });
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', onResize, { passive: true });
  addEventListener('keydown', onKeydown);
  measureSection();
  measureStage();
});
onUnmounted(() => {
  cancelPrewarm?.();
  observer?.disconnect();
  nearObserver?.disconnect();
  stageObserver?.disconnect();
  pageObserver?.disconnect();
  removeEventListener('scroll', update);
  removeEventListener('resize', onResize);
  removeEventListener('keydown', onKeydown);
  if (frame) cancelAnimationFrame(frame);
});
</script>

<style scoped>
.progression {
  --journey: 0;
  --entry: 0;
  --awaken: 0;
  --brew: 0;
  --risk: 0;
  --thump: 0;
  --blackout: 0;
  --flash: 0;
  --moon: 0;
  /* the page's content edge (ArcanaHome --arc-edge): copy, rail and stage line up with every section */
  --rail: var(--arc-edge, clamp(20px, 4vw, 64px));
  --copy-w: clamp(272px, 27vw, 400px);
  /* the spec's group heading (h3) */
  --h3-size: var(--arc-fs-h2, clamp(28px, 3vw, 42px));
  --top: calc(var(--site-header-stack, 106px) + clamp(14px, 3vh, 36px));
  position: relative;
  /* 2.8 viewports of story, plus the voices' dwell (see scrollRange) */
  min-height: calc(380svh + max(760px, 84svh));
  color: var(--arc-ink);
  background: var(--arc-bg);
  isolation: isolate;
}

/*
 * The room's top edge is Backlund seen from above the brewery: three bands of blocky roofs,
 * each a step nearer and darker, the nearest one the room's own colour. They rise out of the
 * room's top as the story enters, the far roofs first, over the strip the hero keeps free
 * for them (--roof-h): the hero's sky deepens into the room roof by roof instead of
 * meeting it at one hard edge. The strip clips them, so a band still below its line is
 * never seen inside the room. Transform only; each band is its own layer.
 */
.progression__roofs {
  --roof-far: color-mix(in oklab, var(--acc) 14%, #25232b);
  --roof-mid: color-mix(in oklab, var(--acc) 7%, #17161c);
  position: absolute;
  z-index: 2;
  right: 0;
  bottom: calc(100% - 1px);
  left: 0;
  height: var(--roof-h, 120px);
  overflow: hidden;
  pointer-events: none;
}

/* on paper the far roofs sit in the morning haze, the nearer ones darken toward the room */
:root[data-theme="parchment"] .progression__roofs {
  --roof-far: color-mix(in oklab, var(--arc-bg) 22%, var(--arc-page, #efede8));
  --roof-mid: color-mix(in oklab, var(--arc-bg) 52%, var(--arc-page, #efede8));
  --roof-sky: var(--arc-page, #efede8);
}

.progression__roof {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  -webkit-mask: var(--roof-shape) 0 100% / auto 100% repeat-x;
  mask: var(--roof-shape) 0 100% / auto 100% repeat-x;
  transform: translate3d(0, calc((1 - var(--k)) * 101%), 0);
  will-change: transform;
}

.progression__roof--far {
  --k: clamp(0, calc((var(--entry) - 0.01) * 4.2), 1);
  --roof-shape: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%204400%20220%22%20width%3D%224400%22%20height%3D%22220%22%20preserveAspectRatio%3D%22none%22%3E%3Cpath%20d%3D%22M0%20220%20L0%20150%20L0%20142%20L8%20142%20L8%20134%20L16%20134%20L16%20126%20L24%20126%20L24%20118%20L32%20118%20L32%20110%20L48%20110%20L48%20118%20L56%20118%20L56%20126%20L64%20126%20L64%20134%20L72%20134%20L72%20142%20L80%20142%20L80%20150%20L88%20150%20L88%20134%20L96%20134%20L96%20150%20L112%20150%20L120%20150%20L120%20102%20L120%2086%20L124%2086%20L124%2070%20L128%2070%20L128%2046%20L136%2046%20L136%2070%20L140%2070%20L140%2086%20L144%2086%20L144%20102%20L144%20150%20L176%20150%20L208%20150%20L208%20134%20L216%20134%20L216%20150%20L272%20150%20L272%20118%20L280%20118%20L280%20102%20L288%20102%20L288%20118%20L304%20118%20L312%20118%20L312%20102%20L320%20102%20L320%20118%20L336%20118%20L344%20118%20L344%20110%20L368%20110%20L368%20118%20L376%20118%20L376%20150%20L424%20150%20L432%20150%20L432%20134%20L440%20134%20L440%20150%20L504%20150%20L504%20126%20L568%20126%20L648%20126%20L648%20142%20L720%20142%20L720%20150%20L784%20150%20L784%20110%20L792%20110%20L792%20102%20L800%20102%20L800%2094%20L808%2094%20L808%2086%20L816%2086%20L816%2078%20L832%2078%20L832%2086%20L840%2086%20L840%2094%20L848%2094%20L848%20102%20L856%20102%20L856%20110%20L864%20110%20L864%20150%20L880%20150%20L880%20134%20L888%20134%20L888%20150%20L904%20150%20L904%20126%20L912%20126%20L912%20118%20L920%20118%20L920%20110%20L936%20110%20L936%20118%20L944%20118%20L944%20126%20L952%20126%20L952%20102%20L992%20102%20L992%20134%20L1072%20134%20L1072%20150%20L1184%20150%20L1184%20110%20L1280%20110%20L1280%2094%20L1288%2094%20L1288%20110%20L1296%20110%20L1368%20110%20L1368%20134%20L1480%20134%20L1480%20150%20L1496%20150%20L1496%20134%20L1504%20134%20L1504%20150%20L1560%20150%20L1568%20150%20L1568%20142%20L1576%20142%20L1576%20134%20L1584%20134%20L1584%20126%20L1592%20126%20L1592%20118%20L1640%20118%20L1640%20126%20L1648%20126%20L1648%20134%20L1656%20134%20L1656%20142%20L1664%20142%20L1664%20150%20L1672%20150%20L1672%20142%20L1728%20142%20L1728%20126%20L1736%20126%20L1736%20142%20L1744%20142%20L1744%20150%20L1816%20150%20L1816%2094%20L1840%2094%20L1840%20150%20L1856%20150%20L1856%20102%20L1952%20102%20L1952%20110%20L2032%20110%20L2032%20150%20L2056%20150%20L2056%20102%20L2056%2086%20L2060%2086%20L2060%2062%20L2068%2062%20L2068%2086%20L2072%2086%20L2072%20102%20L2072%20150%20L2080%20150%20L2080%20134%20L2088%20134%20L2088%20126%20L2096%20126%20L2096%20118%20L2112%20118%20L2112%20126%20L2120%20126%20L2120%20134%20L2128%20134%20L2128%20126%20L2176%20126%20L2176%20142%20L2256%20142%20L2256%20126%20L2288%20126%20L2296%20126%20L2296%20118%20L2304%20118%20L2304%20110%20L2312%20110%20L2312%20102%20L2320%20102%20L2320%2094%20L2352%2094%20L2352%20102%20L2360%20102%20L2360%20110%20L2368%20110%20L2368%20118%20L2376%20118%20L2376%20126%20L2384%20126%20L2392%20126%20L2392%20110%20L2400%20110%20L2400%20126%20L2424%20126%20L2432%20126%20L2432%2094%20L2432%2078%20L2436%2078%20L2436%2062%20L2440%2062%20L2440%2038%20L2448%2038%20L2448%2062%20L2452%2062%20L2452%2078%20L2456%2078%20L2456%2094%20L2456%20126%20L2488%20126%20L2488%20118%20L2496%20118%20L2496%2086%20L2520%2086%20L2520%20118%20L2536%20118%20L2536%20142%20L2632%20142%20L2632%20126%20L2664%20126%20L2664%2064%20L2664%2048%20L2668%2048%20L2668%2032%20L2672%2032%20L2672%208%20L2680%208%20L2680%2032%20L2684%2032%20L2684%2048%20L2688%2048%20L2688%2064%20L2688%20126%20L2712%20126%20L2712%20142%20L2720%20142%20L2720%2064%20L2744%2064%20L2744%20142%20L2752%20142%20L2752%20118%20L2760%20118%20L2760%2078%20L2792%2078%20L2792%20118%20L2800%20118%20L2800%20102%20L2832%20102%20L2832%20110%20L2872%20110%20L2872%20134%20L2920%20134%20L2920%20110%20L2928%20110%20L2928%20102%20L2936%20102%20L2936%2094%20L2944%2094%20L2944%2086%20L2952%2086%20L2952%2078%20L2968%2078%20L2968%2086%20L2976%2086%20L2976%2094%20L2984%2094%20L2984%20102%20L2992%20102%20L2992%20110%20L3000%20110%20L3000%20102%20L3008%20102%20L3008%2094%20L3016%2094%20L3016%2086%20L3024%2086%20L3024%2078%20L3040%2078%20L3040%2086%20L3048%2086%20L3048%2094%20L3056%2094%20L3056%20102%20L3064%20102%20L3064%20110%20L3128%20110%20L3128%2094%20L3136%2094%20L3136%20110%20L3160%20110%20L3216%20110%20L3216%2064%20L3216%2048%20L3220%2048%20L3220%2024%20L3228%2024%20L3228%2048%20L3232%2048%20L3232%2064%20L3232%20110%20L3240%20110%20L3288%20110%20L3288%2094%20L3296%2094%20L3296%20110%20L3304%20110%20L3304%20134%20L3320%20134%20L3320%2064%20L3320%2048%20L3324%2048%20L3324%2024%20L3332%2024%20L3332%2048%20L3336%2048%20L3336%2064%20L3336%20134%20L3384%20134%20L3384%20126%20L3448%20126%20L3456%20126%20L3456%20110%20L3464%20110%20L3464%20126%20L3480%20126%20L3520%20126%20L3520%20142%20L3528%20142%20L3528%20134%20L3536%20134%20L3536%20126%20L3544%20126%20L3544%20118%20L3552%20118%20L3552%20110%20L3600%20110%20L3600%20118%20L3608%20118%20L3608%20126%20L3616%20126%20L3616%20134%20L3624%20134%20L3624%20142%20L3632%20142%20L3632%20150%20L3712%20150%20L3712%20126%20L3720%20126%20L3720%20118%20L3728%20118%20L3728%20110%20L3736%20110%20L3736%20102%20L3744%20102%20L3744%2094%20L3776%2094%20L3776%20102%20L3784%20102%20L3784%20110%20L3792%20110%20L3792%20118%20L3800%20118%20L3800%20126%20L3808%20126%20L3808%20110%20L3816%20110%20L3816%2070%20L3832%2070%20L3832%20110%20L3848%20110%20L3848%20102%20L3960%20102%20L3960%20110%20L4032%20110%20L4032%2094%20L4040%2094%20L4040%20110%20L4072%20110%20L4072%20150%20L4080%20150%20L4080%2064%20L4112%2064%20L4112%20150%20L4120%20150%20L4120%20126%20L4136%20126%20L4136%20110%20L4144%20110%20L4144%20126%20L4168%20126%20L4168%20134%20L4176%20134%20L4176%20126%20L4192%20126%20L4192%20134%20L4200%20134%20L4200%20102%20L4232%20102%20L4232%2086%20L4240%2086%20L4240%20102%20L4264%20102%20L4264%20150%20L4296%20150%20L4296%20134%20L4304%20134%20L4304%20150%20L4312%20150%20L4312%20102%20L4376%20102%20L4376%20150%20L4400%20150%20L4400%20220%20Z%22%20fill%3D%22%23000%22%2F%3E%3C%2Fsvg%3E");
  height: 100%;
  background: var(--roof-far);
}

/* the farthest roofs fade up into the sky */
.progression__roof--far::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, var(--roof-sky, transparent), transparent 55%);
  content: '';
}

.progression__roof--mid {
  --k: clamp(0, calc((var(--entry) - 0.03) * 3.8), 1);
  --roof-shape: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%204000%20220%22%20width%3D%224000%22%20height%3D%22220%22%20preserveAspectRatio%3D%22none%22%3E%3Cpath%20d%3D%22M0%20220%20L0%20166%20L32%20166%20L32%20118%20L56%20118%20L56%20166%20L72%20166%20L72%20126%20L80%20126%20L80%20118%20L88%20118%20L88%20110%20L104%20110%20L104%20118%20L112%20118%20L112%20126%20L120%20126%20L120%20166%20L128%20166%20L128%20158%20L136%20158%20L136%20150%20L144%20150%20L144%20142%20L152%20142%20L152%20134%20L200%20134%20L200%20142%20L208%20142%20L208%20150%20L216%20150%20L216%20158%20L224%20158%20L224%20166%20L232%20166%20L296%20166%20L296%20118%20L296%20102%20L300%20102%20L300%2086%20L304%2086%20L304%2070%20L308%2070%20L308%2046%20L316%2046%20L316%2070%20L320%2070%20L320%2086%20L324%2086%20L324%20102%20L328%20102%20L328%20118%20L328%20166%20L344%20166%20L344%20150%20L352%20150%20L352%20134%20L360%20134%20L360%20150%20L440%20150%20L440%20126%20L448%20126%20L448%20118%20L456%20118%20L456%20110%20L464%20110%20L464%20102%20L472%20102%20L472%2094%20L488%2094%20L488%20102%20L496%20102%20L496%20110%20L504%20110%20L504%20118%20L512%20118%20L512%20126%20L520%20126%20L528%20126%20L528%20118%20L536%20118%20L536%20110%20L544%20110%20L544%20102%20L560%20102%20L560%20110%20L568%20110%20L568%20118%20L576%20118%20L576%20126%20L584%20126%20L584%20134%20L592%20134%20L592%20126%20L600%20126%20L600%20118%20L608%20118%20L608%20110%20L616%20110%20L616%20102%20L632%20102%20L632%20110%20L640%20110%20L640%20118%20L648%20118%20L648%20126%20L656%20126%20L656%20134%20L664%20134%20L680%20134%20L680%2070%20L704%2070%20L704%20134%20L744%20134%20L744%20126%20L768%20126%20L768%20110%20L776%20110%20L776%20126%20L856%20126%20L872%20126%20L872%20110%20L880%20110%20L880%20126%20L936%20126%20L936%20166%20L944%20166%20L944%20158%20L968%20158%20L968%20166%20L976%20166%20L976%20134%20L984%20134%20L984%20126%20L992%20126%20L992%20118%20L1000%20118%20L1000%20110%20L1024%20110%20L1024%20118%20L1032%20118%20L1032%20126%20L1040%20126%20L1040%20134%20L1048%20134%20L1048%20166%20L1056%20166%20L1056%20158%20L1064%20158%20L1064%20150%20L1072%20150%20L1072%20142%20L1080%20142%20L1080%20134%20L1096%20134%20L1096%20142%20L1104%20142%20L1104%20150%20L1112%20150%20L1112%20158%20L1120%20158%20L1120%20166%20L1128%20166%20L1128%20134%20L1136%20134%20L1136%20126%20L1144%20126%20L1144%20118%20L1152%20118%20L1152%20110%20L1176%20110%20L1176%20118%20L1184%20118%20L1184%20126%20L1192%20126%20L1192%20134%20L1200%20134%20L1208%20134%20L1208%20126%20L1216%20126%20L1216%20118%20L1224%20118%20L1224%20110%20L1232%20110%20L1232%20102%20L1280%20102%20L1280%20110%20L1288%20110%20L1288%20118%20L1296%20118%20L1296%20126%20L1304%20126%20L1304%20134%20L1312%20134%20L1312%20166%20L1344%20166%20L1344%20150%20L1352%20150%20L1352%20166%20L1360%20166%20L1360%20150%20L1368%20150%20L1368%20142%20L1376%20142%20L1376%20134%20L1384%20134%20L1384%20126%20L1400%20126%20L1400%20134%20L1408%20134%20L1408%20142%20L1416%20142%20L1416%20150%20L1424%20150%20L1424%20142%20L1432%20142%20L1432%20134%20L1456%20134%20L1456%20142%20L1464%20142%20L1464%20166%20L1472%20166%20L1472%20150%20L1480%20150%20L1480%20166%20L1496%20166%20L1496%20126%20L1504%20126%20L1504%2070%20L1520%2070%20L1520%20126%20L1560%20126%20L1616%20126%20L1616%2078%20L1616%2062%20L1620%2062%20L1620%2038%20L1628%2038%20L1628%2062%20L1632%2062%20L1632%2078%20L1632%20126%20L1672%20126%20L1672%20150%20L1680%20150%20L1680%20142%20L1704%20142%20L1704%20150%20L1712%20150%20L1712%20142%20L1720%20142%20L1720%20126%20L1728%20126%20L1728%20142%20L1776%20142%20L1776%20126%20L1784%20126%20L1784%20118%20L1792%20118%20L1792%20110%20L1808%20110%20L1808%20118%20L1816%20118%20L1816%20126%20L1824%20126%20L1824%20150%20L1832%20150%20L1832%20102%20L1848%20102%20L1848%20150%20L1888%20150%20L1888%20158%20L1984%20158%20L1984%20166%20L2080%20166%20L2080%20134%20L2088%20134%20L2088%20126%20L2096%20126%20L2096%20118%20L2104%20118%20L2104%20110%20L2120%20110%20L2120%20118%20L2128%20118%20L2128%20126%20L2136%20126%20L2136%20134%20L2144%20134%20L2144%20150%20L2240%20150%20L2248%20150%20L2248%20110%20L2280%20110%20L2280%20150%20L2272%20150%20L2272%20158%20L2280%20158%20L2280%20150%20L2288%20150%20L2288%20142%20L2296%20142%20L2296%20134%20L2304%20134%20L2304%20126%20L2336%20126%20L2336%20134%20L2344%20134%20L2344%20142%20L2352%20142%20L2352%20150%20L2360%20150%20L2360%20158%20L2368%20158%20L2368%20150%20L2376%20150%20L2376%20142%20L2400%20142%20L2400%20150%20L2408%20150%20L2408%20158%20L2448%20158%20L2448%20126%20L2456%20126%20L2456%20118%20L2464%20118%20L2464%20110%20L2472%20110%20L2472%20102%20L2480%20102%20L2480%2094%20L2528%2094%20L2528%20102%20L2536%20102%20L2536%20110%20L2544%20110%20L2544%20118%20L2552%20118%20L2552%20126%20L2560%20126%20L2560%20142%20L2608%20142%20L2608%2094%20L2608%2078%20L2612%2078%20L2612%2054%20L2620%2054%20L2620%2078%20L2624%2078%20L2624%2094%20L2624%20142%20L2640%20142%20L2640%20158%20L2672%20158%20L2672%20142%20L2712%20142%20L2712%20134%20L2720%20134%20L2720%20126%20L2728%20126%20L2728%20118%20L2744%20118%20L2744%20126%20L2752%20126%20L2752%20134%20L2760%20134%20L2760%20166%20L2768%20166%20L2768%20158%20L2776%20158%20L2776%20150%20L2784%20150%20L2784%20142%20L2808%20142%20L2808%20150%20L2816%20150%20L2816%20158%20L2824%20158%20L2824%20166%20L2832%20166%20L2832%20142%20L2840%20142%20L2840%20134%20L2856%20134%20L2856%20142%20L2864%20142%20L2864%20126%20L2872%20126%20L2872%20118%20L2888%20118%20L2888%20126%20L2896%20126%20L2896%20150%20L2992%20150%20L3024%20150%20L3024%20134%20L3032%20134%20L3032%20150%20L3064%20150%20L3064%20142%20L3096%20142%20L3096%20134%20L3104%20134%20L3104%20126%20L3112%20126%20L3112%20118%20L3120%20118%20L3120%20110%20L3144%20110%20L3144%20118%20L3152%20118%20L3152%20126%20L3160%20126%20L3160%20134%20L3168%20134%20L3168%20142%20L3176%20142%20L3176%20134%20L3200%20134%20L3200%20142%20L3208%20142%20L3208%20158%20L3216%20158%20L3216%20150%20L3224%20150%20L3224%20142%20L3232%20142%20L3232%20134%20L3256%20134%20L3256%20142%20L3264%20142%20L3264%20150%20L3272%20150%20L3272%20158%20L3280%20158%20L3280%20134%20L3288%20134%20L3288%20126%20L3312%20126%20L3312%20134%20L3320%20134%20L3320%20150%20L3328%20150%20L3328%20142%20L3352%20142%20L3352%20150%20L3360%20150%20L3360%20166%20L3376%20166%20L3376%20150%20L3384%20150%20L3384%20166%20L3472%20166%20L3472%20134%20L3480%20134%20L3480%20118%20L3488%20118%20L3488%20134%20L3536%20134%20L3536%20158%20L3544%20158%20L3544%20150%20L3552%20150%20L3552%20142%20L3560%20142%20L3560%20134%20L3584%20134%20L3584%20142%20L3592%20142%20L3592%20150%20L3600%20150%20L3600%20158%20L3608%20158%20L3608%20134%20L3640%20134%20L3640%20118%20L3648%20118%20L3648%20134%20L3656%20134%20L3656%20150%20L3736%20150%20L3736%20166%20L3784%20166%20L3792%20166%20L3792%20158%20L3800%20158%20L3800%20150%20L3816%20150%20L3816%20158%20L3824%20158%20L3824%20166%20L3832%20166%20L3832%20126%20L3840%20126%20L3840%20118%20L3848%20118%20L3848%20110%20L3864%20110%20L3864%20118%20L3872%20118%20L3872%20126%20L3880%20126%20L3880%20134%20L3888%20134%20L3888%20118%20L3896%20118%20L3896%20134%20L3952%20134%20L3952%20166%20L4000%20166%20L4000%20220%20Z%22%20fill%3D%22%23000%22%2F%3E%3C%2Fsvg%3E");
  height: 78%;
  background: var(--roof-mid);
}

.progression__roof--near {
  --k: clamp(0, calc((var(--entry) - 0.05) * 3.4), 1);
  --roof-shape: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%203600%20220%22%20width%3D%223600%22%20height%3D%22220%22%20preserveAspectRatio%3D%22none%22%3E%3Cpath%20d%3D%22M0%20220%20L0%20186%20L0%20170%20L8%20170%20L8%20162%20L16%20162%20L16%20154%20L24%20154%20L24%20146%20L32%20146%20L32%20138%20L64%20138%20L64%20146%20L72%20146%20L72%20154%20L80%20154%20L80%20162%20L88%20162%20L88%20170%20L96%20170%20L96%20162%20L104%20162%20L104%20154%20L112%20154%20L112%20146%20L128%20146%20L128%20154%20L136%20154%20L136%20162%20L144%20162%20L144%20154%20L152%20154%20L152%20146%20L160%20146%20L160%20138%20L168%20138%20L168%20130%20L192%20130%20L192%20138%20L200%20138%20L200%20146%20L208%20146%20L208%20154%20L216%20154%20L216%20178%20L248%20178%20L360%20178%20L368%20178%20L368%20170%20L376%20170%20L376%20162%20L384%20162%20L384%20154%20L392%20154%20L392%20146%20L408%20146%20L408%20154%20L416%20154%20L416%20162%20L424%20162%20L424%20170%20L432%20170%20L432%20178%20L440%20178%20L440%20186%20L456%20186%20L456%20170%20L464%20170%20L464%20186%20L472%20186%20L536%20186%20L536%20154%20L552%20154%20L552%20138%20L560%20138%20L560%20154%20L584%20154%20L584%20186%20L592%20186%20L592%20178%20L600%20178%20L600%20170%20L616%20170%20L616%20178%20L624%20178%20L624%20186%20L632%20186%20L632%20154%20L640%20154%20L640%20106%20L672%20106%20L672%20154%20L696%20154%20L696%20170%20L704%20170%20L704%20162%20L720%20162%20L720%20170%20L728%20170%20L728%20186%20L736%20186%20L736%20178%20L760%20178%20L760%20186%20L768%20186%20L768%20162%20L776%20162%20L776%20154%20L784%20154%20L784%20146%20L792%20146%20L792%20138%20L800%20138%20L800%20130%20L848%20130%20L848%20138%20L856%20138%20L856%20146%20L864%20146%20L864%20154%20L872%20154%20L872%20162%20L880%20162%20L880%20178%20L888%20178%20L888%20130%20L920%20130%20L920%20178%20L920%20154%20L968%20154%20L968%20106%20L984%20106%20L984%20154%20L992%20154%20L992%20186%20L1040%20186%20L1040%20178%20L1080%20178%20L1080%20154%20L1088%20154%20L1088%20146%20L1112%20146%20L1112%20154%20L1120%20154%20L1120%20178%20L1128%20178%20L1128%20170%20L1152%20170%20L1152%20178%20L1160%20178%20L1160%20162%20L1240%20162%20L1240%20186%20L1272%20186%20L1272%20170%20L1280%20170%20L1280%20186%20L1352%20186%20L1352%20170%20L1360%20170%20L1360%20162%20L1368%20162%20L1368%20154%20L1376%20154%20L1376%20146%20L1392%20146%20L1392%20154%20L1400%20154%20L1400%20162%20L1408%20162%20L1408%20170%20L1416%20170%20L1416%20154%20L1424%20154%20L1424%20146%20L1432%20146%20L1432%20138%20L1440%20138%20L1440%20130%20L1448%20130%20L1448%20122%20L1464%20122%20L1464%20130%20L1472%20130%20L1472%20138%20L1480%20138%20L1480%20146%20L1488%20146%20L1488%20154%20L1496%20154%20L1496%20162%20L1512%20162%20L1512%20146%20L1520%20146%20L1520%20162%20L1568%20162%20L1568%20186%20L1576%20186%20L1576%20178%20L1584%20178%20L1584%20170%20L1592%20170%20L1592%20162%20L1608%20162%20L1608%20170%20L1616%20170%20L1616%20178%20L1624%20178%20L1624%20186%20L1632%20186%20L1632%20178%20L1704%20178%20L1704%20146%20L1720%20146%20L1720%20178%20L1744%20178%20L1752%20178%20L1752%20170%20L1776%20170%20L1776%20178%20L1784%20178%20L1784%20162%20L1824%20162%20L1936%20162%20L1936%20186%20L1944%20186%20L1944%20178%20L1952%20178%20L1952%20170%20L1960%20170%20L1960%20162%20L1968%20162%20L1968%20154%20L1984%20154%20L1984%20162%20L1992%20162%20L1992%20170%20L2000%20170%20L2000%20178%20L2008%20178%20L2008%20186%20L2016%20186%20L2016%20178%20L2024%20178%20L2024%20170%20L2032%20170%20L2032%20162%20L2048%20162%20L2048%20170%20L2056%20170%20L2056%20178%20L2064%20178%20L2064%20162%20L2112%20162%20L2112%20186%20L2120%20186%20L2120%20178%20L2144%20178%20L2144%20186%20L2152%20186%20L2152%20178%20L2232%20178%20L2232%20170%20L2240%20170%20L2240%20162%20L2248%20162%20L2248%20154%20L2256%20154%20L2256%20146%20L2280%20146%20L2280%20154%20L2288%20154%20L2288%20162%20L2296%20162%20L2296%20170%20L2304%20170%20L2304%20154%20L2312%20154%20L2312%20146%20L2320%20146%20L2320%20138%20L2328%20138%20L2328%20130%20L2336%20130%20L2336%20122%20L2368%20122%20L2368%20130%20L2376%20130%20L2376%20138%20L2384%20138%20L2384%20146%20L2392%20146%20L2392%20154%20L2400%20154%20L2400%20170%20L2440%20170%20L2440%20162%20L2512%20162%20L2512%20146%20L2520%20146%20L2520%20162%20L2536%20162%20L2536%20154%20L2544%20154%20L2544%20146%20L2552%20146%20L2552%20138%20L2560%20138%20L2560%20130%20L2568%20130%20L2568%20122%20L2616%20122%20L2616%20130%20L2624%20130%20L2624%20138%20L2632%20138%20L2632%20146%20L2640%20146%20L2640%20154%20L2648%20154%20L2648%20178%20L2680%20178%20L2680%20162%20L2688%20162%20L2688%20178%20L2760%20178%20L2760%20162%20L2872%20162%20L2872%20154%20L2904%20154%20L2904%20178%20L2912%20178%20L2912%20170%20L2928%20170%20L2928%20178%20L2936%20178%20L2936%20170%20L3048%20170%20L3048%20186%20L3056%20186%20L3056%20178%20L3064%20178%20L3064%20170%20L3072%20170%20L3072%20162%20L3080%20162%20L3080%20154%20L3112%20154%20L3112%20162%20L3120%20162%20L3120%20170%20L3128%20170%20L3128%20178%20L3136%20178%20L3136%20186%20L3144%20186%20L3144%20178%20L3184%20178%20L3184%20130%20L3184%20114%20L3188%20114%20L3188%2098%20L3192%2098%20L3192%2082%20L3196%2082%20L3196%2058%20L3204%2058%20L3204%2082%20L3208%2082%20L3208%2098%20L3212%2098%20L3212%20114%20L3216%20114%20L3216%20130%20L3216%20178%20L3240%20178%20L3240%20154%20L3256%20154%20L3256%20106%20L3288%20106%20L3288%20154%20L3312%20154%20L3320%20154%20L3320%20146%20L3336%20146%20L3336%20154%20L3344%20154%20L3344%20162%20L3352%20162%20L3352%20130%20L3384%20130%20L3384%20162%20L3392%20162%20L3400%20162%20L3400%20154%20L3408%20154%20L3408%20146%20L3416%20146%20L3416%20138%20L3440%20138%20L3440%20146%20L3448%20146%20L3448%20154%20L3456%20154%20L3456%20162%20L3464%20162%20L3464%20186%20L3520%20186%20L3520%20170%20L3528%20170%20L3528%20186%20L3576%20186%20L3600%20186%20L3600%20220%20Z%22%20fill%3D%22%23000%22%2F%3E%3C%2Fsvg%3E");
  height: 56%;
  background: var(--arc-bg);
}

.progression__sticky {
  position: sticky;
  top: 0;
  height: 100svh;
  min-height: 620px;
  overflow: hidden;
  background: var(--arc-bg);
}

/* ---- the brewery capture, sunk into the dark ---- */
.progression__backdrop,
.progression__hearth,
.progression__fogbank,
.progression__vignette,
.progression__burst,
.progression__dread {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* Scroll drives these full-bleed layers' opacity and transform every frame: on their own
   compositor layers that is a cheap re-composite instead of repainting (and re-filtering
   the backdrop photo) across the whole sticky screen. */
.progression__backdrop,
.progression__hearth,
.progression__burst,
.progression__dread,
.progression-nav__line b {
  will-change: transform, opacity;
}

/*
 * On the way in the room is further away than the page: it rises a quarter slower
 * than the section (it starts a quarter of a screen up and settles as the section
 * pins), so the descent from the hero carries on into it. It is a quarter of a
 * screen taller than the window for that, and lights up as it comes.
 */
.progression__backdrop {
  bottom: -25%;
  opacity: calc(clamp(0, (var(--entry) - 0.02) * 3, 1) * max(0, 0.5 + 0.16 * (1 - clamp(0, (var(--journey) - 0.2) * 8, 1)) - var(--awaken) * 0.3 - var(--risk) * 0.26 - var(--blackout) * 0.24));
  transform: translate3d(0, calc((1 - var(--entry)) * -20%), 0) scale(calc(1.04 + var(--journey) * 0.06));
  transform-origin: 50% 48%;
}

.progression__backdrop img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center 40%;
  filter: grayscale(0.85) brightness(0.36) contrast(1.1);
}

/* soul fire and the brew light the room from the cauldron */
.progression__hearth {
  opacity: var(--brew);
  background:
    radial-gradient(ellipse 22% 26% at var(--stand-x, 60%) var(--floor-y, 80%), rgba(169, 198, 214, 0.1), transparent 70%),
    radial-gradient(ellipse 34% 46% at var(--stand-x, 60%) calc(var(--floor-y, 80%) - 14%), color-mix(in oklab, var(--acc) 16%, transparent), transparent 72%);
}

/* ---- the moon, in the drawn Pathway's colour ---- */
.progression__moon {
  position: absolute;
  top: var(--stand-y, 40%);
  left: var(--stand-x, 60%);
  width: var(--moon-size, 420px);
  aspect-ratio: 1;
  opacity: calc(min(1, var(--moon) * 0.3 + var(--awaken)) * (1 - var(--blackout) * 0.7));
  transform: translate3d(-50%, calc(-50% + (1 - var(--moon)) * 24%), 0);
  pointer-events: none;
}

.progression__moon > i {
  position: absolute;
}

.progression__moon {
  isolation: isolate;
}

.progression__moon-halo,
.progression__moon-disc,
.progression__moon-tint {
  mask-image: linear-gradient(180deg, #000 50%, transparent 88%);
}

.progression__moon-halo {
  inset: -30%;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in oklab, var(--acc) 30%, transparent) 30%, color-mix(in oklab, var(--acc) 10%, transparent) 46%, transparent 68%);
}

.progression__moon-disc {
  inset: 0;
  border-radius: 50%;
  background-color: #2a2a30;
  background-position: center;
  background-size: cover;
  box-shadow: 0 0 70px 6px color-mix(in oklab, var(--acc) 32%, transparent);
  filter: grayscale(1) brightness(1.5) contrast(1.05);
}

/* the disc's craters, washed in the accent */
.progression__moon-tint {
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle at 38% 34%, color-mix(in oklab, var(--acc) 80%, white), var(--acc) 60%);
  mix-blend-mode: color;
}

.progression__moon-band {
  left: -45%;
  width: 190%;
  background: linear-gradient(90deg, transparent, rgba(160, 158, 170, 0.45) 18%, rgba(120, 118, 130, 0.2) 46%, rgba(160, 158, 170, 0.42) 74%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 50%, transparent);
  animation: moon-band 46s ease-in-out infinite alternate;
  animation-play-state: paused;
}

.progression__moon.is-lit .progression__moon-band {
  animation-play-state: running;
}

.progression__moon-band--1 { top: 40%; height: 9%; opacity: 0.7; }
.progression__moon-band--2 { top: 56%; height: 14%; animation-duration: 60s; animation-direction: alternate-reverse; }
.progression__moon-band--3 { top: 70%; height: 22%; opacity: 0.9; animation-duration: 38s; }

@keyframes moon-band {
  from { transform: translate3d(-6%, 0, 0); }
  to { transform: translate3d(6%, 0, 0); }
}

/* ---- fog: two slow banks; they close in on the drink and part at the climax ---- */
.progression__fogbank {
  opacity: calc(1 - var(--awaken) * 0.75);
  transform: translate3d(0, calc(var(--awaken) * 14% - var(--risk) * 10%), 0);
}

.progression__fog {
  position: absolute;
  left: -50%;
  width: 200%;
  background-repeat: repeat-x;
  background-size: 50% 100%;
}

.progression__fog--far {
  top: 6%;
  height: 64%;
  background-image:
    radial-gradient(ellipse 18% 30% at 14% 58%, rgba(176, 180, 196, 0.12), transparent 70%),
    radial-gradient(ellipse 22% 26% at 42% 38%, rgba(176, 180, 196, 0.08), transparent 70%),
    radial-gradient(ellipse 18% 30% at 70% 64%, rgba(176, 180, 196, 0.11), transparent 70%),
    radial-gradient(ellipse 22% 32% at 92% 44%, rgba(176, 180, 196, 0.08), transparent 70%);
  animation: progression-fog 95s linear infinite;
}

.progression__fog--near {
  bottom: -10%;
  height: 52%;
  background-image:
    radial-gradient(ellipse 26% 38% at 18% 72%, rgba(200, 202, 214, 0.17), transparent 72%),
    radial-gradient(ellipse 20% 34% at 50% 84%, rgba(200, 202, 214, 0.13), transparent 72%),
    radial-gradient(ellipse 28% 42% at 84% 76%, rgba(200, 202, 214, 0.17), transparent 72%);
  animation: progression-fog 60s linear infinite reverse;
}

@keyframes progression-fog {
  to { transform: translate3d(-25%, 0, 0); }
}

/* the copy side and the rail stay on near-black */
.progression__vignette {
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--arc-bg) 92%, transparent) 0%, color-mix(in srgb, var(--arc-bg) 60%, transparent) 26%, transparent 52%),
    radial-gradient(ellipse 80% 75% at 64% 50%, transparent 45%, color-mix(in srgb, var(--arc-bg) 75%, transparent) 100%),
    linear-gradient(180deg, var(--arc-bg) 0%, transparent 18%, transparent 80%, var(--arc-bg) 100%);
}

.progression__burst {
  z-index: 3;
  background: radial-gradient(ellipse 46% 60% at var(--stand-x, 50%) var(--stand-y, 46%), rgba(255, 255, 255, 0.28), color-mix(in oklab, var(--acc) 24%, transparent) 36%, transparent 72%);
  opacity: var(--flash);
}

/* the dark closing in on the player while he drinks, a heartbeat in it */
.progression__dread {
  --dread-x: calc(18.75% + var(--stand-x, 60vw));
  --dread-y: calc(18.75% + var(--stand-y, 40vh));
  z-index: 3;
  inset: -30%;
  background: radial-gradient(ellipse 22% 30% at var(--dread-x) var(--dread-y), transparent 30%, rgba(4, 4, 6, 0.9) 80%);
  opacity: min(1, calc(var(--risk) * 0.9 + var(--blackout)));
  transform: scale(calc(1.3 - var(--risk) * 0.24 - var(--thump) * 0.06 - var(--blackout) * 0.08));
  transform-origin: var(--dread-x) var(--dread-y);
}

.progression__dread::after {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 30% 40% at var(--dread-x) var(--dread-y), transparent 55%, color-mix(in oklab, var(--acc) 13%, transparent) 100%);
  content: '';
  opacity: 0;
  animation: heartbeat 1.15s ease-out infinite;
  animation-play-state: paused;
}

.progression__dread.is-lit::after {
  animation-play-state: running;
}

@keyframes heartbeat {
  0%, 100% { opacity: 0; }
  8% { opacity: 0.85; }
  18% { opacity: 0.2; }
  28% { opacity: 0.7; }
  48% { opacity: 0; }
}

/*
 * ---- the section's heading: the entrance only ----
 * It rides in at the top of the copy column, just under the roofs, ahead of the first
 * chapter (which comes up under it with the book, see copyStyle), and lifts away as the
 * room settles into its pin (at story time lead / (lead + 2.8 screens), about 0.17).
 */
.progression__heading {
  --title-in: clamp(0, calc((var(--entry) - 0.1) * 3), 1);
  --title-out: clamp(0, calc((var(--journey) - 0.125) * 24), 1);
  position: absolute;
  z-index: 8;
  top: var(--top);
  left: var(--rail);
  width: min(56vw, 760px);
  display: grid;
  justify-items: start;
  opacity: calc(var(--title-in) * (1 - var(--title-out)));
  transform: translate3d(0, calc((1 - var(--title-in)) * 56px - var(--title-out) * 32px), 0);
  pointer-events: none;
}

.progression__heading h2 {
  margin: 0;
  color: var(--arc-ink);
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: var(--arc-fs-display, clamp(36px, 4.8vw, 68px));
  line-height: 1;
  letter-spacing: -0.025em;
  text-wrap: balance;
  text-shadow: 0 10px 60px rgba(0, 0, 0, 0.6);
}

/* ---- chapter copy + stage ---- */
.progression__layout {
  position: absolute;
  z-index: 4;
  inset: var(--top) var(--rail) clamp(100px, 13vh, 120px) var(--rail);
  display: grid;
  grid-template-columns: var(--copy-w) minmax(0, 1fr);
  align-items: center;
  gap: clamp(24px, 3.5vw, 64px);
}

.chapter-copy-slot {
  min-width: 0;
  display: grid;
  align-items: center;
}

.chapter-copy {
  grid-area: 1 / 1;
  min-width: 0;
}

.chapter-copy h3 {
  margin: 0 0 18px;
  color: var(--arc-ink);
  font-family: var(--arc-display);
  font-variation-settings: 'FLAR' 100;
  font-weight: 600;
  font-size: var(--h3-size);
  line-height: 1.08;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

/* a long Sequence name shrinks until it fits the column on one line */
.chapter-copy h3.chapter-copy__name {
  font-size: min(var(--h3-size), calc(var(--copy-w) / var(--name-em, 1)));
}

.chapter-copy h3 em {
  color: var(--acc);
  font-style: normal;
}

.chapter-copy__body {
  margin: 0;
  color: var(--arc-muted);
  font-size: clamp(15px, 1.1vw, 17px);
  line-height: 1.62;
  text-wrap: pretty;
}

.chapter-copy__hint {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin: 22px 0 0;
  padding-top: 16px;
  border-top: 1px solid var(--arc-line);
  color: var(--arc-muted);
  font-size: 14px;
  line-height: 1.5;
  text-wrap: pretty;
}

/* the dot sits on the first line, however many lines the hint takes */
.chapter-copy__hint i {
  flex: 0 0 auto;
  margin-top: 7px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--acc);
  box-shadow: 0 0 10px var(--acc);
}

/*
 * The awakening's copy takes some of the empty floor to its right (the drawn card stands on
 * his other side), so its full sentences wrap less and it stays clear of the header and the rail.
 */
.chapter-copy--awaken {
  width: calc(var(--copy-w) + 96px);
}

.chapter-copy__sub {
  margin: -6px 0 18px;
  color: var(--arc-muted);
  font-size: 15px;
}

.chapter-copy__boon {
  margin-top: 12px;
}

.chapter-copy__digest {
  margin: 0 0 16px;
  color: var(--arc-muted);
  font-size: var(--arc-fs-small, 14px);
  line-height: 1.5;
  text-wrap: pretty;
}

.chapter-copy__abilities {
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--arc-line);
}

.chapter-copy__abilities li {
  display: grid;
  gap: 3px;
  padding: 11px 0 11px 14px;
  border-bottom: 1px solid var(--arc-line);
  box-shadow: inset 2px 0 0 var(--acc);
}

.chapter-copy__abilities strong {
  color: var(--arc-ink);
  font-size: 15.5px;
  font-weight: 600;
}

.chapter-copy__abilities span {
  color: var(--arc-muted);
  font-size: 14px;
  line-height: 1.45;
  text-wrap: pretty;
}

/* what comes next and the way to it, on one row when they fit */
.chapter-copy__onward {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 20px;
  margin-top: 18px;
}

.chapter-copy__next {
  margin: 0;
  color: var(--arc-muted);
  font-size: 14px;
  line-height: 1.5;
}

.chapter-copy__cta {
  flex: 0 0 auto;
}

.progression__stage {
  position: relative;
  min-width: 0;
  height: 100%;
  min-height: 380px;
  outline: none;
}

.scene-window {
  position: absolute;
  inset: 0;
  transform-origin: 0 0;
  transition: opacity 0.18s linear;
}

.scene-window--book { z-index: 1; }
.scene-window--altar { z-index: 2; }
.scene-window--drink { z-index: 3; }

/* ---- chapter rail: under the copy, clear of the floating deck ---- */
.progression-nav {
  position: absolute;
  z-index: 20;
  bottom: clamp(18px, 3vh, 30px);
  left: var(--rail);
  width: var(--copy-w);
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding-top: 2px;
}

/*
 * At the very end the room dissolves into the page (.progression__exit, see railLeaving):
 * the rail and the copy step out first, so no half-faded text is left on the page colour.
 */
.progression-nav {
  transition: opacity .3s ease;
}

.progression-nav.is-leaving,
.progression__layout.is-leaving .chapter-copy {
  opacity: 0;
  pointer-events: none;
  transition: opacity .3s ease;
}

/* the page's colour (paper in the light theme), over everything in the room */
.progression__exit {
  position: absolute;
  z-index: 40;
  inset: 0;
  background: var(--arc-page, var(--arc-bg));
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  will-change: opacity;
}

.progression-nav__line {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 2px;
  background: var(--arc-line);
}

.progression-nav__line b {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--acc);
  box-shadow: 0 0 10px color-mix(in oklab, var(--acc) 60%, transparent);
  transform-origin: left center;
}

.progression-nav button {
  position: relative;
  font-family: var(--arc-body);
  min-height: 52px;
  display: grid;
  align-content: center;
  justify-items: start;
  gap: 4px;
  padding: 8px 6px 4px 0;
  border: 0;
  border-radius: var(--arc-r-sm);
  color: var(--arc-muted);
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: color 0.2s ease;
}

.progression-nav button:hover {
  color: var(--arc-ink);
}

.progression-nav button:focus-visible {
  outline: var(--arc-focus-w) solid var(--arc-ink);
  outline-offset: var(--arc-focus-off);
}

/* states differ by shape, not only hue: active = tick on the rail + bold label */
.progression-nav button::before {
  position: absolute;
  top: -5px;
  left: 0;
  width: 8px;
  height: 8px;
  border: var(--arc-bw-accent) solid currentColor;
  border-radius: 50%;
  background: var(--arc-bg);
  content: '';
}

.progression-nav button.complete::before {
  border-color: var(--acc);
  background: var(--acc);
}

.progression-nav button.active {
  color: var(--arc-ink);
}

.progression-nav button.active::before {
  width: 10px;
  height: 10px;
  top: -6px;
  border-color: var(--acc);
  background: var(--arc-bg);
  box-shadow: 0 0 0 4px color-mix(in oklab, var(--acc) 22%, transparent);
}

.progression-nav span {
  font: 400 11px/1 var(--arc-caps);
  letter-spacing: 0.14em;
}

.progression-nav strong {
  font-size: var(--arc-fs-small);
  font-weight: 500;
}

.progression-nav button.active strong {
  font-weight: 650;
}

.progression-static {
  display: none;
}

/* the old copy is gone in 0.12s; the new one starts as it goes */
.chapter-copy-enter-active {
  transition: opacity 0.22s ease 0.08s, transform 0.36s cubic-bezier(.22, 1, .36, 1) 0.08s;
}

.chapter-copy-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
  pointer-events: none;
}

.chapter-copy-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.chapter-copy-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 1120px) {
  .progression {
    --copy-w: clamp(260px, 30vw, 320px);
  }

  .chapter-copy__body {
    font-size: 15px;
  }

  .chapter-copy__abilities li {
    padding-block: 9px;
  }

  .chapter-copy__abilities span {
    font-size: 13.5px;
  }
}

/*
 * Laptop-height windows: the awakening copy (a long Sequence name, two
 * abilities and the button) must stay clear of the chapter rail below it.
 */
@media (max-height: 820px) {
  .chapter-copy h3 {
    margin: 0 0 12px;
  }

  .chapter-copy__sub {
    margin: -2px 0 12px;
    font-size: 14px;
  }

  .chapter-copy__digest {
    margin-bottom: 12px;
  }

  .chapter-copy__abilities li {
    padding-block: 7px;
  }

  .chapter-copy__onward {
    margin-top: 14px;
  }
}

/* the shortest desktop windows (a 1280×720 screen with browser bars): tighter still */
@media (max-height: 640px) {
  /* down to just above the rail, so the copy keeps clear of the header too */
  .progression__layout {
    bottom: 88px;
  }

  .chapter-copy h3 {
    margin-bottom: 10px;
  }

  .chapter-copy__sub {
    margin-bottom: 10px;
  }

  .chapter-copy__digest {
    margin-bottom: 8px;
  }

  .chapter-copy__abilities li {
    padding-block: 5px;
  }

  .chapter-copy__onward {
    margin-top: 10px;
  }
}

/*
 * Sticky storytelling needs room for its copy, controls and stage to coexist.
 * Narrow and short viewports, and reduced motion, get one document-flow list.
 */
@media (max-width: 900px), (max-height: 590px), (prefers-reduced-motion: reduce) {
  .progression {
    min-height: auto;
    padding: clamp(64px, 12vw, 96px) clamp(18px, 4vw, 64px);
    overflow: hidden;
  }

  .progression__sticky {
    position: relative;
    height: auto;
    min-height: 0;
    overflow: visible;
    background: transparent;
  }

  .progression__backdrop,
  .progression__vignette {
    inset: calc(-1 * clamp(64px, 12vw, 96px)) calc(-1 * clamp(18px, 4vw, 64px)) auto;
    height: min(560px, 80vh);
  }

  .progression__backdrop {
    opacity: 0.4;
    transform: none;
    mask-image: linear-gradient(180deg, transparent, #000 20%, #000 45%, transparent);
  }

  .progression__roofs,
  .progression__exit {
    display: none;
  }

  .progression__hearth,
  .progression__moon,
  .progression__dread,
  .progression__burst,
  .progression__fogbank,
  .progression__layout,
  .progression-nav {
    display: none;
  }

  .progression__vignette {
    background:
      radial-gradient(ellipse 40% 22% at 15% 0%, rgba(200, 202, 214, 0.16), transparent 72%),
      radial-gradient(ellipse 40% 22% at 95% 0%, rgba(200, 202, 214, 0.16), transparent 72%),
      linear-gradient(90deg, rgba(11, 11, 14, 0.7), transparent 70%);
  }

  .progression__heading {
    position: relative;
    inset: auto;
    width: min(880px, 100%);
    margin: 0 auto clamp(32px, 7vw, 56px);
    justify-items: start;
    text-align: left;
    opacity: 1;
    transform: none;
  }

  .progression__heading h2 {
    font-size: clamp(40px, 9vw, 66px);
  }

  .progression-static {
    position: relative;
    width: min(880px, 100%);
    display: block;
    margin: 0 auto;
  }

  .progression-static > ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .progression-static > ol > li {
    position: relative;
    padding: clamp(26px, 5vw, 40px) 0;
    border-top: 1px solid var(--arc-line);
  }

  .progression-static h3 {
    margin: 0 0 12px;
    color: var(--arc-ink);
    font-family: var(--arc-display);
    font-variation-settings: 'FLAR' 100;
    font-weight: 600;
    font-size: var(--arc-fs-h2, clamp(28px, 3vw, 42px));
    line-height: 1.08;
    letter-spacing: -0.02em;
    text-wrap: balance;
  }

  .progression-static h3 em {
    color: var(--acc);
    font-style: normal;
  }

  .progression-static__copy {
    max-width: 620px;
    margin: 0;
    color: var(--arc-muted);
    font-size: 16px;
    line-height: 1.6;
    text-wrap: pretty;
  }

  .progression-static__ingredients {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 230px), 1fr));
    gap: 10px;
    margin: 22px 0 0;
    padding: 0;
    list-style: none;
  }

  .progression-static__ingredients li {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 14px 10px 10px;
    border-radius: var(--arc-r-md);
    background: color-mix(in oklab, var(--arc-surface) 60%, transparent);
    box-shadow: inset 0 0 0 1px var(--arc-line);
  }

  .progression-static__ingredients img,
  .progression-static__rune {
    flex: 0 0 auto;
    width: 48px;
    height: 48px;
    image-rendering: pixelated;
  }

  .progression-static__rune {
    border: 3px solid var(--acc);
    transform: scale(.6) rotate(45deg);
  }

  .progression-static__ingredients span {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .progression-static__ingredients strong {
    color: var(--arc-ink);
    font-size: 15px;
    font-weight: 600;
  }

  .progression-static__ingredients small {
    color: var(--arc-muted);
    font-size: 13.5px;
    line-height: 1.35;
  }

  /* the chapter's practical note, the potion as its marker */
  .progression-static__note {
    max-width: 620px;
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 20px 0 0;
    padding-top: 16px;
    border-top: 1px solid var(--arc-line);
    color: var(--arc-muted);
    font-size: 15px;
    line-height: 1.5;
    text-wrap: pretty;
  }

  .progression-static__vial {
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    filter: drop-shadow(0 0 12px color-mix(in oklab, var(--acc) 45%, transparent));
  }

  .progression-static .chapter-copy__abilities {
    max-width: 620px;
    margin: 20px 0 0;
  }

  .progression-static .chapter-copy__abilities li {
    padding-block: 11px;
  }

  .progression-static .chapter-copy__next {
    margin-top: 14px;
  }

  .progression-static .chapter-copy__cta {
    margin-top: 22px;
  }

  .progression-static li.is-awaken::before {
    position: absolute;
    z-index: -1;
    inset: 0 -20% -30% -10%;
    background: radial-gradient(ellipse 50% 60% at 18% 40%, color-mix(in oklab, var(--acc) 16%, transparent), transparent 70%);
    content: '';
    pointer-events: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chapter-copy-enter-active,
  .chapter-copy-leave-active,
  .scene-window {
    transition: none;
  }

  .progression__fog,
  .progression__moon-band,
  .progression__dread::after {
    animation: none;
  }
}
</style>
