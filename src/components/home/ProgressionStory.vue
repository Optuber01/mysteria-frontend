<template>
  <section
    id="progression"
    ref="section"
    class="advancement"
    :class="`stage-${activeIndex}`"
    :style="{ '--journey': String(progress), '--local': String(localProgress) }"
    aria-labelledby="advancement-title"
  >
    <div class="advancement-sticky">
      <header class="advancement-label">
        <span>First advancement</span>
        <strong>{{ pathwayName }} Pathway selected</strong>
      </header>

      <h2 id="advancement-title" class="sr-only">Your first advancement journey</h2>

      <div class="artifact-field" aria-hidden="true">
        <div class="artifact-light" />
        <svg viewBox="0 0 800 700" role="presentation">
          <defs>
            <linearGradient id="brew-liquid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#9dd7b6" />
              <stop offset=".55" stop-color="#3c8b6c" />
              <stop offset="1" stop-color="#174f3d" />
            </linearGradient>
            <radialGradient id="ritual-light">
              <stop offset="0" stop-color="#f0d58d" stop-opacity=".88" />
              <stop offset=".28" stop-color="#5ba283" stop-opacity=".45" />
              <stop offset="1" stop-color="#0b2022" stop-opacity="0" />
            </radialGradient>
            <filter id="soft-light" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>

          <g class="voxel-ground">
            <path d="m115 506 284-164 286 164-285 165Z" />
            <path d="M115 506v42l285 122v-42M685 506v42L400 670" />
            <path d="m186 466 214 124 216-124M258 425l142 82 144-82" />
          </g>

          <g class="ingredient-orbit">
            <g
              v-for="(ingredient, index) in ingredientPoints"
              :key="index"
              class="ingredient"
              :style="{ transform: ingredientTransform(ingredient, index) }"
            >
              <circle v-if="index % 3 === 0" cx="400" cy="325" r="17" />
              <path v-else-if="index % 3 === 1" d="m400 305 19 20-19 20-19-20Z" />
              <path v-else d="M381 334c6-31 31-39 46-29-8 25-27 34-46 29Zm18-15 24-12" />
            </g>
          </g>

          <g class="shared-vessel">
            <path class="vessel-glass" d="M357 170h86v89c0 22 70 64 70 153 0 82-47 132-113 132s-113-50-113-132c0-89 70-131 70-153Z" />
            <path class="vessel-neck" d="M345 148h110v35H345z" />
            <path class="vessel-liquid" d="M304 394c35-22 60 13 96-2 43-19 68 16 96 2v32c0 62-39 101-96 101s-96-39-96-101Z" fill="url(#brew-liquid)" />
            <path class="vessel-highlight" d="M340 317c-22 32-30 62-30 101" />
            <g class="brew-bubbles">
              <circle cx="350" cy="456" r="7" />
              <circle cx="416" cy="482" r="11" />
              <circle cx="456" cy="436" r="6" />
            </g>
          </g>

          <g class="brew-heat">
            <path d="M325 576c-23-29 20-44 0-75" />
            <path d="M400 590c-28-36 29-52 0-91" />
            <path d="M475 576c23-29-20-44 0-75" />
            <path class="mixing-spoon" d="m462 200-83 245M452 198l28-40" />
          </g>

          <g class="consume-trace">
            <path class="consume-path" d="M402 266c71 62 66 136 0 211" />
            <circle class="consume-drop" cx="402" cy="270" r="13" :style="{ transform: `translateY(${localProgress * 205}px) scale(${1 - localProgress * .35})` }" />
            <path class="profile-line" d="M509 195c-46-13-90 20-90 67 0 20 10 39 27 51-5 37-24 56-58 62" />
          </g>

          <g class="digestion-body">
            <path class="body-outline" d="M400 154c-48 0-75 32-75 76 0 33 18 58 42 69-52 27-89 91-89 178v103h244V477c0-87-37-151-89-178 24-11 42-36 42-69 0-44-27-76-75-76Z" />
            <path class="digest-route" :style="{ strokeDashoffset: String(430 - localProgress * 430) }" d="M400 199c-26 35 36 56 0 89s-40 55 0 86 34 66 0 101-22 59 2 88" />
            <circle class="digest-core" cx="400" cy="370" r="54" />
            <circle class="digest-pulse" cx="400" cy="370" r="83" />
          </g>

          <g class="ritual-geometry">
            <circle cx="400" cy="350" r="245" :style="{ strokeDashoffset: String(1540 - localProgress * 1540) }" />
            <circle cx="400" cy="350" r="188" :style="{ strokeDashoffset: String(1182 - localProgress * 1182) }" />
            <path :style="{ strokeDashoffset: String(980 - localProgress * 980) }" d="m400 103 214 370H186Z" />
            <path :style="{ strokeDashoffset: String(840 - localProgress * 840) }" d="m400 597-214-370h428Z" />
            <g class="ritual-anchors">
              <rect x="385" y="83" width="30" height="30" />
              <rect x="600" y="458" width="30" height="30" />
              <rect x="170" y="458" width="30" height="30" />
            </g>
          </g>

          <g class="advancement-seal">
            <circle class="seal-light" cx="400" cy="350" r="150" fill="url(#ritual-light)" />
            <path class="seal-half seal-half--left" d="M400 210c-77 0-140 63-140 140s63 140 140 140V210Zm-4 54-51 86 51 86Z" />
            <path class="seal-half seal-half--right" d="M400 210c77 0 140 63 140 140s-63 140-140 140V210Zm4 54 51 86-51 86Z" />
            <path class="advance-beam" d="M400 88v524" />
          </g>

          <g class="ability-bloom">
            <circle class="ability-orbit ability-orbit--outer" cx="400" cy="350" r="258" />
            <circle class="ability-orbit ability-orbit--inner" cx="400" cy="350" r="202" />
            <path v-for="path in abilityPaths" :key="path" :d="path" :style="{ strokeDashoffset: String(280 - localProgress * 280) }" />
            <g class="ability-nodes">
              <circle cx="400" cy="347" r="38" />
              <circle cx="228" cy="238" r="24" />
              <circle cx="572" cy="238" r="24" />
              <circle cx="167" cy="392" r="24" />
              <circle cx="633" cy="392" r="24" />
              <circle cx="284" cy="531" r="24" />
              <circle cx="516" cy="531" r="24" />
            </g>
          </g>

          <g class="instability">
            <circle class="stability-ring" cx="400" cy="350" r="222" />
            <path class="fracture fracture--one" d="m400 128-25 110 42 36-45 83 32 63-22 151" />
            <path class="fracture fracture--two" d="m215 236 112 48 4 51 70 15 63-27 121 46" />
            <path class="fracture fracture--three" d="m285 522 62-100 53 11 43-67 69-9 72-93" />
            <circle class="recovery-core" cx="400" cy="350" r="58" />
          </g>
        </svg>
      </div>

      <Transition name="stage-copy" mode="out-in">
        <article :key="activeStage.title" class="stage-copy" :class="`copy-${activeStage.position}`">
          <span>{{ String(activeIndex + 1).padStart(2, '0') }} / 08 · {{ activeStage.kicker }}</span>
          <h3>{{ activeStage.title }}</h3>
          <p>{{ stageCopy(activeStage, activeIndex) }}</p>
          <details>
            <summary>{{ activeStage.detailTitle }}</summary>
            <p>{{ activeStage.detailCopy }}</p>
          </details>
        </article>
      </Transition>

      <nav class="stage-index" aria-label="Advancement stages">
        <button
          v-for="(stage, index) in stages"
          :key="stage.title"
          type="button"
          :class="{ active: activeIndex === index, complete: activeIndex > index }"
          :aria-label="`Stage ${index + 1}: ${stage.title}`"
          :aria-current="activeIndex === index ? 'step' : undefined"
          :aria-pressed="activeIndex === index"
          @click="goToStage(index)"
        >
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ stage.short }}</strong>
        </button>
      </nav>

      <div class="journey-meter" aria-hidden="true">
        <i :style="{ height: `${progress * 100}%` }" />
      </div>
    </div>

    <ol class="static-advancement">
      <li v-for="(stage, index) in stages" :key="stage.title">
        <span>{{ String(index + 1).padStart(2, '0') }}</span>
        <div><strong>{{ stage.title }}</strong><p>{{ stageCopy(stage, index) }}</p></div>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useReducedMotion } from '@/composables/useReducedMotion';

