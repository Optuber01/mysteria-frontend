<template>
  <section id="pathways" class="sefirah" aria-labelledby="pv-table-title">
    <div class="sefirah__fog" aria-hidden="true"></div>

    <div class="sefirah__inner">
      <header class="sefirah__head">
        <p class="fog-label">{{ t('home.pathwayVariants.table.kicker') }}</p>
        <h2 id="pv-table-title">{{ t('home.pathwayVariants.table.titleLead') }} <em>{{ t('home.pathwayVariants.table.titleAccent') }}</em></h2>
        <p>{{ countCopy('home.pathwayVariants.table.intro') }}</p>
        <KindTabs
          :label="t('home.orbit.tabsLabel')"
          :active="activeKind"
          panel-id="pv-table-panel"
          :options="kindOptions"
          :tab-id="tabId"
          @choose="chooseKind"
          @keydown="onTabKeydown"
        />
      </header>

      <div id="pv-table-panel" class="sefirah__table-col" role="tabpanel" :aria-labelledby="tabId(activeKind)">
        <div class="round-table" :style="{ '--seat': `${seatSize}%` }">
          <div class="round-table__mist" aria-hidden="true"></div>

          <svg ref="svgRef" class="round-table__stone" viewBox="-100 -100 200 200" aria-hidden="true">
            <defs>
              <radialGradient id="pv-stone" cx="0" cy="0" r="70" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#1c2028" />
                <stop offset=".62" stop-color="#14171e" />
                <stop offset="1" stop-color="#0c0e13" />
              </radialGradient>
              <radialGradient id="pv-well" cx="0" cy="0" r="25" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="rgba(169, 198, 214, .16)" />
                <stop offset="1" stop-color="#07080b" />
              </radialGradient>
            </defs>
            <circle r="73" fill="none" stroke="rgba(214, 220, 228, .06)" stroke-width="5" />
            <circle r="70" fill="url(#pv-stone)" stroke="rgba(214, 220, 228, .24)" stroke-width=".5" />
            <circle r="66" fill="none" stroke="rgba(214, 220, 228, .1)" stroke-width=".35" />
            <g class="round-table__divisions" stroke="rgba(214, 220, 228, .09)" stroke-width=".35">
              <line v-for="index in activeCatalog.length" :key="index" :x1="0" :y1="-28" :x2="0" :y2="-66" :transform="`rotate(${(index - .5) * stepDeg})`" />
            </g>
            <g class="round-table__wedge" :style="{ transform: `rotate(${wedgeTurn * stepDeg}deg)` }">
              <path :d="wedgePath" fill="rgba(179, 32, 43, .2)" stroke="rgba(229, 84, 93, .55)" stroke-width=".4" />
            </g>
            <g class="round-table__names" :class="{ 'is-hidden': compact }">
              <text
                v-for="(entry, index) in activeCatalog"
                :key="entry.id"
                :class="{ 'is-lit': index === selectedIndex }"
                :transform="engraving(index).transform"
                :x="engraving(index).x"
                y="0"
                :text-anchor="engraving(index).anchor"
                dominant-baseline="central"
              >{{ nameOf(entry) }}</text>
            </g>
            <circle r="27" fill="none" stroke="rgba(214, 220, 228, .14)" stroke-width=".35" />
            <circle r="25" fill="url(#pv-well)" stroke="rgba(169, 198, 214, .35)" stroke-width=".4" />
          </svg>

          <div :key="`${activeKind}-${selectedEntry.id}`" class="round-table__well" aria-hidden="true">
            <img :src="selectedEntry.image" alt="" width="256" height="256" decoding="async" @error="replaceBrokenImage">
          </div>

          <div
            ref="seatsRef"
            class="round-table__seats"
            role="radiogroup"
            :aria-label="t(`home.pathwayVariants.table.seatsLabel.${activeKind}`)"
            @keydown="onSeatsKeydown"
          >
            <button
              v-for="(entry, index) in activeCatalog"
              :key="entry.id"
              type="button"
              role="radio"
              class="seat"
              :class="{ 'is-lit': index === selectedIndex }"
              :style="seatStyle(index)"
              :data-index="index"
              :tabindex="index === selectedIndex ? 0 : -1"
              :aria-checked="index === selectedIndex"
              :aria-label="`${seatLabel(index)}. ${nameOf(entry)}, ${sequenceLabel(entry)}`"
              :title="nameOf(entry)"
              @click="choose(index)"
            >
              <span class="seat__chair" aria-hidden="true"></span>
              <span class="seat__sigil">
                <img :src="entry.thumbnail" alt="" width="128" height="128" loading="lazy" decoding="async" draggable="false" @error="replaceBrokenImage">
              </span>
            </button>
          </div>
        </div>
        <p class="sefirah__hint">{{ t('home.pathwayVariants.table.hint') }}</p>
        <span class="visually-hidden" aria-live="polite">{{ announcement }}</span>
      </div>

      <article :key="`${activeKind}-${selectedEntry.id}`" class="place-card">
        <div class="place-card__head">
          <span class="place-card__numeral" aria-hidden="true">{{ numeral(selectedIndex) }}</span>
          <div>
            <p class="place-card__kicker">{{ t('home.pathwayVariants.table.occupant').replace('{numeral}', numeral(selectedIndex)) }}</p>
            <h3>{{ nameOf(selectedEntry) }}</h3>
            <p class="place-card__seq">{{ sequenceLabel(selectedEntry) }}</p>
          </div>
        </div>
        <p class="place-card__tagline">{{ taglineOf(selectedEntry) }}</p>
        <dl>
          <div>
            <dt>{{ t('home.orbit.earlyAbilities') }}</dt>
            <dd><ul><li v-for="ability in abilitiesOf(selectedEntry)" :key="ability">{{ ability }}</li></ul></dd>
          </div>
          <div>
            <dt>{{ t('home.orbit.archive') }}</dt>
            <dd>{{ archiveCounts(selectedEntry) }}</dd>
          </div>
        </dl>
        <div class="place-card__actions">
          <RouterLink class="fog-button" :to="$lp(selectedEntry.route)" :aria-label="archiveLabel(selectedEntry)">
            {{ t('home.orbit.openArchive') }}<span aria-hidden="true">↗</span>
          </RouterLink>
          <span class="place-card__steps">
            <button type="button" :aria-label="t('home.pathwayVariants.table.previous')" @click="step(-1)"><span aria-hidden="true">←</span></button>
            <button type="button" :aria-label="t('home.pathwayVariants.table.next')" @click="step(1)"><span aria-hidden="true">→</span></button>
          </span>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch, type CSSProperties } from 'vue';
