<template>
  <div ref="sceneRef" class="drink-scene" :style="sceneVars" role="group" :aria-label="tp('drink.sceneLabel')">
    <!-- Spirit-vision light: a column rising from the ritual circle. -->
    <div class="drink-scene__beam" aria-hidden="true" />

    <!-- The brewing circle again, rekindled under the player's feet. -->
    <div class="drink-scene__floor" aria-hidden="true">
      <div class="drink-scene__pool" />
      <div class="drink-scene__circle" :style="circleStyle" />
      <div class="drink-scene__fx">
        <SceneParticles mode="aura" :active="auraActive" :intensity="auraIntensity" />
      </div>
    </div>

    <!-- Divination: cards rise out of the circle; the reading is the Fool. -->
    <div class="drink-scene__tarot" aria-hidden="true">
      <div v-for="card in cards" :key="card.id" class="tarot" :style="card.style">
        <div class="tarot__inner" :style="card.innerStyle">
          <span class="tarot__face tarot__face--back">
            <svg viewBox="0 0 40 64" focusable="false">
              <rect x="3" y="3" width="34" height="58" rx="2" />
              <path d="M20 14 31 32 20 50 9 32Z" />
              <circle cx="20" cy="32" r="4" />
            </svg>
          </span>
          <span v-if="card.face" class="tarot__face tarot__face--front">
            <span class="tarot__number">0</span>
            <svg class="tarot__sigil" viewBox="0 0 40 40" focusable="false">
              <circle cx="20" cy="20" r="15" />
              <path d="M8 20c4-6 8-8 12-8s8 2 12 8c-4 6-8 8-12 8s-8-2-12-8Z" />
              <circle cx="20" cy="20" r="3.4" />
            </svg>
            <span class="tarot__name">{{ tp('drink.card') }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- the player: emerges from the dark lit by the potion, drinks, rises -->
    <div class="drink-scene__player" :style="playerStyle">
      <MinecraftPlayer
        :mode="playerMode"
        :armed="warm"
        :progress="p"
        :glow="rim"
        :shade="shade"
        :lift="lift"
        :sip="sip"
        costume
        :label="tp(`player.${playerMode}`)"
        @hand="onHand"
      />
    </div>

    <!-- the potion's own light, on the player's face and hands -->
    <div class="drink-scene__potion-light" :style="potionLightStyle" aria-hidden="true" />

    <!-- The same Sequence potion the cauldron made, taken into the hand. -->
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
      <span class="potion__halo" :style="potionHaloStyle" aria-hidden="true" />
      <span class="potion__sprite" :style="liquidStyle">
        <img :src="sequencePotion" alt="" width="16" height="16" decoding="async" draggable="false" />
      </span>
    </button>

    <!-- whispers: what the potion says back while it is drunk -->
    <div class="drink-scene__whispers" aria-hidden="true">
      <span v-for="whisper in whispers" :key="whisper.id" class="whisper" :class="`whisper--${whisper.side}`" :style="whisper.style">{{ whisper.text }}</span>
    </div>

    <!-- low mist over the floor until the awakening burns it off -->
    <div class="drink-scene__mist" aria-hidden="true" />
    <!-- fog curtains: closing in with each gulp, burst apart by the awakening -->
    <div class="drink-scene__curtains" aria-hidden="true">
      <i class="drink-scene__curtain drink-scene__curtain--left" />
      <i class="drink-scene__curtain drink-scene__curtain--right" />
    </div>

    <!-- the moment of awakening: a flash of spirit-vision -->
    <div class="drink-scene__flash" aria-hidden="true" />
    <div class="drink-scene__flash-fx" aria-hidden="true">
      <SceneParticles mode="burst" :active="burstActive" :intensity="1" />
    </div>

    <!-- awakened pathway -->
    <section class="panel" :style="panelStyle" role="group" :aria-label="tp('drink.panelLabel')">
      <p class="fog-label panel__kicker" :style="itemStyle(kickerReveal)">{{ tp('drink.panelKicker') }}</p>
      <h3 class="panel__title" :style="titleStyle">{{ names.sequence }}</h3>
      <i class="panel__rule" :style="ruleStyle" aria-hidden="true" />
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
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { CSSProperties } from 'vue';

import MinecraftPlayer from '../MinecraftPlayer.vue';
import type { HandPosition } from '../MinecraftPlayer.vue';
import SceneParticles from './SceneParticles.vue';
import type { BrewHandoff } from './AltarBrewScene.vue';
import { useProgressionCopy } from './useProgressionCopy';
import { DRINK_BEATS, awakenAt, blackoutAt, flashAt, gulpPulse, gulpsTaken, riskAt } from './drinkBeats';
import { useReducedMotion } from '@/composables/useReducedMotion';

import magicCircle from '@/assets/images/home/progression/real/magic-circle.png';
import sequencePotion from '@/assets/images/home/progression/real/sequence-potion.png';

const props = withDefaults(defineProps<{
  progress: number;
  active: boolean;
  /** The story is close to this scene: allow the 3D player to load. */
  warm?: boolean;
  /** Where the brew scene left the potion and the circle (stage px). */
  handoff?: BrewHandoff | null;
}>(), { warm: false, handoff: null });
const emit = defineEmits<{ (e: 'inspect', id: string, anchor: HTMLElement): void; (e: 'clear-inspect'): void }>();

const reduced = useReducedMotion();
const { tp, names, list } = useProgressionCopy();
const teaserText = computed(() => {
  const abilities = names.value.nextAbilities.map((ability) => ability.name);
  if (!abilities.length) return tp('details.nextSequence.label');
  return tp('drink.teaser', { abilities: list(abilities) });
});

/* The beats live in drinkBeats.ts (shared with the chapter's fog). */
function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
function smooth(t: number): number {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function inspect(id: string, event: Event): void {
  const anchor = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  if (anchor) emit('inspect', id, anchor);
}

const p = computed(() => clamp01(props.progress));
const final = computed(() => reduced.value);
const at = (start: number, span: number) => (final.value ? 1 : smooth((p.value - start) / span));

const awaken = computed(() => (final.value ? 1 : awakenAt(p.value)));
const risk = computed(() => (final.value ? 0 : riskAt(p.value)));
const blackout = computed(() => (final.value ? 0 : blackoutAt(p.value)));
const flash = computed(() => (final.value ? 0 : flashAt(p.value)));
const pulse = computed(() => (final.value ? 0 : gulpPulse(p.value)));
const gulps = computed(() => (final.value ? 3 : gulpsTaken(p.value)));
const lift = computed(() => at(...DRINK_BEATS.lift));
const caught = computed(() => at(...DRINK_BEATS.catch));

/* ---------------- stage geometry ---------------- */
const sceneRef = ref<HTMLElement | null>(null);
const size = ref({ w: 0, h: 0 });
let resizeObserver: ResizeObserver | null = null;
onMounted(() => {
  const measure = () => {
    if (sceneRef.value) size.value = { w: sceneRef.value.clientWidth, h: sceneRef.value.clientHeight };
  };
  measure();
  if (sceneRef.value) {
    resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(sceneRef.value);
  }
});
onUnmounted(() => resizeObserver?.disconnect());

/*
 * The player stands where the cauldron stood, on the same circle, and takes
 * the potion from where it floated. Without a handoff (the brew scene not yet
 * measured) the same composition is derived from the stage.
 */
const stage = computed(() => {
  const { w, h } = size.value;
  if (w <= 0 || h <= 0) return null;
  const hand = props.handoff;
  const sx = hand && hand.w > 0 ? w / hand.w : 1;
  const sy = hand && hand.h > 0 ? h / hand.h : 1;
  const circleW = hand ? hand.circleW * sx : Math.min(w * 0.5, 460);
  const floor = hand ? { x: hand.floor.x * sx, y: hand.floor.y * sy } : { x: Math.max(circleW / 2 + 24, w * 0.31), y: h - Math.max(circleW / 4 + 24, h * 0.13) };
  const potion = hand ? { x: hand.potion.x * sx, y: hand.potion.y * sy } : { x: floor.x, y: h * 0.4 };
  // the figure: feet on the circle, head clear of the stage top
  const ph = Math.min(h * 0.62, floor.y - 40);
  const pw = Math.min(200, ph * 0.46);
  return { w, h, circleW, floor, potion, ph, pw, left: floor.x - pw / 2, top: floor.y - ph * 0.985 };
});

/* ---------------- player ---------------- */
const playerMode = computed<'drink' | 'advance'>(() => (final.value || p.value >= DRINK_BEATS.flash ? 'advance' : 'drink'));
// silhouetted while drinking, backlit by the moon once awakened
const shade = computed(() => {
  if (final.value) return 0.3;
  const drinking = 0.62 + 0.38 * blackout.value;
  return lerp(drinking, 0.55, awaken.value) - 0.25 * at(0.6, 0.15);
});
const rim = computed(() => (final.value ? 1 : clamp01(0.3 * caught.value + 0.2 * risk.value + awaken.value)));
const sip = computed(() => clamp01(gulps.value / 3 + pulse.value * 0.15));
// the camera leans in on the drink, and draws back for the awakening
const zoom = computed(() => (final.value ? 1 : 1 + 0.1 * smooth(p.value / 0.3) * (1 - awaken.value) + 0.03 * pulse.value));

const playerStyle = computed<CSSProperties>(() => {
  const s = stage.value;
  if (!s) return { opacity: 0 };
  // out of the dark as the potion is handed over; rises with the awakening
  const emerge = final.value ? 1 : smooth(p.value / 0.035);
  const rise = awaken.value * 10;
  return {
    left: `${s.left.toFixed(1)}px`,
    top: `${s.top.toFixed(1)}px`,
    width: `${s.pw.toFixed(1)}px`,
    height: `${s.ph.toFixed(1)}px`,
    opacity: emerge.toFixed(4),
    transformOrigin: '50% 30%',
    transform: `translate3d(0, ${(-rise).toFixed(1)}px, 0) scale(${zoom.value.toFixed(4)})`,
  };
});

/* ---------------- potion: from where the cauldron left it, into the hand ---------------- */
const hand = ref<HandPosition | null>(null);
function onHand(pos: HandPosition | null): void {
  hand.value = pos;
}
/** The tracked hand in stage px (the player box, scaled about its pivot). */
const handPoint = computed(() => {
  const s = stage.value;
  if (!s) return null;
  const local = hand.value ?? { x: s.pw * 0.32, y: s.ph * (0.48 - 0.3 * lift.value) };
  const pivot = { x: s.left + s.pw * 0.5, y: s.top + s.ph * 0.3 };
  const z = zoom.value;
  const rise = awaken.value * 10;
  return {
    x: pivot.x + (s.left + local.x - pivot.x) * z,
    y: pivot.y + (s.top + local.y - pivot.y) * z - rise,
  };
});

const emptyT = computed(() => clamp01(gulps.value / 3));
// the empty bottle slips from the hand into the dark
const drop = computed(() => (final.value ? 1 : smooth((p.value - 0.345) / 0.045)));
const potionPoint = computed(() => {
  const s = stage.value;
  const h = handPoint.value;
  if (!s || !h) return null;
  const c = caught.value;
  // a short arc as it drifts across into the waiting hand
  const x = lerp(s.potion.x, h.x, c);
  const y = lerp(s.potion.y, h.y, c) - Math.sin(c * Math.PI) * 18;
  return { x: x + drop.value * 8, y: y + drop.value * 70 };
});

const potionStyle = computed<CSSProperties>(() => {
  const point = potionPoint.value;
  const tip = emptyT.value * 38 + pulse.value * 10;
  const pos = point ? { left: `${point.x.toFixed(1)}px`, top: `${point.y.toFixed(1)}px` } : { left: '31%', top: '40%' };
  const opacity = final.value ? 0 : 1 - drop.value;
  return {
    ...pos,
    transform: `translate(-50%, -50%) rotate(-${tip.toFixed(1)}deg) scale(${(1 - 0.12 * caught.value).toFixed(4)})`,
    opacity: opacity.toFixed(4),
    pointerEvents: opacity > 0.4 ? 'auto' : 'none',
  };
});
const potionHaloStyle = computed<CSSProperties>(() => ({
  opacity: ((1 - emptyT.value * 0.8) * (1 - drop.value)).toFixed(4),
  // matches the halo's final size in the brew scene, then tightens in the hand
  transform: `scale(${(1.2 - 0.25 * caught.value).toFixed(4)})`,
}));
const liquidStyle = computed<CSSProperties>(() => ({
  clipPath: `inset(${(emptyT.value * 100).toFixed(2)}% 0 0 0)`,
}));
const potionLightStyle = computed<CSSProperties>(() => {
  const point = potionPoint.value;
  const strength = final.value ? 0 : (1 - emptyT.value * 0.7) * (1 - drop.value) * (0.55 + 0.45 * caught.value);
  return {
    left: point ? `${point.x.toFixed(1)}px` : '31%',
    top: point ? `${point.y.toFixed(1)}px` : '40%',
    opacity: strength.toFixed(4),
  };
});

/* ---------------- whispers ---------------- */
type Whisper = { id: string; key: string; at: number; side: 'left' | 'right'; dx: number; dy: number };
const WHISPERS: Whisper[] = [
  { id: 'w1', key: 'drink.whisper1', at: DRINK_BEATS.gulps[0], side: 'right', dx: 0.62, dy: 0.12 },
  { id: 'w2', key: 'drink.whisper2', at: DRINK_BEATS.gulps[1], side: 'left', dx: -0.6, dy: 0.3 },
  { id: 'w3', key: 'drink.whisper3', at: DRINK_BEATS.gulps[2], side: 'right', dx: 0.74, dy: 0.46 },
  { id: 'w4', key: 'drink.whisper4', at: DRINK_BEATS.gulps[1] + 0.035, side: 'right', dx: 0.56, dy: 0.66 },
  { id: 'w5', key: 'drink.whisper5', at: DRINK_BEATS.blackout[0] + 0.01, side: 'left', dx: -0.56, dy: 0.56 },
];
const whispers = computed(() => {
  const s = stage.value;
  if (!s || final.value) return [];
  return WHISPERS.map((whisper) => {
    const t = (p.value - whisper.at) / 0.09;
    const on = t > -0.15 && t < 1 ? smooth((t + 0.15) / 0.25) * (1 - smooth((t - 0.55) / 0.45)) : 0;
    const drift = clamp01(t) * 14;
    const anchorX = s.floor.x + whisper.dx * s.pw;
    const y = s.top + whisper.dy * s.ph;
    const room = whisper.side === 'right' ? s.w - anchorX - 12 : anchorX - 12;
    return {
      id: whisper.id,
      side: whisper.side,
      text: tp(whisper.key),
      style: {
        left: `${anchorX.toFixed(1)}px`,
        top: `${y.toFixed(1)}px`,
        maxWidth: `${Math.max(60, Math.min(220, room)).toFixed(0)}px`,
        opacity: (on * (1 - flash.value)).toFixed(4),
        transform: `translate3d(${whisper.side === 'right' ? drift : -drift}px, -50%, 0)`,
        visibility: on > 0.01 ? 'visible' : 'hidden',
      } as CSSProperties,
    };
  });
});

/* ---------------- ritual circle and tarot ---------------- */
const circleWake = computed(() => at(0.1, 0.14));
const auraActive = computed(() => props.active && (final.value || p.value >= 0.12));
const auraIntensity = computed(() => 0.3 + 0.7 * awaken.value);
const circleStyle = computed(() => ({
  '--circle-mask': `url(${magicCircle})`,
  '--circle-spin': `${(final.value ? 96 : p.value * 200).toFixed(2)}deg`,
  transform: `scale(${(0.9 + 0.1 * circleWake.value + 0.12 * flash.value).toFixed(4)})`,
}));

type CardSpec = { id: string; face: boolean; at: number; dx: number; dy: number; tilt: number; scale: number; turns: number };
const CARDS: CardSpec[] = [
  { id: 'left', face: false, at: 0.5, dx: -0.95, dy: 0.42, tilt: -14, scale: 0.82, turns: 0.15 },
  { id: 'right', face: false, at: 0.53, dx: 0.98, dy: 0.5, tilt: 12, scale: 0.82, turns: -0.15 },
  { id: 'fool', face: true, at: 0.56, dx: 0.9, dy: 0.12, tilt: 6, scale: 1, turns: 1.5 },
];
const cards = computed(() => {
  const s = stage.value;
  if (!s) return [];
  const cardW = Math.max(52, Math.min(86, s.ph * 0.17));
  return CARDS.map((card) => {
    const t = final.value ? 1 : smooth((p.value - card.at) / 0.12);
    const w = cardW * card.scale;
    // clear of the awakened panel on the right (.panel: right 2%, up to 380px wide)
    const panelLeft = s.w * 0.98 - Math.min(380, s.w * 0.38);
    const targetX = Math.min(panelLeft - w / 2 - 16, Math.max(w / 2 + 12, s.floor.x + card.dx * s.pw));
    const targetY = s.top + card.dy * s.ph;
    // rising out of the circle, turning over as it comes
    const x = lerp(s.floor.x, targetX, t);
    const y = lerp(s.floor.y - 10, targetY, t) - Math.sin(t * Math.PI) * 26;
    const spin = (1 - t) * card.turns * 360 + (card.face ? 180 : 0);
    return {
      id: card.id,
      face: card.face,
      style: {
        left: `${x.toFixed(1)}px`,
        top: `${y.toFixed(1)}px`,
        width: `${w.toFixed(1)}px`,
        opacity: (clamp01(t * 3) * (card.face ? 1 : 0.8)).toFixed(4),
        transform: `translate(-50%, -50%) rotate(${(card.tilt * t).toFixed(2)}deg) scale(${(0.4 + 0.6 * t).toFixed(4)})`,
      } as CSSProperties,
      innerStyle: { transform: `rotateY(${spin.toFixed(1)}deg)` } as CSSProperties,
    };
  });
});

// Scene-wide drivers read by the stylesheet.
const sceneVars = computed(() => {
  const s = stage.value;
  return {
    '--wake': circleWake.value.toFixed(4),
    '--awaken': awaken.value.toFixed(4),
    '--risk': risk.value.toFixed(4),
    '--blackout': blackout.value.toFixed(4),
    '--flash': flash.value.toFixed(4),
    ...(s
      ? {
        '--stand-x': `${s.floor.x.toFixed(1)}px`,
        '--floor-top': `${s.floor.y.toFixed(1)}px`,
        '--circle-size': `${s.circleW.toFixed(1)}px`,
        '--chest-y': `${(s.top + s.ph * 0.4).toFixed(1)}px`,
      }
      : {}),
  } as CSSProperties;
});

/* ---------------- flash ---------------- */
const burstActive = computed(() => props.active && !final.value && p.value >= DRINK_BEATS.flash && p.value < 0.54);

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
const stagger = (offset: number, span = 0.08) => computed(() => (final.value ? 1 : clamp01((p.value - 0.46 - offset) / span)));
const kickerReveal = stagger(0);
const titleReveal = stagger(0.03, 0.1);
const subReveal = stagger(0.1);
const chip1Reveal = stagger(0.14);
const chip2Reveal = stagger(0.17);
const teaserReveal = stagger(0.2);
const ctaReveal = stagger(0.23);
// The name lands heavy: it is unmasked from below as it settles from large.
const titleStyle = computed<CSSProperties>(() => {
  const t = titleReveal.value;
  const e = 1 - (1 - t) ** 3;
  return {
    opacity: clamp01(t * 2.5).toFixed(4),
    clipPath: `inset(${((1 - e) * 100).toFixed(2)}% -10% -10% -10%)`,
    transform: `translateY(${((1 - e) * 22).toFixed(1)}px) scale(${(1.22 - 0.22 * e).toFixed(4)})`,
  };
});
const ruleStyle = computed<CSSProperties>(() => ({
  transform: `scaleX(${smooth((titleReveal.value - 0.4) / 0.6).toFixed(4)})`,
}));
</script>

<style scoped>
.drink-scene {
  --wake: 0;
  --awaken: 0;
  --risk: 0;
  --blackout: 0;
  --flash: 0;
  --stand-x: 31%;
  --floor-top: 80%;
  --circle-size: min(460px, 46%);
  --chest-y: 40%;
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

/* ---------- spirit-vision light column ---------- */
.drink-scene__beam {
  position: absolute;
  top: 0;
  left: var(--stand-x);
  width: min(240px, 26%);
  height: var(--floor-top);
  background: radial-gradient(ellipse 50% 100% at 50% 100%, rgba(229, 84, 93, 0.4), rgba(179, 32, 43, 0.12) 55%, transparent 80%);
  -webkit-mask-image: linear-gradient(0deg, #000 40%, transparent);
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
  background: radial-gradient(ellipse, rgba(179, 32, 43, 0.5), rgba(142, 23, 32, 0.16) 50%, transparent 72%);
  opacity: calc(var(--wake) * (0.3 + var(--awaken) * 0.7 + var(--flash) * 0.6));
  transform: translate(-50%, -50%);
}

/* The circle lies on the ground, foreshortened like the brewing circle. */
.drink-scene__circle {
  width: var(--circle-size);
  aspect-ratio: 1;
  margin: calc(var(--circle-size) / -2) 0 0 calc(var(--circle-size) / -2);
  opacity: calc(var(--wake) * (0.4 + var(--risk) * 0.2 + var(--awaken) * 0.6) * (1 - var(--blackout) * 0.6));
  transform-origin: 50% 50%;
  /* foreshortening here, spin from the art's own transform */
  scale: 1 0.5;
  filter: drop-shadow(0 0 calc(6px + var(--awaken) * 16px) rgba(229, 84, 93, 0.75));
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

/* spirit vision: the circle's rim shows its spirit-blue edge once awake */
.drink-scene__circle::after {
  position: absolute;
  inset: 3%;
  border: 1px solid rgba(169, 198, 214, 0.35);
  border-radius: 50%;
  content: '';
  opacity: var(--awaken);
}

.drink-scene__fx {
  width: calc(var(--circle-size) * 0.8);
  height: calc(var(--circle-size) * 0.8);
  opacity: var(--wake);
  transform: translate(-50%, -66%);
}

/* ---------- tarot ---------- */
.drink-scene__tarot {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
}
.tarot {
  position: absolute;
  aspect-ratio: 5 / 8;
  perspective: 600px;
  will-change: transform, opacity;
}
.tarot__inner {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
}
.tarot__face {
  position: absolute;
  inset: 0;
  border-radius: 4px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.55), 0 0 22px rgba(179, 32, 43, 0.3);
}
.tarot__face--back {
  background: var(--fog-2);
}
.tarot__face--back svg {
  display: block;
  width: 100%;
  height: 100%;
  fill: none;
  stroke: var(--crimson-text);
  stroke-width: 1.2;
}
/* the reading: paper, so it is the one bright object besides the moon */
.tarot__face--front {
  display: grid;
  grid-template-rows: auto 1fr auto;
  justify-items: center;
  padding: 8% 6%;
  border: 1px solid rgba(29, 27, 23, 0.4);
  background: var(--paper);
  color: var(--paper-ink);
  transform: rotateY(180deg);
}
.tarot__number {
  font: 800 0.9rem/1 var(--font-display);
}
.tarot__sigil {
  width: 76%;
  align-self: center;
  fill: none;
  stroke: var(--crimson);
  stroke-width: 1.6;
}
.tarot__name {
  max-width: 100%;
  overflow-wrap: anywhere;
  font: 800 0.72rem/1 var(--font-display);
  letter-spacing: 0.04em;
  text-align: center;
  text-transform: uppercase;
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
  width: 220px;
  height: 220px;
  margin: -110px 0 0 -110px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(214, 236, 226, 0.3), rgba(169, 198, 214, 0.1) 40%, transparent 70%);
  mix-blend-mode: screen;
  pointer-events: none;
}
.potion {
  position: absolute;
  z-index: 7;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  will-change: transform, opacity;
}
/* the same halo the potion rose out of the cauldron with */
.potion__halo {
  position: absolute;
  inset: -36px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(236, 230, 218, 0.4), rgba(229, 84, 93, 0.3) 34%, rgba(179, 32, 43, 0.12) 54%, transparent 72%);
  pointer-events: none;
}
.potion__sprite {
  position: relative;
  display: block;
  width: 64px;
  height: 64px;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6));
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
  color: var(--bone);
  font: 500 0.72rem/1.35 var(--font-mono);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  /* a split image, as if heard twice */
  text-shadow: -1.5px 0 rgba(229, 84, 93, 0.7), 1.5px 0 rgba(169, 198, 214, 0.55), 0 0 12px rgba(0, 0, 0, 0.9);
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
  height: 40%;
  /* soft on every side: the stage clips, the mist must not show it */
  -webkit-mask-image: radial-gradient(ellipse 50% 50% at 50% 55%, #000 40%, transparent 100%);
  mask-image: radial-gradient(ellipse 50% 50% at 50% 55%, #000 40%, transparent 100%);
  background:
    radial-gradient(ellipse 30% 50% at 22% 70%, rgba(200, 206, 214, 0.22), transparent 72%),
    radial-gradient(ellipse 34% 46% at 58% 80%, rgba(200, 206, 214, 0.16), transparent 72%),
    radial-gradient(ellipse 24% 40% at 88% 70%, rgba(200, 206, 214, 0.14), transparent 72%);
  opacity: calc(1 - var(--awaken) * 0.85);
  transform: translateY(calc(var(--awaken) * 30% - var(--risk) * 8%));
  pointer-events: none;
}

/* ---------- fog curtains (masked so they never show the stage edge) ---------- */
.drink-scene__curtains {
  position: absolute;
  inset: 0;
  z-index: 9;
  -webkit-mask-image: radial-gradient(ellipse 50% 50% at 50% 50%, #000 55%, transparent 100%);
  mask-image: radial-gradient(ellipse 50% 50% at 50% 50%, #000 55%, transparent 100%);
  pointer-events: none;
}
.drink-scene__curtain {
  position: absolute;
  top: -10%;
  bottom: -10%;
  width: 70%;
  background:
    radial-gradient(ellipse 40% 30% at 50% 30%, rgba(176, 184, 196, 0.18), transparent 70%),
    radial-gradient(ellipse 46% 34% at 40% 70%, rgba(176, 184, 196, 0.16), transparent 70%),
    radial-gradient(ellipse 50% 60% at 50% 50%, rgba(10, 11, 15, 0.7), transparent 75%);
  /* they creep in with the dread and are thrown wide by the awakening */
  opacity: calc(var(--risk) * 0.9 + var(--blackout) * 0.3 + var(--flash) * 0.5);
}
.drink-scene__curtain--left {
  left: calc(var(--stand-x) - 82%);
  transform: translate3d(calc(var(--risk) * 22% + var(--blackout) * 8% - var(--awaken) * 60%), 0, 0);
}
.drink-scene__curtain--right {
  left: calc(var(--stand-x) + 12%);
  transform: translate3d(calc(var(--risk) * -22% - var(--blackout) * 8% + var(--awaken) * 60%), 0, 0);
}

/* ---------- flash ---------- */
.drink-scene__flash {
  position: absolute;
  inset: 0;
  z-index: 30;
  pointer-events: none;
  /* sized to fade out before the stage edges, which clip it */
  background: radial-gradient(ellipse 34% 48% at var(--stand-x) var(--chest-y), rgba(236, 230, 218, 0.95), rgba(229, 84, 93, 0.45) 34%, rgba(142, 23, 32, 0.2) 66%, transparent 100%);
  opacity: var(--flash);
  will-change: opacity;
}
.drink-scene__flash-fx {
  position: absolute;
  z-index: 31;
  top: 6%;
  bottom: 14%;
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
  margin: 14px 0 0;
  color: var(--bone);
  font: 800 clamp(3.4rem, 6.2vw, 6.2rem)/0.86 var(--font-display);
  text-transform: uppercase;
  letter-spacing: .005em;
  overflow-wrap: anywhere;
  text-shadow: 0 0 46px rgba(179, 32, 43, 0.6), 0 4px 0 rgba(0, 0, 0, 0.35);
  transform-origin: 0 100%;
  will-change: transform, opacity, clip-path;
}
.panel__rule {
  display: block;
  width: 72px;
  height: 3px;
  margin: 12px 0 12px;
  background: var(--crimson);
  box-shadow: 0 0 16px rgba(229, 84, 93, 0.6);
  transform-origin: 0 50%;
}
.panel__sub {
  margin: 0 0 20px;
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
  padding: 11px 0;
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
/* the way on: the one filled control on stage, with a slow pulse around it */
.panel__cta {
  position: relative;
  min-height: 52px;
  margin-top: 20px;
  padding: 0 28px;
  font-size: 1rem;
  box-shadow: 0 0 0 1px rgba(229, 84, 93, 0.5), 0 10px 30px rgba(179, 32, 43, 0.35);
}
.panel__cta::after {
  position: absolute;
  inset: -5px;
  border: 1px solid rgba(229, 84, 93, 0.6);
  border-radius: inherit;
  content: '';
  opacity: 0;
  animation: cta-pulse 2.6s ease-out infinite;
  pointer-events: none;
}
@keyframes cta-pulse {
  0% { opacity: 0.8; transform: scale(1); }
  70%, 100% { opacity: 0; transform: scale(1.12, 1.3); }
}

@media (prefers-reduced-motion: reduce) {
  .potion__sprite,
  .panel-ability,
  .panel-teaser {
    transition: none;
  }
  .whisper,
  .panel__cta::after {
    animation: none;
  }
}
</style>