type Point = { x: number; y: number };
const props = withDefaults(defineProps<{ pathwayName?: string }>(), { pathwayName: 'Abyss' });
const stages = [
  { short: 'Find', kicker: 'Explore', title: 'Find the ingredients', copy: 'Travel through the world and gather what your next potion requires.', detailTitle: 'Potions begin in the world', detailCopy: 'Ingredients turn exploration into a concrete progression objective before brewing begins.', position: 'left' },
  { short: 'Brew', kicker: 'Prepare', title: 'Brew the potion', copy: 'Mix the collected ingredients into the potion for your next Sequence.', detailTitle: 'A recipe, not a level bar', detailCopy: 'The vessel makes advancement a prepared Minecraft action rather than passive experience gain.', position: 'right' },
  { short: 'Take', kicker: 'Commit', title: 'Consume it', copy: 'Take the potion when you are ready to begin the next part of progression.', detailTitle: 'The choice becomes physical', detailCopy: 'Consumption moves the objective from preparation into how you play your Sequence.', position: 'bottom' },
  { short: 'Digest', kicker: 'Practice', title: 'Act and digest', copy: 'Play according to the Sequence and work through digestion in the world.', detailTitle: 'Progress through play', detailCopy: 'Digestion connects character progression to your behavior and activity in Minecraft.', position: 'left-low' },
  { short: 'Ritual', kicker: 'Assemble', title: 'Prepare the ritual', copy: 'Meet the advancement conditions and bring the ritual together around the potion.', detailTitle: 'Advancement becomes an event', detailCopy: 'Ritual preparation gives higher progression a place, a sequence, and a deliberate moment.', position: 'top-right' },
  { short: 'Advance', kicker: 'Open', title: 'Complete the advance', copy: 'Finish the ritual and cross into your next Sequence.', detailTitle: 'The seal opens', detailCopy: 'The completed ritual resolves preparation, digestion, and conditions into one advancement.', position: 'center-right' },
  { short: 'Ability', kicker: 'Adapt', title: 'Your toolkit branches', copy: 'The selected Pathway adds documented abilities as its Sequences progress.', detailTitle: 'Each Pathway plays differently', detailCopy: 'The Pathway archive records the current Sequence names and ability descriptions used by Mysterria.', position: 'bottom-left' },
  { short: 'Control', kicker: 'Balance', title: 'Hold the new power', copy: 'Manage instability as power expands and avoid loss of control.', detailTitle: 'Power carries risk', detailCopy: 'Instability gives continued advancement a system to manage, not only a reward to collect.', position: 'right-low' },
];

