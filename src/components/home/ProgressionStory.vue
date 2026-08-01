<template>
  <section
    id="progression"
    ref="sectionRef"
    class="progression"
    :class="[`stage-${activeStage.id}`, { 'is-visible': visible }]"
    :style="{
      '--journey': progress.toFixed(4),
      '--local': localProgress.toFixed(4),
      '--presence': scenePresence.toFixed(4),
    }"
    aria-labelledby="progression-title"
  >
    <div class="progression-sticky">
      <div class="brewery-backdrop" aria-hidden="true">
        <img :src="breweryScene" alt="" width="1920" height="1017" decoding="async">
      </div>
      <div class="scene-grade" aria-hidden="true" />
      <div class="chapter-aura" aria-hidden="true" />

      <header class="chapter-heading">
        <span>Playable progression</span>
        <h2 id="progression-title">Find it. Brew it. Become it.</h2>
        <p>Sequence 9 · Seer example</p>
      </header>

      <div class="stage-layout">
        <article :key="activeStage.id" class="stage-copy">
          <span>{{ activeStage.kicker }}</span>
          <h3>{{ activeStage.title }}</h3>
          <p>{{ activeStage.copy }}</p>
          <div class="fact-line"><i aria-hidden="true" />{{ activeStage.fact }}</div>
        </article>

        <div class="scene-shell">
          <div ref="sceneRef" class="scene" :class="`scene--${activeStage.id}`" @keydown.esc.stop="closeDetail">
            <MinecraftPlayer
              class="scene-player"
              :class="`scene-player--${activeStage.id}`"
              :mode="playerMode"
              :active="visible"
              :progress="localProgress"
            />
            <div :key="activeStage.id" class="stage-visual">
            <template v-if="activeStage.id === 'formula'">
              <div class="formula-stage" aria-label="Assemble the Seer formula">
                <button
                  v-for="(page, index) in formulaPages"
                  :key="page.id"
                  class="formula-fragment hotspot"
                  :class="{ 'is-assembled': assembledFormulaPages.includes(page.id) }"
                  :style="{ '--page-index': String(index) }"
                  type="button"
                  :aria-pressed="assembledFormulaPages.includes(page.id)"
                  :aria-describedby="detailId(page.id)"
                  @mouseenter="showDetail(page.id, $event)"
                  @mouseleave="clearDetail"
                  @focus="showDetail(page.id, $event)"
                  @blur="clearDetail"
                  @click="toggleFormulaPage(page.id, $event)"
                >
                  <span class="formula-page-glyph" aria-hidden="true"><i /></span>
                  <span>{{ page.label }}</span>
                </button>

                <button
                  class="formula-book hotspot"
                  :class="{ 'is-complete': formulaComplete }"
                  type="button"
                  :aria-describedby="detailId('formula-complete')"
                  @mouseenter="showDetail('formula-complete', $event)"
                  @mouseleave="clearDetail"
                  @focus="showDetail('formula-complete', $event)"
                  @blur="clearDetail"
                  @click="toggleDetail('formula-complete', $event)"
                >
                  <span class="formula-book__pages">
                    <small>SEQUENCE 9</small>
                    <img :src="foolRecipe" alt="" width="16" height="16">
                    <b>SEER</b>
                  </span>
                  <strong>{{ formulaComplete ? 'Formula assembled' : 'Complete Seer formula' }}</strong>
                </button>
              </div>
            </template>

            <template v-else-if="activeStage.id === 'ingredients'">
              <div class="ingredient-world" aria-label="Explore for potion ingredients">
                <div class="terrain terrain--back" aria-hidden="true" />
                <button
                  v-for="(ingredient, index) in ingredientItems"
                  :key="ingredient.id"
                  class="ingredient-node hotspot"
                  :class="[`ingredient-node--${index + 1}`, { 'is-collected': localProgress > .18 + index * .19 }]"
                  type="button"
                  :aria-describedby="detailId(ingredient.id)"
                  @mouseenter="showDetail(ingredient.id, $event)"
                  @mouseleave="clearDetail"
                  @focus="showDetail(ingredient.id, $event)"
                  @blur="clearDetail"
                  @click="toggleDetail(ingredient.id, $event)"
                >
                  <span><img :src="ingredient.src" alt="" width="16" height="16"></span>
                  <strong>{{ ingredient.label }}</strong>
                  <small>{{ ingredient.role }}</small>
                </button>
                <button
                  class="ingredient-node ingredient-node--characteristic hotspot"
                  type="button"
                  :aria-describedby="detailId('beyonder-characteristic')"
                  @mouseenter="showDetail('beyonder-characteristic', $event)"
                  @mouseleave="clearDetail"
                  @focus="showDetail('beyonder-characteristic', $event)"
                  @blur="clearDetail"
                  @click="toggleDetail('beyonder-characteristic', $event)"
                >
                  <span class="characteristic" aria-hidden="true"><i /></span>
                  <strong>Characteristic</strong><small>Main-set substitute</small>
                </button>
                <div class="collection-line" aria-hidden="true"><i :style="{ width: `${Math.min(100, localProgress * 135)}%` }" /></div>
              </div>
            </template>

            <template v-else-if="activeStage.id === 'brew'">
              <div class="brew-switch" role="group" aria-label="Brewing scene view">
                <button type="button" :aria-pressed="activeBrewView === 'altar'" @click="brewViewOverride = 'altar'">Build altar</button>
                <button type="button" :aria-pressed="activeBrewView === 'interface'" @click="brewViewOverride = 'interface'">Brew potion</button>
              </div>
              <Transition name="brew-view" mode="out-in">
                <div v-if="activeBrewView === 'altar'" key="altar" class="brew-view brew-view--altar">
                  <RitualAltarScene
                    :progress="Math.min(1, localProgress * 2.3)"
                    @inspect="payload => showDetailByAnchor(payload.id, payload.anchor)"
                    @toggle-inspect="payload => toggleDetailByAnchor(payload.id, payload.anchor)"
                    @clear="clearDetail"
                  />
                </div>
                <div v-else key="interface" class="brew-view brew-view--interface">
                  <div class="brew-interface">
                    <div class="brew-interface__header"><span>Ritual Altar</span><i>Brewing interface</i></div>
                    <div class="brew-interface__image">
                      <img :src="cauldronInterface" alt="Mysterria Ritual Altar brewing interface" width="636" height="284">
                      <button class="slot-zone slot-zone--main hotspot" type="button" aria-label="Main ingredient slots" :aria-describedby="detailId('brew-main-slots')" @mouseenter="showDetail('brew-main-slots', $event)" @mouseleave="clearDetail" @focus="showDetail('brew-main-slots', $event)" @blur="clearDetail" @click="toggleDetail('brew-main-slots', $event)" />
                      <button class="slot-zone slot-zone--recipe hotspot" type="button" aria-label="Written formula slot" :aria-describedby="detailId('brew-recipe-slot')" @mouseenter="showDetail('brew-recipe-slot', $event)" @mouseleave="clearDetail" @focus="showDetail('brew-recipe-slot', $event)" @blur="clearDetail" @click="toggleDetail('brew-recipe-slot', $event)" />
                      <button class="slot-zone slot-zone--supp hotspot" type="button" aria-label="Supplementary ingredient slots" :aria-describedby="detailId('brew-supp-slots')" @mouseenter="showDetail('brew-supp-slots', $event)" @mouseleave="clearDetail" @focus="showDetail('brew-supp-slots', $event)" @blur="clearDetail" @click="toggleDetail('brew-supp-slots', $event)" />
                    </div>
                  </div>
                  <button class="potion-result hotspot" type="button" :aria-describedby="detailId('sequence-potion')" @mouseenter="showDetail('sequence-potion', $event)" @mouseleave="clearDetail" @focus="showDetail('sequence-potion', $event)" @blur="clearDetail" @click="toggleDetail('sequence-potion', $event)">
                    <img :src="sequencePotion" alt="" width="16" height="16"><span><small>BREW COMPLETE</small><strong>Sequence 9 potion</strong></span>
                  </button>
                </div>
              </Transition>
            </template>

            <template v-else-if="activeStage.id === 'awaken'">
              <div class="awakening" :class="{ 'is-ascended': localProgress > .64 }">
                <div class="awakening-rings" aria-hidden="true"><i /><i /><i /></div>
                <div class="ascension-beam" aria-hidden="true" />
                <button class="held-potion hotspot" type="button" :aria-describedby="detailId('drink-potion')" @mouseenter="showDetail('drink-potion', $event)" @mouseleave="clearDetail" @focus="showDetail('drink-potion', $event)" @blur="clearDetail" @click="toggleDetail('drink-potion', $event)">
                  <img :src="sequencePotion" alt="" width="16" height="16"><span>Sequence 9 · Seer</span>
                </button>
                <button class="control-test hotspot" type="button" :aria-describedby="detailId('control-challenge')" @mouseenter="showDetail('control-challenge', $event)" @mouseleave="clearDetail" @focus="showDetail('control-challenge', $event)" @blur="clearDetail" @click="advanceControlTest">
                  <small>MAINTAIN CONTROL</small>
                  <span class="control-pattern" aria-label="Control pattern progress">
                    <i v-for="index in 5" :key="index" :class="{ active: index <= controlScore }" />
                  </span>
                  <strong>{{ controlScore >= 5 ? 'Stable' : 'Repeat the pattern' }}</strong>
                </button>
                <button class="powers-reveal hotspot" type="button" :aria-describedby="detailId('drink-abilities')" @mouseenter="showDetail('drink-abilities', $event)" @mouseleave="clearDetail" @focus="showDetail('drink-abilities', $event)" @blur="clearDetail" @click="toggleDetail('drink-abilities', $event)">
                  <small>PATHWAY AWAKENED</small><strong>SEER</strong>
                  <span><b>Divination</b><b>Spiritualism</b></span>
                </button>
              </div>
            </template>

            <template v-else>
              <div class="living-loop" :class="{ 'is-advancing': localProgress > .82 }">
                <div class="acting-core">
                  <div class="acting-rings" aria-hidden="true"><i /><i /></div>
                  <span class="acting-label"><small>ACTING METHOD</small><strong>{{ digestionValue }}%</strong></span>
                </div>

                <div class="activity-orbit" aria-label="Ways to digest a potion">
                  <button
                    v-for="(route, index) in digestRoutes"
                    :key="route.id"
                    class="activity-node hotspot"
                    :class="`route-${index + 1}`"
                    type="button"
                    :aria-describedby="detailId(route.id)"
                    @mouseenter="showDetail(route.id, $event)"
                    @mouseleave="clearDetail"
                    @focus="showDetail(route.id, $event)"
                    @blur="clearDetail"
                    @click="toggleDetail(route.id, $event)"
                  >
                    <img v-if="route.asset" :src="route.asset" alt="" width="16" height="16">
                    <svg v-else aria-hidden="true" viewBox="0 0 24 24"><path :d="route.icon" /></svg>
                    <span>{{ route.label }}</span>
                  </button>
                </div>

                <button class="preparation-track hotspot" type="button" :aria-describedby="detailId('prepare-next')" @mouseenter="showDetail('prepare-next', $event)" @mouseleave="clearDetail" @focus="showDetail('prepare-next', $event)" @blur="clearDetail" @click="toggleDetail('prepare-next', $event)">
                  <small>PREPARE WHILE YOU DIGEST</small>
                  <span><b><img :src="foolRecipe" alt="" width="16" height="16">Formula</b><i /><b><img :src="goldMintLeaves" alt="" width="16" height="16">Ingredients</b><i /><b><img :src="ritualBook" alt="" width="16" height="16">Ritual</b><i /><b><img :src="sequencePotion" alt="" width="16" height="16">Potion</b></span>
                </button>

                <button class="sequence-advance hotspot" type="button" :aria-describedby="detailId('advance-sequence')" @mouseenter="showDetail('advance-sequence', $event)" @mouseleave="clearDetail" @focus="showDetail('advance-sequence', $event)" @blur="clearDetail" @click="toggleDetail('advance-sequence', $event)">
                  <small>ADVANCEMENT</small><span><strong>9</strong><i /><strong>8</strong></span><b>New abilities unlocked</b>
                </button>

                <div class="digestion-meter" aria-label="Example digestion progress">
                  <span><strong>Current potion digestion</strong><b>{{ digestionValue }}%</b></span>
                  <i><b :style="{ width: `${digestionValue}%` }" /></i>
                </div>
              </div>
            </template>
            </div>

            <SceneInspectorPopover
              :open="Boolean(activeDetail && inspectorAnchor)"
              :anchor="inspectorAnchor"
              :boundary="sceneRef"
              :title="activeDetail?.label"
              :description="activeDetail?.detail"
            />
          </div>
        </div>
      </div>

      <div class="sr-mechanic-details">
        <template v-for="stage in progressionStages" :key="`details-${stage.id}`">
          <span v-for="hotspot in stage.hotspots" :id="detailId(hotspot.id, stage.id)" :key="hotspot.id">{{ hotspot.detail }}</span>
        </template>
      </div>

      <nav class="stage-nav" aria-label="Progression chapters">
        <button
          v-for="(stage, index) in progressionStages"
          :key="stage.id"
          type="button"
          :class="{ active: activeIndex === index, complete: activeIndex > index }"
          :aria-current="activeIndex === index ? 'step' : undefined"
          @click="goToStage(index)"
        ><i /><span>{{ String(index + 1).padStart(2, '0') }}</span><strong>{{ stage.short }}</strong></button>
      </nav>
      <div class="journey-line" aria-hidden="true"><i :style="{ width: `${progress * 100}%` }" /></div>
    </div>

    <ol class="static-progression">
      <li v-for="(stage, index) in progressionStages" :key="stage.id">
        <span>{{ String(index + 1).padStart(2, '0') }}</span>
        <div><small>{{ stage.kicker }}</small><h3>{{ stage.title }}</h3><p>{{ stage.copy }}</p><strong>{{ stage.fact }}</strong></div>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useReducedMotion } from '@/composables/useReducedMotion';
