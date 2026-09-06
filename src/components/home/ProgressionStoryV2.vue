<template>
  <section
    id="progression"
    ref="sectionRef"
    class="progression-v2"
    :class="[`stage-${activeStage.id}`, { 'is-visible': visible }]"
    :style="{ '--journey': progress.toFixed(4), '--local': localProgress.toFixed(4) }"
    aria-labelledby="progression-title"
  >
    <div class="progression-v2__sticky">
      <div class="progression-v2__backdrop" aria-hidden="true">
        <img :src="breweryScene" alt="" width="1920" height="1017" decoding="async">
      </div>
      <div class="progression-v2__wash" aria-hidden="true" />

      <header class="progression-v2__heading">
        <p>PLAYABLE PROGRESSION</p>
        <h2 id="progression-title">Find it. Brew it. Become it.</h2>
        <span>Sequence 9 · Seer example</span>
      </header>

      <div class="progression-v2__layout">
        <Transition name="progression-copy" mode="out-in">
          <article :key="activeStage.id" class="progression-copy">
            <p class="progression-copy__kicker">{{ activeStage.kicker }}</p>
            <h3>{{ activeStage.title }}</h3>
            <p class="progression-copy__body">{{ activeStage.copy }}</p>
            <div class="progression-copy__fact"><i aria-hidden="true" />{{ activeStage.fact }}</div>
          </article>
        </Transition>

        <div class="progression-v2__stage-wrap">
          <div ref="stageRef" class="progression-v2__stage" :aria-label="`${activeStage.short} progression scene`" @keydown.esc.stop="closeDetail">
            <MinecraftPlayer
              class="progression-player"
              :class="`progression-player--${activeStage.id}`"
              :mode="playerMode"
              :active="visible"
              :progress="localProgress"
            />

            <Transition name="progression-scene" mode="out-in">
              <div :key="activeStage.id" class="progression-scene">
                <template v-if="activeStage.id === 'formula'">
                  <div class="formula-scene">
                    <div class="formula-book-wrap">
                      <div class="formula-book" role="group" aria-label="Recovered written formula">
                        <img class="formula-book__texture" :src="writtenBook" alt="" width="256" height="256" decoding="async">
                        <div class="formula-book__content">
                          <div class="formula-book__topline"><span>Sequence 9</span><b>Page {{ bookPageIndex + 1 }} of 3</b></div>
                          <h4>{{ bookPageTitle }}</h4>
                          <div v-if="bookPage !== 'ritual'" class="formula-lines">
                            <button
                              v-for="line in bookLines"
                              :key="line.id"
                              type="button"
                              class="formula-line hotspot"
                              :class="{ 'is-picked': pickedFormula.includes(line.id) }"
                              :aria-describedby="detailId(line.id)"
                              @mouseenter="showDetail(line.id, $event)"
                              @mouseleave="clearDetail"
                              @focus="showDetail(line.id, $event)"
                              @blur="clearDetail"
                              @click="pickFormula(line.id, $event)"
                            >
                              <img :src="line.asset" alt="" width="16" height="16" decoding="async">
                              <span>{{ line.label }}</span>
                              <small>{{ line.role }}</small>
                            </button>
                          </div>
                          <div v-else class="formula-ritual-copy">
                            <img :src="ritualBook" alt="" width="16" height="16" decoding="async">
                            <strong>Ritual requirements</strong>
                            <span>Collect the written ritual and build the altar before brewing.</span>
                          </div>
                          <div class="formula-book__page-mark" aria-hidden="true" />
                        </div>
                      </div>
                      <div class="formula-book__controls" aria-label="Formula pages">
                        <button type="button" aria-label="Previous formula page" :disabled="bookPageIndex === 0" @click="previousBookPage"><img :src="backBookmark" alt="" width="32" height="32"></button>
                        <span>Flip the formula</span>
                        <button type="button" aria-label="Next formula page" :disabled="bookPageIndex === 2" @click="nextBookPage"><img :src="nextBookmark" alt="" width="32" height="32"></button>
                      </div>
                    </div>
                    <div class="formula-caption"><span>Recovered in-world</span><strong>Complete every page before you brew.</strong></div>
                  </div>
                </template>

                <template v-else-if="activeStage.id === 'ingredients'">
                  <div class="ingredients-scene">
                    <div class="ingredients-book-mini" aria-hidden="true">
                      <img :src="writtenBook" alt="" width="256" height="256">
                      <span>Page 1 · Main ingredients</span>
                    </div>
                    <div class="ingredient-flight-field" aria-label="Ingredients moving from the formula into the cauldron">
                      <button
                        v-for="(line, index) in ingredientLines"
                        :key="line.id"
                        type="button"
                        class="ingredient-flight hotspot"
                        :class="[`ingredient-flight--${index + 1}`, { 'is-collected': ingredientTravel(index) > .86 }]"
                        :style="ingredientFlightStyle(index)"
                        :aria-describedby="detailId(line.id)"
                        @mouseenter="showDetail(line.id, $event)"
                        @mouseleave="clearDetail"
                        @focus="showDetail(line.id, $event)"
                        @blur="clearDetail"
                        @click="toggleDetail(line.id, $event)"
                      >
                        <img :src="line.asset" :alt="line.label" width="16" height="16" decoding="async">
                        <span>{{ line.label }}</span>
                      </button>
                    </div>
                    <div class="cauldron-target" aria-label="Cauldron receiving the ingredients">
                      <div class="cauldron-target__glow" aria-hidden="true" />
                      <img class="cauldron-target__body" :src="cauldronSide" alt="" width="16" height="16" decoding="async">
                      <img class="cauldron-target__top" :src="cauldronTop" alt="" width="16" height="16" decoding="async">
                      <img class="cauldron-target__inner" :src="cauldronInner" alt="" width="16" height="16" decoding="async">
                      <span>Load in order</span>
                    </div>
                    <div class="ingredients-progress" aria-hidden="true"><i :style="{ width: `${Math.min(100, localProgress * 118)}%` }" /></div>
                  </div>
                </template>

                <template v-else-if="activeStage.id === 'brew'">
                  <div class="brew-scene">
                    <div class="brew-switch" role="group" aria-label="Brewing scene view">
                      <button type="button" :aria-pressed="brewView === 'altar'" @click="brewView = 'altar'">Build altar</button>
                      <button type="button" :aria-pressed="brewView === 'slots'" @click="brewView = 'slots'">Load formula</button>
                    </div>
                    <Transition name="progression-scene" mode="out-in">
                      <div v-if="brewView === 'altar'" key="altar" class="brew-altar-view">
                        <RitualAltarScene
                          :progress="Math.min(1, localProgress * 1.65)"
                          @inspect="payload => showDetailByAnchor(payload.id, payload.anchor)"
                          @toggle-inspect="payload => toggleDetailByAnchor(payload.id, payload.anchor)"
                          @clear="clearDetail"
                        />
                        <span class="brew-altar-label">Normal altar · 3 × 3 stone-brick base</span>
                      </div>
                      <div v-else key="slots" class="brew-slots-view">
                        <div class="brew-slots-ui" aria-label="Ritual Altar brewing interface">
                          <img class="brew-slots-ui__texture" :src="generic54" alt="" width="256" height="256" decoding="async">
                          <div class="brew-slots-ui__slots">
                            <button class="brew-slot brew-slot--recipe hotspot" type="button" :aria-describedby="detailId('brew-recipe-slot')" @mouseenter="showDetail('brew-recipe-slot', $event)" @mouseleave="clearDetail" @focus="showDetail('brew-recipe-slot', $event)" @blur="clearDetail" @click="toggleDetail('brew-recipe-slot', $event)"><img :src="foolRecipe" alt="Written Seer formula" width="16" height="16"></button>
                            <button class="brew-slot brew-slot--main hotspot" type="button" :aria-describedby="detailId('brew-main-slots')" @mouseenter="showDetail('brew-main-slots', $event)" @mouseleave="clearDetail" @focus="showDetail('brew-main-slots', $event)" @blur="clearDetail" @click="toggleDetail('brew-main-slots', $event)"><img :src="lavosSquidBlood" alt="Main ingredient" width="16" height="16"></button>
                            <button class="brew-slot brew-slot--supp hotspot" type="button" :aria-describedby="detailId('brew-supp-slots')" @mouseenter="showDetail('brew-supp-slots', $event)" @mouseleave="clearDetail" @focus="showDetail('brew-supp-slots', $event)" @blur="clearDetail" @click="toggleDetail('brew-supp-slots', $event)"><img :src="goldMintLeaves" alt="Supplementary ingredient" width="16" height="16"></button>
                          </div>
                        </div>
                        <div class="brew-result" :class="{ 'is-ready': localProgress > .65 }"><img :src="sequencePotion" alt="" width="16" height="16"><span><small>BREW RESULT</small><strong>Sequence 9 · Seer</strong></span></div>
                      </div>
                    </Transition>
                  </div>
                </template>

                <template v-else-if="activeStage.id === 'awaken'">
                  <div class="awakening-scene">
                    <img class="awakening-circle" :src="magicCircle" alt="" width="256" height="256" decoding="async">
                    <div class="awakening-pulse" aria-hidden="true" />
                    <button class="awakening-potion hotspot" type="button" :aria-describedby="detailId('drink-potion')" @mouseenter="showDetail('drink-potion', $event)" @mouseleave="clearDetail" @focus="showDetail('drink-potion', $event)" @blur="clearDetail" @click="toggleDetail('drink-potion', $event)"><img :src="sequencePotion" alt="Sequence 9 Seer potion" width="16" height="16"><span>Drink to awaken</span></button>
                    <button class="control-challenge hotspot" type="button" :aria-describedby="detailId('control-challenge')" @mouseenter="showDetail('control-challenge', $event)" @mouseleave="clearDetail" @focus="showDetail('control-challenge', $event)" @blur="clearDetail" @click="advanceControlTest"><small>CONTROL CHECK</small><span><i v-for="index in 5" :key="index" :class="{ active: index <= controlScore }" /></span><strong>{{ controlScore >= 5 ? 'Stable' : 'Repeat the pattern' }}</strong></button>
                    <div class="awakening-powers" :class="{ 'is-revealed': localProgress > .56 }"><small>PATHWAY AWAKENED</small><strong>SEER</strong><span><b>Divination</b><b>Spiritualism</b><b>Paper Dagger</b></span></div>
                  </div>
                </template>

                <template v-else>
                  <div class="digest-scene">
                    <div class="digest-ring" aria-hidden="true"><i /><i /></div>
                    <div class="digest-core"><small>ACTING METHOD</small><strong>{{ digestionValue }}%</strong><span>Live the Sequence in play</span></div>
                    <button
                      v-for="(route, index) in digestRoutes"
                      :key="route.id"
                      type="button"
                      class="digest-route hotspot"
                      :class="`digest-route--${index + 1}`"
                      :aria-describedby="detailId(route.id)"
                      @mouseenter="showDetail(route.id, $event)"
                      @mouseleave="clearDetail"
                      @focus="showDetail(route.id, $event)"
                      @blur="clearDetail"
                      @click="toggleDetail(route.id, $event)"
                    >
                      <img v-if="route.asset" :src="route.asset" alt="" width="16" height="16"><svg v-else aria-hidden="true" viewBox="0 0 24 24"><path :d="route.icon" /></svg>
                      <span>{{ route.label }}</span>
                    </button>
                    <button class="digest-next hotspot" type="button" :aria-describedby="detailId('prepare-next')" @mouseenter="showDetail('prepare-next', $event)" @mouseleave="clearDetail" @focus="showDetail('prepare-next', $event)" @blur="clearDetail" @click="toggleDetail('prepare-next', $event)"><small>PREPARE THE NEXT POTION</small><span><b>Formula</b><i /><b>Ingredients</b><i /><b>Ritual</b><i /><b>Sequence 8</b></span></button>
                    <div class="digest-meter" aria-label="Example digestion progress"><span>Current potion digestion <b>{{ digestionValue }}%</b></span><i><b :style="{ width: `${digestionValue}%` }" /></i></div>
                  </div>
                </template>
              </div>
            </Transition>

            <SceneInspectorPopover :id="activeDetail ? detailId(activeDetail.id) : undefined" :open="Boolean(activeDetail && inspectorAnchor)" :anchor="inspectorAnchor" :boundary="stageRef" :title="activeDetail?.label" :description="activeDetail?.detail" />
          </div>
        </div>
      </div>

      <nav class="progression-nav" aria-label="Progression chapters">
        <button v-for="(stage, index) in progressionStages" :key="stage.id" type="button" :class="{ active: activeIndex === index, complete: activeIndex > index }" :aria-current="activeIndex === index ? 'step' : undefined" @click="goToStage(index)"><i aria-hidden="true" /><span>{{ String(index + 1).padStart(2, '0') }}</span><strong>{{ stage.short }}</strong></button>
      </nav>
      <div class="progression-line" aria-hidden="true"><i :style="{ width: `${progress * 100}%` }" /></div>
    </div>

    <ol class="progression-static">
      <li v-for="(stage, index) in progressionStages" :key="stage.id"><span>{{ String(index + 1).padStart(2, '0') }}</span><div><small>{{ stage.kicker }}</small><h3>{{ stage.title }}</h3><p>{{ stage.copy }}</p><strong>{{ stage.fact }}</strong></div></li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { CSSProperties } from 'vue';