import type { HomePathway, ProgressionKind } from '@/data/homePathways';
import KindTabs from './KindTabs.vue';
import { replaceBrokenImage, usePathwayDeck } from './usePathwayDeck';

const emit = defineEmits<{ selected: [pathway: HomePathway] }>();
const {
  t, currentLanguage, activeKind, selectedIndex, announcement, activeCatalog, selectedEntry, kindOptions,
  nameOf, abilitiesOf, countCopy, archiveCounts, sequenceLabel, taglineOf,
  numeral, archiveLabel, select, setKind, tabId, onTabKeydown, radioTarget,
} = usePathwayDeck((entry) => emit('selected', entry), 'pv-table');

const svgRef = ref<SVGSVGElement | null>(null);
const seatsRef = ref<HTMLElement | null>(null);
const compact = ref(false);

/* ---- Geometry, in percent of the table's square (SVG units are double) ---- */

const SEAT_RADIUS = 41.5;
const NAME_INNER = 29;   // SVG units: just outside the centre well
const NAME_OUTER = 63;   // SVG units: just inside the rim

const stepDeg = computed(() => 360 / activeCatalog.value.length);
/** Seat 0, the Fool's, is at the head of the table; the rest follow clockwise. */
const seatAngle = (index: number) => -90 + index * stepDeg.value;
const seatSize = computed(() => Math.min(12.5, (2 * Math.PI * SEAT_RADIUS / activeCatalog.value.length) * .8));

function seatStyle(index: number): CSSProperties {
  const angle = (seatAngle(index) * Math.PI) / 180;
  return {
    left: `${(50 + SEAT_RADIUS * Math.cos(angle)).toFixed(3)}%`,
    top: `${(50 + SEAT_RADIUS * Math.sin(angle)).toFixed(3)}%`,
    '--rot': `${seatAngle(index) + 90}deg`,
  } as CSSProperties;
}

/** Names are cut into the stone along each seat's slice, read from the outside in. */
function engraving(index: number) {
  const angle = seatAngle(index);
  const rightHalf = Math.cos((angle * Math.PI) / 180) > -1e-6;
  return rightHalf
    ? { transform: `rotate(${angle.toFixed(3)})`, x: NAME_OUTER, anchor: 'end' }
    : { transform: `rotate(${(angle + 180).toFixed(3)})`, x: -NAME_OUTER, anchor: 'start' };
}

