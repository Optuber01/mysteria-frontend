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
        <p>The world beyond your Pathway</p>
        <h2 id="world-title">Your choices change what the world gives back.</h2>
      </header>

      <div class="world-rail">
        <article
          v-for="(feature, index) in features"
          :key="feature.id"
          class="world-beat"
          :class="[`world-beat--${feature.id}`, { 'is-active': activeIndex === index }]"
          :data-side="index % 2 === 0 ? 'right' : 'left'"
          :style="beatStyle(index)"
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
              <i>→</i>
            </div>
          </figure>

          <div v-if="feature.gallery?.length" class="world-gallery" aria-hidden="true">
            <figure v-for="(shot, shotIndex) in feature.gallery" :key="shot.image" :class="`world-gallery__shot--${shotIndex + 1}`">
              <img :src="shot.image" :alt="shot.alt" loading="lazy" decoding="async">
            </figure>
          </div>

          <div class="world-copy">
            <span>Field note <b>{{ String(index + 1).padStart(2, '0') }}</b> · {{ feature.short }}</span>
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
          :style="beatStyle(features.length)"
          :aria-hidden="activeIndex !== features.length"
        >
          <div class="live-landscape" aria-hidden="true">
            <img :src="townsImage" alt="" width="1920" height="1009" loading="lazy" decoding="async">
            <i />
          </div>

          <div class="living-panel">
            <div class="living-intro">
              <span>Live from Mysterria</span>
              <h3>A world shaped by players.</h3>
              <p>See the server as it is now — players, towns, events, and discoveries from first-party data.</p>
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

      <p class="world-direction" :class="{ 'is-faded': progress >= 0.95 }" aria-hidden="true">
        <span>Scroll through the field notes</span><i />
      </p>
    </div>

    <div class="world-static" aria-label="World systems overview">
      <header>
        <p>The world beyond your Pathway</p>
        <h2>Your choices change what the world gives back.</h2>
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
};

const props = defineProps<{
  status: ServerStatus;
  latestUpdate: { title: string; slug: string } | null;
}>();

const storedLanguage = localStorage.getItem('mysterria-language');