const section = ref<HTMLElement | null>(null);
const progress = ref(0);
const activeIndex = ref(0);
const localProgress = ref(0);
const reducedMotion = useReducedMotion();
const ingredientPoints: Point[] = [
  { x: -246, y: -127 }, { x: -205, y: 94 }, { x: -103, y: -206 }, { x: 206, y: -118 },
  { x: 240, y: 103 }, { x: 117, y: 207 }, { x: -228, y: 210 }, { x: 255, y: 226 },
];
const abilityPaths = [
  'M400 347 228 238', 'M400 347 572 238', 'M400 347 167 392',
  'M400 347 633 392', 'M400 347 284 531', 'M400 347 516 531',
];
let observer: IntersectionObserver | null = null;
let visible = false;
let frame = 0;

const activeStage = computed(() => stages[activeIndex.value]);
function stageCopy(stage: (typeof stages)[number], index: number) {
  return index === 6
    ? `The ${props.pathwayName} Pathway adds documented abilities as its Sequences progress.`
    : stage.copy;
}

function ingredientTransform(point: Point, index: number) {
  const inverse = 1 - localProgress.value;
  const spiral = localProgress.value * (120 + index * 17);
  return `translate(${point.x * inverse}px, ${point.y * inverse}px) rotate(${spiral}deg) scale(${.5 + inverse * .5})`;
}

function update() {
  if (!visible || !section.value || reducedMotion.value || frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const rect = section.value?.getBoundingClientRect();
    if (!rect) return;
    const range = Math.max(1, rect.height - innerHeight);
    const next = Math.min(1, Math.max(0, -rect.top / range));
    const scaled = Math.min(stages.length - .0001, next * stages.length);
    progress.value = next;
    activeIndex.value = Math.floor(scaled);
    localProgress.value = scaled - Math.floor(scaled);
  });
}

