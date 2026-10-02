<template>
  <div class="drink-scene" :style="sceneVars" role="group" :aria-label="tp('drink.sceneLabel')">
    <!-- The Crimson Moon rises behind the player as the fog parts. -->
    <div class="drink-scene__moon" aria-hidden="true" />
    <!-- Spirit-vision light: a column rising from the ritual circle. -->
    <div class="drink-scene__beam" aria-hidden="true" />

    <!-- Ritual circle laid on the floor under the player. -->
    <div class="drink-scene__floor" aria-hidden="true">
      <div class="drink-scene__pool" />
      <div class="drink-scene__circle" :style="circleStyle" />
      <div class="drink-scene__fx">
        <SceneParticles mode="aura" :active="auraActive" :intensity="auraIntensity" />
      </div>
    </div>

    <!-- The player drinks the potion, then rises -->
    <div class="drink-scene__player">
      <MinecraftPlayer
        :mode="playerMode"
        :armed="warm"
        :progress="p"
        :glow="awaken"
        :label="tp(`player.${playerMode}`)"
        @hand="onHand"
      />

      <!-- The actual Sequence potion stays locked to the player's raised hand. -->
      <button
        type="button"
        class="hotspot potion"
        :style="potionStyle"
        :aria-label="tp('drink.potionLabel')"
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

    <!-- low mist over the floor until the awakening burns it off -->
    <div class="drink-scene__mist" aria-hidden="true" />

    <!-- the moment of awakening: a flash of spirit-vision -->
    <div class="drink-scene__flash" :style="flashStyle" aria-hidden="true" />
    <div class="drink-scene__flash-fx" aria-hidden="true">
      <SceneParticles mode="burst" :active="burstActive" :intensity="1" />
    </div>

    <!-- awakened pathway -->
    <section class="panel" :style="panelStyle" role="group" :aria-label="tp('drink.panelLabel')">
      <p class="fog-label panel__kicker" :style="itemStyle(kickerReveal)">{{ tp('drink.panelKicker') }}</p>
      <h3 class="panel__title" :style="itemStyle(titleReveal)">{{ names.sequence }}</h3>
      <p class="panel__sub" :style="itemStyle(subReveal)">{{ tp('drink.panelSub') }}</p>
      <div v-if="names.abilities.length" class="panel__abilities">
        <button
          v-for="(ability, index) in names.abilities"
          :key="ability.id"
          type="button"
          class="hotspot panel-ability"
          :style="itemStyle(index === 0 ? chip1Reveal : chip2Reveal)"
          @mouseenter="inspect(`ability-${ability.id}`, $event)"
          @mouseleave="emit('clear-inspect')"
          @focus="inspect(`ability-${ability.id}`, $event)"
          @blur="emit('clear-inspect')"
          @click="inspect(`ability-${ability.id}`, $event)"
        >
          <span class="panel-ability__name">{{ ability.name }}</span>
          <span class="panel-ability__caption">{{ ability.description }}</span>
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
        {{ teaserText }}
      </button>
      <RouterLink class="fog-button panel__cta" :to="$lp('/game')" :style="itemStyle(ctaReveal)">
        {{ tp('drink.cta') }} <span aria-hidden="true">→</span>
      </RouterLink>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { CSSProperties } from 'vue';

import MinecraftPlayer from '../MinecraftPlayer.vue';
import type { HandPosition } from '../MinecraftPlayer.vue';
import SceneParticles from './SceneParticles.vue';
import { useProgressionCopy } from './useProgressionCopy';
import { useReducedMotion } from '@/composables/useReducedMotion';

import magicCircle from '@/assets/images/home/progression/real/magic-circle.png';
import sequencePotion from '@/assets/images/home/progression/real/sequence-potion.png';

const props = withDefaults(defineProps<{
  progress: number;
  active: boolean;
  /** The story is close to this scene: allow the 3D player to load. */
  warm?: boolean;
}>(), { warm: false });
const emit = defineEmits<{ (e: 'inspect', id: string, anchor: HTMLElement): void; (e: 'clear-inspect'): void }>();

const reduced = useReducedMotion();
const { tp, names, list } = useProgressionCopy();
const teaserText = computed(() => {
  const abilities = names.value.nextAbilities.map((ability) => ability.name);
  if (!abilities.length) return tp('details.nextSequence.label');
  return tp('drink.teaser', { abilities: list(abilities) });
});

