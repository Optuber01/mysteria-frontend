<template>
  <div class="drink-scene" :class="{ 'is-idle': !active }" :style="sceneVars" role="group" :aria-label="tp('drink.sceneLabel')">
    <!-- Spirit-vision light: a column rising from the circle at the awakening. -->
    <div class="drink-scene__beam" aria-hidden="true" />

    <!-- The brewing circle again, rekindled under the player's feet. -->
    <div class="drink-scene__floor" aria-hidden="true">
      <div class="drink-scene__pool" />
      <div class="drink-scene__circle" :style="circleStyle" />
    </div>

    <!-- The reading turns up: the card he drew. Once it has settled it opens its Pathway. -->
    <div class="drink-scene__cards">
      <component
        :is="c.open ? RouterLink : 'div'"
        v-for="c in cards"
        :key="c.id"
        class="reading-card"
        :class="{ 'is-open': c.open }"
        :style="c.style"
        v-bind="c.open ? { to: $lp(`/pathways/${pathwayId}`), 'aria-label': tp('drink.cardLink') } : { 'aria-hidden': 'true' }"
        @pointermove="onCardPointer"
        @pointerleave="onCardLeave"
      >
        <span class="reading-card__tilt">
          <!-- turned over in the picture plane: the back narrows away, the face opens -->
          <span v-if="!c.showFace" class="reading-card__back" :style="c.sideStyle"><ArcanaBack /></span>
          <span v-else class="reading-card__front" :class="{ 'is-example': isExample }" :style="c.sideStyle">
            <ArcanaFace :id="pathwayId" :name="faceReading.name" :role="faceReading.seq9" eager />
            <span class="reading-card__sheen" aria-hidden="true" />
          </span>
        </span>
      </component>
    </div>

    <!-- the player: steps out of the fog, takes the potion, drinks, rises -->
    <div class="drink-scene__player" :style="playerStyle">
      <MinecraftPlayer
        :armed="warm"
        :progress="g"
        :step="emerge"
        :reach="reach"
        :regard="regard"
        :lift="lift"
        :sip="sip"
        :swallow="pulse"
        :lower="lower"
        :hit="hit"
        :awaken="opening"
        :glow="rim"
        :shade="shade"
        :veins="veins"
        :vein-glow="veinGlow"
        :eyes="eyes"
        :holding="holding"
        :level="level"
        :accent="card.accent"
        :skin="worn.url"
        :slim="worn.slim"
        :label="tp(`player.${playerMode}`)"
        @bottle="onBottle"
        @head="head = $event"
      />
      <!-- his name over his head, as in game: shown while the hand is on him (a tap on touch) -->
      <span
        class="drink-scene__hit"
        :class="{ 'is-on': nameable }"
        aria-hidden="true"
        @pointerenter="onPlayerEnter"
        @pointerleave="onPlayerLeave"
        @click="onPlayerTap"
      />
      <img
        v-if="tag"
        class="drink-scene__nametag"
        :class="{ 'is-shown': nameable && tagShown }"
        :src="tag.src"
        :style="tagStyle"
        alt=""
        aria-hidden="true"
        draggable="false"
      >
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
    </button>

    <!-- whispers: what the potion says back while it is drunk -->
    <div class="drink-scene__whispers" aria-hidden="true">
      <span v-for="whisper in whispers" :key="whisper.id" class="whisper" :class="`whisper--${whisper.side}`" :style="whisper.style">{{ whisper.text }}</span>
    </div>

    <!-- low mist over the floor until the awakening burns it off -->
    <div class="drink-scene__mist" aria-hidden="true" />

    <!-- the moment of awakening: a flash of spirit vision -->
    <div class="drink-scene__flash" aria-hidden="true" />
    <!-- the spirit world in the room (gray fog, spirit lights), his spirituality gathering, the flash's ring -->
    <div class="drink-scene__spirit" aria-hidden="true">
      <SceneParticles mode="spirit" :active="spiritActive" :intensity="1" :accent="card.accent" :phase="spiritPhase" :anchor="spiritAnchor" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import type { CSSProperties } from 'vue';

