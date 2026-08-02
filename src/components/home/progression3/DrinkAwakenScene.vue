<template>
  <div class="drink-scene" role="group" aria-label="Drink and awaken scene">
    <!-- gold aura: magic circle + radial glow + aura particles, anchored under the player -->
    <div class="drink-scene__aura" :style="auraAnchorStyle" aria-hidden="true">
      <div class="drink-scene__glow" :style="glowStyle" />
      <div class="drink-scene__circle" :style="circleStyle">
        <img
          class="drink-scene__circle-img"
          :src="magicCircle"
          alt=""
          width="256"
          height="256"
          decoding="async"
          draggable="false"
        />
      </div>
      <div class="drink-scene__fx" :style="auraFxStyle">
        <SceneParticles mode="aura" :active="auraActive" :intensity="auraIntensity" />
      </div>
    </div>

    <!-- Steve drinks the potion, then advances -->
    <div class="drink-scene__player" :style="playerStyle">
      <MinecraftPlayer :mode="playerMode" :active="active" :progress="p" @hand="onHand" />

      <!-- The actual Sequence potion stays locked to Steve's raised hand. -->
      <button
        type="button"
        class="hotspot potion"
        :style="potionStyle"
        aria-label="Sequence 9 Seer potion"
        @mouseenter="inspect('drink-potion', $event)"
        @mouseleave="emit('clear-inspect')"
        @focus="inspect('drink-potion', $event)"
        @blur="emit('clear-inspect')"
        @click="inspect('drink-potion', $event)"
      >
        <span class="potion__sprite" :style="liquidStyle">
          <img :src="sequencePotion" alt="" width="16" height="16" decoding="async" draggable="false" />
        </span>
      </button>
    </div>

    <!-- white-gold flash burst -->
    <div class="drink-scene__flash" :style="flashStyle" aria-hidden="true" />
    <div class="drink-scene__flash-fx" aria-hidden="true">
      <SceneParticles mode="burst" :active="burstActive" :intensity="1" />
    </div>

    <!-- awakened pathway panel -->
    <section class="panel" :style="panelStyle" role="group" aria-label="Awakened Seer pathway">
      <p class="panel__kicker" :style="itemStyle(kickerReveal)">Pathway Awakened</p>
      <h3 class="panel__title" :style="itemStyle(titleReveal)">SEER</h3>
      <p class="panel__sub" :style="itemStyle(subReveal)">Sequence 9 · Fool Pathway</p>
      <div class="panel__abilities">
        <button
          type="button"
          class="hotspot panel-ability"
          :style="itemStyle(chip1Reveal)"
          @mouseenter="inspect('ability-divination', $event)"
          @mouseleave="emit('clear-inspect')"
          @focus="inspect('ability-divination', $event)"
          @blur="emit('clear-inspect')"
          @click="inspect('ability-divination', $event)"
        >
          <span class="panel-ability__name">Divination</span>
          <span class="panel-ability__caption">Dowsing &amp; dream divination</span>
        </button>
        <button
          type="button"
          class="hotspot panel-ability"
          :style="itemStyle(chip2Reveal)"
          @mouseenter="inspect('ability-spiritualism', $event)"
          @mouseleave="emit('clear-inspect')"
          @focus="inspect('ability-spiritualism', $event)"
          @blur="emit('clear-inspect')"
          @click="inspect('ability-spiritualism', $event)"
        >
          <span class="panel-ability__name">Spiritualism</span>
          <span class="panel-ability__caption">Perceive spiritual bodies</span>
        </button>
      </div>
      <button
        type="button"
        class="hotspot panel-teaser"
        :style="itemStyle(teaserReveal)"
        @mouseenter="inspect('ability-teaser', $event)"
        @mouseleave="emit('clear-inspect')"
        @focus="inspect('ability-teaser', $event)"
        @blur="emit('clear-inspect')"
        @click="inspect('ability-teaser', $event)"
      >
        Sequence 8 · Clown — Paper Dagger &amp; Body Control await
      </button>
    </section>

    <!-- begin journey CTA -->
    <a class="cta" href="/play" :style="ctaStyle">Begin your journey</a>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { CSSProperties } from 'vue';

