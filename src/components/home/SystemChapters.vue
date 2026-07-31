<template>
  <section class="systems" aria-labelledby="systems-title">
    <header class="systems-intro">
      <p class="home-eyebrow">Five connected systems</p>
      <h2 id="systems-title">A Pathway becomes a way to play.</h2>
      <p>
        Each system has a place in the Minecraft world. Explore the diagrams
        to see the verified loop—and where implementation details are still
        being documented.
      </p>
    </header>

    <article
      v-for="(chapter, chapterIndex) in chapters"
      :id="chapter.id"
      :key="chapter.id"
      class="system-chapter"
      :class="[`system-chapter--${chapter.theme}`, { visible: visible.has(chapter.id) }]"
      :aria-labelledby="`${chapter.id}-title`"
      :data-chapter="chapter.id"
    >
      <div class="chapter-inner">
        <div class="chapter-copy">
          <span class="chapter-number">{{ String(chapterIndex + 1).padStart(2, '0') }} / 05</span>
          <p class="chapter-label">{{ chapter.label }}</p>
          <h3 :id="`${chapter.id}-title`">{{ chapter.title }}</h3>
          <p class="chapter-lede">{{ chapter.description }}</p>

          <div class="chapter-detail">
            <span>{{ chapter.points[activePoints[chapterIndex]].label }}</span>
            <strong>{{ chapter.points[activePoints[chapterIndex]].title }}</strong>
            <p>{{ chapter.points[activePoints[chapterIndex]].copy }}</p>
          </div>
          <p class="chapter-note">
            <span>Content status</span>
            {{ chapter.note }}
          </p>
        </div>

        <div
          class="chapter-visual"
          :style="{ '--tilt-x': `${tilt.x}deg`, '--tilt-y': `${tilt.y}deg` }"
          @pointermove="updateTilt"
          @pointerleave="resetTilt"
        >
          <div class="visual-caption">
            <span>Interactive model</span>
            <strong>{{ chapter.visualLabel }}</strong>
          </div>

          <svg
            v-if="chapter.id === 'potions'"
            class="system-svg potion-lab"
            viewBox="0 0 620 520"
            aria-hidden="true"
          >
            <path class="desk-line" d="M40 420h540" />
            <g class="shelf">
              <path d="M70 98h160v16H70zM84 114v120M216 114v120" />
              <path d="M105 148v41h28v-41M159 137v52h28v-52" />
            </g>
            <g class="cauldron">
              <ellipse cx="320" cy="340" rx="125" ry="40" />
              <path d="M195 340c8 83 55 96 125 96s117-13 125-96" />
              <path class="brew" d="M216 338c31-22 65 17 104-2s76 12 104 2" />
            </g>
            <g class="steam">
              <path d="M282 305c-30-46 35-52 2-104" />
              <path d="M340 304c32-52-29-66 8-114" />
            </g>
            <circle class="digest-ring" cx="497" cy="168" r="65" />
            <path class="digest-path" d="M497 103a65 65 0 1 1-55 30" />
            <text x="497" y="164">DIGEST</text>
            <text x="497" y="183">{{ activePoints[chapterIndex] + 1 }}/3</text>
          </svg>

          <svg
            v-else-if="chapter.id === 'rituals'"
            class="system-svg ritual-map"
            viewBox="0 0 620 520"
            aria-hidden="true"
          >
            <ellipse cx="310" cy="285" rx="224" ry="128" />
            <ellipse cx="310" cy="285" rx="168" ry="92" />
            <path d="M310 92v101M310 377v62M60 285h82M478 285h82" />
            <g class="ritual-symbol">
              <path d="m310 181 83 144H227Z" />
              <circle cx="310" cy="285" r="52" />
              <path d="m277 285 22 22 45-51" />
            </g>
            <g class="ritual-items">
              <circle cx="310" cy="102" r="20" />
              <rect x="68" y="266" width="38" height="38" rx="6" />
              <path d="m531 266 22 38h-44Z" />
            </g>
          </svg>

          <svg
            v-else-if="chapter.id === 'abilities'"
            class="system-svg ability-tree"
            viewBox="0 0 620 520"
            aria-hidden="true"
          >
            <path class="tree-link" d="M310 418V330M310 330 190 250M310 330l120-80M190 250l-72-92M190 250l25-108M430 250l-25-108M430 250l72-92" />
            <g class="tree-nodes">
              <circle cx="310" cy="418" r="34" />
              <circle cx="310" cy="330" r="28" />
              <circle cx="190" cy="250" r="30" />
              <circle cx="430" cy="250" r="30" />
              <circle cx="118" cy="158" r="24" />
              <circle cx="215" cy="142" r="24" />
              <circle cx="405" cy="142" r="24" />
              <circle cx="502" cy="158" r="24" />
            </g>
            <g class="node-icons">
              <path d="m310 400 8 18-8 18-8-18Z" />
              <path d="m172 250 18-10 18 10-18 10Z" />
              <path d="m430 232 10 18-10 18-10-18Z" />
            </g>
          </svg>

          <svg
            v-else-if="chapter.id === 'instability'"
            class="system-svg stability-meter"
            viewBox="0 0 620 520"
            aria-hidden="true"
          >
            <path class="meter-track" d="M105 353a210 210 0 0 1 410 0" />
            <path class="meter-safe" d="M105 353a210 210 0 0 1 265-194" />
            <path class="meter-risk" d="M370 159a210 210 0 0 1 145 194" />
            <g class="meter-ticks">
              <path d="M114 350h28M147 253l25 13M222 184l15 25M310 143v28M398 184l-15 25M473 253l-25 13M506 350h-28" />
            </g>
            <g class="needle" :style="{ transform: `rotate(${activePoints[chapterIndex] * 26 - 24}deg)` }">
              <path d="m310 342 8-150 8 150Z" />
              <circle cx="310" cy="352" r="28" />
            </g>
            <text x="310" y="419">CONTROL / RISK</text>
          </svg>

          <svg
            v-else
            class="system-svg world-network"
            viewBox="0 0 620 520"
            aria-hidden="true"
          >
            <path class="map-land" d="M70 176c82-105 164-36 231-76 81-48 172-10 249 77l-44 205c-106 70-291 67-410-4Z" />
            <path class="route" d="M132 329c74-85 125 20 185-69s128 29 184-71" />
            <g class="network-links">
              <path d="M132 329 267 321 317 260 426 301 501 189" />
              <path d="M267 321 240 178 317 260 389 154 501 189" />
            </g>
            <g class="world-points">
              <circle cx="132" cy="329" r="16" />
              <circle cx="267" cy="321" r="16" />
              <circle cx="317" cy="260" r="20" />
              <circle cx="426" cy="301" r="16" />
              <circle cx="240" cy="178" r="16" />
              <circle cx="389" cy="154" r="16" />
              <circle cx="501" cy="189" r="16" />
            </g>
          </svg>

          <div class="visual-controls" :aria-label="`${chapter.title} diagram controls`">
            <button
              v-for="(point, pointIndex) in chapter.points"
              :key="point.title"
              type="button"
              :class="{ active: activePoints[chapterIndex] === pointIndex }"
              @click="activePoints[chapterIndex] = pointIndex"
            >
              <span>{{ pointIndex + 1 }}</span>
              {{ point.short }}
            </button>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useReducedMotion } from '@/composables/useReducedMotion';

