<template>
  <section
    id="world"
    ref="section"
    class="world-story"
    :class="`world-story--${activeStage.id}`"
    :style="worldStyle"
    aria-labelledby="world-title"
  >
    <div class="world-sticky">
      <header class="world-heading">
        <p>Beyond the Pathways</p>
        <h2 id="world-title">Every route leaves a different mark on the world.</h2>
      </header>

      <div class="world-rail">
        <article
          v-for="(feature, index) in features"
          :key="feature.id"
          class="world-beat"
          :class="[`world-beat--${feature.id}`, { 'is-active': activeIndex === index }]"
          :data-side="index % 2 === 0 ? 'right' : 'left'"
          :style="beatStyle(feature.palette, index)"
          :aria-hidden="activeIndex !== index"
        >
          <figure class="world-media">
            <video
              v-if="feature.video && !reducedMotion"
              :src="visible && activeIndex === index ? feature.video : undefined"
              :poster="feature.image"
              :title="feature.alt"
              :autoplay="visible && activeIndex === index"
              muted
              loop
              playsinline
              preload="none"
            />
            <img
              v-else
              :src="feature.image"
              :alt="feature.alt"
              :width="feature.width"
              :height="feature.height"
              loading="lazy"
              decoding="async"
            >
            <div class="world-grade" />
            <div v-if="index < features.length - 1" class="next-chip" aria-hidden="true">
              <img :src="features[index + 1].image" alt="" loading="lazy" decoding="async">
              <span>{{ features[index + 1].short }}</span>
            </div>
          </figure>

          <div v-if="feature.gallery?.length" class="world-gallery" aria-hidden="true">
            <figure v-for="(shot, shotIndex) in feature.gallery" :key="shot.image" :class="`world-gallery__shot--${shotIndex + 1}`">
              <img :src="shot.image" :alt="shot.alt" loading="lazy" decoding="async">
            </figure>
          </div>

          <div class="world-copy">
            <span>Field note {{ String(index + 1).padStart(2, '0') }} / {{ String(features.length).padStart(2, '0') }}</span>
            <p>{{ feature.kicker }}</p>
            <h3>{{ feature.title }}</h3>
            <p class="world-caption">{{ feature.note }}</p>
            <p class="world-body">{{ feature.copy }}</p>
            <p class="world-proof">{{ feature.proof }}</p>
          </div>

          <div class="scene-marker" :class="[`scene-marker--${feature.pin}`, { 'is-dormant': !isHotspotLive(index) }]">
            <button
              type="button"
              :aria-expanded="selectedMarker === index"
              :aria-controls="`world-note-${feature.id}`"
              :tabindex="activeIndex === index ? 0 : -1"
              @click="toggleMarker(index)"
            >
              <i aria-hidden="true" />
              <span>{{ feature.marker }}</span>
            </button>
            <p
              :id="`world-note-${feature.id}`"
              :class="{ 'is-open': selectedMarker === index }"
              role="status"
            >
              {{ feature.note }}
            </p>
          </div>
        </article>

        <article
          class="world-beat world-beat--live"
          :class="{ 'is-active': activeIndex === features.length }"
          :style="beatStyle(liveStage.palette, features.length)"
          :aria-hidden="activeIndex !== features.length"
        >
          <div class="live-landscape" aria-hidden="true">
            <img :src="townsImage" alt="" width="1920" height="1009" loading="lazy" decoding="async">
            <i />
          </div>

          <div class="living-panel">
            <div class="living-intro">
              <span>Live from the server</span>
              <h3>Nothing here is a backdrop.</h3>
              <p>Server status and updates are shown only when a first-party source answers.</p>
            </div>

            <div class="living-primary">
              <div class="status-orb" :class="`status-orb--${status.state}`" aria-hidden="true" />
              <p>Server</p>
              <strong>{{ serverStateText }}</strong>
              <span v-if="status.checkedAt">Checked {{ checkedTime }}</span>
            </div>

            <div class="living-primary living-primary--players">
              <p>Players online</p>
              <strong v-if="status.state === 'online' && status.playersOnline !== null">
                {{ status.playersOnline }}
              </strong>
              <strong v-else aria-label="Unavailable">—</strong>
              <span>{{ playerStateText }}</span>
            </div>

            <dl class="living-feed">
              <div v-if="living.towns !== null">
                <dt>Active towns</dt>
                <dd>{{ living.towns }}</dd>
              </div>
              <div v-if="living.organizations !== null">
                <dt>Organizations</dt>
                <dd>{{ living.organizations }}</dd>
              </div>
              <div v-if="living.currentEvent !== null">
                <dt>Current world event</dt>
                <dd>{{ living.currentEvent }}</dd>
              </div>
              <div v-if="living.recentDiscovery !== null">
                <dt>Recent discovery</dt>
                <dd>{{ living.recentDiscovery }}</dd>
              </div>
              <div v-if="latestUpdate" class="living-feed__update">
                <dt>Latest update</dt>
                <dd>
                  <RouterLink :to="`/news/${latestUpdate.slug}`" :lang="storedLanguage === 'uk' ? 'uk' : undefined" :tabindex="activeIndex === features.length ? 0 : -1">{{ latestUpdate.title }} <span aria-hidden="true">↗</span></RouterLink>
                </dd>
              </div>
            </dl>

            <p v-if="worldFeedUnavailable" class="feed-disclosure">
              Live town, organization and event feeds are quiet right now — join the Discord for the latest happenings.
            </p>
          </div>
        </article>
      </div>

      <nav
        class="world-index"
        :class="{ 'is-faded': railOpacity <= 0.02 }"
        aria-label="Explore the world systems"
      >
        <button
          v-for="(stage, index) in stages"
          :key="stage.id"
          type="button"
          :class="{ 'is-active': activeIndex === index, 'is-past': activeIndex > index }"
          :aria-current="activeIndex === index ? 'step' : undefined"
          :aria-label="`Go to ${stage.short}`"
          @click="goToStage(index)"
        >
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ stage.short }}</strong>
        </button>
      </nav>

      <p class="world-direction" aria-hidden="true">
        <span>Scroll through the field notes</span><i />
      </p>
    </div>

    <div class="world-static" aria-label="World systems overview">
      <header>
        <p>Beyond the Pathways</p>
        <h2>Every route leaves a different mark on the world.</h2>
      </header>
      <article v-for="(feature, index) in features" :key="feature.id">
        <img
          :src="feature.image"
          :alt="feature.alt"
          :width="feature.width"
          :height="feature.height"
          loading="lazy"
          decoding="async"
        >
        <div>
          <span>{{ String(index + 1).padStart(2, '0') }} · {{ feature.kicker }}</span>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.copy }}</p>
        </div>
      </article>
      <article class="world-static__live">
        <div>
          <span>Live from the server</span>
          <h3>{{ serverStateText }}</h3>
          <p>{{ playerStateText }}</p>
          <dl class="world-static__feed">
            <div><dt>Active towns</dt><dd>{{ valueOrUnavailable(living.towns) }}</dd></div>
            <div><dt>Organizations</dt><dd>{{ valueOrUnavailable(living.organizations) }}</dd></div>
            <div><dt>Current world event</dt><dd>{{ valueOrUnavailable(living.currentEvent) }}</dd></div>
            <div><dt>Recent discovery</dt><dd>{{ valueOrUnavailable(living.recentDiscovery) }}</dd></div>
            <div>
              <dt>Latest update</dt>
              <dd><RouterLink v-if="latestUpdate" :to="`/news/${latestUpdate.slug}`" :lang="storedLanguage === 'uk' ? 'uk' : undefined">{{ latestUpdate.title }} ↗</RouterLink><span v-else>Unavailable</span></dd>
            </div>
          </dl>
          <p v-if="worldFeedUnavailable" class="feed-disclosure">No public towns, organization, event or discovery feed is connected.</p>
        </div>
      </article>
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
import creatureChamber from '@/assets/images/home/world/creature-chamber.webp';
import dungeonGate from '@/assets/images/community-archive/dungeons/twin-tree-rift/twin-tree-rift-wide.webp';
import dungeonEntranceVideo from '@/assets/images/community-archive/dungeons/twin-tree-rift/twin-tree-rift-entrance.mp4';
import eyeRift from '@/assets/images/community-archive/dungeons/eye-rift/eye-rift-front.webp';
import snowRingRift from '@/assets/images/community-archive/dungeons/snow-ring-rift/snow-ring-rift-clear-front.webp';
import guardianDragon from '@/assets/images/community-archive/events/guardians/guardian-dragon-encounter.webp';
import guardianRadiantWide from '@/assets/images/community-archive/events/guardians/guardian-radiant-encounter-wide.webp';
import guardianRadiantClose from '@/assets/images/community-archive/events/guardians/guardian-radiant-encounter-close.webp';
import cliffsideStreet from '@/assets/images/community-archive/towns/cliffside-harbor/cliffside-street.webp';
import townsImage from '@/assets/images/community-archive/towns/aurora-cliffside/aurora-waterfront.webp';
import eyeCanopy from '@/assets/images/community-archive/towns/eye-canopy/eye-canopy.webp';
import cathedralExterior from '@/assets/images/community-archive/churches/great-cathedral/cathedral-exterior.webp';
import fogCathedralNave from '@/assets/images/community-archive/churches/fog-cathedral/cathedral-nave.webp';
import sanctuaryCeiling from '@/assets/images/community-archive/churches/black-gold-sanctuary/sanctuary-ceiling.webp';

