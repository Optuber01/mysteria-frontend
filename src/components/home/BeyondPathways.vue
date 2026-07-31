<template>
  <section
    id="world"
    ref="section"
    class="world-journey"
    :class="[`world-stage-${activeIndex}`, { 'show-live': activeIndex === 6, 'show-gate': activeIndex === 7 }]"
    :style="{ '--world-progress': String(progress), '--world-local': String(localProgress) }"
    aria-labelledby="world-title"
  >
    <div class="world-sticky">
      <h2 id="world-title" class="sr-only">Use your power in Mysterria's living world</h2>

      <div class="panorama" aria-hidden="true">
        <div class="sky-plane" />
        <div class="panorama-layer panorama-layer--back">
          <img src="@/assets/images/optimized/Server.webp" alt="" width="1920" height="1080" loading="lazy">
          <img src="@/assets/images/optimized/Server.webp" alt="" width="1920" height="1080" loading="lazy">
          <img src="@/assets/images/optimized/Server.webp" alt="" width="1920" height="1080" loading="lazy">
        </div>
        <div class="fog-plane fog-plane--one" />
        <div class="voxel-ridge voxel-ridge--back" />
        <div class="voxel-ridge voxel-ridge--front" />
        <svg class="world-route" viewBox="0 0 2400 700">
          <path d="M80 492c201-82 299 29 476-80s324 18 498-76 297-19 442-101 327 25 455-82 319-33 472-87" />
          <path d="M80 510c202-83 304 33 486-79s327 17 500-76 291-13 438-97 326 30 460-82 306-23 460-76" />
        </svg>
        <div class="guide-light" />
      </div>

      <div class="world-markers" aria-label="World systems">
        <button
          v-for="(feature, index) in features"
          :key="feature.title"
          type="button"
          :class="{ active: activeIndex === index }"
          :style="{ left: `${feature.x}%`, top: `${feature.y}%` }"
          :aria-label="`${feature.title}: ${feature.copy}`"
          :aria-pressed="activeIndex === index"
          @click="goToStage(index)"
        >
          <i>{{ String(index + 1).padStart(2, '0') }}</i>
          <span>{{ feature.short }}</span>
        </button>
      </div>

      <header class="world-heading">
        <span>Use power</span>
        <strong>The Pathway opens into a world.</strong>
      </header>

      <Transition name="world-copy" mode="out-in">
        <article
          v-if="activeIndex < 6"
          :key="activeFeature.title"
          class="world-copy"
          :class="`world-copy--${activeFeature.position}`"
        >
          <span>{{ activeFeature.kicker }}</span>
          <h3>{{ activeFeature.title }}</h3>
          <p>{{ activeFeature.copy }}</p>
        </article>
      </Transition>

      <aside class="living-hud" aria-label="Live server information">
        <div class="hud-heading">
          <span>World is live</span>
          <i :class="`state-${status.state}`" />
        </div>
        <div class="player-reading">
          <strong v-if="status.state === 'online' && status.playersOnline !== null">{{ status.playersOnline }}</strong>
          <strong v-else>—</strong>
          <span>players online</span>
        </div>
        <div class="hud-stream">
          <div>
            <span>Server</span>
            <strong>{{ serverStateText }}</strong>
          </div>
          <div v-if="latestUpdate">
            <span>Latest update</span>
            <RouterLink :to="`/news/${latestUpdate.slug}`">{{ latestUpdate.title }} ↗</RouterLink>
          </div>
        </div>
        <p v-if="worldFeedUnavailable" class="telemetry-state">
          Town, event and discovery telemetry is reconnecting.
        </p>
        <div v-else class="telemetry-line">
          <span v-if="living.towns !== null">{{ living.towns }} towns</span>
          <span v-if="living.organizations !== null">{{ living.organizations }} organizations</span>
          <span v-if="living.currentEvent">{{ living.currentEvent }}</span>
          <span v-if="living.recentDiscovery">{{ living.recentDiscovery }}</span>
        </div>
      </aside>

      <div class="world-gate" aria-hidden="true">
        <i class="gate-halo" />
        <i class="gate-ring gate-ring--one" />
        <i class="gate-ring gate-ring--two" />
        <b />
        <span>THE WAY IN</span>
      </div>

      <nav class="world-stops" aria-label="World journey stops">
        <button
          v-for="(stop, index) in stops"
          :key="stop"
          type="button"
          :class="{ active: activeIndex === index, complete: activeIndex > index }"
          :aria-label="`World stop ${index + 1}: ${stop}`"
          :aria-current="activeIndex === index ? 'step' : undefined"
          :aria-pressed="activeIndex === index"
          @click="goToStage(index)"
        >
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ stop }}</strong>
        </button>
      </nav>
    </div>

    <div class="static-world">
      <article v-for="feature in features" :key="feature.title">
        <span>{{ feature.kicker }}</span><strong>{{ feature.title }}</strong><p>{{ feature.copy }}</p>
      </article>
      <article><span>Live data</span><strong>{{ serverStateText }}</strong><p>{{ worldFeedUnavailable ? 'World telemetry is reconnecting.' : 'World telemetry connected.' }}</p></article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useReducedMotion } from '@/composables/useReducedMotion';