function goToStage(index: number) {
  if (!section.value) return;
  activeIndex.value = index;
  localProgress.value = .22;
  progress.value = (index + .22) / stages.length;
  if (reducedMotion.value) {
    localProgress.value = .6;
    return;
  }
  const range = section.value.offsetHeight - innerHeight;
  const sectionTop = section.value.getBoundingClientRect().top + window.scrollY;
  document.documentElement.scrollTop = sectionTop + range * progress.value;
}

onMounted(() => {
  observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) update();
  });
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
.advancement {
  --local: 0;
  --journey: 0;
  position: relative;
  min-height: 660svh;
  color: #f5f0e6;
  background: #08191b;
}
.advancement::before,
.advancement::after {
  content: "";
  position: absolute;
  z-index: 3;
  left: 0;
  right: 0;
  height: 220px;
  pointer-events: none;
}
.advancement::before {
  top: 0;
  background: radial-gradient(ellipse at 50% 0, rgba(224, 189, 113, .2), transparent 43%);
}
.advancement::after {
  bottom: 0;
  background: linear-gradient(180deg, transparent, rgba(21, 61, 57, .34));
}
.advancement-sticky {
  position: sticky;
  top: 0;
  height: 100svh;
  min-height: 680px;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 50%, rgba(33, 100, 77, .15), transparent 36%),
    linear-gradient(140deg, #08191b, #0d2525 58%, #07171a);
}
.advancement-sticky::before {
  content: "";
  position: absolute;
  inset: 0;
  opacity: .15;
  background:
    linear-gradient(90deg, transparent 49.9%, rgba(245, 240, 230, .12) 50%, transparent 50.1%),
    linear-gradient(transparent 49.9%, rgba(245, 240, 230, .1) 50%, transparent 50.1%);
  background-size: 96px 96px;
  mask-image: radial-gradient(circle, #000, transparent 72%);
}
.advancement-label {
  position: absolute;
  z-index: 20;
  left: clamp(22px, 4vw, 62px);
  top: clamp(82px, 10vh, 112px);
  display: grid;
  gap: 7px;
}
.advancement-label span { color: #e0bd71; font: 600 9px/1 "IBM Plex Mono", monospace; letter-spacing: .16em; text-transform: uppercase; }
.advancement-label strong { color: rgba(245, 240, 230, .47); font: 500 9px/1 "IBM Plex Mono", monospace; }
.sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); }

.artifact-field {
  position: absolute;
  z-index: 2;
  left: 50%;
  top: 51%;
  width: min(64vw, 760px);
  height: min(72vh, 700px);
  transform: translate(-50%, -50%);
}
.artifact-light {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 58%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(224, 189, 113, .2), rgba(33, 100, 77, .12) 40%, transparent 72%);
  transform: translate(-50%, -50%) scale(calc(.75 + var(--local) * .35));
  filter: blur(14px);
}
.artifact-field svg { position: relative; width: 100%; height: 100%; overflow: visible; }
.artifact-field svg * { vector-effect: non-scaling-stroke; transform-box: fill-box; transform-origin: center; }

.voxel-ground { fill: rgba(33, 100, 77, .045); stroke: rgba(137, 193, 167, .25); stroke-width: 1; opacity: 0; transition: opacity .25s; }
.stage-0 .voxel-ground,
.stage-1 .voxel-ground { opacity: calc(.65 - var(--local) * .24); }