import { progressionStages } from '@/data/progression';
import RitualAltarScene from './RitualAltarScene.vue';
import MinecraftPlayer, { type MinecraftPlayerMode } from './MinecraftPlayer.vue';
import SceneInspectorPopover from './SceneInspectorPopover.vue';
import breweryScene from '@/assets/images/home/progression/brewery-scene.webp';
import cauldronInterface from '@/assets/images/home/progression/cauldron-interface.png';
import foolRecipe from '@/assets/images/home/progression/recipes/fool.png';
import lavosSquidBlood from '@/assets/images/home/progression/real/lavos-squid-blood.png';
import stellarAquaCrystal from '@/assets/images/home/progression/real/stellar-aqua-crystal.png';
import goldMintLeaves from '@/assets/images/home/progression/real/gold-mint-leaves.png';
import actingBottle from '@/assets/images/home/progression/real/acting-bottle-medium.png';
import ritualBook from '@/assets/images/home/progression/real/ritual-book-tier2.png';
import sequencePotion from '@/assets/images/home/progression/real/sequence-potion.png';

const sectionRef = ref<HTMLElement | null>(null);
const sceneRef = ref<HTMLElement | null>(null);
const progress = ref(0);
const activeIndex = ref(0);
const localProgress = ref(0);
const visible = ref(false);
const activeHotspotId = ref<string | null>(null);
const pinnedHotspotId = ref<string | null>(null);
const inspectorAnchor = ref<HTMLElement | null>(null);
const pinnedAnchor = ref<HTMLElement | null>(null);
const assembledFormulaPages = ref<string[]>([]);
const brewViewOverride = ref<'altar' | 'interface' | null>(null);
const controlScore = ref(2);
const reducedMotion = useReducedMotion();
let observer: IntersectionObserver | null = null;
let frame = 0;

