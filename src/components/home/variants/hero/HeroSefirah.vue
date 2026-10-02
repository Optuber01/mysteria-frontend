<template>
  <section
      ref="heroRef"
      class="sefirah"
      :class="{ 'is-ready': isReady, 'is-claiming': claiming }"
      :style="heroStyle"
      aria-labelledby="home-title"
      @pointermove="onPointerMove"
      @pointerleave="onPointerLeave"
  >
    <!-- Sefirah Castle: a long table above an endless sea of gray fog. Drawn, not photographed. -->
    <div class="sf-stage" aria-hidden="true">
      <div class="sf-sky"></div>
      <div class="sf-fog sf-fog--horizon"></div>

      <svg v-if="scene" class="sf-layer sf-pillars" :viewBox="`0 0 ${scene.w} ${scene.h}`" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sf-pillar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#07080b" stop-opacity="0"/>
            <stop offset=".22" stop-color="#090b0e" stop-opacity="0"/>
            <stop offset=".5" stop-color="#0a0c10" stop-opacity=".9"/>
            <stop offset=".8" stop-color="#14171d"/>
            <stop offset="1" stop-color="#1c2027" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="sf-pillar-rim" x1="0" y1="0" x2="0" :y2="scene.h" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#ece6da" stop-opacity="0"/>
            <stop offset=".25" stop-color="#ece6da" stop-opacity="0"/>
            <stop offset=".5" stop-color="#ece6da" stop-opacity=".18"/>
            <stop offset="1" stop-color="#ece6da" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <g v-for="pillar in scene.pillars" :key="pillar.key">
          <path :d="pillar.body" fill="url(#sf-pillar)"/>
          <path :d="pillar.rim" fill="none" stroke="url(#sf-pillar-rim)" stroke-width="1"/>
        </g>
      </svg>

      <svg v-if="scene" class="sf-layer sf-hall" :viewBox="`0 0 ${scene.w} ${scene.h}`" preserveAspectRatio="none">
        <defs>
          <radialGradient id="sf-halo" cx=".5" cy=".5" r=".5">
            <stop offset="0" stop-color="#ece6da" stop-opacity=".2"/>
            <stop offset=".55" stop-color="#ece6da" stop-opacity=".05"/>
            <stop offset="1" stop-color="#ece6da" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="sf-table" x1="0" :y1="scene.farY" x2="0" :y2="scene.h" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#34322f"/>
            <stop offset=".18" stop-color="#1d1c1b"/>
            <stop offset="1" stop-color="#0b0b0c"/>
          </linearGradient>
          <linearGradient id="sf-sheen" x1="0" :y1="scene.farY" x2="0" :y2="scene.h" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#ece6da" stop-opacity=".22"/>
            <stop offset=".5" stop-color="#ece6da" stop-opacity=".04"/>
            <stop offset="1" stop-color="#ece6da" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="sf-chair" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#1f2126"/>
            <stop offset=".5" stop-color="#101114"/>
            <stop offset="1" stop-color="#0a0b0d"/>
          </linearGradient>
          <linearGradient id="sf-seat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#5a1218"/>
            <stop offset=".6" stop-color="#26080b"/>
            <stop offset="1" stop-color="#0a0b0d"/>
          </linearGradient>
          <radialGradient id="sf-seat-glow" cx=".5" cy=".5" r=".5">
            <stop offset="0" stop-color="#b3202b" stop-opacity=".55"/>
            <stop offset="1" stop-color="#b3202b" stop-opacity="0"/>
          </radialGradient>
        </defs>

        <!-- The Fool presides at the head of the table, under a pale halo. -->
        <ellipse :cx="scene.halo.x" :cy="scene.halo.y" :rx="scene.halo.r * 2.4" :ry="scene.halo.r * 2.4" fill="url(#sf-halo)"/>
        <circle :cx="scene.halo.x" :cy="scene.halo.y" :r="scene.halo.r" fill="none" stroke="rgba(236, 230, 218, .3)" stroke-width="1"/>
        <circle :cx="scene.halo.x" :cy="scene.halo.y" :r="scene.halo.r * 1.18" fill="none" stroke="rgba(236, 230, 218, .1)" stroke-width="1" stroke-dasharray="2 6"/>
        <image
            class="sf-sigil"
            href="/pathway-art/avif/thumbs/fool.avif"
            :x="scene.halo.x - scene.halo.r * .86"
            :y="scene.halo.y - scene.halo.r * .86"
            :width="scene.halo.r * 1.72"
            :height="scene.halo.r * 1.72"
        />
        <path :d="scene.throne.body" fill="url(#sf-chair)" stroke="rgba(236, 230, 218, .34)" stroke-width="1"/>
        <path :d="scene.throne.panel" fill="none" stroke="rgba(236, 230, 218, .12)" stroke-width="1"/>

        <!-- Twenty-one seats along the sides; with the Fool's, twenty-two. One stands empty. -->
        <g v-for="chair in scene.chairs" :key="chair.key" :class="{ 'sf-chair--yours': chair.yours }">
          <ellipse v-if="chair.yours" class="sf-seat-glow" :cx="chair.cx" :cy="chair.cy" :rx="chair.glow" :ry="chair.glow * 1.3" fill="url(#sf-seat-glow)"/>
          <path :d="chair.edge" :fill="chair.yours ? '#3a0c11' : '#16181c'"/>
          <path :d="chair.back" :fill="chair.yours ? 'url(#sf-seat)' : 'url(#sf-chair)'"/>
          <path :d="chair.rim" fill="none" :stroke="chair.yours ? '#e5545d' : 'rgba(236, 230, 218, .22)'" stroke-width="1"/>
        </g>

        <path :d="scene.table.end" fill="#121214"/>
        <path :d="scene.table.top" fill="url(#sf-table)"/>
        <path :d="scene.table.sheen" fill="url(#sf-sheen)"/>
        <path :d="scene.table.edges" fill="none" stroke="rgba(236, 230, 218, .2)" stroke-width="1"/>
      </svg>

      <div class="sf-fog sf-fog--mid"></div>
      <div class="sf-fog sf-fog--near sf-fog--left"></div>
      <div class="sf-fog sf-fog--near sf-fog--right"></div>
      <div class="sf-scrim"></div>

      <p v-if="scene" class="sf-seat-label" :style="{ left: `${scene.seatLabel.x}px`, top: `${scene.seatLabel.y}px` }">
        <span>{{ t('home.heroVariants.sefirah.yourSeat') }}</span>
      </p>
    </div>

    <div ref="headRef" class="sf-head">
      <p class="fog-label">{{ t('home.heroVariants.sefirah.kicker') }}</p>
      <h1 id="home-title" class="sf-title">
        <span>{{ t('home.hero.headlineLead') }}</span>
        <span class="sf-title__accent">{{ t('home.hero.headlineAccent') }}</span>
      </h1>
    </div>

    <div class="sf-body">
      <p class="sf-summary">{{ t('home.heroVariants.sefirah.summary') }}</p>

      <div class="sf-actions">
        <RouterLink
            class="fog-button"
            :to="$lp('/guide/connect')"
            @pointerenter="claiming = true"
            @pointerleave="claiming = false"
            @focus="claiming = true"
            @blur="claiming = false"
        >
          {{ t('home.hero.primaryCta') }}
          <span aria-hidden="true">→</span>
        </RouterLink>
        <a class="fog-button fog-button--ghost" href="#pathways">{{ t('homePage.heroSecondaryCta') }}</a>
      </div>

      <div class="sf-address" :class="`is-${copyState}`">
        <span class="sf-address__dot" :class="`is-${status.state}`" aria-hidden="true"></span>
        <span class="sf-address__label">{{ copyLabel }}</span>
        <strong ref="addressRef" class="sf-address__value">{{ SERVER_IP }}</strong>
        <button type="button" class="sf-address__copy" :aria-label="copyButtonLabel" @click="copy">
          <svg v-if="copyState === 'copied'" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7"/></svg>
          <svg v-else-if="copyState === 'failed'" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v6M12 17v.5"/></svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15V6a1 1 0 0 1 1-1h9"/></svg>
        </button>
        <span class="visually-hidden" aria-live="polite">{{ copyAnnouncement }}</span>
      </div>

      <p class="sf-census">{{ census }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import {computed, nextTick, onMounted, onUnmounted, ref, type CSSProperties} from 'vue';
import {useI18n} from '@/composables/useI18n';
import {useReducedMotion} from '@/composables/useReducedMotion';
import type {ServerStatus} from '@/composables/useSharedServerStatus';
import {fill, useHeroAddress} from './useHeroAddress';

const props = defineProps<{ status: ServerStatus; latestSlug?: string | null }>();

const {t, plural} = useI18n();
const reducedMotion = useReducedMotion();
const heroRef = ref<HTMLElement | null>(null);
const headRef = ref<HTMLElement | null>(null);
const addressRef = ref<HTMLElement | null>(null);
const isReady = ref(false);
const claiming = ref(false);
const {
  SERVER_IP, copyState, copy,
  label: copyLabel, buttonLabel: copyButtonLabel, announcement: copyAnnouncement,
} = useHeroAddress(addressRef);

const census = computed(() => {
  const {state, playersOnline} = props.status;
  if (state === 'loading') return t('home.heroVariants.sefirah.censusLoading');
  if (state === 'offline' || playersOnline === null) return t('home.heroVariants.sefirah.censusOffline');
  const forms = {
    one: t('home.heroVariants.sefirah.census.one'),
    few: t('home.heroVariants.sefirah.census.few'),
    many: t('home.heroVariants.sefirah.census.many'),
  };
  return fill(plural(playersOnline, forms), {count: playersOnline});
});

/* ---- The hall, in one-point perspective ----
 * World units are pixels at depth z = 1; a point (X, Y, z) lands on screen at
 * (vx + X / z, vy + Y / z). Y grows downward from eye height, so the table top
 * sits at Y = D below the eye and the fog's horizon is the line y = vy. */

type Point = [number, number];
type Size = { w: number; h: number; headBottom: number };

const size = ref<Size | null>(null);

const Z_NEAR = .9;
const Z_FAR = 6;
const Z_THRONE = 6.35;
/* The throne's on-screen height as a share of the hero. */
const THRONE_SHARE = .14;
/* Left side has eleven seats, right side ten, staggered half a seat. */
const SEAT_STEP = .44;
const YOUR_SEAT = 0;

const path = (points: Point[]) => `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`;
const line = (points: Point[]) => `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}`;

const scene = computed(() => {
  if (!size.value) return null;
  const {w, h, headBottom} = size.value;
  const narrow = w < 720;
  const vx = w / 2;
  const floor = h * 1.04;
  // Low enough that the throne clears the headline, never above 40% of the hero.
  const throneShare = narrow ? .09 : THRONE_SHARE;
  const needed = (headBottom + 18 + throneShare * h - floor / Z_THRONE) / (1 - 1 / Z_THRONE);
  const vy = Math.max(h * .4, needed);
  const D = floor - vy;
  const hw = narrow ? w * .36 : Math.min(w * .29, 520);
  const project = (X: number, Y: number, z: number): Point => [vx + X / z, vy + Y / z];

  const tableTop = path([project(-hw, D, Z_NEAR), project(hw, D, Z_NEAR), project(hw, D, Z_FAR), project(-hw, D, Z_FAR)]);
  const tableEnd = path([project(-hw, D, Z_FAR), project(hw, D, Z_FAR), project(hw, D * 1.14, Z_FAR), project(-hw, D * 1.14, Z_FAR)]);
  const sheen = path([project(-hw * .22, D, Z_NEAR), project(hw * .22, D, Z_NEAR), project(hw * .5, D, Z_FAR), project(-hw * .5, D, Z_FAR)]);
  const edges = [
    line([project(-hw, D, Z_NEAR), project(-hw, D, Z_FAR), project(hw, D, Z_FAR), project(hw, D, Z_NEAR)]),
  ].join(' ');
  const farY = project(0, D, Z_FAR)[1];

  // Chair backs stand in planes parallel to the table, so they foreshorten toward the head.
  const chairX = hw * (narrow ? 1.1 : 1.14);
  const thick = hw * .07;
  const depth = .3;
  const baseY = D * 1.25;
  const topY = D * .56;
  const shoulderY = D * .68;
  const outline = (side: number, z0: number) => {
    const X = side * chairX;
    const at = (u: number, Y: number) => project(X, Y, z0 + u * depth);
    return [
      at(0, baseY), at(0, shoulderY), at(.06, shoulderY - (shoulderY - topY) * .5),
      at(.22, shoulderY - (shoulderY - topY) * .82), at(.5, topY), at(.78, shoulderY - (shoulderY - topY) * .82),
      at(.94, shoulderY - (shoulderY - topY) * .5), at(1, shoulderY), at(1, baseY),
    ];
  };
  const chairs: Array<{ key: string; back: string; edge: string; rim: string; yours: boolean; cx: number; cy: number; glow: number }> = [];
  const placements: Array<{ side: number; z: number; index: number }> = [];
  for (let i = 0; i < 11; i++) placements.push({side: -1, z: 1.15 + i * SEAT_STEP, index: i});
  for (let i = 0; i < 10; i++) placements.push({side: 1, z: 1.15 + SEAT_STEP / 2 + i * SEAT_STEP, index: i});
  // Far chairs first, so nearer ones overlap them.
  placements.sort((a, b) => b.z - a.z);
  let seatLabel = {x: 0, y: 0};
  for (const {side, z, index} of placements) {
    const outer = outline(side, z);
    const X = side * chairX;
    const edge = path([
      project(X, baseY, z), project(X, shoulderY, z),
      project(X + side * thick, shoulderY, z), project(X + side * thick, baseY, z),
    ]);
    const yours = side === 1 && index === YOUR_SEAT;
    const [tx, ty] = outer[4];
    const [bx] = outer[0];
    if (yours) seatLabel = {x: tx, y: ty};
    chairs.push({
      key: `${side}-${index}`,
      back: path(outer),
      edge,
      rim: line(outer.slice(1, 8)),
      yours,
      cx: (tx + bx) / 2,
      cy: ty + (project(X, D, z)[1] - ty) * .5,
      glow: Math.abs(project(X, 0, z)[0] - project(X, 0, z + depth)[0]) * 3 + 40,
    });
  }

  // The Fool's high seat at the head, facing down the table.
  const throneBase = project(0, D * 1.08, Z_THRONE)[1];
  const throneH = throneShare * h;
  const throneW = Math.max(throneH * .34, hw / Z_THRONE * .8);
  const tp = (u: number, v: number): Point => [vx + u * throneW / 2, throneBase - v * throneH];
  const throneShape: Array<[number, number]> = [
    [-1, 0], [-1, .6], [-1.16, .64], [-.98, .69], [-.98, .74], [-.66, .77], [-.36, .87], [-.14, .91], [0, 1],
    [.14, .91], [.36, .87], [.66, .77], [.98, .74], [.98, .69], [1.16, .64], [1, .6], [1, 0],
  ];
  const throne = {
    body: path(throneShape.map(([u, v]) => tp(u, v))),
    panel: path([tp(-.62, .12), tp(-.62, .62), tp(0, .8), tp(.62, .62), tp(.62, .12)]),
  };
  const halo = {x: vx, y: throneBase - throneH * .8, r: throneW * 1.15};

  // Pillars of the castle rise out of the fog on either side, beyond the seats.
  const pillars = narrow ? [] : [1.7, 3.6].flatMap((z, i) => [-1, 1].map((side) => {
    const X = side * (hw * 2.1 + i * hw * .15);
    const half = hw * .26;
    const left = vx + (X - half) / z;
    const right = vx + (X + half) / z;
    const bottom = vy + (D * 1.6) / z;
    const inner = side < 0 ? right : left;
    return {
      key: `${side}-${i}`,
      body: path([[left, -2], [right, -2], [right, bottom], [left, bottom]]),
      rim: line([[inner, 0], [inner, bottom * .92]]),
    };
  }));

  return {
    w, h, vy, farY,
    table: {top: tableTop, end: tableEnd, sheen, edges},
    chairs, throne, halo, pillars, seatLabel,
  };
});

/* ---- Pointer parallax and the scroll that parts the fog ---- */

const pointer = {x: 0, y: 0, tx: 0, ty: 0};
const px = ref(0);
const py = ref(0);
const part = ref(0);
let frame = 0;
let resizeObserver: ResizeObserver | null = null;

const heroStyle = computed<CSSProperties & Record<`--${string}`, string>>(() => ({
  '--px': px.value.toFixed(3),
  '--py': py.value.toFixed(3),
  '--part': part.value.toFixed(3),
  '--vy': `${(scene.value?.vy ?? 0).toFixed(0)}px`,
}));

function onPointerMove(event: PointerEvent) {
  if (reducedMotion.value || event.pointerType !== 'mouse') return;
  const bounds = heroRef.value?.getBoundingClientRect();
  if (!bounds) return;
  pointer.tx = (event.clientX - bounds.left) / bounds.width * 2 - 1;
  pointer.ty = (event.clientY - bounds.top) / bounds.height * 2 - 1;
  schedule();
}

function onPointerLeave() {
  pointer.tx = 0;
  pointer.ty = 0;
  schedule();
}

function tick() {
  frame = 0;
  pointer.x += (pointer.tx - pointer.x) * .08;
  pointer.y += (pointer.ty - pointer.y) * .08;
  px.value = pointer.x;
  py.value = pointer.y;
  if (Math.abs(pointer.tx - pointer.x) > .002 || Math.abs(pointer.ty - pointer.y) > .002) schedule();
}

function schedule() {
  if (!frame && !reducedMotion.value) frame = requestAnimationFrame(tick);
}

let scrollFrame = 0;
function onScroll() {
  if (scrollFrame || reducedMotion.value) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
    const height = heroRef.value?.offsetHeight ?? 1;
    part.value = Math.min(1, Math.max(0, window.scrollY / (height * .85)));
  });
}