import MinecraftPlayer from '../MinecraftPlayer.vue';
import type { BottlePosition, HeadPosition } from '../MinecraftPlayer.vue';
import { drawNametag } from '../pixelFont';
import PotionVial from '../PotionVial.vue';
import SceneParticles from './SceneParticles.vue';
import ArcanaBack from '../../ArcanaBack.vue';
import ArcanaFace from '../../ArcanaFace.vue';
import { useArcana } from '../../useArcana';
import { DEFAULT_SKIN, usePlayerSkin } from '../playerSkin';
import type { PlayerSkin } from '../playerSkin';
import { useProgressionCopy } from './useProgressionCopy';
import type { StageLayout } from '../layout';
import { T, awakenAt, blackoutAt, clamp01, ease, eyesAt, flashAt, gulpPulse, gulpsTaken, lerp, riskAt, shockAt, smooth, span, spiritAt, veinGlowAt, veinSpreadAt } from '../timeline';
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
const { tp, card, currentId, pathwayId } = useProgressionCopy();
const { readingFor, hasDrawn } = useArcana();
/*
 * The story follows a Pathway: a drawn Boon (no potions; it advances at the Sacrificial
 * Altar) sees the Fool as the example, its card and ravings included, like an undrawn page.
 */
const isExample = computed(() => !hasDrawn.value || pathwayId.value !== currentId.value);
const faceReading = computed(() => readingFor(pathwayId.value));

function inspect(id: string, event: Event): void {
  if (event.currentTarget instanceof HTMLElement) emit('inspect', id === 'potion' && g.value >= T.catch[0] ? 'drink-potion' : 'potion', event.currentTarget);
}

const g = computed(() => props.progress);
const final = computed(() => reduced.value);
const at = (range: readonly [number, number]) => (final.value ? 1 : ease(g.value, range));
/** 0 before the beat, 1 once it is over (reduced motion: the finished scene). */
const beat = (range: readonly [number, number]) => (final.value ? 0 : ease(g.value, range));

const awaken = computed(() => (final.value ? 1 : awakenAt(g.value)));
const risk = computed(() => (final.value ? 0 : riskAt(g.value)));
const blackout = computed(() => (final.value ? 0 : blackoutAt(g.value)));
const flash = computed(() => (final.value ? 0 : flashAt(g.value)));
const pulse = computed(() => (final.value ? 0 : gulpPulse(g.value)));
const gulps = computed(() => (final.value ? 3 : gulpsTaken(g.value)));
/* what the potion does to him (see timeline.ts): rounded, so a still scroll is a still frame */
const r3 = (value: number) => Math.round(value * 1000) / 1000;
const veins = computed(() => (final.value ? 0 : r3(veinSpreadAt(g.value))));
const veinGlow = computed(() => (final.value ? 0 : r3(veinGlowAt(g.value))));
const eyes = computed(() => (final.value ? 0.55 : r3(eyesAt(g.value))));
const spirit = computed(() => (final.value ? 0 : spiritAt(g.value)));
const shock = computed(() => (final.value ? 0 : shockAt(g.value)));

/* ---------------- player ---------------- */
const playerMode = computed<'drink' | 'advance'>(() => (final.value || g.value >= T.flash ? 'advance' : 'drink'));
const emerge = computed(() => at(T.playerIn));

/*
 * The skin he wears: the visitor's own (premium Java accounts, see playerSkin.ts) or
 * Optuber's. A new one is only put on while he is out of sight, never in front of them.
 */
const wanted = usePlayerSkin(() => props.warm);
const worn = ref<PlayerSkin>(DEFAULT_SKIN);
const inSight = computed(() => props.active && emerge.value > 0.01);
watch([wanted, inSight], ([next, seen]) => {
  if (!seen) worn.value = next;
}, { immediate: true });

/*
 * The name tag, as the game shows it over a player: pixel text on a faint plate, centred
 * over him and moving with him, quieter than the game's (soft ink, a fainter plate). Its size
 * is set once from his box (one font texel is ~1/30 of his head), never from the
 * head on screen: that grows and shrinks with every step and lean, and the rounded texel
 * size then jumped. It sits seven texels over the crown, clear of the hood as he rises.
 */
