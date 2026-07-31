<template>
  <section
    id="progression"
    ref="sectionRef"
    class="progression"
    :class="`stage-${activeStage.id}`"
    :style="{
      '--journey': progress.toFixed(4),
      '--local': localProgress.toFixed(4),
      '--presence': scenePresence.toFixed(4),
      '--potion-sprite': `url(${potionSprite})`,
    }"
    aria-labelledby="progression-title"
  >
    <div class="progression-sticky">
      <div class="brewery-backdrop" aria-hidden="true">
        <img
          :src="breweryScene"
          alt=""
          width="1920"
          height="1017"
          fetchpriority="high"
          decoding="async"
        >
      </div>
      <div class="scene-grade" aria-hidden="true" />
      <div class="fog-memory" aria-hidden="true" />

      <header class="chapter-heading">
        <span>Playable progression</span>
        <h2 id="progression-title">Brew it. Live it. Advance.</h2>
        <p>Fool · Sequence 9 example</p>
      </header>

      <div class="stage-layout">
        <article class="stage-copy">
          <span>{{ stageNumber }} · {{ activeStage.kicker }}</span>
          <h3>{{ activeStage.title }}</h3>
          <p>{{ activeStage.copy }}</p>
          <div class="fact-line"><i aria-hidden="true" />{{ activeStage.fact }}</div>
        </article>

        <div class="scene-shell">
          <div class="scene" :class="`scene--${activeStage.id}`">
            <template v-if="activeStage.id === 'formula'">
              <div class="formula-pages" aria-label="Formula page assembly">
                <button
                  v-for="(page, index) in formulaPages"
                  :key="page.id"
                  class="formula-page scene-item"
                  type="button"
                  :aria-describedby="detailId(page.id)"
                  :aria-expanded="activeHotspotId === page.id"
                  aria-controls="scene-detail-panel"
                  :style="{ '--page': String(index) }"
                  @mouseenter="showDetail(page.id)"
                  @mouseleave="clearDetail"
                  @focus="showDetail(page.id)"
                  @blur="clearDetail"
                  @click="toggleDetail(page.id)"
                >
                  <img :src="recipeFragment" alt="" width="16" height="16">
                  <span>{{ page.label }}</span>
                </button>
              </div>
              <button
                class="written-formula scene-item"
                type="button"
                :aria-describedby="detailId('formula-main')"
                :aria-expanded="activeHotspotId === 'formula-main'"
                aria-controls="scene-detail-panel"
                @mouseenter="showDetail('formula-main')"
                @mouseleave="clearDetail"
                @focus="showDetail('formula-main')"
                @blur="clearDetail"
                @click="toggleDetail('formula-main')"
              >
                <span class="formula-book">
                  <i class="formula-book__left">SEQUENCE 9<small>SEER</small></i>
                  <i class="formula-book__right"><img :src="foolRecipe" alt="" width="16" height="16"></i>
                </span>
                <strong>Complete Seer formula</strong>
              </button>
            </template>

            <RitualAltarScene
              v-else-if="activeStage.id === 'altar'"
              :progress="localProgress"
              @inspect="id => id ? showDetail(id) : clearDetail()"
            />

            <template v-else-if="activeStage.id === 'ingredients'">
              <div class="ingredient-table" aria-label="Fool Sequence 9 ingredients">
                <button
                  v-for="ingredient in ingredientItems"
                  :key="ingredient.id"
                  class="ingredient-card scene-item"
                  type="button"
                  :aria-describedby="detailId(ingredient.id)"
                  :aria-expanded="activeHotspotId === ingredient.id"
                  aria-controls="scene-detail-panel"
                  @mouseenter="showDetail(ingredient.id)"
                  @mouseleave="clearDetail"
                  @focus="showDetail(ingredient.id)"
                  @blur="clearDetail"
                  @click="toggleDetail(ingredient.id)"
                >
                  <span><img :src="ingredient.src" alt="" width="16" height="16"></span>
                  <strong>{{ ingredient.label }}</strong>
                  <small>{{ ingredient.role }}</small>
                </button>
                <button
                  class="ingredient-card ingredient-card--characteristic scene-item"
                  type="button"
                  :aria-describedby="detailId('beyonder-characteristic')"
                  :aria-expanded="activeHotspotId === 'beyonder-characteristic'"
                  aria-controls="scene-detail-panel"
                  @mouseenter="showDetail('beyonder-characteristic')"
                  @mouseleave="clearDetail"
                  @focus="showDetail('beyonder-characteristic')"
                  @blur="clearDetail"
                  @click="toggleDetail('beyonder-characteristic')"
                >
                  <span aria-hidden="true"><i /></span>
                  <strong>Beyonder Characteristic</strong>
                  <small>Main-set substitute</small>
                </button>
              </div>
            </template>

            <template v-else-if="activeStage.id === 'brew'">
              <div class="brew-interface">
                <div class="brew-interface__header"><span>Ritual Altar interface</span><i>live in-game UI</i></div>
                <div class="brew-interface__image">
                  <img :src="cauldronInterface" alt="Mysterria Ritual Altar brewing interface" width="636" height="284">
                  <div class="clean-brew-grid" aria-hidden="true">
                    <span v-for="cell in 45" :key="cell">
                      <img v-if="cell === 11" :src="lavosSquidBlood" alt="">
                      <img v-else-if="cell === 29" :src="foolRecipe" alt="">
                      <img v-else-if="cell === 17" :src="goldMintLeaves" alt="">
                    </span>
                  </div>
                  <button class="slot-zone slot-zone--main" type="button" aria-label="Main ingredient slots" :aria-describedby="detailId('brew-main-slots')" :aria-expanded="activeHotspotId === 'brew-main-slots'" aria-controls="scene-detail-panel" @mouseenter="showDetail('brew-main-slots')" @mouseleave="clearDetail" @focus="showDetail('brew-main-slots')" @blur="clearDetail" @click="toggleDetail('brew-main-slots')" />
                  <button class="slot-zone slot-zone--recipe" type="button" aria-label="Written formula slot" :aria-describedby="detailId('brew-recipe-slot')" :aria-expanded="activeHotspotId === 'brew-recipe-slot'" aria-controls="scene-detail-panel" @mouseenter="showDetail('brew-recipe-slot')" @mouseleave="clearDetail" @focus="showDetail('brew-recipe-slot')" @blur="clearDetail" @click="toggleDetail('brew-recipe-slot')" />
                  <button class="slot-zone slot-zone--supp" type="button" aria-label="Supplementary ingredient slots" :aria-describedby="detailId('brew-supp-slots')" :aria-expanded="activeHotspotId === 'brew-supp-slots'" aria-controls="scene-detail-panel" @mouseenter="showDetail('brew-supp-slots')" @mouseleave="clearDetail" @focus="showDetail('brew-supp-slots')" @blur="clearDetail" @click="toggleDetail('brew-supp-slots')" />
                </div>
              </div>
              <button class="potion-result scene-item" type="button" :aria-describedby="detailId('sequence-potion')" :aria-expanded="activeHotspotId === 'sequence-potion'" aria-controls="scene-detail-panel" @mouseenter="showDetail('sequence-potion')" @mouseleave="clearDetail" @focus="showDetail('sequence-potion')" @blur="clearDetail" @click="toggleDetail('sequence-potion')">
                <span class="potion-pixel" aria-hidden="true" />
                <strong>Sequence 9 potion</strong>
              </button>
            </template>

            <template v-else-if="activeStage.id === 'drink'">
              <MinecraftPlayer class="player-rig" mode="drink" :active="visible" />
              <button class="drink-potion scene-item" type="button" :aria-describedby="detailId('drink-potion')" :aria-expanded="activeHotspotId === 'drink-potion'" aria-controls="scene-detail-panel" @mouseenter="showDetail('drink-potion')" @mouseleave="clearDetail" @focus="showDetail('drink-potion')" @blur="clearDetail" @click="toggleDetail('drink-potion')">
                <span class="potion-pixel" aria-hidden="true" />
                <strong>Sequence 9 · Seer</strong>
              </button>
              <button class="ability-reveal scene-item" type="button" :aria-describedby="detailId('drink-abilities')" :aria-expanded="activeHotspotId === 'drink-abilities'" aria-controls="scene-detail-panel" @mouseenter="showDetail('drink-abilities')" @mouseleave="clearDetail" @focus="showDetail('drink-abilities')" @blur="clearDetail" @click="toggleDetail('drink-abilities')">
                <span>Divination</span><span>Spiritualism</span>
              </button>
            </template>

            <template v-else-if="activeStage.id === 'digest'">
              <MinecraftPlayer class="player-rig player-rig--digest" mode="walk" :active="visible" />
              <div class="activity-orbit" aria-label="Digestion routes">
                <button
                  v-for="(route, index) in digestRoutes"
                  :key="route.id"
                  class="activity-node scene-item"
                  :class="`route-${index + 1}`"
                  type="button"
                  :aria-describedby="detailId(route.id)"
                  :aria-expanded="activeHotspotId === route.id"
                  aria-controls="scene-detail-panel"
                  @mouseenter="showDetail(route.id)"
                  @mouseleave="clearDetail"
                  @focus="showDetail(route.id)"
                  @blur="clearDetail"
                  @click="toggleDetail(route.id)"
                >
                  <img v-if="route.asset" :src="route.asset" alt="" width="16" height="16">
                  <svg v-else aria-hidden="true" viewBox="0 0 24 24"><path :d="route.icon" /></svg>
                  <span>{{ route.label }}</span>
                </button>
              </div>
              <div class="digestion-meter" aria-label="Example digestion progress">
                <span><strong>Digestion</strong><b>{{ digestionValue }}%</b></span>
                <i><b :style="{ width: `${digestionValue}%` }" /></i>
              </div>
            </template>

            <template v-else-if="activeStage.id === 'ritual'">
              <div class="ritual-scene">
                <img class="magic-circle" :src="magicCircle" alt="" width="256" height="256">
                <button class="ritual-book scene-item" type="button" :aria-describedby="detailId('ritual-book')" :aria-expanded="activeHotspotId === 'ritual-book'" aria-controls="scene-detail-panel" @mouseenter="showDetail('ritual-book')" @mouseleave="clearDetail" @focus="showDetail('ritual-book')" @blur="clearDetail" @click="toggleDetail('ritual-book')">
                  <img :src="ritualBook" alt="" width="16" height="16"><span>Personal ritual</span>
                </button>
                <button class="ritual-ready scene-item" type="button" :aria-describedby="detailId('ritual-readiness')" :aria-expanded="activeHotspotId === 'ritual-readiness'" aria-controls="scene-detail-panel" @mouseenter="showDetail('ritual-readiness')" @mouseleave="clearDetail" @focus="showDetail('ritual-readiness')" @blur="clearDetail" @click="toggleDetail('ritual-readiness')">
                  <strong>95%</strong><span>Acting ready</span>
                </button>
                <button class="ritual-risk scene-item" type="button" :aria-describedby="detailId('ritual-madness')" :aria-expanded="activeHotspotId === 'ritual-madness'" aria-controls="scene-detail-panel" @mouseenter="showDetail('ritual-madness')" @mouseleave="clearDetail" @focus="showDetail('ritual-madness')" @blur="clearDetail" @click="toggleDetail('ritual-madness')">
                  <strong>Incomplete?</strong><span>Madness cost</span>
                </button>
              </div>
            </template>

            <template v-else>
              <div class="advance-scene">
                <img class="magic-circle magic-circle--advance" :src="magicCircle" alt="" width="256" height="256">
                <div class="advance-beam" aria-hidden="true" />
                <MinecraftPlayer class="player-rig player-rig--advance" mode="advance" :active="visible" />
                <button class="sequence-shift scene-item" type="button" :aria-describedby="detailId('advance-sequence')" :aria-expanded="activeHotspotId === 'advance-sequence'" aria-controls="scene-detail-panel" @mouseenter="showDetail('advance-sequence')" @mouseleave="clearDetail" @focus="showDetail('advance-sequence')" @blur="clearDetail" @click="toggleDetail('advance-sequence')">
                  <span>SEQUENCE</span><strong>9</strong><i /><strong>8</strong>
                </button>
                <button class="advance-node node-abilities scene-item" type="button" :aria-describedby="detailId('advance-abilities')" :aria-expanded="activeHotspotId === 'advance-abilities'" aria-controls="scene-detail-panel" @mouseenter="showDetail('advance-abilities')" @mouseleave="clearDetail" @focus="showDetail('advance-abilities')" @blur="clearDetail" @click="toggleDetail('advance-abilities')">New abilities</button>
                <button class="advance-node node-spirituality scene-item" type="button" :aria-describedby="detailId('advance-spirituality')" :aria-expanded="activeHotspotId === 'advance-spirituality'" aria-controls="scene-detail-panel" @mouseenter="showDetail('advance-spirituality')" @mouseleave="clearDetail" @focus="showDetail('advance-spirituality')" @blur="clearDetail" @click="toggleDetail('advance-spirituality')">Resources restored</button>
                <button class="advance-node node-madness scene-item" type="button" :aria-describedby="detailId('advance-madness')" :aria-expanded="activeHotspotId === 'advance-madness'" aria-controls="scene-detail-panel" @mouseenter="showDetail('advance-madness')" @mouseleave="clearDetail" @focus="showDetail('advance-madness')" @blur="clearDetail" @click="toggleDetail('advance-madness')">Power has a cost</button>
              </div>
            </template>

            <Transition name="detail-reveal">
              <aside v-if="activeDetail" id="scene-detail-panel" class="scene-detail">
                <span>Inspecting</span>
                <strong>{{ activeDetail.label }}</strong>
                <p>{{ activeDetail.detail }}</p>
              </aside>
            </Transition>
          </div>
        </div>
      </div>

      <div class="sr-mechanic-details">
        <template v-for="stage in progressionStages" :key="`details-${stage.id}`">
          <span v-for="hotspot in stage.hotspots" :id="detailId(hotspot.id, stage.id)" :key="hotspot.id">{{ hotspot.detail }}</span>
        </template>
      </div>

      <nav class="stage-nav" aria-label="Advancement steps">
        <button
          v-for="(stage, index) in progressionStages"
          :key="stage.id"
          type="button"
          :class="{ active: activeIndex === index, complete: activeIndex > index }"
          :aria-current="activeIndex === index ? 'step' : undefined"
          :title="`Step ${index + 1}: ${stage.title}`"
          @click="goToStage(index)"
        >
          <i /><span>{{ String(index + 1).padStart(2, '0') }}</span><strong>{{ stage.short }}</strong>
        </button>
      </nav>
      <div class="journey-line" aria-hidden="true"><i :style="{ width: `${progress * 100}%` }" /></div>
    </div>

    <ol class="static-progression">
      <li v-for="(stage, index) in progressionStages" :key="stage.id">
        <span>{{ String(index + 1).padStart(2, '0') }}</span>
        <div>
          <small>{{ stage.kicker }}</small><h3>{{ stage.title }}</h3><p>{{ stage.copy }}</p><strong>{{ stage.fact }}</strong>
          <ul>
            <li v-for="hotspot in stage.hotspots" :key="hotspot.id"><b>{{ hotspot.label }}</b><span>{{ hotspot.detail }}</span></li>
          </ul>
        </div>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useReducedMotion } from '@/composables/useReducedMotion';
