<template>
  <section
    id="progression"
    ref="sectionRef"
    class="progression-v3"
    :class="{ 'is-visible': visible }"
    :style="{ '--journey': progress.toFixed(4) }"
    aria-labelledby="progression-title"
  >
    <div class="progression-v3__sticky">
      <div class="progression-v3__backdrop" aria-hidden="true">
        <img :src="breweryScene" alt="" width="1920" height="1017" decoding="async">
      </div>
      <div class="progression-v3__wash" aria-hidden="true" />

      <header class="progression-v3__heading">
        <p>Playable progression</p>
        <h2 id="progression-title">Find it. Brew it. Become it.</h2>
        <span>Sequence 9 · Seer of the Fool Pathway</span>
      </header>

      <div class="progression-v3__layout">
        <Transition name="chapter-copy" mode="out-in">
          <article :key="activeChapter.id" class="chapter-copy">
            <p class="chapter-copy__kicker">{{ activeChapter.kicker }}</p>
            <h3>{{ activeChapter.title }}</h3>
            <p class="chapter-copy__body">{{ activeChapter.copy }}</p>
            <p class="chapter-copy__hint"><i aria-hidden="true" />{{ activeChapter.hint }}</p>
          </article>
        </Transition>

        <div ref="stageRef" class="progression-v3__stage" @keydown.esc.stop="clearDetail" @click="onStageClick">
          <div
            class="scene-window"
            :style="bookWindowStyle"
            :aria-hidden="bookOpacity < 0.5"
          >
            <FormulaBookScene
              :progress="bookLocal"
              :active="bookOpacity > 0.5"
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

      <nav class="progression-nav" aria-label="Progression chapters">
        <button
          v-for="(chapter, index) in chapters"
          :key="chapter.id"
          type="button"
          :class="{ active: activeChapterIndex === index, complete: activeChapterIndex > index }"
          :aria-current="activeChapterIndex === index ? 'step' : undefined"
          @click="goToChapter(index)"
        >
          <i aria-hidden="true" />
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ chapter.short }}</strong>
        </button>
      </nav>
      <div class="progression-line" aria-hidden="true"><i :style="{ width: `${progress * 100}%` }" /></div>
    </div>

    <ol class="progression-static">
      <li v-for="(chapter, index) in chapters" :key="chapter.id">
        <span>{{ String(index + 1).padStart(2, '0') }}</span>
        <div>
          <small>{{ chapter.kicker }}</small>
          <h3>{{ chapter.title }}</h3>
          <p>{{ chapter.copy }}</p>
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
import breweryScene from '@/assets/images/home/progression/brewery-scene.webp';

type Chapter = { id: string; short: string; kicker: string; title: string; copy: string; hint: string; start: number; end: number };

const chapters: Chapter[] = [
  {
    id: 'discover', short: 'Discover', start: 0, end: 0.24,
    kicker: '01 · Recover the knowledge',
    title: 'Discover the formula.',
    copy: 'Complete formulas surface in Mysterria’s loot — or recover their pages and assemble the set. This one names a Sequence 9 of the Fool Pathway.',
    hint: 'Hover the book’s entries to study each ingredient.',
  },
  {
    id: 'infuse', short: 'Infuse', start: 0.24, end: 0.44,
    kicker: '02 · Feed the altar',
    title: 'Every item finds its place.',
    copy: 'The written formula leaves the page — main ingredients to the left, supplementary to the right, the formula at the heart, in written order.',
    hint: 'Follow each ingredient as it lands.',
  },
  {
    id: 'brew', short: 'Brew', start: 0.44, end: 0.62,
    kicker: '03 · The working',
    title: 'Watch it become a potion.',
    copy: 'Under the altar’s circle the mixture turns. A clean brew yields the Sequence 9 potion of the Seer — no challenge failed, nothing wasted.',
    hint: 'The circle brightens as the brew completes.',
  },
  {
    id: 'drink', short: 'Drink', start: 0.62, end: 0.84,
    kicker: '04 · Commit to the Pathway',
    title: 'Drink. Maintain control.',
    copy: 'Drinking commits you to the Fool Pathway and starts the awakening. The first Sequence 9 potion asks for no ritual — only nerve.',
    hint: 'Empty it to the last drop.',
  },
  {
    id: 'awaken', short: 'Awaken', start: 0.84, end: 1,
    kicker: '05 · Awaken',
    title: 'Become a Seer.',
    copy: 'Sequence 9 of the Fool Pathway awakens: Divination and Spiritualism join your toolkit. Digest, and Sequence 8 · Clown waits beyond.',
    hint: 'Inspect your first abilities.',
  },
];