const head = ref<HeadPosition | null>(null);
const tag = computed(() => {
  if (typeof document === 'undefined') return null;
  const canvas = drawNametag(worn.value.name, 'rgba(0, 0, 0, .18)', '#e4e2ea');
  return { src: canvas.toDataURL(), w: canvas.width, h: canvas.height };
});
const tagUnit = computed(() => Math.max(2, Math.round((props.layout?.player.h ?? 600) / 160)));
const tagStyle = computed<CSSProperties>(() => {
  const h = head.value;
  const t = tag.value;
  const box = props.layout?.player;
  if (!h || !t || !box) return { visibility: 'hidden' };
  const unit = tagUnit.value;
  return {
    width: `${t.w * unit}px`,
    height: `${t.h * unit}px`,
    transform: `translate3d(${(h.x - (t.w * unit) / 2).toFixed(1)}px, ${(h.y - (7 + t.h) * unit).toFixed(1)}px, 0)`,
  };
});

/* It shows while he stands there to be looked at (not in the fog, not at the flash). */
const nameable = computed(() => props.active && emerge.value > 0.6);
const hovering = ref(false);
const tapped = ref(false);
const tagShown = computed(() => hovering.value || tapped.value);
let tapTimer = 0;
function onPlayerEnter(event: PointerEvent) {
  if (event.pointerType === 'mouse') hovering.value = true;
}
function onPlayerLeave(event: PointerEvent) {
  if (event.pointerType === 'mouse') hovering.value = false;
}
function onPlayerTap(event: MouseEvent) {
  if ((event as PointerEvent).pointerType === 'mouse') return;
  tapped.value = !tapped.value;
  clearTimeout(tapTimer);
  if (tapped.value) tapTimer = window.setTimeout(() => (tapped.value = false), 2600);
}
watch(nameable, (on) => {
  if (!on) {
    hovering.value = false;
    tapped.value = false;
  }
});
onBeforeUnmount(() => clearTimeout(tapTimer));
const reach = computed(() => beat(T.reach));
const regard = computed(() => beat(T.regard));
const lift = computed(() => beat(T.raise));
const sip = computed(() => clamp01(gulps.value / 3));
const lower = computed(() => beat(T.lower));
// it takes hold over the lowering, until the flash
const hit = computed(() => beat(T.hit));
const level = computed(() => clamp01(1 - gulps.value / 3));
// his pose answers the flash at once; the light and the moon take their time (awaken)
const opening = computed(() => (final.value ? 1 : ease(g.value, [T.flash - 0.002, T.flash + 0.04])));
// Out of the fog into the potion's light; darker as it takes hold; backlit once awakened.
const shade = computed(() => {
  if (final.value) return 0.15;
  // lit by the potion while he drinks it (his arm and the bottle must read), then the dark closes in
  const drinking = 0.1 + 0.2 * risk.value + 0.25 * hit.value + 0.4 * blackout.value;
  return lerp(lerp(0.75, drinking, emerge.value), 0.15, awaken.value);
});
// a faint edge in the potion's colour while he drinks, so the raised arm reads against the dark
const rim = computed(() => (final.value ? 1 : clamp01(0.2 * emerge.value + 0.16 * lift.value * (1 - lower.value) + 0.25 * risk.value + 0.2 * hit.value + awaken.value)));
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
  return { x: p.x + p.w * 0.36, y: y + p.h * 0.4, size: l.potion.size };
});
const caught = computed(() => (final.value ? 1 : span(g.value, T.catch)));
/** Taken by the 3D hand once it arrives (if the player could not load, the sprite stays); let go at the flash. */
const holding = computed(() => !final.value && g.value < T.flash && caught.value >= 1 && Boolean(bottle.value));