const features: WorldFeature[] = [
  {
    id: 'dungeons', short: 'Rifts', kicker: 'Prepare the run', title: 'Plan the run. Cross the Rift.',
    copy: 'Use /subspace to find a dungeon, check its power and cooldown, then weaken its Rift with Energy Shards before your party enters.',
    proof: 'Each dungeon is an instanced run with its own rooms, classes, and boss.',
    marker: 'Dungeon Rift', note: 'A Rift gate marks the threshold. Parties weaken it with Energy Shards before committing to the instance beyond.', pin: 'middle',
    image: dungeonGate, video: dungeonEntranceVideo, alt: 'A black-and-white tree Rift gate surrounding a glowing dungeon portal.', width: 1600, height: 868,
    gallery: [
      { image: eyeRift, alt: 'A vast eye-shaped dungeon gate opening around a glowing Rift.' },
      { image: snowRingRift, alt: 'A circular stone dungeon gate standing in a snowy biome.' },
    ],
  },
  {
    id: 'creatures', short: 'The wilds', kicker: 'Meet the wild', title: 'Your Pathway changes the encounter.',
    copy: 'Beyonder Creatures can yield XP, acting points, and ingredients. Wild Beyonders may trade with you — or fight you — depending on the relationship you build.',
    proof: 'Crimson Moon nights raise the stakes outside and turn every hunt into a decision.',
    marker: 'Beyonder encounter', note: 'A Beyonder creature met in the wild: every encounter yields XP, acting points and ingredients worth the risk.', pin: 'high',
    image: creatureChamber, alt: 'A custom floating creature surrounded by fragments inside a dark Minecraft chamber.', width: 1075, height: 503,
  },
  {
    id: 'events', short: 'Guardians', kicker: 'Answer the signal', title: 'Bring the right people.',
    copy: 'Guardians are open-world bosses that force your party to adapt. When physical damage stops working, the plan has to change.',
    proof: 'Win and earn a Guardian Reward Token for rare ingredients, recipes, and more.',
    marker: 'Open-world Guardian', note: 'A Guardian encountered in the open world. Cosmos Incursions are rarer kin that answer their own signal.', pin: 'middle',
    image: guardianDragon, alt: 'Players fighting a many-headed Guardian inside a radiant arena.', width: 1600, height: 868,
    gallery: [
      { image: guardianRadiantWide, alt: 'Players spread across a bright arena during a Guardian encounter.' },
      { image: guardianRadiantClose, alt: 'A party facing a towering radiant Guardian at close range.' },
    ],
  },
  {
    id: 'towns', short: 'Settlements', kicker: 'Leave your mark', title: 'Build somewhere worth defending.',
    copy: 'Claim land, build with others, or form a Secret Order. Your choices shape the towns, territory, and communities around you.',
    proof: 'Grow a town into a Domain — and eventually a Nation.',
    marker: 'Player settlement', note: 'These are real community landmarks: a waterfront town, an everyday street, and a vast eye suspended above another settlement.', pin: 'low',
    image: townsImage, alt: 'A player-built waterfront settlement glowing beneath a green aurora.', width: 1600, height: 841,
    gallery: [
      { image: cliffsideStreet, alt: 'A bright street lined with player-built homes and a glass workshop.' },
      { image: eyeCanopy, alt: 'A giant purple eye-shaped canopy floating above a forest settlement.' },
    ],
  },
  {
    id: 'churches', short: 'Churches', kicker: 'Gather around a belief', title: 'Make your Pathway visible.',
    copy: 'Create a player-run Church around a physical Church Core, with members, sites, prayer, and influence that carry into the world.',
    proof: 'Churches can support members, develop branches, and grant Pathway-based benefits.',
    marker: 'Consecrated site', note: 'The architecture is player-made; the Church system gives the site membership, prayer and pathway consequences.', pin: 'middle',
    image: cathedralExterior, alt: 'A monumental player-built cathedral rising into a stormy sky.', width: 1600, height: 841,
    gallery: [
      { image: fogCathedralNave, alt: 'Warm lantern light filling the nave of a player-built church.' },
      { image: sanctuaryCeiling, alt: 'A black-and-gold sanctuary ceiling above a dark ceremonial hall.' },
    ],
  },
];