function measure() {
  const hero = heroRef.value;
  const head = headRef.value;
  if (!hero || !head) return;
  size.value = {
    w: hero.clientWidth,
    h: hero.clientHeight,
    headBottom: head.offsetTop + head.offsetHeight,
  };
}

onMounted(async () => {
  measure();
  // Webfonts change the headline's height; measure again once they settle.
  document.fonts?.ready.then(measure).catch(() => undefined);
  resizeObserver = new ResizeObserver(measure);
  if (heroRef.value) resizeObserver.observe(heroRef.value);
  if (headRef.value) resizeObserver.observe(headRef.value);
  window.addEventListener('scroll', onScroll, {passive: true});
  await nextTick();
  requestAnimationFrame(() => {
    isReady.value = true;
  });
});

onUnmounted(() => {
  if (frame) cancelAnimationFrame(frame);
  if (scrollFrame) cancelAnimationFrame(scrollFrame);
  resizeObserver?.disconnect();
  window.removeEventListener('scroll', onScroll);
});
</script>

<style scoped>
.sefirah {
  --px: 0;
  --py: 0;
  --part: 0;
  position: relative;
  min-height: max(700px, 100svh);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  padding:
      calc(var(--home-header-height, 68px) + clamp(24px, 5vh, 56px))
      var(--home-content-gutter, clamp(20px, 4vw, 56px))
      clamp(28px, 5vh, 52px);
  overflow: hidden;
  color: var(--bone);
  background: var(--fog-0);
  text-align: center;
  isolation: isolate;
}

