<template>
  <div class="drink-scene" :style="sceneVars" role="group" :aria-label="tp('drink.sceneLabel')">
    <!-- Spirit-vision light: a column rising from the circle at the awakening. -->
    <div class="drink-scene__beam" aria-hidden="true" />

    <!-- The brewing circle again, rekindled under the player's feet. -->
    <div class="drink-scene__floor" aria-hidden="true">
      <div class="drink-scene__pool" />
      <div class="drink-scene__circle" :style="circleStyle" />
      <div class="drink-scene__fx">
        <SceneParticles mode="aura" :active="auraActive" :intensity="auraIntensity" :accent="card.accent" />
      </div>
    </div>

    <!-- The reading turns up: the card he drew, and one face down. -->
    <div class="drink-scene__cards" aria-hidden="true">
      <div v-for="c in cards" :key="c.id" class="reading-card" :style="c.style">
        <!-- turned over in the picture plane: the back narrows away, the face opens -->
        <span v-if="!c.showFace" class="reading-card__back" :style="c.sideStyle"><i /></span>
        <span v-else class="reading-card__front" :style="c.sideStyle">
          <ArcanaFace :id="currentId" :name="reading.name" :role="reading.seq9" eager />
        </span>
      </div>
    </div>

    <!-- the player: steps out of the fog, takes the potion, drinks, rises -->
    <div class="drink-scene__player" :style="playerStyle">
      <MinecraftPlayer
        :mode="playerMode"
        :armed="warm"
        :progress="animationProgress"
        :glow="rim"
        :shade="shade"
        :reach="reach"
        :lift="lift"
        :sip="sip"
        :lower="lower"
        :holding="holding"
        :level="level"
        :accent="card.accent"
        :label="tp(`player.${playerMode}`)"
        @bottle="onBottle"
      />
    </div>

    <!-- the potion's own light, on his face and hands -->
    <div class="drink-scene__potion-light" :style="potionLightStyle" aria-hidden="true" />

    <!-- The potion the cauldron made: rises from the brew, then into his hand. -->
    <button
      type="button"
      class="potion"
      :style="potionStyle"
      :aria-label="tp('altar.potionLabel')"
      :tabindex="potionInteractive ? 0 : -1"
      @mouseenter="inspect('potion', $event)"
      @mouseleave="emit('clear-inspect')"
      @focus="inspect('potion', $event)"
      @blur="emit('clear-inspect')"
      @click="inspect('potion', $event)"
    >
      <span class="potion__halo" aria-hidden="true" />
      <span class="potion__sprite" :style="potionSpriteStyle">
        <PotionVial :accent="card.accent" :level="domLevel" />
      </span>
      <span class="potion__caption" :style="captionStyle" aria-hidden="true">{{ tp('altar.potionCaption') }}</span>
    </button>

    <!-- whispers: what the potion says back while it is drunk -->
    <div class="drink-scene__whispers" aria-hidden="true">
      <span v-for="whisper in whispers" :key="whisper.id" class="whisper" :class="`whisper--${whisper.side}`" :style="whisper.style">{{ whisper.text }}</span>
    </div>

    <!-- low mist over the floor until the awakening burns it off -->
    <div class="drink-scene__mist" aria-hidden="true" />

    <!-- the moment of awakening: a flash of spirit vision -->
    <div class="drink-scene__flash" aria-hidden="true" />
    <div class="drink-scene__flash-fx" :style="flashBoxStyle" aria-hidden="true">
      <SceneParticles mode="burst" :active="burstActive" :intensity="1" :accent="card.accent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { CSSProperties } from 'vue';

import MinecraftPlayer from '../MinecraftPlayer.vue';
import type { BottlePosition } from '../MinecraftPlayer.vue';
import PotionVial from '../PotionVial.vue';
import SceneParticles from './SceneParticles.vue';
import ArcanaFace from '../../ArcanaFace.vue';
import { useArcana } from '../../useArcana';
import { useProgressionCopy } from './useProgressionCopy';
import type { StageLayout } from '../layout';
import { T, awakenAt, blackoutAt, clamp01, ease, flashAt, gulpPulse, gulpsTaken, lerp, riskAt, smooth, span } from '../timeline';
import { useReducedMotion } from '@/composables/useReducedMotion';
import magicCircle from '@/assets/images/home/progression/real/magic-circle.png';