const liveStage = {
  id: 'live',
  short: 'Live world',
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

function beatPhase(index: number) {
  const span = stages.length - 1;
  const scaled = Math.min(span, progress.value * span);
  const beatIndex = Math.floor(scaled);
  if (index === beatIndex) return scaled - beatIndex;
  if (index === beatIndex + 1) return scaled - beatIndex - 1;
  return 0;
}

function fadeRamp(value: number, start: number, end: number) {
  return Math.max(0, Math.min((value - start) / (end - start), 1));
}

function beatFade(index: number) {
  const phase = beatPhase(index);
  if (phase >= 0) return 1 - fadeRamp(phase, 0.45, 0.85);
  return fadeRamp(phase + 1, 0.45, 0.85);
}

function mediaDim(index: number) {
  const phase = beatPhase(index);
  if (phase <= 0) return 0;
  return fadeRamp(phase, 0.45, 0.8);
}

function mediaTravel(index: number) {
  const phase = beatPhase(index);
  if (phase >= 0) return -fadeRamp(phase, 0.45, 0.85);
  return 1 - fadeRamp(phase + 1, 0.45, 0.85);
}

function mediaAlpha(index: number) {
  const phase = beatPhase(index);
  if (phase >= 0) return 1 - fadeRamp(phase, 0.45, 0.85);
  return fadeRamp(phase + 1, 0.45, 0.85);
}

function beatStyle(index: number) {
  return {
    '--beat-phase': beatPhase(index).toFixed(4),
    '--beat-fade': beatFade(index).toFixed(4),
    '--media-dim': mediaDim(index).toFixed(4),
    '--media-travel': mediaTravel(index).toFixed(4),
    '--media-alpha': mediaAlpha(index).toFixed(4),
  };
}

const worldStyle = computed(() => {
  const span = stages.length - 1;
  return {
    '--world-progress': String(progress.value),
    '--stage-count': String(stages.length),
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
  min-height: 380svh;
  isolation: isolate;
  color: var(--ink);
  background: var(--journey-mid);
}

.world-sticky {
  position: sticky;
  top: 0;
  height: 100svh;
  min-height: 650px;
  overflow: hidden;
  overflow: clip;
  isolation: isolate;
  background: var(--journey-mid);
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
  height: 24%;
  background: linear-gradient(180deg, var(--journey-mid), rgba(244, 236, 223, 0));
}

.world-sticky::after {
  bottom: 0;
  height: 22%;
  background: linear-gradient(0deg, var(--journey-end), rgba(251, 245, 234, 0));
}

.world-heading {
  position: absolute;
  z-index: 10;
  top: clamp(74px, 9vh, 104px);
  left: var(--home-rail-inset, clamp(20px, 4vw, 56px));
  width: min(500px, 40vw);
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
  color: var(--primary);
  font: 800 .68rem/1 "Manrope", sans-serif;
  letter-spacing: .16em;
  text-transform: uppercase;
}

.world-copy > span b { color: var(--champagne); }

.world-heading h2 {
  max-width: 560px;
  margin: 12px 0 0;
  font: 700 clamp(2.15rem, 3.25vw, 3rem)/.98 var(--font-display);
  letter-spacing: -.025em;
  text-wrap: balance;
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
  --text-anchor: clamp(24px, 7vw, 112px);
  --text-width: min(380px, 30vw);
  --media-gap: clamp(28px, 3.4vw, 64px);
  --media-margin: clamp(24px, 4vw, 72px);
  --media-top: clamp(94px, 12vh, 132px);
  --media-bottom: clamp(76px, 9vh, 112px);
  --h-reserved: calc(var(--text-anchor) + var(--text-width) + var(--media-gap) + var(--media-margin));
  --media-max-h: calc((100vw - var(--h-reserved)) * .8);
  --polaroid-drift: -18px;
  --grade-heavy: left;
  position: relative;
  width: 100vw;
  height: 100%;
  flex: none;
  overflow: hidden;
  color: var(--ink);
}

.world-beat[data-side='left'] {
  --grade-heavy: right;
}

.world-media {
  position: absolute;
  z-index: 2;
  top: 50%;
  height: min(calc(100% - var(--media-top) - var(--media-bottom)), 720px, var(--media-max-h));
  aspect-ratio: 5 / 4;
  margin: 0;
  overflow: hidden;
  border-radius: 22px;
  box-shadow: 0 32px 80px rgba(34, 28, 20, .16);
  clip-path: inset(0 round 22px);
  transform: translate3d(0, -50%, 0);
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
  border: 1px solid var(--hairline);
  border-radius: inherit;
  pointer-events: none;
}

.world-media img,
.world-media video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: translate3d(calc(var(--media-travel, 0) * 16px), 0, 0) scale(1.055) translate3d(var(--image-shift), 0, 0);
  transition: transform .8s cubic-bezier(.22, 1, .36, 1);
  transform-origin: center;
  filter: saturate(1.02) brightness(1.04) blur(calc(var(--media-dim, 0) * 2px));
  opacity: calc(var(--media-alpha, 1) * (1 - var(--media-dim, 0) * .65));
}

.world-beat--dungeons .world-media img,
.world-beat--dungeons .world-media video { object-position: 52% 52%; }

.world-beat--events .world-media img { object-position: 47% center; }

.world-beat--towns .world-media img { object-position: 54% center; }

.world-beat--churches .world-media img { object-position: 54% 45%; }

.world-grade {
  position: absolute;
  inset: 0;
  background: linear-gradient(to var(--grade-heavy), rgba(251, 247, 239, .9), rgba(251, 247, 239, 0) 62%);
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
  border: 1px solid var(--hairline);
  border-radius: 999px;
  background: var(--surface-glass);
  box-shadow: 0 10px 30px rgba(34, 28, 20, .08);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  pointer-events: none;
}

.next-chip img {
  width: 34px;
  aspect-ratio: 1;
  border-radius: 50%;
  object-fit: cover;
  filter: none;
  box-shadow: 0 0 0 1px var(--hairline);
}

.next-chip span {
  color: var(--ink-muted);
  font: 800 .56rem/1 "Manrope", sans-serif;
  letter-spacing: .12em;
  text-transform: uppercase;
  white-space: nowrap;
}

.next-chip i {
  color: var(--primary);
  font: 800 .78rem/1 "Manrope", sans-serif;
}

.world-gallery {
  position: absolute;
  z-index: 5;
  inset: 0;
  overflow: hidden;
  overflow: clip;
  pointer-events: none;
}

.world-gallery figure {
  position: absolute;
  margin: 0;
  padding: 7px;
  border: 1px solid var(--hairline);
  background: #f4ead6;
  box-shadow: 0 22px 48px rgba(34, 28, 20, .24);
}

.world-gallery img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.world-gallery__shot--1 {
  bottom: calc(var(--media-bottom) + clamp(150px, 36vh, 360px));
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
  top: clamp(190px, 25vh, 260px);
  width: var(--text-width);
  padding: 24px 0;
  opacity: var(--beat-fade, 1);
  pointer-events: none;
}

.world-beat[data-side='right'] .world-copy { left: var(--text-anchor); }
.world-beat[data-side='left'] .world-copy { right: max(var(--text-anchor), 168px); }

.world-copy > p:first-of-type { margin-top: 13px; }

.world-copy h3 {
  max-width: 12ch;
  margin: 14px 0 0;
  font: 700 clamp(2rem, 3vw, 3rem)/.98 var(--font-display);
  letter-spacing: -.025em;
  text-wrap: balance;
}

.world-caption {
  max-width: 46ch;
  min-height: 3.2em;
  margin: 15px 0 0;
  padding-bottom: 24px;
  color: var(--ink-muted);
  font: 600 .72rem/1.6 "Manrope", sans-serif;
}

.world-body {
  max-width: min(46ch, 100%);
  margin: 0;
  color: var(--ink-muted);
  font-size: clamp(.84rem, 1.05vw, 1rem);
  font-weight: 500;
  line-height: 1.65;
  overflow-wrap: anywhere;
}

.world-proof { margin: 18px 0 0; padding-top: 16px; border-top: 1px solid var(--hairline); color: var(--ink-muted); font: 600 .72rem/1.55 "Manrope", sans-serif; }

.scene-marker {
  position: absolute;
  z-index: 8;
  color: var(--ink);
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
  background: var(--champagne);
  box-shadow: 0 0 0 4px rgba(217, 180, 90, .26);
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
  border: 1px solid var(--hairline);
  border-radius: 999px;
  color: inherit;
  background: var(--surface-glass);
  box-shadow: 0 10px 30px rgba(34, 28, 20, .08);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  cursor: pointer;
}

.scene-marker button i {
  width: 30px;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--primary-tint);
  transition: transform .35s cubic-bezier(.22, 1, .36, 1), box-shadow .35s ease;
}

.scene-marker button i::after { content: "+"; color: var(--primary); font: 800 15px/1 "Manrope", sans-serif; }
.scene-marker button[aria-expanded="true"] i::after { content: "−"; }
.scene-marker button:hover i,
.scene-marker button:focus-visible i { transform: scale(1.12); box-shadow: 0 0 0 7px rgba(116, 88, 232, .22); }
.scene-marker button:focus-visible { outline: 3px solid var(--primary); outline-offset: 3px; }
.scene-marker button span { font-size: .7rem; font-weight: 700; }

.scene-marker > p {
  position: absolute;
  top: calc(100% + 8px);
  width: min(290px, 26vw);
  margin: 0;
  padding: 14px 16px;
  border: 1px solid var(--hairline);
  border-radius: 20px;
  color: var(--ink-muted);
  background: var(--surface);
  box-shadow: 0 24px 60px rgba(34, 28, 20, .14);
  font-size: .73rem;
  font-weight: 500;
  line-height: 1.55;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-7px);
  transition: opacity .22s ease, transform .35s cubic-bezier(.22, 1, .36, 1);
}