const potionPoint = computed(() => {
  const l = props.layout;
  if (!l) return null;
  const c = l.cauldron;
  // rises out of the brew to float above it...
  const up = final.value ? 1 : 1 - (1 - span(g.value, T.potionUp)) ** 3;
  const bob = Math.sin(g.value * 260) * 3 * up * (1 - caught.value);
  // as he steps in under it, it drifts aside to wait by his right hand, not in front of his chest
  const aside = final.value ? 1 : ease(g.value, [T.cauldronOut[0], T.playerIn[1]]);
  let x = l.potion.x - l.player.w * 0.19 * aside;
  let y = lerp(c.mouthY, l.potion.y, up) + bob + l.player.h * 0.02 * aside;
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
const potionVisible = computed(() => !final.value && g.value >= T.brewFlash && g.value < T.flash && !holding.value);
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
  // bright as it leaves the brew, then no filter at all (a brightness(1) would still cost a pass)
  const flare = 0.8 * clamp01(1 - (g.value - T.brewFlash) / 0.02);
  return { width: `${size.toFixed(1)}px`, height: `${size.toFixed(1)}px`, filter: flare > 0.001 ? `brightness(${(1 + flare).toFixed(3)})` : 'none' };
});
const potionLightStyle = computed<CSSProperties>(() => {
  const point = holding.value ? handPoint.value : potionPoint.value;
  const strength = final.value || g.value < T.brewFlash ? 0 : (0.25 + 0.75 * level.value) * (1 - lower.value) * (0.5 + 0.5 * emerge.value);
  return {
    left: point ? `${point.x.toFixed(1)}px` : '50%',
    top: point ? `${point.y.toFixed(1)}px` : '40%',
    opacity: strength.toFixed(4),
  };
});

/* ---------------- whispers ---------------- */
/*
 * What the potion says back once it is down, never while he drinks: one voice
 * at a time, each crossfading into the next on the other side of him, then
 * silence in the dark before the awakening. The page slows the story down over
 * T.voices (storyAt), so each line holds for a few wheel steps. Each Pathway has
 * its own ravings (home.progression.ravings.<pathway>.r1..r5); before a draw, or
 * where a Pathway has none yet, the general whispers stand in. A missing key
 * comes back from t() as the key itself.
 */
type Whisper = { id: string; at: number; dx: number; dy: number };
/** Share of the voices' stretch each crossfade takes; the five lines fill it end to end. */
const VOICE_FADE = 0.025;
const VOICE_STEP = (1 - VOICE_FADE) / 5;
const VOICE_SPAN = T.voices[1] - T.voices[0];
const VOICE_AT = [0, 1, 2, 3, 4].map((n) => T.voices[0] + n * VOICE_STEP * VOICE_SPAN);
const WHISPERS: Whisper[] = [
  { id: 'w1', at: VOICE_AT[0], dx: 0.2, dy: 0.3 },
  { id: 'w2', at: VOICE_AT[1], dx: -0.24, dy: 0.44 },
  { id: 'w3', at: VOICE_AT[2], dx: 0.14, dy: 0.56 },
  { id: 'w4', at: VOICE_AT[3], dx: -0.18, dy: 0.22 },
  { id: 'w5', at: VOICE_AT[4], dx: 0.08, dy: 0.36 },
];
/** How long each voice is heard (timeline fraction): its step plus the crossfade into the next. */
const WHISPER_LIFE = (VOICE_STEP + VOICE_FADE) * VOICE_SPAN;
/** Each fade, as a share of a voice's life. */
const WHISPER_FADE = VOICE_FADE / (VOICE_STEP + VOICE_FADE);
const lines = computed(() => {
  const own = (n: number) => {
    const key = `ravings.${pathwayId.value}.r${n}`;
    const text = tp(key);
    return text && text !== `home.progression.${key}` ? text : '';
  };
  // the Pathway the story follows: the drawn one, or the Fool as the example (no draw yet, or a Boon)
  const ravings = [1, 2, 3, 4, 5].map(own);
  // a card's set is used whole, never mixed with the general lines
  return ravings.length && ravings.every(Boolean) ? ravings : [1, 2, 3, 4, 5].map((n) => tp(`drink.whisper${n}`));
});
const whispers = computed(() => {
  const l = props.layout;
  if (!l || final.value) return [];
  const p = l.player;
  return WHISPERS.map((whisper, index) => {
    const t = (g.value - whisper.at) / WHISPER_LIFE;
    const on = t > 0 && t < 1 ? smooth(t / WHISPER_FADE) * (1 - smooth((t - 1 + WHISPER_FADE) / WHISPER_FADE)) : 0;
    const drift = clamp01(t) * 14;
    // Behind him: each voice is a big, faint line centred a little off his axis, so his
    // body hides part of it and the stage's edges cut off its ends. It drifts sideways.
    const anchorX = l.cx + whisper.dx * p.w;
    const dir = whisper.dx < 0 ? -1 : 1;
    return {
      id: whisper.id,
      side: 'center',
      text: lines.value[index] ?? '',
      style: {
        left: `${anchorX.toFixed(1)}px`,
        top: `${(p.y + whisper.dy * p.h).toFixed(1)}px`,
        opacity: (on * 0.62 * (1 - flash.value) * (1 - blackout.value)).toFixed(4),
        transform: `translate3d(${(dir * drift).toFixed(1)}px, -50%, 0)`,
        visibility: on > 0.01 ? 'visible' : 'hidden',
      } as CSSProperties,
    };
  });
});

