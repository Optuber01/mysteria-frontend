<template>
  <section
    id="progression"
    ref="section"
    class="progression"
    :class="`stage-${activeIndex}`"
    :style="{
      '--journey': String(progress),
      '--local': String(localProgress),
      '--potion-frame': String(potionFrame),
      '--potion-position': `${(potionFrame / 182) * 100}%`,
      '--potion-sprite': `url(${potionSprite})`,
    }"
    aria-labelledby="progression-title"
  >
    <div class="progression-sticky">
      <div class="brewery-backdrop" aria-hidden="true">
        <img
          :src="assetsReady ? breweryScene : undefined"
          alt=""
          width="2048"
          height="1024"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div class="scene-grade" aria-hidden="true" />
      <div class="scene-depth" aria-hidden="true" />

      <header class="chapter-heading">
        <span>Playable progression</span>
        <h2 id="progression-title">Brew it. Live it. Advance.</h2>
        <p>{{ pathwayName }} Pathway selected</p>
      </header>

      <div class="artifact-stage" aria-hidden="true">
        <div class="workbench-shadow" />

        <div class="recipe-assembly">
          <div class="recipe-aura" />
          <div class="fragment fragment-a">
            <img :src="recipeFragment" alt="" />
          </div>
          <div class="fragment fragment-b">
            <img :src="recipeFragment" alt="" />
          </div>
          <div class="fragment fragment-c">
            <img :src="recipeFragment" alt="" />
          </div>
          <div class="recipe-book">
            <div class="book-cover" />
            <div class="book-page book-page-left" />
            <div class="book-page book-page-right" />
            <img class="recipe-icon" :src="recipeIcon" alt="" />
            <span>{{ pathwayName }}</span>
          </div>
          <div class="blueprint-card">
            <span>Magic Cauldron</span>
            <i v-for="cell in 20" :key="cell" :class="{ filled: blueprintCells.includes(cell) }" />
          </div>
        </div>

        <div class="cauldron-rig">
          <div class="structure-blocks">
            <i
              v-for="(block, index) in structureBlocks"
              :key="index"
              class="structure-block"
              :style="blockStyle(block, index)"
            />
          </div>

          <div class="magic-cauldron">
            <div class="cauldron-lid"><i /></div>
            <div class="cauldron-handle cauldron-handle-left" />
            <div class="cauldron-handle cauldron-handle-right" />
            <div class="cauldron-rim"><i /></div>
            <div class="cauldron-liquid">
              <i class="liquid-sheen" />
              <i class="liquid-ring ring-one" />
              <i class="liquid-ring ring-two" />
            </div>
            <div class="cauldron-body"><i /></div>
            <div class="cauldron-feet"><i /><i /></div>
            <div class="cauldron-fire"><i /><i /><i /></div>
          </div>

          <div class="ingredient-rig">
            <figure
              v-for="(ingredient, index) in ingredients"
              :key="ingredient.label"
              class="ingredient"
              :class="`ingredient-${ingredient.kind}`"
              :style="ingredientStyle(ingredient, index)"
            >
              <span><img :src="ingredient.src" alt="" /></span>
              <figcaption>{{ ingredient.label }}</figcaption>
            </figure>
          </div>

          <div class="cauldron-interface">
            <div class="interface-label"><span>Cauldron interface</span><i>live in-game UI</i></div>
            <img
              :src="assetsReady ? cauldronInterface : undefined"
              alt=""
              width="632"
              height="348"
              loading="lazy"
              decoding="async"
            />
            <div class="slot-key"><span>Main · left</span><span>Recipe · center</span><span>Supplementary · right</span></div>
          </div>
        </div>

        <div class="potion-rig">
          <div class="potion-halo" />
          <div class="potion-bottle">
            <div class="potion-pixel" />
          </div>
          <i class="drink-stream" />
          <div class="brew-confirmation">
            <span>BREW RESULT</span>
            <strong>Sequence potion</strong>
            <i>Expires after 2 real-time days</i>
          </div>
          <div class="block-avatar">
            <i class="avatar-head" />
            <i class="avatar-body" />
            <i class="avatar-arm" />
          </div>
        </div>

        <div class="digestion-rig">
          <div class="digest-figure">
            <i class="digest-head" />
            <i class="digest-body" />
            <i class="digest-core" />
            <i class="digest-wave wave-one" />
            <i class="digest-wave wave-two" />
          </div>
          <div class="acting-prompt">
            <img :src="actingBottle" alt="" />
            <div><span>ACTION BAR</span><strong>Acting opportunity available</strong></div>
          </div>
          <div class="digest-meter">
            <div><span>Digestion</span><strong>{{ digestionValue }}%</strong></div>
            <i><b :style="{ width: `${digestionValue}%` }" /></i>
            <p>Current Sequence methods only</p>
          </div>
        </div>

        <div class="ritual-rig">
          <div class="ritual-plane">
            <i class="ritual-ring ritual-ring-outer" />
            <i class="ritual-ring ritual-ring-inner" />
            <i class="ritual-axis axis-one" />
            <i class="ritual-axis axis-two" />
            <i class="ritual-axis axis-three" />
            <i v-for="anchor in 6" :key="anchor" class="ritual-anchor" :style="anchorStyle(anchor)" />
            <div class="ritual-book"><img :src="ritualBook" alt="" /></div>
            <div class="ritual-potion"><div class="potion-pixel" /></div>
          </div>
          <div class="advance-beam" />
          <div class="sequence-shift"><span>SEQUENCE</span><strong>9</strong><i /><strong>8</strong></div>
        </div>

        <div class="power-rig">
          <div class="power-core"><span>{{ pathwayInitial }}</span><i /></div>
          <div class="power-orbit orbit-one" />
          <div class="power-orbit orbit-two" />
          <div class="power-node node-abilities"><i />Abilities</div>
          <div class="power-node node-spirituality"><i />Spirituality</div>
          <div class="power-node node-acting"><i />Acting</div>
          <div class="power-node node-madness"><i />Madness</div>
          <div class="madness-panel">
            <div><span>MADNESS</span><strong>{{ madnessValue }}%</strong></div>
            <i class="madness-track"><b :style="{ width: `${madnessValue}%` }" /></i>
            <p>Power is something you manage.</p>
          </div>
          <i class="fracture fracture-one" />
          <i class="fracture fracture-two" />
          <i class="fracture fracture-three" />
        </div>
      </div>

      <article :key="activeStage.title" class="stage-copy" aria-live="polite">
        <span>{{ String(activeIndex + 1).padStart(2, '0') }} / {{ String(stages.length).padStart(2, '0') }} · {{ activeStage.kicker }}</span>
        <h3>{{ activeStage.title }}</h3>
        <p>{{ stageCopy(activeStage, activeIndex) }}</p>
        <div class="fact-line"><i />{{ activeStage.fact }}</div>
      </article>

      <nav class="stage-nav" aria-label="Advancement steps">
        <button
          v-for="(stage, index) in stages"
          :key="stage.title"
          type="button"
          :class="{ active: activeIndex === index, complete: activeIndex > index }"
          :aria-current="activeIndex === index ? 'step' : undefined"
          :aria-label="`Step ${index + 1}: ${stage.title}`"
          @click="goToStage(index)"
        >
          <i />
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ stage.short }}</strong>
        </button>
      </nav>

      <div class="journey-line" aria-hidden="true"><i :style="{ width: `${progress * 100}%` }" /></div>
    </div>

    <ol class="static-progression">
      <li v-for="(stage, index) in stages" :key="stage.title">
        <span>{{ String(index + 1).padStart(2, '0') }}</span>
        <div>
          <small>{{ stage.kicker }}</small>
          <h3>{{ stage.title }}</h3>
          <p>{{ stageCopy(stage, index) }}</p>
          <strong>{{ stage.fact }}</strong>
        </div>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useReducedMotion } from '@/composables/useReducedMotion';