/** The crimson slice in front of the chosen seat, drawn at the head and turned into place. */
const wedgePath = computed(() => {
  const half = (stepDeg.value / 2) * Math.PI / 180;
  const point = (radius: number, angle: number) => `${(radius * Math.sin(angle)).toFixed(3)} ${(-radius * Math.cos(angle)).toFixed(3)}`;
  const [inner, outer] = [27, 70];
  return `M ${point(inner, -half)} L ${point(outer, -half)} A ${outer} ${outer} 0 0 1 ${point(outer, half)} L ${point(inner, half)} A ${inner} ${inner} 0 0 0 ${point(inner, -half)} Z`;
});

/** Cumulative turns of the slice, so it always sweeps the short way round. */
const wedgeTurn = ref(0);
watch(selectedIndex, (next) => {
  const length = activeCatalog.value.length;
  const current = ((wedgeTurn.value % length) + length) % length;
  let delta = next - current;
  if (delta > length / 2) delta -= length;
  if (delta < -length / 2) delta += length;
  wedgeTurn.value += delta;
});

const seatLabel = (index: number) => t('home.pathwayVariants.table.seat').replace('{numeral}', String(activeKind.value === 'pathway' ? index : index + 1));

/* ---- Selection ---- */

function focusSeat(index: number) {
  void nextTick(() => seatsRef.value?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.focus({ preventScroll: true }));
}

function choose(index: number) {
  select(index);
}

function step(direction: number) {
  select(selectedIndex.value + direction, { announce: true });
}

function onSeatsKeydown(event: KeyboardEvent) {
  const index = radioTarget(event);
  if (index === null) return;
  select(index);
  focusSeat(index);
}

function chooseKind(kind: ProgressionKind) {
  setKind(kind);
}

/* Tabs switch by click or keys; either way the new table is set once it renders. */
watch(activeKind, () => {
  wedgeTurn.value = 0;
  fitEngravings();
}, { flush: 'post' });

/* ---- Long names are condensed to fit their slice ---- */

function fitEngravings() {
  const max = NAME_OUTER - NAME_INNER;
  svgRef.value?.querySelectorAll<SVGTextElement>('.round-table__names text').forEach((text) => {
    text.removeAttribute('textLength');
    text.removeAttribute('lengthAdjust');
    if (text.getComputedTextLength() > max) {
      text.setAttribute('textLength', String(max));
      text.setAttribute('lengthAdjust', 'spacingAndGlyphs');
    }
  });
}

watch(currentLanguage, () => void nextTick(fitEngravings));

let compactMedia: MediaQueryList | null = null;
const syncCompact = () => { compact.value = compactMedia?.matches ?? false; };

onMounted(() => {
  compactMedia = window.matchMedia('(max-width: 560px)');
  compactMedia.addEventListener('change', syncCompact);
  syncCompact();
  // Measure with the display face, not the fallback it replaces.
  fitEngravings();
  void document.fonts?.load('800 16px "Sofia Sans Extra Condensed"').then(fitEngravings, () => undefined);
  document.fonts?.addEventListener('loadingdone', fitEngravings);
});

onUnmounted(() => {
  compactMedia?.removeEventListener('change', syncCompact);
  document.fonts?.removeEventListener('loadingdone', fitEngravings);
});
</script>

<style scoped>
.sefirah {
  position: relative;
  padding: clamp(72px, 9vh, 100px) 0 clamp(64px, 8vh, 96px);
  overflow: clip;
  color: var(--bone);
  background:
    radial-gradient(ellipse 46% 56% at 34% 52%, rgba(30, 34, 43, .7), transparent 72%),
    var(--fog-0);
  isolation: isolate;
}

.sefirah__fog {
  position: absolute;
  z-index: -1;
  inset: 10% -50% 0;
  background-repeat: repeat-x;
  background-size: 50% 100%;
  background-image:
    radial-gradient(ellipse 14% 28% at 20% 62%, rgba(176, 184, 196, .08), transparent 70%),
    radial-gradient(ellipse 16% 22% at 62% 30%, rgba(176, 184, 196, .06), transparent 70%);
  pointer-events: none;
  animation: sefirah-fog 90s linear infinite;
}

