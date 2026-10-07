<template>
  <section
    id="progression"
    ref="sectionRef"
    class="progression"
    :class="{ 'is-lite': lite, 'is-live': live }"
    aria-labelledby="progression-title"
  >
    <div ref="stickyRef" class="progression__sticky">
      <!-- Decorative: bleeds past the edges on purpose while it slowly zooms. -->
      <div class="progression__backdrop" :style="dress.backdrop" aria-hidden="true" data-sweep-ignore>
        <img ref="backdropRef" :src="breweryScene" alt="" width="1920" height="1017" loading="lazy" decoding="sync">
      </div>
      <div class="progression__hearth" :style="dress.hearth" aria-hidden="true" />
      <!--
        Decorative: the Pathway's sigil, drawn in behind him at the awakening like a ritual
        circle (two rings traced round, then the sigil kindles inside them and slowly turns).
        Before a draw, and for a Boon, it is the Fool's, in the page's accent (the example).
      -->
      <div class="progression__sigil" :class="{ 'is-lit': sigilLit, 'is-example': sigilExample }" :style="dress.sigil" aria-hidden="true" data-sweep-ignore>
        <i class="progression__sigil-halo" />
        <i class="progression__sigil-turn"><i class="progression__sigil-art" :style="{ '--sigil': `url(${sigilSrc})` }" /></i>
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
        <!-- named for screen readers; on screen the chapters speak for themselves -->
        <h2 id="progression-title" class="arc-sr">{{ tp('title') }}</h2>
      </header>

      <div class="progression__layout" :style="layoutStyle">
        <!-- Outgoing and incoming copy share one grid cell and cross over. -->
        <div class="chapter-copy-slot" :style="copyStyle">
          <Transition name="chapter-copy">
            <article v-if="activeChapter.id !== 'awaken'" :key="activeChapter.id" class="chapter-copy">
              <h3>{{ chapterText(activeChapter.id, 'title') }}</h3>
              <p class="chapter-copy__body">{{ chapterText(activeChapter.id, 'copy') }}</p>
              <p v-if="isBoon && activeChapter.id === 'discover'" class="chapter-copy__body chapter-copy__boon">{{ tp('boonNote') }}</p>
            </article>
            <article v-else key="awaken" class="chapter-copy chapter-copy--awaken">
              <h3 class="chapter-copy__name" :style="{ '--name-em': nameEm }">
                <template v-for="(part, index) in awakenTitle" :key="index"><em v-if="part.name">{{ part.text }}</em><template v-else>{{ part.text }}</template></template>
              </h3>
              <p class="chapter-copy__sub">{{ tp(names.nextSequence ? 'drink.panelSubNext' : 'drink.panelSub') }}</p>
              <p class="chapter-copy__about">{{ tp('drink.about') }}</p>
              <ul v-if="firstAbilities.length" class="chapter-copy__abilities" :aria-label="tp('drink.abilitiesHeading')">
                <li v-for="ability in firstAbilities" :key="ability.id">
                  <strong>{{ ability.name }}</strong>
                  <span>{{ ability.description }}</span>
                </li>
              </ul>
              <div class="chapter-copy__onward">
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

      <nav class="progression-nav" :aria-label="tp('navLabel')">
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
    </div>

    <!-- Narrow, short and reduced-motion screens: the same story as one list. -->
    <div class="progression-static">
      <ol>
        <li v-for="chapter in CHAPTERS" :key="chapter.id" :class="`is-${chapter.id}`">
          <h3 v-if="chapter.id === 'awaken'">
            <template v-for="(part, index) in awakenTitle" :key="index"><em v-if="part.name">{{ part.text }}</em><template v-else>{{ part.text }}</template></template>
          </h3>
          <h3 v-else>{{ chapterText(chapter.id, 'title') }}</h3>
          <p v-if="chapter.id !== 'awaken'" class="progression-static__copy">{{ chapterText(chapter.id, 'copy') }}</p>
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
          <template v-else-if="chapter.id === 'awaken'">
            <p class="progression-static__copy">{{ tp(names.nextSequence ? 'drink.panelSubNext' : 'drink.panelSub') }}. {{ tp('drink.about') }}</p>
            <ul v-if="firstAbilities.length" class="chapter-copy__abilities" :aria-label="tp('drink.abilitiesHeading')">
              <li v-for="ability in firstAbilities" :key="ability.id">
                <strong>{{ ability.name }}</strong>
                <span>{{ ability.description }}</span>
              </li>
            </ul>
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
import { preloadPathwayNames, useProgressionCopy } from './scenes/useProgressionCopy';
import { abilitySummary } from '../abilitySummary';
import { CHAPTERS, T, awakenAt, blackoutAt, clamp01, dropStarts, ease, flashAt, gulpPulse, lerp, riskAt, scrollAt, span, storyAt } from './timeline';
import type { ChapterId } from './timeline';
import { stageLayout } from './layout';
import { isNearby, whenSettled } from './prewarm';
import type { StageLayout } from './layout';
import breweryScene from '@/assets/images/home/progression/brewery-scene.webp';
import { sigilNative } from '../arcana-data';
import { useArcana } from '../useArcana';