/*
 * Local beats (0..1 of this scene):
 *   0.00-0.40  the player drinks; the potion empties; the circle wakes under the fog
 *   0.38-0.50  flash of spirit-vision
 *   0.42-0.62  awakening: the fog parts, the moon rises, the light column climbs
 *   0.62-1.00  held climax with the awakened Sequence and the CTA
 * ProgressionStoryV3 starts its "Awaken" chapter at 0.40 and parts its own
 * fog over 0.40-0.62 to match.
 */
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

const p = computed(() => clamp01(props.progress));
const final = computed(() => reduced.value);
const awaken = computed(() => (final.value ? 1 : easeOutCubic(clamp01((p.value - 0.42) / 0.2))));

/* ---------------- player ---------------- */
const playerMode = computed<'drink' | 'advance'>(() => (final.value || p.value >= 0.42 ? 'advance' : 'drink'));

/* ---------------- potion (tracked to the model's raised hand) ---------------- */
const hand = ref<HandPosition | null>(null);
const potionIn = computed(() => (final.value ? 0 : clamp01(p.value / 0.05)));
const potionOut = computed(() => (final.value ? 0 : 1 - clamp01((p.value - 0.39) / 0.04)));
const potionOpacity = computed(() => potionIn.value * potionOut.value);
const emptyT = computed(() => (final.value ? 1 : clamp01((p.value - 0.06) / 0.3)));
const potionBob = computed(() => (final.value ? 0 : Math.sin(p.value * 40) * 3.5));

function onHand(pos: HandPosition | null): void {
  hand.value = pos;
}

const potionStyle = computed<CSSProperties>(() => {
  const tracked = hand.value;
  // tip the bottle up as it empties, as if draining into the mouth
  const tip = emptyT.value * 46;
  const pos = tracked ? { left: `${tracked.x.toFixed(1)}px`, top: `${tracked.y.toFixed(1)}px` } : { left: '50%', top: '16%' };
  return {
    ...pos,
    transform: `translate(-50%, -50%) translateY(${potionBob.value.toFixed(2)}px) rotate(-${tip.toFixed(1)}deg)`,
    opacity: potionOpacity.value.toFixed(4),
    pointerEvents: potionOpacity.value > 0.4 ? 'auto' : 'none',
  };
});

const liquidStyle = computed<CSSProperties>(() => ({
  clipPath: `inset(${(emptyT.value * 100).toFixed(2)}% 0 0 0)`,
}));

/* ---------------- ritual circle: wakes under the fog, blazes at the awakening ---------------- */
const circleWake = computed(() => (final.value ? 1 : clamp01((p.value - 0.12) / 0.12)));
const auraActive = computed(() => props.active && (final.value || p.value >= 0.12));
const auraIntensity = computed(() => 0.35 + 0.65 * awaken.value);

// Only the painted sigil (a pseudo-element) spins: the foreshortened disc's
// box stays put inside the stage.
const circleStyle = computed(() => ({
  '--circle-mask': `url(${magicCircle})`,
  '--circle-spin': `${(final.value ? 96 : p.value * 160).toFixed(2)}deg`,
  transform: `scale(${(0.86 + 0.14 * circleWake.value).toFixed(4)})`,
}));

// Scene-wide drivers read by the stylesheet.
const sceneVars = computed(() => ({
  '--wake': circleWake.value.toFixed(4),
  '--awaken': awaken.value.toFixed(4),
}));

/* ---------------- flash ---------------- */
const flashStyle = computed<CSSProperties>(() => {
  const spike = clamp01((p.value - 0.38) / 0.04);
  const decay = 1 - clamp01((p.value - 0.42) / 0.08);
  return { opacity: (final.value ? 0 : clamp01(spike * decay)).toFixed(4) };
});
const burstActive = computed(() => props.active && !final.value && p.value >= 0.4 && p.value < 0.54);

/* ---------------- awakened panel ---------------- */
const panelStyle = computed<CSSProperties>(() => ({
  opacity: clamp01(awaken.value * 3).toFixed(4),
  // Fades in place (its lines rise in on their own): sliding it in from the
  // right pushed the panel past the clipped stage edge mid-reveal.
  transform: 'translateY(-50%)',
  pointerEvents: awaken.value > 0.5 ? 'auto' : 'none',
}));

function itemStyle(reveal: number): CSSProperties {
  return {
    opacity: reveal.toFixed(4),
    transform: `translateY(${((1 - reveal) * 16).toFixed(1)}px)`,
    pointerEvents: reveal > 0.5 ? 'auto' : 'none',
  };
}
const stagger = (offset: number) => computed(() => (final.value ? 1 : clamp01((p.value - 0.44 - offset) / 0.08)));
const kickerReveal = stagger(0);
const titleReveal = stagger(0.02);
const subReveal = stagger(0.04);
const chip1Reveal = stagger(0.08);
const chip2Reveal = stagger(0.11);
const teaserReveal = stagger(0.14);
const ctaReveal = stagger(0.17);
</script>