import { progressionStages } from '@/data/progression';
import RitualAltarScene from './RitualAltarScene.vue';
import MinecraftPlayer from './MinecraftPlayer.vue';
import breweryScene from '@/assets/images/home/progression/brewery-scene.webp';
import cauldronInterface from '@/assets/images/home/progression/cauldron-interface.png';
import potionSprite from '@/assets/images/home/progression/potion-sprite.png';
import recipeFragment from '@/assets/images/home/progression/recipe-fragment.png';
import foolRecipe from '@/assets/images/home/progression/recipes/fool.png';
import lavosSquidBlood from '@/assets/images/home/progression/real/lavos-squid-blood.png';
import stellarAquaCrystal from '@/assets/images/home/progression/real/stellar-aqua-crystal.png';
import goldMintLeaves from '@/assets/images/home/progression/real/gold-mint-leaves.png';
import actingBottle from '@/assets/images/home/progression/real/acting-bottle-medium.png';
import ritualBook from '@/assets/images/home/progression/real/ritual-book-tier2.png';
import magicCircle from '@/assets/images/home/progression/real/magic-circle.png';

const sectionRef = ref<HTMLElement | null>(null);
const progress = ref(0);
const activeIndex = ref(0);
const localProgress = ref(0);
const visible = ref(false);
const activeHotspotId = ref<string | null>(null);
const pinnedHotspotId = ref<string | null>(null);
const reducedMotion = useReducedMotion();
let observer: IntersectionObserver | null = null;
let frame = 0;