import MinecraftPlayer from '../MinecraftPlayer.vue';
import type { HandPosition } from '../MinecraftPlayer.vue';
import SceneParticles from './SceneParticles.vue';
import { useReducedMotion } from '@/composables/useReducedMotion';

import magicCircle from '@/assets/images/home/progression/real/magic-circle.png';
import sequencePotion from '@/assets/images/home/progression/real/sequence-potion.png';

const props = defineProps<{ progress: number; active: boolean }>()
const emit = defineEmits<{ (e: 'inspect', id: string, anchor: HTMLElement): void; (e: 'clear-inspect'): void }>()

const reduced = useReducedMotion();
const compact = ref(false);
let mediaQuery: MediaQueryList | null = null;

function syncCompact(): void {
  compact.value = mediaQuery?.matches ?? false;
}

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 820px)');
  syncCompact();
  mediaQuery.addEventListener('change', syncCompact);
});

onUnmounted(() => mediaQuery?.removeEventListener('change', syncCompact));

/* ---------------- helpers ---------------- */
function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}
function inspect(id: string, event: Event): void {
  const anchor = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  if (anchor) emit('inspect', id, anchor);
}

/* ---------------- local progress (guarded) ---------------- */
const p = computed(() => clamp01(props.progress));
const final = computed(() => reduced.value);

/* ---------------- player ---------------- */
const playerMode = computed<'drink' | 'advance'>(() => (final.value || p.value >= 0.68 ? 'advance' : 'drink'));
const playerStyle = computed<CSSProperties>(() => ({
  // Let the final awakening resolve in the centre of the stage. The drink beat
  // stays left-biased, so the ability panel never has to cover Steve.
  left: compact.value ? '50%' : `${(11 + awaken.value * 39).toFixed(2)}%`,
  bottom: compact.value ? 'auto' : '0',
  top: compact.value ? '0' : 'auto',
  width: compact.value ? 'min(150px, 36vw)' : 'min(190px, 22vw)',
  height: compact.value ? '44%' : '78%',
  transform: compact.value ? 'translateX(-50%)' : 'none',
}));

/* ---------------- potion chip (tracked to the model's raised hand) ---------------- */
const hand = ref<HandPosition | null>(null);
const potionIn = computed(() => (final.value ? 0 : clamp01(p.value / 0.06)));
const potionOut = computed(() => (final.value ? 0 : 1 - clamp01((p.value - 0.68) / 0.05)));
const potionOpacity = computed(() => potionIn.value * potionOut.value);
const emptyT = computed(() => (final.value ? 1 : clamp01((p.value - 0.12) / 0.48)));
const potionBob = computed(() => (final.value ? 0 : Math.sin(p.value * 26) * 3.5));

function onHand(pos: HandPosition | null): void {
  hand.value = pos;
}

const potionStyle = computed<CSSProperties>(() => {
  const tracked = hand.value;
  // tip the bottle up as it empties, as if draining into the mouth
  const tip = emptyT.value * 46;
  const centered = `translate(-50%, -50%) translateY(${potionBob.value.toFixed(2)}px) rotate(-${tip.toFixed(1)}deg)`;
  const pos = tracked ? { left: `${tracked.x.toFixed(1)}px`, top: `${tracked.y.toFixed(1)}px` } : { left: '50%', top: '16%' };
  return {
    ...pos,
    transform: centered,
    opacity: potionOpacity.value.toFixed(4),
    pointerEvents: potionOpacity.value > 0.4 ? 'auto' : 'none',
  };
});

const liquidStyle = computed<CSSProperties>(() => ({
  clipPath: `inset(${(emptyT.value * 100).toFixed(2)}% 0 0 0)`,
}));

/* ---------------- aura: circle + glow + particles, 0.25 -> 0.72 ---------------- */
const auraIn = computed(() => (final.value ? 1 : clamp01((p.value - 0.25) / 0.08)));
// The ritual circle does not disappear when the player awakens: it becomes the
// quieter, persistent base of the final Seer reveal.
const auraOut = computed(() => (final.value ? 1 : (p.value >= 0.72 ? 0.76 : 1)));
const auraOpacity = computed(() => auraIn.value * auraOut.value);
const inAuraRange = computed(() => p.value >= 0.25);
const auraActive = computed(() => props.active && (final.value || inAuraRange.value));
const auraIntensity = computed(() => (final.value || p.value >= 0.72 ? 0.7 : 0.35 + 0.65 * auraOpacity.value));