type Palette = { bg: string; accent: string; ink: string };
type WorldFeature = {
  id: string;
  short: string;
  kicker: string;
  title: string;
  copy: string;
  proof: string;
  marker: string;
  note: string;
  pin: 'high' | 'middle' | 'low';
  image: string;
  alt: string;
  width: number;
  height: number;
  video?: string;
  gallery?: Array<{ image: string; alt: string }>;
  palette: Palette;
};

const props = defineProps<{
  status: ServerStatus;
  latestUpdate: { title: string; slug: string } | null;
}>();

const storedLanguage = localStorage.getItem('mysterria-language');

const features: WorldFeature[] = [
  {
    id: 'dungeons', short: 'Rifts', kicker: '01 · Prepare the run', title: 'Rifts reward preparation.',
    copy: 'Use /subspace to find a dungeon, check its power and cooldown, then weaken its Rift with Energy Shards before your party enters.',
    proof: 'A dungeon is an instanced run with its own classes, rooms and boss—not just another overworld cave.',
    marker: 'Dungeon Rift', note: 'A Rift gate marks the threshold. Parties weaken it with Energy Shards before committing to the instance beyond.', pin: 'middle',
    image: dungeonGate, video: dungeonEntranceVideo, alt: 'A black-and-white tree Rift gate surrounding a glowing dungeon portal.', width: 1600, height: 868,
    gallery: [
      { image: eyeRift, alt: 'A vast eye-shaped dungeon gate opening around a glowing Rift.' },
      { image: snowRingRift, alt: 'A circular stone dungeon gate standing in a snowy biome.' },
    ],
    palette: { bg: '#dbe4e8', accent: '#725c86', ink: '#14272b' },
  },
  {
    id: 'creatures', short: 'The wilds', kicker: '02 · Read the encounter', title: 'The wild reacts to your Pathway.',
    copy: 'Beyonder Creatures give XP, acting points and ingredients. Wild Beyonders are different: pathway-based NPCs that may trade with you or fight you depending on your relationship.',
    proof: 'Crimson Moon nights raise the danger outside and turn fishing into a high-risk route to Beyonder rewards.',
    marker: 'Beyonder encounter', note: 'A Beyonder creature met in the wild: every encounter yields XP, acting points and ingredients worth the risk.', pin: 'high',
    image: creatureChamber, alt: 'A custom floating creature surrounded by fragments inside a dark Minecraft chamber.', width: 1075, height: 503,
    palette: { bg: '#0d1d21', accent: '#a691d2', ink: '#f7f0e5' },
  },
  {
    id: 'events', short: 'Guardians', kicker: '03 · Answer the signal', title: 'A Guardian changes the plan.',
    copy: 'Guardians are random open-world boss encounters. Find one, bring the right people, and adapt when the fight turns: physical damage stops working below 20% health.',
    proof: 'A successful group earns a Guardian-specific Reward Token for ingredients, recipes and other rare rewards.',
    marker: 'Open-world Guardian', note: 'A Guardian encountered in the open world. Cosmos Incursions are rarer kin that answer their own signal.', pin: 'middle',
    image: guardianDragon, alt: 'Players fighting a many-headed Guardian inside a radiant arena.', width: 1600, height: 868,
    gallery: [
      { image: guardianRadiantWide, alt: 'Players spread across a bright arena during a Guardian encounter.' },
      { image: guardianRadiantClose, alt: 'A party facing a towering radiant Guardian at close range.' },
    ],
    palette: { bg: '#1a242b', accent: '#81d9df', ink: '#f6f3ec' },
  },
  {
    id: 'towns', short: 'Settlements', kicker: '04 · Leave a mark', title: 'Build a place that has consequences.',
    copy: 'Towns protect claims and organise shared infrastructure. Build with others, stay solo, or form a Secret Order—each route gives you a different way to move through the server.',
    proof: 'As a town grows, it gains territory and can earn architectural perks. A level-five Domain can found a Nation.',
    marker: 'Player settlement', note: 'These are real community landmarks: a waterfront town, an everyday street, and a vast eye suspended above another settlement.', pin: 'low',
    image: townsImage, alt: 'A player-built waterfront settlement glowing beneath a green aurora.', width: 1600, height: 841,
    gallery: [
      { image: cliffsideStreet, alt: 'A bright street lined with player-built homes and a glass workshop.' },
      { image: eyeCanopy, alt: 'A giant purple eye-shaped canopy floating above a forest settlement.' },
    ],
    palette: { bg: '#241c1d', accent: '#efb96d', ink: '#fff6e8' },
  },
  {
    id: 'churches', short: 'Churches', kicker: '05 · Establish a presence', title: 'Faith needs a place to gather.',
    copy: 'Churches are player-run institutions built around a physical Church Core. Their sites, prayer, members and pathway relation make a visible organisation with real influence.',
    proof: 'A Church can develop branches, support members and grant benefits such as acting progress, Madness recovery and site-based prayer effects.',
    marker: 'Consecrated site', note: 'The architecture is player-made; the Church system gives the site membership, prayer and pathway consequences.', pin: 'middle',
    image: cathedralExterior, alt: 'A monumental player-built cathedral rising into a stormy sky.', width: 1600, height: 841,
    gallery: [
      { image: fogCathedralNave, alt: 'Warm lantern light filling the nave of a player-built church.' },
      { image: sanctuaryCeiling, alt: 'A black-and-gold sanctuary ceiling above a dark ceremonial hall.' },
    ],
    palette: { bg: '#14171c', accent: '#d1aa76', ink: '#f5f0e8' },
  },
];