const activeStage = computed(() => progressionStages[activeIndex.value]);
const scenePresence = computed(() => {
  const enter = Math.min(1, localProgress.value / .1);
  const leave = Math.min(1, (1 - localProgress.value) / .08);
  return .76 + Math.min(enter, leave) * .24;
});
const activeDetail = computed(() => activeStage.value.hotspots.find(hotspot => hotspot.id === activeHotspotId.value) ?? null);
const formulaPages = computed(() => progressionStages[0].hotspots.filter(hotspot => hotspot.id !== 'formula-complete'));
const formulaComplete = computed(() => assembledFormulaPages.value.length === formulaPages.value.length);
const digestionValue = computed(() => Math.min(100, Math.round(18 + localProgress.value * 98)));
const activeBrewView = computed<'altar' | 'interface'>(() => brewViewOverride.value ?? (localProgress.value < .62 ? 'altar' : 'interface'));
const playerMode = computed<MinecraftPlayerMode>(() => {
  if (activeStage.value.id === 'formula') return 'inspect';
  if (activeStage.value.id === 'ingredients') return 'gather';
  if (activeStage.value.id === 'brew') return activeBrewView.value === 'interface' ? 'brew' : 'idle';
  if (activeStage.value.id === 'awaken') return localProgress.value > .55 ? 'advance' : 'drink';
  return localProgress.value > .82 ? 'advance' : 'cast';
});

const ingredientItems = [
  { id: 'lavos-squid-blood', label: 'Lavos Squid Blood', role: 'Main · Creature', src: lavosSquidBlood },
  { id: 'stellar-aqua-crystal', label: 'Stellar Aqua Crystal', role: 'Main · Loot', src: stellarAquaCrystal },
  { id: 'gold-mint-leaves', label: 'Gold Mint Leaves', role: 'Supplement · Node', src: goldMintLeaves },
];

const digestRoutes = [
  { id: 'act-sequence', label: 'Act the Sequence', icon: 'M12 3l2.7 5.5L21 9.4l-4.5 4.4 1.1 6.2-5.6-2.9L6.4 20l1.1-6.2L3 9.4l6.3-.9L12 3z' },
  { id: 'passive-play', label: 'Play naturally', icon: 'M12 3a9 9 0 109 9h-2a7 7 0 11-7-7V3zm1 4v6l4 2' },
  { id: 'take-bounty', label: 'Take bounties', icon: 'M7 3h10v3h3v15H4V6h3V3zm2 3h6V5H9v1zm-1 5h8M8 15h5' },
  { id: 'dungeons', label: 'Clear dungeons', icon: 'M4 21V7l4-4 4 4 4-4 4 4v14h-5v-6H9v6H4zm4-9h2m4 0h2' },
  { id: 'incursions', label: 'Face incursions', icon: 'M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z' },
  { id: 'acting-bottle', label: 'Acting Bottles', icon: '', asset: actingBottle },
];

function eventAnchor(event?: Event) {
  return event?.currentTarget instanceof HTMLElement ? event.currentTarget : null;
}
function showDetail(id: string, event?: Event) {
  activeHotspotId.value = id;
  inspectorAnchor.value = eventAnchor(event);
}
function showDetailByAnchor(id: string, anchor: HTMLElement) {
  activeHotspotId.value = id;
  inspectorAnchor.value = anchor;
}
function clearDetail() {
  activeHotspotId.value = pinnedHotspotId.value;
  inspectorAnchor.value = pinnedAnchor.value;
}
function closeDetail() {
  activeHotspotId.value = null;
  pinnedHotspotId.value = null;
  inspectorAnchor.value = null;
  pinnedAnchor.value = null;
}
function detailId(id: string, stageId = activeStage.value.id) {
  return `progression-detail-${stageId}-${id}`;
}
function toggleDetail(id: string, event?: Event) {
  toggleDetailByAnchor(id, eventAnchor(event));
}
function toggleDetailByAnchor(id: string, anchor: HTMLElement | null) {
  const closing = pinnedHotspotId.value === id;
  pinnedHotspotId.value = closing ? null : id;
  pinnedAnchor.value = closing ? null : anchor;
  activeHotspotId.value = closing ? null : id;
  inspectorAnchor.value = closing ? null : anchor;
}
function toggleFormulaPage(id: string, event: Event) {
  assembledFormulaPages.value = assembledFormulaPages.value.includes(id)
    ? assembledFormulaPages.value.filter(pageId => pageId !== id)
    : [...assembledFormulaPages.value, id];
  toggleDetail(id, event);
}
function advanceControlTest(event: Event) {
  controlScore.value = controlScore.value >= 5 ? 1 : controlScore.value + 1;
  toggleDetail('control-challenge', event);
}

function update() {
  if (!visible.value || !sectionRef.value || reducedMotion.value || frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const rect = sectionRef.value?.getBoundingClientRect();
    if (!rect) return;
    const range = Math.max(1, rect.height - innerHeight);
    const next = Math.min(1, Math.max(0, -rect.top / range));
    const scaled = Math.min(progressionStages.length - .0001, next * progressionStages.length);
    const nextIndex = Math.floor(scaled);
    if (nextIndex !== activeIndex.value) {
      closeDetail();
      brewViewOverride.value = null;
    }
    progress.value = next;
    activeIndex.value = nextIndex;
    localProgress.value = scaled - nextIndex;
  });
}
function goToStage(index: number) {
  if (!sectionRef.value) return;
  const range = sectionRef.value.offsetHeight - innerHeight;
  const top = sectionRef.value.getBoundingClientRect().top + scrollY;
  scrollTo({ top: top + range * ((index + .16) / progressionStages.length), behavior: reducedMotion.value ? 'auto' : 'smooth' });
}