<style scoped>
.drink-scene {
  --wake: 0;
  --awaken: 0;
  /* the player's feet: the circle, beam and moon all centre on this */
  --stand-x: 31%;
  /* high enough that the foreshortened circle (0.15 x its width below the
     feet) and its glow stay inside the clipped stage */
  --circle-size: min(400px, 40vw);
  --floor-y: max(8%, calc(var(--circle-size) * 0.15 + 22px));
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  color: var(--bone);
  font-family: var(--font-body);
}

/* shared hotspot base: 44px min touch target, crimson focus ring */
.hotspot {
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-family: inherit;
}
.hotspot:focus-visible {
  outline: 2px solid var(--crimson-text);
  outline-offset: 3px;
}

/* ---------- the Crimson Moon (matches the hero's) ---------- */
.drink-scene__moon {
  position: absolute;
  top: 5%;
  left: var(--stand-x);
  width: min(290px, 29vw);
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    radial-gradient(circle at 32% 40%, rgba(50, 4, 10, 0.22), transparent 16%),
    radial-gradient(circle at 63% 63%, rgba(50, 4, 10, 0.18), transparent 21%),
    radial-gradient(circle at 70% 31%, rgba(50, 4, 10, 0.14), transparent 11%),
    radial-gradient(circle at 50% 50%, #a51d28 0%, #8e1720 60%, #6c1018 100%);
  box-shadow:
    inset -10px -14px 40px rgba(20, 2, 5, 0.45),
    0 0 60px 8px rgba(179, 32, 43, 0.35),
    0 0 180px 60px rgba(179, 32, 43, 0.14);
  opacity: calc(var(--awaken) * 0.9);
  transform: translate3d(-50%, calc((1 - var(--awaken)) * 70px), 0);
  pointer-events: none;
}

/* ---------- spirit-vision light column ---------- */
.drink-scene__beam {
  position: absolute;
  bottom: var(--floor-y);
  left: var(--stand-x);
  width: min(260px, 26vw);
  height: 92%;
  background: radial-gradient(ellipse 50% 100% at 50% 100%, rgba(229, 84, 93, 0.42), rgba(179, 32, 43, 0.14) 55%, transparent 80%);
  mix-blend-mode: screen;
  opacity: var(--awaken);
  transform: translateX(-50%) scaleY(calc(0.3 + var(--awaken) * 0.7));
  transform-origin: 50% 100%;
  pointer-events: none;
}

/* ---------- ritual circle on the floor ---------- */
.drink-scene__floor {
  position: absolute;
  z-index: 1;
  bottom: var(--floor-y);
  left: var(--stand-x);
  width: 0;
  height: 0;
  pointer-events: none;
}

.drink-scene__floor > * {
  position: absolute;
  left: 0;
  top: 0;
}

.drink-scene__pool {
  width: min(460px, 46vw);
  aspect-ratio: 3;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(179, 32, 43, 0.5), rgba(142, 23, 32, 0.16) 50%, transparent 72%);
  opacity: calc(var(--wake) * (0.35 + var(--awaken) * 0.65));
  transform: translate(-50%, -50%);
}

/* The circle lies on the ground: a foreshortened sigil, not a backdrop disc. */
.drink-scene__circle {
  width: var(--circle-size);
  aspect-ratio: 1;
  margin: calc(var(--circle-size) / -2) 0 0 calc(var(--circle-size) / -2);
  opacity: calc(var(--wake) * (0.45 + var(--awaken) * 0.55));
  transform-origin: 50% 50%;
  /* rotateX here, spin from the inline transform on the art's parent */
  scale: 1 0.3;
  filter: drop-shadow(0 0 calc(6px + var(--awaken) * 18px) rgba(229, 84, 93, 0.75));
  will-change: transform, opacity;
}

.drink-scene__circle::before {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--crimson-text), var(--crimson) 70%);
  content: '';
  transform: rotate(var(--circle-spin, 0deg));
  mask-image: var(--circle-mask);
  -webkit-mask-image: var(--circle-mask);
  mask-position: center;
  mask-repeat: no-repeat;
  mask-size: contain;
  mask-mode: luminance;
  -webkit-mask-position: center;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: contain;
}

.drink-scene__fx {
  width: min(340px, 34vw);
  height: min(340px, 34vw);
  opacity: var(--wake);
  transform: translate(-50%, -62%);
}