const { tp, names, ingredients, currentId, isBoon, pathwayId } = useProgressionCopy();
const { hasDrawn } = useArcana();
/* The awakening's sigil: the Pathway the story follows (a Boon, or no draw yet, sees the Fool's as the example). */
const sigilExample = computed(() => !hasDrawn.value || pathwayId.value !== currentId.value);
const sigilSrc = computed(() => sigilNative(pathwayId.value));

function chapterText(id: ChapterId, field: 'short' | 'title' | 'copy'): string {
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
/** On or near the screen: its full-bleed layers are promoted (see .is-live). */
const live = ref(false);
// True once the chapter is within about a viewport: starts lazy downloads.
const near = ref(false);
const reducedMotion = useReducedMotion();

/*
 * Light mode, for machines that can't keep the room smooth: no fog, no particle fields,
 * no backdrop zoom, no faded ends on the voices (see .is-lite). The story, the player and
 * the copy are untouched. It comes on when the browser draws 3D in software (GPU
 * acceleration off, or a VM), or when the pinned room averages under ~22 fps while it is
 * being scrolled; it stays on for the rest of the visit.
 */
const LITE_KEY = 'mysterria-story-lite';
/** Mean frame time that turns it on (~22 fps): the long frames are the lag people feel, so not the median. */
const LITE_MEAN_MS = 45;
const LITE_SAMPLES = 24;
function softwareRendered(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    if (!gl) return true;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);
  } catch {
    return false;
  }
}
/*
 * A preview switch: ?lite=1 forces light mode, ?lite=0 forces the full room (no automatic
 * switch either); both last for the visit. Without it the stored choice, or the automatic one.
 */
function storedLite(): string | null {
  try {
    const forced = new URLSearchParams(location.search).get('lite');
    if (forced === '1' || forced === '0') sessionStorage.setItem(LITE_KEY, forced);
    return sessionStorage.getItem(LITE_KEY);
  } catch {
    return null;
  }
}
const liteChoice = storedLite();
const lite = ref(liteChoice === '1');
/** ?lite=0 was asked for: never switch on its own. */
const fullForced = liteChoice === '0';
function goLite() {
  if (lite.value || fullForced) return;
  lite.value = true;
  try {
    sessionStorage.setItem(LITE_KEY, '1');
  } catch {
    // storage blocked: light for this page view only
  }
}
/*
 * The room's real frame rate while it is being scrolled: a scroll inside the pin keeps a
 * small rAF loop going for 200 ms, and the gaps between its frames are the frame times
 * (timing the scroll handler alone would count the pauses between wheel ticks as frames).
 */