import {
  getLivingWorldSnapshot,
  type LivingWorldSnapshot,
  type ServerStatus,
} from '@/services/serverStatus';

const props = defineProps<{
  status: ServerStatus;
  latestUpdate: { title: string; slug: string } | null;
}>();

const features = [
  { title: 'Custom dungeons', short: 'Dungeons', kicker: 'Original challenges', copy: 'Explore original dungeon spaces created for Mysterria.', x: 9, y: 62, position: 'left' },
  { title: 'Original creatures', short: 'Creatures', kicker: 'New encounters', copy: 'Encounter original creatures alongside Minecraft’s familiar world.', x: 23, y: 35, position: 'right-high' },
  { title: 'Unique locations', short: 'Locations', kicker: 'Places to discover', copy: 'Discover locations unique to Mysterria.', x: 38, y: 59, position: 'left-low' },
  { title: 'World events', short: 'Events', kicker: 'Shared moments', copy: 'World events bring players into shared activity.', x: 54, y: 30, position: 'center' },
  { title: 'Player economy', short: 'Economy', kicker: 'Trade and exchange', copy: 'Trade through a player economy.', x: 70, y: 57, position: 'right' },
  { title: 'Housing and towns', short: 'Towns', kicker: 'A lasting place', copy: 'Build homes and towns with other players.', x: 84, y: 34, position: 'left' },
];
const stops = [...features.map((feature) => feature.short), 'Live', 'Enter'];
const section = ref<HTMLElement | null>(null);
const progress = ref(0);
const activeIndex = ref(0);
const localProgress = ref(0);
const reducedMotion = useReducedMotion();
const living = ref<LivingWorldSnapshot>({ towns: null, organizations: null, currentEvent: null, recentDiscovery: null });
let observer: IntersectionObserver | null = null;
let visible = false;
let frame = 0;

const activeFeature = computed(() => features[Math.min(activeIndex.value, features.length - 1)]);
const worldFeedUnavailable = computed(() =>
  living.value.towns === null &&
  living.value.organizations === null &&
  living.value.currentEvent === null &&
  living.value.recentDiscovery === null,
);
const serverStateText = computed(() => {
  if (props.status.state === 'online') return 'Online';
  if (props.status.state === 'offline') return 'Offline';
  if (props.status.state === 'loading') return 'Checking…';
  return 'Status unavailable';
});

function update() {
  if (!visible || !section.value || reducedMotion.value || frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const rect = section.value?.getBoundingClientRect();
    if (!rect) return;
    const next = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - innerHeight)));
    const scaled = Math.min(stops.length - .0001, next * stops.length);
    progress.value = next;
    activeIndex.value = Math.floor(scaled);
    localProgress.value = scaled - Math.floor(scaled);
  });
}

function goToStage(index: number) {
  if (!section.value) return;
  activeIndex.value = index;
  localProgress.value = .25;
  progress.value = (index + .25) / stops.length;
  if (reducedMotion.value) return;
  const range = section.value.offsetHeight - innerHeight;
  const sectionTop = section.value.getBoundingClientRect().top + window.scrollY;
  document.documentElement.scrollTop = sectionTop + range * progress.value;
}

onMounted(async () => {
  observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) update();
  });
  if (section.value) observer.observe(section.value);
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update, { passive: true });
  try {
    living.value = await getLivingWorldSnapshot();
  } catch {
    // The consolidated reconnecting state remains visible.
  }
});