const activeStage = computed(() => progressionStages[activeIndex.value]);
const stageNumber = computed(() => `${String(activeIndex.value + 1).padStart(2, '0')} / ${String(progressionStages.length).padStart(2, '0')}`);
const scenePresence = computed(() => {
  const enter = Math.min(1, localProgress.value / .12);
  const leave = Math.min(1, (1 - localProgress.value) / .1);
  return .72 + Math.min(enter, leave) * .28;
});
const activeDetail = computed(() => activeStage.value.hotspots.find(hotspot => hotspot.id === activeHotspotId.value) ?? null);
const digestionValue = computed(() => Math.round(32 + localProgress.value * 63));

const formulaPages = computed(() => activeStage.value.id === 'formula' ? activeStage.value.hotspots : []);
const ingredientItems = [
  { id: 'lavos-squid-blood', label: 'Lavos Squid Blood', role: 'Main · Creature drop', src: lavosSquidBlood },
  { id: 'stellar-aqua-crystal', label: 'Stellar Aqua Crystal', role: 'Main · Found in loot', src: stellarAquaCrystal },
  { id: 'gold-mint-leaves', label: 'Gold Mint Leaves', role: 'Supplement · Mineable', src: goldMintLeaves },
];

const digestRoutes = [
  { id: 'act-sequence', label: 'Act the Sequence', icon: 'M12 3l2.7 5.5L21 9.4l-4.5 4.4 1.1 6.2-5.6-2.9L6.4 20l1.1-6.2L3 9.4l6.3-.9L12 3z' },
  { id: 'take-bounty', label: 'Take a bounty', icon: 'M7 3h10v3h3v15H4V6h3V3zm2 3h6V5H9v1zm-1 5h8M8 15h5', asset: undefined },
  { id: 'hunt-beyonders', label: 'Hunt Beyonders', icon: 'M12 3v18M3 12h18M6 6l12 12M18 6L6 18' },
  { id: 'explore-gather', label: 'Explore & gather', icon: 'M12 3l7 4v6c0 4.5-3 7-7 8-4-1-7-3.5-7-8V7l7-4zm0 5v8m-4-4h8' },
  { id: 'crimson-moon', label: 'Crimson Moon', icon: 'M18 15.5A8 8 0 118.5 4 6.5 6.5 0 0018 15.5z' },
  { id: 'acting-bottle', label: 'Acting bottles', icon: '', asset: actingBottle },
];

