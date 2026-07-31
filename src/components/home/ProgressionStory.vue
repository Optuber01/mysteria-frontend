<template>
  <section
    id="progression"
    ref="section"
    class="progression"
    aria-labelledby="progression-title"
    :style="{ '--story-progress': String(progress), '--stage': String(activeIndex) }"
  >
    <div class="progression-sticky">
      <header class="story-heading">
        <p class="home-eyebrow">The progression loop</p>
        <h2 id="progression-title">Every advance is something you do.</h2>
        <p>
          Progress is a connected loop of exploration, preparation and
          controlled risk—not a passive level bar.
        </p>
      </header>

      <div class="story-layout">
        <nav class="story-steps" aria-label="Progression stages">
          <button
            v-for="(stage, index) in stages"
            :key="stage.title"
            type="button"
            :class="{ active: index === activeIndex, complete: index < activeIndex }"
            :aria-current="index === activeIndex ? 'step' : undefined"
            @click="goToStage(index)"
          >
            <span>{{ String(index + 1).padStart(2, '0') }}</span>
            <strong>{{ stage.title }}</strong>
          </button>
        </nav>

        <div class="ritual-stage" aria-hidden="true">
          <svg viewBox="0 0 520 520" role="presentation">
            <defs>
              <linearGradient id="liquid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#90d5ad" />
                <stop offset="1" stop-color="#21644d" />
              </linearGradient>
              <radialGradient id="gold" cx=".5" cy=".5" r=".5">
                <stop offset="0" stop-color="#e4c681" />
                <stop offset="1" stop-color="#c69b52" stop-opacity=".04" />
              </radialGradient>
            </defs>
            <g class="ritual-rings">
              <circle cx="260" cy="260" r="218" />
              <circle cx="260" cy="260" r="178" />
              <path d="M260 32v55M260 433v55M32 260h55M433 260h55" />
              <path d="m98 98 39 39m246 246 39 39M98 422l39-39m246-246 39-39" />
            </g>
            <g class="ingredients">
              <path d="M87 208c27-32 58-31 77-7-31 4-52 17-77 7Z" />
              <path d="M434 196c-28-25-56-19-70 8 30-3 53 7 70-8Z" />
              <circle cx="121" cy="324" r="12" />
              <path d="m397 319 14 24-29 1Z" />
            </g>
            <circle class="ritual-aura" cx="260" cy="273" r="118" fill="url(#gold)" />
            <g class="potion">
              <path class="bottle-glass" d="M225 123h70v55c0 18 45 47 45 111 0 55-33 88-80 88s-80-33-80-88c0-64 45-93 45-111v-55Z" />
              <path class="bottle-liquid" d="M192 272c21 9 42-8 68 0s49-10 68 0v22c0 43-27 69-68 69s-68-26-68-69Z" fill="url(#liquid)" />
              <rect class="bottle-neck" x="217" y="105" width="86" height="28" rx="8" />
              <path class="bottle-shine" d="M217 207c-15 19-22 40-22 66" />
              <g class="liquid-bubbles">
                <circle cx="227" cy="310" r="5" />
                <circle cx="278" cy="328" r="8" />
                <circle cx="299" cy="291" r="4" />
              </g>
            </g>
            <g class="ability-bursts">
              <path d="m260 51 10 28-10 22-10-22Z" />
              <path d="m447 258-28 10-22-10 22-10Z" />
              <path d="m73 258 28 10 22-10-22-10Z" />
            </g>
          </svg>
          <span class="stage-readout">STAGE {{ activeIndex + 1 }} / {{ stages.length }}</span>
        </div>

        <article class="story-copy" aria-live="polite">
          <Transition name="story-copy" mode="out-in">
            <div :key="activeStage.title">
              <span>{{ activeStage.label }}</span>
              <h3>{{ activeStage.title }}</h3>
              <p>{{ activeStage.description }}</p>
              <small>{{ activeStage.note }}</small>
            </div>
          </Transition>
          <div class="story-progress" aria-hidden="true">
            <i :style="{ width: `${((activeIndex + 1) / stages.length) * 100}%` }" />
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useReducedMotion } from '@/composables/useReducedMotion';