/* ---------- player (feet on the circle) ---------- */
.drink-scene__player {
  position: absolute;
  z-index: 5;
  bottom: var(--floor-y);
  left: var(--stand-x);
  width: min(200px, 20vw);
  height: 70%;
  min-width: 0;
  pointer-events: none;
  transform: translateX(-50%);
}

/* ---------- potion (inside the player wrapper, at the model's hand) ---------- */
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
  width: 64px;
  height: 64px;
  filter: drop-shadow(0 5px 7px rgba(0, 0, 0, 0.55));
  transition: filter 0.2s ease;
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
  filter: drop-shadow(0 0 11px rgba(229, 84, 93, 0.7));
}

/* ---------- floor mist, burnt off by the awakening ---------- */
.drink-scene__mist {
  position: absolute;
  z-index: 6;
  right: 0;
  bottom: 0;
  left: 0;
  height: 40%;
  /* soft on every side: the stage clips, the mist must not show it */
  -webkit-mask-image: radial-gradient(ellipse 50% 50% at 50% 55%, #000 40%, transparent 100%);
  mask-image: radial-gradient(ellipse 50% 50% at 50% 55%, #000 40%, transparent 100%);
  background:
    radial-gradient(ellipse 30% 50% at 22% 70%, rgba(200, 206, 214, 0.22), transparent 72%),
    radial-gradient(ellipse 34% 46% at 58% 80%, rgba(200, 206, 214, 0.16), transparent 72%),
    radial-gradient(ellipse 24% 40% at 88% 70%, rgba(200, 206, 214, 0.14), transparent 72%);
  opacity: calc(1 - var(--awaken) * 0.85);
  transform: translateY(calc(var(--awaken) * 30%));
  pointer-events: none;
}

/* ---------- flash ---------- */
.drink-scene__flash {
  position: absolute;
  inset: 0;
  z-index: 30;
  pointer-events: none;
  /* sized to fade out before the stage edges, which clip it */
  background: radial-gradient(ellipse 30% 46% at var(--stand-x) 46%, rgba(236, 230, 218, 0.92), rgba(229, 84, 93, 0.45) 34%, rgba(142, 23, 32, 0.2) 66%, transparent 100%);
  will-change: opacity;
}
.drink-scene__flash-fx {
  position: absolute;
  z-index: 31;
  top: 10%;
  bottom: 10%;
  left: calc(var(--stand-x) - 25%);
  width: 50%;
  pointer-events: none;
}

/* ---------- awakened panel ---------- */
.panel {
  position: absolute;
  z-index: 40;
  top: 50%;
  right: 2%;
  width: min(380px, 38%);
  padding-left: 28px;
  border-left: 1px solid rgba(229, 84, 93, 0.5);
  will-change: transform, opacity;
}
.panel__kicker {
  margin: 0;
}
.panel__title {
  margin: 14px 0 10px;
  color: var(--bone);
  font: 800 clamp(3.4rem, 5.6vw, 5.4rem)/0.88 var(--font-display);
  text-transform: uppercase;
  letter-spacing: .005em;
  text-shadow: 0 0 46px rgba(179, 32, 43, 0.55);
}
.panel__sub {
  margin: 0 0 22px;
  color: var(--ash);
  font: 500 1.02rem/1.45 var(--font-body);
}
.panel__abilities {
  display: grid;
  border-top: 1px solid var(--line);
}
.panel-ability {
  display: grid;
  gap: 3px;
  min-height: 44px;
  padding: 12px 0;
  border-bottom: 1px solid var(--line);
  text-align: left;
  transition: color 0.2s ease;
}
.panel-ability__name {
  color: var(--bone);
  font-size: 0.98rem;
  font-weight: 600;
}
.panel-ability__caption {
  color: var(--ash);
  font-size: 0.86rem;
  line-height: 1.45;
}
.panel-ability:hover .panel-ability__name,
.panel-ability:focus-visible .panel-ability__name {
  color: var(--crimson-text);
}
.panel-teaser {
  display: block;
  width: 100%;
  min-height: 44px;
  margin-top: 14px;
  padding: 10px 12px;
  border: 1px dashed rgba(229, 84, 93, 0.45);
  border-radius: 6px;
  color: var(--ash);
  font-size: 0.84rem;
  line-height: 1.45;
  text-align: left;
  transition: border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease;
}
.panel-teaser:hover,
.panel-teaser:focus-visible {
  border-color: var(--crimson-text);
  color: var(--bone);
  background: var(--crimson-tint);
}
.panel__cta {
  margin-top: 22px;
}

@media (prefers-reduced-motion: reduce) {
  .potion__sprite,
  .panel-ability,
  .panel-teaser {
    transition: none;
  }
}
</style>