import { useReducedMotion } from '@/composables/useReducedMotion';
import { progressionStages } from '@/data/progression';
import RitualAltarScene from './RitualAltarScene.vue';
import MinecraftPlayer, { type MinecraftPlayerMode } from './MinecraftPlayer.vue';
import SceneInspectorPopover from './SceneInspectorPopover.vue';
import breweryScene from '@/assets/images/home/progression/brewery-scene.webp';
import writtenBook from '@/assets/images/home/progression/source/written-book.png';
import generic54 from '@/assets/images/home/progression/source/generic-54.png';
import magicCircle from '@/assets/images/home/progression/source/magiccircle.png';
import backBookmark from '@/assets/images/home/progression/source/back-bookmark.png';
import nextBookmark from '@/assets/images/home/progression/source/next-bookmark.png';
import cauldronTop from '@/assets/images/home/progression/source/cauldron-top.png';
import cauldronInner from '@/assets/images/home/progression/source/cauldron-inner.png';
import cauldronSide from '@/assets/images/home/progression/source/cauldron-side.png';
import foolRecipe from '@/assets/images/home/progression/recipes/fool.png';
import ritualBook from '@/assets/images/home/progression/real/ritual-book-tier2.png';
import lavosSquidBlood from '@/assets/images/home/progression/real/lavos-squid-blood.png';
import stellarAquaCrystal from '@/assets/images/home/progression/real/stellar-aqua-crystal.png';
import goldMintLeaves from '@/assets/images/home/progression/real/gold-mint-leaves.png';
import actingBottle from '@/assets/images/home/progression/real/acting-bottle-medium.png';
import sequencePotion from '@/assets/images/home/progression/real/sequence-potion.png';