const chapters = [
  {
    id: 'potions',
    theme: 'ivory',
    label: 'Potions and digestion',
    title: 'Brew the next step. Then earn it.',
    description: 'Collect recipe ingredients, brew your next Sequence potion and digest it through play.',
    visualLabel: 'Potion workstation',
    note: 'Recipe sources, brewing UI and the digestion feedback system need verified copy.',
    points: [
      { short: 'Recipe', label: '01 · Preparation', title: 'Assemble the recipe', copy: 'Ingredients are found in the world and combined for a specific Sequence potion.' },
      { short: 'Brew', label: '02 · Brewing', title: 'Create the potion', copy: 'Brewing turns collected ingredients into the next concrete progression objective.' },
      { short: 'Digest', label: '03 · Practice', title: 'Act to digest', copy: 'After consumption, play according to the Sequence to work through digestion.' },
    ],
  },
  {
    id: 'rituals',
    theme: 'deep',
    label: 'Ritual advancement',
    title: 'Advancement is a prepared event.',
    description: 'Higher advancement requires conditions and a ritual, turning progression into an in-world objective.',
    visualLabel: 'Ritual assembly',
    note: 'Sequence-specific ritual conditions and failure behavior are awaiting verified product details.',
    points: [
      { short: 'Conditions', label: '01 · Requirements', title: 'Meet the conditions', copy: 'Prepare for the advancement instead of unlocking it automatically.' },
      { short: 'Arrange', label: '02 · Assembly', title: 'Set the ritual', copy: 'Bring the required pieces together at the right point in progression.' },
      { short: 'Advance', label: '03 · Outcome', title: 'Complete the advance', copy: 'A successful ritual moves your character into the next Sequence.' },
    ],
  },
  {
    id: 'abilities',
    theme: 'ivory',
    label: 'Pathway abilities',
    title: 'New Sequences change your toolkit.',
    description: 'Each Pathway has documented abilities across its Sequence progression—not one shared class kit.',
    visualLabel: 'Ability progression',
    note: 'The Pathway archive is the source of truth for currently documented ability names and descriptions.',
    points: [
      { short: 'Start', label: 'Sequence 9', title: 'Begin with a distinct kit', copy: 'Your starting Sequence establishes the first set of playable abilities.' },
      { short: 'Layer', label: 'Progression', title: 'Add new options', copy: 'Advancement expands what your Pathway can do across Minecraft encounters.' },
      { short: 'Master', label: 'Higher Sequences', title: 'Build a deeper toolkit', copy: 'Later Sequences add the abilities documented in the server archive.' },
    ],
  },
  {
    id: 'instability',
    theme: 'deep',
    label: 'Instability and loss of control',
    title: 'Power has to be managed.',
    description: 'Progression includes instability and the possibility of loss of control, adding risk to advancement.',
    visualLabel: 'Stability model',
    note: 'Exact thresholds, causes, penalties and recovery methods are content placeholders until verified.',
    points: [
      { short: 'Stable', label: '01 · Baseline', title: 'Maintain control', copy: 'A stable state gives players a clear baseline before taking further progression risks.' },
      { short: 'Risk', label: '02 · Pressure', title: 'Watch instability', copy: 'Advancement decisions interact with a system that must be actively managed.' },
      { short: 'Control', label: '03 · Consequence', title: 'Avoid loss of control', copy: 'The system creates consequences beyond simply failing an upgrade.' },
    ],
  },
  {
    id: 'organizations',
    theme: 'ivory',
    label: 'Organizations and world systems',
    title: 'Progress inside a shared world.',
    description: 'Organizations connect individual progression to other players and the broader server.',
    visualLabel: 'World network',
    note: 'Organization creation, territory, permissions and progression rules need verified product copy.',
    points: [
      { short: 'People', label: '01 · Players', title: 'Find other Beyonders', copy: 'The organization layer gives players a social context for progression.' },
      { short: 'Groups', label: '02 · Organizations', title: 'Build a group', copy: 'Players can organize inside the world; specific management rules are pending documentation.' },
      { short: 'World', label: '03 · Systems', title: 'Affect the server', copy: 'Organizations are presented as part of the living world, not a detached menu.' },
    ],
  },
];