const liveStage = {
  id: 'live',
  short: 'Live world',
  palette: { bg: '#0e2224', accent: '#d7b16d', ink: '#fcf9f2' },
};
const stages = [...features, liveStage];
const section = ref<HTMLElement | null>(null);
const progress = ref(0);
const activeIndex = ref(0);
const selectedMarker = ref<number | null>(null);
const living = ref<LivingWorldSnapshot>({ towns: null, organizations: null, currentEvent: null, recentDiscovery: null });
const reducedMotion = useReducedMotion();
let observer: IntersectionObserver | null = null;
let frame = 0;
const visible = ref(false);
const preloadedThumbs = new Set<string>();

const activeStage = computed(() => stages[activeIndex.value] ?? stages[0]);
const railOpacity = computed(() => {
  const fadeIn = Math.min(1, progress.value / 0.1);
  const fadeOut = Math.min(1, (1 - progress.value) / 0.08);
  return Math.max(0, Math.min(fadeIn, fadeOut));
});

function blendHex(from: string, to: string, amount: number) {
  const a = from.slice(1).match(/.{2}/g)?.map((value) => Number.parseInt(value, 16)) ?? [0, 0, 0];
  const b = to.slice(1).match(/.{2}/g)?.map((value) => Number.parseInt(value, 16)) ?? [0, 0, 0];
  return `#${a.map((value, index) => Math.round(value + (b[index] - value) * amount).toString(16).padStart(2, '0')).join('')}`;
}

function beatPhase(index: number) {
  const span = stages.length - 1;
  const scaled = Math.min(span, progress.value * span);
  const beatIndex = Math.floor(scaled);
  if (index === beatIndex) return scaled - beatIndex;
  if (index === beatIndex + 1) return scaled - beatIndex - 1;
  return 0;
}

function beatFade(index: number) {
  const phase = beatPhase(index);
  if (phase >= 0) return phase < 0.2 ? 1 - phase / 0.2 : 0;
  const entry = 1 + phase;
  return entry > 0.8 ? (entry - 0.8) / 0.2 : 0;
}

function mediaDim(index: number) {
  const phase = beatPhase(index);
  if (phase <= 0) return 0;
  return Math.min(1, Math.max(0, (phase - 0.15) / 0.35));
}

function mediaTravel(index: number) {
  const phase = beatPhase(index);
  if (phase >= 0) return -Math.min(phase / 0.8, 1);
  const entry = 1 + phase;
  return 0.75 * Math.max(0, Math.min(1, (0.8 - entry) / 0.8));
}