@keyframes sefirah-fog { to { transform: translate3d(-25%, 0, 0); } }

/* Table on the left, everything that is read on the right. */
.sefirah__inner {
  width: min(100% - var(--home-content-gutter, 20px) * 2, 1280px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 440px);
  grid-template-rows: auto 1fr;
  grid-template-areas: "table head" "table card";
  align-items: start;
  gap: 28px clamp(32px, 5vw, 80px);
}

.sefirah__head { grid-area: head; }

.sefirah__head h2 {
  margin: 16px 0 0;
  font: 800 clamp(36px, 4.2vw, 62px)/.94 var(--font-display);
  text-transform: uppercase;
  text-wrap: balance;
}

.sefirah__head h2 em { display: block; color: var(--crimson-text); font-style: normal; }

.sefirah__head > p:not(.fog-label) {
  margin: 16px 0 20px;
  color: var(--ash);
  line-height: 1.6;
}

.sefirah__table-col {
  grid-area: table;
  align-self: center;
  display: grid;
  justify-items: center;
  gap: 14px;
}

/* ---- The table, seen from the vaulted ceiling ---- */
.round-table {
  position: relative;
  width: min(100%, 680px, calc(100svh - 150px));
  aspect-ratio: 1;
}

.round-table__stone {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  filter: drop-shadow(0 30px 60px rgba(0, 0, 0, .6));
}

/* Fog sliding over the stone, clipped to the tabletop. */
.round-table__mist {
  position: absolute;
  z-index: 1;
  inset: 15%;
  border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 0 14%, rgba(196, 204, 214, .07) 22%, transparent 34% 58%, rgba(196, 204, 214, .06) 70%, transparent 82%);
  pointer-events: none;
  animation: mist-turn 120s linear infinite;
}

.round-table__stone { z-index: 0; }
.round-table__mist { mix-blend-mode: screen; }

@keyframes mist-turn { to { transform: rotate(1turn); } }

.round-table__wedge {
  /* The viewBox is centred on 0 0, which is the table's centre. */
  transform-box: view-box;
  transform-origin: 0 0;
  transition: transform .6s var(--ease-out);
}

.round-table__names text {
  fill: var(--ash-dim);
  font: 800 4.6px var(--font-display);
  letter-spacing: .04em;
  text-transform: uppercase;
  /* Small text in a scaled viewBox: without this Chrome rounds glyph advances. */
  text-rendering: geometricPrecision;
  transition: fill .3s ease;
}

.round-table__names text.is-lit { fill: var(--bone); }
.round-table__names.is-hidden { display: none; }

.round-table__well {
  position: absolute;
  z-index: 2;
  left: 50%;
  top: 50%;
  width: 21%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  pointer-events: none;
  animation: well-in .7s var(--ease-out);
}

.round-table__well img { width: 100%; height: 100%; object-fit: contain; }

@keyframes well-in { from { opacity: 0; transform: translate(-50%, -50%) scale(.9); } }

.round-table__seats { position: absolute; z-index: 3; inset: 0; }

/* ---- A seat: the chair seen from above, its sigil upright on the cushion ---- */
.seat {
  position: absolute;
  width: var(--seat);
  aspect-ratio: 1;
  min-width: 40px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  cursor: pointer;
  transform: translate(-50%, -50%);
  transition: transform .35s var(--ease-out);
}

.seat__chair {
  position: absolute;
  inset: -4% -4% -4% -4%;
  border: 1px solid var(--line-strong);
  border-top-width: 4px;
  border-radius: 36% 36% 24% 24%;
  background: linear-gradient(180deg, #1e222b, #12151b);
  box-shadow: 0 8px 18px rgba(0, 0, 0, .55);
  transform: rotate(var(--rot));
  transition: border-color .3s ease, box-shadow .3s ease, background-color .3s ease;
}

.seat__sigil {
  position: absolute;
  inset: 10%;
  display: grid;
  place-items: center;
  border-radius: 50%;
}

.seat__sigil img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: grayscale(.85) brightness(.66);
  transition: filter .3s ease;
}

.seat:hover .seat__chair { border-color: rgba(169, 198, 214, .55); }
.seat:hover .seat__sigil img { filter: grayscale(.2) brightness(.9); }
.seat:focus-visible { outline: none; }
.seat:focus-visible .seat__chair { outline: 2px solid var(--crimson-text); outline-offset: 4px; }