import breweryScene from '@/assets/images/home/progression/brewery-scene.webp';
import cauldronInterface from '@/assets/images/home/progression/cauldron-interface.png';
import potionSprite from '@/assets/images/home/progression/potion-sprite.png';
import actingBottle from '@/assets/images/home/progression/acting-bottle.png';
import ritualBook from '@/assets/images/home/progression/ritual-book.png';
import recipeFragment from '@/assets/images/home/progression/recipe-fragment.png';
import ingredientMainOne from '@/assets/images/home/progression/ingredient-main-1.png';
import ingredientMainTwo from '@/assets/images/home/progression/ingredient-main-2.png';
import ingredientSuppOne from '@/assets/images/home/progression/ingredient-supp-1.png';
import ingredientSuppTwo from '@/assets/images/home/progression/ingredient-supp-2.png';
import ingredientSuppThree from '@/assets/images/home/progression/ingredient-supp-3.png';

type Stage = {
  short: string;
  kicker: string;
  title: string;
  copy: string;
  fact: string;
};
type StructureBlock = { x: number; y: number; fromX: number; fromY: number; tone: number };
type Ingredient = { src: string; label: string; kind: 'main' | 'supplementary'; x: number; y: number };

const props = withDefaults(defineProps<{ pathwayName?: string }>(), { pathwayName: 'Abyss' });

const stages: Stage[] = [
  {
    short: 'Recipe',
    kicker: 'Recover the formula',
    title: 'Find the recipe.',
    copy: 'Loot containers can hold a complete recipe or individual pages for main ingredients, supplementary ingredients and the ritual. Collect every subtype, then combine the pages at a crafting table.',
    fact: 'Recipes and Cauldron blueprints are separate discoveries.',
  },
  {
    short: 'Build',
    kicker: 'Make the workstation',
    title: 'Build the Magic Cauldron.',
    copy: 'Place a Cauldron blueprint and follow the chat instructions to assemble its multi-block structure. Crude, Normal and Advanced tiers each raise the chance of a successful brew.',
    fact: 'You assemble the workstation in-world before its interface opens.',
  },
  {
    short: 'Gather',
    kicker: 'Source every component',
    title: 'Gather the formula.',
    copy: 'Bring the recipe’s main and supplementary ingredients in the listed order. Ingredients come from exploration, resource nodes and Beyonder Creatures; Beyonder Chars can replace the main set.',
    fact: 'Main and supplementary ingredients occupy different slot groups.',
  },
  {
    short: 'Brew',
    kicker: 'Order matters',
    title: 'Load it. Then brew.',
    copy: 'Place main ingredients on the left, supplementary ingredients on the right and the recipe in the center. If the order is correct, the finished potion appears in your inventory.',
    fact: 'A failed brew leaves the ingredients in place and creates no potion.',
  },
  {
    short: 'Drink',
    kicker: 'Commit to the Pathway',
    title: 'Drink the potion.',
    copy: 'Drinking your first Sequence 9 potion makes you a Beyonder and unlocks the Pathway’s abilities. Your inventory gains its Pathway icon so your state is always visible in-game.',
    fact: 'The first Sequence 9 potion needs no ritual and adds no ritual Madness.',
  },
  {
    short: 'Digest',
    kicker: 'Progress through play',
    title: 'Act to digest.',
    copy: 'Perform actions tied to your current Sequence when the action bar signals an opportunity. Passive play, bounties, acting bottles, dungeons and Cosmos Incursions add other routes to digestion.',
    fact: 'Casting spells alone does not count, and no single source reaches 100%.',
  },
  {
    short: 'Advance',
    kicker: 'Meet the next condition',
    title: 'Complete your ritual.',
    copy: 'Your ritual is personal and usually appears as an advancement. It is optional—with Madness costs—for Sequences 8 through 6, and required from Sequence 5 onward.',
    fact: 'Advance only when your acting, ritual and next potion are ready.',
  },
  {
    short: 'Control',
    kicker: 'Carry the power',
    title: 'Gain more. Manage more.',
    copy: 'Each advance expands your Pathway toolkit. Abilities spend Spirituality, while reckless use, unsafe switches and incomplete advancement add Madness that can slow recovery and lock spells.',
    fact: 'At 100% Madness, Mutation permanently removes Beyonder powers.',
  },
];

const blueprintCells = [2, 4, 7, 8, 9, 12, 13, 14, 17, 19];
const structureBlocks: StructureBlock[] = [
  { x: -132, y: 94, fromX: -270, fromY: 160, tone: 0 },
  { x: -88, y: 94, fromX: -220, fromY: -170, tone: 1 },
  { x: -44, y: 94, fromX: -110, fromY: 220, tone: 2 },
  { x: 0, y: 94, fromX: 40, fromY: -250, tone: 0 },
  { x: 44, y: 94, fromX: 160, fromY: 190, tone: 1 },
  { x: 88, y: 94, fromX: 230, fromY: -130, tone: 2 },
  { x: 132, y: 94, fromX: 300, fromY: 150, tone: 0 },
  { x: -132, y: 50, fromX: -280, fromY: -40, tone: 1 },
  { x: 132, y: 50, fromX: 280, fromY: -80, tone: 2 },
  { x: -110, y: 6, fromX: -230, fromY: -200, tone: 0 },
  { x: 110, y: 6, fromX: 250, fromY: 210, tone: 1 },
  { x: -88, y: -38, fromX: -160, fromY: -220, tone: 2 },
  { x: 88, y: -38, fromX: 150, fromY: -220, tone: 0 },
];

const ingredients: Ingredient[] = [
  { src: ingredientMainOne, label: 'Main · 01', kind: 'main', x: -260, y: -126 },
  { src: ingredientMainTwo, label: 'Main · 02', kind: 'main', x: -220, y: 80 },
  { src: ingredientSuppOne, label: 'Supplement · 01', kind: 'supplementary', x: 246, y: -136 },
  { src: ingredientSuppTwo, label: 'Supplement · 02', kind: 'supplementary', x: 278, y: 22 },
  { src: ingredientSuppThree, label: 'Supplement · 03', kind: 'supplementary', x: 218, y: 145 },
];

const recipeFiles = import.meta.glob('/src/assets/images/home/progression/recipes/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const pathwayRecipeNames: Record<string, string> = {
  abyss: 'abyss',
  'black emperor': 'emperor',
  chained: 'chained',
  darkness: 'darkness',
  death: 'death',
  demoness: 'demoness',
  door: 'door',
  error: 'error',
  fool: 'fool',
  'hanged man': 'hanged',
  hermit: 'hermit',
  justiciar: 'justiciar',
  moon: 'moon',
  mother: 'mother',
  paragon: 'paragon',
  'red priest': 'priest',
  sun: 'sun',
  'twilight giant': 'giant',
  tyrant: 'tyrant',
  visionary: 'visionary',
  'wheel of fortune': 'fortune',
  'white tower': 'tower',
};

const section = ref<HTMLElement | null>(null);
const progress = ref(0);
const activeIndex = ref(0);
const localProgress = ref(0);
const reducedMotion = useReducedMotion();
let observer: IntersectionObserver | null = null;
let visible = false;
const assetsReady = ref(false);
let frame = 0;