const props = withDefaults(defineProps<{
  progress: number;
  layout: StageLayout | null;
  active: boolean;
  /** The story is close to this scene: allow the 3D player to load. */
  warm?: boolean;
}>(), { warm: false });
const emit = defineEmits<{ (e: 'inspect', id: string, anchor: HTMLElement): void; (e: 'clear-inspect'): void }>();

const reduced = useReducedMotion();
const { tp, card, currentId } = useProgressionCopy();
const { reading } = useArcana();

function inspect(id: string, event: Event): void {
  if (event.currentTarget instanceof HTMLElement) emit('inspect', id === 'potion' && g.value >= T.catch[0] ? 'drink-potion' : 'potion', event.currentTarget);
}

const g = computed(() => props.progress);
const final = computed(() => reduced.value);
const at = (range: readonly [number, number]) => (final.value ? 1 : ease(g.value, range));

const awaken = computed(() => (final.value ? 1 : awakenAt(g.value)));
const risk = computed(() => (final.value ? 0 : riskAt(g.value)));
const blackout = computed(() => (final.value ? 0 : blackoutAt(g.value)));
const flash = computed(() => (final.value ? 0 : flashAt(g.value)));
const pulse = computed(() => (final.value ? 0 : gulpPulse(g.value)));
const gulps = computed(() => (final.value ? 3 : gulpsTaken(g.value)));

/* ---------------- player ---------------- */
const playerMode = computed<'drink' | 'advance'>(() => (final.value || g.value >= T.flash ? 'advance' : 'drink'));
const animationProgress = computed(() => (playerMode.value === 'advance' ? (final.value ? 1 : span(g.value, [T.flash, 1])) : span(g.value, [T.playerIn[0], T.flash])));
const emerge = computed(() => at(T.playerIn));
const reach = computed(() => (final.value ? 0 : ease(g.value, [T.catch[0] - 0.012, T.catch[1] - 0.004])));
const lift = computed(() => (final.value ? 0 : at(T.raise)));
const sip = computed(() => (final.value ? 0 : clamp01(gulps.value / 3 + pulse.value * 0.08)));
const lower = computed(() => at(T.lower));
const level = computed(() => clamp01(1 - gulps.value / 3));
// silhouetted while drinking, backlit once awakened
const shade = computed(() => {
  if (final.value) return 0.25;
  const drinking = 0.55 + 0.4 * blackout.value;
  return lerp(lerp(0.75, drinking, emerge.value), 0.45, awaken.value) - 0.2 * ease(g.value, [T.panel[0], T.panel[1]]);
});
const rim = computed(() => (final.value ? 1 : clamp01(0.25 * emerge.value + 0.2 * risk.value + awaken.value)));
const rise = computed(() => awaken.value * 12);

const playerStyle = computed<CSSProperties>(() => {
  const l = props.layout;
  if (!l) return { opacity: 0 };
  const p = l.player;
  return {
    left: `${p.x.toFixed(1)}px`,
    top: `${p.y.toFixed(1)}px`,
    width: `${p.w.toFixed(1)}px`,
    height: `${p.h.toFixed(1)}px`,
    opacity: emerge.value.toFixed(4),
    transform: `translate3d(0, ${((1 - emerge.value) * 18 - rise.value).toFixed(1)}px, 0)`,
  };
});

/* ---------------- the potion ---------------- */
const bottle = ref<BottlePosition | null>(null);
function onBottle(pos: BottlePosition | null) {
  bottle.value = pos;
}
/** The bottle in his hand, in stage px (a scripted hand point until the 3D player is up). */
const handPoint = computed(() => {
  const l = props.layout;
  if (!l) return null;
  const p = l.player;
  const y = p.y + (1 - emerge.value) * 18 - rise.value;
  if (bottle.value) return { x: p.x + bottle.value.x, y: y + bottle.value.y, size: bottle.value.size };
  return { x: p.x + p.w * 0.36, y: y + p.h * lerp(0.46, 0.2, lift.value), size: l.potion.size };
});
const caught = computed(() => (final.value ? 1 : span(g.value, T.catch)));
/** Taken by the 3D hand once it arrives (if the player could not load, the sprite stays). */
const holding = computed(() => final.value || (caught.value >= 1 && Boolean(bottle.value)));