.world-beat[data-side='right'] .scene-marker > p { right: 0; }
.world-beat[data-side='left'] .scene-marker > p { left: 0; }

.scene-marker > p.is-open { opacity: 1; transform: none; }

.world-beat--live { background: transparent; }

.live-landscape,
.live-landscape img { position: absolute; inset: 0; }

.live-landscape { opacity: var(--beat-fade, 1); }

.live-landscape img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 38%;
  filter: saturate(1.02) brightness(1.04);
  transform: scale(1.08);
}

.live-landscape i {
  position: absolute;
  top: clamp(120px, 26%, 300px);
  right: clamp(48px, 12%, 220px);
  width: min(420px, 34vw);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(217, 180, 90, .2), transparent 62%);
}

.living-panel {
  position: absolute;
  z-index: 6;
  left: var(--home-rail-inset, clamp(20px, 4vw, 56px));
  top: 90px;
  bottom: clamp(48px, 8vh, 110px);
  width: min(var(--home-content-max, 1480px), calc(100% - var(--home-rail-inset, clamp(20px, 4vw, 56px)) - var(--home-rail-inset, clamp(20px, 4vw, 56px))));
  display: grid;
  grid-template-columns: 1.1fr .62fr .62fr;
  align-content: center;
  gap: 28px 48px;
  padding: 38px 44px;
  border: 1px solid var(--hairline);
  border-radius: 20px;
  background: var(--surface);
  box-shadow: 0 32px 80px rgba(34, 28, 20, .14);
  transform: none;
  opacity: var(--beat-fade, 1);
}