const details: Record<string, { label: string; detail: string }> = {
  'formula-fool': {
    label: 'Written formula · Sequence 9 — Seer',
    detail: 'A complete formula of the Fool Pathway. Two pages: main ingredients on the left, supplementary on the right.',
  },
  'lavos-squid-blood': {
    label: 'Blood of the Lavos Squid',
    detail: 'Main ingredient · bled from the Lavos Squid, a Beyonder Creature you must hunt.',
  },
  'stellar-aqua-crystal': {
    label: 'Stellar Aqua Crystal',
    detail: 'Main ingredient · a rare crystal condensation found in generated world loot.',
  },
  'gold-mint-leaves': {
    label: 'Gold Mint Leaves',
    detail: 'Supplementary ingredient · harvested from a minable Gold Mint resource node.',
  },
  'brew-recipe-slot': {
    label: 'Formula slot',
    detail: 'The written formula holds the heart of the cauldron interface — load it first, then the ingredients in written order.',
  },
  'brew-main-slots': {
    label: 'Main ingredient slots',
    detail: 'Main ingredients load into the left column of the interface, in written order.',
  },
  'brew-supp-slots': {
    label: 'Supplementary slots',
    detail: 'Supplementary ingredients fill the right column — any order, but never before the mains.',
  },
  'brew-circle': {
    label: 'The working',
    detail: 'The circle binds formula and ingredients together. Load in the written order or the brew is lost.',
  },
  'sequence-potion': {
    label: 'Sequence 9 · Seer potion',
    detail: 'A successful brew. Drink it to commit to the Fool Pathway and begin the awakening.',
  },
  'drink-potion': {
    label: 'The last sip',
    detail: 'The potion empties as the awakening takes hold. Poor control adds Madness — the first drink needs only nerve.',
  },
  'ability-divination': {
    label: 'Divination',
    detail: 'Dowsing and dream divination: locate mobs, players and answers through the spirit world.',
  },
  'ability-spiritualism': {
    label: 'Spiritualism',
    detail: 'Perceive spiritual bodies and auras that ordinary eyes cannot see.',
  },
  'ability-teaser': {
    label: 'Sequence 8 · Clown',
    detail: 'Digest the potion, complete the advancement ritual, and Paper Dagger & Body Control join the toolkit.',
  },
};

const sectionRef = ref<HTMLElement | null>(null);
const stageRef = ref<HTMLElement | null>(null);
const progress = ref(0);
const visible = ref(false);
const reducedMotion = useReducedMotion();
const activeHotspotId = ref<string | null>(null);
const inspectorAnchor = ref<HTMLElement | null>(null);
const inspectorScene = ref<'book' | 'altar' | 'drink' | null>(null);
let observer: IntersectionObserver | null = null;
let frame = 0;

const activeChapterIndex = computed(() => {
  const g = progress.value;
  const index = chapters.findIndex((chapter) => g < chapter.end);
  return index === -1 ? chapters.length - 1 : index;
});
const activeChapter = computed(() => chapters[activeChapterIndex.value]);
const activeDetail = computed(() => (activeHotspotId.value ? details[activeHotspotId.value] ?? null : null));