const potionPoint = computed(() => {
  const l = props.layout;
  if (!l) return null;
  const c = l.cauldron;
  // rises out of the brew to float above it...
  const up = final.value ? 1 : 1 - (1 - span(g.value, T.potionUp)) ** 3;
  const bob = Math.sin(g.value * 260) * 3 * up * (1 - caught.value);
  let x = l.potion.x;
  let y = lerp(c.liquidY, l.potion.y, up) + bob;
  let size = l.potion.size * (0.4 + 0.6 * up);
  // ...then drifts across into his hand, on a short arc
  const hand = handPoint.value;
  const k = smooth(caught.value);
  if (hand && k > 0) {
    x = lerp(x, hand.x, k);
    y = lerp(y, hand.y, k) - Math.sin(k * Math.PI) * 16;
    size = lerp(size, hand.size, k);
  }
  return { x, y, size };
});
const domLevel = computed(() => (holding.value ? level.value : 1));
const potionVisible = computed(() => !final.value && g.value >= T.brewFlash && !holding.value);
const potionInteractive = computed(() => props.active && potionVisible.value && g.value >= T.potionUp[1] - 0.01);
const potionStyle = computed<CSSProperties>(() => {
  const point = potionPoint.value;
  if (!point || !potionVisible.value) return { opacity: 0, visibility: 'hidden', pointerEvents: 'none' };
  const appear = clamp01((g.value - T.brewFlash) / 0.012);
  return {
    left: `${point.x.toFixed(1)}px`,
    top: `${point.y.toFixed(1)}px`,
    width: `${Math.max(44, point.size).toFixed(1)}px`,
    height: `${Math.max(44, point.size).toFixed(1)}px`,
    opacity: appear.toFixed(4),
    pointerEvents: potionInteractive.value ? 'auto' : 'none',
    '--halo': ((1 - smooth(caught.value) * 0.6) * appear).toFixed(4),
  } as CSSProperties;
});
const potionSpriteStyle = computed<CSSProperties>(() => {
  const point = potionPoint.value;
  const size = point ? point.size : 64;
  return { width: `${size.toFixed(1)}px`, height: `${size.toFixed(1)}px`, filter: `brightness(${(1 + 0.8 * clamp01(1 - (g.value - T.brewFlash) / 0.02)).toFixed(3)})` };
});
// named as it surfaces, gone before he takes it
const captionStyle = computed<CSSProperties>(() => ({
  opacity: (final.value ? 0 : ease(g.value, [T.potionUp[0] + 0.015, T.potionUp[1]]) * (1 - ease(g.value, [T.catch[0] - 0.012, T.catch[0]]))).toFixed(4),
}));
const potionLightStyle = computed<CSSProperties>(() => {
  const point = holding.value ? handPoint.value : potionPoint.value;
  const strength = final.value || g.value < T.brewFlash ? 0 : (0.25 + 0.75 * level.value) * (1 - at(T.lower)) * (0.5 + 0.5 * emerge.value);
  return {
    left: point ? `${point.x.toFixed(1)}px` : '50%',
    top: point ? `${point.y.toFixed(1)}px` : '40%',
    opacity: strength.toFixed(4),
  };
});

/* ---------------- whispers ---------------- */
type Whisper = { id: string; key: string; at: number; side: 'left' | 'right'; dy: number };
const WHISPERS: Whisper[] = [
  { id: 'w1', key: 'drink.whisper1', at: T.gulps[0], side: 'right', dy: 0.2 },
  { id: 'w2', key: 'drink.whisper2', at: T.gulps[1], side: 'left', dy: 0.34 },
  { id: 'w3', key: 'drink.whisper3', at: T.gulps[2], side: 'right', dy: 0.5 },
  { id: 'w4', key: 'drink.whisper4', at: T.gulps[1] + 0.016, side: 'right', dy: 0.66 },
  { id: 'w5', key: 'drink.whisper5', at: T.blackout[0], side: 'left', dy: 0.58 },
];
const whispers = computed(() => {
  const l = props.layout;
  if (!l || final.value) return [];
  const p = l.player;
  return WHISPERS.map((whisper) => {
    const t = (g.value - whisper.at) / 0.045;
    const on = t > -0.15 && t < 1 ? smooth((t + 0.15) / 0.25) * (1 - smooth((t - 0.55) / 0.45)) : 0;
    const drift = clamp01(t) * 12;
    const gap = p.w * 0.3 + 10;
    const anchorX = whisper.side === 'right' ? l.cx + gap : l.cx - gap;
    const room = whisper.side === 'right' ? l.w - anchorX - drift - 8 : anchorX - drift - 8;
    return {
      id: whisper.id,
      side: whisper.side,
      text: tp(whisper.key),
      style: {
        left: `${anchorX.toFixed(1)}px`,
        top: `${(p.y + whisper.dy * p.h).toFixed(1)}px`,
        maxWidth: `${Math.max(80, Math.min(220, room)).toFixed(0)}px`,
        opacity: (on * (1 - flash.value)).toFixed(4),
        transform: `translate3d(${whisper.side === 'right' ? drift : -drift}px, -50%, 0)`,
        visibility: on > 0.01 ? 'visible' : 'hidden',
      } as CSSProperties,
    };
  });
});