/* ---------------- circle and cards ---------------- */
const wake = computed(() => at([T.cauldronOut[0], T.playerIn[1]]));
const circleStyle = computed(() => ({
  '--circle-mask': `url(${magicCircle})`,
  '--circle-spin': `${(final.value ? 96 : g.value * 900 + hit.value * 140).toFixed(2)}deg`,
  transform: `scale(${(0.9 + 0.1 * wake.value + 0.04 * hit.value + 0.1 * flash.value).toFixed(4)})`,
}));

/* ---------------- the spirit world ---------------- */
const spiritPhase = computed(() => ({
  fog: spirit.value,
  // the spirituality streams in while it takes hold and is spent at the flash
  gather: hit.value * (1 - smooth((g.value - (T.flash - 0.004)) / 0.004)),
  shock: shock.value,
}));
/* the canvas runs only while there is something of the spirit world to draw */
const spiritActive = computed(() => {
  const phase = spiritPhase.value;
  return props.active && !final.value && (phase.fog > 0.001 || phase.gather > 0.001 || phase.shock > 0);
});
const spiritAnchor = computed(() => {
  const l = props.layout;
  if (!l) return undefined;
  return { x: l.cx, y: l.player.y + l.player.h * 0.36 - rise.value, floor: l.cauldron.floorY, reach: l.player.h * 0.3 };
});