function clamp01(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
function windowProgress(start: number, end: number) {
  return clamp01((progress.value - start) / (end - start));
}
function fadeWindow(fadeInStart: number, fadeOutStart: number, fadeOutEnd: number, fadeInEnd?: number) {
  const g = progress.value;
  const inEnd = fadeInEnd ?? fadeInStart + 0.03;
  const fadeIn = clamp01((g - fadeInStart) / (inEnd - fadeInStart));
  const fadeOut = 1 - clamp01((g - fadeOutStart) / (fadeOutEnd - fadeOutStart));
  return Math.min(fadeIn, fadeOut);
}

const bookLocal = computed(() => windowProgress(0, 0.24));
const altarLocal = computed(() => windowProgress(0.24, 0.62));
const drinkLocal = computed(() => windowProgress(0.62, 1));

const bookOpacity = computed(() => (reducedMotion.value ? 1 : fadeWindow(-1, 0.24, 0.27)));
const altarOpacity = computed(() => (reducedMotion.value ? 1 : fadeWindow(0.215, 0.62, 0.65, 0.245)));
const drinkOpacity = computed(() => (reducedMotion.value ? 1 : fadeWindow(0.595, 2, 2, 0.625)));

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
const bookDetailIds = new Set(['formula-fool', 'lavos-squid-blood', 'stellar-aqua-crystal', 'gold-mint-leaves']);
const altarDetailIds = new Set(['brew-recipe-slot', 'brew-main-slots', 'brew-supp-slots', 'brew-circle', 'sequence-potion']);

watch(activeChapterIndex, () => clearDetail());
watch([bookOpacity, altarOpacity, drinkOpacity], ([book, altar, drink]) => {
  const ownerHasFaded =
    (inspectorScene.value === 'book' && book <= 0.5) ||
    (inspectorScene.value === 'altar' && altar <= 0.5) ||
    (inspectorScene.value === 'drink' && drink <= 0.5);
  if (ownerHasFaded) clearDetail();
});

function showDetail(id: string, anchor: HTMLElement) {
  if (!details[id]) return;
  activeHotspotId.value = id;
  inspectorAnchor.value = anchor;
  inspectorScene.value = bookDetailIds.has(id) ? 'book' : altarDetailIds.has(id) ? 'altar' : 'drink';
}
function clearDetail() {
  activeHotspotId.value = null;
  inspectorAnchor.value = null;
  inspectorScene.value = null;
}
function onStageClick(event: MouseEvent) {
  if (!(event.target instanceof HTMLElement) || !event.target.closest('button')) clearDetail();
}
function clearExpiredInspector(nextProgress: number) {
  // A pointer can remain at the same screen coordinate while the sticky scene
  // scrolls underneath it. Do not let a teleported tooltip remain attached to
  // a now-hidden control in that case.
  if (
    (inspectorScene.value === 'book' && nextProgress >= 0.27) ||
    (inspectorScene.value === 'altar' && nextProgress >= 0.65)
  ) clearDetail();
}

function update() {
  if (!visible.value || !sectionRef.value || reducedMotion.value || frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const rect = sectionRef.value?.getBoundingClientRect();
    if (!rect) return;
    const range = Math.max(1, rect.height - innerHeight);
    const nextProgress = clamp01(-rect.top / range);
    progress.value = nextProgress;
    clearExpiredInspector(nextProgress);
  });
}
function goToChapter(index: number) {
  if (!sectionRef.value) return;
  const chapter = chapters[index];
  const range = sectionRef.value.offsetHeight - innerHeight;
  const top = sectionRef.value.getBoundingClientRect().top + scrollY;
  clearDetail();
  scrollTo({ top: top + range * (chapter.start + (chapter.end - chapter.start) * 0.35), behavior: reducedMotion.value ? 'auto' : 'smooth' });
}

onMounted(() => {
  observer = new IntersectionObserver(([entry]) => {
    visible.value = entry.isIntersecting;
    if (visible.value) update();
  }, { rootMargin: '120px 0px' });
  if (sectionRef.value) observer.observe(sectionRef.value);
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update, { passive: true });
});
onUnmounted(() => {
  observer?.disconnect();
  removeEventListener('scroll', update);
  removeEventListener('resize', update);
  if (frame) cancelAnimationFrame(frame);
});
</script>

<style scoped>
.progression-v3 {
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
  min-height: 500svh;
  color: #fcf9f2;
  background: #071719;
  isolation: isolate;
}
.progression-v3__sticky {
  position: sticky;
  top: 0;
  height: 100svh;
  min-height: 620px;
  overflow: hidden;
  background: #0b1a1b;
}
.progression-v3__backdrop,
.progression-v3__wash {
  position: absolute;
  inset: 0;
}
.progression-v3__backdrop {
  transform: scale(calc(1.03 + var(--journey) * 0.05)) translate3d(0, calc(var(--journey) * -1.2%), 0);
  transform-origin: 50% 56%;
}
.progression-v3__backdrop img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center 56%;
  filter: saturate(0.8) contrast(1.05) brightness(0.5);
}
.progression-v3__wash {
  z-index: 1;
  background:
    linear-gradient(90deg, rgba(4, 13, 15, 0.92) 0%, rgba(4, 15, 16, 0.55) 34%, rgba(4, 15, 16, 0.22) 68%, rgba(3, 10, 12, 0.78) 100%),
    linear-gradient(180deg, rgba(2, 8, 10, 0.6), transparent 32%, rgba(2, 8, 10, 0.9));
}