.seat.is-lit { transform: translate(-50%, -50%) scale(1.16); z-index: 2; }
.seat.is-lit .seat__chair {
  border-color: var(--crimson);
  background: linear-gradient(180deg, #2a1418, #15090c);
  box-shadow: 0 0 0 1px var(--crimson), 0 0 26px rgba(179, 32, 43, .5), 0 10px 22px rgba(0, 0, 0, .6);
}
.seat.is-lit .seat__sigil img { filter: none; }

.sefirah__hint { margin: 0; color: var(--ash-dim); font-size: .8rem; text-align: center; }

/* ---- The place card: paper, because it is paper ---- */
.place-card {
  grid-area: card;
  position: relative;
  display: grid;
  gap: 18px;
  padding: 28px 28px 24px;
  border-radius: 6px;
  color: var(--paper-ink);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .22), transparent 30%),
    var(--paper);
  box-shadow: 0 1px 0 rgba(255, 255, 255, .4) inset, var(--shadow-deep);
  transform: rotate(-.8deg);
  animation: card-in .55s var(--ease-out);
}

/* A crimson fold along the top edge, like a reserved place card. */
.place-card::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 4px;
  border-radius: 6px 6px 0 0;
  background: var(--crimson);
}

@keyframes card-in { from { opacity: 0; transform: rotate(-.8deg) translateY(12px); } }

.place-card__head { display: flex; align-items: flex-start; gap: 18px; }

.place-card__numeral {
  min-width: 64px;
  padding-right: 16px;
  border-right: 1px solid rgba(29, 27, 23, .18);
  color: var(--crimson);
  font: 800 clamp(48px, 4.6vw, 68px)/.85 var(--font-display);
  font-variant-numeric: lining-nums;
}

.place-card__kicker {
  margin: 0;
  color: var(--paper-ink-muted);
  font: 500 .7rem/1.3 var(--font-mono);
  letter-spacing: .14em;
  text-transform: uppercase;
}

.place-card h3 {
  margin: 8px 0 0;
  font: 800 clamp(32px, 3vw, 46px)/.92 var(--font-display);
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.place-card__seq { margin: 6px 0 0; color: var(--paper-ink-muted); font-weight: 600; font-size: .92rem; }

.place-card__tagline { margin: 0; line-height: 1.6; }

.place-card dl { display: grid; gap: 14px; margin: 0; padding-top: 16px; border-top: 1px dashed rgba(29, 27, 23, .25); }
.place-card dt { margin-bottom: 8px; color: var(--paper-ink-muted); font: 500 .7rem/1 var(--font-mono); letter-spacing: .14em; text-transform: uppercase; }
.place-card dd { margin: 0; font-weight: 600; }
.place-card ul { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; list-style: none; }
.place-card li { padding: 5px 10px; border: 1px solid rgba(29, 27, 23, .22); border-radius: 999px; font-size: .86rem; line-height: 1.2; }

.place-card__actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.place-card__actions .fog-button { text-decoration: none; }
.place-card__actions .fog-button:focus-visible { outline: 2px solid var(--crimson); outline-offset: 3px; }

.place-card__steps { display: flex; gap: 8px; }
.place-card__steps button {
  width: 46px;
  height: 46px;
  border: 1px solid rgba(29, 27, 23, .3);
  border-radius: 50%;
  color: var(--paper-ink);
  background: transparent;
  cursor: pointer;
  transition: background-color .2s ease, border-color .2s ease;
}
.place-card__steps button:hover { border-color: var(--paper-ink); background: rgba(29, 27, 23, .06); }
.place-card__steps button:focus-visible { outline: 2px solid var(--crimson); outline-offset: 3px; }

/* ---- Below 900px: heading, table, card, stacked ---- */
@media (max-width: 899px) {
  .sefirah__inner {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    grid-template-areas: "head" "table" "card";
    gap: 26px;
  }
  .place-card { transform: none; }
  @keyframes card-in { from { opacity: 0; transform: translateY(12px); } }
}

@media (max-width: 560px) {
  .place-card { padding: 24px 20px 20px; }
  .place-card__numeral { min-width: 52px; padding-right: 12px; }
}

@media (prefers-reduced-motion: reduce) {
  .sefirah__fog,
  .round-table__mist,
  .round-table__well,
  .place-card { animation: none; }
  .round-table__wedge,
  .seat,
  .seat__chair,
  .seat__sigil img,
  .round-table__names text { transition: none; }
}
</style>