watch(localProgress, value => {
  if (activeStage.value.id === 'awaken') controlScore.value = Math.max(controlScore.value, Math.min(5, 1 + Math.floor(value * 6)));
});

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
.progression {
  --journey: 0;
  --local: 0;
  --presence: 1;
  --ease: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  min-height: 650svh;
  color: #fcf9f2;
  background: #071416;
  isolation: isolate;
}
.progression-sticky { position: sticky; top: 0; height: 100svh; min-height: 620px; overflow: hidden; background: #0a1a1b; }
.brewery-backdrop, .scene-grade, .chapter-aura { position: absolute; inset: 0; }
.brewery-backdrop { transform: scale(calc(1.035 + var(--journey) * .1)) translate3d(calc((.5 - var(--journey)) * 1.4%), calc(var(--journey) * -1.2%), 0); transform-origin: 52% 55%; will-change: transform; }
.brewery-backdrop img { width: 100%; height: 100%; display: block; object-fit: cover; object-position: center 56%; filter: saturate(.68) contrast(1.07) brightness(.45); transition: filter 1s var(--ease),object-position 1.2s var(--ease); }
.stage-formula .brewery-backdrop img { object-position: 43% 54%; filter: sepia(.16) saturate(.72) contrast(1.05) brightness(.52); }
.stage-ingredients .brewery-backdrop img { object-position: 58% 61%; filter: saturate(.92) contrast(1.08) brightness(.43); }
.stage-brew .brewery-backdrop img { object-position: 51% 58%; filter: sepia(.12) saturate(.82) contrast(1.1) brightness(.49); }
.stage-awaken .brewery-backdrop img { object-position: 64% 50%; filter: saturate(.55) contrast(1.14) brightness(.35); }
.stage-digest .brewery-backdrop img { object-position: 36% 61%; filter: saturate(.78) contrast(1.04) brightness(.42); }
.scene-grade { z-index: 1; background: linear-gradient(90deg, rgba(2,10,12,.94), rgba(3,14,15,.5) 35%, rgba(3,14,15,.34) 68%, rgba(2,9,11,.9)), linear-gradient(180deg, rgba(2,8,10,.68), transparent 32%, rgba(2,8,10,.9)), radial-gradient(circle at 69% 50%, rgba(77,145,119,.17), transparent 35%); transition: background-color .8s var(--ease); }
.stage-awaken .scene-grade, .stage-digest .scene-grade { background: linear-gradient(90deg, rgba(2,9,11,.95), rgba(4,15,16,.44) 52%, rgba(2,8,10,.92)), radial-gradient(circle at 69% 48%, rgba(198,155,82,.24), transparent 34%), linear-gradient(180deg, rgba(2,8,10,.72), transparent 38%, rgba(2,8,10,.94)); }
.chapter-aura { z-index: 2; left: 40%; background: radial-gradient(circle at 50% 48%, rgba(89,156,128,.12), transparent 43%); opacity: var(--presence); }
.sr-mechanic-details { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

.chapter-heading { position: absolute; z-index: 20; top: clamp(70px,8vh,90px); left: clamp(18px,3.2vw,52px); display: grid; gap: 5px; }
.chapter-heading span, .stage-copy > span { color: #dfb968; font: 650 .62rem/1 "IBM Plex Mono",monospace; letter-spacing: .16em; text-transform: uppercase; }
.chapter-heading h2 { margin: 0; color: rgba(252,249,242,.93); font: 600 clamp(1.05rem,1.55vw,1.4rem)/1 "IBM Plex Sans Condensed",sans-serif; letter-spacing: -.02em; }
.chapter-heading p { margin: 2px 0 0; color: rgba(252,249,242,.5); font: 500 .58rem/1 "IBM Plex Mono",monospace; }
.stage-layout { position: absolute; z-index: 8; inset: clamp(142px,16vh,168px) clamp(18px,3.2vw,52px) clamp(88px,11vh,112px); display: grid; grid-template-columns: minmax(280px,.72fr) minmax(560px,1.72fr); align-items: center; gap: clamp(26px,4vw,72px); }
.stage-copy { min-width: 0; opacity: var(--presence); transform: translate3d(0,calc((1 - var(--presence)) * 18px),0); }
.copy-swap-enter-active,.copy-swap-leave-active { transition: opacity .26s ease,transform .55s var(--ease); }
.copy-swap-enter-from { opacity: 0; transform: translateY(18px); }
.copy-swap-leave-to { opacity: 0; transform: translateY(-12px); }
.stage-copy h3 { max-width: 470px; margin: 15px 0; font: 630 clamp(2.7rem,4.65vw,5.15rem)/.9 "IBM Plex Sans Condensed",sans-serif; letter-spacing: -.048em; text-wrap: balance; }
.stage-copy > p { max-width: 450px; margin: 0; color: rgba(252,249,242,.72); font-size: clamp(.82rem,.98vw,.96rem); line-height: 1.62; }
.fact-line { max-width: 450px; display: flex; gap: 10px; margin-top: 21px; padding-top: 16px; border-top: 1px solid rgba(252,249,242,.13); color: rgba(252,249,242,.5); font: 500 .59rem/1.55 "IBM Plex Mono",monospace; }
.fact-line i { flex: 0 0 auto; width: 6px; height: 6px; margin-top: 3px; border-radius: 50%; background: #dfb968; }
.scene-shell { min-width: 0; height: min(68vh,680px); display: grid; place-items: center; }
.scene { position: relative; width: 100%; height: 100%; opacity: var(--presence); transform: translate3d(0,calc((1 - var(--presence)) * 16px),0) scale(calc(.98 + var(--presence) * .02)); }
.stage-visual { position: absolute; inset: 0; }
.stage-scene-enter-active,.stage-scene-leave-active { transition: opacity .3s ease,filter .5s var(--ease),transform .65s var(--ease); }
.stage-scene-enter-from { opacity: 0; filter: blur(8px); transform: translateX(18px) scale(.985); }
.stage-scene-leave-to { opacity: 0; filter: blur(5px); transform: translateX(-14px) scale(.99); }
.hotspot { min-width: 44px; min-height: 44px; border: 0; color: inherit; cursor: pointer; }
.hotspot:focus-visible { outline: 3px solid #f0d38c; outline-offset: 3px; }
.scene-player { position: absolute; margin: 0; transition: left .75s var(--ease),top .75s var(--ease),bottom .75s var(--ease),width .75s var(--ease),height .75s var(--ease),opacity .5s ease,transform .75s var(--ease); }

.formula-stage { position: absolute; inset: 0; }
.scene-player--formula { left: 3%; bottom: 0; width: 38%; height: 80%; opacity: .64; filter: saturate(.78); }
.formula-book { position: absolute; z-index: 4; top: 50%; left: 60%; width: min(390px,46%); aspect-ratio: 1.78; display: grid; place-items: center; gap: 8px; padding: 16px; border: 1px solid rgba(223,185,104,.35); border-radius: 18px; color: #fcf9f2; background: linear-gradient(96deg,#dfc38b 0 49.3%,#bf9860 49.7% 50.3%,#ead09a 50.7%); box-shadow: 0 32px 70px rgba(0,0,0,.42); transform: translate(-50%,-50%) perspective(800px) rotateX(7deg) rotateY(-5deg) rotateZ(-1deg); transition: box-shadow .45s var(--ease), transform .65s var(--ease); }
.formula-book::before { position: absolute; inset: 4% 50% 4% auto; width: 1px; background: rgba(77,50,23,.3); content: ''; }
.formula-book__pages { position: relative; width: 100%; height: 100%; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto 1fr auto; place-items: center; color: #513b27; }
.formula-book__pages small { grid-column: 1; align-self: start; font: 650 .52rem/1 "IBM Plex Mono",monospace; letter-spacing: .12em; }
.formula-book__pages img { grid-column: 2; grid-row: 1/4; width: min(116px,70%); height: auto; aspect-ratio: 1; object-fit: contain; image-rendering: pixelated; }
.formula-book__pages b { grid-column: 1; align-self: end; font: 700 .56rem/1 "IBM Plex Mono",monospace; letter-spacing: .14em; }
.formula-book > strong { position: absolute; bottom: -34px; color: #fcf9f2; font: 650 .62rem/1 "IBM Plex Mono",monospace; }
.formula-book.is-complete { box-shadow: 0 32px 70px rgba(0,0,0,.42),0 0 42px rgba(198,155,82,.3); transform: translate(-50%,-50%) perspective(800px) rotateX(2deg) rotateY(0) rotateZ(0) scale(1.03); }
.formula-fragment { position: absolute; z-index: 6; width: 145px; display: flex; align-items: center; gap: 9px; padding: 9px 11px; border: 1px solid rgba(223,185,104,.26); border-radius: 11px; color: rgba(252,249,242,.84); background: rgba(6,25,25,.94); font: 600 .54rem/1.25 "IBM Plex Mono",monospace; text-align: left; transition: transform .6s var(--ease),opacity .35s,border-color .2s; }
.formula-page-glyph { position: relative; width: 30px; height: 34px; flex: 0 0 auto; border: 2px solid #d8d1bd; background: repeating-linear-gradient(180deg,#f2eddf 0 5px,#b7ad99 6px 7px); box-shadow: 3px 3px 0 rgba(0,0,0,.32); image-rendering: pixelated; }
.formula-page-glyph::after { position: absolute; top: -2px; right: -2px; border-width: 0 0 8px 8px; border-style: solid; border-color: transparent transparent #938873 transparent; content: ''; }
.formula-page-glyph i { position: absolute; right: 5px; bottom: 5px; width: 6px; height: 6px; background: #77532d; box-shadow: -8px 0 #77532d; }
.formula-fragment:nth-child(1) { top: 11%; left: 38%; }
.formula-fragment:nth-child(2) { top: 11%; right: 2%; }
.formula-fragment:hover,.formula-fragment:focus-visible { border-color: #dfb968; transform: translateY(-4px); }
.formula-fragment.is-assembled { left: 60%; top: 50%; right: auto; bottom: auto; opacity: 0; transform: translate(-50%,-50%) scale(.45); }

.ingredient-world { position: absolute; inset: 0; overflow: hidden; border-radius: 26px; background: radial-gradient(ellipse at 50% 72%,rgba(33,100,77,.28),transparent 58%); }
.terrain { position: absolute; right: 4%; bottom: 8%; left: 4%; height: 28%; background: linear-gradient(165deg,transparent 0 31%,rgba(24,57,47,.68) 32% 52%,rgba(7,25,26,.92) 53%); clip-path: polygon(0 54%,18% 30%,31% 47%,49% 13%,65% 43%,80% 24%,100% 50%,100% 100%,0 100%); }
.scene-player--gather { left: 36%; bottom: 4%; width: 30%; height: 67%; }
.ingredient-node { position: absolute; z-index: 5; width: 158px; display: grid; grid-template-columns: 54px 1fr; grid-template-rows: 1fr 1fr; align-items: center; column-gap: 10px; padding: 9px 10px; border: 1px solid rgba(131,190,164,.25); border-radius: 13px; color: #fcf9f2; background: rgba(6,25,25,.9); text-align: left; box-shadow: 0 14px 28px rgba(0,0,0,.25); transition: transform .5s var(--ease),opacity .4s,border-color .2s; }
.ingredient-node > span { grid-row: 1/3; width: 54px; height: 54px; display: grid; place-items: center; border-radius: 10px; background: rgba(26,65,53,.72); }
.ingredient-node img { width: 46px; height: 46px; object-fit: contain; image-rendering: pixelated; }
.ingredient-node strong { align-self: end; font-size: .65rem; line-height: 1.2; }
.ingredient-node small { align-self: start; margin-top: 3px; color: rgba(252,249,242,.64); font: 500 .52rem/1.3 "IBM Plex Mono",monospace; opacity: 0; transform: translateY(3px); transition: opacity .18s,transform .3s var(--ease); }
.ingredient-node:hover small,.ingredient-node:focus-visible small { opacity: 1; transform: none; }
.ingredient-node:hover,.ingredient-node:focus-visible { z-index: 10; border-color: #dfb968; transform: translateY(-5px); }
.ingredient-node.is-collected { border-color: rgba(113,186,151,.56); box-shadow: 0 14px 28px rgba(0,0,0,.25),0 0 22px rgba(74,154,117,.15); }
.ingredient-node--1 { top: 8%; left: 5%; }
.ingredient-node--2 { top: 10%; right: 3%; }
.ingredient-node--3 { bottom: 10%; left: 3%; }
.ingredient-node--characteristic { right: 4%; bottom: 8%; }
.characteristic i { width: 29px; height: 42px; display: block; background: linear-gradient(145deg,#d6ded5,#5f8d77 40%,#173c34 76%); clip-path: polygon(50% 0,90% 20%,100% 65%,50% 100%,0 65%,10% 20%); }
.collection-line { position: absolute; right: 8%; bottom: 4%; left: 8%; height: 3px; border-radius: 4px; background: rgba(252,249,242,.1); }
.collection-line i { display: block; max-width: 100%; height: 100%; border-radius: inherit; background: linear-gradient(90deg,#3a8d6b,#dfb968); }

.brew-switch { position: absolute; z-index: 20; top: 0; left: 50%; display: flex; padding: 4px; border: 1px solid rgba(223,185,104,.25); border-radius: 999px; background: rgba(4,18,19,.86); transform: translateX(-50%); }
.brew-switch button { min-height: 40px; padding: 0 16px; border: 0; border-radius: 999px; color: rgba(252,249,242,.55); background: transparent; font: 650 .55rem/1 "IBM Plex Mono",monospace; cursor: pointer; }
.brew-switch button[aria-pressed="true"] { color: #102924; background: #e4c278; }
.brew-view { position: absolute; inset: 52px 0 0; display: grid; place-items: center; }
.brew-view--altar :deep(.altar) { height: 100%; }
.brew-view--interface { display: block; }
.scene-player--brew { z-index: 1; left: -2%; bottom: 0; width: 31%; height: 70%; opacity: .7; }
.brew-interface { position: absolute; z-index: 3; top: 50%; right: 2%; width: min(610px,75%); overflow: hidden; border: 1px solid rgba(112,174,148,.3); border-radius: 16px; background: rgba(5,20,21,.94); box-shadow: 0 26px 60px rgba(0,0,0,.4); transform: translateY(-52%); }
.brew-interface__header { min-height: 42px; display: flex; align-items: center; justify-content: space-between; padding: 0 15px; color: rgba(252,249,242,.56); font: 600 .52rem/1 "IBM Plex Mono",monospace; letter-spacing: .1em; text-transform: uppercase; }
.brew-interface__header i { color: #83bca2; font-style: normal; }
.brew-interface__image { position: relative; }
.brew-interface__image img { width: 100%; height: auto; display: block; object-fit: contain; }
.slot-zone { position: absolute; min-width: 44px; min-height: 44px; border: 2px solid transparent; border-radius: 8px; background: transparent; }
.slot-zone:hover,.slot-zone:focus-visible { background: rgba(223,185,104,.1); }
.slot-zone--main { left: 29%; top: 29%; width: 17%; height: 43%; }
.slot-zone--recipe { left: 49%; top: 26%; width: 7%; height: 21%; }
.slot-zone--supp { right: 28%; top: 29%; width: 16%; height: 43%; }
.slot-zone--main:hover,.slot-zone--main:focus-visible { border-color: #d66750; }
.slot-zone--recipe:hover,.slot-zone--recipe:focus-visible { border-color: #dfb968; }
.slot-zone--supp:hover,.slot-zone--supp:focus-visible { border-color: #6499cf; }
.potion-result { position: absolute; z-index: 8; right: 4%; bottom: 1%; display: flex; align-items: center; gap: 9px; padding: 9px 12px; border: 1px solid rgba(131,190,164,.42); border-radius: 12px; color: #fcf9f2; background: rgba(4,25,24,.96); box-shadow: 0 16px 34px rgba(0,0,0,.34); }
.potion-result img { width: 54px; height: 54px; object-fit: contain; image-rendering: pixelated; }
.potion-result span { display: grid; gap: 5px; text-align: left; }
.potion-result small { color: #dfb968; font: 650 .43rem/1 "IBM Plex Mono",monospace; letter-spacing: .1em; }
.potion-result strong { font-size: .68rem; }
.brew-view-enter-active,.brew-view-leave-active { transition: opacity .25s ease,transform .5s var(--ease); }
.brew-view-enter-from { opacity: 0; transform: translateX(22px); }
.brew-view-leave-to { opacity: 0; transform: translateX(-22px); }

.awakening { position: absolute; inset: 0; overflow: hidden; border-radius: 30px; }
.scene-player--awaken { z-index: 5; left: 50%; bottom: 1%; width: 43%; height: 86%; transform: translateX(-50%); }
.awakening-rings { position: absolute; z-index: 1; top: 48%; left: 50%; width: min(510px,69%); aspect-ratio: 1; transform: translate(-50%,-50%); }
.awakening-rings i { position: absolute; inset: 12%; border: 1px solid rgba(198,155,82,.38); border-radius: 50%; transform: rotateX(70deg) rotateZ(calc(var(--local) * 170deg)); }
.awakening-rings i:nth-child(2) { inset: 23%; border-color: rgba(109,190,155,.45); transform: rotateY(64deg) rotateZ(calc(var(--local) * -190deg)); }
.awakening-rings i:nth-child(3) { inset: 33%; border-style: dashed; transform: rotateX(46deg) rotateY(35deg) rotateZ(calc(var(--local) * 230deg)); }
.ascension-beam { position: absolute; z-index: 2; top: -12%; bottom: -10%; left: 50%; width: 18%; background: linear-gradient(90deg,transparent,rgba(252,240,197,.38),transparent); filter: blur(16px); opacity: clamp(0,calc((var(--local) - .48) * 3),.9); transform: translateX(-50%) scaleX(calc(.55 + var(--local))); }
.held-potion { position: absolute; z-index: 8; top: 30%; left: 56%; display: grid; justify-items: center; gap: 5px; padding: 5px; border: 1px solid transparent; border-radius: 12px; color: #fcf9f2; background: transparent; transform: translateY(calc(var(--local) * -10px)); }
.held-potion img { width: 62px; height: 62px; object-fit: contain; image-rendering: pixelated; }
.held-potion span { position: absolute; top: calc(100% + 4px); width: max-content; padding: 6px 8px; border: 1px solid rgba(131,190,164,.3); border-radius: 8px; background: rgba(6,25,25,.94); font: 600 .49rem/1.2 "IBM Plex Mono",monospace; opacity: 0; transform: translateY(4px); transition: opacity .18s,transform .3s var(--ease); }
.held-potion:hover span,.held-potion:focus-visible span { opacity: 1; transform: none; }
.control-test { position: absolute; z-index: 9; top: 21%; right: 2%; width: 190px; display: grid; gap: 9px; padding: 14px; border: 1px solid rgba(205,104,77,.45); border-radius: 14px; color: #fcf9f2; background: rgba(32,18,19,.94); text-align: left; opacity: clamp(0,calc((.72 - var(--local)) * 4),1); transform: translateX(calc(var(--local) * 20px)); }
.control-test small,.powers-reveal small { color: #e8b58a; font: 650 .46rem/1 "IBM Plex Mono",monospace; letter-spacing: .12em; }
.control-test strong { font-size: .69rem; }
.control-pattern { display: flex; gap: 6px; }
.control-pattern i { width: 24px; height: 24px; border: 1px solid rgba(252,249,242,.2); border-radius: 5px; background: rgba(252,249,242,.04); }
.control-pattern i.active { border-color: #dfb968; background: linear-gradient(145deg,#dfb968,#6cb293); box-shadow: 0 0 12px rgba(198,155,82,.25); }
.powers-reveal { position: absolute; z-index: 10; right: 1%; bottom: 12%; width: 225px; display: grid; gap: 8px; padding: 14px; border: 1px solid rgba(223,185,104,.45); border-radius: 14px; color: #fcf9f2; background: rgba(5,24,23,.95); text-align: left; opacity: clamp(0,calc((var(--local) - .55) * 4),1); transform: translateY(calc((1 - var(--local)) * 22px)); }
.powers-reveal > strong { color: #dfb968; font: 700 1.25rem/1 "IBM Plex Sans Condensed",sans-serif; }
.powers-reveal span { display: flex; flex-wrap: wrap; gap: 5px; }
.powers-reveal b { padding: 5px 7px; border: 1px solid rgba(131,190,164,.24); border-radius: 999px; color: rgba(252,249,242,.72); font: 600 .44rem/1 "IBM Plex Mono",monospace; }

.living-loop { position: absolute; inset: 0; }
.acting-core { position: absolute; z-index: 3; top: 43%; left: 50%; width: 38%; height: 68%; transform: translate(-50%,-50%); transition: opacity .5s,transform .8s var(--ease); }
.scene-player--digest { z-index: 4; top: 25%; left: 31%; width: 38%; height: 62%; }
.acting-rings { position: absolute; inset: 17% 5% 2%; }
.acting-rings i { position: absolute; inset: 8%; border: 1px solid rgba(109,190,155,.35); border-radius: 50%; transform: rotateX(68deg) rotateZ(calc(var(--local) * 160deg)); }
.acting-rings i:nth-child(2) { inset: 25%; border-color: rgba(223,185,104,.32); transform: rotateY(65deg) rotateZ(calc(var(--local) * -190deg)); }
.acting-label { position: absolute; right: -1%; bottom: 8%; display: grid; gap: 4px; padding: 8px 10px; border: 1px solid rgba(131,190,164,.28); border-radius: 10px; background: rgba(5,25,24,.92); }
.acting-label small { color: #83bca2; font: 650 .42rem/1 "IBM Plex Mono",monospace; letter-spacing: .1em; }
.acting-label strong { font: 700 1rem/1 "IBM Plex Mono",monospace; }
.activity-orbit { position: absolute; inset: 0; }
.activity-node { position: absolute; z-index: 6; width: 132px; min-height: 58px; display: flex; align-items: center; gap: 8px; padding: 8px 10px; border: 1px solid rgba(131,190,164,.24); border-radius: 12px; color: rgba(252,249,242,.84); background: rgba(5,24,24,.91); font: 600 .51rem/1.25 "IBM Plex Mono",monospace; text-align: left; transition: transform .3s var(--ease),border-color .2s,opacity .5s; }
.activity-node:hover,.activity-node:focus-visible { z-index: 12; border-color: #dfb968; transform: translateY(-4px) scale(1.02); }
.activity-node svg,.activity-node img { width: 25px; height: 25px; flex: 0 0 auto; object-fit: contain; image-rendering: pixelated; fill: none; stroke: #dfb968; stroke-width: 1.5; }
.route-1 { top: 8%; left: 4%; }.route-2 { top: 7%; right: 4%; }.route-3 { top: 37%; left: 0; }.route-4 { top: 36%; right: 0; }.route-5 { left: 5%; bottom: 17%; }.route-6 { right: 5%; bottom: 17%; }
.preparation-track { position: absolute; z-index: 8; right: 8%; bottom: 0; left: 8%; display: grid; gap: 8px; padding: 10px 13px; border: 1px solid rgba(100,153,207,.28); border-radius: 13px; color: #fcf9f2; background: rgba(5,22,24,.95); }
.preparation-track > small { color: #85afce; font: 650 .44rem/1 "IBM Plex Mono",monospace; letter-spacing: .12em; }
.preparation-track > span { display: grid; grid-template-columns: auto 1fr auto 1fr auto 1fr auto; align-items: center; gap: 7px; }
.preparation-track b { display: flex; align-items: center; gap: 5px; font: 600 .48rem/1 "IBM Plex Mono",monospace; white-space: nowrap; }
.preparation-track img { width: 25px; height: 25px; object-fit: contain; image-rendering: pixelated; }
.preparation-track i { height: 1px; background: linear-gradient(90deg,rgba(131,190,164,.2),rgba(223,185,104,.55)); }
.digestion-meter { position: absolute; z-index: 7; right: 12%; bottom: 72px; left: 12%; display: grid; gap: 7px; opacity: clamp(0,calc((.85 - var(--local)) * 4),1); transition: opacity .4s; }
.digestion-meter > span { display: flex; justify-content: space-between; color: rgba(252,249,242,.72); font: 600 .48rem/1 "IBM Plex Mono",monospace; }
.digestion-meter > i { height: 5px; overflow: hidden; border-radius: 99px; background: rgba(252,249,242,.1); }
.digestion-meter > i b { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg,#3a8d6b,#a8d5b9,#dfb968); transition: width .12s linear; }
.sequence-advance { position: absolute; z-index: 14; top: 50%; left: 50%; width: 230px; display: grid; justify-items: center; gap: 9px; padding: 18px; border: 1px solid rgba(223,185,104,.55); border-radius: 16px; color: #fcf9f2; background: rgba(5,22,22,.96); opacity: clamp(0,calc((var(--local) - .78) * 5),1); transform: translate(-50%,-50%) scale(calc(.88 + var(--local) * .12)); box-shadow: 0 0 50px rgba(198,155,82,.2); pointer-events: none; }
.sequence-advance small { color: #dfb968; font: 650 .46rem/1 "IBM Plex Mono",monospace; letter-spacing: .14em; }
.sequence-advance span { display: flex; align-items: center; gap: 14px; }
.sequence-advance strong { font: 700 2rem/1 "IBM Plex Sans Condensed",sans-serif; }
.sequence-advance span i { width: 55px; height: 1px; background: #dfb968; }
.sequence-advance > b { color: rgba(252,249,242,.68); font-size: .64rem; }
.living-loop.is-advancing .acting-core,.living-loop.is-advancing .activity-orbit,.living-loop.is-advancing .preparation-track { opacity: .18; transform: scale(.96); }
.living-loop.is-advancing .sequence-advance { pointer-events: auto; }

.stage-nav { position: absolute; z-index: 45; right: clamp(18px,3.2vw,52px); bottom: 16px; left: clamp(18px,3.2vw,52px); display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); border-top: 1px solid rgba(252,249,242,.12); }
.stage-nav button { min-width: 44px; min-height: 58px; display: grid; grid-template-columns: 10px 22px minmax(0,1fr); align-items: center; gap: 7px; padding: 5px 8px; border: 0; color: rgba(252,249,242,.46); background: transparent; cursor: pointer; text-align: left; }
.stage-nav button > i { width: 6px; height: 6px; border: 1px solid currentColor; border-radius: 50%; }
.stage-nav button.active { color: #fcf9f2; }.stage-nav button.active > i { border-color: #dfb968; background: #dfb968; transform: scale(1.35); }.stage-nav button.complete { color: #9bcbb5; }
.stage-nav span { font: 600 .52rem/1 "IBM Plex Mono",monospace; }.stage-nav strong { font-size: .61rem; }
.journey-line { position: absolute; z-index: 46; right: 0; bottom: 0; left: 0; height: 3px; background: rgba(252,249,242,.07); }.journey-line i { display: block; height: 100%; background: linear-gradient(90deg,#35775f,#dfb968); }
.static-progression { display: none; }

@media (max-width:1120px) {
  .stage-layout { grid-template-columns: minmax(235px,.68fr) minmax(485px,1.55fr); gap: 24px; }
  .stage-copy h3 { font-size: clamp(2.55rem,4.4vw,4.4rem); }
  .stage-nav strong { display: none; }.stage-nav button { grid-template-columns: 10px 1fr; justify-items: center; text-align: center; }
  .ingredient-node { width: 142px; }
}
@media (max-width:820px) {
  .progression { min-height: 675svh; }
  .progression-sticky { min-height: 620px; }
  .chapter-heading { top: 76px; right: 15px; left: 15px; }
  .stage-layout { inset: 138px 13px 70px; grid-template-columns: 1fr; grid-template-rows: auto minmax(310px,1fr); gap: 8px; align-items: start; }
  .stage-copy h3 { margin: 7px 0; font-size: clamp(2.15rem,8.2vw,3.4rem); }
  .stage-copy > p { max-width: 620px; font-size: .74rem; line-height: 1.43; }.fact-line { display: none; }
  .scene-shell { width: 100%; height: 100%; min-height: 300px; }
  .scene-player--formula { left: -4%; width: 35%; }.formula-book { left: 58%; width: min(330px,54%); }.formula-fragment:nth-child(1){left:29%}.formula-fragment:nth-child(2){right:0}
  .ingredient-node { width: 132px; grid-template-columns: 43px 1fr; column-gap: 7px; }.ingredient-node > span{width:43px;height:43px}.ingredient-node img{width:38px;height:38px}.ingredient-node strong{font-size:.56rem}
  .scene-player--brew { display: none; }.brew-interface { right: 3%; left: 3%; width: auto; }.potion-result{right:3%}
  .scene-player--awaken { width: 48%; }.held-potion{left:3%}.control-test{right:1%;width:170px}.powers-reveal{right:1%;width:190px}
  .activity-node { width: 112px; min-height: 51px; padding: 7px; font-size: .45rem; }.activity-node svg,.activity-node img{width:22px;height:22px}.acting-core{width:42%}
  .stage-nav { right: 8px; bottom: 7px; left: 8px; border-top: 0; }.stage-nav button{min-height:48px;grid-template-columns:1fr;gap:2px;padding:3px}
}
@media (max-width:520px) {
  .progression-sticky { min-height: 610px; }
  .chapter-heading h2 { font-size: .95rem; }.chapter-heading p { display: none; }
  .stage-layout { inset: 132px 9px 61px; grid-template-rows: auto minmax(330px,1fr); }
  .stage-copy h3 { font-size: clamp(1.9rem,9.6vw,2.7rem); }
  .scene-player--formula { left:-5%; bottom:0; width:34%; height:47%; opacity:.42; }.formula-book{left:56%;top:59%;width:68%;transform:translate(-50%,-50%);}.formula-book.is-complete{transform:translate(-50%,-50%) scale(1.02)}.formula-fragment{width:126px;padding:7px;font-size:.62rem}.formula-page-glyph{width:26px;height:30px}.formula-fragment:nth-child(1){top:2%;left:0}.formula-fragment:nth-child(2){top:2%;right:0}
  .scene-player--gather{left:29%;width:44%}.ingredient-node{width:120px;min-height:58px;grid-template-columns:38px 1fr;padding:6px}.ingredient-node>span{width:38px;height:38px}.ingredient-node img{width:33px;height:33px}.ingredient-node strong{font-size:.64rem}.ingredient-node small{display:none}.ingredient-node--1{top:2%;left:0}.ingredient-node--2{top:2%;right:0}.ingredient-node--3{bottom:5%;left:0}.ingredient-node--characteristic{right:0;bottom:5%}
  .brew-switch{top:-2px}.brew-switch button{min-height:44px;padding:0 12px;font-size:.62rem}.brew-view{inset:49px 0 0}.brew-view--altar :deep(.altar__controls button:nth-child(4)),.brew-view--altar :deep(.altar__controls button:nth-child(5)){display:none}.brew-view--altar :deep(.altar__hint){display:none}.brew-interface{top:47%;right:0;left:0}.brew-interface__header{min-height:34px;font-size:.58rem}.potion-result{right:0;bottom:0;padding:6px}.potion-result img{width:42px;height:42px}
  .scene-player--awaken{left:50%;width:60%;height:76%}.held-potion{top:35%;left:32%;padding:3px}.held-potion img{width:42px;height:42px}.held-potion span{display:none}.control-test{top:8%;right:0;width:142px;padding:9px}.control-pattern i{width:17px;height:17px}.powers-reveal{right:0;bottom:4%;width:165px;padding:9px}.powers-reveal b{font-size:.39rem}
  .acting-core{top:43%;width:52%;height:59%}.acting-label{display:none}.activity-node{width:104px;min-height:48px;font-size:.58rem}.route-1,.route-3,.route-5{left:0}.route-2,.route-4,.route-6{right:0}.route-1,.route-2{top:1%}.route-3,.route-4{top:28%}.route-5,.route-6{bottom:21%}.preparation-track{right:0;bottom:0;left:0;padding:8px}.preparation-track>small{font-size:.55rem}.preparation-track>span{gap:3px}.preparation-track b{font-size:.5rem}.preparation-track img{width:18px;height:18px}.digestion-meter{right:8%;bottom:61px;left:8%}.digestion-meter>span{font-size:.58rem}.sequence-advance{width:190px;padding:13px}
}
@media (prefers-reduced-motion:reduce), (max-height:560px) {
  .progression { min-height: auto; padding: clamp(82px,11vw,130px) clamp(16px,4vw,58px); background: linear-gradient(145deg,#071416,#102724); }
  .progression-sticky { position: relative; height: auto; min-height: 0; overflow: visible; background: transparent; }
  .brewery-backdrop,.scene-grade,.chapter-aura,.stage-layout,.stage-nav,.journey-line { display: none; }
  .chapter-heading { position: relative; top: auto; left: auto; width: min(760px,100%); margin: 0 auto 44px; }.chapter-heading h2{margin-top:8px;font-size:clamp(2.5rem,8vw,5rem)}
  .static-progression { width: min(920px,100%); display: block; margin: 0 auto; padding: 0; list-style: none; }
  .static-progression li { display: grid; grid-template-columns: 52px minmax(0,1fr); gap: clamp(16px,4vw,40px); padding: clamp(27px,5vw,48px) 0; border-top: 1px solid rgba(252,249,242,.13); }
  .static-progression li > span { color:#dfb968;font:600 .7rem/1 "IBM Plex Mono",monospace }.static-progression small{color:#70a88e;font:600 .58rem/1 "IBM Plex Mono",monospace;letter-spacing:.12em;text-transform:uppercase}.static-progression h3{margin:10px 0 12px;font:600 clamp(2rem,6vw,3.7rem)/.95 "IBM Plex Sans Condensed",sans-serif}.static-progression p{max-width:660px;margin:0;color:rgba(252,249,242,.68);line-height:1.65}.static-progression strong{display:block;margin-top:15px;color:rgba(252,249,242,.72);font:500 .62rem/1.5 "IBM Plex Mono",monospace}
}
@media (prefers-reduced-motion:reduce) {
  .copy-swap-enter-active,.copy-swap-leave-active,.stage-scene-enter-active,.stage-scene-leave-active,.scene-player,.held-potion span { transition: none; }
}
</style>