const auraAnchorStyle = computed<CSSProperties>(() => ({
  left: compact.value ? '50%' : `${(21 + awaken.value * 29).toFixed(2)}%`,
  bottom: compact.value ? '38%' : '7%',
}));

const circleStyle = computed<CSSProperties>(() => ({
  opacity: (auraOpacity.value * 0.92).toFixed(4),
  transform: `translate(-50%, 50%) rotate(${(final.value ? 96 : p.value * 140).toFixed(2)}deg) scale(${(0.86 + 0.14 * auraOpacity.value).toFixed(4)})`,
  filter: `brightness(${(0.5 + 0.5 * auraOpacity.value).toFixed(3)}) saturate(${(0.85 + 0.2 * auraOpacity.value).toFixed(3)}) drop-shadow(0 0 ${(8 + 22 * auraOpacity.value).toFixed(1)}px rgba(223,185,104,${(0.22 * auraOpacity.value).toFixed(3)}))`,
}));

const glowStyle = computed<CSSProperties>(() => ({
  opacity: (auraOpacity.value * 0.9).toFixed(4),
  transform: `translate(-50%, 50%) scale(${(0.72 + 0.55 * auraOpacity.value).toFixed(4)})`,
}));

const auraFxStyle = computed<CSSProperties>(() => ({
  opacity: auraOpacity.value.toFixed(4),
  transform: 'translate(-50%, 50%)',
}));

/* ---------------- flash burst, 0.6 -> 0.72 ---------------- */
const flashStyle = computed<CSSProperties>(() => {
  const spike = clamp01((p.value - 0.6) / 0.04);
  const decay = 1 - clamp01((p.value - 0.64) / 0.08);
  const intensity = clamp01(spike * decay);
  return { opacity: intensity.toFixed(4) };
});
const burstActive = computed(() => props.active && !final.value && p.value >= 0.6 && p.value < 0.74);

/* ---------------- awaken panel, 0.72 -> 1 ---------------- */
const awaken = computed(() => (final.value ? 1 : clamp01((p.value - 0.72) / 0.16)));

const panelStyle = computed<CSSProperties>(() => {
  const e = easeOutCubic(awaken.value);
  const slide = (1 - e) * 132;
  return {
    left: compact.value ? '50%' : 'auto',
    right: compact.value ? 'auto' : '6%',
    top: compact.value ? 'auto' : '50%',
    bottom: compact.value ? '66px' : 'auto',
    transform: `translateY(${compact.value ? 0 : -50}%) translateX(calc(${compact.value ? -50 : 0}% + ${slide.toFixed(1)}%))`,
    opacity: clamp01(awaken.value * 3).toFixed(4),
    pointerEvents: awaken.value > 0.5 ? 'auto' : 'none',
  };
});

function itemStyle(reveal: number): CSSProperties {
  return {
    opacity: reveal.toFixed(4),
    transform: `translateX(${((1 - reveal) * 42).toFixed(1)}px)`,
    pointerEvents: reveal > 0.5 ? 'auto' : 'none',
  };
}
const kickerReveal = computed(() => (final.value ? 1 : clamp01(awaken.value / 0.16)));
const titleReveal = computed(() => (final.value ? 1 : clamp01((awaken.value - 0.03) / 0.16)));
const subReveal = computed(() => (final.value ? 1 : clamp01((awaken.value - 0.06) / 0.16)));
const chip1Reveal = computed(() => (final.value ? 1 : clamp01((awaken.value - 0.13) / 0.16)));
const chip2Reveal = computed(() => (final.value ? 1 : clamp01((awaken.value - 0.21) / 0.16)));
const teaserReveal = computed(() => (final.value ? 1 : clamp01((awaken.value - 0.29) / 0.16)));

/* ---------------- CTA, 0.9 -> 1 ---------------- */
const ctaT = computed(() => (final.value ? 1 : clamp01((p.value - 0.9) / 0.08)));
const ctaStyle = computed<CSSProperties>(() => ({
  opacity: ctaT.value.toFixed(4),
  transform: `translateX(-50%) translateY(${((1 - ctaT.value) * 20).toFixed(1)}px)`,
  pointerEvents: ctaT.value > 0.5 ? 'auto' : 'none',
}));
</script>