/* ---------------- circle and cards ---------------- */
const wake = computed(() => at([T.cauldronOut[0], T.playerIn[1]]));
const auraActive = computed(() => props.active && (final.value || g.value >= T.playerIn[0]));
const auraIntensity = computed(() => 0.3 + 0.7 * awaken.value);
const circleStyle = computed(() => ({
  '--circle-mask': `url(${magicCircle})`,
  '--circle-spin': `${(final.value ? 96 : g.value * 900).toFixed(2)}deg`,
  transform: `scale(${(0.9 + 0.1 * wake.value + 0.12 * flash.value).toFixed(4)})`,
}));

type CardSpec = { id: string; face: boolean; at: number; side: -1 | 1; dy: number; tilt: number };
const CARDS: CardSpec[] = [
  { id: 'back', face: false, at: T.awaken[0] + 0.012, side: -1, dy: 0.2, tilt: -8 },
  { id: 'face', face: true, at: T.awaken[0] + 0.03, side: 1, dy: 0.19, tilt: 7 },
];
const cards = computed(() => {
  const l = props.layout;
  if (!l) return [];
  const p = l.player;
  const cardW = Math.max(60, Math.min(118, p.h * 0.2, (l.w - p.w * 0.8) / 2 - 24));
  const cardH = cardW * 1.6;
  return CARDS.map((card) => {
    const t = final.value ? 1 : smooth((g.value - card.at) / 0.05);
    // clear of his open arms and the bottle in his hand
    const reach = p.w * 0.43 + cardW * 0.5 + 6;
    const targetX = Math.min(l.w - cardW * 0.62 - 8, Math.max(cardW * 0.62 + 8, l.cx + card.side * reach));
    const targetY = Math.max(cardH * 0.55 + 4, p.y + card.dy * p.h);
    const x = lerp(l.cx, targetX, t);
    const y = lerp(l.cauldron.floorY - 10, targetY, t) - Math.sin(t * Math.PI) * 20;
    // the drawn card arrives face down and turns over as it settles
    const turn = card.face ? (final.value ? 1 : smooth((g.value - card.at - 0.03) / 0.03)) : 0;
    const showFace = card.face && turn >= 0.5;
    const narrow = Math.abs(turn * 2 - 1);
    return {
      id: card.id,
      showFace,
      sideStyle: { transform: `scaleX(${(card.face ? Math.max(0.02, narrow) : 1).toFixed(4)})` } as CSSProperties,
      style: {
        left: `${x.toFixed(1)}px`,
        top: `${y.toFixed(1)}px`,
        width: `${cardW.toFixed(1)}px`,
        height: `${cardH.toFixed(1)}px`,
        opacity: (clamp01(t * 3) * (card.face ? 1 : 0.85)).toFixed(4),
        transform: `translate(-50%, -50%) rotate(${(card.tilt * t).toFixed(2)}deg) scale(${(0.4 + 0.6 * t).toFixed(4)})`,
      } as CSSProperties,
    };
  });
});