type CardSpec = { id: string; face: boolean; at: number; side: -1 | 1; dy: number; tilt: number };
const CARDS: CardSpec[] = [
  { id: 'face', face: true, at: T.awaken[0] + 0.046, side: 1, dy: 0.19, tilt: 7 },
];
const cards = computed(() => {
  const l = props.layout;
  if (!l) return [];
  const p = l.player;
  // big enough to read its numeral and name (the face's type scales with it), still clear of him
  const cardW = Math.max(60, Math.min(150, p.h * 0.3, (l.w - p.w * 0.8) / 2 - 24));
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
      // settled face up, in a scene the reader is on: a link to its Pathway
      open: props.active && card.face && (final.value || g.value >= card.at + 0.06),
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

/* the settled card leans toward the pointer and catches the light, like the hero's drawn card */
function onCardPointer(event: PointerEvent): void {
  const el = event.currentTarget;
  if (!(el instanceof HTMLElement) || !el.classList.contains('is-open') || event.pointerType !== 'mouse' || reduced.value) return;
  const rect = el.getBoundingClientRect();
  const px = clamp01((event.clientX - rect.left) / rect.width);
  const py = clamp01((event.clientY - rect.top) / rect.height);
  el.style.setProperty('--rx', `${((0.5 - py) * 16).toFixed(2)}deg`);
  el.style.setProperty('--ry', `${((px - 0.5) * 18).toFixed(2)}deg`);
  el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
  el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
}
function onCardLeave(event: PointerEvent): void {
  const el = event.currentTarget;
  if (!(el instanceof HTMLElement)) return;
  for (const name of ['--rx', '--ry', '--mx', '--my']) el.style.removeProperty(name);
}

const sceneVars = computed(() => {
  const l = props.layout;
  return {
    '--wake': wake.value.toFixed(4),
    '--awaken': awaken.value.toFixed(4),
    '--risk': risk.value.toFixed(4),
    '--blackout': blackout.value.toFixed(4),
    '--flash': flash.value.toFixed(4),
    '--hit': hit.value.toFixed(4),
    '--spirit': spirit.value.toFixed(4),
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

</script>

<style scoped>
/* ArcanaFace and ArcanaBack size their type and corners in cqw: give them a container. */
.reading-card__back,
.reading-card__front {
  container-type: size;
}

.drink-scene {
  --wake: 0;
  --awaken: 0;
  --risk: 0;
  --blackout: 0;
  --flash: 0;
  --hit: 0;
  --spirit: 0;
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
  opacity: calc(var(--wake) * ((0.25 + var(--hit) * 0.3) * (1 - var(--spirit) * 0.85) + var(--awaken) * 0.5 + var(--flash) * 0.6));
  transform: translate(-50%, -50%);
}

.drink-scene__circle {
  width: var(--circle-size);
  aspect-ratio: 1;
  margin: calc(var(--circle-size) / -2) 0 0 calc(var(--circle-size) / -2);
  /* it wakes under him as the potion takes hold; the spirit world drains it gray (::after) until the flash */
  opacity: min(1, calc(var(--wake) * (0.4 + var(--risk) * 0.15 + var(--hit) * 0.45 + var(--awaken) * 0.6 + var(--flash) * 0.6)));
  scale: 1 0.5;
  /* no glow filter: the ring turns every frame and a drop-shadow re-blurred it each time; the pool under it is the glow */
  will-change: transform, opacity;
}

.drink-scene__circle::before,
.drink-scene__circle::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, color-mix(in oklab, var(--acc) 70%, white), var(--acc) 45%, color-mix(in oklab, var(--acc) 60%, black));
  content: '';
  opacity: calc(1 - var(--spirit) * 0.9);
  transform: rotate(var(--circle-spin, 0deg));
  mask: var(--circle-mask) center / contain no-repeat;
  -webkit-mask: var(--circle-mask) center / contain no-repeat;
  /* scroll turns it every frame: rotate the composited ring rather than repaint it */
  will-change: transform, opacity;
}

/* the same ring in the spirit world's gray, crossfaded (never repainted) */
.drink-scene__circle::after {
  background: linear-gradient(135deg, #c9ccd6, #8d909c 50%, #4c4e57);
  opacity: calc(var(--spirit) * 0.75);
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
  display: block;
  border-radius: 7px;
  perspective: 700px;
  will-change: transform, opacity;
}

.reading-card.is-open {
  pointer-events: auto;
  cursor: pointer;
}

.reading-card:focus-visible {
  outline: 2px solid color-mix(in oklab, var(--acc) 70%, #efeef3);
  outline-offset: 5px;
}

.reading-card__tilt {
  position: absolute;
  inset: 0;
  transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
  transition: transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1), translate 0.35s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.reading-card.is-open:hover .reading-card__tilt,
.reading-card.is-open:focus-visible .reading-card__tilt {
  translate: 0 -6px;
}

/* light across the face, toward the pointer */
.reading-card__sheen {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at var(--mx, 50%) var(--my, 30%), rgba(255, 255, 255, 0.22), transparent 55%);
  mix-blend-mode: soft-light;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.reading-card.is-open:hover .reading-card__sheen {
  opacity: 1;
}

.reading-card__back,
.reading-card__front {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 7px;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.55), 0 0 26px color-mix(in oklab, var(--acc) 30%, transparent);
}

/* on a phone the card is small (about 70px): its name may go under the face's 13px floor rather than run off the card */
.reading-card__front :deep(.arc-face__name) {
  font-size: max(9px, 9.4cqw);
  letter-spacing: .02em;
}

/* Before a draw the Fool is only the example: its card wears the page's neutral accent, not its own purple. */
.reading-card__front.is-example :deep(.arc-face) {
  --card-acc: var(--acc) !important;
}

/* ---------- player (feet on the circle) ---------- */
.drink-scene__player {
  position: absolute;
  z-index: 5;
  min-width: 0;
  pointer-events: none;
  will-change: transform, opacity;
}

/* his body, from the crown to the feet (layout.ts PLAYER_FRAME): where the hand finds him */
.drink-scene__hit {
  position: absolute;
  left: 33%;
  width: 34%;
  top: 6%;
  height: 74%;
  pointer-events: none;
}

.drink-scene__hit.is-on {
  pointer-events: auto;
}

/* The name over his head, drawn texel by texel (pixelFont.ts), crisp at any size. */
.drink-scene__nametag {
  position: absolute;
  top: 0;
  left: 0;
  max-width: none;
  image-rendering: pixelated;
  opacity: 0;
  transition: opacity .32s ease;
  pointer-events: none;
}

.drink-scene__nametag.is-shown {
  opacity: .72;
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

/* keyboard only: a quiet accent ring, no glow (the story stays a dark room in either theme) */
.potion:focus-visible {
  outline: 1.5px solid color-mix(in oklab, var(--acc) 80%, #efeef3);
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

/* ---------- whispers ---------- */
.drink-scene__whispers {
  position: absolute;
  inset: 0;
  /* behind the player (5): his body covers part of each line, and its ends fade into the dark */
  z-index: 4;
  overflow: hidden;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 24%, #000 76%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 24%, #000 76%, transparent);
}

.whisper {
  position: absolute;
  width: max-content;
  white-space: nowrap;
  /* the potion story is a dark room in either theme */
  color: color-mix(in oklab, var(--acc) 30%, #efeef3);
  font: 400 clamp(26px, 3.4vw, 54px)/1 var(--arc-caps);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  /* a faint split image, as if heard twice */
  text-shadow: -2px 0 color-mix(in oklab, var(--acc) 60%, transparent), 2px 0 rgba(169, 198, 214, 0.3), 0 0 18px rgba(0, 0, 0, 0.8);
  animation: whisper-shiver 0.9s steps(3) infinite;
  will-change: transform, opacity;
}


.whisper--center {
  text-align: center;
  translate: -50% 0;
  animation-name: whisper-shiver-center;
}

@keyframes whisper-shiver-center {
  0%, 100% { translate: -50% 0; }
  33% { translate: calc(-50% + 1px) 0; }
  66% { translate: calc(-50% - 1px) 0; }
}

/* hidden (any other chapter), the voices hold still: a running loop costs a frame every tick */
.drink-scene.is-idle .whisper {
  animation-play-state: paused;
}

/* the shiver moves the composited text (translate), never its layout box */
@keyframes whisper-shiver {
  0%, 100% { translate: 0 0; }
  33% { translate: 1px 0; }
  66% { translate: -1px 0; }
}


/* ---------- floor mist, burnt off by the awakening ---------- */
.drink-scene__mist {
  position: absolute;
  z-index: 9;
  right: 0;
  bottom: 0;
  left: 0;
  height: 34%;
  /* each bank fades out inside the box (no mask: that cost a render pass every frame) */
  background:
    radial-gradient(ellipse 22% 46% at 28% 68%, rgba(200, 204, 214, 0.2), transparent 72%),
    radial-gradient(ellipse 26% 42% at 54% 74%, rgba(200, 204, 214, 0.15), transparent 72%),
    radial-gradient(ellipse 18% 38% at 78% 68%, rgba(200, 204, 214, 0.13), transparent 72%);
  opacity: calc(var(--wake) * min(1, 1 - var(--awaken) * 0.85 + var(--spirit) * 0.6));
  transform: translateY(calc(var(--awaken) * 30% - var(--risk) * 8% - var(--spirit) * 10%));
  pointer-events: none;
  will-change: transform, opacity;
}

/* ---------- flash ---------- */
/*
 * Behind him, not over him: the light breaks from behind his shoulders and he
 * stands in it as a silhouette, the burst of motes with it, instead of a white
 * smudge and sparks across his face.
 */
.drink-scene__flash {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  background: radial-gradient(ellipse 20% 30% at var(--stand-x) var(--chest-y), rgba(255, 255, 255, 0.5), color-mix(in oklab, var(--acc) 40%, transparent) 30%, color-mix(in oklab, var(--acc) 10%, transparent) 64%, transparent 100%);
  opacity: calc(var(--flash) * 0.75);
}

/* over him, under the potion and the voices: the fog closes round him, the motes reach his chest */
.drink-scene__spirit {
  position: absolute;
  /* reaches past the stage's foot (over the rail's band) and fades out there, so the
     drifting specks never stop at a hard line */
  inset: 0 0 -140px; /* top-left kept: the specks are placed in stage coordinates */
  z-index: 6;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .whisper {
    animation: none;
  }

  .reading-card__tilt {
    transition: none;
  }
}
</style>