.progression-v3__heading {
  position: absolute;
  z-index: 8;
  top: clamp(88px, 11vh, 110px);
  left: clamp(18px, 4vw, 68px);
  display: grid;
  gap: 7px;
}
.progression-v3__heading p,
.chapter-copy__kicker {
  margin: 0;
  color: #dfb968;
  font: 700 0.72rem/1 "IBM Plex Mono", monospace;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.progression-v3__heading h2 {
  margin: 0;
  font: 650 clamp(1.25rem, 1.9vw, 1.7rem)/1.05 "IBM Plex Sans Condensed", sans-serif;
  letter-spacing: -0.02em;
}
.progression-v3__heading span {
  color: rgba(252, 249, 242, 0.6);
  font: 500 0.72rem/1.3 "IBM Plex Mono", monospace;
}

.progression-v3__layout {
  position: absolute;
  z-index: 4;
  inset: clamp(150px, 19vh, 190px) clamp(18px, 4vw, 68px) clamp(84px, 11vh, 112px);
  display: grid;
  grid-template-columns: minmax(240px, 0.55fr) minmax(560px, 1.45fr);
  align-items: center;
  gap: clamp(26px, 4vw, 72px);
}
.chapter-copy {
  min-width: 0;
  align-self: center;
}
.chapter-copy h3 {
  max-width: 420px;
  margin: 14px 0 14px;
  color: #fcf9f2;
  font: 650 clamp(2rem, 3.6vw, 3.6rem)/0.92 "IBM Plex Sans Condensed", sans-serif;
  letter-spacing: -0.045em;
  text-wrap: balance;
}
.chapter-copy__body {
  max-width: 400px;
  margin: 0;
  color: rgba(252, 249, 242, 0.74);
  font-size: clamp(0.85rem, 1vw, 0.95rem);
  line-height: 1.6;
}
.chapter-copy__hint {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 18px 0 0;
  padding-top: 14px;
  border-top: 1px solid rgba(252, 249, 242, 0.14);
  color: rgba(240, 211, 140, 0.75);
  font: 500 0.72rem/1.5 "IBM Plex Mono", monospace;
}
.chapter-copy__hint i {
  flex: 0 0 auto;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #dfb968;
  box-shadow: 0 0 10px rgba(223, 185, 104, 0.8);
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
  right: clamp(18px, 4vw, 68px);
  bottom: 16px;
  left: clamp(18px, 4vw, 68px);
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  border-top: 1px solid rgba(252, 249, 242, 0.13);
}
.progression-nav button {
  min-width: 44px;
  min-height: 56px;
  display: grid;
  grid-template-columns: 9px 22px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border: 0;
  color: rgba(252, 249, 242, 0.5);
  background: transparent;
  cursor: pointer;
  text-align: left;
}
.progression-nav button > i {
  width: 6px;
  height: 6px;
  border: 1px solid currentColor;
  border-radius: 50%;
}
.progression-nav button.active {
  color: #fcf9f2;
}
.progression-nav button.active > i {
  border-color: #dfb968;
  background: #dfb968;
  transform: scale(1.35);
}
.progression-nav button.complete {
  color: #9bcbb5;
}
.progression-nav span {
  font: 600 0.72rem/1 "IBM Plex Mono", monospace;
}
.progression-nav strong {
  font-size: 0.72rem;
}
.progression-nav button:focus-visible {
  outline: 3px solid #f0d38c;
  outline-offset: 2px;
}
.progression-line {
  position: absolute;
  z-index: 21;
  right: 0;
  bottom: 0;
  left: 0;
  height: 3px;
  background: rgba(252, 249, 242, 0.08);
}
.progression-line i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #35775f, #dfb968);
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
    grid-template-columns: 9px 1fr;
    justify-items: center;
  }
}
@media (max-width: 820px) {
  .progression-v3 {
    min-height: 560svh;
  }
  .progression-v3__layout {
    inset: 132px 14px 70px;
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
    right: 12px;
    left: 12px;
  }
  .progression-v3__heading span {
    display: none;
  }
  .progression-v3__layout {
    /* The two-line mobile heading finishes around 142px. Start the chapter
       copy below it so the stage never clips the kicker into the title. */
    inset: 154px 9px 62px;
  }
}

@media (prefers-reduced-motion: reduce), (max-height: 640px) {
  .progression-v3 {
    min-height: auto;
    padding: clamp(96px, 12vw, 140px) clamp(16px, 4vw, 58px);
    background: linear-gradient(145deg, #071416, #102724);
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
    border-top: 1px solid rgba(252, 249, 242, 0.13);
  }
  .progression-static li > span {
    color: #dfb968;
    font: 600 0.72rem/1 "IBM Plex Mono", monospace;
  }
  .progression-static small {
    color: #70a88e;
    font: 600 0.72rem/1 "IBM Plex Mono", monospace;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .progression-static h3 {
    margin: 9px 0 10px;
    font: 600 clamp(1.8rem, 5vw, 3rem)/0.95 "IBM Plex Sans Condensed", sans-serif;
  }
  .progression-static p {
    max-width: 620px;
    margin: 0;
    color: rgba(252, 249, 242, 0.7);
    font-size: 0.9rem;
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