.living-intro { grid-column: 1 / -1; }
.living-intro h3 { margin: 12px 0 10px; font: 800 clamp(2rem, 3.6vw, 3.1rem)/1.02 "Manrope", sans-serif; letter-spacing: -.025em; }
.living-intro > p { max-width: 520px; margin: 0; color: var(--ink-muted); font-size: .83rem; font-weight: 500; line-height: 1.6; }

.living-primary { position: relative; min-height: 130px; padding-top: 20px; }
.living-primary p { margin: 0 0 12px; color: var(--primary); font: 800 .58rem/1 "Manrope", sans-serif; letter-spacing: .12em; text-transform: uppercase; }
.living-primary strong { display: block; color: var(--ink); font: 800 clamp(2.6rem, 5.5vw, 4.25rem)/.9 "Manrope", sans-serif; letter-spacing: -.025em; }
.living-primary span { display: block; margin-top: 14px; color: var(--ink-muted); font: 500 .66rem/1.35 "Manrope", sans-serif; }
.status-orb { position: absolute; top: 22px; right: 22px; width: 10px; aspect-ratio: 1; border-radius: 50%; background: var(--ink-muted); }
.status-orb--online { background: var(--live); box-shadow: 0 0 18px rgba(52, 199, 123, .55); }
.status-orb--offline { background: var(--sunset-deep); }
.status-orb--loading { animation: status-pulse 1.4s ease-in-out infinite; }

.living-feed { display: grid; grid-template-columns: 1fr 1fr; grid-column: 1 / -1; margin: 0; border-top: 1px solid var(--hairline); }
.living-feed > div { min-width: 0; display: grid; grid-template-columns: minmax(120px, .8fr) 1.2fr; gap: 12px; padding: 14px 18px 14px 0; border-bottom: 1px solid var(--hairline); }
.living-feed > div:nth-child(odd) { margin-right: 28px; }
.living-feed dt { color: var(--primary); font: 800 .58rem/1.45 "Manrope", sans-serif; letter-spacing: .1em; text-transform: uppercase; }
.living-feed dd { min-width: 0; margin: 0; color: var(--ink); font-size: .72rem; font-weight: 700; overflow-wrap: anywhere; }
.living-feed a { color: var(--primary); text-decoration: underline; text-decoration-color: rgba(116, 88, 232, .35); text-underline-offset: 4px; }
.living-feed__update { grid-column: 1 / -1; margin-right: 0 !important; }
.feed-disclosure { grid-column: 1 / -1; margin: -15px 0 0; color: var(--ink-muted); font: 500 .66rem/1.5 "Manrope", sans-serif; }

.world-index {
  position: absolute;
  z-index: 12;
  right: var(--home-rail-inset, clamp(20px, 4vw, 56px));
  top: 50%;
  display: grid;
  gap: 3px;
  padding: 14px 10px;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  background: var(--surface-glass);
  box-shadow: 0 10px 30px rgba(34, 28, 20, .1);
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
  color: var(--ink-muted);
  background: transparent;
  cursor: pointer;
}