const frameSamples: number[] = [];
let timing = 0;
let timedUntil = 0;
let lastFrameAt = 0;
function timeFrames() {
  if (lite.value) return;
  timedUntil = performance.now() + 200;
  if (timing) return;
  lastFrameAt = 0;
  const step = (now: number) => {
    // one hitch (a decode, a tab switch) counts as a slow frame, not as seconds of them
    if (lastFrameAt) frameSamples.push(Math.min(250, now - lastFrameAt));
    lastFrameAt = now;
    if (frameSamples.length >= LITE_SAMPLES) {
      const mean = frameSamples.reduce((sum, gap) => sum + gap, 0) / frameSamples.length;
      frameSamples.length = 0;
      if (mean > LITE_MEAN_MS) goLite();
    }
    timing = !lite.value && now < timedUntil ? requestAnimationFrame(step) : 0;
  };
  timing = requestAnimationFrame(step);
}
const activeDetailId = ref<string | null>(null);
const inspectorAnchor = ref<HTMLElement | null>(null);
const inspectorScene = ref<DetailScene | null>(null);
let observer: IntersectionObserver | null = null;
let nearObserver: IntersectionObserver | null = null;
let liveObserver: IntersectionObserver | null = null;
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

/*
 * Before the story starts the book stands edge-on, a bare spine: it fades in as it starts
 * to fall, so a phone (whose story starts later, see LEAD_NARROW) never shows it parked.
 */
const bookOpacity = computed(() => (reducedMotion.value ? 1 : span(progress.value, [0, 0.025]) * (1 - span(progress.value, [T.bookOut[0] + 0.02, T.bookOut[1]]))));
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
    // the sigil: its rings traced round out of the flash, then the sigil kindles inside them
    '--sigil-ring': (motion ? ease(g, [T.flash, T.flash + 0.045]) : 1).toFixed(4),
    '--sigil-in': (motion ? ease(g, [T.flash + 0.012, T.flash + 0.075]) : 1).toFixed(4),
    '--awaken': (motion ? awakenAt(g) : 0).toFixed(4),
    '--stand-x': `${(s.left + (l ? l.cx : s.w / 2)).toFixed(1)}px`,
    '--stand-y': `${(s.top + (l ? l.player.y + l.player.h * 0.3 : s.h * 0.4)).toFixed(1)}px`,
    // the sigil fits between the stage's top and his chest, inside the stage's width
    '--sigil-size': `${Math.max(160, l ? Math.min(600, 2 * (l.player.y + l.player.h * 0.3) - 12, l.w * 0.86) : 420).toFixed(1)}px`,
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
  sigil: ['--sigil-ring', '--sigil-in', '--awaken', '--stand-x', '--stand-y', '--sigil-size'],
  fogbank: ['--awaken', '--risk', '--journey'],
  dread: ['--risk', '--thump', '--blackout', '--stand-x', '--stand-y'],
  burst: ['--flash', '--stand-x', '--stand-y'],
  heading: ['--entry', '--journey'],
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
/* The sigil's slow turn and the dread's heartbeat only run while their layer can be seen. */
const sigilLit = computed(() => Number(sectionVars.value['--sigil-ring']) > 0);
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
/** The rail and the chapter copy, faded out as the pinned room scrolls away (update). */
let leavingEls: HTMLElement[] = [];
let sectionTop = 0;
let sectionHeight = 0;
/** The section's bottom padding: the room's foot, where it fades into the page (never pinned). */
let sectionFoot = 0;
/*
 * The pinned room's height (100svh: the screen with the browser's bars shown). The
 * scroll maths use it instead of innerHeight, which on a phone grows and shrinks as the
 * bars slide away and back, and made the story jump while it was being scrolled.
 */