onUnmounted(() => {
  observer?.disconnect();
  removeEventListener('scroll', update);
  removeEventListener('resize', update);
  if (frame) cancelAnimationFrame(frame);
});
</script>

<style scoped>
.world-journey {
  --world-progress: 0;
  position: relative;
  min-height: 660svh;
  color: #fcf9f2;
  background: #08191b;
}
.world-journey::before,
.world-journey::after {
  content: "";
  position: absolute;
  z-index: 4;
  left: 0;
  right: 0;
  height: 210px;
  pointer-events: none;
}
.world-journey::before { top: 0; background: linear-gradient(180deg, #0d2525, transparent); }
.world-journey::after { bottom: 0; background: radial-gradient(ellipse at 50% 100%, rgba(224, 189, 113, .2), transparent 48%); }
.world-sticky {
  position: sticky;
  top: 0;
  height: 100svh;
  min-height: 680px;
  overflow: hidden;
  isolation: isolate;
  background: #0a1f22;
}
.sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); }
.panorama {
  position: absolute;
  z-index: -2;
  inset: 0;
  overflow: hidden;
  background: #0b2527;
}
.sky-plane { position: absolute; inset: 0; background: linear-gradient(180deg, #08151a, #153d39 56%, #102724); }
.panorama-layer {
  position: absolute;
  left: 0;
  top: 0;
  width: 300%;
  height: 100%;
  transform: translate3d(calc(var(--world-progress) * -66%), 0, 0) scale(1.04);
  will-change: transform;
}
.panorama-layer img {
  position: absolute;
  top: 0;
  width: 38%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  filter: saturate(.62) contrast(1.08);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 14% 86%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 14% 86%, transparent);
}
.panorama-layer img:first-child { left: 0; object-position: 28% center; -webkit-mask-image: linear-gradient(90deg, #000 0 86%, transparent); mask-image: linear-gradient(90deg, #000 0 86%, transparent); }
.panorama-layer img:nth-child(2) { left: 31%; object-position: 60% center; transform: scaleX(-1); opacity: .8; }
.panorama-layer img:last-child { left: 62%; object-position: 34% center; opacity: .88; -webkit-mask-image: linear-gradient(90deg, transparent, #000 14% 100%); mask-image: linear-gradient(90deg, transparent, #000 14% 100%); }
.panorama-layer::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(0deg, rgba(8, 21, 26, .94), transparent 45%),
    linear-gradient(90deg, rgba(8, 21, 26, .68), transparent 15% 86%, rgba(8, 21, 26, .68));
}
.fog-plane {
  position: absolute;
  z-index: 2;
  left: -20%;
  bottom: 5%;
  width: 150%;
  height: 34%;
  opacity: .42;
  background: linear-gradient(90deg, transparent, rgba(184, 209, 195, .16), transparent 60%);
  filter: blur(28px);
  transform: translate3d(calc(var(--world-progress) * 36%), 0, 0);
}
.voxel-ridge {
  position: absolute;
  z-index: 3;
  bottom: -6%;
  width: 220%;
  height: 34%;
  opacity: .84;
  background:
    linear-gradient(90deg, transparent 8%, #071719 8% 13%, transparent 13% 18%, #09201f 18% 26%, transparent 26% 31%, #071719 31% 42%, transparent 42%);
  background-size: 280px 100%;
  clip-path: polygon(0 58%, 5% 58%, 5% 34%, 10% 34%, 10% 64%, 16% 64%, 16% 42%, 22% 42%, 22% 70%, 28% 70%, 28% 26%, 35% 26%, 35% 59%, 41% 59%, 41% 39%, 49% 39%, 49% 68%, 56% 68%, 56% 23%, 63% 23%, 63% 57%, 71% 57%, 71% 35%, 78% 35%, 78% 67%, 84% 67%, 84% 45%, 91% 45%, 91% 61%, 100% 61%, 100% 100%, 0 100%);
  transform: translate3d(calc(var(--world-progress) * -48%), 0, 0);
}
.voxel-ridge--back { z-index: 1; bottom: 8%; opacity: .38; transform: translate3d(calc(var(--world-progress) * -29%), 0, 0) scale(.82); }
.world-route {
  position: absolute;
  z-index: 4;
  left: 0;
  bottom: 0;
  width: 240%;
  height: 100%;
  overflow: visible;
  transform: translate3d(calc(var(--world-progress) * -58%), 0, 0);
}
.world-route path { fill: none; stroke: rgba(224, 189, 113, .52); stroke-width: 2; stroke-dasharray: 6 13; vector-effect: non-scaling-stroke; }
.world-route path + path { stroke: rgba(245, 240, 230, .15); stroke-dasharray: 2 11; }
.guide-light {
  position: absolute;
  z-index: 5;
  left: calc(11% + var(--world-progress) * 79%);
  top: calc(53% - var(--world-progress) * 12%);
  width: 34px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #e0bd71;
  box-shadow: 0 0 18px #e0bd71, 0 0 70px rgba(73, 150, 113, .76);
  transform: translate(-50%, -50%) scale(calc(.68 + var(--world-progress) * .65));
}

.world-markers {
  position: absolute;
  z-index: 6;
  left: 0;
  top: 0;
  width: 240%;
  height: 100%;
  transform: translate3d(calc(var(--world-progress) * -58%), 0, 0);
}
.world-markers button {
  position: absolute;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px;
  border: 0;
  color: #fcf9f2;
  background: transparent;
  cursor: pointer;
  transform: translate(-50%, -50%);
}
.world-markers i {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  flex: none;
  border: 1px solid rgba(252, 249, 242, .58);
  border-radius: 50%;
  background: rgba(8, 21, 26, .7);
  font: 700 8px/1 "IBM Plex Mono", monospace;
  font-style: normal;
  transition: transform .3s cubic-bezier(.22, 1, .36, 1), background-color .25s, color .25s;
}
.world-markers span { padding: 7px 9px; border-radius: 6px; background: rgba(8, 21, 26, .72); font: 600 8px/1 "IBM Plex Mono", monospace; white-space: nowrap; opacity: 0; transition: opacity .2s, transform .25s cubic-bezier(.22, 1, .36, 1); transform: translateX(-5px); }
.world-markers button:hover span,
.world-markers button:focus-visible span,
.world-markers button.active span { opacity: 1; transform: none; }
.world-markers button.active i { color: #102924; background: #e0bd71; transform: scale(1.22); }

.world-heading {
  position: absolute;
  z-index: 8;
  left: clamp(22px, 5vw, 76px);
  top: clamp(82px, 10vh, 112px);
  display: grid;
  gap: 8px;
  transition: opacity .25s;
}
.world-heading span { color: #e0bd71; font: 600 9px/1 "IBM Plex Mono", monospace; letter-spacing: .16em; text-transform: uppercase; }
.world-heading strong { font: 650 clamp(1.7rem, 3vw, 3rem)/.9 "IBM Plex Sans Condensed", sans-serif; }
.show-live .world-heading,
.show-gate .world-heading { opacity: 0; }
.world-copy {
  position: absolute;
  z-index: 8;
  width: min(420px, 35vw);
  padding: 24px 0;
  text-shadow: 0 2px 20px rgba(0, 0, 0, .48);
}
.world-copy::before { content: ""; position: absolute; z-index: -1; inset: -28px -40px; background: radial-gradient(ellipse at center, rgba(8, 21, 26, .78), transparent 72%); }
.world-copy > span { color: #e0bd71; font: 600 9px/1 "IBM Plex Mono", monospace; letter-spacing: .14em; text-transform: uppercase; }
.world-copy h3 { margin: 13px 0 10px; font: 650 clamp(2.6rem, 5vw, 5.4rem)/.84 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.045em; }
.world-copy p { max-width: 370px; margin: 0; color: rgba(252, 249, 242, .7); font-size: .9rem; line-height: 1.6; }
.world-copy--left { left: 7vw; top: 45%; transform: translateY(-50%); }
.world-copy--right-high { right: 8vw; top: 22%; }
.world-copy--left-low { left: 8vw; bottom: 15%; }
.world-copy--center { left: 50%; top: 18%; transform: translateX(-50%); text-align: center; }
.world-copy--right { right: 8vw; top: 47%; transform: translateY(-50%); }
.world-copy-enter-active,
.world-copy-leave-active { transition: opacity .22s, transform .3s cubic-bezier(.22, 1, .36, 1); }
.world-copy-enter-from { opacity: 0; translate: 0 14px; }
.world-copy-leave-to { opacity: 0; translate: 0 -10px; }

.living-hud {
  position: absolute;
  z-index: 10;
  left: 50%;
  top: 50%;
  width: min(860px, calc(100% - 44px));
  display: grid;
  grid-template-columns: .7fr 1.3fr;
  gap: 26px 48px;
  padding: 34px 0;
  border-top: 1px solid rgba(252, 249, 242, .22);
  border-bottom: 1px solid rgba(252, 249, 242, .22);
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, calc(-50% + 28px));
  transition: opacity .3s, transform .45s cubic-bezier(.22, 1, .36, 1);
  text-shadow: 0 2px 20px rgba(0, 0, 0, .7);
}
.show-live .living-hud { opacity: 1; pointer-events: auto; transform: translate(-50%, -50%); }
.hud-heading { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; color: #e0bd71; font: 600 9px/1 "IBM Plex Mono", monospace; letter-spacing: .16em; text-transform: uppercase; }
.hud-heading i { width: 9px; height: 9px; border-radius: 50%; background: #71817e; }
.hud-heading i.state-online { background: #71c59f; box-shadow: 0 0 14px rgba(113, 197, 159, .6); }
.hud-heading i.state-offline { background: #ce8065; }
.player-reading strong { display: block; color: #e0bd71; font: 650 clamp(5rem, 11vw, 9rem)/.75 "IBM Plex Sans Condensed", sans-serif; }
.player-reading span { color: rgba(252, 249, 242, .55); font: 500 9px/1 "IBM Plex Mono", monospace; text-transform: uppercase; }
.hud-stream { display: grid; align-content: center; }
.hud-stream > div { display: grid; grid-template-columns: 120px 1fr; gap: 12px; padding: 14px 0; border-bottom: 1px solid rgba(252, 249, 242, .12); }
.hud-stream span { color: rgba(252, 249, 242, .44); font: 500 8px/1.4 "IBM Plex Mono", monospace; text-transform: uppercase; }
.hud-stream strong,
.hud-stream a { color: #fcf9f2; font-size: .8rem; font-weight: 700; }
.telemetry-state,
.telemetry-line { grid-column: 1 / -1; margin: 0; color: rgba(252, 249, 242, .5); font: 500 9px/1.5 "IBM Plex Mono", monospace; }
.telemetry-line { display: flex; flex-wrap: wrap; gap: 16px; }

.world-gate {
  position: absolute;
  z-index: 10;
  left: 50%;
  top: 50%;
  width: min(44vw, 520px);
  aspect-ratio: .78;
  opacity: 0;
  transform: translate(-50%, -44%) scale(.58);
  transition: opacity .28s, transform .7s cubic-bezier(.22, 1, .36, 1);
  pointer-events: none;
}
.show-gate .world-gate { opacity: 1; transform: translate(-50%, -50%) scale(calc(.82 + var(--world-local) * .2)); }
.gate-halo,
.gate-ring,
.world-gate b { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
.gate-halo { width: 90%; height: 90%; border-radius: 50%; background: radial-gradient(ellipse, rgba(224, 189, 113, .48), rgba(33, 100, 77, .33) 32%, transparent 69%); filter: blur(12px); }
.gate-ring { border: 2px solid rgba(224, 189, 113, .72); border-radius: 50%; }
.gate-ring--one { width: 72%; height: 94%; transform: translate(-50%, -50%) rotate(calc(var(--world-local) * 25deg)); }
.gate-ring--two { width: 58%; height: 82%; border-style: dashed; transform: translate(-50%, -50%) rotate(calc(var(--world-local) * -48deg)); }
.world-gate b { width: 13%; aspect-ratio: 1; background: #e0bd71; box-shadow: 0 0 30px #e0bd71; transform: translate(-50%, -50%) rotate(45deg); }
.world-gate span { position: absolute; left: 50%; bottom: -4%; color: rgba(252, 249, 242, .68); font: 600 9px/1 "IBM Plex Mono", monospace; letter-spacing: .2em; transform: translateX(-50%); white-space: nowrap; }

.world-stops {
  position: absolute;
  z-index: 20;
  left: 50%;
  bottom: 17px;
  width: min(900px, calc(100% - 32px));
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  transform: translateX(-50%);
}
.world-stops button {
  min-width: 44px;
  min-height: 48px;
  display: grid;
  place-items: center;
  gap: 2px;
  padding: 5px 3px;
  border: 0;
  border-top: 2px solid rgba(252, 249, 242, .13);
  color: rgba(252, 249, 242, .38);
  background: rgba(8, 21, 26, .3);
  cursor: pointer;
}
.world-stops button.active { border-color: #e0bd71; color: #fcf9f2; }
.world-stops button.complete { color: rgba(157, 215, 182, .62); }
.world-stops span { font: 650 10px/1 "IBM Plex Mono", monospace; }
.world-stops strong { font-size: .66rem; }
.static-world { display: none; }

@media (max-width: 620px) {
  .world-journey { min-height: 610svh; }
  .world-sticky { min-height: 620px; }
  .panorama-layer { width: 420%; transform: translate3d(calc(var(--world-progress) * -76%), 0, 0); }
  .world-route,
  .world-markers { width: 350%; transform: translate3d(calc(var(--world-progress) * -72%), 0, 0); }
  .voxel-ridge { width: 320%; transform: translate3d(calc(var(--world-progress) * -69%), 0, 0); }
  .voxel-ridge--back { transform: translate3d(calc(var(--world-progress) * -46%), 0, 0) scale(.82); }
  .world-heading { left: 16px; top: 76px; }
  .world-heading strong { font-size: 1.7rem; }
  .world-markers span { display: none; }
  .world-copy,
  .world-copy--left,
  .world-copy--right-high,
  .world-copy--left-low,
  .world-copy--center,
  .world-copy--right {
    left: 18px;
    right: auto;
    top: auto;
    bottom: 82px;
    width: calc(100% - 36px);
    transform: none;
    text-align: left;
  }
  .world-copy h3 { font-size: clamp(2.8rem, 14vw, 4.3rem); }
  .living-hud { width: calc(100% - 32px); grid-template-columns: 1fr; gap: 20px; padding: 22px 0; }
  .hud-heading { grid-column: auto; }
  .player-reading strong { font-size: 5.3rem; }
  .hud-stream > div { grid-template-columns: 92px minmax(0, 1fr); }
  .telemetry-state,
  .telemetry-line { grid-column: auto; }
  .world-gate { width: min(82vw, 340px); }
  .world-stops strong { display: none; }
}

@media (max-width: 260px) {
  .world-journey { min-height: auto; padding: 70px 10px; background: #0a1f22; }
  .world-sticky { position: relative; height: 360px; min-height: 0; }
  .world-heading { top: 18px; left: 12px; }
  .world-copy,
  .world-markers,
  .world-stops,
  .living-hud { display: none; }
  .static-world { display: grid; }
  .static-world article { padding: 18px 0; border-bottom: 1px solid rgba(252, 249, 242, .11); }
  .static-world span { color: #e0bd71; font: 600 8px/1 "IBM Plex Mono", monospace; text-transform: uppercase; }
  .static-world strong { display: block; margin-top: 7px; font: 650 1.4rem/1 "IBM Plex Sans Condensed", sans-serif; }
  .static-world p { margin: 7px 0 0; color: rgba(252, 249, 242, .62); font-size: .72rem; line-height: 1.5; }
}

@media (prefers-reduced-motion: reduce) {
  .world-journey { min-height: auto; padding: 90px 20px; }
  .world-sticky { position: relative; height: 70svh; min-height: 520px; }
  .world-copy,
  .world-markers,
  .world-stops,
  .living-hud { display: none; }
  .static-world { width: min(1000px, 100%); display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 34px auto 0; }
  .static-world article { padding: 24px; border: 1px solid rgba(252, 249, 242, .11); }
  .static-world span { color: #e0bd71; font: 600 8px/1 "IBM Plex Mono", monospace; text-transform: uppercase; }
  .static-world strong { display: block; margin-top: 8px; font: 650 1.6rem/1 "IBM Plex Sans Condensed", sans-serif; }
  .static-world p { margin: 8px 0 0; color: rgba(252, 249, 242, .62); font-size: .78rem; line-height: 1.5; }
}
</style>