const sectionRef = ref<HTMLElement | null>(null);
const stageRef = ref<HTMLElement | null>(null);
const progress = ref(0);
const activeIndex = ref(0);
const localProgress = ref(0);
const visible = ref(false);
const reducedMotion = useReducedMotion();
const bookPageIndex = ref(0);
const brewView = ref<'altar' | 'slots'>('altar');
const pickedFormula = ref<string[]>([]);
const controlScore = ref(2);
const activeHotspotId = ref<string | null>(null);
const pinnedHotspotId = ref<string | null>(null);
const inspectorAnchor = ref<HTMLElement | null>(null);
const pinnedAnchor = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;
let frame = 0;

const activeStage = computed(() => progressionStages[activeIndex.value]);
const activeDetail = computed(() => activeStage.value.hotspots.find((hotspot) => hotspot.id === activeHotspotId.value) ?? null);
const bookPage = computed<'main' | 'supplement' | 'ritual'>(() => ['main', 'supplement', 'ritual'][bookPageIndex.value] as 'main' | 'supplement' | 'ritual');
const bookPageTitle = computed(() => bookPage.value === 'main' ? 'Main ingredients' : bookPage.value === 'supplement' ? 'Supplementary ingredients' : 'Ritual');
const digestionValue = computed(() => Math.min(100, Math.round(18 + localProgress.value * 82)));
const playerMode = computed<MinecraftPlayerMode>(() => {
  if (activeStage.value.id === 'formula') return 'inspect';
  if (activeStage.value.id === 'ingredients') return 'gather';
  if (activeStage.value.id === 'brew') return brewView.value === 'slots' ? 'brew' : 'idle';
  if (activeStage.value.id === 'awaken') return localProgress.value > .54 ? 'advance' : 'drink';
  return localProgress.value > .82 ? 'advance' : 'cast';
});

const ingredientLines = [
  { id: 'lavos-squid-blood', label: 'Blood of the Lavos Squid', role: 'Main ingredient', asset: lavosSquidBlood },
  { id: 'stellar-aqua-crystal', label: 'Stellar Aqua Crystal', role: 'Main ingredient', asset: stellarAquaCrystal },
  { id: 'gold-mint-leaves', label: 'Gold Mint Leaves', role: 'Supplementary ingredient', asset: goldMintLeaves },
];
const bookLines = computed(() => bookPage.value === 'main' ? ingredientLines.slice(0, 2) : ingredientLines.slice(2));
const digestRoutes = [
  { id: 'act-sequence', label: 'Act the Sequence', icon: 'M12 3l2.7 5.5L21 9.4l-4.5 4.4 1.1 6.2-5.6-2.9L6.4 20l1.1-6.2L3 9.4l6.3-.9L12 3z' },
  { id: 'passive-play', label: 'Play naturally', icon: 'M12 3a9 9 0 109 9h-2a7 7 0 11-7-7V3zm1 4v6l4 2' },
  { id: 'take-bounty', label: 'Bounties', icon: 'M7 3h10v3h3v15H4V6h3V3zm2 3h6V5H9v1zm-1 5h8M8 15h5' },
  { id: 'dungeons', label: 'Dungeons', icon: 'M4 21V7l4-4 4 4 4-4 4 4v14h-5v-6H9v6H4zm4-9h2m4 0h2' },
  { id: 'incursions', label: 'Cosmos Incursions', icon: 'M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z' },
  { id: 'acting-bottle', label: 'Acting Bottles', icon: '', asset: actingBottle },
];