.world-index button:hover,
.world-index button:focus-visible { color: var(--ink); }
.world-index button:focus-visible { outline: 3px solid var(--primary); outline-offset: 3px; }

.world-index button::after {
  content: "";
  width: 19px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
  transition: width .35s cubic-bezier(.22, 1, .36, 1), background-color .25s ease;
}

.world-index button.is-active { color: var(--primary); }
.world-index button.is-active::after { width: 36px; }
.world-index button.is-past { color: color-mix(in srgb, var(--ink-muted) 62%, transparent); }
.world-index span { font: 700 .54rem/1 "Manrope", sans-serif; letter-spacing: .08em; }
.world-index strong { max-width: 0; overflow: hidden; opacity: 0; font-size: .62rem; font-weight: 700; white-space: nowrap; transition: max-width .35s ease, opacity .2s ease; }
.world-index button:hover strong,
.world-index button:focus-visible strong,
.world-index button.is-active strong { max-width: 90px; opacity: 1; }

.world-direction {
  position: absolute;
  z-index: 11;
  left: var(--home-rail-inset, clamp(20px, 4vw, 56px));
  bottom: 26px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  color: var(--ink-muted);
  font: 800 .58rem/1 "Manrope", sans-serif;
  letter-spacing: .14em;
  text-transform: uppercase;
  opacity: 1;
  transition: opacity .25s ease;
}
.world-direction.is-faded { opacity: 0; }
.world-direction i { width: 76px; height: 1px; overflow: hidden; background: var(--hairline); }
.world-direction i::after { content: ""; display: block; width: var(--direction-width); height: 100%; background: var(--primary); }

.world-static { display: none; }
.world-static__feed { display: grid; gap: 0; margin: 22px 0 0; }
.world-static__feed > div { display: grid; grid-template-columns: minmax(110px, .7fr) 1fr; gap: 14px; padding: 11px 0; border-top: 1px solid var(--hairline); }
.world-static__feed dt { color: var(--primary); font: 800 .58rem/1.4 "Manrope", sans-serif; letter-spacing: .1em; text-transform: uppercase; }
.world-static__feed dd { margin: 0; color: var(--ink); font-size: .72rem; font-weight: 500; line-height: 1.45; }
.world-static__feed a { color: var(--primary); font-weight: 700; }

@keyframes status-pulse { 50% { opacity: .35; transform: scale(.72); } }

@media (max-width: 880px) {
  .world-heading { width: 62vw; }
  .world-beat {
    --text-anchor: clamp(20px, 6vw, 48px);
    --text-width: min(360px, 46vw);
    --media-gap: clamp(20px, 3vw, 40px);
    --media-margin: clamp(18px, 4vw, 44px);
  }
  .world-beat[data-side='left'] .world-copy { right: max(var(--text-anchor), 128px); }
  .world-copy h3 { font-size: clamp(1.6rem, 5.5vw, 2.1rem); }
  .world-gallery { display: none; }
  .scene-marker > p { width: min(260px, 40vw); }
  .world-index { right: var(--home-rail-inset, clamp(20px, 4vw, 56px)); padding: 10px 6px; }
  .living-panel { width: calc(100% - var(--home-rail-inset, clamp(20px, 4vw, 56px)) - var(--home-rail-inset, clamp(20px, 4vw, 56px))); gap: 20px; padding: 28px 26px; }
  .living-primary { min-height: 105px; }
  .living-primary strong { font-size: clamp(2.1rem, 7.5vw, 3rem); }
  .living-feed > div { grid-template-columns: 100px 1fr; }
}

@media (max-height: 760px) {
  .world-copy h3 { font-size: clamp(1.6rem, 4.5vh + .8rem, 2.4rem); }
  .world-caption { min-height: 0; padding-bottom: 16px; }
}