function mediaAlpha(index: number) {
  const phase = beatPhase(index);
  if (phase >= 0) return 1 - mediaDim(index) * 0.65;
  const entry = 1 + phase;
  return Math.max(0, Math.min(1, (entry - 0.6) / 0.2));
}

function beatStyle(palette: Palette, index: number) {
  return {
    '--beat-bg': palette.bg,
    '--beat-accent': palette.accent,
    '--beat-ink': palette.ink,
    '--beat-phase': beatPhase(index).toFixed(4),
    '--beat-fade': beatFade(index).toFixed(4),
    '--media-dim': mediaDim(index).toFixed(4),
    '--media-travel': mediaTravel(index).toFixed(4),
    '--media-alpha': mediaAlpha(index).toFixed(4),
  };
}

const worldStyle = computed(() => {
  const span = stages.length - 1;
  const scaled = Math.min(span, progress.value * span);
  const beatIndex = Math.floor(scaled);
  const mix = scaled - beatIndex;
  const current = stages[beatIndex] ?? stages[0];
  const next = stages[beatIndex + 1] ?? current;
  return {
    '--world-progress': String(progress.value),
    '--stage-count': String(stages.length),
    '--world-bg': blendHex(current.palette.bg, next.palette.bg, mix),
    '--world-accent': blendHex(current.palette.accent, next.palette.accent, mix),
    '--world-ink': blendHex(current.palette.ink, next.palette.ink, mix),
    '--rail-x': `${progress.value * span * -100}vw`,
    '--image-shift': `${progress.value * -4}%`,
    '--direction-width': `${progress.value * 100}%`,
    '--world-heading-opacity': String(Math.max(0, 1 - progress.value * 10)),
    '--rail-opacity': railOpacity.value.toFixed(4),
  };
});
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
const playerStateText = computed(() => {
  if (props.status.state === 'online' && props.status.playersOnline !== null) {
    return `${props.status.playersOnline} currently connected`;
  }
  if (props.status.state === 'loading') return 'Player count is loading.';
  return 'Player count unavailable.';
});
const checkedTime = computed(() => props.status.checkedAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) ?? '');

function valueOrUnavailable(value: string | number | null) {
  return value ?? 'Unavailable';
}

function update() {
  if (!visible.value || !section.value || reducedMotion.value || frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const rect = section.value?.getBoundingClientRect();
    if (!rect) return;
    const span = stages.length - 1;
    const next = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - innerHeight)));
    const scaled = Math.min(span, next * span);
    progress.value = next;
    activeIndex.value = Math.min(span, Math.floor(scaled + 0.5));
    if (selectedMarker.value !== null && selectedMarker.value !== activeIndex.value) selectedMarker.value = null;
    const settled = Math.floor(scaled);
    if (scaled - settled >= 0.6) {
      const upcoming = stages[settled + 1] as { image?: string } | undefined;
      if (upcoming?.image && !preloadedThumbs.has(upcoming.image)) {
        preloadedThumbs.add(upcoming.image);
        new Image().src = upcoming.image;
      }
    }
  });
}

function goToStage(index: number) {
  if (!section.value) return;
  activeIndex.value = index;
  const next = index / (stages.length - 1);
  progress.value = next;
  if (reducedMotion.value) return;
  const sectionTop = section.value.getBoundingClientRect().top + window.scrollY;
  const scrollRange = section.value.offsetHeight - innerHeight;
  window.scrollTo({ top: sectionTop + scrollRange * next, behavior: 'smooth' });
}

function toggleMarker(index: number) {
  selectedMarker.value = selectedMarker.value === index ? null : index;
}

function isHotspotLive(index: number) {
  const scaled = Math.min(stages.length - 1, progress.value * (stages.length - 1));
  return Math.floor(scaled + 0.5) === index;
}