const activePoints = ref(chapters.map(() => 0));
const visible = ref(new Set<string>());
const tilt = ref({ x: 0, y: 0 });
const reducedMotion = useReducedMotion();
let observer: IntersectionObserver | null = null;

function updateTilt(event: PointerEvent) {
  if (reducedMotion.value || event.pointerType === 'touch') return;
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  tilt.value = {
    x: ((event.clientY - rect.top) / rect.height - .5) * -4,
    y: ((event.clientX - rect.left) / rect.width - .5) * 5,
  };
}

function resetTilt() {
  tilt.value = { x: 0, y: 0 };
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      const next = new Set(visible.value);
      for (const entry of entries) {
        if (entry.isIntersecting) next.add((entry.target as HTMLElement).dataset.chapter ?? '');
      }
      visible.value = next;
    },
    { threshold: .22 },
  );
  document.querySelectorAll<HTMLElement>('[data-chapter]').forEach((element) => observer?.observe(element));
});

onUnmounted(() => observer?.disconnect());
</script>

<style scoped>
.systems {
  color: #0d2824;
  background: #f5f0e6;
}

.systems-intro {
  min-height: 76vh;
  display: grid;
  align-content: center;
  justify-items: center;
  padding: 100px 20px;
  text-align: center;
  background:
    radial-gradient(circle at 50% 0, rgba(198, 155, 82, .14), transparent 40%),
    #f5f0e6;
}