const sceneVars = computed(() => {
  const l = props.layout;
  return {
    '--wake': wake.value.toFixed(4),
    '--awaken': awaken.value.toFixed(4),
    '--risk': risk.value.toFixed(4),
    '--blackout': blackout.value.toFixed(4),
    '--flash': flash.value.toFixed(4),
    ...(l
      ? {
        '--stand-x': `${l.cx.toFixed(1)}px`,
        '--floor-top': `${l.cauldron.floorY.toFixed(1)}px`,
        '--circle-size': `${l.cauldron.circleW.toFixed(1)}px`,
        '--chest-y': `${(l.player.y + l.player.h * 0.36).toFixed(1)}px`,
      }
      : {}),
  } as CSSProperties;
});

const burstActive = computed(() => props.active && !final.value && g.value >= T.flash && g.value < T.awaken[0] + T.awaken[1]);
const flashBoxStyle = computed<CSSProperties>(() => {
  const l = props.layout;
  if (!l) return { opacity: 0 };
  const w = Math.min(l.w, l.player.w * 1.6);
  return { left: `${(l.cx - w / 2).toFixed(1)}px`, top: '0px', width: `${w.toFixed(1)}px`, height: `${l.cauldron.floorY.toFixed(1)}px` };
});
</script>

<style scoped>
/* ArcanaFace sizes its type and corners in cqw: give it a container. */
.reading-card__front {
  container-type: size;
}

.drink-scene {
  --wake: 0;
  --awaken: 0;
  --risk: 0;
  --blackout: 0;
  --flash: 0;
  --stand-x: 50%;
  --floor-top: 80%;
  --circle-size: min(460px, 46%);
  --chest-y: 40%;
  position: absolute;
  inset: 0;
  color: var(--arc-ink);
  font-family: var(--arc-body);
}

/* ---------- spirit-vision light column ---------- */
.drink-scene__beam {
  position: absolute;
  top: 0;
  left: var(--stand-x);
  width: min(260px, 40%);
  height: var(--floor-top);
  background: radial-gradient(ellipse 50% 100% at 50% 100%, color-mix(in oklab, var(--acc) 42%, transparent), color-mix(in oklab, var(--acc) 12%, transparent) 55%, transparent 80%);
  mask-image: linear-gradient(0deg, #000 40%, transparent);
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
  top: var(--floor-top);
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
  width: calc(var(--circle-size) * 1.1);
  aspect-ratio: 2.4;
  border-radius: 50%;
  background: radial-gradient(ellipse, color-mix(in oklab, var(--acc) 50%, transparent), color-mix(in oklab, var(--acc) 14%, transparent) 50%, transparent 72%);
  opacity: calc(var(--wake) * (0.25 + var(--awaken) * 0.75 + var(--flash) * 0.6));
  transform: translate(-50%, -50%);
}

.drink-scene__circle {
  width: var(--circle-size);
  aspect-ratio: 1;
  margin: calc(var(--circle-size) / -2) 0 0 calc(var(--circle-size) / -2);
  opacity: calc(var(--wake) * (0.4 + var(--risk) * 0.2 + var(--awaken) * 0.6) * (1 - var(--blackout) * 0.6));
  scale: 1 0.5;
  filter: drop-shadow(0 0 calc(6px + var(--awaken) * 16px) color-mix(in oklab, var(--acc) 75%, transparent));
  will-change: transform, opacity;
}

.drink-scene__circle::before {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, color-mix(in oklab, var(--acc) 70%, white), var(--acc) 45%, color-mix(in oklab, var(--acc) 60%, black));
  content: '';
  transform: rotate(var(--circle-spin, 0deg));
  mask: var(--circle-mask) center / contain no-repeat;
  -webkit-mask: var(--circle-mask) center / contain no-repeat;
}

.drink-scene__fx {
  width: calc(var(--circle-size) * 0.8);
  height: calc(var(--circle-size) * 0.8);
  opacity: var(--wake);
  transform: translate(-50%, -66%);
}

/* ---------- the reading ---------- */
.drink-scene__cards {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}

.reading-card {
  position: absolute;
  will-change: transform, opacity;
}

.reading-card__back,
.reading-card__front {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 7px;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.55), 0 0 26px color-mix(in oklab, var(--acc) 30%, transparent);
}