let viewH = 0;
let narrow = false;
const stickyRef = ref<HTMLElement | null>(null);
let pageObserver: ResizeObserver | null = null;
function measureSection() {
  const section = sectionRef.value;
  if (!section) return;
  const rect = section.getBoundingClientRect();
  sectionTop = rect.top + scrollY;
  sectionHeight = rect.height;
  sectionFoot = parseFloat(getComputedStyle(section).paddingBottom) || 0;
  viewH = stickyRef.value?.clientHeight || innerHeight;
  narrow = innerWidth <= 900;
}
function onResize() {
  measureSection();
  update();
}
/*
 * The pinned scroll is 2.8 viewports of story plus the voices' dwell (the section's
 * min-height, less its foot); storyAt spends the dwell inside the voices, so each raving
 * can be read. The way in is the room rising out of the hero (`lead`, from the moment its
 * top crosses the bottom of the window until it pins): it plays the story up to
 * LEAD_TO, so the heading, the first chapter and the falling book come up with the room
 * and it is never an empty room. The story ends `tail` px before the pin lets go: that
 * stretch holds the finished awakening; then the room scrolls away over its foot, which
 * fades into the page the next section opens on (no dissolve, no empty screen).
 */
const LEAD = 0.85;
/*
 * On a phone or an upright tablet the hero is taller than the screen, so its last buttons
 * are still up when the room comes in: the story only starts once the room is halfway up,
 * and the book never falls in under them.
 */
const LEAD_NARROW = 0.45;
const LEAD_TO = 0.16;
const TAIL = 0.42;
function scrollRange(height = sectionHeight, foot = sectionFoot) {
  const vh = viewH || innerHeight;
  const pin = Math.max(1, height - foot - vh);
  const dwell = Math.max(0, Math.min(pin - 1, pin - vh * 2.8));
  const lead = vh * (narrow ? LEAD_NARROW : LEAD);
  const tail = Math.min(vh * TAIL, pin * 0.2);
  return { range: Math.max(1, pin + lead - tail), dwell, lead, leadTo: LEAD_TO, tail, pin };
}
function update() {
  if (!visible.value || !sectionRef.value || frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    if (!sectionRef.value) return;
    const top = sectionTop - scrollY;
    entryProgress.value = clamp01(1 - Math.max(0, top) / (viewH || innerHeight));
    if (reducedMotion.value) return;
    const pace = scrollRange();
    // only the pinned room is timed: that is where the cost is
    if (top <= 0 && -top < pace.pin) timeFrames();
    const next = storyAt(pace.lead - top, pace);
    progress.value = next;
    clearExpiredInspector(next);
    // Once the pin lets go the room scrolls away: the rail and the copy fade out first, so
    // neither rides up over the paper the room's foot fades into.
    const leave = clamp01((-top - pace.pin) / ((viewH || innerHeight) * 0.3));
    const fade = leave > 0 ? (1 - leave).toFixed(3) : '';
    for (const el of leavingEls) el.style.opacity = fade;
  });
}
function goToChapter(index: number) {
  const section = sectionRef.value;
  const chapter = CHAPTERS[index];
  if (!section || !chapter) return;
  clearDetail();
  const rect = section.getBoundingClientRect();
  const pace = scrollRange(rect.height, parseFloat(getComputedStyle(section).paddingBottom) || 0);
  const sectionTop = rect.top + scrollY;
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
  const target = pace.range > 1 ? sectionTop - pace.lead + scrollAt(chapter.landing, pace) : sectionTop;
  const destination = Math.round(Math.min(maxScroll, Math.max(sectionTop, target)));
  scrollTo({ top: destination, behavior: reducedMotion.value ? 'instant' : 'smooth' });
}