.ingredient-orbit { opacity: 0; transition: opacity .22s; }
.stage-0 .ingredient-orbit { opacity: 1; }
.ingredient { fill: rgba(157, 215, 182, .78); stroke: #e0bd71; stroke-width: 1.2; will-change: transform; }

.shared-vessel {
  fill: none;
  stroke: rgba(245, 240, 230, .72);
  stroke-width: 2;
  opacity: 1;
  transform-origin: center;
  transition: opacity .22s, transform .3s cubic-bezier(.22, 1, .36, 1);
}
.stage-0 .shared-vessel { transform: scale(calc(.72 + var(--local) * .22)); }
.stage-1 .shared-vessel { transform: scale(1); }
.stage-2 .shared-vessel { transform: translate(-84px, -38px) rotate(calc(var(--local) * -58deg)) scale(.8); }
.stage-3 .shared-vessel { opacity: calc(.55 - var(--local) * .42); transform: translateY(38px) scale(.36); }
.stage-4 .shared-vessel,
.stage-5 .shared-vessel { opacity: .45; transform: scale(.33); }
.stage-6 .shared-vessel { opacity: .18; transform: scale(.23); }
.stage-7 .shared-vessel { opacity: 0; transform: scale(.12); }
.vessel-glass { fill: rgba(245, 240, 230, .025); }
.vessel-neck { fill: #173f35; stroke: #e0bd71; }
.vessel-liquid {
  stroke: none;
  transform-origin: bottom;
  transform: scaleY(.72);
  opacity: .82;
  transition: transform .25s;
}
.stage-0 .vessel-liquid { transform: scaleY(calc(.18 + var(--local) * .54)); }
.stage-1 .vessel-liquid { transform: scaleY(calc(.68 + var(--local) * .3)); }
.vessel-highlight { stroke: rgba(255, 255, 255, .66); stroke-linecap: round; stroke-width: 4; }
.brew-bubbles { fill: rgba(245, 240, 230, .73); stroke: none; opacity: 0; }
.stage-1 .brew-bubbles { opacity: calc(.4 + var(--local) * .6); transform: translateY(calc(var(--local) * -18px)); }

.brew-heat { fill: none; stroke: #e0bd71; stroke-width: 2; stroke-linecap: round; opacity: 0; }
.stage-1 .brew-heat { opacity: 1; }
.stage-1 .brew-heat > path:not(.mixing-spoon) { stroke-dasharray: 8 10; transform: translateY(calc(var(--local) * -14px)); }
.mixing-spoon { stroke: rgba(245, 240, 230, .68); stroke-width: 5; transform: rotate(calc(var(--local) * 24deg)); }

.consume-trace { fill: none; stroke: rgba(245, 240, 230, .35); stroke-width: 2; opacity: 0; }
.stage-2 .consume-trace { opacity: 1; }
.consume-path { stroke: #e0bd71; stroke-dasharray: 5 8; }
.consume-drop { fill: #e0bd71; stroke: #f4dfa7; filter: drop-shadow(0 0 10px rgba(224, 189, 113, .75)); }

.digestion-body { fill: none; opacity: 0; transition: opacity .22s; }
.stage-3 .digestion-body { opacity: 1; }
.body-outline { fill: rgba(33, 100, 77, .06); stroke: rgba(157, 215, 182, .36); stroke-width: 1.4; }
.digest-route { stroke: #e0bd71; stroke-width: 5; stroke-linecap: round; stroke-dasharray: 430; }
.digest-core { fill: rgba(33, 100, 77, .46); stroke: #9dd7b6; }
.digest-pulse { stroke: rgba(224, 189, 113, .52); stroke-dasharray: 5 10; transform: scale(calc(.78 + var(--local) * .42)); }

.ritual-geometry { fill: none; stroke: rgba(224, 189, 113, .65); stroke-width: 1.5; opacity: 0; transition: opacity .22s; }
.stage-4 .ritual-geometry,
.stage-5 .ritual-geometry { opacity: 1; }
.ritual-geometry > circle,
.ritual-geometry > path { stroke-dasharray: 1600; }
.ritual-anchors { fill: #173f35; stroke: #e0bd71; }
.stage-4 .ritual-anchors { transform: scale(calc(.35 + var(--local) * .65)); }

.advancement-seal { opacity: 0; transition: opacity .22s; }
.stage-5 .advancement-seal { opacity: 1; }
.seal-light { filter: url(#soft-light); transform: scale(calc(.45 + var(--local) * .8)); }
.seal-half { fill: rgba(33, 100, 77, .52); stroke: #e0bd71; stroke-width: 2; }
.seal-half--left { transform: translateX(calc(var(--local) * -68px)); }
.seal-half--right { transform: translateX(calc(var(--local) * 68px)); }
.advance-beam { fill: none; stroke: rgba(245, 240, 230, .82); stroke-width: calc(1px + var(--local) * 8px); opacity: var(--local); }

.ability-bloom { fill: none; stroke: #e0bd71; stroke-width: 3; opacity: 0; transition: opacity .22s, transform .4s cubic-bezier(.22, 1, .36, 1); transform-origin: center; }
.stage-6 .ability-bloom { opacity: 1; transform: scale(calc(1.16 + var(--local) * .38)); filter: drop-shadow(0 0 15px rgba(224, 189, 113, .42)); }
.ability-bloom > path { stroke-dasharray: 280; }
.ability-orbit { stroke-width: 1.5; stroke-dasharray: 3 13; opacity: .42; }
.ability-orbit--inner { stroke: rgba(157, 215, 182, .72); stroke-dasharray: 2 9; }
.ability-nodes { fill: #173f35; stroke: #9dd7b6; stroke-width: 2.5; }
.stage-6 .ability-nodes { transform: scale(calc(.94 + var(--local) * .18)); }

.instability { fill: none; opacity: 0; transition: opacity .22s; }
.stage-7 .instability { opacity: 1; }
.stability-ring { stroke: rgba(157, 215, 182, .65); stroke-width: 4; stroke-dasharray: 8 12; transform: rotate(calc(var(--local) * 95deg)) scale(calc(.88 + var(--local) * .12)); }
.fracture { stroke: #ce8065; stroke-width: 3; stroke-dasharray: 5 6; transform: translate(calc((.5 - var(--local)) * 16px), calc((.5 - var(--local)) * 10px)); opacity: calc(1 - var(--local) * .55); }
.recovery-core { fill: rgba(33, 100, 77, .58); stroke: #e0bd71; stroke-width: 2; transform: scale(calc(.42 + var(--local) * .58)); filter: drop-shadow(0 0 18px rgba(224, 189, 113, .46)); }

.stage-copy {
  position: absolute;
  z-index: 10;
  width: min(370px, 30vw);
}
.stage-copy > span { color: #e0bd71; font: 600 9px/1 "IBM Plex Mono", monospace; letter-spacing: .15em; text-transform: uppercase; }
.stage-copy h3 { margin: 14px 0 12px; font: 650 clamp(2.2rem, 4vw, 4.3rem)/.88 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.045em; }
.stage-copy > p { margin: 0; color: rgba(245, 240, 230, .67); font-size: .9rem; line-height: 1.6; }
.stage-copy details { margin-top: 22px; border-top: 1px solid rgba(245, 240, 230, .14); }
.stage-copy summary { min-height: 44px; display: flex; align-items: center; color: rgba(245, 240, 230, .55); cursor: pointer; font: 600 9px/1 "IBM Plex Mono", monospace; letter-spacing: .08em; text-transform: uppercase; }
.stage-copy details p { margin: 0; padding: 0 0 12px; color: rgba(245, 240, 230, .48); font-size: .72rem; line-height: 1.55; }
.copy-left { left: clamp(22px, 5vw, 76px); top: 42%; transform: translateY(-50%); }
.copy-right { right: clamp(78px, 8vw, 130px); top: 44%; transform: translateY(-50%); }
.copy-bottom { left: 50%; bottom: 52px; transform: translateX(-50%); text-align: center; }
.copy-left-low { left: clamp(22px, 5vw, 76px); bottom: 72px; }
.copy-top-right { right: clamp(78px, 8vw, 130px); top: 19%; }
.copy-center-right { right: clamp(78px, 8vw, 130px); top: 48%; transform: translateY(-50%); }
.copy-bottom-left { left: clamp(22px, 5vw, 76px); bottom: 65px; }
.copy-right-low { right: clamp(78px, 8vw, 130px); bottom: 68px; }
.stage-copy-enter-active,
.stage-copy-leave-active { transition: opacity .22s, transform .3s cubic-bezier(.22, 1, .36, 1); }
.stage-copy-enter-from { opacity: 0; translate: 0 16px; }
.stage-copy-leave-to { opacity: 0; translate: 0 -12px; }

.stage-index {
  position: absolute;
  z-index: 20;
  right: 16px;
  top: 50%;
  display: grid;
  transform: translateY(-50%);
}
.stage-index button {
  min-width: 52px;
  min-height: 48px;
  display: grid;
  grid-template-columns: 22px 1fr;
  align-items: center;
  gap: 4px;
  padding: 4px 7px;
  border: 0;
  border-left: 1px solid rgba(245, 240, 230, .12);
  color: rgba(245, 240, 230, .35);
  background: transparent;
  cursor: pointer;
  text-align: left;
}
.stage-index button.active { border-color: #e0bd71; color: #f5f0e6; }
.stage-index button.complete { color: rgba(157, 215, 182, .58); }
.stage-index span { font: 650 10px/1 "IBM Plex Mono", monospace; }
.stage-index strong { font-size: .65rem; }
.journey-meter { position: absolute; right: 0; top: 0; width: 2px; height: 100%; background: rgba(245, 240, 230, .06); }
.journey-meter i { display: block; width: 100%; background: #e0bd71; }
.static-advancement { display: none; }

@media (max-width: 900px) {
  .artifact-field { width: min(64vw, 560px); height: 58vh; min-height: 340px; }
  .stage-copy { width: min(320px, 38vw); }
  .stage-copy h3 { font-size: clamp(1.9rem, 7vw, 3rem); }
  .copy-right,
  .copy-top-right,
  .copy-center-right,
  .copy-right-low { right: 74px; }
}

@media (max-width: 620px) {
  .advancement { min-height: 620svh; }
  .advancement-sticky { min-height: 620px; }
  .advancement-label { left: 16px; top: 76px; }
  .artifact-field {
    left: 50%;
    top: 43%;
    width: clamp(190px, 56vw, 300px);
    height: 48vh;
  }
  .stage-copy,
  .copy-left,
  .copy-right,
  .copy-bottom,
  .copy-left-low,
  .copy-top-right,
  .copy-center-right,
  .copy-bottom-left,
  .copy-right-low {
    left: 16px;
    right: auto;
    top: auto;
    bottom: 76px;
    width: calc(100% - 32px);
    max-width: 420px;
    transform: none;
    text-align: left;
  }
  .stage-copy h3 { margin: 10px 0 8px; font-size: clamp(1.8rem, 9vw, 2.7rem); }
  .stage-copy > p { font-size: .82rem; line-height: 1.48; }
  .stage-copy details { margin-top: 8px; }
  .stage-copy details p { font-size: .68rem; }
  .stage-index {
    left: 0;
    right: 0;
    top: auto;
    bottom: 12px;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    transform: none;
  }
  .stage-index button { min-width: 44px; min-height: 48px; display: grid; place-items: center; padding: 4px 0; border-left: 0; border-bottom: 2px solid rgba(245, 240, 230, .1); }
  .stage-index button.active { border-color: #e0bd71; }
  .stage-index strong { display: none; }
  .journey-meter { display: none; }
}

@media (max-width: 260px) {
  .advancement { min-height: auto; padding: 70px 10px; }
  .advancement-sticky { position: relative; height: auto; min-height: 360px; overflow: visible; border-bottom: 1px solid rgba(245, 240, 230, .1); }
  .advancement-label { top: 0; left: 0; }
  .artifact-field { position: relative; left: auto; top: auto; width: min(180px, 100%); height: 250px; margin: 70px auto 0; transform: none; }
  .stage-copy,
  .stage-index,
  .journey-meter { display: none; }
  .static-advancement { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }
  .static-advancement li { display: grid; grid-template-columns: 30px minmax(0, 1fr); gap: 8px; padding: 18px 0; border-bottom: 1px solid rgba(245, 240, 230, .1); }
  .static-advancement li > span { color: #e0bd71; font: 600 8px/1 "IBM Plex Mono", monospace; }
  .static-advancement strong { font: 650 1.4rem/1 "IBM Plex Sans Condensed", sans-serif; }
  .static-advancement p { margin: 7px 0 0; color: rgba(245, 240, 230, .63); font-size: .72rem; line-height: 1.5; }
}

@media (prefers-reduced-motion: reduce) {
  .advancement { min-height: auto; padding: 90px 20px; }
  .advancement-sticky { position: relative; height: auto; min-height: 560px; }
  .stage-copy,
  .stage-index,
  .journey-meter { display: none; }
  .static-advancement { width: min(900px, 100%); display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 50px auto 0; padding: 0; list-style: none; }
  .static-advancement li { display: grid; grid-template-columns: 34px minmax(0, 1fr); gap: 10px; padding: 22px; border: 1px solid rgba(245, 240, 230, .1); }
  .static-advancement li > span { color: #e0bd71; font: 600 9px/1 "IBM Plex Mono", monospace; }
  .static-advancement strong { font: 650 1.6rem/1 "IBM Plex Sans Condensed", sans-serif; }
  .static-advancement p { margin: 8px 0 0; color: rgba(245, 240, 230, .62); font-size: .78rem; line-height: 1.5; }
}
</style>