function detailId(id: string) { return `progression-v2-detail-${activeStage.value.id}-${id}`; }
function eventAnchor(event?: Event) { return event?.currentTarget instanceof HTMLElement ? event.currentTarget : null; }
function showDetail(id: string, event?: Event) { activeHotspotId.value = id; inspectorAnchor.value = eventAnchor(event); }
function showDetailByAnchor(id: string, anchor: HTMLElement) { activeHotspotId.value = id; inspectorAnchor.value = anchor; }
function clearDetail() { activeHotspotId.value = pinnedHotspotId.value; inspectorAnchor.value = pinnedAnchor.value; }
function closeDetail() { activeHotspotId.value = null; pinnedHotspotId.value = null; inspectorAnchor.value = null; pinnedAnchor.value = null; }
function toggleDetail(id: string, event?: Event) { const anchor = eventAnchor(event); const closing = pinnedHotspotId.value === id; pinnedHotspotId.value = closing ? null : id; pinnedAnchor.value = closing ? null : anchor; activeHotspotId.value = closing ? null : id; inspectorAnchor.value = closing ? null : anchor; }
function toggleDetailByAnchor(id: string, anchor: HTMLElement) { toggleDetail(id, { currentTarget: anchor } as unknown as Event); }
function pickFormula(id: string, event: Event) { pickedFormula.value = pickedFormula.value.includes(id) ? pickedFormula.value.filter((value) => value !== id) : [...pickedFormula.value, id]; toggleDetail(id, event); }
function nextBookPage() { bookPageIndex.value = Math.min(2, bookPageIndex.value + 1); closeDetail(); }
function previousBookPage() { bookPageIndex.value = Math.max(0, bookPageIndex.value - 1); closeDetail(); }
function advanceControlTest(event: Event) { controlScore.value = controlScore.value >= 5 ? 1 : controlScore.value + 1; toggleDetail('control-challenge', event); }
function ingredientTravel(index: number) { return Math.min(1, Math.max(0, (localProgress.value - .2 - index * .13) / .58)); }
function ingredientFlightStyle(index: number): CSSProperties { return { '--flight': ingredientTravel(index).toFixed(4) } as CSSProperties; }

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
    if (nextIndex !== activeIndex.value) { closeDetail(); brewView.value = 'altar'; }
    progress.value = next;
    activeIndex.value = nextIndex;
    localProgress.value = scaled - nextIndex;
  });
}
function goToStage(index: number) {
  if (!sectionRef.value) return;
  const range = sectionRef.value.offsetHeight - innerHeight;
  const top = sectionRef.value.getBoundingClientRect().top + scrollY;
  scrollTo({ top: top + range * ((index + .12) / progressionStages.length), behavior: reducedMotion.value ? 'auto' : 'smooth' });
}
watch(localProgress, (value) => { if (activeStage.value.id === 'awaken') controlScore.value = Math.max(controlScore.value, Math.min(5, 1 + Math.floor(value * 6))); });

onMounted(() => {
  observer = new IntersectionObserver(([entry]) => { visible.value = entry.isIntersecting; if (visible.value) update(); }, { rootMargin: '120px 0px' });
  if (sectionRef.value) observer.observe(sectionRef.value);
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update, { passive: true });
});
onUnmounted(() => { observer?.disconnect(); removeEventListener('scroll', update); removeEventListener('resize', update); if (frame) cancelAnimationFrame(frame); });
</script>