onMounted(() => {
  leavingEls = [...(sectionRef.value?.querySelectorAll<HTMLElement>('.progression-nav, .chapter-copy-slot') ?? [])];
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
  // a screen ahead, so the layers are rastered before they scroll in
  liveObserver = new IntersectionObserver(([entry]) => (live.value = entry.isIntersecting), { rootMargin: '100% 0px' });
  if (sectionRef.value) {
    observer.observe(sectionRef.value);
    nearObserver.observe(sectionRef.value);
    liveObserver.observe(sectionRef.value);
  }
  if (stageRef.value) {
    stageObserver = new ResizeObserver(measureStage);
    stageObserver.observe(stageRef.value);
  }
  if (!lite.value && softwareRendered()) goLite();
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
  liveObserver?.disconnect();
  stageObserver?.disconnect();
  pageObserver?.disconnect();
  removeEventListener('scroll', update);
  removeEventListener('resize', onResize);
  removeEventListener('keydown', onKeydown);
  if (frame) cancelAnimationFrame(frame);
  if (timing) cancelAnimationFrame(timing);
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
  /* the page's content edge (ArcanaHome --arc-edge): copy, rail and stage line up with every section */
  --rail: var(--arc-edge, clamp(20px, 4vw, 64px));
  --copy-w: clamp(272px, 27vw, 400px);
  /* the spec's group heading (h3) */
  --h3-size: var(--arc-fs-h2, clamp(28px, 3vw, 42px));
  --top: calc(var(--site-header-stack, 106px) + clamp(14px, 3vh, 36px));
  position: relative;
  /* 2.8 viewports of story, plus the voices' dwell (see scrollRange) */
  min-height: calc(380svh + max(1160px, 116svh));
  color: var(--arc-ink);
  background: var(--arc-bg);
  isolation: isolate;
}

/*
 * The way in and the way out (the pinned story only). The room has no edges: its top is
 * see-through and deepens into the room colour over --room-in, over the hero's night scene,
 * which runs on under it (HeroNightScene's tail), so the city sinks into the brewery in
 * one picture; the brewery photo and the room's shading fade in over the same stretch.
 * Its foot (the section's bottom padding, which the pinned room never covers) deepens the
 * other way, into the page the next section opens on. Eased stops (smoothstep), so neither
 * reads as a band. Static gradients: they scroll with the page and cost nothing per frame.
 */
@media (min-height: 591px) and (prefers-reduced-motion: no-preference) {
  .progression {
    --room-in: clamp(300px, 46vh, 520px);
    --room-photo-in: calc(var(--room-in) * .5);
    min-height: calc(380svh + max(1160px, 116svh) + var(--room-foot, 200px));
    padding-bottom: var(--room-foot, 200px);
    background: linear-gradient(180deg,
        transparent 0,
        color-mix(in srgb, var(--arc-bg) 10.4%, transparent) calc(var(--room-in) * .2),
        color-mix(in srgb, var(--arc-bg) 35.2%, transparent) calc(var(--room-in) * .4),
        color-mix(in srgb, var(--arc-bg) 64.8%, transparent) calc(var(--room-in) * .6),
        color-mix(in srgb, var(--arc-bg) 89.6%, transparent) calc(var(--room-in) * .8),
        var(--arc-bg) var(--room-in),
        var(--arc-bg) calc(100% - var(--room-foot, 200px)),
        color-mix(in srgb, var(--arc-bg) 89.6%, var(--arc-page)) calc(100% - var(--room-foot, 200px) * .8),
        color-mix(in srgb, var(--arc-bg) 64.8%, var(--arc-page)) calc(100% - var(--room-foot, 200px) * .6),
        color-mix(in srgb, var(--arc-bg) 35.2%, var(--arc-page)) calc(100% - var(--room-foot, 200px) * .4),
        color-mix(in srgb, var(--arc-bg) 10.4%, var(--arc-page)) calc(100% - var(--room-foot, 200px) * .2),
        var(--arc-page) 100%);
  }

  /* on paper the dark comes in over a shorter stretch, so the heading never sits on grey */
  :root[data-theme="parchment"] .progression {
    --room-in: clamp(170px, 24vh, 240px);
    --room-photo-in: calc(var(--room-in) * 1.3);
  }

  /* (the section paints the room's colour, edges included; outranks the base rule below) */
  .progression .progression__sticky {
    background: transparent;
  }

  .progression__backdrop img {
    -webkit-mask-image: linear-gradient(180deg, transparent 0, rgba(0, 0, 0, .35) calc(var(--room-photo-in) * .4), rgba(0, 0, 0, .8) calc(var(--room-photo-in) * .7), #000 var(--room-photo-in));
    mask-image: linear-gradient(180deg, transparent 0, rgba(0, 0, 0, .35) calc(var(--room-photo-in) * .4), rgba(0, 0, 0, .8) calc(var(--room-photo-in) * .7), #000 var(--room-photo-in));
  }

  .progression__vignette {
    -webkit-mask-image: linear-gradient(180deg, transparent 0, rgba(0, 0, 0, .35) calc(var(--room-in) * .4), rgba(0, 0, 0, .8) calc(var(--room-in) * .7), #000 var(--room-in));
    mask-image: linear-gradient(180deg, transparent 0, rgba(0, 0, 0, .35) calc(var(--room-in) * .4), rgba(0, 0, 0, .8) calc(var(--room-in) * .7), #000 var(--room-in));
  }
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
   the backdrop photo) across the whole sticky screen. Only while the story is on or near
   the screen: promoted everywhere, they were kept (and re-rastered after every return
   to the tab) while the reader was in the hero or the gallery. */
.progression.is-live .progression__backdrop,
.progression.is-live .progression__hearth,
.progression.is-live .progression__fogbank,
.progression.is-live .progression__burst,
.progression.is-live .progression__dread,
.progression.is-live .progression-nav__line b,
.progression.is-live .progression__sigil-halo,
.progression.is-live .progression__sigil-art {
  will-change: transform, opacity;
}

.progression.is-live .progression__sigil-turn,
.progression.is-live .progression__fog {
  will-change: transform;
}

/*
 * On the way in the camera carries on down into the room: the brewery comes up already
 * there under the hero's city and keeps closing in (a slow zoom) as the story goes on.
 */
.progression__backdrop {
  bottom: -25%;
  opacity: calc(clamp(0, var(--entry) * 6, 1) * max(0, 0.5 + 0.16 * (1 - clamp(0, (var(--journey) - 0.2) * 8, 1)) - var(--awaken) * 0.3 - var(--risk) * 0.26 - var(--blackout) * 0.24));
  transform: scale(calc(1 + var(--entry) * 0.04 + var(--journey) * 0.06));
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

/* ---- the Pathway's sigil, drawn in behind him at the awakening ---- */
.progression__sigil {
  --sigil-ring: 0;
  --sigil-in: 0;
  position: absolute;
  top: var(--stand-y, 40%);
  left: var(--stand-x, 60%);
  width: var(--sigil-size, 420px);
  aspect-ratio: 1;
  opacity: var(--sigil-in);
  transform: translate3d(-50%, -50%, 0);
  pointer-events: none;
}

.progression__sigil > * {
  position: absolute;
}

/* a quiet pool of the accent behind it, so the sigil glows rather than sits on black */
.progression__sigil-halo {
  inset: -22%;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in oklab, var(--acc) 26%, transparent) 22%, color-mix(in oklab, var(--acc) 8%, transparent) 46%, transparent 68%);
  opacity: calc(var(--sigil-in) * 0.9 + var(--sigil-ring) * 0.1);
  transform: scale(calc(0.7 + var(--sigil-in) * 0.3));
}

/* scroll turns it a little; once lit it keeps turning, very slowly, on the compositor */
.progression__sigil-turn {
  inset: 4%;
  /* it rises into place and stays still: no turning */
  transform: scale(calc(0.86 + var(--sigil-in) * 0.14));
}

/*
 * The sigil, kindling from its middle outward. The art is painted on black: as its own
 * luminance mask the black falls away and only its light is left, so it glows on the
 * room like the circle on the floor. The example (no draw yet, or a Boon) is the Fool's
 * in the page's accent: the same mask over the accent.
 */
.progression__sigil-art {
  position: absolute;
  inset: 0;
  display: none;
  background: var(--sigil) center / contain no-repeat;
  mask: var(--sigil) center / contain no-repeat luminance;
  /* the painted art is mostly mid-tones: lifted, so what the mask keeps reads as light */
  filter: brightness(1.6) saturate(1.1);
  opacity: var(--sigil-in);
  transform: scale(calc(0.82 + var(--sigil-in) * 0.18));
}

.progression__sigil.is-example .progression__sigil-art {
  filter: none;
  background: radial-gradient(circle, color-mix(in oklab, var(--acc) 45%, white) 10%, var(--acc) 42%, color-mix(in oklab, var(--acc) 75%, black) 72%);
}

/* (without luminance masks the art's black square would show: the halo alone stands in) */
@supports (mask-mode: luminance) {
  .progression__sigil-art {
    display: block;
  }
}

/* ---- fog: two slow banks; they close in on the drink and part at the climax ---- */
.progression__fogbank {
  opacity: calc(1 - var(--awaken) * 0.75);
  transform: translate3d(0, calc(var(--awaken) * 14% - var(--risk) * 10%), 0);
}

/*
 * The two banks drift with the story, not on a timer: an endless animation kept the
 * GPU compositing two over-wide layers every frame, and the banks' parent repainted
 * them whenever it moved. Now the whole bank is one layer, rastered once, and scroll
 * only moves it (transform and opacity, composited).
 */
.progression__fog {
  position: absolute;
  left: -15%;
  width: 130%;
  transform: translate3d(calc(var(--journey) * var(--drift)), 0, 0);
}

.progression__fog--far {
  --drift: -9%;
  top: 6%;
  height: 64%;
  background-image:
    radial-gradient(ellipse 14% 30% at 12% 58%, rgba(176, 180, 196, 0.12), transparent 70%),
    radial-gradient(ellipse 17% 26% at 34% 38%, rgba(176, 180, 196, 0.08), transparent 70%),
    radial-gradient(ellipse 14% 30% at 56% 64%, rgba(176, 180, 196, 0.11), transparent 70%),
    radial-gradient(ellipse 17% 32% at 76% 44%, rgba(176, 180, 196, 0.08), transparent 70%),
    radial-gradient(ellipse 14% 30% at 94% 58%, rgba(176, 180, 196, 0.12), transparent 70%);
}

.progression__fog--near {
  --drift: 7%;
  bottom: -10%;
  height: 52%;
  background-image:
    radial-gradient(ellipse 20% 38% at 10% 72%, rgba(200, 202, 214, 0.17), transparent 72%),
    radial-gradient(ellipse 16% 34% at 36% 84%, rgba(200, 202, 214, 0.13), transparent 72%),
    radial-gradient(ellipse 22% 42% at 64% 76%, rgba(200, 202, 214, 0.17), transparent 72%),
    radial-gradient(ellipse 16% 34% at 90% 84%, rgba(200, 202, 214, 0.13), transparent 72%);
}

/* light mode (see goLite): the costliest layers go; what tells the story stays */
.progression.is-lite .progression__fogbank,
.progression.is-lite :deep(.scene-particles),
.progression.is-lite :deep(.drink-scene__mist) {
  display: none;
}

.progression.is-lite .progression__backdrop {
  transform: none;
}

.progression.is-lite :deep(.drink-scene__whispers) {
  -webkit-mask-image: none;
  mask-image: none;
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
 * It comes up at the top of the copy column with the room, the first chapter and the
 * falling book (see copyStyle and LEAD_TO), stays while the room pins (story time 0.16)
 * and lifts away just after, before the brew.
 */
.progression__heading {
  --title-in: clamp(0, calc((var(--entry) - 0.17) * 5), 1);
  --title-out: clamp(0, calc((var(--journey) - 0.175) * 33), 1);
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

/* on paper the heading needs no shadow to stand off the room */
:root[data-theme="parchment"] .progression__heading h2 {
  text-shadow: none;
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
  color: var(--acc-ink);
  font-style: normal;
}

.chapter-copy__body {
  margin: 0;
  color: var(--arc-muted);
  font-size: var(--arc-fs-body, 15px);
  line-height: 1.6;
  text-wrap: pretty;
}


/* the dot sits on the first line, however many lines the hint takes */

/*
 * The awakening's copy takes some of the empty floor to its right (the drawn card stands on
 * his other side), so its full sentences wrap less and it stays clear of the header and the rail.
 */
.chapter-copy--awaken {
  width: calc(var(--copy-w) + 96px);
}

.chapter-copy__sub {
  margin: -6px 0 8px;
  color: var(--arc-muted);
  font-size: 15px;
}

.chapter-copy__boon {
  margin-top: 12px;
}

/* what a Sequence is, for a visitor who has never read the novel */
.chapter-copy__about {
  max-width: 34em;
  margin: 0 0 16px;
  color: var(--arc-muted);
  font-size: 14px;
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

/* the way on from here */
.chapter-copy__onward {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
  margin-top: 18px;
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
    margin: -2px 0 6px;
    font-size: 14px;
  }

  .chapter-copy__about {
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
    margin-bottom: 4px;
  }

  .chapter-copy__about {
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
 * Portrait (phones, tablets held upright): the same pinned story, the stage on top and the
 * chapter's copy under it, the rail across the foot. The scenes lay themselves out from the
 * stage's measured size (layout.ts), so they fit whatever band they get.
 */
@media (max-width: 900px) and (min-height: 591px) and (prefers-reduced-motion: no-preference) {
  .progression {
    --rail: clamp(18px, 4.5vw, 40px);
    --top: calc(var(--site-header-stack, 64px) + 12px);
    --h3-size: clamp(24px, 6.4vw, 32px);
  }

  .progression__sticky {
    min-height: 0;
  }

  .progression__heading {
    right: var(--rail);
    width: auto;
  }

  .progression__layout {
    inset: var(--top) var(--rail) 86px;
    grid-template-columns: minmax(0, 1fr);
    /* the scene keeps at least ~45% of the screen; the copy below adapts to the rest */
    grid-template-rows: minmax(44%, 1fr) auto;
    align-items: stretch;
    gap: clamp(10px, 2vh, 20px);
  }

  .progression__stage {
    grid-row: 1;
    min-height: 0;
  }

  .chapter-copy-slot {
    grid-row: 2;
    align-items: end;
  }

  .chapter-copy__body {
    font-size: 14.5px;
  }

  .chapter-copy__abilities span {
    font-size: 13px;
  }

  .progression-nav {
    right: var(--rail);
    bottom: 14px;
    width: auto;
  }

  /* the copy takes the column's full width (the desktop awakening widens past it) */
  .chapter-copy,
  .chapter-copy--awaken {
    width: auto;
    min-width: 0;
  }

  .chapter-copy__sub {
    margin: -2px 0 6px;
    font-size: 14px;
  }

  .chapter-copy__about {
    margin-bottom: 10px;
  }

  .chapter-copy__abilities li {
    padding-block: 7px;
  }

  .chapter-copy__onward {
    margin-top: 12px;
  }

  /* one button across the column: easy to hit, never pushed off the edge */
  .chapter-copy__cta {
    flex: 1 1 auto;
    justify-content: center;
  }
}

/* phones (and short tablets): the awakening keeps its essentials (ability names, the rule,
   what's next), so the scene keeps its room and long ability texts never reach the rail */
@media (max-width: 599px) and (min-height: 591px) and (prefers-reduced-motion: no-preference),
       (max-width: 900px) and (min-height: 591px) and (max-height: 760px) and (prefers-reduced-motion: no-preference) {
  .chapter-copy__about,
  .chapter-copy__abilities span {
    display: none;
  }

  .chapter-copy__abilities li {
    padding-block: 5px;
  }

  .chapter-copy__onward {
    margin-top: 8px;
  }
}

/*
 * Sticky storytelling needs room for its copy, controls and stage to coexist.
 * Short viewports (phones held sideways) and reduced motion get one document-flow list.
 */
@media (max-height: 590px), (prefers-reduced-motion: reduce) {
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

  .progression__hearth,
  .progression__sigil,
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
    color: var(--acc-ink);
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


  .progression-static .chapter-copy__abilities {
    max-width: 620px;
    margin: 20px 0 0;
  }

  .progression-static .chapter-copy__abilities li {
    padding-block: 11px;
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
  .progression__sigil-art,
  .progression__dread::after {
    animation: none;
  }
}
</style>