const activeStage = computed(() => stages[activeIndex.value]);
const pathwayInitial = computed(() => props.pathwayName.trim().charAt(0).toUpperCase() || 'M');
const recipeIcon = computed(() => {
  const file = pathwayRecipeNames[props.pathwayName.trim().toLowerCase()] ?? 'abyss';
  return Object.entries(recipeFiles).find(([path]) => path.endsWith(`/${file}.png`))?.[1]
    ?? Object.values(recipeFiles)[0];
});
const potionFrame = computed(() => Math.min(182, Math.round((progress.value * 118 + activeIndex.value * 8) % 183)));
const digestionValue = computed(() => activeIndex.value < 5 ? 0 : activeIndex.value > 5 ? 100 : Math.round(18 + localProgress.value * 82));
const madnessValue = computed(() => activeIndex.value < 7 ? 8 : Math.round(8 + localProgress.value * 46));

function stageCopy(stage: Stage, index: number) {
  return index === 4
    ? `Drinking your first Sequence 9 ${props.pathwayName} potion makes you a Beyonder and unlocks the Pathway’s abilities. Your inventory gains its Pathway icon so your state is always visible in-game.`
    : stage.copy;
}

function ease(value: number) {
  const clamped = Math.min(1, Math.max(0, value));
  return 1 - Math.pow(1 - clamped, 3);
}

function blockStyle(block: StructureBlock, index: number) {
  const isBuilt = activeIndex.value > 1;
  const build = isBuilt ? 1 : activeIndex.value === 1 ? ease(localProgress.value * 1.55 - index * 0.045) : 0;
  const x = block.fromX + (block.x - block.fromX) * build;
  const y = block.fromY + (block.y - block.fromY) * build;
  return {
    '--tone': String(block.tone),
    opacity: String(activeIndex.value === 0 ? 0 : Math.max(0, Math.min(1, build * 1.7))),
    transform: `translate3d(${x}px, ${y}px, 0) rotateX(58deg) rotateZ(45deg) scale(${0.72 + build * 0.28})`,
  };
}

function ingredientStyle(ingredient: Ingredient, index: number) {
  if (activeIndex.value < 2 || activeIndex.value > 3) return { opacity: '0' };
  const arrive = activeIndex.value === 2 ? ease(localProgress.value * 1.45 - index * 0.08) : 1;
  const brew = activeIndex.value === 3 ? ease(localProgress.value * 1.7 - index * 0.08) : 0;
  const slotX = ingredient.kind === 'main' ? -158 + index * 28 : 110 + (index - 2) * 28;
  const slotY = -6 + (index % 2) * 34;
  const x = ingredient.x + (slotX - ingredient.x) * arrive + (0 - slotX) * brew;
  const y = ingredient.y + (slotY - ingredient.y) * arrive + (18 - slotY) * brew;
  const scale = 0.86 + arrive * 0.14 - brew * 0.6;
  return {
    opacity: String(Math.max(0, 1 - brew * 1.28)),
    transform: `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${(1 - arrive) * (index % 2 ? 18 : -16) + brew * 40}deg)`,
  };
}

function anchorStyle(anchor: number) {
  const angle = (anchor - 1) * 60;
  return {
    '--anchor-angle': `${angle}deg`,
    '--anchor-angle-negative': `${-angle}deg`,
    '--anchor-delay': String((anchor - 1) * 0.06),
  };
}

function update() {
  if (!visible || !section.value || reducedMotion.value || frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const rect = section.value?.getBoundingClientRect();
    if (!rect) return;
    const range = Math.max(1, rect.height - innerHeight);
    const next = Math.min(1, Math.max(0, -rect.top / range));
    const scaled = Math.min(stages.length - 0.0001, next * stages.length);
    progress.value = next;
    activeIndex.value = Math.floor(scaled);
    localProgress.value = scaled - Math.floor(scaled);
  });
}

function goToStage(index: number) {
  if (!section.value) return;
  activeIndex.value = index;
  localProgress.value = 0.22;
  progress.value = (index + 0.22) / stages.length;
  if (reducedMotion.value) return;
  const range = section.value.offsetHeight - innerHeight;
  const top = section.value.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: top + range * progress.value, behavior: 'smooth' });
}

onMounted(() => {
  observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) {
      assetsReady.value = true;
      update();
    }
  }, { rootMargin: '80px 0px' });
  if (section.value) observer.observe(section.value);
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
  --ease-out: cubic-bezier(.22, 1, .36, 1);
  position: relative;
  min-height: 760svh;
  color: #fcf9f2;
  background: #071316;
  isolation: isolate;
}

.progression-sticky {
  position: sticky;
  top: 0;
  height: 100svh;
  min-height: 660px;
  overflow: hidden;
  background: #0b191b;
}

.brewery-backdrop,
.scene-grade,
.scene-depth {
  position: absolute;
  inset: 0;
}

.brewery-backdrop {
  transform: scale(calc(1.055 + var(--journey) * .16)) translate3d(calc((.5 - var(--journey)) * 2.5%), calc(var(--journey) * -3%), 0);
  transform-origin: 52% 58%;
  will-change: transform;
}

.brewery-backdrop img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 58%;
  filter: saturate(.68) contrast(1.08) brightness(.44);
}

.scene-grade {
  z-index: 1;
  background:
    linear-gradient(90deg, rgba(3, 12, 14, .88) 0%, rgba(3, 12, 14, .35) 38%, rgba(3, 12, 14, .24) 66%, rgba(3, 12, 14, .72) 100%),
    linear-gradient(180deg, rgba(2, 9, 11, .72), transparent 28%, transparent 68%, rgba(2, 9, 11, .9)),
    radial-gradient(circle at 51% 52%, rgba(198, 155, 82, .12), transparent 36%);
  transition: background .8s var(--ease-out);
}

.stage-4 .scene-grade,
.stage-5 .scene-grade {
  background:
    linear-gradient(90deg, rgba(4, 15, 17, .9), rgba(5, 19, 20, .34) 52%, rgba(4, 14, 17, .72)),
    radial-gradient(circle at 54% 46%, rgba(47, 125, 103, .34), transparent 33%),
    linear-gradient(180deg, rgba(2, 9, 11, .72), transparent 34%, rgba(2, 9, 11, .86));
}

.stage-6 .scene-grade,
.stage-7 .scene-grade {
  background:
    linear-gradient(90deg, rgba(2, 10, 12, .92), rgba(4, 17, 18, .55) 52%, rgba(3, 12, 15, .88)),
    radial-gradient(circle at 54% 52%, rgba(198, 155, 82, .24), transparent 36%),
    linear-gradient(180deg, rgba(2, 8, 10, .78), transparent 34%, rgba(2, 8, 10, .9));
}