<style scoped>
.drink-scene {
  --gold: #dfb968;
  --pale-gold: #f0d38c;
  --green: #83bca2;
  --bg: #071719;
  --ease: cubic-bezier(.22, 1, .36, 1);
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  color: #fcf9f2;
  font-family: "IBM Plex Mono", monospace;
}

/* shared hotspot base: 44px min touch target, gold focus ring */
.hotspot {
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-family: inherit;
}
.hotspot:focus-visible {
  outline: 3px solid #f0d38c;
  outline-offset: 3px;
}

/* ---------- aura anchor (zero-size point; children center on it) ---------- */
.drink-scene__aura {
  position: absolute;
  z-index: 1;
  width: 0;
  height: 0;
  pointer-events: none;
}
.drink-scene__glow {
  position: absolute;
  left: 0;
  bottom: 0;
  width: min(320px, 44vw);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(223, 185, 104, .34), rgba(131, 190, 164, .16) 46%, transparent 72%);
  filter: blur(18px);
  transform-origin: 50% 50%;
  will-change: transform, opacity;
}
.drink-scene__circle {
  position: absolute;
  left: 0;
  bottom: 0;
  width: min(230px, 34vw);
  aspect-ratio: 1;
  transform-origin: 50% 50%;
  will-change: transform, opacity, filter;
}
.drink-scene__circle-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  mix-blend-mode: screen;
  -webkit-user-drag: none;
}
.drink-scene__fx {
  position: absolute;
  left: 0;
  bottom: 0;
  width: min(300px, 42vw);
  height: min(300px, 42vw);
  will-change: opacity;
}

/* ---------- player (left-of-center, anchored bottom on desktop) ---------- */
.drink-scene__player {
  position: absolute;
  z-index: 5;
  min-width: 0;
  pointer-events: none;
  transition: left .5s var(--ease);
}

/* ---------- potion chip (inside the player wrapper, at the model's hand) ---------- */
.potion {
  position: absolute;
  z-index: 6;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  pointer-events: auto;
  will-change: transform, opacity;
}
.potion__sprite {
  position: relative;
  display: block;
  width: 54px;
  height: 54px;
  filter: drop-shadow(0 5px 7px rgba(0, 0, 0, .56));
  transition: filter .2s ease;
}
.potion__sprite img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}
.potion:hover .potion__sprite,
.potion:focus-visible .potion__sprite {
  filter: drop-shadow(0 0 11px rgba(240, 211, 140, .8));
}

/* ---------- flash burst overlay ---------- */
.drink-scene__flash {
  position: absolute;
  inset: 0;
  z-index: 30;
  pointer-events: none;
  background: radial-gradient(circle at 50% 42%, rgba(255, 248, 226, .95), rgba(240, 211, 140, .5) 34%, rgba(223, 185, 104, .16) 58%, transparent 80%);
  will-change: opacity;
}
.drink-scene__flash-fx {
  position: absolute;
  inset: 0;
  z-index: 31;
  pointer-events: none;
}

