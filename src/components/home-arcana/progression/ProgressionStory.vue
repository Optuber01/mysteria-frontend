<template>
  <section
    id="progression"
    ref="sectionRef"
    class="progression"
    aria-labelledby="progression-title"
  >
    <!-- The roofline of Backlund: the room's top edge, rising over the hero's bottom as the room comes up. -->
    <i class="progression__roofs" :style="dress.roofs" aria-hidden="true" />
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
              <p class="chapter-copy__hint"><i aria-hidden="true" />{{ chapterText(activeChapter.id, 'hint') }}</p>
            </article>
            <article v-else key="awaken" class="chapter-copy chapter-copy--awaken">
              <h3 class="chapter-copy__name" :style="{ '--name-em': nameEm }">
                <template v-for="(part, index) in awakenTitle" :key="index"><em v-if="part.name">{{ part.text }}</em><template v-else>{{ part.text }}</template></template>
              </h3>
              <p class="chapter-copy__sub">{{ tp('drink.panelSub') }}</p>
              <ul v-if="firstAbilities.length" class="chapter-copy__abilities" :aria-label="tp('drink.abilitiesHeading')">
                <li v-for="ability in firstAbilities" :key="ability.id">
                  <strong>{{ ability.name }}</strong>
                  <span>{{ ability.description }}</span>
                </li>
              </ul>
              <p v-if="names.nextSequence" class="chapter-copy__next">{{ tp('drink.teaser') }}</p>
              <RouterLink class="arc-btn arc-btn--solid chapter-copy__cta" :to="$lp('/game')">
                {{ tp('drink.cta') }} <span aria-hidden="true">→</span>
              </RouterLink>
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
              {{ tp('drink.cta') }} <span aria-hidden="true">→</span>
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
import { CHAPTERS, T, awakenAt, blackoutAt, clamp01, dropStarts, ease, flashAt, gulpPulse, lerp, riskAt, span } from './timeline';
import type { ChapterId } from './timeline';
import { stageLayout } from './layout';
import { isNearby, whenSettled } from './prewarm';
import type { StageLayout } from './layout';
import breweryScene from '@/assets/images/home/progression/brewery-scene.webp';
import crimsonMoon from '@/assets/images/home/progression/crimson-moon.webp';

const { tp, names, ingredients, card, currentId } = useProgressionCopy();

function chapterText(id: ChapterId, field: 'short' | 'title' | 'copy' | 'hint'): string {
  return tp(`chapters.${id}.${field}`);
}