onMounted(async () => {
  observer = new IntersectionObserver(([entry]) => {
    visible.value = entry.isIntersecting;
    if (visible.value) update();
  }, { rootMargin: '10% 0px' });
  if (section.value) observer.observe(section.value);
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update, { passive: true });
  try {
    living.value = await getLivingWorldSnapshot();
  } catch {
    living.value = { towns: null, organizations: null, currentEvent: null, recentDiscovery: null };
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
.world-story {
  --world-progress: 0;
  position: relative;
  z-index: 2;
  min-height: 590svh;
  isolation: isolate;
  color: var(--world-ink);
  background: var(--world-bg);
  transition: background-color 1.05s cubic-bezier(.22, 1, .36, 1), color .7s ease;
}

.world-sticky {
  position: sticky;
  top: 0;
  height: 100svh;
  min-height: 650px;
  overflow: hidden;
  overflow: clip;
  isolation: isolate;
  background: var(--world-bg);
  transition: background-color 1.05s cubic-bezier(.22, 1, .36, 1);
}

.world-sticky::before,
.world-sticky::after {
  content: "";
  position: absolute;
  z-index: 7;
  left: 0;
  right: 0;
  pointer-events: none;
}

.world-sticky::before {
  top: 0;
  height: 28%;
  background: linear-gradient(180deg, color-mix(in srgb, var(--world-bg) 92%, transparent), transparent);
}

.world-sticky::after {
  bottom: 0;
  height: 26%;
  background: linear-gradient(0deg, color-mix(in srgb, var(--world-bg) 92%, transparent), transparent);
}

.world-heading {
  position: absolute;
  z-index: 10;
  top: clamp(74px, 9vh, 104px);
  left: clamp(22px, 4.8vw, 78px);
  width: min(610px, 48vw);
  opacity: var(--world-heading-opacity);
  pointer-events: none;
  transition: opacity .25s ease;
}

.world-heading p,
.world-copy > span,
.world-copy > p:first-of-type,
.living-intro > span,
.world-static header p,
.world-static article span {
  margin: 0;
  color: var(--world-accent);
  font: 650 .67rem/1 "IBM Plex Mono", monospace;
  letter-spacing: .15em;
  text-transform: uppercase;
}

.world-heading h2 {
  max-width: 560px;
  margin: 12px 0 0;
  font: 650 clamp(2rem, 4vw, 4.4rem)/.9 "IBM Plex Sans Condensed", sans-serif;
  letter-spacing: -.045em;
}

.world-rail {
  position: absolute;
  z-index: 1;
  inset: 0 auto 0 0;
  width: calc(var(--stage-count) * 100vw);
  display: flex;
  transform: translate3d(var(--rail-x), 0, 0);
  will-change: transform;
}

.world-beat {
  --beat-bg: #0e2224;
  --beat-accent: #c69b52;
  --beat-ink: #fcf9f2;
  --text-anchor: clamp(24px, 7vw, 112px);
  --text-width: min(430px, 34vw);
  --media-gap: clamp(28px, 3.4vw, 64px);
  --media-margin: clamp(24px, 4vw, 72px);
  --media-top: clamp(94px, 12vh, 132px);
  --media-bottom: clamp(76px, 9vh, 112px);
  --h-reserved: calc(var(--text-anchor) + var(--text-width) + var(--media-gap) + var(--media-margin));
  --media-max-h: calc((100vw - var(--h-reserved)) * .8);
  --polaroid-drift: -26px;
  --grade-heavy: right;
  position: relative;
  width: 100vw;
  height: 100%;
  flex: none;
  overflow: hidden;
  color: var(--beat-ink);
  background: var(--beat-bg);
}

.world-beat[data-side='left'] {
  --grade-heavy: left;
}

.world-media {
  position: absolute;
  z-index: 2;
  top: 50%;
  height: min(calc(100% - var(--media-top) - var(--media-bottom)), 720px, var(--media-max-h));
  aspect-ratio: 5 / 4;
  margin: 0;
  overflow: hidden;
  border-radius: 38px;
  box-shadow: 0 42px 100px rgba(0, 0, 0, .28);
  clip-path: inset(0 round 38px);
  transform: translate3d(calc(var(--media-travel, 0) * 110vw), -50%, 0);
  filter: saturate(calc(1 - var(--media-dim, 0) * .3)) brightness(calc(1 - var(--media-dim, 0) * .18));
  opacity: var(--media-alpha, 1);
}

.world-beat[data-side='right'] .world-media {
  left: calc(var(--text-anchor) + var(--text-width) + var(--media-gap));
}

.world-beat[data-side='left'] .world-media {
  right: calc(var(--text-anchor) + var(--text-width) + var(--media-gap));
}

.world-media::after {
  content: "";
  position: absolute;
  inset: 0;
  border: 1px solid color-mix(in srgb, var(--beat-ink) 24%, transparent);
  border-radius: inherit;
  pointer-events: none;
}

.world-media img,
.world-media video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.055) translate3d(var(--image-shift), 0, 0);
  transition: transform .8s cubic-bezier(.22, 1, .36, 1);
  transform-origin: center;
  filter: saturate(.9) contrast(1.03) brightness(.95);
}

.world-beat--dungeons .world-media {
  border-radius: 48% 48% 34px 34px / 17% 17% 34px 34px;
  clip-path: inset(0 round 48% 48% 34px 34px / 17% 17% 34px 34px);
}
.world-beat--dungeons .world-media img,
.world-beat--dungeons .world-media video { object-position: 52% 52%; }

.world-beat--creatures .world-media {
  border-radius: 48% 44% 42% 46% / 17% 19% 15% 17%;
  clip-path: inset(0 round 48% 44% 42% 46% / 17% 19% 15% 17%);
}
.world-beat--creatures .world-media img { object-position: center; transform: scale(1.14) translate3d(var(--image-shift), 0, 0); }

.world-beat--events .world-media {
  border-radius: 52% 48% 44% 56% / 22% 18% 24% 20%;
  clip-path: inset(0 round 52% 48% 44% 56% / 22% 18% 24% 20%);
}
.world-beat--events .world-media img { object-position: 47% center; }

.world-beat--towns .world-media {
  border-radius: 42px 180px 42px 42px;
  clip-path: inset(0 round 42px 180px 42px 42px);
}
.world-beat--towns .world-media img { object-position: 54% center; }

.world-beat--churches .world-media {
  border-radius: 48% 48% 30px 30px / 16% 16% 30px 30px;
  clip-path: inset(0 round 48% 48% 30px 30px / 16% 16% 30px 30px);
  background: #1b1d22;
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--beat-accent) 46%, transparent), 0 42px 100px rgba(0, 0, 0, .36);
}
.world-beat--churches .world-media img { object-position: 54% 45%; transform: scale(1.04) translate3d(var(--image-shift), 0, 0); }

.world-grade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to var(--grade-heavy), rgba(5, 10, 12, .62), rgba(5, 10, 12, .14) 58%, transparent),
    linear-gradient(0deg, rgba(5, 10, 12, .4), transparent 44%);
  pointer-events: none;
}

.next-chip {
  position: absolute;
  right: 18px;
  bottom: 18px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px 6px 6px;
  border: 1px solid rgba(240, 200, 121, .42);
  border-radius: 999px;
  background: rgba(6, 11, 13, .68);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  pointer-events: none;
}

.next-chip img {
  width: 34px;
  aspect-ratio: 1;
  border-radius: 50%;
  object-fit: cover;
  filter: none;
}

.next-chip span {
  color: rgba(252, 249, 242, .85);
  font: 600 .56rem/1 "IBM Plex Mono", monospace;
  letter-spacing: .12em;
  text-transform: uppercase;
  white-space: nowrap;
}

.world-gallery {
  position: absolute;
  z-index: 5;
  inset: 0;
  pointer-events: none;
}

.world-gallery figure {
  position: absolute;
  margin: 0;
  padding: 7px;
  border: 1px solid rgba(214, 178, 116, .55);
  background: #f4ead6;
  box-shadow: 0 22px 48px rgba(3, 8, 10, .5);
}