<style scoped>
.progression-v2 { --ease: cubic-bezier(.22,1,.36,1); --paper: #f5ecd8; --ink: #392b25; position: relative; min-height: 560svh; color: #fcf9f2; background: #071719; isolation: isolate; }
.progression-v2__sticky { position: sticky; top: 0; height: 100svh; min-height: 650px; overflow: hidden; background: #0b1a1b; }
.progression-v2__backdrop,.progression-v2__wash { position: absolute; inset: 0; }
.progression-v2__backdrop { transform: scale(calc(1.02 + var(--journey) * .06)) translate3d(0,calc(var(--journey) * -1.5%),0); transform-origin: 50% 56%; }
.progression-v2__backdrop img { width: 100%; height: 100%; display: block; object-fit: cover; object-position: center 56%; filter: saturate(.65) contrast(1.08) brightness(.32); }
.progression-v2__wash { z-index: 1; background: linear-gradient(90deg,rgba(4,13,15,.96) 0%,rgba(4,15,16,.72) 36%,rgba(4,15,16,.36) 70%,rgba(3,10,12,.9) 100%),linear-gradient(180deg,rgba(2,8,10,.72),transparent 36%,rgba(2,8,10,.94)); }
.progression-v2__heading { position: absolute; z-index: 8; top: clamp(70px,8vh,92px); left: clamp(18px,4vw,68px); display: grid; gap: 7px; }
.progression-v2__heading p,.progression-copy__kicker { margin: 0; color: #dfb968; font: 700 .62rem/1 "IBM Plex Mono",monospace; letter-spacing: .16em; text-transform: uppercase; }
.progression-v2__heading h2 { margin: 0; font: 650 clamp(1.15rem,1.7vw,1.55rem)/1 "IBM Plex Sans Condensed",sans-serif; letter-spacing: -.02em; }
.progression-v2__heading span { color: rgba(252,249,242,.55); font: 500 .58rem/1 "IBM Plex Mono",monospace; }
.progression-v2__layout { position: absolute; z-index: 4; inset: clamp(145px,17vh,174px) clamp(18px,4vw,68px) clamp(86px,12vh,116px); display: grid; grid-template-columns: minmax(250px,.65fr) minmax(580px,1.5fr); align-items: center; gap: clamp(30px,5vw,88px); }
.progression-copy { min-width: 0; align-self: center; }
.progression-copy h3 { max-width: 470px; margin: 17px 0 16px; color: #fcf9f2; font: 650 clamp(2.7rem,5vw,5.4rem)/.88 "IBM Plex Sans Condensed",sans-serif; letter-spacing: -.055em; text-wrap: balance; }
.progression-copy__body { max-width: 450px; margin: 0; color: rgba(252,249,242,.72); font-size: clamp(.82rem,1vw,.98rem); line-height: 1.63; }
.progression-copy__fact { max-width: 450px; display: flex; gap: 10px; margin-top: 23px; padding-top: 17px; border-top: 1px solid rgba(252,249,242,.14); color: rgba(252,249,242,.52); font: 500 .59rem/1.55 "IBM Plex Mono",monospace; }
.progression-copy__fact i { flex: 0 0 auto; width: 6px; height: 6px; margin-top: 4px; border-radius: 50%; background: #dfb968; }
.progression-v2__stage-wrap { min-width: 0; height: min(70vh,700px); display: grid; place-items: center; }
.progression-v2__stage { position: relative; width: 100%; height: 100%; min-height: 440px; outline: none; }
.progression-scene { position: absolute; inset: 0; }
.progression-player { position: absolute; z-index: 12; margin: 0; pointer-events: none; }
.progression-player--formula { left: 0; bottom: 0; width: 26%; height: 58%; opacity: .72; }
.progression-player--ingredients { left: 1%; bottom: 0; z-index: 2; width: 21%; height: 54%; opacity: .9; }
.progression-player--brew { left: -3%; bottom: 0; width: 25%; height: 58%; opacity: .72; }
.progression-player--awaken { left: 43%; bottom: -1%; width: 35%; height: 84%; transform: translateX(-50%); }
.progression-player--digest { left: 42%; bottom: 0; width: 30%; height: 74%; transform: translateX(-50%); }
.hotspot { min-width: 44px; min-height: 44px; border: 0; color: inherit; cursor: pointer; }
.hotspot:focus-visible { outline: 3px solid #f0d38c; outline-offset: 3px; }
.formula-scene { position: absolute; inset: 0; display: grid; place-items: center; }
.formula-book-wrap { position: relative; z-index: 7; width: min(390px,53%); display: grid; justify-items: center; gap: 12px; transform: translate3d(10%,0,0) rotate(-1deg); }
.formula-book { position: relative; width: 100%; aspect-ratio: 1; filter: drop-shadow(0 30px 28px rgba(0,0,0,.48)); }
.formula-book__texture { position: absolute; inset: 0; width: 100%; height: 100%; display: block; object-fit: contain; image-rendering: pixelated; }
.formula-book__content { position: absolute; inset: 13% 14% 11%; color: var(--ink); font-family: "IBM Plex Mono",monospace; }
.formula-book__topline { display: flex; justify-content: space-between; gap: 8px; font-size: clamp(.48rem,.7vw,.64rem); font-weight: 700; text-transform: uppercase; }
.formula-book__topline b { color: #8f5d36; font-weight: 700; }
.formula-book h4 { margin: 12% 0 7%; color: #8a1e18; font: 700 clamp(.82rem,1.25vw,1.05rem)/1.05 "IBM Plex Sans Condensed",sans-serif; text-transform: uppercase; }
.formula-lines { display: grid; gap: 4px; }
.formula-line { position: relative; display: grid; grid-template-columns: 26px minmax(0,1fr); grid-template-rows: auto auto; align-items: center; column-gap: 7px; width: 100%; padding: 5px 6px; border: 1px solid transparent; color: var(--ink); background: transparent; text-align: left; font-family: inherit; }
.formula-line img { grid-row: 1/3; width: 22px; height: 22px; object-fit: contain; image-rendering: pixelated; }
.formula-line span { min-width: 0; overflow: hidden; color: #bd6f08; font-size: clamp(.54rem,.75vw,.7rem); font-weight: 700; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
.formula-line small { color: #7b6254; font-size: clamp(.43rem,.62vw,.54rem); line-height: 1.2; }
.formula-line:hover,.formula-line:focus-visible,.formula-line.is-picked { border-color: rgba(123,65,30,.45); border-radius: 5px; background: rgba(255,255,255,.34); }
.formula-line.is-picked::after { position: absolute; right: 5px; width: 7px; height: 7px; border-radius: 50%; background: #21644d; content: ''; }
.formula-ritual-copy { display: grid; gap: 7px; margin-top: 18%; color: #4f362c; font-size: clamp(.55rem,.8vw,.72rem); line-height: 1.45; }
.formula-ritual-copy img { width: 32px; height: 32px; object-fit: contain; image-rendering: pixelated; }
.formula-ritual-copy strong { color: #17803c; font-size: clamp(.62rem,.9vw,.82rem); text-decoration: underline; }
.formula-book__page-mark { position: absolute; right: 2%; bottom: 2%; width: 25px; height: 15px; border-bottom: 2px solid rgba(123,65,30,.2); border-right: 2px solid rgba(123,65,30,.2); transform: rotate(-12deg); }
.formula-book__controls { display: flex; align-items: center; justify-content: center; gap: 9px; color: rgba(252,249,242,.66); font: 600 .56rem/1 "IBM Plex Mono",monospace; }
.formula-book__controls button { width: 44px; height: 44px; display: grid; place-items: center; padding: 0; border: 1px solid rgba(223,185,104,.26); border-radius: 10px; background: rgba(6,24,24,.9); cursor: pointer; }
.formula-book__controls button:disabled { opacity: .34; cursor: not-allowed; }
.formula-book__controls img { width: 32px; height: 32px; object-fit: contain; image-rendering: pixelated; }
.formula-caption { position: absolute; right: 2%; bottom: 8%; z-index: 5; display: grid; gap: 7px; width: 180px; padding: 13px 14px; border-left: 2px solid #dfb968; color: rgba(252,249,242,.72); background: rgba(5,22,23,.72); backdrop-filter: blur(10px); }
.formula-caption span { color: #dfb968; font: 650 .46rem/1 "IBM Plex Mono",monospace; letter-spacing: .12em; text-transform: uppercase; }
.formula-caption strong { font-size: .66rem; line-height: 1.35; }
.ingredients-scene { position: absolute; inset: 0; overflow: hidden; }
.ingredients-book-mini { position: absolute; top: 8%; left: 4%; width: 190px; display: grid; gap: 5px; color: rgba(252,249,242,.7); font: 600 .52rem/1.2 "IBM Plex Mono",monospace; }
.ingredients-book-mini img { width: 100%; height: auto; display: block; object-fit: contain; image-rendering: pixelated; opacity: .9; }
.ingredient-flight-field { position: absolute; inset: 0; }
.ingredient-flight { --flight: 0; --target-x: 360px; --target-y: 0px; position: absolute; z-index: 8; display: grid; justify-items: center; gap: 5px; padding: 6px; border: 1px solid rgba(131,190,164,.22); border-radius: 10px; background: rgba(5,23,24,.9); transform: translate3d(calc((1 - var(--flight)) * -12px + var(--flight) * var(--target-x)),calc(var(--flight) * var(--target-y)),0) scale(calc(.95 + var(--flight) * .14)); transition: border-color .2s,box-shadow .25s,opacity .2s; }
.ingredient-flight img { width: 40px; height: 40px; object-fit: contain; image-rendering: pixelated; }
.ingredient-flight span { max-width: 125px; color: rgba(252,249,242,.78); font: 600 .48rem/1.25 "IBM Plex Mono",monospace; text-align: center; opacity: 0; transform: translateY(4px); transition: opacity .2s ease,transform .2s var(--ease); }
.ingredient-flight:hover,.ingredient-flight:focus-visible,.ingredient-flight.is-collected { border-color: #dfb968; box-shadow: 0 0 0 4px rgba(223,185,104,.1),0 12px 24px rgba(0,0,0,.3); }
.ingredient-flight:hover span,.ingredient-flight:focus-visible span { opacity: 1; transform: none; }
.ingredient-flight.is-collected { opacity: .16; pointer-events: none; transform: translate3d(calc((1 - var(--flight)) * -12px + var(--flight) * var(--target-x)),calc(var(--flight) * var(--target-y)),0) scale(.68); }
.ingredient-flight--1 { --target-y: 110px; top: 26%; left: 28%; }.ingredient-flight--2 { --target-y: 0px; top: 43%; left: 28%; }.ingredient-flight--3 { --target-y: -110px; top: 60%; left: 28%; }
.cauldron-target { position: absolute; top: 30%; right: 4%; z-index: 6; width: 185px; height: 170px; display: grid; place-items: center; }
.cauldron-target__glow { position: absolute; inset: 13%; border-radius: 50%; background: radial-gradient(circle,rgba(103,204,158,.4),transparent 66%); filter: blur(12px); }
.cauldron-target__body,.cauldron-target__top,.cauldron-target__inner { position: absolute; object-fit: cover; image-rendering: pixelated; }
.cauldron-target__body { top: 24%; width: 148px; height: 106px; border: 3px solid rgba(4,20,22,.88); border-radius: 12% 12% 34% 34%; clip-path: polygon(5% 0,95% 0,100% 18%,91% 87%,76% 100%,24% 100%,9% 87%,0 18%); filter: brightness(.68) saturate(.72); }
.cauldron-target__top { top: 13%; width: 148px; height: 56px; border: 3px solid rgba(4,20,22,.9); border-radius: 50%; filter: brightness(.62) saturate(.7); }
.cauldron-target__inner { top: 21%; width: 116px; height: 37px; border-radius: 50%; opacity: .82; mix-blend-mode: screen; }
.cauldron-target span { position: absolute; bottom: -2px; color: rgba(252,249,242,.62); font: 650 .52rem/1 "IBM Plex Mono",monospace; letter-spacing: .1em; text-transform: uppercase; }
.ingredients-progress { position: absolute; right: 6%; bottom: 8%; left: 6%; height: 4px; overflow: hidden; border-radius: 99px; background: rgba(252,249,242,.1); }
.ingredients-progress i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg,#3a8d6b,#dfb968); transition: width .12s linear; }
.brew-scene { position: absolute; inset: 0; display: grid; place-items: center; }
.brew-switch { position: absolute; z-index: 20; top: 0; left: 50%; display: flex; gap: 3px; padding: 4px; border: 1px solid rgba(223,185,104,.3); border-radius: 999px; background: rgba(4,18,19,.9); transform: translateX(-50%); }
.brew-switch button { min-height: 42px; padding: 0 14px; border: 0; border-radius: 999px; color: rgba(252,249,242,.62); background: transparent; cursor: pointer; font: 700 .54rem/1 "IBM Plex Mono",monospace; }
.brew-switch button[aria-pressed="true"] { color: #102924; background: #dfb968; }
.brew-altar-view { width: min(630px,100%); display: grid; justify-items: center; gap: 3px; padding-top: 42px; }
.brew-altar-label { color: rgba(252,249,242,.58); font: 600 .52rem/1.3 "IBM Plex Mono",monospace; }
.brew-slots-view { position: relative; width: min(530px,100%); height: 100%; display: grid; place-items: center; padding-top: 38px; }
.brew-slots-ui { position: relative; width: min(390px,70%); aspect-ratio: 1; filter: drop-shadow(0 28px 28px rgba(0,0,0,.5)); }
.brew-slots-ui__texture { position: absolute; inset: 0; width: 100%; height: 100%; display: block; object-fit: contain; image-rendering: pixelated; }
.brew-slots-ui__slots { position: absolute; inset: 0; }
.brew-slot { position: absolute; width: 48px; height: 48px; display: grid; place-items: center; padding: 0; border: 2px solid transparent; border-radius: 5px; background: transparent; }
.brew-slot img { width: 30px; height: 30px; object-fit: contain; image-rendering: pixelated; }
.brew-slot:hover,.brew-slot:focus-visible { border-color: #dfb968; background: rgba(223,185,104,.18); }
.brew-slot--recipe { top: 23%; left: 44%; }.brew-slot--main { top: 36%; left: 24%; }.brew-slot--supp { top: 36%; right: 24%; }
.brew-result { position: absolute; right: 0; bottom: 7%; display: flex; align-items: center; gap: 8px; padding: 9px 11px; border: 1px solid rgba(131,190,164,.3); border-radius: 11px; color: rgba(252,249,242,.72); background: rgba(5,23,24,.92); opacity: .38; transform: translateY(10px); transition: opacity .45s var(--ease),transform .45s var(--ease); }
.brew-result.is-ready { opacity: 1; transform: none; }.brew-result img { width: 44px; height: 44px; object-fit: contain; image-rendering: pixelated; }.brew-result span { display: grid; gap: 4px; }.brew-result small { color: #dfb968; font: 650 .43rem/1 "IBM Plex Mono",monospace; }.brew-result strong { font-size: .65rem; }
.awakening-scene { position: absolute; inset: 0; display: grid; place-items: center; overflow: hidden; }
.awakening-circle { position: absolute; width: min(420px,62%); height: auto; object-fit: contain; opacity: clamp(.22,calc(.2 + var(--local) * .78),1); filter: sepia(.18) saturate(.85) drop-shadow(0 0 28px rgba(198,155,82,.22)); transform: rotate(calc(var(--local) * 90deg)); transition: opacity .45s var(--ease),transform .8s var(--ease); }
.awakening-pulse { position: absolute; width: 160px; height: 160px; border-radius: 50%; background: radial-gradient(circle,rgba(198,155,82,.42),rgba(57,145,111,.12) 42%,transparent 70%); filter: blur(8px); opacity: clamp(0,calc((var(--local) - .18) * 2),.9); }
.awakening-potion { position: absolute; z-index: 14; top: 27%; left: 56%; display: grid; justify-items: center; gap: 5px; padding: 5px; border: 1px solid transparent; border-radius: 12px; background: rgba(5,23,24,.56); transform: translate3d(0,calc(var(--local) * -13px),0); }
.awakening-potion img { width: 72px; height: 72px; object-fit: contain; image-rendering: pixelated; }.awakening-potion span { color: rgba(252,249,242,.66); font: 600 .48rem/1.2 "IBM Plex Mono",monospace; }
.control-challenge { position: absolute; z-index: 16; top: 14%; right: 3%; width: 190px; display: grid; gap: 8px; padding: 13px; border: 1px solid rgba(205,104,77,.45); border-radius: 13px; color: #fcf9f2; background: rgba(32,18,19,.92); text-align: left; }
.control-challenge small,.awakening-powers small { color: #e8b58a; font: 650 .45rem/1 "IBM Plex Mono",monospace; letter-spacing: .12em; }.control-challenge > span { display: flex; gap: 5px; }.control-challenge > span i { width: 23px; height: 23px; border: 1px solid rgba(252,249,242,.2); border-radius: 4px; }.control-challenge > span i.active { border-color: #dfb968; background: linear-gradient(145deg,#dfb968,#6cb293); }.control-challenge strong { font-size: .66rem; }
.awakening-powers { position: absolute; z-index: 16; right: 2%; bottom: 11%; width: 220px; display: grid; gap: 7px; padding: 13px; border: 1px solid rgba(223,185,104,.4); border-radius: 13px; color: #fcf9f2; background: rgba(5,24,23,.94); opacity: 0; transform: translateY(16px); transition: opacity .5s var(--ease),transform .6s var(--ease); }.awakening-powers.is-revealed { opacity: 1; transform: none; }.awakening-powers > strong { color: #dfb968; font: 700 1.25rem/1 "IBM Plex Sans Condensed",sans-serif; }.awakening-powers span { display: flex; flex-wrap: wrap; gap: 5px; }.awakening-powers b { padding: 5px 7px; border: 1px solid rgba(131,190,164,.24); border-radius: 999px; font: 600 .43rem/1 "IBM Plex Mono",monospace; }
.digest-scene { position: absolute; inset: 0; }.digest-ring { position: absolute; top: 50%; left: 49%; width: min(420px,62%); aspect-ratio: 1; transform: translate(-50%,-50%); }.digest-ring i { position: absolute; inset: 9%; border: 1px solid rgba(109,190,155,.44); border-radius: 50%; transform: rotateX(68deg) rotateZ(calc(var(--local) * 140deg)); }.digest-ring i:nth-child(2) { inset: 24%; border-color: rgba(223,185,104,.4); transform: rotateY(64deg) rotateZ(calc(var(--local) * -180deg)); }
.digest-core { position: absolute; top: 50%; left: 49%; z-index: 8; display: grid; justify-items: center; gap: 6px; padding: 22px; border: 1px solid rgba(223,185,104,.38); border-radius: 50%; color: #fcf9f2; background: rgba(5,25,24,.82); transform: translate(-50%,-50%); }.digest-core small { color: #83bca2; font: 650 .45rem/1 "IBM Plex Mono",monospace; letter-spacing: .12em; }.digest-core strong { font: 700 2.1rem/1 "IBM Plex Sans Condensed",sans-serif; }.digest-core span { color: rgba(252,249,242,.55); font-size: .54rem; }
.digest-route { position: absolute; z-index: 10; width: 142px; min-height: 55px; display: flex; align-items: center; gap: 8px; padding: 8px 10px; border: 1px solid rgba(131,190,164,.25); border-radius: 11px; color: rgba(252,249,242,.82); background: rgba(5,24,24,.9); font: 600 .5rem/1.25 "IBM Plex Mono",monospace; text-align: left; transition: border-color .2s,transform .35s var(--ease),box-shadow .25s; }.digest-route:hover,.digest-route:focus-visible { border-color: #dfb968; box-shadow: 0 0 0 4px rgba(223,185,104,.1); transform: translateY(-4px); }.digest-route svg,.digest-route img { width: 25px; height: 25px; flex: 0 0 auto; object-fit: contain; image-rendering: pixelated; fill: none; stroke: #dfb968; stroke-width: 1.5; }
.digest-route--1 { top: 7%; left: 3%; }.digest-route--2 { top: 6%; right: 3%; }.digest-route--3 { top: 37%; left: 0; }.digest-route--4 { top: 36%; right: 0; }.digest-route--5 { bottom: 19%; left: 5%; }.digest-route--6 { right: 5%; bottom: 19%; }
.digest-next { position: absolute; right: 8%; bottom: 0; left: 8%; z-index: 12; display: grid; gap: 8px; padding: 11px 13px; border: 1px solid rgba(100,153,207,.3); border-radius: 12px; color: #fcf9f2; background: rgba(5,22,24,.95); text-align: left; }.digest-next small { color: #85afce; font: 650 .44rem/1 "IBM Plex Mono",monospace; letter-spacing: .12em; }.digest-next span { display: flex; align-items: center; gap: 8px; }.digest-next b { color: rgba(252,249,242,.78); font: 600 .48rem/1 "IBM Plex Mono",monospace; white-space: nowrap; }.digest-next i { flex: 1; height: 1px; background: linear-gradient(90deg,rgba(131,190,164,.2),rgba(223,185,104,.55)); }
.digest-meter { position: absolute; right: 12%; bottom: 72px; left: 12%; z-index: 11; display: grid; gap: 7px; }.digest-meter > span { display: flex; justify-content: space-between; color: rgba(252,249,242,.68); font: 600 .48rem/1 "IBM Plex Mono",monospace; }.digest-meter > i { height: 5px; overflow: hidden; border-radius: 99px; background: rgba(252,249,242,.1); }.digest-meter > i b { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg,#3a8d6b,#a8d5b9,#dfb968); transition: width .12s linear; }
.progression-nav { position: absolute; z-index: 20; right: clamp(18px,4vw,68px); bottom: 16px; left: clamp(18px,4vw,68px); display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); border-top: 1px solid rgba(252,249,242,.13); }.progression-nav button { min-width: 44px; min-height: 58px; display: grid; grid-template-columns: 9px 22px minmax(0,1fr); align-items: center; gap: 8px; padding: 5px 8px; border: 0; color: rgba(252,249,242,.48); background: transparent; cursor: pointer; text-align: left; }.progression-nav button > i { width: 6px; height: 6px; border: 1px solid currentColor; border-radius: 50%; }.progression-nav button.active { color: #fcf9f2; }.progression-nav button.active > i { border-color: #dfb968; background: #dfb968; transform: scale(1.35); }.progression-nav button.complete { color: #9bcbb5; }.progression-nav span { font: 600 .52rem/1 "IBM Plex Mono",monospace; }.progression-nav strong { font-size: .61rem; }.progression-line { position: absolute; z-index: 21; right: 0; bottom: 0; left: 0; height: 3px; background: rgba(252,249,242,.08); }.progression-line i { display: block; height: 100%; background: linear-gradient(90deg,#35775f,#dfb968); }
.progression-static { display: none; }
.progression-copy-enter-active,.progression-copy-leave-active,.progression-scene-enter-active,.progression-scene-leave-active { transition: opacity .3s ease,transform .55s var(--ease),filter .35s ease; }.progression-copy-enter-from,.progression-scene-enter-from { opacity: 0; transform: translateY(16px); filter: blur(5px); }.progression-copy-leave-to,.progression-scene-leave-to { opacity: 0; transform: translateY(-10px); filter: blur(4px); }
@media(max-width:1120px){.progression-v2__layout{grid-template-columns:minmax(220px,.62fr) minmax(500px,1.4fr);gap:26px}.progression-nav strong{display:none}.progression-nav button{grid-template-columns:9px 1fr;justify-items:center;text-align:center}.formula-book-wrap{transform:translate3d(4%,0,0)} }
@media(max-width:820px){.progression-v2{min-height:600svh}.progression-v2__sticky{min-height:650px}.progression-v2__layout{inset:138px 14px 72px;grid-template-columns:1fr;grid-template-rows:auto minmax(350px,1fr);gap:8px;align-items:start}.progression-copy h3{margin:9px 0 10px;font-size:clamp(2.2rem,8.8vw,3.5rem)}.progression-copy__body{max-width:620px;font-size:.75rem;line-height:1.45}.progression-copy__fact{display:none}.progression-v2__stage-wrap{height:100%;min-height:350px}.progression-player--formula{width:22%;height:42%}.progression-player--ingredients{left:-2%;width:25%;height:48%}.formula-book-wrap{width:min(365px,65%);transform:translate3d(10%,0,0)}.formula-caption{right:0;bottom:5%;width:160px}.ingredients-book-mini{width:150px}.cauldron-target{right:2%;width:150px}.ingredient-flight--1,.ingredient-flight--2,.ingredient-flight--3{left:28%}.brew-slots-ui{width:min(360px,68%)}.control-challenge{right:0;width:170px}.awakening-powers{right:0;width:190px}.digest-route{width:118px;min-height:50px;font-size:.45rem}.digest-core{left:50%}.digest-ring{left:50%}.digest-next{right:0;left:0}.digest-meter{right:7%;left:7%}}
@media(max-width:520px){.progression-v2__heading{top:72px;right:12px;left:12px}.progression-v2__heading h2{font-size:1rem}.progression-v2__heading span{display:none}.progression-v2__sticky{min-height:620px}.progression-v2__layout{inset:126px 9px 63px;grid-template-rows:auto minmax(345px,1fr)}.progression-copy h3{font-size:clamp(1.95rem,10vw,2.8rem)}.progression-v2__stage{min-height:345px}.formula-book-wrap{width:72%;transform:translate3d(3%,4%,0)}.formula-caption{display:none}.progression-player--formula{left:-2%;width:24%;height:38%}.progression-player--ingredients{left:-4%;width:22%;height:46%}.formula-book__content{inset:14% 13% 10%}.formula-book__topline{font-size:.48rem}.formula-book h4{margin:10% 0 5%;font-size:.82rem}.formula-line{grid-template-columns:22px minmax(0,1fr);padding:4px}.formula-line img{width:19px;height:19px}.formula-line span{font-size:.52rem}.formula-line small{font-size:.43rem}.ingredients-book-mini{top:2%;left:0;width:116px}.ingredient-flight{--target-x:170px;padding:5px}.ingredient-flight img{width:34px;height:34px}.ingredient-flight span{max-width:95px;font-size:.44rem}.ingredient-flight--1{--target-y:80px;top:24%;left:27%}.ingredient-flight--2{--target-y:20px;top:41%;left:27%}.ingredient-flight--3{--target-y:-40px;top:58%;left:27%}.cauldron-target{top:31%;right:-2%;width:124px}.cauldron-target__top,.cauldron-target__inner{width:98px;height:98px}.brew-switch{top:-3px}.brew-switch button{min-height:44px;padding:0 11px;font-size:.57rem}.brew-slots-ui{width:78%}.brew-slot{width:40px;height:40px}.brew-slot img{width:25px;height:25px}.brew-result{right:0;bottom:1%;padding:6px}.brew-result img{width:36px;height:36px}.brew-result strong{font-size:.58rem}.awakening-circle{width:84%}.awakening-potion{top:25%;left:29%}.awakening-potion img{width:50px;height:50px}.awakening-potion span{display:none}.control-challenge{top:6%;width:145px;padding:9px}.control-challenge > span i{width:17px;height:17px}.awakening-powers{bottom:4%;width:165px;padding:9px}.awakening-powers b{font-size:.39rem}.digest-core{padding:17px}.digest-core strong{font-size:1.65rem}.digest-core span{font-size:.45rem}.digest-route{width:98px;min-height:47px;font-size:.5rem}.digest-route--1,.digest-route--2{top:0}.digest-route--3,.digest-route--4{top:29%}.digest-route--5,.digest-route--6{bottom:21%}.digest-next{padding:8px}.digest-next span{gap:3px}.digest-next b{font-size:.42rem}.progression-nav{right:7px;bottom:7px;left:7px;border-top:0}.progression-nav button{min-height:48px;gap:2px;padding:3px}}
@media(prefers-reduced-motion:reduce),(max-height:560px){.progression-v2{min-height:auto;padding:clamp(82px,11vw,130px) clamp(16px,4vw,58px);background:linear-gradient(145deg,#071416,#102724)}.progression-v2__sticky{position:relative;height:auto;min-height:0;overflow:visible;background:transparent}.progression-v2__backdrop,.progression-v2__wash,.progression-v2__layout,.progression-nav,.progression-line{display:none}.progression-v2__heading{position:relative;top:auto;left:auto;width:min(760px,100%);margin:0 auto 44px}.progression-v2__heading h2{margin-top:8px;font-size:clamp(2.5rem,8vw,5rem)}.progression-static{width:min(920px,100%);display:block;margin:0 auto;padding:0;list-style:none}.progression-static li{display:grid;grid-template-columns:52px minmax(0,1fr);gap:clamp(16px,4vw,40px);padding:clamp(27px,5vw,48px) 0;border-top:1px solid rgba(252,249,242,.13)}.progression-static li>span{color:#dfb968;font:600 .7rem/1 "IBM Plex Mono",monospace}.progression-static small{color:#70a88e;font:600 .58rem/1 "IBM Plex Mono",monospace;letter-spacing:.12em;text-transform:uppercase}.progression-static h3{margin:10px 0 12px;font:600 clamp(2rem,6vw,3.7rem)/.95 "IBM Plex Sans Condensed",sans-serif}.progression-static p{max-width:660px;margin:0;color:rgba(252,249,242,.68);line-height:1.65}.progression-static strong{display:block;margin-top:15px;color:rgba(252,249,242,.72);font:500 .62rem/1.5 "IBM Plex Mono",monospace}}
@media(prefers-reduced-motion:reduce){.progression-copy-enter-active,.progression-copy-leave-active,.progression-scene-enter-active,.progression-scene-leave-active,.formula-line,.ingredient-flight,.brew-result,.awakening-circle,.awakening-powers{transition:none}.progression-v2__backdrop{transform:none}}
@media(max-width:520px){
  .ingredient-flight { --target-x: 170px; }
  .cauldron-target__body { width: 116px; height: 84px; }
  .cauldron-target__top { width: 116px; height: 42px; }
  .cauldron-target__inner { width: 90px; height: 28px; }
}
</style>