const stages = [
  {
    label: 'Explore',
    title: 'Find ingredients',
    description: 'Travel, investigate and gather the ingredients required for your next potion.',
    note: 'Exact ingredient sources and recipes are being documented.',
  },
  {
    label: 'Prepare',
    title: 'Brew potion',
    description: 'Combine the recipe into the potion tied to your next Sequence.',
    note: 'Brewing UI and recipe details: content pending.',
  },
  {
    label: 'Commit',
    title: 'Consume potion',
    description: 'Take the potion when you are ready to begin the next part of progression.',
    note: 'Consumption requirements: content pending.',
  },
  {
    label: 'Practice',
    title: 'Act and digest',
    description: 'Play according to your Sequence and work through digestion in the world.',
    note: 'Digestion feedback and tracking details: content pending.',
  },
  {
    label: 'Prepare',
    title: 'Prepare ritual',
    description: 'Meet the advancement conditions and assemble what the ritual needs.',
    note: 'Ritual conditions vary; verified details will be added here.',
  },
  {
    label: 'Advance',
    title: 'Complete advancement',
    description: 'Perform the ritual and move into your next Sequence.',
    note: 'Failure conditions and safeguards: content pending.',
  },
  {
    label: 'Adapt',
    title: 'Gain abilities',
    description: 'Unlock a new set of documented abilities unique to your Pathway and Sequence.',
    note: 'Browse every currently documented ability in the Pathway archive.',
  },
  {
    label: 'Control',
    title: 'Manage instability',
    description: 'Balance faster progress against the danger of instability and loss of control.',
    note: 'Instability thresholds and recovery mechanics: content pending.',
  },
];

const section = ref<HTMLElement | null>(null);
const progress = ref(0);
const activeIndex = ref(0);
const reducedMotion = useReducedMotion();
let observer: IntersectionObserver | null = null;
let active = false;
let frame = 0;

const activeStage = computed(() => stages[activeIndex.value]);

function updateStory() {
  if (!active || !section.value) return;
  if (frame) cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    const rect = section.value?.getBoundingClientRect();
    if (!rect) return;
    const scrollRange = rect.height - window.innerHeight;
    progress.value = reducedMotion.value
      ? 0
      : Math.min(1, Math.max(0, -rect.top / Math.max(1, scrollRange)));
    activeIndex.value = Math.min(
      stages.length - 1,
      Math.floor(progress.value * stages.length),
    );
  });
}

function goToStage(index: number) {
  if (!section.value) return;
  if (reducedMotion.value) {
    activeIndex.value = index;
    return;
  }
  const top = section.value.offsetTop;
  const range = section.value.offsetHeight - window.innerHeight;
  window.scrollTo({
    top: top + range * ((index + 0.2) / stages.length),
    behavior: 'smooth',
  });
}

onMounted(() => {
  observer = new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting;
    if (active) updateStory();
  });
  if (section.value) observer.observe(section.value);
  window.addEventListener('scroll', updateStory, { passive: true });
  window.addEventListener('resize', updateStory, { passive: true });
});

onUnmounted(() => {
  observer?.disconnect();
  window.removeEventListener('scroll', updateStory);
  window.removeEventListener('resize', updateStory);
  if (frame) cancelAnimationFrame(frame);
});
</script>

<style scoped>
.progression {
  position: relative;
  min-height: 620vh;
  color: #f5f0e6;
  background: #08151a;
}