.world-gallery img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.world-gallery__shot--1 {
  top: calc(var(--media-top) + 28px);
  width: clamp(148px, 15vw, 252px);
  transform: rotate(1.6deg) translate3d(calc(var(--beat-phase, 0) * var(--polaroid-drift, 0px)), 0, 0);
}

.world-gallery__shot--2 {
  bottom: calc(var(--media-bottom) + 26px);
  width: clamp(126px, 12.5vw, 210px);
  transform: rotate(-2deg) translate3d(calc(var(--beat-phase, 0) * var(--polaroid-drift, 0px)), 0, 0);
}

.world-beat[data-side='right'] .world-gallery__shot--1 { right: calc(var(--media-margin) + 22px); }
.world-beat[data-side='right'] .world-gallery__shot--2 { right: calc(var(--media-margin) + 170px); }
.world-beat[data-side='left'] .world-gallery__shot--1 { left: calc(var(--media-margin) + 22px); }
.world-beat[data-side='left'] .world-gallery__shot--2 { left: calc(var(--media-margin) + 170px); }

.world-copy {
  position: absolute;
  z-index: 6;
  top: var(--media-top);
  width: var(--text-width);
  padding: 24px 0;
  opacity: var(--beat-fade, 1);
  pointer-events: none;
  text-shadow: 0 2px 30px color-mix(in srgb, var(--beat-bg) 86%, transparent);
}

.world-beat[data-side='right'] .world-copy { left: var(--text-anchor); }
.world-beat[data-side='left'] .world-copy { right: var(--text-anchor); }

.world-copy > p:first-of-type { margin-top: 13px; color: var(--beat-accent); }

.world-copy h3 {
  max-width: 12ch;
  margin: 14px 0 0;
  font: 650 clamp(3rem, 5vw, 5.6rem)/.88 "IBM Plex Sans Condensed", sans-serif;
  letter-spacing: -.05em;
  text-wrap: balance;
}

.world-caption {
  max-width: 46ch;
  min-height: 3.2em;
  margin: 15px 0 0;
  padding-bottom: 24px;
  color: color-mix(in srgb, var(--beat-ink) 74%, transparent);
  font: 500 .67rem/1.6 "IBM Plex Mono", monospace;
}

.world-body {
  max-width: min(46ch, 100%);
  margin: 0;
  color: color-mix(in srgb, var(--beat-ink) 78%, transparent);
  font-size: clamp(.84rem, 1.05vw, 1rem);
  line-height: 1.65;
}

.world-proof { margin: 18px 0 0 !important; padding-top: 16px; border-top: 1px solid color-mix(in srgb, var(--beat-ink) 18%, transparent); color: var(--beat-accent) !important; font: 500 .67rem/1.55 "IBM Plex Mono", monospace !important; }

.scene-marker {
  position: absolute;
  z-index: 8;
  color: var(--beat-ink);
  transition: opacity .22s ease;
}

.world-beat[data-side='right'] .scene-marker { right: calc(var(--media-margin) + 24px); }
.world-beat[data-side='left'] .scene-marker { left: calc(var(--media-margin) + 24px); }

.scene-marker--high { top: clamp(122px, 30%, 320px); }
.scene-marker--middle { top: clamp(180px, 47%, 480px); }
.scene-marker--low { top: clamp(238px, 64%, 640px); }

.scene-marker::after {
  content: "";
  position: absolute;
  z-index: -1;
  top: 50%;
  width: 7px;
  height: 7px;
  margin-top: -3.5px;
  border-radius: 50%;
  background: var(--beat-accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--beat-accent) 24%, transparent);
}

.world-beat[data-side='right'] .scene-marker::after { right: calc(100% + 16px); }
.world-beat[data-side='left'] .scene-marker::after { left: calc(100% + 16px); }
.scene-marker--high::after { top: calc(50% + 30px); }
.scene-marker--low::after { top: calc(50% - 30px); }

.scene-marker.is-dormant {
  opacity: 0;
  pointer-events: none;
}

.scene-marker button {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 12px 5px 5px;
  border: 1px solid color-mix(in srgb, var(--beat-ink) 38%, transparent);
  border-radius: 999px;
  color: inherit;
  background: color-mix(in srgb, var(--beat-bg) 74%, transparent);
  backdrop-filter: blur(12px);
  cursor: pointer;
}

.scene-marker button i {
  width: 30px;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--beat-accent);
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--beat-accent) 40%, transparent);
  transition: transform .35s cubic-bezier(.22, 1, .36, 1), box-shadow .35s ease;
}

.scene-marker button i::after { content: "+"; color: var(--beat-bg); font: 700 15px/1 "IBM Plex Mono", monospace; }
.scene-marker button[aria-expanded="true"] i::after { content: "−"; }
.scene-marker button:hover i,
.scene-marker button:focus-visible i { transform: scale(1.12); box-shadow: 0 0 0 7px color-mix(in srgb, var(--beat-accent) 28%, transparent); }
.scene-marker button span { font-size: .7rem; font-weight: 750; }

.scene-marker > p {
  position: absolute;
  top: calc(100% + 8px);
  width: min(290px, 26vw);
  margin: 0;
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--beat-ink) 18%, transparent);
  border-radius: 14px;
  color: color-mix(in srgb, var(--beat-ink) 78%, transparent);
  background: color-mix(in srgb, var(--beat-bg) 90%, transparent);
  font-size: .73rem;
  line-height: 1.5;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-7px);
  transition: opacity .22s ease, transform .35s cubic-bezier(.22, 1, .36, 1);
}

.world-beat[data-side='right'] .scene-marker > p { right: 0; }
.world-beat[data-side='left'] .scene-marker > p { left: 0; }

.scene-marker > p.is-open { opacity: 1; transform: none; }