function showDetail(id: string) { activeHotspotId.value = id; }
function clearDetail() { activeHotspotId.value = pinnedHotspotId.value; }
function detailId(id: string, stageId = activeStage.value.id) { return `progression-detail-${stageId}-${id}`; }
function toggleDetail(id: string) {
  pinnedHotspotId.value = pinnedHotspotId.value === id ? null : id;
  activeHotspotId.value = pinnedHotspotId.value;
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
      activeHotspotId.value = null;
      pinnedHotspotId.value = null;
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
  const targetProgress = (index + .18) / progressionStages.length;
  scrollTo({ top: top + range * targetProgress, behavior: reducedMotion.value ? 'auto' : 'smooth' });
}

onMounted(() => {
  observer = new IntersectionObserver(([entry]) => {
    visible.value = entry.isIntersecting;
    if (visible.value) {
      update();
    }
  }, { rootMargin: '100px 0px' });
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
  --presence: 0;
  --ease-out: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  min-height: 860svh;
  color: #fcf9f2;
  background: #071416;
  isolation: isolate;
}

.progression-sticky { position: sticky; top: 0; height: 100svh; min-height: 620px; overflow: hidden; background: #0b191b; }
.sr-mechanic-details { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.brewery-backdrop, .scene-grade, .fog-memory { position: absolute; inset: 0; }
.brewery-backdrop { transform: scale(calc(1.045 + var(--journey) * .11)) translate3d(calc((.5 - var(--journey)) * 1.5%), calc(var(--journey) * -1.4%), 0); transform-origin: 51% 57%; will-change: transform; }
.brewery-backdrop img { width: 100%; height: 100%; object-fit: cover; object-position: center 57%; filter: saturate(.68) contrast(1.06) brightness(.42); }
.scene-grade { z-index: 1; background: linear-gradient(90deg, rgba(3, 12, 14, .91), rgba(3, 12, 14, .32) 34%, rgba(3, 12, 14, .24) 68%, rgba(3, 12, 14, .86)), linear-gradient(180deg, rgba(2, 9, 11, .7), transparent 25%, transparent 71%, rgba(2, 9, 11, .92)), radial-gradient(circle at 53% 49%, rgba(67, 139, 112, .16), transparent 37%); }
.stage-ritual .scene-grade, .stage-advance .scene-grade { background: linear-gradient(90deg, rgba(2, 10, 12, .94), rgba(4, 17, 18, .48) 52%, rgba(3, 12, 15, .9)), radial-gradient(circle at 54% 49%, rgba(198, 155, 82, .27), transparent 36%), linear-gradient(180deg, rgba(2, 8, 10, .78), transparent 34%, rgba(2, 8, 10, .94)); }
.fog-memory { z-index: 2; height: 34%; opacity: calc(.48 - var(--journey) * .42); background: radial-gradient(ellipse at 15% 0, rgba(184, 193, 191, .47), transparent 46%), radial-gradient(ellipse at 54% 0, rgba(208, 214, 211, .37), transparent 51%), radial-gradient(ellipse at 91% 0, rgba(161, 173, 172, .45), transparent 44%); filter: blur(28px); transform: translateY(calc(var(--journey) * -72%)); }

.chapter-heading { position: absolute; z-index: 20; top: clamp(68px, 8vh, 88px); left: clamp(18px, 3.2vw, 52px); display: grid; gap: 5px; }
.chapter-heading span, .stage-copy > span { color: #dfb968; font: 650 .62rem/1 "IBM Plex Mono", monospace; letter-spacing: .16em; text-transform: uppercase; }
.chapter-heading h2 { margin: 0; color: rgba(252, 249, 242, .91); font: 600 clamp(1.05rem, 1.5vw, 1.35rem)/1 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.02em; }
.chapter-heading p { margin: 2px 0 0; color: rgba(252, 249, 242, .55); font: 500 .58rem/1 "IBM Plex Mono", monospace; }

.stage-layout { position: absolute; z-index: 8; inset: clamp(140px, 16vh, 165px) clamp(18px, 3.2vw, 52px) clamp(96px, 12vh, 124px); display: grid; grid-template-columns: minmax(270px, .72fr) minmax(540px, 1.7fr); align-items: center; gap: clamp(28px, 4vw, 72px); }
.stage-copy { align-self: center; min-width: 0; opacity: var(--presence); transform: translateY(calc((1 - var(--presence)) * 18px)); }
.stage-copy h3 { max-width: 440px; margin: 15px 0 15px; font: 630 clamp(2.8rem, 4.8vw, 5.3rem)/.88 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.048em; text-wrap: balance; }
.stage-copy > p { max-width: 440px; margin: 0; color: rgba(252, 249, 242, .7); font-size: clamp(.82rem, .96vw, .94rem); line-height: 1.62; }
.fact-line { max-width: 440px; display: flex; gap: 10px; margin-top: 21px; padding-top: 16px; border-top: 1px solid rgba(252, 249, 242, .13); color: rgba(252, 249, 242, .48); font: 500 .59rem/1.55 "IBM Plex Mono", monospace; }
.fact-line i { flex: 0 0 auto; width: 6px; height: 6px; margin-top: 3px; border-radius: 50%; background: #dfb968; box-shadow: 0 0 10px rgba(223, 185, 104, .48); }

.scene-shell { min-width: 0; height: min(66vh, 660px); display: grid; place-items: center; }
.scene { position: relative; width: 100%; height: 100%; display: grid; place-items: center; opacity: var(--presence); transform: translateY(calc((1 - var(--presence)) * 18px)) scale(calc(.97 + var(--presence) * .03)); will-change: opacity, transform; }
.scene-item { min-width: 44px; min-height: 44px; border: 0; color: inherit; cursor: pointer; }
.scene-item:focus-visible { outline: 2px solid #f0d38c; outline-offset: 4px; }

.scene-detail { position: absolute; z-index: 50; right: 3%; bottom: 3%; width: min(300px, 70%); padding: 15px 17px; border: 1px solid rgba(223, 185, 104, .35); border-radius: 12px; background: rgba(6, 22, 23, .94); box-shadow: 0 18px 50px rgba(0, 0, 0, .34); backdrop-filter: blur(14px); pointer-events: none; }
.scene-detail > span { color: #dfb968; font: 650 .52rem/1 "IBM Plex Mono", monospace; letter-spacing: .13em; text-transform: uppercase; }
.scene-detail strong { display: block; margin-top: 7px; font-size: .83rem; }
.scene-detail p { margin: 7px 0 0; color: rgba(252, 249, 242, .66); font-size: .69rem; line-height: 1.5; }
.detail-reveal-enter-active, .detail-reveal-leave-active { transition: opacity .24s ease, transform .34s var(--ease-out); }
.detail-reveal-enter-from, .detail-reveal-leave-to { opacity: 0; transform: translateY(8px) scale(.98); }

.formula-pages { position: absolute; inset: 0; }
.formula-page { position: absolute; top: calc(18% + var(--page) * 27%); left: calc(4% + var(--page) * 3%); width: 154px; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid rgba(223, 185, 104, .28); border-radius: 11px; color: rgba(252, 249, 242, .78); background: rgba(7, 26, 25, .84); font: 600 .57rem/1.3 "IBM Plex Mono", monospace; text-align: left; transform: translateX(calc((1 - var(--local)) * -48px)); }
.formula-page img { width: 32px; height: 32px; object-fit: contain; image-rendering: pixelated; }
.formula-page:hover, .formula-page:focus-visible { border-color: #dfb968; background: rgba(15, 48, 40, .95); }
.written-formula { position: relative; width: 310px; display: grid; justify-items: center; gap: 12px; color: #fcf9f2; background: transparent; transform: rotate(calc((.5 - var(--local)) * 4deg)); }
.formula-book { position: relative; width: 290px; height: 190px; display: flex; filter: drop-shadow(0 28px 22px rgba(0, 0, 0, .56)); transform: rotateX(50deg) rotateZ(-6deg); transform-style: preserve-3d; }
.formula-book > i { width: 50%; display: grid; place-items: center; border: 1px solid rgba(112, 67, 42, .28); color: #5e2c21; background: repeating-linear-gradient(180deg, transparent 0 15px, rgba(79, 53, 35, .1) 16px), linear-gradient(145deg, #f6e2b9, #d6b57f); font: 700 .61rem/1.3 "IBM Plex Mono", monospace; font-style: normal; }
.formula-book__left { border-radius: 14px 4px 4px 14px; }
.formula-book__left small { display: block; margin-top: 7px; font-size: .52rem; letter-spacing: .1em; }
.formula-book__right { border-radius: 4px 14px 14px 4px; }
.formula-book__right img { width: 96px; height: 96px; object-fit: contain; image-rendering: pixelated; }
.written-formula > strong { font: 650 .67rem/1 "IBM Plex Mono", monospace; }

.ingredient-table { width: min(600px, 100%); display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px; }
.ingredient-card { min-height: 145px; display: grid; grid-template-columns: 72px minmax(0, 1fr); grid-template-rows: auto auto; align-content: center; align-items: center; column-gap: 14px; padding: 16px; border: 1px solid rgba(131, 190, 164, .2); border-radius: 16px; color: #fcf9f2; background: rgba(7, 27, 27, .82); text-align: left; transition: transform .3s var(--ease-out), border-color .25s, background-color .25s; }
.ingredient-card:hover, .ingredient-card:focus-visible { border-color: rgba(223, 185, 104, .65); background: rgba(12, 42, 36, .95); transform: translateY(-4px); }
.ingredient-card > span { grid-row: 1 / 3; width: 72px; height: 72px; display: grid; place-items: center; border: 1px solid rgba(223, 185, 104, .2); border-radius: 13px; background: radial-gradient(circle, rgba(60, 123, 99, .33), rgba(6, 21, 22, .78)); }
.ingredient-card img { width: 64px; height: 64px; object-fit: contain; image-rendering: pixelated; }
.ingredient-card strong { align-self: end; font-size: .75rem; }
.ingredient-card small { align-self: start; margin-top: 6px; color: rgba(252, 249, 242, .48); font: 550 .5rem/1.4 "IBM Plex Mono", monospace; }
.ingredient-card--characteristic > span i { width: 30px; height: 42px; background: linear-gradient(145deg, #cfd9cf, #5f8d77 38%, #173c34 75%); clip-path: polygon(50% 0, 90% 20%, 100% 65%, 50% 100%, 0 65%, 10% 20%); box-shadow: inset 0 0 0 3px rgba(252, 249, 242, .3); }

.brew-interface { position: relative; width: min(620px, 100%); overflow: hidden; border: 1px solid rgba(112, 174, 148, .26); border-radius: 16px; background: rgba(5, 20, 21, .9); box-shadow: 0 26px 60px rgba(0, 0, 0, .36); }
.brew-interface__header { min-height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 15px; color: rgba(252, 249, 242, .55); font: 600 .54rem/1 "IBM Plex Mono", monospace; letter-spacing: .1em; text-transform: uppercase; }
.brew-interface__header i { color: #75af94; font-style: normal; }
.brew-interface__image { position: relative; }
.brew-interface__image img { width: 100%; height: auto; display: block; object-fit: contain; image-rendering: auto; }
.clean-brew-grid { position: absolute; z-index: 1; left: 25%; top: 18%; width: 50.5%; height: 75%; display: grid; grid-template-columns: repeat(9, 1fr); grid-template-rows: repeat(5, 1fr); gap: 3px; padding: 3px; border: 2px solid #a65f4d; background: #d88668; box-shadow: inset 0 0 0 2px rgba(255, 217, 167, .46); }
.clean-brew-grid > span { min-width: 0; min-height: 0; display: grid; place-items: center; border: 2px solid #f2c29b; border-right-color: #9e594b; border-bottom-color: #8a4b41; background: #c7745c; }
.clean-brew-grid img { width: 80%; height: 80%; object-fit: contain; image-rendering: pixelated; }
.slot-zone { position: absolute; min-width: 44px; min-height: 44px; border: 2px solid transparent; border-radius: 8px; background: transparent; cursor: pointer; transition: border-color .25s, background-color .25s; }
.slot-zone:hover, .slot-zone:focus-visible { border-color: #dfb968; background: rgba(223, 185, 104, .12); }
.slot-zone--main { z-index: 2; left: 29%; top: 30%; width: 17%; height: 42%; }
.slot-zone--recipe { z-index: 2; left: 49%; top: 27%; width: 7%; height: 20%; }
.slot-zone--supp { z-index: 2; right: 28%; top: 30%; width: 16%; height: 42%; }
.slot-zone--main:hover, .slot-zone--main:focus-visible { border-color: rgba(214, 95, 73, .9); }
.slot-zone--recipe:hover, .slot-zone--recipe:focus-visible { border-color: rgba(223, 185, 104, .95); }
.slot-zone--supp:hover, .slot-zone--supp:focus-visible { border-color: rgba(94, 144, 201, .95); }
.potion-result { position: absolute; right: 1%; bottom: 1%; display: flex; align-items: center; gap: 10px; padding: 9px 12px; border: 1px solid rgba(131, 190, 164, .35); border-radius: 11px; color: #fcf9f2; background: rgba(5, 27, 25, .95); font: 650 .58rem/1 "IBM Plex Mono", monospace; transform: translateY(calc((1 - var(--local)) * 24px)); }

.potion-pixel { width: 64px; height: 64px; display: block; background-image: var(--potion-sprite); background-repeat: no-repeat; background-size: 64px auto; background-position: 0 42%; image-rendering: pixelated; filter: drop-shadow(0 8px 6px rgba(0, 0, 0, .48)); }
.player-rig { width: min(360px, 64%); height: 100%; }
.drink-potion { position: absolute; left: 4%; top: 28%; display: grid; justify-items: center; gap: 7px; padding: 12px; border: 1px solid rgba(131, 190, 164, .25); border-radius: 14px; color: #fcf9f2; background: rgba(7, 27, 26, .82); font: 650 .56rem/1.2 "IBM Plex Mono", monospace; }
.drink-potion:hover, .drink-potion:focus-visible { border-color: #dfb968; }
.ability-reveal { position: absolute; right: 1%; top: 33%; display: grid; gap: 7px; padding: 12px 14px; border: 1px solid rgba(131, 190, 164, .28); border-radius: 12px; color: #fcf9f2; background: rgba(7, 27, 26, .86); font: 650 .57rem/1 "IBM Plex Mono", monospace; }
.ability-reveal span:first-child { color: #dfb968; }

.player-rig--digest { width: min(300px, 54%); }
.activity-orbit { position: absolute; inset: 0; }
.activity-node { position: absolute; width: 128px; min-height: 64px; display: flex; align-items: center; gap: 9px; padding: 9px 10px; border: 1px solid rgba(131, 190, 164, .22); border-radius: 12px; color: rgba(252, 249, 242, .84); background: rgba(6, 25, 25, .86); font: 600 .53rem/1.25 "IBM Plex Mono", monospace; text-align: left; transition: transform .3s var(--ease-out), border-color .25s, background-color .25s; }
.activity-node:hover, .activity-node:focus-visible { z-index: 4; border-color: #dfb968; background: rgba(12, 42, 36, .96); transform: scale(1.04); }
.activity-node svg, .activity-node img { flex: 0 0 auto; width: 28px; height: 28px; object-fit: contain; image-rendering: pixelated; }
.activity-node svg { fill: none; stroke: #83bea4; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; }
.route-1 { left: 2%; top: 13%; }
.route-2 { right: 2%; top: 13%; }
.route-3 { left: 0; top: 44%; }
.route-4 { right: 0; top: 44%; }
.route-5 { left: 5%; bottom: 9%; }
.route-6 { right: 5%; bottom: 9%; }
.digestion-meter { position: absolute; left: 50%; bottom: 1%; width: min(310px, 52%); padding: 12px 14px; border: 1px solid rgba(131, 190, 164, .23); border-radius: 12px; background: rgba(6, 25, 25, .9); transform: translateX(-50%); }
.digestion-meter > span { display: flex; justify-content: space-between; font: 600 .57rem/1 "IBM Plex Mono", monospace; }
.digestion-meter > i { height: 6px; display: block; margin-top: 9px; overflow: hidden; border-radius: 6px; background: rgba(252, 249, 242, .12); }
.digestion-meter > i b { display: block; height: 100%; background: linear-gradient(90deg, #4b9b79, #bddcc8); }

.ritual-scene, .advance-scene { position: relative; width: 100%; height: 100%; display: grid; place-items: center; }
.magic-circle { width: min(480px, 84%); height: auto; object-fit: contain; filter: drop-shadow(0 0 34px rgba(208, 170, 86, .4)); transform: rotate(calc(-16deg + var(--local) * 28deg)) scale(calc(.72 + var(--local) * .28)); }
.ritual-book, .ritual-ready, .ritual-risk { position: absolute; display: grid; justify-items: center; gap: 5px; padding: 10px 12px; border: 1px solid rgba(223, 185, 104, .3); border-radius: 11px; color: #fcf9f2; background: rgba(7, 24, 24, .9); font: 600 .54rem/1.2 "IBM Plex Mono", monospace; }
.ritual-book { left: 50%; top: 50%; transform: translate(-50%, -50%); }
.ritual-book img { width: 64px; height: 64px; object-fit: contain; image-rendering: pixelated; }
.ritual-ready { left: 3%; top: 28%; color: #9fd2b9; }
.ritual-risk { right: 2%; bottom: 24%; color: #e6a18a; border-color: rgba(216, 114, 89, .34); }
.ritual-ready strong, .ritual-risk strong { font-size: .75rem; }

.magic-circle--advance { position: absolute; width: min(570px, 96%); opacity: calc(.5 + var(--local) * .5); transform: rotate(calc(-18deg + var(--local) * 44deg)) scale(calc(.75 + var(--local) * .28)); }
.advance-beam { position: absolute; top: -8%; bottom: -8%; left: 50%; width: calc(3px + var(--local) * 18px); opacity: clamp(0, calc((var(--local) - .2) * 2), 1); background: linear-gradient(transparent, rgba(244, 220, 160, .86) 31%, #effff6 52%, rgba(82, 168, 131, .72) 70%, transparent); transform: translateX(-50%); filter: blur(calc(var(--local) * 2px)) drop-shadow(0 0 26px rgba(207, 179, 107, .72)); }
.player-rig--advance { position: relative; z-index: 2; width: min(330px, 58%); }
.sequence-shift { position: absolute; z-index: 6; top: 3%; left: 50%; display: flex; align-items: center; gap: 10px; padding: 8px 11px; border: 1px solid rgba(223, 185, 104, .32); border-radius: 10px; color: #fcf9f2; background: rgba(7, 24, 24, .88); transform: translateX(-50%); font-family: "IBM Plex Mono", monospace; }
.sequence-shift span { color: #dfb968; font-size: .52rem; letter-spacing: .14em; }
.sequence-shift strong { font-size: 1.35rem; }
.sequence-shift i { width: 38px; height: 1px; background: rgba(252, 249, 242, .42); }
.advance-node { position: absolute; z-index: 6; padding: 11px 13px; border: 1px solid rgba(131, 190, 164, .32); border-radius: 999px; color: rgba(252, 249, 242, .88); background: rgba(7, 27, 26, .9); font: 600 .55rem/1 "IBM Plex Mono", monospace; }
.node-abilities { left: 1%; top: 26%; }
.node-spirituality { right: 0; top: 34%; }
.node-madness { right: 5%; bottom: 16%; color: #e4a186; border-color: rgba(212, 111, 85, .55); background: rgba(45, 23, 23, .9); }

.stage-nav { position: absolute; z-index: 45; right: clamp(18px, 3.2vw, 52px); bottom: 20px; left: clamp(18px, 3.2vw, 52px); display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); border-top: 1px solid rgba(252, 249, 242, .12); }
.stage-nav button { min-width: 44px; min-height: 58px; display: grid; grid-template-columns: 10px 22px minmax(0, 1fr); align-items: center; gap: 7px; padding: 5px 8px; border: 0; color: rgba(252, 249, 242, .48); background: transparent; cursor: pointer; text-align: left; }
.stage-nav button > i { width: 6px; height: 6px; border: 1px solid currentColor; border-radius: 50%; }
.stage-nav button.active { color: #fcf9f2; }
.stage-nav button.active > i { border-color: #dfb968; background: #dfb968; transform: scale(1.35); box-shadow: 0 0 10px rgba(223, 185, 104, .46); }
.stage-nav button.complete { color: #9bcbb5; }
.stage-nav span { font: 600 .52rem/1 "IBM Plex Mono", monospace; }
.stage-nav strong { overflow: hidden; font-size: .61rem; text-overflow: ellipsis; white-space: nowrap; }
.journey-line { position: absolute; z-index: 46; right: 0; bottom: 0; left: 0; height: 3px; background: rgba(252, 249, 242, .07); }
.journey-line i { display: block; height: 100%; background: linear-gradient(90deg, #35775f, #dfb968); box-shadow: 0 0 12px rgba(198, 155, 82, .3); }
.static-progression { display: none; }

@media (max-width: 1120px) {
  .stage-layout { grid-template-columns: minmax(230px, .72fr) minmax(470px, 1.6fr); gap: 24px; }
  .stage-copy h3 { font-size: clamp(2.6rem, 4.5vw, 4.4rem); }
  .stage-nav strong { display: none; }
  .stage-nav button { grid-template-columns: 10px 1fr; justify-items: center; text-align: center; }
}

@media (max-width: 820px) {
  .progression { min-height: 900svh; }
  .progression-sticky { min-height: 620px; }
  .chapter-heading { top: 82px; right: 15px; left: 15px; }
  .stage-layout { inset: 148px 14px 72px; grid-template-columns: 1fr; grid-template-rows: auto minmax(290px, 1fr); gap: 10px; align-items: start; }
  .stage-copy { align-self: start; }
  .stage-copy h3 { margin: 8px 0 8px; font-size: clamp(2.2rem, 8.5vw, 3.5rem); }
  .stage-copy > p { font-size: .75rem; line-height: 1.46; }
  .fact-line { display: none; }
  .scene-shell { width: 100%; height: 100%; min-height: 250px; }
  .scene-detail { right: 0; bottom: 0; width: min(280px, 78%); }
  .stage-nav { right: max(8px, env(safe-area-inset-right)); bottom: max(8px, env(safe-area-inset-bottom)); left: max(8px, env(safe-area-inset-left)); grid-template-columns: repeat(8, minmax(44px, 1fr)); border-top: 0; }
  .stage-nav button { min-height: 48px; grid-template-columns: 1fr; gap: 2px; padding: 3px; }
  .stage-nav button > i { width: 5px; height: 5px; }
  .formula-page { width: 128px; padding: 7px; }
  .formula-page img { width: 32px; height: 32px; }
  .written-formula { width: 260px; }
  .formula-book { width: 240px; height: 150px; }
  .formula-book__right img { width: 80px; height: 80px; }
  .ingredient-table { width: min(520px, 100%); gap: 8px; }
  .ingredient-card { min-height: 104px; grid-template-columns: 55px minmax(0, 1fr); padding: 10px; }
  .ingredient-card > span { width: 55px; height: 55px; }
  .ingredient-card img { width: 48px; height: 48px; }
  .brew-interface { width: min(540px, 100%); }
  .player-rig { width: min(280px, 60%); }
  .activity-node { width: 108px; min-height: 52px; padding: 7px; font-size: .46rem; }
  .activity-node svg, .activity-node img { width: 23px; height: 23px; }
  .digestion-meter { width: min(250px, 52%); }
}

@media (max-width: 480px) {
  .progression-sticky { min-height: 600px; }
  .stage-layout { inset: 142px 10px 66px; grid-template-rows: auto minmax(300px, 1fr); }
  .chapter-heading h2 { font-size: .95rem; }
  .chapter-heading p { display: none; }
  .stage-copy h3 { font-size: clamp(2rem, 10vw, 2.85rem); }
  .formula-page { width: 112px; font-size: .48rem; }
  .formula-page:nth-child(2) { top: 42%; }
  .formula-page:nth-child(3) { top: 67%; }
  .written-formula { transform: translateX(34px) rotate(calc((.5 - var(--local)) * 4deg)); }
  .ingredient-table { grid-template-columns: 1fr 1fr; }
  .ingredient-card { min-height: 92px; grid-template-columns: 44px 1fr; column-gap: 7px; padding: 8px; }
  .ingredient-card > span { width: 44px; height: 44px; }
  .ingredient-card img { width: 32px; height: 32px; }
  .ingredient-card strong { font-size: .65rem; }
  .ingredient-card small { font-size: .625rem; }
  .brew-interface__header { min-height: 32px; font-size: .45rem; }
  .potion-result { right: 0; bottom: -10px; }
  .potion-pixel { width: 48px; height: 48px; background-size: 48px auto; }
  .drink-potion { left: 0; top: 24%; padding: 7px; }
  .drink-potion strong { max-width: 86px; font-size: .46rem; }
  .ability-reveal { right: 0; top: 26%; padding: 8px; font-size: .46rem; }
  .activity-node { width: 100px; min-height: 48px; font-size: .625rem; }
  .route-1, .route-3, .route-5 { left: 0; }
  .route-2, .route-4, .route-6 { right: 0; }
  .digestion-meter { width: min(210px, 58%); bottom: -4px; }
  .ritual-book img { width: 48px; height: 48px; }
  .ritual-ready { left: 0; top: 18%; }
  .ritual-risk { right: 0; bottom: 14%; }
  .advance-node { padding: 8px; font-size: .625rem; }
  .node-abilities { left: 0; top: 19%; }
  .node-spirituality { top: 31%; }
  .node-madness { right: 0; bottom: 10%; }
  .sequence-shift { top: 0; padding: 5px 8px; }
}

@media (prefers-reduced-motion: reduce), (max-height: 560px) {
  .progression { min-height: auto; padding: clamp(82px, 11vw, 130px) clamp(16px, 4vw, 58px); background: linear-gradient(145deg, #071416, #102724); }
  .progression-sticky { position: relative; height: auto; min-height: 0; overflow: visible; background: transparent; }
  .brewery-backdrop, .scene-grade, .fog-memory, .stage-layout, .stage-nav, .journey-line { display: none; }
  .chapter-heading { position: relative; top: auto; left: auto; width: min(760px, 100%); margin: 0 auto 44px; }
  .chapter-heading h2 { margin-top: 8px; font-size: clamp(2.5rem, 8vw, 5rem); }
  .static-progression { width: min(920px, 100%); display: block; margin: 0 auto; padding: 0; list-style: none; }
  .static-progression li { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: clamp(16px, 4vw, 40px); padding: clamp(27px, 5vw, 48px) 0; border-top: 1px solid rgba(252, 249, 242, .13); }
  .static-progression li > span { color: #dfb968; font: 600 .7rem/1 "IBM Plex Mono", monospace; }
  .static-progression small { color: #70a88e; font: 600 .58rem/1 "IBM Plex Mono", monospace; letter-spacing: .12em; text-transform: uppercase; }
  .static-progression h3 { margin: 10px 0 12px; font: 600 clamp(2rem, 6vw, 3.7rem)/.95 "IBM Plex Sans Condensed", sans-serif; }
  .static-progression p { max-width: 660px; margin: 0; color: rgba(252, 249, 242, .68); line-height: 1.65; }
  .static-progression strong { display: block; margin-top: 15px; color: rgba(252, 249, 242, .72); font: 500 .62rem/1.5 "IBM Plex Mono", monospace; }
  .static-progression ul { display: grid; gap: 10px; margin: 22px 0 0; padding: 0; list-style: none; }
  .static-progression ul li { display: grid; grid-template-columns: minmax(120px, .4fr) 1fr; gap: 12px; padding: 12px 0 0; border-top: 1px solid rgba(252, 249, 242, .1); }
  .static-progression ul b { color: #dfb968; font: 600 .68rem/1.4 "IBM Plex Mono", monospace; }
  .static-progression ul span { color: rgba(252, 249, 242, .7); font-size: .78rem; line-height: 1.5; }
}
</style>