.progression-sticky {
  position: sticky;
  top: 0;
  min-height: 100svh;
  display: grid;
  align-content: center;
  overflow: hidden;
  padding: 92px clamp(20px, 4vw, 64px) 44px;
  background:
    radial-gradient(circle at 50% 52%, rgba(33, 100, 77, .28), transparent 34%),
    linear-gradient(135deg, #08151a, #0e2224 52%, #102b29);
}

.progression-sticky::before {
  content: "";
  position: absolute;
  inset: 0;
  opacity: .14;
  background-image:
    linear-gradient(rgba(245, 240, 230, .08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(245, 240, 230, .08) 1px, transparent 1px);
  background-size: 80px 80px;
  mask-image: linear-gradient(90deg, transparent, #000 25%, #000 75%, transparent);
}

.story-heading,
.story-layout {
  position: relative;
  z-index: 1;
  width: min(1380px, 100%);
  margin-inline: auto;
}

.story-heading {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: end;
  gap: 40px;
  margin-bottom: clamp(28px, 5vh, 62px);
}

.home-eyebrow {
  grid-column: 1 / -1;
  margin: 0 0 -22px;
  color: #d7b978;
  font: 600 10px/1 "IBM Plex Mono", monospace;
  letter-spacing: .18em;
  text-transform: uppercase;
}

.story-heading h2 {
  margin: 0;
  max-width: 700px;
  font: 650 clamp(2.6rem, 5vw, 5rem)/.93 "IBM Plex Sans Condensed", sans-serif;
  letter-spacing: -.04em;
}

.story-heading > p:last-child {
  max-width: 520px;
  margin: 0;
  color: rgba(245, 240, 230, .62);
  font-size: clamp(.95rem, 1.3vw, 1.1rem);
}

.story-layout {
  display: grid;
  grid-template-columns: minmax(190px, .7fr) minmax(330px, 1.2fr) minmax(280px, .9fr);
  align-items: center;
  gap: clamp(28px, 5vw, 74px);
}

.story-steps { display: grid; }

.story-steps button {
  min-height: 44px;
  display: grid;
  grid-template-columns: 34px 1fr;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
  border: 0;
  border-bottom: 1px solid rgba(245, 240, 230, .1);
  color: rgba(245, 240, 230, .38);
  background: none;
  cursor: pointer;
  text-align: left;
  transition: color .35s, transform .35s;
}

.story-steps button:hover,
.story-steps button.active { color: #f5f0e6; }
.story-steps button.active { transform: translateX(8px); }
.story-steps button.complete { color: rgba(144, 213, 173, .7); }
.story-steps span { font: 500 9px/1 "IBM Plex Mono", monospace; }
.story-steps strong { font-size: 12px; }

.ritual-stage { position: relative; }
.ritual-stage svg {
  width: min(50vh, 520px);
  margin: auto;
  overflow: visible;
  filter: drop-shadow(0 30px 50px rgba(0, 0, 0, .25));
}

.ritual-rings {
  fill: none;
  stroke: rgba(215, 185, 120, .36);
  stroke-width: 1;
  stroke-dasharray: 2 9;
  transform-origin: center;
  transform: rotate(calc(var(--story-progress) * 140deg));
}

.ingredients {
  fill: rgba(144, 213, 173, .55);
  opacity: clamp(0, calc(1.5 - var(--stage)), 1);
  transform-origin: center;
  transform: rotate(calc(var(--stage) * 18deg)) scale(calc(1 - var(--stage) * .035));
}

.ritual-aura {
  opacity: calc(var(--story-progress) * .9);
  transform-origin: center;
  transform: scale(calc(.7 + var(--story-progress) * .5));
}

.potion {
  transform-origin: center;
  transform: scale(calc(.82 + var(--story-progress) * .18)) translateY(calc(var(--stage) * -1px));
}

.bottle-glass {
  fill: rgba(245, 240, 230, .05);
  stroke: rgba(245, 240, 230, .65);
  stroke-width: 2;
}
.bottle-liquid { opacity: clamp(.2, calc(1.15 - var(--stage) * .08), 1); }
.bottle-neck { fill: #163d34; stroke: #d7b978; stroke-width: 1.2; }
.bottle-shine { fill: none; stroke: rgba(255, 255, 255, .7); stroke-linecap: round; stroke-width: 4; }
.liquid-bubbles { fill: rgba(245, 240, 230, .75); }
.ability-bursts {
  fill: #d7b978;
  opacity: clamp(0, calc(var(--stage) - 5.6), 1);
  transform-origin: center;
  transform: scale(calc(.7 + var(--story-progress) * .5));
}

.stage-readout {
  display: block;
  margin-top: -8px;
  color: rgba(245, 240, 230, .42);
  font: 500 9px/1 "IBM Plex Mono", monospace;
  letter-spacing: .16em;
  text-align: center;
}

.story-copy > div:first-child { min-height: 240px; }
.story-copy span {
  display: inline-block;
  padding: 7px 10px;
  border: 1px solid rgba(215, 185, 120, .35);
  border-radius: 999px;
  color: #d7b978;
  font: 600 9px/1 "IBM Plex Mono", monospace;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.story-copy h3 {
  margin: 18px 0 14px;
  font: 650 clamp(2.1rem, 4vw, 4rem)/.95 "IBM Plex Sans Condensed", sans-serif;
  letter-spacing: -.035em;
}

.story-copy p {
  margin: 0;
  color: rgba(245, 240, 230, .74);
  font-size: clamp(.96rem, 1.4vw, 1.12rem);
  line-height: 1.65;
}

.story-copy small {
  display: block;
  margin-top: 20px;
  color: rgba(245, 240, 230, .44);
  font: 500 10px/1.55 "IBM Plex Mono", monospace;
}

.story-progress {
  height: 2px;
  margin-top: 30px;
  background: rgba(245, 240, 230, .12);
}
.story-progress i {
  display: block;
  height: 100%;
  background: #d7b978;
  transition: width .55s cubic-bezier(.22, 1, .36, 1);
}

.story-copy-enter-active,
.story-copy-leave-active { transition: opacity .25s, transform .35s cubic-bezier(.22, 1, .36, 1); }
.story-copy-enter-from { opacity: 0; transform: translateY(15px); }
.story-copy-leave-to { opacity: 0; transform: translateY(-10px); }

@media (max-width: 900px) {
  .progression { min-height: 540vh; }
  .progression-sticky { align-content: start; padding-top: 90px; }
  .story-heading { grid-template-columns: 1fr; gap: 14px; margin-bottom: 28px; }
  .home-eyebrow { margin: 0 0 2px; }
  .story-layout { grid-template-columns: 1fr 1fr; gap: 20px; }
  .story-steps {
    grid-column: 1 / -1;
    grid-row: 2;
    grid-template-columns: repeat(8, 1fr);
    order: 3;
  }
  .story-steps button {
    min-width: 44px;
    display: grid;
    place-items: center;
    padding: 8px 0;
    border-bottom: 2px solid rgba(245, 240, 230, .1);
  }
  .story-steps button strong { display: none; }
  .story-steps button.active { border-color: #d7b978; transform: none; }
  .ritual-stage svg { width: min(38vh, 350px); }
  .story-copy > div:first-child { min-height: 210px; }
}

@media (max-width: 620px) {
  .progression { min-height: 500vh; }
  .progression-sticky { min-height: 100svh; padding-inline: 18px; }
  .story-heading > p:last-child { display: none; }
  .story-heading h2 { font-size: clamp(2.25rem, 12vw, 3.5rem); }
  .story-layout { grid-template-columns: 42% 1fr; align-items: start; }
  .ritual-stage svg { width: 100%; margin-top: 20px; }
  .stage-readout { display: none; }
  .story-copy h3 { font-size: clamp(1.8rem, 9vw, 2.8rem); }
  .story-copy p { font-size: .9rem; line-height: 1.5; }
  .story-copy small { display: none; }
  .story-copy > div:first-child { min-height: 230px; }
}

@media (prefers-reduced-motion: reduce) {
  .progression {
    min-height: auto;
    padding: 90px 20px;
  }
  .progression-sticky {
    position: relative;
    min-height: auto;
    padding: 0;
  }
  .ritual-rings,
  .ingredients,
  .ritual-aura,
  .potion,
  .ability-bursts { transform: none; }
}
</style>