.world-beat--live { background: #0e2224; }

.live-landscape,
.live-landscape::after,
.live-landscape img,
.live-landscape i { position: absolute; inset: 0; }

.live-landscape { opacity: var(--beat-fade, 1); }

.live-landscape img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 38%;
  filter: saturate(.72) brightness(.54);
  transform: scale(1.08);
}

.live-landscape::after {
  content: "";
  background: linear-gradient(90deg, rgba(7, 25, 27, .96), rgba(7, 25, 27, .56) 48%, rgba(7, 25, 27, .9));
}

.live-landscape i {
  background: radial-gradient(circle at 72% 32%, rgba(211, 168, 97, .18), transparent 38%);
}

.living-panel {
  position: absolute;
  z-index: 6;
  left: 50%;
  top: 52%;
  width: min(1120px, calc(100% - 11vw));
  display: grid;
  grid-template-columns: 1.1fr .62fr .62fr;
  gap: 28px 48px;
  padding: 34px 0;
  border-top: 1px solid rgba(252, 249, 242, .24);
  border-bottom: 1px solid rgba(252, 249, 242, .24);
  transform: translate(-50%, -50%);
  opacity: var(--beat-fade, 1);
}

.living-intro { grid-column: 1 / -1; }
.living-intro h3 { margin: 12px 0 10px; font: 650 clamp(3rem, 6vw, 6.4rem)/.84 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.05em; }
.living-intro > p { max-width: 520px; margin: 0; color: rgba(252, 249, 242, .62); font-size: .83rem; line-height: 1.6; }