/* ---------- awaken panel (slides in from the right) ---------- */
.panel {
  position: absolute;
  z-index: 40;
  width: min(332px, 30vw);
  padding: 15px;
  border: 1px solid rgba(223, 185, 104, .4);
  border-radius: 13px;
  background: linear-gradient(135deg, rgba(10, 34, 31, .98), rgba(4, 18, 20, .96));
  box-shadow: 0 24px 48px rgba(0, 0, 0, .5), inset 0 1px rgba(240, 211, 140, .1), 0 0 30px rgba(223, 185, 104, .1);
  will-change: transform, opacity;
}
.panel__kicker {
  margin: 0 0 4px;
  color: var(--gold);
  font-family: "IBM Plex Mono", monospace;
  font-size: .72rem;
  font-weight: 600;
  letter-spacing: .22em;
  text-transform: uppercase;
  text-shadow: 0 0 12px rgba(223, 185, 104, .35);
}
.panel__title {
  margin: 0;
  color: var(--pale-gold);
  font-family: "IBM Plex Sans Condensed", sans-serif;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: .04em;
  text-transform: uppercase;
  text-shadow: 0 0 18px rgba(223, 185, 104, .45);
}
.panel__sub {
  margin: 4px 0 12px;
  color: rgba(252, 249, 242, .72);
  font-size: .78rem;
  letter-spacing: .08em;
}
.panel__abilities {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.panel-ability {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 44px;
  min-height: 44px;
  padding: 9px 10px;
  border: 1px solid rgba(131, 190, 164, .32);
  border-radius: 10px;
  background: rgba(7, 23, 25, .85);
  text-align: left;
  will-change: transform, opacity;
  transition: border-color .2s ease, background-color .2s ease, box-shadow .25s ease;
}
.panel-ability__name {
  color: var(--pale-gold);
  font-size: .82rem;
  font-weight: 600;
  letter-spacing: .04em;
}
.panel-ability__caption {
  color: rgba(252, 249, 242, .62);
  font-size: .72rem;
  line-height: 1.35;
}
.panel-ability:hover,
.panel-ability:focus-visible {
  border-color: var(--gold);
  background: rgba(8, 31, 31, .97);
  box-shadow: 0 0 14px rgba(223, 185, 104, .18);
}
.panel-teaser {
  display: block;
  width: 100%;
  min-width: 44px;
  min-height: 44px;
  margin-top: 8px;
  padding: 8px 10px;
  border: 1px dashed rgba(223, 185, 104, .3);
  border-radius: 10px;
  background: transparent;
  color: rgba(240, 211, 140, .68);
  font-size: .72rem;
  line-height: 1.4;
  text-align: left;
  will-change: transform, opacity;
  transition: border-color .2s ease, color .2s ease, background-color .2s ease;
}
.panel-teaser:hover,
.panel-teaser:focus-visible {
  border-color: rgba(223, 185, 104, .6);
  color: var(--pale-gold);
  background: rgba(223, 185, 104, .06);
}

/* ---------- CTA pill ---------- */
.cta {
  position: absolute;
  z-index: 50;
  left: 50%;
  bottom: 7%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 11px 26px;
  border: 1px solid var(--gold);
  border-radius: 999px;
  color: var(--pale-gold);
  font-family: "IBM Plex Mono", monospace;
  font-size: .78rem;
  font-weight: 600;
  letter-spacing: .18em;
  text-transform: uppercase;
  text-decoration: none;
  background: rgba(223, 185, 104, .08);
  box-shadow: 0 0 18px rgba(223, 185, 104, .18);
  white-space: nowrap;
  will-change: transform, opacity;
  transition: background-color .2s ease, box-shadow .25s ease;
}
.cta:hover,
.cta:focus-visible {
  background: rgba(223, 185, 104, .16);
  box-shadow: 0 0 26px rgba(223, 185, 104, .34);
}
.cta:focus-visible {
  outline: 3px solid #f0d38c;
  outline-offset: 3px;
}

/* ---------- mobile: player centers, panel docks below the player ---------- */
@media (max-width: 820px) {
  .drink-scene__glow {
    width: min(240px, 60vw);
  }
  .drink-scene__circle {
    width: min(190px, 44vw);
  }
  .drink-scene__fx {
    width: min(230px, 54vw);
    height: min(230px, 54vw);
  }
  .potion__sprite {
    width: 48px;
    height: 48px;
  }
  .panel {
    width: min(380px, 94vw);
    padding: 11px;
  }
  .panel__title {
    font-size: 1.6rem;
  }
  .panel__sub {
    margin-bottom: 9px;
    font-size: .74rem;
  }
  .panel__abilities {
    gap: 6px;
  }
  .panel-ability {
    padding: 7px 8px;
  }
  .panel-ability__caption {
    font-size: .7rem;
  }
  .panel-teaser {
    margin-top: 6px;
    font-size: .7rem;
  }
  .cta {
    bottom: 16px;
    padding: 10px 20px;
    font-size: .74rem;
  }
}

/* ---------- reduced motion: static final state, no transitions ---------- */
@media (prefers-reduced-motion: reduce) {
  .drink-scene__glow,
  .drink-scene__circle,
  .drink-scene__fx,
  .potion,
  .drink-scene__flash,
  .panel,
  .panel-ability,
  .panel-teaser,
  .cta {
    transition: none;
  }
}
</style>