.scene-depth {
  z-index: 2;
  opacity: .34;
  background:
    repeating-linear-gradient(90deg, transparent 0 99px, rgba(255, 255, 255, .025) 100px),
    repeating-linear-gradient(0deg, transparent 0 99px, rgba(255, 255, 255, .02) 100px);
  mask-image: radial-gradient(circle at 52% 52%, #000 0 36%, transparent 75%);
}

.chapter-heading {
  position: absolute;
  z-index: 20;
  top: clamp(72px, 9vh, 98px);
  left: clamp(22px, 4vw, 64px);
  display: grid;
  gap: 6px;
}

.chapter-heading span,
.stage-copy > span {
  color: #dfb968;
  font: 650 .66rem/1 "IBM Plex Mono", monospace;
  letter-spacing: .16em;
  text-transform: uppercase;
}

.chapter-heading h2 {
  margin: 0;
  color: rgba(252, 249, 242, .9);
  font: 600 clamp(1.1rem, 1.6vw, 1.45rem)/1 "IBM Plex Sans Condensed", sans-serif;
  letter-spacing: -.02em;
}

.chapter-heading p {
  margin: 2px 0 0;
  color: rgba(252, 249, 242, .72);
  font: 500 .62rem/1 "IBM Plex Mono", monospace;
}

.artifact-stage {
  position: absolute;
  z-index: 5;
  top: 49%;
  left: 55%;
  width: min(62vw, 880px);
  height: min(70vh, 700px);
  transform: translate(-50%, -50%);
  perspective: 1100px;
}

.workbench-shadow {
  position: absolute;
  left: 50%;
  bottom: 7%;
  width: 64%;
  height: 18%;
  border-radius: 50%;
  opacity: .68;
  background: radial-gradient(ellipse, rgba(0, 0, 0, .72), transparent 68%);
  transform: translateX(-50%);
  filter: blur(12px);
}

.recipe-assembly,
.cauldron-rig,
.potion-rig,
.digestion-rig,
.ritual-rig,
.power-rig {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.recipe-assembly {
  opacity: 0;
  transform: translateY(20px) scale(.9);
  transition: opacity .45s var(--ease-out), transform .7s var(--ease-out);
}

.stage-0 .recipe-assembly {
  opacity: 1;
  transform: translateY(calc((.5 - var(--local)) * 20px)) scale(calc(.92 + var(--local) * .08));
}

.stage-1 .recipe-assembly {
  opacity: calc(.62 - var(--local) * .62);
  transform: translate3d(-34%, -28%, 0) scale(.48) rotate(-7deg);
}

.recipe-aura {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 360px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(198, 155, 82, .24), rgba(33, 100, 77, .12) 46%, transparent 72%);
  transform: translate(-50%, -50%) scale(calc(.72 + var(--local) * .28));
  filter: blur(12px);
}

.recipe-book {
  position: absolute;
  top: 46%;
  left: 50%;
  width: 280px;
  height: 190px;
  transform: translate(-50%, -50%) rotateX(53deg) rotateZ(-7deg);
  transform-style: preserve-3d;
  filter: drop-shadow(0 34px 26px rgba(0, 0, 0, .56));
}

.book-cover,
.book-page {
  position: absolute;
  inset: 0;
  border-radius: 9px 18px 18px 9px;
}

.book-cover {
  background: linear-gradient(145deg, #5c281e, #2b1514 66%);
  border: 3px solid rgba(221, 166, 89, .58);
  transform: translateZ(-12px) translate(5px, 9px);
}

.book-page {
  width: 50%;
  border: 1px solid rgba(112, 67, 42, .25);
  background:
    repeating-linear-gradient(180deg, transparent 0 15px, rgba(79, 53, 35, .12) 16px),
    linear-gradient(145deg, #f6e2b9, #d6b57f);
  box-shadow: inset 0 0 24px rgba(105, 61, 34, .18);
}

.book-page-left { left: 0; border-radius: 14px 4px 4px 14px; transform: rotateY(calc(-5deg - var(--local) * 8deg)); transform-origin: right; }
.book-page-right { right: 0; left: auto; border-radius: 4px 14px 14px 4px; transform: rotateY(calc(5deg + var(--local) * 8deg)); transform-origin: left; }

.recipe-icon {
  position: absolute;
  z-index: 2;
  top: 48%;
  right: 18%;
  width: 64px;
  height: 64px;
  object-fit: contain;
  image-rendering: pixelated;
  transform: translateY(-50%) translateZ(8px) scale(1.35);
  filter: drop-shadow(0 8px 4px rgba(61, 23, 15, .32));
}

.recipe-book > span {
  position: absolute;
  z-index: 2;
  top: 40%;
  left: 8%;
  width: 34%;
  color: #5e2c21;
  font: 700 .64rem/1.25 "IBM Plex Mono", monospace;
  letter-spacing: .08em;
  text-align: center;
  text-transform: uppercase;
  transform: translateZ(7px);
}

.fragment {
  position: absolute;
  top: 48%;
  left: 50%;
  width: 64px;
  height: 64px;
  padding: 12px;
  border: 1px solid rgba(224, 185, 104, .34);
  border-radius: 14px;
  background: rgba(8, 24, 25, .76);
  box-shadow: 0 16px 30px rgba(0, 0, 0, .34);
}

.fragment img { width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated; }
.fragment-a { transform: translate(-300px, -150px) rotate(-12deg) translateY(calc(var(--local) * 32px)); }
.fragment-b { transform: translate(250px, -92px) rotate(10deg) translateY(calc(var(--local) * -20px)); }
.fragment-c { transform: translate(224px, 124px) rotate(-5deg) translateY(calc(var(--local) * 28px)); }

.blueprint-card {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 156px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  padding: 38px 15px 15px;
  border: 1px solid rgba(125, 180, 173, .35);
  border-radius: 9px;
  opacity: calc(.1 + var(--local) * .9);
  background: rgba(8, 31, 32, .86);
  transform: translate(-286px, 95px) rotate(8deg);
}

.blueprint-card span {
  position: absolute;
  top: 14px;
  left: 15px;
  color: rgba(197, 224, 214, .78);
  font: 600 .52rem/1 "IBM Plex Mono", monospace;
  text-transform: uppercase;
}

.blueprint-card i { aspect-ratio: 1; border: 1px solid rgba(120, 184, 174, .25); }
.blueprint-card i.filled { background: rgba(112, 186, 167, .52); box-shadow: inset -4px -4px rgba(9, 49, 45, .4); }

.cauldron-rig {
  opacity: 0;
  transform: scale(.86) translateY(34px);
  transition: opacity .35s var(--ease-out), transform .65s var(--ease-out);
}

.stage-1 .cauldron-rig,
.stage-2 .cauldron-rig,
.stage-3 .cauldron-rig {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.stage-4 .cauldron-rig {
  opacity: calc(.5 - var(--local) * .5);
  transform: translate3d(-17%, 26%, 0) scale(.58);
}

.structure-blocks,
.magic-cauldron {
  position: absolute;
  top: 49%;
  left: 50%;
}

.structure-block {
  position: absolute;
  width: 52px;
  height: 52px;
  margin: -26px;
  border: 1px solid rgba(255, 231, 183, .14);
  border-radius: 3px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, .12), transparent 42%),
    hsl(calc(32 + var(--tone) * 8) 22% calc(22% + var(--tone) * 3%));
  box-shadow: inset -12px -12px rgba(0, 0, 0, .2), 0 13px 18px rgba(0, 0, 0, .28);
  will-change: transform;
}

.magic-cauldron {
  width: 320px;
  height: 300px;
  transform: translate(-50%, -50%);
  transform-style: preserve-3d;
}

.cauldron-body {
  position: absolute;
  z-index: 4;
  top: 104px;
  left: 51px;
  width: 218px;
  height: 135px;
  overflow: hidden;
  border: 2px solid rgba(226, 211, 181, .14);
  border-radius: 12px 12px 78px 78px;
  background: linear-gradient(100deg, #1c2523 0%, #4d5650 23%, #202a28 56%, #101818 100%);
  box-shadow: inset 0 -24px 34px rgba(0, 0, 0, .54), 0 34px 42px rgba(0, 0, 0, .52);
  clip-path: polygon(2% 0, 98% 0, 87% 77%, 67% 100%, 33% 100%, 13% 77%);
}

.cauldron-body i {
  position: absolute;
  inset: 14px 18px 22px;
  border-radius: 0 0 60px 60px;
  border: 1px solid rgba(198, 155, 82, .18);
  background: repeating-linear-gradient(90deg, transparent 0 34px, rgba(255, 255, 255, .025) 35px);
}

.cauldron-rim,
.cauldron-liquid {
  position: absolute;
  z-index: 7;
  top: 75px;
  left: 37px;
  width: 246px;
  height: 76px;
  border-radius: 50%;
}

.cauldron-rim {
  border: 12px solid #222c2a;
  box-shadow: inset 0 7px #535d55, inset 0 -8px #0b1111, 0 10px 10px rgba(0, 0, 0, .4);
}

.cauldron-rim i { position: absolute; inset: -7px; border-radius: 50%; border: 1px solid rgba(215, 181, 112, .18); }

.cauldron-liquid {
  z-index: 6;
  top: 91px;
  left: 49px;
  width: 222px;
  height: 53px;
  overflow: hidden;
  opacity: .16;
  background: radial-gradient(ellipse at 48% 43%, #b9e0c9 0 6%, #4e9f80 31%, #123d35 76%);
  box-shadow: 0 0 28px rgba(71, 160, 127, .18);
  transform: scale(calc(.82 + var(--local) * .18));
  transition: opacity .3s;
}

.stage-2 .cauldron-liquid { opacity: .32; }
.stage-3 .cauldron-liquid { opacity: calc(.62 + var(--local) * .3); box-shadow: 0 0 calc(28px + var(--local) * 40px) rgba(89, 189, 147, .48); }

.liquid-sheen { position: absolute; top: 10px; left: 30px; width: 86px; height: 10px; border-radius: 50%; background: rgba(232, 255, 240, .46); filter: blur(2px); }
.liquid-ring { position: absolute; border: 1px solid rgba(229, 241, 220, .48); border-radius: 50%; transform: scale(calc(.2 + var(--local) * .9)); opacity: calc(1 - var(--local)); }
.ring-one { inset: 8px 36px; }
.ring-two { inset: 15px 64px; transform: scale(calc(.15 + var(--local) * .75)); }

.cauldron-lid {
  position: absolute;
  z-index: 8;
  top: 65px;
  left: 54px;
  width: 212px;
  height: 63px;
  border-radius: 50%;
  opacity: .42;
  background: linear-gradient(180deg, #56605a, #1b2423 74%);
  border: 2px solid rgba(224, 211, 178, .15);
  transform-origin: 82% 54%;
  transform: translateY(-18px) rotate(-4deg);
  transition: transform .7s var(--ease-out), opacity .3s;
}

.cauldron-lid i { position: absolute; top: -20px; left: 88px; width: 38px; height: 27px; border-radius: 9px 9px 3px 3px; background: #303a36; box-shadow: inset 6px 5px rgba(255, 255, 255, .06); }
.stage-2 .cauldron-lid { opacity: .58; transform: translate3d(50px, -67px, 0) rotate(-24deg); }
.stage-3 .cauldron-lid { opacity: .38; transform: translate3d(72px, -88px, 0) rotate(-39deg); }

.cauldron-handle { position: absolute; z-index: 3; top: 120px; width: 60px; height: 74px; border: 12px solid #1a2322; border-radius: 48%; }
.cauldron-handle-left { left: 19px; }
.cauldron-handle-right { right: 19px; }
.cauldron-feet { position: absolute; z-index: 3; top: 220px; left: 76px; right: 76px; display: flex; justify-content: space-between; }
.cauldron-feet i { width: 38px; height: 41px; border-radius: 3px 3px 9px 9px; background: #161e1d; transform: skew(-7deg); }
.cauldron-feet i:last-child { transform: skew(7deg); }

.cauldron-fire {
  position: absolute;
  z-index: 2;
  top: 237px;
  left: 93px;
  width: 134px;
  height: 50px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
  opacity: 0;
  transition: opacity .3s;
}

.stage-3 .cauldron-fire { opacity: 1; }
.cauldron-fire i { width: 31px; height: calc(26px + var(--local) * 20px); border-radius: 24px 2px 24px 3px; background: linear-gradient(40deg, #c36c22, #f5cd68 70%, #fff0b5); transform: rotate(8deg) scaleX(calc(.8 + var(--local) * .18)); filter: drop-shadow(0 0 8px rgba(235, 148, 48, .6)); }
.cauldron-fire i:nth-child(2) { height: calc(42px + var(--local) * 7px); transform: rotate(-5deg); }

.ingredient-rig { position: absolute; inset: 0; }
.ingredient { position: absolute; z-index: 14; top: 49%; left: 50%; width: 84px; margin: -42px; text-align: center; will-change: transform; }
.ingredient > span { width: 72px; height: 72px; display: grid; place-items: center; margin: auto; border: 1px solid rgba(235, 222, 190, .16); border-radius: 18px; background: rgba(7, 22, 23, .84); box-shadow: 0 18px 34px rgba(0, 0, 0, .36), inset 0 0 24px rgba(92, 157, 133, .08); }
.ingredient img { width: 46px; height: 46px; object-fit: contain; image-rendering: pixelated; filter: drop-shadow(0 7px 3px rgba(0, 0, 0, .32)); }
.ingredient figcaption { margin-top: 9px; color: rgba(252, 249, 242, .6); font: 600 .54rem/1 "IBM Plex Mono", monospace; letter-spacing: .06em; text-transform: uppercase; }
.ingredient-main > span { border-color: rgba(196, 100, 74, .5); }
.ingredient-supplementary > span { border-color: rgba(88, 148, 190, .5); }

.cauldron-interface {
  position: absolute;
  z-index: 16;
  top: 49%;
  right: -7%;
  width: min(390px, 40vw);
  overflow: hidden;
  border: 1px solid rgba(231, 213, 176, .15);
  border-radius: 18px;
  opacity: 0;
  background: rgba(7, 18, 19, .88);
  box-shadow: 0 30px 80px rgba(0, 0, 0, .58);
  transform: translate3d(65px, -50%, 0) rotateY(-8deg) scale(.92);
  transition: opacity .48s var(--ease-out), transform .7s var(--ease-out);
}

.stage-2 .cauldron-interface { opacity: calc(var(--local) * .9); transform: translate3d(0, -50%, 0) rotateY(-6deg) scale(.94); }
.stage-3 .cauldron-interface { opacity: calc(.8 - var(--local) * .8); transform: translate3d(calc(var(--local) * 35px), -50%, 0) rotateY(-5deg) scale(.95); }
.interface-label { min-height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; }
.interface-label span,
.interface-label i { color: rgba(252, 249, 242, .64); font: 600 .52rem/1 "IBM Plex Mono", monospace; letter-spacing: .08em; text-transform: uppercase; }
.interface-label i { color: #69a88c; font-style: normal; }
.cauldron-interface > img { display: block; width: 100%; height: auto; image-rendering: pixelated; }
.slot-key { min-height: 48px; display: grid; grid-template-columns: 1fr .9fr 1.35fr; align-items: center; gap: 5px; padding: 0 12px; color: rgba(252, 249, 242, .48); font: 500 .44rem/1.2 "IBM Plex Mono", monospace; text-transform: uppercase; }
.slot-key span:first-child { color: #dd7665; }
.slot-key span:nth-child(2) { color: #e2c154; }
.slot-key span:last-child { color: #72aee2; }

.potion-rig { opacity: 0; transition: opacity .38s var(--ease-out); }
.stage-3 .potion-rig { opacity: calc(var(--local) * 1.4); }
.stage-4 .potion-rig { opacity: 1; }
.stage-5 .potion-rig { opacity: calc(.38 - var(--local) * .38); }
.potion-halo { position: absolute; top: 48%; left: 50%; width: 340px; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle, rgba(105, 194, 159, .32), rgba(198, 155, 82, .1) 42%, transparent 70%); transform: translate(-50%, -50%) scale(calc(.64 + var(--local) * .28)); filter: blur(8px); }
.potion-bottle { position: absolute; z-index: 8; top: 48%; left: 50%; width: 128px; height: 128px; transform: translate(-50%, -50%) scale(.62); transition: transform .35s var(--ease-out); transform-origin: 68% 35%; }
.stage-3 .potion-bottle { transform: translate(-50%, calc(-50% + (1 - var(--local)) * 100px)) scale(calc(.42 + var(--local) * .56)); }
.stage-4 .potion-bottle { transform: translate(calc(-50% - var(--local) * 78px), calc(-50% - var(--local) * 58px)) rotate(calc(var(--local) * -68deg)) scale(calc(1 + var(--local) * .08)); }
.potion-pixel { width: 100%; height: 100%; background-image: var(--potion-sprite); background-repeat: no-repeat; background-size: 100% 18300%; background-position: center var(--potion-position); image-rendering: pixelated; filter: drop-shadow(0 18px 12px rgba(0, 0, 0, .42)) drop-shadow(0 0 16px rgba(85, 194, 154, .44)); }
.drink-stream { position: absolute; z-index: 6; top: 43%; left: 43%; width: 7px; height: calc(var(--local) * 78px); border-radius: 999px; opacity: var(--local); background: linear-gradient(#8ac7aa, rgba(124, 197, 163, 0)); transform: rotate(-26deg); transform-origin: top; }

.brew-confirmation {
  position: absolute;
  top: 49%;
  left: calc(50% + 126px);
  width: 182px;
  display: grid;
  gap: 7px;
  padding: 16px 18px;
  border: 1px solid rgba(223, 185, 104, .24);
  border-radius: 15px;
  opacity: 0;
  background: rgba(7, 23, 23, .76);
  transform: translateY(-50%);
}

.stage-3 .brew-confirmation { opacity: calc(var(--local) * 1.2); }
.stage-4 .brew-confirmation { opacity: calc(1 - var(--local) * 1.3); }
.brew-confirmation span { color: #dfb968; font: 600 .5rem/1 "IBM Plex Mono", monospace; letter-spacing: .12em; }
.brew-confirmation strong { font: 600 1.15rem/1 "IBM Plex Sans Condensed", sans-serif; }
.brew-confirmation i { color: rgba(252, 249, 242, .48); font: 500 .52rem/1.4 "IBM Plex Mono", monospace; font-style: normal; }

.block-avatar {
  position: absolute;
  z-index: 3;
  top: 37%;
  left: 61%;
  width: 180px;
  height: 280px;
  opacity: 0;
  transform: translateY(24px) scale(.9);
  transition: opacity .45s, transform .7s var(--ease-out);
}

.stage-4 .block-avatar { opacity: calc(var(--local) * 1.5); transform: translateY(0) scale(1); }
.avatar-head { position: absolute; top: 0; left: 51px; width: 78px; height: 78px; border-radius: 6px; background: linear-gradient(135deg, #b59a7d, #715c50); box-shadow: inset -14px -12px rgba(22, 25, 24, .18), 0 14px 20px rgba(0, 0, 0, .28); }
.avatar-head::before { content: ""; position: absolute; top: 33px; left: 13px; width: 15px; height: 7px; background: #152321; box-shadow: 36px 0 #152321; }
.avatar-body { position: absolute; top: 81px; left: 31px; width: 118px; height: 149px; border-radius: 5px 5px 15px 15px; background: linear-gradient(110deg, #224c42, #0d2726 70%); box-shadow: inset -22px 0 rgba(0, 0, 0, .18); }
.avatar-arm { position: absolute; top: 100px; left: -4px; width: 50px; height: 130px; border-radius: 8px; background: #183b35; transform: rotate(-8deg); }

.digestion-rig { opacity: 0; transform: scale(.84); transition: opacity .42s, transform .65s var(--ease-out); }
.stage-5 .digestion-rig { opacity: 1; transform: scale(1); }
.stage-6 .digestion-rig { opacity: calc(.35 - var(--local) * .35); transform: scale(.72); }
.digest-figure { position: absolute; top: 46%; left: 50%; width: 250px; height: 390px; transform: translate(-50%, -50%); }
.digest-head { position: absolute; top: 0; left: 88px; width: 74px; height: 74px; border-radius: 6px; background: rgba(54, 111, 91, .38); border: 1px solid rgba(157, 215, 182, .32); }
.digest-body { position: absolute; top: 84px; left: 45px; width: 160px; height: 252px; border-radius: 10px 10px 52px 52px; border: 1px solid rgba(157, 215, 182, .22); background: linear-gradient(90deg, rgba(26, 72, 61, .2), rgba(54, 118, 95, .35), rgba(18, 51, 46, .18)); clip-path: polygon(20% 0, 80% 0, 100% 18%, 83% 100%, 17% 100%, 0 18%); }
.digest-core { position: absolute; z-index: 3; top: 152px; left: 94px; width: 62px; height: 62px; border: 1px solid #dfb968; border-radius: 50%; background: radial-gradient(circle, rgba(228, 201, 136, .88), rgba(57, 139, 104, .66) 35%, rgba(10, 39, 36, .8) 72%); transform: scale(calc(.64 + var(--local) * .36)); box-shadow: 0 0 calc(18px + var(--local) * 35px) rgba(112, 204, 164, .54); }
.digest-wave { position: absolute; z-index: 2; top: 132px; left: 73px; width: 104px; height: 104px; border: 1px solid rgba(205, 229, 211, .46); border-radius: 50%; opacity: calc(1 - var(--local)); transform: scale(calc(.45 + var(--local) * .8)); }
.wave-two { opacity: calc(.7 - var(--local) * .7); transform: scale(calc(.85 + var(--local) * .72)); }

.acting-prompt {
  position: absolute;
  top: 34%;
  right: 2%;
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 278px;
  padding: 12px 18px 12px 12px;
  border: 1px solid rgba(128, 199, 169, .28);
  border-radius: 14px;
  background: rgba(7, 23, 24, .82);
  box-shadow: 0 20px 50px rgba(0, 0, 0, .34);
  transform: translateX(calc((1 - var(--local)) * 42px));
}

.acting-prompt img { width: 56px; height: 56px; object-fit: contain; image-rendering: pixelated; }
.acting-prompt div { display: grid; gap: 6px; }
.acting-prompt span { color: #67a88c; font: 600 .52rem/1 "IBM Plex Mono", monospace; letter-spacing: .12em; }
.acting-prompt strong { font-size: .72rem; }
.digest-meter { position: absolute; right: 2%; bottom: 19%; width: 278px; padding: 17px; border: 1px solid rgba(252, 249, 242, .12); border-radius: 14px; background: rgba(6, 19, 20, .75); }
.digest-meter > div { display: flex; justify-content: space-between; font: 600 .62rem/1 "IBM Plex Mono", monospace; }
.digest-meter > i,
.madness-track { display: block; height: 5px; margin-top: 13px; overflow: hidden; border-radius: 999px; background: rgba(252, 249, 242, .1); }
.digest-meter b { display: block; height: 100%; background: linear-gradient(90deg, #3f8d6f, #b8d6bd); transition: width .08s linear; }
.digest-meter p { margin: 10px 0 0; color: rgba(252, 249, 242, .72); font: 500 .52rem/1.4 "IBM Plex Mono", monospace; }

.ritual-rig { opacity: 0; transform: translateY(45px) scale(.72); transition: opacity .45s, transform .7s var(--ease-out); }
.stage-6 .ritual-rig { opacity: 1; transform: translateY(0) scale(1); }
.stage-7 .ritual-rig { opacity: calc(.38 - var(--local) * .38); transform: translateY(-40px) scale(1.18); }
.ritual-plane { position: absolute; top: 49%; left: 50%; width: 430px; height: 430px; transform: translate(-50%, -50%) rotateX(62deg) rotateZ(calc(-14deg + var(--local) * 20deg)); transform-style: preserve-3d; }
.ritual-ring { position: absolute; border-radius: 50%; opacity: calc(.3 + var(--local) * .7); background: conic-gradient(from 0deg, #c69b52 calc(var(--local) * 75%), rgba(198, 155, 82, .1) 0); mask: radial-gradient(transparent 0 68%, #000 69% 72%, transparent 73%); }
.ritual-ring-outer { inset: 0; }
.ritual-ring-inner { inset: 74px; background: conic-gradient(from 180deg, #79b296 calc(var(--local) * 92%), rgba(121, 178, 150, .08) 0); mask: radial-gradient(transparent 0 64%, #000 65% 69%, transparent 70%); }
.ritual-axis { position: absolute; top: 50%; left: 50%; width: 360px; height: 1px; opacity: calc(.2 + var(--local) * .65); background: linear-gradient(90deg, transparent, rgba(221, 185, 105, .82), transparent); transform: translate(-50%, -50%) rotate(0); }
.axis-two { transform: translate(-50%, -50%) rotate(60deg); }
.axis-three { transform: translate(-50%, -50%) rotate(120deg); }
.ritual-anchor { --distance: 197px; position: absolute; top: calc(50% - 14px); left: calc(50% - 14px); width: 28px; height: 28px; border: 1px solid rgba(225, 193, 123, .72); border-radius: 5px; opacity: clamp(0, calc((var(--local) - var(--anchor-delay)) * 3), 1); background: #183c35; box-shadow: 0 0 18px rgba(198, 155, 82, .24); transform: rotate(var(--anchor-angle)) translateX(var(--distance)) rotate(var(--anchor-angle-negative)) scale(clamp(.4, var(--local), 1)); }
.ritual-book { position: absolute; top: 50%; left: 50%; width: 78px; height: 78px; transform: translate(-50%, -50%) rotateX(-62deg) translateZ(18px); }
.ritual-book img { width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated; filter: drop-shadow(0 8px 6px rgba(0, 0, 0, .45)); }
.ritual-potion { position: absolute; top: 50%; left: 50%; width: 78px; height: 78px; transform: translate(-50%, -50%) rotateX(-62deg) translateZ(102px) scale(calc(.35 + var(--local) * .65)); }
.advance-beam { position: absolute; top: 8%; bottom: 8%; left: 50%; width: calc(2px + var(--local) * 12px); border-radius: 50%; opacity: clamp(0, calc((var(--local) - .55) * 2.4), 1); background: linear-gradient(transparent, rgba(243, 220, 164, .94) 38%, #effff6 51%, rgba(78, 166, 130, .7) 68%, transparent); transform: translateX(-50%); filter: blur(calc(var(--local) * 2px)) drop-shadow(0 0 22px rgba(207, 179, 107, .8)); }
.sequence-shift { position: absolute; top: 12%; left: 50%; display: flex; align-items: center; gap: 10px; color: rgba(252, 249, 242, .8); opacity: clamp(0, calc((var(--local) - .58) * 3), 1); transform: translateX(-50%); font-family: "IBM Plex Mono", monospace; }
.sequence-shift span { color: #dfb968; font-size: .55rem; letter-spacing: .15em; }
.sequence-shift strong { font-size: 1.4rem; }
.sequence-shift i { width: 38px; height: 1px; background: rgba(252, 249, 242, .4); }

.power-rig { opacity: 0; transform: scale(.72); transition: opacity .45s, transform .8s var(--ease-out); }
.stage-7 .power-rig { opacity: 1; transform: scale(calc(.84 + var(--local) * .16)); }
.power-core { position: absolute; z-index: 5; top: 48%; left: 50%; width: 106px; height: 106px; display: grid; place-items: center; border: 1px solid #d2b268; border-radius: 50%; background: radial-gradient(circle, #376f5c, #102d29 70%); transform: translate(-50%, -50%); box-shadow: 0 0 calc(22px + var(--local) * 42px) rgba(84, 161, 128, .44); }
.power-core span { font: 600 3rem/1 "IBM Plex Sans Condensed", sans-serif; }
.power-core i { position: absolute; inset: 15px; border: 1px dashed rgba(223, 185, 104, .48); border-radius: 50%; transform: rotate(calc(var(--local) * 110deg)); }
.power-orbit { position: absolute; top: 48%; left: 50%; border: 1px solid rgba(122, 184, 157, .22); border-radius: 50%; transform: translate(-50%, -50%) rotate(calc(var(--local) * 30deg)); }
.orbit-one { width: 390px; height: 230px; }
.orbit-two { width: 520px; height: 344px; border-color: rgba(198, 155, 82, .18); transform: translate(-50%, -50%) rotate(calc(-18deg - var(--local) * 24deg)); }
.power-node { position: absolute; z-index: 5; display: flex; align-items: center; gap: 9px; color: rgba(252, 249, 242, .72); font: 600 .6rem/1 "IBM Plex Mono", monospace; text-transform: uppercase; opacity: clamp(0, calc((var(--local) - .12) * 2.2), 1); }
.power-node i { width: 24px; height: 24px; border: 1px solid rgba(131, 191, 165, .52); border-radius: 50%; background: #143630; box-shadow: 0 0 13px rgba(95, 174, 140, .2); }
.node-abilities { top: 24%; left: 25%; }
.node-spirituality { top: 29%; right: 17%; }
.node-acting { bottom: 24%; left: 23%; }
.node-madness { right: 18%; bottom: 23%; color: #e4a186; }
.node-madness i { border-color: rgba(212, 111, 85, .62); background: #492724; }
.madness-panel { position: absolute; z-index: 7; right: -2%; bottom: 4%; width: 246px; padding: 17px; border: 1px solid rgba(215, 116, 91, .3); border-radius: 14px; background: rgba(24, 16, 17, .82); opacity: clamp(0, calc((var(--local) - .42) * 2.3), 1); transform: translateY(calc((1 - var(--local)) * 22px)); }
.madness-panel > div { display: flex; justify-content: space-between; color: #e4a186; font: 650 .62rem/1 "IBM Plex Mono", monospace; }
.madness-track b { display: block; height: 100%; background: linear-gradient(90deg, #a4523e, #e29b75); transition: width .08s linear; }
.madness-panel p { margin: 10px 0 0; color: rgba(252, 249, 242, .5); font-size: .66rem; }
.fracture { position: absolute; z-index: 2; width: 2px; height: 180px; opacity: clamp(0, calc((var(--local) - .48) * 1.8), .7); background: linear-gradient(transparent, rgba(224, 127, 100, .72), transparent); transform-origin: top; clip-path: polygon(0 0, 100% 0, 40% 22%, 100% 43%, 0 61%, 70% 78%, 30% 100%, 0 100%, 34% 77%, 0 58%, 65% 42%, 0 20%); }
.fracture-one { top: 17%; left: 45%; transform: rotate(13deg); }
.fracture-two { top: 37%; right: 28%; transform: rotate(58deg) scale(.7); }
.fracture-three { bottom: 10%; left: 38%; transform: rotate(-27deg) scale(.62); }

.stage-copy {
  position: absolute;
  z-index: 30;
  left: clamp(22px, 4vw, 64px);
  top: 43%;
  width: min(370px, 29vw);
  transform: translateY(-50%);
}

.stage-copy h3 {
  margin: 15px 0 14px;
  font: 620 clamp(2.5rem, 4.7vw, 5rem)/.88 "IBM Plex Sans Condensed", sans-serif;
  letter-spacing: -.045em;
  text-wrap: balance;
}

.stage-copy > p {
  margin: 0;
  color: rgba(252, 249, 242, .7);
  font-size: clamp(.82rem, 1vw, .96rem);
  line-height: 1.62;
}

.fact-line {
  display: flex;
  gap: 10px;
  margin-top: 22px;
  padding-top: 17px;
  border-top: 1px solid rgba(252, 249, 242, .13);
  color: rgba(252, 249, 242, .48);
  font: 500 .62rem/1.55 "IBM Plex Mono", monospace;
}

.fact-line i { flex: 0 0 auto; width: 6px; height: 6px; margin-top: 3px; border-radius: 50%; background: #dfb968; box-shadow: 0 0 10px rgba(223, 185, 104, .48); }
.stage-nav {
  position: absolute;
  z-index: 40;
  right: clamp(14px, 2.3vw, 36px);
  top: 50%;
  display: grid;
  transform: translateY(-50%);
}

.stage-nav button {
  position: relative;
  min-width: 88px;
  min-height: 48px;
  display: grid;
  grid-template-columns: 12px 20px 1fr;
  align-items: center;
  gap: 7px;
  padding: 4px 6px;
  border: 0;
  color: rgba(252, 249, 242, .68);
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.stage-nav button:focus-visible { outline: 2px solid #f0d38c; outline-offset: 2px; border-radius: 5px; }
.stage-nav button > i { width: 6px; height: 6px; border: 1px solid currentColor; border-radius: 50%; transition: background .25s, transform .35s var(--ease-out); }
.stage-nav button.active { color: #fcf9f2; }
.stage-nav button.active > i { border-color: #dfb968; background: #dfb968; transform: scale(1.35); box-shadow: 0 0 10px rgba(223, 185, 104, .46); }
.stage-nav button.complete { color: #9bcbb5; }
.stage-nav span { font: 600 .54rem/1 "IBM Plex Mono", monospace; }
.stage-nav strong { font-size: .64rem; }

.journey-line { position: absolute; z-index: 45; right: 0; bottom: 0; left: 0; height: 3px; background: rgba(252, 249, 242, .07); }
.journey-line i { display: block; height: 100%; background: linear-gradient(90deg, #35775f, #dfb968); box-shadow: 0 0 12px rgba(198, 155, 82, .3); }
.static-progression { display: none; }

@media (min-width: 1180px) {
  .stage-1 .artifact-stage,
  .stage-2 .artifact-stage,
  .stage-3 .artifact-stage { left: 60%; }
}

@media (max-width: 980px) {
  .artifact-stage { left: 58%; width: min(73vw, 760px); transform: translate(-50%, -50%) scale(.88); }
  .stage-copy { width: min(330px, 35vw); }
  .stage-nav button { min-width: 52px; grid-template-columns: 10px 22px; }
  .stage-nav strong { display: none; }
  .cauldron-interface { right: -3%; width: 330px; }
}

@media (max-width: 680px) {
  .progression { min-height: 700svh; }
  .progression-sticky { min-height: 600px; }
  .brewery-backdrop img { object-position: 56% center; filter: saturate(.6) contrast(1.08) brightness(.34); }
  .scene-grade { background: linear-gradient(180deg, rgba(3, 12, 14, .78), rgba(3, 12, 14, .18) 35%, rgba(3, 12, 14, .4) 62%, #061214 84%); }
  .chapter-heading { top: 68px; left: 16px; right: 16px; }
  .chapter-heading h2 { font-size: 1rem; }
  .artifact-stage { top: 40%; left: 50%; width: 760px; height: 600px; transform: translate(-50%, -50%) scale(.52); }
  .stage-copy { top: auto; right: 16px; bottom: 66px; left: 16px; width: auto; transform: none; }
  .stage-copy h3 { margin: 10px 0 9px; font-size: clamp(2rem, 11vw, 3.35rem); }
  .stage-copy > p { font-size: .78rem; line-height: 1.47; }
  .fact-line { margin-top: 10px; padding-top: 10px; font-size: .55rem; line-height: 1.4; }
  .copy-shift-enter-from { transform: translateY(18px); }
  .copy-shift-leave-to { transform: translateY(-12px); }
  .stage-nav { top: auto; right: 8px; bottom: 12px; left: 8px; grid-template-columns: repeat(8, minmax(0, 1fr)); transform: none; }
  .stage-nav button { min-width: 44px; min-height: 44px; grid-template-columns: 1fr; justify-items: center; gap: 2px; padding: 2px 0; }
  .stage-nav button > i { width: 5px; height: 5px; }
  .stage-nav span { font-size: .5rem; }
  .journey-line { bottom: 0; }
  .cauldron-interface { right: 2%; }
}

@media (max-width: 390px) {
  .artifact-stage { top: 38%; transform: translate(-50%, -50%) scale(.43); }
  .stage-copy { bottom: 63px; }
  .stage-copy h3 { font-size: 2.3rem; }
  .stage-copy > p { font-size: .72rem; }
  .fact-line { display: none; }
}

@media (max-height: 680px) and (min-width: 681px) {
  .chapter-heading { top: 66px; }
  .artifact-stage { transform: translate(-50%, -50%) scale(.79); }
  .stage-copy h3 { font-size: 2.7rem; }
  .fact-line { margin-top: 12px; padding-top: 10px; }
}

@media (prefers-reduced-motion: reduce), (max-height: 620px) {
  .progression { min-height: auto; padding: clamp(86px, 12vw, 140px) clamp(18px, 4vw, 64px); background: linear-gradient(145deg, #071416, #102724); }
  .progression-sticky { position: relative; height: auto; min-height: 0; overflow: visible; background: transparent; }
  .brewery-backdrop,
  .scene-grade,
  .scene-depth,
  .artifact-stage,
  .stage-copy,
  .stage-nav,
  .journey-line { display: none; }
  .chapter-heading { position: relative; top: auto; left: auto; width: min(720px, 100%); margin: 0 auto 50px; }
  .chapter-heading h2 { margin-top: 8px; font-size: clamp(2.6rem, 8vw, 5rem); }
  .static-progression { width: min(920px, 100%); display: block; margin: 0 auto; padding: 0; list-style: none; }
  .static-progression li { display: grid; grid-template-columns: 58px minmax(0, 1fr); gap: clamp(18px, 4vw, 44px); padding: clamp(28px, 5vw, 52px) 0; border-top: 1px solid rgba(252, 249, 242, .13); }
  .static-progression li > span { color: #dfb968; font: 600 .72rem/1 "IBM Plex Mono", monospace; }
  .static-progression small { color: #70a88e; font: 600 .6rem/1 "IBM Plex Mono", monospace; letter-spacing: .12em; text-transform: uppercase; }
  .static-progression h3 { margin: 10px 0 12px; font: 600 clamp(2rem, 6vw, 3.8rem)/.95 "IBM Plex Sans Condensed", sans-serif; }
  .static-progression p { max-width: 660px; margin: 0; color: rgba(252, 249, 242, .68); line-height: 1.65; }
  .static-progression strong { display: block; margin-top: 16px; color: rgba(252, 249, 242, .72); font: 500 .64rem/1.5 "IBM Plex Mono", monospace; }
}

@media (max-width: 260px) {
  .progression { min-height: auto; padding: 70px 10px; }
  .progression-sticky { position: relative; height: auto; min-height: 0; overflow: visible; }
  .brewery-backdrop,
  .scene-grade,
  .scene-depth,
  .artifact-stage,
  .stage-copy,
  .stage-nav,
  .journey-line { display: none; }
  .chapter-heading { position: relative; top: auto; left: auto; margin-bottom: 36px; }
  .static-progression { display: block; margin: 0; padding: 0; list-style: none; }
  .static-progression li { display: grid; grid-template-columns: 26px minmax(0, 1fr); gap: 6px; padding: 22px 0; border-top: 1px solid rgba(252, 249, 242, .12); }
  .static-progression li > span { color: #dfb968; font: 600 .52rem/1 "IBM Plex Mono", monospace; }
  .static-progression h3 { margin: 7px 0; font: 600 1.6rem/1 "IBM Plex Sans Condensed", sans-serif; }
  .static-progression p { margin: 0; color: rgba(252, 249, 242, .66); font-size: .7rem; line-height: 1.5; }
  .static-progression strong { display: block; margin-top: 9px; color: rgba(252, 249, 242, .72); font-size: .55rem; }
}
</style>