.home-eyebrow,
.chapter-label {
  margin: 0;
  color: #8b632c;
  font: 600 10px/1 "IBM Plex Mono", monospace;
  letter-spacing: .18em;
  text-transform: uppercase;
}

.systems-intro h2 {
  max-width: 900px;
  margin: 20px 0;
  font: 650 clamp(3rem, 7vw, 7rem)/.87 "IBM Plex Sans Condensed", sans-serif;
  letter-spacing: -.055em;
}

.systems-intro > p:last-child {
  max-width: 650px;
  margin: 0;
  color: #5d706b;
  font-size: 1.05rem;
}

.system-chapter {
  position: relative;
  min-height: 108vh;
  display: grid;
  align-items: center;
  padding: 100px clamp(20px, 5vw, 74px);
  overflow: clip;
}

.system-chapter--ivory { color: #102924; background: #fcf9f2; }
.system-chapter--deep { color: #f5f0e6; background: #0e2224; }

.chapter-inner {
  width: min(1380px, 100%);
  display: grid;
  grid-template-columns: minmax(280px, .8fr) minmax(460px, 1.2fr);
  align-items: center;
  gap: clamp(50px, 8vw, 120px);
  margin: auto;
}

.system-chapter:nth-of-type(even) .chapter-copy { order: 2; }
.chapter-number {
  display: block;
  margin-bottom: clamp(50px, 10vh, 110px);
  color: currentColor;
  opacity: .35;
  font: 500 10px/1 "IBM Plex Mono", monospace;
  letter-spacing: .18em;
}

.chapter-copy h3 {
  margin: 16px 0 22px;
  font: 650 clamp(3rem, 6vw, 6.4rem)/.86 "IBM Plex Sans Condensed", sans-serif;
  letter-spacing: -.05em;
}

.chapter-lede {
  margin: 0;
  color: currentColor;
  opacity: .68;
  font-size: clamp(1rem, 1.5vw, 1.2rem);
  line-height: 1.65;
}

.chapter-detail {
  min-height: 144px;
  margin-top: 38px;
  padding: 22px 0 0 22px;
  border-top: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  border-left: 2px solid #c69b52;
}

.chapter-detail span,
.chapter-note span {
  display: block;
  margin-bottom: 8px;
  color: #9b7138;
  font: 600 9px/1.2 "IBM Plex Mono", monospace;
  letter-spacing: .13em;
  text-transform: uppercase;
}

.system-chapter--deep .chapter-detail span,
.system-chapter--deep .chapter-note span,
.system-chapter--deep .chapter-label { color: #d7b978; }
.chapter-detail strong { font-size: 1rem; }
.chapter-detail p { margin: 8px 0 0; color: currentColor; opacity: .62; line-height: 1.55; }

.chapter-note {
  margin: 28px 0 0;
  color: currentColor;
  opacity: .52;
  font: 500 10px/1.55 "IBM Plex Mono", monospace;
}

.chapter-visual {
  position: relative;
  min-height: 620px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  padding: 24px;
  border: 1px solid color-mix(in srgb, currentColor 15%, transparent);
  border-radius: 30px;
  background: color-mix(in srgb, currentColor 3%, transparent);
  box-shadow: 0 40px 90px rgba(3, 14, 15, .12);
  transform: perspective(1200px) rotateX(var(--tilt-x)) rotateY(var(--tilt-y));
  transition: transform .25s ease-out;
}

.system-chapter--deep .chapter-visual { background: rgba(245, 240, 230, .025); }
.visual-caption {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  color: currentColor;
  font: 600 9px/1 "IBM Plex Mono", monospace;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.visual-caption span { opacity: .4; }

.system-svg {
  width: 100%;
  height: 100%;
  max-height: 480px;
  margin: auto;
  overflow: visible;
}

.system-svg * {
  vector-effect: non-scaling-stroke;
  transform-box: fill-box;
  transform-origin: center;
}

.potion-lab { fill: none; stroke: #21644d; stroke-width: 2; }
.potion-lab .shelf { fill: rgba(33, 100, 77, .08); stroke-width: 1.2; }
.potion-lab .cauldron { fill: #153b32; stroke: #0e3029; }
.potion-lab .brew { fill: none; stroke: #c69b52; stroke-width: 4; }
.potion-lab .steam { stroke: #81bda3; stroke-linecap: round; stroke-dasharray: 8 10; }
.potion-lab .digest-ring { stroke: rgba(33, 100, 77, .18); }
.potion-lab .digest-path { stroke: #c69b52; stroke-width: 6; stroke-linecap: round; }
.potion-lab text { fill: #21644d; stroke: none; font: 600 10px "IBM Plex Mono"; text-anchor: middle; }

.ritual-map { fill: none; stroke: rgba(215, 185, 120, .4); stroke-width: 1.2; }
.ritual-map > ellipse { stroke-dasharray: 4 10; }
.ritual-symbol { stroke: #d7b978; stroke-width: 2; }
.ritual-symbol circle { fill: rgba(198, 155, 82, .1); }
.ritual-items { fill: #21644d; stroke: #85bea7; }

.ability-tree { fill: none; stroke: #21644d; }
.tree-link { stroke-width: 2; stroke-dasharray: 4 7; }
.tree-nodes { fill: #f5f0e6; stroke-width: 2; }
.tree-nodes circle:nth-child(n+5) { fill: #dfece4; }
.node-icons { fill: #c69b52; stroke: none; }

.stability-meter { fill: none; stroke-width: 11; stroke-linecap: round; }
.meter-track { stroke: rgba(245, 240, 230, .1); }
.meter-safe { stroke: #68ad8f; }
.meter-risk { stroke: #c98267; }
.meter-ticks { stroke: rgba(245, 240, 230, .6); stroke-width: 2; }
.needle { fill: #d7b978; stroke: none; transform-origin: 310px 352px; transition: transform .6s cubic-bezier(.22, 1, .36, 1); }
.stability-meter text { fill: rgba(245, 240, 230, .48); font: 600 12px "IBM Plex Mono"; text-anchor: middle; }

.world-network { stroke: #21644d; }
.map-land { fill: rgba(33, 100, 77, .08); stroke-width: 1.5; }
.route { fill: none; stroke: #c69b52; stroke-width: 3; stroke-dasharray: 6 8; }
.network-links { fill: none; stroke: rgba(33, 100, 77, .35); stroke-width: 1.2; }
.world-points { fill: #fcf9f2; stroke-width: 3; }
.world-points circle:nth-child(3) { fill: #c69b52; stroke: #8b632c; }

.visual-controls {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.visual-controls button {
  min-height: 52px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 12px;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 12px;
  color: currentColor;
  background: transparent;
  cursor: pointer;
  font: 600 10px/1.2 "IBM Plex Mono", monospace;
  text-align: left;
}

.visual-controls button:hover,
.visual-controls button.active {
  border-color: #c69b52;
  background: color-mix(in srgb, #c69b52 10%, transparent);
}

.visual-controls button span {
  color: #9b7138;
  font-size: 9px;
}

.system-chapter--deep .visual-controls button span { color: #d7b978; }

@media (min-width: 900px) {
  .chapter-copy,
  .chapter-visual {
    opacity: 0;
    transform: translateY(34px);
    transition: opacity .8s, transform 1s cubic-bezier(.22, 1, .36, 1);
  }
  .visible .chapter-copy { opacity: 1; transform: translateY(0); }
  .visible .chapter-visual {
    opacity: 1;
    transform: perspective(1200px) rotateX(var(--tilt-x)) rotateY(var(--tilt-y));
    transition-delay: .12s;
  }
}

@media (max-width: 899px) {
  .system-chapter { min-height: auto; padding-block: 80px; }
  .chapter-inner { grid-template-columns: 1fr; gap: 44px; }
  .system-chapter:nth-of-type(even) .chapter-copy { order: initial; }
  .chapter-number { margin-bottom: 36px; }
  .chapter-visual { min-height: 520px; }
}

@media (max-width: 540px) {
  .systems-intro { min-height: 70vh; }
  .system-chapter { padding-inline: 16px; }
  .chapter-copy h3 { font-size: clamp(2.8rem, 15vw, 4rem); }
  .chapter-visual { min-height: 420px; padding: 16px; border-radius: 22px; }
  .visual-controls button { justify-content: center; padding: 6px; font-size: 0; }
  .visual-controls button span { font-size: 11px; }
}

@media (prefers-reduced-motion: reduce) {
  .chapter-copy,
  .chapter-visual { opacity: 1; transform: none; transition: none; }
  .needle { transition: none; }
}
</style>