.reading-card__back {
  background:
    repeating-linear-gradient(45deg, color-mix(in oklab, var(--acc) 10%, transparent) 0 2px, transparent 2px 9px),
    linear-gradient(170deg, #1b1b22, #0e0e12);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--acc) 45%, transparent), 0 14px 30px rgba(0, 0, 0, 0.55);
}

.reading-card__back i {
  position: absolute;
  inset: 30% 22%;
  border: 1.5px solid color-mix(in oklab, var(--acc) 70%, transparent);
  transform: rotate(45deg);
}


/* ---------- player (feet on the circle) ---------- */
.drink-scene__player {
  position: absolute;
  z-index: 5;
  min-width: 0;
  pointer-events: none;
  will-change: transform, opacity;
}

/* ---------- potion ---------- */
.drink-scene__potion-light {
  position: absolute;
  z-index: 6;
  width: 240px;
  height: 240px;
  margin: -120px 0 0 -120px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in oklab, var(--acc) 34%, transparent), color-mix(in oklab, var(--acc) 10%, transparent) 40%, transparent 70%);
  mix-blend-mode: screen;
  pointer-events: none;
}

.potion {
  --halo: 1;
  position: absolute;
  z-index: 7;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  cursor: help;
  transform: translate(-50%, -50%);
  will-change: left, top, opacity;
}

.potion:focus-visible {
  outline: 3px solid var(--arc-ink);
  outline-offset: 4px;
}

.potion__halo {
  position: absolute;
  inset: -40%;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in oklab, var(--acc) 30%, white) 0%, color-mix(in oklab, var(--acc) 34%, transparent) 30%, color-mix(in oklab, var(--acc) 10%, transparent) 54%, transparent 72%);
  opacity: calc(var(--halo) * 0.7);
  pointer-events: none;
}

.potion__sprite {
  position: relative;
  display: block;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6));
}

.potion__caption {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  width: max-content;
  max-width: 240px;
  color: var(--arc-ink);
  font: 400 11px/1.3 var(--arc-caps);
  letter-spacing: 0.16em;
  text-align: center;
  text-transform: uppercase;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.9);
  transform: translateX(-50%);
}

/* ---------- whispers ---------- */
.drink-scene__whispers {
  position: absolute;
  inset: 0;
  z-index: 8;
  pointer-events: none;
}

.whisper {
  position: absolute;
  width: max-content;
  color: var(--arc-ink);
  font: 400 11.5px/1.4 var(--arc-caps);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  /* a split image, as if heard twice */
  text-shadow: -1.5px 0 color-mix(in oklab, var(--acc) 80%, transparent), 1.5px 0 rgba(169, 198, 214, 0.55), 0 0 12px rgba(0, 0, 0, 0.9);
  animation: whisper-shiver 0.9s steps(3) infinite;
  will-change: transform, opacity;
}

.whisper--left {
  text-align: right;
  translate: -100% 0;
}

@keyframes whisper-shiver {
  0%, 100% { margin-left: 0; }
  33% { margin-left: 1px; }
  66% { margin-left: -1px; }
}

/* ---------- floor mist, burnt off by the awakening ---------- */
.drink-scene__mist {
  position: absolute;
  z-index: 9;
  right: 0;
  bottom: 0;
  left: 0;
  height: 34%;
  mask-image: radial-gradient(ellipse 50% 50% at 50% 55%, #000 40%, transparent 100%);
  background:
    radial-gradient(ellipse 30% 50% at 26% 70%, rgba(200, 204, 214, 0.2), transparent 72%),
    radial-gradient(ellipse 34% 46% at 56% 80%, rgba(200, 204, 214, 0.15), transparent 72%),
    radial-gradient(ellipse 24% 40% at 82% 70%, rgba(200, 204, 214, 0.13), transparent 72%);
  opacity: calc(var(--wake) * (1 - var(--awaken) * 0.85));
  transform: translateY(calc(var(--awaken) * 30% - var(--risk) * 8%));
  pointer-events: none;
}

/* ---------- flash ---------- */
.drink-scene__flash {
  position: absolute;
  inset: 0;
  z-index: 30;
  pointer-events: none;
  background: radial-gradient(ellipse 34% 46% at var(--stand-x) var(--chest-y), rgba(255, 255, 255, 0.95), color-mix(in oklab, var(--acc) 50%, transparent) 34%, color-mix(in oklab, var(--acc) 18%, transparent) 66%, transparent 100%);
  opacity: var(--flash);
}

.drink-scene__flash-fx {
  position: absolute;
  z-index: 31;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .whisper {
    animation: none;
  }
}
</style>