/* ---- Stage ---- */
.sf-stage,
.sf-sky,
.sf-layer,
.sf-scrim {
  position: absolute;
  inset: 0;
}

.sf-stage {
  z-index: -1;
  pointer-events: none;
}

.sf-layer {
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* Night above, the fog sea below the horizon: brightest where you look across it. */
.sf-sky {
  background:
      radial-gradient(ellipse 34% 26% at 50% var(--vy), rgba(236, 230, 218, .09), transparent 70%),
      linear-gradient(180deg,
      #060709 0%,
      #0b0d11 calc(var(--vy) - 26vh),
      #232831 calc(var(--vy) - 8px),
      #3a4049 var(--vy),
      #262b33 calc(var(--vy) + 6vh),
      #14171d calc(var(--vy) + 26vh),
      #0b0d11 100%);
}

.sf-pillars {
  transform: translate3d(calc(var(--px) * -10px), calc(var(--py) * -4px + var(--part) * 6vh), 0);
}

.sf-hall {
  transform-origin: 50% var(--vy);
  transform: translate3d(calc(var(--px) * -5px), calc(var(--py) * -3px + var(--part) * 14vh), 0) scale(calc(1 + var(--part) * .08));
  opacity: calc(1 - var(--part) * .7);
}

.sf-sigil {
  opacity: .22;
  filter: grayscale(1) brightness(1.6);
}

.sf-chair--yours .sf-seat-glow {
  opacity: .5;
  transition: opacity .6s ease;
}

.is-claiming .sf-chair--yours .sf-seat-glow {
  opacity: 1;
}

/* A pin on the empty seat; it lifts when the reader reaches for the join button. */
.sf-seat-label {
  position: absolute;
  margin: 0;
  transform: translate3d(calc(-50% + var(--px) * -5px), calc(-100% - 14px + var(--py) * -3px + var(--part) * 14vh), 0);
  opacity: calc(1 - var(--part) * 2);
}

.sf-seat-label span {
  display: block;
  padding: 6px 10px 6px;
  border: 1px solid rgba(229, 84, 93, .5);
  border-radius: 999px;
  color: var(--crimson-text);
  background: rgba(7, 8, 11, .72);
  font: 500 .62rem/1 var(--font-mono);
  letter-spacing: .16em;
  text-transform: uppercase;
  white-space: nowrap;
  transition: transform .5s var(--ease-out), border-color .3s ease, color .3s ease;
}

.sf-seat-label::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 100%;
  width: 1px;
  height: 12px;
  background: rgba(229, 84, 93, .6);
}

.is-claiming .sf-seat-label span {
  border-color: var(--crimson-text);
  color: var(--bone);
  background: var(--crimson);
  transform: translateY(-6px);
}

/* ---- Fog ---- */
.sf-fog {
  position: absolute;
  left: 0;
  width: 200%;
  background: url('./assets/fog-bank.webp') repeat-x 0 50% / 50% 100%;
  mix-blend-mode: screen;
  animation: sf-drift 120s linear infinite;
}

.sf-fog--horizon {
  top: calc(var(--vy) - 9vh);
  height: 24vh;
  opacity: .34;
}

.sf-fog--mid {
  top: calc(var(--vy) + 4vh);
  height: 34vh;
  opacity: .32;
  animation-duration: 80s;
  animation-direction: reverse;
}

/* The near bank comes in two halves that part as the reader scrolls down into it. */
.sf-fog--near {
  bottom: -8vh;
  width: 120%;
  height: 46vh;
  opacity: calc(.55 - var(--part) * .25);
  background-size: 120% 100%;
  animation: none;
}

.sf-fog--left {
  left: -40%;
  transform: translate3d(calc(var(--part) * -55% + var(--px) * 18px), 0, 0);
  -webkit-mask-image: linear-gradient(90deg, #000 55%, transparent 92%);
  mask-image: linear-gradient(90deg, #000 55%, transparent 92%);
}

.sf-fog--right {
  left: 20%;
  background-position: 60% 50%;
  transform: translate3d(calc(var(--part) * 55% + var(--px) * 18px), 0, 0) scaleX(-1);
  -webkit-mask-image: linear-gradient(90deg, #000 55%, transparent 92%);
  mask-image: linear-gradient(90deg, #000 55%, transparent 92%);
}

@keyframes sf-drift {
  to { transform: translate3d(-50%, 0, 0); }
}

/* Darkens behind the copy and fades the bottom into the next chapter. */
.sf-scrim {
  background:
      radial-gradient(ellipse 46% 30% at 50% 78%, rgba(7, 8, 11, .62), transparent 75%),
      linear-gradient(180deg, rgba(7, 8, 11, .55) 0%, transparent 24%, transparent 72%, var(--fog-0) 100%);
}

/* ---- Copy ---- */
.sf-head,
.sf-body {
  position: relative;
  width: min(100%, 860px);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sf-head {
  transform: translate3d(0, calc(var(--part) * -8vh), 0);
}

.sf-head > *,
.sf-body > * {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity .9s ease, transform .9s var(--ease-out);
}

.is-ready .sf-head > *,
.is-ready .sf-body > * {
  opacity: 1;
  transform: none;
}

.is-ready .sf-title { transition-delay: .1s; }
.is-ready .sf-body > :nth-child(1) { transition-delay: .35s; }
.is-ready .sf-body > :nth-child(2) { transition-delay: .45s; }
.is-ready .sf-body > :nth-child(3) { transition-delay: .55s; }
.is-ready .sf-body > :nth-child(4) { transition-delay: .65s; }

.sf-title {
  display: grid;
  margin: 18px 0 0;
  color: var(--bone);
  font: 800 clamp(3.4rem, 7.4vw, 7.4rem)/.86 var(--font-display);
  letter-spacing: .01em;
  text-transform: uppercase;
  text-shadow: 0 2px 40px rgba(7, 8, 11, .9);
}

.sf-title__accent {
  color: var(--crimson-text);
}

.sf-summary {
  max-width: 46ch;
  margin: 0;
  color: var(--bone);
  font-size: clamp(1rem, 1.2vw, 1.12rem);
  line-height: 1.6;
  text-shadow: 0 1px 18px rgba(7, 8, 11, .95);
}

.sf-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 26px;
}

.sf-actions .fog-button--ghost {
  background: rgba(7, 8, 11, .45);
}

/* ---- Address ---- */
.sf-address {
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
  padding: 6px 6px 6px 16px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(13, 15, 20, .72);
  transition: border-color .2s ease;
}

.sf-address.is-copied { border-color: rgba(76, 195, 138, .6); }
.sf-address.is-failed { border-color: var(--crimson-text); }

.sf-address__dot {
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 50%;
  background: var(--ash-dim);
}

.sf-address__dot.is-online {
  background: var(--live);
  box-shadow: 0 0 0 4px rgba(76, 195, 138, .16);
}

.sf-address__dot.is-offline { background: var(--crimson-text); }

.sf-address__label {
  color: var(--ash);
  font: 500 .72rem/1 var(--font-mono);
  letter-spacing: .12em;
  text-transform: uppercase;
}

.is-copied .sf-address__label { color: var(--live); }
.is-failed .sf-address__label { color: var(--crimson-text); }

.sf-address__value {
  color: var(--bone);
  font: 500 .92rem/1 var(--font-mono);
  user-select: all;
}

.sf-address__copy {
  width: 44px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 999px;
  color: var(--bone);
  background: var(--fog-3);
  cursor: pointer;
  transition: background-color .2s ease;
}

.sf-address__copy:hover { background: #2a2f3a; }
.sf-address__copy:active { background: var(--crimson-deep); }

.sf-address__copy svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.sf-census {
  margin: 16px 0 0;
  color: var(--ash);
  font: 500 .7rem/1.4 var(--font-mono);
  letter-spacing: .14em;
  text-transform: uppercase;
}

.sefirah :focus-visible {
  outline: 2px solid var(--crimson-text);
  outline-offset: 3px;
}

@media (max-width: 720px) {
  .sefirah {
    gap: 24px;
  }

  /* No room for the pin between the copy and the table; the crimson seat speaks for itself. */
  .sf-seat-label {
    display: none;
  }

  .sf-fog--horizon {
    height: 16vh;
    top: calc(var(--vy) - 6vh);
  }

  .sf-scrim {
    background:
        radial-gradient(ellipse 80% 34% at 50% 76%, rgba(7, 8, 11, .7), transparent 78%),
        linear-gradient(180deg, rgba(7, 8, 11, .55) 0%, transparent 22%, transparent 76%, var(--fog-0) 100%);
  }
}

@media (max-width: 560px) {
  .sf-actions {
    width: 100%;
  }

  .sf-actions .fog-button {
    flex: 1 1 100%;
  }

  .sf-address__label {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sf-fog { animation: none; }
  .sf-head > *,
  .sf-body > * {
    opacity: 1;
    transform: none;
    transition: none;
  }
  .sf-seat-label span { transition: none; }
}
</style>