const firstAbilities = computed(() => names.value.abilities.slice(0, 2));
/** Rough width of "{name}." in em, so a long name can shrink to one line (see .chapter-copy__name). */
const nameEm = computed(() => ((names.value.sequence.length + 1) * 0.5 + 0.4).toFixed(2));
/** "Become a {sequence}." with the name picked out in the accent. */
const awakenTitle = computed(() => {
  const name = names.value.sequence;
  const text = chapterText('awaken', 'title');
  const index = name ? text.indexOf(name) : -1;
  if (index < 0) return [{ text, name: false }];
  return [
    { text: text.slice(0, index), name: false },
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
 * The first chapter's copy takes the title card's place once the card has gone
 * (.progression__heading leaves by 0.02): one after the other, never two headings at once.
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
 * The last stretch of the pin, where the light theme's paper fade (ArcanaHome, the section's
 * ::after, up to 34vh) starts to rise over the rail and the copy: their text steps out first
 * instead of turning into pale ghost text on the paper.
 */
const pinLeft = (share: number) => progress.value > 0.5 && (1 - progress.value) * Math.max(1, sectionHeight - innerHeight) < innerHeight * share;
/* the rail sits at the very foot, the copy higher up: each goes as the fade reaches it */
const railLeaving = computed(() => pinLeft(0.34));
const copyLeaving = computed(() => pinLeft(0.15));
function update() {
  if (!visible.value || !sectionRef.value || frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    if (!sectionRef.value) return;
    const top = sectionTop - scrollY;
    entryProgress.value = clamp01(1 - Math.max(0, top) / innerHeight);
    if (reducedMotion.value) return;
    const range = Math.max(1, sectionHeight - innerHeight);
    const next = clamp01(-top / range);
    progress.value = next;
    clearExpiredInspector(next);
  });
}
function goToChapter(index: number) {
  const section = sectionRef.value;
  const chapter = CHAPTERS[index];
  if (!section || !chapter) return;
  clearDetail();
  const rect = section.getBoundingClientRect();
  const range = rect.height - innerHeight;
  const sectionTop = rect.top + scrollY;
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
  const target = range > 1 ? sectionTop + clamp01(chapter.landing) * range : sectionTop;
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
  --h3-size: clamp(32px, 3.3vw, 50px);
  --top: calc(var(--site-header-stack, 106px) + clamp(14px, 3vh, 36px));
  position: relative;
  min-height: 380svh;
  color: var(--arc-ink);
  background: var(--arc-bg);
  isolation: isolate;
}

/*
 * The room's top edge is the roofline of the city the hero looked over (a stepped, blocky
 * skyline cut out of the room's own colour). It rises out of the room's top as the story
 * enters, over the strip the hero keeps free for it (--roof-h), so there is no straight seam:
 * in the light theme the dark room climbs the paper sky roof by roof, in the dark theme the
 * roofs are the room's black against the hero's last glow.
 */
.progression__roofs {
  position: absolute;
  z-index: 2;
  right: 0;
  bottom: calc(100% - 1px);
  left: 0;
  height: var(--roof-h, 120px);
  background: var(--arc-bg);
  -webkit-mask: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%201600%20220%22%20width%3D%221600%22%20height%3D%22220%22%20preserveAspectRatio%3D%22none%22%3E%3Cpath%20d%3D%22M0%20220%20L0%20140%20L24%20140%20L24%20132%20L56%20132%20L56%20108%20L72%20108%20L72%20132%20L104%20132%20L104%20160%20L112%20160%20L112%20144%20L120%20144%20L120%20128%20L128%20128%20L128%20112%20L136%20112%20L136%2096%20L168%2096%20L168%20112%20L176%20112%20L176%20128%20L184%20128%20L184%20144%20L192%20144%20L192%20160%20L200%20160%20L200%20100%20L224%20100%20L224%2068%20L240%2068%20L240%20100%20L264%20100%20L264%20108%20L280%20108%20L280%2084%20L288%2084%20L288%2060%20L296%2060%20L296%2036%20L304%2036%20L304%2012%20L312%2012%20L312%20-12%20L320%20-12%20L320%2012%20L328%2012%20L328%2036%20L336%2036%20L336%2060%20L344%2060%20L344%2084%20L352%2084%20L352%20108%20L368%20108%20L368%20116%20L392%20116%20L392%2076%20L408%2076%20L408%20116%20L432%20116%20L432%20116%20L472%20116%20L472%20160%20L488%20160%20L488%20144%20L504%20144%20L504%20128%20L512%20128%20L512%20144%20L528%20144%20L528%20160%20L544%20160%20L544%20100%20L568%20100%20L568%2060%20L584%2060%20L584%20100%20L608%20100%20L608%20160%20L632%20160%20L632%20144%20L656%20144%20L656%20128%20L664%20128%20L664%20144%20L688%20144%20L688%20160%20L712%20160%20L712%20116%20L736%20116%20L736%2084%20L752%2084%20L752%20116%20L776%20116%20L776%20116%20L832%20116%20L832%20108%20L848%20108%20L848%2084%20L856%2084%20L856%2060%20L864%2060%20L864%2036%20L872%2036%20L872%2012%20L880%2012%20L880%20-12%20L888%20-12%20L888%2012%20L896%2012%20L896%2036%20L904%2036%20L904%2060%20L912%2060%20L912%2084%20L920%2084%20L920%20108%20L936%20108%20L936%20160%20L960%20160%20L960%20144%20L984%20144%20L984%20128%20L1000%20128%20L1000%20144%20L1024%20144%20L1024%20160%20L1048%20160%20L1048%20116%20L1088%20116%20L1088%20116%20L1096%20116%20L1096%20100%20L1104%20100%20L1104%2084%20L1112%2084%20L1112%2068%20L1120%2068%20L1120%2052%20L1128%2052%20L1128%2068%20L1136%2068%20L1136%2084%20L1144%2084%20L1144%20100%20L1152%20100%20L1152%20116%20L1160%20116%20L1160%20100%20L1176%20100%20L1176%2084%20L1192%2084%20L1192%2068%20L1208%2068%20L1208%2084%20L1224%2084%20L1224%20100%20L1240%20100%20L1240%20160%20L1248%20160%20L1248%20144%20L1256%20144%20L1256%20128%20L1264%20128%20L1264%20112%20L1272%20112%20L1272%2096%20L1288%2096%20L1288%20112%20L1296%20112%20L1296%20128%20L1304%20128%20L1304%20144%20L1312%20144%20L1312%20160%20L1320%20160%20L1320%20100%20L1360%20100%20L1360%20100%20L1384%20100%20L1384%2068%20L1400%2068%20L1400%20100%20L1424%20100%20L1424%20148%20L1432%20148%20L1432%20132%20L1440%20132%20L1440%20116%20L1448%20116%20L1448%20100%20L1456%20100%20L1456%2084%20L1464%2084%20L1464%20100%20L1472%20100%20L1472%20116%20L1480%20116%20L1480%20132%20L1488%20132%20L1488%20148%20L1496%20148%20L1496%20148%20L1536%20148%20L1536%20108%20L1552%20108%20L1552%20148%20L1552%20140%20L1600%20140%20L1600%20140%20L1600%20220%20Z%22%20fill%3D%22%23000%22/%3E%3C/svg%3E") 0 100% / auto 100% repeat-x;
  mask: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%201600%20220%22%20width%3D%221600%22%20height%3D%22220%22%20preserveAspectRatio%3D%22none%22%3E%3Cpath%20d%3D%22M0%20220%20L0%20140%20L24%20140%20L24%20132%20L56%20132%20L56%20108%20L72%20108%20L72%20132%20L104%20132%20L104%20160%20L112%20160%20L112%20144%20L120%20144%20L120%20128%20L128%20128%20L128%20112%20L136%20112%20L136%2096%20L168%2096%20L168%20112%20L176%20112%20L176%20128%20L184%20128%20L184%20144%20L192%20144%20L192%20160%20L200%20160%20L200%20100%20L224%20100%20L224%2068%20L240%2068%20L240%20100%20L264%20100%20L264%20108%20L280%20108%20L280%2084%20L288%2084%20L288%2060%20L296%2060%20L296%2036%20L304%2036%20L304%2012%20L312%2012%20L312%20-12%20L320%20-12%20L320%2012%20L328%2012%20L328%2036%20L336%2036%20L336%2060%20L344%2060%20L344%2084%20L352%2084%20L352%20108%20L368%20108%20L368%20116%20L392%20116%20L392%2076%20L408%2076%20L408%20116%20L432%20116%20L432%20116%20L472%20116%20L472%20160%20L488%20160%20L488%20144%20L504%20144%20L504%20128%20L512%20128%20L512%20144%20L528%20144%20L528%20160%20L544%20160%20L544%20100%20L568%20100%20L568%2060%20L584%2060%20L584%20100%20L608%20100%20L608%20160%20L632%20160%20L632%20144%20L656%20144%20L656%20128%20L664%20128%20L664%20144%20L688%20144%20L688%20160%20L712%20160%20L712%20116%20L736%20116%20L736%2084%20L752%2084%20L752%20116%20L776%20116%20L776%20116%20L832%20116%20L832%20108%20L848%20108%20L848%2084%20L856%2084%20L856%2060%20L864%2060%20L864%2036%20L872%2036%20L872%2012%20L880%2012%20L880%20-12%20L888%20-12%20L888%2012%20L896%2012%20L896%2036%20L904%2036%20L904%2060%20L912%2060%20L912%2084%20L920%2084%20L920%20108%20L936%20108%20L936%20160%20L960%20160%20L960%20144%20L984%20144%20L984%20128%20L1000%20128%20L1000%20144%20L1024%20144%20L1024%20160%20L1048%20160%20L1048%20116%20L1088%20116%20L1088%20116%20L1096%20116%20L1096%20100%20L1104%20100%20L1104%2084%20L1112%2084%20L1112%2068%20L1120%2068%20L1120%2052%20L1128%2052%20L1128%2068%20L1136%2068%20L1136%2084%20L1144%2084%20L1144%20100%20L1152%20100%20L1152%20116%20L1160%20116%20L1160%20100%20L1176%20100%20L1176%2084%20L1192%2084%20L1192%2068%20L1208%2068%20L1208%2084%20L1224%2084%20L1224%20100%20L1240%20100%20L1240%20160%20L1248%20160%20L1248%20144%20L1256%20144%20L1256%20128%20L1264%20128%20L1264%20112%20L1272%20112%20L1272%2096%20L1288%2096%20L1288%20112%20L1296%20112%20L1296%20128%20L1304%20128%20L1304%20144%20L1312%20144%20L1312%20160%20L1320%20160%20L1320%20100%20L1360%20100%20L1360%20100%20L1384%20100%20L1384%2068%20L1400%2068%20L1400%20100%20L1424%20100%20L1424%20148%20L1432%20148%20L1432%20132%20L1440%20132%20L1440%20116%20L1448%20116%20L1448%20100%20L1456%20100%20L1456%2084%20L1464%2084%20L1464%20100%20L1472%20100%20L1472%20116%20L1480%20116%20L1480%20132%20L1488%20132%20L1488%20148%20L1496%20148%20L1496%20148%20L1536%20148%20L1536%20108%20L1552%20108%20L1552%20148%20L1552%20140%20L1600%20140%20L1600%20140%20L1600%20220%20Z%22%20fill%3D%22%23000%22/%3E%3C/svg%3E") 0 100% / auto 100% repeat-x;
  transform: translate3d(0, calc((1 - clamp(0, (var(--entry) - 0.02) * 4, 1)) * 101%), 0);
  pointer-events: none;
  will-change: transform;
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
  opacity: calc(clamp(0, (var(--entry) - 0.02) * 3, 1) * max(0, 0.5 + (1 - var(--entry)) * 0.14 - var(--awaken) * 0.3 - var(--risk) * 0.26 - var(--blackout) * 0.24));
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
    linear-gradient(90deg, rgba(11, 11, 14, 0.92) 0%, rgba(11, 11, 14, 0.6) 26%, transparent 52%),
    radial-gradient(ellipse 80% 75% at 64% 50%, transparent 45%, rgba(11, 11, 14, 0.75) 100%),
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
 * ---- title card: the entrance only ----
 * It sits where the chapter copy will be (same box, same left edge), comes up a
 * little faster than the room behind it, and lifts away as the story pins; the
 * first chapter's copy fades in under it (copyStyle), so one heading follows the
 * other in one place instead of a centred card cutting to a column.
 */
.progression__heading {
  --title-in: clamp(0, calc((var(--entry) - 0.12) * 2.2), 1);
  --title-out: clamp(0, calc(var(--journey) * 50), 1);
  position: absolute;
  z-index: 8;
  top: var(--top);
  bottom: clamp(100px, 13vh, 120px);
  left: var(--rail);
  width: min(56vw, 760px);
  display: grid;
  align-content: center;
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
  line-height: 0.98;
  letter-spacing: -0.03em;
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
  line-height: 1.02;
  letter-spacing: -0.025em;
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

.chapter-copy__sub {
  margin: -6px 0 18px;
  color: var(--arc-muted);
  font-size: 15px;
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
  display: -webkit-box;
  overflow: hidden;
  color: var(--arc-muted);
  font-size: 14px;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.chapter-copy__next {
  margin: 14px 0 0;
  color: var(--arc-muted);
  font-size: 14px;
  line-height: 1.5;
}

.chapter-copy__cta {
  margin-top: 20px;
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
 * Light theme only: the dark room dissolves into paper at its foot (see railLeaving). Its
 * text steps out first, so no light-on-paper ghost of the rail or the copy is left behind.
 */
:root[data-theme="parchment"] .progression-nav {
  transition: opacity .3s ease;
}

:root[data-theme="parchment"] .progression-nav.is-leaving,
:root[data-theme="parchment"] .progression__layout.is-leaving .chapter-copy {
  opacity: 0;
  pointer-events: none;
  transition: opacity .3s ease;
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

  .chapter-copy h3 {
    --h3-size: clamp(28px, 3.3vw, 38px);
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
    --h3-size: clamp(28px, 5.4vh, 42px);
  }

  .chapter-copy__sub {
    margin: -2px 0 12px;
    font-size: 14px;
  }

  .chapter-copy__abilities li {
    padding-block: 7px;
  }

  .chapter-copy__abilities span {
    -webkit-line-clamp: 1;
  }

  .chapter-copy__next {
    margin-top: 10px;
  }

  .chapter-copy__cta {
    margin-top: 14px;
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

  .progression__roofs {
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
    font-size: clamp(28px, 6vw, 40px);
    line-height: 1.05;
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

  .progression-static .chapter-copy__abilities span {
    -webkit-line-clamp: 3;
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