.living-primary { position: relative; min-height: 130px; padding-top: 20px; }
.living-primary p { margin: 0 0 12px; color: rgba(252, 249, 242, .48); font: 600 .58rem/1 "IBM Plex Mono", monospace; letter-spacing: .12em; text-transform: uppercase; }
.living-primary strong { display: block; color: #fcf9f2; font: 650 clamp(3.4rem, 7vw, 7rem)/.75 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.04em; }
.living-primary span { display: block; margin-top: 14px; color: rgba(252, 249, 242, .52); font: 500 .57rem/1.35 "IBM Plex Mono", monospace; }
.status-orb { position: absolute; top: 22px; right: 22px; width: 10px; aspect-ratio: 1; border-radius: 50%; background: #7b8987; }
.status-orb--online { background: #86d5a9; box-shadow: 0 0 18px rgba(134, 213, 169, .72); }
.status-orb--offline { background: #d48671; }
.status-orb--loading { animation: status-pulse 1.4s ease-in-out infinite; }

.living-feed { display: grid; grid-template-columns: 1fr 1fr; grid-column: 1 / -1; margin: 0; border-top: 1px solid rgba(252, 249, 242, .13); }
.living-feed > div { min-width: 0; display: grid; grid-template-columns: minmax(120px, .8fr) 1.2fr; gap: 12px; padding: 14px 18px 14px 0; border-bottom: 1px solid rgba(252, 249, 242, .13); }
.living-feed > div:nth-child(odd) { margin-right: 28px; }
.living-feed dt { color: rgba(252, 249, 242, .72); font: 500 .57rem/1.45 "IBM Plex Mono", monospace; text-transform: uppercase; }
.living-feed dd { min-width: 0; margin: 0; color: #fcf9f2; font-size: .72rem; font-weight: 700; overflow-wrap: anywhere; }
.living-feed a { color: #f0c879; text-decoration: underline; text-decoration-color: rgba(240, 200, 121, .35); text-underline-offset: 4px; }
.living-feed__update { grid-column: 1 / -1; margin-right: 0 !important; }
.feed-disclosure { grid-column: 1 / -1; margin: -15px 0 0; color: rgba(252, 249, 242, .72); font: 500 .57rem/1.5 "IBM Plex Mono", monospace; }

.world-index {
  position: absolute;
  z-index: 12;
  right: 48px;
  top: 50%;
  display: grid;
  gap: 3px;
  padding: 14px 10px;
  border: 1px solid rgba(252, 249, 242, .09);
  border-radius: 999px;
  background: rgba(5, 10, 12, .55);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  transform: translateY(-50%);
  opacity: var(--rail-opacity, 1);
  transition: opacity .25s ease;
}

.world-index.is-faded { pointer-events: none; }

.world-index button {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 4px 8px;
  border: 0;
  color: rgba(252, 249, 242, .65);
  background: transparent;
  cursor: pointer;
}

.world-index button:hover,
.world-index button:focus-visible { color: rgba(252, 249, 242, .92); }

.world-index button::after {
  content: "";
  width: 19px;
  height: 2px;
  background: currentColor;
  transition: width .35s cubic-bezier(.22, 1, .36, 1), background-color .25s ease;
}

.world-index button.is-active { color: #ecc987; }
.world-index button.is-active::after { width: 36px; }
.world-index button.is-past { color: rgba(236, 201, 135, .78); }
.world-index span { font: 600 .52rem/1 "IBM Plex Mono", monospace; }
.world-index strong { max-width: 0; overflow: hidden; opacity: 0; font-size: .59rem; white-space: nowrap; transition: max-width .35s ease, opacity .2s ease; }
.world-index button:hover strong,
.world-index button:focus-visible strong,
.world-index button.is-active strong { max-width: 90px; opacity: 1; }

.world-direction {
  position: absolute;
  z-index: 11;
  left: clamp(22px, 4.8vw, 78px);
  bottom: 26px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  color: color-mix(in srgb, var(--world-ink) 52%, transparent);
  font: 550 .54rem/1 "IBM Plex Mono", monospace;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.world-direction i { width: 76px; height: 1px; overflow: hidden; background: color-mix(in srgb, var(--world-ink) 18%, transparent); }
.world-direction i::after { content: ""; display: block; width: var(--direction-width); height: 100%; background: var(--world-accent); }

.world-static { display: none; }
.world-static__feed { display: grid; gap: 0; margin: 22px 0 0; }
.world-static__feed > div { display: grid; grid-template-columns: minmax(110px, .7fr) 1fr; gap: 14px; padding: 11px 0; border-top: 1px solid rgba(252, 249, 242, .16); }
.world-static__feed dt { color: rgba(252, 249, 242, .72); font: 650 .58rem/1.4 "IBM Plex Mono", monospace; text-transform: uppercase; }
.world-static__feed dd { margin: 0; color: #fcf9f2; font-size: .72rem; line-height: 1.45; }
.world-static__feed a { color: #e3b866; }

@keyframes status-pulse { 50% { opacity: .35; transform: scale(.72); } }

@media (max-width: 880px) {
  .world-heading { width: 62vw; }
  .world-beat {
    --text-anchor: clamp(20px, 6vw, 48px);
    --text-width: min(400px, 50vw);
    --media-gap: clamp(20px, 3vw, 40px);
    --media-margin: clamp(18px, 4vw, 44px);
  }
  .world-copy h3 { font-size: clamp(2.4rem, 7vw, 4rem); }
  .world-gallery { display: none; }
  .scene-marker > p { width: min(260px, 40vw); }
  .world-index { right: 18px; padding: 10px 6px; }
  .living-panel { width: calc(100% - 14vw); gap: 20px; }
  .living-primary { min-height: 105px; }
  .living-primary strong { font-size: clamp(2.8rem, 9vw, 5rem); }
  .living-feed > div { grid-template-columns: 100px 1fr; }
}

@media (max-height: 760px) {
  .world-copy h3 { font-size: clamp(2.5rem, 5vh + 1rem, 4.4rem); }
  .world-caption { min-height: 0; padding-bottom: 16px; }
}

@media (max-width: 560px), (max-height: 560px) {
  .world-story { min-height: auto; color: #fcf9f2; background: #0e2224; }
  .world-sticky { display: none; }
  .world-static { display: grid; gap: 0; padding: 86px 16px 72px; }
  .world-static header { margin: 0 0 34px; }
  .world-static header p { color: #c69b52; }
  .world-static header h2 { max-width: 520px; margin: 12px 0 0; font: 650 clamp(2.7rem, 13vw, 5rem)/.86 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.05em; }
  .world-static article { position: relative; display: grid; min-width: 0; padding: 0 0 54px; }
  .world-static article img { width: 100%; height: auto; min-height: 230px; max-height: 56svh; object-fit: cover; border-radius: 20px; }
  .world-static article > div { position: relative; z-index: 1; width: calc(100% - 18px); margin: -36px 0 0 18px; padding: 22px 0 0 20px; border-left: 1px solid rgba(198, 155, 82, .58); background: linear-gradient(90deg, #0e2224 0 72%, transparent); }
  .world-static article span { color: #c69b52; font-size: .57rem; }
  .world-static article h3 { margin: 10px 0; font: 650 clamp(2.1rem, 10vw, 3.6rem)/.88 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.04em; }
  .world-static article p { max-width: 460px; margin: 0; color: rgba(252, 249, 242, .68); font-size: .79rem; line-height: 1.6; }
  .world-static__live { min-height: 330px; align-content: end; padding: 32px !important; overflow: hidden; border-radius: 22px; background: linear-gradient(135deg, #173632, #08151a); }
  .world-static__live > div { width: 100% !important; margin: 0 !important; padding: 0 !important; border: 0 !important; background: none !important; }
  .world-static__live a { display: inline-flex; min-height: 44px; align-items: center; margin-top: 18px; color: #e3b866; font-size: .76rem; font-weight: 700; }
}

@media (prefers-reduced-motion: reduce) {
  .world-story { min-height: auto; color: #fcf9f2; background: #0e2224; }
  .world-sticky { display: none; }
  .world-static { width: min(1120px, 100%); display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px 24px; margin: 0 auto; padding: 100px 24px; }
  .world-static header { grid-column: 1 / -1; }
  .world-static header p { color: #c69b52; }
  .world-static header h2 { max-width: 700px; margin: 14px 0 18px; font: 650 clamp(3rem, 7vw, 6.5rem)/.86 "IBM Plex Sans Condensed", sans-serif; letter-spacing: -.05em; }
  .world-static article { min-width: 0; display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(230px, .8fr); gap: 30px 26px; align-items: center; }
  .world-static article:nth-of-type(even):not(.world-static__live) { grid-template-columns: minmax(230px, .8fr) minmax(0, 1.2fr); }
  .world-static article:nth-of-type(even):not(.world-static__live) img { grid-column: 2; grid-row: 1; }
  .world-static article:nth-of-type(even):not(.world-static__live) > div { grid-column: 1; grid-row: 1; }
  .world-static article img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 24px; }
  .world-static article > div { padding: 20px 4px; }
  .world-static article span { color: #c69b52; }
  .world-static article h3 { margin: 11px 0; font: 650 clamp(2rem, 4vw, 3.2rem)/.9 "IBM Plex Sans Condensed", sans-serif; }
  .world-static article p { margin: 0; color: rgba(252, 249, 242, .68); font-size: .8rem; line-height: 1.6; }
  .world-static__live { grid-column: 1 / -1; min-height: 320px; display: grid; align-items: end; padding: 32px; border-radius: 24px; background: linear-gradient(135deg, #173632, #08151a); }
  .world-static__live a { display: inline-flex; min-height: 44px; align-items: center; margin-top: 18px; color: #e3b866; font-weight: 700; }
}

@media (prefers-reduced-motion: reduce) and (max-width: 700px) {
  .world-static { grid-template-columns: 1fr; padding: 82px 16px; }
  .world-static header,
  .world-static__live { grid-column: auto; }
  .world-static article,
  .world-static article:nth-of-type(even):not(.world-static__live) { grid-template-columns: 1fr; }
  .world-static article:nth-of-type(even):not(.world-static__live) img,
  .world-static article:nth-of-type(even):not(.world-static__live) > div { grid-column: auto; grid-row: auto; }
}
</style>