@media (max-width: 560px), (max-height: 560px) {
  .world-story { min-height: auto; }
  .world-sticky { display: none; }
  .world-static { display: grid; gap: 0; padding: 86px var(--home-content-gutter, 20px) 72px; }
  .world-static header { margin: 0 0 34px; }
  .world-static header h2 { max-width: 520px; margin: 12px 0 0; font: 800 clamp(2rem, 8vw, 2.9rem)/1.02 "Manrope", sans-serif; letter-spacing: -.025em; }
  .world-static article { position: relative; display: grid; min-width: 0; padding: 0 0 54px; }
  .world-static article img { width: 100%; height: auto; min-height: 230px; max-height: 56svh; object-fit: cover; border-radius: 22px; box-shadow: 0 0 0 1px var(--hairline), 0 24px 60px rgba(34, 28, 20, .14); }
  .world-static article > div { position: relative; z-index: 1; width: calc(100% - 18px); margin: -36px 0 0 18px; padding: 22px 0 0 20px; border-left: 1px solid var(--hairline); background: linear-gradient(90deg, rgba(255, 255, 255, .96) 0 72%, transparent); }
  .world-static article span { font-size: .6rem; }
  .world-static article h3 { margin: 10px 0; font: 800 clamp(1.6rem, 6.5vw, 2.4rem)/1.02 "Manrope", sans-serif; letter-spacing: -.025em; }
  .world-static article p { max-width: 460px; margin: 0; color: var(--ink-muted); font-size: .79rem; font-weight: 500; line-height: 1.6; }
  .world-static__live { min-height: 330px; align-content: end; padding: 32px !important; overflow: hidden; border: 1px solid var(--hairline); border-radius: 20px; background: var(--surface); box-shadow: 0 24px 60px rgba(34, 28, 20, .14); }
  .world-static__live > div { width: 100% !important; margin: 0 !important; padding: 0 !important; border: 0 !important; background: none !important; }
  .world-static__live a { display: inline-flex; min-height: 44px; align-items: center; margin-top: 18px; color: var(--primary); font-size: .76rem; font-weight: 700; }
}

@media (prefers-reduced-motion: reduce) {
  .world-story { min-height: auto; }
  .world-sticky { display: none; }
  .world-static { width: min(var(--home-content-max, 1480px), 100%); box-sizing: border-box; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px 24px; margin: 0 auto; padding: 100px var(--home-content-gutter, 20px); }
  .world-static header { grid-column: 1 / -1; }
  .world-static header h2 { max-width: 700px; margin: 14px 0 18px; font: 800 clamp(2rem, 4.5vw, 3.4rem)/1 "Manrope", sans-serif; letter-spacing: -.025em; }
  .world-static article { min-width: 0; display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(230px, .8fr); gap: 30px 26px; align-items: center; }
  .world-static article:nth-of-type(even):not(.world-static__live) { grid-template-columns: minmax(230px, .8fr) minmax(0, 1.2fr); }
  .world-static article:nth-of-type(even):not(.world-static__live) img { grid-column: 2; grid-row: 1; }
  .world-static article:nth-of-type(even):not(.world-static__live) > div { grid-column: 1; grid-row: 1; }
  .world-static article img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 22px; box-shadow: 0 0 0 1px var(--hairline), 0 24px 60px rgba(34, 28, 20, .14); }
  .world-static article > div { padding: 20px 4px; }
  .world-static article h3 { margin: 11px 0; font: 800 clamp(1.5rem, 2.6vw, 2.1rem)/1.05 "Manrope", sans-serif; letter-spacing: -.02em; }
  .world-static article p { margin: 0; color: var(--ink-muted); font-size: .8rem; font-weight: 500; line-height: 1.6; }
  .world-static__live { grid-column: 1 / -1; min-height: 320px; display: grid; align-items: end; padding: 32px; border: 1px solid var(--hairline); border-radius: 20px; background: var(--surface); box-shadow: 0 24px 60px rgba(34, 28, 20, .14); }
  .world-static__live a { display: inline-flex; min-height: 44px; align-items: center; margin-top: 18px; color: var(--primary); font-weight: 700; }
}

@media (prefers-reduced-motion: reduce) and (max-width: 700px) {
  .world-static { grid-template-columns: 1fr; padding: 82px var(--home-content-gutter, 20px); }
  .world-static header,
  .world-static__live { grid-column: auto; }
  .world-static article,
  .world-static article:nth-of-type(even):not(.world-static__live) { grid-template-columns: 1fr; }
  .world-static article:nth-of-type(even):not(.world-static__live) img,
  .world-static article:nth-of-type(even):not(.world-static__live) > div { grid-column: auto; grid-row: auto; }
}
</style>
